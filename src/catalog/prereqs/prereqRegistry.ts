// ===== FILE: src/catalog/prereqs/prereqRegistry.ts =====

import type { PrereqId } from "../../domain/ids/prereqIds";
import { PR } from "../../domain/ids/prereqIds";

export type PrereqCategory =
    | "Quests"
    | "Hubs"
    | "Systems";

/**
 * 1.6 Standardized Prerequisite Condition Types.
 *
 * These typed conditions describe what is required to satisfy a prerequisite.
 * They are richer than raw PrereqId chains and allow the engine to surface
 * human-readable explanations ("MR 10 required", "quest incomplete", etc.).
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
        case "mastery_rank": return `Mastery Rank ${cond.value} required`;
        case "quest_complete": return `Quest complete: ${cond.prereqId}`;
        case "junction_complete": return `Junction complete: ${cond.junctionId}`;
        case "node_complete": return `Node complete: ${cond.nodeId}`;
        case "planet_unlock": return `Planet unlocked: ${cond.planetId}`;
        case "syndicate_rank": return `${cond.syndicateId} rank ${cond.rank} required`;
        case "item_owned": return `Item owned: ${cond.catalogId}`;
        case "resource_owned": return `${cond.quantity}x ${cond.catalogId} required`;
    }
}

export interface PrereqDef {
    id: PrereqId;
    label: string;
    category: PrereqCategory;
    description: string;
    prerequisites: PrereqId[];
    /**
     * Optional structured conditions for rich explainability.
     * When present, these are surfaced by the reason trace system.
     */
    conditions?: PrereqCondition[];
}

/**
 * IMPORTANT RULE:
 * - Mastery Rank is NOT modeled as a prereq registry item.
 * - MR is a requirement attribute that is only surfaced when it blocks a specific target
 *   (items now; later weapons/goals).
 */
export const PREREQ_REGISTRY: PrereqDef[] = [
    // -----------------------------
    // Quests (major progression spine)
    // -----------------------------
    {
        id: PR.VORS_PRIZE,
        label: "Vor’s Prize",
        category: "Quests",
        description: "Core tutorial quest and early game unlock spine.",
        prerequisites: []
    },
    {
        id: PR.SAYA_VIGIL,
        label: "Saya’s Vigil",
        category: "Quests",
        description: "Introduces Cetus and the Plains of Eidolon questline.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.VOX_SOLARIS,
        label: "Vox Solaris",
        category: "Quests",
        description: "Introduces Fortuna and Orb Vallis.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.ONCE_AWAKE,
        label: "Once Awake",
        category: "Quests",
        description: "Early quest that unlocks additional progression hooks.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.HEART_OF_DEIMOS,
        label: "Heart of Deimos",
        category: "Quests",
        description: "Introduces Deimos and the Necralisk.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.ARCHWING,
        label: "The Archwing",
        category: "Quests",
        description: "Unlocks Archwing usage.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.STOLEN_DREAMS,
        label: "Stolen Dreams",
        category: "Quests",
        description: "Mainline quest step and lore progression.",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.NEW_STRANGE,
        label: "The New Strange",
        category: "Quests",
        description: "Progression step that leads into later story arc.",
        prerequisites: [PR.STOLEN_DREAMS, PR.JUNCTION_MARS_CERES]
    },
    {
        id: PR.NATAH,
        label: "Natah",
        category: "Quests",
        description: "Begins the arc leading to Operator story progression.",
        prerequisites: [PR.NEW_STRANGE]
    },
    {
        id: PR.SECOND_DREAM,
        label: "The Second Dream",
        category: "Quests",
        description: "Unlocks Operator (core progression system).",
        prerequisites: [PR.NATAH]
    },
    {
        id: PR.WAR_WITHIN,
        label: "The War Within",
        category: "Quests",
        description: "Expands Operator progression and unlocks additional systems.",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.CHAINS_HARROW,
        label: "Chains of Harrow",
        category: "Quests",
        description: "Mainline story continuation.",
        prerequisites: [PR.WAR_WITHIN]
    },
    {
        id: PR.APOSTASY,
        label: "Apostasy Prologue",
        category: "Quests",
        description: "Mainline story continuation; requires Personal Quarters access.",
        prerequisites: [PR.CHAINS_HARROW, PR.SYSTEM_ORBITER_PERSONAL_QUARTERS]
    },
    {
        id: PR.SACRIFICE,
        label: "The Sacrifice",
        category: "Quests",
        description: "Mainline story continuation.",
        prerequisites: [PR.APOSTASY]
    },
    {
        id: PR.NEW_WAR,
        label: "The New War",
        category: "Quests",
        description: "Major story arc milestone; unlocks several post-New War systems.",
        prerequisites: [PR.SACRIFICE]
    },
    {
        id: PR.ANGELS_ZARIMAN,
        label: "Angels of the Zariman",
        category: "Quests",
        description: "Introduces Zariman hub and related systems (Holdfasts).",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.WHISPERS_WALL,
        label: "Whispers in the Walls",
        category: "Quests",
        description: "Introduces Sanctum Anatomica content and related systems (Cavia).",
        prerequisites: [PR.NEW_WAR, PR.HEART_OF_DEIMOS]
    },

    // Additional quest chains used as progression gates
    {
        id: PR.VEILBREAKER,
        label: "Veilbreaker",
        category: "Quests",
        description: "Unlocks Kahl content and related segments tied to Veilbreaker progression.",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.RISING_TIDE,
        label: "Rising Tide",
        category: "Quests",
        description: "Introduces Railjack ownership and progression.",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.DUVIRI_PARADOX,
        label: "The Duviri Paradox",
        category: "Quests",
        description: "Duviri access gate (modeled as quest prereq for Duviri-sourced items/systems).",
        prerequisites: [PR.JUNCTION_SATURN_URANUS]
    },
    {
        id: PR.THE_HEX,
        label: "The Hex",
        category: "Quests",
        description: "Introduces 1999 and the Höllvania Central Mall hub.",
        prerequisites: [PR.DUVIRI_PARADOX, PR.THE_LOTUS_EATERS]
    },
    {
        id: PR.THE_LOTUS_EATERS,
        label: "The Lotus Eaters",
        category: "Quests",
        description: "Prologue to The Hex quest.",
        prerequisites: [PR.WHISPERS_WALL]
    },

    // -----------------------------
    // Hubs
    // -----------------------------
    {
        id: PR.HUB_CETUS,
        label: "Cetus (Plains of Eidolon) Access",
        category: "Hubs",
        description: "You can enter Cetus and the Plains.",
        prerequisites: [PR.SAYA_VIGIL]
    },
    {
        id: PR.HUB_FORTUNA,
        label: "Fortuna (Orb Vallis) Access",
        category: "Hubs",
        description: "You can enter Fortuna and Orb Vallis.",
        prerequisites: [PR.VOX_SOLARIS]
    },
    {
        id: PR.HUB_NECRALISK,
        label: "Necralisk (Deimos) Access",
        category: "Hubs",
        description: "You can enter the Necralisk on Deimos.",
        prerequisites: [PR.HEART_OF_DEIMOS]
    },
    {
        id: PR.HUB_ZARIMAN,
        label: "Zariman Access",
        category: "Hubs",
        description: "You can enter the Zariman and access Holdfasts.",
        prerequisites: [PR.ANGELS_ZARIMAN]
    },
    {
        id: PR.HUB_SANCTUM,
        label: "Sanctum Anatomica Access",
        category: "Hubs",
        description: "You can enter Sanctum Anatomica and access Cavia.",
        prerequisites: [PR.WHISPERS_WALL, PR.HUB_NECRALISK]
    },
    {
        id: PR.HUB_HOLLVANIA,
        label: "Hollvania Central Mall Access",
        category: "Hubs",
        description: "You can enter Höllvania Central Mall and access The Hex.",
        prerequisites: [PR.THE_HEX]
    },
    {
        id: PR.HUB_RELAY,
        label: "Any Relay",
        category: "Hubs",
        description: "Provides access to the six primary factions, Tenshin, Baro, and others.",
        prerequisites: [PR.VORS_PRIZE]
    },


    // -----------------------------
    // Systems
    // -----------------------------
    {
        id: PR.SYSTEM_OPERATOR,
        label: "Operator Unlocked",
        category: "Systems",
        description: "Operator system is available.",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.SYSTEM_RAILJACK,
        label: "Railjack Owned (Ship Built)",
        category: "Systems",
        description: "You own a Railjack and can run Railjack missions.",
        prerequisites: [PR.RISING_TIDE]
    },
    {
        id: PR.SYSTEM_HELMINTH,
        label: "Helminth Unlocked",
        category: "Systems",
        description: "Helminth infirmary is usable (segment acquired and installed).",
        prerequisites: [PR.HUB_NECRALISK]
    },
    {
        id: PR.SYSTEM_NECRAMECH,
        label: "Necramech Owned",
        category: "Systems",
        description: "You own at least one Necramech.",
        prerequisites: [PR.HUB_NECRALISK]
    },
    {
        id: PR.SYSTEM_ARCHON_HUNTS,
        label: "Archon Hunts Unlocked",
        category: "Systems",
        description: "Archon Hunts are available.",
        prerequisites: [PR.NEW_WAR]
    },

    // -----------------------------
    // Star Chart junction prereqs
    // -----------------------------
    {
        id: PR.JUNCTION_MERCURY_VENUS,
        label: "Junction: Mercury \u2192 Venus",
        category: "Systems",
        description: "You have completed the Mercury \u2192 Venus Junction.",
        prerequisites: []
    },
    {
        id: PR.JUNCTION_VENUS_EARTH,
        label: "Junction: Venus \u2192 Earth",
        category: "Systems",
        description: "You have completed the Venus \u2192 Earth Junction.",
        prerequisites: [PR.JUNCTION_MERCURY_VENUS]
    },
    {
        id: PR.JUNCTION_EARTH_MARS,
        label: "Junction: Earth \u2192 Mars",
        category: "Systems",
        description: "You have completed the Earth \u2192 Mars Junction.",
        prerequisites: [PR.VORS_PRIZE, PR.JUNCTION_VENUS_EARTH]
    },
    {
        id: PR.JUNCTION_MARS_PHOBOS,
        label: "Junction: Mars \u2192 Phobos",
        category: "Systems",
        description: "You have completed the Mars \u2192 Phobos Junction.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.JUNCTION_MARS_CERES,
        label: "Junction: Mars \u2192 Ceres",
        category: "Systems",
        description: "You have completed the Mars \u2192 Ceres Junction (direct path).",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.JUNCTION_MARS_DEIMOS,
        label: "Junction: Mars \u2192 Deimos",
        category: "Systems",
        description: "You have completed the Mars \u2192 Deimos Junction.",
        prerequisites: [PR.JUNCTION_EARTH_MARS, PR.HEART_OF_DEIMOS]
    },
    {
        id: PR.JUNCTION_PHOBOS_CERES,
        label: "Junction: Phobos \u2192 Ceres",
        category: "Systems",
        description: "You have completed the Phobos \u2192 Ceres Junction.",
        prerequisites: [PR.JUNCTION_MARS_PHOBOS]
    },
    {
        id: PR.JUNCTION_CERES_JUPITER,
        label: "Junction: Ceres \u2192 Jupiter",
        category: "Systems",
        description: "You have completed the Ceres \u2192 Jupiter Junction.",
        prerequisites: [PR.JUNCTION_PHOBOS_CERES]
    },
    {
        id: PR.JUNCTION_JUPITER_EUROPA,
        label: "Junction: Jupiter \u2192 Europa",
        category: "Systems",
        description: "You have completed the Jupiter \u2192 Europa Junction.",
        prerequisites: [PR.JUNCTION_CERES_JUPITER]
    },
    {
        id: PR.JUNCTION_EUROPA_SATURN,
        label: "Junction: Europa \u2192 Saturn",
        category: "Systems",
        description: "You have completed the Europa \u2192 Saturn Junction.",
        prerequisites: [PR.JUNCTION_JUPITER_EUROPA, PR.ARCHWING]
    },
    {
        id: PR.JUNCTION_SATURN_URANUS,
        label: "Junction: Saturn \u2192 Uranus",
        category: "Systems",
        description: "You have completed the Saturn \u2192 Uranus Junction.",
        prerequisites: [PR.JUNCTION_EUROPA_SATURN, PR.STOLEN_DREAMS]
    },
    {
        id: PR.JUNCTION_URANUS_NEPTUNE,
        label: "Junction: Uranus \u2192 Neptune",
        category: "Systems",
        description: "You have completed the Uranus \u2192 Neptune Junction.",
        prerequisites: [PR.JUNCTION_SATURN_URANUS]
    },
    {
        id: PR.JUNCTION_NEPTUNE_PLUTO,
        label: "Junction: Neptune \u2192 Pluto",
        category: "Systems",
        description: "You have completed the Neptune \u2192 Pluto Junction.",
        prerequisites: [PR.JUNCTION_URANUS_NEPTUNE]
    },
    {
        id: PR.JUNCTION_PLUTO_SEDNA,
        label: "Junction: Pluto \u2192 Sedna",
        category: "Systems",
        description: "You have completed the Pluto \u2192 Sedna Junction.",
        prerequisites: [PR.JUNCTION_NEPTUNE_PLUTO]
    },
    {
        id: PR.JUNCTION_SEDNA_ERIS,
        label: "Junction: Sedna \u2192 Eris",
        category: "Systems",
        description: "You have completed the Sedna \u2192 Eris Junction.",
        prerequisites: [PR.JUNCTION_PLUTO_SEDNA, PR.NEW_STRANGE]
    },
    {
        id: PR.JUNCTION_EARTH_LUA,
        label: "Junction: Earth \u2192 Lua",
        category: "Systems",
        description: "You have completed the Earth \u2192 Lua Junction (requires The Second Dream).",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.JUNCTION_ERIS_KUVA_FORTRESS,
        label: "Junction: Eris \u2192 Kuva Fortress",
        category: "Systems",
        description: "You have completed the Eris \u2192 Kuva Fortress Junction.",
        prerequisites: [PR.JUNCTION_SEDNA_ERIS, PR.WAR_WITHIN]
    },

    // -----------------------------
    // Orbiter Segments
    // -----------------------------
    {
        id: PR.SYSTEM_ORBITER_VOID_RELICS,
        label: "Orbiter: Void Relic Segment Installed",
        category: "Systems",
        description: "You can refine Void Relics and use the Relic UI.",
        prerequisites: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: PR.SYSTEM_ORBITER_PERSONAL_QUARTERS,
        label: "Orbiter: Personal Quarters Segment Installed",
        category: "Systems",
        description: "Personal Quarters are accessible (used by story progression and related features).",
        prerequisites: [PR.WAR_WITHIN]
    },
    {
        id: PR.SYSTEM_ORBITER_MELEE_UPGRADE,
        label: "Orbiter: Melee Upgrade Segment Installed",
        category: "Systems",
        description: "Melee Exilus and Melee Arcane slots are available.",
        prerequisites: [PR.WHISPERS_WALL]
    },

    // -----------------------------
    // Helminth upgrade segments
    // -----------------------------
    {
        id: PR.SYSTEM_HELMINTH_INVIGORATIONS,
        label: "Helminth: Invigoration Segment Installed",
        category: "Systems",
        description: "Invigorations are available (requires Helminth unlocked).",
        prerequisites: [PR.SYSTEM_HELMINTH]
    },
    {
        id: PR.SYSTEM_HELMINTH_ARCHON_SHARDS,
        label: "Helminth: Archon Shard Segment Installed",
        category: "Systems",
        description: "Helminth Archon Shard operations are available.",
        prerequisites: [PR.SYSTEM_HELMINTH, PR.VEILBREAKER]
    },
    {
        id: PR.SYSTEM_HELMINTH_COALESCENT,
        label: "Helminth: Coalescent Segment Installed",
        category: "Systems",
        description: "Helminth Coalescent segment is available after Sanctum/Cavia progression.",
        prerequisites: [PR.SYSTEM_HELMINTH, PR.HUB_SANCTUM]
    },

    // -----------------------------
    // Kahl / Veilbreaker systems
    // -----------------------------
    {
        id: PR.SYSTEM_KAHL_GARRISON,
        label: "Kahl’s Garrison Available",
        category: "Systems",
        description: "Kahl weekly missions and related progression are available.",
        prerequisites: [PR.VEILBREAKER]
    }
];

