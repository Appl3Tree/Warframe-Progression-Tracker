// Synthesis target data transcribed from the user-provided Steam guide copy/paste.
// Scope rules for this file:
// - Keep locations faithful to that pasted source
// - Include rows that have a listed spawn rate, even if the guide marked them "(unconfirmed)"
// - Do not infer missing values that the guide did not provide

export type SynthesisFaction = "Grineer" | "Corpus" | "Infested" | "Orokin" | "Mixed";
export type SynthesisAvailability = "steel-path" | "both";

export interface SynthesisLocation {
    planet: string;
    mission: string;
    missionType: string;
    faction: string;
    level: string;
    spawnRate: string;
    lastVerified?: string;
    availability?: SynthesisAvailability;
    note?: string;
}

export interface SynthesisTarget {
    name: string;
    faction: SynthesisFaction;
    scansRequired?: number;
    rewardPerTarget?: string;
    endoRewards?: { qty: number; endo?: number }[];
    isResearch?: boolean;
    locations: SynthesisLocation[];
    tips?: string;
}

const BIG_ENDO = [
    { qty: 2, endo: 400 },
    { qty: 3, endo: 560 },
    { qty: 4, endo: 800 },
];

const NORMAL_ENDO = [
    { qty: 2, endo: 250 },
    { qty: 3, endo: 350 },
    { qty: 4, endo: 500 },
];

const loc = (
    planet: string,
    mission: string,
    missionType: string,
    faction: string,
    level: string,
    spawnRate: string,
    lastVerified?: string,
    note?: string,
): SynthesisLocation => ({
    planet,
    mission,
    missionType,
    faction,
    level,
    spawnRate,
    lastVerified,
    note,
});

const sp = (
    planet: string,
    mission: string,
    missionType: string,
    faction: string,
    level: string,
    spawnRate: string,
    lastVerified?: string,
    note?: string,
): SynthesisLocation => ({
    ...loc(planet, mission, missionType, faction, level, spawnRate, lastVerified, note),
    availability: "steel-path",
});

const both = (
    planet: string,
    mission: string,
    missionType: string,
    faction: string,
    level: string,
    spawnRate: string,
    lastVerified?: string,
    note?: string,
): SynthesisLocation => ({
    ...loc(planet, mission, missionType, faction, level, spawnRate, lastVerified, note),
    availability: "both",
});

export const SYNTHESIS_TARGETS: SynthesisTarget[] = [
    {
        name: "Ancient Disruptor",
        faction: "Infested",
        scansRequired: 4,
        rewardPerTarget: "2538 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Earth", "Tikal", "Excavation", "Infestation", "6-16", "100% - 8/8", "2021-10-02"),
            sp("Earth", "Tikal", "Excavation", "Infestation", "106-116", "100% - 2/2", "2021-10-02"),
            loc("Mercury", "Terminus", "Sabotage", "Grineer + Infestation", "8-10", "100% - 18/18", "2021-10-02"),
            sp("Mercury", "Terminus", "Sabotage", "Grineer + Infestation", "108-110", "100% - 2/2", "2021-10-02"),
            loc("Eris", "Isos", "Capture", "Infestation", "32-36", "100% - 26/26", "2021-10-02"),
            sp("Eris", "Isos", "Capture", "Infestation", "132-136", "100% - 4/4", "2021-10-02"),
            loc("Deimos", "???", "???", "Infestation", "??-??", "100% - 4/4", "2020-08-25"),
        ],
    },
    {
        name: "Ancient Healer",
        faction: "Infested",
        locations: [
            loc("Void", "Hepit", "Capture", "Infestation", "10-15", "100% - 4/4", "2018-08-22"),
        ],
    },
    {
        name: "Anti MOA",
        faction: "Corpus",
        scansRequired: 3,
        rewardPerTarget: "3600 (formula ?) lvl 35",
        endoRewards: BIG_ENDO,
        isResearch: true,
        locations: [
            loc("Europa", "Valefor", "Excavation", "Corpus", "18-33", "?% - 0/0", "0000-00-00"),
            loc("Europa", "Baal", "Exterminate", "Corpus", "21-23", "69% - 12/16", "2020-12-27"),
            loc("Lua", "Zeipel", "Rescue", "Orokin Moon", "25-30", "100% - 1/1", "2022-07-02"),
        ],
    },
    {
        name: "Arid Eviscerator",
        faction: "Grineer",
        isResearch: true,
        locations: [
            loc("Mars", "Ara", "Capture", "Grineer", "10-12", "100% - 8/8", "2020-07-31", "Only found on Ara (Mars)."),
        ],
    },
    {
        name: "Ballista",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "2538 + (30 * lvl)",
        endoRewards: [
            { qty: 2, endo: 400 },
            { qty: 3, endo: 560 },
        ],
        locations: [
            loc("Earth", "Mantle", "Capture", "Grineer", "2-4", "82% - 18/22", "2021-10-09"),
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 30/30", "2021-10-09"),
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 3/3", "2021-10-09"),
        ],
    },
    {
        name: "Boiler",
        faction: "Infested",
        scansRequired: 4,
        rewardPerTarget: "2538 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Europa", "Cholistan", "Excavation", "Infestation", "23-33", "100% - 7/7", "2019-01-23"),
            loc("Eris", "Isos", "Capture", "Infestation", "32-36", "100% - 21/21", "2019-11-27"),
            both("Deimos", "Horend", "Capture", "Infestation", "12-14", "100% - 11/11", "2020-12-27"),
        ],
    },
    {
        name: "Bombard",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "2625 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 28/28", "2021-09-16"),
            loc("Ceres", "Nuovo", "Rescue", "Grineer", "13-15", "100% - 5/5", "2021-09-16"),
            loc("Ceres", "Ker", "Sabotage", "Grineer", "14-16", "100% - 5/5", "2021-09-16"),
            loc("Ceres", "Exta", "Assassination", "Grineer", "14-16", "100% - 4/4", "2021-09-16"),
            loc("Ceres", "Bode", "Spy", "Grineer", "12-14", "100% - 3/3", "2021-09-16"),
        ],
    },
    {
        name: "Brood Mother",
        faction: "Infested",
        scansRequired: 4,
        rewardPerTarget: "2538 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Earth", "Tikal", "Excavation", "Infestation", "6-16", "100% - 8/8", "2021-09-24"),
            loc("Ceres", "Gabii", "Survival", "Infestation", "15-25", "100% - 3/5", "Not working ?!"),
            loc("Uranus", "Assur", "Survival", "Infestation", "25-35", "100% - 3/4", "Not working ?!"),
            loc("Eris", "Isos", "Capture", "Infestation", "32-36", "100% - 22/22", "2021-09-24"),
        ],
    },
    {
        name: "Butcher",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "2513 + (30 * lvl)",
        endoRewards: NORMAL_ENDO,
        locations: [
            loc("Mercury", "Caloris", "Rescue", "Grineer", "6-8", "75% - 8/12", "2021-09-19"),
            loc("Mercury", "Elion", "Capture", "Grineer", "7-9", "80% - 19/24", "2021-09-19"),
            loc("Sedna", "Rusalka", "Sabotage", "Grineer", "36-40", "96% - 26/27", "2021-09-19"),
            loc("Earth", "Mantle", "Capture", "Grineer", "2-4", "100% - 18/18", "2021-09-19"),
        ],
    },
    {
        name: "Charger",
        faction: "Infested",
        scansRequired: 4,
        rewardPerTarget: "2513 + (30 * lvl)",
        endoRewards: [{ qty: 3, endo: 350 }],
        locations: [
            loc("Mercury", "Terminus", "Crossfire Sabotage", "Grineer VS Infestation", "8-10", "100% - 19/19", "2021-08-09"),
            loc("Mercury", "M Prime", "Crossfire Exterminate", "Grineer VS Infestation", "7-9", "100% - 2/2", "2021-08-09"),
            loc("Eris", "Isos", "Capture", "Infestation", "32-36", "100% - 17/17", "2021-08-09"),
        ],
    },
    {
        name: "Commander",
        faction: "Grineer",
        locations: [
            loc("Saturn", "Telesto", "Exterminate", "Grineer", "22-24", "100% - 24/24", "2018-05-08"),
        ],
    },
    {
        name: "Corrupted Ancient",
        faction: "Orokin",
        scansRequired: 4,
        rewardPerTarget: "2538 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        isResearch: true,
        locations: [
            loc("Void - T1", "Hepit", "Capture", "Orokin", "10-15", "100% - 34/34", "2022-06-09"),
            sp("Void - T1", "Hepit", "Capture", "Orokin", "110-115", "100% - 1/1", "2022-06-09"),
            loc("Void - T2", "Stribog", "Sabotage", "Orokin", "20-25", "100% - 4/4", "2022-06-09"),
            sp("Void - T2", "Stribog", "Sabotage", "Orokin", "120-125", "100% - 1/1", "2022-06-09"),
            loc("Void - T2", "Ani", "Survival", "Orokin", "20-25", "60% - 3/5", "2022-06-09"),
        ],
    },
    {
        name: "Corrupted Bombard",
        faction: "Orokin",
        scansRequired: 4,
        rewardPerTarget: "2625 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Void - T3", "Oxomoco", "Exterminate", "Orokin", "30-35", "100% - 35/35", "2021-09-07"),
            loc("Void - T4", "Marduk", "Sabotage", "Orokin", "40-45", "100% - 20/20", "2021-09-07"),
            loc("Void - T4", "Aten", "Mobile Defense", "Orokin", "40-45", "100% - 1/1", "2021-09-07"),
        ],
    },
    {
        name: "Corrupted Butcher",
        faction: "Orokin",
        rewardPerTarget: "35 3563 (formula ?)",
        endoRewards: NORMAL_ENDO,
        locations: [
            loc("Void", "Hepit", "Capture", "Orokin", "10-15", "95% - 21/22", "2021-12-11"),
            sp("Void", "Hepit", "Capture", "Orokin", "110-115", "100% - 1/1", "2021-12-11"),
            loc("Void", "Teshub", "Exterminate", "Orokin", "10-15", "100% - 5/5", "2021-12-11"),
            sp("Void", "Teshub", "Exterminate", "Orokin", "110-115", "100% - 1/1", "2021-12-11"),
        ],
    },
    {
        name: "Corrupted Crewman",
        faction: "Orokin",
        scansRequired: 4,
        rewardPerTarget: "2513 + (30 * lvl)",
        endoRewards: NORMAL_ENDO,
        locations: [
            loc("Void", "Hepit", "Capture", "Orokin", "10-15", "100% - 11/11", "2022-01-21"),
            sp("Void", "Hepit", "Capture", "Orokin", "110-115", "100% - 2/2", "2022-01-21"),
            loc("Void", "Teshub", "Exterminate", "Orokin", "10-15", "100% - 3/3", "2022-01-21"),
            sp("Void", "Teshub", "Exterminate", "Orokin", "110-115", "100% - 1/1", "2022-01-21"),
        ],
    },
    {
        name: "Corrupted Heavy Gunner",
        faction: "Orokin",
        scansRequired: 4,
        rewardPerTarget: "2625 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Void - T1", "Hepit", "Capture", "Orokin", "10-15", "100% - 15/15", "2021-09-06"),
            loc("Void - T1", "Teshub", "Exterminate", "Orokin", "10-15", "80% - 4/5", "2021-09-06"),
            loc("Void - T3", "Ukko", "Capture", "Orokin", "30-35", "100% - 5/5", "2021-09-06"),
        ],
    },
    {
        name: "Corrupted Lancer",
        faction: "Orokin",
        scansRequired: 4,
        rewardPerTarget: "2513 + (30 * lvl)",
        endoRewards: NORMAL_ENDO,
        locations: [
            loc("Void", "Hepit", "Capture", "Orokin", "10-15", "100% - 11/11", "2021-10-20"),
            sp("Void", "Hepit", "Capture", "Orokin", "100-115", "100% - 2/2", "2021-10-20"),
            loc("Void", "Ukko", "Capture", "Orokin", "30-35", "100% - 8/8", "2021-10-20"),
            loc("Void", "Ukko", "Capture", "Orokin", "30-35", "100% - 2/2", "2021-10-20"),
        ],
    },
    {
        name: "Corrupted Nullifier",
        faction: "Orokin",
        scansRequired: 4,
        rewardPerTarget: "3768 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Void", "Oxomoco", "Exterminate", "Orokin", "30-35", "80% - 25/31", "2021-09-08"),
            loc("Void - T4", "Marduk", "Sabotage", "Orokin", "40-45", "100% - 3/3", "2021-09-08"),
        ],
    },
    {
        name: "Crawler",
        faction: "Infested",
        scansRequired: 3,
        rewardPerTarget: "2509 + (30 * lvl)",
        endoRewards: NORMAL_ENDO,
        locations: [
            loc("Eris", "Isos", "Capture", "Infestation", "32-36", "100% - 24/24", "2021-12-24"),
            sp("Eris", "Isos", "Capture", "Infestation", "132-136", "100% - 1/1", "2021-12-24"),
            loc("Earth", "Tikal", "Excavation", "Infestation", "6-16", "100% - 6/6", "2021-12-24"),
            sp("Earth", "Tikal", "Excavation", "Infestation", "106-116", "100% - 1/1", "2021-12-24"),
            loc("Europa", "Armaros", "Exterminate", "Grineer+Infestation", "18-20", "100% - 8/8", "2021-12-24"),
            loc("Eris", "Brugia", "Rescue", "Infestation", "32-36", "100% - 3/3", "2021-12-24"),
            loc("Mercury", "Apollodorus", "Surival", "Infestation", "6-11", "50% - 2/4", "2021-12-24"),
            loc("Deimos", "?", "?", "Infestation", "25-35", "100% - 3/3", "2018-03-20"),
        ],
    },
    {
        name: "Crewman",
        faction: "Corpus",
        isResearch: true,
        locations: [
            loc("Lua", "Copernicus", "Capture", "Corpus", "25-30", "100% - 6/6", "2019-08-16"),
        ],
    },
    {
        name: "Drahk Master",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "2538 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Saturn", "Cassini", "Capture", "Grineer", "21-23", "100% - 33/33", "2021-09-17"),
            sp("Saturn", "Cassini", "Capture", "Grineer", "121-123", "88% - 7/8", "2021-09-17"),
            loc("Saturn", "Anthe", "Rescue", "Grineer", "22-24", "91% - 10/11", "2021-09-17"),
            sp("Saturn", "Anthe", "Rescue", "Grineer", "122-124", "100% - 2/2", "2021-09-17"),
        ],
    },
    {
        name: "Elite Crewman",
        faction: "Corpus",
        scansRequired: 4,
        rewardPerTarget: "lvl35 3588 pts",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Lua", "Copernicus", "Capture", "Corpus", "25-30", "100% - 5/5", "2021-08-10"),
            sp("Lua", "Copernicus", "Capture", "Corpus", "125-130", "100% - 3/3", "2022-11-18"),
            loc("Lua", "Zeipel", "Rescue", "Corpus", "25-30", "100% - 3/3", "2021-08-10"),
            loc("Venus", "Venera", "Capture", "Corpus", "5-7", "75% - 3/4", "2021-08-10", "Roof spawn ✘ / Locker room spawn ✔"),
        ],
    },
    {
        name: "Eviscerator",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "2538 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Mars", "Ara", "Capture", "Grineer", "10-12", "100% - 11/11", "2021-11-08"),
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 18/18", "2021-11-08"),
            loc("Ceres", "Ker", "Sabotage", "Grineer", "14-16", "100% - 8/8", "2021-11-08"),
            sp("Ceres", "Ker", "Sabotage", "Grineer", "114-116", "100% - 1/1", "2021-11-08"),
        ],
    },
    {
        name: "Fusion MOA",
        faction: "Corpus",
        scansRequired: 3,
        rewardPerTarget: "2563 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            sp("Venus", "Unda", "Spy", "Corpus", "104-106", "100% - 3/3", "2021-10-23"),
            sp("Venus", "Linea", "Rescue", "Corpus", "105-107", "100% - 3/3", "2021-10-23"),
            loc("Europa", "Kokabiel", "Sabotage", "Corpus", "20-22", "100% - 2/2", "2021-10-23"),
            sp("Europa", "Kokabiel", "Sabotage", "Corpus", "120-122", "100% - 2/2", "2021-10-23"),
            loc("Europa", "Abaddon", "Capture", "Corpus", "21-23", "100% - 2/2", "2021-10-23"),
            sp("Europa", "Abaddon", "Capture", "Corpus", "121-123", "100% - 2/2", "2021-10-23"),
            loc("Neptune", "Galatea", "Capture", "Corpus", "27-29", "100% - 3/3", "2021-10-23"),
            sp("Neptune", "Galatea", "Capture", "Corpus", "127-129", "100% - 2/2", "2021-10-23"),
        ],
    },
    {
        name: "Guardsman",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "35 3575",
        endoRewards: NORMAL_ENDO,
        isResearch: true,
        locations: [
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 27/27", "2021-10-17"),
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 27/27", "2021-10-17"),
            loc("Ceres", "Nuovo", "Rescue", "Grineer", "13-15", "100% - 7/7", "2021-10-17"),
            sp("Ceres", "Nuovo", "Rescue", "Grineer", "113-115", "100% - 1/1", "2021-10-17"),
            loc("Ceres", "Ludi", "Hijack", "Grineer", "13-15", "100% - 5/5", "2021-10-17"),
            sp("Ceres", "Ludi", "Hijack", "Grineer", "113-115", "100% - 1/1", "2021-10-17"),
        ],
    },
    {
        name: "Heavy Gunner",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "2625 + (30 * lvl)",
        endoRewards: [
            { qty: 2, endo: 400 },
            { qty: 4, endo: 800 },
        ],
        locations: [
            loc("Mercury", "Elion", "Capture", "Grineer", "7-9", "95% - 19/21", "2021-11-19"),
            loc("Mercury", "Caloris", "Rescue", "Grineer", "6-8", "100% - 3/3", "2021-11-19"),
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 7/7", "2021-11-19"),
            loc("Sedna", "Rusalka", "Sabotage", "Grineer", "32-36", "100% - 18/18", "2021-11-19"),
        ],
    },
    {
        name: "Hellion",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "2563 + (30 * lvl)",
        endoRewards: [
            { qty: 3, endo: 560 },
            { qty: 4, endo: 800 },
        ],
        locations: [
            loc("Mars", "Ara", "Capture", "Grineer", "10-12", "100% - 16/16", "2021-09-11"),
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 18/18", "2021-09-11"),
            loc("Sedna", "Rusalka", "Sabotage", "Grineer", "32-36", "60% - 9/15", "2019-03-30", "broken ?"),
        ],
    },
    {
        name: "Lancer",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "2513 + (30 * lvl)",
        endoRewards: NORMAL_ENDO,
        isResearch: true,
        locations: [
            loc("Earth", "Cambria", "Spy", "Grineer", "2-4", "100% - 4/4", "2021-11-26"),
            loc("Mercury", "Caloris", "Rescue", "Grineer", "6-8", "82% - 14/17", "2021-11-26"),
            loc("Mercury", "Pantheon", "Exterminate", "Grineer", "6-8", "100% - 17/17", "2021-11-26"),
            loc("Mercury", "Elion", "Capture", "Grineer", "7-9", "83% - 19/23", "2021-11-26"),
            loc("Saturn", "Cassini", "Capture", "Grineer", "21-23", "88% - 14/16", "2021-11-26"),
            loc("Sedna", "Kappa", "Disruption", "Grineer", "34-38", "100% - 2/2", "2021-11-26"),
        ],
    },
    {
        name: "Leaper",
        faction: "Infested",
        scansRequired: 4,
        rewardPerTarget: "2509 + (30 * lvl)",
        endoRewards: NORMAL_ENDO,
        locations: [
            loc("Eris", "Isos", "Capture", "Infestation", "32-36", "100% - 15/15", "2021-09-18"),
            sp("Eris", "Isos", "Capture", "Infestation", "132-136", "100% - 1/1", "2021-09-18"),
            loc("Earth", "Tikal", "Excavation", "Infestation", "6-16", "100% - 10/10", "2021-09-18"),
            loc("Mercury", "Terminus", "Crossfire Sabotage", "Grineer VS. Infestation", "8-10", "92% - 34/37", "2021-09-18"),
            loc("Mercury", "M Prime", "Crossfire Exterminate", "Grineer VS. Infestation", "7-9", "43% - 10/23", "2021-09-18"),
        ],
    },
    {
        name: "MOA",
        faction: "Corpus",
        scansRequired: 3,
        rewardPerTarget: "2513 + (30 * lvl)",
        endoRewards: NORMAL_ENDO,
        locations: [
            loc("Venus", "Venera", "Capture", "Corpus", "5-7", "100% - 23/23", "2021-11-16"),
            loc("Venus", "Linea", "Rescue", "Corpus", "10-12", "100% - 3/3", "2021-11-16"),
            loc("Venus", "E-Gate", "Exterminate", "Corpus", "3-5", "100% - 3/3", "2021-11-16"),
        ],
    },
    {
        name: "Napalm",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "35 3675",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Saturn", "Cassini", "Capture", "Grineer", "21-23", "100% - 26/26", "2021-10-25"),
            sp("Saturn", "Cassini", "Capture", "Grineer", "121-123", "100% - 2/2", "2021-10-25"),
            loc("Sedna", "Selkie", "Survival", "Grineer", "30-40", "100% - 1/1", "2021-10-25"),
            loc("Sedna", "Selkie", "Survival", "Grineer", "30-40", "100% - 4/4", "2021-10-25"),
            loc("Sedna", "Naga", "Rescue", "Grineer", "30-34", "100% - 2/2", "2021-10-25"),
            sp("Sedna", "Naga", "Rescue", "Grineer", "130-134", "100% - 1/1", "2021-10-25"),
        ],
    },
    {
        name: "Nullifier Crewman",
        faction: "Corpus",
        scansRequired: 4,
        rewardPerTarget: "2538 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            sp("Europa", "Abaddon", "Capture", "Corpus", "121-123", "93% - 14/15", "2021-09-22"),
            loc("Europa", "Orias", "Rescue", "Corpus", "21-23", "100% - 4/4", "2021-09-22"),
            sp("Europa", "Orias", "Rescue", "Corpus", "121-123", "100% - 2/2", "2021-09-22"),
            loc("Pluto", "Regna", "Rescue", "Corpus", "34-38", "100% - 6/6", "2021-09-22"),
        ],
    },
    {
        name: "Runner",
        faction: "Infested",
        isResearch: true,
        locations: [
            loc("Eris", "Saxis", "Exterminate", "Infestation", "34-38", "100% - 4/4", "2018-01-06"),
            loc("Deimos", "Phlegyas", "Exterminate", "Infestation", "13-15", "100% - 4/4", "2018-08-31", "feral kavats"),
        ],
    },
    {
        name: "Scorch",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "3675 lvl 35",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Saturn", "Cassini", "Capture", "Grineer", "21-23", "96% - 19/20", "2021-11-01"),
            loc("Saturn", "Dione", "Spy", "Grineer", "21-23", "100% - 6/6", "2021-11-01"),
            loc("Saturn", "Numa", "Rescue", "Grineer", "22-24", "90% - 9/10", "2021-11-01"),
            loc("Saturn", "Anthe", "Rescue", "Grineer", "22-24", "100% - 7/7", "2021-11-01"),
        ],
    },
    {
        name: "Scorpion",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "35 3575",
        endoRewards: NORMAL_ENDO,
        locations: [
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 12/12", "2022-01-29"),
            sp("Ceres", "Lex", "Capture", "Grineer", "114-116", "100% - 2/2", "2022-01-29"),
            loc("Saturn", "Cassini", "Capture", "Grineer", "21-23", "100% - 16/16", "2022-01-29"),
            sp("Saturn", "Cassini", "Capture", "Grineer", "121-123", "100% - 2/2", "2022-01-29"),
            loc("Saturn", "Numa", "Rescue", "Grineer", "22-24", "100% - 5/5", "2022-01-29"),
            sp("Saturn", "Numa", "Rescue", "Grineer", "122-124", "100% - 2/2", "2022-01-29"),
            loc("Lua", "Plato", "Exterminate", "Orokin", "25-30", "100% - 4/4", "2022-01-29"),
        ],
    },
    {
        name: "Seeker / Frontier Seeker",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "35 3588",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Earth", "E Prime", "Exterminate", "Grineer", "1-3", "100% - 1/1", "2020-03-10"),
            loc("Ceres", "Lex", "Capture", "Grineer", "14-16", "100% - 30/30", "2019-11-28"),
            loc("Ceres", "Nuovo", "Rescue", "Grineer", "13-15", "100% - 1/1", "2019-02-11"),
            loc("Sedna", "Kelpie", "Spy", "Grineer", "35-40", "100% - 1/1", "2022-09-24"),
        ],
    },
    {
        name: "Shield Lancer",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "35 3563",
        endoRewards: NORMAL_ENDO,
        locations: [
            loc("Mercury", "Pantheon", "Exterminate", "Grineer", "6-8", "73% - 11/15", "2021-10-08"),
            loc("Mercury", "Caloris", "Rescue", "Grineer", "6-8", "50% - 6/12", "2021-10-08"),
            loc("Mercury", "Elion", "Capture", "Grineer", "7-9", "80% - 25/31", "2022-07-02"),
            sp("Mercury", "Elion", "Capture", "Grineer", "107-109", "100% - 2/2", "2021-10-08"),
            loc("Saturn", "Cassini", "Capture", "Grineer", "21-23", "89% - 27/30", "2024-12-13"),
            sp("Saturn", "Cassini", "Capture", "Grineer", "121-123", "100% - 2/2", "2021-10-08"),
        ],
    },
    {
        name: "Swarm-Mutalist MOA",
        faction: "Infested",
        scansRequired: 3,
        rewardPerTarget: "2538 + (30 * lvl)",
        endoRewards: BIG_ENDO,
        locations: [
            loc("Europa", "Armaros", "Crossfire Exterminate", "Grineer+Infestation", "18-20", "80% - 12/15", "2021-10-28"),
            sp("Europa", "Armaros", "Crossfire Exterminate", "Grineer+Infestation", "118-120", "100% - 2/2", "2021-10-28"),
            loc("Eris", "Isos", "Capture", "Infestation", "32-36", "100% - 32/32", "2021-10-28"),
            sp("Eris", "Isos", "Capture", "Infestation", "132-136", "100% - 3/3", "2021-10-28"),
            loc("Eris", "Brugia", "Rescue", "Infestation", "32-36", "100% - 4/4", "2021-10-28"),
            sp("Eris", "Brugia", "Rescue", "Infestation", "132-136", "100% - 3/3", "2021-10-28"),
        ],
    },
    {
        name: "Trooper",
        faction: "Grineer",
        scansRequired: 4,
        rewardPerTarget: "(formula ?) 35 3575",
        endoRewards: [
            { qty: 2, endo: 250 },
            { qty: 3 },
            { qty: 4, endo: 500 },
        ],
        locations: [
            both("Earth", "Mantle", "Capture", "Grineer", "2-4", "100% - 38/38", "2021-09-29"),
            both("Earth", "E Prime", "Exterminate", "Grineer", "1-3", "100% - 4/4", "2021-09-29"),
            loc("Saturn", "Numa", "Rescue", "Grineer", "22-24", "100% - 4/4", "2021-09-29"),
            both("Saturn", "Cassini", "Capture", "Grineer", "21-23", "100% - 3/3", "2021-09-29"),
            loc("Sedna", "Adaro", "Exterminate", "Grineer", "32-36", "75% - 6/8", "2021-09-29"),
        ],
    },
];

export const SYNTHESIS_TIPS = [
    { warframe: "Baruuk", ability: "Lull", effect: "Slow + Sleep" },
    { warframe: "Frost", ability: "Snow Globe", effect: "AoE Slow" },
    { warframe: "Ivara", ability: "Quiver (Sleep Arrow)", effect: "AoE Sleep" },
    { warframe: "Harrow", ability: "Condemn", effect: "AoE Root" },
    { warframe: "Khora", ability: "Ensnare", effect: "Freeze" },
    { warframe: "Nezha", ability: "Divine Spears", effect: "AoE + Stun" },
    { warframe: "Nova", ability: "Molecular Prime", effect: "AoE Slow" },
    { warframe: "Rhino", ability: "Rhino Stomp", effect: "AoE slow" },
    { warframe: "Titania", ability: "Spellbind", effect: "AoE snare" },
];
