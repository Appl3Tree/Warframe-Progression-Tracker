// Syndicate catalog data — canonical types, tab definitions, and the full
// CANONICAL_SYNDICATES registry.  Extracted from SyndicatesGrid.tsx as part
// of Phase 5 file decomposition.

import { SY } from "../../domain/ids/syndicateIds";

// Icon map — populated at startup from src/assets/syndicates/
const _iconModules = import.meta.glob<string>(
    "../../assets/syndicates/*.png",
    { eager: true, import: "default" }
);
export const ICON_BY_FILENAME: Record<string, string> = {};
for (const [path, url] of Object.entries(_iconModules)) {
    const filename = path.split("/").pop()!;
    ICON_BY_FILENAME[filename] = url;
}

export type TabKey =
    | "all"
    | "primary"
    | "cetus"
    | "fortuna"
    | "necralisk"
    | "chrysalith"
    | "1999"
    | "misc"
    | "other";

export type ProgressionModel = "standing" | "nightwave" | "no-standing" | "event-standing";

export type Relationship = {
    allied?: string[];
    opposed?: string[];
    enemy?: string[];
};

export type CanonicalSyndicate = {
    id: string;
    name: string;
    tab: Exclude<TabKey, "all">;
    model: ProgressionModel;
    detail: string;

    iconFile?: string;

    bg: string;
    fg: string;

    relationship?: Relationship;
    isFaction?: boolean;
    /** Maximum achievable rank. Defaults to 5 if not set. */
    maxRank?: number;
};

export const TABS: Array<{ key: TabKey; label: string }> = [
    { key: "all", label: "All" },
    { key: "primary", label: "Primary" },
    { key: "cetus", label: "Cetus" },
    { key: "fortuna", label: "Fortuna" },
    { key: "necralisk", label: "Necralisk" },
    { key: "chrysalith", label: "Chrysalith" },
    { key: "1999", label: "1999" },
    { key: "misc", label: "Miscellaneous" },
    { key: "other", label: "Other" }
];

export const CANONICAL_SYNDICATES: CanonicalSyndicate[] = [
    // Primary (Relay faction syndicates)
    {
        id: SY.STEEL_MERIDIAN,
        name: "Steel Meridian",
        tab: "primary",
        model: "standing",
        detail: "Fighters and refugees protecting the colonists of the Origin System. Allied with Red Veil.",
        iconFile: "120px-SteelIconPink.png",
        bg: "#2C3F46",
        fg: "#f9bc93",
        isFaction: true,
        relationship: {
            allied: [SY.RED_VEIL],
            opposed: [SY.NEW_LOKA],
            enemy: [SY.THE_PERRIN_SEQUENCE]
        }
    },
    {
        id: SY.ARBITERS_OF_HEXIS,
        name: "Arbiters of Hexis",
        tab: "primary",
        model: "standing",
        detail: "Scholars dedicated to pushing the Tenno beyond their limits and unlocking their true potential.",
        iconFile: "120px-ArbitarIconGrey.png",
        bg: "#374045",
        fg: "#cfe1e4",
        isFaction: true,
        relationship: {
            allied: [SY.CEPHALON_SUDA],
            opposed: [SY.THE_PERRIN_SEQUENCE],
            enemy: [SY.RED_VEIL]
        }
    },
    {
        id: SY.CEPHALON_SUDA,
        name: "Cephalon Suda",
        tab: "primary",
        model: "standing",
        detail: "A Cephalon obsessed with gathering and preserving all knowledge across the Origin System.",
        iconFile: "120px-CephalonIconLightGold.png",
        bg: "#3D375D",
        fg: "#fbfed0",
        isFaction: true,
        relationship: {
            allied: [SY.ARBITERS_OF_HEXIS],
            opposed: [SY.RED_VEIL],
            enemy: [SY.NEW_LOKA]
        }
    },
    {
        id: SY.THE_PERRIN_SEQUENCE,
        name: "The Perrin Sequence",
        tab: "primary",
        model: "standing",
        detail: "Corpus-affiliated merchants who believe trade and commerce will shape the future of humanity.",
        iconFile: "120px-PerrinSequenceIconBlue.png",
        bg: "#3D4963",
        fg: "#92dbff",
        isFaction: true,
        relationship: {
            allied: [SY.NEW_LOKA],
            opposed: [SY.ARBITERS_OF_HEXIS],
            enemy: [SY.STEEL_MERIDIAN]
        }
    },
    {
        id: SY.RED_VEIL,
        name: "Red Veil",
        tab: "primary",
        model: "standing",
        detail: "Radical purifiers who seek to cleanse the Origin System of Orokin corruption by any means necessary.",
        iconFile: "120px-RedVeilIconLightRed.png",
        bg: "#3D1839",
        fg: "#fe8a88",
        isFaction: true,
        relationship: {
            allied: [SY.STEEL_MERIDIAN],
            opposed: [SY.CEPHALON_SUDA],
            enemy: [SY.ARBITERS_OF_HEXIS]
        }
    },
    {
        id: SY.NEW_LOKA,
        name: "New Loka",
        tab: "primary",
        model: "standing",
        detail: "Naturalists devoted to restoring humanity to its pure, pre-Orokin state, free of all augmentation.",
        iconFile: "120px-LokaIconGreen.png",
        bg: "#2A3C2E",
        fg: "#c2ffbf",
        isFaction: true,
        relationship: {
            allied: [SY.THE_PERRIN_SEQUENCE],
            opposed: [SY.STEEL_MERIDIAN],
            enemy: [SY.CEPHALON_SUDA]
        }
    },

    // Cetus
    {
        id: SY.OSTRON,
        name: "Ostron",
        tab: "cetus",
        model: "standing",
        detail: "The people of Cetus, a trading post on the Plains of Eidolon. Fish, hunt, and complete bounties to earn standing.",
        iconFile: "120px-OstronSigil.png",
        bg: "#B74624",
        fg: "#e8ddaf"
    },
    {
        id: SY.THE_QUILLS,
        name: "The Quills",
        tab: "cetus",
        model: "standing",
        detail: "Mysterious servants of the Unum who deal in Eidolon Shards and Amp crafting components.",
        iconFile: "120px-TheQuillsSigil.png",
        bg: "#F7FACB",
        fg: "#b43419"
    },

    // Fortuna
    {
        id: SY.SOLARIS_UNITED,
        name: "Solaris United",
        tab: "fortuna",
        model: "standing",
        detail: "Debt-enslaved workers of Fortuna on Venus, fighting for freedom. Earn standing through bounties and conservation.",
        iconFile: "120px-SolarisUnited1.png",
        bg: "#5F3C0D",
        fg: "#e8ddaf"
    },
    {
        id: SY.VOX_SOLARIS,
        name: "Vox Solaris",
        tab: "fortuna",
        model: "standing",
        detail: "The secret inner circle of Solaris United. Unlocks access to Operator Amps and Arcanes from Little Duck.",
        iconFile: "120px-VoxSolarisIcon.png",
        bg: "#F2E5A7",
        fg: "#4A2B18"
    },
    {
        id: SY.VENTKIDS,
        name: "Ventkids",
        tab: "fortuna",
        model: "standing",
        detail: "Grind-obsessed youth who rule the Orb Vallis vents. Earn standing through K-Drive tricks and races.",
        iconFile: "120px-VentkidsIcon.png",
        bg: "#B97EF9",
        fg: "#FFF58F"
    },

    // Necralisk
    {
        id: SY.ENTRATI,
        name: "Entrati",
        tab: "necralisk",
        model: "standing",
        detail: "The Orokin family who built the Necralisk on Deimos. Earn standing through conservation, mining, and bounties.",
        iconFile: "120px-EntratiIcon.png",
        bg: "#4E5360",
        fg: "#FFC12F"
    },
    {
        id: SY.CAVIA,
        name: "Cavia",
        tab: "necralisk",
        model: "standing",
        detail: "Former Entrati test subjects exploring the Undercroft beneath Deimos. Associated with Duviri content.",
        iconFile: "120px-Cavia_Syndicate_Logo_1.png",
        bg: "#282624",
        fg: "#A5A394"
    },
    {
        id: SY.NECRALOID,
        name: "Necraloid",
        tab: "necralisk",
        model: "standing",
        detail: "Loid and Otak, the Necralisk’s keepers. Earn standing with Orokin Matrices to unlock Necramech parts and mods.",
        iconFile: "120px-NecraloidIcon.png",
        bg: "#333334",
        fg: "#BA9E5E",
        maxRank: 3
    },

    // Chrysalith
    {
        id: SY.THE_HOLDFASTS,
        name: "The Holdfasts",
        tab: "chrysalith",
        model: "standing",
        detail: "Void-touched survivors sheltering aboard the Zariman Ten Zero. Earn standing through Zariman bounties and activities.",
        iconFile: "120px-TheHoldfastsIcon.png",
        bg: "#21242e",
        fg: "#a9b5cc"
    },

    // 1999
    {
        id: SY.THE_HEX,
        name: "The Hex",
        tab: "1999",
        model: "standing",
        detail: "A crew of six navigating war-torn Höllvania in 1999. Earn standing through missions and activities in that era.",
        iconFile: "120px-HexIcon.png",
        bg: "#556033",
        fg: "#171b0e"
    },

    // Miscellaneous
    {
        id: SY.CONCLAVE,
        name: "Conclave",
        tab: "misc",
        model: "standing",
        detail: "PvP arena syndicate run by the Teshin. Earn standing through player-versus-player combat in the Conclave.",
        iconFile: "120px-ConclaveSigil.png",
        bg: "#000000",
        fg: "#ffffff"
    },
    {
        id: SY.CEPHALON_SIMARIS,
        name: "Cephalon Simaris",
        tab: "misc",
        model: "standing",
        detail: "The Synthesis Cephalon located in every Relay. Earn standing by scanning targets in the wild using a Synthesis Scanner.",
        iconFile: "120px-Simaris_Sigil_gold.png",
        bg: "#5F3C0D",
        fg: "#ebd18f"
    },

    // Other
    {
        id: SY.KAHLS_GARRISON,
        name: "Kahl’s Garrison",
        tab: "other",
        model: "no-standing",
        detail: "Kahl-175’s hideout. Complete weekly Break Narmer missions to earn Stock and unlock cosmetics and upgrades.",
        iconFile: "120px-GarrisonIcon.png",
        bg: "#0a2a1b",
        fg: "#a16042"
    },
    {
        id: SY.OPERATIONAL_SUPPLY,
        name: "Operational Supply",
        tab: "other",
        model: "event-standing",
        detail: "Limited-time event syndicate run by Operational Supply. Standing is earned during active operations only.",
        iconFile: "120px-OperationSyndicateSigil.png",
        bg: "#6A5574",
        fg: "#ffffff"
    },
    {
        id: SY.NIGHTWAVE,
        name: "Nightwave",
        tab: "other",
        model: "nightwave",
        detail: "Nora Night’s radio syndicate. Complete Acts to earn Standing and rank up for Nora’s Creds and exclusive rewards.",
        iconFile: "120px-NightwaveSyndicate.png",
        bg: "#6C1822",
        fg: "#F4ABAB",
        // 30 normal ranks + 150 prestige ranks
        maxRank: 180
    },
    {
        id: SY.NIGHTCAP,
        name: "Nightcap",
        tab: "other",
        model: "no-standing",
        detail: "A Solaris hidden in Fortuna's secret Airlock. Rank up by analyzing mushrooms found in the Deepmines — no daily Standing cap.",
        bg: "#1f2430",
        fg: "#cbd5e1"
    }
];

// Bundler-managed icon map. Vite resolves and fingerprints each file at build
// time, so URLs survive any deploy base-path configuration automatically.

export function syndicateIconUrl(iconFile?: string): string | null {
    if (!iconFile) return null;
    return ICON_BY_FILENAME[iconFile] ?? null;
}
