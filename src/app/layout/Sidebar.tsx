// ===== FILE: src/app/layout/Sidebar.tsx =====
import { useEffect, useState } from "react";
import { useTrackerStore } from "../../store/store";
import { NAV_ROUTES } from "../routes";
import { getStoredTheme, applyTheme, type AppTheme } from "../../pages/Settings";

// Page icons — simple SVG paths, one per route key
const PAGE_ICONS: Record<string, React.ReactNode> = {
    dashboard: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    ),
    inventory: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8h14M5 8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
            <path d="M10 12h4" />
        </svg>
    ),
    starchart: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    prereqs: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4" />
            <path d="M5 7h14M5 12h6M5 17h8" />
        </svg>
    ),
    syndicates: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="3" />
            <circle cx="17" cy="10" r="2.5" />
            <path d="M2 21v-1a7 7 0 0 1 14 0v1" />
            <path d="M17 13a5 5 0 0 1 5 5v1" />
        </svg>
    ),
    goals: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L3 7l9 5 9-5-9-5z" />
            <path d="M3 17l9 5 9-5" />
            <path d="M3 12l9 5 9-5" />
        </svg>
    ),
    requirements: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 16l4-4 4 4 4-6" />
        </svg>
    ),
    handbook: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    imports: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    settings: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    diagnostics: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    mods: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="11" rx="1.5" />
            <path d="M6.5 3v11" />
            <path d="M10 7H3" />
            <path d="M14 5h7M14 12h7M14 19h5" />
            <circle cx="13" cy="5" r="1" fill="currentColor" stroke="none" />
            <circle cx="13" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="13" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
    ),
    challenges: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
            <path d="M15 7a4 4 0 1 0-6 3.46V14h4v-3.54A4 4 0 0 0 15 7z" />
        </svg>
    ),
    intrinsics: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    ),
    world_state: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),

};

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
    const activePage = useTrackerStore((s) => s.state.ui.activePage);
    const setActivePage = useTrackerStore((s) => s.setActivePage);
    const [theme, setTheme] = useState<AppTheme>(getStoredTheme);

    useEffect(() => { applyTheme(getStoredTheme()); }, []);

    function toggleTheme() {
        const next: AppTheme = theme === "dark" ? "light" : "dark";
        setTheme(next);
        applyTheme(next);
    }

    const nav = (
        <nav className="flex flex-col gap-0.5 p-2 py-3 flex-1">
            {NAV_ROUTES.map((n) => {
                const active = n.key === activePage;
                return (
                    <button
                        key={n.key}
                        onClick={() => { setActivePage(n.key); onClose(); }}
                        className={[
                            "group flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                            active
                                ? "bg-slate-800 text-slate-100"
                                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        ].join(" ")}
                        title={n.desc}
                    >
                        {/* Active indicator bar */}
                        <span className={[
                            "absolute left-2 h-4 w-0.5 rounded-full transition-all",
                            active ? "bg-blue-400 opacity-100" : "opacity-0"
                        ].join(" ")} />

                        <span className={active ? "text-slate-100" : "text-slate-500 group-hover:text-slate-300"}>
                            {PAGE_ICONS[n.key]}
                        </span>
                        <span className="text-sm font-medium leading-none">
                            {n.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );

    const footer = (
        <div className="p-2 border-t border-slate-800/60 space-y-1 shrink-0">
            {/* Theme toggle */}
            <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
                {theme === "dark" ? (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                ) : (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                )}
                <span className="text-sm font-medium leading-none">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
            </button>

            {/* Ko-fi link */}
            <a
                href="https://ko-fi.com/appl3tree"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-amber-500/80 hover:bg-amber-950/20 hover:text-amber-400 transition-colors"
                title="Support on Ko-fi"
                onClick={onClose}
            >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/></svg>
                <span className="text-sm font-medium leading-none">Support</span>
            </a>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar — always visible on md+ */}
            <aside className="hidden md:flex flex-col w-48 shrink-0 border-r border-slate-800 bg-slate-950/60 overflow-y-auto">
                {nav}
                {footer}
            </aside>

            {/* Mobile drawer — slides in from left as a fixed overlay */}
            <aside className={[
                "fixed inset-y-0 left-0 z-40 flex flex-col w-56 border-r border-slate-800 bg-slate-950 overflow-y-auto transition-transform duration-200 md:hidden",
                mobileOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}>
                {/* Drawer header with close button */}
                <div className="flex items-center justify-between px-4 h-12 border-b border-slate-800 shrink-0">
                    <span className="text-sm font-semibold text-slate-200">Navigation</span>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                        aria-label="Close navigation"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {nav}
                {footer}
            </aside>
        </>
    );
}
