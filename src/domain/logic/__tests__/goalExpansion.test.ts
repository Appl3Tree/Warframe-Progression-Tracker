import { describe, it, expect, vi } from "vitest";

// Mock FULL_CATALOG before importing the engine
vi.mock("../../catalog/loadFullCatalog", () => ({
    FULL_CATALOG: {
        recordsById: {
            "items:excalibur": { displayName: "Excalibur", path: "/Lotus/Powersuits/Excalibur/Excalibur" },
            "items:excalibur-neuroptics": { displayName: "Excalibur Neuroptics", path: "/Components/Neuroptics" },
            "items:excalibur-chassis": { displayName: "Excalibur Chassis", path: "/Components/Chassis" },
            "items:excalibur-systems": { displayName: "Excalibur Systems", path: "/Components/Systems" },
            "items:alloy-plate": { displayName: "Alloy Plate", path: "/Resources/AlloyPlate" },
            "items:leaf": { displayName: "Leaf Item (no recipe)", path: "/Items/Leaf" },
        },
    },
}));

// Mock getItemRequirements to define a simple crafting tree:
// Excalibur requires: Neuroptics (×1), Chassis (×1), Systems (×1)
// Neuroptics requires: Alloy Plate (×150)
// Everything else has no recipe (leaf nodes)
vi.mock("../../../catalog/items/itemRequirements", () => ({
    getItemRequirements: (catalogId: string) => {
        const recipes: Record<string, Array<{ catalogId: string; count: number }>> = {
            "items:excalibur": [
                { catalogId: "items:excalibur-neuroptics", count: 1 },
                { catalogId: "items:excalibur-chassis", count: 1 },
                { catalogId: "items:excalibur-systems", count: 1 },
            ],
            "items:excalibur-neuroptics": [
                { catalogId: "items:alloy-plate", count: 150 },
            ],
        };
        return recipes[catalogId] ?? [];
    },
}));

import { buildGoalExpansionTree } from "../goalExpansion";
import type { CatalogId } from "../../catalog/loadFullCatalog";

const cid = (s: string) => s as CatalogId;

// ─── buildGoalExpansionTree ───────────────────────────────────────────────────

describe("buildGoalExpansionTree", () => {
    it("returns a single root node for a leaf item (no recipe)", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:leaf"),
            rootQty: 1,
            inventory: { counts: {} },
        });
        expect(tree.catalogId).toBe("items:leaf");
        expect(tree.edges).toHaveLength(0);
        expect(tree.depth).toBe(0);
    });

    it("sets totalNeed and remaining correctly when nothing is owned", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: {} },
        });
        expect(tree.totalNeed).toBe(1);
        expect(tree.have).toBe(0);
        expect(tree.remaining).toBe(1);
    });

    it("uses display name from FULL_CATALOG", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: {} },
        });
        expect(tree.name).toBe("Excalibur");
    });

    it("expands direct children from the recipe", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: {} },
        });
        expect(tree.edges).toHaveLength(3);
        const childIds = tree.edges.map((e) => String(e.childCatalogId));
        expect(childIds).toContain("items:excalibur-neuroptics");
        expect(childIds).toContain("items:excalibur-chassis");
        expect(childIds).toContain("items:excalibur-systems");
    });

    it("recursively expands sub-components", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: {} },
        });
        const neuroptics = tree.edges.find(
            (e) => String(e.childCatalogId) === "items:excalibur-neuroptics"
        )!.child;

        expect(neuroptics.edges).toHaveLength(1);
        expect(String(neuroptics.edges[0].childCatalogId)).toBe("items:alloy-plate");
        expect(neuroptics.edges[0].child.totalNeed).toBe(150);
    });

    it("multiplies child quantity by parent qty", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 2,
            inventory: { counts: {} },
        });
        // Need 2 Excalibur → need 2 Neuroptics
        const neuroptics = tree.edges.find(
            (e) => String(e.childCatalogId) === "items:excalibur-neuroptics"
        )!.child;
        expect(neuroptics.totalNeed).toBe(2);
        // 2 Neuroptics × 150 Alloy Plate each = 300
        expect(neuroptics.edges[0].child.totalNeed).toBe(300);
    });

    it("reduces child totalNeed when parent is partially owned", () => {
        // Own 1 Excalibur, need 2 → remaining = 1 → children based on remaining=1
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 2,
            inventory: { counts: { "items:excalibur": 1 } },
        });
        expect(tree.have).toBe(1);
        expect(tree.remaining).toBe(1);
        // Children driven by remaining=1, not qty=2
        const neuroptics = tree.edges.find(
            (e) => String(e.childCatalogId) === "items:excalibur-neuroptics"
        )!.child;
        expect(neuroptics.totalNeed).toBe(1);
    });

    it("does not expand children when item is fully owned (remaining = 0)", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: { "items:excalibur": 1 } },
        });
        expect(tree.remaining).toBe(0);
        expect(tree.edges).toHaveLength(0);
    });

    it("assigns correct depth values to nodes", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: {} },
        });
        expect(tree.depth).toBe(0);
        const neuroptics = tree.edges[0].child;
        expect(neuroptics.depth).toBe(1);
        expect(neuroptics.edges[0].child.depth).toBe(2);
    });

    it("nodeIds are stable — same inputs produce same ids", () => {
        const args = {
            goalId: "goal:stable",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: {} },
        };
        const treeA = buildGoalExpansionTree(args);
        const treeB = buildGoalExpansionTree(args);
        expect(treeA.nodeId).toBe(treeB.nodeId);
        expect(treeA.edges[0].edgeId).toBe(treeB.edges[0].edgeId);
    });

    it("nodeIds differ for different goalIds (structural path depends on goalId)", () => {
        const treeA = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: {} },
        });
        const treeB = buildGoalExpansionTree({
            goalId: "goal:2",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: {} },
        });
        expect(treeA.nodeId).not.toBe(treeB.nodeId);
    });

    it("respects maxDepth and stops expanding beyond it", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 1,
            inventory: { counts: {} },
            maxDepth: 1,
        });
        // Depth 0 (Excalibur) has children
        expect(tree.edges.length).toBeGreaterThan(0);
        // Depth 1 (Neuroptics) should NOT be expanded further because maxDepth=1
        const neuroptics = tree.edges.find(
            (e) => String(e.childCatalogId) === "items:excalibur-neuroptics"
        )!.child;
        expect(neuroptics.edges).toHaveLength(0);
    });

    it("clamps rootQty to at least 1", () => {
        const tree = buildGoalExpansionTree({
            goalId: "goal:1",
            rootCatalogId: cid("items:excalibur"),
            rootQty: 0,
            inventory: { counts: {} },
        });
        expect(tree.totalNeed).toBe(1);
    });
});
