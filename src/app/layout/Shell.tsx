// ===== FILE: src/app/layout/Shell.tsx =====
import { useEffect, useState } from "react";
import { useTrackerStore } from "../../store/store";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { applyTheme, getStoredTheme } from "../../pages/Settings";
import { getRouteByKey } from "../routes";

const NEW_PLAYER_DISMISSED_KEY = "wft_newplayer_v1_dismissed";

// ── First-visit new player modal ─────────────────────────────────────────────

function NewPlayerModal({ onDismiss, onGo }: { onDismiss: () => void; onGo: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onDismiss} />

            {/* Card */}
            <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden">
                {/* Accent strip */}
                <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600" />

                <div className="p-6">
                    <div className="flex items-start gap-3">
                        {/* Book icon */}
                        <div className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 p-2.5">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-slate-100">New — or returning?</div>
                            <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                                Check out the <span className="font-semibold text-slate-100">Tenno's Handbook</span> — it covers
                                quest order and the systems that trip up both beginners and returning
                                players alike: Eidolons, Kuva &amp; Liches, Focus schools, Syndicates,
                                farming strategies, and more.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                        <button
                            onClick={onDismiss}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Don't show again
                        </button>
                        <button
                            onClick={onGo}
                            className="rounded-lg border border-blue-700 bg-blue-900/40 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-800/50 transition-colors"
                        >
                            Open Handbook →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function Shell(props: { children: React.ReactNode }) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [showNewPlayer, setShowNewPlayer] = useState(
        () => localStorage.getItem(NEW_PLAYER_DISMISSED_KEY) !== "1"
    );
    const setActivePage = useTrackerStore((s) => s.setActivePage);
    const activePage = useTrackerStore((s) => s.state.ui.activePage);

    // Apply saved theme on first mount
    useEffect(() => { applyTheme(getStoredTheme()); }, []);

    function dismissNewPlayer() {
        localStorage.setItem(NEW_PLAYER_DISMISSED_KEY, "1");
        setShowNewPlayer(false);
    }

    function goToHandbook() {
        setActivePage("handbook");
        dismissNewPlayer();
    }

    const activeRoute = getRouteByKey(activePage);
    const wideWorkspace = activeRoute.mode === "planning" || activeRoute.mode === "collection";

    return (
        <div className="wf-app-shell h-screen flex flex-col overflow-hidden text-slate-100">

            <Topbar onMenuToggle={() => setMobileNavOpen((v) => !v)} />

            <div className="flex flex-1 min-h-0 overflow-hidden relative">

                {mobileNavOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/60 md:hidden"
                        onClick={() => setMobileNavOpen(false)}
                    />
                )}

                <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

                <main className="flex-1 min-w-0 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(140,123,255,0.08),transparent_28%),radial-gradient(circle_at_right_top,rgba(73,198,193,0.06),transparent_24%)]">
                    <div className={[
                        "min-h-full py-4 lg:h-full",
                        wideWorkspace
                            ? "px-3 md:px-5 xl:px-7"
                            : "mx-auto max-w-[1600px] px-4 md:px-5 xl:px-6",
                    ].join(" ")}>
                        {props.children}
                    </div>
                </main>
            </div>

            {showNewPlayer && (
                <NewPlayerModal onDismiss={dismissNewPlayer} onGo={goToHandbook} />
            )}
        </div>
    );
}
