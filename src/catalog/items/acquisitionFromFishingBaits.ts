import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const BAIT_BLUEPRINT_SOURCE_BY_PREFIX: ReadonlyArray<readonly [prefix: string, sourceId: string]> = [
    ["/Lotus/Types/Recipes/Fishing/FishBaits/", "data:vendor/cetus/hai-luk"],
    ["/Lotus/Types/Game/FishBait/Infested/", "data:vendor/deimos/daughter"]
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isBlueprintLike(rec: any, path: string): boolean {
    if (path.toLowerCase().endsWith("blueprint")) return true;

    const name = safeString(rec?.displayName) ?? safeString(rec?.name) ?? "";
    return name.toLowerCase().endsWith(" blueprint");
}

function getSourceIdForPath(path: string): string | null {
    for (const [prefix, sourceId] of BAIT_BLUEPRINT_SOURCE_BY_PREFIX) {
        if (path.startsWith(prefix)) return sourceId;
    }

    return null;
}

export function deriveFishingBaitAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path) continue;
        if (!isBlueprintLike(rec, path)) continue;

        const sourceId = getSourceIdForPath(path);
        if (!sourceId) continue;

        out[catalogId] = { sources: [sourceId] };
    }

    return out;
}
