// ===== FILE: src/pages/Syndicates.tsx =====
import { useMemo } from "react";
import SyndicatesGrid from "../components/SyndicatesGrid";
import { useTrackerStore } from "../store/store";

export default function Syndicates() {
    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const pledgedCount = syndicates.filter((syndicate) => syndicate.pledged).length;
    const maxRankCount = useMemo(
        () => syndicates.filter((syndicate) => (syndicate.rank ?? 0) >= 5).length,
        [syndicates]
    );

    return (
        <div className="flex flex-col gap-4">
            <section className="rounded-[24px] border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-1)] px-5 py-4 shadow-[var(--wf-shadow-panel)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--wf-accent-primary)]">
                            Progression Workspace
                        </div>
                        <h1 className="mt-1 text-2xl font-semibold text-[color:var(--wf-text-strong)]">Syndicates</h1>
                        <p className="mt-1 text-sm text-[color:var(--wf-text-muted)]">
                            Track standings, negative relay relationships, and offering access. Manual edits are supported, and profile import can hydrate most current values.
                        </p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">Tracked syndicates</div>
                        <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">{syndicates.length.toLocaleString()}</div>
                        <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">All persisted syndicate ladders and factions.</div>
                    </div>
                    <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">Pledged</div>
                        <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">{pledgedCount.toLocaleString()}</div>
                        <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">Primary relay factions currently pledged.</div>
                    </div>
                    <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">High rank</div>
                        <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">{maxRankCount.toLocaleString()}</div>
                        <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">Entries currently at rank 5 or above.</div>
                    </div>
                    <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">Input mode</div>
                        <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">Manual + Import</div>
                        <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">Relay faction ranks support negatives down to -2.</div>
                    </div>
                </div>
            </section>

            <SyndicatesGrid />
        </div>
    );
}
