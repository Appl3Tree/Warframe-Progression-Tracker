// ===== FILE: src/domain/catalog/syndicates/vendorEntries/theQuills.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const THE_QUILLS_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.THE_QUILLS,
    name: "The Quills",
    rankUps: [
        {
            rank: 5,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Eidolon Shard", qty: 30 },
                { kind: "credits", amount: 500_000 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Eidolon Shard", qty: 20 },
                { kind: "credits", amount: 250_000 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 3,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Eidolon Shard", qty: 10 },
                { kind: "credits", amount: 100_000 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Intact Sentient Core", qty: 20 },
                { kind: "credits", amount: 50_000 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Intact Sentient Core", qty: 10 },
                { kind: "credits", amount: 30_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            minimumStanding: 0,
            costs: []
        }
    ],
    offerings: [
        // Rank 0: Neutral
        { name: "Mote Amp Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
        {
            name: "Exceptional Sentient Core Conversion",
            rankRequired: 0,
            costs: [{ kind: "standing", amount: 500 }],
            notes: "Blueprint"
        },

        // Rank 1: Mote
        { name: "Raplak Prism Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
        { name: "Pencha Scaffold Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
        { name: "Clapkra Brace Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },

        { name: "Ceno Cuirass Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
        { name: "Ceno Apparel Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
        { name: "Vahd Cuirass Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
        { name: "Vahd Apparel Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },

        { name: "Magus Vigor", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Virtuos Null", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Quills Mote Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },

        // Rank 2: Observer
        { name: "Shwaak Prism Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
        { name: "Shraksun Scaffold Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
        { name: "Juttni Brace Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },

        { name: "Ceno Pauldrons Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vahd Pauldrons Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

        { name: "Magus Husk", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Virtuos Tempo", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Quills Observer Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },

        // Rank 3: Adherent
        { name: "Granmu Prism Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
        { name: "Klebrik Scaffold Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
        { name: "Lohrin Brace Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },

        { name: "Virtuos Fury", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Ceno Greaves Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint" },
        { name: "Vahd Greaves Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint" },
        { name: "Quills Adherent Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] },

        // Rank 4: Instrument
        { name: "Rahn Prism Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },
        { name: "Phahd Scaffold Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },
        { name: "Anspatha Brace Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },

        { name: "Magus Cloud", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Virtuos Strike", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Ceno Helmet Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },
        { name: "Vahd Mask Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },

        { name: "Magus Cadence", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Replenish", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Glowing Sentient Core", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Decoration" },
        { name: "Eidolon Relic", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Decoration" },

        { name: "Quills Instrument Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },

        // Rank 5: Architect
        { name: "Virtuos Shadow", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Virtuos Ghost", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Elevate", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Nourish", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Cetus Wisp", rankRequired: 5, costs: [{ kind: "standing", amount: 2_000 }] },

        { name: "Agkani Stone", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }], notes: "Decoration" },
        { name: "Hood Display Black", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }], notes: "Decoration" },
        { name: "Hood Display Teal", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }], notes: "Decoration" },
        { name: "Hood Display Grey", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }], notes: "Decoration" },

        { name: "Onkko's Command Post Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Quills Architect Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
    ]
};
