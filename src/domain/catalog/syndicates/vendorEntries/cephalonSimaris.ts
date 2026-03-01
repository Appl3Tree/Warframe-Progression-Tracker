// ===== FILE: src/domain/catalog/syndicates/vendorEntries/cephalonSimaris.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const CEPHALON_SIMARIS_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.CEPHALON_SIMARIS,
    name: "Cephalon Simaris",
    rankUps: [],
    offerings: [
        // Core items
        { name: "Synthesis Scanner x 25", costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Kinetic Siphon Trap x 10", costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Cephalon Simaris Sigil", costs: [{ kind: "standing", amount: 25_000 }] },

        // Transmute cores
        { name: "Madurai Transmute Core", costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Vazarin Transmute Core", costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Naramon Transmute Core", costs: [{ kind: "standing", amount: 5_000 }] },

        // Scanner widgets
        { name: "Data-Parse Widget", costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Cross-Matrix Widget", costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Sol-Battery Widget", costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Vector-Thread Widget", costs: [{ kind: "standing", amount: 50_000 }] },

        // Companion mods
        { name: "Looter", costs: [{ kind: "standing", amount: 75_000 }] },
        { name: "Detect Vulnerability", costs: [{ kind: "standing", amount: 75_000 }] },
        { name: "Reawaken", costs: [{ kind: "standing", amount: 75_000 }] },
        { name: "Negate", costs: [{ kind: "standing", amount: 75_000 }] },
        { name: "Ambush", costs: [{ kind: "standing", amount: 75_000 }] },
        { name: "Energy Generator", costs: [{ kind: "standing", amount: 75_000 }] },
        { name: "Botanist", costs: [{ kind: "standing", amount: 75_000 }] },

        // Mods
        { name: "Energy Conversion", costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Health Conversion", costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Astral Autopsy", costs: [{ kind: "standing", amount: 100_000 }] },

        // Access / cosmetics / misc
        { name: "Simulacrum Access Key", costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Simaris Helios Skin", costs: [{ kind: "standing", amount: 100_000 }] },

        // Weapon blueprints
        { name: "Simulor Blueprint", costs: [{ kind: "standing", amount: 75_000 }], notes: "Blueprint" },
        { name: "Heliocor Blueprint", costs: [{ kind: "standing", amount: 75_000 }], notes: "Blueprint" },

        // Adapters
        {
            name: "Exilus Warframe Adapter Blueprint",
            costs: [{ kind: "standing", amount: 50_000 }],
            notes: "Blueprint; Complete Natah (Quest)"
        },

        // Captura scenes
        { name: "Color Key Scene", costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Orokin Derelict Plaza Scene", costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Sanctuary Conduit Scene", costs: [{ kind: "standing", amount: 100_000 }] },

        // Quest-gated
        { name: "Orvius Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Complete The War Within" },

        // Ludoplex / minigames / decor
        { name: "Ludoplex", costs: [{ kind: "standing", amount: 40_000 }] },
        { name: "Happy Zephyr", costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Wyrmius", costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Simaris Offerings Console", costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Simaris Research Console", costs: [{ kind: "standing", amount: 20_000 }] },

        // Rivens
        { name: "Companion Weapon Riven Mod", costs: [{ kind: "standing", amount: 100_000 }] },

        // Warframes / components / exclusives
        { name: "Gara Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete Saya's Vigil" },

        { name: "Limbo Chassis Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete The Limbo Theorem" },
        { name: "Limbo Neuroptics Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete The Limbo Theorem" },
        { name: "Limbo Systems Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete The Limbo Theorem" },

        { name: "Chroma Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete The New Strange" },
        { name: "Chroma Chassis Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Neptune Junction" },
        { name: "Chroma Neuroptics Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Uranus Junction" },
        { name: "Chroma Systems Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Pluto Junction" },

        { name: "Mirage Chassis Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Hidden Messages" },
        { name: "Mirage Neuroptics Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Hidden Messages" },
        { name: "Mirage Systems Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Hidden Messages" },

        { name: "Harrow Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete Chains of Harrow" },
        { name: "Yareli Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete The Waverider" },

        { name: "Inaros Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete Sands of Inaros" },
        { name: "Inaros Chassis Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Sands of Inaros" },
        { name: "Inaros Neuroptics Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Sands of Inaros" },
        { name: "Inaros Systems Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Sands of Inaros" },

        { name: "Titania Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete The Silver Grove" },
        { name: "Titania Chassis Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete The Silver Grove" },
        { name: "Titania Neuroptics Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete The Silver Grove" },
        { name: "Titania Systems Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete The Silver Grove" },

        { name: "Nidus Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete The Glast Gambit" },
        { name: "Octavia Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete Octavia's Anthem" },
        { name: "Atlas Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete The Jordas Precept" },

        { name: "Broken Scepter Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Complete The War Within" },

        // Archwing set
        { name: "Odonata Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Complete The Archwing (Quest)" },
        { name: "Odonata Harness Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete The Archwing (Quest)" },
        { name: "Odonata Systems Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete The Archwing (Quest)" },
        { name: "Odonata Wings Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete The Archwing (Quest)" },
        { name: "Imperator Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Complete The Archwing (Quest)" },
        { name: "Veritux Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Complete The Archwing (Quest)" },

        { name: "Revenant Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete Mask of the Revenant" },
        { name: "Garuda Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete Vox Solaris (Quest)" },
        { name: "Protea Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete The Deadlock Protocol" },
        { name: "Sevagoth Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete Call of the Tempestarii" },
        { name: "Xaku Blueprint", costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint; Complete Heart of Deimos" },

        { name: "Mandachord Blueprint", costs: [{ kind: "standing", amount: 25_000 }], notes: "Blueprint; Complete Octavia's Anthem" },
        { name: "Shedu Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Complete Erra (Quest)" },

        // Sacrifice rewards
        { name: "Umbral Vitality", costs: [{ kind: "standing", amount: 100_000 }], notes: "Complete The Sacrifice" },
        { name: "Umbral Fiber", costs: [{ kind: "standing", amount: 100_000 }], notes: "Complete The Sacrifice" },
        { name: "Umbral Intensify", costs: [{ kind: "standing", amount: 100_000 }], notes: "Complete The Sacrifice" },
        { name: "Sacrificial Pressure", costs: [{ kind: "standing", amount: 100_000 }], notes: "Complete The Sacrifice" },
        { name: "Sacrificial Steel", costs: [{ kind: "standing", amount: 100_000 }], notes: "Complete The Sacrifice" },

        // Xoris set
        { name: "Xoris Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through The Deadlock Protocol" },
        { name: "Xoris Blade", costs: [{ kind: "standing", amount: 15_000 }], notes: "Unlock through The Deadlock Protocol" },
        { name: "Xoris Core", costs: [{ kind: "standing", amount: 15_000 }], notes: "Unlock through The Deadlock Protocol" },
        { name: "Xoris Handle", costs: [{ kind: "standing", amount: 15_000 }], notes: "Unlock through The Deadlock Protocol" },

        { name: "Ether Daggers Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Stolen Dreams" },

        // Daily tribute repurchases
        { name: "Zenistar Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Daily Tribute" },
        { name: "Azima Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Daily Tribute" },
        { name: "Zenith Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Daily Tribute" },
        { name: "Sigma & Octantis Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Daily Tribute" },
        { name: "Machete Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Daily Tribute" },

        { name: "Vitrica Blueprint", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Defeat the Glassmaker" },

        // War parts
        { name: "War Hilt", costs: [{ kind: "standing", amount: 50_000 }], notes: "Complete The Second Dream" },
        { name: "War Blade", costs: [{ kind: "standing", amount: 50_000 }], notes: "Complete The Second Dream" },

        { name: "Paracesis Sheath", costs: [{ kind: "standing", amount: 20_000 }], notes: "Complete Chimera Prologue" },

        // New War repurchases
        { name: "Nataruk", costs: [{ kind: "standing", amount: 100_000 }], notes: "Complete The New War" },
        { name: "Sirocco", costs: [{ kind: "standing", amount: 100_000 }], notes: "Complete The New War" },
        { name: "Rumblejack", costs: [{ kind: "standing", amount: 100_000 }], notes: "Complete The New War" },

        // Duviri / Cave
        { name: "Sun & Moon", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Complete The Duviri Paradox" },
        { name: "Syam", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Teshin's Cave" },
        { name: "Sampotes", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Teshin's Cave" },
        { name: "Edun", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Teshin's Cave" },
        { name: "Azothane", costs: [{ kind: "standing", amount: 100_000 }], notes: "Blueprint; Unlock through Teshin's Cave" }
    ]
};
