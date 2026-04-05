import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const WEAPON_SKIN_BLUEPRINT_PREFIX = "/Lotus/Types/Recipes/Weapons/Skins/";
const NIGHTWAVE_SOURCE_ID = "data:nightwave/cred-offerings";

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveWeaponSkinBlueprintAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path?.startsWith(WEAPON_SKIN_BLUEPRINT_PREFIX)) continue;

        out[catalogId] = { sources: [NIGHTWAVE_SOURCE_ID] };
    }

    return out;
}
