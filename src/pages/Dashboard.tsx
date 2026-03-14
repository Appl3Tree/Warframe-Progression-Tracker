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
        // lg: h-full fits the viewport with internal panel scrolling.
        // Mobile: no height constraint — panels stack at natural height and the page scrolls.
        <div className="flex flex-col gap-3 lg:h-full">

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
                Mobile: auto height — each panel expands to show its content.
                lg+:    fixed clamp height so both panels sit side-by-side without pushing
                        the reset tracker off-screen. min-h-0 lets flex children shrink. */}
            <div className={[
                "grid gap-3 min-h-0",
                hasProgressionSteps ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
                "lg:[height:clamp(320px,40vh,520px)]"
            ].join(" ")}
            >
                {hasProgressionSteps && (
                    <div className="h-[340px] lg:h-full">
                        <ProgressionNextStepsPanel />
                    </div>
                )}
                <div className="h-[340px] lg:h-full">
                    <DailyChecklist expanded={!hasProgressionSteps} />
                </div>
            </div>

            {/* ── Reset tracker — fixed height, internal scroll ── */}
            <div className="min-h-0 lg:flex-1">
                <WarframeResetTracker />
            </div>

        </div>
    );
}
