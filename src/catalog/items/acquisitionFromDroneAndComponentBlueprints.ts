import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const SOURCE_BY_PATH: ReadonlyArray<readonly [path: string, sources: string[]]> = [
    ["/Lotus/Types/Recipes/Drones/BasicResourceDroneBlueprint", ["data:market/credits"]],
    ["/Lotus/Types/Recipes/Drones/BasicUcResourceDroneBlueprint", ["data:market/credits"]],
    ["/Lotus/Types/Recipes/Components/CorruptedBombardBallBlueprint", ["data:baro/void-trader"]],
    ["/Lotus/Types/Recipes/Components/EliteAlertShipDecoBlueprint", ["data:vendor/arbitrations/galatea"]],
    ["/Lotus/Types/Recipes/Components/FormaStanceBlueprint", ["data:vendor/steel-path/teshin"]],
    ["/Lotus/Types/Recipes/Components/InfestedIrradiatedBaitBallBlueprint", ["data:quest/the-jordas-precept"]],
    ["/Lotus/Types/Recipes/Components/RelayThermicStrutBlueprint", ["data:events/pyrus-project"]],
    ["/Lotus/Types/Recipes/Components/StalkerBallBlueprint", ["data:nightwave/rank-reward"]],
    ["/Lotus/Types/Recipes/Components/UmbraFormaBlueprint", ["data:vendor/steel-path/teshin", "data:nightwave/rank-reward"]]
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveDroneAndComponentBlueprintAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
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
