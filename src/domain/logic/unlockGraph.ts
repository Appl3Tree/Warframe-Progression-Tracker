import type { PrereqDef } from "../../catalog/prereqs/prereqRegistry";
import { PREREQ_REGISTRY } from "../../catalog/prereqs/prereqRegistry";
import type { PrereqId } from "../ids/prereqIds";

export interface UnlockNodeStatus {
    id: PrereqId;
    completed: boolean;
    unlocked: boolean;          // all prereqs completed
    missing: PrereqId[];        // prereqs not completed
}

export interface UnlockGraphSnapshot {
    index: Record<string, PrereqDef>;
    statuses: UnlockNodeStatus[];
    byId: Record<string, UnlockNodeStatus>;
    actionable: UnlockNodeStatus[]; // not complete, unlocked
    blocked: UnlockNodeStatus[];    // not complete, locked
    completed: UnlockNodeStatus[];  // complete
}

/**
 * Unknown prereq IDs are treated as missing (per your rule):
 * - If something references a prereq not in registry, it will be considered locked.
 */
function isCompleted(completedMap: Record<string, boolean>, id: string): boolean {
    return completedMap[id] === true;
}

export function buildPrereqIndex(defs: PrereqDef[] = PREREQ_REGISTRY): Record<string, PrereqDef> {
    const index: Record<string, PrereqDef> = {};
    for (const d of defs) {
        index[d.id] = d;
    }
    return index;
}

export function computeUnlockGraphSnapshot(
    completedMap: Record<string, boolean>,
    defs: PrereqDef[] = PREREQ_REGISTRY
): UnlockGraphSnapshot {
    const index = buildPrereqIndex(defs);

    const statuses: UnlockNodeStatus[] = defs.map((d) => {
        const completed = isCompleted(completedMap, d.id);

        const missing: PrereqId[] = [];
        for (const p of d.prerequisites) {
            // If prereq is unknown, treat as missing
            if (!index[p] || !isCompleted(completedMap, p)) {
                missing.push(p);
            }
        }

        return {
            id: d.id,
            completed,
            unlocked: missing.length === 0,
            missing
        };
    });

    const byId: Record<string, UnlockNodeStatus> = {};
    for (const s of statuses) {
        byId[s.id] = s;
    }

    const actionable = statuses
        .filter((s) => !s.completed && s.unlocked)
        .sort((a, b) => a.id.localeCompare(b.id));

    const blocked = statuses
        .filter((s) => !s.completed && !s.unlocked)
        .sort((a, b) => a.id.localeCompare(b.id));

    const completed = statuses
        .filter((s) => s.completed)
        .sort((a, b) => a.id.localeCompare(b.id));

    return {
        index,
        statuses,
        byId,
        actionable,
        blocked,
        completed
    };
}

/**
 * Returns the “frontier”: prereqs that are NOT completed but are currently unlocked.
 * This is the key primitive the planner uses to recommend next unlock steps.
 */
export function getActionablePrereqs(
    completedMap: Record<string, boolean>,
    defs: PrereqDef[] = PREREQ_REGISTRY
): PrereqDef[] {
    const snap = computeUnlockGraphSnapshot(completedMap, defs);
    return snap.actionable
        .map((s) => snap.index[s.id])
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Convenience helper: is a prereq complete?
 */
export function isPrereqComplete(completedMap: Record<string, boolean>, id: PrereqId): boolean {
    return completedMap[id] === true;
}

/**
 * Convenience helper: are all prereqs completed for a prereq definition?
 */
export function isPrereqUnlocked(
    completedMap: Record<string, boolean>,
    id: PrereqId,
    defs: PrereqDef[] = PREREQ_REGISTRY
): boolean {
    const snap = computeUnlockGraphSnapshot(completedMap, defs);
    const st = snap.byId[id];
    if (!st) {
        // Unknown prereq => treat as locked
        return false;
    }
    return st.unlocked;
}

