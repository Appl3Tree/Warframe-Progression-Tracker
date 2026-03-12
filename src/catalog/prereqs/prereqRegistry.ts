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
import { SY } from "../../domain/ids/syndicateIds";

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

export function describePrereqCondition(cond: PrereqCondition): string {
    switch (cond.type) {
        case "mastery_rank":      return `Mastery Rank ${cond.value} required`;
        case "quest_complete":    return `Quest complete: ${cond.prereqId}`;
        case "junction_complete": return `Junction complete: ${cond.junctionId}`;
        case "node_complete":     return `Node complete: ${cond.nodeId}`;
        case "planet_unlock":     return `Planet unlocked: ${cond.planetId}`;
        case "syndicate_rank":    return `${cond.syndicateId} rank ${cond.rank} required`;
        case "item_owned":        return `Item owned: ${cond.catalogId}`;
        case "resource_owned":    return `${cond.quantity}x ${cond.catalogId} required`;
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
        id: PR.ONCE_AWAKE,
        label: "Once Awake",
        category: "Quests",
        description: "Mercury Grineer story arc. Required to unlock The Archwing quest.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.ARCHWING,
        label: "The Archwing",
        category: "Quests",
        description: "Unlocks Archwing gear and mission nodes. Required for Europa → Saturn junction.",
        prerequisites: [PR.ONCE_AWAKE, PR.JUNCTION_VENUS_EARTH]
    },
    {
        id: PR.STOLEN_DREAMS,
        label: "Stolen Dreams",
        category: "Quests",
        description: "Unlocks Cephalon Simaris relay scanner. Required for The New Strange.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.NEW_STRANGE,
        label: "The New Strange",
        category: "Quests",
        description: "Required for Natah and for the Sedna → Eris junction.",
        prerequisites: [PR.STOLEN_DREAMS, PR.JUNCTION_MARS_CERES]
    },
    {
        id: PR.NATAH,
        label: "Natah",
        category: "Quests",
        description: "Gatekeeper to The Second Dream. Requires Pluto access.",
        prerequisites: [PR.NEW_STRANGE, PR.JUNCTION_NEPTUNE_PLUTO]
    },

    // =========================================================================
    // MAIN STORY QUESTS — Arc 2
    // =========================================================================
    {
        id: PR.SECOND_DREAM,
        label: "The Second Dream",
        category: "Quests",
        description: "Unlocks Operator mode and the Focus system. Required for the War Within chain and Lua junction.",
        prerequisites: [PR.NATAH]
    },
    {
        id: PR.WAR_WITHIN,
        label: "The War Within",
        category: "Quests",
        description: "Expands Operator to full Transference. Unlocks Kuva Fortress, Sorties, Rising Tide, and the full Focus tree. Required for the main arc chain.",
        prerequisites: [PR.SECOND_DREAM, PR.JUNCTION_PLUTO_SEDNA],
        conditions: [{ type: "mastery_rank", value: 5 }]
    },
    {
        id: PR.CHAINS_HARROW,
        label: "Chains of Harrow",
        category: "Quests",
        description: "Required for Apostasy Prologue.",
        prerequisites: [PR.WAR_WITHIN]
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
        description: "Major story milestone. Requires Railjack and a Necramech. Unlocks Angels of the Zariman, Veilbreaker, and the full endgame.",
        prerequisites: [PR.PRELUDE_TO_WAR, PR.RAILJACK_CONSTRUCTED, PR.NECRAMECH_UNLOCKED]
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
        prerequisites: [PR.ANGELS_ZARIMAN, PR.HEART_OF_DEIMOS]
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
        id: PR.SAYA_VIGIL,
        showInPlanner: false,
        label: "Saya's Vigil",
        category: "SideQuests",
        description: "Unlocks Gara blueprint. Available in Cetus. Tracked for quest completion.",
        prerequisites: [PR.HUB_CETUS]
    },
    {
        id: PR.HEART_OF_DEIMOS,
        label: "Heart of Deimos",
        category: "SideQuests",
        description: "Unlocks Necralisk, Cambion Drift, and Entrati syndicate. Required for Whispers in the Walls and Necramech system.",
        prerequisites: [PR.JUNCTION_MARS_DEIMOS]
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
        description: "Unlocks Sisters of Parvos and Corpus Proxima Railjack nodes. Requires Rising Tide.",
        prerequisites: [PR.RISING_TIDE]
    },
    {
        id: PR.DEADLOCK_PROTOCOL,
        label: "The Deadlock Protocol",
        category: "SideQuests",
        description: "Awards Protea blueprint. Required for Sisters of Parvos eligibility. Requires Corpus Ship Granum Void access.",
        prerequisites: [PR.JUNCTION_CERES_JUPITER]
    },

    // =========================================================================
    // SIDE QUESTS — Warframe Blueprint Quests (tracked, not planning blockers)
    // =========================================================================
    {
        id: PR.LIMBO_THEOREM,
        showInPlanner: false,
        label: "The Limbo Theorem",
        category: "SideQuests",
        description: "Awards Limbo blueprint. Requires Void access.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.SILVER_GROVE,
        showInPlanner: false,
        label: "The Silver Grove",
        category: "SideQuests",
        description: "Awards Titania blueprint. Requires Cetus access and MR7.",
        prerequisites: [PR.HUB_CETUS, PR.HUB_RELAY],
        conditions: [{ type: "mastery_rank", value: 7 }]
    },
    {
        id: PR.SANDS_INAROS,
        showInPlanner: false,
        label: "Sands of Inaros",
        category: "SideQuests",
        description: "Awards Inaros blueprint. Quest beacon purchased from Baro Ki'Teer.",
        prerequisites: [PR.HUB_RELAY]
    },
    {
        id: PR.OCTAVIA_ANTHEM,
        showInPlanner: false,
        label: "Octavia's Anthem",
        category: "SideQuests",
        description: "Awards Octavia blueprint. Requires Earth → Lua junction.",
        prerequisites: [PR.JUNCTION_EARTH_LUA]
    },
    {
        id: PR.JORDAS_PRECEPT,
        showInPlanner: false,
        label: "The Jordas Precept",
        category: "SideQuests",
        description: "Awards Atlas blueprint. Requires Archwing and Eris access.",
        prerequisites: [PR.ARCHWING, PR.JUNCTION_SEDNA_ERIS]
    },
    {
        id: PR.GLAST_GAMBIT,
        showInPlanner: false,
        label: "The Glast Gambit",
        category: "SideQuests",
        description: "Awards Nidus blueprint. Requires Eris access.",
        prerequisites: [PR.JUNCTION_SEDNA_ERIS]
    },
    {
        id: PR.MASK_REVENANT,
        showInPlanner: false,
        label: "Mask of the Revenant",
        category: "SideQuests",
        description: "Awards Revenant blueprint. Talk to Nakak in Cetus to start.",
        prerequisites: [PR.HUB_CETUS]
    },
    {
        id: PR.HIDDEN_MESSAGES,
        showInPlanner: false,
        label: "Hidden Messages",
        category: "SideQuests",
        description: "Awards Mirage blueprint. Requires Saturn access.",
        prerequisites: [PR.JUNCTION_EUROPA_SATURN]
    },
    {
        id: PR.PATIENT_ZERO,
        showInPlanner: false,
        label: "Patient Zero",
        category: "SideQuests",
        description: "Awards Mesa blueprint. Requires Eris access.",
        prerequisites: [PR.JUNCTION_SEDNA_ERIS]
    },

    // =========================================================================
    // STAR CHART JUNCTIONS
    // =========================================================================
    {
        id: PR.JUNCTION_MERCURY_VENUS,
        label: "Junction: Mercury → Venus",
        category: "Systems",
        description: "Unlocks Venus and early Corpus content.",
        prerequisites: []
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
        prerequisites: [PR.JUNCTION_EUROPA_SATURN, PR.NEW_STRANGE]
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
        description: "Unlocks Sedna. Required for The War Within.",
        prerequisites: [PR.JUNCTION_NEPTUNE_PLUTO]
    },
    {
        id: PR.JUNCTION_SEDNA_ERIS,
        label: "Junction: Sedna → Eris",
        category: "Systems",
        description: "Unlocks Eris and Infested content. Required for Atlas and Nidus quests.",
        prerequisites: [PR.JUNCTION_PLUTO_SEDNA, PR.NEW_STRANGE]
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
        description: "You can enter Cetus and the Plains of Eidolon. Required for Saya's Vigil, The Quills, and Mask of the Revenant.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.HUB_FORTUNA,
        label: "Fortuna (Orb Vallis) Access",
        category: "Hubs",
        description: "You can enter Fortuna and Orb Vallis. Required for Solaris United standing progression.",
        prerequisites: [PR.JUNCTION_VENUS_EARTH]
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
        description: "Required for Kubrow and Kavat companion breeding. Granted by a Junction reward.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
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
        description: "You can deploy a Necramech in open worlds and Railjack missions. Craft Voidrig or Bonewidow via Necraloid standing. Required for The New War.",
        prerequisites: [PR.HEART_OF_DEIMOS, PR.HUB_NECRALISK]
    },
    {
        id: PR.RAILJACK_CONSTRUCTED,
        label: "Railjack: Ship Constructed",
        category: "Railjack",
        description: "Your Railjack is built and ready for missions. Required for The New War.",
        prerequisites: [PR.RISING_TIDE]
    },

    // =========================================================================
    // BOSS NODES
    // =========================================================================
    {
        id: PR.ACTIVITY_ROPALOLYST,
        showInPlanner: false,
        label: "Ropalolyst",
        category: "Systems",
        description: "Jupiter assassination boss. Drops Wisp parts. Unlocked by completing Chimera Prologue.",
        prerequisites: [PR.CHIMERA_PROLOGUE]
    },

    // =========================================================================
    // SYNDICATE RANK MILESTONES (only ranks that gate Orbiter segments)
    // =========================================================================
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
        label: "Cavia: Rank 5 (Family)",
        category: "Syndicates",
        description: "Maximum Cavia rank. Unlocks weekly Archon Shard purchasing from Cavalero.",
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

];