import { describe, expect, it } from "vitest";
import itemsLeanJson from "../../data/_generated/items-lean.auto.json";
import warframeAllLeanJson from "../../data/_generated/warframe-items-all-lean.auto.json";
import {
    WARFRAME_ALL_COLLECTION_FIELDS,
    ITEMS_LEAN_DATA_FIELDS,
    WARFRAME_ALL_COMPONENT_FIELDS,
    WARFRAME_ALL_TOP_LEVEL_FIELDS,
} from "../../../scripts/generate/leanFieldContracts";

describe("lean field contracts", () => {
    it("keeps all items-lean data fields depended on by runtime catalogs", () => {
        expect(ITEMS_LEAN_DATA_FIELDS).toEqual(expect.arrayContaining([
            "Icon",
            "MarketMode",
            "RegularPrice",
            "PremiumPrice",
            "ShowInMarket",
            "ProductCategory",
            "resultItemType",
            "ResultItem",
            "type",
            "CompatibilityTags",
            "WeaponTypes",
            "ArtifactSlots",
        ]));
    });

    it("keeps all warframe-items-all top-level fields used by search and planners", () => {
        expect(WARFRAME_ALL_TOP_LEVEL_FIELDS).toEqual(expect.arrayContaining([
            "polarities",
            "stancePolarity",
            "damage",
            "tags",
            "ducats",
        ]));
    });

    it("keeps all warframe-items-all collection fields used by detail views", () => {
        expect(WARFRAME_ALL_COLLECTION_FIELDS).toEqual(expect.arrayContaining([
            "levelStats",
            "drops",
            "components",
            "abilities",
            "attacks",
        ]));
    });

    it("keeps component item counts in the lean All.json output", () => {
        expect(WARFRAME_ALL_COMPONENT_FIELDS).toEqual(expect.arrayContaining([
            "uniqueName",
            "name",
            "itemCount",
            "drops",
        ]));
    });

    it("preserves Ohma compatibility and slot metadata in generated items-lean output", () => {
        const ohma = (itemsLeanJson as Record<string, any>)["/Lotus/Weapons/Corpus/Melee/CrpTonfa/CrpTonfa"];

        expect(ohma?.data?.CompatibilityTags).toContain("TONFA_STANCE");
        expect(ohma?.data?.ArtifactSlots).toContain("AP_TACTIC");
    });

    it("preserves search and component fields in generated warframe-items-all output", () => {
        const all = warframeAllLeanJson as Array<Record<string, any>>;
        const taggedEntry = all.find((entry) => Array.isArray(entry?.tags) && entry.tags.length > 0);

        expect(Array.isArray(taggedEntry?.tags)).toBe(true);

        const firstCountedRecipe = all.find((entry) =>
            Array.isArray(entry?.components) &&
            entry.components.some((component: any) => typeof component?.itemCount === "number"),
        );

        expect(firstCountedRecipe).toBeTruthy();
    });
});
