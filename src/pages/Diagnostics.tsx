// ===== FILE: src/pages/Diagnostics.tsx =====
import { useMemo } from "react";
import { useTrackerStore } from "../store/store";
import {
    buildRequirementsSnapshot,
    buildFarmingSnapshot
} from "../domain/logic/requirementEngine";

function Section(props: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            {props.subtitle && <div className="text-sm text-slate-400 mt-1">{props.subtitle}</div>}
            <div className="mt-4">{props.children}</div>
        </div>
    );
}

function StatCard(props: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{props.label}</div>
            <div className="mt-1 font-mono text-xl text-slate-100">{props.value}</div>
        </div>
    );
}

export default function Diagnostics() {
    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const goals = useTrackerStore((s) => s.state.goals ?? []);
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const inventory = useTrackerStore((s) => s.state.inventory);

    const requirements = useMemo(() => {
        return buildRequirementsSnapshot({
            syndicates,
            goals,
            completedPrereqs,
            inventory
        });
    }, [syndicates, goals, completedPrereqs, inventory]);

    const farming = useMemo(() => {
        return buildFarmingSnapshot({
            requirements,
            completedPrereqs
        });
    }, [requirements, completedPrereqs]);

    const unknownAcquisition = farming.hidden.filter(
        (h) => h.reason === "unknown-acquisition"
    );

    return (
        <div className="space-y-6">
            <Section
                title="Diagnostics"
                subtitle="Fail-closed analysis of what is blocking progress. This page does not guess."
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Hidden (unknown acquisition)"
                        value={farming.stats.hiddenForUnknownAcquisition}
                    />
                    <StatCard
                        label="Hidden (no accessible sources)"
                        value={farming.stats.hiddenForNoAccessibleSources}
                    />
                    <StatCard
                        label="Actionable items"
                        value={farming.stats.actionableItemsWithKnownAcquisition}
                    />
                    <StatCard
                        label="Overlap sources"
                        value={farming.stats.overlapSourceCount}
                    />
                </div>
            </Section>

            <Section
                title="Top Blocking Sources"
                subtitle="Sources whose prereqs are currently unmet and block the most required items."
            >
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                    No blocking sources detected.
                </div>
            </Section>

            <Section
                title="Unknown Acquisition (Debug)"
                subtitle="Items required by goals or syndicates that have no acquisition mapping at all."
            >
                {unknownAcquisition.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                        No unknown-acquisition items detected.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {unknownAcquisition.map((h) => (
                            <div
                                key={String(h.key)}
                                className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                            >
                                <div className="text-sm font-semibold break-words">
                                    {h.name}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    Remaining {h.remaining.toLocaleString()}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 break-words">
                                    CatalogId:{" "}
                                    <span className="font-mono">{String(h.key)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
}
