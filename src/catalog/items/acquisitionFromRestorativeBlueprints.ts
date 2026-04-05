import type { AcquisitionDef } from "./acquisitionFromSources";

const RESTORATIVE_BLUEPRINT_SOURCES_BY_CATALOG_ID: Record<string, string[]> = {
    // Dragon Keys: item descriptions explicitly state the blueprint comes from the Orokin Lab.
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/DamageDebuffKeyBlueprint": ["data:dojo/orokin-lab"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/HealthDebuffKeyBlueprint": ["data:dojo/orokin-lab"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/ShieldDebuffKeyBlueprint": ["data:dojo/orokin-lab"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/SpeedDebuffKeyBlueprint": ["data:dojo/orokin-lab"],

    // Utility gear researched in the Tenno Lab.
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/MapMarkerBlueprint": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/InfestedSyringeBlueprint": ["data:dojo/energy-lab"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/NpcBuffs/ArmorBuffSpeedDebuffBlueprint": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/NpcBuffs/CloakingBuffBlueprint": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/NpcBuffs/ReviveBuffBlueprint": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/NpcBuffs/SpeedBuffArmorDebuffBlueprint": ["data:clan/tenno-lab"],

    // Small Squad Restores: reusable blueprints sold for credits in the Market.
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/HundredTeamAmmoTotemBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/HundredTeamEnergyTotemBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/HundredTeamHealTotemBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/HundredTeamShieldTotemBlueprint": ["data:market/credits"],

    // Large Squad Restores: Rank 3 syndicate reusable 10-pack blueprints.
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/SyndicateTeamAmmoTenPackBlueprint": [
        "data:vendor/syndicate/red-veil"
    ],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/SyndicateTeamEnergyTenPackBlueprint": [
        "data:vendor/syndicate/arbiters-of-hexis",
        "data:vendor/syndicate/the-perrin-sequence"
    ],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/SyndicateTeamHealTenPackBlueprint": [
        "data:vendor/syndicate/new-loka",
        "data:vendor/syndicate/steel-meridian"
    ],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/SyndicateTeamShieldTenPackBlueprint": [
        "data:vendor/syndicate/cephalon-suda"
    ],

    // Event consumables and quest gear.
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/FomorianNegatorBlueprint": ["data:events/fomorian-sabotage"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/RazorbackCipherBlueprint": ["data:events/razorback-armada"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/TitaniaQuest/SpecterSummonFeyarchOberonBlueprint": ["data:quest/the-silver-grove"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/TitaniaQuest/SpecterSummonKnaveLokiBlueprint": ["data:quest/the-silver-grove"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/TitaniaQuest/SpecterSummonOrphidSarynBlueprint": ["data:quest/the-silver-grove"],

    // Antitoxins: reusable blueprints are Market purchases.
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/DayCommonAntitoxinBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/DayUnCommonAntitoxinBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/NightCommonAntitoxinBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/NightUnCommonAntitoxinBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/RareAntitoxinBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/SoloRareAntitoxinBlueprint": ["data:market/credits"],

    // False Profit consumables were purchased from the Market during the event.
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/CreditChipSmallBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/CreditChipMediumBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/StoreItems/Consumables/Restoratives/CreditChipLargeBlueprint": ["data:market/credits"]
};

export function deriveRestorativeBlueprintAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);

    for (const [catalogId, sources] of Object.entries(RESTORATIVE_BLUEPRINT_SOURCES_BY_CATALOG_ID)) {
        out[catalogId] = { sources: [...sources] };
    }

    return out;
}
