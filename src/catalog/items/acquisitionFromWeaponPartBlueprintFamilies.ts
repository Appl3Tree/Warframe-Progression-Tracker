import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const WEAPON_PART_SOURCE_BY_PREFIX: ReadonlyArray<readonly [prefix: string, sourceId: string]> = [
    ["EntFistIncarnon", "data:vendor/sanctum/loid"], // Ruvox
    ["InfTransformClawsWeapon", "data:vendor/deimos/father"], // Keratinos
    ["InfUziWeapon", "data:vendor/deimos/father"], // Zymos
    ["LasrianNoxPlayerWeapon", "data:vendor/hollvania/the-hex"], // Purgator 1
    ["ThanotechPistol", "data:vendor/deimos/father"], // Sepulcrum
    ["ThanotechRifle", "data:vendor/deimos/father"], // Trumna
    ["TnDagathBladeWhip", "data:dojo/dagaths-hollow"], // Dorrclave
    ["TnYareliPistol", "data:vendor/fortuna/ventkids"] // Kompressa
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveWeaponPartBlueprintFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    const recipePrefix = "/Lotus/Types/Recipes/Weapons/WeaponParts/";

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path?.startsWith(recipePrefix)) continue;

        const leaf = path.slice(recipePrefix.length);
        const match = WEAPON_PART_SOURCE_BY_PREFIX.find(([prefix]) => leaf.startsWith(prefix));
        if (!match) continue;

        out[catalogId] = { sources: [match[1]] };
    }

    return out;
}
