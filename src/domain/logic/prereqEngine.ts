import type { PrereqDef } from "../../catalog/prereqs/prereqRegistry";
import { PREREQ_REGISTRY } from "../../catalog/prereqs/prereqRegistry";

export interface PrereqStatus {
    id: string;
    completed: boolean;
    isUnlocked: boolean;
    missingPrereqs: string[];
}

export function buildPrereqIndex(defs: PrereqDef[] = PREREQ_REGISTRY): Record<string, PrereqDef> {
    const index: Record<string, PrereqDef> = {};
    for (const d of defs) {
        index[d.id] = d;
    }
    return index;
}

export function isPrereqCompleted(
    completedMap: Record<string, boolean>,
    prereqId: string
): boolean {
    return completedMap[prereqId] === true;
}

export function getMissingPrereqs(
    index: Record<string, PrereqDef>,
    completedMap: Record<string, boolean>,
    prereqId: string
): string[] {
    const def = index[prereqId];
    if (!def) {
        // Unknown prereq => treat as missing (per your rule)
        return [prereqId];
    }

    const missing: string[] = [];
    for (const parent of def.prerequisites) {
        if (!isPrereqCompleted(completedMap, parent)) {
            missing.push(parent);
        }
    }
    return missing;
}

export function computePrereqStatuses(
    defs: PrereqDef[],
    completedMap: Record<string, boolean>
): PrereqStatus[] {
    const index = buildPrereqIndex(defs);

    return defs.map((d) => {
        const completed = isPrereqCompleted(completedMap, d.id);
        const missing = getMissingPrereqs(index, completedMap, d.id);
        const unlocked = missing.length === 0;

        return {
            id: d.id,
            completed,
            isUnlocked: unlocked,
            missingPrereqs: missing
        };
    });
}

