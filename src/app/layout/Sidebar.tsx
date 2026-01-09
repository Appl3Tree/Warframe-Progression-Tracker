// ===== FILE: src/app/layout/Sidebar.tsx =====
import { useTrackerStore } from "../../store/store";

type PageKey =
    | "dashboard"
    | "inventory"
    | "prereqs"
    | "syndicates"
    | "goals"
    | "requirements"
    | "systems"
    | "imports"
    | "settings"
    | "diagnostics";

const NAV: Array<{ key: PageKey; label: string; desc: string }> = [
    { key: "dashboard", label: "Dashboard", desc: "Today’s checklist and quick status." },
    { key: "inventory", label: "Inventory", desc: "Full catalog by category with filters." },
    { key: "prereqs", label: "Prerequisites", desc: "Quest/system unlocks (Phase B)." },
    { key: "syndicates", label: "Syndicates", desc: "Standing/ranks (Phase E)." },
    { key: "goals", label: "Goals", desc: "Personal goal portfolio (Phase D)." },
    { key: "requirements", label: "Farming", desc: "Targeted vs Overlap across goals + syndicates." },
    { key: "systems", label: "Systems", desc: "Nightwave/Kahl etc. (separate section)." },
    { key: "imports", label: "Import / Export", desc: "Progress Pack tools." },
    { key: "settings", label: "Settings", desc: "App preferences." },
    { key: "diagnostics", label: "Diagnostics", desc: "Validation and debug output." }
];

export default function Sidebar() {
    const activePage = useTrackerStore((s) => s.state.ui.activePage);
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    return (
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-sm font-semibold text-slate-200 px-2 pb-2">Navigation</div>

            <div className="flex flex-col gap-1">
                {NAV.map((n) => {
                    const active = n.key === activePage;
                    return (
                        <button
                            key={n.key}
                            className={[
                                "rounded-xl px-3 py-2 text-left border",
                                active
                                    ? "bg-slate-900 border-slate-700"
                                    : "bg-transparent border-transparent hover:bg-slate-900/50 hover:border-slate-800"
                            ].join(" ")}
                            onClick={() => setActivePage(n.key)}
                        >
                            <div className="text-sm font-semibold">{n.label}</div>
                            <div className="text-xs text-slate-400">{n.desc}</div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

