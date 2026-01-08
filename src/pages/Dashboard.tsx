import DailyChecklist from "../components/DailyChecklist";
import ReservesPanel from "../components/ReservesPanel";
import DashboardInventoryPanel from "../components/DashboardInventoryPanel";
import ProgressionNextStepsPanel from "../components/ProgressionNextStepsPanel";
import { useTrackerStore } from "../store/store";

export default function Dashboard() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold">Dashboard</div>
                        <div className="text-sm text-slate-400 mt-1">
                            Work on next unlocks, track today, and protect future requirements.
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-lg bg-slate-100 px-3 py-2 text-slate-900 text-sm font-semibold"
                            onClick={() => setActivePage("prereqs")}
                        >
                            Prerequisites
                        </button>
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => setActivePage("inventory")}
                        >
                            Full Inventory
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <ProgressionNextStepsPanel />
                    <DailyChecklist />
                    <ReservesPanel />
                </div>

                <div className="space-y-6">
                    <DashboardInventoryPanel />
                </div>
            </div>
        </div>
    );
}

