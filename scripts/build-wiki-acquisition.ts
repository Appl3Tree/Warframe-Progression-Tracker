// scripts/build-wiki-acquisition.ts
//
// Build a canonical acquisition map from tmp/wiki-drops.ndjson.
//
// Inputs:
// - wiki drops NDJSON (default: tmp/wiki-drops.ndjson)
// - src/data/items.json (for name -> path -> CatalogId resolution)
// - src/data/_generated/source-label-map.auto.json (stable source id mapping)
//
// Outputs:
// - src/data/_generated/wiki-acquisition.byCatalogId.auto.json
// - src/data/_generated/wiki-acquisition.unresolved.json
// - src/data/_generated/source-label-map.auto.json (merged/extended deterministically)
//
// Fail-closed rules:
// - If an item name does not match exactly one items.json name -> it is unresolved.
// - If a source label is new -> it is added to the label map with deterministic slug id.
// - No guessing, no fuzzy matching.

import fs from "node:fs";
import path from "node:path";

type WikiDropRow = {
    section?: {
        file?: string;
        h3Text?: string;
    };
    columns?: string[];
    values?: string[];
    byColumn?: Record<string, string>;
};

type LabelMapFile = {
    byLabel?: Record<string, string>;
    defaults?: { fallbackSourceId?: string };
};

type ItemsJsonRecord = {
    name?: string;
    [k: string]: unknown;
};

function readText(filePath: string): string {
    return fs.readFileSync(filePath, "utf-8");
}

function writeJson(filePath: string, data: unknown): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function loadJsonLoose(text: string): any {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function normalizeName(s: string): string {
    return String(s ?? "").trim().toLowerCase();
}

function slugify(s: string): string {
    return String(s ?? "")
        .trim()
        .toLowerCase()
        .replace(/['"]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80);
}

function parseChancePercentFromHeader(header: string): number | null {
    const s = String(header ?? "");
    const m = /([0-9]+(?:\.[0-9]+)?)\s*%/.exec(s);
    if (!m) return null;
    const v = Number(m[1]);
    return Number.isFinite(v) ? v : null;
}

function getRepoRoot(): string {
    // Walk up until we find package.json.
    let cur = process.cwd();
    for (let i = 0; i < 10; i += 1) {
        const pj = path.join(cur, "package.json");
        if (fs.existsSync(pj)) return cur;
        const parent = path.dirname(cur);
        if (parent === cur) break;
        cur = parent;
    }
    return process.cwd();
}

function loadItemsNameIndex(itemsJsonPath: string): {
    byNormName: Record<string, string[]>;
    byPath: Record<string, ItemsJsonRecord>;
} {
    const rawText = readText(itemsJsonPath);
    const parsed = loadJsonLoose(rawText);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(`items.json is not an object map: ${itemsJsonPath}`);
    }

    const map = parsed as Record<string, ItemsJsonRecord>;
    const byNormName: Record<string, string[]> = {};

    for (const [p, rec] of Object.entries(map)) {
        const name = typeof rec?.name === "string" ? rec.name.trim() : "";
        if (!name) continue;

        const key = normalizeName(name);
        if (!byNormName[key]) byNormName[key] = [];
        byNormName[key].push(p);
    }

    // Deterministic ordering
    for (const k of Object.keys(byNormName)) {
        byNormName[k].sort((a, b) => a.localeCompare(b));
    }

    return { byNormName, byPath: map };
}

function loadLabelMap(labelMapPath: string): LabelMapFile {
    if (!fs.existsSync(labelMapPath)) {
        return { byLabel: {}, defaults: { fallbackSourceId: "data:unknown" } };
    }

    const parsed = loadJsonLoose(readText(labelMapPath));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { byLabel: {}, defaults: { fallbackSourceId: "data:unknown" } };
    }

    const v = parsed as LabelMapFile;
    return {
        byLabel: v.byLabel && typeof v.byLabel === "object" ? v.byLabel : {},
        defaults: v.defaults ?? { fallbackSourceId: "data:unknown" }
    };
}

function deriveSourceIdForLabel(label: string, labelMap: LabelMapFile): string {
    const clean = String(label ?? "").trim();
    if (!clean) return labelMap.defaults?.fallbackSourceId ?? "data:unknown";

    const mapped = labelMap.byLabel?.[clean];
    if (typeof mapped === "string" && mapped.trim()) return mapped.trim();

    return `data:${slugify(clean)}`;
}

/**
 * We treat the first column header as the "source label" for the section/table,
 * and the last non-empty value in the row as the "item name".
 *
 * This matches the extraction contract you described (H3 section -> table rows).
 */
function extractItemAndSource(r: WikiDropRow): {
    sourceLabel: string | null;
    itemName: string | null;
    dropChancePct: number | null;
} {
    const cols = Array.isArray(r.columns) ? r.columns.map((x) => String(x ?? "")) : [];
    const vals = Array.isArray(r.values) ? r.values.map((x) => String(x ?? "")) : [];

    const sourceLabel = cols.length >= 1 ? String(cols[0] ?? "").trim() : "";

    let itemName = "";
    for (let i = vals.length - 1; i >= 0; i -= 1) {
        const v = String(vals[i] ?? "").trim();
        if (v) {
            itemName = v;
            break;
        }
    }

    const dropChancePct = cols.length >= 2 ? parseChancePercentFromHeader(cols[1]) : null;

    return {
        sourceLabel: sourceLabel || null,
        itemName: itemName || null,
        dropChancePct
    };
}

function main(): void {
    const repoRoot = getRepoRoot();

    const inputPathArg = process.argv[2];
    const inputNdjson = inputPathArg
        ? path.resolve(process.cwd(), inputPathArg)
        : path.join(repoRoot, "tmp", "wiki-drops.ndjson");

    if (!fs.existsSync(inputNdjson)) {
        throw new Error(`Missing input file: ${inputNdjson}`);
    }

    const itemsJsonPath = path.join(repoRoot, "src", "data", "items.json");
    if (!fs.existsSync(itemsJsonPath)) {
        throw new Error(`Missing items dataset: ${itemsJsonPath}`);
    }

    const labelMapPath = path.join(repoRoot, "src", "data", "_generated", "source-label-map.auto.json");
    const outAcqPath = path.join(repoRoot, "src", "data", "_generated", "wiki-acquisition.byCatalogId.auto.json");
    const outUnresolvedPath = path.join(repoRoot, "src", "data", "_generated", "wiki-acquisition.unresolved.json");

    const { byNormName } = loadItemsNameIndex(itemsJsonPath);
    const labelMap = loadLabelMap(labelMapPath);

    const byLabel: Record<string, string> = { ...(labelMap.byLabel ?? {}) };
    const seenLabels = new Set<string>();

    const carrySources: Record<string, Set<string>> = {};

    const unresolvedMissingInItems: Array<{ name: string; sourceLabel: string; section: string }> = [];
    const unresolvedAmbiguous: Array<{ name: string; matches: string[]; sourceLabel: string; section: string }> = [];

    const input = fs.createReadStream(inputNdjson, { encoding: "utf-8" });

    let lineNum = 0;
    let buf = "";

    input.on("data", (chunk: string) => {
        buf += chunk;

        while (true) {
            const idx = buf.indexOf("\n");
            if (idx === -1) break;

            const line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);

            lineNum += 1;

            const trimmed = line.trim();
            if (!trimmed) continue;

            let row: WikiDropRow | null = null;
            try {
                row = JSON.parse(trimmed) as WikiDropRow;
            } catch {
                continue;
            }

            const sec = String(row?.section?.h3Text ?? "").trim();
            const { sourceLabel, itemName } = extractItemAndSource(row);

            if (!sourceLabel || !itemName) continue;

            seenLabels.add(sourceLabel);

            // Ensure label -> stable sourceId exists
            if (!byLabel[sourceLabel]) {
                byLabel[sourceLabel] = deriveSourceIdForLabel(sourceLabel, { ...labelMap, byLabel });
            }

            const norm = normalizeName(itemName);
            const matches = byNormName[norm] ?? [];

            if (matches.length === 0) {
                unresolvedMissingInItems.push({ name: itemName, sourceLabel, section: sec });
                continue;
            }

            if (matches.length !== 1) {
                unresolvedAmbiguous.push({ name: itemName, matches, sourceLabel, section: sec });
                continue;
            }

            const itemPath = matches[0];
            const catalogId = `items:${itemPath}`;

            const sid = byLabel[sourceLabel];

            if (!carrySources[catalogId]) carrySources[catalogId] = new Set<string>();
            carrySources[catalogId].add(sid);
        }
    });

    input.on("end", () => {
        // Deterministic output
        const acquisitionByCatalogId: Record<string, { sources: string[] }> = {};
        const allCatalogIds = Object.keys(carrySources).sort((a, b) => a.localeCompare(b));

        for (const cid of allCatalogIds) {
            const sources = Array.from(carrySources[cid].values()).sort((a, b) => a.localeCompare(b));
            acquisitionByCatalogId[cid] = { sources };
        }

        // Persist merged label map
        const nextLabelMap: LabelMapFile = {
            byLabel,
            defaults: labelMap.defaults ?? { fallbackSourceId: "data:unknown" }
        };
        writeJson(labelMapPath, nextLabelMap);

        // Persist acquisition mapping
        writeJson(outAcqPath, acquisitionByCatalogId);

        // Persist unresolved report (sorted for stability)
        unresolvedMissingInItems.sort((a, b) => {
            if (a.name !== b.name) return a.name.localeCompare(b.name);
            if (a.sourceLabel !== b.sourceLabel) return a.sourceLabel.localeCompare(b.sourceLabel);
            return a.section.localeCompare(b.section);
        });

        unresolvedAmbiguous.sort((a, b) => {
            if (a.name !== b.name) return a.name.localeCompare(b.name);
            if (a.sourceLabel !== b.sourceLabel) return a.sourceLabel.localeCompare(b.sourceLabel);
            return a.section.localeCompare(b.section);
        });

        const unresolved = {
            inputNdjson,
            stats: {
                totalLinesRead: lineNum,
                uniqueSourceLabelsSeen: seenLabels.size,
                resolvedCatalogIdCount: Object.keys(acquisitionByCatalogId).length,
                unresolvedMissingInItemsCount: unresolvedMissingInItems.length,
                unresolvedAmbiguousCount: unresolvedAmbiguous.length
            },
            unresolvedMissingInItems,
            unresolvedAmbiguous
        };

        writeJson(outUnresolvedPath, unresolved);

        // Copy/paste friendly summary
        // eslint-disable-next-line no-console
        console.log(
            JSON.stringify(
                {
                    ok: true,
                    wrote: {
                        labelMapPath,
                        outAcqPath,
                        outUnresolvedPath
                    },
                    stats: unresolved.stats
                },
                null,
                2
            )
        );
    });

    input.on("error", (e) => {
        throw e;
    });
}

main();

