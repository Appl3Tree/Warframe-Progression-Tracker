import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const TROPHY_SOURCE_BY_PREFIX: ReadonlyArray<readonly [prefix: string, sourceId: string]> = [
    ["/Lotus/Types/Items/Fish/Eidolon/TrophyBlueprints/", "data:vendor/cetus/hai-luk"],
    ["/Lotus/Types/Items/Fish/Solaris/TrophyBlueprints/", "data:vendor/fortuna/business"],
    ["/Lotus/Types/Items/Fish/Deimos/TrophyBlueprints/", "data:vendor/deimos/daughter"]
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getSourceIdForPath(path: string): string | null {
    for (const [prefix, sourceId] of TROPHY_SOURCE_BY_PREFIX) {
        if (path.startsWith(prefix)) return sourceId;
    }

    return null;
}

export function deriveFishingTrophyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path) continue;

        const sourceId = getSourceIdForPath(path);
        if (!sourceId) continue;

        out[catalogId] = { sources: [sourceId] };
    }

    return out;
}
