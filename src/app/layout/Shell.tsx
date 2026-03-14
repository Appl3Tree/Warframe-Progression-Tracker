// ===== FILE: src/app/layout/Shell.tsx =====
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Shell(props: { children: React.ReactNode }) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        // Full viewport, no overflow — nothing scrolls at this level
        <div className="h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100">

            {/* ── Slim fixed top bar ── */}
            <Topbar onMenuToggle={() => setMobileNavOpen((v) => !v)} />

            {/* ── Body: sidebar + content ── */}
            <div className="flex flex-1 min-h-0 overflow-hidden relative">

                {/* ── Mobile overlay backdrop ── */}
                {mobileNavOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/60 md:hidden"
                        onClick={() => setMobileNavOpen(false)}
                    />
                )}

                {/* ── Sidebar nav rail ── */}
                <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

                {/* ── Main content — only this area scrolls ── */}
                <main className="flex-1 min-w-0 overflow-y-auto">
                    {/* Inner wrapper gives pages a consistent max-width and padding */}
                    <div className="mx-auto max-w-7xl px-4 py-4">
                        {props.children}
                    </div>
                </main>
            </div>
        </div>
    );
}
