// src/pages/Dashboard.tsx
import { useMemo } from "react";
import WarframeResetTracker from "../components/WarframeResetTracker";
import ProgressionNextStepsPanel from "../components/ProgressionNextStepsPanel";
import DailyChecklist from "../components/DailyChecklist";
import { useTrackerStore } from "../store/store";
import { useShallow } from "zustand/react/shallow";
import { buildProgressionPlan } from "../domain/logic/plannerEngine";
import { deriveCompletedMap } from "../domain/logic/syndicatePrereqs";

export default function Dashboard() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);
    const { completedMap, syndicates, masteryRank } = useTrackerStore(
        useShallow((s) => ({
            completedMap:  s.state.prereqs?.completed ?? {},
            syndicates:    s.state.syndicates ?? [],
            masteryRank:   s.state.player?.masteryRank,
        }))
    );

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

    // Show the Handbook card when the player hasn't imported any data yet.
    const isNewPlayer = masteryRank == null && syndicates.length === 0 && Object.keys(completedMap).length === 0;

    return (
        <div className="flex flex-col gap-3 pb-4">

            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                    <div className="text-lg font-semibold">Dashboard</div>
                    <div className="text-sm text-slate-400">
                        Track resets, work through progression goals, and manage your personal tasks.
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-slate-200 text-sm font-medium hover:bg-slate-800 transition-colors"
                        onClick={() => setActivePage("world_state")}
                    >
                        World State →
                    </button>
                    <button
                        className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-slate-200 text-sm font-medium hover:bg-slate-800 transition-colors"
                        onClick={() => setActivePage("goals")}
                    >
                        Goals →
                    </button>
                </div>
            </div>

            {/* ── Handbook callout for new players ── */}
            {isNewPlayer && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-cyan-900/50 bg-cyan-950/20 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0" aria-hidden>📖</span>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-cyan-200">New to the tracker?</div>
                            <div className="text-xs text-cyan-400/80 mt-0.5">
                                The Tenno's Handbook covers quest order, progression gates, and what to farm first.
                            </div>
                        </div>
                    </div>
                    <button
                        className="shrink-0 rounded-lg border border-cyan-700 bg-cyan-900/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-800/40 transition-colors"
                        onClick={() => setActivePage("handbook")}
                    >
                        Open Handbook →
                    </button>
                </div>
            )}

            {/* ── Top row: progression + checklist ── */}
            <div className={[
                "grid gap-3",
                hasProgressionSteps ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
            ].join(" ")}>
                {hasProgressionSteps && (
                    <div className="h-[340px]">
                        <ProgressionNextStepsPanel />
                    </div>
                )}
                <div className="h-[340px]">
                    <DailyChecklist expanded={!hasProgressionSteps} />
                </div>
            </div>

            {/* ── Reset tracker ── */}
            <WarframeResetTracker />
        </div>
    );
}
