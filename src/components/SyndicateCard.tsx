import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import type { SyndicateState } from "../domain/types";

function getHaveForKey(key: string, credits: number, aya: number, voidTraces: number, items: Record<string, number>): number {
    if (key === "credits") {
        return credits;
    }
    if (key === "aya") {
        return aya;
    }
    if (key === "Void Traces") {
        return voidTraces;
    }
    return items[key] ?? 0;
}

export default function SyndicateCard(props: { syndicate: SyndicateState }) {
    const inventory = useTrackerStore((s) => s.inventory);
    const setNotes = useTrackerStore((s) => s.setSyndicateNotes);
    const isBelowReserve = useTrackerStore((s) => s.isBelowReserve);

    const [spendKey, setSpendKey] = useState("");
    const [spendAmount, setSpendAmount] = useState(0);

    const standingPct = useMemo(() => {
        if (props.syndicate.standingMaxForRank <= 0) {
            return 0;
        }
        return Math.min(100, Math.max(0, (props.syndicate.standingCurrent / props.syndicate.standingMaxForRank) * 100));
    }, [props.syndicate.standingCurrent, props.syndicate.standingMaxForRank]);

    const spendCheck = useMemo(() => {
        if (!spendKey || spendAmount <= 0) {
            return { blocked: false, reasons: [] as string[] };
        }
        return isBelowReserve(spendKey, spendAmount);
    }, [spendKey, spendAmount, isBelowReserve]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">{props.syndicate.name}</div>
                    <div className="text-sm text-slate-400">{props.syndicate.rankLabel}</div>
                </div>
                {props.syndicate.dailyCap && props.syndicate.dailyCap > 0 && (
                    <div className="text-xs text-slate-300 rounded-lg border border-slate-700 px-2 py-1">
                        Daily cap: {props.syndicate.dailyCap.toLocaleString()}
                    </div>
                )}
            </div>

            {props.syndicate.standingMaxForRank > 0 && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Standing</span>
                        <span>{props.syndicate.standingCurrent.toLocaleString()} / {props.syndicate.standingMaxForRank.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-900 border border-slate-800">
                        <div className="h-2 rounded-full bg-slate-200" style={{ width: `${standingPct}%` }} />
                    </div>
                </div>
            )}

            <div className="mt-4">
                <div className="text-sm font-semibold">Next rank-up</div>
                {!props.syndicate.nextRankUp && (
                    <div className="text-sm text-slate-400 mt-1">
                        No next-rank requirement captured yet for this syndicate.
                    </div>
                )}
                {props.syndicate.nextRankUp && (
                    <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                        <div className="text-sm text-slate-200 font-semibold">{props.syndicate.nextRankUp.title}</div>
                        <div className="mt-2 flex flex-col gap-1 text-sm text-slate-300">
                            {props.syndicate.nextRankUp.requirements.map((r) => {
                                const have = getHaveForKey(
                                    r.key,
                                    inventory.credits,
                                    inventory.aya,
                                    inventory.voidTraces,
                                    inventory.items
                                );
                                const remaining = Math.max(0, r.need - have);
                                const ok = have >= r.need;
                                return (
                                    <div key={`${props.syndicate.id}_${r.key}`} className="flex justify-between gap-3">
                                        <span>{r.key}</span>
                                        <span className={ok ? "text-green-300" : "text-slate-200"}>
                                            {have}/{r.need} {remaining > 0 ? `(need ${remaining})` : "(ok)"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <div className="text-sm font-semibold">Spend safety check</div>
                <div className="text-xs text-slate-400 mt-1">
                    This does not spend anything in-game. It only warns you if spending would violate reserve rules.
                </div>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                        className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                        placeholder="Item key (exact, e.g., Father Token)"
                        value={spendKey}
                        onChange={(e) => setSpendKey(e.target.value)}
                    />
                    <input
                        className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                        type="number"
                        min={0}
                        placeholder="Amount"
                        value={Number.isFinite(spendAmount) ? spendAmount : 0}
                        onChange={(e) => setSpendAmount(Number(e.target.value))}
                    />
                    <div className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2 text-sm">
                        {spendKey && spendAmount > 0 ? (
                            spendCheck.blocked ? (
                                <div className="text-red-300">
                                    BLOCKED
                                </div>
                            ) : (
                                <div className="text-green-300">
                                    OK
                                </div>
                            )
                        ) : (
                            <div className="text-slate-400">Enter key + amount</div>
                        )}
                    </div>
                </div>

                {spendCheck.blocked && (
                    <div className="mt-2 rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
                        <div className="font-semibold">Why blocked</div>
                        <ul className="mt-2 list-disc pl-5">
                            {spendCheck.reasons.map((r) => (
                                <li key={r}>{r}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <div className="text-sm font-semibold">Notes</div>
                <textarea
                    className="mt-2 w-full min-h-[88px] rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                    value={props.syndicate.notes}
                    onChange={(e) => setNotes(props.syndicate.id, e.target.value)}
                />
            </div>
        </div>
    );
}
