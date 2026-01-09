// src/domain/logic/plannerEngine.ts

import { PR } from "../ids/prereqIds";
import type { PrereqId } from "../ids/prereqIds";
import { PREREQ_REGISTRY } from "../../catalog/prereqs/prereqRegistry";
import { computeUnlockGraphSnapshot } from "./unlockGraph";

import { FULL_CATALOG, type CatalogId } from "../catalog/loadFullCatalog";
import { SOURCE_INDEX } from "../../catalog/sources/sourceCatalog";
import { getAcquisitionByDisplayName } from "../../catalog/items/itemAcquisition";
import type { SourceId } from "../ids/sourceIds";

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

            const nextSteps: ProgressionStep[] = [];
            for (const id of Array.from(nextIds)) {
                nextSteps.push(makeActionableStepForPrereqId(id, "Closest Missing"));
            }

            nextSteps.sort((a, b) => a.title.localeCompare(b.title));

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

        // 5) Structural issue fallback so UI is never blank.
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

export interface ItemAccessResult {
    allowed: boolean;
    missingPrereqs: PrereqId[];
    reasons: string[];
}

function isSourceAccessible(
    sourceId: SourceId,
    completedMap: Record<string, boolean>
): { ok: boolean; missing: PrereqId[]; reason?: string } {
    const src = SOURCE_INDEX[sourceId];
    if (!src) {
        // Unknown source => fail-closed
        return {
            ok: false,
            missing: [],
            reason: `Unknown source (${sourceId})`
        };
    }

    const missing: PrereqId[] = [];
    for (const p of src.prereqIds) {
        if (completedMap[p] !== true) {
            missing.push(p);
        }
    }

    return {
        ok: missing.length === 0,
        missing,
        reason: missing.length === 0 ? undefined : `Requires: ${missing.join(", ")}`
    };
}

/**
 * Canonical gating:
 * - Uses CatalogId as the stable key.
 * - Uses acquisition->sources mapping (currently bridged via displayName).
 *
 * Fail-closed:
 * - Unknown catalogId or missing displayName => not accessible
 * - Missing acquisition mapping => not accessible
 * - Unknown source => not accessible
 */
export function canAccessCatalogItem(
    catalogId: CatalogId,
    completedMap: Record<string, boolean>
): ItemAccessResult {
    const rec = FULL_CATALOG.recordsById[catalogId];
    const name = rec?.displayName;

    if (!name) {
        return {
            allowed: false,
            missingPrereqs: [],
            reasons: ["Unknown catalog record or missing display name."]
        };
    }

    const acq = getAcquisitionByDisplayName(name);
    if (!acq) {
        return {
            allowed: false,
            missingPrereqs: [],
            reasons: ["Access mapping missing for this item (acquisition unknown, fail-closed)."]
        };
    }

    const aggregateMissing = new Set<PrereqId>();
    const reasons: string[] = [];

    for (const s of acq.sources) {
        const check = isSourceAccessible(s, completedMap);
        if (check.ok) {
            return { allowed: true, missingPrereqs: [], reasons: [] };
        }
        for (const m of check.missing) {
            aggregateMissing.add(m);
        }
        if (check.reason) {
            reasons.push(`${s}: ${check.reason}`);
        } else {
            reasons.push(`${s}: not accessible yet`);
        }
    }

    return {
        allowed: false,
        missingPrereqs: Array.from(aggregateMissing),
        reasons: reasons.length > 0 ? reasons : ["Item sources are not accessible yet."]
    };
}

/**
 * Compatibility bridge (older call sites):
 * - Resolves display name -> CatalogId (first match)
 * - Then applies CatalogId gating
 *
 * Fail-closed:
 * - No catalog match => not accessible
 */
export function canAccessItemByName(
    itemName: string,
    completedMap: Record<string, boolean>
): ItemAccessResult {
    const normalized = String(itemName ?? "").trim().toLowerCase();
    if (!normalized) {
        return {
            allowed: false,
            missingPrereqs: [],
            reasons: ["Missing item name."]
        };
    }

    const matches = FULL_CATALOG.nameIndex?.[normalized] ?? [];
    const cid = (matches[0] as CatalogId | undefined);

    if (!cid) {
        return {
            allowed: false,
            missingPrereqs: [],
            reasons: ["No catalog match for this item name (fail-closed)."]
        };
    }

    return canAccessCatalogItem(cid, completedMap);
}

