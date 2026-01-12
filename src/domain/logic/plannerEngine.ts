// ===== FILE: src/domain/logic/plannerEngine.ts =====
// src/domain/logic/plannerEngine.ts

import { PR } from "../ids/prereqIds";
import type { PrereqId } from "../ids/prereqIds";
import { PREREQ_REGISTRY } from "../../catalog/prereqs/prereqRegistry";
import { computeUnlockGraphSnapshot } from "./unlockGraph";
import { computeMilestones } from "./milestoneEngine";

import { FULL_CATALOG, type CatalogId } from "../catalog/loadFullCatalog";
import { SOURCE_INDEX } from "../../catalog/sources/sourceCatalog";
import { getAcquisitionByCatalogId } from "../../catalog/items/itemAcquisition";
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
 * HARD INVARIANT:
 * - “Next steps” must never be empty unless everything is completed.
 */
export function buildProgressionPlan(
    completedMap: Record<string, boolean>
): ProgressionPlan {
    const snap = computeUnlockGraphSnapshot(completedMap, PREREQ_REGISTRY);
    const milestones = computeMilestones({ completedPrereqs: completedMap });

    const milestoneIds = new Set(milestones.map((m) => m.id));
    const steps: ProgressionStep[] = [];

    function defById(id: PrereqId) {
        return snap.index[id];
    }

    function rankOf(id: PrereqId): number {
        const v = snap.rankById?.[id];
        return Number.isFinite(v) ? (v as number) : 1_000_000;
    }

    function makeStep(id: PrereqId, tag: string): ProgressionStep {
        const def = defById(id);
        const st = snap.byId[id];
        const isMilestone = milestoneIds.has(id);

        if (!def) {
            return {
                id: `unknown_${id}`,
                prereqId: id,
                title: `Unknown prerequisite: ${id}`,
                description:
                    "This prerequisite is referenced but not defined in the registry.",
                blocked: false,
                missingPrereqs: st?.missing ?? [],
                tags: ["Unlock", "Unknown", tag]
            };
        }

        return {
            id: `unlock_${def.id}`,
            prereqId: def.id,
            title: def.label,
            description: def.description,
            blocked: false,
            missingPrereqs: st?.missing ?? [],
            tags: [
                "Unlock",
                def.category,
                isMilestone ? "Milestone" : "Leaf",
                tag
            ]
        };
    }

    const actionable = snap.actionable
        .map((s) => s.id)
        .sort((a, b) => {
            const aIsMilestone = milestoneIds.has(a);
            const bIsMilestone = milestoneIds.has(b);
            if (aIsMilestone !== bIsMilestone) {
                return aIsMilestone ? -1 : 1;
            }

            // Availability ordering (earlier depth first)
            const ra = rankOf(a);
            const rb = rankOf(b);
            if (ra !== rb) return ra - rb;

            return a.localeCompare(b);
        });

    for (const id of actionable) {
        steps.push(makeStep(id, "Frontier"));
    }

    if (steps.length > 0) {
        return { steps };
    }

    const blocked = snap.blocked
        .filter((s) => !s.completed)
        .map((s) => ({
            id: s.id,
            missing: s.missing ?? []
        }))
        .filter((x) => x.missing.length > 0);

    if (blocked.length > 0) {
        let minMissing = Infinity;
        for (const b of blocked) {
            minMissing = Math.min(minMissing, b.missing.length);
        }

        const closest = blocked.filter((b) => b.missing.length === minMissing);
        const nextIds = new Set<PrereqId>();

        for (const c of closest) {
            for (const m of c.missing) {
                if (completedMap[m] !== true) nextIds.add(m);
            }
        }

        const nextSteps = Array.from(nextIds)
            .sort((a, b) => {
                const aIsMilestone = milestoneIds.has(a);
                const bIsMilestone = milestoneIds.has(b);
                if (aIsMilestone !== bIsMilestone) {
                    return aIsMilestone ? -1 : 1;
                }

                const ra = rankOf(a);
                const rb = rankOf(b);
                if (ra !== rb) return ra - rb;

                return a.localeCompare(b);
            })
            .map((id) => makeStep(id, "Closest Missing"));

        if (nextSteps.length > 0) {
            return { steps: nextSteps };
        }
    }

    const anyIncomplete = snap.statuses
        .filter((s) => !s.completed)
        .map((s) => s.id)
        .sort((a, b) => {
            const ra = rankOf(a);
            const rb = rankOf(b);
            if (ra !== rb) return ra - rb;
            return a.localeCompare(b);
        });

    if (anyIncomplete.length > 0) {
        return {
            steps: [makeStep(anyIncomplete[0], "Fallback")]
        };
    }

    return {
        steps: [
            {
                id: "planner_error_no_steps",
                prereqId: PR.VORS_PRIZE as PrereqId,
                title: "Planner configuration issue",
                description:
                    "No next steps could be computed. Check prereq registry integrity.",
                blocked: false,
                missingPrereqs: [],
                tags: ["Error"]
            }
        ]
    };
}

/* ---------- Item access logic ---------- */

export interface ItemAccessResult {
    allowed: boolean;
    missingPrereqs: PrereqId[];

    // Only present when MR is actually required and not met.
    // This should NOT be shown as a standalone “goal” unless it blocks the user’s target.
    missingMr: number | null;

    reasons: string[];
}

function normalizeMr(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.floor(n));
}

function isSourceAccessible(
    sourceId: SourceId,
    completedMap: Record<string, boolean>,
    masteryRank?: number | null
): { ok: boolean; missing: PrereqId[]; missingMr: number | null; reason?: string } {
    const src = SOURCE_INDEX[sourceId];
    if (!src) {
        return { ok: false, missing: [], missingMr: null, reason: `Unknown source (${sourceId})` };
    }

    const isDataDerived = String(sourceId).startsWith("data:");
    const prereqs = Array.isArray(src.prereqIds) ? src.prereqIds : [];

    if (isDataDerived && prereqs.length === 0) {
        return {
            ok: false,
            missing: [],
            missingMr: null,
            reason: "Source accessibility not curated (fail-closed)"
        };
    }

    const missing: PrereqId[] = [];
    for (const p of prereqs) {
        if (completedMap[p] !== true) missing.push(p);
    }

    const mrReq =
        typeof (src as any).mrRequired === "number"
            ? Math.max(0, Math.floor((src as any).mrRequired))
            : null;

    const mrNow = normalizeMr(masteryRank);
    const missingMr = mrReq !== null && (mrNow === null || mrNow < mrReq) ? mrReq : null;

    const ok = missing.length === 0 && missingMr === null;

    if (ok) {
        return { ok: true, missing: [], missingMr: null };
    }

    const parts: string[] = [];
    if (missing.length) parts.push(`Requires: ${missing.join(", ")}`);
    if (missingMr !== null) parts.push(`Requires Mastery Rank ${missingMr}`);

    return {
        ok: false,
        missing,
        missingMr,
        reason: parts.join(" | ") || "Inaccessible"
    };
}

export function canAccessCatalogItem(
    catalogId: CatalogId,
    completedMap: Record<string, boolean>,
    masteryRank?: number | null
): ItemAccessResult {
    const rec = FULL_CATALOG.recordsById[catalogId];
    if (!rec?.displayName) {
        return {
            allowed: false,
            missingPrereqs: [],
            missingMr: null,
            reasons: ["Unknown catalog record."]
        };
    }

    const acq = getAcquisitionByCatalogId(catalogId);
    if (!acq) {
        return {
            allowed: false,
            missingPrereqs: [],
            missingMr: null,
            reasons: ["Acquisition mapping missing."]
        };
    }

    const missing = new Set<PrereqId>();
    const reasons: string[] = [];
    let maxMissingMr: number | null = null;

    for (const s of acq.sources) {
        const check = isSourceAccessible(s, completedMap, masteryRank);
        if (check.ok) return { allowed: true, missingPrereqs: [], missingMr: null, reasons: [] };

        check.missing.forEach((m) => missing.add(m));
        if (check.missingMr !== null) {
            maxMissingMr = maxMissingMr === null ? check.missingMr : Math.max(maxMissingMr, check.missingMr);
        }
        reasons.push(check.reason ?? `${s}: inaccessible`);
    }

    return {
        allowed: false,
        missingPrereqs: Array.from(missing),
        missingMr: maxMissingMr,
        reasons
    };
}

export function canAccessItemByName(
    itemName: string,
    completedMap: Record<string, boolean>,
    masteryRank?: number | null
): ItemAccessResult {
    const normalized = String(itemName ?? "").trim().toLowerCase();
    const matches = FULL_CATALOG.nameIndex?.[normalized] ?? [];
    const cid = matches[0] as CatalogId | undefined;

    if (!cid) {
        return {
            allowed: false,
            missingPrereqs: [],
            missingMr: null,
            reasons: ["No catalog match."]
        };
    }

    return canAccessCatalogItem(cid, completedMap, masteryRank);
}

