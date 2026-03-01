// ===== FILE: src/components/SyndicateRanksModal.tsx =====
import React, { useEffect, useMemo } from "react";
import type { SyndicateCostLine, SyndicateRankCatalog, SyndicateRankUpEdge } from "../domain/catalog/syndicates/syndicateRankCatalog";

function formatInt(n: number): string {
    return Number(n).toLocaleString();
}

function edgeLabel(edge: SyndicateRankUpEdge): string {
    const a = edge.fromRank;
    const b = edge.toRank;
    return `Rank ${a} \u2192 ${b}`;
}

function renderCostLine(line: SyndicateCostLine): string {
    if (line.kind === "credits") return `${formatInt(line.amount)} Credits`;
    if (line.kind === "platinum") return `${formatInt(line.amount)} Platinum`;
    return `${formatInt(line.count)} \u00D7 ${line.label}`;
}

export default function SyndicateRanksModal(props: {
    open: boolean;
    onClose: () => void;
    catalog: SyndicateRankCatalog;
}) {
    const { open, onClose, catalog } = props;

    const edgesSorted = useMemo(() => {
        const copy = [...(catalog.edges ?? [])];
        copy.sort((a, b) => {
            if (a.fromRank !== b.fromRank) return a.fromRank - b.fromRank;
            return a.toRank - b.toRank;
        });
        return copy;
    }, [catalog.edges]);

    const hasAny = edgesSorted.length > 0;

    useEffect(() => {
        if (!open) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onMouseDown={onClose} />

            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                    className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
                        <div className="min-w-0">
                            <div className="text-lg font-semibold text-slate-100">Rank Ups</div>
                            <div className="text-sm text-slate-400">
                                {catalog.name} \u00B7 Costs are shown as transitions (from \u2192 to) so negative ranks can never appear “free”.
                            </div>
                        </div>

                        <button
                            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>

                    <div className="max-h-[70vh] overflow-auto px-4 py-4">
                        {!hasAny ? (
                            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">
                                No rank-up data is populated for this syndicate yet.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {edgesSorted.map((edge) => (
                                    <div key={`${edge.fromRank}->${edge.toRank}`} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="text-sm font-semibold text-slate-100">{edgeLabel(edge)}</div>
                                            <div className="text-xs text-slate-500">
                                                {edge.costs === null ? "Not yet populated" : `${edge.costs.length} line(s)`}
                                            </div>
                                        </div>

                                        {edge.costs === null ? (
                                            <div className="mt-2 text-sm text-amber-200">
                                                Costs for this transition are not modeled yet, so the app will not imply it is free.
                                            </div>
                                        ) : (
                                            <ul className="mt-2 space-y-1 text-sm text-slate-200">
                                                {edge.costs.map((c, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
                                                        <span>{renderCostLine(c)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-800 px-4 py-3">
                        <div className="text-[11px] text-slate-500">
                            When you paste the rest of the wiki data, we’ll fill in unknown transitions (null) so every edge is accurate.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
