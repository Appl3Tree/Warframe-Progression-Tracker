import DailyChecklist from "../components/DailyChecklist";
import InventoryPanel from "../components/InventoryPanel";
import ReservesPanel from "../components/ReservesPanel";

export default function Dashboard() {
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <DailyChecklist />
                <ReservesPanel />
            </div>

            <InventoryPanel />

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-lg font-semibold">Next Steps</div>
                <div className="text-sm text-slate-400 mt-1">
                    Phase F will generate unlock-first, goal-aware daily steps here.
                </div>
            </div>
        </div>
    );
}

