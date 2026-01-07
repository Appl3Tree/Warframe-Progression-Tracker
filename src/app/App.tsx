import Shell from "./layout/Shell";
import { useTrackerStore } from "../store/store";
import Dashboard from "../pages/Dashboard";
import Prerequisites from "../pages/Prerequisites";
import Syndicates from "../pages/Syndicates";
import Goals from "../pages/Goals";
import Requirements from "../pages/Requirements";
import Systems from "../pages/Systems";
import Imports from "../pages/Imports";
import Settings from "../pages/Settings";
import Diagnostics from "../pages/Diagnostics";

export default function App() {
    const activePage = useTrackerStore((s) => s.state.ui.activePage);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Shell>
                {activePage === "dashboard" && <Dashboard />}
                {activePage === "prereqs" && <Prerequisites />}
                {activePage === "syndicates" && <Syndicates />}
                {activePage === "goals" && <Goals />}
                {activePage === "requirements" && <Requirements />}
                {activePage === "systems" && <Systems />}
                {activePage === "imports" && <Imports />}
                {activePage === "settings" && <Settings />}
                {activePage === "diagnostics" && <Diagnostics />}
            </Shell>
        </div>
    );
}

