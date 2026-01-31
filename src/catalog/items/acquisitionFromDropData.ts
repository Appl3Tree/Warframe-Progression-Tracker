// ===== FILE: src/catalog/items/acquisitionFromDropData.ts =====
// src/catalog/items/acquisitionFromDropData.ts

import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

// Generated from warframe-drop-data/raw/missionRewards.json by your scripts
import relicMissionRewardsIndex from "../../data/_generated/relic-missionRewards-index.auto.json";

// warframe-drop-data/raw inputs
import missionRewardsJson from "../../../external/warframe-drop-data/raw/missionRewards.json";
import resourceByAvatarJson from "../../../external/warframe-drop-data/raw/resourceByAvatar.json";
import additionalItemByAvatarJson from "../../../external/warframe-drop-data/raw/additionalItemByAvatar.json";
import miscItemsJson from "../../../external/warframe-drop-data/raw/miscItems.json";
import transientRewardsJson from "../../../external/warframe-drop-data/raw/transientRewards.json";
import solarisBountyRewardsJson from "../../../external/warframe-drop-data/raw/solarisBountyRewards.json";
import cetusBountyRewardsJson from "../../../external/warframe-drop-data/raw/cetusBountyRewards.json";
import deimosRewardsJson from "../../../external/warframe-drop-data/raw/deimosRewards.json";
import entratiLabRewardsJson from "../../../external/warframe-drop-data/raw/entratiLabRewards.json";
import hexRewardsJson from "../../../external/warframe-drop-data/raw/hexRewards.json";
import zarimanRewardsJson from "../../../external/warframe-drop-data/raw/zarimanRewards.json";
import sortieRewardsJson from "../../../external/warframe-drop-data/raw/sortieRewards.json";
import keyRewardsJson from "../../../external/warframe-drop-data/raw/keyRewards.json";
import syndicatesJson from "../../../external/warframe-drop-data/raw/syndicates.json";
import blueprintLocationsJson from "../../../external/warframe-drop-data/raw/blueprintLocations.json";
import enemyBlueprintTablesJson from "../../../external/warframe-drop-data/raw/enemyBlueprintTables.json";

import { MANUAL_ACQUISITION_BY_CATALOG_ID } from "./manualAcquisitionByCatalogId";

// warframe-items raw (name aliasing to avoid generic “Barrels/Blades” displayName collisions)
import WARFRAME_ITEMS_ALL from "../../../external/warframe-items/raw/All.json";

export type AcquisitionDef = {
    sources: string[];
};

type RelicMissionRow = {
    relicKey: string; // e.g. "meso v14"
    relicDisplay: string; // e.g. "Meso V14 Relic"
    pathLabel: string; // e.g. "missionRewards / Ceres / Bode / C"
    rotation: string; // e.g. "C"
    chance: number; // e.g. 9.68
};

type ResourceByAvatarRow = {
    source?: string;
    items?: Array<{
        item?: string;
        rarity?: string;
        chance?: number;
    }>;
};

type AdditionalItemByAvatarRow = {
    source?: string;
    items?: Array<{
        item?: string;
        rarity?: string;
        chance?: number;
    }>;
};

type MiscItemsRow = {
    enemyName?: string;
    items?: Array<{
        itemName?: string;
        rarity?: string;
        chance?: number;
    }>;
};

type TransientRewardsRow = {
    objectiveName?: string;
    rewards?: any;
};

type BountyRow = {
    bountyLevel?: string;
    bountyName?: string;
    name?: string;
    objectiveName?: string;
    rewards?: any;
};

type BlueprintLocationsRow = {
    blueprintName?: string;
    itemName?: string;
    enemies?: Array<{
        enemyName?: string;
        chance?: number;
        rarity?: string;
    }>;
};

type EnemyBlueprintTablesRow = {
    enemyName?: string;
    items?: Array<{
        itemName?: string;
        blueprintName?: string;
        chance?: number;
        rarity?: string;
    }>;
};

function normalizeName(s: string): string {
    return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function foldDiacritics(s: string): string {
    // NFKD splits letters+diacritics, then we remove the diacritic marks
    return (s ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeNameNoPunct(s: string): string {
    const folded = foldDiacritics(s);
    return normalizeName(folded).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function toToken(s: string): string {
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

/**
 * Strip common quantity prefixes from warframe-drop-data itemName values:
 *  - "300X Ferrite" -> "Ferrite"
 *  - "2X Gallium"   -> "Gallium"
 */
function stripQtyPrefix(s: string): string {
    return String(s ?? "").replace(/^\s*\d+\s*[xX]\s*/g, "").trim();
}

/**
 * Build a valid data: SourceId payload segment.
 * For drop-data derived sources we want data:* so access checks treat them as actionable by default,
 * and so they match the ids built in src/catalog/sources/sourceCatalog.ts.
 */
function dataId(parts: string[]): string {
    const cleaned = parts
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "data:unknown";
    return `data:${cleaned.join("/")}`;
}

function uniqSorted(xs: string[]): string[] {
    const set = new Set<string>();
    for (const x of xs) {
        if (typeof x === "string" && x.trim()) set.add(x.trim());
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

function isRelicProjectionCatalogId(catalogId: string): boolean {
    return /\/Types\/Game\/Projections\//i.test(catalogId);
}

/**
 * Extract a normalized relicKey from a displayName for:
 * - Era relics: "Axi A1 Exceptional" or "Axi A1 Relic"
 * - Requiem: "Requiem I Intact" etc.
 * - Vanguard: "Vanguard C1 Radiant" etc.
 */
function relicKeyFromDisplayName(displayName: string): string | null {
    const n = (displayName ?? "").replace(/\s+/g, " ").trim();

    {
        const m = n.match(
            /^\s*(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?\s*$/i
        );
        if (m) return `${m[1].toLowerCase()} ${m[2].toLowerCase()}`;
    }

    {
        const m = n.match(
            /^\s*Requiem\s+(I|II|III|IV)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?\s*$/i
        );
        if (m) return `requiem ${m[1].toLowerCase()}`;
    }

    {
        const m = n.match(
            /^\s*Vanguard\s+([A-Za-z0-9]+)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?\s*$/i
        );
        if (m) return `vanguard ${m[1].toLowerCase()}`;
    }

    return null;
}

function parseMissionRewardsPathLabel(pathLabel: string): { planet: string; node: string; rotation: string | null } | null {
    const parts = (pathLabel ?? "")
        .split("/")
        .map((p) => p.trim())
        .filter(Boolean);
    if (parts.length < 3) return null;

    const planet = parts[1] ?? "";
    const node = parts[2] ?? "";
    if (!planet || !node) return null;

    const rotation = parts.length >= 4 ? (parts[3] ?? null) : null;
    return { planet, node, rotation };
}

function buildRelicKeyToNodeSourcesIndex(): Record<string, string[]> {
    const rows = relicMissionRewardsIndex as unknown as RelicMissionRow[];
    const map = new Map<string, Set<string>>();

    for (const r of rows) {
        const key = normalizeName(r.relicKey);
        if (!key) continue;

        const parsed = parseMissionRewardsPathLabel(r.pathLabel);
        if (!parsed) continue;

        const sid = dataId(["node", parsed.planet, parsed.node]);

        if (!map.has(key)) map.set(key, new Set<string>());
        map.get(key)!.add(sid);
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) {
        out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    }
    return out;
}

const RELIC_NODE_SOURCES_BY_KEY: Record<string, string[]> = buildRelicKeyToNodeSourcesIndex();

function sourcesForRelicProjection(rec: any): { key: string | null; sources: string[] } {
    const name = typeof rec?.displayName === "string" ? rec.displayName : typeof rec?.name === "string" ? rec.name : "";
    const key = relicKeyFromDisplayName(name);
    if (!key) return { key: null, sources: [] };

    const sources = RELIC_NODE_SOURCES_BY_KEY[normalizeName(key)] ?? [];
    return { key, sources };
}

/* =========================================================================================
 * warframe-items name aliasing: uniqueName (/Lotus/...) -> "actual item name"
 * Used only as an alternate join key for drop-data itemName-based tables.
 * ========================================================================================= */

function buildWfItemsUniqueNameToNameIndex(): Record<string, string> {
    const out: Record<string, string> = Object.create(null);

    const stack: unknown[] = [WARFRAME_ITEMS_ALL as unknown];
    while (stack.length > 0) {
        const node = stack.pop();

        if (Array.isArray(node)) {
            for (const v of node) stack.push(v);
            continue;
        }

        if (!node || typeof node !== "object") continue;

        const obj = node as Record<string, unknown>;
        for (const v of Object.values(obj)) stack.push(v);

        const uniqueName = typeof obj.uniqueName === "string" ? obj.uniqueName : null;
        const name = typeof obj.name === "string" ? obj.name : null;
        if (!uniqueName || !name) continue;

        const clean = name.trim();
        if (!clean) continue;

        if (!out[uniqueName]) out[uniqueName] = clean;
    }

    return out;
}

const WFITEMS_NAME_BY_UNIQUENAME: Record<string, string> = buildWfItemsUniqueNameToNameIndex();

function lotusPathFromCatalogId(catalogId: string): string | null {
    const s = String(catalogId);
    const idx = s.indexOf(":/Lotus/");
    if (idx === -1) return null;
    return s.slice(idx + 1);
}

function candidateNameKeysForRecord(catalogId: string, rec: any): string[] {
    const keys: string[] = [];

    const primary =
        typeof rec?.displayName === "string" ? rec.displayName : typeof rec?.name === "string" ? rec.name : "";
    const k1 = normalizeNameNoPunct(primary);
    if (k1) keys.push(k1);

    const lotus = lotusPathFromCatalogId(catalogId);
    if (lotus) {
        const alias = WFITEMS_NAME_BY_UNIQUENAME[lotus];
        const k2 = normalizeNameNoPunct(alias ?? "");
        if (k2 && !keys.includes(k2)) keys.push(k2);

        if (alias) {
            const aliasNoBp = alias.replace(/\bBlueprint\b/i, "").trim();
            const k3 = normalizeNameNoPunct(aliasNoBp);
            if (k3 && !keys.includes(k3)) keys.push(k3);
        }
    }

    if (primary) {
        const pNoBp = primary.replace(/\bBlueprint\b/i, "").trim();
        const k4 = normalizeNameNoPunct(pNoBp);
        if (k4 && !keys.includes(k4)) keys.push(k4);
    }

    return keys;
}

/* =========================================================================================
 * Generic traverser: collect itemName-ish fields from arbitrary nested reward objects.
 * ========================================================================================= */

function collectItemNameKeysDeep(root: any): string[] {
    const out: string[] = [];
    const stack: any[] = [root];

    while (stack.length > 0) {
        const cur = stack.pop();
        if (!cur) continue;

        if (Array.isArray(cur)) {
            for (const v of cur) stack.push(v);
            continue;
        }

        if (typeof cur !== "object") continue;

        const c: any = cur;

        const candidates: string[] = [];
        if (typeof c.itemName === "string") candidates.push(c.itemName);
        if (typeof c.item === "string") candidates.push(c.item);
        if (typeof c.name === "string") candidates.push(c.name);
        if (typeof c.blueprintName === "string") candidates.push(c.blueprintName);

        for (const raw of candidates) {
            const canonical = stripQtyPrefix(String(raw));
            const key = normalizeNameNoPunct(canonical);
            if (key) out.push(key);
        }

        for (const v of Object.values(c)) {
            if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
        }
    }

    return out;
}

/* =========================================================================================
 * missionRewards / transient / bounties / resourceByAvatar / additionalItemByAvatar / miscItems
 * ========================================================================================= */

function buildMissionRewardsItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);
    if (!root || typeof root !== "object" || Array.isArray(root)) return {};

    const map = new Map<string, Set<string>>();

    for (const [planetName, planetObj] of Object.entries(root as Record<string, any>)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        for (const [nodeName, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
            if (!nodeObj || typeof nodeObj !== "object") continue;

            const sid = dataId(["node", String(planetName), String(nodeName)]);

            const stack: any[] = [nodeObj];
            while (stack.length > 0) {
                const cur = stack.pop();
                if (!cur) continue;

                if (Array.isArray(cur)) {
                    for (const v of cur) stack.push(v);
                    continue;
                }

                if (typeof cur !== "object") continue;

                if (typeof (cur as any).itemName === "string") {
                    const raw = String((cur as any).itemName);
                    const canonical = stripQtyPrefix(raw);
                    const key = normalizeNameNoPunct(canonical);
                    if (key) {
                        if (!map.has(key)) map.set(key, new Set<string>());
                        map.get(key)!.add(sid);
                    }
                }

                for (const v of Object.values(cur)) {
                    if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
                }
            }
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

function buildTransientRewardsItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (transientRewardsJson as any)?.transientRewards ?? (transientRewardsJson as any);
    const rows: TransientRewardsRow[] = Array.isArray(root) ? (root as TransientRewardsRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const objName = typeof row?.objectiveName === "string" ? row.objectiveName.trim() : "";
        if (!objName) continue;

        const sid = dataId(["transient", objName]);

        const stack: any[] = [];
        if (row && typeof row === "object") {
            const rewards = (row as any).rewards;
            if (rewards !== undefined) stack.push(rewards);
        }

        while (stack.length > 0) {
            const cur = stack.pop();
            if (!cur) continue;

            if (Array.isArray(cur)) {
                for (const v of cur) stack.push(v);
                continue;
            }

            if (typeof cur !== "object") continue;

            if (typeof (cur as any).itemName === "string") {
                const raw = String((cur as any).itemName);
                const canonical = stripQtyPrefix(raw);
                const key = normalizeNameNoPunct(canonical);
                if (key) {
                    if (!map.has(key)) map.set(key, new Set<string>());
                    map.get(key)!.add(sid);
                }
            }

            for (const v of Object.values(cur)) {
                if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
            }
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

/**
 * Generic bounty builder.
 * Aligns with sourceCatalog.ts which emits: data:bounty/<regionToken>/<bountyLevel>
 */
function buildBountyItemNameToSourcesIndex(bountyJson: any, regionToken: string): Record<string, string[]> {
    const root =
        (bountyJson as any)?.cetusBountyRewards ??
        (bountyJson as any)?.solarisBountyRewards ??
        (bountyJson as any)?.deimosRewards ??
        (bountyJson as any)?.entratiLabRewards ??
        (bountyJson as any)?.hexRewards ??
        (bountyJson as any)?.zarimanRewards ??
        bountyJson;

    const rows: BountyRow[] = Array.isArray(root) ? (root as BountyRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const level =
            typeof row?.bountyLevel === "string"
                ? row.bountyLevel.trim()
                : typeof row?.bountyName === "string"
                  ? row.bountyName.trim()
                  : typeof row?.name === "string"
                    ? row.name.trim()
                    : typeof row?.objectiveName === "string"
                      ? row.objectiveName.trim()
                      : "";

        if (!level) continue;

        const sid = dataId(["bounty", regionToken, level]);

        const keys = collectItemNameKeysDeep(row);
        for (const k of keys) {
            if (!map.has(k)) map.set(k, new Set<string>());
            map.get(k)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

function buildResourceByAvatarItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (resourceByAvatarJson as any)?.resourceByAvatar ?? (resourceByAvatarJson as any);
    const rows: ResourceByAvatarRow[] = Array.isArray(root) ? (root as ResourceByAvatarRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const source = typeof row?.source === "string" ? row.source.trim() : "";
        if (!source) continue;

        const sid = dataId(["resource-by-avatar", source]);

        const items = Array.isArray(row?.items) ? row.items : [];
        for (const it of items) {
            const itemName = typeof it?.item === "string" ? it.item.trim() : "";
            if (!itemName) continue;

            const key = normalizeNameNoPunct(itemName);
            if (!key) continue;

            if (!map.has(key)) map.set(key, new Set<string>());
            map.get(key)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

function buildAdditionalItemByAvatarItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (additionalItemByAvatarJson as any)?.additionalItemByAvatar ?? (additionalItemByAvatarJson as any);
    const rows: AdditionalItemByAvatarRow[] = Array.isArray(root) ? (root as AdditionalItemByAvatarRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const source = typeof row?.source === "string" ? row.source.trim() : "";
        if (!source) continue;

        const sid = dataId(["additional-item-by-avatar", source]);

        const items = Array.isArray(row?.items) ? row.items : [];
        for (const it of items) {
            const itemName = typeof it?.item === "string" ? it.item.trim() : "";
            if (!itemName) continue;

            const key = normalizeNameNoPunct(itemName);
            if (!key) continue;

            if (!map.has(key)) map.set(key, new Set<string>());
            map.get(key)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

function buildMiscItemsItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (miscItemsJson as any)?.miscItems ?? (miscItemsJson as any);
    const rows: MiscItemsRow[] = Array.isArray(root) ? (root as MiscItemsRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const enemy = typeof row?.enemyName === "string" ? row.enemyName.trim() : "";
        if (!enemy) continue;

        const sid = dataId(["enemy-item", enemy]);

        const items = Array.isArray(row?.items) ? row.items : [];
        for (const it of items) {
            const itemName = typeof it?.itemName === "string" ? it.itemName.trim() : "";
            if (!itemName) continue;

            const key = normalizeNameNoPunct(itemName);
            if (!key) continue;

            if (!map.has(key)) map.set(key, new Set<string>());
            map.get(key)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

/* =========================================================================================
 * keyRewards / sortieRewards / syndicates
 * ========================================================================================= */

function buildKeyRewardsItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (keyRewardsJson as any)?.keyRewards ?? (keyRewardsJson as any);
    const rows: any[] = Array.isArray(root) ? root : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const keyName = typeof row?.keyName === "string" ? row.keyName.trim() : "";
        if (!keyName) continue;

        const sid = dataId(["key", keyName]);

        const keys = collectItemNameKeysDeep(row);
        for (const k of keys) {
            if (!map.has(k)) map.set(k, new Set<string>());
            map.get(k)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

function buildSortieRewardsItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (sortieRewardsJson as any)?.sortieRewards ?? (sortieRewardsJson as any);
    const rows: any[] = Array.isArray(root) ? root : [];

    const map = new Map<string, Set<string>>();
    const sid = dataId(["sortie"]);

    for (const row of rows) {
        const keys = collectItemNameKeysDeep(row);
        for (const k of keys) {
            if (!map.has(k)) map.set(k, new Set<string>());
            map.get(k)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

function buildSyndicateVendorItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (syndicatesJson as any)?.syndicates ?? (syndicatesJson as any);
    if (!root || typeof root !== "object" || Array.isArray(root)) return {};

    const map = new Map<string, Set<string>>();

    for (const [synName, synObj] of Object.entries(root as Record<string, any>)) {
        const sid = dataId(["vendor", "syndicate", synName]);

        const keys = collectItemNameKeysDeep(synObj);
        for (const k of keys) {
            if (!map.has(k)) map.set(k, new Set<string>());
            map.get(k)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

/* =========================================================================================
 * blueprintLocations / enemyBlueprintTables (enemy blueprint drop sources)
 * ========================================================================================= */

function buildBlueprintLocationsItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (blueprintLocationsJson as any)?.blueprintLocations ?? (blueprintLocationsJson as any);
    const rows: BlueprintLocationsRow[] = Array.isArray(root) ? (root as BlueprintLocationsRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const enemies = Array.isArray(row?.enemies) ? row.enemies : [];
        if (enemies.length === 0) continue;

        const nameRaw =
            typeof row?.blueprintName === "string"
                ? row.blueprintName
                : typeof row?.itemName === "string"
                  ? row.itemName
                  : "";

        const name = stripQtyPrefix(nameRaw).trim();
        if (!name) continue;

        const key = normalizeNameNoPunct(name);
        if (!key) continue;

        for (const e of enemies) {
            const enemyName = typeof e?.enemyName === "string" ? e.enemyName.trim() : "";
            if (!enemyName) continue;

            const sid = dataId(["enemy-drop", enemyName]);

            if (!map.has(key)) map.set(key, new Set<string>());
            map.get(key)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

function buildEnemyBlueprintTablesItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (enemyBlueprintTablesJson as any)?.enemyBlueprintTables ?? (enemyBlueprintTablesJson as any);
    const rows: EnemyBlueprintTablesRow[] = Array.isArray(root) ? (root as EnemyBlueprintTablesRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const enemyName = typeof row?.enemyName === "string" ? row.enemyName.trim() : "";
        if (!enemyName) continue;

        const sid = dataId(["enemy-drop", enemyName]);

        const items = Array.isArray(row?.items) ? row.items : [];
        for (const it of items) {
            const raw =
                typeof it?.itemName === "string"
                    ? it.itemName
                    : typeof it?.blueprintName === "string"
                      ? it.blueprintName
                      : "";

            const name = stripQtyPrefix(raw).trim();
            if (!name) continue;

            const key = normalizeNameNoPunct(name);
            if (!key) continue;

            if (!map.has(key)) map.set(key, new Set<string>());
            map.get(key)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

// Build once (fast lookup during catalog scan)
const MISSION_REWARDS_SOURCES_BY_ITEM: Record<string, string[]> = buildMissionRewardsItemNameToSourcesIndex();
const TRANSIENT_REWARDS_SOURCES_BY_ITEM: Record<string, string[]> = buildTransientRewardsItemNameToSourcesIndex();

// Bounties (aligned to bountyLevel IDs)
const CETUS_BOUNTY_SOURCES_BY_ITEM: Record<string, string[]> = buildBountyItemNameToSourcesIndex(cetusBountyRewardsJson, "cetus");
const SOLARIS_BOUNTY_SOURCES_BY_ITEM: Record<string, string[]> = buildBountyItemNameToSourcesIndex(solarisBountyRewardsJson, "solaris");
const DEIMOS_BOUNTY_SOURCES_BY_ITEM: Record<string, string[]> = buildBountyItemNameToSourcesIndex(deimosRewardsJson, "deimos");
const ENTRATI_LAB_SOURCES_BY_ITEM: Record<string, string[]> = buildBountyItemNameToSourcesIndex(entratiLabRewardsJson, "entrati-lab");
const HEX_SOURCES_BY_ITEM: Record<string, string[]> = buildBountyItemNameToSourcesIndex(hexRewardsJson, "hex");
const ZARIMAN_BOUNTY_SOURCES_BY_ITEM: Record<string, string[]> = buildBountyItemNameToSourcesIndex(zarimanRewardsJson, "zariman");

const RESOURCE_BY_AVATAR_SOURCES_BY_ITEM: Record<string, string[]> = buildResourceByAvatarItemNameToSourcesIndex();
const ADDITIONAL_ITEM_BY_AVATAR_SOURCES_BY_ITEM: Record<string, string[]> = buildAdditionalItemByAvatarItemNameToSourcesIndex();
const MISC_ITEMS_SOURCES_BY_ITEM: Record<string, string[]> = buildMiscItemsItemNameToSourcesIndex();

const KEY_REWARDS_SOURCES_BY_ITEM: Record<string, string[]> = buildKeyRewardsItemNameToSourcesIndex();
const SORTIE_REWARDS_SOURCES_BY_ITEM: Record<string, string[]> = buildSortieRewardsItemNameToSourcesIndex();
const SYNDICATE_VENDOR_SOURCES_BY_ITEM: Record<string, string[]> = buildSyndicateVendorItemNameToSourcesIndex();

const BLUEPRINT_LOCATIONS_SOURCES_BY_ITEM: Record<string, string[]> = buildBlueprintLocationsItemNameToSourcesIndex();
const ENEMY_BLUEPRINT_TABLES_SOURCES_BY_ITEM: Record<string, string[]> = buildEnemyBlueprintTablesItemNameToSourcesIndex();

export function deriveDropDataAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};

    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    const allIds = Object.keys(recordsById);

    for (const id of allIds) {
        const rec: any = recordsById[id];
        if (!rec) continue;

        const catalogId = String(id);
        const sources: string[] = [];

        // --- Relic projection items (Axi A1 Intact, etc.) ---
        if (isRelicProjectionCatalogId(catalogId)) {
            const r = sourcesForRelicProjection(rec);
            sources.push(...r.sources);
        }

        // --- Name-based joins (drop tables) with alias support ---
        const candidateKeys = candidateNameKeysForRecord(catalogId, rec);

        for (const nameKey of candidateKeys) {
            const mr = MISSION_REWARDS_SOURCES_BY_ITEM[nameKey] ?? [];
            if (mr.length > 0) sources.push(...mr);

            const tr = TRANSIENT_REWARDS_SOURCES_BY_ITEM[nameKey] ?? [];
            if (tr.length > 0) sources.push(...tr);

            const cb = CETUS_BOUNTY_SOURCES_BY_ITEM[nameKey] ?? [];
            if (cb.length > 0) sources.push(...cb);

            const sb = SOLARIS_BOUNTY_SOURCES_BY_ITEM[nameKey] ?? [];
            if (sb.length > 0) sources.push(...sb);

            const dr = DEIMOS_BOUNTY_SOURCES_BY_ITEM[nameKey] ?? [];
            if (dr.length > 0) sources.push(...dr);

            const el = ENTRATI_LAB_SOURCES_BY_ITEM[nameKey] ?? [];
            if (el.length > 0) sources.push(...el);

            const hx = HEX_SOURCES_BY_ITEM[nameKey] ?? [];
            if (hx.length > 0) sources.push(...hx);

            const zr = ZARIMAN_BOUNTY_SOURCES_BY_ITEM[nameKey] ?? [];
            if (zr.length > 0) sources.push(...zr);

            const rba = RESOURCE_BY_AVATAR_SOURCES_BY_ITEM[nameKey] ?? [];
            if (rba.length > 0) sources.push(...rba);

            const aiba = ADDITIONAL_ITEM_BY_AVATAR_SOURCES_BY_ITEM[nameKey] ?? [];
            if (aiba.length > 0) sources.push(...aiba);

            const mi = MISC_ITEMS_SOURCES_BY_ITEM[nameKey] ?? [];
            if (mi.length > 0) sources.push(...mi);

            const kr = KEY_REWARDS_SOURCES_BY_ITEM[nameKey] ?? [];
            if (kr.length > 0) sources.push(...kr);

            const sr = SORTIE_REWARDS_SOURCES_BY_ITEM[nameKey] ?? [];
            if (sr.length > 0) sources.push(...sr);

            const syn = SYNDICATE_VENDOR_SOURCES_BY_ITEM[nameKey] ?? [];
            if (syn.length > 0) sources.push(...syn);

            const bl = BLUEPRINT_LOCATIONS_SOURCES_BY_ITEM[nameKey] ?? [];
            if (bl.length > 0) sources.push(...bl);

            const ebt = ENEMY_BLUEPRINT_TABLES_SOURCES_BY_ITEM[nameKey] ?? [];
            if (ebt.length > 0) sources.push(...ebt);
        }

        // --- Manual overrides (must win / always included) ---
        const manual = MANUAL_ACQUISITION_BY_CATALOG_ID[catalogId] ?? [];
        if (manual.length > 0) sources.push(...manual);

        if (sources.length > 0) {
            out[catalogId] = { sources: uniqSorted(sources) };
        }
    }

    return out;
}

// Diagnostics left unchanged from your original (kept intentionally).
export type DropDataJoinDiagnostics = {
    relicProjections: {
        total: number;
        keyParsed: number;
        keyMissing: number;
        keyInMissionIndex: number;
        keyNotInMissionIndex: number;
        withSources: number;
        withoutSources: number;
        sampleMissing: Array<{
            id: string;
            name: string;
            key: string | null;
            reason: "no-key" | "key-not-in-index" | "index-has-no-sources";
        }>;
    };

    nameJoins: {
        missionRewardsKeys: number;
        transientRewardsKeys: number;

        cetusBountyKeys: number;
        solarisBountyKeys: number;
        deimosBountyKeys: number;
        entratiLabKeys: number;
        hexKeys: number;
        zarimanBountyKeys: number;

        resourceByAvatarKeys: number;
        additionalItemByAvatarKeys: number;
        miscItemsKeys: number;

        keyRewardsKeys: number;
        sortieRewardsKeys: number;
        syndicateVendorKeys: number;

        blueprintLocationsKeys: number;
        enemyBlueprintTablesKeys: number;

        sampleMissionRewardsKeys: string[];
        sampleTransientRewardsKeys: string[];
        sampleCetusBountyKeys: string[];
        sampleSolarisBountyKeys: string[];
        sampleDeimosBountyKeys: string[];
        sampleEntratiLabKeys: string[];
        sampleHexKeys: string[];
        sampleZarimanBountyKeys: string[];
        sampleResourceByAvatarKeys: string[];
        sampleAdditionalItemByAvatarKeys: string[];
        sampleMiscItemsKeys: string[];
        sampleKeyRewardsKeys: string[];
        sampleSortieRewardsKeys: string[];
        sampleSyndicateVendorKeys: string[];
        sampleBlueprintLocationsKeys: string[];
        sampleEnemyBlueprintTablesKeys: string[];
    };

    wfitemsAlias: {
        uniqueNamesWithNames: number;
        sampleAliases: Array<{ uniqueName: string; name: string }>;
    };
};

export function deriveDropDataJoinDiagnostics(): DropDataJoinDiagnostics {
    let total = 0;
    let keyParsed = 0;
    let keyMissing = 0;

    let keyInMissionIndex = 0;
    let keyNotInMissionIndex = 0;

    let withSources = 0;
    let withoutSources = 0;

    const sampleMissing: DropDataJoinDiagnostics["relicProjections"]["sampleMissing"] = [];

    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    const allIds = Object.keys(recordsById);

    for (const id of allIds) {
        const rec: any = recordsById[id];
        if (!rec) continue;

        const catalogId = String(id);
        if (!isRelicProjectionCatalogId(catalogId)) continue;

        total += 1;

        const name = typeof rec?.displayName === "string" ? rec.displayName : typeof rec?.name === "string" ? rec.name : "";

        const key = relicKeyFromDisplayName(name);

        if (!key) {
            keyMissing += 1;
            if (sampleMissing.length < 50) sampleMissing.push({ id: catalogId, name, key: null, reason: "no-key" });
            continue;
        }

        keyParsed += 1;

        const normKey = normalizeName(key);
        const inIndex = Object.prototype.hasOwnProperty.call(RELIC_NODE_SOURCES_BY_KEY, normKey);

        if (!inIndex) {
            keyNotInMissionIndex += 1;
            if (sampleMissing.length < 50) sampleMissing.push({ id: catalogId, name, key, reason: "key-not-in-index" });
            continue;
        }

        keyInMissionIndex += 1;

        const sources = RELIC_NODE_SOURCES_BY_KEY[normKey] ?? [];
        if (sources.length > 0) withSources += 1;
        else {
            withoutSources += 1;
            if (sampleMissing.length < 50) {
                sampleMissing.push({ id: catalogId, name, key, reason: "index-has-no-sources" });
            }
        }
    }

    const mrKeys = Object.keys(MISSION_REWARDS_SOURCES_BY_ITEM);
    const trKeys = Object.keys(TRANSIENT_REWARDS_SOURCES_BY_ITEM);

    const cbKeys = Object.keys(CETUS_BOUNTY_SOURCES_BY_ITEM);
    const sbKeys = Object.keys(SOLARIS_BOUNTY_SOURCES_BY_ITEM);
    const drKeys = Object.keys(DEIMOS_BOUNTY_SOURCES_BY_ITEM);
    const elKeys = Object.keys(ENTRATI_LAB_SOURCES_BY_ITEM);
    const hxKeys = Object.keys(HEX_SOURCES_BY_ITEM);
    const zrKeys = Object.keys(ZARIMAN_BOUNTY_SOURCES_BY_ITEM);

    const rbaKeys = Object.keys(RESOURCE_BY_AVATAR_SOURCES_BY_ITEM);
    const aibaKeys = Object.keys(ADDITIONAL_ITEM_BY_AVATAR_SOURCES_BY_ITEM);
    const miKeys = Object.keys(MISC_ITEMS_SOURCES_BY_ITEM);

    const krKeys = Object.keys(KEY_REWARDS_SOURCES_BY_ITEM);
    const srKeys = Object.keys(SORTIE_REWARDS_SOURCES_BY_ITEM);
    const synKeys = Object.keys(SYNDICATE_VENDOR_SOURCES_BY_ITEM);

    const blKeys = Object.keys(BLUEPRINT_LOCATIONS_SOURCES_BY_ITEM);
    const ebtKeys = Object.keys(ENEMY_BLUEPRINT_TABLES_SOURCES_BY_ITEM);

    const wfKeys = Object.keys(WFITEMS_NAME_BY_UNIQUENAME);
    const sampleAliases: Array<{ uniqueName: string; name: string }> = [];
    for (const k of wfKeys.slice(0, 25)) {
        sampleAliases.push({ uniqueName: k, name: WFITEMS_NAME_BY_UNIQUENAME[k] });
    }

    return {
        relicProjections: {
            total,
            keyParsed,
            keyMissing,
            keyInMissionIndex,
            keyNotInMissionIndex,
            withSources,
            withoutSources,
            sampleMissing
        },
        nameJoins: {
            missionRewardsKeys: mrKeys.length,
            transientRewardsKeys: trKeys.length,

            cetusBountyKeys: cbKeys.length,
            solarisBountyKeys: sbKeys.length,
            deimosBountyKeys: drKeys.length,
            entratiLabKeys: elKeys.length,
            hexKeys: hxKeys.length,
            zarimanBountyKeys: zrKeys.length,

            resourceByAvatarKeys: rbaKeys.length,
            additionalItemByAvatarKeys: aibaKeys.length,
            miscItemsKeys: miKeys.length,

            keyRewardsKeys: krKeys.length,
            sortieRewardsKeys: srKeys.length,
            syndicateVendorKeys: synKeys.length,

            blueprintLocationsKeys: blKeys.length,
            enemyBlueprintTablesKeys: ebtKeys.length,

            sampleMissionRewardsKeys: mrKeys.slice(0, 25),
            sampleTransientRewardsKeys: trKeys.slice(0, 25),

            sampleCetusBountyKeys: cbKeys.slice(0, 25),
            sampleSolarisBountyKeys: sbKeys.slice(0, 25),
            sampleDeimosBountyKeys: drKeys.slice(0, 25),
            sampleEntratiLabKeys: elKeys.slice(0, 25),
            sampleHexKeys: hxKeys.slice(0, 25),
            sampleZarimanBountyKeys: zrKeys.slice(0, 25),

            sampleResourceByAvatarKeys: rbaKeys.slice(0, 25),
            sampleAdditionalItemByAvatarKeys: aibaKeys.slice(0, 25),
            sampleMiscItemsKeys: miKeys.slice(0, 25),

            sampleKeyRewardsKeys: krKeys.slice(0, 25),
            sampleSortieRewardsKeys: srKeys.slice(0, 25),
            sampleSyndicateVendorKeys: synKeys.slice(0, 25),

            sampleBlueprintLocationsKeys: blKeys.slice(0, 25),
            sampleEnemyBlueprintTablesKeys: ebtKeys.slice(0, 25)
        },
        wfitemsAlias: {
            uniqueNamesWithNames: wfKeys.length,
            sampleAliases
        }
    };
}

