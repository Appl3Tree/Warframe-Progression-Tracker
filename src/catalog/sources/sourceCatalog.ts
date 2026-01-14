// ===== FILE: src/catalog/sources/sourceCatalog.ts =====
// src/catalog/sources/sourceCatalog.ts

import { normalizeSourceId, type SourceId } from "../../domain/ids/sourceIds";
import wfcdSourceLabels from "../../data/_generated/wfcd-source-label-map.auto.json";

// warframe-drop-data/raw inputs
import missionRewardsJson from "../../../external/warframe-drop-data/raw/missionRewards.json";
import relicsJson from "../../../external/warframe-drop-data/raw/relics.json";
import blueprintLocationsJson from "../../../external/warframe-drop-data/raw/blueprintLocations.json";
import enemyBlueprintTablesJson from "../../../external/warframe-drop-data/raw/enemyBlueprintTables.json";
import modLocationsJson from "../../../external/warframe-drop-data/raw/modLocations.json";
import enemyModTablesJson from "../../../external/warframe-drop-data/raw/enemyModTables.json";
import transientRewardsJson from "../../../external/warframe-drop-data/raw/transientRewards.json";
import sortieRewardsJson from "../../../external/warframe-drop-data/raw/sortieRewards.json";
import cetusBountyRewardsJson from "../../../external/warframe-drop-data/raw/cetusBountyRewards.json";
import solarisBountyRewardsJson from "../../../external/warframe-drop-data/raw/solarisBountyRewards.json";
import deimosRewardsJson from "../../../external/warframe-drop-data/raw/deimosRewards.json";
import entratiLabRewardsJson from "../../../external/warframe-drop-data/raw/entratiLabRewards.json";
import hexRewardsJson from "../../../external/warframe-drop-data/raw/hexRewards.json";
import zarimanRewardsJson from "../../../external/warframe-drop-data/raw/zarimanRewards.json";
import syndicatesJson from "../../../external/warframe-drop-data/raw/syndicates.json";
import miscItemsJson from "../../../external/warframe-drop-data/raw/miscItems.json";
import keyRewardsJson from "../../../external/warframe-drop-data/raw/keyRewards.json";
import resourceByAvatarJson from "../../../external/warframe-drop-data/raw/resourceByAvatar.json";
import additionalItemByAvatarJson from "../../../external/warframe-drop-data/raw/additionalItemByAvatar.json";

export type Source = {
    id: SourceId;
    label: string;
    type: "drop" | "crafting" | "vendor" | "other";
    prereqIds?: string[];
};

export type RawSource = {
    id: string;
    label: string;
    type?: Source["type"];
    prereqIds?: string[];
};

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function normalizeName(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeNameNoPunct(s: string): string {
    return normalizeName(s).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function toToken(s: string): string {
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

/**
 * Build a valid src: SourceId payload segment (no extra colons).
 * MUST match acquisitionFromDropData.ts behavior.
 *
 * Example output:
 * - src:node/ceres/bode
 * - src:vendor/syndicate/conclave
 */
function srcId(parts: string[]): string {
    const cleaned = parts
        .map((p) => safeString(p) ?? "")
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "src:unknown";
    return `src:${cleaned.join("/")}`;
}

function pushUnique(out: RawSource[], seen: Set<string>, id: string, label: string, type: RawSource["type"]): void {
    const sid = safeString(id);
    const lab = safeString(label);
    if (!sid || !lab) return;
    if (seen.has(sid)) return;
    seen.add(sid);
    out.push({ id: sid, label: lab, type });
}

/**
 * Curated non-drop sources.
 * IDs MUST be src:* to align with acquisitionFromDropData.ts output.
 */
const CURATED_SOURCES: RawSource[] = [
    {
        id: srcId(["crafting"]),
        label: "Crafting (Foundry)",
        type: "crafting"
    },
    {
        id: srcId(["market"]),
        label: "Market Purchase",
        type: "vendor"
    }
];

/**
 * Optional helper if you ever want to create src:* aliases for legacy ids.
 * Not used for WFCD anymore (WFCD keys must be preserved as-is).
 */
function coerceToSrcSourceId(raw: string): string {
    const s = safeString(raw) ?? "";
    if (!s) return "src:unknown";
    if (s.startsWith("src:")) return s;

    if (s.startsWith("data:")) {
        const rest = s.slice("data:".length);
        return `src:${rest.replace(/:/g, "/")}`;
    }

    const i = s.indexOf(":");
    if (i > 0) {
        const head = s.slice(0, i);
        const tail = s.slice(i + 1);
        if (head && tail) return `src:${head}/${tail.replace(/:/g, "/")}`;
    }

    return srcId([s]);
}

/**
 * WFCD-derived drop sources (already labeled).
 *
 * IMPORTANT:
 * - Preserve WFCD IDs verbatim (commonly data:drop:<hash>).
 * - These are referenced directly by acquisition layers, so SOURCE_INDEX must include them.
 */
function buildWfcdDropSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    for (const [sid, label] of Object.entries(wfcdSourceLabels as Record<string, string>)) {
        pushUnique(out, seen, sid, label, "drop");
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Mission node sources derived from missionRewards.json.
 * MUST match acquisitionFromDropData.ts:
 *   sourceId = srcId(["node", planetName, nodeName])
 */
function buildMissionNodeSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    const mrRoot = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);
    if (!mrRoot || typeof mrRoot !== "object") return out;

    for (const [planetName, planetObj] of Object.entries(mrRoot as Record<string, any>)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        for (const [nodeName, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
            if (!nodeObj || typeof nodeObj !== "object") continue;

            const id = srcId(["node", planetName, nodeName]);

            const gameMode = safeString((nodeObj as any)?.gameMode);
            const label = gameMode ? `${planetName} - ${nodeName} (${gameMode})` : `${planetName} - ${nodeName}`;

            pushUnique(out, seen, id, label, "drop");
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Additional src:* sources used by acquisitionFromDropData.ts.
 * IMPORTANT: IDs MUST match acquisitionFromDropData.ts srcId([...]) output.
 */
function buildDropDataSupplementSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    // ---- Relics ----
    const relicsArr = (relicsJson as any)?.relics ?? (relicsJson as any);
    if (Array.isArray(relicsArr)) {
        for (const r of relicsArr) {
            const tier = safeString((r as any)?.tier) ?? "relic";
            const relicName = safeString((r as any)?.relicName) ?? "unknown";
            const id = srcId(["relic", tier, relicName]);
            const label = `Relic: ${tier} ${relicName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Blueprint locations / enemy blueprint tables -> enemy-drop ----
    const blArr = (blueprintLocationsJson as any)?.blueprintLocations ?? (blueprintLocationsJson as any);
    if (Array.isArray(blArr)) {
        for (const row of blArr) {
            const enemies = Array.isArray((row as any)?.enemies) ? (row as any).enemies : [];
            for (const e of enemies) {
                const enemyName = safeString((e as any)?.enemyName);
                if (!enemyName) continue;
                const id = srcId(["enemy-drop", enemyName]);
                const label = `Enemy Drop: ${enemyName}`;
                pushUnique(out, seen, id, label, "drop");
            }
        }
    }

    const ebtArr = (enemyBlueprintTablesJson as any)?.enemyBlueprintTables ?? (enemyBlueprintTablesJson as any);
    if (Array.isArray(ebtArr)) {
        for (const row of ebtArr) {
            const enemyName = safeString((row as any)?.enemyName);
            if (!enemyName) continue;
            const id = srcId(["enemy-drop", enemyName]);
            const label = `Enemy Drop: ${enemyName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Mod locations / enemy mod tables -> enemy-mod ----
    const mlArr = (modLocationsJson as any)?.modLocations ?? (modLocationsJson as any);
    if (Array.isArray(mlArr)) {
        for (const row of mlArr) {
            const enemies = Array.isArray((row as any)?.enemies) ? (row as any).enemies : [];
            for (const e of enemies) {
                const enemyName = safeString((e as any)?.enemyName);
                if (!enemyName) continue;
                const id = srcId(["enemy-mod", enemyName]);
                const label = `Enemy Mod Drop: ${enemyName}`;
                pushUnique(out, seen, id, label, "drop");
            }
        }
    }

    const emtArr =
        (enemyModTablesJson as any)?.enemyModTables ??
        (enemyModTablesJson as any)?.modLocations ??
        (enemyModTablesJson as any);

    if (Array.isArray(emtArr)) {
        for (const row of emtArr) {
            const enemyName = safeString((row as any)?.enemyName);
            if (!enemyName) continue;
            const id = srcId(["enemy-mod", enemyName]);
            const label = `Enemy Mod Drop: ${enemyName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Transient rewards ----
    const trArr = (transientRewardsJson as any)?.transientRewards ?? (transientRewardsJson as any);
    if (Array.isArray(trArr)) {
        for (const row of trArr) {
            const objectiveName = safeString((row as any)?.objectiveName);
            if (!objectiveName) continue;

            const id = srcId(["transient", objectiveName]);
            const label = `Transient Reward: ${objectiveName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Sortie ----
    const srArr = (sortieRewardsJson as any)?.sortieRewards ?? (sortieRewardsJson as any);
    if (Array.isArray(srArr) && srArr.length > 0) {
        const id = srcId(["sortie"]);
        const label = "Sortie Rewards";
        pushUnique(out, seen, id, label, "drop");
    }

    // ---- Key rewards ----
    const krArr = (keyRewardsJson as any)?.keyRewards ?? (keyRewardsJson as any);
    if (Array.isArray(krArr)) {
        for (const row of krArr) {
            const keyName = safeString((row as any)?.keyName);
            if (!keyName) continue;

            const id = srcId(["key", keyName]);
            const label = `Key Rewards: ${keyName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Bounties ----
    const cbArr = (cetusBountyRewardsJson as any)?.cetusBountyRewards ?? (cetusBountyRewardsJson as any);
    if (Array.isArray(cbArr)) {
        for (const row of cbArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;

            const id = srcId(["bounty", "cetus", bountyLevel]);
            const label = `Cetus Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const sbArr = (solarisBountyRewardsJson as any)?.solarisBountyRewards ?? (solarisBountyRewardsJson as any);
    if (Array.isArray(sbArr)) {
        for (const row of sbArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;

            const id = srcId(["bounty", "solaris", bountyLevel]);
            const label = `Solaris Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const drArr = (deimosRewardsJson as any)?.deimosRewards ?? (deimosRewardsJson as any);
    if (Array.isArray(drArr)) {
        for (const row of drArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;

            const id = srcId(["bounty", "deimos", bountyLevel]);
            const label = `Deimos Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const elArr = (entratiLabRewardsJson as any)?.entratiLabRewards ?? (entratiLabRewardsJson as any);
    if (Array.isArray(elArr)) {
        for (const row of elArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;

            const id = srcId(["bounty", "entrati-lab", bountyLevel]);
            const label = `Entrati Lab Reward: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const hxArr = (hexRewardsJson as any)?.hexRewards ?? (hexRewardsJson as any);
    if (Array.isArray(hxArr)) {
        for (const row of hxArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;

            const id = srcId(["bounty", "hex", bountyLevel]);
            const label = `Hex Reward: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const zrArr = (zarimanRewardsJson as any)?.zarimanRewards ?? (zarimanRewardsJson as any);
    if (Array.isArray(zrArr)) {
        for (const row of zrArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;

            const id = srcId(["bounty", "zariman", bountyLevel]);
            const label = `Zariman Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Syndicate vendor rewards ----
    const synRoot = (syndicatesJson as any)?.syndicates ?? (syndicatesJson as any);
    if (synRoot && typeof synRoot === "object" && !Array.isArray(synRoot)) {
        for (const synName of Object.keys(synRoot as Record<string, any>)) {
            const id = srcId(["vendor", "syndicate", synName]);
            const label = `Syndicate Vendor: ${synName}`;
            pushUnique(out, seen, id, label, "vendor");
        }
    }

    // ---- Misc enemy item drops ----
    const miArr = (miscItemsJson as any)?.miscItems ?? (miscItemsJson as any);
    if (Array.isArray(miArr)) {
        for (const row of miArr) {
            const enemyName = safeString((row as any)?.enemyName);
            if (!enemyName) continue;

            const id = srcId(["enemy-item", enemyName]);
            const label = `Enemy Item Drop: ${enemyName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Resource by avatar ----
    const rbaArr = (resourceByAvatarJson as any)?.resourceByAvatar ?? (resourceByAvatarJson as any);
    if (Array.isArray(rbaArr)) {
        for (const row of rbaArr) {
            const srcName = safeString((row as any)?.source);
            if (!srcName) continue;

            const id = srcId(["resource-by-avatar", srcName]);
            const label = `Resource Drop (Avatar): ${srcName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Additional item by avatar ----
    const aibaArr = (additionalItemByAvatarJson as any)?.additionalItemByAvatar ?? (additionalItemByAvatarJson as any);
    if (Array.isArray(aibaArr)) {
        for (const row of aibaArr) {
            const srcName = safeString((row as any)?.source);
            if (!srcName) continue;

            const id = srcId(["additional-by-avatar", srcName]);
            const label = `Additional Drop (Avatar): ${srcName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

export const SOURCE_CATALOG: RawSource[] = [
    ...CURATED_SOURCES,
    ...buildWfcdDropSources(),
    ...buildMissionNodeSources(),
    ...buildDropDataSupplementSources()
];

export const SOURCE_INDEX: Record<SourceId, Source> = (() => {
    const index = {} as Record<SourceId, Source>;

    for (const raw of SOURCE_CATALOG) {
        const id = normalizeSourceId(raw.id);

        if (index[id]) {
            throw new Error(`Duplicate SourceId detected: ${id}`);
        }

        index[id] = {
            id,
            label: raw.label,
            type: raw.type ?? "other",
            prereqIds: raw.prereqIds
        };
    }

    return index;
})();

export const SOURCES: Source[] = Object.values(SOURCE_INDEX);

