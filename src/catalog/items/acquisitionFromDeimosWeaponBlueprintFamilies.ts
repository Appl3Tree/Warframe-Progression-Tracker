import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const FATHER_WEAPON_BLUEPRINTS = new Set([
    "/Lotus/Types/Recipes/Weapons/ThanotechPistolBlueprint",
    "/Lotus/Types/Recipes/Weapons/ThanotechRifleBlueprint"
]);

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveDeimosWeaponBlueprintFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path || !FATHER_WEAPON_BLUEPRINTS.has(path)) continue;

        out[catalogId] = { sources: ["data:vendor/deimos/father"] };
    }

    return out;
}
