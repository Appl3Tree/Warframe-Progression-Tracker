// src/pages/Dashboard.tsx
import { useMemo } from "react";
import WarframeResetTracker from "../components/WarframeResetTracker";
import ProgressionNextStepsPanel from "../components/ProgressionNextStepsPanel";
import DailyChecklist from "../components/DailyChecklist";
import DashboardWorldState from "../components/DashboardWorldState";
import { useTrackerStore } from "../store/store";
import { buildProgressionPlan } from "../domain/logic/plannerEngine";
import { deriveCompletedMap } from "../domain/logic/syndicatePrereqs";

export default function Dashboard() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);
    const completedMap  = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const syndicates    = useTrackerStore((s) => s.state.syndicates ?? []);

    const mergedMap = useMemo(
        () => deriveCompletedMap(completedMap, syndicates),
        [completedMap, syndicates]
    );

    const hasProgressionSteps = useMemo(() => {
        try {
            const steps = buildProgressionPlan(mergedMap).steps ?? [];
            return steps.some((s: any) => s.id !== "planner_error_no_steps");
        } catch { return false; }
    }, [mergedMap]);

    return (
        <div className="flex flex-col gap-3 lg:h-full">

            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                    <div className="text-lg font-semibold">Dashboard</div>
                    <div className="text-sm text-slate-400">
                        Track resets, work through progression goals, and manage your personal tasks.
                    </div>
                </div>
                <button
                    className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-slate-200 text-sm font-medium hover:bg-slate-800 transition-colors"
                    onClick={() => setActivePage("goals")}
                >
                    Goals →
                </button>
            </div>

            {/* ── Top row: progression + checklist ── */}
            <div className={[
                "grid gap-3 min-h-0",
                hasProgressionSteps ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
                "lg:grid-rows-1 lg:h-[40vh] lg:min-h-[320px] lg:max-h-[520px]"
            ].join(" ")}>
                {hasProgressionSteps && (
                    <div className="h-[340px] lg:h-full">
                        <ProgressionNextStepsPanel />
                    </div>
                )}
                <div className="h-[340px] lg:h-full">
                    <DailyChecklist expanded={!hasProgressionSteps} />
                </div>
            </div>

            {/* ── World State ── */}
            <DashboardWorldState />

            {/* ── Reset tracker ── */}
            <div className="min-h-0 lg:flex-1">
                <WarframeResetTracker />
            </div>
        </div>
    );
}
