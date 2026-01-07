import type { Inventory, ReserveRule, SyndicateState } from "./types";

export const SEED_INVENTORY: Inventory = {
    credits: 26629,
    items: {
        "Aya": 27,
        "Void Traces": 448,
        // Entrati (screenshot)
        "Sly Vulpaphyla Tag": 8,
        "Vizier Predasite Tag": 6,
        "Mother Token": 462,
        "Son Token": 3,

        // Necraloid (screenshot)
        "Orokin Orientation Matrix": 2,
        "Zymos Barrel Blueprint": 0,
        "Father Token": 30,

        // Ostron (screenshot)
        "Maprico": 139,
        "Cetus Wisp": 19,

        // Quills (screenshot)
        "Eidolon Shard": 4,

        // Solaris United (screenshot)
        "Training Debt-Bond": 0,

        // Vox Solaris (screenshot)
        "Vega Toroid": 2,
        "Calda Toroid": 3,
        "Sola Toroid": 0,

        // Holdfasts (screenshot)
        "Voidplume Down": 2,
        "Ferrite": 57978,
        "Alloy Plate": 526495,

        // Cavia (screenshot)
        "Shrill Voca": 0,
        "Entrati Obols": 2712,
        "Rubedo": 54149,

        // The Hex (screenshot)
        "Efervon Sample": 3,
        "Höllvanian Pitchweave Fragment": 0,
        "Hollars": 26629
    }
};

export const SEED_RESERVES: ReserveRule[] = [
    {
        id: "reserve-entrati-r3",
        label: "Reserve for Entrati Rank 3",
        isEnabled: true,
        items: [
            { key: "Sly Vulpaphyla Tag", minKeep: 3 },
            { key: "Vizier Predasite Tag", minKeep: 3 },
            { key: "Mother Token", minKeep: 1 },
            { key: "Son Token", minKeep: 1 }
        ]
    },
    {
        id: "reserve-necraloid-r1",
        label: "Reserve for Necraloid Rank 1",
        isEnabled: true,
        items: [
            { key: "Orokin Orientation Matrix", minKeep: 10 },
            { key: "Father Token", minKeep: 20 },
            { key: "Zymos Barrel Blueprint", minKeep: 1 },
            { key: "Void Traces", minKeep: 150 }
        ]
    }
];

export const SEED_SYNDICATES: SyndicateState[] = [
    {
        id: "entrati",
        name: "Entrati",
        rankLabel: "Rank 2 (Acquaintance)",
        standingCurrent: 0,
        standingMaxForRank: 44000,
        dailyCap: 25000,
        nextRankUp: {
            title: "Associate",
            requirements: [
                { key: "Sly Vulpaphyla Tag", need: 3 },
                { key: "Vizier Predasite Tag", need: 3 },
                { key: "Mother Token", need: 1 },
                { key: "Son Token", need: 1 }
            ]
        },
        notes: "Echo-Lures: already spent 2,500 standing earlier (tracked as historical overhead)."
    },
    {
        id: "necraloid",
        name: "Necraloid",
        rankLabel: "Rank 0",
        standingCurrent: 5000,
        standingMaxForRank: 5000,
        dailyCap: 25000,
        nextRankUp: {
            title: "Clearance: Agnesis",
            requirements: [
                { key: "Orokin Orientation Matrix", need: 10 },
                { key: "Void Traces", need: 150 },
                { key: "Zymos Barrel Blueprint", need: 1 },
                { key: "Father Token", need: 20 }
            ]
        },
        notes: ""
    },
    {
        id: "ostron",
        name: "Ostron",
        rankLabel: "Rank 2 (Visitor)",
        standingCurrent: 41755,
        standingMaxForRank: 44000,
        dailyCap: 25000,
        nextRankUp: {
            title: "Trusted",
            requirements: [
                { key: "Maprico", need: 5 },
                { key: "Cetus Wisp", need: 1 },
                { key: "credits", need: 50000 }
            ]
        },
        notes: ""
    },
    {
        id: "quills",
        name: "The Quills",
        rankLabel: "Rank 2 (Observer)",
        standingCurrent: 0,
        standingMaxForRank: 44000,
        dailyCap: 25000,
        nextRankUp: {
            title: "Adherent",
            requirements: [
                { key: "Eidolon Shard", need: 10 },
                { key: "credits", need: 100000 }
            ]
        },
        notes: ""
    },
    {
        id: "solaris-united",
        name: "Solaris United",
        rankLabel: "Rank 0",
        standingCurrent: 300,
        standingMaxForRank: 5000,
        dailyCap: 25000,
        nextRankUp: {
            title: "Outworlder",
            requirements: [
                { key: "Training Debt-Bond", need: 2 },
                { key: "credits", need: 10000 }
            ]
        },
        notes: ""
    },
    {
        id: "vox-solaris",
        name: "Vox Solaris",
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 25000,
        nextRankUp: {
            title: "Operative",
            requirements: [
                { key: "Vega Toroid", need: 1 },
                { key: "Calda Toroid", need: 1 },
                { key: "Sola Toroid", need: 1 },
                { key: "credits", need: 50000 }
            ]
        },
        notes: ""
    },
    {
        id: "holdfasts",
        name: "The Holdfasts",
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 25000,
        nextRankUp: {
            title: "Fallen",
            requirements: [
                { key: "Voidplume Down", need: 5 },
                { key: "Ferrite", need: 2000 },
                { key: "Alloy Plate", need: 2000 },
                { key: "credits", need: 10000 }
            ]
        },
        notes: ""
    },
    {
        id: "cavia",
        name: "Cavia",
        rankLabel: "Rank 0",
        standingCurrent: 500,
        standingMaxForRank: 5000,
        dailyCap: 25000,
        nextRankUp: {
            title: "Assistant",
            requirements: [
                { key: "Shrill Voca", need: 3 },
                { key: "Entrati Obols", need: 300 },
                { key: "Rubedo", need: 1100 },
                { key: "credits", need: 10000 }
            ]
        },
        notes: ""
    },
    {
        id: "ventkids",
        name: "Ventkids",
        rankLabel: "Rank 1 (Glinty)",
        standingCurrent: 2557,
        standingMaxForRank: 22000,
        dailyCap: 25000,
        nextRankUp: undefined,
        notes: "Next rank requirements not captured in the screenshot (in-game showed 'Insufficient Standing')."
    },
    {
        id: "hex",
        name: "The Hex (1999)",
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 25000,
        nextRankUp: {
            title: "Leftovers",
            requirements: [
                { key: "Efervon Sample", need: 15 },
                { key: "Höllvanian Pitchweave Fragment", need: 15 },
                { key: "Hollars", need: 10000 }
            ]
        },
        notes: ""
    },
    {
        id: "arbiters",
        name: "Arbiters of Hexis",
        rankLabel: "Rank 3 (Lawful)",
        standingCurrent: 15440,
        standingMaxForRank: 70000,
        dailyCap: 8247,
        nextRankUp: {
            title: "Crusader",
            requirements: [
                { key: "aya", need: 2 },
                { key: "credits", need: 250000 }
            ]
        },
        notes: ""
    },
    {
        id: "suda",
        name: "Cephalon Suda",
        rankLabel: "Rank 3 (Intelligent)",
        standingCurrent: 12720,
        standingMaxForRank: 70000,
        dailyCap: 8247,
        nextRankUp: {
            title: "Wise",
            requirements: [
                { key: "aya", need: 2 },
                { key: "credits", need: 250000 }
            ]
        },
        notes: ""
    },
    {
        id: "steel-meridian",
        name: "Steel Meridian",
        rankLabel: "Rank 5",
        standingCurrent: 3124,
        standingMaxForRank: 132000,
        dailyCap: 8247,
        nextRankUp: undefined,
        notes: "Next rank requirements not captured yet."
    },
    {
        id: "simaris",
        name: "Cephalon Simaris",
        rankLabel: "No ranks (standing only)",
        standingCurrent: 38789,
        standingMaxForRank: 0,
        dailyCap: 0,
        nextRankUp: undefined,
        notes: ""
    },
    {
        id: "conclave",
        name: "Conclave",
        rankLabel: "Rank 0",
        standingCurrent: 2310,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: undefined,
        notes: ""
    }
];
