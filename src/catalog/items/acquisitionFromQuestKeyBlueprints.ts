import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const SOURCES_BY_PATH = new Map<string, string[]>([
    ["/Lotus/Types/Keys/DojoKeyBlueprint", ["data:clan/join"]],
    ["/Lotus/Types/Keys/FairyQuestKeyBlueprint", ["data:quest/the-silver-grove"]],
    ["/Lotus/Types/Keys/GolemQuestKeyBlueprint", ["data:quest/the-jordas-precept"]],
    ["/Lotus/Types/Keys/InfestedAladVQuest/InfestedAladKeyBlueprint", ["data:quest/patient-zero"]],
    ["/Lotus/Types/Keys/LimboQuest/LimboChassisKeyBlueprint", ["data:quest/the-limbo-theorem"]],
    ["/Lotus/Types/Keys/LimboQuest/LimboHelmetKeyBlueprint", ["data:quest/the-limbo-theorem"]],
    ["/Lotus/Types/Keys/LimboQuest/LimboSystemsKeyBlueprint", ["data:quest/the-limbo-theorem"]]
]);

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function deriveQuestKeyBlueprintAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const itemPath = safeString(rec?.path) ?? safeString(rec?.raw?.rawLotus?.path);
        if (!itemPath) continue;

        const sources = SOURCES_BY_PATH.get(itemPath);
        if (!sources) continue;

        out[catalogId] = { sources };
    }

    return out;
}
