// ===== FILE: src/app/layout/Sidebar.tsx =====
import { useTrackerStore } from "../../store/store";
import { NAV_ROUTES } from "../routes";

export default function Sidebar() {
    const activePage = useTrackerStore((s) => s.state.ui.activePage);
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    return (
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-sm font-semibold text-slate-200 px-2 pb-2">
                Navigation
            </div>

            <div className="flex flex-col gap-1">
                {NAV_ROUTES.map((n) => {
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

