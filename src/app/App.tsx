// ===== FILE: src/app/App.tsx =====
import Shell from "./layout/Shell";
import { useTrackerStore } from "../store/store";
import type { PageKey } from "../domain/models/userState";

import Dashboard from "../pages/Dashboard";
import WorldState from "../pages/WorldState";
import Inventory from "../pages/Inventory";
import StarChart from "../pages/StarChart";
import Prerequisites from "../pages/Prerequisites";
import Syndicates from "../pages/Syndicates";
import Goals from "../pages/Goals";
import Requirements from "../pages/Requirements";
import Handbook from "../pages/Handbook";
import Imports from "../pages/Imports";
import Settings from "../pages/Settings";
import Diagnostics from "../pages/Diagnostics";
import Mods from "../pages/Mods";
import Challenges from "../pages/Challenges";
import Intrinsics from "../pages/Intrinsics";

const PAGE_COMPONENTS: Record<PageKey, React.ReactNode> = {
    dashboard:   <Dashboard />,
    world_state: <WorldState />,
    inventory:   <Inventory />,
    starchart: <StarChart />,
    prereqs: <Prerequisites />,
    syndicates: <Syndicates />,
    goals: <Goals />,
    requirements: <Requirements />,
    handbook: <Handbook />,
    imports: <Imports />,
    settings: <Settings />,
    diagnostics: <Diagnostics />,
    mods: <Mods />,
    challenges: <Challenges />,
    intrinsics: <Intrinsics />,

};

export default function App() {
    const activePage = useTrackerStore((s) => s.state.ui.activePage);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Shell>{PAGE_COMPONENTS[activePage]}</Shell>
        </div>
    );
}

