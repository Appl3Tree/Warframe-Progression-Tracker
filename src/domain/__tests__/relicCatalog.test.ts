import { describe, expect, it } from "vitest";

import { expandRelicGoalItemNames, getRelicByKey } from "../catalog/relicCatalog";

describe("expandRelicGoalItemNames", () => {
    it("expands a Prime frame goal into its crackable relic parts", () => {
        const expanded = expandRelicGoalItemNames(new Set(["Trinity Prime"]));

        expect(expanded.has("Trinity Prime Blueprint")).toBe(true);
        expect(expanded.has("Trinity Prime Chassis Blueprint")).toBe(true);
        expect(expanded.has("Trinity Prime Neuroptics Blueprint")).toBe(true);
        expect(expanded.has("Trinity Prime Systems Blueprint")).toBe(true);
    });

    it("keeps exact reward goals intact without over-expanding unrelated names", () => {
        const expanded = expandRelicGoalItemNames(new Set(["Trinity Prime Systems Blueprint"]));

        expect(expanded.has("Trinity Prime Systems Blueprint")).toBe(true);
        expect(expanded.has("Trinity Prime Blueprint")).toBe(false);
        expect(expanded.has("Trinity Prime Chassis Blueprint")).toBe(false);
    });

    it("derives slot rarity from odds so common slots are not mislabeled", () => {
        const relic = getRelicByKey("axi a20");
        expect(relic).toBeTruthy();

        const cedomStock = relic!.rewards.find((reward) => reward.itemName === "Cedo Prime Stock");
        const daikyuString = relic!.rewards.find((reward) => reward.itemName === "Daikyu Prime String");
        const alternoxBlueprint = relic!.rewards.find((reward) => reward.itemName === "Alternox Prime Blueprint");

        expect(cedomStock?.rarity).toBe("Common");
        expect(daikyuString?.rarity).toBe("Common");
        expect(alternoxBlueprint?.rarity).toBe("Rare");
    });
});
