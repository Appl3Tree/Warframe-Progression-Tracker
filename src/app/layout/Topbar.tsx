export default function Topbar() {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <div className="text-xl font-bold">Warframe Roadmap Tracker</div>
            <div className="text-sm text-slate-400">
                Local-only tracker with progress packs. Default state assumes nothing is complete.
            </div>
        </div>
    );
}

