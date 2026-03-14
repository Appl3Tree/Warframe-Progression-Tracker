// GoalCard — individual goal expansion card with tree view.
// Extracted from Goals.tsx (Phase 5 decomposition).

import { memo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTrackerStore } from "../../store/store";
import { useShallow } from "zustand/react/shallow";
import { FULL_CATALOG, type CatalogId } from "../../domain/catalog/loadFullCatalog";
import { CARD_STYLE, EMPTY_OBJ, getCachedIngredients, safeInt } from "./goalsUtils";
import { TreeModal } from "./GoalsModal";

export const GoalCard = memo(function GoalCard({ goalId }: { goalId: string }) {
    const d = useTrackerStore(useShallow((s) => {
        const goals = (s.state as any).goals;
        if (!Array.isArray(goals)) return null;

        let g: any = null;
        for (let i = 0; i < goals.length; i++) {
            if (String(goals[i]?.id) === goalId) { g = goals[i]; break; }
        }
        if (!g) return null;

        const cid = String(g.catalogId) as CatalogId;
        const counts = (s.state.inventory?.counts ?? EMPTY_OBJ) as Record<string, number>;
        const have = safeInt(counts[cid] ?? 0, 0);
        const qty = Math.max(1, safeInt(g.qty ?? 1, 1));

        // Blueprint sibling: "AcceltraBlueprint" for "Acceltra", etc.
        const bpCid = `${cid}Blueprint` as CatalogId;
        const hasBp = Boolean(FULL_CATALOG.recordsById[bpCid]);

        let blueprintObtained = false;
        let resourcesReady = 0;
        let resourcesTotal = 0;

        if (hasBp) {
            // Blueprint is obtained if we have one in inventory, OR if the item is already built
            blueprintObtained = safeInt(counts[bpCid] ?? 0, 0) >= 1 || have >= qty;

            const ingredients = getCachedIngredients(bpCid);
            for (const ing of ingredients) {
                const needed = ing.count * qty;
                resourcesTotal++;
                if (safeInt(counts[String(ing.catalogId)] ?? 0, 0) >= needed) resourcesReady++;
            }
        }

        return {
            catalogId: cid,
            bpCid: hasBp ? bpCid : null as CatalogId | null,
            qty,
            note: String(g.note ?? ""),
            isActive: g.isActive !== false,
            have,
            hasBp,
            blueprintObtained,
            resourcesReady,
            resourcesTotal,
        };
    }));

    const toggleGoalActive = useTrackerStore((s) => s.toggleGoalActive);
    const removeGoal = useTrackerStore((s) => s.removeGoal);
    const setGoalQty = useTrackerStore((s) => s.setGoalQty);
    const setGoalNote = useTrackerStore((s) => s.setGoalNote);

    const [expandedEdges, setExpandedEdges] = useState<Record<string, boolean>>({});
    const [isTreeOpen, setIsTreeOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const openTree = useCallback(() => {
        if (!d?.catalogId) return;
        const rootEdgeId = `root=>${d.catalogId}`;
        setExpandedEdges((prev) => prev[rootEdgeId] ? prev : { ...prev, [rootEdgeId]: true });
        setIsTreeOpen(true);
    }, [d?.catalogId]);

    const toggleEdge = useCallback((edgeId: string) => {
        setExpandedEdges((prev) => ({ ...prev, [edgeId]: !prev[edgeId] }));
    }, []);

    if (!d) return null;

    const { catalogId, qty, note, isActive, have, hasBp, blueprintObtained, resourcesReady, resourcesTotal } = d;
    const name = FULL_CATALOG.recordsById[catalogId]?.displayName ?? catalogId;
    const remaining = Math.max(0, qty - have);
    const pct = qty > 0 ? Math.min(100, Math.round((have / qty) * 100)) : 100;
    const done = remaining === 0;

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3" style={CARD_STYLE}>
            {/* Row 1: name + active badge + have/need */}
            <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold break-words">{name}</span>
                    <span className={[
                        "text-[10px] rounded-full border px-1.5 py-0.5 shrink-0",
                        isActive ? "border-emerald-800 text-emerald-300" : "border-slate-700 text-slate-500"
                    ].join(" ")}>
                        {isActive ? "Active" : "Inactive"}
                    </span>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">{have.toLocaleString()} / {qty.toLocaleString()}</span>
                    {!done && <span className="text-amber-300 font-semibold">{remaining.toLocaleString()} left</span>}
                    {done && <span className="text-emerald-400 font-semibold">✓ Done</span>}
                </div>
            </div>

            {/* Progress bar */}
            <div className="mt-1.5 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                    className={["h-full rounded-full transition-[width]", done ? "bg-emerald-500" : "bg-blue-500"].join(" ")}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Crafting pipeline status — derived from inventory, not manual checkboxes */}
            {hasBp && (
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px]">
                    <span className={blueprintObtained ? "text-emerald-400" : "text-slate-500"}>
                        {blueprintObtained ? "✓" : "○"} Blueprint
                    </span>
                    {resourcesTotal > 0 && (
                        <span className={
                            resourcesReady === resourcesTotal ? "text-emerald-400" :
                            resourcesReady > 0 ? "text-amber-400" : "text-slate-500"
                        }>
                            {resourcesReady === resourcesTotal ? "✓" : `${resourcesReady}/${resourcesTotal}`} Resources
                        </span>
                    )}
                    <span className={done ? "text-emerald-400" : "text-slate-500"}>
                        {done ? "✓" : "○"} Built
                    </span>
                </div>
            )}

            {/* Actions row */}
            <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                    className="rounded-md border border-slate-700 bg-slate-950/20 px-2 py-1 text-slate-300 text-xs hover:bg-slate-900/40"
                    onClick={() => toggleGoalActive(goalId)}
                >
                    {isActive ? "Set Inactive" : "Set Active"}
                </button>
                <button
                    className={[
                        "rounded-md border px-2 py-1 text-xs",
                        showDetails
                            ? "border-slate-600 bg-slate-800 text-slate-200"
                            : "border-slate-700 bg-slate-950/20 text-slate-400 hover:bg-slate-900/40"
                    ].join(" ")}
                    onClick={() => setShowDetails((v) => !v)}
                >
                    {showDetails ? "Hide Details" : "Qty / Note / Tree"}
                </button>
                <button
                    className="rounded-md border border-red-900/40 bg-red-950/20 px-2 py-1 text-red-300 text-xs hover:bg-red-950/30"
                    onClick={() => removeGoal(goalId)}
                >
                    Remove
                </button>
            </div>

            {/* Details panel: qty, note, requirements tree */}
            {showDetails && (
                <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-slate-400">Goal Qty</span>
                            <input
                                className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100 text-sm"
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) => setGoalQty(goalId, Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-slate-400">Note</span>
                            <input
                                className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-slate-100 text-sm"
                                value={note}
                                onChange={(e) => setGoalNote(goalId, e.target.value)}
                                placeholder="Optional note"
                            />
                        </label>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                            onClick={openTree}
                        >
                            Open Requirements Tree
                        </button>
                        <span className="text-[10px] text-slate-500">Ctrl+wheel / pinch to zoom · drag to pan</span>
                    </div>
                </div>
            )}

            {isTreeOpen && createPortal(
                <TreeModal
                    isOpen={true}
                    title={name}
                    subtitle={`Need ${qty.toLocaleString()} · Have ${have.toLocaleString()} · Remaining ${remaining.toLocaleString()}`}
                    onClose={() => setIsTreeOpen(false)}
                    rootCatalogId={catalogId}
                    rootNeed={Math.max(1, qty)}
                    inventoryCounts={{} as Record<string, number>}
                    expandedEdges={expandedEdges}
                    onToggleEdge={toggleEdge}
                />,
                document.body
            )}
        </div>
    );
});

