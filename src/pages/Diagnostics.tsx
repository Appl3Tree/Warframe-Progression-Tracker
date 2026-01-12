// ===== FILE: src/pages/Diagnostics.tsx =====
import { useMemo } from "react";
import { useTrackerStore } from "../store/store";
import {
    buildRequirementsSnapshot,
    buildFarmingSnapshot
} from "../domain/logic/requirementEngine";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../catalog/items/itemAcquisition";
import { SOURCE_INDEX } from "../catalog/sources/sourceCatalog";

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

type BlockingRow = {
    prereqId: string;
    blockedItemCount: number;
    blockedRemainingTotal: number;
    sampleItems: Array<{ name: string; remaining: number }>;
};

type CompletenessIssueRow = {
    catalogId: string;
    name: string;
    issue: "missing-acquisition" | "unknown-source";
    sources?: string[];
};

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

    const unknownAcquisition = farming.hidden.filter((h) => h.reason === "unknown-acquisition");

    const blocking = useMemo(() => {
        const rows = new Map<
            string,
            { blockedItemCount: number; blockedRemainingTotal: number; items: Array<{ name: string; remaining: number }> }
        >();

        const blockedItems = farming.hidden.filter((h) => h.reason === "missing-prereqs");

        for (const it of blockedItems) {
            const missing = Array.isArray(it.missingPrereqs) ? it.missingPrereqs : [];
            for (const pr of missing) {
                const key = String(pr);
                if (!rows.has(key)) {
                    rows.set(key, { blockedItemCount: 0, blockedRemainingTotal: 0, items: [] });
                }
                const agg = rows.get(key)!;
                agg.blockedItemCount += 1;
                agg.blockedRemainingTotal += Math.max(0, Math.floor(it.remaining ?? 0));
                agg.items.push({ name: it.name, remaining: Math.max(0, Math.floor(it.remaining ?? 0)) });
            }
        }

        const out: BlockingRow[] = Array.from(rows.entries()).map(([prereqId, v]) => {
            const items = [...v.items];
            items.sort((a, b) => {
                if (a.remaining !== b.remaining) return b.remaining - a.remaining;
                return a.name.localeCompare(b.name);
            });

            return {
                prereqId,
                blockedItemCount: v.blockedItemCount,
                blockedRemainingTotal: v.blockedRemainingTotal,
                sampleItems: items.slice(0, 5)
            };
        });

        out.sort((a, b) => {
            if (a.blockedItemCount !== b.blockedItemCount) return b.blockedItemCount - a.blockedItemCount;
            if (a.blockedRemainingTotal !== b.blockedRemainingTotal) return b.blockedRemainingTotal - a.blockedRemainingTotal;
            return a.prereqId.localeCompare(b.prereqId);
        });

        return out.slice(0, 15);
    }, [farming.hidden]);

    const completeness = useMemo(() => {
        const displayableInventoryIds = FULL_CATALOG.displayableInventoryItemIds;

        const missingAcq: CompletenessIssueRow[] = [];
        const unknownSourceRefs: CompletenessIssueRow[] = [];

        for (const id of displayableInventoryIds) {
            const rec = FULL_CATALOG.recordsById[id];
            const name = typeof rec?.displayName === "string" ? rec.displayName : String(id);

            const acq = getAcquisitionByCatalogId(id);

            if (!acq) {
                missingAcq.push({
                    catalogId: String(id),
                    name,
                    issue: "missing-acquisition"
                });
                continue;
            }

            const srcs = Array.isArray(acq.sources) ? acq.sources : [];
            if (srcs.length === 0) {
                missingAcq.push({
                    catalogId: String(id),
                    name,
                    issue: "missing-acquisition"
                });
                continue;
            }

            const unknown = srcs
                .map((s) => String(s))
                .filter((s) => !SOURCE_INDEX[s as any]);

            if (unknown.length > 0) {
                unknownSourceRefs.push({
                    catalogId: String(id),
                    name,
                    issue: "unknown-source",
                    sources: Array.from(new Set(unknown)).sort((a, b) => a.localeCompare(b))
                });
            }
        }

        missingAcq.sort((a, b) => a.name.localeCompare(b.name));
        unknownSourceRefs.sort((a, b) => a.name.localeCompare(b.name));

        const issues: CompletenessIssueRow[] = [...missingAcq, ...unknownSourceRefs];

        return {
            displayableInventoryCount: displayableInventoryIds.length,
            missingAcquisitionCount: missingAcq.length,
            unknownSourceRefCount: unknownSourceRefs.length,
            missingAcq,
            unknownSourceRefs,
            issues,
            issuesJson: JSON.stringify(
                {
                    stats: {
                        displayableInventoryCount: displayableInventoryIds.length,
                        missingAcquisitionCount: missingAcq.length,
                        unknownSourceRefCount: unknownSourceRefs.length
                    },
                    missingAcquisition: missingAcq.map((x) => ({ catalogId: x.catalogId, name: x.name })),
                    unknownSourceRefs: unknownSourceRefs.map((x) => ({
                        catalogId: x.catalogId,
                        name: x.name,
                        sources: x.sources ?? []
                    }))
                },
                null,
                2
            )
        };
    }, []);

    return (
        <div className="space-y-6">
            <Section
                title="Catalog Completeness"
                subtitle="Strict checks for Phase 1.2 data coverage. This does not guess."
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <StatCard label="Displayable inventory items" value={completeness.displayableInventoryCount} />
                    <StatCard label="Missing acquisition" value={completeness.missingAcquisitionCount} />
                    <StatCard label="Unknown source references" value={completeness.unknownSourceRefCount} />
                    <StatCard
                        label="Total completeness issues"
                        value={completeness.missingAcquisitionCount + completeness.unknownSourceRefCount}
                    />
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                            Missing acquisition (first 50)
                        </div>
                        {completeness.missingAcq.length === 0 ? (
                            <div className="text-sm text-slate-400">None.</div>
                        ) : (
                            <ul className="list-disc pl-5 space-y-0.5 text-sm text-slate-200">
                                {completeness.missingAcq.slice(0, 50).map((x) => (
                                    <li key={`missing:${x.catalogId}`} className="break-words">
                                        <span className="font-semibold">{x.name}</span>{" "}
                                        <span className="text-slate-500 font-mono">({x.catalogId})</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {completeness.missingAcq.length > 50 && (
                            <div className="mt-2 text-xs text-slate-500">
                                Showing 50 of {completeness.missingAcq.length.toLocaleString()}.
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                            Unknown source refs (first 50)
                        </div>
                        {completeness.unknownSourceRefs.length === 0 ? (
                            <div className="text-sm text-slate-400">None.</div>
                        ) : (
                            <div className="space-y-2">
                                {completeness.unknownSourceRefs.slice(0, 50).map((x) => (
                                    <div
                                        key={`unknownsrc:${x.catalogId}`}
                                        className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                                    >
                                        <div className="text-sm font-semibold break-words">{x.name}</div>
                                        <div className="text-[11px] text-slate-500 mt-1 break-words">
                                            CatalogId: <span className="font-mono">{x.catalogId}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-2 break-words">
                                            Unknown sources:{" "}
                                            <span className="font-mono">{(x.sources ?? []).join(", ")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {completeness.unknownSourceRefs.length > 50 && (
                            <div className="mt-2 text-xs text-slate-500">
                                Showing 50 of {completeness.unknownSourceRefs.length.toLocaleString()}.
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                        Completeness export (JSON)
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-xs text-slate-200 font-mono">
                        {completeness.issuesJson}
                    </pre>
                </div>
            </Section>

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
                        label="Hidden (missing prereqs)"
                        value={farming.stats.hiddenForMissingPrereqs}
                    />
                    <StatCard
                        label="Hidden (no accessible sources)"
                        value={farming.stats.hiddenForNoAccessibleSources}
                    />
                    <StatCard
                        label="Actionable items"
                        value={farming.stats.actionableItemsWithKnownAcquisition}
                    />
                </div>
            </Section>

            <Section
                title="Top Blocking Prereqs"
                subtitle="Prereqs whose completion would unlock the largest number of currently blocked required items."
            >
                {blocking.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                        No prereq blockers detected (or all blockers are uncurated source gates).
                    </div>
                ) : (
                    <div className="space-y-2">
                        {blocking.map((b) => (
                            <div
                                key={b.prereqId}
                                className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                            >
                                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
                                    <div className="text-sm font-semibold break-words">
                                        {b.prereqId}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        Blocks {b.blockedItemCount.toLocaleString()} items,{" "}
                                        {b.blockedRemainingTotal.toLocaleString()} remaining total
                                    </div>
                                </div>

                                {b.sampleItems.length > 0 && (
                                    <div className="mt-2 text-xs text-slate-400">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                                            Examples
                                        </div>
                                        <ul className="list-disc pl-5 space-y-0.5">
                                            {b.sampleItems.map((x) => (
                                                <li key={`${b.prereqId}:${x.name}`} className="break-words">
                                                    {x.name} (remaining {x.remaining.toLocaleString()})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
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

