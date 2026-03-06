// src/domain/logic/masteryEngine.ts
// 10.1-10.2 Mastery Rank Planner

/**
 * Warframe Mastery Rank XP thresholds.
 * Each entry is the CUMULATIVE XP required to REACH that rank.
 * Source: Warframe wiki / in-game data.
 */
export const MR_XP_THRESHOLDS: Record<number, number> = {
    0: 0,
    1: 7_500,
    2: 15_000,
    3: 22_500,
    4: 30_000,
    5: 40_000,
    6: 55_000,
    7: 70_000,
    8: 90_000,
    9: 110_000,
    10: 130_000,
    11: 155_000,
    12: 185_000,
    13: 215_000,
    14: 245_000,
    15: 275_000,
    16: 305_000,
    17: 340_000,
    18: 380_000,
    19: 420_000,
    20: 460_000,
    21: 500_000,
    22: 550_000,
    23: 600_000,
    24: 650_000,
    25: 700_000,
    26: 760_000,
    27: 830_000,
    28: 910_000,
    29: 1_000_000,
    30: 1_100_000,
    31: 1_210_000,
    32: 1_330_000,
    33: 1_460_000,
    34: 1_600_000,
    35: 1_750_000
};

/** Maximum tracked MR rank. */
export const MAX_MR = 35;

/**
 * Returns the cumulative XP threshold to reach the given MR.
 * For ranks beyond our table, extrapolates linearly.
 */
export function xpForRank(rank: number): number {
    const r = Math.max(0, Math.floor(rank));
    if (r in MR_XP_THRESHOLDS) return MR_XP_THRESHOLDS[r];

    // Extrapolate beyond MAX_MR: use last known increment
    const lastKnown = MR_XP_THRESHOLDS[MAX_MR] ?? 1_750_000;
    const secondLastKnown = MR_XP_THRESHOLDS[MAX_MR - 1] ?? 1_600_000;
    const increment = lastKnown - secondLastKnown;
    return lastKnown + (r - MAX_MR) * increment;
}

/** Mastery XP awarded when mastering each item category (approximate in-game values). */
export const MASTERY_XP_BY_CATEGORY = {
    warframe: 6_000,
    weapon: 3_000,
    companion: 3_000,
    archwing: 6_000,
    necramech: 6_000,
    vehicle: 3_000,
    kitgun: 3_000,
    zaw: 3_000,
    amp: 3_000,
    default: 3_000
} as const;

export type MasteryResult = {
    /** Total mastery XP earned (sum of xpByItem values). */
    totalXp: number;
    /** Computed MR from totalXp (may differ from player's self-reported MR). */
    computedMr: number;
    /** Player's self-reported MR (from store). */
    reportedMr: number | null;
    /** Effective MR to use for display (reported if set, else computed). */
    effectiveMr: number;
    /** XP at start of current rank. */
    currentRankStartXp: number;
    /** XP required to reach the next rank. */
    nextRankXp: number;
    /** XP gained within the current rank band. */
    xpIntoCurrentRank: number;
    /** XP remaining to reach the next rank. */
    xpRemainingToNextRank: number;
    /** Progress within the current rank band (0.0 - 1.0). */
    progressFraction: number;
    /** Whether the player has hit the max tracked rank. */
    isMaxRank: boolean;
};

/**
 * Computes mastery rank progress from the store's mastery data.
 *
 * - totalXp: sum of mastery.xpByItem (populated by profile import)
 * - If xpByItem is empty, falls back to reportedMr for display
 */
export function computeMasteryResult(args: {
    xpByItem: Record<string, number>;
    masteryRank: number | null;
}): MasteryResult {
    const { xpByItem, masteryRank } = args;

    const totalXp = Object.values(xpByItem ?? {}).reduce((sum, v) => {
        const n = typeof v === "number" ? v : Number(v);
        return sum + (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
    }, 0);

    // Determine computed MR from XP
    let computedMr = 0;
    for (let r = MAX_MR; r >= 0; r--) {
        if (totalXp >= xpForRank(r)) {
            computedMr = r;
            break;
        }
    }

    const reportedMr = typeof masteryRank === "number" && Number.isFinite(masteryRank)
        ? Math.max(0, Math.floor(masteryRank))
        : null;

    // Effective MR: prefer reported if XP data is absent or zero
    const effectiveMr = totalXp > 0 ? computedMr : (reportedMr ?? 0);

    const isMaxRank = effectiveMr >= MAX_MR;
    const currentRankStartXp = xpForRank(effectiveMr);
    const nextRankXp = isMaxRank ? xpForRank(MAX_MR) : xpForRank(effectiveMr + 1);

    const rankBandWidth = Math.max(1, nextRankXp - currentRankStartXp);
    const xpIntoCurrentRank = totalXp > 0 ? Math.max(0, totalXp - currentRankStartXp) : 0;
    const xpRemainingToNextRank = isMaxRank ? 0 : Math.max(0, nextRankXp - Math.max(totalXp, currentRankStartXp));

    // If no XP data, show progress based on reported MR (unknown within-rank progress)
    const progressFraction = totalXp > 0 && !isMaxRank
        ? Math.min(1, xpIntoCurrentRank / rankBandWidth)
        : (isMaxRank ? 1 : 0);

    return {
        totalXp,
        computedMr,
        reportedMr,
        effectiveMr,
        currentRankStartXp,
        nextRankXp,
        xpIntoCurrentRank,
        xpRemainingToNextRank,
        progressFraction,
        isMaxRank
    };
}

/**
 * 10.3 Mastery Backlog: items that are owned (count > 0) but not yet mastered.
 * These would grant MR if the player leveled them to 30.
 */
export type MasteryBacklogItem = {
    catalogId: string;
    name: string;
    estimatedXp: number;
};

export function computeMasteryBacklog(args: {
    mastered: Record<string, boolean>;
    counts: Record<string, number>;
    getItemName: (catalogId: string) => string | null;
    getItemCategory: (catalogId: string) => string;
}): MasteryBacklogItem[] {
    const { mastered, counts, getItemName, getItemCategory } = args;
    const result: MasteryBacklogItem[] = [];

    for (const [catalogId, count] of Object.entries(counts ?? {})) {
        if (!count || count <= 0) continue;
        if (mastered[catalogId]) continue;

        const name = getItemName(catalogId);
        if (!name) continue;

        const category = getItemCategory(catalogId).toLowerCase();
        let xp: number = MASTERY_XP_BY_CATEGORY.default;

        if (category.includes("warframe") || category.includes("archwing") || category.includes("necramech")) {
            xp = MASTERY_XP_BY_CATEGORY.warframe;
        } else if (category.includes("weapon") || category.includes("primary") || category.includes("secondary") || category.includes("melee")) {
            xp = MASTERY_XP_BY_CATEGORY.weapon;
        } else if (category.includes("companion") || category.includes("sentinel") || category.includes("kavat") || category.includes("kubrow")) {
            xp = MASTERY_XP_BY_CATEGORY.companion;
        }

        result.push({ catalogId, name, estimatedXp: xp });
    }

    result.sort((a, b) => b.estimatedXp - a.estimatedXp || a.name.localeCompare(b.name));
    return result;
}

/**
 * 10.4 MR Forecast: estimate MR gain from completing active goals.
 */
export type MrForecast = {
    currentTotalXp: number;
    currentMr: number;
    projectedXp: number;
    projectedMr: number;
    gainedMrLevels: number;
    gainedXp: number;
};

export function forecastMrFromGoals(args: {
    currentXp: number;
    currentMr: number;
    goalCatalogIds: string[];
    getItemCategory: (catalogId: string) => string;
}): MrForecast {
    const { currentXp, currentMr, goalCatalogIds, getItemCategory } = args;

    let additionalXp = 0;
    for (const cid of goalCatalogIds) {
        const category = getItemCategory(cid).toLowerCase();
        let xp: number = MASTERY_XP_BY_CATEGORY.default;

        if (category.includes("warframe") || category.includes("archwing") || category.includes("necramech")) {
            xp = MASTERY_XP_BY_CATEGORY.warframe;
        } else if (category.includes("weapon") || category.includes("primary") || category.includes("secondary") || category.includes("melee")) {
            xp = MASTERY_XP_BY_CATEGORY.weapon;
        } else if (category.includes("companion") || category.includes("sentinel")) {
            xp = MASTERY_XP_BY_CATEGORY.companion;
        }

        additionalXp += xp;
    }

    const projectedXp = currentXp + additionalXp;
    let projectedMr = currentMr;
    for (let r = MAX_MR; r >= 0; r--) {
        if (projectedXp >= xpForRank(r)) {
            projectedMr = r;
            break;
        }
    }

    return {
        currentTotalXp: currentXp,
        currentMr,
        projectedXp,
        projectedMr,
        gainedMrLevels: projectedMr - currentMr,
        gainedXp: additionalXp
    };
}
