import { describe, expect, it } from "vitest";
import { getWikiBlueprintRequirements } from "../wikiBlueprintRequirements";

describe("getWikiBlueprintRequirements", () => {
    it("resolves Protea component output requirements from the wiki suits section", () => {
        const requirements = getWikiBlueprintRequirements("items:/Lotus/Types/Recipes/WarframeRecipes/ProteaHelmetComponent" as never);

        expect(requirements).toEqual([
            { catalogId: "items:/Lotus/Types/Items/MiscItems/Salvage", count: 11500 },
            { catalogId: "items:/Lotus/Types/Items/MiscItems/PolymerBundle", count: 5150 },
            { catalogId: "items:/Lotus/Types/Items/RailjackMiscItems/CubicsRailjackItem", count: 1250 },
            { catalogId: "items:/Lotus/Types/Items/MiscItems/NeuralSensor", count: 5 },
        ]);
    });
});
