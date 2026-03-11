// ===== FILE: src/components/ProgressionNextStepsPanel.tsx =====
import { useMemo } from "react";
import { useTrackerStore } from "../store/store";
import { buildProgressionPlan } from "../domain/logic/plannerEngine";
import { buildPrereqIndex } from "../domain/logic/prereqEngine";
import { PREREQ_REGISTRY } from "../catalog/prereqs/prereqRegistry";
import { computeUnlockGraphSnapshot } from "../domain/logic/unlockGraph";
import { deriveCompletedMap, isValidatedBySyndicate } from "../domain/logic/syndicatePrereqs";
import type { PrereqId } from "../domain/ids/prereqIds";

export default function ProgressionNextStepsPanel() {
    const completedMap       = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const setPrereqCompleted = useTrackerStore((s) => s.setPrereqCompleted);
    const syndicates         = useTrackerStore((s) => s.state.syndicates ?? []);

    const mergedMap = useMemo(
        () => deriveCompletedMap(completedMap, syndicates),
        [completedMap, syndicates]
    );

    const prereqIndex = useMemo(() => buildPrereqIndex(PREREQ_REGISTRY), []);
    const steps = useMemo(() => {
        try {
            return (buildProgressionPlan(mergedMap).steps ?? [])
                .filter((s: any) => s.id !== "planner_error_no_steps");
        } catch { return []; }
    }, [mergedMap]);

    const unlockImpactByStepId = useMemo(() => {
        const result: Record<string, string[]> = {};
        const currentSnap = computeUnlockGraphSnapshot(mergedMap, PREREQ_REGISTRY);
        const currentActionableIds = new Set(currentSnap.actionable.map((s) => s.id));

        for (const step of steps) {
            const simMap  = { ...mergedMap, [step.prereqId]: true };
            const simSnap = computeUnlockGraphSnapshot(simMap, PREREQ_REGISTRY);
            const newlyActionable = simSnap.actionable
                .map((s) => s.id)
                .filter((id) => !currentActionableIds.has(id) && id !== step.prereqId)
                .map((id) => { const def = prereqIndex[id as PrereqId]; return def ? def.label : id; })
                .slice(0, 5);
            if (newlyActionable.length > 0) result[step.id] = newlyActionable;
        }
        return result;
    }, [completedMap, steps, prereqIndex]);

    function labelFor(id: string) { const def = prereqIndex[id]; return def ? def.label : id; }
    function isComplete(id: string) { return mergedMap[id] === true; }

    if (steps.length === 0) return null;

    return (
        // h-full fills whatever height the parent grid cell gives it
        // flex-col lets header stay fixed while list scrolls
        <div className="h-full flex flex-col rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">

            {/* ── Fixed header ── */}
            <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-800/60 shrink-0">
                <div>
                    <div className="text-base font-semibold">Progression Goals</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                        Mark complete to advance recommended next steps.
                    </div>
                </div>
                <span className="text-xs text-slate-600 font-mono shrink-0">{steps.length} remaining</span>
            </div>

            {/* ── Scrollable list ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                {steps.map((step) => {
                    const completed = isComplete(step.prereqId);
                    return (
                        <div
                            key={step.id}
                            className={[
                                "rounded-xl border px-3 py-2.5 transition-colors",
                                completed
                                    ? "border-emerald-900/30 bg-emerald-950/10 opacity-60"
                                    : "border-slate-800 bg-slate-950/30"
                            ].join(" ")}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className={[
                                        "text-sm font-semibold break-words",
                                        completed ? "line-through text-slate-500" : "text-slate-100"
                                    ].join(" ")}>
                                        {step.title}
                                    </div>
                                    {step.description && !completed && (
                                        <div className="text-xs text-slate-400 break-words mt-0.5">
                                            {step.description}
                                        </div>
                                    )}
                                    {step.tags?.length > 0 && !completed && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {step.tags.map((t: string) => (
                                                <span
                                                    key={t}
                                                    className="text-[10px] rounded-full border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-slate-400"
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {isValidatedBySyndicate(step.prereqId) ? (
                                    <div className="shrink-0 text-right">
                                        <div className="text-[10px] text-slate-500 leading-tight">Auto-tracked</div>
                                        <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                            Update in <span className="text-sky-400 font-medium">Syndicates</span>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex items-center gap-2 text-xs text-slate-400 shrink-0 cursor-pointer hover:text-slate-200 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={completed}
                                            onChange={(e) => setPrereqCompleted(step.prereqId, e.target.checked)}
                                        />
                                        Done
                                    </label>
                                )}
                            </div>

                            {/* Missing prereqs */}
                            {step.missingPrereqs?.length > 0 && !completed && (
                                <div className="mt-2 rounded-lg border border-amber-900/40 bg-amber-950/20 px-2 py-1.5">
                                    <div className="text-[11px] font-semibold text-amber-300">Blocked by:</div>
                                    <ul className="mt-0.5 list-disc pl-4 text-[11px] text-amber-200 space-y-0.5">
                                        {step.missingPrereqs.map((m: string) => <li key={m}>{labelFor(m)}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Unlock impact */}
                            {unlockImpactByStepId[step.id]?.length > 0 && !completed && (
                                <div className="mt-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-2 py-1.5">
                                    <div className="text-[11px] font-semibold text-emerald-400">Completing this unlocks:</div>
                                    <ul className="mt-0.5 list-disc pl-4 text-[11px] text-emerald-300 space-y-0.5">
                                        {unlockImpactByStepId[step.id].map((label) => <li key={label}>{label}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
