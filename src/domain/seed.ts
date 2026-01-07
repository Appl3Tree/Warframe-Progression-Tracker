import type { Inventory, ReserveRule, SyndicateState } from "./types";

/**
 * BRAND-NEW PLAYER SEED (NO PERSONAL PROGRESS)
 * - All inventory counts = 0
 * - All standings/ranks = 0 / neutral
 * - All reserves disabled
 *
 * Any player-specific data must only live in localStorage and/or exported progress JSON.
 */

export const SEED_INVENTORY: Inventory = {
    credits: 0,
    items: {
        // Currencies / universal
        "Aya": 0,
        "Void Traces": 0,

        // Entrati (examples used by rank-up requirements)
        "Sly Vulpaphyla Tag": 0,
        "Vizier Predasite Tag": 0,
        "Mother Token": 0,
        "Son Token": 0,

        // Necraloid
        "Orokin Orientation Matrix": 0,
        "Zymos Barrel Blueprint": 0,
        "Father Token": 0,

        // Ostron
        "Maprico": 0,
        "Cetus Wisp": 0,

        // Quills
        "Eidolon Shard": 0,

        // Solaris United
        "Training Debt-Bond": 0,

        // Vox Solaris
        "Vega Toroid": 0,
        "Calda Toroid": 0,
        "Sola Toroid": 0,

        // Holdfasts
        "Voidplume Down": 0,
        "Ferrite": 0,
        "Alloy Plate": 0,

        // Cavia
        "Shrill Voca": 0,
        "Entrati Obols": 0,
        "Rubedo": 0,

        // The Hex (1999)
        "Efervon Sample": 0,
        "Höllvanian Pitchweave Fragment": 0,
        "Hollars": 0
    }
};

export const SEED_RESERVES: ReserveRule[] = [
    {
        id: "reserve-entrati-r3",
        label: "Reserve for Entrati Rank 3",
        isEnabled: false,
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
        isEnabled: false,
        items: [
            { key: "Orokin Orientation Matrix", minKeep: 10 },
            { key: "Father Token", minKeep: 20 },
            { key: "Zymos Barrel Blueprint", minKeep: 1 },
            { key: "Void Traces", minKeep: 150 }
        ]
    }
];

/**
 * NOTE ON CAPS:
 * Daily standing caps are account-dependent (MR) and syndicate-dependent.
 * Seed should not bake in MR18 numbers. Use a separate setting (e.g., MR) to compute caps.
 *
 * For now we initialize dailyCap to 0 and let the app compute/display an "Unknown until MR set" state.
 */
export const SEED_SYNDICATES: SyndicateState[] = [
    {
        id: "entrati",
        name: "Entrati",
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
            requirements: [
                { key: "Sly Vulpaphyla Tag", need: 3 },
                { key: "Vizier Predasite Tag", need: 3 },
                { key: "Mother Token", need: 1 },
                { key: "Son Token", need: 1 }
            ]
        },
        notes: ""
    },
    {
        id: "necraloid",
        name: "Necraloid",
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
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
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
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
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
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
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
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
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
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
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
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
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
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
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: undefined,
        notes: ""
    },
    {
        id: "hex",
        name: "The Hex (1999)",
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
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
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
            requirements: [
                { key: "Aya", need: 2 },
                { key: "credits", need: 250000 }
            ]
        },
        notes: ""
    },
    {
        id: "suda",
        name: "Cephalon Suda",
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: {
            title: "Next Rank",
            requirements: [
                { key: "Aya", need: 2 },
                { key: "credits", need: 250000 }
            ]
        },
        notes: ""
    },
    {
        id: "steel-meridian",
        name: "Steel Meridian",
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: undefined,
        notes: ""
    },
    {
        id: "simaris",
        name: "Cephalon Simaris",
        rankLabel: "No ranks (standing only)",
        standingCurrent: 0,
        standingMaxForRank: 0,
        dailyCap: 0,
        nextRankUp: undefined,
        notes: ""
    },
    {
        id: "conclave",
        name: "Conclave",
        rankLabel: "Rank 0",
        standingCurrent: 0,
        standingMaxForRank: 5000,
        dailyCap: 0,
        nextRankUp: undefined,
        notes: ""
    }
];

