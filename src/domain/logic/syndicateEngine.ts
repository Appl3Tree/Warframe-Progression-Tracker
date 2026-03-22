// src/domain/logic/syndicateEngine.ts
// 7.4 Standing Simulation

import type { SyndicateVendorEntry, SyndicateRankUpRequirement } from "../../domain/catalog/syndicates/syndicateVendorCatalog";
import { SYNDICATE_VENDOR_CATALOG } from "../../domain/catalog/syndicates/syndicateVendorCatalog";

// Standing daily caps per Mastery Rank (in-game values: 16,000 base + 500 per MR)
const STANDING_CAP_BASE = 16_000;
const STANDING_CAP_PER_MR = 500;

export function getStandingCapPerDay(masteryRank: number): number {
    const mr = Math.max(0, Math.floor(masteryRank));
    return STANDING_CAP_BASE + mr * STANDING_CAP_PER_MR;
}

export type StandingRankStep = {
    rank: number;
    standingRequired: number;
    creditsRequired: number;
    itemsRequired: Array<{ name: string; qty: number }>;
};

export type StandingNeededResult = {
    syndicateId: string;
    currentRank: number;
    targetRank: number;
    /** Total standing needed from current standing to reach target rank's threshold. */
    standingNeeded: number;
    /** Total credits needed across all rank-up costs. */
    creditsNeeded: number;
    /** Aggregated items needed across all rank-ups. */
    itemsNeeded: Array<{ name: string; qty: number }>;
    /** Estimated days to reach target rank at current MR's daily cap. */
    estimatedDaysAtCap: number | null;
    /** Per-rank breakdown. */
    rankSteps: StandingRankStep[];
    /** Whether the path goes through negative rank recovery (ranks < 0). */
    requiresNegativeRecovery: boolean;
};

function getRankUpDef(
    entry: SyndicateVendorEntry,
    rank: number
): SyndicateRankUpRequirement | undefined {
    return entry.rankUps.find((r) => r.rank === rank);
}

/**
 * Calculates the total standing, credits, and items needed to rank up from
 * currentRank at currentStanding to targetRank.
 *
 * Handles:
 * - Negative rank recovery (ranks -2 to 0)
 * - Rank thresholds (minimumStanding gates)
 * - Standing caps (for estimating days)
 *
 * Returns null if the syndicate is not found or targetRank <= currentRank.
 */
export function calculateStandingNeeded(args: {
    syndicateId: string;
    currentRank: number;
    currentStanding: number;
    targetRank: number;
    masteryRank?: number | null;
}): StandingNeededResult | null {
    const { syndicateId, currentRank, currentStanding, targetRank } = args;
    const masteryRank = typeof args.masteryRank === "number" ? Math.max(0, Math.floor(args.masteryRank)) : 0;

    if (targetRank <= currentRank) return null;

    const entry = SYNDICATE_VENDOR_CATALOG.find((v) => v.id === syndicateId);
    if (!entry || !Array.isArray(entry.rankUps) || entry.rankUps.length === 0) return null;

    // Collect all rank-up steps from currentRank+1 to targetRank
    const stepsToProcess: SyndicateRankUpRequirement[] = [];
    for (let rank = currentRank + 1; rank <= targetRank; rank++) {
        const def = getRankUpDef(entry, rank);
        if (def) stepsToProcess.push(def);
    }

    let totalStanding = 0;
    let totalCredits = 0;
    const itemsMap: Record<string, number> = {};
    const rankSteps: StandingRankStep[] = [];
    const requiresNegativeRecovery = currentRank < 0;

    for (let i = 0; i < stepsToProcess.length; i++) {
        const step = stepsToProcess[i];
        let stepStanding = 0;
        let stepCredits = 0;
        const stepItems: Array<{ name: string; qty: number }> = [];

        for (const cost of step.costs) {
            if (cost.kind === "standing") {
                stepStanding += cost.amount;
            } else if (cost.kind === "credits") {
                stepCredits += cost.amount;
            } else if (cost.kind === "item") {
                stepItems.push({ name: cost.name, qty: cost.qty });
                itemsMap[cost.name] = (itemsMap[cost.name] ?? 0) + cost.qty;
            }
        }

        // For the first step, account for standing already earned toward the threshold
        if (i === 0 && step.minimumStanding !== undefined) {
            const threshold = step.minimumStanding;
            // If currentStanding is below the threshold, we need to earn the gap
            // For negative rank thresholds, we may need to recover from a negative standing position
            const effectiveCurrentStanding = i === 0 ? Math.max(currentStanding, 0) : 0;
            const standingGap = Math.max(0, threshold - effectiveCurrentStanding);
            // stepStanding from the cost.kind="standing" is the cost to rank up itself (not the threshold)
            // The threshold represents how much total standing you need in the syndicate
            // Use the larger of: the standing cost OR the gap to threshold
            stepStanding = Math.max(stepStanding, standingGap);
        } else if (i === 0 && step.minimumStanding === undefined) {
            // No threshold defined — use standing cost as-is, subtract current standing
            const effectiveStanding = Math.max(0, currentStanding);
            stepStanding = Math.max(0, stepStanding - effectiveStanding);
        }

        totalStanding += stepStanding;
        totalCredits += stepCredits;

        rankSteps.push({
            rank: step.rank,
            standingRequired: stepStanding,
            creditsRequired: stepCredits,
            itemsRequired: stepItems
        });
    }

    // Also compute the standing needed to reach the target rank's minimumStanding threshold
    const targetRankDef = getRankUpDef(entry, targetRank);
    if (targetRankDef?.minimumStanding !== undefined) {
        const targetThreshold = targetRankDef.minimumStanding;
        const effectiveCurrentStanding = Math.max(0, currentStanding);
        const thresholdGap = Math.max(0, targetThreshold - effectiveCurrentStanding);
        // Use the larger of the sum of steps or the direct threshold gap
        totalStanding = Math.max(totalStanding, thresholdGap);
    }

    const itemsNeeded = Object.entries(itemsMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const dailyCap = getStandingCapPerDay(masteryRank);
    const estimatedDaysAtCap = dailyCap > 0 && totalStanding > 0
        ? Math.ceil(totalStanding / dailyCap)
        : null;

    return {
        syndicateId,
        currentRank,
        targetRank,
        standingNeeded: Math.max(0, totalStanding),
        creditsNeeded: totalCredits,
        itemsNeeded,
        estimatedDaysAtCap,
        rankSteps,
        requiresNegativeRecovery
    };
}

/**
 * Given a syndicate's current state, returns what's needed to reach the next rank.
 */
export function calculateNextRankUp(args: {
    syndicateId: string;
    currentRank: number;
    currentStanding: number;
    masteryRank?: number | null;
}): StandingNeededResult | null {
    return calculateStandingNeeded({
        ...args,
        targetRank: args.currentRank + 1
    });
}
