import { useTrackerStore } from "../store/store";

export default function Diagnostics() {
    const state = useTrackerStore((s) => s.state);
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">Diagnostics</div>
            <div className="text-sm text-slate-400 mt-1">
                Shows the current state envelope (Phase A). This is for debugging only.
            </div>

            <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-100">
                {JSON.stringify(state, null, 2)}
            </pre>
        </div>
    );
}

