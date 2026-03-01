// ===== FILE: src/domain/catalog/syndicates/vendorEntries/solarisUnited.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const SOLARIS_UNITED_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.SOLARIS_UNITED,
    name: "Solaris United",
    rankUps: [
        {
            rank: 5,
            costs: [
                { kind: "item", name: "Familial Debt-Bond", qty: 5 },
                { kind: "item", name: "Advances Debt-Bond", qty: 5 },
                { kind: "item", name: "Medical Debt-Bond", qty: 3 },
                { kind: "credits", amount: 200_000 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            costs: [
                { kind: "item", name: "Advances Debt-Bond", qty: 5 },
                { kind: "item", name: "Medical Debt-Bond", qty: 4 },
                { kind: "item", name: "Shelter Debt-Bond", qty: 3 },
                { kind: "credits", amount: 100_000 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 3,
            costs: [
                { kind: "item", name: "Medical Debt-Bond", qty: 4 },
                { kind: "item", name: "Shelter Debt-Bond", qty: 3 },
                { kind: "item", name: "Training Debt-Bond", qty: 2 },
                { kind: "credits", amount: 50_000 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            costs: [
                { kind: "item", name: "Shelter Debt-Bond", qty: 3 },
                { kind: "item", name: "Training Debt-Bond", qty: 2 },
                { kind: "credits", amount: 25_000 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            costs: [
                { kind: "item", name: "Training Debt-Bond", qty: 2 },
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
            id: "zuud",
            name: "Rude Zuud",
            offerings: [
                // Rank 0: Neutral
                { name: "Catchmoon Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Tombfinger Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Rattleguts Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Gaze Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Ramble Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 750 }], notes: "Blueprint" },
                { name: "Lovetap Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Deepbreath Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Slap Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },

                // Rank 1: Outworlder
                { name: "Haymaker Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Gibber Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Brash Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Shrewd Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Bellows Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Zip Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },

                // Rank 2: Rapscallion
                { name: "Bashrack Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Slapneedle Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Sparkfire Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Swiftfire Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Steadyslam Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Tremor Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },

                // Rank 3: Doer
                { name: "Stitch Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Zipneedle Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Thunderdrum Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Zipfire Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },

                // Rank 4: Cove
                { name: "Splat Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Killstream Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Ramflare Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Flutterfire Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },

                // Rank 5: Old Mate
                { name: "Pax Soar", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Pax Charge", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Pax Bolt", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Pax Seeker", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Solaris Armor Set", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] }
            ]
        },

        {
            id: "legs",
            name: "Legs",
            offerings: [
                // Rank 0: Neutral
                { name: "Drimper Bracket Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Tian Bracket Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Para Moa Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Drex Core Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },
                { name: "Trux Gyro Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }], notes: "Blueprint" },

                // Rank 1: Outworlder
                { name: "Lambeo Moa Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Krisys Core Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Jonsin Bracket Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Harpen Gyro Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },

                // Rank 2: Rapscallion
                { name: "Oloro Moa Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Alcrom Core Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Gauth Bracket Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Aegron Gyro Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },

                // Rank 3: Doer
                { name: "Nychus Moa Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Munit Gyro Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Hona Bracket Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Hextra Gyro Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },

                // Rank 4: Cove
                { name: "Lehan Core Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Phazor Gyro Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Atheca Gyro Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Tyli Gyro Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },

                // Rank 5: Old Mate
                { name: "Cryotra Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },
                { name: "Tazicor Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },
                { name: "Vulcax Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },
                { name: "Helstrum Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" }
            ]
        },

        {
            id: "biz",
            name: "The Business",
            offerings: [
                // Rank 0: Neutral
                { name: "Tranq Rifle", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }] },
                { name: "Pobbers Echo-Lure", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }] },
                { name: "Pobbers Pheromone Synthesizer", rankRequired: 0, costs: [{ kind: "standing", amount: 100 }] },
                { name: "Shockprod Fishing Spear", rankRequired: 0, costs: [{ kind: "standing", amount: 500 }] },
                { name: "Broad-Spectrum Bait", rankRequired: 0, costs: [{ kind: "standing", amount: 50 }] },

                // Rank 1: Outworlder
                { name: "Virmink Echo-Lure", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
                { name: "Virmink Pheromone Synthesizer", rankRequired: 1, costs: [{ kind: "standing", amount: 100 }] },
                { name: "Kriller Bait", rankRequired: 1, costs: [{ kind: "standing", amount: 100 }] },
                { name: "Narrow-Spectrum Bait", rankRequired: 1, costs: [{ kind: "standing", amount: 100 }] },

                { name: "Sapcaddy Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
                { name: "Echowinder Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
                { name: "Brickie Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
                { name: "Scrubber Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },
                { name: "Tink Trophy Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 1_500 }], notes: "Blueprint" },

                // Rank 2: Rapscallion
                { name: "Sawgaw Echo-Lure", rankRequired: 2, costs: [{ kind: "standing", amount: 2_000 }] },
                { name: "Sawgaw Pheromone Synthesizer", rankRequired: 2, costs: [{ kind: "standing", amount: 200 }] },
                { name: "Mirewinder Bait", rankRequired: 2, costs: [{ kind: "standing", amount: 200 }] },
                { name: "Longwinder Bait", rankRequired: 2, costs: [{ kind: "standing", amount: 200 }] },

                { name: "Eye-Eye Trophy Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Kriller Trophy Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Recaster Trophy Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },

                // Rank 3: Doer
                { name: "Bolarola Echo-Lure", rankRequired: 3, costs: [{ kind: "standing", amount: 4_000 }] },
                { name: "Bolarola Pheromone Synthesizer", rankRequired: 3, costs: [{ kind: "standing", amount: 300 }] },

                { name: "Reinforced Bond (companion)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Aerial Bond (companion)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Momentous Bond (companion)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Tenacious Bond (companion)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "AstralBond (companion)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },

                { name: "Tromyzon Bait", rankRequired: 3, costs: [{ kind: "standing", amount: 300 }] },
                { name: "Charamote Bait", rankRequired: 3, costs: [{ kind: "standing", amount: 300 }] },
                { name: "Stunna Fishing Spear", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }] },

                { name: "Mirewinder Trophy Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 6_000 }], notes: "Blueprint" },
                { name: "Longwinder Trophy Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 6_000 }], notes: "Blueprint" },

                // Rank 4: Cove
                { name: "Synathid Bait", rankRequired: 4, costs: [{ kind: "standing", amount: 400 }] },
                { name: "Horrasque Echo-Lure", rankRequired: 4, costs: [{ kind: "standing", amount: 8_000 }] },
                { name: "Horrasque Pheromone Synthesizer", rankRequired: 4, costs: [{ kind: "standing", amount: 400 }] },
                { name: "Stover Echo-Lure", rankRequired: 4, costs: [{ kind: "standing", amount: 8_000 }] },
                { name: "Stover Pheromone Synthesizer", rankRequired: 4, costs: [{ kind: "standing", amount: 400 }] },

                { name: "Charamote Trophy Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 9_000 }], notes: "Blueprint" },
                { name: "Tromyzon Trophy Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 9_000 }], notes: "Blueprint" },
                { name: "Crewman's Boot Trophy Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },

                // Rank 5: Old Mate
                { name: "Kubrodon Echo-Lure", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Kubrodon Pheromone Synthesizer", rankRequired: 5, costs: [{ kind: "standing", amount: 500 }] },

                { name: "Synathid Trophy Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
                { name: "Oxylus Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }], notes: "Blueprint" },

                { name: "Sapcaddy Glyph", rankRequired: 5, costs: [{ kind: "standing", amount: 75_000 }] },
                { name: "Delicate Pobber Glyph", rankRequired: 5, costs: [{ kind: "standing", amount: 75_000 }] }
            ]
        },

        {
            id: "smokefinger",
            name: "Smokefinger",
            offerings: [
                // Rank 0: Neutral
                { name: "Sunpoint Plasma Drill", rankRequired: 0, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Smooth Phasmin X10 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Travocyte Alloy X20 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Heart Noctrul X10 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },
                { name: "Axidrol Alloy X20 Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 1_000 }], notes: "Blueprint" },

                // Rank 1: Outworlder
                { name: "Goblite Tears X10 Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Venerdo Alloy X20 Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
                { name: "Solaris United Outworlder Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },

                // Rank 2: Rapscallion
                { name: "Star Amarast X6 Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Hespazym Alloy X20 Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
                { name: "Solaris United Rapscallion Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Relic Pack (3 x Random Void Relics)", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },

                // Rank 3: Doer
                { name: "Radiant Zodian X3 Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 8_000 }], notes: "Blueprint" },
                { name: "Solaris United Doer Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] },

                // Rank 4: Cove
                { name: "Marquise Thyst X3 Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 12_000 }], notes: "Blueprint" },
                { name: "Solaris United Cove Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },

                // Rank 5: Old Mate
                { name: "Orb Vallis Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 130_000 }] },
                { name: "Fortuna Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 130_000 }] },
                { name: "Sunpoint Plasma Drill Range Widget", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Sunpoint Plasma Drill Silencer Widget", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Goblite Glyph", rankRequired: 5, costs: [{ kind: "standing", amount: 75_000 }] },
                { name: "Solaris United Old Mate Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
            ]
        }
    ]
};
