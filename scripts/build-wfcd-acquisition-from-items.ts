// ===== FILE: scripts/build-wfcd-acquisition-from-items.ts =====
//
// Generates acquisition mappings (byCatalogId) from RAW WFCD JSON data files.
//
// Input:
//   external/warframe-items/data/json/*.json
//
// Output:
//   src/data/_generated/wfcd-acquisition.byCatalogId.auto.json
//   src/data/_generated/wfcd-source-label-map.auto.json
//
// What it extracts:
// - record.drops[]                      -> acquisition for the record itself
// - record.components[].drops[]          -> acquisition for component items/resources
//
// Notes:
// - Stable SourceId per distinct WFCD drop "location" string.
// - We DO NOT infer prereq gating here (fail-closed). prereqIds remain empty and you can curate later.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type CatalogId = `items:${string}`;

type WFCDDrop = {
    location?: string;
    chance?: number;
    rarity?: string;
    type?: string;
};

type WFCDComponent = {
    uniqueName?: string;
    name?: string;
    itemCount?: number;
    drops?: WFCDDrop[];
};

type WFCDRecord = {
    uniqueName?: string;
    name?: string;
    category?: string;

    drops?: WFCDDrop[];
    components?: WFCDComponent[];
};

type AcquisitionDef = {
    sources: string[];
};

function sha1Short(input: string): string {
    return crypto.createHash("sha1").update(input).digest("hex").slice(0, 12);
}

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

function normalizeLocationLabel(loc: string): string {
    // Normalize whitespace for UI consistency and stable hashing.
    return loc.replace(/\s+/g, " ").trim();
}

function toSourceIdFromLocation(locLabel: string): string {
    return `data:wfcd:${sha1Short(locLabel)}`;
}

function toCatalogIdFromUniqueName(uniqueName: string): CatalogId | null {
    const u = uniqueName.trim();
    if (!u.startsWith("/")) return null;
    return `items:${u}` as CatalogId;
}

function readJsonUnknown(filePath: string): unknown {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as unknown;
}

function writeJsonPretty(filePath: string, data: unknown): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function listJsonFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
        .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
        .map((e) => path.join(dir, e.name))
        .sort((a, b) => a.localeCompare(b));
}

function extractDropsToSources(
    drops: WFCDDrop[] | undefined,
    labelMap: Record<string, string>
): string[] {
    const out = new Set<string>();
    const list = Array.isArray(drops) ? drops : [];

    for (const d of list) {
        const loc = isNonEmptyString(d?.location) ? d.location : "";
        if (!loc) continue;

        const label = normalizeLocationLabel(loc);
        const sid = toSourceIdFromLocation(label);

        out.add(sid);
        if (!labelMap[sid]) labelMap[sid] = label;
    }

    return Array.from(out).sort();
}

function ensureAcq(
    acqByCatalogId: Record<string, AcquisitionDef>,
    catalogId: CatalogId,
    sources: string[]
): void {
    if (sources.length === 0) return;

    const key = String(catalogId);
    if (!acqByCatalogId[key]) {
        acqByCatalogId[key] = { sources: [] };
    }

    const merged = new Set<string>(acqByCatalogId[key].sources ?? []);
    for (const s of sources) merged.add(s);

    acqByCatalogId[key].sources = Array.from(merged).sort();
}

function main(): void {
    const repoRoot = process.cwd();

    const wfcdJsonDir = path.join(repoRoot, "external", "warframe-items", "data", "json");

    const outAcqPath = path.join(
        repoRoot,
        "src",
        "data",
        "_generated",
        "wfcd-acquisition.byCatalogId.auto.json"
    );

    const outLabelMapPath = path.join(
        repoRoot,
        "src",
        "data",
        "_generated",
        "wfcd-source-label-map.auto.json"
    );

    const files = listJsonFiles(wfcdJsonDir);

    // Guardrail: this should be non-empty if the repo is in place.
    if (files.length === 0) {
        throw new Error(`No JSON files found at ${wfcdJsonDir}. Is WFCD checked out under external/warframe-items?`);
    }

    const acqByCatalogId: Record<string, AcquisitionDef> = {};
    const labelMap: Record<string, string> = {};

    let filesRead = 0;
    let recordsSeen = 0;

    let itemDropsAttached = 0;
    let componentDropsAttached = 0;
    let totalDropRows = 0;

    const skippedNonArrayFiles: string[] = [];
    const ignoredFiles: string[] = [];

    for (const filePath of files) {
        const base = path.basename(filePath);

        // WFCD includes non-item tables like i18n.json, etc.
        // Keep this permissive but skip obvious ones.
        if (base.toLowerCase() === "i18n.json") {
            ignoredFiles.push(base);
            continue;
        }

        const raw = readJsonUnknown(filePath);
        if (!Array.isArray(raw)) {
            skippedNonArrayFiles.push(base);
            continue;
        }

        filesRead += 1;

        for (const rec of raw as WFCDRecord[]) {
            recordsSeen += 1;

            // 1) The record itself
            if (isNonEmptyString(rec?.uniqueName)) {
                const cid = toCatalogIdFromUniqueName(rec.uniqueName);
                if (cid) {
                    const sources = extractDropsToSources(rec?.drops, labelMap);
                    if (sources.length > 0) {
                        totalDropRows += (rec.drops ?? []).length;
                        itemDropsAttached += 1;
                        ensureAcq(acqByCatalogId, cid, sources);
                    }
                }
            }

            // 2) Any components that have their own drops (resources commonly show up here)
            const comps = Array.isArray(rec?.components) ? rec.components : [];
            for (const c of comps) {
                if (!isNonEmptyString(c?.uniqueName)) continue;

                const compCid = toCatalogIdFromUniqueName(c.uniqueName);
                if (!compCid) continue;

                const sources = extractDropsToSources(c?.drops, labelMap);
                if (sources.length === 0) continue;

                totalDropRows += (c.drops ?? []).length;
                componentDropsAttached += 1;
                ensureAcq(acqByCatalogId, compCid, sources);
            }
        }
    }

    writeJsonPretty(outAcqPath, acqByCatalogId);
    writeJsonPretty(outLabelMapPath, labelMap);

    // eslint-disable-next-line no-console
    console.log(
        JSON.stringify(
            {
                ok: true,
                wrote: {
                    outAcqPath,
                    outLabelMapPath
                },
                stats: {
                    wfcdJsonDir,
                    filesRead,
                    recordsSeen,
                    catalogIdsWithAnySources: Object.keys(acqByCatalogId).length,
                    itemDropsAttached,
                    componentDropsAttached,
                    totalDropRows,
                    uniqueSources: Object.keys(labelMap).length,
                    skippedNonArrayFiles,
                    ignoredFiles
                }
            },
            null,
            2
        )
    );
}

main();

