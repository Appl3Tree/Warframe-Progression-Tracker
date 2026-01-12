import Shell from "./layout/Shell";
import { useTrackerStore } from "../store/store";
import type { PageKey } from "../domain/models/userState";

import Dashboard from "../pages/Dashboard";
import Inventory from "../pages/Inventory";
import Prerequisites from "../pages/Prerequisites";
import Syndicates from "../pages/Syndicates";
import Goals from "../pages/Goals";
import Requirements from "../pages/Requirements";
import Systems from "../pages/Systems";
import Imports from "../pages/Imports";
import Settings from "../pages/Settings";
import Diagnostics from "../pages/Diagnostics";

const PAGE_COMPONENTS: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard />,
    inventory: <Inventory />,
    prereqs: <Prerequisites />,
    syndicates: <Syndicates />,
    goals: <Goals />,
    requirements: <Requirements />,
    systems: <Systems />,
    imports: <Imports />,
    settings: <Settings />,
    diagnostics: <Diagnostics />
};

export default function App() {
    const activePage = useTrackerStore((s) => s.state.ui.activePage);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Shell>{PAGE_COMPONENTS[activePage]}</Shell>
        </div>
    );
}

