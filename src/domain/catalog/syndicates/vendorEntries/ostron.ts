// ===== FILE: src/domain/catalog/syndicates/vendorEntries/ostron.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const OSTRON_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.OSTRON,
    name: "Ostron",
    rankUps: [
        {
            rank: 5,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Nyth", qty: 1 },
                { kind: "item", name: "Sentirum", qty: 1 },
                { kind: "item", name: "Norg Brain", qty: 1 },
                { kind: "item", name: "Cuthol Tendrils", qty: 1 },
                { kind: "credits", amount: 200_000 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Maprico", qty: 10 },
                { kind: "item", name: "Fersteel Alloy", qty: 40 },
                { kind: "item", name: "Murkray Liver", qty: 5 },
                { kind: "credits", amount: 100_000 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 3,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Cetus Wisp", qty: 1 },
                { kind: "item", name: "Maprico", qty: 5 },
                { kind: "credits", amount: 50_000 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Tear Azurite", qty: 10 },
                { kind: "item", name: "Pyrol", qty: 40 },
                { kind: "item", name: "Fish Scales", qty: 60 },
                { kind: "credits", amount: 25_000 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Nistlepod", qty: 25 },
                { kind: "item", name: "Iradite", qty: 25 },
                { kind: "item", name: "Grokdrul", qty: 25 },
                { kind: "credits", amount: 10_000 },
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
        { name: "Lanzo Fishing Spear", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Hai-Luk" },
        { name: "Tulok Fishing Spear", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Hai-Luk" },
        { name: "Peram Fishing Spear", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Hai-Luk" },
        { name: "Peppered Bait", rankRequired: 0, costs: [{ kind: "standing", amount: 50 }], notes: "Hai-Luk" },
        { name: "Luminous Dye", rankRequired: 0, costs: [{ kind: "standing", amount: 100 }], notes: "Hai-Luk" },
        { name: "Nosam Cutter", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Old Man Suumbaat" },

        { name: "Tear Azurite x10 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Old Man Suumbaat" },
        { name: "Pyrotic Alloy x20 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Old Man Suumbaat" },

        { name: "Ruhang Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Jai Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Peye Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Seekalla Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Laka Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Jayap Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Kwath Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Kroostra Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Korb Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Shtung Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },

        { name: "Balla Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Ooltha Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Kronsh Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Dehtat Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Mewan Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Cyath Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Sepfahn Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Rabvee Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },
        { name: "Dokrahm Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint | Hok" },

        { name: "Kuaka Echo-Lure", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Teasonai" },
        { name: "Kuaka Pheromone Oota", rankRequired: 0, costs: [{ kind: "standing", amount: 100 }], notes: "Teasonai" },

        // Rank 1: Offworlder
        { name: "Twilight Bait", rankRequired: 1, costs: [{ kind: "standing", amount: 100 }], notes: "Hai-Luk" },

        { name: "Mawfish Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint | Hai-Luk" },
        { name: "Khut-Khut Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint | Hai-Luk" },
        { name: "Yogwun Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint | Hai-Luk" },
        { name: "Charc Eel Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint | Hai-Luk" },
        { name: "Goopolla Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint | Hai-Luk" },

        { name: "Esher Devar x10 Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint | Old Man Suumbaat" },
        { name: "Coprite Alloy x20 Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint | Old Man Suumbaat" },

        { name: "Ruhang II Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint | Hok" },
        { name: "Jai II Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint | Hok" },

        { name: "Condroc Echo-Lure", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Teasonai" },
        { name: "Condroc Pheromone Oota", rankRequired: 1, costs: [{ kind: "standing", amount: 200 }], notes: "Teasonai" },

        // Rank 2: Visitor
        { name: "Murkray Bait", rankRequired: 2, costs: [{ kind: "standing", amount: 200 }], notes: "Hai-Luk" },
        { name: "Tralok Trophy Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint | Hai-Luk" },
        { name: "Mortus Lungfish Trophy Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint | Hai-Luk" },

        { name: "Focused Nosam Cutter", rankRequired: 2, costs: [{ kind: "standing", amount: 750 }], notes: "Old Man Suumbaat" },
        { name: "Marquise Veridos x10 Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Old Man Suumbaat" },
        { name: "Fersteel Alloy x20 Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Old Man Suumbaat" },

        { name: "Vargeet Ruhang Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint | Hok" },
        { name: "Ekwana Ruhang Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint | Hok" },
        { name: "Vargeet Jai Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint | Hok" },
        { name: "Ekwana Jai Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint | Hok" },

        { name: "Mergoo Echo-Lure", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Teasonai" },
        { name: "Mergoo Pheromone Oota", rankRequired: 2, costs: [{ kind: "standing", amount: 200 }], notes: "Teasonai" },

        // Rank 3: Trusted
        { name: "Norg Bait", rankRequired: 3, costs: [{ kind: "standing", amount: 300 }], notes: "Hai-Luk" },
        { name: "Sharrac Trophy Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint | Hai-Luk" },
        { name: "Karkina Trophy Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint | Hai-Luk" },
        { name: "Pharoma", rankRequired: 3, costs: [{ kind: "standing", amount: 100 }], notes: "Hai-Luk" },

        { name: "Star Crimzian x6 Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint | Old Man Suumbaat" },
        { name: "Auroxium Alloy x20 Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint | Old Man Suumbaat" },

        { name: "Vargeet II Ruhang Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint | Hok" },
        { name: "Ekwana II Ruhang Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint | Hok" },
        { name: "Vargeet II Jai Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint | Hok" },
        { name: "Ekwana II Jai Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }], notes: "Blueprint | Hok" },

        { name: "Vasca Kavat Echo-Lure", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Teasonai" },
        { name: "Vasca Kavat Pheromone Oota", rankRequired: 3, costs: [{ kind: "standing", amount: 200 }], notes: "Teasonai" },
        { name: "Vasca Curative", rankRequired: 3, costs: [{ kind: "standing", amount: 500 }], notes: "Teasonai" },

        // Rank 4: Surah
        { name: "Cuthol Bait", rankRequired: 4, costs: [{ kind: "standing", amount: 400 }], notes: "Hai-Luk" },
        { name: "Murkray Trophy Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Hai-Luk" },
        { name: "Norg Trophy Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Hai-Luk" },
        { name: "Cuthol Trophy Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Hai-Luk" },
        { name: "Boot Trophy Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Hai-Luk" },

        { name: "Advanced Nosam Cutter", rankRequired: 4, costs: [{ kind: "standing", amount: 1_000 }], notes: "Old Man Suumbaat" },
        { name: "Radian Sentirum x3 Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }], notes: "Blueprint | Old Man Suumbaat" },
        { name: "Heart Nyth x3 Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }], notes: "Blueprint | Old Man Suumbaat" },

        { name: "Cracked Jug", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Old Man Suumbaat" },
        { name: "Wide Fruit Basket", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Old Man Suumbaat" },
        { name: "Modest Fruit Basket", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Old Man Suumbaat" },
        { name: "Bountiful Fruit Basket", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Old Man Suumbaat" },
        { name: "Red Spices", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Old Man Suumbaat" },
        { name: "Iradite Nugget", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Old Man Suumbaat" },

        { name: "Vargeet Ruhang II Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Hok" },
        { name: "Ekwana Ruhang II Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Hok" },
        { name: "Vargeet Jai II Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Hok" },
        { name: "Ekwana Jai II Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint | Hok" },

        // Rank 5: Kin
        { name: "Glappid Bait", rankRequired: 5, costs: [{ kind: "standing", amount: 500 }], notes: "Hai-Luk" },
        { name: "Glappid Trophy Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 12_500 }], notes: "Blueprint | Hai-Luk" },

        { name: "Plains of Eidolon Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 130_000 }], notes: "Old Man Suumbaat" },
        { name: "Cetus Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 130_000 }] },

        { name: "Blue Spices", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }], notes: "Old Man Suumbaat" },
        { name: "Blue Cetus Sign", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }], notes: "Old Man Suumbaat" },
        { name: "Red Cetus Sign", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }], notes: "Old Man Suumbaat" },
        { name: "Green Cetus Sign", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }], notes: "Old Man Suumbaat" },
        { name: "Fishing Boot", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }], notes: "Old Man Suumbaat" },

        { name: "Exodia Brave", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Hok" },
        { name: "Exodia Valor", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Hok" },
        { name: "Exodia Might", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Hok" },
        { name: "Exodia Triumph", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Hok" },
        { name: "Exodia Hunt", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Hok" },
        { name: "Exodia Force", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Hok" },

        { name: "Veridos Glyph", rankRequired: 5, costs: [{ kind: "standing", amount: 75_000 }], notes: "Old Man Suumbaat" },
        { name: "Goopolla Glyph", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Hai-Luk" },
        { name: "Common Condroc Glyph", rankRequired: 5, costs: [{ kind: "standing", amount: 75_000 }], notes: "Teasonai" }
    ]
};
