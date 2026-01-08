import { PR } from "../ids/prereqIds";
import type { PrereqId } from "../ids/prereqIds";
import { PREREQ_REGISTRY } from "../../catalog/prereqs/prereqRegistry";
import { computeUnlockGraphSnapshot } from "./unlockGraph";

export interface ProgressionStep {
    id: string;
    prereqId: PrereqId;

    title: string;
    description: string;

    blocked: boolean;
    missingPrereqs: PrereqId[];

    tags: string[];
}

export interface ProgressionPlan {
    steps: ProgressionStep[];
}

/**
 * Phase B Planner Rules:
 * - Default assumption: nothing is complete unless user marks it.
 * - Unknown prereqs are treated as missing (locked).
 * - This planner is for “Progression Goals” (unlock path), not personal farming goals.
 *
 * HARD INVARIANT:
 * - “Next steps” must never be empty unless everything is completed.
 */
export function buildProgressionPlan(completedMap: Record<string, boolean>): ProgressionPlan {
    const snap = computeUnlockGraphSnapshot(completedMap, PREREQ_REGISTRY);

    const steps: ProgressionStep[] = [];

    const total = snap.statuses.length;
    const completedCount = snap.completed.length;
    const allComplete = total > 0 && completedCount === total;

    // --- Helper: safe def lookup (may be undefined for unknown prereq ids)
    function defById(id: PrereqId) {
        return snap.index[id];
    }

    function makeActionableStepForPrereqId(id: PrereqId, tag: string): ProgressionStep {
        const def = defById(id);

        if (!def) {
            // Unknown prereq id: per your rule it is "missing".
            // We still surface it so the user is never stuck with an empty plan.
            return {
                id: `unknown_${id}`,
                prereqId: id,
                title: `Unknown prerequisite: ${id}`,
                description:
                    "This prerequisite is referenced but not defined in the registry. Add it to prereqRegistry.ts or mark the appropriate prerequisite complete.",
                blocked: false,
                missingPrereqs: [],
                tags: ["Unlock", "Unknown", tag]
            };
        }

        return {
            id: `unlock_${def.id}`,
            prereqId: def.id,
            title: def.label,
            description: def.description,
            blocked: false,
            missingPrereqs: [],
            tags: ["Unlock", def.category, tag]
        };
    }

    // 1) Standard actionable unlock steps (frontier)
    const actionableDefs = snap.actionable
        .map((s) => snap.index[s.id])
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label));

    for (const d of actionableDefs) {
        steps.push({
            id: `unlock_${d.id}`,
            prereqId: d.id,
            title: d.label,
            description: d.description,
            blocked: false,
            missingPrereqs: [],
            tags: ["Unlock", d.category, "Frontier"]
        });
    }

    // 2) If user has completed everything, return the (empty) actionable set (valid empty state).
    if (allComplete) {
        // Optional: you can add a single celebratory/terminal step instead of returning empty.
        return { steps };
    }

    // 3) HARD INVARIANT ENFORCEMENT:
    // If actionable is empty but not all complete, compute fallback “closest missing prerequisites”.
    if (steps.length === 0) {
        // Consider locked prereqs that are not completed.
        const locked = snap.blocked
            .filter((s) => !s.completed)
            .map((s) => ({
                id: s.id,
                missing: s.missing ?? []
            }))
            .filter((x) => x.missing.length > 0);

        if (locked.length > 0) {
            // Choose prereqs with the fewest missing prerequisites (closest frontier).
            let minMissing = Infinity;
            for (const l of locked) {
                if (l.missing.length < minMissing) {
                    minMissing = l.missing.length;
                }
            }

            const closest = locked.filter((l) => l.missing.length === minMissing);

            // Union of their missing prereqs becomes “work on next”.
            const nextIds = new Set<PrereqId>();
            for (const c of closest) {
                for (const m of c.missing) {
                    // If already complete, skip
                    if (completedMap[m] === true) {
                        continue;
                    }
                    nextIds.add(m);
                }
            }

            // Convert into actionable steps (even if those prereqs themselves are locked deeper,
            // they are still “next” because they are explicitly missing).
            const nextSteps: ProgressionStep[] = [];
            for (const id of Array.from(nextIds)) {
                nextSteps.push(makeActionableStepForPrereqId(id, "Closest Missing"));
            }

            nextSteps.sort((a, b) => a.title.localeCompare(b.title));

            // If we successfully found fallback steps, return them.
            if (nextSteps.length > 0) {
                return { steps: nextSteps };
            }
        }

        // 4) Final fallback: if registry exists but we still can't derive anything,
        // pick any not-completed prereq (deterministic) and surface it.
        const anyIncomplete = snap.statuses
            .filter((s) => !s.completed)
            .map((s) => s.id)
            .sort((a, b) => a.localeCompare(b));

        if (anyIncomplete.length > 0) {
            return {
                steps: [makeActionableStepForPrereqId(anyIncomplete[0], "Fallback")]
            };
        }

        // 5) If we got here, something is structurally wrong (empty registry or inconsistent snapshot).
        // Return a single actionable “fix config” step so the UI is never blank.
        return {
            steps: [
                {
                    id: "planner_error_no_steps",
                    prereqId: PR.VORS_PRIZE as PrereqId,
                    title: "Planner configuration issue",
                    description:
                        "No next steps could be computed. Ensure prereqRegistry.ts has at least one prerequisite and at least one root node (prerequisites: []).",
                    blocked: false,
                    missingPrereqs: [],
                    tags: ["Error"]
                }
            ]
        };
    }

    return { steps };
}

/**
 * Item gating for Phase B:
 * We must not show “progression inventory” items that the user cannot access yet.
 *
 * Since acquisition mapping is not implemented yet, this is a conservative bridge:
 * - We gate a small set of known items behind hub prereqs.
 * - Later, this will be replaced/augmented by itemAcquisition + sourceCatalog.
 */
const ITEM_ACCESS_GATES: Array<{
    matchName: string;
    requiredPrereqs: PrereqId[];
    reason: string;
}> = [
    // Cetus / Quills / Eidolon-related
    {
        matchName: "Eidolon Shard",
        requiredPrereqs: [PR.HUB_CETUS],
        reason: "Requires Cetus/Plains access."
    },

    // Fortuna / Solaris United / Vox Solaris-related
    {
        matchName: "Training Debt-Bond",
        requiredPrereqs: [PR.HUB_FORTUNA],
        reason: "Requires Fortuna/Orb Vallis access."
    },
    {
        matchName: "Vega Toroid",
        requiredPrereqs: [PR.HUB_FORTUNA],
        reason: "Requires Fortuna/Orb Vallis access."
    },
    {
        matchName: "Calda Toroid",
        requiredPrereqs: [PR.HUB_FORTUNA],
        reason: "Requires Fortuna/Orb Vallis access."
    },
    {
        matchName: "Sola Toroid",
        requiredPrereqs: [PR.HUB_FORTUNA],
        reason: "Requires Fortuna/Orb Vallis access."
    },

    // Deimos / Entrati / Necraloid items
    {
        matchName: "Mother Token",
        requiredPrereqs: [PR.HUB_NECRALISK],
        reason: "Requires Deimos/Necralisk access."
    },
    {
        matchName: "Father Token",
        requiredPrereqs: [PR.HUB_NECRALISK],
        reason: "Requires Deimos/Necralisk access."
    },
    {
        matchName: "Son Token",
        requiredPrereqs: [PR.HUB_NECRALISK],
        reason: "Requires Deimos/Necralisk access."
    },
    {
        matchName: "Sly Vulpaphyla Tag",
        requiredPrereqs: [PR.HUB_NECRALISK],
        reason: "Requires Deimos/Necralisk access."
    },
    {
        matchName: "Vizier Predasite Tag",
        requiredPrereqs: [PR.HUB_NECRALISK],
        reason: "Requires Deimos/Necralisk access."
    },
    {
        matchName: "Orokin Orientation Matrix",
        requiredPrereqs: [PR.HUB_NECRALISK],
        reason: "Requires Deimos/Necralisk access."
    },

    // Zariman / Holdfasts
    {
        matchName: "Voidplume Down",
        requiredPrereqs: [PR.HUB_ZARIMAN],
        reason: "Requires Zariman access."
    },

    // Sanctum / Cavia
    {
        matchName: "Entrati Obols",
        requiredPrereqs: [PR.HUB_SANCTUM],
        reason: "Requires Sanctum Anatomica access."
    },
    {
        matchName: "Shrill Voca",
        requiredPrereqs: [PR.HUB_SANCTUM],
        reason: "Requires Sanctum Anatomica access."
    }
];

export interface ItemAccessResult {
    allowed: boolean;
    missingPrereqs: PrereqId[];
    reasons: string[];
}

/**
 * Returns whether an item is accessible given current prereq completion.
 * Fail-closed: if no mapping exists, we do NOT claim it is accessible.
 */
export function canAccessItemByName(
    itemName: string,
    completedMap: Record<string, boolean>
): ItemAccessResult {
    const normalized = itemName.trim().toLowerCase();

    const gate = ITEM_ACCESS_GATES.find(
        (g) => g.matchName.trim().toLowerCase() === normalized
    );

    if (!gate) {
        return {
            allowed: false,
            missingPrereqs: [],
            reasons: [
                "Access mapping missing for this item (will be resolved when acquisition/source catalogs are populated)."
            ]
        };
    }

    const missing: PrereqId[] = [];
    for (const p of gate.requiredPrereqs) {
        if (completedMap[p] !== true) {
            missing.push(p);
        }
    }

    return {
        allowed: missing.length === 0,
        missingPrereqs: missing,
        reasons: missing.length === 0 ? [] : [gate.reason]
    };
}

