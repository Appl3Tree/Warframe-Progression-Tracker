import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";

export default function InventoryPanel() {
    const inventory = useTrackerStore((s) => s.state.inventory) ?? { credits: 0, voidTraces: 0, aya: 0, items: {} };
    const setCredits = useTrackerStore((s) => s.setCredits);
    const setVoidTraces = useTrackerStore((s) => s.setVoidTraces);
    const setAya = useTrackerStore((s) => s.setAya);
    const setItemCount = useTrackerStore((s) => s.setItemCount);

    const [newKey, setNewKey] = useState("");
    const [newVal, setNewVal] = useState<number>(0);

    const itemEntries = useMemo(() => {
        const entries = Object.entries(inventory.items ?? {});
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        return entries;
    }, [inventory.items]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">Inventory</div>
            <div className="text-sm text-slate-400 mt-1">
                Manual counts used for “remaining” calculations. Import does not populate materials.
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="text-sm font-semibold">Credits</div>
                    <input
                        type="number"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                        value={inventory.credits ?? 0}
                        onChange={(e) => setCredits(parseInt(e.target.value || "0", 10))}
                        min={0}
                    />
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="text-sm font-semibold">Void Traces</div>
                    <input
                        type="number"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                        value={inventory.voidTraces ?? 0}
                        onChange={(e) => setVoidTraces(parseInt(e.target.value || "0", 10))}
                        min={0}
                    />
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="text-sm font-semibold">Aya</div>
                    <input
                        type="number"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                        value={inventory.aya ?? 0}
                        onChange={(e) => setAya(parseInt(e.target.value || "0", 10))}
                        min={0}
                    />
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">Add / Update Item</div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr_140px_120px] gap-2">
                    <input
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="Item key (e.g., Plastids)"
                    />
                    <input
                        type="number"
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                        value={newVal}
                        onChange={(e) => setNewVal(parseInt(e.target.value || "0", 10))}
                        min={0}
                    />
                    <button
                        className="rounded-lg bg-slate-100 px-4 py-2 text-slate-900 font-semibold"
                        onClick={() => {
                            const k = newKey.trim();
                            if (!k) {
                                return;
                            }
                            setItemCount(k, Number.isFinite(newVal) ? newVal : 0);
                            setNewKey("");
                            setNewVal(0);
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">All Items</div>

                {itemEntries.length === 0 && (
                    <div className="mt-2 text-sm text-slate-400">No items tracked yet.</div>
                )}

                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {itemEntries.map(([k, v]) => (
                        <div
                            key={k}
                            className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold break-words">{k}</div>
                                <input
                                    type="number"
                                    className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100 text-sm"
                                    value={Number(v ?? 0)}
                                    onChange={(e) => setItemCount(k, parseInt(e.target.value || "0", 10))}
                                    min={0}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

