import type { PrereqId } from "../../domain/ids/prereqIds";
import { PR } from "../../domain/ids/prereqIds";

export type PrereqCategory =
    | "Quests"
    | "Hubs"
    | "Systems";

export interface PrereqDef {
    id: PrereqId;
    label: string;
    category: PrereqCategory;
    description: string;
    prerequisites: PrereqId[];
}

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
        prerequisites: [PR.STOLEN_DREAMS]
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
        description: "Introduces Railjack ownership and progression (Railjack missions, Intrinsics).",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.DUVIRI_PARADOX,
        label: "The Duviri Paradox",
        category: "Quests",
        description: "Duviri access gate. Modeled here as a quest prereq for Duviri-sourced items/systems.",
        prerequisites: [PR.JUNCTION_SATURN_URANUS]
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
    // Star Chart junction prereqs (modeled explicitly so other systems can lock behind them)
    // -----------------------------
    {
        id: PR.JUNCTION_EARTH_MARS,
        label: "Junction: Earth → Mars",
        category: "Systems",
        description: "You have completed the Earth → Mars Junction (Star Chart progression gate).",
        prerequisites: [PR.VORS_PRIZE]
    },
    {
        id: PR.JUNCTION_SATURN_URANUS,
        label: "Junction: Saturn → Uranus",
        category: "Systems",
        description: "You have completed the Saturn → Uranus Junction (Star Chart progression gate).",
        prerequisites: [PR.VORS_PRIZE]
    },

    // -----------------------------
    // Orbiter Segments (milestones that gate features and should be modeled explicitly)
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
        description: "Melee Exilus and Melee Arcane slots are available (Tennokai-related feature gate).",
        prerequisites: [PR.WHISPERS_WALL]
    },

    // -----------------------------
    // Helminth upgrade segments (separate from just “Helminth unlocked”)
    // -----------------------------
    {
        id: PR.SYSTEM_HELMINTH_INVIGORATIONS,
        label: "Helminth: Invigoration Segment Installed",
        category: "Systems",
        description: "Invigorations are available (requires Helminth unlocked plus its acquisition constraints).",
        prerequisites: [PR.SYSTEM_HELMINTH]
    },
    {
        id: PR.SYSTEM_HELMINTH_ARCHON_SHARDS,
        label: "Helminth: Archon Shard Segment Installed",
        category: "Systems",
        description: "Helminth Archon Shard operations are available (segment tied to post-New War progression).",
        prerequisites: [PR.SYSTEM_HELMINTH, PR.VEILBREAKER]
    },
    {
        id: PR.SYSTEM_HELMINTH_COALESCENT,
        label: "Helminth: Coalescent Segment Installed",
        category: "Systems",
        description: "Helminth Coalescent segment is available after Sanctum/Cavia progression (modeled as a gate).",
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

