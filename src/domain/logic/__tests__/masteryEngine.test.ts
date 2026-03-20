import { describe, it, expect } from "vitest";
import {
    xpForRank,
    computeMasteryResult,
    computeMasteryBacklog,
    forecastMrFromGoals,
    MR_XP_THRESHOLDS,
    MAX_MR,
    MASTERY_XP_BY_CATEGORY,
} from "../masteryEngine";

// ─── xpForRank ───────────────────────────────────────────────────────────────

describe("xpForRank", () => {
    it("returns 0 for rank 0", () => {
        expect(xpForRank(0)).toBe(0);
    });

    it("returns 7500 for rank 1", () => {
        expect(xpForRank(1)).toBe(7_500);
    });

    it("returns the table value for rank 10", () => {
        expect(xpForRank(10)).toBe(MR_XP_THRESHOLDS[10]);
    });

    it("returns 1,750,000 for max rank (35)", () => {
        expect(xpForRank(MAX_MR)).toBe(1_750_000);
    });

    it("clamps negative ranks to 0", () => {
        expect(xpForRank(-5)).toBe(0);
    });

    it("extrapolates linearly beyond max rank", () => {
        // Last two known values: rank34=1,600,000, rank35=1,750,000 → increment=150,000
        const increment = 1_750_000 - 1_600_000;
        expect(xpForRank(36)).toBe(1_750_000 + increment);
        expect(xpForRank(37)).toBe(1_750_000 + 2 * increment);
    });

    it("floors non-integer ranks", () => {
        expect(xpForRank(1.9)).toBe(xpForRank(1));
    });
});

// ─── computeMasteryResult ────────────────────────────────────────────────────

describe("computeMasteryResult", () => {
    it("returns MR 0 and no progress when xpByItem is empty and no reportedMr", () => {
        const result = computeMasteryResult({ xpByItem: {}, masteryRank: null });
        expect(result.totalXp).toBe(0);
        expect(result.computedMr).toBe(0);
        expect(result.effectiveMr).toBe(0);
        expect(result.reportedMr).toBeNull();
        expect(result.progressFraction).toBe(0);
    });

    it("uses reportedMr as effectiveMr when xpByItem is empty", () => {
        const result = computeMasteryResult({ xpByItem: {}, masteryRank: 15 });
        expect(result.effectiveMr).toBe(15);
        expect(result.reportedMr).toBe(15);
        expect(result.totalXp).toBe(0);
    });

    it("computes MR correctly from xpByItem", () => {
        // Exactly at rank 10 threshold: 130,000 XP
        const xpByItem = { "item:a": 130_000 };
        const result = computeMasteryResult({ xpByItem, masteryRank: null });
        expect(result.totalXp).toBe(130_000);
        expect(result.computedMr).toBe(10);
        expect(result.effectiveMr).toBe(10);
    });

    it("sums xpByItem values correctly", () => {
        const xpByItem = { "item:a": 70_000, "item:b": 60_000 };
        const result = computeMasteryResult({ xpByItem, masteryRank: null });
        expect(result.totalXp).toBe(130_000);
        expect(result.computedMr).toBe(10);
    });

    it("ignores non-finite values in xpByItem", () => {
        const xpByItem = { "item:a": 7_500, "item:b": NaN };
        const result = computeMasteryResult({ xpByItem, masteryRank: null });
        expect(result.totalXp).toBe(7_500);
        expect(result.computedMr).toBe(1);
    });

    it("computes correct progress fraction mid-rank", () => {
        // Between rank 1 (7,500) and rank 2 (15,000): band = 7,500
        // At 11,250 XP → exactly halfway into rank 1
        const xpByItem = { "item:a": 11_250 };
        const result = computeMasteryResult({ xpByItem, masteryRank: null });
        expect(result.effectiveMr).toBe(1);
        expect(result.progressFraction).toBeCloseTo(0.5);
        expect(result.xpIntoCurrentRank).toBe(3_750);
        expect(result.xpRemainingToNextRank).toBe(3_750);
    });

    it("reports isMaxRank when at max", () => {
        const xpByItem = { "item:a": 1_750_000 };
        const result = computeMasteryResult({ xpByItem, masteryRank: null });
        expect(result.isMaxRank).toBe(true);
        expect(result.progressFraction).toBe(1);
        expect(result.xpRemainingToNextRank).toBe(0);
    });

    it("floors the masteryRank value", () => {
        const result = computeMasteryResult({ xpByItem: {}, masteryRank: 10.9 });
        expect(result.reportedMr).toBe(10);
    });

    it("reports null for invalid masteryRank", () => {
        const result = computeMasteryResult({ xpByItem: {}, masteryRank: NaN as unknown as null });
        expect(result.reportedMr).toBeNull();
    });
});

// ─── computeMasteryBacklog ───────────────────────────────────────────────────

describe("computeMasteryBacklog", () => {
    const getItemName = (id: string) => {
        const names: Record<string, string> = {
            "items:excalibur": "Excalibur",
            "items:braton": "Braton",
            "items:kubrow": "Kubrow",
            "items:unknown": "Unknown Item",
        };
        return names[id] ?? null;
    };

    const getItemCategory = (id: string) => {
        const cats: Record<string, string> = {
            "items:excalibur": "Warframes",
            "items:braton": "Primary Weapons",
            "items:kubrow": "Companion / Kubrow",
            "items:unknown": "Misc",
        };
        return cats[id] ?? "Misc";
    };

    it("returns empty list when no items owned", () => {
        const result = computeMasteryBacklog({
            mastered: {},
            counts: {},
            getItemName,
            getItemCategory,
        });
        expect(result).toHaveLength(0);
    });

    it("excludes already-mastered items", () => {
        const result = computeMasteryBacklog({
            mastered: { "items:excalibur": true },
            counts: { "items:excalibur": 1 },
            getItemName,
            getItemCategory,
        });
        expect(result).toHaveLength(0);
    });

    it("excludes items with count 0", () => {
        const result = computeMasteryBacklog({
            mastered: {},
            counts: { "items:excalibur": 0 },
            getItemName,
            getItemCategory,
        });
        expect(result).toHaveLength(0);
    });

    it("excludes items with no display name", () => {
        const getNoName = () => null;
        const result = computeMasteryBacklog({
            mastered: {},
            counts: { "items:excalibur": 1 },
            getItemName: getNoName,
            getItemCategory,
        });
        expect(result).toHaveLength(0);
    });

    it("assigns warframe XP for warframe category", () => {
        const result = computeMasteryBacklog({
            mastered: {},
            counts: { "items:excalibur": 1 },
            getItemName,
            getItemCategory,
        });
        expect(result).toHaveLength(1);
        expect(result[0].estimatedXp).toBe(MASTERY_XP_BY_CATEGORY.warframe);
        expect(result[0].name).toBe("Excalibur");
    });

    it("assigns weapon XP for primary weapon category", () => {
        const result = computeMasteryBacklog({
            mastered: {},
            counts: { "items:braton": 1 },
            getItemName,
            getItemCategory,
        });
        expect(result[0].estimatedXp).toBe(MASTERY_XP_BY_CATEGORY.weapon);
    });

    it("assigns companion XP for companion category", () => {
        const result = computeMasteryBacklog({
            mastered: {},
            counts: { "items:kubrow": 1 },
            getItemName,
            getItemCategory,
        });
        expect(result[0].estimatedXp).toBe(MASTERY_XP_BY_CATEGORY.companion);
    });

    it("sorts by estimatedXp descending then name ascending", () => {
        const result = computeMasteryBacklog({
            mastered: {},
            counts: { "items:excalibur": 1, "items:braton": 1 },
            getItemName,
            getItemCategory,
        });
        // Warframe (6000) should be first, weapon (3000) second
        expect(result[0].estimatedXp).toBeGreaterThanOrEqual(result[1].estimatedXp);
    });
});

// ─── forecastMrFromGoals ─────────────────────────────────────────────────────

describe("forecastMrFromGoals", () => {
    const getItemCategory = (id: string) => {
        const cats: Record<string, string> = {
            "items:excalibur": "Warframes",
            "items:braton": "Primary Weapons",
        };
        return cats[id] ?? "Misc";
    };

    it("returns zero XP gain and no MR change when no goals", () => {
        const result = forecastMrFromGoals({
            currentXp: 0,
            currentMr: 0,
            goalCatalogIds: [],
            getItemCategory,
        });
        // projectedXp = currentXp + 0 = 0
        expect(result.projectedXp).toBe(0);
        expect(result.gainedXp).toBe(0);
        expect(result.gainedMrLevels).toBe(0);
        expect(result.projectedMr).toBe(result.currentMr);
    });

    it("adds warframe XP for a warframe goal", () => {
        const result = forecastMrFromGoals({
            currentXp: 0,
            currentMr: 0,
            goalCatalogIds: ["items:excalibur"],
            getItemCategory,
        });
        expect(result.gainedXp).toBe(MASTERY_XP_BY_CATEGORY.warframe);
        expect(result.projectedXp).toBe(MASTERY_XP_BY_CATEGORY.warframe);
    });

    it("correctly forecasts MR level up from goals", () => {
        // Start just below rank 1 (7,500 XP), add a weapon (3,000 XP) → total 10,500 → still rank 1
        // Start at 0, add 2 weapons (6,000 XP) → total 6,000 → still rank 0
        // Start at 0, add Excalibur (6,000) → 6,000 → MR 0 still (need 7,500)
        // Start at 5,000, add Excalibur (6,000) → 11,000 → MR 1
        const result = forecastMrFromGoals({
            currentXp: 5_000,
            currentMr: 0,
            goalCatalogIds: ["items:excalibur"],
            getItemCategory,
        });
        expect(result.projectedXp).toBe(11_000);
        expect(result.projectedMr).toBe(1);
        expect(result.gainedMrLevels).toBe(1);
    });

    it("accumulates XP from multiple goals", () => {
        const result = forecastMrFromGoals({
            currentXp: 0,
            currentMr: 0,
            goalCatalogIds: ["items:excalibur", "items:braton"],
            getItemCategory,
        });
        expect(result.gainedXp).toBe(
            MASTERY_XP_BY_CATEGORY.warframe + MASTERY_XP_BY_CATEGORY.weapon
        );
    });
});
