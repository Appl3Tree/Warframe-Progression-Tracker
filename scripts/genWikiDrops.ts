// scripts/genWikiDrops.ts
//
// Fetches the official Warframe PC Drops page, extracts item -> sources mappings,
// resolves items uniquely to CatalogIds via FULL_CATALOG.nameIndex, and writes:
//
// - src/data/_generated/wiki-acquisition-by-catalog-id.auto.json
// - src/data/_generated/wiki-acquisition-unresolved.auto.json
// - updates src/data/_generated/source-label-map.auto.json (stable label -> SourceId)
//
// Fail-closed rules:
// - If an item name resolves to 0 or >1 catalog ids, it is NOT written to the catalog-id overlay.
// - Sources are extracted as labels and mapped to stable SourceIds via the label map.

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import * as cheerio from "cheerio";

import { FULL_CATALOG, type CatalogId } from "../src/domain/catalog/loadFullCatalog";
import { sourceIdFromLabel } from "../src/catalog/sources/sourceData";

const DROPS_URL =
    "https://warframe-web-assets.nyc3.cdn.digitaloceanspaces.com/uploads/cms/hnfvc0o3jnfvc873njb03enrf56.html";

const OUT_DIR = path.resolve("src/data/_generated");
const OUT_ACQ = path.join(OUT_DIR, "wiki-acquisition-by-catalog-id.auto.json");
const OUT_UNRESOLVED = path.join(OUT_DIR, "wiki-acquisition-unresolved.auto.json");
const OUT_LABEL_MAP = path.join(OUT_DIR, "source-label-map.auto.json");

type AcquisitionDef = { sources: string[] };
type UnresolvedRow =
    | { name: string; reason: "no-catalog-match" }
    | { name: string; reason: "multiple-catalog-matches"; matches: string[] }
    | { name: string; reason: "no-sources-parsed" };

type LabelMapFile = {
    byLabel?: Record<string, string>;
    defaults?: { fallbackSourceId?: string };
};

function normalizeName(name: string): string {
    return String(name ?? "").trim().toLowerCase();
}

function ensureDir(p: string): void {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readJsonFileLoose(p: string): unknown {
    try {
        if (!fs.existsSync(p)) return null;
        const text = fs.readFileSync(p, "utf8");
        return JSON.parse(text) as unknown;
    } catch {
        return null;
    }
}

function writeJsonFile(p: string, data: unknown): void {
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function fetchText(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
                    return;
                }
                res.setEncoding("utf8");
                let buf = "";
                res.on("data", (chunk) => (buf += chunk));
                res.on("end", () => resolve(buf));
            })
            .on("error", reject);
    });
}

function looksLikePercent(s: string): boolean {
    const t = String(s ?? "").trim();
    return /\d/.test(t) && /%/.test(t);
}

function cleanCellText(s: string): string {
    return String(s ?? "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * DOM-driven parser for the Drops table.
 *
 * Your described structure:
 * - each <tr> is a row
 * - source and/or rotation are <th>
 * - item name and chance are <td>
 *
 * We will:
 * - locate the h3 with "Blueprint/Item Drops by Blueprint/Item:"
 * - parse subsequent tables until the next h3 (or end)
 * - for each row with (>=1 th) and (>=2 tds) and td[1] looks like a percent:
 *     sourceLabel = join(th texts)
 *     itemName    = td[0]
 *     add itemName -> sourceLabel
 */
function extractItemToSourcesFromTables($: cheerio.CheerioAPI): Record<string, Set<string>> {
    const itemToSources: Record<string, Set<string>> = {};

    function add(itemName: string, sourceLabel: string): void {
        const item = cleanCellText(itemName);
        const src = cleanCellText(sourceLabel);
        if (!item || !src) return;
        if (!itemToSources[item]) itemToSources[item] = new Set<string>();
        itemToSources[item].add(src);
    }

    const headingText = "Blueprint/Item Drops by Blueprint/Item:";

    // Find the first h3 whose text contains the headingText.
    const h3 = $("h3")
        .toArray()
        .map((el) => $(el))
        .find((node) => cleanCellText(node.text()).includes(headingText));

    if (!h3) {
        return itemToSources;
    }

    // Walk forward from the heading, collecting tables until the next H3.
    const tables: cheerio.Element[] = [];
    let cur: cheerio.Cheerio<cheerio.Element> = h3;

    while (true) {
        const next = cur.next();
        if (!next || next.length === 0) break;

        const tag = String(next[0]?.tagName ?? "").toLowerCase();

        if (tag === "h3") {
            break;
        }

        if (tag === "table") {
            tables.push(next[0]);
        }

        cur = next;
    }

    // Parse collected tables.
    for (const tableEl of tables) {
        const $table = $(tableEl);

        $table.find("tr").each((_i, tr) => {
            const $tr = $(tr);

            const ths = $tr
                .find("th")
                .toArray()
                .map((x) => cleanCellText($(x).text()))
                .filter((x) => x.length > 0);

            const tds = $tr
                .find("td")
                .toArray()
                .map((x) => cleanCellText($(x).text()))
                .filter((_x, idx, arr) => {
                    // Keep positional empty strings (we already cleaned), but we need stable indices.
                    // However cheerio text() for empty cells is "", which we keep by not filtering here.
                    // This function is only used after map; avoid filtering by content.
                    void idx;
                    void arr;
                    return true;
                });

            if (ths.length === 0) return;
            if (tds.length < 2) return;

            const itemName = tds[0] ?? "";
            const chance = tds[1] ?? "";
            if (!itemName) return;

            // Sanity check: drop chance column should look like a percent.
            if (!looksLikePercent(chance)) return;

            // Source label is the combined context from all THs (source and/or rotation).
            // This preserves more information and avoids guessing.
            const sourceLabel = ths.join(" / ");
            if (!sourceLabel) return;

            add(itemName, sourceLabel);
        });
    }

    return itemToSources;
}

function resolveNameToCatalogId(
    name: string
): { ok: true; id: CatalogId } | { ok: false; reason: UnresolvedRow } {
    const key = normalizeName(name);
    const matches = FULL_CATALOG.nameIndex[key] ?? [];

    // Only allow displayable items (fail-closed; avoid hidden/unnamed records)
    const displayableMatches = matches.filter((cid) => FULL_CATALOG.recordsById[cid]?.isDisplayable);

    if (displayableMatches.length === 0) {
        return { ok: false, reason: { name, reason: "no-catalog-match" } };
    }

    if (displayableMatches.length > 1) {
        return {
            ok: false,
            reason: { name, reason: "multiple-catalog-matches", matches: displayableMatches.slice() }
        };
    }

    return { ok: true, id: displayableMatches[0] };
}

function loadLabelMap(): LabelMapFile {
    const parsed = readJsonFileLoose(OUT_LABEL_MAP);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { byLabel: {}, defaults: { fallbackSourceId: "data:unknown" } };
    }
    const v = parsed as LabelMapFile;
    return {
        byLabel: v.byLabel && typeof v.byLabel === "object" ? v.byLabel : {},
        defaults: v.defaults ?? { fallbackSourceId: "data:unknown" }
    };
}

async function main(): Promise<void> {
    ensureDir(OUT_DIR);

    const html = await fetchText(DROPS_URL);
    const $ = cheerio.load(html);

    const itemToSources = extractItemToSourcesFromTables($);

    const labelMap = loadLabelMap();
    const byLabel: Record<string, string> = { ...(labelMap.byLabel ?? {}) };

    const outAcq: Record<string, AcquisitionDef> = {};
    const unresolved: UnresolvedRow[] = [];

    for (const [itemName, sourcesSet] of Object.entries(itemToSources)) {
        const sources = Array.from(sourcesSet.values()).sort((a, b) => a.localeCompare(b));
        if (sources.length === 0) {
            unresolved.push({ name: itemName, reason: "no-sources-parsed" });
            continue;
        }

        // Resolve name -> CatalogId uniquely
        const resolved = resolveNameToCatalogId(itemName);
        if (!resolved.ok) {
            unresolved.push(resolved.reason);
            continue;
        }

        // Map labels -> stable SourceIds.
        // Also update label map deterministically for any new labels we encounter.
        const sourceIds: string[] = [];
        for (const label of sources) {
            const sid = sourceIdFromLabel(label);
            sourceIds.push(sid);

            if (!byLabel[label]) {
                byLabel[label] = sid;
            }
        }

        const uniq = Array.from(new Set(sourceIds)).sort((a, b) => a.localeCompare(b));
        outAcq[String(resolved.id)] = { sources: uniq };
    }

    writeJsonFile(OUT_ACQ, outAcq);
    writeJsonFile(OUT_UNRESOLVED, unresolved);

    const nextLabelMap: LabelMapFile = {
        byLabel,
        defaults: labelMap.defaults ?? { fallbackSourceId: "data:unknown" }
    };
    writeJsonFile(OUT_LABEL_MAP, nextLabelMap);

    // eslint-disable-next-line no-console
    console.log(
        [
            `Fetched drops HTML.`,
            `Parsed item names: ${Object.keys(itemToSources).length}`,
            `Resolved acquisitions: ${Object.keys(outAcq).length}`,
            `Unresolved: ${unresolved.length}`,
            `Wrote: ${OUT_ACQ}`,
            `Wrote: ${OUT_UNRESOLVED}`,
            `Updated: ${OUT_LABEL_MAP}`
        ].join("\n")
    );
}

main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
});
