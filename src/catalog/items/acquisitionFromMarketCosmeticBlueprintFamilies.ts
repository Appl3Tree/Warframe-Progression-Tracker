import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const MARKET_PLATINUM_BLUEPRINT_PATHS = new Set<string>([
    "/Lotus/Types/Recipes/Syandanas/AsaSyandanaBlueprint",
    "/Lotus/Types/Recipes/Syandanas/UruSyandanaBlueprint",
    "/Lotus/Types/Recipes/Syandanas/YomoSyandanaBlueprint",
    "/Lotus/Types/Recipes/ArmourAttachments/DaedelusChestPlateBlueprint",
    "/Lotus/Types/Recipes/ArmourAttachments/DaedelusLeftLegBlueprint",
    "/Lotus/Types/Recipes/ArmourAttachments/DaedelusLeftShoulderBlueprint",
    "/Lotus/Types/Recipes/ArmourAttachments/EdoChestPlateBlueprint",
    "/Lotus/Types/Recipes/ArmourAttachments/EdoLeftLegBlueprint",
    "/Lotus/Types/Recipes/ArmourAttachments/EdoLeftShoulderBlueprint",
    "/Lotus/Types/Recipes/ArmourAttachments/EosChestPlateBlueprint",
    "/Lotus/Types/Recipes/ArmourAttachments/EosLeftLegBlueprint",
    "/Lotus/Types/Recipes/ArmourAttachments/EosLeftShoulderBlueprint"
]);

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveMarketCosmeticBlueprintFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path || !MARKET_PLATINUM_BLUEPRINT_PATHS.has(path)) continue;

        out[catalogId] = { sources: ["data:market/platinum"] };
    }

    return out;
}
