// ===== FILE: src/app/App.tsx =====
import React, { Suspense, lazy, useEffect, useState } from "react";
import Shell from "./layout/Shell";
import ErrorBoundary from "./ErrorBoundary";
import { useTrackerStore } from "../store/store";
import type { PageKey } from "../domain/models/userState";
import { buildSearchDetailHash, parseSearchDetailHash, type SearchDetailRef } from "../domain/search/globalSearch";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const WorldState = lazy(() => import("../pages/WorldState"));
const SearchDetail = lazy(() => import("../pages/SearchDetail"));
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
    search_detail: Dashboard,
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

function refsEqual(a: SearchDetailRef | null, b: SearchDetailRef | null): boolean {
    return a?.kind === b?.kind && a?.id === b?.id;
}

function useSearchDetailState(): [SearchDetailRef | null, () => void, (ref: SearchDetailRef, options?: { reset?: boolean }) => void, boolean, () => void] {
    const [stack, setStack] = useState<SearchDetailRef[]>(() => {
        const initial = parseSearchDetailHash(window.location.hash);
        return initial ? [initial] : [];
    });
    const detailRef = stack[stack.length - 1] ?? null;

    useEffect(() => {
        function syncFromHash() {
            const nextRef = parseSearchDetailHash(window.location.hash);
            setStack((current) => {
                if (!nextRef) return [];
                if (current.length === 0) return [nextRef];
                if (refsEqual(current[current.length - 1] ?? null, nextRef)) return current;
                return [nextRef];
            });
        }

        window.addEventListener("hashchange", syncFromHash);
        return () => window.removeEventListener("hashchange", syncFromHash);
    }, []);

    function closeDetail() {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        setStack([]);
    }

    function navigateDetail(nextRef: SearchDetailRef, options?: { reset?: boolean }) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${buildSearchDetailHash(nextRef)}`);
        setStack((current) => {
            if (options?.reset || current.length === 0) return [nextRef];
            if (refsEqual(current[current.length - 1] ?? null, nextRef)) return current;
            return [...current, nextRef];
        });
    }

    function goBack() {
        setStack((current) => {
            if (current.length <= 1) return current;
            const nextStack = current.slice(0, -1);
            const previous = nextStack[nextStack.length - 1] ?? null;
            if (previous) {
                window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${buildSearchDetailHash(previous)}`);
            } else {
                window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
            }
            return nextStack;
        });
    }

    return [detailRef, closeDetail, navigateDetail, stack.length > 1, goBack];
}

function SearchDetailPanel(props: { detailRef: SearchDetailRef; onClose: () => void; onNavigate: (ref: SearchDetailRef) => void; canGoBack: boolean; onBack: () => void }) {
    return (
        <div className="fixed inset-0 z-[70]">
            <button
                type="button"
                aria-label="Close detail panel"
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
                onClick={props.onClose}
            />
            <div className="absolute inset-y-0 right-0 w-full max-w-[920px] overflow-hidden border-l border-slate-800/80 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98))] shadow-2xl shadow-black/60">
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Codex Panel</div>
                            <div className="mt-1 text-sm text-slate-300">Inspect an item without leaving your current workspace.</div>
                        </div>
                        <div className="flex items-center gap-2">
                            {props.canGoBack ? (
                                <button
                                    type="button"
                                    onClick={props.onBack}
                                    aria-label="Go back to previous item"
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-700/90 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.94))] px-3 text-sm font-medium text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-slate-500 hover:bg-slate-800"
                                >
                                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                    <span className="hidden sm:inline">Back</span>
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={props.onClose}
                                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
                        <Suspense fallback={<PageLoadingFallback />}>
                            <SearchDetail detailRef={props.detailRef} onClose={props.onClose} onNavigate={props.onNavigate} canGoBack={props.canGoBack} onBack={props.onBack} mode="panel" />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    useDevStartupValidation();
    const [searchDetailRef, closeSearchDetail, navigateSearchDetail, canGoBackSearchDetail, goBackSearchDetail] = useSearchDetailState();
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
            {searchDetailRef ? (
                <SearchDetailPanel
                    detailRef={searchDetailRef}
                    onClose={closeSearchDetail}
                    onNavigate={(ref) => navigateSearchDetail(ref)}
                    canGoBack={canGoBackSearchDetail}
                    onBack={goBackSearchDetail}
                />
            ) : null}
        </div>
    );
}

