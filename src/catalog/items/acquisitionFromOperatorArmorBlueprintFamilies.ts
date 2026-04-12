import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const SOURCE_BY_PATH: ReadonlyArray<readonly [prefix: string, sources: string[]]> = [
    ["/Lotus/Types/Recipes/OperatorArmour/HardMode/OperatorTeshin", ["data:vendor/steel-path/teshin"]],
    ["/Lotus/Types/Recipes/OperatorArmour/Hood/RealOperatorWolfHoodBlueprint", ["data:nightwave/cred-offerings"]],
    ["/Lotus/Types/Recipes/OperatorArmour/OperatorArmourApparatistHipBlueprint", ["data:vendor/fortuna/vox-solaris"]],
    ["/Lotus/Types/Recipes/OperatorArmour/OperatorArmourGreaseHipBlueprint", ["data:vendor/fortuna/vox-solaris"]],
    ["/Lotus/Types/Recipes/OperatorArmour/OperatorArmourMonk", ["data:vendor/cetus/quills"]],
    ["/Lotus/Types/Recipes/OperatorArmour/OperatorArmourSeer", ["data:vendor/cetus/quills"]]
] as const;

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveOperatorArmorBlueprintFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!path) continue;

        const match = SOURCE_BY_PATH.find(([prefix]) => path.startsWith(prefix));
        if (!match) continue;

        out[catalogId] = { sources: match[1] };
    }

    return out;
}
