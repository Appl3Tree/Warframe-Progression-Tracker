// ===== FILE: src/domain/catalog/syndicates/vendorEntries/ventkids.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const VENTKIDS_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.VENTKIDS,
    name: "Ventkids",
    rankUps: [
        {
            rank: 5,
            minimumStanding: 0,
            costs: [{ kind: "standing", amount: 99_000 }]
        },
        {
            rank: 4,
            minimumStanding: 0,
            costs: [{ kind: "standing", amount: 70_000 }]
        },
        {
            rank: 3,
            minimumStanding: 0,
            costs: [{ kind: "standing", amount: 44_000 }]
        },
        {
            rank: 2,
            minimumStanding: 0,
            costs: [{ kind: "standing", amount: 22_000 }]
        },
        {
            rank: 1,
            minimumStanding: 0,
            costs: [{ kind: "standing", amount: 5_000 }]
        },
        {
            rank: 0,
            minimumStanding: 0,
            costs: []
        }
    ],
    offerings: [
        // Rank 0: Neutral
        { name: "Bad Baby Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Coldfusor Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Beaky Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Twin Kavats Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

        { name: "Vent Pobber Ventikid Pauldrons Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vent Pobber Ventikid Cuirass Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vent Pobber Ventikid Mask Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vent Pobber Ventikid Apparel Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Vent Pobber Ventikid Greaves Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

        { name: "Kubrodon Ventikid Pauldrons Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Kubrodon Ventikid Cuirass Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Kubrodon Ventikid Mask Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Kubrodon Ventikid Apparel Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
        { name: "Kubrodon Ventikid Greaves Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

        // Rank 1: Glinty
        { name: "Air Time", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Trail Blazer", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Mag Locks", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Rail Guards", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Ventkids Glinty Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },

        // Rank 2: Whozit
        { name: "Flatbelly Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },
        { name: "Arc Twelve Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },
        { name: "Wingnut Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },
        { name: "Step Tens Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },

        { name: "Poppin' Vert", rankRequired: 2, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Pop Top", rankRequired: 2, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Perfect Balance", rankRequired: 2, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Ventkids Whozit Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },

        // Rank 3: Proper Felon
        { name: "Kinetic Friction", rankRequired: 3, costs: [{ kind: "standing", amount: 12_500 }] },
        { name: "Venerdo Hoverdrive", rankRequired: 3, costs: [{ kind: "standing", amount: 12_500 }] },
        { name: "Inertia Dampeners", rankRequired: 3, costs: [{ kind: "standing", amount: 12_500 }] },
        { name: "Slay Board", rankRequired: 3, costs: [{ kind: "standing", amount: 12_500 }] },
        { name: "Ventkids Proper Felon Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] },

        // Rank 4: Primo
        { name: "Needlenose Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
        { name: "Hothead Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
        { name: "Dink-A-Donk Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
        { name: "Fatboys Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },

        { name: "Cold Arrival", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Mad Stack", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Quick Escape", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Ventkids Primo Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },

        // Rank 5: Logical
        { name: "Runway Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
        { name: "Highbrow Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
        { name: "Two-Sloops Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
        { name: "Thugs Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },

        { name: "Sonic Boost", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Extreme Velocity", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Nitro Boost", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Thrash Landing", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Vapor Trail", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Primo Flair", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Juice", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Bomb The Landin'", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },

        { name: "Ventkids Clubhouse Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 130_000 }] },

        { name: "Kompressa Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint" },
        { name: "Kompressa Barrel Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint" },
        { name: "Kompressa Receiver Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint" },

        { name: "Ventkids Logical Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
    ]
};
