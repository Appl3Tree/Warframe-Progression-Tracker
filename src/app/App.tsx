// ===== FILE: src/app/App.tsx =====
import React, { Suspense, lazy, useEffect, useState } from "react";
import Shell from "./layout/Shell";
import ErrorBoundary from "./ErrorBoundary";
import { useTrackerStore } from "../store/store";
import type { PageKey } from "../domain/models/userState";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const WorldState = lazy(() => import("../pages/WorldState"));
const Inventory = lazy(() => import("../pages/Inventory"));
const Arcanes = lazy(() => import("../pages/Arcanes"));
const StarChart = lazy(() => import("../pages/StarChart"));
const Prerequisites = lazy(() => import("../pages/Prerequisites"));
const Syndicates = lazy(() => import("../pages/Syndicates"));
const Goals = lazy(() => import("../pages/Goals"));
const Requirements = lazy(() => import("../pages/Requirements"));
const Handbook = lazy(() => import("../pages/Handbook"));
const Imports = lazy(() => import("../pages/Imports"));
const Settings = lazy(() => import("../pages/Settings"));
const Diagnostics = lazy(() => import("../pages/Diagnostics"));
const Mods = lazy(() => import("../pages/Mods"));
const Challenges = lazy(() => import("../pages/Challenges"));
const Intrinsics = lazy(() => import("../pages/Intrinsics"));
const RelicPlanner = lazy(() => import("../pages/Relics"));
const BuildPlanner = lazy(() => import("../pages/BuildPlanner"));

const PAGE_COMPONENTS: Record<PageKey, React.ComponentType> = {
    dashboard: Dashboard,
    world_state: WorldState,
    inventory: Inventory,
    arcanes: Arcanes,
    starchart: StarChart,
    prereqs: Prerequisites,
    syndicates: Syndicates,
    goals: Goals,
    requirements: Requirements,
    handbook: Handbook,
    imports: Imports,
    settings: Settings,
    diagnostics: Diagnostics,
    mods: Mods,
    challenges: Challenges,
    intrinsics: Intrinsics,
    build_planner: BuildPlanner,
    relic_planner: RelicPlanner,
    relics: RelicPlanner,
};

function PageLoadingFallback() {
    return (
        <div className="flex min-h-[40vh] items-center justify-center px-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-400 shadow-[0_18px_60px_rgba(2,6,23,0.35)]">
                Loading workspace...
            </div>
        </div>
    );
}

function useDevStartupValidation() {
    const [validationError, setValidationError] = useState<Error | null>(null);

    useEffect(() => {
        if (!import.meta.env.DEV) return;

        let active = true;
        void import("../domain/logic/startupValidation")
            .then((mod) => {
                if (!active) return;
                mod.validateDataOrThrow();
            })
            .catch((error) => {
                if (!active) return;
                setValidationError(error instanceof Error ? error : new Error(String(error)));
            });

        return () => {
            active = false;
        };
    }, []);

    if (validationError) {
        throw validationError;
    }
}

export default function App() {
    useDevStartupValidation();
    const activePage = useTrackerStore((s) => s.state.ui.activePage);
    const ActivePage = PAGE_COMPONENTS[activePage];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Shell>
                <Suspense fallback={<PageLoadingFallback />}>
                    <ErrorBoundary key={activePage} page={activePage}>
                        <ActivePage />
                    </ErrorBoundary>
                </Suspense>
            </Shell>
        </div>
    );
}

