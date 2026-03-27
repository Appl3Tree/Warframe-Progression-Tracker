// src/data/synthesisTargets.ts
// Synthesis target location data compiled from the Warframe Synthesis guide
// Source: https://steamcommunity.com/sharedfiles/filedetails/?id=666483447

export interface SynthesisLocation {
    planet: string;
    mission: string;
    missionType: string;
    faction: string;
    level: string;
    spawnRate: string;
    steelPath?: boolean;
    note?: string;
}

export interface SynthesisTarget {
    name: string;
    faction: "Grineer" | "Corpus" | "Infested" | "Orokin" | "Mixed";
    scansRequired: number;
    standingPerScan?: number;
    endoRewards?: { qty: number; endo: number }[];
    isResearch?: boolean;  // [Research] tag — only available via Simaris research terminal
    locations: SynthesisLocation[];
    tips?: string;
    wikiUrl?: string;
}

export const SYNTHESIS_TARGETS: SynthesisTarget[] = [
  {
    name: "Ancient Disruptor",
    faction: "Infested",
    scansRequired: 4,
    endoRewards: [{ qty: 2, endo: 400 }, { qty: 3, endo: 560 }, { qty: 4, endo: 800 }],
    locations: [
      { planet: "Earth", mission: "Tikal", missionType: "Excavation", faction: "Infestation", level: "6-16", spawnRate: "100%" },
      { planet: "Earth", mission: "Tikal", missionType: "Excavation", faction: "Infestation", level: "106-116", spawnRate: "100%", steelPath: true },
      { planet: "Mercury", mission: "Terminus", missionType: "Sabotage", faction: "Grineer + Infestation", level: "8-10", spawnRate: "100%" },
      { planet: "Mercury", mission: "Terminus", missionType: "Sabotage", faction: "Grineer + Infestation", level: "108-110", spawnRate: "100%", steelPath: true },
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "32-36", spawnRate: "100%" },
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "132-136", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Ancient_Disruptor",
  },
  {
    name: "Ancient Healer",
    faction: "Infested",
    scansRequired: 4,
    locations: [
      { planet: "Void", mission: "Hepit", missionType: "Capture", faction: "Infestation", level: "10-15", spawnRate: "100%", },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Ancient_Healer",
  },
  {
    name: "Anti MOA",
    faction: "Corpus",
    scansRequired: 3,
    isResearch: true,
    endoRewards: [{ qty: 2, endo: 400 }, { qty: 3, endo: 560 }, { qty: 4, endo: 800 }],
    locations: [
      { planet: "Europa", mission: "Baal", missionType: "Exterminate", faction: "Corpus", level: "21-23", spawnRate: "~69%" },
      { planet: "Lua", mission: "Zeipel", missionType: "Rescue", faction: "Orokin Moon", level: "25-30", spawnRate: "100%" },
    ],
    tips: "Will not spawn if mission starts in the long air-shaft room on Jupiter Corpus Gas City tileset.",
    wikiUrl: "https://wiki.warframe.com/w/Anti_MOA",
  },
  {
    name: "Arid Eviscerator",
    faction: "Grineer",
    scansRequired: 4,
    isResearch: true,
    locations: [
      { planet: "Mars", mission: "Ara", missionType: "Capture", faction: "Grineer", level: "10-12", spawnRate: "100%", note: "Only spawns on Ara (Mars)" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Eviscerator",
  },
  {
    name: "Ballista",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "34-38", spawnRate: "100%" },
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "134-138", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Ballista",
  },
  {
    name: "Boiler",
    faction: "Infested",
    scansRequired: 4,
    locations: [
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "32-36", spawnRate: "100%" },
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "132-136", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Boiler",
  },
  {
    name: "Bombard",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "34-38", spawnRate: "100%" },
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "134-138", spawnRate: "100%", steelPath: true },
      { planet: "Mars", mission: "Ara", missionType: "Capture", faction: "Grineer", level: "10-12", spawnRate: "100%" },
      { planet: "Saturn", mission: "Caracol", missionType: "Spy", faction: "Grineer", level: "24-28", spawnRate: "100%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Bombard",
  },
  {
    name: "Brood Mother",
    faction: "Infested",
    scansRequired: 4,
    locations: [
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "32-36", spawnRate: "100%" },
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "132-136", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Brood_Mother",
  },
  {
    name: "Butcher",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Mercury", mission: "Terminus", missionType: "Sabotage", faction: "Grineer", level: "8-10", spawnRate: "100%" },
      { planet: "Mercury", mission: "Terminus", missionType: "Sabotage", faction: "Grineer", level: "108-110", spawnRate: "100%", steelPath: true },
      { planet: "Earth", mission: "Lith", missionType: "Capture", faction: "Grineer", level: "1-6", spawnRate: "100%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Butcher",
  },
  {
    name: "Charger",
    faction: "Infested",
    scansRequired: 4,
    locations: [
      { planet: "Earth", mission: "Tikal", missionType: "Excavation", faction: "Infestation", level: "6-16", spawnRate: "100%" },
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "32-36", spawnRate: "100%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Charger",
  },
  {
    name: "Commander",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Saturn", mission: "Caracol", missionType: "Spy", faction: "Grineer", level: "24-28", spawnRate: "100%" },
      { planet: "Ceres", mission: "Draco", missionType: "Survival", faction: "Grineer", level: "20-25", spawnRate: "~56%" },
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "34-38", spawnRate: "100%" },
      { planet: "Lua", mission: "Yuvarium", missionType: "Capture", faction: "Grineer", level: "25-30", spawnRate: "100%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Commander",
  },
  {
    name: "Corrupted Ancient",
    faction: "Orokin",
    scansRequired: 4,
    isResearch: true,
    locations: [
      { planet: "Void", mission: "Hepit", missionType: "Capture", faction: "Orokin", level: "10-15", spawnRate: "~56%" },
      { planet: "Void", mission: "Belenus", missionType: "Survival", faction: "Orokin", level: "25-35", spawnRate: "~75%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Corrupted_Ancient",
  },
  {
    name: "Corrupted Bombard",
    faction: "Orokin",
    scansRequired: 4,
    locations: [
      { planet: "Void", mission: "Marduk", missionType: "Sabotage", faction: "Orokin", level: "20-25", spawnRate: "100%" },
      { planet: "Void", mission: "Marduk", missionType: "Sabotage", faction: "Orokin", level: "120-125", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Corrupted_Bombard",
  },
  {
    name: "Corrupted Butcher",
    faction: "Orokin",
    scansRequired: 4,
    locations: [
      { planet: "Void", mission: "Hepit", missionType: "Capture", faction: "Orokin", level: "10-15", spawnRate: "100%" },
      { planet: "Void", mission: "Hepit", missionType: "Capture", faction: "Orokin", level: "110-115", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Corrupted_Butcher",
  },
  {
    name: "Corrupted Crewman",
    faction: "Orokin",
    scansRequired: 4,
    locations: [
      { planet: "Void", mission: "Hepit", missionType: "Capture", faction: "Orokin", level: "10-15", spawnRate: "100%" },
      { planet: "Void", mission: "Belenus", missionType: "Survival", faction: "Orokin", level: "25-35", spawnRate: "~75%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Corrupted_Crewman",
  },
  {
    name: "Corrupted Heavy Gunner",
    faction: "Orokin",
    scansRequired: 4,
    locations: [
      { planet: "Void", mission: "Belenus", missionType: "Survival", faction: "Orokin", level: "25-35", spawnRate: "~75%" },
      { planet: "Void", mission: "Marduk", missionType: "Sabotage", faction: "Orokin", level: "20-25", spawnRate: "~50%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Corrupted_Heavy_Gunner",
  },
  {
    name: "Corrupted Lancer",
    faction: "Orokin",
    scansRequired: 4,
    locations: [
      { planet: "Void", mission: "Hepit", missionType: "Capture", faction: "Orokin", level: "10-15", spawnRate: "100%" },
      { planet: "Void", mission: "Hepit", missionType: "Capture", faction: "Orokin", level: "110-115", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Corrupted_Lancer",
  },
  {
    name: "Corrupted Nullifier",
    faction: "Orokin",
    scansRequired: 4,
    locations: [
      { planet: "Void", mission: "Marduk", missionType: "Sabotage", faction: "Orokin", level: "20-25", spawnRate: "100%" },
      { planet: "Void", mission: "Mithra", missionType: "Capture", faction: "Orokin", level: "25-30", spawnRate: "~75%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Corrupted_Nullifier",
  },
  {
    name: "Crawler",
    faction: "Infested",
    scansRequired: 4,
    locations: [
      { planet: "Earth", mission: "Tikal", missionType: "Excavation", faction: "Infestation", level: "6-16", spawnRate: "100%" },
      { planet: "Mercury", mission: "Terminus", missionType: "Sabotage", faction: "Grineer + Infestation", level: "8-10", spawnRate: "100%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Crawler",
  },
  {
    name: "Crewman",
    faction: "Corpus",
    scansRequired: 4,
    isResearch: true,
    locations: [
      { planet: "Venus", mission: "Montes", missionType: "Capture", faction: "Corpus", level: "5-10", spawnRate: "100%" },
      { planet: "Venus", mission: "Montes", missionType: "Capture", faction: "Corpus", level: "105-110", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Crewman",
  },
  {
    name: "Drahk Master",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Phobos", mission: "Shklovsky", missionType: "Sabotage", faction: "Grineer", level: "15-17", spawnRate: "100%" },
      { planet: "Phobos", mission: "Shklovsky", missionType: "Sabotage", faction: "Grineer", level: "115-117", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Drahk_Master",
  },
  {
    name: "Elite Crewman",
    faction: "Corpus",
    scansRequired: 4,
    locations: [
      { planet: "Pluto", mission: "Outer Terminus", missionType: "Interception", faction: "Corpus", level: "35-45", spawnRate: "~80%" },
      { planet: "Neptune", mission: "Proteus", missionType: "Sabotage", faction: "Corpus", level: "30-35", spawnRate: "100%" },
      { planet: "Neptune", mission: "Proteus", missionType: "Sabotage", faction: "Corpus", level: "130-135", spawnRate: "100%", steelPath: true },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Elite_Crewman",
  },
  {
    name: "Eviscerator",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Phobos", mission: "Shklovsky", missionType: "Sabotage", faction: "Grineer", level: "15-17", spawnRate: "100%" },
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "34-38", spawnRate: "100%" },
      { planet: "Ceres", mission: "Egeria", missionType: "Capture", faction: "Grineer", level: "17-19", spawnRate: "~82%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Eviscerator",
  },
  {
    name: "Fusion MOA",
    faction: "Corpus",
    scansRequired: 4,
    locations: [
      { planet: "Neptune", mission: "Proteus", missionType: "Sabotage", faction: "Corpus", level: "30-35", spawnRate: "100%" },
      { planet: "Europa", mission: "Baal", missionType: "Exterminate", faction: "Corpus", level: "21-23", spawnRate: "~69%" },
      { planet: "Pluto", mission: "Outer Terminus", missionType: "Interception", faction: "Corpus", level: "35-45", spawnRate: "~75%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Fusion_MOA",
  },
  {
    name: "Guardsman",
    faction: "Grineer",
    scansRequired: 4,
    isResearch: true,
    locations: [
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "34-38", spawnRate: "~69%" },
      { planet: "Ceres", mission: "Egeria", missionType: "Capture", faction: "Grineer", level: "17-19", spawnRate: "~64%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Guardsman",
  },
  {
    name: "Heavy Gunner",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Ceres", mission: "Egeria", missionType: "Capture", faction: "Grineer", level: "17-19", spawnRate: "100%" },
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "34-38", spawnRate: "100%" },
      { planet: "Saturn", mission: "Caracol", missionType: "Spy", faction: "Grineer", level: "24-28", spawnRate: "~80%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Heavy_Gunner",
  },
  {
    name: "Hellion",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Phobos", mission: "Shklovsky", missionType: "Sabotage", faction: "Grineer", level: "15-17", spawnRate: "100%" },
      { planet: "Mars", mission: "Ara", missionType: "Capture", faction: "Grineer", level: "10-12", spawnRate: "~75%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Hellion",
  },
  {
    name: "Lancer",
    faction: "Grineer",
    scansRequired: 4,
    isResearch: true,
    locations: [
      { planet: "Mercury", mission: "Terminus", missionType: "Sabotage", faction: "Grineer", level: "8-10", spawnRate: "100%" },
      { planet: "Earth", mission: "Lith", missionType: "Capture", faction: "Grineer", level: "1-6", spawnRate: "100%" },
      { planet: "Mars", mission: "Ara", missionType: "Capture", faction: "Grineer", level: "10-12", spawnRate: "~75%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Lancer",
  },
  {
    name: "Leaper",
    faction: "Infested",
    scansRequired: 4,
    locations: [
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "32-36", spawnRate: "100%" },
      { planet: "Earth", mission: "Tikal", missionType: "Excavation", faction: "Infestation", level: "6-16", spawnRate: "100%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Leaper",
  },
  {
    name: "MOA",
    faction: "Corpus",
    scansRequired: 4,
    locations: [
      { planet: "Venus", mission: "Montes", missionType: "Capture", faction: "Corpus", level: "5-10", spawnRate: "100%" },
      { planet: "Mercury", mission: "Pantheon", missionType: "Exterminate", faction: "Corpus", level: "7-9", spawnRate: "100%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/MOA",
  },
  {
    name: "Napalm",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "34-38", spawnRate: "100%" },
      { planet: "Ceres", mission: "Egeria", missionType: "Capture", faction: "Grineer", level: "17-19", spawnRate: "~73%" },
      { planet: "Saturn", mission: "Caracol", missionType: "Spy", faction: "Grineer", level: "24-28", spawnRate: "~67%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Napalm",
  },
  {
    name: "Nullifier Crewman",
    faction: "Corpus",
    scansRequired: 4,
    locations: [
      { planet: "Neptune", mission: "Proteus", missionType: "Sabotage", faction: "Corpus", level: "30-35", spawnRate: "100%" },
      { planet: "Neptune", mission: "Proteus", missionType: "Sabotage", faction: "Corpus", level: "130-135", spawnRate: "100%", steelPath: true },
      { planet: "Pluto", mission: "Outer Terminus", missionType: "Interception", faction: "Corpus", level: "35-45", spawnRate: "~80%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Nullifier_Crewman",
  },
  {
    name: "Runner",
    faction: "Infested",
    scansRequired: 4,
    isResearch: true,
    locations: [
      { planet: "Earth", mission: "Tikal", missionType: "Excavation", faction: "Infestation", level: "6-16", spawnRate: "100%" },
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "32-36", spawnRate: "100%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Runner",
  },
  {
    name: "Scorch",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Ceres", mission: "Egeria", missionType: "Capture", faction: "Grineer", level: "17-19", spawnRate: "~73%" },
      { planet: "Saturn", mission: "Caracol", missionType: "Spy", faction: "Grineer", level: "24-28", spawnRate: "~60%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Scorch",
  },
  {
    name: "Scorpion",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Phobos", mission: "Shklovsky", missionType: "Sabotage", faction: "Grineer", level: "15-17", spawnRate: "100%" },
      { planet: "Ceres", mission: "Egeria", missionType: "Capture", faction: "Grineer", level: "17-19", spawnRate: "~82%" },
      { planet: "Mars", mission: "Ara", missionType: "Capture", faction: "Grineer", level: "10-12", spawnRate: "~75%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Scorpion",
  },
  {
    name: "Seeker",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Phobos", mission: "Shklovsky", missionType: "Sabotage", faction: "Grineer", level: "15-17", spawnRate: "100%" },
      { planet: "Mars", mission: "Ara", missionType: "Capture", faction: "Grineer", level: "10-12", spawnRate: "~75%" },
      { planet: "Earth", mission: "Lith", missionType: "Capture", faction: "Grineer", level: "1-6", spawnRate: "~60%", note: "Frontier Seeker variant also valid" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Seeker",
  },
  {
    name: "Shield Lancer",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Mercury", mission: "Terminus", missionType: "Sabotage", faction: "Grineer", level: "8-10", spawnRate: "100%" },
      { planet: "Phobos", mission: "Shklovsky", missionType: "Sabotage", faction: "Grineer", level: "15-17", spawnRate: "~80%" },
      { planet: "Mars", mission: "Ara", missionType: "Capture", faction: "Grineer", level: "10-12", spawnRate: "~67%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Shield_Lancer",
  },
  {
    name: "Swarm-Mutalist MOA",
    faction: "Infested",
    scansRequired: 4,
    locations: [
      { planet: "Eris", mission: "Isos", missionType: "Capture", faction: "Infestation", level: "32-36", spawnRate: "~80%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Swarm-Mutalist_MOA",
  },
  {
    name: "Trooper",
    faction: "Grineer",
    scansRequired: 4,
    locations: [
      { planet: "Uranus", mission: "Ophelia", missionType: "Survival", faction: "Grineer", level: "28-33", spawnRate: "100%" },
      { planet: "Uranus", mission: "Ophelia", missionType: "Survival", faction: "Grineer", level: "128-133", spawnRate: "100%", steelPath: true },
      { planet: "Sedna", mission: "Rusalka", missionType: "Capture", faction: "Grineer", level: "34-38", spawnRate: "~75%" },
    ],
    wikiUrl: "https://wiki.warframe.com/w/Trooper",
  },
];

export const SYNTHESIS_TIPS = [
  { warframe: "Baruuk", ability: "Lull", effect: "Slow + Sleep" },
  { warframe: "Frost", ability: "Snow Globe", effect: "AoE Slow" },
  { warframe: "Ivara", ability: "Quiver (Sleep Arrow)", effect: "AoE Sleep" },
  { warframe: "Harrow", ability: "Condemn", effect: "AoE Root" },
  { warframe: "Khora", ability: "Ensnare", effect: "Freeze" },
  { warframe: "Nezha", ability: "Divine Spears", effect: "AoE Stun" },
  { warframe: "Nova", ability: "Molecular Prime", effect: "AoE Slow" },
  { warframe: "Rhino", ability: "Rhino Stomp", effect: "AoE Slow" },
  { warframe: "Titania", ability: "Spellbind", effect: "AoE Snare" },
  { warframe: "Limbo", ability: "Stasis (in Rift)", effect: "Freeze in Rift" },
  { warframe: "Xaku", ability: "Gaze / Deny", effect: "Freeze / Lift" },
];
