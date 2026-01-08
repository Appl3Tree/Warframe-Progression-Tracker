import { useTrackerStore } from "../store/store";

export default function Settings() {
    const resetToDefaults = useTrackerStore((s) => s.resetToDefaults);
    const resetAllLocalData = useTrackerStore((s) => s.resetAllLocalData);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">Settings</div>
            <div className="text-sm text-slate-400 mt-1">
                Reset options control both what you see now and what remains saved in your browser.
            </div>

            <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="text-sm font-semibold text-slate-100">Reset to Defaults</div>
                    <div className="mt-1 text-sm text-slate-400">
                        Resets your current in-app state back to the default seed. This is a quick “start over” inside the app.
                        <span className="text-slate-300"> It does not remove the saved browser entry.</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Use this when you just want a clean slate right now.
                    </div>

                    <div className="mt-3">
                        <button
                            className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                            onClick={() => {
                                const ok = confirm(
                                    "Reset to Defaults:\n\nThis resets the current in-app state back to defaults.\nIt does NOT delete saved browser data.\n\nContinue?"
                                );
                                if (ok) {
                                    resetToDefaults();
                                    alert("Reset to Defaults complete.");
                                }
                            }}
                        >
                            Reset to Defaults
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-rose-900/70 bg-rose-950/10 p-3">
                    <div className="text-sm font-semibold text-rose-200">Reset All Local Data</div>
                    <div className="mt-1 text-sm text-slate-400">
                        Deletes the saved browser data for this app (<span className="font-mono text-slate-300">wf_tracker_state_v3</span>)
                        and then rebuilds defaults. This is the “as if you never opened the app before” reset.
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Use this when testing seed changes, debugging persistence/migrations, or when you want to guarantee no old data can come back after a refresh.
                    </div>

                    <div className="mt-3">
                        <button
                            className="rounded-lg border border-rose-700 px-4 py-2 text-rose-200 hover:bg-rose-950/30"
                            onClick={() => {
                                const ok = confirm(
                                    "Reset All Local Data (Hard Reset):\n\nThis deletes the saved browser data key wf_tracker_state_v3.\nAfter this, old data cannot come back on refresh.\n\nContinue?"
                                );
                                if (ok) {
                                    resetAllLocalData();
                                    alert("Hard reset complete.");
                                }
                            }}
                        >
                            Reset All Local Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

