import { FULL_CATALOG, type CatalogId } from "../../domain/catalog/loadFullCatalog";

export type AcquisitionDef = {
    sources: string[];
};

function pickNightwaveSource(path: string): string[] | null {
    if (
        path.includes("/Types/Challenges/Seasons/") ||
        path.includes("/Types/Items/MiscItems/Nora") ||
        path.includes("/Types/Items/SyndicateDogTags/Nora") ||
        path.includes("/Types/PickUps/Nightwave/") ||
        path.includes("/Types/Items/Ships/NoraShip") ||
        path.includes("/Upgrades/Mods/Nightwave/") ||
        path.includes("/Event/Nightwave/") ||
        path.includes("/Upgrades/Skins/Nightwave/") ||
        path.includes("/Upgrades/Skins/Sigils/Nightwave") ||
        path.includes("/Upgrades/Skins/Sigils/RadioLegion") ||
        path.includes("/Upgrades/Skins/Effects/Nightwave") ||
        path.includes("/Upgrades/Skins/Liset/NoraShip") ||
        path.includes("/Upgrades/Skins/Operator/Accessories/Nora") ||
        path.includes("/Types/Items/ShipDecos/Nightwave/") ||
        path.includes("/Types/Items/ShipDecos/LisetPropNora") ||
        path.includes("/Types/Items/Emotes/Nightwave") ||
        path.includes("/Types/StoreItems/AvatarImages/AvatarImageNightwave")
    ) {
        return ["data:nightwave/general"];
    }
    return null;
}

export function deriveNightwaveFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = String(rec?.path ?? "");
        if (!path.startsWith("/Lotus/")) continue;
        const sources = pickNightwaveSource(path);
        if (!sources) continue;
        out[catalogId as CatalogId] = { sources };
    }

    return out;
}
