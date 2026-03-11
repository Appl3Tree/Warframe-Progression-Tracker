// ===== FILE: src/pages/Dashboard.tsx =====
import { useMemo } from "react";
import WarframeResetTracker from "../components/WarframeResetTracker";
import ProgressionNextStepsPanel from "../components/ProgressionNextStepsPanel";
import DailyChecklist from "../components/DailyChecklist";
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
        // h-full fills the scrollable <main> area; flex-col stacks rows
        <div className="flex flex-col gap-3 h-full">

            {/* ── Header bar ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                    <div className="text-lg font-semibold">Dashboard</div>
                    <div className="text-sm text-slate-400">
                        Track resets, work through progression goals, and manage your personal tasks.
                    </div>
                </div>
                <button
                    className="rounded-lg bg-slate-100 px-3 py-2 text-slate-900 text-sm font-semibold"
                    onClick={() => setActivePage("prereqs")}
                >
                    Prerequisites
                </button>
            </div>

            {/* ── Top row: progression + checklist ──
                min-h-0 is essential — lets flex children shrink below their natural height.
                Each panel manages its own internal scroll. Fixed height via min/max. */}
            <div className={[
                "grid gap-3 min-h-0",
                hasProgressionSteps ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            ].join(" ")}
                style={{ height: "clamp(320px, 40vh, 520px)" }}
            >
                {hasProgressionSteps && (
                    <ProgressionNextStepsPanel />
                )}
                <DailyChecklist expanded={!hasProgressionSteps} />
            </div>

            {/* ── Reset tracker — fixed height, internal scroll ── */}
            <div className="min-h-0 flex-1">
                <WarframeResetTracker />
            </div>

        </div>
    );
}
