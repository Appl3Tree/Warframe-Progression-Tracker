import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const SOURCE_BY_PATH: ReadonlyArray<readonly [path: string, sources: string[]]> = [
    ["/Lotus/Types/Recipes/LandingCraftRecipes/Mantys/MantysStarChartBlueprint", ["data:container/rare-orokin-storage"]],
    ["/Lotus/Types/Recipes/LandingCraftRecipes/Mantys/MantysPowerCoreBlueprint", ["data:container/forgotten-grineer-storage", "data:container/rare-grineer-storage"]],
    ["/Lotus/Types/Recipes/LandingCraftRecipes/Mantys/MantysExoskeletonBlueprint", ["data:container/rare-corpus-storage"]],
    ["/Lotus/Types/Recipes/LandingCraftRecipes/BlueSky/BlueSkyAvionicsBlueprint", ["data:enemy/zanuka-hunter"]],
    ["/Lotus/Types/Recipes/LandingCraftRecipes/BlueSky/BlueSkyEnginesBlueprint", ["data:enemy/stalker"]],
    ["/Lotus/Types/Recipes/LandingCraftRecipes/BlueSky/BlueSkyFuselageBlueprint", ["data:enemy/vem-tabook"]],
    ["/Lotus/Types/Recipes/LandingCraftRecipes/ZarimanShip/ZarimanShipAvionicsBlueprint", ["data:container/reinforced-carrypod"]],
    ["/Lotus/Types/Recipes/LandingCraftRecipes/ZarimanShip/ZarimanShipEnginesBlueprint", ["data:container/reinforced-carrypod"]],
    ["/Lotus/Types/Recipes/LandingCraftRecipes/ZarimanShip/ZarimanShipFuselageBlueprint", ["data:container/reinforced-carrypod"]]
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveLandingCraftComponentBlueprintAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path) continue;

        const match = SOURCE_BY_PATH.find(([candidate]) => candidate === path);
        if (!match) continue;

        out[catalogId] = { sources: match[1] };
    }

    return out;
}
