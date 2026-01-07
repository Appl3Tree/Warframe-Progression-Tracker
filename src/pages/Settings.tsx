import { useTrackerStore } from "../store/store";

export default function Settings() {
    const resetToDefaults = useTrackerStore((s) => s.resetToDefaults);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">Settings</div>
            <div className="text-sm text-slate-400 mt-1">
                Phase A includes only state reset. Future settings land later.
            </div>

            <div className="mt-4">
                <button
                    className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                    onClick={() => {
                        const ok = confirm("Reset all local progress to defaults?");
                        if (ok) {
                            resetToDefaults();
                            alert("Reset complete.");
                        }
                    }}
                >
                    Reset to Defaults
                </button>
            </div>
        </div>
    );
}

