// ===== FILE: src/components/ProgressionNextStepsPanel.tsx =====
import { useMemo } from "react";
import { useTrackerStore } from "../store/store";
import { buildProgressionPlan } from "../domain/logic/plannerEngine";
import { buildPrereqIndex } from "../domain/logic/prereqEngine";
import { PREREQ_REGISTRY } from "../catalog/prereqs/prereqRegistry";
import { computeUnlockGraphSnapshot } from "../domain/logic/unlockGraph";
import type { PrereqId } from "../domain/ids/prereqIds";

export default function ProgressionNextStepsPanel() {
    const completedMap       = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const setPrereqCompleted = useTrackerStore((s) => s.setPrereqCompleted);

    const prereqIndex = useMemo(() => buildPrereqIndex(PREREQ_REGISTRY), []);
    const plan        = useMemo(() => buildProgressionPlan(completedMap), [completedMap]);
    const steps       = plan.steps ?? [];

    const unlockImpactByStepId = useMemo(() => {
        const result: Record<string, string[]> = {};
        const currentSnap = computeUnlockGraphSnapshot(completedMap, PREREQ_REGISTRY);
        const currentActionableIds = new Set(currentSnap.actionable.map((s) => s.id));

        for (const step of steps) {
            const simMap  = { ...completedMap, [step.prereqId]: true };
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
    function isComplete(id: string) { return completedMap[id] === true; }

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Progression Goals (Work on Next)</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Mark items complete to update the recommended next steps.
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
                {steps.map((step) => {
                    const completed = isComplete(step.prereqId);
                    return (
                        <div key={step.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold break-words">{step.title}</div>
                                    {step.description && (
                                        <div className="text-xs text-slate-400 break-words mt-1">{step.description}</div>
                                    )}
                                    {step.tags?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {step.tags.map((t: string) => (
                                                <span key={t} className="text-[11px] rounded-full border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-slate-300">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <label className="flex items-center gap-2 text-sm shrink-0 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={completed}
                                        onChange={(e) => setPrereqCompleted(step.prereqId, e.target.checked)}
                                    />
                                    Complete
                                </label>
                            </div>

                            {step.missingPrereqs?.length > 0 && (
                                <div className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/20 p-2">
                                    <div className="text-xs font-semibold text-amber-200">Missing prerequisites:</div>
                                    <ul className="mt-1 list-disc pl-5 text-xs text-amber-100">
                                        {step.missingPrereqs.map((m: string) => <li key={m}>{labelFor(m)}</li>)}
                                    </ul>
                                </div>
                            )}

                            {unlockImpactByStepId[step.id]?.length > 0 && (
                                <div className="mt-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-2">
                                    <div className="text-xs font-semibold text-emerald-300">Completing this unlocks:</div>
                                    <ul className="mt-1 list-disc pl-5 text-xs text-emerald-200">
                                        {unlockImpactByStepId[step.id].map((label) => <li key={label}>{label}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {steps.length === 0 && (
                <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-200">
                    Planner returned no steps. This should only happen if everything is completed or the prereq registry is empty/misconfigured.
                </div>
            )}
        </div>
    );
}
