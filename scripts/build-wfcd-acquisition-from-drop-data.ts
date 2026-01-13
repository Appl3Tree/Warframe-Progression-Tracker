// ===== FILE: scripts/build-wfcd-acquisition-from-drop-data.ts =====
//
// Build acquisition mapping from WFCD warframe-drop-data "raw" JSON files.
//
// Inputs:
// - external/warframe-items/raw/*   (already used to generate wfcd-items.byCatalogId.auto.json)
// - external/warframe-drop-data/raw/*
//
// Outputs:
// - src/data/_generated/wfcd-acquisition.byCatalogId.auto.json
// - src/data/_generated/wfcd-source-label-map.auto.json
// - src/data/_generated/wfcd-acquisition.unresolved.json
//
// Notes:
// - We map drop rows by *itemName* to WFCD items by *name* (normalized).
// - Where itemName is ambiguous or missing, we record it in unresolved output (fail-closed).
// - We emit SourceIds as "data:drop:<hash>" and keep a label map { sourceId -> human label }.
// - The planner still fail-closes accessibility on data:* sources until prereqs are curated,
//   but this at least populates "known sources" so the app can present mapping data.
//
// Run:
//   npx tsx scripts/build-wfcd-acquisition-from-drop-data.ts

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

type CatalogId = `items:${string}`;
type SourceId = string;

type WfcdItemMini = {
    name?: string;
    uniqueName?: string;
    category?: string;
    source?: string;
};

type AcquisitionDef = {
    sources: SourceId[];
};

type LabelMap = Record<SourceId, string>;

function normalizeName(name: string): string {
    return String(name ?? "").trim().toLowerCase();
}

function isObject(v: unknown): v is Record<string, any> {
    return !!v && typeof v === "object" && !Array.isArray(v);
}

function hashLabel(label: string): string {
    const h = crypto.createHash("sha1").update(label, "utf8").digest("hex");
    return h.slice(0, 10);
}

function makeSourceId(label: string): SourceId {
    return `data:drop:${hashLabel(label)}`;
}

async function readJson(filePath: string): Promise<unknown> {
    const txt = await fs.readFile(filePath, "utf8");
    return JSON.parse(txt);
}

async function fileExists(p: string): Promise<boolean> {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

function pushRow(
    out: Map<CatalogId, Set<SourceId>>,
    labels: LabelMap,
    catalogId: CatalogId,
    sourceLabel: string
): void {
    const sid = makeSourceId(sourceLabel);
    if (!out.has(catalogId)) out.set(catalogId, new Set());
    out.get(catalogId)!.add(sid);
    if (!labels[sid]) labels[sid] = sourceLabel;
}

function buildNameIndex(itemsByCatalogId: Record<string, WfcdItemMini>): Record<string, CatalogId[]> {
    const idx: Record<string, CatalogId[]> = {};
    for (const [cid, rec] of Object.entries(itemsByCatalogId)) {
        if (!cid.startsWith("items:")) continue;
        const nm = typeof rec?.name === "string" ? rec.name : "";
        const key = normalizeName(nm);
        if (!key) continue;
        if (!idx[key]) idx[key] = [];
        idx[key].push(cid as CatalogId);
    }
    return idx;
}

function chooseCatalogId(candidates: CatalogId[], itemsByCatalogId: Record<string, WfcdItemMini>): CatalogId | null {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Prefer “real items” over blueprints/glyphs/skins/etc when ambiguous, using category heuristics.
    const scored = candidates.map((cid) => {
        const cat = String(itemsByCatalogId[cid]?.category ?? "");
        const lc = cat.toLowerCase();

        let score = 0;
        // Common “core” buckets
        if (lc.includes("resource")) score += 50;
        if (lc.includes("primary") || lc.includes("secondary") || lc.includes("melee")) score += 40;
        if (lc.includes("warframe") || lc.includes("archwing") || lc.includes("sentinel")) score += 35;
        if (lc.includes("mod")) score -= 10;
        if (lc.includes("skin") || lc.includes("glyph") || lc.includes("sigil")) score -= 25;

        // Prefer items that have a uniqueName (usually “real” WFCD entries)
        if (typeof itemsByCatalogId[cid]?.uniqueName === "string") score += 5;

        return { cid, score };
    });

    scored.sort((a, b) => b.score - a.score || a.cid.localeCompare(b.cid));
    return scored[0]?.cid ?? null;
}

/**
 * Extract rows from missionRewards.json
 * Shape:
 * {
 *   "Earth": {
 *     "E Prime": { "gameMode": "...", "rewards": { "A":[{itemName,chance,rarity}], "B":[...], ... } },
 *     ...
 *   },
 *   ...
 * }
 */
function extractMissionRewards(raw: unknown): Array<{ itemName: string; label: string }> {
    const rows: Array<{ itemName: string; label: string }> = [];
    if (!isObject(raw)) return rows;

    for (const [planet, planetObj] of Object.entries(raw)) {
        if (!isObject(planetObj)) continue;

        for (const [node, nodeObj] of Object.entries(planetObj)) {
            if (!isObject(nodeObj)) continue;

            const gameMode = typeof nodeObj.gameMode === "string" ? nodeObj.gameMode : "";
            const rewards = nodeObj.rewards;

            if (!isObject(rewards)) continue;

            for (const [rot, list] of Object.entries(rewards)) {
                if (!Array.isArray(list)) continue;

                for (const r of list) {
                    const itemName = typeof r?.itemName === "string" ? r.itemName : "";
                    if (!itemName) continue;

                    const label = `Mission Reward: ${planet} / ${node}${gameMode ? ` (${gameMode})` : ""} [Rotation ${rot}]`;
                    rows.push({ itemName, label });
                }
            }
        }
    }

    return rows;
}

/**
 * Extract rows from relics.json
 * Shape:
 * [
 *   { tier, relicName, rewards: [ { itemName, chance, rarity } ] }  OR rewards: { Intact:[...], Exceptional:[...], ... }
 * ]
 */
function extractRelics(raw: unknown): Array<{ itemName: string; label: string }> {
    const rows: Array<{ itemName: string; label: string }> = [];
    if (!Array.isArray(raw)) return rows;

    for (const rec of raw) {
        const tier = typeof rec?.tier === "string" ? rec.tier : "";
        const relicName = typeof rec?.relicName === "string" ? rec.relicName : "";
        const baseLabel = `Relic: ${tier} ${relicName}`.trim();

        const rewards = rec?.rewards;
        if (Array.isArray(rewards)) {
            for (const r of rewards) {
                const itemName = typeof r?.itemName === "string" ? r.itemName : "";
                if (!itemName) continue;
                rows.push({ itemName, label: baseLabel });
            }
            continue;
        }

        if (isObject(rewards)) {
            for (const [state, list] of Object.entries(rewards)) {
                if (!Array.isArray(list)) continue;
                for (const r of list) {
                    const itemName = typeof r?.itemName === "string" ? r.itemName : "";
                    if (!itemName) continue;
                    rows.push({ itemName, label: `${baseLabel} (${state})` });
                }
            }
        }
    }

    return rows;
}

/**
 * Extract rows from blueprintLocations.json
 * Shape:
 * [
 *   { itemName, enemies: [ { enemyName, chance, rarity, enemyItemDropChance? }, ... ] }
 * ]
 */
function extractBlueprintLocations(raw: unknown): Array<{ itemName: string; label: string }> {
    const rows: Array<{ itemName: string; label: string }> = [];
    if (!Array.isArray(raw)) return rows;

    for (const rec of raw) {
        const itemName = typeof rec?.itemName === "string" ? rec.itemName : "";
        if (!itemName) continue;

        const enemies = rec?.enemies;
        if (!Array.isArray(enemies) || enemies.length === 0) continue;

        for (const e of enemies) {
            const enemyName = typeof e?.enemyName === "string" ? e.enemyName : "";
            if (!enemyName) continue;

            rows.push({
                itemName,
                label: `Enemy Blueprint Drop: ${enemyName}`
            });
        }
    }

    return rows;
}

/**
 * Extract rows from enemyBlueprintTables.json
 * Shape:
 * [
 *   { enemyName, items: [ { itemName, chance, rarity } ] }
 * ]
 */
function extractEnemyBlueprintTables(raw: unknown): Array<{ itemName: string; label: string }> {
    const rows: Array<{ itemName: string; label: string }> = [];
    if (!Array.isArray(raw)) return rows;

    for (const rec of raw) {
        const enemyName = typeof rec?.enemyName === "string" ? rec.enemyName : "";
        const items = rec?.items;
        if (!enemyName || !Array.isArray(items)) continue;

        for (const it of items) {
            const itemName = typeof it?.itemName === "string" ? it.itemName : "";
            if (!itemName) continue;

            rows.push({
                itemName,
                label: `Enemy Drop: ${enemyName}`
            });
        }
    }

    return rows;
}

/**
 * Extract rows from miscItems.json
 * Shape:
 * [
 *   { enemyName, items: [ { itemName, chance, rarity } ] }
 * ]
 */
function extractMiscItems(raw: unknown): Array<{ itemName: string; label: string }> {
    const rows: Array<{ itemName: string; label: string }> = [];
    if (!Array.isArray(raw)) return rows;

    for (const rec of raw) {
        const enemyName = typeof rec?.enemyName === "string" ? rec.enemyName : "";
        const items = rec?.items;
        if (!enemyName || !Array.isArray(items)) continue;

        for (const it of items) {
            const itemName = typeof it?.itemName === "string" ? it.itemName : "";
            if (!itemName) continue;

            rows.push({
                itemName,
                label: `Enemy Drop (Misc): ${enemyName}`
            });
        }
    }

    return rows;
}

/**
 * Extract rows from transientRewards.json
 * Shape:
 * [
 *   { objectiveName, rewards: [ { itemName, chance, rarity } ] }
 * ]
 */
function extractTransientRewards(raw: unknown): Array<{ itemName: string; label: string }> {
    const rows: Array<{ itemName: string; label: string }> = [];
    if (!Array.isArray(raw)) return rows;

    for (const rec of raw) {
        const obj = typeof rec?.objectiveName === "string" ? rec.objectiveName : "";
        const rewards = rec?.rewards;
        if (!obj || !Array.isArray(rewards)) continue;

        for (const r of rewards) {
            const itemName = typeof r?.itemName === "string" ? r.itemName : "";
            if (!itemName) continue;

            rows.push({
                itemName,
                label: `Transient Reward: ${obj}`
            });
        }
    }

    return rows;
}

/**
 * Extract rows from sortieRewards.json
 * Shape: [ { itemName, chance, rarity } ]
 */
function extractSortieRewards(raw: unknown): Array<{ itemName: string; label: string }> {
    const rows: Array<{ itemName: string; label: string }> = [];
    if (!Array.isArray(raw)) return rows;

    for (const rec of raw) {
        const itemName = typeof rec?.itemName === "string" ? rec.itemName : "";
        if (!itemName) continue;
        rows.push({ itemName, label: "Sortie Reward" });
    }

    return rows;
}

/**
 * Extract rows from bounty reward files (cetus/solaris/zariman/deimos/entratiLab/hex)
 * Shape:
 * [
 *   { bountyLevel, rewards: { A:[...], B:[...], C:[...]} }
 * ]
 */
function extractBountyRewards(raw: unknown, bountyLabel: string): Array<{ itemName: string; label: string }> {
    const rows: Array<{ itemName: string; label: string }> = [];
    if (!Array.isArray(raw)) return rows;

    for (const rec of raw) {
        const level = typeof rec?.bountyLevel === "string" ? rec.bountyLevel : "";
        const rewards = rec?.rewards;
        if (!isObject(rewards)) continue;

        for (const [rot, list] of Object.entries(rewards)) {
            if (!Array.isArray(list)) continue;
            for (const r of list) {
                const itemName = typeof r?.itemName === "string" ? r.itemName : "";
                if (!itemName) continue;

                rows.push({
                    itemName,
                    label: `${bountyLabel}: ${level || "Bounty"} [Rotation ${rot}]`
                });
            }
        }
    }

    return rows;
}

/**
 * Extract rows from syndicates.json
 * Shape:
 * { "syndicates": { "Steel Meridian": [ { item, place, standing }, ... ], ... } }
 */
function extractSyndicates(raw: unknown): Array<{ itemName: string; label: string }> {
    const rows: Array<{ itemName: string; label: string }> = [];
    if (!isObject(raw)) return rows;

    const syn = raw?.syndicates;
    if (!isObject(syn)) return rows;

    for (const [synName, list] of Object.entries(syn)) {
        if (!Array.isArray(list)) continue;
        for (const rec of list) {
            const itemName = typeof rec?.item === "string" ? rec.item : "";
            if (!itemName) continue;

            const place = typeof rec?.place === "string" ? rec.place : "";
            rows.push({
                itemName,
                label: `Syndicate Vendor: ${synName}${place ? ` (${place})` : ""}`
            });
        }
    }

    return rows;
}

async function main(): Promise<void> {
    const repoRoot = process.cwd();

    const itemsPath = path.join(repoRoot, "src", "data", "_generated", "wfcd-items.byCatalogId.auto.json");
    const dropDir = path.join(repoRoot, "external", "warframe-drop-data", "raw");

    if (!(await fileExists(itemsPath))) {
        throw new Error(`Missing generated items file: ${itemsPath}`);
    }
    if (!(await fileExists(dropDir))) {
        throw new Error(`Missing drop-data raw dir: ${dropDir}`);
    }

    const itemsByCatalogId = (await readJson(itemsPath)) as Record<string, WfcdItemMini>;
    if (!isObject(itemsByCatalogId)) {
        throw new Error(`wfcd-items.byCatalogId.auto.json root must be an object map.`);
    }

    const nameIndex = buildNameIndex(itemsByCatalogId);

    const files = await fs.readdir(dropDir);
    const wanted = new Set([
        "missionRewards.json",
        "relics.json",
        "blueprintLocations.json",
        "enemyBlueprintTables.json",
        "miscItems.json",
        "transientRewards.json",
        "sortieRewards.json",
        "cetusBountyRewards.json",
        "solarisBountyRewards.json",
        "zarimanRewards.json",
        "deimosRewards.json",
        "entratiLabRewards.json",
        "hexRewards.json",
        "syndicates.json"
    ]);

    const out = new Map<CatalogId, Set<SourceId>>();
    const labelMap: LabelMap = {};
    const unresolved: Record<string, { itemName: string; count: number; examples: string[] }> = {};

    let totalDropRows = 0;

    function recordUnresolved(itemName: string, label: string): void {
        const key = normalizeName(itemName);
        if (!unresolved[key]) unresolved[key] = { itemName, count: 0, examples: [] };
        unresolved[key].count += 1;
        if (unresolved[key].examples.length < 10) unresolved[key].examples.push(label);
    }

    function ingestRows(rows: Array<{ itemName: string; label: string }>): void {
        for (const r of rows) {
            const itemName = r.itemName;
            const label = r.label;
            if (!itemName || !label) continue;

            totalDropRows += 1;

            const key = normalizeName(itemName);
            const candidates = nameIndex[key] ?? [];
            const chosen = chooseCatalogId(candidates, itemsByCatalogId);

            if (!chosen) {
                recordUnresolved(itemName, label);
                continue;
            }

            pushRow(out, labelMap, chosen, label);
        }
    }

    for (const fn of files) {
        if (!wanted.has(fn)) continue;

        const fullPath = path.join(dropDir, fn);
        const raw = await readJson(fullPath);

        if (fn === "missionRewards.json") {
            ingestRows(extractMissionRewards(raw));
        } else if (fn === "relics.json") {
            ingestRows(extractRelics(raw));
        } else if (fn === "blueprintLocations.json") {
            ingestRows(extractBlueprintLocations(raw));
        } else if (fn === "enemyBlueprintTables.json") {
            ingestRows(extractEnemyBlueprintTables(raw));
        } else if (fn === "miscItems.json") {
            ingestRows(extractMiscItems(raw));
        } else if (fn === "transientRewards.json") {
            ingestRows(extractTransientRewards(raw));
        } else if (fn === "sortieRewards.json") {
            ingestRows(extractSortieRewards(raw));
        } else if (fn === "cetusBountyRewards.json") {
            ingestRows(extractBountyRewards(raw, "Cetus Bounty"));
        } else if (fn === "solarisBountyRewards.json") {
            ingestRows(extractBountyRewards(raw, "Solaris Bounty"));
        } else if (fn === "zarimanRewards.json") {
            ingestRows(extractBountyRewards(raw, "Zariman Bounty"));
        } else if (fn === "deimosRewards.json") {
            ingestRows(extractBountyRewards(raw, "Deimos Bounty"));
        } else if (fn === "entratiLabRewards.json") {
            ingestRows(extractBountyRewards(raw, "Entrati Lab Bounty"));
        } else if (fn === "hexRewards.json") {
            ingestRows(extractBountyRewards(raw, "Hex Bounty"));
        } else if (fn === "syndicates.json") {
            ingestRows(extractSyndicates(raw));
        }
    }

    // Emit acquisition map
    const acqOut: Record<string, AcquisitionDef> = {};
    for (const [cid, set] of out.entries()) {
        const sources = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
        if (sources.length === 0) continue;
        acqOut[cid] = { sources };
    }

    const outDir = path.join(repoRoot, "src", "data", "_generated");
    await fs.mkdir(outDir, { recursive: true });

    const outAcqPath = path.join(outDir, "wfcd-acquisition.byCatalogId.auto.json");
    const outLabelMapPath = path.join(outDir, "wfcd-source-label-map.auto.json");
    const outUnresolvedPath = path.join(outDir, "wfcd-acquisition.unresolved.json");

    await fs.writeFile(outAcqPath, JSON.stringify(acqOut, null, 2), "utf8");
    await fs.writeFile(outLabelMapPath, JSON.stringify(labelMap, null, 2), "utf8");
    await fs.writeFile(outUnresolvedPath, JSON.stringify(unresolved, null, 2), "utf8");

    const uniqueSources = Object.keys(labelMap).length;
    const catalogIdsWithAnySources = Object.keys(acqOut).length;
    const unresolvedCount = Object.keys(unresolved).length;

    const result = {
        ok: true,
        wrote: {
            outAcqPath,
            outLabelMapPath,
            outUnresolvedPath
        },
        stats: {
            dropRawDir: dropDir,
            totalDropRows,
            catalogIdsWithAnySources,
            uniqueSources,
            unresolvedCount
        }
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
});

