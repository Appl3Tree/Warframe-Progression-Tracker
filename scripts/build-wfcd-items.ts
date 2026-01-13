// ===== FILE: scripts/build-wfcd-items.ts =====
import fs from "node:fs";
import path from "node:path";

type AnyObj = Record<string, any>;

const REPO_ROOT = process.cwd();
const WFCD_ITEMS_RAW_DIR = path.join(REPO_ROOT, "external", "warframe-items", "raw");
const OUT_DIR = path.join(REPO_ROOT, "src", "data", "_generated");

const OUT_ITEMS = path.join(OUT_DIR, "wfcd-items.byCatalogId.auto.json");

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

/**
 * Canonical CatalogId format:
 * - items:<uniqueName>
 * where uniqueName is WFCD's uniqueName (e.g. "/Lotus/Weapons/Tenno/Grimoire/TnGrimoire")
 */
function toCatalogId(uniqueName: string): string {
    return `items:${uniqueName}`;
}

function main(): void {
    ensureDir(OUT_DIR);

    const files = listJsonFiles(WFCD_ITEMS_RAW_DIR);
    if (files.length === 0) {
        throw new Error(`No JSON files found in: ${WFCD_ITEMS_RAW_DIR}`);
    }

    const out: Record<string, any> = {};
    let recordsSeen = 0;
    let itemsWritten = 0;
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

            // Fail-closed: require uniqueName and name.
            if (!uniqueName || !name) continue;

            const catalogId = toCatalogId(uniqueName);

            // Minimal, stable fields for catalog + UI mapping.
            // Do NOT attempt to normalize categories here; do that in itemsIndex.ts.
            out[catalogId] = {
                name,
                category: safeString(rec.category),
                productCategory: safeString(rec.productCategory),
                type: safeString(rec.type),
                tags: Array.isArray(rec.tags) ? rec.tags.filter((x) => typeof x === "string") : [],
                masteryReq: typeof rec.masteryReq === "number" ? Math.max(0, Math.floor(rec.masteryReq)) : null,
                masterable: typeof rec.masterable === "boolean" ? rec.masterable : null,
                tradable: typeof rec.tradable === "boolean" ? rec.tradable : null,
                wfcdFile: base,
                source: "wfcd"
            };
            itemsWritten += 1;
        }
    }

    fs.writeFileSync(OUT_ITEMS, JSON.stringify(out, null, 4), "utf8");

    // eslint-disable-next-line no-console
    console.log(
        JSON.stringify(
            {
                ok: true,
                wrote: {
                    outItems: OUT_ITEMS
                },
                stats: {
                    wfcdRawDir: WFCD_ITEMS_RAW_DIR,
                    filesRead: files.length,
                    recordsSeen,
                    itemsWritten,
                    skippedNonArrayFiles
                }
            },
            null,
            2
        )
    );
}

main();

