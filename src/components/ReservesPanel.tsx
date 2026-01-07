import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";

export default function ReservesPanel() {
    const reserves = useTrackerStore((s) => s.state.reserves) ?? [];
    const inventory = useTrackerStore((s) => s.state.inventory) ?? { credits: 0, voidTraces: 0, aya: 0, items: {} };
    const setReserveEnabled = useTrackerStore((s) => s.setReserveEnabled);
    const isBelowReserve = useTrackerStore((s) => s.isBelowReserve);

    const [spendKey, setSpendKey] = useState("Void Traces");
    const [spendAmount, setSpendAmount] = useState<number>(0);

    const keys = useMemo(() => {
        const fromInventory = Object.keys(inventory.items ?? {});
        const fromReserveItems = reserves.flatMap((r) => (r.items ?? []).map((i) => i.key));
        const all = Array.from(new Set([...fromInventory, ...fromReserveItems]));
        all.sort((a, b) => a.localeCompare(b));
        return all;
    }, [inventory.items, reserves]);

    const check = useMemo(() => {
        if (!spendKey) {
            return { blocked: false, reasons: [] as string[] };
        }
        return isBelowReserve(spendKey, Number.isFinite(spendAmount) ? spendAmount : 0);
    }, [isBelowReserve, spendKey, spendAmount]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Global Reserve Locks</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Reserve floors prevent you from spending items needed for future rank-ups and gates.
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">Quick “Would this spend be blocked?”</div>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                        <div className="text-xs text-slate-400">Item</div>
                        <select
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                            value={spendKey}
                            onChange={(e) => setSpendKey(e.target.value)}
                        >
                            {keys.length === 0 && <option value="Void Traces">Void Traces</option>}
                            {keys.map((k) => (
                                <option key={k} value={k}>
                                    {k}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="text-xs text-slate-400">Spend Amount</div>
                        <input
                            type="number"
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                            value={spendAmount}
                            onChange={(e) => setSpendAmount(parseInt(e.target.value || "0", 10))}
                            min={0}
                        />
                    </div>
                </div>

                <div className="mt-3">
                    {!check.blocked && (
                        <div className="text-sm text-slate-300">
                            Not blocked by enabled reserve rules (based on current local inventory).
                        </div>
                    )}
                    {check.blocked && (
                        <div className="text-sm text-red-300">
                            Blocked:
                            <ul className="mt-1 list-disc pl-5 text-red-200">
                                {check.reasons.map((r, idx) => (
                                    <li key={idx}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
                {reserves.length === 0 && (
                    <div className="text-sm text-slate-400">No reserve rules configured.</div>
                )}

                {reserves.map((r) => (
                    <div
                        key={r.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold break-words">{r.label}</div>
                                <div className="text-xs text-slate-400 break-words">{r.description}</div>
                            </div>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={!!r.isEnabled}
                                    onChange={(e) => setReserveEnabled(r.id, e.target.checked)}
                                />
                                Enabled
                            </label>
                        </div>

                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(r.items ?? []).map((it, idx) => {
                                const have = (inventory.items ?? {})[it.key] ?? 0;
                                const below = have < it.minKeep;

                                return (
                                    <div
                                        key={`${r.id}_${idx}`}
                                        className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-sm font-semibold">{it.key}</div>
                                            <div className="text-xs text-slate-400">
                                                Keep ≥ {it.minKeep}
                                            </div>
                                        </div>
                                        <div className="mt-1 text-xs">
                                            <span className="text-slate-400">Have: </span>
                                            <span className={below ? "text-red-300" : "text-slate-200"}>
                                                {have}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

