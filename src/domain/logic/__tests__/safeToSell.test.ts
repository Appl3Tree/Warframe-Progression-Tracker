import { describe, expect, it } from "vitest";
import { isQuestRewardRegistryItem } from "../../catalog/questRewardRegistry";
import {
    buildWeaponIngredientIndex,
    getSafeToSellProtectionKeys,
} from "../safeToSell";

describe("quest reward registry", () => {
    it("matches researched quest reward items by display name", () => {
        expect(isQuestRewardRegistryItem({ displayName: "Grimoire" })).toBe(true);
        expect(isQuestRewardRegistryItem({ displayName: "Nataruk" })).toBe(true);
        expect(isQuestRewardRegistryItem({ displayName: "Qorvex Blueprint" })).toBe(true);
        expect(isQuestRewardRegistryItem({ displayName: "Arthur's Kinepage" })).toBe(true);
    });

    it("does not over-match unrelated items", () => {
        expect(isQuestRewardRegistryItem({ displayName: "Thornbak" })).toBe(false);
        expect(isQuestRewardRegistryItem({ displayName: "Imperator Vandal" })).toBe(false);
    });
});

describe("getSafeToSellProtectionKeys", () => {
    it("classifies requested protection categories from acquisition sources", () => {
        const keys = getSafeToSellProtectionKeys({
            acquisitionSources: [
                "data:events/plague-star",
                "data:invasion/rewards",
                "data:quest/the-waverider",
                "data:enemy/shadow-stalker",
                "data:vendor/cetus/quills",
                "data:dojo/energy-lab",
                "data:nightwave/cred-offerings",
            ],
            isIncarnonItem: true,
            isProgenitorWeapon: true,
            hasWeaponRecipeConsumers: true,
        });

        expect(keys).toEqual([
            "dojoResearch",
            "eventItems",
            "factionPurchases",
            "incarnonItems",
            "invasionRewards",
            "nightwaveOfferings",
            "progenitorWeapons",
            "questRewards",
            "stalkerAssassinDrops",
            "weaponIngredients",
        ]);
    });

    it("treats murmur invasions as invasion rewards", () => {
        const keys = getSafeToSellProtectionKeys({
            acquisitionSources: ["data:duviri/murmur-invasion/rewards/rotation-a"],
        });

        expect(keys).toEqual(["invasionRewards"]);
    });

    it("falls back to known quest reward weapon heuristics when source data is sparse", () => {
        const keys = getSafeToSellProtectionKeys({
            acquisitionSources: [],
            rawPath: "/Lotus/Weapons/Tenno/Bows/Omicrus/OmicrusPlayerWep",
            displayName: "Nataruk",
        });

        expect(keys).toContain("questRewards");
    });

    it("uses the explicit quest reward registry before path heuristics", () => {
        const keys = getSafeToSellProtectionKeys({
            acquisitionSources: [],
            displayName: "Grimoire",
        });

        expect(keys).toContain("questRewards");
    });

    it("marks researched blueprint rewards as quest rewards", () => {
        const keys = getSafeToSellProtectionKeys({
            acquisitionSources: [],
            displayName: "Qorvex Blueprint",
        });

        expect(keys).toContain("questRewards");
    });

    it("classifies Incarnon items from explicit inventory metadata", () => {
        const keys = getSafeToSellProtectionKeys({
            acquisitionSources: [],
            displayName: "Phenmor",
            isIncarnonItem: true,
        });

        expect(keys).toContain("incarnonItems");
    });

    it("does not treat generic assassination or unrelated relic items as assassin drops", () => {
        const aklexPrimeKeys = getSafeToSellProtectionKeys({
            acquisitionSources: [
                "data:crafting",
                "data:relic/axi/a2",
                "data:relic/neo/o1",
            ],
            displayName: "Aklex Prime",
            rawPath: "/Lotus/Weapons/Tenno/Akimbo/AkLexPrimePistols",
        });

        const jordasAssassinationKeys = getSafeToSellProtectionKeys({
            acquisitionSources: ["data:wfitems:loc:jordas-golem-assassinate-rotation-c"],
            displayName: "Atlas Chassis Blueprint",
        });

        expect(aklexPrimeKeys).not.toContain("stalkerAssassinDrops");
        expect(jordasAssassinationKeys).not.toContain("stalkerAssassinDrops");
    });

    it("marks real stalker and assassin drops even when built-item acquisition is sparse", () => {
        const dreadKeys = getSafeToSellProtectionKeys({
            acquisitionSources: ["data:crafting"],
            displayName: "Dread",
            rawPath: "/Lotus/Weapons/Tenno/Bows/StalkerBow",
        });

        const brakkKeys = getSafeToSellProtectionKeys({
            acquisitionSources: ["data:crafting"],
            displayName: "Brakk",
            rawPath: "/Lotus/Weapons/Grineer/Pistols/GrineerHandShotgun/GrineerHandCannon",
        });

        const detronKeys = getSafeToSellProtectionKeys({
            acquisitionSources: ["data:enemy/zanuka-hunter"],
            displayName: "Detron",
            rawPath: "/Lotus/Weapons/Corpus/Pistols/CorpusHandShotgun/CorpusHandCannon",
        });

        expect(dreadKeys).toContain("stalkerAssassinDrops");
        expect(brakkKeys).toContain("stalkerAssassinDrops");
        expect(detronKeys).toContain("stalkerAssassinDrops");
    });
});

describe("buildWeaponIngredientIndex", () => {
    it("indexes weapons that are used to craft other weapons", () => {
        const requirementsByOutputId: Record<string, Array<{ catalogId: string; count: number }>> = {
            "items:afuris": [
                { catalogId: "items:furis", count: 2 },
            ],
            "items:aklex": [
                { catalogId: "items:lex", count: 2 },
            ],
            "items:akjagara": [
                { catalogId: "items:akbolto", count: 1 },
                { catalogId: "items:dual-skana", count: 1 },
            ],
            "items:braton": [
                { catalogId: "items:salvage", count: 1000 },
            ],
        };

        const names: Record<string, string> = {
            "items:afuris": "Afuris",
            "items:aklex": "Aklex",
            "items:akjagara": "Akjagara",
            "items:akbolto": "Akbolto",
            "items:dual-skana": "Dual Skana",
            "items:furis": "Furis",
            "items:lex": "Lex",
        };

        const weaponIds = new Set(Object.keys(names));

        const index = buildWeaponIngredientIndex({
            outputCatalogIds: Object.keys(requirementsByOutputId),
            getRequirements: (catalogId) => requirementsByOutputId[catalogId] ?? [],
            isWeaponCatalogId: (catalogId) => weaponIds.has(catalogId),
            getDisplayName: (catalogId) => names[catalogId] ?? null,
        });

        expect(index.get("items:furis")).toEqual([
            { outputCatalogId: "items:afuris", outputName: "Afuris", count: 2 },
        ]);
        expect(index.get("items:lex")).toEqual([
            { outputCatalogId: "items:aklex", outputName: "Aklex", count: 2 },
        ]);
        expect(index.get("items:akbolto")).toEqual([
            { outputCatalogId: "items:akjagara", outputName: "Akjagara", count: 1 },
        ]);
        expect(index.get("items:dual-skana")).toEqual([
            { outputCatalogId: "items:akjagara", outputName: "Akjagara", count: 1 },
        ]);
        expect(index.has("items:salvage")).toBe(false);
    });
});
