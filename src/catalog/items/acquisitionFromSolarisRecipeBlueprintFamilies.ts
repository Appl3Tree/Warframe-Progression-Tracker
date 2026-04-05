import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const SOLARIS_RECIPE_SOURCE_BY_PREFIX: ReadonlyArray<readonly [prefix: string, sourceId: string]> = [
    ["/Lotus/Types/Recipes/SolarisRecipes/Arcanes/", "data:vendor/fortuna/rude-zuud"],
    ["/Lotus/Types/Recipes/SolarisRecipes/Prospecting/", "data:vendor/fortuna/smokefinger"]
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveSolarisRecipeBlueprintFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path) continue;

        const match = SOLARIS_RECIPE_SOURCE_BY_PREFIX.find(([prefix]) => path.startsWith(prefix));
        if (!match) continue;

        out[catalogId] = { sources: [match[1]] };
    }

    return out;
}
