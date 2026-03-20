import { describe, it, expect } from "vitest";
import {
    overlapSourceKey,
    countUniqueSources,
    groupBySource,
} from "../overlapEngine";

// ─── overlapSourceKey ────────────────────────────────────────────────────────

describe("overlapSourceKey", () => {
    it("produces a colon-separated key", () => {
        const key = overlapSourceKey("mission", "src:akkad", "Akkad (Eris)");
        expect(key).toBe("mission:src:akkad:Akkad (Eris)");
    });

    it("produces distinct keys for different sourceTypes", () => {
        const a = overlapSourceKey("mission", "x", "label");
        const b = overlapSourceKey("vendor", "x", "label");
        expect(a).not.toBe(b);
    });

    it("produces distinct keys for different sourceIds", () => {
        const a = overlapSourceKey("mission", "id1", "label");
        const b = overlapSourceKey("mission", "id2", "label");
        expect(a).not.toBe(b);
    });

    it("produces distinct keys for different labels", () => {
        const a = overlapSourceKey("mission", "id", "label1");
        const b = overlapSourceKey("mission", "id", "label2");
        expect(a).not.toBe(b);
    });
});

// ─── countUniqueSources ──────────────────────────────────────────────────────

describe("countUniqueSources", () => {
    it("returns 0 for an empty array", () => {
        expect(countUniqueSources([])).toBe(0);
    });

    it("counts each unique key once", () => {
        const keys = ["a", "b", "c"];
        expect(countUniqueSources(keys)).toBe(3);
    });

    it("deduplicates repeated keys", () => {
        const keys = ["a", "b", "a", "c", "b"];
        expect(countUniqueSources(keys)).toBe(3);
    });

    it("returns 1 for an array of all identical keys", () => {
        const keys = ["x", "x", "x"];
        expect(countUniqueSources(keys)).toBe(1);
    });
});

// ─── groupBySource ───────────────────────────────────────────────────────────

describe("groupBySource", () => {
    it("returns an empty array for no items", () => {
        expect(groupBySource({ items: [] })).toHaveLength(0);
    });

    it("groups items that share the same sourceId and sourceLabel", () => {
        const items = [
            { sourceId: "src:akkad", sourceLabel: "Akkad (Eris)", item: "item:a" },
            { sourceId: "src:akkad", sourceLabel: "Akkad (Eris)", item: "item:b" },
        ];
        const groups = groupBySource({ items });
        expect(groups).toHaveLength(1);
        expect(groups[0].items).toEqual(["item:a", "item:b"]);
    });

    it("creates separate groups for different sourceIds", () => {
        const items = [
            { sourceId: "src:akkad", sourceLabel: "Akkad", item: "item:a" },
            { sourceId: "src:hydron", sourceLabel: "Hydron", item: "item:b" },
        ];
        const groups = groupBySource({ items });
        expect(groups).toHaveLength(2);
    });

    it("creates separate groups for the same sourceId but different sourceLabel", () => {
        const items = [
            { sourceId: "src:x", sourceLabel: "Label A", item: "item:a" },
            { sourceId: "src:x", sourceLabel: "Label B", item: "item:b" },
        ];
        const groups = groupBySource({ items });
        expect(groups).toHaveLength(2);
    });

    it("preserves sourceId and sourceLabel on each group", () => {
        const items = [
            { sourceId: "src:akkad", sourceLabel: "Akkad (Eris)", item: "item:a" },
        ];
        const groups = groupBySource({ items });
        expect(groups[0].sourceId).toBe("src:akkad");
        expect(groups[0].sourceLabel).toBe("Akkad (Eris)");
    });

    it("maintains insertion order of items within each group", () => {
        const items = [
            { sourceId: "src:x", sourceLabel: "X", item: "first" },
            { sourceId: "src:x", sourceLabel: "X", item: "second" },
            { sourceId: "src:x", sourceLabel: "X", item: "third" },
        ];
        const groups = groupBySource({ items });
        expect(groups[0].items).toEqual(["first", "second", "third"]);
    });
});
