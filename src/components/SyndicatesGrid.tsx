import { useMemo } from "react";
import { useTrackerStore } from "../store/store";

function asNumber(value: unknown, fallback: number): number {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback: string): string {
    return typeof value === "string" && value.trim() ? value : fallback;
}

export default function SyndicatesGrid() {
    const syndicates = useTrackerStore((s) => s.state.syndicates) ?? [];
    const setSyndicateNotes = useTrackerStore((s) => s.setSyndicateNotes);

    const sorted = useMemo(() => {
        const copy = [...(syndicates ?? [])];
        copy.sort((a: any, b: any) => {
            const an = asString(a?.name ?? a?.label, "Unknown Syndicate");
            const bn = asString(b?.name ?? b?.label, "Unknown Syndicate");
            return an.localeCompare(bn);
        });
        return copy;
    }, [syndicates]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sorted.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
                    No syndicates seeded. Check domain/seed.ts.
                </div>
            )}

            {sorted.map((raw: any) => {
                const id = asString(raw?.id, `syn_${Math.random().toString(16).slice(2)}`);

                const name = asString(raw?.name ?? raw?.label, "Unknown Syndicate");

                // Accept common variants from legacy seed data.
                const rank = asNumber(raw?.rank ?? raw?.currentRank, 0);

                const standing = asNumber(
                    raw?.standing ?? raw?.currentStanding ?? raw?.standingValue,
                    0
                );

                const maxStanding = asNumber(
                    raw?.maxStanding ?? raw?.rankCap ?? raw?.standingCap ?? raw?.nextRankStanding,
                    0
                );

                const dailyCap = asNumber(
                    raw?.dailyCap ?? raw?.capDaily ?? raw?.dailyStandingCap,
                    0
                );

                const notes = asString(raw?.notes, "");

                const nextRankReqs = Array.isArray(raw?.nextRankReqs)
                    ? raw.nextRankReqs
                    : Array.isArray(raw?.nextRankRequirements)
                        ? raw.nextRankRequirements
                        : [];

                return (
                    <div
                        key={id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-lg font-semibold break-words">{name}</div>
                                <div className="text-sm text-slate-400">
                                    Rank {rank}
                                    {" • "}
                                    {standing.toLocaleString()}
                                    {maxStanding > 0 ? `/${maxStanding.toLocaleString()}` : ""}
                                </div>
                            </div>

                            {dailyCap > 0 && (
                                <div className="text-xs text-slate-400">
                                    Cap: {dailyCap.toLocaleString()}/day
                                </div>
                            )}
                        </div>

                        <div className="mt-3">
                            <div className="text-xs text-slate-400 mb-1">Notes</div>
                            <textarea
                                className="w-full min-h-[80px] rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm"
                                value={notes}
                                onChange={(e) => setSyndicateNotes(id, e.target.value)}
                                placeholder="Optional notes..."
                            />
                        </div>

                        {nextRankReqs.length > 0 && (
                            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                <div className="text-sm font-semibold">Next Rank Requirements</div>
                                <ul className="mt-2 list-disc pl-5 text-sm text-slate-200">
                                    {nextRankReqs.map((r: string, idx: number) => (
                                        <li key={idx}>{r}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

