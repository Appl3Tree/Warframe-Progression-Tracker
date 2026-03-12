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
        description: "Chapter 1 of Prelude to War. Required for Erra.",
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
        label: "Saya's Vigil",
        category: "SideQuests",
        description: "Unlocks Gara blueprint. Available in Cetus. Required (combined with The War Within) to unlock The Quills.",
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
        label: "Junction: Mars → Phobos",
        category: "Systems",
        description: "Unlocks Phobos. Part of the path to the Ceres → Jupiter junction.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.JUNCTION_MARS_CERES,
        label: "Junction: Mars → Ceres",
        category: "Systems",
        description: "Unlocks Ceres. Required for The New Strange and Deadlock Protocol.",
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
        label: "Junction: Phobos → Ceres",
        category: "Systems",
        description: "Required for the Ceres → Jupiter junction.",
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
        description: "Access to Kahl's Garrison missions. Required for Archon Hunt weekly resets.",
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
    // BOSS NODES (only those that gate specific items or systems)
    // =========================================================================
    {
        id: PR.ACTIVITY_ROPALOLYST,
        label: "Ropalolyst",
        category: "Systems",
        description: "Jupiter assassination boss. Drops Wisp parts. Unlocked by Chimera Prologue.",
        prerequisites: [PR.CHIMERA_PROLOGUE],
        showInPlanner: false
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

    // =========================================================================
    // SIDE QUESTS — Additional Feature Gates
    // =========================================================================
    {
        id: PR.THE_TEACHER,
        label: "The Teacher",
        category: "SideQuests",
        description: "Modding tutorial quest (Update 40). No hard prerequisites.",
        prerequisites: [PR.VORS_PRIZE],
        showInPlanner: false
    },
    {
        id: PR.HOWL_KUBROW,
        label: "Howl of the Kubrow",
        category: "SideQuests",
        description: "Unlocks Kubrow incubation and breeding. No hard quest prerequisite.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.VOX_SOLARIS,
        label: "Vox Solaris",
        category: "SideQuests",
        description: "Auto-starts on first Fortuna visit. Unlocks Vox Solaris syndicate and Little Duck.",
        prerequisites: [PR.HUB_FORTUNA]
    },

    // =========================================================================
    // ORBITER SEGMENTS — Vor's Prize Base Segments
    // =========================================================================
    {
        id: PR.SEGMENT_ARSENAL,
        label: "Orbiter: Arsenal Segment",
        category: "Segments",
        description: "Loadout management console. Installed automatically by Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE],
        showInPlanner: false
    },
    {
        id: PR.SEGMENT_COMMUNICATIONS,
        label: "Orbiter: Communications Segment",
        category: "Segments",
        description: "Navigation and inbox. Installed automatically by Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE],
        showInPlanner: false
    },
    {
        id: PR.SEGMENT_CODEX_SCANNER,
        label: "Orbiter: Codex Scanner Segment",
        category: "Segments",
        description: "Codex entry tracking and lore browser. Installed automatically by Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE],
        showInPlanner: false
    },
    {
        id: PR.SEGMENT_FOUNDRY,
        label: "Orbiter: Foundry Segment",
        category: "Segments",
        description: "Crafting station for Warframes, weapons, and components. Installed automatically by Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE],
        showInPlanner: false
    },
    {
        id: PR.SEGMENT_MODDING,
        label: "Orbiter: Modding Table Segment",
        category: "Segments",
        description: "Mod fusion, transmutation, and management. Installed automatically by Vor's Prize.",
        prerequisites: [PR.VORS_PRIZE],
        showInPlanner: false
    },

    // =========================================================================
    // OPERATOR / FOCUS SYSTEM
    // =========================================================================
    {
        id: PR.FOCUS_UNLOCKED,
        label: "Focus System (Partial)",
        category: "Systems",
        description: "Unlocks Focus passives (2 per school) via Operator Transference. Granted at the end of The Second Dream.",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.FOCUS_FULL,
        label: "Focus System (Full Trees)",
        category: "Systems",
        description: "Unlocks all 10 Ways per school. Requires The War Within, Saya's Vigil, and visiting The Quills.",
        prerequisites: [PR.WAR_WITHIN, PR.SAYA_VIGIL, PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.FOCUS_SCHOOL_ZENURIK,
        label: "Focus School: Zenurik",
        category: "Systems",
        description: "Energy and Void regen school. Choose at the end of The Second Dream or purchase for 50,000 Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED],
        showInPlanner: false
    },
    {
        id: PR.FOCUS_SCHOOL_VAZARIN,
        label: "Focus School: Vazarin",
        category: "Systems",
        description: "Healing and Operator survival school. Choose at the end of The Second Dream or purchase for 50,000 Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED],
        showInPlanner: false
    },
    {
        id: PR.FOCUS_SCHOOL_NARAMON,
        label: "Focus School: Naramon",
        category: "Systems",
        description: "Melee combo and shadow step school. Choose at the end of The Second Dream or purchase for 50,000 Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED],
        showInPlanner: false
    },
    {
        id: PR.FOCUS_SCHOOL_UNAIRU,
        label: "Focus School: Unairu",
        category: "Systems",
        description: "Defense stripping and armor break school. Choose at the end of The Second Dream or purchase for 50,000 Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED],
        showInPlanner: false
    },
    {
        id: PR.FOCUS_SCHOOL_MADURAI,
        label: "Focus School: Madurai",
        category: "Systems",
        description: "Damage amp and Void Strike school — standard for Eidolon hunting. Choose at end of The Second Dream or purchase for 50,000 Focus.",
        prerequisites: [PR.FOCUS_UNLOCKED],
        showInPlanner: false
    },

    // =========================================================================
    // AMP SYSTEM
    // =========================================================================
    {
        id: PR.AMP_MOTE,
        label: "Amp: Mote (Starter)",
        category: "Systems",
        description: "Starter Amp given by Quill Onkko. Requires The War Within and visiting The Quills in Cetus.",
        prerequisites: [PR.WAR_WITHIN, PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.AMP_SIROCCO,
        label: "Amp: Sirocco",
        category: "Systems",
        description: "Pre-built Amp awarded as a reward for completing The New War.",
        prerequisites: [PR.NEW_WAR],
        showInPlanner: false
    },
    {
        id: PR.AMP_TIER1,
        label: "Amp: Tier 1 Parts (Quills)",
        category: "Systems",
        description: "Raplak/Pencha/Clapkra components. Requires The Quills rank 1 (Observer).",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.AMP_TIER2,
        label: "Amp: Tier 2 Parts (Quills)",
        category: "Systems",
        description: "Shwaak/Shraksun/Juttni components. Requires The Quills rank 2 (Adherent).",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK2]
    },
    {
        id: PR.AMP_TIER3,
        label: "Amp: Tier 3 Parts (Quills)",
        category: "Systems",
        description: "Granmu/Phahd/Lohrin components. Requires The Quills rank 3 (Instrument).",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK3]
    },
    {
        id: PR.AMP_TIER4,
        label: "Amp: Tier 4 Parts (Quills)",
        category: "Systems",
        description: "Propa/Klebrik/Certus components — best available from The Quills. Requires rank 4 (Architect).",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK4]
    },
    {
        id: PR.AMP_TIER5,
        label: "Amp: Tier 5 Parts (Vox Solaris)",
        category: "Systems",
        description: "Tier 5 scaffold / brace parts. Requires Vox Solaris rank 1 (Little Duck contact).",
        prerequisites: [PR.SYNDICATE_VOX_RANK1]
    },
    {
        id: PR.AMP_TIER6,
        label: "Amp: Tier 6 Parts (Vox Solaris)",
        category: "Systems",
        description: "Tier 6 components. Requires Vox Solaris rank 2 (Neutral).",
        prerequisites: [PR.SYNDICATE_VOX_RANK2]
    },
    {
        id: PR.AMP_TIER7,
        label: "Amp: Tier 7 Parts (Vox Solaris)",
        category: "Systems",
        description: "Best-in-slot Amp components. Requires Vox Solaris rank 3 (Mistral).",
        prerequisites: [PR.SYNDICATE_VOX_RANK3]
    },
    {
        id: PR.AMP_GILDING,
        label: "Amp Gilding Unlocked",
        category: "Systems",
        description: "Gild an Amp to boost base damage and unlock Lens slot. Requires Quills rank 3 (Instrument) or Vox Solaris rank 3.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK3]
    },

    // =========================================================================
    // COMPANION SYSTEMS
    // =========================================================================
    {
        id: PR.COMPANION_KUBROW,
        label: "Companion: Kubrow",
        category: "Systems",
        description: "Kubrow companion breeding. Requires Howl of the Kubrow quest and Incubator segment.",
        prerequisites: [PR.HOWL_KUBROW, PR.SEGMENT_INCUBATOR],
        showInPlanner: false
    },
    {
        id: PR.COMPANION_KAVAT,
        label: "Companion: Kavat",
        category: "Systems",
        description: "Kavat companion breeding. Requires Incubator segment and Kavat Genetic Codes (Mars Survival drops).",
        prerequisites: [PR.SEGMENT_INCUBATOR],
        showInPlanner: false
    },
    {
        id: PR.COMPANION_HELMINTH_CHARGER,
        label: "Companion: Helminth Charger",
        category: "Systems",
        description: "Infested companion grown from a Nidus Helminth cyst. Requires Incubator segment.",
        prerequisites: [PR.SEGMENT_INCUBATOR],
        showInPlanner: false
    },
    {
        id: PR.COMPANION_MOA,
        label: "Companion: MOA",
        category: "Systems",
        description: "Robotic MOA companion built in Fortuna. Requires Solaris United rank 1.",
        prerequisites: [PR.HUB_FORTUNA],
        showInPlanner: false
    },
    {
        id: PR.COMPANION_HOUND,
        label: "Companion: Hound",
        category: "Systems",
        description: "Obtained by keeping the Hound of a defeated Sister of Parvos.",
        prerequisites: [PR.CALL_TEMPESTARII],
        showInPlanner: false
    },
    {
        id: PR.COMPANION_PREDASITE,
        label: "Companion: Predasite",
        category: "Systems",
        description: "Deimos companion. Requires Necralisk access and Son's sister (Daughter).",
        prerequisites: [PR.HUB_NECRALISK],
        showInPlanner: false
    },
    {
        id: PR.COMPANION_VULPAPHYLA,
        label: "Companion: Vulpaphyla",
        category: "Systems",
        description: "Deimos fox companion. Requires Necralisk access and Son's sister (Daughter).",
        prerequisites: [PR.HUB_NECRALISK],
        showInPlanner: false
    },
    {
        id: PR.COMPANION_NAUTILUS,
        label: "Companion: Nautilus",
        category: "Systems",
        description: "Archwing companion. Blueprint obtained from the Rising Tide quest.",
        prerequisites: [PR.RISING_TIDE],
        showInPlanner: false
    },

    // =========================================================================
    // NECRAMECH — Additional Entries
    // =========================================================================
    {
        id: PR.NECRAMECH_VOIDRIG,
        label: "Necramech: Voidrig",
        category: "Necramech",
        description: "Gun-platform Necramech. Blueprints purchased via Necraloid standing.",
        prerequisites: [PR.NECRAMECH_UNLOCKED]
    },
    {
        id: PR.NECRAMECH_BONEWIDOW,
        label: "Necramech: Bonewidow",
        category: "Necramech",
        description: "Melee Necramech. Blueprints purchased via Necraloid standing.",
        prerequisites: [PR.NECRAMECH_UNLOCKED]
    },

    // =========================================================================
    // RAILJACK — Additional Entries
    // =========================================================================
    {
        id: PR.RAILJACK_INTRINSICS,
        label: "Railjack: Intrinsics",
        category: "Railjack",
        description: "Intrinsics skill tree (Tactical, Piloting, Gunnery, Engineering, Command). Unlocked on first Railjack mission.",
        prerequisites: [PR.RAILJACK_CONSTRUCTED]
    },
    {
        id: PR.RAILJACK_CORPUS_NODES,
        label: "Railjack: Corpus Proxima Nodes",
        category: "Railjack",
        description: "Venus, Neptune, and Pluto Proxima nodes. Unlocked by Call of the Tempestarii.",
        prerequisites: [PR.CALL_TEMPESTARII]
    },
    {
        id: PR.RAILJACK_VOID_STORMS,
        label: "Railjack: Void Storms",
        category: "Railjack",
        description: "Void Storm Fissure missions in Railjack. Unlocked by Call of the Tempestarii.",
        prerequisites: [PR.CALL_TEMPESTARII]
    },

    // =========================================================================
    // SYNDICATE RANK MILESTONES — The Quills
    // =========================================================================
    {
        id: PR.SYNDICATE_QUILLS_RANK1,
        validatedBySyndicate: { syndicateId: SY.THE_QUILLS, rank: 1 },
        label: "The Quills: Rank 1 (Observer)",
        category: "Syndicates",
        description: "Unlocks T1 Amp parts and triggers Mask of the Revenant. Requires The War Within and Saya's Vigil.",
        prerequisites: [PR.WAR_WITHIN, PR.SAYA_VIGIL]
    },
    {
        id: PR.SYNDICATE_QUILLS_RANK2,
        validatedBySyndicate: { syndicateId: SY.THE_QUILLS, rank: 2 },
        label: "The Quills: Rank 2 (Adherent)",
        category: "Syndicates",
        description: "Unlocks T2 Amp parts and Amp gilding.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.SYNDICATE_QUILLS_RANK3,
        validatedBySyndicate: { syndicateId: SY.THE_QUILLS, rank: 3 },
        label: "The Quills: Rank 3 (Instrument)",
        category: "Syndicates",
        description: "Unlocks T3 Amp parts.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK2]
    },
    {
        id: PR.SYNDICATE_QUILLS_RANK4,
        validatedBySyndicate: { syndicateId: SY.THE_QUILLS, rank: 4 },
        label: "The Quills: Rank 4 (Architect)",
        category: "Syndicates",
        description: "Unlocks T4 Amp parts — the best available from The Quills.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK3]
    },

    // =========================================================================
    // SYNDICATE RANK MILESTONES — Vox Solaris
    // =========================================================================
    {
        id: PR.SYNDICATE_VOX_RANK1,
        validatedBySyndicate: { syndicateId: SY.VOX_SOLARIS, rank: 1 },
        label: "Vox Solaris: Rank 1 (Little Duck Contact)",
        category: "Syndicates",
        description: "Unlocks T5 Amp parts. Requires Vox Solaris quest and Operator (The War Within).",
        prerequisites: [PR.VOX_SOLARIS, PR.WAR_WITHIN]
    },
    {
        id: PR.SYNDICATE_VOX_RANK2,
        validatedBySyndicate: { syndicateId: SY.VOX_SOLARIS, rank: 2 },
        label: "Vox Solaris: Rank 2 (Neutral)",
        category: "Syndicates",
        description: "Unlocks T6 Amp parts.",
        prerequisites: [PR.SYNDICATE_VOX_RANK1]
    },
    {
        id: PR.SYNDICATE_VOX_RANK3,
        validatedBySyndicate: { syndicateId: SY.VOX_SOLARIS, rank: 3 },
        label: "Vox Solaris: Rank 3 (Mistral)",
        category: "Syndicates",
        description: "Unlocks T7 Amp parts (best-in-slot) and Amp gilding.",
        prerequisites: [PR.SYNDICATE_VOX_RANK2]
    },
    {
        id: PR.SYNDICATE_VOX_RANK5,
        validatedBySyndicate: { syndicateId: SY.VOX_SOLARIS, rank: 5 },
        label: "Vox Solaris: Rank 5 (Old Mate)",
        category: "Syndicates",
        description: "Maximum Vox Solaris rank. Unlocks Profit-Taker Orb heist missions.",
        prerequisites: [PR.SYNDICATE_VOX_RANK3]
    },

];