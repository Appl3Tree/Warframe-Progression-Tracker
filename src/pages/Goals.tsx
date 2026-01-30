// ===== FILE: src/pages/Goals.tsx =====
import React, { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { useTrackerStore } from "../store/store";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";
import { buildRequirementsSnapshot } from "../domain/logic/requirementEngine";
import { getItemRequirements } from "../catalog/items/itemRequirements";

type GoalsTab = "personal" | "requirements" | "total";

const EMPTY_OBJ: Record<string, boolean> = {};
const EMPTY_ARR: any[] = [];

function Section(props: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            {props.subtitle && <div className="text-sm text-slate-400 mt-1">{props.subtitle}</div>}
            <div className="mt-4">{props.children}</div>
        </div>
    );
}

function PillButton(props: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            className={[
                "rounded-full px-3 py-1 text-sm border",
                props.active
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900"
            ].join(" ")}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
}

type GoalRow = {
    catalogId: CatalogId;
    name: string;
    personalNeed: number;
    requirementsNeed: number;
    totalNeed: number;
    have: number;
    remaining: number;
};

function safeInt(v: unknown, fallback: number): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

function isExplicitBlueprintItem(catalogId: CatalogId, name: string): boolean {
    const cidStr = String(catalogId).toLowerCase();
    const nm = String(name ?? "").toLowerCase();
    if (nm.endsWith(" blueprint")) return true;
    if (cidStr.endsWith("blueprint")) return true;
    return false;
}

function getSiblingBlueprintCatalogIdForOutput(outputCatalogId: CatalogId): CatalogId | null {
    const key = String(outputCatalogId);
    const bpCandidate = `${key}Blueprint` as CatalogId;
    if (FULL_CATALOG.recordsById[bpCandidate]) return bpCandidate;
    return null;
}

type ReqChild = {
    catalogId: CatalogId;
    count: number;
};

function getDirectRequirementsForExpansion(catalogId: CatalogId): ReqChild[] {
    const rec = FULL_CATALOG.recordsById[catalogId];
    const name = rec?.displayName ?? String(catalogId);

    // Craftable OUTPUT => show Blueprint only (qty 1) and let Blueprint expand to ingredients.
    if (!isExplicitBlueprintItem(catalogId, name)) {
        const bp = getSiblingBlueprintCatalogIdForOutput(catalogId);
        if (bp) {
            return [{ catalogId: bp, count: 1 }];
        }
    }

    const raw = getItemRequirements(catalogId);
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const agg = new Map<string, ReqChild>();
    for (const c of raw) {
        const cid = String((c as any).catalogId ?? "") as CatalogId;
        if (!cid) continue;
        const ct = Math.max(1, safeInt((c as any).count ?? 0, 0));

        const existing = agg.get(cid);
        if (existing) {
            existing.count += ct;
        } else {
            agg.set(cid, { catalogId: cid, count: ct });
        }
    }

    return Array.from(agg.values()).sort((a, b) => String(a.catalogId).localeCompare(String(b.catalogId)));
}

function fmtI(n: number): string {
    return Math.max(0, Math.floor(Number(n) || 0)).toLocaleString();
}

/* =========================================================================================
 * Tree UI (modal) - connector fixes + LOCAL zoom/pan (no page zoom)
 * ========================================================================================= */

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

type ZoomState = {
    scale: number;
    panX: number;
    panY: number;
};

function ZoomableTreeViewport(props: { children: React.ReactNode }) {
    const outerRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const [z, setZ] = useState<ZoomState>({ scale: 1, panX: 0, panY: 0 });

    const isPanningRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const pinchRef = useRef<{
        active: boolean;
        startDist: number;
        startScale: number;
        startPanX: number;
        startPanY: number;
        startCenterX: number;
        startCenterY: number;
        pointerA: { id: number; x: number; y: number } | null;
        pointerB: { id: number; x: number; y: number } | null;
    }>({
        active: false,
        startDist: 0,
        startScale: 1,
        startPanX: 0,
        startPanY: 0,
        startCenterX: 0,
        startCenterY: 0,
        pointerA: null,
        pointerB: null
    });

    const transform = useMemo(() => {
        return `translate(${z.panX}px, ${z.panY}px) scale(${z.scale})`;
    }, [z.panX, z.panY, z.scale]);

    // Center the tree on open/resize based on content bounding box
    const recenterToContent = useCallback((targetScale?: number) => {
        const outer = outerRef.current;
        const content = contentRef.current;
        if (!outer || !content) return;

        const o = outer.getBoundingClientRect();

        // We need content "natural" size. Since content is transformed, use scrollWidth/Height of inner wrapper.
        const naturalW = content.scrollWidth;
        const naturalH = content.scrollHeight;

        const scale = clamp(typeof targetScale === "number" ? targetScale : 1, 0.25, 2.75);

        const panX = (o.width - naturalW * scale) / 2;
        const panY = (o.height - naturalH * scale) / 2;

        setZ({ scale, panX, panY });
    }, []);

    useEffect(() => {
        recenterToContent(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        function onResize() {
            // Keep current scale, just re-center to viewport
            setZ((prev) => {
                const outer = outerRef.current;
                const content = contentRef.current;
                if (!outer || !content) return prev;

                const o = outer.getBoundingClientRect();
                const naturalW = content.scrollWidth;
                const naturalH = content.scrollHeight;

                const panX = (o.width - naturalW * prev.scale) / 2;
                const panY = (o.height - naturalH * prev.scale) / 2;

                return { ...prev, panX, panY };
            });
        }

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        const root = outerRef.current;
        if (!root) return;

        function onWheel(e: WheelEvent) {
            // local zoom. On trackpads, ctrl+wheel is common. Also allow metaKey as fallback.
            if (!(e.ctrlKey || e.metaKey)) return;

            const viewport = outerRef.current;
            if (!viewport) return;

            e.preventDefault();

            setZ((prev) => {
                const nextScale = clamp(prev.scale * (e.deltaY < 0 ? 1.1 : 0.9), 0.25, 2.75);

                const rect = viewport.getBoundingClientRect();
                const px = e.clientX - rect.left;
                const py = e.clientY - rect.top;

                const scaleRatio = nextScale / prev.scale;
                const nextPanX = px - (px - prev.panX) * scaleRatio;
                const nextPanY = py - (py - prev.panY) * scaleRatio;

                return { scale: nextScale, panX: nextPanX, panY: nextPanY };
            });
        }

        root.addEventListener("wheel", onWheel, { passive: false });
        return () => root.removeEventListener("wheel", onWheel as any);
    }, []);

    useEffect(() => {
        const root = outerRef.current;
        if (!root) return;

        function setPointer(elm: Element, e: PointerEvent) {
            try {
                elm.setPointerCapture(e.pointerId);
            } catch {
                // ignore
            }
        }

        function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function onPointerDown(e: PointerEvent) {
            const viewport = outerRef.current;
            if (!viewport) return;

            // Only pan/zoom when interacting with background/viewport, not buttons/inputs.
            // But we still allow starting on non-interactive parts of nodes.
            const target = e.target as HTMLElement | null;
            const isInteractive =
                !!target?.closest?.("button, a, input, textarea, select, [role='button']") ||
                target?.getAttribute?.("data-wf-no-pan") === "true";
            if (isInteractive) return;

            e.preventDefault();

            setPointer(viewport, e);

            // track pointers for pinch
            const p = pinchRef.current;

            if (!p.pointerA) {
                p.pointerA = { id: e.pointerId, x: e.clientX, y: e.clientY };
            } else if (!p.pointerB && p.pointerA.id !== e.pointerId) {
                p.pointerB = { id: e.pointerId, x: e.clientX, y: e.clientY };

                const d = distance(p.pointerA, p.pointerB);
                const cx = (p.pointerA.x + p.pointerB.x) / 2;
                const cy = (p.pointerA.y + p.pointerB.y) / 2;

                p.active = true;
                p.startDist = d;
                p.startScale = z.scale;
                p.startPanX = z.panX;
                p.startPanY = z.panY;
                p.startCenterX = cx;
                p.startCenterY = cy;

                isPanningRef.current = false;
                return;
            }

            // single-pointer pan
            isPanningRef.current = true;
            panStartRef.current = { x: e.clientX, y: e.clientY, panX: z.panX, panY: z.panY };
        }

        function onPointerMove(e: PointerEvent) {
            const p = pinchRef.current;

            if (p.pointerA && p.pointerA.id === e.pointerId) {
                p.pointerA = { ...p.pointerA, x: e.clientX, y: e.clientY };
            } else if (p.pointerB && p.pointerB.id === e.pointerId) {
                p.pointerB = { ...p.pointerB, x: e.clientX, y: e.clientY };
            }

            if (p.active && p.pointerA && p.pointerB) {
                e.preventDefault();

                const d = distance(p.pointerA, p.pointerB);
                const cx = (p.pointerA.x + p.pointerB.x) / 2;
                const cy = (p.pointerA.y + p.pointerB.y) / 2;

                const nextScale = clamp(p.startScale * (d / Math.max(1, p.startDist)), 0.25, 2.75);

                // zoom about the pinch center, but using the start state as base
                const outer = outerRef.current;
                if (!outer) return;

                const rect = outer.getBoundingClientRect();
                const px = cx - rect.left;
                const py = cy - rect.top;

                const scaleRatio = nextScale / p.startScale;
                const nextPanX = px - (px - p.startPanX) * scaleRatio;
                const nextPanY = py - (py - p.startPanY) * scaleRatio;

                setZ({ scale: nextScale, panX: nextPanX, panY: nextPanY });
                return;
            }

            if (!isPanningRef.current) return;

            e.preventDefault();

            const start = panStartRef.current;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;

            setZ((prev) => ({ ...prev, panX: start.panX + dx, panY: start.panY + dy }));
        }

        function onPointerUp(e: PointerEvent) {
            const p = pinchRef.current;

            if (p.pointerA && p.pointerA.id === e.pointerId) p.pointerA = null;
            if (p.pointerB && p.pointerB.id === e.pointerId) p.pointerB = null;

            if (!p.pointerA || !p.pointerB) {
                p.active = false;
            }

            isPanningRef.current = false;
        }

        root.addEventListener("pointerdown", onPointerDown);
        root.addEventListener("pointermove", onPointerMove);
        root.addEventListener("pointerup", onPointerUp);
        root.addEventListener("pointercancel", onPointerUp);

        return () => {
            root.removeEventListener("pointerdown", onPointerDown);
            root.removeEventListener("pointermove", onPointerMove);
            root.removeEventListener("pointerup", onPointerUp);
            root.removeEventListener("pointercancel", onPointerUp);
        };
    }, [z.panX, z.panY, z.scale]);

    return (
        <div className="relative h-full w-full overflow-hidden select-none" ref={outerRef} style={{ touchAction: "none" }}>
            <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                <button
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                    onClick={() =>
                        setZ((prev) => ({ ...prev, scale: clamp(prev.scale / 1.1, 0.25, 2.75) }))
                    }
                    aria-label="Zoom out"
                    data-wf-no-pan="true"
                >
                    −
                </button>

                <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300">
                    {Math.round(z.scale * 100)}%
                </div>

                <button
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                    onClick={() =>
                        setZ((prev) => ({ ...prev, scale: clamp(prev.scale * 1.1, 0.25, 2.75) }))
                    }
                    aria-label="Zoom in"
                    data-wf-no-pan="true"
                >
                    +
                </button>

                <button
                    className="ml-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                    onClick={() => recenterToContent(1)}
                    data-wf-no-pan="true"
                >
                    Reset
                </button>

                <div className="ml-2 hidden sm:block text-[11px] text-slate-500">
                    Drag to pan · Pinch to zoom · Ctrl+wheel to zoom
                </div>
            </div>

            <div
                className="absolute left-0 top-0"
                style={{
                    transform,
                    transformOrigin: "0 0"
                }}
            >
                <div ref={contentRef}>{props.children}</div>
            </div>
        </div>
    );
}

function TreeStyles() {
    return (
        <style>{`
/* Container */
.wf-tree-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(2, 6, 23, 0.72);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;

    /* Use safe-area + small margin so it feels "full screen" but still not edge-to-edge harsh */
    padding:
        max(8px, env(safe-area-inset-top))
        max(8px, env(safe-area-inset-right))
        max(8px, env(safe-area-inset-bottom))
        max(8px, env(safe-area-inset-left));
}

/* Nearly full-screen, fully responsive to viewport size */
.wf-tree-modal {
    width: 100%;
    height: 100%;

    border: 1px solid rgba(30, 41, 59, 0.8);
    background: rgba(2, 6, 23, 0.92);
    border-radius: 16px;
    box-shadow: 0 20px 80px rgba(0,0,0,0.55);
    overflow: hidden;

    display: flex;
    flex-direction: column;
}

.wf-tree-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(30, 41, 59, 0.8);
}
.wf-tree-modal-title {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.wf-tree-modal-title .t1 {
    font-size: 14px;
    font-weight: 700;
    color: rgba(226, 232, 240, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.wf-tree-modal-title .t2 {
    font-size: 12px;
    color: rgba(148, 163, 184, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.wf-tree-modal-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}
.wf-tree-modal-body {
    flex: 1;
    overflow: hidden; /* IMPORTANT: viewport handles overflow */
    padding: 0;
}

/* Tree layout */
.wf-tree-root {
    padding: 18px;
    --wf-gap-x: 26px;   /* sibling spacing */
    --wf-gap-y: 22px;   /* vertical spacing between levels */
    --wf-line: rgba(71, 85, 105, 0.75);
}

/* Each UL lays out children as a row */
.wf-tree-ul {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: var(--wf-gap-x);
    position: relative;
    margin: 0;
    padding: 0;
}

/* For child rows: add space above for the row connector + child stems */
.wf-tree-ul.wf-tree-ul-children {
    margin-top: var(--wf-gap-y);
    padding-top: var(--wf-gap-y);
}

/* Horizontal connector across the child row */
.wf-tree-ul.wf-tree-ul-children::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    border-top: 1px solid var(--wf-line);
}

/* LI is a column: node then its children */
.wf-tree-li {
    list-style: none;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* Vertical stem from the child-row horizontal line down to the child node */
.wf-tree-ul.wf-tree-ul-children > .wf-tree-li {
    padding-top: var(--wf-gap-y);
}
.wf-tree-ul.wf-tree-ul-children > .wf-tree-li::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    height: var(--wf-gap-y);
    border-left: 1px solid var(--wf-line);
    transform: translateX(-50%);
}

/* Vertical stem from a parent node down to its child-row horizontal line (only when open) */
.wf-tree-li.wf-tree-li-has-children > .wf-tree-node::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: calc(var(--wf-gap-y) * -1);
    height: var(--wf-gap-y);
    border-left: 1px solid var(--wf-line);
    transform: translateX(-50%);
}

/* Node bubble */
.wf-tree-node {
    position: relative;
    border: 1px solid rgba(30, 41, 59, 0.85);
    background: rgba(2, 6, 23, 0.55);
    border-radius: 14px;
    padding: 10px 12px;
    min-width: 220px;
    max-width: min(360px, 78vw);
    display: grid;
    grid-template-columns: 28px 1fr auto;
    gap: 10px;
    align-items: center;
    user-select: none;
}
.wf-tree-node-title {
    font-size: 13px;
    font-weight: 700;
    color: rgba(226, 232, 240, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.wf-tree-node-metrics {
    font-size: 11px;
    color: rgba(203, 213, 225, 1);
    line-height: 1.25;
    text-align: right;
}
.wf-tree-node-btn {
    height: 28px;
    width: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid rgba(51, 65, 85, 0.9);
    background: rgba(2, 6, 23, 0.7);
    color: rgba(226, 232, 240, 1);
    user-select: none;
}
.wf-tree-node-btn:hover {
    background: rgba(15, 23, 42, 0.75);
}

/* On very small screens, shrink nodes a bit */
@media (max-width: 520px) {
    .wf-tree-node {
        min-width: 180px;
        max-width: 86vw;
        grid-template-columns: 28px 1fr;
        grid-template-rows: auto auto;
    }
    .wf-tree-node-metrics {
        grid-column: 1 / -1;
        text-align: left;
    }
}
        `}</style>
    );
}

type TreeNodeProps = {
    nodeCatalogId: CatalogId;
    nodeNeed: number; // total need for this node (already multiplied)
    inventoryCounts: Record<string, number>;
    edgeId: string; // stable edge identity for React keying
    expandedEdges: Record<string, boolean>;
    onToggleEdge: (edgeId: string) => void;
    maxDepth: number;
    depth: number;
};

const TreeNode = memo(function TreeNode(props: TreeNodeProps) {
    const { nodeCatalogId, nodeNeed, inventoryCounts, edgeId, expandedEdges, onToggleEdge, maxDepth, depth } = props;

    const rec = FULL_CATALOG.recordsById[nodeCatalogId];
    const name = rec?.displayName ?? String(nodeCatalogId);

    const have = safeInt(inventoryCounts?.[String(nodeCatalogId)] ?? 0, 0);
    const remaining = Math.max(0, Math.floor(nodeNeed) - have);

    const directChildren = useMemo(() => getDirectRequirementsForExpansion(nodeCatalogId), [nodeCatalogId]);

    const canExpand = depth < maxDepth && directChildren.length > 0;
    const isExpanded = Boolean(expandedEdges[edgeId]);
    const hasOpenChildren = canExpand && isExpanded;

    return (
        <li className={["wf-tree-li", hasOpenChildren ? "wf-tree-li-has-children" : ""].join(" ")}>
            <div className="wf-tree-node">
                {canExpand ? (
                    <button
                        className="wf-tree-node-btn"
                        onClick={() => onToggleEdge(edgeId)}
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        data-wf-no-pan="true"
                    >
                        {isExpanded ? "▾" : "▸"}
                    </button>
                ) : (
                    <div className="h-7 w-7" />
                )}

                <div className="min-w-0">
                    <div className="wf-tree-node-title">{name}</div>
                </div>

                <div className="wf-tree-node-metrics">
                    <div>Need {fmtI(nodeNeed)}</div>
                    <div>Have {fmtI(have)}</div>
                    <div>
                        Rem <span className="font-semibold">{fmtI(remaining)}</span>
                    </div>
                </div>
            </div>

            {hasOpenChildren && (
                <ChildrenList
                    parentCatalogId={nodeCatalogId}
                    parentNeed={nodeNeed}
                    inventoryCounts={inventoryCounts}
                    depth={depth}
                    expandedEdges={expandedEdges}
                    onToggleEdge={onToggleEdge}
                    maxDepth={maxDepth}
                />
            )}
        </li>
    );
});

type ChildrenListProps = {
    parentCatalogId: CatalogId;
    parentNeed: number;
    inventoryCounts: Record<string, number>;
    depth: number;
    expandedEdges: Record<string, boolean>;
    onToggleEdge: (edgeId: string) => void;
    maxDepth: number;
};

const ChildrenList = memo(function ChildrenList(props: ChildrenListProps) {
    const { parentCatalogId, parentNeed, inventoryCounts, depth, expandedEdges, onToggleEdge, maxDepth } = props;

    const children = useMemo(() => {
        const direct = getDirectRequirementsForExpansion(parentCatalogId);

        // Multiply per-parent need, and aggregate identical child ids *for this parent*
        const agg = new Map<string, number>();
        for (const c of direct) {
            const childId = String(c.catalogId);
            const childNeed =
                Math.max(1, Math.floor(Number(c.count) || 1)) * Math.max(1, Math.floor(Number(parentNeed) || 1));
            agg.set(childId, (agg.get(childId) ?? 0) + childNeed);
        }

        const out = Array.from(agg.entries()).map(([cid, need]) => ({
            catalogId: cid as CatalogId,
            need
        }));

        // Stable ordering: highest need first, then name
        out.sort((a, b) => {
            if (a.need !== b.need) return b.need - a.need;
            const an = FULL_CATALOG.recordsById[a.catalogId]?.displayName ?? String(a.catalogId);
            const bn = FULL_CATALOG.recordsById[b.catalogId]?.displayName ?? String(b.catalogId);
            return an.localeCompare(bn);
        });

        return out;
    }, [parentCatalogId, parentNeed]);

    if (children.length === 0) {
        return null;
    }

    // Blueprint-skip: if the only child is a blueprint, show that blueprint's ingredients directly
    const maybeFlattened = useMemo(() => {
        if (children.length !== 1) return children;

        const only = children[0];
        const rec = FULL_CATALOG.recordsById[only.catalogId];
        const nm = rec?.displayName ?? String(only.catalogId);

        if (!isExplicitBlueprintItem(only.catalogId, nm)) return children;

        // Expand the blueprint and multiply by the blueprint quantity (need)
        const bpChildren = getDirectRequirementsForExpansion(only.catalogId);
        if (!bpChildren || bpChildren.length === 0) return children;

        const agg = new Map<string, number>();
        for (const bc of bpChildren) {
            const cid = String(bc.catalogId);
            const need = Math.max(1, Math.floor(Number(bc.count) || 1)) * Math.max(1, Math.floor(Number(only.need) || 1));
            agg.set(cid, (agg.get(cid) ?? 0) + need);
        }

        const flattened = Array.from(agg.entries()).map(([cid, need]) => ({
            catalogId: cid as CatalogId,
            need
        }));

        flattened.sort((a, b) => {
            if (a.need !== b.need) return b.need - a.need;
            const an = FULL_CATALOG.recordsById[a.catalogId]?.displayName ?? String(a.catalogId);
            const bn = FULL_CATALOG.recordsById[b.catalogId]?.displayName ?? String(b.catalogId);
            return an.localeCompare(bn);
        });

        return flattened;
    }, [children]);

    return (
        <ul className="wf-tree-ul wf-tree-ul-children">
            {maybeFlattened.map((c) => {
                const childEdgeId = `${String(parentCatalogId)}=>${String(c.catalogId)}`;
                return (
                    <TreeNode
                        key={childEdgeId}
                        nodeCatalogId={c.catalogId}
                        nodeNeed={c.need}
                        inventoryCounts={inventoryCounts}
                        depth={depth + 1}
                        edgeId={childEdgeId}
                        expandedEdges={expandedEdges}
                        onToggleEdge={onToggleEdge}
                        maxDepth={maxDepth}
                    />
                );
            })}
        </ul>
    );
});

function TreeModal(props: {
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

export default function Goals() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    const goals = useTrackerStore((s) => (Array.isArray((s.state as any).goals) ? (s.state as any).goals : EMPTY_ARR));
    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs?.completed ?? EMPTY_OBJ);
    const inventory = useTrackerStore((s) => s.state.inventory);

    const setGoalQty = useTrackerStore((s) => s.setGoalQty);
    const setGoalNote = useTrackerStore((s) => s.setGoalNote);
    const toggleGoalActive = useTrackerStore((s) => s.toggleGoalActive);
    const removeGoal = useTrackerStore((s) => s.removeGoal);

    const [tab, setTab] = useState<GoalsTab>("personal");

    // Per-goal expanded tree state (stable edge identity)
    const [expandedEdgesByGoalId, setExpandedEdgesByGoalId] = useState<Record<string, Record<string, boolean>>>({});

    // Per-goal tree modal open state
    const [treeOpenByGoalId, setTreeOpenByGoalId] = useState<Record<string, boolean>>({});

    const toggleEdgeForGoal = useCallback((goalId: string, edgeId: string) => {
        setExpandedEdgesByGoalId((prev) => {
            const existing = prev[goalId] ?? {};
            const nextForGoal = {
                ...existing,
                [edgeId]: !existing[edgeId]
            };
            return {
                ...prev,
                [goalId]: nextForGoal
            };
        });
    }, []);

    const openTreeForGoal = useCallback((goalId: string, rootCatalogId: CatalogId) => {
        setTreeOpenByGoalId((prev) => ({ ...prev, [goalId]: true }));

        // Ensure root is expanded when opening.
        const rootEdgeId = `root=>${String(rootCatalogId)}`;
        setExpandedEdgesByGoalId((prev) => {
            const existing = prev[goalId] ?? {};
            if (existing[rootEdgeId]) return prev;
            return { ...prev, [goalId]: { ...existing, [rootEdgeId]: true } };
        });
    }, []);

    const closeTreeForGoal = useCallback((goalId: string) => {
        setTreeOpenByGoalId((prev) => ({ ...prev, [goalId]: false }));
    }, []);

    // Requirements-only snapshot (syndicates + inventory; NO personal goals included)
    const requirementsOnly = useMemo(() => {
        return buildRequirementsSnapshot({
            syndicates,
            goals: [],
            completedPrereqs,
            inventory
        });
    }, [syndicates, completedPrereqs, inventory]);

    // Personal goals lines (only active item goals)
    const personalLines = useMemo(() => {
        const out: Array<{
            goalId: string;
            catalogId: CatalogId;
            name: string;
            qty: number;
            note: string;
            isActive: boolean;
            have: number;
            remaining: number;
        }> = [];

        for (const g of goals ?? []) {
            if (!g || g.type !== "item") continue;

            const cid = String(g.catalogId) as CatalogId;
            const rec = FULL_CATALOG.recordsById[cid];
            const name = rec?.displayName ?? cid;

            const qty = Math.max(1, safeInt(g.qty ?? 1, 1));
            const have = safeInt(inventory?.counts?.[String(cid)] ?? 0, 0);
            const remaining = Math.max(0, qty - have);

            out.push({
                goalId: String(g.id),
                catalogId: cid,
                name,
                qty,
                note: String(g.note ?? ""),
                isActive: g.isActive !== false,
                have,
                remaining
            });
        }

        out.sort((a, b) => {
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
            if (a.remaining !== b.remaining) return b.remaining - a.remaining;
            return a.name.localeCompare(b.name);
        });

        return out;
    }, [goals, inventory]);

    // Requirements goals lines (actionable items; remaining > 0 already filtered by engine)
    const requirementsLines = useMemo(() => {
        const base = requirementsOnly.itemLines.slice();
        base.sort((a, b) => {
            if (a.remaining !== b.remaining) return b.remaining - a.remaining;
            return a.name.localeCompare(b.name);
        });
        return base;
    }, [requirementsOnly.itemLines]);

    // Total / compiled goals
    const totalLines = useMemo<GoalRow[]>(() => {
        const map: Record<string, { catalogId: CatalogId; name: string; personalNeed: number; requirementsNeed: number }> = {};

        for (const g of goals ?? []) {
            if (!g || g.isActive === false) continue;
            if (g.type !== "item") continue;

            const cid = String(g.catalogId) as CatalogId;
            const qty = Math.max(1, safeInt(g.qty ?? 1, 1));

            const rec = FULL_CATALOG.recordsById[cid];
            const name = rec?.displayName ?? cid;

            if (!map[cid]) {
                map[cid] = { catalogId: cid, name, personalNeed: 0, requirementsNeed: 0 };
            }
            map[cid].personalNeed += qty;
        }

        for (const l of requirementsOnly.itemLines ?? []) {
            const cid = l.key;
            if (!map[cid]) {
                map[cid] = { catalogId: cid, name: l.name, personalNeed: 0, requirementsNeed: 0 };
            }
            map[cid].requirementsNeed += safeInt(l.totalNeed ?? 0, 0);
        }

        const out: GoalRow[] = Object.values(map).map((x) => {
            const have = safeInt(inventory?.counts?.[String(x.catalogId)] ?? 0, 0);
            const totalNeed = x.personalNeed + x.requirementsNeed;
            const remaining = Math.max(0, totalNeed - have);

            return {
                catalogId: x.catalogId,
                name: x.name,
                personalNeed: x.personalNeed,
                requirementsNeed: x.requirementsNeed,
                totalNeed,
                have,
                remaining
            };
        });

        const filtered = out.filter((r) => r.totalNeed > 0);

        filtered.sort((a, b) => {
            if (a.remaining !== b.remaining) return b.remaining - a.remaining;
            return a.name.localeCompare(b.name);
        });

        return filtered;
    }, [goals, requirementsOnly.itemLines, inventory]);

    const inventoryCounts = (inventory?.counts ?? {}) as Record<string, number>;

    return (
        <div className="space-y-6">
            <TreeStyles />

            <Section
                title="Goals"
                subtitle="This page is a read-only view of what you are farming for. Add/remove Personal Goals from Inventory; Requirements Goals come from your Syndicate next-rank steps."
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <PillButton label="Personal Goals" active={tab === "personal"} onClick={() => setTab("personal")} />
                        <PillButton label="Requirements Goals" active={tab === "requirements"} onClick={() => setTab("requirements")} />
                        <PillButton label="Total Goals" active={tab === "total"} onClick={() => setTab("total")} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => setActivePage("inventory")}
                        >
                            Open Inventory (manage Personal Goals)
                        </button>

                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => setActivePage("requirements")}
                        >
                            Open Farming
                        </button>
                    </div>
                </div>
            </Section>

            {tab === "personal" && (
                <Section title="Personal Goals" subtitle={`Count: ${personalLines.length.toLocaleString()} (includes inactive)`}>
                    {personalLines.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No personal goals yet. Add them from Inventory.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {personalLines.map((g) => {
                                const goalExpandedEdges = expandedEdgesByGoalId[g.goalId] ?? {};
                                const isTreeOpen = Boolean(treeOpenByGoalId[g.goalId]);

                                return (
                                    <div key={g.goalId} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="text-sm font-semibold break-words">{g.name}</div>
                                                    <span
                                                        className={[
                                                            "text-[11px] rounded-full border px-2 py-0.5",
                                                            g.isActive
                                                                ? "border-emerald-800 text-emerald-300"
                                                                : "border-slate-700 text-slate-400"
                                                        ].join(" ")}
                                                    >
                                                        {g.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    Need {g.qty.toLocaleString()} · Have {g.have.toLocaleString()} · Remaining{" "}
                                                    {g.remaining.toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-xs hover:bg-slate-900/40"
                                                    onClick={() => toggleGoalActive(g.goalId)}
                                                >
                                                    Toggle
                                                </button>

                                                <button
                                                    className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-red-200 text-xs hover:bg-red-950/30"
                                                    onClick={() => removeGoal(g.goalId)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3">
                                            <label className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400">Goal Qty</span>
                                                <input
                                                    className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                                                    type="number"
                                                    min={1}
                                                    value={g.qty}
                                                    onChange={(e) => {
                                                        const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
                                                        setGoalQty(g.goalId, n);
                                                    }}
                                                />
                                            </label>

                                            <label className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400">Note</span>
                                                <input
                                                    className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                                                    value={g.note}
                                                    onChange={(e) => setGoalNote(g.goalId, e.target.value)}
                                                    placeholder="Optional"
                                                />
                                            </label>
                                        </div>

                                        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/20 p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-xs uppercase tracking-wide text-slate-400">Expanded Requirements</div>
                                                <button
                                                    className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                                                    onClick={() => openTreeForGoal(g.goalId, g.catalogId)}
                                                >
                                                    Open Tree
                                                </button>
                                            </div>

                                            <div className="mt-2 text-xs text-slate-500">
                                                Viewer supports local zoom (Ctrl+wheel / pinch) and pan (drag).
                                            </div>
                                        </div>

                                        <TreeModal
                                            isOpen={isTreeOpen}
                                            title={g.name}
                                            subtitle={`Need ${g.qty.toLocaleString()} · Have ${g.have.toLocaleString()} · Remaining ${g.remaining.toLocaleString()}`}
                                            onClose={() => closeTreeForGoal(g.goalId)}
                                            rootCatalogId={g.catalogId}
                                            rootNeed={Math.max(1, Math.floor(Number(g.qty) || 1))}
                                            inventoryCounts={inventoryCounts}
                                            expandedEdges={goalExpandedEdges}
                                            onToggleEdge={(eid) => toggleEdgeForGoal(g.goalId, eid)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Section>
            )}

            {tab === "requirements" && (
                <Section
                    title="Requirements Goals"
                    subtitle={`Actionable items: ${requirementsLines.length.toLocaleString()} (derived from Syndicate next-rank steps)`}
                >
                    {requirementsLines.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No actionable requirements right now.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {requirementsLines.map((l) => (
                                <div key={String(l.key)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold break-words">{l.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Need {l.totalNeed.toLocaleString()} · Have {l.have.toLocaleString()} · Remaining{" "}
                                                {l.remaining.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            )}

            {tab === "total" && (
                <Section title="Total Goals" subtitle="Personal + Requirements combined into a single list (summed by item).">
                    {totalLines.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No goals to compile yet.
                        </div>
                    ) : (
                        <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-800 bg-slate-950/30">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-950/90">
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left px-3 py-2 text-slate-300 font-semibold">Item</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[140px]">Personal</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[160px]">Requirements</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[140px]">Total</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[120px]">Have</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[140px]">Remaining</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {totalLines.map((r) => (
                                        <tr key={String(r.catalogId)} className="border-b border-slate-800/70">
                                            <td className="px-3 py-2 text-slate-100">
                                                <div className="font-semibold">{r.name}</div>
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-200">{r.personalNeed.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-slate-200">{r.requirementsNeed.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-slate-100 font-semibold">{r.totalNeed.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-slate-200">{r.have.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-slate-100 font-semibold">{r.remaining.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Section>
            )}
        </div>
    );
}

