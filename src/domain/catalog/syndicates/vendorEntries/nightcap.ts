// ===== FILE: src/domain/catalog/syndicates/vendorEntries/nightcap.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

/**
 * Nightcap:
 * - No Standing.
 * - Rank-ups granted by fully analyzing mushrooms.
 * - Rank thresholds are cumulative mushrooms analyzed.
 * - All wares use Fergolyte (not standing).
 */
export const NIGHTCAP_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.NIGHTCAP,
    name: "Nightcap",

    // Rank-ups are progression gates, not currency exchanges.
    // We model the unlock requirement as item costs for consistency.
    rankUps: [
        {
            rank: 5,
            costs: [{ kind: "item", name: "Mushroom (Analyzed)", qty: 16 }]
        },
        {
            rank: 4,
            costs: [{ kind: "item", name: "Mushroom (Analyzed)", qty: 12 }]
        },
        {
            rank: 3,
            costs: [{ kind: "item", name: "Mushroom (Analyzed)", qty: 6 }]
        },
        {
            rank: 2,
            costs: [{ kind: "item", name: "Mushroom (Analyzed)", qty: 2 }]
        },
        {
            rank: 1,
            costs: [{ kind: "item", name: "Mushroom (Analyzed)", qty: 1 }]
        },
        {
            rank: 0,
            costs: []
        }
    ],

    offerings: [
        // Rank 0 - Neutral
        { name: "Dull Button", rankRequired: 0, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Ironwood", rankRequired: 0, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Thorn Tooth", rankRequired: 0, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Devil's Cap", rankRequired: 0, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },

        // Rank 1 - Unknowing
        { name: "Blister Stalk", rankRequired: 1, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Winter Spear", rankRequired: 1, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Thunder-Button", rankRequired: 1, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Muck Bonnet", rankRequired: 1, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },

        // Rank 2 - Curious
        { name: "Borica", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Spring Popper", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Reeking Puffball", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Ferrofungus", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Gamma Berry", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Violet's Bane", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Nonono", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Vomval Trumpet", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },

        { name: "Onemind", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 25 }] },
        { name: "Onemind Poster", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 25 }], notes: "Poster" },
        { name: "Roots N' Fruits", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 25 }] },
        { name: "Roots N' Fruits Poster", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 25 }], notes: "Poster" },
        { name: "Shooms", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 25 }] },
        { name: "Shooms Poster", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 25 }], notes: "Poster" },

        { name: "Vapor Specter x10 Blueprint", rankRequired: 2, costs: [{ kind: "item", name: "Fergolyte", qty: 50 }], notes: "Blueprint; weekly limit 7" },

        // Rank 3 - Seeker
        { name: "Arbucep Blueprint", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 220 }], notes: "Blueprint" },
        { name: "Arbucep Barrel Blueprint", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 150 }], notes: "Blueprint" },
        { name: "Arbucep Receiver Blueprint", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 150 }], notes: "Blueprint" },
        { name: "Arbucep Stock Blueprint", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 150 }], notes: "Blueprint" },

        { name: "Archgun Arcane Adapter", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 80 }] },
        { name: "Primary Frostbite", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Primary Blight", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Conjunction Voltage", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Secondary Encumber", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },
        { name: "Secondary Fortifier", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 10 }] },

        { name: "Ayatan Chattraka Sculpture", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 75 }], notes: "Weekly limit 1" },
        { name: "Kuva", rankRequired: 3, costs: [{ kind: "item", name: "Fergolyte", qty: 75 }], notes: "Weekly limit 6" },

        // Rank 4 - Gardener
        { name: "Nokko Blueprint", rankRequired: 4, costs: [{ kind: "item", name: "Fergolyte", qty: 240 }], notes: "Blueprint" },
        { name: "Nokko Chassis Blueprint", rankRequired: 4, costs: [{ kind: "item", name: "Fergolyte", qty: 160 }], notes: "Blueprint" },
        { name: "Nokko Neuroptics Blueprint", rankRequired: 4, costs: [{ kind: "item", name: "Fergolyte", qty: 160 }], notes: "Blueprint" },
        { name: "Nokko Systems Blueprint", rankRequired: 4, costs: [{ kind: "item", name: "Fergolyte", qty: 160 }], notes: "Blueprint" },

        // Rank 5 - Steward
        { name: "Rizoma Ephemera", rankRequired: 5, costs: [{ kind: "item", name: "Fergolyte", qty: 150 }], notes: "Ephemera" },

        { name: "Deepmines Scene", rankRequired: 5, costs: [{ kind: "item", name: "Fergolyte", qty: 60 }], notes: "Captura" },
        { name: "Deepmines Caves Scene", rankRequired: 5, costs: [{ kind: "item", name: "Fergolyte", qty: 60 }], notes: "Captura" },
        { name: "Deepmines Forward Base Scene", rankRequired: 5, costs: [{ kind: "item", name: "Fergolyte", qty: 60 }], notes: "Captura" },
        { name: "Deepmines Lab Scene", rankRequired: 5, costs: [{ kind: "item", name: "Fergolyte", qty: 60 }], notes: "Captura" },
        { name: "Deepmines Nutrient Plant Scene", rankRequired: 5, costs: [{ kind: "item", name: "Fergolyte", qty: 60 }], notes: "Captura" }
    ]
};
