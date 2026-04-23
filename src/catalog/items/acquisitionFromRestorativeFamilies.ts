import { FULL_CATALOG, type CatalogId } from "../../domain/catalog/loadFullCatalog";

export type AcquisitionDef = {
    sources: string[];
};

function pickSources(path: string): string[] | null {
    if (path.startsWith("/Lotus/Types/Restoratives/Consumable/Toxins/")) return ["data:crafting"];
    if (path.startsWith("/Lotus/Types/Restoratives/Consumable/NpcBuffs/")) return ["data:crafting"];
    if (path.startsWith("/Lotus/Types/Restoratives/TitaniaQuest/")) return ["data:crafting"];
    if (path.startsWith("/Lotus/Types/Restoratives/Consumable/InfestedSyringe")) return ["data:crafting"];
    if (path.startsWith("/Lotus/Types/Restoratives/Consumable/CreditChip")) return ["data:crafting"];
    if (
        path.startsWith("/Lotus/Types/Restoratives/Self") ||
        path.startsWith("/Lotus/Types/Restoratives/Team") ||
        path.startsWith("/Lotus/Types/Restoratives/ClanTeam")
    ) {
        return ["data:crafting"];
    }
    if (path.startsWith("/Lotus/Types/Game/SpectreArmies/")) return ["data:crafting"];
    if (path.startsWith("/Lotus/Weapons/CrewShip/")) return ["data:railjack/armaments"];
    return null;
}

export function deriveRestorativeFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = String(rec?.path ?? "");
        if (!path.startsWith("/Lotus/")) continue;
        const sources = pickSources(path);
        if (!sources) continue;
        out[catalogId as CatalogId] = { sources };
    }

    return out;
}
