// ===== FILE: src/catalog/items/acquisitionFromDropData.ts =====
// src/catalog/items/acquisitionFromDropData.ts

import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

// Generated from warframe-drop-data/raw/missionRewards.json by your scripts
import relicMissionRewardsIndex from "../../data/_generated/relic-missionRewards-index.auto.json";

// warframe-drop-data/raw inputs
import missionRewardsJson from "../../../external/warframe-drop-data/raw/missionRewards.json";
import resourceByAvatarJson from "../../../external/warframe-drop-data/raw/resourceByAvatar.json";
import additionalItemByAvatarJson from "../../../external/warframe-drop-data/raw/additionalItemByAvatar.json";
import miscItemsJson from "../../../external/warframe-drop-data/raw/miscItems.json";
import transientRewardsJson from "../../../external/warframe-drop-data/raw/transientRewards.json";
import solarisBountyRewardsJson from "../../../external/warframe-drop-data/raw/solarisBountyRewards.json";

export type AcquisitionDef = {
    sources: string[];
};

type RelicMissionRow = {
    relicKey: string;     // e.g. "meso v14"
    relicDisplay: string; // e.g. "Meso V14 Relic"
    pathLabel: string;    // e.g. "missionRewards / Ceres / Bode / C"
    rotation: string;     // e.g. "C"
    chance: number;       // e.g. 9.68
};

type ResourceByAvatarRow = {
    source?: string;
    items?: Array<{
        item?: string;
        rarity?: string;
        chance?: number;
    }>;
};

type MiscItemsRow = {
    enemyName?: string;
    items?: Array<{
        itemName?: string;
        rarity?: string;
        chance?: number;
    }>;
};

type TransientRewardsRow = {
    objectiveName?: string;
    rewards?: any;
};

type SolarisBountyRow = {
    bountyName?: string;
    name?: string;
    objectiveName?: string;
    rewards?: any;
};

// Manual overrides live here intentionally.
// Policy: if a catalogId has a manual mapping, it MUST be included.
export const MANUAL_ACQUISITION_BY_CATALOG_ID: Record<string, string[]> = {
    // ----------------------------
    // Unobtainable / account-locked
    // ----------------------------
    "items:/Lotus/Powersuits/Excalibur/ExcaliburPrime": ["data:unobtainable/founders"],

    // ----------------------------
    // Quest: Octavia’s Anthem (Mandachord)
    // ----------------------------
    "items:/Lotus/Types/Keys/BardQuest/BardQuestSequencerBlueprint": ["data:quest/octavias-anthem"],
    "items:/Lotus/Types/Keys/BardQuest/BardQuestSequencerPartA": ["data:quest/octavias-anthem"], // Mandachord Body
    "items:/Lotus/Types/Keys/BardQuest/BardQuestSequencerPartB": ["data:quest/octavias-anthem"], // Mandachord Fret
    "items:/Lotus/Types/Keys/BardQuest/BardQuestSequencerPartC": ["data:quest/octavias-anthem"], // Mandachord Bridge

    // ----------------------------
    // Quest: Whispers in the Walls (Grimoire)
    // ----------------------------
    "items:/Lotus/Weapons/Tenno/Grimoire/TnDoppelgangerGrimoire": ["data:quest/whispers-in-the-walls"], // Grimoire

    // ----------------------------
    // Orb Vallis: Resources / Fortuna bounties / Heists
    // ----------------------------
    "items:/Lotus/Types/Gameplay/Venus/Resources/VenusTreeItem": ["data:bounty/solaris-united"], // Tepa Nodule
    "items:/Lotus/Types/Gameplay/Venus/Resources/ArachnoidCamperItem": ["data:heist/profit-taker"], // Crisma Toroid

    // ----------------------------
    // Market / Account / Starter / System-given
    // ----------------------------
    "items:/Lotus/Weapons/Tenno/Pistol/HeavyPistol": ["data:market/credits"], // Lex
    "items:/Lotus/Weapons/Tenno/Akimbo/AkimboPistol": ["data:market/credits"], // Aklato
    "items:/Lotus/Weapons/Tenno/Archwing/Primary/ThanoTechArchLongGun/ThanoTechLongGun": ["data:necramech/arquebex-archgun"], // Mausolon (coarse)
    "items:/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier/SentAmpTrainingBarrel": ["data:operator/amp-starter"], // Mote Prism

    // ----------------------------
    // Conclave / PvP variants
    // ----------------------------
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipOne": ["data:conclave"], // Balla
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipTwo": ["data:conclave"], // Ooltha
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipThree": ["data:conclave"], // Mewan
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipFour": ["data:conclave"], // Cyath
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipFive": ["data:conclave"], // Dehtat
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipSix": ["data:conclave"], // Kronsh

    "items:/Lotus/Weapons/Ostron/Melee/ModularMeleeInfested/Tips/PvPVariantInfestedTipOne": ["data:event/plague-star"], // Plague Kripath
    "items:/Lotus/Weapons/Ostron/Melee/ModularMeleeInfested/Tips/PvPVariantInfestedTipTwo": ["data:event/plague-star"], // Plague Keewar

    // ----------------------------
    // Pets: Kavat / Kubrow / Infested companions / Predasites / Vulpaphylas / Venari
    // ----------------------------
    "items:/Lotus/Powersuits/Khora/Kavat/KhoraPrimeKavatPowerSuit": ["data:warframe/khora-prime"], // Venari Prime
    "items:/Lotus/Types/Game/CatbrowPet/CheshireCatbrowPetPowerSuit": ["data:pets/kavat"], // Smeeta Kavat
    "items:/Lotus/Types/Game/CatbrowPet/MirrorCatbrowPetPowerSuit": ["data:pets/kavat"], // Adarza Kavat

    "items:/Lotus/Types/Game/KubrowPet/AdventurerKubrowPetPowerSuit": ["data:pets/kubrow"], // Sahasa Kubrow
    "items:/Lotus/Types/Game/KubrowPet/FurtiveKubrowPetPowerSuit": ["data:pets/kubrow"], // Huras Kubrow
    "items:/Lotus/Types/Game/KubrowPet/GuardKubrowPetPowerSuit": ["data:pets/kubrow"], // Raksa Kubrow
    "items:/Lotus/Types/Game/KubrowPet/HunterKubrowPetPowerSuit": ["data:pets/kubrow"], // Sunika Kubrow
    "items:/Lotus/Types/Game/KubrowPet/RetrieverKubrowPetPowerSuit": ["data:pets/kubrow"], // Chesa Kubrow
    "items:/Lotus/Types/Game/KubrowPet/ChargerKubrowPetPowerSuit": ["data:pets/helminth-charger"], // Helminth Charger

    "items:/Lotus/Types/Friendly/Pets/CreaturePets/ArmoredInfestedCatbrowPetPowerSuit": ["data:pets/vulpaphyla"], // Panzer Vulpaphyla
    "items:/Lotus/Types/Friendly/Pets/CreaturePets/HornedInfestedCatbrowPetPowerSuit": ["data:pets/vulpaphyla"], // Crescent Vulpaphyla
    "items:/Lotus/Types/Friendly/Pets/CreaturePets/VulpineInfestedCatbrowPetPowerSuit": ["data:pets/vulpaphyla"], // Sly Vulpaphyla

    "items:/Lotus/Types/Friendly/Pets/CreaturePets/MedjayPredatorKubrowPetPowerSuit": ["data:pets/predasite"], // Medjay Predasite
    "items:/Lotus/Types/Friendly/Pets/CreaturePets/PharaohPredatorKubrowPetPowerSuit": ["data:pets/predasite"], // Pharaoh Predasite
    "items:/Lotus/Types/Friendly/Pets/CreaturePets/VizierPredatorKubrowPetPowerSuit": ["data:pets/predasite"], // Vizier Predasite

    // ----------------------------
    // Moa companion weapons / parts (Fortuna)
    // ----------------------------
    "items:/Lotus/Types/Friendly/Pets/MoaPets/MoaPetComponents/HextraWeapon": ["data:pets/moa"], // Multron

    // ----------------------------
    // Sentinel weapons (general)
    // ----------------------------
    "items:/Lotus/Types/Sentinels/SentinelWeapons/Gremlin": ["data:sentinels/weapons"], // Artax
    "items:/Lotus/Types/Sentinels/SentinelWeapons/LaserRifle": ["data:sentinels/weapons"], // Laser Rifle
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrimeLaserRifle": ["data:sentinels/weapons"], // Prime Laser Rifle

    "items:/Lotus/Types/Sentinels/SentinelWeapons/BurstLaserPistol": ["data:sentinels/weapons"], // Burst Laser
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrimeBurstLaserPistol": ["data:sentinels/weapons"], // Burst Laser Prime
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrismaBurstLaserPistol": ["data:baro/void-trader"], // Prisma Burst Laser

    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentGlaiveWeapon": ["data:sentinels/weapons"], // Deconstructor
    "items:/Lotus/Types/Sentinels/SentinelWeapons/DeconstructorPrime/PrimeHeliosGlaiveWeapon": ["data:sentinels/weapons"], // Deconstructor Prime

    "items:/Lotus/Types/Sentinels/SentinelWeapons/DethMachineRifle": ["data:sentinels/weapons"], // Deth Machine Rifle
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrimeDethMachineRifle": ["data:sentinels/weapons"], // Deth Machine Rifle Prime

    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentShotgun": ["data:sentinels/weapons"], // Sweeper
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrimeSentShotgun": ["data:sentinels/weapons"], // Sweeper Prime

    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentinelFreezeRayRifle": ["data:sentinels/weapons"], // Verglas
    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentinelFreezeRayPrimeRifle": ["data:sentinels/weapons"], // Verglas Prime

    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentElecRailgun": ["data:sentinels/weapons"], // Vulklok
    "items:/Lotus/Types/Sentinels/SentinelPowersuits/PrismaShadePowerSuit": ["data:baro/void-trader"], // Prisma Shade

    // ----------------------------
    // Baro Ki’Teer / Void Trader
    // ----------------------------
    "items:/Lotus/Weapons/Corpus/Bow/Longbow/PrismaLenz/PrismaLenzWeapon": ["data:baro/void-trader"], // Prisma Lenz
    "items:/Lotus/Weapons/Corpus/LongGuns/CorpusUMP/PrismaCorpusUMP": ["data:baro/void-trader"], // Prisma Tetra
    "items:/Lotus/Weapons/Corpus/Melee/CrpTonfa/CrpPrismaTonfa": ["data:baro/void-trader"], // Prisma Ohma
    "items:/Lotus/Weapons/Corpus/Melee/KickAndPunch/PrismaObex": ["data:baro/void-trader"], // Prisma Obex
    "items:/Lotus/Weapons/Corpus/Pistols/CrpHandRL/PrismaAngstrum": ["data:baro/void-trader"], // Prisma Angstrum

    "items:/Lotus/Weapons/Grineer/LongGuns/GrineerLeverActionRifle/PrismaGrinlokWeapon": ["data:baro/void-trader"], // Prisma Grinlok
    "items:/Lotus/Weapons/Grineer/LongGuns/VoidTraderGorgon/VTGorgon": ["data:baro/void-trader"], // Prisma Gorgon
    "items:/Lotus/Weapons/Grineer/Melee/GrineerMachetteAndCleaver/PrismaDualCleavers": ["data:baro/void-trader"], // Prisma Dual Cleavers
    "items:/Lotus/Weapons/Grineer/Melee/GrineerMachetteAndCleaver/PrismaMachete": ["data:baro/void-trader"], // Prisma Machete
    "items:/Lotus/Weapons/Grineer/Pistols/GrineerBulbousSMG/Prisma/PrismaTwinGremlinsWeapon": ["data:baro/void-trader"], // Prisma Twin Gremlins

    "items:/Lotus/Weapons/Tenno/Archwing/Melee/VoidTraderArchsword/VTArchSwordWeapon": ["data:baro/void-trader"], // Prisma Veritux
    "items:/Lotus/Weapons/Tenno/Archwing/Primary/ArchwingHeavyPistols/Prisma/PrismaArchHeavyPistols": ["data:baro/void-trader"], // Prisma Dual Decurions

    "items:/Lotus/Weapons/VoidTrader/PrismaGrakata": ["data:baro/void-trader"], // Prisma Grakata
    "items:/Lotus/Weapons/VoidTrader/PrismaSkana": ["data:baro/void-trader"], // Prisma Skana
    "items:/Lotus/Weapons/VoidTrader/VTDetron": ["data:baro/void-trader"], // Mara Detron
    "items:/Lotus/Weapons/Tenno/Melee/Warfan/TnMoonWarfan/MoonWarfanWeapon": ["data:baro/void-trader"], // Vericres

    // ----------------------------
    // Variants / Starter series
    // ----------------------------
    "items:/Lotus/Weapons/Grineer/LongGuns/GrineerSniperRifle/VulkarWraith": ["data:variants/wraith"],
    "items:/Lotus/Weapons/Grineer/Melee/GrineerMachetteAndCleaver/WraithMacheteWeapon": ["data:variants/wraith"],
    "items:/Lotus/Weapons/Grineer/Melee/GrnBoomerang/HalikarWraithWeapon": ["data:variants/wraith"],
    "items:/Lotus/Weapons/Grineer/Pistols/WraithSingleViper/WraithSingleViper": ["data:variants/wraith"],

    "items:/Lotus/Weapons/Corpus/LongGuns/CrpBFG/Vandal/VandalCrpBFG": ["data:variants/vandal"], // Opticor Vandal
    "items:/Lotus/Weapons/Corpus/LongGuns/CrpFreezeRay/Vandal/CrpFreezeRayVandalRifle": ["data:variants/vandal"], // Glaxion Vandal
    "items:/Lotus/Weapons/Corpus/LongGuns/CrpShockRifle/QuantaVandal": ["data:variants/vandal"], // Quanta Vandal
    "items:/Lotus/Weapons/Corpus/LongGuns/Machinegun/SupraVandal": ["data:variants/vandal"], // Supra Vandal
    "items:/Lotus/Weapons/ClanTech/Energy/VandalElectroProd": ["data:variants/vandal"], // Prova Vandal

    "items:/Lotus/Weapons/Grineer/LongGuns/GrnOrokinRifle/GrnOrokinRifleWeapon": ["data:variants/prime"], // Gotva Prime
    "items:/Lotus/Weapons/Tenno/Pistol/LatoPrime": ["data:variants/prime"], // Lato Prime
    "items:/Lotus/Weapons/Tenno/Melee/LongSword/SkanaPrime": ["data:variants/prime"], // Skana Prime

    "items:/Lotus/Weapons/MK1Series/MK1Bo": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Furax": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Furis": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Kunai": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Paris": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Strun": ["data:market/credits"],
    "items:/Lotus/Weapons/Tenno/Rifle/StartingRifle": ["data:market/credits"], // MK1-Braton

    // ----------------------------
    // Infested “Coda” weapons (Infested Lich system)
    // ----------------------------
    "items:/Lotus/Weapons/Infested/InfestedLich/LongGuns/1999InfShotgun/1999InfShotgunWeapon": ["data:lich/infested-coda"], // Coda Bassocyst
    "items:/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaHema": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaSporothrix": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaSynapse": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/CodaCaustacyst/CodaCaustacyst": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/CodaHirudo": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/CodaMire": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/CodaPathocyst/CodaPathocyst": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/InfestedHammer/InfLichHammerWeapon": ["data:lich/infested-coda"], // Coda Motovore
    "items:/Lotus/Weapons/Infested/InfestedLich/Pistols/1999InfSporePistol/1999InfSporePistolWeapon": ["data:lich/infested-coda"], // Dual Coda Torxica
    "items:/Lotus/Weapons/Infested/InfestedLich/Pistols/CodaCatabolyst": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Pistols/CodaPox": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Pistols/CodaTysis": ["data:lich/infested-coda"],

    // ----------------------------
    // Remaining unknown-acquisition (coarse buckets)
    // ----------------------------
    "items:/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeaponPS": ["data:todo/zanuka-companion"],
    "items:/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeaponIP": ["data:todo/zanuka-companion"],
    "items:/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeaponIS": ["data:todo/zanuka-companion"],

    "items:/Lotus/Weapons/Grineer/Melee/GunBlade/GrnGunBlade/GrnGunblade": ["data:todo/vastilok"],
    "items:/Lotus/Powersuits/Khora/Kavat/KhoraKavatPowerSuit": ["data:warframe/khora"],

    // Manually adjusted unknown-acquisitions
    "items:/Lotus/Types/Items/MiscItems/GrnFlameSpearPart": ["data:enemyitem/prosecutors"],
    "items:/Lotus/Types/Items/MiscItems/SentientFragmentLootItem": ["data:node/murex/20-sentients"],
    "items:/Lotus/Types/Items/MushroomJournal/PlainMushroomJournalItem": ["data:deepmines/gathering"],

    "items:/Lotus/Weapons/Tenno/Pistol/BurstPistol": ["data:market/credits"], // Sicarus
    "items:/Lotus/Weapons/Tenno/Shotgun/Shotgun": ["data:market/credits"], // Strun
};

function normalizeName(s: string): string {
    return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeNameNoPunct(s: string): string {
    return normalizeName(s).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function toToken(s: string): string {
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

/**
 * Strip common quantity prefixes from warframe-drop-data itemName values:
 *  - "300X Ferrite" -> "Ferrite"
 *  - "2X Gallium"   -> "Gallium"
 */
function stripQtyPrefix(s: string): string {
    return String(s ?? "").replace(/^\s*\d+\s*[xX]\s*/g, "").trim();
}

/**
 * Build a valid data: SourceId payload segment.
 * For drop-data derived sources we want data:* so access checks treat them as actionable by default,
 * and so they match the ids built in src/catalog/sources/sourceCatalog.ts.
 */
function dataId(parts: string[]): string {
    const cleaned = parts
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "data:unknown";
    return `data:${cleaned.join("/")}`;
}

function uniqSorted(xs: string[]): string[] {
    const set = new Set<string>();
    for (const x of xs) {
        if (typeof x === "string" && x.trim()) set.add(x.trim());
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

function isRelicProjectionCatalogId(catalogId: string): boolean {
    // The projection-style relic items live here (Axi A1 Exceptional, etc.)
    return /\/Types\/Game\/Projections\//i.test(catalogId);
}

/**
 * Extract a normalized relicKey from a displayName for:
 * - Era relics: "Axi A1 Exceptional" or "Axi A1 Relic"
 * - Requiem: "Requiem I Intact" etc.
 * - Vanguard: "Vanguard C1 Radiant" etc.
 */
function relicKeyFromDisplayName(displayName: string): string | null {
    const n = (displayName ?? "").replace(/\s+/g, " ").trim();

    {
        const m = n.match(
            /^\s*(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?\s*$/i
        );
        if (m) return `${m[1].toLowerCase()} ${m[2].toLowerCase()}`;
    }

    {
        const m = n.match(
            /^\s*Requiem\s+(I|II|III|IV)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?\s*$/i
        );
        if (m) return `requiem ${m[1].toLowerCase()}`;
    }

    {
        const m = n.match(
            /^\s*Vanguard\s+([A-Za-z0-9]+)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?\s*$/i
        );
        if (m) return `vanguard ${m[1].toLowerCase()}`;
    }

    return null;
}

function parseMissionRewardsPathLabel(pathLabel: string): { planet: string; node: string; rotation: string | null } | null {
    // Expected: "missionRewards / Ceres / Bode / C"
    const parts = (pathLabel ?? "").split("/").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3) return null;

    const planet = parts[1] ?? "";
    const node = parts[2] ?? "";
    if (!planet || !node) return null;

    const rotation = parts.length >= 4 ? (parts[3] ?? null) : null;
    return { planet, node, rotation };
}

function buildRelicKeyToNodeSourcesIndex(): Record<string, string[]> {
    const rows = relicMissionRewardsIndex as unknown as RelicMissionRow[];
    const map = new Map<string, Set<string>>();

    for (const r of rows) {
        const key = normalizeName(r.relicKey);
        if (!key) continue;

        const parsed = parseMissionRewardsPathLabel(r.pathLabel);
        if (!parsed) continue;

        const sid = dataId(["node", parsed.planet, parsed.node]);

        if (!map.has(key)) map.set(key, new Set<string>());
        map.get(key)!.add(sid);
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) {
        out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    }
    return out;
}

const RELIC_NODE_SOURCES_BY_KEY: Record<string, string[]> = buildRelicKeyToNodeSourcesIndex();

function sourcesForRelicProjection(rec: any): { key: string | null; sources: string[] } {
    const name =
        typeof rec?.displayName === "string"
            ? rec.displayName
            : (typeof rec?.name === "string" ? rec.name : "");

    const key = relicKeyFromDisplayName(name);
    if (!key) return { key: null, sources: [] };

    const sources = RELIC_NODE_SOURCES_BY_KEY[normalizeName(key)] ?? [];
    return { key, sources };
}

/**
 * missionRewards.json
 * itemName -> data:node/<planet>/<node>
 */
function buildMissionRewardsItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);
    if (!root || typeof root !== "object" || Array.isArray(root)) return {};

    const map = new Map<string, Set<string>>();

    for (const [planetName, planetObj] of Object.entries(root as Record<string, any>)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        for (const [nodeName, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
            if (!nodeObj || typeof nodeObj !== "object") continue;

            const sid = dataId(["node", String(planetName), String(nodeName)]);

            const stack: any[] = [nodeObj];
            while (stack.length > 0) {
                const cur = stack.pop();
                if (!cur) continue;

                if (Array.isArray(cur)) {
                    for (const v of cur) stack.push(v);
                    continue;
                }

                if (typeof cur !== "object") continue;

                if (typeof (cur as any).itemName === "string") {
                    const raw = String((cur as any).itemName);
                    const canonical = stripQtyPrefix(raw);
                    const key = normalizeNameNoPunct(canonical);
                    if (key) {
                        if (!map.has(key)) map.set(key, new Set<string>());
                        map.get(key)!.add(sid);
                    }
                }

                for (const v of Object.values(cur)) {
                    if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
                }
            }
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

/**
 * transientRewards.json
 * itemName -> data:transient/<objectiveName>
 */
function buildTransientRewardsItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (transientRewardsJson as any)?.transientRewards ?? (transientRewardsJson as any);
    const rows: TransientRewardsRow[] = Array.isArray(root) ? (root as TransientRewardsRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const objName = typeof row?.objectiveName === "string" ? row.objectiveName.trim() : "";
        if (!objName) continue;

        const sid = dataId(["transient", objName]);

        const stack: any[] = [];
        if (row && typeof row === "object") {
            const rewards = (row as any).rewards;
            if (rewards !== undefined) stack.push(rewards);
        }

        while (stack.length > 0) {
            const cur = stack.pop();
            if (!cur) continue;

            if (Array.isArray(cur)) {
                for (const v of cur) stack.push(v);
                continue;
            }

            if (typeof cur !== "object") continue;

            if (typeof (cur as any).itemName === "string") {
                const raw = String((cur as any).itemName);
                const canonical = stripQtyPrefix(raw);
                const key = normalizeNameNoPunct(canonical);
                if (key) {
                    if (!map.has(key)) map.set(key, new Set<string>());
                    map.get(key)!.add(sid);
                }
            }

            for (const v of Object.values(cur)) {
                if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
            }
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

/**
 * solarisBountyRewards.json
 * itemName -> data:bounty/solaris/<bountyName>
 */
function buildSolarisBountyItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (solarisBountyRewardsJson as any)?.solarisBountyRewards ?? (solarisBountyRewardsJson as any);
    const rows: SolarisBountyRow[] = Array.isArray(root) ? (root as SolarisBountyRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const bountyName =
            typeof row?.bountyName === "string"
                ? row.bountyName.trim()
                : (typeof row?.name === "string"
                    ? row.name.trim()
                    : (typeof row?.objectiveName === "string" ? row.objectiveName.trim() : ""));

        if (!bountyName) continue;

        const sid = dataId(["bounty", "solaris", bountyName]);

        // Traverse any nested rewards/reward tables
        const stack: any[] = [];
        if (row && typeof row === "object") stack.push(row);

        while (stack.length > 0) {
            const cur = stack.pop();
            if (!cur) continue;

            if (Array.isArray(cur)) {
                for (const v of cur) stack.push(v);
                continue;
            }

            if (typeof cur !== "object") continue;

            if (typeof (cur as any).itemName === "string") {
                const raw = String((cur as any).itemName);
                const canonical = stripQtyPrefix(raw);
                const key = normalizeNameNoPunct(canonical);
                if (key) {
                    if (!map.has(key)) map.set(key, new Set<string>());
                    map.get(key)!.add(sid);
                }
            }

            for (const v of Object.values(cur)) {
                if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
            }
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

/**
 * resourceByAvatar.json
 * item -> data:resource-by-avatar/<source>
 *
 * IMPORTANT:
 * We emit data:* here (not src:*) so that:
 *  - it is actionable by default in access checks
 *  - it matches the SourceIds created in sourceCatalog.ts (buildDropDataSupplementSources)
 */
function buildResourceByAvatarItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (resourceByAvatarJson as any)?.resourceByAvatar ?? (resourceByAvatarJson as any);
    const rows: ResourceByAvatarRow[] = Array.isArray(root) ? (root as ResourceByAvatarRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const source = typeof row?.source === "string" ? row.source.trim() : "";
        if (!source) continue;

        const sid = dataId(["resource-by-avatar", source]);

        const items = Array.isArray(row?.items) ? row.items : [];
        for (const it of items) {
            const itemName = typeof it?.item === "string" ? it.item.trim() : "";
            if (!itemName) continue;

            const key = normalizeNameNoPunct(itemName);
            if (!key) continue;

            if (!map.has(key)) map.set(key, new Set<string>());
            map.get(key)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

/**
 * miscItems.json
 * itemName -> data:enemy-item/<enemyName>
 *
 * IMPORTANT:
 * We emit data:* here (not src:*) so that:
 *  - it is actionable by default in access checks
 *  - it matches the SourceIds created in sourceCatalog.ts (buildDropDataSupplementSources)
 */
function buildMiscItemsItemNameToSourcesIndex(): Record<string, string[]> {
    const root = (miscItemsJson as any)?.miscItems ?? (miscItemsJson as any);
    const rows: MiscItemsRow[] = Array.isArray(root) ? (root as MiscItemsRow[]) : [];

    const map = new Map<string, Set<string>>();

    for (const row of rows) {
        const enemy = typeof row?.enemyName === "string" ? row.enemyName.trim() : "";
        if (!enemy) continue;

        const sid = dataId(["enemy-item", enemy]);

        const items = Array.isArray(row?.items) ? row.items : [];
        for (const it of items) {
            const itemName = typeof it?.itemName === "string" ? it.itemName.trim() : "";
            if (!itemName) continue;

            const key = normalizeNameNoPunct(itemName);
            if (!key) continue;

            if (!map.has(key)) map.set(key, new Set<string>());
            map.get(key)!.add(sid);
        }
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    return out;
}

// Build once (fast lookup during catalog scan)
const MISSION_REWARDS_SOURCES_BY_ITEM: Record<string, string[]> = buildMissionRewardsItemNameToSourcesIndex();
const TRANSIENT_REWARDS_SOURCES_BY_ITEM: Record<string, string[]> = buildTransientRewardsItemNameToSourcesIndex();
const SOLARIS_BOUNTY_SOURCES_BY_ITEM: Record<string, string[]> = buildSolarisBountyItemNameToSourcesIndex();
const RESOURCE_BY_AVATAR_SOURCES_BY_ITEM: Record<string, string[]> = buildResourceByAvatarItemNameToSourcesIndex();
const MISC_ITEMS_SOURCES_BY_ITEM: Record<string, string[]> = buildMiscItemsItemNameToSourcesIndex();

// Keep the import referenced so TS doesn't complain if the file is present but not used yet.
void additionalItemByAvatarJson;

export function deriveDropDataAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};

    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    const allIds = Object.keys(recordsById);

    for (const id of allIds) {
        const rec: any = recordsById[id];
        if (!rec) continue;

        const catalogId = String(id);
        const sources: string[] = [];

        // --- Relic projection items (Axi A1 Intact, etc.) ---
        if (isRelicProjectionCatalogId(catalogId)) {
            const r = sourcesForRelicProjection(rec);
            sources.push(...r.sources);
        }

        // --- Name-based joins (drop tables) ---
        const displayOrName =
            typeof rec?.displayName === "string"
                ? rec.displayName
                : (typeof rec?.name === "string" ? rec.name : "");

        const nameKey = normalizeNameNoPunct(displayOrName);

        if (nameKey) {
            const mr = MISSION_REWARDS_SOURCES_BY_ITEM[nameKey] ?? [];
            if (mr.length > 0) sources.push(...mr);

            const tr = TRANSIENT_REWARDS_SOURCES_BY_ITEM[nameKey] ?? [];
            if (tr.length > 0) sources.push(...tr);

            const sb = SOLARIS_BOUNTY_SOURCES_BY_ITEM[nameKey] ?? [];
            if (sb.length > 0) sources.push(...sb);

            const rba = RESOURCE_BY_AVATAR_SOURCES_BY_ITEM[nameKey] ?? [];
            if (rba.length > 0) sources.push(...rba);

            const mi = MISC_ITEMS_SOURCES_BY_ITEM[nameKey] ?? [];
            if (mi.length > 0) sources.push(...mi);
        }

        // --- Manual overrides (must win / always included) ---
        const manual = MANUAL_ACQUISITION_BY_CATALOG_ID[catalogId] ?? [];
        if (manual.length > 0) sources.push(...manual);

        // POLICY:
        // No deterministic fallbacks. If it didn't join and isn't manually curated, it has NO acquisition here.
        if (sources.length > 0) {
            out[catalogId] = { sources: uniqSorted(sources) };
        }
    }

    return out;
}

export type DropDataJoinDiagnostics = {
    relicProjections: {
        total: number;
        keyParsed: number;
        keyMissing: number;
        keyInMissionIndex: number;
        keyNotInMissionIndex: number;
        withSources: number;
        withoutSources: number;
        sampleMissing: Array<{
            id: string;
            name: string;
            key: string | null;
            reason: "no-key" | "key-not-in-index" | "index-has-no-sources";
        }>;
    };

    nameJoins: {
        missionRewardsKeys: number;
        transientRewardsKeys: number;
        solarisBountyKeys: number;
        resourceByAvatarKeys: number;
        miscItemsKeys: number;
        sampleMissionRewardsKeys: string[];
        sampleTransientRewardsKeys: string[];
        sampleSolarisBountyKeys: string[];
        sampleResourceByAvatarKeys: string[];
        sampleMiscItemsKeys: string[];
    };
};

export function deriveDropDataJoinDiagnostics(): DropDataJoinDiagnostics {
    let total = 0;
    let keyParsed = 0;
    let keyMissing = 0;

    let keyInMissionIndex = 0;
    let keyNotInMissionIndex = 0;

    let withSources = 0;
    let withoutSources = 0;

    const sampleMissing: DropDataJoinDiagnostics["relicProjections"]["sampleMissing"] = [];

    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    const allIds = Object.keys(recordsById);

    for (const id of allIds) {
        const rec: any = recordsById[id];
        if (!rec) continue;

        const catalogId = String(id);
        if (!isRelicProjectionCatalogId(catalogId)) continue;

        total += 1;

        const name =
            typeof rec?.displayName === "string"
                ? rec.displayName
                : (typeof rec?.name === "string" ? rec.name : "");

        const key = relicKeyFromDisplayName(name);

        if (!key) {
            keyMissing += 1;
            if (sampleMissing.length < 50) sampleMissing.push({ id: catalogId, name, key: null, reason: "no-key" });
            continue;
        }

        keyParsed += 1;

        const normKey = normalizeName(key);
        const inIndex = Object.prototype.hasOwnProperty.call(RELIC_NODE_SOURCES_BY_KEY, normKey);

        if (!inIndex) {
            keyNotInMissionIndex += 1;
            if (sampleMissing.length < 50) sampleMissing.push({ id: catalogId, name, key, reason: "key-not-in-index" });
            continue;
        }

        keyInMissionIndex += 1;

        const sources = RELIC_NODE_SOURCES_BY_KEY[normKey] ?? [];
        if (sources.length > 0) withSources += 1;
        else {
            withoutSources += 1;
            if (sampleMissing.length < 50) sampleMissing.push({ id: catalogId, name, key, reason: "index-has-no-sources" });
        }
    }

    const mrKeys = Object.keys(MISSION_REWARDS_SOURCES_BY_ITEM);
    const trKeys = Object.keys(TRANSIENT_REWARDS_SOURCES_BY_ITEM);
    const sbKeys = Object.keys(SOLARIS_BOUNTY_SOURCES_BY_ITEM);
    const rbaKeys = Object.keys(RESOURCE_BY_AVATAR_SOURCES_BY_ITEM);
    const miKeys = Object.keys(MISC_ITEMS_SOURCES_BY_ITEM);

    return {
        relicProjections: {
            total,
            keyParsed,
            keyMissing,
            keyInMissionIndex,
            keyNotInMissionIndex,
            withSources,
            withoutSources,
            sampleMissing
        },
        nameJoins: {
            missionRewardsKeys: mrKeys.length,
            transientRewardsKeys: trKeys.length,
            solarisBountyKeys: sbKeys.length,
            resourceByAvatarKeys: rbaKeys.length,
            miscItemsKeys: miKeys.length,
            sampleMissionRewardsKeys: mrKeys.slice(0, 25),
            sampleTransientRewardsKeys: trKeys.slice(0, 25),
            sampleSolarisBountyKeys: sbKeys.slice(0, 25),
            sampleResourceByAvatarKeys: rbaKeys.slice(0, 25),
            sampleMiscItemsKeys: miKeys.slice(0, 25)
        }
    };
}

