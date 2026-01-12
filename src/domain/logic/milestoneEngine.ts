// src/domain/logic/milestoneEngine.ts
import type { PrereqId } from "../ids/prereqIds";

// Import as "any" so we do not hard-couple to a single registry export shape.
// Your milestoneRegistry.ts can evolve without forcing engine churn.
import * as Milestones from "../../catalog/prereqs/milestoneRegistry";

export type MilestoneDef = {
    id: string;
    label: string;
    description: string;
    prereqIds: PrereqId[];
    tags?: string[];
};

export type MilestoneStatus = {
    id: string;
    label: string;
    description: string;

    total: number;
    completedCount: number;
    completed: boolean;

    missing: PrereqId[];
    completedPrereqs: PrereqId[];

    tags: string[];
};

export type MilestoneSnapshot = {
    milestones: MilestoneStatus[];
    stats: {
        totalMilestones: number;
        completedMilestones: number;
        totalPrereqsTracked: number;
        completedPrereqsTracked: number;
    };
};

/**
 * Registry resolver:
 * Supports common export names to avoid small batch churn:
 * - MILESTONE_REGISTRY (preferred)
 * - MILESTONES
 * - default export array
 */
function resolveRegistry(): MilestoneDef[] {
    const anyMod = Milestones as any;

    const reg =
        anyMod?.MILESTONE_REGISTRY ??
        anyMod?.MILESTONES ??
        anyMod?.default ??
        [];

    if (!Array.isArray(reg)) return [];

    // Normalize to a safe shape (fail-closed)
    const out: MilestoneDef[] = [];
    for (const r of reg) {
        if (!r || typeof r !== "object") continue;

        const id = String((r as any).id ?? "").trim();
        const label = String((r as any).label ?? "").trim();
        const description = String((r as any).description ?? "").trim();

        const prereqIdsRaw =
            (r as any).prereqIds ??
            (r as any).prereqs ??
            (r as any).prerequisiteIds;

        const prereqIds: PrereqId[] = Array.isArray(prereqIdsRaw)
            ? prereqIdsRaw
                .map((x: any) => String(x) as PrereqId)
                .filter(Boolean)
            : [];

        const tagsRaw = (r as any).tags;
        const tags = Array.isArray(tagsRaw)
            ? tagsRaw.map((t: any) => String(t)).filter(Boolean)
            : [];

        if (!id || !label) continue;

        out.push({
            id,
            label,
            description,
            prereqIds,
            tags
        });
    }

    return out;
}

function uniq<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
}

/**
 * Primary snapshot API: returns milestone statuses + stats.
 */
export function computeMilestoneSnapshot(
    completedMap: Record<string, boolean>
): MilestoneSnapshot {
    const defs = resolveRegistry();

    const milestones: MilestoneStatus[] = defs.map((m) => {
        const prereqIds = Array.isArray(m.prereqIds) ? m.prereqIds : [];
        const total = prereqIds.length;

        const missing: PrereqId[] = [];
        const completedPrereqs: PrereqId[] = [];

        for (const id of prereqIds) {
            if (completedMap[id] === true) {
                completedPrereqs.push(id);
            } else {
                missing.push(id);
            }
        }

        const completedCount = completedPrereqs.length;
        const completed = total > 0 ? completedCount === total : false;

        return {
            id: m.id,
            label: m.label,
            description: m.description,
            total,
            completedCount,
            completed,
            missing: uniq(missing),
            completedPrereqs: uniq(completedPrereqs),
            tags: Array.isArray(m.tags) ? m.tags : []
        };
    });

    milestones.sort((a, b) => {
        // Incomplete first, then by "closest" (more complete), then alpha.
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        const aPct = a.total > 0 ? a.completedCount / a.total : 0;
        const bPct = b.total > 0 ? b.completedCount / b.total : 0;
        if (aPct !== bPct) return bPct - aPct;

        return a.label.localeCompare(b.label);
    });

    const allPrereqs = uniq(
        milestones.flatMap((m) => m.completedPrereqs.concat(m.missing))
    );

    const completedTracked = allPrereqs.filter((p) => completedMap[p] === true);

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.completed).length;

    return {
        milestones,
        stats: {
            totalMilestones,
            completedMilestones,
            totalPrereqsTracked: allPrereqs.length,
            completedPrereqsTracked: completedTracked.length
        }
    };
}

/**
 * Compatibility export for plannerEngine.ts.
 *
 * plannerEngine currently calls:
 *   computeMilestones({ completedPrereqs: completedMap })
 * and expects an array with at least { id: string }.
 *
 * This function returns the snapshot.milestones list (already normalized + sorted).
 */
export function computeMilestones(args: {
    completedPrereqs: Record<string, boolean>;
}): MilestoneStatus[] {
    const completedMap =
        args && typeof args.completedPrereqs === "object"
            ? args.completedPrereqs
            : {};
    return computeMilestoneSnapshot(completedMap).milestones;
}

/**
 * Convenience: highest leverage prereqs across milestones (how many milestones reference them).
 */
export function computeMilestonePrereqImpact(): Array<{
    prereqId: PrereqId;
    milestoneCount: number;
    milestoneIds: string[];
}> {
    const defs = resolveRegistry();

    const map = new Map<string, { milestoneIds: string[] }>();

    for (const m of defs) {
        const ids = Array.isArray(m.prereqIds) ? m.prereqIds : [];
        for (const p of ids) {
            const key = String(p);
            if (!map.has(key)) map.set(key, { milestoneIds: [] });
            map.get(key)!.milestoneIds.push(m.id);
        }
    }

    const out = Array.from(map.entries()).map(([k, v]) => ({
        prereqId: k as PrereqId,
        milestoneCount: v.milestoneIds.length,
        milestoneIds: v.milestoneIds
    }));

    out.sort((a, b) => {
        if (a.milestoneCount !== b.milestoneCount) return b.milestoneCount - a.milestoneCount;
        return String(a.prereqId).localeCompare(String(b.prereqId));
    });

    return out;
}

