// ===== FILE: src/components/SyndicateCard.tsx =====
import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import type { SyndicateState } from "../domain/types";

function getHaveForKey(key: string, credits: number, platinum: number, counts: Record<string, number>): number {
    if (key === "credits") return credits;
    if (key === "platinum") return platinum;
    return counts[key] ?? 0;
}

type ProgressionModel = "standing" | "nightwave" | "no-standing" | "event-standing";

function classifyProgression(id: string, name: string): { model: ProgressionModel; label: string; detail: string; showStanding: boolean; showDailyCap: boolean } {
    const key = `${id} ${name}`.toLowerCase();

    if (key.includes("nightwave")) {
        return {
            model: "nightwave",
            label: "System",
            detail: "Progress via Nightwave Acts/points; separate currency (Nora’s Creds).",
            showStanding: false,
            showDailyCap: false
        };
    }

    if (key.includes("kahl") || key.includes("kahls_garrison") || key.includes("kahls garrison")) {
        return {
            model: "no-standing",
            label: "No Standing",
            detail: "Ranks advance via weekly Break Narmer progression; currency-driven purchases.",
            showStanding: false,
            showDailyCap: false
        };
    }

    if (key.includes("nightcap")) {
        return {
            model: "no-standing",
            label: "No Standing",
            detail: "Ranks advance via Nightcap-specific turn-ins/analysis; currency-driven purchases.",
            showStanding: false,
            showDailyCap: false
        };
    }

    if (key.includes("operational") || key.includes("operation") || key.includes("supply")) {
        return {
            model: "event-standing",
            label: "Event",
            detail: "Event-scoped standing progression tied to active operations.",
            showStanding: true,
            showDailyCap: false
        };
    }

    return {
        model: "standing",
        label: "Standing",
        detail: "Classic standing-based syndicate progression.",
        showStanding: true,
        showDailyCap: true
    };
}

function pillTone(model: ProgressionModel): string {
    if (model === "standing") return "border-sky-700/60 bg-sky-950/30 text-sky-200";
    if (model === "nightwave") return "border-violet-700/60 bg-violet-950/25 text-violet-200";
    if (model === "event-standing") return "border-rose-700/60 bg-rose-950/25 text-rose-200";
    return "border-amber-700/60 bg-amber-950/25 text-amber-200";
}

export default function SyndicateCard(props: { syndicate: SyndicateState }) {
    const inventory = useTrackerStore((s) => s.state.inventory);

    const [showNotes, setShowNotes] = useState(false);
    const [notesDraft, setNotesDraft] = useState(props.syndicate.notes ?? "");

    const reqs = props.syndicate.nextRankUp?.items ?? [];
    const creditsReq = props.syndicate.nextRankUp?.credits ?? 0;
    const platReq = props.syndicate.nextRankUp?.platinum ?? 0;

    const haveCredits = inventory.credits ?? 0;
    const havePlat = inventory.platinum ?? 0;

    const prog = classifyProgression(props.syndicate.id, props.syndicate.name);

    const readiness = useMemo(() => {
        const missing: string[] = [];

        if (creditsReq > 0 && haveCredits < creditsReq) {
            missing.push(`Credits: need ${creditsReq.toLocaleString()} (have ${haveCredits.toLocaleString()})`);
        }
        if (platReq > 0 && havePlat < platReq) {
            missing.push(`Platinum: need ${platReq.toLocaleString()} (have ${havePlat.toLocaleString()})`);
        }

        for (const r of reqs) {
            const have = getHaveForKey(r.key, haveCredits, havePlat, inventory.counts ?? {});
            if (have < r.count) {
                missing.push(`${r.label ?? r.key}: need ${r.count.toLocaleString()} (have ${have.toLocaleString()})`);
            }
        }

        return { ready: missing.length === 0, missing };
    }, [creditsReq, haveCredits, platReq, havePlat, reqs, inventory.counts]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold">{props.syndicate.name}</div>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${pillTone(prog.model)}`} title={prog.detail}>
                            {prog.label}
                        </span>
                    </div>
                    <div className="text-sm text-slate-400">
                        Rank {props.syndicate.rank} {props.syndicate.rankLabel ? `• ${props.syndicate.rankLabel}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{prog.detail}</div>
                </div>

                {prog.showDailyCap && props.syndicate.dailyCap && props.syndicate.dailyCap > 0 && (
                    <div className="text-xs text-slate-300 rounded-lg border border-slate-700 px-2 py-1">
                        Daily cap: {props.syndicate.dailyCap.toLocaleString()}
                    </div>
                )}
            </div>

            {prog.showStanding ? (
                <div className="mt-3 text-sm text-slate-300">
                    Standing: {props.syndicate.standing.toLocaleString()}
                    {props.syndicate.standingCap ? ` / ${props.syndicate.standingCap.toLocaleString()}` : ""}
                </div>
            ) : (
                <div className="mt-3 text-sm text-slate-400">Standing: not applicable for this progression model.</div>
            )}

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">Next Rank-Up (if defined)</div>

                {creditsReq === 0 && platReq === 0 && reqs.length === 0 ? (
                    <div className="mt-2 text-sm text-slate-400">No ladder requirements embedded yet.</div>
                ) : (
                    <>
                        <div className="mt-2 space-y-1 text-sm">
                            {creditsReq > 0 && (
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-300">Credits</span>
                                    <span className="font-mono text-slate-100">
                                        {haveCredits.toLocaleString()} / {creditsReq.toLocaleString()}
                                    </span>
                                </div>
                            )}
                            {platReq > 0 && (
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-300">Platinum</span>
                                    <span className="font-mono text-slate-100">
                                        {havePlat.toLocaleString()} / {platReq.toLocaleString()}
                                    </span>
                                </div>
                            )}
                            {reqs.map((r) => {
                                const have = inventory.counts?.[r.key] ?? 0;
                                return (
                                    <div key={r.key} className="flex items-center justify-between gap-3">
                                        <span className="truncate text-slate-300">{r.label ?? r.key}</span>
                                        <span className="font-mono text-slate-100">
                                            {have.toLocaleString()} / {r.count.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-3 text-sm">
                            {readiness.ready ? (
                                <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-emerald-200">
                                    Ready for rank-up requirements.
                                </div>
                            ) : (
                                <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-amber-200">
                                    <div className="font-semibold">Missing</div>
                                    <ul className="mt-1 list-disc pl-5 space-y-1">
                                        {readiness.missing.map((m) => (
                                            <li key={m}>{m}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="mt-4">
                <button
                    className="rounded-lg border border-slate-700 px-3 py-2 text-slate-100 hover:bg-slate-900 text-sm"
                    onClick={() => setShowNotes((v) => !v)}
                >
                    {showNotes ? "Hide Notes" : "Show Notes"}
                </button>

                {showNotes && (
                    <div className="mt-2">
                        <textarea
                            className="w-full min-h-[80px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            placeholder="Notes..."
                        />
                        <div className="mt-1 text-xs text-slate-500">
                            Notes editing is wired in the main Syndicates grid; this component may be unused depending on layout.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
