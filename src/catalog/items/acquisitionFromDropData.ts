/* ===== FILE: src/catalog/items/acquisitionFromDropData.ts ===== */

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

/**
 * WF drop-data ingestion layer.
 *
 * Goal:
 * - Eliminate "unknown-acquisition" by mapping *display names* from drop-data to catalog item IDs.
 *
 * Constraints:
 * - Drop-data is not canonical. We treat it as an augment layer only.
 * - Name matching must be resilient (whitespace/punctuation/quantity prefixes/suffixes).
 * - Fail-closed: if a drop name maps to multiple plausible catalog IDs, DO NOT guess.
 *
 * IMPORTANT:
 * - SourceIds emitted here MUST be valid per normalizeSourceId() rules.
 *   This code emits ONLY "src:<token>" style ids (no "data:" namespace).
 */

import missionRewardsJson from "../../../external/warframe-drop-data/raw/missionRewards.json";
import relicsJson from "../../../external/warframe-drop-data/raw/relics.json";
import blueprintLocationsJson from "../../../external/warframe-drop-data/raw/blueprintLocations.json";
import enemyBlueprintTablesJson from "../../../external/warframe-drop-data/raw/enemyBlueprintTables.json";
import modLocationsJson from "../../../external/warframe-drop-data/raw/modLocations.json";
import enemyModTablesJson from "../../../external/warframe-drop-data/raw/enemyModTables.json";
import transientRewardsJson from "../../../external/warframe-drop-data/raw/transientRewards.json";
import sortieRewardsJson from "../../../external/warframe-drop-data/raw/sortieRewards.json";
import cetusBountyRewardsJson from "../../../external/warframe-drop-data/raw/cetusBountyRewards.json";
import zarimanRewardsJson from "../../../external/warframe-drop-data/raw/zarimanRewards.json";
import syndicatesJson from "../../../external/warframe-drop-data/raw/syndicates.json";
import miscItemsJson from "../../../external/warframe-drop-data/raw/miscItems.json";
import keyRewardsJson from "../../../external/warframe-drop-data/raw/keyRewards.json";
import solarisBountyRewardsJson from "../../../external/warframe-drop-data/raw/solarisBountyRewards.json";
import deimosRewardsJson from "../../../external/warframe-drop-data/raw/deimosRewards.json";
import entratiLabRewardsJson from "../../../external/warframe-drop-data/raw/entratiLabRewards.json";
import hexRewardsJson from "../../../external/warframe-drop-data/raw/hexRewards.json";
import resourceByAvatarJson from "../../../external/warframe-drop-data/raw/resourceByAvatar.json";
import additionalItemByAvatarJson from "../../../external/warframe-drop-data/raw/additionalItemByAvatar.json";

export type AcquisitionDef = { sources: string[] };

export type DropDataJoinDiagnostics = {
    stats: {
        dropNameOccurrences: number;
        uniqueDropNames: number;
        matchedUniqueDropNames: number;
        unmatchedUniqueDropNames: number;
        ambiguousUniqueDropNames: number;
        catalogIdsWithAnySources: number;
        uniqueSourceIds: number;
        excludedNonCatalogRewardNames: number;

        avatarResourceRows: number;
        avatarResourceRowsUsingFallback: number;
        avatarAdditionalRows: number;
        avatarAdditionalRowsUsingFallback: number;
    };
    samples: {
        unmatchedDropNames: string[];
        ambiguousDropNames: Array<{ dropName: string; matchedCatalogIds: string[] }>;
        excludedNonCatalogRewardNames: string[];
    };
};

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function normalizeName(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Removes punctuation to make matches resilient:
 * - "Hell's Chamber" -> "hells chamber"
 * - "1,500 Credits"  -> "1500 credits"
 */
function normalizeNameNoPunct(s: string): string {
    return normalizeName(s).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function toToken(s: string): string {
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

/**
 * Build a valid src: SourceId payload segment (no extra colons).
 * Example: src:node/ceres/bode
 */
function srcId(parts: string[]): string {
    const cleaned = parts
        .map((p) => safeString(p) ?? "")
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    // Fail-safe: never return an invalid-looking src id string.
    if (cleaned.length === 0) return "src:unknown";
    return `src:${cleaned.join("/")}`;
}

/**
 * Strip leading quantity prefixes commonly present in drop-data:
 * - "750X Alloy Plate" -> "Alloy Plate"
 * - "10 x Salvage"     -> "Salvage"
 * - "5x Ancient Healer Specter" -> "Ancient Healer Specter"
 */
function stripLeadingQuantityPrefix(s: string): string {
    const raw = s.trim();

    // Examples:
    // "750X Alloy Plate"
    // "750x Alloy Plate"
    // "750 x Alloy Plate"
    // "5x Ancient Healer Specter"
    const m = raw.match(/^\s*\d[\d,]*\s*[xX]\s*(.+)\s*$/);
    if (m && m[1]) return m[1].trim();

    return raw;
}

/**
 * Strip trailing stack/count suffixes commonly present for blueprint/crafting bundle names:
 * - "Adramal Alloy X20 Blueprint" -> "Adramal Alloy Blueprint"
 * - "Fosfor Blau (x20) Blueprint" -> "Fosfor Blau Blueprint"
 * - "Synthesis Scanner x 25"      -> "Synthesis Scanner"
 * - "Kinetic Siphon Trap x 10"    -> "Kinetic Siphon Trap"
 */
function stripTrailingQuantitySuffix(s: string): string {
    let out = s.trim();

    // "(x20) Blueprint" / "(x5) Blueprint" etc.
    out = out.replace(/\s*\(\s*[xX]\s*\d+\s*\)\s*(Blueprint)\s*$/i, " $1").trim();

    // "X20 Blueprint" / "x20 Blueprint"
    out = out.replace(/\s+[xX]\s*\d+\s*(Blueprint)\s*$/i, " $1").trim();

    // Standalone: "x 25" / "x25"
    out = out.replace(/\s+[xX]\s*\d+\s*$/i, "").trim();

    return out;
}

/**
 * Strip refinement state suffix from relic strings:
 * - "Lith D7 Relic (Radiant)" -> "Lith D7 Relic"
 */
function stripRelicRefinementSuffix(s: string): string {
    return s.replace(/\s*\((Intact|Exceptional|Flawless|Radiant)\)\s*$/i, "").trim();
}

/**
 * Drop-data appends parenthetical qualifiers for many mods:
 * - "Abating Link (Trinity)" -> "Abating Link"
 * - "Reinforced Bond (companion)" -> "Reinforced Bond"
 */
function stripTrailingParenthetical(s: string): string {
    return s.replace(/\s*\([^)]*\)\s*$/g, "").trim();
}

/**
 * Some drop-data has missing spaces:
 * - "AstralBond (companion)" -> "Astral Bond (companion)"
 *
 * Conservative: only split a camel-case boundary if it is a single token
 * and the result is two words.
 */
function maybeSplitSimpleCamelCaseToken(s: string): string {
    const raw = s.trim();
    const m = raw.match(/^([A-Za-z]{6,})(\s*\([^)]*\)\s*)?$/);
    if (!m) return raw;

    const token = m[1] ?? "";
    const rest = m[2] ?? "";

    const split = token.replace(/([a-z])([A-Z])/g, "$1 $2");
    if (split === token) return raw;
    if (split.split(/\s+/g).length !== 2) return raw;

    return `${split}${rest}`.trim();
}

function expandNameKeys(rawName: string): string[] {
    const out = new Set<string>();

    const a = safeString(rawName);
    if (!a) return [];

    const stage0 = a;
    const stage1 = maybeSplitSimpleCamelCaseToken(stage0);
    const stage2 = stripRelicRefinementSuffix(stage1);
    const stage3 = stripLeadingQuantityPrefix(stage2);
    const stage4 = stripTrailingQuantitySuffix(stage3);
    const stage5 = stripTrailingParenthetical(stage4);

    out.add(normalizeName(stage0));
    out.add(normalizeNameNoPunct(stage0));

    out.add(normalizeName(stage1));
    out.add(normalizeNameNoPunct(stage1));

    out.add(normalizeName(stage2));
    out.add(normalizeNameNoPunct(stage2));

    out.add(normalizeName(stage3));
    out.add(normalizeNameNoPunct(stage3));

    out.add(normalizeName(stage4));
    out.add(normalizeNameNoPunct(stage4));

    out.add(normalizeName(stage5));
    out.add(normalizeNameNoPunct(stage5));

    return Array.from(out.values());
}

function buildCatalogNameToIds(): Record<string, CatalogId[]> {
    const map: Record<string, CatalogId[]> = {};

    for (const id of FULL_CATALOG.displayableItemIds) {
        const rec = FULL_CATALOG.recordsById[id];
        const name = rec?.displayName;
        if (!name) continue;

        for (const key of expandNameKeys(name)) {
            if (!map[key]) map[key] = [];
            map[key].push(id);
        }
    }

    for (const k of Object.keys(map)) {
        map[k].sort((a, b) => String(a).localeCompare(String(b)));
    }

    return map;
}

function isNonCatalogRewardName(raw: string): boolean {
    const s = raw.trim();

    if (/^\s*Return:\s*[\d,]+\s*$/i.test(s)) return true;
    if (/credits\s*cache\s*$/i.test(s)) return true;
    if (/^\s*[\d,]+\s*credits\s*$/i.test(s)) return true;
    if (/^\s*[\d,]+\s*endo\s*$/i.test(s)) return true;

    if (/booster\s*$/i.test(s)) return true;
    if (/^\s*\d+\s*day\s+.*booster\s*$/i.test(s)) return true;

    if (/\bducats?\b/i.test(s)) return true;

    if (/\b(lith|meso|neo|axi)\b.*\brelic\b/i.test(s)) return true;
    if (/\brequiem\b.*\brelic\b/i.test(s)) return true;
    if (/\beidolon\b.*\brelic\b/i.test(s)) return true;

    if (/\brelic pack\b/i.test(s)) return true;
    if (/\bvoid relic pack\b/i.test(s)) return true;
    if (/\brandom void relics?\b/i.test(s)) return true;

    if (/\bresource bundle\b/i.test(s)) return true;
    if (/\barmor set\b/i.test(s)) return true;
    if (/\bloadout slot\b/i.test(s)) return true;
    if (/\bstencil\b/i.test(s)) return true;
    if (/\bsigil\b/i.test(s)) return true;
    if (/\bskin\b/i.test(s)) return true;
    if (/\bconsole\b/i.test(s)) return true;
    if (/\bhood display\b/i.test(s)) return true;

    if (/^\s*region resource\s*$/i.test(s)) return true;
    if (/^\s*powercell\s*$/i.test(s)) return true;

    return false;
}

function pickBestCatalogId(candidates: CatalogId[]): { picked: CatalogId | null; ambiguous: boolean } {
    if (candidates.length === 0) return { picked: null, ambiguous: false };
    if (candidates.length === 1) return { picked: candidates[0], ambiguous: false };

    const scored = candidates.map((id) => {
        const s = String(id);
        let score = 0;

        if (s.includes("/Beginner/")) score += 100;
        if (s.includes("/Intermediate/")) score += 80;
        if (s.includes("/Expert/")) score += 60;

        score += Math.min(30, Math.floor(s.length / 20));

        return { id, score, s };
    });

    scored.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.s.localeCompare(b.s);
    });

    const best = scored[0];
    const second = scored[1];

    if (second && second.score === best.score) {
        return { picked: null, ambiguous: true };
    }

    return { picked: best.id, ambiguous: false };
}

function coerceRewardArray(v: any): Array<{ itemName?: string; modName?: string; item?: string }> {
    if (!Array.isArray(v)) return [];
    return v as any[];
}

function extractRewardItemNames(rewards: any): string[] {
    const out: string[] = [];

    if (Array.isArray(rewards)) {
        for (const r of coerceRewardArray(rewards)) {
            const n = safeString((r as any)?.itemName) ?? safeString((r as any)?.modName) ?? safeString((r as any)?.item);
            if (n) out.push(n);
        }
        return out;
    }

    if (rewards && typeof rewards === "object") {
        for (const v of Object.values(rewards)) {
            if (Array.isArray(v)) {
                for (const r of coerceRewardArray(v)) {
                    const n = safeString((r as any)?.itemName) ?? safeString((r as any)?.modName) ?? safeString((r as any)?.item);
                    if (n) out.push(n);
                }
            }
        }
    }

    return out;
}

type JoinState = {
    catalogNameToIds: Record<string, CatalogId[]>;
    itemToSources: Record<string, Set<string>>;

    dropNameOccurrences: number;
    uniqueDropNames: Set<string>;
    matchedUniqueDropNames: Set<string>;
    unmatchedUniqueDropNames: Set<string>;
    ambiguousUniqueDropNames: Map<string, string[]>;
    excludedNonCatalogRewardNames: Set<string>;
    uniqueSourceIds: Set<string>;

    avatarResourceRows: number;
    avatarResourceRowsUsingFallback: number;
    avatarAdditionalRows: number;
    avatarAdditionalRowsUsingFallback: number;
};

function createJoinState(): JoinState {
    return {
        catalogNameToIds: buildCatalogNameToIds(),
        itemToSources: {},

        dropNameOccurrences: 0,
        uniqueDropNames: new Set<string>(),
        matchedUniqueDropNames: new Set<string>(),
        unmatchedUniqueDropNames: new Set<string>(),
        ambiguousUniqueDropNames: new Map<string, string[]>(),
        excludedNonCatalogRewardNames: new Set<string>(),
        uniqueSourceIds: new Set<string>(),

        avatarResourceRows: 0,
        avatarResourceRowsUsingFallback: 0,
        avatarAdditionalRows: 0,
        avatarAdditionalRowsUsingFallback: 0
    };
}

function tryAddDropNameToSources(state: JoinState, rawDropName: string, sourceId: string): void {
    const dropName = safeString(rawDropName);
    if (!dropName) return;

    state.dropNameOccurrences += 1;
    state.uniqueDropNames.add(dropName);
    state.uniqueSourceIds.add(sourceId);

    if (isNonCatalogRewardName(dropName)) {
        state.excludedNonCatalogRewardNames.add(dropName);
        return;
    }

    const keys = expandNameKeys(dropName);
    const candidateSet = new Set<CatalogId>();

    for (const k of keys) {
        const ids = state.catalogNameToIds[k];
        if (!ids || ids.length === 0) continue;
        for (const id of ids) candidateSet.add(id);
    }

    const candidates = Array.from(candidateSet.values());
    if (candidates.length === 0) {
        state.unmatchedUniqueDropNames.add(dropName);
        return;
    }

    const { picked, ambiguous } = pickBestCatalogId(candidates);
    if (ambiguous || !picked) {
        state.ambiguousUniqueDropNames.set(
            dropName,
            candidates.map((x) => String(x)).sort((a, b) => a.localeCompare(b))
        );
        return;
    }

    state.matchedUniqueDropNames.add(dropName);

    const idKey = String(picked);
    if (!state.itemToSources[idKey]) state.itemToSources[idKey] = new Set<string>();
    state.itemToSources[idKey].add(sourceId);
}

function buildJoinStateFromAllDropData(): JoinState {
    const state = createJoinState();

    // ---------- Mission rewards (planet/node) ----------
    const mrRoot = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);
    if (mrRoot && typeof mrRoot === "object") {
        for (const [planetName, planetObj] of Object.entries(mrRoot as Record<string, any>)) {
            if (!planetObj || typeof planetObj !== "object") continue;

            for (const [nodeName, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
                if (!nodeObj || typeof nodeObj !== "object") continue;

                const sourceId = srcId(["node", planetName, nodeName]);

                const rewardsObj = (nodeObj as any)?.rewards;
                if (!rewardsObj || typeof rewardsObj !== "object") continue;

                for (const itemName of extractRewardItemNames(rewardsObj)) {
                    tryAddDropNameToSources(state, itemName, sourceId);
                }
            }
        }
    }

    // ---------- Relics table (relic -> rewards) ----------
    const relicsArr = (relicsJson as any)?.relics ?? (relicsJson as any);
    if (Array.isArray(relicsArr)) {
        for (const r of relicsArr) {
            const tier = safeString((r as any)?.tier) ?? "relic";
            const relicName = safeString((r as any)?.relicName) ?? "unknown";
            const sourceId = srcId(["relic", tier, relicName]);

            const rewards = (r as any)?.rewards;
            for (const itemName of extractRewardItemNames(rewards)) {
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Blueprint locations (by item) ----------
    const blArr = (blueprintLocationsJson as any)?.blueprintLocations ?? (blueprintLocationsJson as any);
    if (Array.isArray(blArr)) {
        for (const row of blArr) {
            const itemName = safeString((row as any)?.itemName);
            if (!itemName) continue;

            const enemies = Array.isArray((row as any)?.enemies) ? (row as any).enemies : [];
            for (const e of enemies) {
                const enemyName = safeString((e as any)?.enemyName) ?? "enemy";
                const sourceId = srcId(["enemy-drop", enemyName]);
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Enemy blueprint tables (by enemy) ----------
    const ebtArr = (enemyBlueprintTablesJson as any)?.enemyBlueprintTables ?? (enemyBlueprintTablesJson as any);
    if (Array.isArray(ebtArr)) {
        for (const row of ebtArr) {
            const enemyName = safeString((row as any)?.enemyName) ?? "enemy";
            const sourceId = srcId(["enemy-drop", enemyName]);

            const items = Array.isArray((row as any)?.items) ? (row as any).items : [];
            for (const it of items) {
                const itemName = safeString((it as any)?.itemName);
                if (!itemName) continue;
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Mod locations (by mod) ----------
    const mlArr = (modLocationsJson as any)?.modLocations ?? (modLocationsJson as any);
    if (Array.isArray(mlArr)) {
        for (const row of mlArr) {
            const modName = safeString((row as any)?.modName);
            if (!modName) continue;

            const enemies = Array.isArray((row as any)?.enemies) ? (row as any).enemies : [];
            for (const e of enemies) {
                const enemyName = safeString((e as any)?.enemyName) ?? "enemy";
                const sourceId = srcId(["enemy-mod", enemyName]);
                tryAddDropNameToSources(state, modName, sourceId);
            }
        }
    }

    // ---------- Enemy mod tables (by enemy) ----------
    const emtArr =
        (enemyModTablesJson as any)?.enemyModTables ??
        (enemyModTablesJson as any)?.modLocations ??
        (enemyModTablesJson as any);

    if (Array.isArray(emtArr)) {
        for (const row of emtArr) {
            const enemyName = safeString((row as any)?.enemyName) ?? "enemy";
            const sourceId = srcId(["enemy-mod", enemyName]);

            const mods = Array.isArray((row as any)?.mods) ? (row as any).mods : [];
            for (const it of mods) {
                const modName = safeString((it as any)?.modName) ?? safeString((it as any)?.itemName);
                if (!modName) continue;
                tryAddDropNameToSources(state, modName, sourceId);
            }
        }
    }

    // ---------- Transient rewards ----------
    const trArr = (transientRewardsJson as any)?.transientRewards ?? (transientRewardsJson as any);
    if (Array.isArray(trArr)) {
        for (const row of trArr) {
            const objectiveName = safeString((row as any)?.objectiveName) ?? "objective";
            const sourceId = srcId(["transient", objectiveName]);

            for (const itemName of extractRewardItemNames((row as any)?.rewards)) {
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Sortie rewards ----------
    const srArr = (sortieRewardsJson as any)?.sortieRewards ?? (sortieRewardsJson as any);
    if (Array.isArray(srArr)) {
        const sourceId = srcId(["sortie"]);
        for (const row of srArr) {
            const itemName = safeString((row as any)?.itemName);
            if (!itemName) continue;
            tryAddDropNameToSources(state, itemName, sourceId);
        }
    }

    // ---------- Key rewards ----------
    const krArr = (keyRewardsJson as any)?.keyRewards ?? (keyRewardsJson as any);
    if (Array.isArray(krArr)) {
        for (const row of krArr) {
            const keyName = safeString((row as any)?.keyName) ?? "key";
            const sourceId = srcId(["key", keyName]);

            const rewardsObj = (row as any)?.rewards;
            for (const itemName of extractRewardItemNames(rewardsObj)) {
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Cetus bounty rewards ----------
    const cbArr = (cetusBountyRewardsJson as any)?.cetusBountyRewards ?? (cetusBountyRewardsJson as any);
    if (Array.isArray(cbArr)) {
        for (const row of cbArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel) ?? "bounty";
            const sourceId = srcId(["bounty", "cetus", bountyLevel]);

            const rewardsObj = (row as any)?.rewards;
            for (const itemName of extractRewardItemNames(rewardsObj)) {
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Solaris bounty rewards ----------
    const sbArr = (solarisBountyRewardsJson as any)?.solarisBountyRewards ?? (solarisBountyRewardsJson as any);
    if (Array.isArray(sbArr)) {
        for (const row of sbArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel) ?? "bounty";
            const sourceId = srcId(["bounty", "solaris", bountyLevel]);

            const rewardsObj = (row as any)?.rewards;
            for (const itemName of extractRewardItemNames(rewardsObj)) {
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Deimos rewards ----------
    const drArr = (deimosRewardsJson as any)?.deimosRewards ?? (deimosRewardsJson as any);
    if (Array.isArray(drArr)) {
        for (const row of drArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel) ?? "bounty";
            const sourceId = srcId(["bounty", "deimos", bountyLevel]);

            const rewardsObj = (row as any)?.rewards;
            for (const itemName of extractRewardItemNames(rewardsObj)) {
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Entrati Lab rewards ----------
    const elArr = (entratiLabRewardsJson as any)?.entratiLabRewards ?? (entratiLabRewardsJson as any);
    if (Array.isArray(elArr)) {
        for (const row of elArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel) ?? "bounty";
            const sourceId = srcId(["bounty", "entrati-lab", bountyLevel]);

            const rewardsObj = (row as any)?.rewards;
            for (const itemName of extractRewardItemNames(rewardsObj)) {
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Hex rewards ----------
    const hxArr = (hexRewardsJson as any)?.hexRewards ?? (hexRewardsJson as any);
    if (Array.isArray(hxArr)) {
        for (const row of hxArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel) ?? "bounty";
            const sourceId = srcId(["bounty", "hex", bountyLevel]);

            const rewardsObj = (row as any)?.rewards;
            for (const itemName of extractRewardItemNames(rewardsObj)) {
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Zariman bounty rewards ----------
    const zrArr = (zarimanRewardsJson as any)?.zarimanRewards ?? (zarimanRewardsJson as any);
    if (Array.isArray(zrArr)) {
        for (const row of zrArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel) ?? "bounty";
            const sourceId = srcId(["bounty", "zariman", bountyLevel]);

            const rewardsObj = (row as any)?.rewards;
            for (const itemName of extractRewardItemNames(rewardsObj)) {
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Syndicate vendor rewards ----------
    const synRoot = (syndicatesJson as any)?.syndicates ?? (syndicatesJson as any);
    if (synRoot && typeof synRoot === "object" && !Array.isArray(synRoot)) {
        for (const [synName, items] of Object.entries(synRoot as Record<string, any>)) {
            const sourceId = srcId(["vendor", "syndicate", synName]);

            if (!Array.isArray(items)) continue;
            for (const row of items) {
                const itemName = safeString((row as any)?.item) ?? safeString((row as any)?.itemName);
                if (!itemName) continue;
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Misc enemy item drops ----------
    const miArr = (miscItemsJson as any)?.miscItems ?? (miscItemsJson as any);
    if (Array.isArray(miArr)) {
        for (const row of miArr) {
            const enemyName = safeString((row as any)?.enemyName) ?? "enemy";
            const sourceId = srcId(["enemy-item", enemyName]);

            const items = Array.isArray((row as any)?.items) ? (row as any).items : [];
            for (const it of items) {
                const itemName = safeString((it as any)?.itemName);
                if (!itemName) continue;
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Resource by avatar ----------
    // resourceByAvatar.json rows use `source` as the source name.
    const rbaArr = (resourceByAvatarJson as any)?.resourceByAvatar ?? (resourceByAvatarJson as any);
    if (Array.isArray(rbaArr)) {
        for (const row of rbaArr) {
            state.avatarResourceRows += 1;

            const srcName = safeString((row as any)?.source);
            if (!srcName) state.avatarResourceRowsUsingFallback += 1;

            const sourceId = srcName
                ? srcId(["resource-by-avatar", srcName])
                : srcId(["resource-by-avatar", "avatar"]);

            const items = Array.isArray((row as any)?.items) ? (row as any).items : [];
            for (const it of items) {
                const itemName = safeString((it as any)?.item) ?? safeString((it as any)?.itemName);
                if (!itemName) continue;
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    // ---------- Additional item by avatar ----------
    // additionalItemByAvatar.json rows use `source` as the source name.
    const aibaArr = (additionalItemByAvatarJson as any)?.additionalItemByAvatar ?? (additionalItemByAvatarJson as any);
    if (Array.isArray(aibaArr)) {
        for (const row of aibaArr) {
            state.avatarAdditionalRows += 1;

            const srcName = safeString((row as any)?.source);
            if (!srcName) state.avatarAdditionalRowsUsingFallback += 1;

            const sourceId = srcName
                ? srcId(["additional-by-avatar", srcName])
                : srcId(["additional-by-avatar", "avatar"]);

            const items = Array.isArray((row as any)?.items) ? (row as any).items : [];
            for (const it of items) {
                const itemName = safeString((it as any)?.item) ?? safeString((it as any)?.itemName);
                if (!itemName) continue;
                tryAddDropNameToSources(state, itemName, sourceId);
            }
        }
    }

    return state;
}

export function deriveDropDataAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const state = buildJoinStateFromAllDropData();

    const out: Record<string, AcquisitionDef> = {};

    for (const [id, set] of Object.entries(state.itemToSources)) {
        const sources = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
        if (sources.length === 0) continue;
        out[id] = { sources };
    }

    return out;
}

export function deriveDropDataJoinDiagnostics(): DropDataJoinDiagnostics {
    const state = buildJoinStateFromAllDropData();

    const unmatched = Array.from(state.unmatchedUniqueDropNames.values()).sort((a, b) => a.localeCompare(b));

    const ambiguous = Array.from(state.ambiguousUniqueDropNames.entries())
        .map(([dropName, matchedCatalogIds]) => ({
            dropName,
            matchedCatalogIds: [...matchedCatalogIds].sort((a, b) => a.localeCompare(b))
        }))
        .sort((a, b) => a.dropName.localeCompare(b.dropName));

    const excluded = Array.from(state.excludedNonCatalogRewardNames.values()).sort((a, b) => a.localeCompare(b));

    const catalogIdsWithAnySources = Object.keys(state.itemToSources).length;
    const uniqueSourceIds = state.uniqueSourceIds.size;

    return {
        stats: {
            dropNameOccurrences: state.dropNameOccurrences,
            uniqueDropNames: state.uniqueDropNames.size,
            matchedUniqueDropNames: state.matchedUniqueDropNames.size,
            unmatchedUniqueDropNames: state.unmatchedUniqueDropNames.size,
            ambiguousUniqueDropNames: state.ambiguousUniqueDropNames.size,
            catalogIdsWithAnySources,
            uniqueSourceIds,
            excludedNonCatalogRewardNames: state.excludedNonCatalogRewardNames.size,

            avatarResourceRows: state.avatarResourceRows,
            avatarResourceRowsUsingFallback: state.avatarResourceRowsUsingFallback,
            avatarAdditionalRows: state.avatarAdditionalRows,
            avatarAdditionalRowsUsingFallback: state.avatarAdditionalRowsUsingFallback
        },
        samples: {
            unmatchedDropNames: unmatched.slice(0, 200),
            ambiguousDropNames: ambiguous.slice(0, 200),
            excludedNonCatalogRewardNames: excluded.slice(0, 200)
        }
    };
}

