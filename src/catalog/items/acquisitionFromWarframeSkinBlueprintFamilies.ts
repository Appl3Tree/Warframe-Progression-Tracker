import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const SOURCE_BY_PATH: ReadonlyArray<readonly [path: string, sources: string[]]> = [
    ["/Lotus/Types/Recipes/WarframeSkins/AvatarBatBlueprint", ["data:events/naberus"]],
    ["/Lotus/Types/Recipes/WarframeSkins/AvatarBloodABlueprint", ["data:vendor/arbitrations/galatea"]],
    ["/Lotus/Types/Recipes/WarframeSkins/EmberImmortalBlueprint", ["data:market/platinum"]],
    ["/Lotus/Types/Recipes/WarframeSkins/ExcaliburImmortalBlueprint", ["data:market/platinum"]],
    ["/Lotus/Types/Recipes/WarframeSkins/FootstepsEidolonBlueprint", ["data:nightwave/rank-reward"]],
    ["/Lotus/Types/Recipes/WarframeSkins/FootstepsPetalsBlueprint", ["data:vendor/arbitrations/galatea"]],
    ["/Lotus/Types/Recipes/WarframeSkins/FrostImmortalBlueprint", ["data:market/platinum"]]
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveWarframeSkinBlueprintFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
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
