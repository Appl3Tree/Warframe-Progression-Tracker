import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const PET_RECIPE_PREFIX = "/Lotus/Types/Recipes/DeimosRecipes/Pets/";
const SON_BLUEPRINT_PREFIXES = ["InfestedCritter", "InfestedPredator"] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveDeimosPetBlueprintFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path?.startsWith(PET_RECIPE_PREFIX)) continue;

        const leaf = path.slice(PET_RECIPE_PREFIX.length);
        if (!SON_BLUEPRINT_PREFIXES.some((prefix) => leaf.startsWith(prefix))) continue;

        out[catalogId] = { sources: ["data:vendor/deimos/son"] };
    }

    return out;
}
