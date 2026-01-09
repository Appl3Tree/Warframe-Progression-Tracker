// ===== FILE: src/components/ReservesPanel.tsx =====
import { useEffect, useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";

function labelForKey(key: string): string {
    if (key === "credits") return "Credits";
    if (key === "platinum") return "Platinum";

    const rec = FULL_CATALOG.recordsById[key as any];
    if (rec?.displayName) return rec.displayName;

    return key;
}

export default function ReservesPanel() {
    const inventory =
        useTrackerStore((s) => s.state.inventory) ?? {
            credits: 0,
            platinum: 0,
            counts: {}
        };

    const getDerivedReserves = useTrackerStore((s) => s.getDerivedReserves);
    const isBelowReserve = useTrackerStore((s) => s.isBelowReserve);

    const derived = useMemo(() => getDerivedReserves(), [getDerivedReserves]);

    const keys = useMemo(() => {
        const out = derived.map((d) => d.key);
        out.sort((a, b) => a.localeCompare(b));
        return out;
    }, [derived]);

    const [spendKey, setSpendKey] = useState<string>("");
    const [spendAmount, setSpendAmount] = useState<number>(0);

    // If reserves appear later (e.g., after import), auto-select the first key.
    useEffect(() => {
        if (!spendKey && keys.length > 0) {
            setSpendKey(keys[0]);
        }
        if (spendKey && keys.length > 0 && !keys.includes(spendKey)) {
            setSpendKey(keys[0]);
        }
    }, [keys, spendKey]);

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
                        Reserves are computed automatically from your current accessible progression requirements
                        (conservative, fail-closed). They are not edited manually.
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">Quick “Would this spend be blocked?”</div>

                {keys.length === 0 ? (
                    <div className="mt-2 text-sm text-slate-400">
                        No derived reserves yet. This is expected until syndicate next-rank requirements exist in state
                        and are accessible via your current prerequisites.
                    </div>
                ) : (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <div className="text-xs text-slate-400">Item</div>
                            <select
                                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                                value={spendKey}
                                onChange={(e) => setSpendKey(e.target.value)}
                            >
                                {keys.map((k) => (
                                    <option key={k} value={k}>
                                        {labelForKey(k)}
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

                {spendKey && keys.length > 0 && (
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
                                Not blocked by current derived reserve floors.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">Derived Reserve Floors</div>

                {derived.length === 0 ? (
                    <div className="mt-2 text-sm text-slate-400">No derived reserve floors yet.</div>
                ) : (
                    <div className="mt-2 space-y-3">
                        {derived.map((r) => {
                            const have =
                                r.key === "credits"
                                    ? (inventory.credits ?? 0)
                                    : r.key === "platinum"
                                        ? (inventory.platinum ?? 0)
                                        : (inventory.counts?.[r.key] ?? 0);

                            const ok = have >= r.minKeep;

                            return (
                                <div key={r.key} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-semibold break-words">{labelForKey(r.key)}</div>
                                            <div className="text-xs text-slate-400 break-words mt-1">
                                                Key: <span className="font-mono">{r.key}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-mono text-slate-100">
                                                {Number(have).toLocaleString()} / {Number(r.minKeep).toLocaleString()}
                                            </div>
                                            <div className={ok ? "text-emerald-300 text-sm" : "text-amber-300 text-sm"}>
                                                {ok ? "OK" : "Below"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 text-sm text-slate-300">
                                        Reserved for:
                                        <ul className="mt-1 list-disc pl-5 space-y-1 text-slate-400">
                                            {[...(r.sources ?? [])]
                                                .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
                                                .map((s, idx) => (
                                                    <li key={`${r.key}_${idx}`}>
                                                        {s.syndicateName}: {s.amount.toLocaleString()}
                                                        {s.label ? ` (${s.label})` : ""}
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

