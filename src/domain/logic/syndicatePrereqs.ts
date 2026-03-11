// ===== FILE: src/domain/logic/syndicatePrereqs.ts =====
//
// Derives automatic prereq completions from syndicate rank state.
// Call deriveCompletedMap() instead of reading state.prereqs.completed directly
// anywhere the planner, graph, or prereq engine is invoked.
//
// This keeps the engine layer pure (no syndicate awareness) while ensuring
// syndicate-gated prereqs are automatically marked complete when the player's
// Syndicates tracker already reflects the required rank.

import { PREREQ_REGISTRY } from "../../catalog/prereqs/prereqRegistry";
import type { SyndicateState } from "../types";

/**
 * Returns a merged completedMap that includes auto-derived completions
 * for any prereq whose `validatedBySyndicate` condition is satisfied by
 * the player's current syndicate ranks.
 *
 * Manual completions in the base map are always preserved.
 */
export function deriveCompletedMap(
    baseCompletedMap: Record<string, boolean>,
    syndicates: SyndicateState[]
): Record<string, boolean> {
    // Build a fast rank lookup: syndicateId -> current rank
    const rankBySyndicateId: Record<string, number> = {};
    for (const syn of syndicates) {
        if (syn?.id) {
            rankBySyndicateId[syn.id] = typeof syn.rank === "number" ? syn.rank : -1;
        }
    }

    const merged: Record<string, boolean> = { ...baseCompletedMap };

    for (const def of PREREQ_REGISTRY) {
        if (!def.validatedBySyndicate) continue;

        const { syndicateId, rank: requiredRank } = def.validatedBySyndicate;
        const currentRank = rankBySyndicateId[syndicateId] ?? -1;

        if (currentRank >= requiredRank) {
            merged[def.id] = true;
        }
        // Note: we never set merged[def.id] = false here — if the player manually
        // marked it complete but their rank dropped, we trust the manual mark.
        // The Syndicates page is the canonical source for rank going forward.
    }

    return merged;
}

/**
 * Returns true if this prereq's completion is driven by syndicate rank,
 * not by a manual checkbox.
 */
export function isValidatedBySyndicate(prereqId: string): boolean {
    return PREREQ_REGISTRY.some(
        (d) => d.id === prereqId && !!d.validatedBySyndicate
    );
}
