import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";

export default function ReservesPanel() {
    const reserves = useTrackerStore((s) => s.state.reserves) ?? [];
    const inventory = useTrackerStore((s) => s.state.inventory) ?? { credits: 0, platinum: 0, counts: {} };
    const setReserveEnabled = useTrackerStore((s) => s.setReserveEnabled);
    const isBelowReserve = useTrackerStore((s) => s.isBelowReserve);

    const keys = useMemo(() => {
        const fromInventory = Object.keys(inventory.counts ?? {});
        const fromReserveItems = reserves.flatMap((r) => (r.items ?? []).map((i) => i.key));
        const all = Array.from(new Set([...fromInventory, ...fromReserveItems]));
        all.sort((a, b) => a.localeCompare(b));
        return all;
    }, [inventory.counts, reserves]);

    const [spendKey, setSpendKey] = useState<string>(() => keys[0] ?? "");
    const [spendAmount, setSpendAmount] = useState<number>(0);

    const check = useMemo(() => {
        if (!spendKey) return { blocked: false, reasons: [] as string[] };
        return isBelowReserve(spendKey, spendAmount);
    }, [isBelowReserve, spendKey, spendAmount]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Reserves</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Reserve floors prevent you from spending items needed for future rank-ups and gates.
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">Quick “Would this spend be blocked?”</div>

                {keys.length === 0 ? (
                    <div className="mt-2 text-sm text-slate-400">
                        No reserve keys yet. Add reserve rules or set inventory counts first.
                    </div>
                ) : (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <div className="text-xs text-slate-400">Item (catalog key)</div>
                            <select
                                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                                value={spendKey}
                                onChange={(e) => setSpendKey(e.target.value)}
                            >
                                {keys.map((k) => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="text-xs text-slate-400">Spend amount</div>
                            <input
                                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                                type="number"
                                min={0}
                                value={spendAmount}
                                onChange={(e) => setSpendAmount(Number(e.target.value))}
                            />
                        </div>
                    </div>
                )}

                {spendKey && (
                    <div className="mt-3 text-sm">
                        {check.blocked ? (
                            <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-red-200">
                                <div className="font-semibold">Blocked</div>
                                <ul className="mt-1 list-disc pl-5 space-y-1">
                                    {check.reasons.map((r) => (
                                        <li key={r}>{r}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-emerald-200">
                                Not blocked by current reserve floors.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">Reserve Rules</div>

                {reserves.length === 0 ? (
                    <div className="mt-2 text-sm text-slate-400">
                        No reserve rules yet. Phase C will replace this with computed “Reserved for …” breakdowns.
                    </div>
                ) : (
                    <div className="mt-2 space-y-3">
                        {reserves.map((r) => (
                            <div key={r.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-semibold">{r.label}</div>
                                        <div className="text-xs text-slate-400">{r.id}</div>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={!!r.isEnabled}
                                            onChange={(e) => setReserveEnabled(r.id, e.target.checked)}
                                        />
                                        Enabled
                                    </label>
                                </div>

                                <div className="mt-3 space-y-1 text-sm">
                                    {(r.items ?? []).map((it) => {
                                        const have = inventory.counts?.[it.key] ?? 0;
                                        const ok = have >= it.minKeep;
                                        return (
                                            <div
                                                key={it.key}
                                                className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/20 px-2 py-1"
                                            >
                                                <span className="truncate text-slate-300">{it.key}</span>
                                                <span className="font-mono text-slate-100">
                                                    {Number(have).toLocaleString()} / {Number(it.minKeep).toLocaleString()}
                                                </span>
                                                <span className={ok ? "text-emerald-300" : "text-amber-300"}>
                                                    {ok ? "OK" : "Below"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

