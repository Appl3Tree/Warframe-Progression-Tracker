import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const SOLARIS_OPERATOR_ARMOR_SOURCE_BY_PREFIX: ReadonlyArray<readonly [prefix: string, sourceId: string]> = [
    ["Apparatist", "data:vendor/fortuna/vox-solaris"], // Haztech
    ["GreaseWitch", "data:vendor/fortuna/vox-solaris"], // Smelter
    ["Smelter", "data:vendor/fortuna/vox-solaris"], // Outrider
    ["Technomancer", "data:vendor/fortuna/vox-solaris"], // Vent Rat
    ["SuitN", "data:vendor/fortuna/ventkids"], // Vent Pobber Ventkid
    ["SuitO", "data:vendor/fortuna/ventkids"] // Kubrodon Ventkid
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveSolarisOperatorArmorAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    const recipePrefix = "/Lotus/Types/Recipes/OperatorArmour/Solaris/";

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path?.startsWith(recipePrefix)) continue;

        const leaf = path.slice(recipePrefix.length);
        const match = SOLARIS_OPERATOR_ARMOR_SOURCE_BY_PREFIX.find(([prefix]) => leaf.startsWith(prefix));
        if (!match) continue;

        out[catalogId] = { sources: [match[1]] };
    }

    return out;
}
