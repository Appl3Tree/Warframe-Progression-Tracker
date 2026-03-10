// ===== FILE: src/pages/Dashboard.tsx =====
import { useMemo } from "react";
import WarframeResetTracker from "../components/WarframeResetTracker";
import ProgressionNextStepsPanel from "../components/ProgressionNextStepsPanel";
import DailyChecklist from "../components/DailyChecklist";
import { useTrackerStore } from "../store/store";
import { buildProgressionPlan } from "../domain/logic/plannerEngine";

export default function Dashboard() {
    const setActivePage    = useTrackerStore((s) => s.setActivePage);
    const completedMap     = useTrackerStore((s) => s.state.prereqs?.completed ?? {});

    const hasProgressionSteps = useMemo(() => {
        try {
            const steps = buildProgressionPlan(completedMap).steps ?? [];
            return steps.some((s: any) => s.id !== "planner_error_no_steps");
        } catch { return false; }
    }, [completedMap]);

    return (
        <div className="flex flex-col gap-4">

            {/* Header */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold">Dashboard</div>
                        <div className="text-sm text-slate-400 mt-1">
                            Track resets, work through progression goals, and manage your personal tasks.
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-lg bg-slate-100 px-3 py-2 text-slate-900 text-sm font-semibold"
                            onClick={() => setActivePage("prereqs")}
                        >
                            Prerequisites
                        </button>
                    </div>
                </div>
            </div>

            {/* Top row — progression + checklist, or full-width checklist if progression is complete */}
            <div className={`grid grid-cols-1 gap-4 items-start ${hasProgressionSteps ? "lg:grid-cols-2" : ""}`}>
                <ProgressionNextStepsPanel />
                <DailyChecklist expanded={!hasProgressionSteps} />
            </div>

            {/* Reset tracker — full width */}
            <WarframeResetTracker />

        </div>
    );
}