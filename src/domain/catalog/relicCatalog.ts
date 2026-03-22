// src/domain/catalog/relicCatalog.ts
// Indexes all relic data: contents (rewards) and mission farming locations.

import relicsDropRaw from "../../../external/warframe-drop-data/raw/relics.json";
import missionIndexRaw from "../../data/_generated/relic-missionRewards-index.auto.json";

export type RelicTier = "Lith" | "Meso" | "Neo" | "Axi";
export type RelicRarity = "Common" | "Uncommon" | "Rare";

export interface RelicReward {
    itemName: string;
    rarity: RelicRarity;
    /** Drop chance percent (e.g. 25.33 = 25.33%) */
    chance: number;
}

export interface RelicMission {
    /** Human-readable path, e.g. "missionRewards / Eris / Ixodes / C" */
    pathLabel: string;
    rotation: string;
    /** Chance this relic appears in that rotation (percent) */
    chance: number;
}

export interface RelicEntry {
    /** Normalized key, e.g. "axi a1" */
    key: string;
    tier: string;
    relicName: string;
    displayName: string;
    /** Rewards from Intact state */
    rewards: RelicReward[];
    /** Mission locations where this relic drops (empty = vaulted/unavailable) */
    missions: RelicMission[];
    /** True if this relic is currently farmable from missions */
    isActive: boolean;
}

// ---- Parse relics.json (drop data) ----

interface RawRelicEntry {
    tier?: string;
    relicName?: string;
    state?: string;
    rewards?: Array<{ itemName?: string; rarity?: string; chance?: number }>;
}

const _relicByKey = new Map<string, RelicEntry>();
const _relicsByItemName = new Map<string, string[]>(); // itemName → relicKeys

const relicsArr: RawRelicEntry[] = (relicsDropRaw as any)?.relics ?? [];

// Only index "Intact" state entries for standard tiers
for (const r of relicsArr) {
    if (!r.relicName || !r.tier) continue;
    if (r.state !== "Intact") continue;
    // Skip Requiem and Vanguard relics (no relicName-based key needed? they have no relicName)
    const tier = r.tier;
    const relicName = r.relicName;
    const key = `${tier.toLowerCase()} ${relicName.toLowerCase()}`;
    const displayName = `${tier} ${relicName} Relic`;

    const rewards: RelicReward[] = (r.rewards ?? []).map((rw) => ({
        itemName: rw.itemName ?? "",
        rarity: (rw.rarity ?? "Common") as RelicRarity,
        chance: rw.chance ?? 0,
    })).filter((rw) => rw.itemName);

    _relicByKey.set(key, {
        key,
        tier,
        relicName,
        displayName,
        rewards,
        missions: [], // filled below
        isActive: false, // set below
    });

    for (const rw of rewards) {
        if (!rw.itemName) continue;
        const existing = _relicsByItemName.get(rw.itemName) ?? [];
        if (!existing.includes(key)) existing.push(key);
        _relicsByItemName.set(rw.itemName, existing);
    }
}

// ---- Parse mission rewards index ----

interface RawMissionEntry {
    relicKey?: string;
    relicDisplay?: string;
    pathLabel?: string;
    rotation?: string;
    chance?: number;
}

for (const m of missionIndexRaw as RawMissionEntry[]) {
    const relicKey = m.relicKey;
    if (!relicKey) continue;
    const entry = _relicByKey.get(relicKey);
    if (!entry) continue;

    entry.missions.push({
        pathLabel: m.pathLabel ?? "",
        rotation: m.rotation ?? "",
        chance: m.chance ?? 0,
    });
    entry.isActive = true;
}

/** Get a relic entry by its normalized key (e.g. "axi a1"). */
export function getRelicByKey(key: string): RelicEntry | undefined {
    return _relicByKey.get(key.toLowerCase());
}

/** Get all relics that contain an item with the given display name. */
export function getRelicsContainingItem(itemName: string): RelicEntry[] {
    const keys = _relicsByItemName.get(itemName) ?? [];
    return keys.map((k) => _relicByKey.get(k)!).filter(Boolean);
}

/** Get all relic entries (all tiers, all relics). */
export function getAllRelics(): RelicEntry[] {
    return Array.from(_relicByKey.values());
}

/** Get relic entries for a specific tier. */
export function getRelicsByTier(tier: string): RelicEntry[] {
    return getAllRelics().filter((r) => r.tier.toLowerCase() === tier.toLowerCase());
}

/**
 * Given a set of item display names (prime components), returns a scored list of
 * relics ranked by how many of your target items they contain.
 */
export interface ScoredRelic {
    relic: RelicEntry;
    matchedItems: RelicReward[];
    score: number; // higher is better
}

export function scoreRelicsForItems(targetItemNames: Set<string>): ScoredRelic[] {
    const results: ScoredRelic[] = [];

    for (const relic of _relicByKey.values()) {
        const matched = relic.rewards.filter((rw) => targetItemNames.has(rw.itemName));
        if (matched.length === 0) continue;

        // Score = number of matched items weighted by rarity
        // Rare match counts more (it's rare but still desirable to have in 1 relic)
        const score = matched.reduce((sum, rw) => {
            const rarityBonus = rw.rarity === "Rare" ? 1.5 : rw.rarity === "Uncommon" ? 1.1 : 1.0;
            return sum + rarityBonus;
        }, 0);

        results.push({ relic, matchedItems: matched, score });
    }

    return results.sort((a, b) => b.score - a.score || a.relic.key.localeCompare(b.relic.key));
}
