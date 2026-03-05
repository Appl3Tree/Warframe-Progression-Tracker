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
                        Resets all your tracked progress back to the default starting state.
                        <span className="text-slate-300"> Your browser save is kept &mdash; refreshing the page will restore this reset.</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Use this when you want a clean slate without fully wiping your saved data.
                    </div>

                    <div className="mt-3">
                        <button
                            className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                            onClick={() => {
                                const ok = confirm(
                                    "Reset to Defaults?\n\nThis resets all tracked progress to the default starting state.\nYour browser save is kept — refreshing will restore this reset.\n\nContinue?"
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
                        Permanently deletes all saved browser data for this app and rebuilds from scratch.
                        <span className="text-slate-300"> This cannot be undone &mdash; old data will not come back on refresh.</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Use this when you want to fully start over, as if you had never opened the app before.
                    </div>

                    <div className="mt-3">
                        <button
                            className="rounded-lg border border-rose-700 px-4 py-2 text-rose-200 hover:bg-rose-950/30"
                            onClick={() => {
                                const ok = confirm(
                                    "Reset All Local Data?\n\nThis permanently deletes all saved browser data and cannot be undone.\nYour progress will not be recoverable after this.\n\nContinue?"
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
