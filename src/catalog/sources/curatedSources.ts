// ===== FILE: src/catalog/sources/curatedSources.ts =====

export type CuratedRawSource = {
    id: string;
    label: string;
    type?: "drop" | "crafting" | "vendor" | "other";
    prereqIds?: string[];
};

export const CURATED_SOURCES: CuratedRawSource[] = [
    // Pets / companions
    { id: "data:pets/kavat", label: "Breed a Kavat (Incubator)", type: "other", prereqIds: ["segment_incubator"] },
    { id: "data:pets/kubrow", label: "Breed a Kubrow (Incubator)", type: "other", prereqIds: ["quest_howl_of_the_kubrow", "segment_incubator"] },
    { id: "data:pets/helminth-charger", label: "Incubate a Helminth Charger", type: "other", prereqIds: ["quest_howl_of_the_kubrow", "segment_incubator"] },
    { id: "data:pets/moa", label: "Craft a MOA companion in Fortuna", type: "other", prereqIds: ["hub_fortuna"] },
    { id: "data:companions/hound-bhaira", label: "Claim a Hound with the Bhaira model (Sisters of Parvos)", type: "other", prereqIds: ["activity_sister_of_parvos"] },

    // Crafting
    { id: "data:crafting", label: "Craft in the Foundry", type: "crafting" },

    // Market (only two useful buckets)
    { id: "data:market/credits", label: "Buy from the Market (Credits)", type: "vendor" },
    { id: "data:market/platinum", label: "Buy from the Market (Platinum)", type: "vendor" },

    // System / account
    { id: "data:system/daily-tribute", label: "Earn from Daily Tribute", type: "other", prereqIds: ["system_daily_tribute_rewards"] },
    { id: "data:system/starter", label: "Receive as a starter item", type: "other" },

    // Time-gated / vendors
    { id: "data:baro/void-trader", label: "Buy from Baro Ki’Teer (Ducats + Credits)", type: "vendor", prereqIds: ["hub_relay"] },
    { id: "data:vendor/steel-path/teshin", label: "Buy from Teshin (Steel Path Honors)", type: "vendor", prereqIds: ["activity_steel_path_honors"] },
    { id: "data:nightwave/cred-offerings", label: "Buy from Nightwave Cred Offerings", type: "vendor", prereqIds: ["activity_nightwave"] },
    { id: "data:nightwave/rank-reward", label: "Earn from Nightwave rank rewards", type: "other", prereqIds: ["activity_nightwave"] },

    // Quests
    { id: "data:quest/the-sacrifice", label: "Earn from completing The Sacrifice quest", type: "other", prereqIds: ["quest_apostasy_prologue"] },
    { id: "data:quest/chimera-prologue", label: "Earn from completing Chimera Prologue", type: "other", prereqIds: ["quest_the_sacrifice"] },
    { id: "data:quest/the-archwing", label: "Earn from completing The Archwing quest", type: "other", prereqIds: ["junction_earth_mars"] },
    { id: "data:quest/the-new-strange", label: "Earn from completing The New Strange quest", type: "other", prereqIds: ["quest_stolen_dreams", "junction_jupiter_europa"] },
    { id: "data:quest/octavias-anthem", label: "Earn from completing Octavia's Anthem", type: "other", prereqIds: ["quest_the_second_dream"] },
    { id: "data:quest/rising-tide", label: "Earn from completing Rising Tide", type: "other", prereqIds: ["quest_the_war_within"] },
    { id: "data:quest/the-jordas-precept", label: "Earn from progressing through The Jordas Precept quest", type: "other", prereqIds: ["quest_the_archwing", "junction_sedna_eris"] },
    { id: "data:quest/the-limbo-theorem", label: "Earn from progressing through The Limbo Theorem quest", type: "other", prereqIds: ["quest_the_archwing", "junction_jupiter_europa"] },
    { id: "data:quest/patient-zero", label: "Earn from completing Patient Zero", type: "other", prereqIds: ["quest_once_awake", "junction_sedna_eris"] },
    { id: "data:quest/the-silver-grove", label: "Earn from progressing through The Silver Grove quest", type: "other", prereqIds: ["quest_the_second_dream"] },
    { id: "data:quest/whispers-in-the-walls", label: "Earn from completing Whispers in the Walls", type: "other", prereqIds: ["quest_heart_of_deimos", "quest_the_new_war"] },
    { id: "data:quest/the-waverider", label: "Earn from completing The Waverider", type: "other", prereqIds: ["quest_vox_solaris"] },
    { id: "data:quest/the-old-peace", label: "Earn from completing The Old Peace", type: "other", prereqIds: ["quest_the_lotus_eaters"] },
    { id: "data:quest/the-teacher", label: "Earn from completing The Teacher", type: "other", prereqIds: ["quest_vors_prize"] },

    // Unobtainable
    { id: "data:unobtainable/founders", label: "Unobtainable (Founders)", type: "other" },
    { id: "data:unobtainable/legacy", label: "Unobtainable legacy item", type: "other" },

    // Operator / amps
    { id: "data:operator/amp-starter", label: "Receive as a starter amp component", type: "other" },

    // Duviri
    { id: "data:duviri/experience", label: "Run Duviri Experience", type: "drop", prereqIds: ["quest_the_duviri_paradox"] },
    { id: "data:duviri/circuit", label: "Earn from The Circuit", type: "drop", prereqIds: ["quest_the_duviri_paradox"] },
    { id: "data:duviri/kullervo", label: "Farm Kullervo in Duviri", type: "drop", prereqIds: ["quest_the_duviri_paradox"] },
    { id: "data:vendor/duviri/acrithis", label: "Buy from Acrithis (Duviri)", type: "vendor", prereqIds: ["quest_the_duviri_paradox"] },

    // Dagath / Arbitrations
    { id: "data:abyssal-zone/dagath", label: "Farm Dagath in the Abyssal Zone", type: "drop", prereqIds: ["activity_abyssal_zone", "system_clan_dojo_access"] },
    { id: "data:arbitrations/grendel", label: "Farm Grendel via Arbitration locators", type: "drop", prereqIds: ["activity_arbitrations"] },
    { id: "data:vendor/arbitrations/galatea", label: "Buy from Arbitration Honors (Arbiters of Hexis)", type: "vendor", prereqIds: ["activity_arbitrations"] },

    // Invasions
    { id: "data:invasion/rewards", label: "Earn from Invasion rewards", type: "drop" },

    // Variant series (taxonomy only, but still readable)
    { id: "data:variants/wraith", label: "Wraith variant series", type: "other" },
    { id: "data:variants/vandal", label: "Vandal variant series", type: "other" },
    { id: "data:variants/prime", label: "Prime variant series", type: "other" },
    { id: "data:variants/kuva", label: "Kuva Lich variant series", type: "other" },
    { id: "data:variants/tenet", label: "Tenet variant series", type: "other" },

    // Conclave (single buckets, no aliases)
    { id: "data:conclave", label: "Play Conclave (PvP)", type: "other" },
    { id: "data:events/plague-star", label: "Play Plague Star (event)", type: "other", prereqIds: ["hub_cetus"] },

    // Open-world vendors
    { id: "data:vendor/cetus/ostron", label: "Buy from Ostrons (Cetus)", type: "vendor", prereqIds: ["hub_cetus"] },
    { id: "data:vendor/cetus/quills", label: "Buy from The Quills (Cetus)", type: "vendor", prereqIds: ["quest_sayas_vigil", "quest_the_war_within"] },
    { id: "data:vendor/cetus/hai-luk", label: "Buy from Hai-Luk (Cetus)", type: "vendor", prereqIds: ["hub_cetus"] },
    { id: "data:vendor/cetus/nakak", label: "Buy from Nakak (Cetus)", type: "vendor", prereqIds: ["hub_cetus"] },
    { id: "data:vendor/cetus/teasonai", label: "Buy from Master Teasonai (Cetus)", type: "vendor", prereqIds: ["hub_cetus"] },
    { id: "data:vendor/cetus/suumbaat", label: "Buy from Old Man Suumbaat (Cetus)", type: "vendor", prereqIds: ["hub_cetus"] },

    { id: "data:vendor/fortuna/solaris-united", label: "Buy from Solaris United (Fortuna)", type: "vendor", prereqIds: ["hub_fortuna"] },
    { id: "data:vendor/fortuna/vox-solaris", label: "Buy from Vox Solaris (Fortuna)", type: "vendor", prereqIds: ["quest_vox_solaris", "quest_the_war_within"] },
    { id: "data:vendor/fortuna/ventkids", label: "Buy from Ventkids (Fortuna)", type: "vendor", prereqIds: ["quest_vox_solaris"] },
    { id: "data:vendor/fortuna/business", label: "Buy from The Business (Fortuna)", type: "vendor", prereqIds: ["hub_fortuna"] },
    { id: "data:vendor/fortuna/smokefinger", label: "Buy from Smokefinger (Fortuna)", type: "vendor", prereqIds: ["hub_fortuna"] },

    { id: "data:vendor/deimos/entrati", label: "Buy from the Entrati Family (Deimos)", type: "vendor", prereqIds: ["hub_necralisk"] },
    { id: "data:vendor/deimos/necraloid", label: "Buy from Necraloid (Deimos)", type: "vendor", prereqIds: ["quest_heart_of_deimos", "quest_the_war_within"] },
    { id: "data:vendor/deimos/father", label: "Buy from Father (Deimos)", type: "vendor", prereqIds: ["hub_necralisk"] },
    { id: "data:vendor/deimos/son", label: "Buy from Son (Deimos)", type: "vendor", prereqIds: ["hub_necralisk"] },
    { id: "data:vendor/deimos/daughter", label: "Buy from Daughter (Deimos)", type: "vendor", prereqIds: ["hub_necralisk"] },
    { id: "data:vendor/deimos/otak", label: "Buy from Otak (Deimos)", type: "vendor", prereqIds: ["hub_necralisk"] },
    { id: "data:vendor/deimos/mother", label: "Buy from Mother (Deimos)", type: "vendor", prereqIds: ["hub_necralisk"] },

    { id: "data:vendor/zariman/holdfasts", label: "Buy from the Holdfasts (Zariman)", type: "vendor", prereqIds: ["hub_zariman"] },
    { id: "data:vendor/zariman/cavalero", label: "Buy from Cavalero (Zariman)", type: "vendor", prereqIds: ["hub_zariman"] },
    { id: "data:vendor/zariman/yonta", label: "Buy from Archimedean Yonta (Zariman)", type: "vendor", prereqIds: ["hub_zariman"] },

    { id: "data:vendor/sanctum/cavia", label: "Buy from Cavia (Sanctum Anatomica)", type: "vendor", prereqIds: ["hub_sanctum_anatomica"] },
    { id: "data:vendor/sanctum/loid", label: "Buy from Loid (Sanctum Anatomica)", type: "vendor", prereqIds: ["hub_sanctum_anatomica"] },
    { id: "data:vendor/kahl-garrison/chipper", label: "Buy from Chipper (Kahl’s Garrison)", type: "vendor", prereqIds: ["quest_veilbreaker"] },

    // Other key vendors
    { id: "data:vendor/simaris", label: "Buy from Cephalon Simaris", type: "vendor", prereqIds: ["hub_relay", "quest_the_new_strange"] },
    { id: "data:vendor/darvo", label: "Buy from Darvo", type: "vendor", prereqIds: ["hub_relay"] },
    { id: "data:vendor/iron-wake/palladino", label: "Buy from Palladino (Iron Wake)", type: "vendor", prereqIds: ["quest_chains_of_harrow"] },
    { id: "data:vendor/relay/varzia", label: "Buy from Varzia (Prime Resurgence)", type: "vendor", prereqIds: ["hub_relay"] },
    { id: "data:vendor/relay/legs", label: "Buy from Legs (Fortuna)", type: "vendor", prereqIds: ["hub_fortuna"] },
    { id: "data:vendor/fortuna/nightcap", label: "Buy from Nightcap (Fortuna Airlock)", type: "vendor", prereqIds: ["hub_fortuna", "quest_the_new_war"] },

    // Lich systems
    { id: "data:lich/kuva", label: "Earn from Kuva Liches", type: "other", prereqIds: ["activity_kuva_lich"] },
    { id: "data:lich/tenet", label: "Earn from Sisters of Parvos", type: "other", prereqIds: ["activity_sister_of_parvos"] },
    { id: "data:lich/infested-coda", label: "Technocyte Coda (earn currency, purchase Coda weapons)", type: "other", prereqIds: ["activity_technocyte_coda"] },

    // Fortuna Deepmines
    { id: "data:activity/deepmines/bounties", label: "Run Deepmines bounties (Fortuna Airlock)", type: "drop", prereqIds: ["hub_fortuna", "quest_the_new_war"] },
    { id: "data:deepmines/gathering", label: "Gather in the Deepmines", type: "drop", prereqIds: ["hub_fortuna", "quest_the_new_war"] },

    // Misc sources you already reference
    { id: "data:vendor/roathe/la-cathedrale", label: "Buy from Roathe (La Cathédrale)", type: "vendor", prereqIds: ["quest_the_old_peace"] },

    { id: "data:activity/souterrains/bounties", label: "Run Souterrains bounties", type: "drop", prereqIds: ["hub_fortuna", "quest_the_new_war"] },

    // The Descendia (used for Uriel components)
    { id: "data:activity/the-descendia/maphica", label: "Earn Maphica in The Descendia", type: "drop", prereqIds: ["quest_the_old_peace"] },
    { id: "data:activity/the-descendia/oblivion-on-infernium-21", label: "Oblivion on Infernium 21 (The Descendia)", type: "other", prereqIds: ["quest_the_old_peace"] },
    { id: "data:activity/the-descendia", label: "Run The Descendia", type: "drop", prereqIds: ["quest_the_old_peace"] },
    { id: "data:vendor/marie-leroux/la-cathedrale", label: "Buy from Marie Leroux (La Cathédrale)", type: "vendor", prereqIds: ["quest_the_old_peace"] },

    { id: "data:activity/deimos/conservation", label: "Earn from conservation in Cambion Drift", type: "drop", prereqIds: ["hub_necralisk"] },

    { id: "data:bounty/solaris-united", label: "Run Solaris United bounties", type: "drop", prereqIds: ["hub_fortuna"] },
    { id: "data:heist/profit-taker", label: "Run the Profit-Taker heist", type: "drop", prereqIds: ["activity_profit_taker"] },
    { id: "data:eidolon/hunts", label: "Run Eidolon hunts (Plains of Eidolon)", type: "drop", prereqIds: ["activity_eidolon_teralyst"] },

    { id: "data:enemy-item/prosecutors", label: "Farm Prosecutors for drops", type: "drop" },

    { id: "data:node/murex/20-sentients", label: "Run Murex node (20 Sentients)", type: "drop" },

    // Dojo research
    { id: "data:dojo/chem-lab", label: "Research in Dojo Chem Lab", type: "vendor", prereqIds: ["system_clan_dojo_access"] },
    { id: "data:dojo/energy-lab", label: "Research in Dojo Energy Lab", type: "vendor", prereqIds: ["system_clan_dojo_access"] },
    { id: "data:dojo/bio-lab", label: "Research in Dojo Bio Lab", type: "vendor", prereqIds: ["system_clan_dojo_access"] },
    { id: "data:dojo/orokin-lab", label: "Research in Dojo Orokin Lab", type: "vendor", prereqIds: ["system_clan_dojo_access"] },
    { id: "data:dojo/research", label: "Research in the Dojo", type: "vendor", prereqIds: ["system_clan_dojo_access"] },
    { id: "data:clan/tenno-lab", label: "Research in Dojo Tenno Lab", type: "vendor", prereqIds: ["system_clan_dojo_access"] },
    { id: "data:dojo/dagaths-hollow", label: "Research in Dagath’s Hollow (Dojo)", type: "vendor", prereqIds: ["system_clan_dojo_access"] },
    { id: "data:clan/join", label: "Join or create a Clan", type: "other" },

    // Resource buckets
    { id: "data:resource/fieldron-sample", label: "Farm Fieldron Samples", type: "drop" },
    { id: "data:resource/detonite-ampule", label: "Farm Detonite Ampules", type: "drop" },
    { id: "data:resource/mutagen-sample", label: "Farm Mutagen Samples", type: "drop" },
    { id: "data:resource/mutagen-mass", label: "Craft or earn Mutagen Mass (invasions)", type: "other" },
    { id: "data:resource/detonite-injector", label: "Craft or earn Detonite Injectors (invasions)", type: "other" },
    { id: "data:resource/fieldron", label: "Craft or earn Fieldron (invasions)", type: "other" },

    // warframe-items emits these literal ids
    { id: "data:1999/resources", label: "Farm resources in 1999", type: "drop", prereqIds: ["hub_hollvania"] },
    { id: "data:bounties/narmer", label: "Run Narmer bounties", type: "drop" },
    { id: "data:enemy/zanuka-hunter", label: "Farm Zanuka Hunter for drops", type: "drop" },
    { id: "data:enemy/stalker", label: "Farm Stalker and Shadow Stalker for drops", type: "drop" },
    { id: "data:enemy/vem-tabook", label: "Farm Vem Tabook for drops", type: "drop" },
    { id: "data:events/anniversary", label: "Play Anniversary event content", type: "drop" },
    { id: "data:events/fomorian-sabotage", label: "Respond to a Fomorian Sabotage event inbox", type: "other" },
    { id: "data:events/naberus", label: "Play Naberus event content", type: "drop" },
    { id: "data:events/pyrus-project", label: "Progress through The Pyrus Project event", type: "other" },
    { id: "data:events/razorback-armada", label: "Respond to a Razorback Armada event inbox", type: "other" },

    // Fishing processing: include the NPC name (so the user does not have to leave the app)
    // (Open world fishing NPCs: Hai-Luk, The Business, Daughter)
    { id: "data:fishing/cetus/processing", label: "Process fish with Hai-Luk (Cetus)", type: "drop", prereqIds: ["hub_cetus"] },
    { id: "data:fishing/fortuna/processing", label: "Process fish with The Business (Fortuna)", type: "drop", prereqIds: ["hub_fortuna"] },
    { id: "data:fishing/deimos/processing", label: "Process fish with Daughter (Deimos)", type: "drop", prereqIds: ["hub_necralisk"] },

    { id: "data:container/rare-orokin-storage", label: "Open rare Orokin storage containers", type: "drop" },
    { id: "data:container/rare-grineer-storage", label: "Open rare Grineer storage containers", type: "drop" },
    { id: "data:container/forgotten-grineer-storage", label: "Open forgotten Grineer storage containers", type: "drop" },
    { id: "data:container/rare-corpus-storage", label: "Open rare Corpus storage containers", type: "drop" },
    { id: "data:container/reinforced-carrypod", label: "Open Zariman reinforced carrypods", type: "drop" },

    { id: "data:openworld/cetus/mining", label: "Mine in Plains of Eidolon", type: "drop", prereqIds: ["hub_cetus"] },
    { id: "data:openworld/fortuna/mining", label: "Mine in Orb Vallis", type: "drop", prereqIds: ["hub_fortuna"] },
    { id: "data:openworld/deimos/mining", label: "Mine in Cambion Drift", type: "drop", prereqIds: ["hub_necralisk"] },
    { id: "data:openworld/deimos/entrati-lab", label: "Farm in Albrecht’s Laboratories (Deimos)", type: "drop", prereqIds: ["hub_sanctum_anatomica"] },
    { id: "data:openworld/cetus/vasca", label: "Earn Vasca Kavat imprints (Plains of Eidolon)", type: "drop", prereqIds: ["hub_cetus"] },
    { id: "data:openworld/duviri", label: "Farm in Duviri", type: "drop", prereqIds: ["quest_the_duviri_paradox"] },
    { id: "data:openworld/duviri/shrines", label: "Run Duviri shrines", type: "drop", prereqIds: ["quest_the_duviri_paradox"] },
    { id: "data:openworld/zariman", label: "Farm in the Zariman", type: "drop", prereqIds: ["hub_zariman"] },

    { id: "data:relics/ducats", label: "Earn Ducats from relics", type: "drop" },
    { id: "data:system/helminth", label: "Use the Helminth system", type: "drop", prereqIds: ["segment_helminth"] },

    { id: "data:vendor/cetus/hok", label: "Buy from Hok (Cetus)", type: "vendor", prereqIds: ["hub_cetus"] },
    { id: "data:vendor/fortuna/legs", label: "Buy from Legs (Fortuna)", type: "vendor", prereqIds: ["hub_fortuna"] },
    { id: "data:vendor/fortuna/rude-zuud", label: "Buy from Rude Zuud (Fortuna)", type: "vendor", prereqIds: ["hub_fortuna"] },
    { id: "data:vendor/hollvania/the-hex", label: "Buy from The Hex (Höllvania)", type: "vendor", prereqIds: ["hub_hollvania"] },

    { id: "data:node/deimos/albrechts-laboratories", label: "Node: Deimos - Albrecht’s Laboratories", type: "drop", prereqIds: ["hub_sanctum_anatomica"] },
    { id: "data:node/earth/cetus", label: "Node: Earth - Cetus", type: "drop", prereqIds: ["hub_cetus"] },
    { id: "data:node/venus/orb-vallis", label: "Node: Venus - Orb Vallis", type: "drop", prereqIds: ["hub_fortuna"] },

    // Legacy missionreward ids (kept as-is because other layers may emit them)
    { id: "data:missionreward/deimos/albrechts-laboratories", label: "Legacy: Albrecht’s Laboratories bounty", type: "drop" },
    { id: "data:missionreward/deimos/albrechts-laboratories/rotationc", label: "Legacy: Albrecht’s Laboratories bounty (Rotation C)", type: "drop" },
    { id: "data:missionreward/saturn/lunaro", label: "Legacy: Lunaro mission reward", type: "other" },
    { id: "data:missionreward/saturn/lunaro/rotationb", label: "Legacy: Lunaro mission reward (Rotation B)", type: "other" },
];
