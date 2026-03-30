// src/pages/Dashboard.tsx
import { useMemo } from "react";
import WarframeResetTracker from "../components/WarframeResetTracker";
import ProgressionNextStepsPanel from "../components/ProgressionNextStepsPanel";
import DailyChecklist from "../components/DailyChecklist";
import DashboardWorldState from "../components/DashboardWorldState";
import { useTrackerStore } from "../store/store";
import { useShallow } from "zustand/react/shallow";
import { buildProgressionPlan } from "../domain/logic/plannerEngine";
import { deriveCompletedMap } from "../domain/logic/syndicatePrereqs";
import { WorkspaceAction, WorkspaceHero, WorkspacePanel, WorkspaceStat } from "../components/workspace/WorkspaceChrome";

export default function Dashboard() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);
    const { completedMap, syndicates, masteryRank, goals, dailyTasks } = useTrackerStore(
        useShallow((s) => ({
            completedMap:  s.state.prereqs?.completed ?? {},
            syndicates:    s.state.syndicates ?? [],
            masteryRank:   s.state.player?.masteryRank,
            goals:         s.state.goals ?? [],
            dailyTasks:    s.state.dailyTasks ?? [],
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
    const activeGoals = goals.filter((goal) => goal.isActive).length;
    const todayTaskCount = dailyTasks.length;
    const completedTasks = dailyTasks.filter((task) => task.isDone).length;

    return (
        <div className="flex flex-col gap-4 pb-4">
            <WorkspaceHero
                eyebrow="Command Workspace"
                title="Dashboard"
                description="See what matters now: daily resets, live opportunities, active progression goals, and the next best actions to keep momentum."
                actions={
                    <>
                        <WorkspaceAction onClick={() => setActivePage("world_state")}>Open World State</WorkspaceAction>
                        <WorkspaceAction onClick={() => setActivePage("requirements")}>Open Farming</WorkspaceAction>
                        <WorkspaceAction onClick={() => setActivePage("build_planner")}>Open Build Planner</WorkspaceAction>
                    </>
                }
                stats={
                    <>
                        <WorkspaceStat
                            label="Progression"
                            value={hasProgressionSteps ? "Actionable" : "Stable"}
                            hint={hasProgressionSteps ? "You have recommended next steps queued." : "No immediate progression blockers detected."}
                        />
                        <WorkspaceStat
                            label="Active goals"
                            value={activeGoals.toLocaleString()}
                            hint="Pinned goals should drive farming and planner decisions."
                        />
                        <WorkspaceStat
                            label="Today"
                            value={`${completedTasks}/${todayTaskCount}`}
                            hint="Personal checklist completion for the current reset."
                        />
                        <WorkspaceStat
                            label="Profile"
                            value={masteryRank == null ? "New / Unknown" : `MR ${masteryRank}`}
                            hint={isNewPlayer ? "A good time to start with the Handbook." : "Imported profile context is available to the app."}
                        />
                    </>
                }
                className="py-5"
            />

            {isNewPlayer && (
                <div className="flex items-center justify-between gap-4 rounded-[22px] border border-cyan-900/50 bg-cyan-950/20 px-4 py-3">
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

            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
                <WorkspacePanel className="min-h-[420px] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-base font-semibold text-[color:var(--wf-text-strong)]">Live Intel</div>
                            <div className="text-sm text-[color:var(--wf-text-muted)]">
                                Upcoming cycles, active opportunities, and world-state signals that can affect today&apos;s plan.
                            </div>
                        </div>
                        <WorkspaceAction onClick={() => setActivePage("world_state")}>Full View</WorkspaceAction>
                    </div>
                    <DashboardWorldState />
                </WorkspacePanel>

                <div className="grid gap-4">
                    {hasProgressionSteps && (
                        <WorkspacePanel className="min-h-[340px] p-1">
                            <ProgressionNextStepsPanel />
                        </WorkspacePanel>
                    )}
                    <WorkspacePanel className="min-h-[340px] p-1">
                        <DailyChecklist expanded={!hasProgressionSteps} />
                    </WorkspacePanel>
                </div>
            </div>

            <WorkspacePanel className="p-1">
                <WarframeResetTracker />
            </WorkspacePanel>
        </div>
    );
}
