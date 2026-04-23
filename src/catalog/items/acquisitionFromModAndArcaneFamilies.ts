import { FULL_CATALOG, type CatalogId } from "../../domain/catalog/loadFullCatalog";

export type AcquisitionDef = {
    sources: string[];
};

const THERMIA_AMALGAM_PATHS = new Set<string>([
    "/Lotus/Upgrades/Mods/DualSource/Pistol/MultishotDodgeMod",
    "/Lotus/Upgrades/Mods/DualSource/Melee/CritDamageChargeSpeedMod",
    "/Lotus/Upgrades/Mods/DualSource/Rifle/SerratedRushMod",
    "/Lotus/Upgrades/Mods/DualSource/Shotgun/ShotgunMedicMod",
]);

const BUSINESS_BOND_NAMES = new Set<string>([
    "Aerial Bond",
    "Astral Bond",
    "Momentous Bond",
    "Reinforced Bond",
    "Tenacious Bond",
]);

const SON_BOND_NAMES = new Set<string>([
    "Contagious Bond",
    "Duplex Bond",
    "Seismic Bond",
    "Vicious Bond",
]);

const TEASONAI_BOND_NAMES = new Set<string>([
    "Covert Bond",
    "Manifold Bond",
    "Mystic Bond",
    "Restorative Bond",
    "Tandem Bond",
]);

const ARBITRATION_VENDOR_MOD_NAMES = new Set<string>([
    "Aerial Ace",
    "Aerodynamic",
    "Cautious Shot",
    "Energizing Shot",
    "Mending Shot",
    "Preparation",
    "Power Donation",
    "Rolling Guard",
    "Sharpshooter",
    "Vigorous Swap",
]);

const MANUAL_SOURCES_BY_PATH: Record<string, string[]> = {
    "/Lotus/Upgrades/Mods/Aura/PlayerEnergyHealthRegenAuraMod": [
        "data:junction/mercury-venus",
        "data:nightwave/cred-offerings",
    ], // Dreamer's Bond
    "/Lotus/Upgrades/Mods/Aura/PlayerSniperDamageAuraMod": ["data:nightwave/cred-offerings"], // Dead Eye
    "/Lotus/Upgrades/Mods/Aura/EnemyShieldReductionAuraMod": ["data:nightwave/cred-offerings"], // Shield Disruption
    "/Lotus/Upgrades/Mods/Pistol/DualStat/ElectEventPistolMod": ["data:baro/void-trader"], // Jolt
    "/Lotus/Upgrades/Mods/Melee/DualStat/ElectEventMeleeMod": ["data:baro/void-trader"], // Voltaic Strike
    "/Lotus/Upgrades/Mods/Immortal/ImmortalWildcardMod": ["data:requiem/oull"], // Oull
    "/Lotus/Types/Sentinels/SentinelPrecepts/BeastLoyalRetriever": ["data:vendor/cetus/teasonai"],
    "/Lotus/Upgrades/CosmeticEnhancers/Peculiars/EvilSpiritMod": [
        "data:missionreward/sanctuary/elite-sanctuary-onslaught/rotationc",
    ], // Peculiar Audience
    "/Lotus/Upgrades/CosmeticEnhancers/Peculiars/DissolveEnemyMod": [
        "data:missionreward/sanctuary/elite-sanctuary-onslaught/rotationc",
    ], // Peculiar End
    "/Lotus/Weapons/Tenno/Melee/Polearms/Naginata/ShrineMaidenNaginataAugment": ["data:vendor/cetus/koumei-shrine"], // Amanata Pressure
    "/Lotus/Weapons/Tenno/LongGuns/Gunbrella/ShrineMaidenGunbrellaAugment": ["data:vendor/cetus/koumei-shrine"], // Higasa Serration
    "/Lotus/Upgrades/Mods/Rifle/Event/ParisHealOnStatusMod": ["data:vendor/deimos/father"], // Bhisaj-Bal
    "/Lotus/Upgrades/Mods/Melee/WeaponGlaiveOnKillBuffSecondary": ["data:baro/void-trader"], // Combo Fury
    "/Lotus/Upgrades/Mods/Melee/WeaponGlaiveSecondaryHeadshotKillMod": ["data:baro/void-trader"], // Combo Killer
    "/Lotus/Upgrades/Mods/Melee/WeaponGlaiveOnSixKillsBuffSecondary": ["data:baro/void-trader"], // Mark Of The Beast
    "/Lotus/Upgrades/Mods/Shotgun/WeaponRecoilReductionMod": ["data:vendor/steel-path/teshin"], // Counterbalance
    "/Lotus/Upgrades/Mods/Sentinel/Kubrow/ChargerFinisherMod": ["data:unobtainable/legacy"], // Helminth Ferocity
    "/Lotus/Upgrades/Mods/Pistol/DualStat/MagneticCritDamagePistolMod": ["data:quest/the-hex"], // Magnetic Might
    "/Lotus/Upgrades/EmpoweredHeavyMelee/TennokaiBaseMod": ["data:quest/whispers-in-the-walls"], // Mentor's Legacy
    "/Lotus/Weapons/Tenno/Melee/MeleeTrees/DualKatanaCmbOneMeleeTree": ["data:quest/the-duviri-paradox"], // Mountain's Edge
    "/Lotus/Upgrades/Mods/Rifle/GrenadeLauncherProjectileMod": ["data:nightwave/cred-offerings"], // Napalm Grenades
    "/Lotus/Upgrades/Mods/Sentinel/SentinelLootRadarEnemyRadarExpertMod": ["data:baro/void-trader"], // Primed Animal Instinct
    "/Lotus/Upgrades/Mods/Sentinel/Kubrow/Expert/KubrowPackLeaderExpertMod": ["data:baro/void-trader"], // Primed Pack Leader
    "/Lotus/Upgrades/Mods/Sentinel/SentinelRepairKitMod": ["data:enemy/domestik-drone"], // Repair Kit
    "/Lotus/Upgrades/Mods/Warframe/AvatarDamageResistanceStun": ["data:unobtainable/legacy"], // Resilient Focus
    "/Lotus/Upgrades/Mods/Syndicate/BallisticaMod": ["data:vendor/syndicate/the-perrin-sequence"], // Soaring Truth
    "/Lotus/Upgrades/Mods/Rifle/BowMultiShotOnHitMod": ["data:baro/void-trader"], // Split Flights
    "/Lotus/Upgrades/EmpoweredHeavyMelee/CursedSyndicateEmpoweredHeavyMeleeMod": ["data:vendor/relay/aspirant-zorba"], // Truth's Flame
    "/Lotus/Upgrades/Mods/Rifle/EventSniperReloadDamageMod": ["data:baro/void-trader"], // Primed Chamber
};

function uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values.filter((value) => typeof value === "string" && value.length > 0))).sort((a, b) =>
        a.localeCompare(b),
    );
}

function inferSources(path: string, name: string): string[] | null {
    const manual = MANUAL_SOURCES_BY_PATH[path];
    if (manual) return manual;

    if (path.startsWith("/Lotus/Upgrades/Focus/")) {
        return ["data:system/focus"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/OrokinChallenge/")) {
        return ["data:lua/challenge-room"];
    }

    if (THERMIA_AMALGAM_PATHS.has(path)) {
        return ["data:events/thermia-fractures"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/DualSource/")) {
        return ["data:missionreward/jupiter/the-ropalolyst"];
    }

    if (
        path.includes("/Event/Arbitration/") ||
        name.startsWith("Galvanized ") ||
        ARBITRATION_VENDOR_MOD_NAMES.has(name) ||
        /SPMod$/.test(path)
    ) {
        return ["data:vendor/arbitrations/galatea"];
    }

    if (
        (path.startsWith("/Lotus/Upgrades/Mods/Warframe/Expert/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Pistol/Expert/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Rifle/Expert/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Melee/Expert/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Shotgun/Expert/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Archwing/Expert/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Archwing/Rifle/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Archwing/Rifle/Expert/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Pistol/Event/AmbulasEvent/Expert/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Rifle/DualStat/") ||
            path.startsWith("/Lotus/Upgrades/Mods/Rifle/Event") ||
            path.startsWith("/Lotus/Upgrades/Mods/Sentinel/Expert/")) &&
        name.startsWith("Primed ")
    ) {
        return ["data:baro/void-trader"];
    }

    if (
        (path.startsWith("/Lotus/Upgrades/CosmeticEnhancers/Defensive/") ||
            path.startsWith("/Lotus/Upgrades/CosmeticEnhancers/Utility/")) &&
        name.startsWith("Arcane ")
    ) {
        return ["data:eidolon/tridolon", "data:missionreward/veil-proxima/erato/rotationc"];
    }

    if (path.startsWith("/Lotus/Types/Sentinels/SentinelPrecepts/")) {
        if (BUSINESS_BOND_NAMES.has(name)) return ["data:vendor/fortuna/business"];
        if (SON_BOND_NAMES.has(name)) return ["data:vendor/deimos/son"];
        if (TEASONAI_BOND_NAMES.has(name)) return ["data:vendor/cetus/teasonai"];
        return ["data:companions/precept-sentinel"];
    }

    if (path.startsWith("/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPrecept/")) {
        return ["data:companions/precept-moa"];
    }

    if (path.startsWith("/Lotus/Types/Friendly/Pets/KubrowPetPrecepts/")) {
        return ["data:companions/precept-kubrow"];
    }

    if (path.startsWith("/Lotus/Types/Friendly/Pets/CatbrowPetPrecepts/")) {
        return ["data:companions/precept-kavat"];
    }

    if (path.startsWith("/Lotus/Types/Friendly/Pets/CreaturePets/CreaturePrecepts/")) {
        return ["data:companions/precept-deimos-pet"];
    }

    if (path.startsWith("/Lotus/Types/Friendly/Pets/BeastWeapons/Stances/")) {
        return ["data:companions/posture-vendors"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/Sentinel/Kubrow/BeastWeapon/")) {
        return ["data:vendor/fortuna/business"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/Sentinel/Moa/")) {
        return ["data:companions/precept-moa"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/Hoverboard/")) {
        return ["data:vendor/fortuna/ventkids"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/Necromech/")) {
        return ["data:vendor/deimos/necraloid"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/PvPMods/")) {
        return ["data:conclave"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/Sets/")) {
        return ["data:system/set-bonus-record"];
    }

    if (
        path.startsWith("/Lotus/Upgrades/Mods/Randomized/") ||
        path.startsWith("/Lotus/StoreItems/Upgrades/Mods/Randomized/")
    ) {
        return ["data:system/veiled-riven"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/Railjack/")) {
        return ["data:unobtainable/dev-only"];
    }

    if (path.startsWith("/Lotus/Upgrades/Mods/Antiques/")) {
        return ["data:unobtainable/dev-only"];
    }

    if (path.startsWith("/Lotus/Upgrades/CosmeticEnhancers/Peculiars/")) {
        return ["data:missionreward/sanctuary/elite-sanctuary-onslaught/rotationc"];
    }

    return null;
}

export function deriveModAndArcaneFamilyAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = String(rec?.path ?? "");
        if (!path.startsWith("/Lotus/")) continue;

        const name = String(rec?.displayName ?? rec?.name ?? "");
        const sources = inferSources(path, name);
        if (!sources?.length) continue;

        out[catalogId as CatalogId] = { sources: uniqueSorted(sources) };
    }

    return out;
}
