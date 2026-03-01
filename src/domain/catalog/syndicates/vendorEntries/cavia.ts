// ===== FILE: src/domain/catalog/syndicates/vendorEntries/cavia.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const CAVIA_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.CAVIA,
    name: "Cavia",
    rankUps: [
        {
            rank: 5,
            costs: [
                { kind: "item", name: "Echo Voca", qty: 10 },
                { kind: "item", name: "Necracoil", qty: 25 },
                { kind: "item", name: "Entrati Lanthorn", qty: 10 },
                { kind: "item", name: "Stela", qty: 32 },
                { kind: "credits", amount: 200_000 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            costs: [
                { kind: "item", name: "Echo Voca", qty: 1 },
                { kind: "item", name: "Bellow Voca", qty: 10 },
                { kind: "item", name: "Entrati Obols", qty: 1_500 },
                { kind: "item", name: "Entrati Lanthorn", qty: 5 },
                { kind: "credits", amount: 100_000 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 3,
            costs: [
                { kind: "item", name: "Bellow Voca", qty: 2 },
                { kind: "item", name: "Shrill Voca", qty: 8 },
                { kind: "item", name: "Necracoil", qty: 15 },
                { kind: "item", name: "Stela", qty: 16 },
                { kind: "credits", amount: 50_000 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            costs: [
                { kind: "item", name: "Shrill Voca", qty: 5 },
                { kind: "item", name: "Voidgel Orb", qty: 60 },
                { kind: "item", name: "Necracoil", qty: 12 },
                { kind: "item", name: "Stela", qty: 8 },
                { kind: "credits", amount: 25_000 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            costs: [
                { kind: "item", name: "Shrill Voca", qty: 3 },
                { kind: "item", name: "Entrati Obols", qty: 300 },
                { kind: "item", name: "Rubedo", qty: 1_100 },
                { kind: "credits", amount: 10_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            costs: []
        }
    ],

    // Hub syndicates have multiple vendors sharing the same standing bucket.
    vendors: [
        {
            id: "loid",
            name: "Loid",
            offerings: [
                // Trade-in: Voca -> Standing
                { name: "Trade-in: Shrill Voca", rankRequired: 0, costs: [{ kind: "item", name: "Shrill Voca", qty: 1 }], notes: "Trade-in (+500 Standing)" },
                { name: "Trade-in: Bellow Voca", rankRequired: 0, costs: [{ kind: "item", name: "Bellow Voca", qty: 1 }], notes: "Trade-in (+1,000 Standing)" },
                { name: "Trade-in: Echo Voca", rankRequired: 0, costs: [{ kind: "item", name: "Echo Voca", qty: 1 }], notes: "Trade-in (+2,000 Standing)" },
                { name: "Trade-in: Universal Medallion", rankRequired: 0, costs: [{ kind: "item", name: "Universal Medallion", qty: 1 }], notes: "Trade-in (+1,000 Standing)" },

                // Arcane Dissolution: Arcane Collections
                {
                    name: "Arcane Collection: Cavia",
                    rankRequired: 0,
                    costs: [
                        { kind: "currency", name: "Vosfor", amount: 200 },
                        { kind: "credits", amount: 50_000 }
                    ],
                    notes: "Arcane Dissolution (3 random arcanes)"
                },
                {
                    name: "Arcane Collection: Duviri",
                    rankRequired: 0,
                    costs: [
                        { kind: "currency", name: "Vosfor", amount: 200 },
                        { kind: "credits", amount: 50_000 }
                    ],
                    notes: "Arcane Dissolution (3 random arcanes)"
                },
                {
                    name: "Arcane Collection: Eidolon",
                    rankRequired: 0,
                    costs: [
                        { kind: "currency", name: "Vosfor", amount: 200 },
                        { kind: "credits", amount: 50_000 }
                    ],
                    notes: "Arcane Dissolution (3 random arcanes)"
                },
                {
                    name: "Arcane Collection: Holdfasts",
                    rankRequired: 0,
                    costs: [
                        { kind: "currency", name: "Vosfor", amount: 200 },
                        { kind: "credits", amount: 50_000 }
                    ],
                    notes: "Arcane Dissolution (3 random arcanes)"
                },
                {
                    name: "Arcane Collection: Höllvania",
                    rankRequired: 0,
                    costs: [
                        { kind: "currency", name: "Vosfor", amount: 200 },
                        { kind: "credits", amount: 50_000 }
                    ],
                    notes: "Arcane Dissolution (3 random arcanes)"
                },
                {
                    name: "Arcane Collection: Necralisk",
                    rankRequired: 0,
                    costs: [
                        { kind: "currency", name: "Vosfor", amount: 200 },
                        { kind: "credits", amount: 50_000 }
                    ],
                    notes: "Arcane Dissolution (3 random arcanes)"
                },
                {
                    name: "Arcane Collection: Ostron",
                    rankRequired: 0,
                    costs: [
                        { kind: "currency", name: "Vosfor", amount: 200 },
                        { kind: "credits", amount: 50_000 }
                    ],
                    notes: "Arcane Dissolution (3 random arcanes)"
                },
                {
                    name: "Arcane Collection: Solaris",
                    rankRequired: 0,
                    costs: [
                        { kind: "currency", name: "Vosfor", amount: 200 },
                        { kind: "credits", amount: 50_000 }
                    ],
                    notes: "Arcane Dissolution (3 random arcanes)"
                },
                {
                    name: "Arcane Collection: Steel",
                    rankRequired: 0,
                    costs: [
                        { kind: "currency", name: "Vosfor", amount: 200 },
                        { kind: "credits", amount: 50_000 }
                    ],
                    notes: "Arcane Dissolution (3 random arcanes)"
                },

                // Research Dante: Vessel Capillaries
                { name: "Dante Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 270 }], notes: "Blueprint" },
                { name: "Dante Chassis Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 90 }], notes: "Blueprint" },
                { name: "Dante Neuroptics Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 90 }], notes: "Blueprint" },
                { name: "Dante Systems Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 90 }], notes: "Blueprint" },

                { name: "Onos Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 360 }], notes: "Blueprint" },

                { name: "Ruvox Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 180 }], notes: "Blueprint" },
                { name: "Ruvox Blade Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 45 }], notes: "Blueprint" },
                { name: "Ruvox Glove Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 45 }], notes: "Blueprint" },

                { name: "Riven Transmuter", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 180 }] },
                { name: "Dante's Retreat Scene", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 100 }] },
                { name: "The Abandoned Vessel Scene", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 100 }] },
                { name: "Sanctum Simulacrum", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 75 }] },
                { name: "100,000 Credits", rankRequired: 0, costs: [{ kind: "currency", name: "Vessel Capillaries", amount: 180 }], notes: "Currency exchange" }
            ]
        },

        {
            id: "bird3",
            name: "Bird 3",
            offerings: [
                // Sigils
                { name: "Cavia Assistant Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Cavia Researcher Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Cavia Colleague Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] },
                { name: "Cavia Scholar Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Cavia Illuminate Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },

                // Melee arcanes / adapters
                { name: "Melee Retaliation", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Melee Fortification", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Melee Exposure", rankRequired: 4, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Melee Influence", rankRequired: 4, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Melee Animosity", rankRequired: 4, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Melee Vortex", rankRequired: 4, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Melee Arcane Adapter", rankRequired: 3, costs: [{ kind: "standing", amount: 50_000 }] },

                // Necramech mods
                { name: "Necramech Blitz", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Necramech Enemy Sense", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Necramech Deflection", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Necramech Slipstream", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Necramech Aviator", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Necramech Fury", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Necramech Reach", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },

                { name: "Necramech Redirection", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
                { name: "Necramech Augur", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
                { name: "Necramech Rebuke", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
                { name: "Necramech Rage", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
                { name: "Necramech Hydraulics", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },

                { name: "Necramech Repair", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Necramech Steel Fiber", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Necramech Continuity", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Necramech Stretch", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Necramech Seismic Wave", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },

                { name: "Necramech Streamline", rankRequired: 4, costs: [{ kind: "standing", amount: 28_000 }] },
                { name: "Necramech Thrusters", rankRequired: 4, costs: [{ kind: "standing", amount: 28_000 }] },

                // Segments / weapons / warframes
                { name: "Helminth Coalescent Segment Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 30_000 }], notes: "Blueprint" },

                { name: "Grimoire Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint" },

                { name: "Qorvex Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint" },
                { name: "Qorvex Chassis Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }], notes: "Blueprint" },
                { name: "Qorvex Neuroptics Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }], notes: "Blueprint" },
                { name: "Qorvex Systems Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }], notes: "Blueprint" },

                { name: "Ekhein Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },

                // Captura scenes
                { name: "Albrecht's Archive Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Albrecht's Bureau Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Sanctum Anatomica Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Fragmented Gorge Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Fabrica Anatomica Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

                // Eidolon lenses
                { name: "Eidolon Zenurik Lens", rankRequired: 5, costs: [{ kind: "standing", amount: 60_000 }] },
                { name: "Eidolon Naramon Lens", rankRequired: 5, costs: [{ kind: "standing", amount: 60_000 }] },
                { name: "Eidolon Unairu Lens", rankRequired: 5, costs: [{ kind: "standing", amount: 60_000 }] },
                { name: "Eidolon Vazarin Lens", rankRequired: 5, costs: [{ kind: "standing", amount: 60_000 }] },
                { name: "Eidolon Madurai Lens", rankRequired: 5, costs: [{ kind: "standing", amount: 60_000 }] },

                // Weekly rotation
                { name: "Azure Archon Shard", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }], notes: "Weekly rotation" },
                { name: "Amber Archon Shard", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }], notes: "Weekly rotation" },
                { name: "Crimson Archon Shard", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }], notes: "Weekly rotation" }
            ]
        }
    ]
};
