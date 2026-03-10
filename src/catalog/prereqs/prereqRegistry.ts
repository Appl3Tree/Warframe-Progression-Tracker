// ===== FILE: src/catalog/prereqs/prereqRegistry.ts =====
//
// Comprehensive prerequisite definitions for every PR key in prereqIds.ts.
// Updated: 2026-03 — covers all content through The Hex / The Old Peace.
//
// IMPORTANT RULE:
// - Mastery Rank is NOT modeled as a prereq registry item.
//   MR_* keys in prereqIds.ts exist ONLY as condition values inside
//   PrereqCondition entries. They do not get their own PrereqDef rows.

import type { PrereqId } from "../../domain/ids/prereqIds";
import { PR } from "../../domain/ids/prereqIds";

export type PrereqCategory =
    | "Quests"
    | "SideQuests"
    | "Hubs"
    | "Systems"
    | "Segments"
    | "Focus"
    | "Amps"
    | "Companions"
    | "Necramech"
    | "Railjack"
    | "Activities"
    | "Syndicates";

/**
 * Structured prerequisite condition types.
 * Used by the reason trace system to surface human-readable explanations.
 */
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
        case "mastery_rank":     return `Mastery Rank ${cond.value} required`;
        case "quest_complete":   return `Quest complete: ${cond.prereqId}`;
        case "junction_complete": return `Junction complete: ${cond.junctionId}`;
        case "node_complete":    return `Node complete: ${cond.nodeId}`;
        case "planet_unlock":    return `Planet unlocked: ${cond.planetId}`;
        case "syndicate_rank":   return `${cond.syndicateId} rank ${cond.rank} required`;
        case "item_owned":       return `Item owned: ${cond.catalogId}`;
        case "resource_owned":   return `${cond.quantity}x ${cond.catalogId} required`;
    }
}

export interface PrereqDef {
    id: PrereqId;
    label: string;
    category: PrereqCategory;
    description: string;
    prerequisites: PrereqId[];
    conditions?: PrereqCondition[];
}

export const PREREQ_REGISTRY: PrereqDef[] = [

    // =========================================================================
    // MAIN STORY QUESTS — Arc 1
    // =========================================================================
    {
        id: PR.VORS_PRIZE,
        label: "Vor's Prize",
        category: "Quests",
        description: "Forced tutorial quest. Installs all base Orbiter segments and opens the star chart.",
        prerequisites: []
    },
    {
        id: PR.THE_TEACHER,
        label: "The Teacher",
        category: "Quests",
        description: "Modding tutorial quest (Update 40, Oct 2025). Introduces the modding system.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.ONCE_AWAKE,
        label: "Once Awake",
        category: "Quests",
        description: "Mercury Grineer story arc. First post-tutorial quest.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.ARCHWING,
        label: "The Archwing",
        category: "Quests",
        description: "Unlocks Archwing gear, crafting, and Archwing mission nodes.",
        prerequisites: [PR.ONCE_AWAKE, PR.JUNCTION_VENUS_EARTH]
    },
    {
        id: PR.STOLEN_DREAMS,
        label: "Stolen Dreams",
        category: "Quests",
        description: "Unlocks Cephalon Simaris relay scanner and Synthesis standing. Requires Mars access.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.NEW_STRANGE,
        label: "The New Strange",
        category: "Quests",
        description: "Unlocks Simaris standing grind and awards Chroma blueprint. Requires Stolen Dreams.",
        prerequisites: [PR.STOLEN_DREAMS, PR.JUNCTION_MARS_CERES]
    },
    {
        id: PR.NATAH,
        label: "Natah",
        category: "Quests",
        description: "Gatekeeper quest to The Second Dream. Requires Pluto access.",
        prerequisites: [PR.NEW_STRANGE, PR.JUNCTION_NEPTUNE_PLUTO]
    },

    // =========================================================================
    // MAIN STORY QUESTS — Arc 2
    // =========================================================================
    {
        id: PR.SECOND_DREAM,
        label: "The Second Dream",
        category: "Quests",
        description: "Unlocks Operator mode and the Focus system (partial — 2 passives per school). Major turning point.",
        prerequisites: [PR.NATAH]
    },
    {
        id: PR.WAR_WITHIN,
        label: "The War Within",
        category: "Quests",
        description: "Expands Operator to full Transference + Void powers. Unlocks Kuva Fortress, Sorties, and the full Focus tree. Requires Sedna junction.",
        prerequisites: [PR.SECOND_DREAM, PR.JUNCTION_PLUTO_SEDNA],
        conditions: [{ type: "mastery_rank", value: 5 }]
    },
    {
        id: PR.CHAINS_HARROW,
        label: "Chains of Harrow",
        category: "Quests",
        description: "Awards Harrow blueprint. Red Veil lore continuation. Requires Sedna access.",
        prerequisites: [PR.WAR_WITHIN, PR.JUNCTION_PLUTO_SEDNA]
    },
    {
        id: PR.APOSTASY,
        label: "Apostasy Prologue",
        category: "Quests",
        description: "Short cinematic quest. Requires Personal Quarters Orbiter segment (War Within reward).",
        prerequisites: [PR.CHAINS_HARROW, PR.SEGMENT_PERSONAL_QUARTERS]
    },
    {
        id: PR.SACRIFICE,
        label: "The Sacrifice",
        category: "Quests",
        description: "Awards Excalibur Umbra. Bridges arc 2 into arc 3.",
        prerequisites: [PR.APOSTASY]
    },

    // =========================================================================
    // MAIN STORY QUESTS — Arc 3
    // =========================================================================
    {
        id: PR.CHIMERA_PROLOGUE,
        label: "Chimera Prologue",
        category: "Quests",
        description: "Short cinematic post-Sacrifice. Required to unlock Erra.",
        prerequisites: [PR.SACRIFICE]
    },
    {
        id: PR.ERRA,
        label: "Erra",
        category: "Quests",
        description: "Short cinematic. Required to unlock Prelude to War.",
        prerequisites: [PR.CHIMERA_PROLOGUE]
    },
    {
        id: PR.PRELUDE_TO_WAR,
        label: "Prelude to War",
        category: "Quests",
        description: "Series of mini-quests leading into The New War. Requires Erra.",
        prerequisites: [PR.ERRA]
    },
    {
        id: PR.NEW_WAR,
        label: "The New War",
        category: "Quests",
        description: "Major story milestone. Unlocks Zariman, Veilbreaker, and Jade Shadows. Requires Railjack and Necramech.",
        prerequisites: [PR.PRELUDE_TO_WAR, PR.RAILJACK_CONSTRUCTED, PR.NECRAMECH_UNLOCKED]
    },
    {
        id: PR.JADE_SHADOWS,
        label: "Jade Shadows",
        category: "Quests",
        description: "Awards Jade Warframe blueprint. Can run concurrently with Duviri content.",
        prerequisites: [PR.NEW_WAR]
    },

    // =========================================================================
    // MAIN STORY QUESTS — Arc 4
    // =========================================================================
    {
        id: PR.DUVIRI_PARADOX,
        label: "The Duviri Paradox",
        category: "Quests",
        description: "Unlocks The Circuit, Drifter Intrinsics, and Incarnon Genesis adapters. Alternate entry available from The Second Dream. Required for The Hex.",
        prerequisites: [PR.JUNCTION_SATURN_URANUS]
    },

    // =========================================================================
    // MAIN STORY QUESTS — Arc 5
    // =========================================================================
    {
        id: PR.ANGELS_ZARIMAN,
        label: "Angels of the Zariman",
        category: "Quests",
        description: "Unlocks Zariman hub, Holdfasts syndicate, and Incarnon weapons. Requires The New War.",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.WHISPERS_WALL,
        label: "Whispers in the Walls",
        category: "Quests",
        description: "Unlocks Sanctum Anatomica, Netracells, and the Cavia syndicate. Requires Angels of the Zariman and Heart of Deimos.",
        prerequisites: [PR.ANGELS_ZARIMAN, PR.HEART_OF_DEIMOS]
    },
    {
        id: PR.THE_LOTUS_EATERS,
        label: "The Lotus Eaters",
        category: "Quests",
        description: "Prologue to The Hex. Required to access 1999 content.",
        prerequisites: [PR.WHISPERS_WALL]
    },
    {
        id: PR.THE_HEX,
        label: "The Hex",
        category: "Quests",
        description: "Unlocks Höllvania / 1999 hub and The Hex faction. Requires both Lotus Eaters and Duviri Paradox.",
        prerequisites: [PR.THE_LOTUS_EATERS, PR.DUVIRI_PARADOX]
    },

    // =========================================================================
    // MAIN STORY QUESTS — Arc 6
    // =========================================================================
    {
        id: PR.THE_OLD_PEACE,
        label: "The Old Peace",
        category: "Quests",
        description: "⚠️ Update 41 (Dec 2025) — verify prereq chain. Unlocks Dark Refractory / Descendia content. Tentatively requires The Lotus Eaters.",
        prerequisites: [PR.THE_LOTUS_EATERS]
    },

    // =========================================================================
    // SIDE QUESTS — Feature Gates
    // =========================================================================
    {
        id: PR.HOWL_KUBROW,
        label: "Howl of the Kubrow",
        category: "SideQuests",
        description: "Unlocks Kubrow companion breeding and the Incubator segment. No hard story prereq.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SAYA_VIGIL,
        label: "Saya's Vigil",
        category: "SideQuests",
        description: "Unlocks Gara blueprint. Combined with The War Within, also unlocks The Quills. Requires one Cetus Bounty completed.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.VOX_SOLARIS,
        label: "Vox Solaris",
        category: "SideQuests",
        description: "Unlocks Vox Solaris syndicate and Orb Vallis. Auto-starts on first Fortuna visit.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.HEART_OF_DEIMOS,
        label: "Heart of Deimos",
        category: "SideQuests",
        description: "Unlocks Necralisk, Cambion Drift, and the Entrati syndicate. Requires Mars-Deimos junction.",
        prerequisites: [PR.JUNCTION_MARS_DEIMOS]
    },
    {
        id: PR.RISING_TIDE,
        label: "Rising Tide",
        category: "SideQuests",
        description: "Unlocks Railjack construction. Requires The War Within.",
        prerequisites: [PR.WAR_WITHIN]
    },
    {
        id: PR.VEILBREAKER,
        label: "Veilbreaker",
        category: "SideQuests",
        description: "Unlocks Kahl's Garrison and Archon Hunts. Requires The New War.",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.CALL_TEMPESTARII,
        label: "Call of the Tempestarii",
        category: "SideQuests",
        description: "Unlocks Sisters of Parvos system and Railjack Corpus Proxima nodes. Requires Rising Tide.",
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
    // SIDE QUESTS — Warframe Blueprint Quests
    // =========================================================================
    {
        id: PR.LIMBO_THEOREM,
        label: "The Limbo Theorem",
        category: "SideQuests",
        description: "Awards Limbo blueprint. Parts drop from Orokin Void enemies. Requires Void access.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.SILVER_GROVE,
        label: "The Silver Grove",
        category: "SideQuests",
        description: "Awards Titania blueprint. Requires Cetus access, MR7, and talking to New Loka at a Relay.",
        prerequisites: [PR.HUB_CETUS, PR.HUB_RELAY],
        conditions: [{ type: "mastery_rank", value: 7 }]
    },
    {
        id: PR.SANDS_INAROS,
        label: "Sands of Inaros",
        category: "SideQuests",
        description: "Awards Inaros blueprint. Quest beacon must be purchased from Baro Ki'Teer.",
        prerequisites: [PR.HUB_RELAY]
    },
    {
        id: PR.OCTAVIA_ANTHEM,
        label: "Octavia's Anthem",
        category: "SideQuests",
        description: "Awards Octavia blueprint. Requires Earth-Lua junction (unlocks after The Second Dream).",
        prerequisites: [PR.JUNCTION_EARTH_LUA]
    },
    {
        id: PR.JORDAS_PRECEPT,
        label: "The Jordas Precept",
        category: "SideQuests",
        description: "Awards Atlas blueprint. Requires Archwing and Eris access.",
        prerequisites: [PR.ARCHWING, PR.JUNCTION_SEDNA_ERIS]
    },
    {
        id: PR.GLAST_GAMBIT,
        label: "The Glast Gambit",
        category: "SideQuests",
        description: "Awards Nidus blueprint. Requires Eris and Infested Salvage node access.",
        prerequisites: [PR.JUNCTION_SEDNA_ERIS]
    },
    {
        id: PR.MASK_REVENANT,
        label: "Mask of the Revenant",
        category: "SideQuests",
        description: "Awards Revenant blueprint. Requires Cetus access and Quills rank 1 (Observer).",
        prerequisites: [PR.HUB_CETUS, PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.HIDDEN_MESSAGES,
        label: "Hidden Messages",
        category: "SideQuests",
        description: "Awards Mirage blueprint. Requires Saturn access (cipher solving in missions).",
        prerequisites: [PR.JUNCTION_EUROPA_SATURN]
    },
    {
        id: PR.PATIENT_ZERO,
        label: "Patient Zero",
        category: "SideQuests",
        description: "Unlocks Infested Salvage mission node and awards Mesa blueprint. Requires Eris access.",
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
        description: "Unlocks Earth and the Grineer Forest tileset.",
        prerequisites: [PR.JUNCTION_MERCURY_VENUS]
    },
    {
        id: PR.JUNCTION_EARTH_MARS,
        label: "Junction: Earth → Mars",
        category: "Systems",
        description: "Unlocks Mars and core mid-game content.",
        prerequisites: [PR.VORS_PRIZE, PR.JUNCTION_VENUS_EARTH]
    },
    {
        id: PR.JUNCTION_MARS_PHOBOS,
        label: "Junction: Mars → Phobos",
        category: "Systems",
        description: "Unlocks Phobos.",
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
        description: "Unlocks Deimos / Cambion Drift access. Required for Heart of Deimos.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.JUNCTION_PHOBOS_CERES,
        label: "Junction: Phobos → Ceres",
        category: "Systems",
        description: "Alternate Ceres path via Phobos.",
        prerequisites: [PR.JUNCTION_MARS_PHOBOS]
    },
    {
        id: PR.JUNCTION_CERES_JUPITER,
        label: "Junction: Ceres → Jupiter",
        category: "Systems",
        description: "Unlocks Jupiter and Ropalolyst assassination node.",
        prerequisites: [PR.JUNCTION_PHOBOS_CERES]
    },
    {
        id: PR.JUNCTION_JUPITER_EUROPA,
        label: "Junction: Jupiter → Europa",
        category: "Systems",
        description: "Unlocks Europa and Corpus ice tileset.",
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
        description: "Unlocks Uranus. Required for Duviri Paradox.",
        prerequisites: [PR.JUNCTION_EUROPA_SATURN, PR.STOLEN_DREAMS]
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
        description: "Unlocks Sedna and Grineer Galleon endgame content. Required for The War Within.",
        prerequisites: [PR.JUNCTION_NEPTUNE_PLUTO]
    },
    {
        id: PR.JUNCTION_SEDNA_ERIS,
        label: "Junction: Sedna → Eris",
        category: "Systems",
        description: "Unlocks Eris and Infested content including Nidus and Atlas quests.",
        prerequisites: [PR.JUNCTION_PLUTO_SEDNA, PR.NEW_STRANGE]
    },
    {
        id: PR.JUNCTION_EARTH_LUA,
        label: "Junction: Earth → Lua",
        category: "Systems",
        description: "Unlocks Lua (the Moon). Available after The Second Dream. Required for Octavia's Anthem.",
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
        id: PR.HUB_CETUS,
        label: "Cetus (Plains of Eidolon) Access",
        category: "Hubs",
        description: "You can enter Cetus and the Plains of Eidolon. Gates Ostron, The Quills, and Eidolon hunts.",
        prerequisites: [PR.SAYA_VIGIL]
    },
    {
        id: PR.HUB_FORTUNA,
        label: "Fortuna (Orb Vallis) Access",
        category: "Hubs",
        description: "You can enter Fortuna and Orb Vallis. Gates Solaris United, Vox Solaris, and Profit-Taker.",
        prerequisites: [PR.VOX_SOLARIS]
    },
    {
        id: PR.HUB_NECRALISK,
        label: "Necralisk (Deimos) Access",
        category: "Hubs",
        description: "You can enter the Necralisk on Deimos. Gates Entrati, Necraloid, and the Helminth segment.",
        prerequisites: [PR.HEART_OF_DEIMOS]
    },
    {
        id: PR.HUB_ZARIMAN,
        label: "Zariman (Chrysalith) Access",
        category: "Hubs",
        description: "You can enter the Chrysalith. Gates Holdfasts syndicate and Zariman mission types.",
        prerequisites: [PR.ANGELS_ZARIMAN]
    },
    {
        id: PR.HUB_SANCTUM,
        label: "Sanctum Anatomica Access",
        category: "Hubs",
        description: "You can enter Sanctum Anatomica. Gates Cavia syndicate and Deep Archimedea.",
        prerequisites: [PR.WHISPERS_WALL, PR.HUB_NECRALISK]
    },
    {
        id: PR.HUB_HOLLVANIA,
        label: "Höllvania Central Mall Access",
        category: "Hubs",
        description: "You can enter Höllvania / 1999 hub. Gates The Hex faction and 1999 content.",
        prerequisites: [PR.THE_HEX]
    },
    {
        id: PR.HUB_RELAY,
        label: "Any Relay Access",
        category: "Hubs",
        description: "You can visit a Relay. Gates the six primary syndicates, Cephalon Simaris, Baro Ki'Teer, and Conclave.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.HUB_DRIFTERS_CAMP,
        label: "Drifter's Camp Access",
        category: "Hubs",
        description: "Access to Kahl's Garrison missions in the Drifter's Camp. Requires The New War.",
        prerequisites: [PR.NEW_WAR]
    },

    // =========================================================================
    // ORBITER SEGMENTS
    // =========================================================================
    {
        id: PR.SEGMENT_ARSENAL,
        label: "Orbiter: Arsenal",
        category: "Segments",
        description: "Arsenal segment. Installed by default via Vor's Prize. Required to equip loadouts.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_COMMUNICATIONS,
        label: "Orbiter: Communications",
        category: "Segments",
        description: "Communications segment. Installed by Vor's Prize. Required for mission alerts and syndicate missions.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_CODEX_SCANNER,
        label: "Orbiter: Codex Scanner",
        category: "Segments",
        description: "Codex segment. Installed by Vor's Prize. Required to scan enemies and track quests.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_FOUNDRY,
        label: "Orbiter: Foundry",
        category: "Segments",
        description: "Foundry segment. Installed by Vor's Prize. Required to craft all items.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_MODDING,
        label: "Orbiter: Modding Table",
        category: "Segments",
        description: "Modding workbench. Installed by Vor's Prize. Required to mod all gear.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.SEGMENT_INCUBATOR,
        label: "Orbiter: Incubator Segment",
        category: "Segments",
        description: "Companion incubation bay. Granted by a Junction reward. Required for Kubrow and Kavat breeding.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.SEGMENT_VOID_RELIC,
        label: "Orbiter: Void Relic Segment",
        category: "Segments",
        description: "Void Relic refinement and management. Required to crack Void Fissures.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.SEGMENT_PERSONAL_QUARTERS,
        label: "Orbiter: Personal Quarters Segment",
        category: "Segments",
        description: "Personal Quarters. Awarded by The War Within. Required to trigger Apostasy Prologue.",
        prerequisites: [PR.WAR_WITHIN]
    },
    {
        id: PR.SEGMENT_MELEE_UPGRADE,
        label: "Orbiter: Melee Upgrade Segment",
        category: "Segments",
        description: "Unlocks Melee Exilus and Melee Arcane slots (Tennokai system). Awarded by Whispers in the Walls.",
        prerequisites: [PR.WHISPERS_WALL]
    },

    // ---- Helminth Sub-Segments ----
    {
        id: PR.SEGMENT_HELMINTH,
        label: "Helminth Segment (Base)",
        category: "Segments",
        description: "Base Helminth subsume system. Purchased from Son for 15,000 Standing. Requires MR8 + Entrati rank 3 (Associate) + Heart of Deimos.",
        prerequisites: [PR.HUB_NECRALISK, PR.SYNDICATE_ENTRATI_RANK3],
        conditions: [{ type: "mastery_rank", value: 8 }]
    },
    {
        id: PR.SEGMENT_HELMINTH_INVIGORATION,
        label: "Helminth Segment: Invigorations",
        category: "Segments",
        description: "Unlocks weekly Invigoration buffs for Warframes. Purchased from Son for 30,000 Standing. Requires MR8 + Entrati rank 5 (Family).",
        prerequisites: [PR.SEGMENT_HELMINTH, PR.SYNDICATE_ENTRATI_RANK5],
        conditions: [{ type: "mastery_rank", value: 8 }]
    },
    {
        id: PR.SEGMENT_HELMINTH_ARCHON_SHARD,
        label: "Helminth Segment: Archon Shards",
        category: "Segments",
        description: "Unlocks Archon Shard socketing into Warframes. Blueprint rewarded by completing Veilbreaker quest.",
        prerequisites: [PR.SEGMENT_HELMINTH, PR.VEILBREAKER]
    },
    {
        id: PR.SEGMENT_HELMINTH_COALESCENT,
        label: "Helminth Segment: Coalescent",
        category: "Segments",
        description: "Unlocks Archon Shard fusion to create Tauforged shards. Purchased from Bird 3 (Cavia). Requires Cavia rank 2 (Researcher).",
        prerequisites: [PR.SEGMENT_HELMINTH_ARCHON_SHARD, PR.HUB_SANCTUM, PR.SYNDICATE_CAVIA_RANK2]
    },

    // =========================================================================
    // FOCUS / OPERATOR SYSTEM
    // =========================================================================
    {
        id: PR.FOCUS_UNLOCKED,
        label: "Focus System Unlocked",
        category: "Focus",
        description: "Operator Focus passives available (2 per school). Unlocked by completing The Second Dream.",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.FOCUS_FULL,
        label: "Full Focus Trees Unlocked",
        category: "Focus",
        description: "All 10 Ways per Focus school are unlockable. Requires The War Within + Saya's Vigil + visiting The Quills.",
        prerequisites: [PR.WAR_WITHIN, PR.SAYA_VIGIL, PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.FOCUS_SCHOOL_ZENURIK,
        label: "Focus School: Zenurik",
        category: "Focus",
        description: "Energy regeneration school. Most popular for energy sustain in non-Duviri content. One school is chosen at the end of The Second Dream; others cost 50,000 Focus each.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.FOCUS_SCHOOL_VAZARIN,
        label: "Focus School: Vazarin",
        category: "Focus",
        description: "Healing and Operator survival school. Provides Void Radiance for instant healing of allies.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.FOCUS_SCHOOL_NARAMON,
        label: "Focus School: Naramon",
        category: "Focus",
        description: "Melee combo and Shadow Step school. Popular for melee-focused builds.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.FOCUS_SCHOOL_UNAIRU,
        label: "Focus School: Unairu",
        category: "Focus",
        description: "Defense stripping and armor break school. Strong in Steel Path and Eidolon hunts.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },
    {
        id: PR.FOCUS_SCHOOL_MADURAI,
        label: "Focus School: Madurai",
        category: "Focus",
        description: "Damage amp and Void Strike school. The primary Eidolon hunting Focus school.",
        prerequisites: [PR.FOCUS_UNLOCKED]
    },

    // =========================================================================
    // AMP SYSTEM
    // =========================================================================
    {
        id: PR.AMP_MOTE,
        label: "Amp: Mote (Starter)",
        category: "Amps",
        description: "Default starter Amp. Available after visiting Quill Onkko at Cetus post-War Within.",
        prerequisites: [PR.WAR_WITHIN, PR.HUB_CETUS]
    },
    {
        id: PR.AMP_SIROCCO,
        label: "Amp: Sirocco",
        category: "Amps",
        description: "Pre-built Amp awarded by The New War. Equivalent to a solid T3 build.",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.AMP_TIER1,
        label: "Amp: Tier 1 Parts (Raplak / Pencha / Clapkra)",
        category: "Amps",
        description: "First craftable Amp parts from The Quills. Requires Quills rank 1 (Observer).",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.AMP_TIER2,
        label: "Amp: Tier 2 Parts (Shwaak / Shraksun / Juttni)",
        category: "Amps",
        description: "Second tier Amp parts. Requires Quills rank 2 (Adherent).",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK2]
    },
    {
        id: PR.AMP_TIER3,
        label: "Amp: Tier 3 Parts (Granmu / Phahd / Lohrin)",
        category: "Amps",
        description: "Third tier Amp parts. Requires Quills rank 3 (Instrument).",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK3]
    },
    {
        id: PR.AMP_TIER4,
        label: "Amp: Tier 4 Parts (Propa / Klebrik / Certus)",
        category: "Amps",
        description: "Best Amp parts from The Quills. Requires Quills rank 4 (Architect). Propa scaffold is highly recommended for Eidolon hunts.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK4]
    },
    {
        id: PR.AMP_TIER5,
        label: "Amp: Tier 5 Parts (Vox Solaris)",
        category: "Amps",
        description: "T5 Amp components from Vox Solaris. Requires Vox Solaris rank 1.",
        prerequisites: [PR.SYNDICATE_VOX_RANK1]
    },
    {
        id: PR.AMP_TIER6,
        label: "Amp: Tier 6 Parts (Vox Solaris)",
        category: "Amps",
        description: "T6 Amp components from Vox Solaris. Requires Vox Solaris rank 2.",
        prerequisites: [PR.SYNDICATE_VOX_RANK2]
    },
    {
        id: PR.AMP_TIER7,
        label: "Amp: Tier 7 Parts (Vox Solaris — Best-in-Slot)",
        category: "Amps",
        description: "Highest tier Amp components from Vox Solaris. Requires Vox Solaris rank 3 (Mistral). Best-in-slot for endgame Operator builds.",
        prerequisites: [PR.SYNDICATE_VOX_RANK3]
    },
    {
        id: PR.AMP_GILDING,
        label: "Amp: Gilding Unlocked",
        category: "Amps",
        description: "Gild an Amp to boost its base stats and unlock a Focus Lens slot. Requires Quills rank 3 or Vox Solaris rank 3.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK3]
    },

    // =========================================================================
    // COMPANION SYSTEMS
    // =========================================================================
    {
        id: PR.COMPANION_KUBROW,
        label: "Companion: Kubrow Breeding",
        category: "Companions",
        description: "Breed Kubrow companions using the Incubator. Requires Howl of the Kubrow quest + Incubator segment.",
        prerequisites: [PR.HOWL_KUBROW, PR.SEGMENT_INCUBATOR]
    },
    {
        id: PR.COMPANION_KAVAT,
        label: "Companion: Kavat Breeding",
        category: "Companions",
        description: "Breed Kavat companions. Requires Incubator segment and Kavat Genetic Code (drops from Mars Survival).",
        prerequisites: [PR.SEGMENT_INCUBATOR]
    },
    {
        id: PR.COMPANION_HELMINTH_CHARGER,
        label: "Companion: Helminth Charger",
        category: "Companions",
        description: "Breed a Helminth Charger from a Nidus Helminth cyst. Requires Nidus (get infected or contract from another player) + Incubator segment.",
        prerequisites: [PR.SEGMENT_INCUBATOR]
    },
    {
        id: PR.COMPANION_MOA,
        label: "Companion: MOA (Robotic)",
        category: "Companions",
        description: "Build a custom MOA companion in Fortuna. Requires Solaris United rank 1 (Neutral).",
        prerequisites: [PR.HUB_FORTUNA]
    },
    {
        id: PR.COMPANION_HOUND,
        label: "Companion: Hound",
        category: "Companions",
        description: "Keep the Hound companion from a defeated Sister of Parvos. Requires completing the Sister of Parvos system.",
        prerequisites: [PR.ACTIVITY_SISTER_PARVOS]
    },
    {
        id: PR.COMPANION_PREDASITE,
        label: "Companion: Predasite",
        category: "Companions",
        description: "Deimos companion. Acquired through the Daughter (Son's sister) at the Necralisk.",
        prerequisites: [PR.HUB_NECRALISK]
    },
    {
        id: PR.COMPANION_VULPAPHYLA,
        label: "Companion: Vulpaphyla",
        category: "Companions",
        description: "Deimos fox companion. Acquired through the Daughter at the Necralisk.",
        prerequisites: [PR.HUB_NECRALISK]
    },
    {
        id: PR.COMPANION_NAUTILUS,
        label: "Companion: Nautilus (Archwing)",
        category: "Companions",
        description: "Archwing sentinel companion. Blueprint obtained by completing Rising Tide quest.",
        prerequisites: [PR.RISING_TIDE]
    },

    // =========================================================================
    // NECRAMECH SYSTEM
    // =========================================================================
    {
        id: PR.NECRAMECH_UNLOCKED,
        label: "Necramech: System Unlocked",
        category: "Necramech",
        description: "You can deploy a Necramech in open worlds and Railjack missions. Requires Heart of Deimos. Craft Voidrig or Bonewidow via Necraloid standing.",
        prerequisites: [PR.HEART_OF_DEIMOS, PR.HUB_NECRALISK]
    },
    {
        id: PR.NECRAMECH_VOIDRIG,
        label: "Necramech: Voidrig",
        category: "Necramech",
        description: "Gunner Necramech (Storm Shroud + Arquebex). Chassis parts from Necraloid standing. Recommended for Eidolon hunts.",
        prerequisites: [PR.NECRAMECH_UNLOCKED]
    },
    {
        id: PR.NECRAMECH_BONEWIDOW,
        label: "Necramech: Bonewidow",
        category: "Necramech",
        description: "Melee Necramech (Meathook + Ironbride). Chassis parts from Necraloid standing.",
        prerequisites: [PR.NECRAMECH_UNLOCKED]
    },

    // =========================================================================
    // RAILJACK SYSTEM
    // =========================================================================
    {
        id: PR.RAILJACK_CONSTRUCTED,
        label: "Railjack: Ship Constructed",
        category: "Railjack",
        description: "Your Railjack is built and ready for missions. Completing Rising Tide quest constructs it.",
        prerequisites: [PR.RISING_TIDE]
    },
    {
        id: PR.RAILJACK_INTRINSICS,
        label: "Railjack: Intrinsics Skill Tree",
        category: "Railjack",
        description: "Railjack Intrinsics (Piloting, Gunnery, Tactical, Engineering, Command) unlock on first Railjack mission.",
        prerequisites: [PR.RAILJACK_CONSTRUCTED]
    },
    {
        id: PR.RAILJACK_CORPUS_NODES,
        label: "Railjack: Corpus Proxima Nodes",
        category: "Railjack",
        description: "Corpus Proxima Railjack nodes. Unlocked by completing Call of the Tempestarii.",
        prerequisites: [PR.CALL_TEMPESTARII]
    },
    {
        id: PR.RAILJACK_VOID_STORMS,
        label: "Railjack: Void Storms",
        category: "Railjack",
        description: "Void Storm Fissures in Railjack missions. Unlocked by completing Call of the Tempestarii.",
        prerequisites: [PR.CALL_TEMPESTARII]
    },

    // =========================================================================
    // ENDGAME ACTIVITIES
    // =========================================================================

    // ---- Daily ----
    {
        id: PR.ACTIVITY_SORTIES,
        label: "Sorties",
        category: "Activities",
        description: "Daily 3-mission Sorties with modifier stacking. Requires The War Within, MR5, and a rank-30 Warframe.",
        prerequisites: [PR.WAR_WITHIN],
        conditions: [{ type: "mastery_rank", value: 5 }]
    },
    {
        id: PR.ACTIVITY_EIDOLON_TERALYST,
        label: "Eidolon Hunts: Teralyst (1-cap)",
        category: "Activities",
        description: "Eidolon Teralyst fight on the Plains at night. Accessible with any Amp. Effective soloing requires T2+ Amp and Operator arcanes.",
        prerequisites: [PR.HUB_CETUS, PR.AMP_MOTE]
    },
    {
        id: PR.ACTIVITY_EIDOLON_TRIDOLON,
        label: "Eidolon Hunts: Tridolon (3-cap)",
        category: "Activities",
        description: "Full Teralyst + Gantulyst + Hydrolyst hunt in a single night cycle. Recommended: T4 Amp (Propa), Madurai school, rank-30 Warframe, and Necramech.",
        prerequisites: [PR.ACTIVITY_EIDOLON_TERALYST, PR.AMP_TIER4]
    },
    {
        id: PR.ACTIVITY_ROPALOLYST,
        label: "Ropalolyst",
        category: "Activities",
        description: "Jupiter assassination boss. Unique fight using Operator abilities. Requires New Strange + Jupiter junction cleared.",
        prerequisites: [PR.NEW_STRANGE, PR.JUNCTION_CERES_JUPITER]
    },

    // ---- Weekly ----
    {
        id: PR.ACTIVITY_ARCHON_HUNTS,
        label: "Archon Hunts",
        category: "Activities",
        description: "Weekly 3-stage Archon fight. Awards Archon Shards. Requires Veilbreaker quest and a rank-30 Warframe.",
        prerequisites: [PR.VEILBREAKER]
    },
    {
        id: PR.ACTIVITY_KAHL_BREAK_NARMER,
        label: "Kahl's Break Narmer (Weekly)",
        category: "Activities",
        description: "Weekly Kahl missions in the Drifter's Camp. Awards Stock currency for Garrison shop. Requires Veilbreaker.",
        prerequisites: [PR.VEILBREAKER, PR.HUB_DRIFTERS_CAMP]
    },
    {
        id: PR.ACTIVITY_NETRACELLS,
        label: "Netracells (Weekly)",
        category: "Activities",
        description: "Up to 5 weekly Netracell runs in Sanctum Anatomica. Awards Archon Shards and Orokin Matrices. Requires Whispers in the Walls.",
        prerequisites: [PR.WHISPERS_WALL, PR.HUB_SANCTUM]
    },
    {
        id: PR.ACTIVITY_ARBITRATIONS,
        label: "Arbitrations",
        category: "Activities",
        description: "Endless endgame missions with instant-death mechanic and drones. Requires completing the Pluto-Eris junction task (all nodes in the path). Rank-30 Warframe required.",
        prerequisites: [PR.JUNCTION_SEDNA_ERIS]
    },
    {
        id: PR.ACTIVITY_DEEP_ARCHIMEDEA,
        label: "Deep Archimedea",
        category: "Activities",
        description: "Elite weekly endgame activity with heavy restrictions. Requires Whispers in the Walls and Cavia rank 5 (Family).",
        prerequisites: [PR.WHISPERS_WALL, PR.SYNDICATE_CAVIA_RANK5]
    },

    // ---- Open World Bounties ----
    {
        id: PR.ACTIVITY_CETUS_BOUNTIES,
        label: "Cetus Bounties (Plains of Eidolon)",
        category: "Activities",
        description: "Tiered bounty missions on the Plains of Eidolon. Primary source of Quills standing and Eidolon Lens blueprints.",
        prerequisites: [PR.HUB_CETUS]
    },
    {
        id: PR.ACTIVITY_FORTUNA_BOUNTIES,
        label: "Fortuna Bounties (Orb Vallis)",
        category: "Activities",
        description: "Tiered bounty missions on Orb Vallis. Primary source of Vox Solaris standing and K-Drive parts.",
        prerequisites: [PR.HUB_FORTUNA]
    },
    {
        id: PR.ACTIVITY_DEIMOS_BOUNTIES,
        label: "Cambion Drift Bounties (Deimos)",
        category: "Activities",
        description: "Tiered bounty missions on Cambion Drift. Source of Entrati and Necraloid standing.",
        prerequisites: [PR.HUB_NECRALISK]
    },
    {
        id: PR.ACTIVITY_ZARIMAN_BOUNTIES,
        label: "Zariman Missions (Chrysalith)",
        category: "Activities",
        description: "Mission types include Void Flood, Void Cascade, Exterminate, and Conjunction Survival. Primary source of Holdfasts standing and Incarnon weapons.",
        prerequisites: [PR.HUB_ZARIMAN]
    },
    {
        id: PR.ACTIVITY_CAVIA_BOUNTIES,
        label: "Sanctum Anatomica Bounties",
        category: "Activities",
        description: "Bounty missions for the Cavia syndicate. Source of Cavia standing and Orokin Matrix resources.",
        prerequisites: [PR.HUB_SANCTUM]
    },

    // ---- Open World Bosses ----
    {
        id: PR.ACTIVITY_PROFIT_TAKER,
        label: "Profit-Taker Orb Heist",
        category: "Activities",
        description: "Fortuna 4-phase Orb Vallis heist boss. Requires Vox Solaris rank 5 (Old Mate) and Archwing for phase 4.",
        prerequisites: [PR.SYNDICATE_VOX_RANK5, PR.ARCHWING]
    },
    {
        id: PR.ACTIVITY_EXPLOITER_ORB,
        label: "Exploiter Orb",
        category: "Activities",
        description: "Thermia-triggered Orb Vallis fight inside the Temple of Profit. Requires Fortuna access. Thermia Fractures must be active (world event).",
        prerequisites: [PR.HUB_FORTUNA]
    },

    // ---- Steel Path ----
    {
        id: PR.ACTIVITY_STEEL_PATH,
        label: "Steel Path",
        category: "Activities",
        description: "Remixed star chart with +100 armour/shield/health scaling and +25% drop rate. Requires clearing all nodes up through The New War. (Zariman/Sanctum/Hollvania NOT required as of Hotfix 38.5.3.)",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.ACTIVITY_STEEL_PATH_HONORS,
        label: "Steel Path Honors (Teshin's Shop)",
        category: "Activities",
        description: "Weekly rotating shop from Teshin at any Relay. Buy cosmetics, Arcanes, and more with Steel Essence.",
        prerequisites: [PR.ACTIVITY_STEEL_PATH, PR.HUB_RELAY]
    },
    {
        id: PR.ACTIVITY_CIRCUIT_STEEL_PATH,
        label: "The Circuit: Steel Path",
        category: "Activities",
        description: "Steel Path variant of The Circuit. Required to earn Incarnon Genesis adapters for Steel Path weapons.",
        prerequisites: [PR.DUVIRI_PARADOX, PR.ACTIVITY_STEEL_PATH]
    },

    // ---- Void Fissures ----
    {
        id: PR.ACTIVITY_VOID_FISSURES,
        label: "Void Fissures",
        category: "Activities",
        description: "Crack Void Relics by completing Void Fissure missions to earn Prime parts. Requires Void Relic segment.",
        prerequisites: [PR.SEGMENT_VOID_RELIC]
    },
    {
        id: PR.ACTIVITY_VOID_STORMS,
        label: "Void Storms (Railjack Fissures)",
        category: "Activities",
        description: "Void Fissures inside Railjack missions. Allows cracking relics while doing Railjack content.",
        prerequisites: [PR.RAILJACK_VOID_STORMS, PR.SEGMENT_VOID_RELIC]
    },

    // ---- Nemesis Systems ----
    {
        id: PR.ACTIVITY_KUVA_LICH,
        label: "Kuva Lich System",
        category: "Activities",
        description: "Create and hunt a Kuva Lich nemesis to earn Kuva weapons with random bonus elemental damage. Requires The War Within + MR5 + Rising Tide.",
        prerequisites: [PR.WAR_WITHIN, PR.RISING_TIDE, PR.JUNCTION_ERIS_KUVA_FORTRESS],
        conditions: [{ type: "mastery_rank", value: 5 }]
    },
    {
        id: PR.ACTIVITY_SISTER_PARVOS,
        label: "Sister of Parvos System",
        category: "Activities",
        description: "Create and hunt a Sister of Parvos nemesis to earn Tenet weapons and a Hound companion. Requires Call of the Tempestarii + The Deadlock Protocol.",
        prerequisites: [PR.CALL_TEMPESTARII, PR.DEADLOCK_PROTOCOL]
    },

    // ---- Zariman Mission Types ----
    {
        id: PR.ACTIVITY_VOID_ANGELS,
        label: "Void Angels (Zariman)",
        category: "Activities",
        description: "Void Angel boss encounters in Zariman Exterminate missions. Require strong Operator/Amp to destroy the core.",
        prerequisites: [PR.HUB_ZARIMAN]
    },
    {
        id: PR.ACTIVITY_CONJUNCTION_SURVIVAL,
        label: "Conjunction Survival (Zariman)",
        category: "Activities",
        description: "Zariman survival variant with Vitoplast collection. Best source of Holdfasts standing per run.",
        prerequisites: [PR.HUB_ZARIMAN]
    },
    {
        id: PR.ACTIVITY_VOID_FLOOD,
        label: "Void Flood (Zariman)",
        category: "Activities",
        description: "Zariman mission type requiring Vitoplast sealing of Void Ruptures across the map.",
        prerequisites: [PR.HUB_ZARIMAN]
    },
    {
        id: PR.ACTIVITY_MIRROR_DEFENSE,
        label: "Mirror Defense (Zariman)",
        category: "Activities",
        description: "Zariman defense mission type. Protect the mirror from Thrax enemies.",
        prerequisites: [PR.HUB_ZARIMAN]
    },

    // ---- The Circuit ----
    {
        id: PR.ACTIVITY_CIRCUIT,
        label: "The Circuit",
        category: "Activities",
        description: "Duviri roguelite run mode. Choose Warframes from a random pool. Best source of Incarnon Genesis adapters for base weapons.",
        prerequisites: [PR.DUVIRI_PARADOX]
    },
    {
        id: PR.ACTIVITY_CIRCUIT_STEEL_PATH_2,
        label: "The Circuit: Steel Path (alternate key)",
        category: "Activities",
        description: "Steel Path Circuit. Awards Incarnon Genesis adapters for Steel Path-specific weapons.",
        prerequisites: [PR.DUVIRI_PARADOX, PR.ACTIVITY_STEEL_PATH]
    },

    // =========================================================================
    // SYNDICATE RANK MILESTONES
    // =========================================================================

    // ---- The Quills ----
    {
        id: PR.SYNDICATE_QUILLS_RANK1,
        label: "The Quills: Rank 1 (Observer)",
        category: "Syndicates",
        description: "First rank with The Quills. Unlocks T1 Amp parts and triggers Mask of the Revenant quest.",
        prerequisites: [PR.HUB_CETUS, PR.WAR_WITHIN]
    },
    {
        id: PR.SYNDICATE_QUILLS_RANK2,
        label: "The Quills: Rank 2 (Adherent)",
        category: "Syndicates",
        description: "Unlocks T2 Amp parts and Amp gilding at Quill Onkko.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK1]
    },
    {
        id: PR.SYNDICATE_QUILLS_RANK3,
        label: "The Quills: Rank 3 (Instrument)",
        category: "Syndicates",
        description: "Unlocks T3 Amp parts. The minimum recommended rank for Eidolon support builds.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK2]
    },
    {
        id: PR.SYNDICATE_QUILLS_RANK4,
        label: "The Quills: Rank 4 (Architect)",
        category: "Syndicates",
        description: "Unlocks T4 Amp parts including Propa scaffold — the best Eidolon scaffold from Quills.",
        prerequisites: [PR.SYNDICATE_QUILLS_RANK3]
    },

    // ---- Entrati ----
    {
        id: PR.SYNDICATE_ENTRATI_RANK3,
        label: "Entrati: Rank 3 (Associate)",
        category: "Syndicates",
        description: "Unlocks Helminth Segment blueprint from Son. Requires MR8.",
        prerequisites: [PR.HUB_NECRALISK],
        conditions: [{ type: "mastery_rank", value: 8 }]
    },
    {
        id: PR.SYNDICATE_ENTRATI_RANK5,
        label: "Entrati: Rank 5 (Family)",
        category: "Syndicates",
        description: "Unlocks Helminth Invigoration Segment blueprint from Son. Requires MR8.",
        prerequisites: [PR.SYNDICATE_ENTRATI_RANK3],
        conditions: [{ type: "mastery_rank", value: 8 }]
    },

    // ---- Cavia ----
    {
        id: PR.SYNDICATE_CAVIA_RANK2,
        label: "Cavia: Rank 2 (Researcher)",
        category: "Syndicates",
        description: "Unlocks Helminth Coalescent Segment blueprint from Bird 3.",
        prerequisites: [PR.HUB_SANCTUM]
    },
    {
        id: PR.SYNDICATE_CAVIA_RANK5,
        label: "Cavia: Rank 5 (Family)",
        category: "Syndicates",
        description: "Unlocks Deep Archimedea missions and weekly Archon Shard purchasing from Cavalero.",
        prerequisites: [PR.SYNDICATE_CAVIA_RANK2]
    },

    // ---- Vox Solaris ----
    {
        id: PR.SYNDICATE_VOX_RANK1,
        label: "Vox Solaris: Rank 1",
        category: "Syndicates",
        description: "Unlocks T5 Amp parts from Little Duck.",
        prerequisites: [PR.HUB_FORTUNA, PR.VOX_SOLARIS]
    },
    {
        id: PR.SYNDICATE_VOX_RANK2,
        label: "Vox Solaris: Rank 2",
        category: "Syndicates",
        description: "Unlocks T6 Amp parts from Little Duck.",
        prerequisites: [PR.SYNDICATE_VOX_RANK1]
    },
    {
        id: PR.SYNDICATE_VOX_RANK3,
        label: "Vox Solaris: Rank 3 (Mistral)",
        category: "Syndicates",
        description: "Unlocks T7 Amp parts and Amp gilding via Vox Solaris.",
        prerequisites: [PR.SYNDICATE_VOX_RANK2]
    },
    {
        id: PR.SYNDICATE_VOX_RANK5,
        label: "Vox Solaris: Rank 5 (Old Mate)",
        category: "Syndicates",
        description: "Maximum Vox Solaris rank. Unlocks Profit-Taker Orb heist missions.",
        prerequisites: [PR.SYNDICATE_VOX_RANK3]
    },
];