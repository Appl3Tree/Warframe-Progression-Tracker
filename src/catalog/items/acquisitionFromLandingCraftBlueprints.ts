import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const MARKET_LANDING_CRAFT_BLUEPRINTS = new Set([
    "/Lotus/Types/Recipes/LandingCraftRecipes/BlueSky/BlueSkyBlueprint",
    "/Lotus/Types/Recipes/LandingCraftRecipes/Gyroscope/GyroscopeBlueprint",
    "/Lotus/Types/Recipes/LandingCraftRecipes/Mantys/MantysBlueprint",
    "/Lotus/Types/Recipes/LandingCraftRecipes/ZarimanShip/ZarimanShipBlueprint"
]);

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveLandingCraftBlueprintAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path || !MARKET_LANDING_CRAFT_BLUEPRINTS.has(path)) continue;

        out[catalogId] = { sources: ["data:market/credits"] };
    }

    return out;
}
