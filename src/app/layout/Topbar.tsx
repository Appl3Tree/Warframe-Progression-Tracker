import { useEffect, useState } from "react";
import { useTrackerStore } from "../../store/store";

function clampInt(value: unknown, fallback: number): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

function formatInt(n: number | null): string {
    if (n === null) return "—";
    return Number(n).toLocaleString();
}

export default function Topbar() {
    const masteryRank = useTrackerStore((s) => s.state.player.masteryRank);
    const credits = useTrackerStore((s) => s.state.inventory.credits);
    const platinum = useTrackerStore((s) => s.state.inventory.platinum);

    const setMasteryRank = useTrackerStore((s) => s.setMasteryRank);
    const setCredits = useTrackerStore((s) => s.setCredits);
    const setPlatinum = useTrackerStore((s) => s.setPlatinum);

    const [editing, setEditing] = useState(false);

    const [mrDraft, setMrDraft] = useState<string>(masteryRank === null ? "" : String(masteryRank));
    const [creditsDraft, setCreditsDraft] = useState<string>(String(credits ?? 0));
    const [platDraft, setPlatDraft] = useState<string>(String(platinum ?? 0));

    // Keep drafts in sync when not editing (e.g., after import/reset).
    useEffect(() => {
        if (!editing) {
            setMrDraft(masteryRank === null ? "" : String(masteryRank));
            setCreditsDraft(String(credits ?? 0));
            setPlatDraft(String(platinum ?? 0));
        }
    }, [editing, masteryRank, credits, platinum]);

    function save() {
        if (mrDraft.trim() === "") {
            setMasteryRank(null);
        } else {
            setMasteryRank(clampInt(mrDraft, 0));
        }
        setCredits(clampInt(creditsDraft, 0));
        setPlatinum(clampInt(platDraft, 0));
        setEditing(false);
    }

    function cancel() {
        setMrDraft(masteryRank === null ? "" : String(masteryRank));
        setCreditsDraft(String(credits ?? 0));
        setPlatDraft(String(platinum ?? 0));
        setEditing(false);
    }

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
                <div className="min-w-0">
                    <div className="text-xl font-bold">Warframe Roadmap Tracker</div>
                    <div className="text-sm text-slate-400">
                        Local-only tracker with progress packs. Default state assumes nothing is complete.
                    </div>
                </div>

                <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-slate-300">Profile</div>

                        {!editing ? (
                            <button
                                className="flex items-center gap-2 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900"
                                onClick={() => setEditing(true)}
                                title="Edit profile values"
                            >
                                <span className="text-sm leading-none">✎</span>
                                Edit
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900"
                                    onClick={cancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="rounded-lg border border-slate-100 bg-slate-100 px-2 py-1 text-xs text-slate-900 hover:bg-white"
                                    onClick={save}
                                >
                                    Save
                                </button>
                            </div>
                        )}
                    </div>

                    {!editing ? (
                        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                            <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-2">
                                <div className="text-[11px] text-slate-400">MR</div>
                                <div className="font-mono text-slate-100">{formatInt(masteryRank)}</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-2">
                                <div className="text-[11px] text-slate-400">Credits</div>
                                <div className="font-mono text-slate-100">{Number(credits ?? 0).toLocaleString()}</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-2">
                                <div className="text-[11px] text-slate-400">Platinum</div>
                                <div className="font-mono text-slate-100">{Number(platinum ?? 0).toLocaleString()}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            <label className="flex flex-col gap-1">
                                <span className="text-[11px] text-slate-400">MR</span>
                                <input
                                    className="h-9 w-20 rounded-lg bg-slate-900 border border-slate-700 px-2 text-sm text-slate-100"
                                    type="number"
                                    min={0}
                                    value={mrDraft}
                                    onChange={(e) => setMrDraft(e.target.value)}
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[11px] text-slate-400">Credits</span>
                                <input
                                    className="h-9 w-32 rounded-lg bg-slate-900 border border-slate-700 px-2 text-sm text-slate-100"
                                    type="number"
                                    min={0}
                                    value={creditsDraft}
                                    onChange={(e) => setCreditsDraft(e.target.value)}
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[11px] text-slate-400">Platinum</span>
                                <input
                                    className="h-9 w-28 rounded-lg bg-slate-900 border border-slate-700 px-2 text-sm text-slate-100"
                                    type="number"
                                    min={0}
                                    value={platDraft}
                                    onChange={(e) => setPlatDraft(e.target.value)}
                                />
                            </label>
                        </div>
                    )}

                    <div className="mt-2 text-[11px] text-slate-500">
                        Click Edit to modify. Values are local unless exported via a progress pack.
                    </div>
                </div>
            </div>
        </div>
    );
}

