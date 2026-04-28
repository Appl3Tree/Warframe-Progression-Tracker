// ===== FILE: src/catalog/prereqs/prereqRegistry.ts =====
//
// Prerequisite definitions for all tracked progression gates.
// Updated: 2026-03 — covers all content through The Old Peace.
//
// Design rules:
// - Entries represent gates a player must pass through on the path to endgame.
// - showInPlanner: false = tracked on Prerequisites page, excluded from planner.
// - Mastery Rank modeled only as `conditions`, never as a registry row.

import type { PrereqId } from "../../domain/ids/prereqIds";
import { PR } from "../../domain/ids/prereqIds";
import { SY, getSyndicateDisplayName } from "../../domain/ids/syndicateIds";

export type PrereqCategory =
    | "Quests"
    | "SideQuests"
    | "Hubs"
    | "Systems"
    | "Segments"
    | "Necramech"
    | "Railjack"
    | "Syndicates";

export type PrereqCondition =
    | { type: "mastery_rank"; value: number }
    | { type: "quest_complete"; prereqId: PrereqId }
    | { type: "junction_complete"; junctionId: string }
    | { type: "node_complete"; nodeId: string }
    | { type: "planet_unlock"; planetId: string }
    | { type: "syndicate_rank"; syndicateId: string; rank: number }
    | { type: "item_owned"; catalogId: string }
    | { type: "resource_owned"; catalogId: string; quantity: number };

export function describePrereqCondition(cond: PrereqCondition, prereqLabelFor?: (id: string) => string): string {
    switch (cond.type) {
        case "mastery_rank":      return `Mastery Rank ${cond.value} required`;
        case "quest_complete": {
            const label = prereqLabelFor ? prereqLabelFor(cond.prereqId) : null;
            return label ? `Quest complete: ${label}` : `Quest complete: ${cond.prereqId}`;
        }
        case "junction_complete": return `Junction complete: ${cond.junctionId}`;
        case "node_complete":     return `Node complete: ${cond.nodeId}`;
        case "planet_unlock":     return `Planet unlocked: ${cond.planetId}`;
        case "syndicate_rank":    return `${getSyndicateDisplayName(cond.syndicateId)} Rank ${cond.rank} required`;
        case "item_owned":        return `Item owned: ${cond.catalogId}`;
        case "resource_owned":    return `${cond.quantity}× ${cond.catalogId} required`;
    }
}

export interface PrereqDef {
    id: PrereqId;
    label: string;
    category: PrereqCategory;
    description: string;
    prerequisites: PrereqId[];
    conditions?: PrereqCondition[];
    showInPlanner?: boolean;
    partOf?: string;
    chapterIndex?: number;
    validatedBySyndicate?: {
        syndicateId: string;
        rank: number;
    };
    validatedByAnySyndicate?: {
        syndicateIds: string[];
        rank: number;
    };
    validatedByMasteryRank?: number;
}

export const PREREQ_REGISTRY: PrereqDef[] = [

    // =========================================================================
    // MAIN STORY QUESTS — Arc 1
    // =========================================================================
    {
        id: PR.VORS_PRIZE,
        label: "Vor's Prize",
        category: "Quests",
        description: "Forced tutorial quest. Opens the star chart and installs base Orbiter segments.",
        prerequisites: []
    },
    {
        id: PR.THE_TEACHER,
        showInPlanner: false,
        label: "The Teacher",
        category: "Quests",
        description: "Post-Vor's Prize mod tutorial quest guided by Teshin. Tracked for quest reward availability.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.ONCE_AWAKE,
        label: "Once Awake",
        category: "Quests",
        description: "Early Infested main-story quest in Arc 1. The wiki chronology places it before Heart of Deimos and The Archwing.",
        prerequisites: [PR.JUNCTION_MERCURY_VENUS]
    },
    {
        id: PR.ARCHWING,
        label: "The Archwing",
        category: "Quests",
        description: "Unlocks Archwing gear and Empyrean access. Requires the Earth → Mars Junction.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.NATAH,
        label: "Natah",
        category: "Quests",
        description: "Gatekeeper to The Second Dream. The quest page requires Uranus Junction, and its chronology lists The Archwing as the previous quest.",
        prerequisites: [PR.ARCHWING, PR.JUNCTION_SATURN_URANUS]
    },

    // =========================================================================
    // MAIN STORY QUESTS — Arc 2
    // =========================================================================
    {
        id: PR.SECOND_DREAM,
        label: "The Second Dream",
        category: "Quests",
        description: "Unlocks Operator mode and the Focus system. Required for the War Within chain and Lua junction.",
        prerequisites: [PR.NATAH, PR.JUNCTION_URANUS_NEPTUNE]
    },
    {
        id: PR.WAR_WITHIN,
        label: "The War Within",
        category: "Quests",
        description: "Expands Operator to full Transference. Unlocks Kuva Fortress, Sorties, Rising Tide, and the full Focus tree. Required for the main arc chain.",
        prerequisites: [PR.SECOND_DREAM, PR.JUNCTION_NEPTUNE_PLUTO],
        conditions: [{ type: "mastery_rank", value: 5 }]
    },
    {
        id: PR.CHAINS_HARROW,
        label: "Chains of Harrow",
        category: "Quests",
        description: "Required for Apostasy Prologue.",
        prerequisites: [PR.AMP_MOTE]
    },
    {
        id: PR.APOSTASY,
        label: "Apostasy Prologue",
        category: "Quests",
        description: "Requires Personal Quarters segment. Required for The Sacrifice.",
        prerequisites: [PR.CHAINS_HARROW, PR.SEGMENT_PERSONAL_QUARTERS]
    },
    {
        id: PR.SACRIFICE,
        label: "The Sacrifice",
        category: "Quests",
        description: "Awards Excalibur Umbra. Required for Chimera Prologue.",
        prerequisites: [PR.APOSTASY]
    },

    // =========================================================================
    // MAIN STORY QUESTS — Arc 3 (Prelude to War + The New War)
    // =========================================================================
    {
        id: PR.CHIMERA_PROLOGUE,
        label: "Chimera Prologue",
        category: "Quests",
        description: "Chapter 1 of Prelude to War. Adds Ropalolyst assassination node to Jupiter. Required for Erra.",
        prerequisites: [PR.SACRIFICE],
        partOf: "Prelude to War",
        chapterIndex: 1
    },
    {
        id: PR.ERRA,
        label: "Erra",
        category: "Quests",
        description: "Chapter 2 of Prelude to War. Required for The Maker.",
        prerequisites: [PR.CHIMERA_PROLOGUE],
        partOf: "Prelude to War",
        chapterIndex: 2
    },
    {
        id: PR.PRELUDE_TO_WAR,
        label: "Prelude to War — The Maker",
        category: "Quests",
        description: "Chapter 3 of Prelude to War. Required for The New War.",
        prerequisites: [PR.ERRA],
        partOf: "Prelude to War",
        chapterIndex: 3
    },
    {
        id: PR.NEW_WAR,
        label: "The New War",
        category: "Quests",
        description: "Major story milestone. Requires Prelude to War, an owned Railjack, and an Amp. Unlocks Angels of the Zariman, Veilbreaker, and the full endgame.",
        prerequisites: [PR.PRELUDE_TO_WAR, PR.RAILJACK_CONSTRUCTED, PR.AMP_MOTE]
    },

    // =========================================================================
    // MAIN STORY QUESTS — Arc 4 (Duviri / Zariman / 1999)
    // =========================================================================
    {
        id: PR.DUVIRI_PARADOX,
        label: "The Duviri Paradox",
        category: "Quests",
        description: "Unlocks The Circuit and Drifter Intrinsics. Required for The Hex.",
        prerequisites: [PR.JUNCTION_SATURN_URANUS]
    },
    {
        id: PR.ANGELS_ZARIMAN,
        label: "Angels of the Zariman",
        category: "Quests",
        description: "Unlocks Zariman hub and Holdfasts syndicate. Required for Whispers in the Walls.",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.WHISPERS_WALL,
        label: "Whispers in the Walls",
        category: "Quests",
        description: "Unlocks Sanctum Anatomica and Cavia syndicate. Required for The Lotus Eaters and Melee Upgrade segment.",
        prerequisites: [PR.NEW_WAR, PR.HEART_OF_DEIMOS]
    },
    {
        id: PR.THE_LOTUS_EATERS,
        label: "The Lotus Eaters",
        category: "Quests",
        description: "Prologue to The Hex. Required for The Hex and The Old Peace.",
        prerequisites: [PR.WHISPERS_WALL]
    },
    {
        id: PR.THE_HEX,
        label: "The Hex",
        category: "Quests",
        description: "Unlocks Höllvania / 1999 hub. Requires both The Lotus Eaters and The Duviri Paradox.",
        prerequisites: [PR.THE_LOTUS_EATERS, PR.DUVIRI_PARADOX]
    },
    {
        id: PR.THE_OLD_PEACE,
        label: "The Old Peace",
        category: "Quests",
        description: "Continues the 1999 arc. Requires The Lotus Eaters.",
        prerequisites: [PR.THE_LOTUS_EATERS]
    },
    {
        id: PR.JADE_SHADOWS,
        label: "Jade Shadows",
        category: "Quests",
        description: "Awards Jade Warframe blueprint. Requires The New War.",
        prerequisites: [PR.NEW_WAR],
        showInPlanner: false
    },

    // =========================================================================
    // SIDE QUESTS — Feature Gates
    // =========================================================================
    {
        id: PR.HOWL_KUBROW,
        label: "Howl of the Kubrow",
        category: "SideQuests",
        description: "Unlocks Kubrow incubation and breeding. Awards the Incubator Segment after the first early junction path.",
        prerequisites: [PR.JUNCTION_MERCURY_VENUS]
    },
    {
        id: PR.STOLEN_DREAMS,
        label: "Stolen Dreams",
        category: "SideQuests",
        description: "Side quest starring Maroo. Requires the Phobos Junction and unlocks the weekly Ayatan Treasure Hunt.",
        prerequisites: [PR.JUNCTION_MARS_PHOBOS]
    },
    {
        id: PR.SAYA_VIGIL,
        label: "Saya's Vigil",
        category: "SideQuests",
        description: "Unlocks Gara blueprint. Available in Cetus. Tracked for quest completion.",
        prerequisites: [PR.HUB_CETUS]
    },
    {
        id: PR.VOX_SOLARIS,
        label: "Vox Solaris",
        category: "SideQuests",
        description: "Unlocks Solaris United bounty progression and Ventkids access in Fortuna / Orb Vallis.",
        prerequisites: [PR.HUB_FORTUNA]
    },
    {
        id: PR.HEART_OF_DEIMOS,
        label: "Heart of Deimos",
        category: "SideQuests",
        description: "Unlocks Necralisk, Cambion Drift, and Entrati syndicate. Required for Whispers in the Walls and Necramech system.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.RISING_TIDE,
        label: "Rising Tide",
        category: "SideQuests",
        description: "Constructs the Railjack. Required for The New War and Call of the Tempestarii.",
        prerequisites: [PR.WAR_WITHIN]
    },
    {
        id: PR.VEILBREAKER,
        label: "Veilbreaker",
        category: "SideQuests",
        description: "Unlocks Kahl's Garrison and Archon Hunts. Required for Helminth Archon Shard segment.",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.CALL_TEMPESTARII,
        label: "Call of the Tempestarii",
        category: "SideQuests",
        description: "Unlocks Sisters of Parvos and Corpus Proxima Railjack nodes. Requires a completed Railjack, The Deadlock Protocol, and MR4.",
        prerequisites: [PR.RAILJACK_CONSTRUCTED, PR.DEADLOCK_PROTOCOL],
        conditions: [{ type: "mastery_rank", value: 4 }]
    },
    {
        id: PR.DEADLOCK_PROTOCOL,
        label: "The Deadlock Protocol",
        category: "SideQuests",
        description: "Awards Protea blueprint. Required for Sisters of Parvos eligibility. Requires Saturn Junction completion and MR4.",
        prerequisites: [PR.JUNCTION_EUROPA_SATURN],
        conditions: [{ type: "mastery_rank", value: 4 }]
    },
    {
        id: PR.NEW_STRANGE,
        label: "The New Strange",
        category: "SideQuests",
        description: "Side quest for Cephalon Simaris and Chroma progression. Requires Stolen Dreams and the Jupiter → Europa Junction.",
        prerequisites: [PR.STOLEN_DREAMS, PR.JUNCTION_JUPITER_EUROPA]
    },

    // =========================================================================
    // SIDE QUESTS — Warframe Blueprint Quests (tracked, not planning blockers)
    // =========================================================================
    {
        id: PR.LIMBO_THEOREM,
        label: "The Limbo Theorem",
        category: "SideQuests",
        description: "Awards Limbo blueprint. Requires an Archwing and the Jupiter → Europa junction.",
        prerequisites: [PR.ARCHWING, PR.JUNCTION_JUPITER_EUROPA]
    },
    {
        id: PR.SILVER_GROVE,
        label: "The Silver Grove",
        category: "SideQuests",
        description: "Awards Titania blueprint. Requires The Second Dream and MR7.",
        prerequisites: [PR.SECOND_DREAM],
        conditions: [{ type: "mastery_rank", value: 7 }]
    },
    {
        id: PR.SANDS_INAROS,
        label: "Sands of Inaros",
        category: "SideQuests",
        description: "Awards Inaros blueprint. Quest beacon purchased from Baro Ki'Teer. Requires MR5.",
        prerequisites: [PR.HUB_RELAY],
        conditions: [{ type: "mastery_rank", value: 5 }]
    },
    {
        id: PR.OCTAVIA_ANTHEM,
        label: "Octavia's Anthem",
        category: "SideQuests",
        description: "Awards Octavia blueprint. Requires The Second Dream.",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.JORDAS_PRECEPT,
        label: "The Jordas Precept",
        category: "SideQuests",
        description: "Awards Atlas blueprint. Requires Pluto → Eris junction completion.",
        prerequisites: [PR.JUNCTION_SEDNA_ERIS]
    },
    {
        id: PR.GLAST_GAMBIT,
        label: "The Glast Gambit",
        category: "SideQuests",
        description: "Awards Nidus blueprint. Requires The War Within and speaking to Ergo Glast in a Relay.",
        prerequisites: [PR.WAR_WITHIN, PR.HUB_RELAY]
    },
    {
        id: PR.MASK_REVENANT,
        label: "Mask of the Revenant",
        category: "SideQuests",
        description: "Awards Revenant blueprint. Start from Nakak in Cetus after reaching Observer with The Quills.",
        prerequisites: [PR.HUB_CETUS, PR.SYNDICATE_QUILLS_RANK2]
    },
    {
        id: PR.HIDDEN_MESSAGES,
        label: "Hidden Messages",
        category: "SideQuests",
        description: "Awards Mirage blueprint. Requires Sedna access (missions on Mars, Saturn, and Sedna).",
        prerequisites: [PR.JUNCTION_PLUTO_SEDNA]
    },
    {
        id: PR.WAVERIDER,
        label: "The Waverider",
        category: "SideQuests",
        description: "Awards Yareli blueprint. Requires completed Vox Solaris and MR3.",
        prerequisites: [PR.VOX_SOLARIS],
        conditions: [{ type: "mastery_rank", value: 3 }]
    },
    {
        id: PR.PATIENT_ZERO,
        label: "Patient Zero",
        category: "SideQuests",
        description: "Awards Mesa blueprint. Requires Once Awake and Eris access.",
        prerequisites: [PR.ONCE_AWAKE, PR.JUNCTION_SEDNA_ERIS]
    },

    // =========================================================================
    // STAR CHART JUNCTIONS
    // =========================================================================
    {
        id: PR.JUNCTION_MERCURY_VENUS,
        label: "Junction: Mercury → Venus",
        category: "Systems",
        description: "Unlocks Venus and early Corpus content.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.JUNCTION_VENUS_EARTH,
        label: "Junction: Venus → Earth",
        category: "Systems",
        description: "Unlocks Earth. Required for The Archwing quest.",
        prerequisites: [PR.JUNCTION_MERCURY_VENUS]
    },
    {
        id: PR.JUNCTION_EARTH_MARS,
        label: "Junction: Earth → Mars",
        category: "Systems",
        description: "Unlocks Mars. Required for Stolen Dreams and the Heart of Deimos path.",
        prerequisites: [PR.VORS_PRIZE, PR.JUNCTION_VENUS_EARTH]
    },
    {
        id: PR.JUNCTION_MARS_PHOBOS,
        showInPlanner: false,
        label: "Junction: Mars → Phobos",
        category: "Systems",
        description: "Unlocks Phobos. Alternate path to Ceres; tracked for star chart completion.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.JUNCTION_MARS_CERES,
        label: "Junction: Mars → Ceres",
        category: "Systems",
        description: "Unlocks Ceres. Required for The New Strange, Deadlock Protocol, and the Ceres → Jupiter junction.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.JUNCTION_MARS_DEIMOS,
        label: "Junction: Mars → Deimos",
        category: "Systems",
        description: "Unlocks Deimos. Required for Heart of Deimos.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.JUNCTION_PHOBOS_CERES,
        showInPlanner: false,
        label: "Junction: Phobos → Ceres",
        category: "Systems",
        description: "Alternate Ceres path via Phobos. Tracked for star chart completion.",
        prerequisites: [PR.JUNCTION_MARS_PHOBOS]
    },
    {
        id: PR.JUNCTION_CERES_JUPITER,
        label: "Junction: Ceres → Jupiter",
        category: "Systems",
        description: "Unlocks Jupiter. Required for Deadlock Protocol and the mid-game chain.",
        prerequisites: [PR.JUNCTION_MARS_CERES]
    },
    {
        id: PR.JUNCTION_JUPITER_EUROPA,
        label: "Junction: Jupiter → Europa",
        category: "Systems",
        description: "Unlocks Europa.",
        prerequisites: [PR.JUNCTION_CERES_JUPITER]
    },
    {
        id: PR.JUNCTION_EUROPA_SATURN,
        label: "Junction: Europa → Saturn",
        category: "Systems",
        description: "Unlocks Saturn. Requires Archwing.",
        prerequisites: [PR.JUNCTION_JUPITER_EUROPA, PR.ARCHWING]
    },
    {
        id: PR.JUNCTION_SATURN_URANUS,
        label: "Junction: Saturn → Uranus",
        category: "Systems",
        description: "Unlocks Uranus. Required for The Duviri Paradox.",
        prerequisites: [PR.JUNCTION_EUROPA_SATURN]
    },
    {
        id: PR.JUNCTION_URANUS_NEPTUNE,
        label: "Junction: Uranus → Neptune",
        category: "Systems",
        description: "Unlocks Neptune.",
        prerequisites: [PR.JUNCTION_SATURN_URANUS]
    },
    {
        id: PR.JUNCTION_NEPTUNE_PLUTO,
        label: "Junction: Neptune → Pluto",
        category: "Systems",
        description: "Unlocks Pluto. Required for Natah.",
        prerequisites: [PR.JUNCTION_URANUS_NEPTUNE]
    },
    {
        id: PR.JUNCTION_PLUTO_SEDNA,
        label: "Junction: Pluto → Sedna",
        category: "Systems",
        description: "Unlocks Sedna. Junction tasks include completing The War Within.",
        prerequisites: [PR.JUNCTION_NEPTUNE_PLUTO, PR.WAR_WITHIN]
    },
    {
        id: PR.JUNCTION_SEDNA_ERIS,
        label: "Junction: Sedna → Eris",
        category: "Systems",
        description: "Unlocks Eris and Infested content. Junction tasks include Rising Tide and a Railjack mission (Sover Strait).",
        prerequisites: [PR.JUNCTION_PLUTO_SEDNA, PR.RAILJACK_CONSTRUCTED]
    },
    {
        id: PR.JUNCTION_EARTH_LUA,
        label: "Junction: Earth → Lua",
        category: "Systems",
        description: "Unlocks Lua. Available after The Second Dream. Required for Octavia's Anthem.",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.JUNCTION_ERIS_KUVA_FORTRESS,
        label: "Junction: Eris → Kuva Fortress",
        category: "Systems",
        description: "Unlocks Kuva Fortress missions. Required for Kuva Lich system.",
        prerequisites: [PR.JUNCTION_SEDNA_ERIS, PR.WAR_WITHIN]
    },

    // =========================================================================
    // OPEN WORLD HUBS
    // =========================================================================
    {
        id: PR.HUB_RELAY,
        label: "Any Relay Access",
        category: "Hubs",
        description: "You can visit a Relay. Required for The Silver Grove and Sands of Inaros.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.HUB_CETUS,
        label: "Cetus (Plains of Eidolon) Access",
        category: "Hubs",
        description: "You can enter Cetus and the Plains of Eidolon. Requires completing The Teacher. Required for Saya's Vigil, The Quills, and Mask of the Revenant.",
        prerequisites: [PR.THE_TEACHER]
    },
    {
        id: PR.HUB_FORTUNA,
        label: "Fortuna (Orb Vallis) Access",
        category: "Hubs",
        description: "You can enter Fortuna and Orb Vallis. Required for Solaris United standing progression.",
        prerequisites: [PR.JUNCTION_MERCURY_VENUS]
    },
    {
        id: PR.HUB_NECRALISK,
        label: "Necralisk (Deimos) Access",
        category: "Hubs",
        description: "You can enter the Necralisk. Required for Entrati syndicate, Necraloid, and the Helminth segment.",
        prerequisites: [PR.HEART_OF_DEIMOS]
    },
    {
        id: PR.HUB_ZARIMAN,
        label: "Zariman (Chrysalith) Access",
        category: "Hubs",
        description: "You can enter the Chrysalith. Required for Holdfasts syndicate and Zariman mission types.",
        prerequisites: [PR.ANGELS_ZARIMAN]
    },
    {
        id: PR.HUB_SANCTUM,
        label: "Sanctum Anatomica Access",
        category: "Hubs",
        description: "You can enter Sanctum Anatomica. Required for Cavia syndicate standing and Netracell access.",
        prerequisites: [PR.WHISPERS_WALL, PR.HUB_NECRALISK]
    },
    {
        id: PR.HUB_HOLLVANIA,
        label: "Höllvania Central Mall Access",
        category: "Hubs",
        description: "You can enter Höllvania. Required for 1999 vendors, The Hex faction standing, and hub missions.",
        prerequisites: [PR.THE_HEX]
    },
    {
        id: PR.HUB_DRIFTERS_CAMP,
        label: "Drifter's Camp Access",
        category: "Hubs",
        description: "Access to Kahl's Garrison weekly missions in the Drifter's Camp.",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.CLAN_DOJO,
        label: "Clan Dojo Access",
        category: "Systems",
        description: "Join or create a Clan and access its Dojo. Required for dojo research, blueprint replication, and clan-only amenities.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.ACTIVITY_STEEL_PATH,
        label: "The Steel Path Unlocked",
        category: "Systems",
        description: "Speak to Teshin in a Relay after completing all nodes accessible prior to The New War on the connected Star Chart. This is auto-derived from tracked normal-mode node completion, excluding Mutalist Alad V, Jordas Golem, and Brutus exactly as listed on the wiki.",
        prerequisites: [PR.HUB_RELAY]
    },
    {
        id: PR.ACTIVITY_STEEL_PATH_HONORS,
        label: "Teshin's Steel Path Honors",
        category: "Systems",
        description: "Access Teshin's Steel Path Honors shop in any Relay after unlocking The Steel Path.",
        prerequisites: [PR.ACTIVITY_STEEL_PATH, PR.HUB_RELAY]
    },
    {
        id: PR.ACTIVITY_CIRCUIT_STEEL_PATH,
        label: "The Steel Path Circuit",
        category: "Systems",
        description: "Unlock the Steel Path version of The Circuit. Requires both The Duviri Paradox and The Steel Path.",
        prerequisites: [PR.DUVIRI_PARADOX, PR.ACTIVITY_STEEL_PATH]
    },
    {
        id: PR.ACTIVITY_CIRCUIT_STEEL_PATH_2,
        showInPlanner: false,
        label: "The Steel Path Circuit (Alias)",
        category: "Systems",
        description: "Compatibility alias for the Steel Path version of The Circuit.",
        prerequisites: [PR.ACTIVITY_CIRCUIT_STEEL_PATH]
    },
    {
        id: PR.ACTIVITY_NIGHTWAVE,
        showInPlanner: false,
        label: "Nightwave Access",
        category: "Systems",
        description: "Access Nightwave challenges, Cred offerings, and rank rewards. This is tracked as a manual milestone because season availability rotates and the app does not model every historical Nightwave reward path.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.ACTIVITY_SORTIES,
        label: "Sorties",
        category: "Systems",
        description: "Unlock daily Sorties after The War Within. The game also requires Mastery Rank 5 and a rank-30 Warframe, but the frame-rank requirement is not modeled separately here.",
        prerequisites: [PR.WAR_WITHIN],
        conditions: [{ type: "mastery_rank", value: 5 }]
    },
    {
        id: PR.ACTIVITY_VOID_FISSURES,
        label: "Void Fissures",
        category: "Systems",
        description: "Access standard Void Relic fissure missions after installing the Void Relic Segment. Individual fissure missions still require their normal Star Chart node to be unlocked.",
        prerequisites: [PR.SEGMENT_VOID_RELIC]
    },
    {
        id: PR.ACTIVITY_VOID_STORMS,
        label: "Void Storms",
        category: "Systems",
        description: "Access Railjack Void Storm fissures. Requires a functional Railjack and Call of the Tempestarii-era Corpus Proxima access.",
        prerequisites: [PR.RAILJACK_CONSTRUCTED, PR.CALL_TEMPESTARII]
    },
    {
        id: PR.ACTIVITY_CIRCUIT,
        label: "The Circuit",
        category: "Systems",
        description: "Access The Circuit in Duviri after completing The Duviri Paradox.",
        prerequisites: [PR.DUVIRI_PARADOX]
    },
    {
        id: PR.ACTIVITY_NETRACELLS,
        label: "Netracells",
        category: "Systems",
        description: "Access weekly Netracell runs in Sanctum Anatomica after Whispers in the Walls.",
        prerequisites: [PR.HUB_SANCTUM]
    },
    {
        id: PR.ACTIVITY_DEEP_ARCHIMEDEA,
        label: "Deep Archimedea",
        category: "Systems",
        description: "Access Deep Archimedea by speaking to Necraloid in Sanctum Anatomica. The wiki requires Whispers in the Walls, Cavia Rank 5 (Illuminate), and at least one completed Netracell mission.",
        prerequisites: [PR.WHISPERS_WALL, PR.SYNDICATE_CAVIA_RANK5, PR.ACTIVITY_NETRACELLS]
    },
    {
        id: PR.ACTIVITY_KUVA_LICH,
        label: "Kuva Lich System",
        category: "Systems",
        description: "Meet the prerequisites to create and pursue a Kuva Lich. Requires The War Within, an owned Railjack, and Mastery Rank 5.",
        prerequisites: [PR.WAR_WITHIN, PR.RAILJACK_CONSTRUCTED],
        conditions: [{ type: "mastery_rank", value: 5 }]
    },
    {
        id: PR.ACTIVITY_SISTER_PARVOS,
        label: "Sisters of Parvos System",
        category: "Systems",
        description: "Meet the prerequisites to create and pursue a Sister of Parvos. Requires The War Within, Call of the Tempestarii, and Mastery Rank 5.",
        prerequisites: [PR.WAR_WITHIN, PR.CALL_TEMPESTARII],
        conditions: [{ type: "mastery_rank", value: 5 }]
    },
    {
        id: PR.ACTIVITY_ABYSSAL_ZONE,
        showInPlanner: false,
        label: "Abyssal Zone Access",
        category: "Systems",
        description: "Access the Abyssal Zone on Ceres. Requires Relay access and an Abyssal Beacon purchased from any pledged main Syndicate at Rank 2.",
        prerequisites: [PR.HUB_RELAY],
        validatedByAnySyndicate: {
            syndicateIds: [
                SY.STEEL_MERIDIAN,
                SY.ARBITERS_OF_HEXIS,
                SY.CEPHALON_SUDA,
                SY.THE_PERRIN_SEQUENCE,
                SY.NEW_LOKA,
                SY.RED_VEIL
            ],
            rank: 2
        }
    },
    {
        id: PR.ACTIVITY_ARBITRATIONS,
        label: "Arbitrations Unlocked",
        category: "Systems",
        description: "Unlock Arbitrations after gaining access to Pluto and completing the Eris Junction task to equip a Focus Lens. The app models this through Eris Junction completion plus Focus unlock.",
        prerequisites: [PR.JUNCTION_SEDNA_ERIS, PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.ACTIVITY_NIGHTMARE,
        label: "Nightmare Missions Unlocked",
        category: "Systems",
        description: "Unlock Nightmare Mode on a planet by completing every mission node on that planet. This is auto-derived from tracked normal-mode node completion.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.ACTIVITY_THERMIA_FRACTURES,
        label: "Thermia Fractures",
        category: "Systems",
        description: "Access Thermia Fractures in Orb Vallis and earn Diluted Thermia, which is required to start the Exploiter Orb fight.",
        prerequisites: [PR.VOX_SOLARIS]
    },
    {
        id: PR.ACTIVITY_INVASIONS,
        label: "Invasions Available",
        category: "Systems",
        description: "Have access to Invasion missions and battle pay. Invasions begin appearing early in the star chart and are closely tied to Mars-era progression, but the app does not currently model their availability exactly, so this milestone may need to be marked manually.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.ACTIVITY_INDEX,
        label: "The Index",
        category: "Systems",
        description: "Access The Index arena on Neptune.",
        prerequisites: [PR.JUNCTION_URANUS_NEPTUNE]
    },
    {
        id: PR.ACTIVITY_ROPALOLYST,
        label: "Ropalolyst Assassination",
        category: "Systems",
        description: "Unlock the Ropalolyst fight on Jupiter after Chimera Prologue.",
        prerequisites: [PR.CHIMERA_PROLOGUE, PR.JUNCTION_CERES_JUPITER]
    },
    {
        id: PR.ACTIVITY_DEFECTION,
        label: "Defection Missions",
        category: "Systems",
        description: "Access Defection missions, including Memphis on Phobos where Grineer Manics can be reliably farmed.",
        prerequisites: [PR.JUNCTION_MARS_PHOBOS]
    },
    {
        id: PR.ACTIVITY_TECHNOCYTE_CODA,
        label: "Technocyte Coda System",
        category: "Systems",
        description: "Meet the prerequisites to create and pursue a Technocyte Coda. Requires The Hex and an owned Railjack for the final Earth Proxima confrontation. The game also requires not having another active adversary, which is not modeled as a prerequisite here.",
        prerequisites: [PR.THE_HEX, PR.RAILJACK_CONSTRUCTED]
    },
    // =========================================================================
    // ORBITER SEGMENTS
    // =========================================================================
    {
        id: PR.SEGMENT_PERSONAL_QUARTERS,
        label: "Orbiter: Personal Quarters Segment",
        category: "Segments",
        description: "Awarded by The War Within. Required to trigger Apostasy Prologue.",
        prerequisites: [PR.WAR_WITHIN]
    },
    {
        id: PR.SEGMENT_ARSENAL,
        showInPlanner: false,
        label: "Orbiter: Arsenal Segment",
        category: "Segments",
        description: "Base Orbiter function installed during Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_COMMUNICATIONS,
        showInPlanner: false,
        label: "Orbiter: Communications Segment",
        category: "Segments",
        description: "Base Orbiter communication function installed during Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_CODEX_SCANNER,
        showInPlanner: false,
        label: "Orbiter: Codex Scanner Segment",
        category: "Segments",
        description: "Base Codex scanning function installed during Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_FOUNDRY,
        showInPlanner: false,
        label: "Orbiter: Foundry Segment",
        category: "Segments",
        description: "Base Foundry access installed during Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_MODDING,
        showInPlanner: false,
        label: "Orbiter: Modding Segment",
        category: "Segments",
        description: "Base modding station installed during Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_VOID_RELIC,
        label: "Orbiter: Void Relic Segment",
        category: "Segments",
        description: "Required to crack Void Fissures and refine Relics.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.SEGMENT_INCUBATOR,
        label: "Orbiter: Incubator Segment",
        category: "Segments",
        description: "Required for Kubrow and Kavat companion breeding. Awarded by completing Howl of the Kubrow.",
        prerequisites: [PR.HOWL_KUBROW]
    },
    {
        id: PR.SEGMENT_MELEE_UPGRADE,
        label: "Orbiter: Melee Upgrade Segment",
        category: "Segments",
        description: "Unlocks Melee Exilus and Melee Arcane slots (Tennokai system). Awarded by Whispers in the Walls.",
        prerequisites: [PR.WHISPERS_WALL]
    },
    {
        id: PR.SEGMENT_HELMINTH,
        label: "Helminth Segment (Base)",
        category: "Segments",
        description: "Base Helminth subsume system. Purchased from Son for 15,000 Standing. Requires MR8 + Entrati rank 3 (Associate).",
        prerequisites: [PR.HUB_NECRALISK, PR.SYNDICATE_ENTRATI_RANK3],
        conditions: [{ type: "mastery_rank", value: 8 }]
    },
    {
        id: PR.SEGMENT_HELMINTH_INVIGORATION,
        label: "Helminth Segment: Invigorations",
        category: "Segments",
        description: "Unlocks weekly Invigoration buffs. Purchased from Son for 30,000 Standing. Requires MR8 + Entrati rank 5 (Family).",
        prerequisites: [PR.SEGMENT_HELMINTH, PR.SYNDICATE_ENTRATI_RANK5],
        conditions: [{ type: "mastery_rank", value: 8 }]
    },
    {
        id: PR.SEGMENT_HELMINTH_ARCHON_SHARD,
        label: "Helminth Segment: Archon Shards",
        category: "Segments",
        description: "Unlocks Archon Shard socketing into Warframes. Blueprint rewarded by completing Veilbreaker.",
        prerequisites: [PR.SEGMENT_HELMINTH, PR.VEILBREAKER]
    },
    {
        id: PR.SEGMENT_HELMINTH_COALESCENT,
        label: "Helminth Segment: Coalescent",
        category: "Segments",
        description: "Unlocks Tauforged shard crafting. Purchased from Bird 3 (Cavia). Requires Cavia rank 2 (Researcher).",
        prerequisites: [PR.SEGMENT_HELMINTH_ARCHON_SHARD, PR.HUB_SANCTUM, PR.SYNDICATE_CAVIA_RANK2]
    },

    // =========================================================================
    // NECRAMECH & RAILJACK
    // =========================================================================
    {
        id: PR.NECRAMECH_UNLOCKED,
        label: "Necramech: System Unlocked",
        category: "Necramech",
        description: "You can deploy a Necramech in open worlds and Railjack missions. Craft Voidrig or Bonewidow via Necraloid standing.",
        prerequisites: [PR.HEART_OF_DEIMOS, PR.HUB_NECRALISK]
    },
    {
        id: PR.NECRAMECH_VOIDRIG,
        showInPlanner: false,
        label: "Necramech: Voidrig Built",
        category: "Necramech",
        description: "Build Voidrig through Necramech progression in the Necralisk.",
        prerequisites: [PR.NECRAMECH_UNLOCKED]
    },
    {
        id: PR.NECRAMECH_BONEWIDOW,
        showInPlanner: false,
        label: "Necramech: Bonewidow Built",
        category: "Necramech",
        description: "Build Bonewidow through Necramech progression in the Necralisk.",
        prerequisites: [PR.NECRAMECH_UNLOCKED]
    },
    {
        id: PR.RAILJACK_CONSTRUCTED,
        label: "Railjack: Ship Constructed",
        category: "Railjack",
        description: "Your Railjack is built and ready for missions. Required for The New War.",
        prerequisites: [PR.RISING_TIDE]
    },
    {
        id: PR.RAILJACK_INTRINSICS,
        showInPlanner: false,
        label: "Railjack: Intrinsics Unlocked",
        category: "Railjack",
        description: "Access the Railjack Intrinsics tree after completing your first Railjack mission.",
        prerequisites: [PR.RAILJACK_CONSTRUCTED]
    },
    {
        id: PR.RAILJACK_CORPUS_NODES,
        showInPlanner: false,
        label: "Railjack: Corpus Proxima Access",
        category: "Railjack",
        description: "Unlock Corpus Proxima Railjack nodes after Call of the Tempestarii.",
        prerequisites: [PR.CALL_TEMPESTARII]
    },
    {
        id: PR.RAILJACK_VOID_STORMS,
        showInPlanner: false,
        label: "Railjack: Void Storm Access",
        category: "Railjack",
        description: "Unlock Railjack Void Storm fissures after Corpus Proxima access.",
        prerequisites: [PR.RAILJACK_CORPUS_NODES]
    },
    {
        id: PR.AMP_MOTE,
        label: "Operator: Mote Amp Acquired",
        category: "Systems",
        description: "Receive your first Amp from Onkko in Cetus after The War Within and Saya's Vigil. This is an explicit main-story prerequisite for Chains of Harrow and The New War.",
        prerequisites: [PR.WAR_WITHIN, PR.SAYA_VIGIL]
    },
    {
        id: PR.FOCUS_UNLOCKED,
        showInPlanner: false,
        label: "Focus System Unlocked",
        category: "Systems",
        description: "Unlock the Focus system by completing The Second Dream.",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.FOCUS_FULL,
        showInPlanner: false,
        label: "Focus Schools Fully Accessible",
        category: "Systems",
        description: "Unlock the full Focus school progression after The War Within and access to The Quills.",
        prerequisites: [PR.WAR_WITHIN, PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.FOCUS_SCHOOL_ZENURIK,
        showInPlanner: false,
        label: "Focus School: Zenurik",
        category: "Systems",
        description: "Zenurik Focus school is available after unlocking Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.FOCUS_SCHOOL_VAZARIN,
        showInPlanner: false,
        label: "Focus School: Vazarin",
        category: "Systems",
        description: "Vazarin Focus school is available after unlocking Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.FOCUS_SCHOOL_NARAMON,
        showInPlanner: false,
        label: "Focus School: Naramon",
        category: "Systems",
        description: "Naramon Focus school is available after unlocking Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.FOCUS_SCHOOL_UNAIRU,
        showInPlanner: false,
        label: "Focus School: Unairu",
        category: "Systems",
        description: "Unairu Focus school is available after unlocking Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.FOCUS_SCHOOL_MADURAI,
        showInPlanner: false,
        label: "Focus School: Madurai",
        category: "Systems",
        description: "Madurai Focus school is available after unlocking Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.AMP_SIROCCO,
        showInPlanner: false,
        label: "Operator: Sirocco Acquired",
        category: "Systems",
        description: "Receive the built Sirocco Amp from The New War.",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.AMP_TIER1,
        showInPlanner: false,
        label: "Amp Parts: Tier 1",
        category: "Systems",
        description: "Unlock Tier 1 Amp parts from The Quills.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.AMP_TIER2,
        showInPlanner: false,
        label: "Amp Parts: Tier 2",
        category: "Systems",
        description: "Unlock Tier 2 Amp parts from The Quills.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK2]
    },
    {
        id: PR.AMP_TIER3,
        showInPlanner: false,
        label: "Amp Parts: Tier 3",
        category: "Systems",
        description: "Unlock Tier 3 Amp parts from The Quills.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK3]
    },
    {
        id: PR.AMP_TIER4,
        showInPlanner: false,
        label: "Amp Parts: Tier 4",
        category: "Systems",
        description: "Unlock Tier 4 Amp parts from The Quills.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK4]
    },
    {
        id: PR.AMP_TIER5,
        showInPlanner: false,
        label: "Amp Parts: Tier 5",
        category: "Systems",
        description: "Unlock Tier 5 Amp parts from Vox Solaris.",
        prerequisites: [PR.SYNDICATE_VOX_RANK1]
    },
    {
        id: PR.AMP_TIER6,
        showInPlanner: false,
        label: "Amp Parts: Tier 6",
        category: "Systems",
        description: "Unlock Tier 6 Amp parts from Vox Solaris.",
        prerequisites: [PR.SYNDICATE_VOX_RANK2]
    },
    {
        id: PR.AMP_TIER7,
        showInPlanner: false,
        label: "Amp Parts: Tier 7",
        category: "Systems",
        description: "Unlock Tier 7 Amp parts from Vox Solaris.",
        prerequisites: [PR.SYNDICATE_VOX_RANK3]
    },
    {
        id: PR.AMP_GILDING,
        showInPlanner: false,
        label: "Amp Gilding Unlocked",
        category: "Systems",
        description: "Unlock Amp gilding through advanced Quills or Vox Solaris rank progression.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK3]
    },
    {
        id: PR.COMPANION_KUBROW,
        showInPlanner: false,
        label: "Kubrow Breeding",
        category: "Systems",
        description: "Unlock Kubrow breeding through Howl of the Kubrow and the Incubator segment.",
        prerequisites: [PR.HOWL_KUBROW, PR.SEGMENT_INCUBATOR]
    },
    {
        id: PR.COMPANION_KAVAT,
        showInPlanner: false,
        label: "Kavat Breeding",
        category: "Systems",
        description: "Unlock Kavat breeding after obtaining the Incubator segment and Deimos access for Genetic Codes.",
        prerequisites: [PR.SEGMENT_INCUBATOR, PR.HEART_OF_DEIMOS]
    },
    {
        id: PR.COMPANION_HELMINTH_CHARGER,
        showInPlanner: false,
        label: "Helminth Charger Companion",
        category: "Systems",
        description: "Unlock Helminth Charger incubation through the Incubator segment and Helminth access.",
        prerequisites: [PR.SEGMENT_INCUBATOR, PR.SEGMENT_HELMINTH]
    },
    {
        id: PR.COMPANION_MOA,
        showInPlanner: false,
        label: "MOA Companion Assembly",
        category: "Systems",
        description: "Unlock MOA companion assembly in Fortuna after completing Vox Solaris.",
        prerequisites: [PR.VOX_SOLARIS]
    },
    {
        id: PR.COMPANION_HOUND,
        showInPlanner: false,
        label: "Hound Companion Access",
        category: "Systems",
        description: "Unlock Hound companions by accessing the Sisters of Parvos system.",
        prerequisites: [PR.ACTIVITY_SISTER_PARVOS]
    },
    {
        id: PR.COMPANION_PREDASITE,
        showInPlanner: false,
        label: "Predasite Companion Access",
        category: "Systems",
        description: "Unlock Predasite companions through Deimos companion conservation and revivification.",
        prerequisites: [PR.HUB_NECRALISK]
    },
    {
        id: PR.COMPANION_VULPAPHYLA,
        showInPlanner: false,
        label: "Vulpaphyla Companion Access",
        category: "Systems",
        description: "Unlock Vulpaphyla companions through Deimos companion conservation and revivification.",
        prerequisites: [PR.HUB_NECRALISK]
    },
    {
        id: PR.COMPANION_NAUTILUS,
        showInPlanner: false,
        label: "Nautilus Companion Access",
        category: "Systems",
        description: "Unlock the Nautilus Sentinel through Railjack progression.",
        prerequisites: [PR.RAILJACK_CONSTRUCTED]
    },

    // =========================================================================
    // SYNDICATE RANK MILESTONES (only ranks that gate Orbiter segments)
    // =========================================================================
    {
        id: PR.SYNDICATE_QUILLS_RANK1,
        validatedBySyndicate: { syndicateId: SY.THE_QUILLS, rank: 1 },
        label: "The Quills: Rank 1 (Mote)",
        category: "Syndicates",
        description: "Unlocks the first Quills standing tier and basic Amp progression used for early Eidolon hunting.",
        prerequisites: [PR.SAYA_VIGIL, PR.WAR_WITHIN]
    },
    {
        id: PR.SYNDICATE_QUILLS_RANK2,
        validatedBySyndicate: { syndicateId: SY.THE_QUILLS, rank: 2 },
        label: "The Quills: Rank 2 (Observer)",
        category: "Syndicates",
        description: "Unlocks higher-tier Quills offerings, including stronger Amp progression and gilding access.",
        prerequisites: [PR.HUB_CETUS, PR.WAR_WITHIN, PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.SYNDICATE_QUILLS_RANK3,
        validatedBySyndicate: { syndicateId: SY.THE_QUILLS, rank: 3 },
        label: "The Quills: Rank 3 (Adherent)",
        category: "Syndicates",
        description: "Unlocks mid-tier Quills Amp offerings from Onkko.",
        prerequisites: [PR.HUB_CETUS, PR.WAR_WITHIN, PR.SYNDICATE_QUILLS_RANK2]
    },
    {
        id: PR.SYNDICATE_QUILLS_RANK4,
        validatedBySyndicate: { syndicateId: SY.THE_QUILLS, rank: 4 },
        label: "The Quills: Rank 4 (Instrument)",
        category: "Syndicates",
        description: "Unlocks higher-tier Quills Amp offerings from Onkko.",
        prerequisites: [PR.HUB_CETUS, PR.WAR_WITHIN, PR.SYNDICATE_QUILLS_RANK3]
    },
    {
        id: PR.SYNDICATE_HOLDFASTS_RANK1,
        validatedBySyndicate: { syndicateId: SY.THE_HOLDFASTS, rank: 1 },
        label: "The Holdfasts: Rank 1 (Fallen)",
        category: "Syndicates",
        description: "Unlocks the first Holdfasts standing tier in the Chrysalith.",
        prerequisites: [PR.HUB_ZARIMAN]
    },
    {
        id: PR.SYNDICATE_HOLDFASTS_RANK2,
        validatedBySyndicate: { syndicateId: SY.THE_HOLDFASTS, rank: 2 },
        label: "The Holdfasts: Rank 2 (Watcher)",
        category: "Syndicates",
        description: "Unlocks additional Holdfasts vendor stock in the Chrysalith.",
        prerequisites: [PR.HUB_ZARIMAN, PR.SYNDICATE_HOLDFASTS_RANK1]
    },
    {
        id: PR.SYNDICATE_HOLDFASTS_RANK3,
        validatedBySyndicate: { syndicateId: SY.THE_HOLDFASTS, rank: 3 },
        label: "The Holdfasts: Rank 3 (Guardian)",
        category: "Syndicates",
        description: "Unlocks mid-tier Holdfasts vendor stock in the Chrysalith.",
        prerequisites: [PR.HUB_ZARIMAN, PR.SYNDICATE_HOLDFASTS_RANK2]
    },
    {
        id: PR.SYNDICATE_HOLDFASTS_RANK4,
        validatedBySyndicate: { syndicateId: SY.THE_HOLDFASTS, rank: 4 },
        label: "The Holdfasts: Rank 4 (Seraph)",
        category: "Syndicates",
        description: "Unlocks advanced Holdfasts vendor stock in the Chrysalith.",
        prerequisites: [PR.HUB_ZARIMAN, PR.SYNDICATE_HOLDFASTS_RANK3]
    },
    {
        id: PR.SYNDICATE_HOLDFASTS_RANK5,
        validatedBySyndicate: { syndicateId: SY.THE_HOLDFASTS, rank: 5 },
        label: "The Holdfasts: Rank 5 (Angel)",
        category: "Syndicates",
        description: "Unlocks the final Holdfasts standing tier and full Chrysalith vendor stock.",
        prerequisites: [PR.HUB_ZARIMAN, PR.SYNDICATE_HOLDFASTS_RANK4]
    },
    {
        id: PR.SYNDICATE_SOLARIS_RANK5,
        validatedBySyndicate: { syndicateId: SY.SOLARIS_UNITED, rank: 5 },
        label: "Solaris United: Rank 5 (Old Mate)",
        category: "Syndicates",
        description: "Maximum Solaris United rank. Required to start Orb Vallis heists such as Profit-Taker and Exploiter.",
        prerequisites: [PR.HUB_FORTUNA, PR.VOX_SOLARIS]
    },
    {
        id: PR.SYNDICATE_VOX_RANK1,
        validatedBySyndicate: { syndicateId: SY.VOX_SOLARIS, rank: 1 },
        showInPlanner: false,
        label: "Vox Solaris: Rank 1 (Operational)",
        category: "Syndicates",
        description: "Unlock the first Little Duck standing tier and early Vox Amp parts.",
        prerequisites: [PR.HUB_FORTUNA, PR.VOX_SOLARIS]
    },
    {
        id: PR.SYNDICATE_VOX_RANK2,
        validatedBySyndicate: { syndicateId: SY.VOX_SOLARIS, rank: 2 },
        showInPlanner: false,
        label: "Vox Solaris: Rank 2 (Agent)",
        category: "Syndicates",
        description: "Unlock additional Little Duck offerings and Tier 6 Amp parts.",
        prerequisites: [PR.HUB_FORTUNA, PR.VOX_SOLARIS, PR.SYNDICATE_VOX_RANK1]
    },
    {
        id: PR.SYNDICATE_VOX_RANK3,
        validatedBySyndicate: { syndicateId: SY.VOX_SOLARIS, rank: 3 },
        showInPlanner: false,
        label: "Vox Solaris: Rank 3 (Hand)",
        category: "Syndicates",
        description: "Unlock advanced Little Duck offerings, Tier 7 Amp parts, and Amp gilding.",
        prerequisites: [PR.HUB_FORTUNA, PR.VOX_SOLARIS, PR.SYNDICATE_VOX_RANK2]
    },
    {
        id: PR.SYNDICATE_VOX_RANK5,
        validatedBySyndicate: { syndicateId: SY.VOX_SOLARIS, rank: 5 },
        label: "Vox Solaris: Rank 5 (Shadow)",
        category: "Syndicates",
        description: "Maximum Vox Solaris rank. Unlocks top-tier Little Duck offerings.",
        prerequisites: [PR.HUB_FORTUNA, PR.VOX_SOLARIS, PR.SYNDICATE_VOX_RANK3]
    },
    {
        id: PR.SYNDICATE_ENTRATI_RANK3,
        validatedBySyndicate: { syndicateId: SY.ENTRATI, rank: 3 },
        label: "Entrati: Rank 3 (Associate)",
        category: "Syndicates",
        description: "Unlocks Helminth Segment blueprint from Son. Requires MR8.",
        prerequisites: [PR.HUB_NECRALISK],
        conditions: [{ type: "mastery_rank", value: 8 }]
    },
    {
        id: PR.SYNDICATE_ENTRATI_RANK5,
        validatedBySyndicate: { syndicateId: SY.ENTRATI, rank: 5 },
        label: "Entrati: Rank 5 (Family)",
        category: "Syndicates",
        description: "Unlocks Helminth Invigoration Segment blueprint from Son. Requires MR8.",
        prerequisites: [PR.SYNDICATE_ENTRATI_RANK3],
        conditions: [{ type: "mastery_rank", value: 8 }]
    },
    {
        id: PR.SYNDICATE_CAVIA_RANK2,
        validatedBySyndicate: { syndicateId: SY.CAVIA, rank: 2 },
        label: "Cavia: Rank 2 (Researcher)",
        category: "Syndicates",
        description: "Unlocks Helminth Coalescent Segment blueprint from Bird 3.",
        prerequisites: [PR.HUB_SANCTUM]
    },
    {
        id: PR.SYNDICATE_CAVIA_RANK5,
        validatedBySyndicate: { syndicateId: SY.CAVIA, rank: 5 },
        label: "Cavia: Rank 5 (Illuminate)",
        category: "Syndicates",
        description: "Maximum Cavia rank. Unlocks the weekly Archon Shard purchase in Sanctum Anatomica.",
        prerequisites: [PR.SYNDICATE_CAVIA_RANK2]
    },
    {
        id: PR.SYNDICATE_HEX_RANK5,
        validatedBySyndicate: { syndicateId: SY.THE_HEX, rank: 5 },
        label: "The Hex: Rank 5 (Pizza Party)",
        category: "Syndicates",
        description: "Maximum Hex rank. Required to access Temporal Archimedea.",
        prerequisites: [PR.HUB_HOLLVANIA]
    },
    {
        id: PR.MR_5,
        validatedByMasteryRank: 5,
        showInPlanner: false,
        label: "Mastery Rank 5",
        category: "Systems",
        description: "Automatically tracked from your profile. Used by several mid-game gates such as Sorties-era content.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.MR_8,
        validatedByMasteryRank: 8,
        showInPlanner: false,
        label: "Mastery Rank 8",
        category: "Systems",
        description: "Automatically tracked from your profile. Used by Helminth segment access and similar gates.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.MR_10,
        validatedByMasteryRank: 10,
        showInPlanner: false,
        label: "Mastery Rank 10",
        category: "Systems",
        description: "Automatically tracked from your profile for MR10-gated items and systems.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.MR_15,
        validatedByMasteryRank: 15,
        showInPlanner: false,
        label: "Mastery Rank 15",
        category: "Systems",
        description: "Automatically tracked from your profile for MR15-gated items and purchases.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.MR_30,
        validatedByMasteryRank: 30,
        showInPlanner: false,
        label: "Mastery Rank 30",
        category: "Systems",
        description: "Automatically tracked from your profile for MR30-gated features and rewards.",
        prerequisites: [PR.VORS_PRIZE]
    },

];
