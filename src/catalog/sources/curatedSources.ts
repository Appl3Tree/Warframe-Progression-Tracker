// ===== FILE: src/catalog/sources/curatedSources.ts =====

export type CuratedRawSource = {
    id: string;
    label: string;
    type?: "drop" | "crafting" | "vendor" | "other";
    prereqIds?: string[];
};

export const CURATED_SOURCES: CuratedRawSource[] = [
    // Pets / companions
    { id: "data:pets/kavat", label: "Breed a Kavat (Incubator)", type: "other" },
    { id: "data:pets/kubrow", label: "Breed a Kubrow (Incubator)", type: "other" },
    { id: "data:pets/helminth-charger", label: "Incubate a Helminth Charger", type: "other" },
    { id: "data:pets/moa", label: "Build a MOA companion (Fortuna)", type: "other" },

    // Crafting
    { id: "data:crafting", label: "Craft in the Foundry", type: "crafting" },

    // Market (only two useful buckets)
    { id: "data:market/credits", label: "Buy from the Market (Credits)", type: "vendor" },
    { id: "data:market/platinum", label: "Buy from the Market (Platinum)", type: "vendor" },

    // System / account
    { id: "data:system/daily-tribute", label: "Earn from Daily Tribute", type: "other" },
    { id: "data:system/starter", label: "Receive as a starter item", type: "other" },

    // Time-gated / vendors
    { id: "data:baro/void-trader", label: "Buy from Baro Ki’Teer (Ducats + Credits)", type: "vendor" },
    { id: "data:vendor/steel-path/teshin", label: "Buy from Teshin (Steel Path Honors)", type: "vendor" },
    { id: "data:nightwave/cred-offerings", label: "Buy from Nightwave Cred Offerings", type: "vendor" },

    // Quests
    { id: "data:quest/the-sacrifice", label: "Complete The Sacrifice", type: "other" },
    { id: "data:quest/chimera-prologue", label: "Complete Chimera Prologue", type: "other" },
    { id: "data:quest/octavias-anthem", label: "Complete Octavia’s Anthem", type: "other" },
    { id: "data:quest/whispers-in-the-walls", label: "Complete Whispers in the Walls", type: "other" },
    { id: "data:quest/the-waverider", label: "Complete The Waverider", type: "other" },
    { id: "data:quest/the-old-peace", label: "Complete The Old Peace", type: "other" },
    { id: "data:quest/the-teacher", label: "Complete The Teacher", type: "other" },

    // Unobtainable
    { id: "data:unobtainable/founders", label: "Unobtainable (Founders)", type: "other" },

    // Operator / amps
    { id: "data:operator/amp-starter", label: "Receive as a starter amp component", type: "other" },

    // Duviri
    { id: "data:duviri/experience", label: "Run Duviri Experience", type: "drop" },
    { id: "data:duviri/circuit", label: "Run The Circuit", type: "drop" },
    { id: "data:duviri/kullervo", label: "Farm Kullervo in Duviri", type: "drop" },
    { id: "data:vendor/duviri/acrithis", label: "Buy from Acrithis (Duviri)", type: "vendor" },

    // Dagath / Arbitrations
    { id: "data:abyssal-zone/dagath", label: "Farm Dagath in the Abyssal Zone", type: "drop" },
    { id: "data:arbitrations/grendel", label: "Farm Grendel via Arbitration locators", type: "drop" },
    { id: "data:vendor/arbitrations/galatea", label: "Buy from Arbitration Honors (Arbiters of Hexis)", type: "vendor" },

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
    { id: "data:events/plague-star", label: "Play Plague Star (event)", type: "other" },

    // Open-world vendors
    { id: "data:vendor/cetus/ostron", label: "Buy from Ostrons (Cetus)", type: "vendor" },
    { id: "data:vendor/cetus/quills", label: "Buy from The Quills (Cetus)", type: "vendor" },

    { id: "data:vendor/fortuna/solaris-united", label: "Buy from Solaris United (Fortuna)", type: "vendor" },
    { id: "data:vendor/fortuna/vox-solaris", label: "Buy from Vox Solaris (Fortuna)", type: "vendor" },
    { id: "data:vendor/fortuna/ventkids", label: "Buy from Ventkids (Fortuna)", type: "vendor" },

    { id: "data:vendor/deimos/entrati", label: "Buy from the Entrati Family (Deimos)", type: "vendor" },
    { id: "data:vendor/deimos/necraloid", label: "Buy from Necraloid (Deimos)", type: "vendor" },
    { id: "data:vendor/deimos/father", label: "Buy from Father (Deimos)", type: "vendor" },
    { id: "data:vendor/deimos/son", label: "Buy from Son (Deimos)", type: "vendor" },
    { id: "data:vendor/deimos/daughter", label: "Buy from Daughter (Deimos)", type: "vendor" },
    { id: "data:vendor/deimos/otak", label: "Buy from Otak (Deimos)", type: "vendor" },
    { id: "data:vendor/deimos/mother", label: "Buy from Mother (Deimos)", type: "vendor" },

    { id: "data:vendor/zariman/holdfasts", label: "Buy from the Holdfasts (Zariman)", type: "vendor" },
    { id: "data:vendor/zariman/cavalero", label: "Buy from Cavalero (Zariman)", type: "vendor" },
    { id: "data:vendor/zariman/yonta", label: "Buy from Archimedean Yonta (Zariman)", type: "vendor" },

    { id: "data:vendor/sanctum/cavia", label: "Buy from Cavia (Sanctum Anatomica)", type: "vendor" },
    { id: "data:vendor/kahl-garrison/chipper", label: "Buy from Chipper (Kahl’s Garrison)", type: "vendor" },

    // Other key vendors
    { id: "data:vendor/simaris", label: "Buy from Cephalon Simaris", type: "vendor" },
    { id: "data:vendor/darvo", label: "Buy from Darvo", type: "vendor" },
    { id: "data:vendor/iron-wake/palladino", label: "Buy from Palladino (Iron Wake)", type: "vendor" },
    { id: "data:vendor/relay/varzia", label: "Buy from Varzia (Prime Resurgence)", type: "vendor" },
    { id: "data:vendor/relay/legs", label: "Buy from Legs (Fortuna)", type: "vendor" },
    { id: "data:vendor/fortuna/nightcap", label: "Buy from Nightcap (Fortuna Airlock)", type: "vendor" },

    // Lich systems
    { id: "data:lich/kuva", label: "Earn from Kuva Liches", type: "other" },
    { id: "data:lich/tenet", label: "Earn from Sisters of Parvos", type: "other" },
    { id: "data:lich/infested-coda", label: "Earn from Infested Lich Coda weapons", type: "other" },

    // Fortuna Deepmines
    { id: "data:activity/deepmines/bounties", label: "Run Deepmines bounties (Fortuna Airlock)", type: "drop" },
    { id: "data:deepmines/gathering", label: "Gather in the Deepmines", type: "drop" },

    // Misc sources you already reference
    { id: "data:vendor/bonne-nuit", label: "Buy from Bonne-Nuit", type: "vendor" },
    { id: "data:vendor/roathe/la-cathedrale", label: "Buy from Roathe (La Cathédrale)", type: "vendor" },

    { id: "data:activity/souterrains/bounties", label: "Run Souterrains bounties", type: "drop" },

    // The Descendia (used for Uriel components)
    { id: "data:activity/the-descendia/maphica", label: "Run The Descendia mission: Maphica", type: "drop" },
    { id: "data:activity/the-descendia/oblivion-on-infernium-21/rotation-c", label: "Run Oblivion on Infernium-21 (Rotation C)", type: "drop" },
    { id: "data:activity/the-descendia", label: "Run The Descendia missions (Dark Refractory)", type: "drop", prereqIds: ["data:quest/the-old-peace"] },

    { id: "data:activity/deimos/conservation", label: "Earn from conservation in Cambion Drift", type: "drop" },

    { id: "data:bounty/solaris-united", label: "Run Solaris United bounties", type: "drop" },
    { id: "data:heist/profit-taker", label: "Run the Profit-Taker heist", type: "drop" },
    { id: "data:eidolon/hunts", label: "Run Eidolon hunts (Plains of Eidolon)", type: "drop" },

    { id: "data:enemy-item/prosecutors", label: "Farm Prosecutors for drops", type: "drop" },

    { id: "data:node/murex/20-sentients", label: "Run Murex node (20 Sentients)", type: "drop" },

    // Dojo research
    { id: "data:dojo/chem-lab", label: "Research in Dojo Chem Lab", type: "vendor" },
    { id: "data:dojo/energy-lab", label: "Research in Dojo Energy Lab", type: "vendor" },
    { id: "data:dojo/bio-lab", label: "Research in Dojo Bio Lab", type: "vendor" },
    { id: "data:dojo/orokin-lab", label: "Research in Dojo Orokin Lab", type: "vendor" },
    { id: "data:dojo/research", label: "Research in the Dojo", type: "vendor" },
    { id: "data:clan/tenno-lab", label: "Research in Dojo Tenno Lab", type: "vendor" },
    { id: "data:dojo/dagaths-hollow", label: "Research in Dagath’s Hollow (Dojo)", type: "vendor" },

    // Resource buckets
    { id: "data:resource/fieldron-sample", label: "Farm Fieldron Samples", type: "drop" },
    { id: "data:resource/detonite-ampule", label: "Farm Detonite Ampules", type: "drop" },
    { id: "data:resource/mutagen-sample", label: "Farm Mutagen Samples", type: "drop" },
    { id: "data:resource/mutagen-mass", label: "Craft or earn Mutagen Mass (invasions)", type: "other" },
    { id: "data:resource/detonite-injector", label: "Craft or earn Detonite Injectors (invasions)", type: "other" },
    { id: "data:resource/fieldron", label: "Craft or earn Fieldron (invasions)", type: "other" },

    // warframe-items emits these literal ids
    { id: "data:1999/resources", label: "Farm resources in 1999", type: "drop" },
    { id: "data:bounties/narmer", label: "Run Narmer bounties", type: "drop" },
    { id: "data:enemy/zanuka-hunter", label: "Farm Zanuka Hunter for drops", type: "drop" },
    { id: "data:events/anniversary", label: "Play Anniversary event content", type: "drop" },
    { id: "data:events/naberus", label: "Play Naberus event content", type: "drop" },

    // Fishing processing: include the NPC name (so the user does not have to leave the app)
    // (Open world fishing NPCs: Hai-Luk, The Business, Daughter)  [oai_citation:0‡Steam Community](https://steamcommunity.com/sharedfiles/filedetails/?id=2906719972&l=thai&utm_source=chatgpt.com)
    { id: "data:fishing/cetus/processing", label: "Process fish with Hai-Luk (Cetus)", type: "drop" },
    { id: "data:fishing/fortuna/processing", label: "Process fish with The Business (Fortuna)", type: "drop" },
    { id: "data:fishing/deimos/processing", label: "Process fish with Daughter (Deimos)", type: "drop" },

    { id: "data:openworld/cetus/mining", label: "Mine in Plains of Eidolon", type: "drop" },
    { id: "data:openworld/fortuna/mining", label: "Mine in Orb Vallis", type: "drop" },
    { id: "data:openworld/deimos/mining", label: "Mine in Cambion Drift", type: "drop" },
    { id: "data:openworld/deimos/entrati-lab", label: "Farm in Albrecht’s Laboratories (Deimos)", type: "drop" },
    { id: "data:openworld/cetus/vasca", label: "Earn Vasca Kavat imprints (Plains of Eidolon)", type: "drop" },
    { id: "data:openworld/duviri", label: "Farm in Duviri", type: "drop" },
    { id: "data:openworld/duviri/shrines", label: "Run Duviri shrines", type: "drop" },
    { id: "data:openworld/zariman", label: "Farm in the Zariman", type: "drop" },

    { id: "data:relics/ducats", label: "Earn Ducats from relics", type: "drop" },
    { id: "data:system/helminth", label: "Use the Helminth system", type: "drop" },

    { id: "data:vendor/cetus/hok", label: "Buy from Hok (Cetus)", type: "vendor" },
    { id: "data:vendor/fortuna/legs", label: "Buy from Legs (Fortuna)", type: "vendor" },
    { id: "data:vendor/fortuna/rude-zuud", label: "Buy from Rude Zuud (Fortuna)", type: "vendor" },
    { id: "data:vendor/hollvania/the-hex", label: "Buy from The Hex (Höllvania)", type: "vendor" },

    { id: "data:node/deimos/albrechts-laboratories", label: "Node: Deimos - Albrecht’s Laboratories", type: "drop" },
    { id: "data:node/earth/cetus", label: "Node: Earth - Cetus", type: "drop" },
    { id: "data:node/venus/orb-vallis", label: "Node: Venus - Orb Vallis", type: "drop" },

    // Legacy missionreward ids (kept as-is because other layers may emit them)
    { id: "data:missionreward/deimos/albrechts-laboratories", label: "Legacy: Albrecht’s Laboratories bounty", type: "drop" },
    { id: "data:missionreward/deimos/albrechts-laboratories/rotationc", label: "Legacy: Albrecht’s Laboratories bounty (Rotation C)", type: "drop" },
    { id: "data:missionreward/saturn/lunaro", label: "Legacy: Lunaro mission reward", type: "other" },
    { id: "data:missionreward/saturn/lunaro/rotationb", label: "Legacy: Lunaro mission reward (Rotation B)", type: "other" },
];
