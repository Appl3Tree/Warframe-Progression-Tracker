// Kahl's Garrison is SINGLE-VENDOR by your rule-set:
// it has an "Offerings" section and the wares are explicitly under one vendor (Chipper).
// So: DO NOT use `vendors: [...]` here. Use plain `offerings: [...]`.
// Also: no Standing. Costs are Stock -> use kind: "currency".
//
// ===== FILE: src/domain/catalog/syndicates/vendorEntries/kahlsGarrison.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const KAHLS_GARRISON_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.KAHLS_GARRISON,
    name: "Kahl's Garrison",

    // This syndicate does not use Standing rank-up sacrifices (ranks are time/mission-gated),
    // so keep rankUps present but with empty costs to avoid implying prices.
    // If your UI needs the rank list, this preserves it without fake data.
    rankUps: [],
    rankInfo:
        "Kahl's Garrison does not have Standing and automatically ranks up upon completion of Kahl's Break Narmer weekly missions.\n" +
        "It takes four weeks to reach max rank.",

    offerings: [
        // Rank 2: Encampment
        { name: "Styanax Systems Blueprint", rankRequired: 2, costs: [{ kind: "currency", name: "Stock", amount: 60 }], notes: "Blueprint" },
        { name: "Slaytra Blueprint", rankRequired: 2, costs: [{ kind: "currency", name: "Stock", amount: 30 }], notes: "Blueprint" },

        // Rank 3: Fort
        { name: "Styanax Neuroptics Blueprint", rankRequired: 3, costs: [{ kind: "currency", name: "Stock", amount: 60 }], notes: "Blueprint" },
        { name: "Archon Continuity", rankRequired: 3, costs: [{ kind: "currency", name: "Stock", amount: 40 }] },
        { name: "Archon Stretch", rankRequired: 3, costs: [{ kind: "currency", name: "Stock", amount: 40 }] },
        { name: "Archon Intensify", rankRequired: 3, costs: [{ kind: "currency", name: "Stock", amount: 40 }] },
        { name: "Archon Vitality", rankRequired: 3, costs: [{ kind: "currency", name: "Stock", amount: 40 }] },
        { name: "Archon Flow", rankRequired: 3, costs: [{ kind: "currency", name: "Stock", amount: 40 }] },

        // Rank 4: Settlement
        { name: "Styanax Chassis Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Stock", amount: 60 }], notes: "Blueprint" },
        { name: "Aegrit Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Stock", amount: 30 }], notes: "Blueprint" },

        // Rank 5: Home
        { name: "Styanax Blueprint", rankRequired: 5, costs: [{ kind: "currency", name: "Stock", amount: 90 }], notes: "Blueprint" },
        { name: "Skaut", rankRequired: 5, costs: [{ kind: "currency", name: "Stock", amount: 120 }] },
        { name: "Afentis Blueprint", rankRequired: 5, costs: [{ kind: "currency", name: "Stock", amount: 60 }], notes: "Blueprint" },

        { name: "Fog Of War Ephemera", rankRequired: 5, costs: [{ kind: "currency", name: "Stock", amount: 45 }] },
        { name: "Shard Hex Ephemera", rankRequired: 5, costs: [{ kind: "currency", name: "Stock", amount: 45 }] },
        { name: "Shard Bane Ephemera", rankRequired: 5, costs: [{ kind: "currency", name: "Stock", amount: 45 }] },

        { name: "Veilbreak Forest Scene", rankRequired: 5, costs: [{ kind: "currency", name: "Stock", amount: 45 }] },
        { name: "Veilbreak Murex Scene", rankRequired: 5, costs: [{ kind: "currency", name: "Stock", amount: 45 }] },
        { name: "Veilbreak Factory Scene", rankRequired: 5, costs: [{ kind: "currency", name: "Stock", amount: 45 }] }
    ]
};
