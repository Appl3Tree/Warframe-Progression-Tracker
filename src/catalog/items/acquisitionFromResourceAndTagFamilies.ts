import { FULL_CATALOG, type CatalogId } from "../../domain/catalog/loadFullCatalog";

export type AcquisitionDef = {
    sources: string[];
};

const EXACT_PATH_SOURCES: Array<[string, string[]]> = [
    ["/Lotus/Types/Gameplay/Venus/Resources/ArachnoidCamperTerraItem", ["data:heist/exploiter-orb"]], // Lazulite Toroid
    ["/Lotus/Types/Gameplay/Venus/Resources/VenusMushroomItem", ["data:openworld/fortuna/gathering"]], // Frostcap
    ["/Lotus/Types/Gameplay/Eidolon/Resources/QuillsRareDogTag", ["data:eidolon/tridolon"]], // Flawless Sentient Core
    ["/Lotus/Types/Gameplay/JadeShadows/Resources/AscensionResourceItem", ["data:activity/ascension"]], // Vestigial Motes
    ["/Lotus/Types/Gameplay/JadeShadows/Resources/BioplasmaItem", ["data:activity/ascension"]], // Bioplasma
    ["/Lotus/Types/Items/MiscItems/Fissureum", ["data:events/thermia-fractures"]], // Diluted Thermia
    ["/Lotus/Types/Items/MiscItems/WaterFightBucks", ["data:events/anniversary"]], // Nakak Pearls
    ["/Lotus/Types/Items/MiscItems/MechSurvivalEventCreds", ["data:unobtainable/legacy"]], // Phasic Cells
    ["/Lotus/Types/Items/MiscItems/NoraInfestedCreds", ["data:unobtainable/legacy"]], // Emissary Cred
    ["/Lotus/Types/Items/MiscItems/NoraWolfCreds", ["data:unobtainable/legacy"]], // Wolf Cred
    ["/Lotus/Types/Items/MiscItems/AntiSerumInjector", ["data:unobtainable/legacy"]], // Zealot Derelict Code
    ["/Lotus/Types/Items/MiscItems/OmegaIsotope", ["data:events/fomorian-sabotage"]],
    ["/Lotus/Types/Items/MiscItems/RazorbackCipherPart", ["data:events/razorback-armada"]], // Cryptographic ALU
    ["/Lotus/Types/Items/MiscItems/VayHekCoordinateFragmentA", ["data:unobtainable/legacy"]],
    ["/Lotus/Types/Items/MiscItems/VayHekCoordinateFragmentB", ["data:unobtainable/legacy"]],
    ["/Lotus/Types/Items/MiscItems/VayHekCoordinateFragmentC", ["data:unobtainable/legacy"]],
    ["/Lotus/Types/Items/MiscItems/VayHekCoordinateFragmentD", ["data:unobtainable/legacy"]],
    ["/Lotus/Types/Items/MiscItems/HekNavCode", ["data:unobtainable/legacy"]],
];

const PREFIX_SOURCES: Array<[string, string[]]> = [
    ["/Lotus/Types/Items/Eidolon/AnimalTag", ["data:activity/cetus/conservation"]],
    ["/Lotus/Types/Items/Deimos/AnimalTag", ["data:activity/deimos/conservation"]],
    ["/Lotus/Types/Items/Solaris/AnimalTag", ["data:activity/fortuna/conservation"]],
    ["/Lotus/Types/Items/Plants/MiscItems/", ["data:activity/plants/scanning"]],
    ["/Lotus/Types/Items/SyndicateDogTags/Arbiters", ["data:syndicate/arbiters-medallions"]],
    ["/Lotus/Types/Items/SyndicateDogTags/Cephalon", ["data:syndicate/cephalon-suda-medallions"]],
    ["/Lotus/Types/Items/SyndicateDogTags/NewLoka", ["data:syndicate/new-loka-medallions"]],
    ["/Lotus/Types/Items/SyndicateDogTags/Perrin", ["data:syndicate/perrin-sequence-medallions"]],
    ["/Lotus/Types/Items/SyndicateDogTags/RedVeil", ["data:syndicate/red-veil-medallions"]],
    ["/Lotus/Types/Items/SyndicateDogTags/SteelMeridian", ["data:syndicate/steel-meridian-medallions"]],
];

const ENTRATI_TOKEN_SOURCES: Record<string, string[]> = {
    "/Lotus/Types/Items/Deimos/EntratiFragmentCommonA": ["data:tokens/deimos/otak"],
    "/Lotus/Types/Items/Deimos/EntratiFragmentCommonB": ["data:tokens/deimos/son"],
    "/Lotus/Types/Items/Deimos/EntratiFragmentCommonC": ["data:tokens/deimos/daughter"],
    "/Lotus/Types/Items/Deimos/EntratiFragmentRareA": ["data:tokens/deimos/grandmother"],
    "/Lotus/Types/Items/Deimos/EntratiFragmentUncommonA": ["data:tokens/deimos/father"],
    "/Lotus/Types/Items/Deimos/EntratiFragmentUncommonB": ["data:tokens/deimos/mother"],
};

export function deriveResourceAndTagFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = String(rec?.path ?? "");
        if (!path.startsWith("/Lotus/")) continue;

        const exact = EXACT_PATH_SOURCES.find(([target]) => target === path);
        if (exact) {
            out[catalogId as CatalogId] = { sources: exact[1] };
            continue;
        }

        const entratiTokenSources = ENTRATI_TOKEN_SOURCES[path];
        if (entratiTokenSources) {
            out[catalogId as CatalogId] = { sources: entratiTokenSources };
            continue;
        }

        const prefix = PREFIX_SOURCES.find(([target]) => path.startsWith(target));
        if (prefix) {
            out[catalogId as CatalogId] = { sources: prefix[1] };
        }
    }

    return out;
}
