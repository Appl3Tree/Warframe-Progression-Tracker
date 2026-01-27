// ===== FILE: src/domain/logic/goalExpansion.ts =====
// src/domain/logic/goalExpansion.ts

import type { CatalogId } from "../catalog/loadFullCatalog";
import { FULL_CATALOG } from "../catalog/loadFullCatalog";
import { getItemRequirements } from "../../catalog/items/itemRequirements";

type InventoryLike = {
    counts?: Record<string, number>;
};

export type GoalExpansionEdge = {
    edgeId: string;
    parentNodeId: string;
    childNodeId: string;

    parentCatalogId: CatalogId;
    childCatalogId: CatalogId;

    ingredientIndex: number;
    countPerParent: number;
};

export type GoalExpansionNode = {
    nodeId: string;
    catalogId: CatalogId;
    name: string;

    totalNeed: number;
    have: number;
    remaining: number;

    depth: number;
    edges: Array<GoalExpansionEdge & { child: GoalExpansionNode }>;
};

function safeInt(v: unknown, fallback: number): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

function makeNodeId(goalId: string, path: string): string {
    return `gexp:node:${goalId}:${path}`;
}

function makeEdgeId(goalId: string, parentPath: string, ingredientIndex: number, childKey: string): string {
    return `gexp:edge:${goalId}:${parentPath}:i${ingredientIndex}->${childKey}`;
}

function displayNameFor(cid: CatalogId): string {
    const rec = FULL_CATALOG.recordsById[cid];
    return rec?.displayName ?? String(cid);
}

/**
 * Builds a deterministic, occurrence-based expansion tree for a single goal item.
 *
 * Stability rules:
 * - nodeId/edgeId depend only on (goalId + structural path), NOT on inventory or quantities.
 * - Quantities recompute live every time you rebuild the tree.
 *
 * Quantity rules:
 * - Children are based on the PARENT'S remaining, not totalNeed.
 *   Example: if you already have the finished item, remaining=0 => children are 0.
 */
export function buildGoalExpansionTree(args: {
    goalId: string;
    rootCatalogId: CatalogId;
    rootQty: number;
    inventory: InventoryLike;
    maxDepth?: number;
}): GoalExpansionNode {
    const { goalId, rootCatalogId, rootQty, inventory } = args;
    const maxDepth = Math.max(1, safeInt(args.maxDepth ?? 25, 25));

    function buildNode(cid: CatalogId, qty: number, depth: number, path: string): GoalExpansionNode {
        const have = safeInt(inventory?.counts?.[String(cid)] ?? 0, 0);
        const remaining = Math.max(0, qty - have);

        const nodeId = makeNodeId(goalId, path);

        const raw = getItemRequirements(cid);
        const comps = Array.isArray(raw) ? raw : [];

        const edges: Array<GoalExpansionEdge & { child: GoalExpansionNode }> = [];

        // IMPORTANT: Children are driven by remaining, not qty.
        const qtyForChildren = remaining;

        if (depth < maxDepth && qtyForChildren > 0 && comps.length > 0) {
            for (let i = 0; i < comps.length; i += 1) {
                const c = comps[i];
                const childCid = c.catalogId as CatalogId;

                const per = Math.max(1, safeInt(c.count ?? 0, 0));
                const childNeed = per * qtyForChildren;

                const childPath = `${path}/i${i}:${String(cid)}`;
                const childNode = buildNode(childCid, childNeed, depth + 1, childPath);

                edges.push({
                    edgeId: makeEdgeId(goalId, path, i, String(childCid)),
                    parentNodeId: nodeId,
                    childNodeId: childNode.nodeId,
                    parentCatalogId: cid,
                    childCatalogId: childCid,
                    ingredientIndex: i,
                    countPerParent: per,
                    child: childNode
                });
            }
        }

        return {
            nodeId,
            catalogId: cid,
            name: displayNameFor(cid),
            totalNeed: qty,
            have,
            remaining,
            depth,
            edges
        };
    }

    const qty0 = Math.max(1, safeInt(rootQty, 1));
    return buildNode(rootCatalogId, qty0, 0, "root");
}

