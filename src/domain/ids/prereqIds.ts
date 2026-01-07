export const PR = {
    // Quests (major arcs; extend later)
    VORS_PRIZE: "quest_vors_prize",
    SAYA_VIGIL: "quest_sayas_vigil",
    VOX_SOLARIS: "quest_vox_solaris",
    ONCE_AWAKE: "quest_once_awake",
    HEART_OF_DEIMOS: "quest_heart_of_deimos",
    ARCHWING: "quest_the_archwing",
    STOLEN_DREAMS: "quest_stolen_dreams",
    NEW_STRANGE: "quest_the_new_strange",
    NATAH: "quest_natah",
    SECOND_DREAM: "quest_the_second_dream",
    WAR_WITHIN: "quest_the_war_within",
    CHAINS_HARROW: "quest_chains_of_harrow",
    APOSTASY: "quest_apostasy_prologue",
    SACRIFICE: "quest_the_sacrifice",
    NEW_WAR: "quest_the_new_war",
    ANGELS_ZARIMAN: "quest_angels_of_the_zariman",
    WHISPERS_WALL: "quest_whispers_in_the_walls",

    // Hubs / Regions
    HUB_CETUS: "hub_cetus",
    HUB_FORTUNA: "hub_fortuna",
    HUB_NECRALISK: "hub_necralisk",
    HUB_ZARIMAN: "hub_zariman",
    HUB_SANCTUM: "hub_sanctum_anatomica",

    // Systems (high-level gates; these are “player-confirmed” prerequisites)
    SYSTEM_OPERATOR: "system_operator_unlocked",
    SYSTEM_RAILJACK: "system_railjack_unlocked",
    SYSTEM_HELMINTH: "system_helminth_unlocked",
    SYSTEM_NECRAMECH: "system_necramech_unlocked",
    SYSTEM_ARCHON_HUNTS: "system_archon_hunts_unlocked"
} as const;

export type PrereqId = (typeof PR)[keyof typeof PR];

