// ===== FILE: src/domain/catalog/syndicates/vendorEntries/operationalSupply.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const OPERATIONAL_SUPPLY_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.OPERATIONAL_SUPPLY,
    name: "Operational Supply",
    rankUps: [
        {
            rank: 3,
            costs: [
                { kind: "item", name: "Nistlepod", qty: 10 },
                { kind: "credits", amount: 20_000 },
                { kind: "standing", amount: 3_000 }
            ]
        },
        {
            rank: 2,
            costs: [
                { kind: "item", name: "Iradite", qty: 10 },
                { kind: "credits", amount: 10_000 },
                { kind: "standing", amount: 2_000 }
            ]
        },
        {
            rank: 1,
            costs: [
                { kind: "item", name: "Grokdrul", qty: 10 },
                { kind: "credits", amount: 5_000 },
                { kind: "standing", amount: 1_000 }
            ]
        },
        {
            rank: 0,
            costs: []
        }
    ],

    offerings: [
        // Rank 0: Neutral
        { name: "Fosfor Blau (x20) Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 250 }, { kind: "credits", amount: 500 }], notes: "Blueprint" },
        { name: "Fosfor Rahd (x20) Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 250 }, { kind: "credits", amount: 500 }], notes: "Blueprint" },
        { name: "Plague Star Emblem", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }, { kind: "credits", amount: 1_000 }] },
        { name: "Cetus Wisp", rankRequired: 0, costs: [{ kind: "standing", amount: 750 }, { kind: "credits", amount: 1_500 }] },
        { name: "Radian Sentirum", rankRequired: 0, costs: [{ kind: "standing", amount: 750 }, { kind: "credits", amount: 1_500 }] },
        { name: "Heart Nyth", rankRequired: 0, costs: [{ kind: "standing", amount: 750 }, { kind: "credits", amount: 1_500 }] },
        { name: "Murkray Liver", rankRequired: 0, costs: [{ kind: "standing", amount: 750 }, { kind: "credits", amount: 1_500 }] },
        { name: "Norg Brain", rankRequired: 0, costs: [{ kind: "standing", amount: 750 }, { kind: "credits", amount: 1_500 }] },
        { name: "Cuthol Tendrils", rankRequired: 0, costs: [{ kind: "standing", amount: 750 }, { kind: "credits", amount: 1_500 }] },
        { name: "Fulmination", rankRequired: 0, costs: [{ kind: "standing", amount: 1_500 }, { kind: "credits", amount: 3_500 }] },
        { name: "Sacrifice", rankRequired: 0, costs: [{ kind: "standing", amount: 1_500 }, { kind: "credits", amount: 3_500 }] },
        { name: "Forma", rankRequired: 0, costs: [{ kind: "standing", amount: 3_000 }, { kind: "credits", amount: 5_000 }] },
        { name: "Murex Console", rankRequired: 0, costs: [{ kind: "standing", amount: 750 }, { kind: "credits", amount: 1_500 }], notes: "Decoration" },
        { name: "Earth Console", rankRequired: 0, costs: [{ kind: "standing", amount: 750 }, { kind: "credits", amount: 1_500 }], notes: "Decoration" },
        { name: "Hemocyte Sigil", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }, { kind: "credits", amount: 1_000 }] },
        { name: "Hemocyte Glyph", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }, { kind: "credits", amount: 1_000 }] },
        { name: "Hemocyte Floof", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }, { kind: "credits", amount: 3_500 }], notes: "Floof" },

        // Rank 1: Collaborator
        { name: "Eidolon Phylaxis (x5) Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }, { kind: "credits", amount: 4_000 }], notes: "Blueprint" },
        { name: "Snipetron Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 3_000 }, { kind: "credits", amount: 5_000 }], notes: "Blueprint" },
        { name: "Ether Daggers Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 3_000 }, { kind: "credits", amount: 5_000 }], notes: "Blueprint" },
        { name: "Aspirus Ephemera", rankRequired: 1, costs: [{ kind: "standing", amount: 3_000 }, { kind: "credits", amount: 5_000 }], notes: "Ephemera" },

        // Rank 2: Defender
        { name: "Exodia Contagion", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }, { kind: "credits", amount: 1_500 }] },
        { name: "Exodia Epidemic", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }, { kind: "credits", amount: 1_500 }] },
        { name: "Aspirus Emergent Ephemera", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }, { kind: "credits", amount: 8_000 }], notes: "Ephemera" },

        // Rank 3: Champion
        { name: "Ghoulsaw Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }, { kind: "credits", amount: 1_500 }], notes: "Blueprint" },
        { name: "Ghoulsaw Blade Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }, { kind: "credits", amount: 3_500 }], notes: "Blueprint" },
        { name: "Ghoulsaw Chassis Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }, { kind: "credits", amount: 3_500 }], notes: "Blueprint" },
        { name: "Ghoulsaw Engine Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }, { kind: "credits", amount: 3_500 }], notes: "Blueprint" },
        { name: "Ghoulsaw Grip Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }, { kind: "credits", amount: 3_500 }], notes: "Blueprint" },

        { name: "Butcher's Revelry", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }, { kind: "credits", amount: 3_500 }] },

        { name: "Plague Akwin Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_000 }, { kind: "credits", amount: 3_500 }], notes: "Blueprint" },
        { name: "Plague Keewar Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_000 }, { kind: "credits", amount: 3_500 }], notes: "Blueprint" },
        { name: "Plague Bokwin Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_000 }, { kind: "credits", amount: 3_500 }], notes: "Blueprint" },
        { name: "Plague Kripath Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_000 }, { kind: "credits", amount: 3_500 }], notes: "Blueprint" },

        { name: "Omni Forma", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }, { kind: "credits", amount: 10_000 }], notes: "Purchase limit: 1" },
        { name: "Protosomid Shoulder Guard", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }, { kind: "credits", amount: 5_000 }], notes: "Cosmetic armor" },
        { name: "Aspirus Apex Ephemera", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }, { kind: "credits", amount: 10_000 }], notes: "Ephemera" },
        { name: "Cryptanaut Necramech Helmet", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }, { kind: "credits", amount: 10_000 }], notes: "Necramech cosmetic" }
    ]
};
