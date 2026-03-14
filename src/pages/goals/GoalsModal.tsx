// TreeModal — full-screen goal tree overlay.
// Extracted from Goals.tsx (Phase 5 decomposition).

import { useEffect } from "react";
import { type CatalogId } from "../../domain/catalog/loadFullCatalog";
import { ZoomableTreeViewport, TreeNode } from "./GoalsTreeView";

export function TreeModal(props: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    onClose: () => void;
    rootCatalogId: CatalogId;
    rootNeed: number;
    inventoryCounts: Record<string, number>;
    expandedEdges: Record<string, boolean>;
    onToggleEdge: (edgeId: string) => void;
}) {
    const { isOpen, title, subtitle, onClose, rootCatalogId, rootNeed, inventoryCounts, expandedEdges, onToggleEdge } =
        props;

    useEffect(() => {
        if (!isOpen) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const rootEdgeId = `root=>${String(rootCatalogId)}`;

    return (
        <div className="wf-tree-overlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
            <div className="wf-tree-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="wf-tree-modal-header">
                    <div className="wf-tree-modal-title">
                        <div className="t1">{title}</div>
                        <div className="t2">{subtitle}</div>
                    </div>

                    <div className="wf-tree-modal-actions">
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                            onClick={onClose}
                            data-wf-no-pan="true"
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className="wf-tree-modal-body">
                    <ZoomableTreeViewport>
                        <div className="wf-tree-root">
                            <ul className="wf-tree-ul">
                                <TreeNode
                                    nodeCatalogId={rootCatalogId}
                                    nodeNeed={rootNeed}
                                    inventoryCounts={inventoryCounts}
                                    depth={0}
                                    edgeId={rootEdgeId}
                                    expandedEdges={expandedEdges}
                                    onToggleEdge={onToggleEdge}
                                    maxDepth={12}
                                />
                            </ul>
                        </div>
                    </ZoomableTreeViewport>
                </div>
            </div>
        </div>
    );
}

/* ========================================================================================= */

/**
 * Self-contained goal card. Receives only a stable `goalId` string from the parent.
 *
 * All goal data + relevant inventory counts are fetched in a single useShallow selector
 * so only the card whose data actually changed re-renders.
 *
 * Crafting status (blueprint / resources / built) is derived automatically from inventory
 * counts rather than manual checkboxes — this keeps it accurate regardless of whether
 * the blueprint is tracked as a separate goal.
 *
 * content-visibility:auto on the outer div lets the browser skip off-screen rendering,
 * giving virtualization-like perf without any JS scrolling logic.
 */
