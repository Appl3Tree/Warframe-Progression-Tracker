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
    // Quests (major progression spine)
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
        description: "Mainline story continuation.",
        prerequisites: [PR.CHAINS_HARROW]
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
        description: "Major story arc milestone.",
        prerequisites: [PR.SACRIFICE]
    },
    {
        id: PR.ANGELS_ZARIMAN,
        label: "Angels of the Zariman",
        category: "Quests",
        description: "Introduces Zariman hub and related systems.",
        prerequisites: [PR.NEW_WAR]
    },
    {
        id: PR.WHISPERS_WALL,
        label: "Whispers in the Walls",
        category: "Quests",
        description: "Introduces Sanctum Anatomica content and related systems.",
        prerequisites: [PR.NEW_WAR]
    },

    // Hubs
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

    // Systems (boolean flags, not inferred yet)
    {
        id: PR.SYSTEM_OPERATOR,
        label: "Operator Unlocked",
        category: "Systems",
        description: "Operator system is available.",
        prerequisites: [PR.SECOND_DREAM]
    },
    {
        id: PR.SYSTEM_RAILJACK,
        label: "Railjack Unlocked",
        category: "Systems",
        description: "You own a Railjack and can run Railjack missions.",
        prerequisites: [PR.WAR_WITHIN]
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
    }
];

