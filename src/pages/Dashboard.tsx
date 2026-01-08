import DailyChecklist from "../components/DailyChecklist";
import ReservesPanel from "../components/ReservesPanel";
import DashboardInventoryPanel from "../components/DashboardInventoryPanel";

export default function Dashboard() {
    return (
        <div className="space-y-6">
            <DailyChecklist />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <ReservesPanel />
                </div>

                <div className="space-y-6">
                    <DashboardInventoryPanel />
                </div>
            </div>
        </div>
    );
}

