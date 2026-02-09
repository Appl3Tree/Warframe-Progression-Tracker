// src/catalog/sources/sourceCatalog.ts

import { normalizeSourceId, type SourceId } from "../../domain/ids/sourceIds";
import wfcdSourceLabels from "../../data/_generated/wfcd-source-label-map.auto.json";
import { canonicalizeWfItemsLocation } from "./wfItemsLocCanonical";
import { CURATED_SOURCES } from "./curatedSources";

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

// warframe-items/raw (for wfitems:loc sources)
import WARFRAME_ITEMS_ALL from "../../../external/warframe-items/raw/All.json";

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
 * Build a valid data: SourceId payload segment.
 * Use "/" to keep it stable and consistent across layers.
 */
function dataId(parts: string[]): string {
    const cleaned = parts
        .map((p) => safeString(p) ?? "")
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "data:unknown";
    return `data:${cleaned.join("/")}`;
}

/**
 * Build a valid src: SourceId payload segment (no extra colons).
 * MUST match src/catalog/sources/sourceCatalog.ts behavior used elsewhere.
 *
 * This intentionally uses the same tokenization as acquisitionFromDropData.ts:
 * normalizeNameNoPunct -> hyphenated token segments.
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
 * WFCD-derived drop sources (already labeled).
 * Preserve WFCD IDs verbatim (commonly data:drop:<hash>).
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
 *   dataId(["node", planetName, nodeName])
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

            const id = dataId(["node", planetName, nodeName]);
            const gameMode = safeString((nodeObj as any)?.gameMode);
            const label = gameMode ? `${planetName} - ${nodeName} (${gameMode})` : `${planetName} - ${nodeName}`;

            pushUnique(out, seen, id, label, "drop");
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Mission reward sources (typed) derived from missionRewards.json.
 *
 * Emits (canonical):
 *   data:missionreward/<planet>/<node>
 *   data:missionreward/<planet>/<node>/rotationa|rotationb|rotationc
 *
 * NOTE:
 * - Node names in missionRewards.json sometimes include suffixes like "(Caches)" or "(Extra)".
 * - acquisitionFromWarframeItems/acquisitionFromDropData canonicalize those to the base node name.
 * - Therefore we MUST strip those suffixes before tokenization here.
 */
function buildMissionRewardSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    const mrRoot = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);
    if (!mrRoot || typeof mrRoot !== "object" || Array.isArray(mrRoot)) return out;

    const stripNodeSuffix = (s: string): string => s.replace(/\s*\((Caches|Extra)\)\s*$/i, "");

    for (const [planetName, planetObj] of Object.entries(mrRoot as Record<string, any>)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        for (const [nodeNameRaw, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
            if (!nodeObj || typeof nodeObj !== "object") continue;

            const nodeNameBase = stripNodeSuffix(String(nodeNameRaw));

            // Canonical ids (match what your jq script expects: data:missionreward/<planet>/<baseNode>)
            const baseId = dataId(["missionreward", String(planetName), nodeNameBase]);
            const baseLabel = `Mission Reward: ${planetName} / ${nodeNameBase}`;
            pushUnique(out, seen, baseId, baseLabel, "drop");

            const rewards = (nodeObj as any)?.rewards;
            if (!rewards || typeof rewards !== "object" || Array.isArray(rewards)) continue;

            const hasA = Object.prototype.hasOwnProperty.call(rewards, "A");
            const hasB = Object.prototype.hasOwnProperty.call(rewards, "B");
            const hasC = Object.prototype.hasOwnProperty.call(rewards, "C");

            if (hasA) pushUnique(out, seen, dataId(["missionreward", planetName, nodeNameBase, "rotationa"]), `${baseLabel} (Rotation A)`, "drop");
            if (hasB) pushUnique(out, seen, dataId(["missionreward", planetName, nodeNameBase, "rotationb"]), `${baseLabel} (Rotation B)`, "drop");
            if (hasC) pushUnique(out, seen, dataId(["missionreward", planetName, nodeNameBase, "rotationc"]), `${baseLabel} (Rotation C)`, "drop");

            // Optional: legacy aliases (only if older code ever emitted these)
            // - nodeNameRaw includes "(Caches)" -> tokenizes to "<node>-caches"
            // - some layers might have emitted mission-reward or rotation-a style
            //
            // If you want zero-risk compatibility, keep these aliases.
            const legacyBaseId1 = dataId(["mission-reward", String(planetName), String(nodeNameRaw)]);
            if (legacyBaseId1 !== baseId) pushUnique(out, seen, legacyBaseId1, baseLabel, "drop");

            const legacyBaseId2 = dataId(["missionreward", String(planetName), String(nodeNameRaw)]);
            if (legacyBaseId2 !== baseId) pushUnique(out, seen, legacyBaseId2, baseLabel, "drop");

            if (hasA) {
                const legacyRotA1 = dataId(["mission-reward", planetName, nodeNameRaw, "rotationa"]);
                if (legacyRotA1 !== dataId(["missionreward", planetName, nodeNameBase, "rotationa"])) {
                    pushUnique(out, seen, legacyRotA1, `${baseLabel} (Rotation A)`, "drop");
                }
            }
            if (hasB) {
                const legacyRotB1 = dataId(["mission-reward", planetName, nodeNameRaw, "rotationb"]);
                if (legacyRotB1 !== dataId(["missionreward", planetName, nodeNameBase, "rotationb"])) {
                    pushUnique(out, seen, legacyRotB1, `${baseLabel} (Rotation B)`, "drop");
                }
            }
            if (hasC) {
                const legacyRotC1 = dataId(["mission-reward", planetName, nodeNameRaw, "rotationc"]);
                if (legacyRotC1 !== dataId(["missionreward", planetName, nodeNameBase, "rotationc"])) {
                    pushUnique(out, seen, legacyRotC1, `${baseLabel} (Rotation C)`, "drop");
                }
            }
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Cache sources inferred from warframe-items/raw/All.json drop location strings.
 * Emits:
 *   data:caches/<planet>/<node>
 */
function buildWfItemsCacheSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    const locs = new Set<string>();

    const stack: unknown[] = [WARFRAME_ITEMS_ALL as unknown];
    while (stack.length > 0) {
        const cur = stack.pop();
        if (!cur) continue;

        if (Array.isArray(cur)) {
            for (const v of cur) stack.push(v);
            continue;
        }
        if (typeof cur !== "object") continue;

        const obj = cur as Record<string, unknown>;
        for (const v of Object.values(obj)) {
            if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
        }

        const drops = (obj as any).drops;
        if (!Array.isArray(drops)) continue;

        for (const d of drops) {
            const loc = safeString((d as any)?.location);
            if (!loc) continue;
            if (!/\(\s*Caches\s*\)/i.test(loc)) continue;
            locs.add(loc);
        }
    }

    for (const raw of Array.from(locs.values())) {
        const head = safeString(String(raw).split("(")[0] ?? "");
        if (!head) continue;

        const headNoComma = safeString(String(head).split(",")[0] ?? "");
        if (!headNoComma) continue;

        const parts = headNoComma
            .split("/")
            .map((x) => safeString(x))
            .filter(Boolean);

        if (parts.length < 2) continue;

        const planet = parts[0];
        const node = parts.slice(1).join("/");
        if (!planet || !node) continue;

        const id = dataId(["caches", planet, node]);
        const label = `Caches: ${planet} / ${node}`;
        pushUnique(out, seen, id, label, "drop");
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * warframe-items/raw All.json derived wfitems:loc sources.
 * These must exist because acquisitionFromWarframeItems.ts and acquisitionFromWfItemsDrops.ts emit:
 *   data:wfitems:loc:<toToken(location)>
 */
function buildWfItemsLocSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    const locs = new Set<string>();

    const stack: unknown[] = [WARFRAME_ITEMS_ALL as unknown];
    while (stack.length > 0) {
        const cur = stack.pop();

        if (!cur) continue;

        if (Array.isArray(cur)) {
            for (const v of cur) stack.push(v);
            continue;
        }

        if (typeof cur !== "object") continue;

        const obj = cur as Record<string, unknown>;

        for (const v of Object.values(obj)) {
            if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
        }

        const candidates: unknown[] = [];

        if (Array.isArray(obj.drops)) candidates.push(...(obj.drops as unknown[]));
        if (Array.isArray(obj.drop)) candidates.push(...(obj.drop as unknown[]));
        if (Array.isArray(obj.locations)) candidates.push(...(obj.locations as unknown[]));
        if (Array.isArray(obj.location)) candidates.push(...(obj.location as unknown[]));

        for (const c of candidates) {
            if (!c) continue;

            if (typeof c === "string") {
                const s = safeString(c);
                if (s) locs.add(s);
                continue;
            }

            if (typeof c === "object") {
                const co = c as Record<string, unknown>;
                const name = safeString(co.location) ?? safeString(co.name) ?? safeString(co.place) ?? safeString(co.source);
                if (name) locs.add(name);

                for (const v of Object.values(co)) {
                    if (typeof v === "string") {
                        const s = safeString(v);
                        if (s && s.length <= 120) locs.add(s);
                    }
                }
            }
        }
    }

    for (const loc of Array.from(locs.values())) {
        const { canonicalSourceId, canonicalLabel, legacySourceId } = canonicalizeWfItemsLocation(loc);

        const isRelicCanonical = canonicalSourceId.startsWith("data:relic/");

        // For relics, canonical ids already come from relics.json (buildDropDataSupplementSources),
        // so we only keep the legacy wfitems alias to avoid duplicate SourceIds.
        if (!isRelicCanonical) {
            pushUnique(out, seen, canonicalSourceId, canonicalLabel, "drop");
        }

        if (legacySourceId !== canonicalSourceId) {
            pushUnique(out, seen, legacySourceId, `WFItems Location (Legacy): ${loc}`, "drop");
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Additional data:* sources used by drop-data acquisition layers.
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
            const id = dataId(["relic", tier, relicName]);
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
                const id = dataId(["enemy-drop", enemyName]);
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
            const id = dataId(["enemy-drop", enemyName]);
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
                const id = dataId(["enemy-mod", enemyName]);
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
            const id = dataId(["enemy-mod", enemyName]);
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
            const id = dataId(["transient", objectiveName]);
            const label = `Transient Reward: ${objectiveName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Sortie ----
    const srArr = (sortieRewardsJson as any)?.sortieRewards ?? (sortieRewardsJson as any);
    if (Array.isArray(srArr) && srArr.length > 0) {
        pushUnique(out, seen, dataId(["sortie"]), "Sortie Rewards", "drop");
    }

    // ---- Key rewards ----
    const krArr = (keyRewardsJson as any)?.keyRewards ?? (keyRewardsJson as any);
    if (Array.isArray(krArr)) {
        for (const row of krArr) {
            const keyName = safeString((row as any)?.keyName);
            if (!keyName) continue;
            const id = dataId(["key", keyName]);
            const label = `Key Rewards: ${keyName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Bounties (note: source ids use bountyLevel) ----
    const cbArr = (cetusBountyRewardsJson as any)?.cetusBountyRewards ?? (cetusBountyRewardsJson as any);
    if (Array.isArray(cbArr)) {
        for (const row of cbArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "cetus", bountyLevel]);
            const label = `Cetus Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const sbArr = (solarisBountyRewardsJson as any)?.solarisBountyRewards ?? (solarisBountyRewardsJson as any);
    if (Array.isArray(sbArr)) {
        for (const row of sbArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "solaris", bountyLevel]);
            const label = `Solaris Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const drArr = (deimosRewardsJson as any)?.deimosRewards ?? (deimosRewardsJson as any);
    if (Array.isArray(drArr)) {
        for (const row of drArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "deimos", bountyLevel]);
            const label = `Deimos Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const elArr = (entratiLabRewardsJson as any)?.entratiLabRewards ?? (entratiLabRewardsJson as any);
    if (Array.isArray(elArr)) {
        for (const row of elArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "entrati-lab", bountyLevel]);
            const label = `Entrati Lab Reward: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const hxArr = (hexRewardsJson as any)?.hexRewards ?? (hexRewardsJson as any);
    if (Array.isArray(hxArr)) {
        for (const row of hxArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "hex", bountyLevel]);
            const label = `Hex Reward: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const zrArr = (zarimanRewardsJson as any)?.zarimanRewards ?? (zarimanRewardsJson as any);
    if (Array.isArray(zrArr)) {
        for (const row of zrArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "zariman", bountyLevel]);
            const label = `Zariman Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Syndicate vendors ----
    const synRoot = (syndicatesJson as any)?.syndicates ?? (syndicatesJson as any);
    if (synRoot && typeof synRoot === "object" && !Array.isArray(synRoot)) {
        for (const synName of Object.keys(synRoot as Record<string, any>)) {
            const id = dataId(["vendor", "syndicate", synName]);
            const label = `Syndicate Vendor: ${synName}`;
            pushUnique(out, seen, id, label, "vendor");
        }
    }

    // ---- Misc enemy item drops (data:*) ----
    const miArr = (miscItemsJson as any)?.miscItems ?? (miscItemsJson as any);
    if (Array.isArray(miArr)) {
        for (const row of miArr) {
            const enemyName = safeString((row as any)?.enemyName);
            if (!enemyName) continue;
            const id = dataId(["enemy-item", enemyName]);
            const label = `Enemy Item Drop: ${enemyName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Resource by avatar (data:*) ----
    const rbaArr = (resourceByAvatarJson as any)?.resourceByAvatar ?? (resourceByAvatarJson as any);
    if (Array.isArray(rbaArr)) {
        for (const row of rbaArr) {
            const srcName = safeString((row as any)?.source);
            if (!srcName) continue;
            const id = dataId(["resource-by-avatar", srcName]);
            const label = `Resource Drop (Avatar): ${srcName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Additional item by avatar (data:*) ----
    const aibaArr = (additionalItemByAvatarJson as any)?.additionalItemByAvatar ?? (additionalItemByAvatarJson as any);
    if (Array.isArray(aibaArr)) {
        for (const row of aibaArr) {
            const srcName = safeString((row as any)?.source);
            if (!srcName) continue;
            const id = dataId(["additional-item-by-avatar", srcName]);
            const label = `Additional Drop (Avatar): ${srcName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Runtime src:* sources emitted by acquisitionFromDropData.ts (legacy / optional).
 * Keep only the patterns you actually emit somewhere in src/catalog/items.
 */
function buildDropDataRuntimeSrcSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    // src:enemyitem/<enemyName>
    const miArr = (miscItemsJson as any)?.miscItems ?? (miscItemsJson as any);
    if (Array.isArray(miArr)) {
        for (const row of miArr) {
            const enemyName = safeString((row as any)?.enemyName);
            if (!enemyName) continue;

            const id = srcId(["enemyitem", enemyName]);
            const label = `Enemy: ${enemyName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // src:resourcebyavatar/<source>
    const rbaArr = (resourceByAvatarJson as any)?.resourceByAvatar ?? (resourceByAvatarJson as any);
    if (Array.isArray(rbaArr)) {
        for (const row of rbaArr) {
            const srcName = safeString((row as any)?.source);
            if (!srcName) continue;

            const id = srcId(["resourcebyavatar", srcName]);
            const label = `Avatar Drop: ${srcName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

// Exported catalog lists
export const SOURCE_CATALOG: RawSource[] = [
    ...(CURATED_SOURCES as unknown as RawSource[]),
    ...buildWfcdDropSources(),
    ...buildMissionNodeSources(),
    ...buildMissionRewardSources(),
    ...buildWfItemsCacheSources(),
    ...buildWfItemsLocSources(),
    ...buildDropDataSupplementSources(),
    ...buildDropDataRuntimeSrcSources(),
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
            prereqIds: raw.prereqIds,
        };
    }

    return index;
})();

export const SOURCES: Source[] = Object.values(SOURCE_INDEX);
