// ===== FILE: scripts/build-wfcd-requirements.ts =====
import fs from "node:fs";
import path from "node:path";

type AnyObj = Record<string, any>;

const REPO_ROOT = process.cwd();
const WFCD_ITEMS_RAW_DIR = path.join(REPO_ROOT, "external", "warframe-items", "raw");
const OUT_DIR = path.join(REPO_ROOT, "src", "data", "_generated");

const OUT_REQS = path.join(OUT_DIR, "wfcd-requirements.byCatalogId.auto.json");

function isObject(v: unknown): v is AnyObj {
    return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function readJson(filePath: string): unknown {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
}

function listJsonFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir)
        .filter((f) => f.toLowerCase().endsWith(".json"))
        .map((f) => path.join(dir, f))
        .sort();
}

function ensureDir(dir: string): void {
    fs.mkdirSync(dir, { recursive: true });
}

function toCatalogId(uniqueName: string): string {
    return `items:${uniqueName}`;
}

function safeCount(v: unknown): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
}

/**
 * WFCD recipe shape: components: [{ uniqueName, itemCount, name, ... }]
 * We convert to:
 * { outputCatalogId, components: [{ catalogId, count }], note? }
 */
function main(): void {
    ensureDir(OUT_DIR);

    const files = listJsonFiles(WFCD_ITEMS_RAW_DIR);
    if (files.length === 0) {
        throw new Error(`No JSON files found in: ${WFCD_ITEMS_RAW_DIR}`);
    }

    const out: Record<string, any> = {};
    let recordsSeen = 0;
    let reqsWritten = 0;
    const skippedNonArrayFiles: string[] = [];

    for (const fp of files) {
        const base = path.basename(fp);
        const parsed = readJson(fp);

        if (!Array.isArray(parsed)) {
            skippedNonArrayFiles.push(base);
            continue;
        }

        for (const rec of parsed) {
            recordsSeen += 1;
            if (!isObject(rec)) continue;

            const uniqueName = safeString(rec.uniqueName);
            const name = safeString(rec.name);

            if (!uniqueName || !name) continue;

            const compsRaw = Array.isArray(rec.components) ? rec.components : [];
            if (compsRaw.length === 0) continue;

            const components: Array<{ catalogId: string; count: number }> = [];

            for (const c of compsRaw) {
                if (!isObject(c)) continue;
                const cUnique = safeString(c.uniqueName);
                const cnt = safeCount(c.itemCount ?? c.count ?? 0);
                if (!cUnique || cnt <= 0) continue;

                components.push({
                    catalogId: toCatalogId(cUnique),
                    count: cnt
                });
            }

            if (components.length === 0) continue;

            const outputCatalogId = toCatalogId(uniqueName);

            out[outputCatalogId] = {
                outputCatalogId,
                components,
                note: `WFCD recipe (${base})`
            };
            reqsWritten += 1;
        }
    }

    fs.writeFileSync(OUT_REQS, JSON.stringify(out, null, 4), "utf8");

    // eslint-disable-next-line no-console
    console.log(
        JSON.stringify(
            {
                ok: true,
                wrote: { outRequirements: OUT_REQS },
                stats: {
                    wfcdRawDir: WFCD_ITEMS_RAW_DIR,
                    filesRead: files.length,
                    recordsSeen,
                    requirementsWritten: reqsWritten,
                    skippedNonArrayFiles
                }
            },
            null,
            2
        )
    );
}

main();

