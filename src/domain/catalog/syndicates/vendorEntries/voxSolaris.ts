// ===== FILE: src/domain/catalog/syndicates/vendorEntries/voxSolaris.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const VOX_SOLARIS_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.VOX_SOLARIS,
    name: "Vox Solaris",

    rankUps: [
        {
            rank: 5,
            costs: [
                { kind: "item", name: "Crisma Toroid", qty: 1 },
                { kind: "credits", amount: 1_000_000 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            costs: [
                { kind: "item", name: "Repeller Systems", qty: 1 },
                { kind: "item", name: "Sola Toroid", qty: 1 },
                { kind: "credits", amount: 500_000 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 3,
            costs: [
                { kind: "item", name: "Atmo Systems", qty: 1 },
                { kind: "item", name: "Calda Toroid", qty: 1 },
                { kind: "credits", amount: 250_000 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            costs: [
                { kind: "item", name: "Gyromag Systems", qty: 1 },
                { kind: "item", name: "Vega Toroid", qty: 1 },
                { kind: "credits", amount: 100_000 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            costs: [
                { kind: "item", name: "Calda Toroid", qty: 1 },
                { kind: "item", name: "Vega Toroid", qty: 1 },
                { kind: "item", name: "Sola Toroid", qty: 1 },
                { kind: "credits", amount: 50_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            costs: []
        }
    ],

    offerings: [
        // Rank 0
        { name: "Haztech Pauldrons Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Haztech Cuirass Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Haztech Apparel Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Haztech Mask Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Haztech Greaves Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Smelter Pauldrons Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Smelter Cuirass Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Smelter Apparel Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Smelter Mask Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Smelter Greaves Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

        // Rank 1
        { name: "Outrider Pauldrons Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Outrider Cuirass Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Outrider Mask Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Outrider Greaves Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vent Rat Pauldrons Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vent Rat Cuirass Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vent Rat Mask Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vent Rat Greaves Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vox Solaris Operative Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },

        // Rank 2
        { name: "Cantic Prism Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
        { name: "Exard Scaffold Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
        { name: "Suo Brace Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
        { name: "Virtuos Surge", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Virtuos Spike", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Baruuk Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Hildryn Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vox Solaris Agent Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },

        // Rank 3
        { name: "Lega Prism Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
        { name: "Dissic Scaffold Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
        { name: "Plaga Brace Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
        { name: "Baruuk Chassis Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Baruuk Neuroptics Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Baruuk Systems Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Virtuos Forge", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Virtuos Trojan", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Gyromag Systems", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "Atmo Systems", rankRequired: 2, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Repeller Systems", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Vox Solaris Hand Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] },

        // Rank 4
        { name: "Klamora Prism Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
        { name: "Propa Scaffold Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
        { name: "Certus Brace Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
        { name: "Magus Anomaly", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Destruct", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Lockdown", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Firewall", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Drive", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Vox Solaris Instrument Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },

        // Rank 5
        { name: "Magus Repair", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Melt", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Overload", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Accelerant", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Glitch", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Magus Revert", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Praghasa Throne Room Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 130_000 }] },
        { name: "Vox Solaris Shadow Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
    ]
};
