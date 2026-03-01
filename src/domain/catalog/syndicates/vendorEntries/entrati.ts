// ===== FILE: src/domain/catalog/syndicates/vendorEntries/entrati.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const ENTRATI_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.ENTRATI,
    name: "Entrati",
    rankUps: [
        {
            rank: 5,
            costs: [
                { kind: "item", name: "Seriglass Shard", qty: 1 },
                { kind: "item", name: "Mother Token", qty: 1 },
                { kind: "item", name: "Father Token", qty: 1 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            costs: [
                { kind: "item", name: "Zarim Mutagen Blueprint", qty: 1 },
                { kind: "item", name: "Arioli Mutagen Blueprint", qty: 1 },
                { kind: "item", name: "Father Token", qty: 1 },
                { kind: "item", name: "Son Token", qty: 1 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 3,
            costs: [
                { kind: "item", name: "Sly Vulpaphyla Tag", qty: 3 },
                { kind: "item", name: "Vizier Predasite Tag", qty: 3 },
                { kind: "item", name: "Mother Token", qty: 1 },
                { kind: "item", name: "Son Token", qty: 1 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            costs: [
                { kind: "item", name: "Keratinos Blade Blueprint", qty: 1 },
                { kind: "item", name: "Father Token", qty: 1 },
                { kind: "item", name: "Daughter Token", qty: 1 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            costs: [
                { kind: "item", name: "Benign Infested Tumor", qty: 6 },
                { kind: "item", name: "Ferment Bladder", qty: 6 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            costs: []
        }
    ],

    // Multi-vendor hub syndicate (Necralisk) sharing the same standing bucket.
    vendors: [
        {
            id: "father",
            name: "Father",
            offerings: [
                // Rank 0: Neutral
                { name: "Vermisplicer Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Sporelacer Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Macro Arcroid Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Thymoid Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Palmaris Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Ulnaris Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },

                { name: "Keratinos Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Keratinos Blade Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Keratinos Gauntlet Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },

                { name: "Damaged Necramech Casing", rankRequired: 0, costs: [{ kind: "standing", amount: 2_000 }] },
                { name: "Damaged Necramech Engine", rankRequired: 0, costs: [{ kind: "standing", amount: 2_000 }] },
                { name: "Damaged Necramech Pod", rankRequired: 0, costs: [{ kind: "standing", amount: 2_000 }] },
                { name: "Damaged Necramech Weapon Pod", rankRequired: 0, costs: [{ kind: "standing", amount: 2_000 }] },

                // Rank 1: Stranger
                { name: "Macro Thymoid Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Arcroid Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },

                { name: "Zymos Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Zymos Barrel Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Zymos Receiver Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },

                // Rank 2: Acquaintance
                { name: "Sepulcrum Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Sepulcrum Barrel Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Sepulcrum Receiver Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },

                { name: "Lavos Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

                // Rank 3: Associate
                { name: "Trumna Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Trumna Barrel Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },
                { name: "Trumna Receiver Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },
                { name: "Trumna Stock Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },

                { name: "Lavos Chassis", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Lavos Neuroptics", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Lavos Systems", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

                // Rank 4: Friend
                { name: "Damzav-Vati (Akbronco Prime)", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zazvat-Kar (Akstiletto Prime)", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Bhisaj-Bal (Paris Prime)", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Hata-Satya (Soma Prime)", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Cedo Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

                // Rank 5: Family
                { name: "Cedo Barrel", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Cedo Receiver", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Cedo Stock", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] }
            ]
        },

        {
            id: "daughter",
            name: "Daughter",
            offerings: [
                // Rank 0: Neutral
                { name: "Spari Spear", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }] },

                // Rank 1: Stranger
                { name: "Cryptosuctus Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
                { name: "Barbisteo Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
                { name: "Kymaeros Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
                { name: "Amniophysi Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
                { name: "Lobotriscid Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },

                // Rank 2: Acquaintance
                { name: "Glutinox Trophy Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Ostimyr Trophy Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Vitreospina Trophy Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },

                // Rank 3: Associate
                { name: "Chondricord Trophy Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Duroid Trophy Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Ebisu Spear", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Processed Fass Residue", rankRequired: 3, costs: [{ kind: "standing", amount: 300 }] },

                // Rank 4: Friend
                { name: "Aquapulmo Trophy Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint" },
                { name: "Flagellocanth Trophy Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint" },
                { name: "Processed Vome Residue", rankRequired: 4, costs: [{ kind: "standing", amount: 400 }] },

                // Rank 5: Family
                { name: "Myxostomata Trophy Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" }
            ]
        },

        {
            id: "son",
            name: "Son",
            offerings: [
                // Rank 0: Neutral
                { name: "Cryptilex Echo-Lure", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }] },
                { name: "Cryptilex Pheromone Gland", rankRequired: 0, costs: [{ kind: "standing", amount: 150 }] },
                { name: "Tranq Rifle", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }] },
                { name: "Purple Velocipod K-Drive Skin", rankRequired: 0, costs: [{ kind: "standing", amount: 50_000 }] },
                { name: "Green Velocipod K-Drive Skin", rankRequired: 0, costs: [{ kind: "standing", amount: 50_000 }] },
                { name: "White Velocipod K-Drive Skin", rankRequired: 0, costs: [{ kind: "standing", amount: 50_000 }] },

                // Rank 1: Stranger
                { name: "Vulpaphyla Echo-Lure", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
                { name: "Vulpaphyla Pheromone Gland", rankRequired: 1, costs: [{ kind: "standing", amount: 150 }] },
                { name: "Predasite Echo-Lure", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
                { name: "Predasite Pheromone Gland", rankRequired: 1, costs: [{ kind: "standing", amount: 150 }] },

                { name: "Desus Antigen Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_250 }], notes: "Blueprint" },
                { name: "Iranon Antigen Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_250 }], notes: "Blueprint" },
                { name: "Adra Mutagen Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_250 }], notes: "Blueprint" },
                { name: "Leptosam Mutagen Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_250 }], notes: "Blueprint" },

                { name: "Entrati Stranger Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },

                // Rank 2: Acquaintance
                { name: "Avichaea Echo-Lure", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }] },
                { name: "Avichaea Pheromone Gland", rankRequired: 2, costs: [{ kind: "standing", amount: 150 }] },

                { name: "Virox Antigen Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },
                { name: "Elasmun Antigen Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },
                { name: "Elsa Mutagen Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },
                { name: "Chiten Mutagen Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_500 }], notes: "Blueprint" },

                { name: "Entrati Acquaintance Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },

                // Rank 3: Associate
                { name: "Undazoa Echo-Lure", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }] },
                { name: "Undazoa Pheromone Gland", rankRequired: 3, costs: [{ kind: "standing", amount: 150 }] },

                { name: "Plagen Antigen Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Ibexan Antigen Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Zarim Mutagen Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Arioli Mutagen Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },

                { name: "Helminth Segment Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
                { name: "Entrati Associate Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] },

                { name: "Vicious Bond (Companion)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Seismic Bond (Companion)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Contagious Bond (Companion)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Duplex Bond (Companion)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },

                // Rank 4: Friend
                { name: "Poxi Antigen Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 6_000 }], notes: "Blueprint" },
                { name: "Tethron Antigen Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 6_000 }], notes: "Blueprint" },
                { name: "Phijar Mutagen Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 6_000 }], notes: "Blueprint" },
                { name: "Monachod Mutagen Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 6_000 }], notes: "Blueprint" },

                { name: "Martyr Symbiosis (Vulpaphyla)", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Volatile Parasite (Predasite)", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Entrati Friend Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },

                // Rank 5: Family
                { name: "Deimos Cambion Drift Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 130_000 }] },
                { name: "Helminth Invigoration Segment Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }], notes: "Blueprint" },
                { name: "Entrati Family Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
            ]
        },

        {
            id: "grandmother",
            name: "Grandmother",
            offerings: [
                // Always available
                { name: "Seriglass Shard", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 10 }] },
                { name: "Deimos Vault Scene", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 50 }] },
                { name: "Deimos Breakthrough Scene", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 50 }] },
                { name: "Deimos Catacombs Scene", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 50 }] },
                { name: "Deimos Downfall Scene", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 50 }] },
                { name: "Deimos Underground Scene", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 50 }] },
                { name: "Deimos Tunnels Scene", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 50 }] },

                // On rotation (token costs shown in the provided data)
                { name: "Fass Glyph", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 15 }] },
                { name: "Jahu Glyph", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 15 }] },
                { name: "Khra Glyph", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 15 }] },
                { name: "Lohk Glyph", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 15 }] },
                { name: "Netra Glyph", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 15 }] },
                { name: "Ris Glyph", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 15 }] },
                { name: "Vome Glyph", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 15 }] },
                { name: "Xata Glyph", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 15 }] },

                { name: "Daughter Token Ornament", rankRequired: 0, costs: [{ kind: "item", name: "Daughter Token", qty: 10 }, { kind: "item", name: "Grandmother Token", qty: 5 }] },
                { name: "Father Token Ornament", rankRequired: 0, costs: [{ kind: "item", name: "Father Token", qty: 10 }, { kind: "item", name: "Grandmother Token", qty: 5 }] },
                { name: "Grandmother Token Ornament", rankRequired: 0, costs: [{ kind: "item", name: "Grandmother Token", qty: 10 }] },
                { name: "Mother Token Ornament", rankRequired: 0, costs: [{ kind: "item", name: "Mother Token", qty: 10 }, { kind: "item", name: "Grandmother Token", qty: 5 }] },
                { name: "Otak Token Ornament", rankRequired: 0, costs: [{ kind: "item", name: "Otak Token", qty: 10 }, { kind: "item", name: "Grandmother Token", qty: 5 }] },
                { name: "Son Token Ornament", rankRequired: 0, costs: [{ kind: "item", name: "Son Token", qty: 10 }, { kind: "item", name: "Grandmother Token", qty: 5 }] },

                // Rotation list items shown without explicit token costs in the provided snippet
                { name: "Ansophys", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Auroron", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Glynort", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Groptic", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Kybus", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Lychnus", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Rolizor", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Spilosect", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Sprongi", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Veforg", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] },
                { name: "Orokin Tree Planter", rankRequired: 0, costs: [{ kind: "other", label: "On rotation (token cost not provided)" }] }
            ]
        },

        {
            id: "otak",
            name: "Otak",
            offerings: [
                // Rank 0: Neutral
                { name: "Faceted Tiametrite X10 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Purged Dagonic X10 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Adramal Alloy X20 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Tempered Bapholite X20 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },

                // Rank 1: Stranger
                { name: "Purified Heciphron X10 Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Devolved Namalon X20 Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },

                // Rank 2: Acquaintance
                { name: "Stellated Necrathene X10 Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Thaumic Distillate X20 Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Relic Pack (3 x Random Void Relics)", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },

                // Rank 3: Associate
                { name: "Trapezium Xenorhast X3 Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 8_000 }], notes: "Blueprint" },
                { name: "Cabochon Embolos X3 Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 8_000 }], notes: "Blueprint" }
            ]
        }
    ]
};
