import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const NECRALOID_PATH_PREFIXES = [
    "/Lotus/Types/Recipes/DeimosRecipes/Mechs/NecromechPart",
    "/Lotus/Types/Recipes/DeimosRecipes/Mechs/Thanotech",
    "/Lotus/Types/Recipes/DeimosRecipes/Sentinel/ThanotechSentinel",
    "/Lotus/Types/Recipes/Weapons/ThanotechArchGunBlueprint",
    "/Lotus/Types/Recipes/Weapons/ThanotechGrenadeLauncherBlueprint"
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveNecraloidBlueprintFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path) continue;
        if (!NECRALOID_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) continue;

        out[catalogId] = { sources: ["data:vendor/deimos/necraloid"] };
    }

    return out;
}
