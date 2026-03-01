// ===== FILE: src/domain/catalog/syndicates/vendorEntries/conclave.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const CONCLAVE_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.CONCLAVE,
    name: "Conclave",
    rankUps: [
        {
            rank: 5,
            minimumStanding: 0,
            costs: [
                { kind: "currency", name: "Orokin Ducats", amount: 100 },
                { kind: "credits", amount: 500_000 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Orokin Catalyst", qty: 1 },
                { kind: "credits", amount: 250_000 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 3,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Orokin Reactor", qty: 1 },
                { kind: "credits", amount: 100_000 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Forma", qty: 1 },
                { kind: "credits", amount: 50_000 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Neurodes", qty: 2 },
                { kind: "credits", amount: 30_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Plastids", qty: 100 },
                { kind: "credits", amount: 10_000 }
            ]
        }
    ],
    offerings: [
        // Rank 1: Mistral
        { name: "Awakening Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Perception Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Awareness Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Revelation Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },

        { name: "Loose Magazine", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "Full Capacity", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "Loose Hatch", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "Maximum Capacity", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "Loose Chamber", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "Loaded Capacity", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },

        { name: "Air Thrusters", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Adept Surge", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Rising Skill", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Calculated Spring", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Tempered Bound", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "No Current Leap", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },

        { name: "Anticipation", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Scarlet Hurricane", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Piercing Fury", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Biting Piranha", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Dividing Blades", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Quaking Hand", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Celestial Nightfall", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Crashing Havoc", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Noble Cadence", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Fateful Truth", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Rending Wind", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Mafic Rain", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Argent Scourge", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Vicious Approach", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Cunning Aspect", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Shadow Harvest", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Crashing Timber", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Last Herald", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Rising Steel", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Tainted Hydra", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Star Divide", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
        { name: "Lashing Coil", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },

        { name: "Night Stalker", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Apex Predator", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Bounty Hunter", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Reflex Draw", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Twitch", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Soft Hands", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Overcharge Detectors", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Meteor Munitions", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Impaler Munitions", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Razor Munitions", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Comet Rounds", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Ripper Rounds", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Serrated Rounds", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Crash Shot", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Shred Shot", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Flak Shot", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Counterweight", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Serrated Edges", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Sharpened Blade", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Spry Sights", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Agile Aim", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Snap Shot", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Air Recon", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Overview", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Broad Eye", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Syndicate Void Relic Pack (3 X Random Void Relics)", rankRequired: 1, costs: [{ kind: "standing", amount: 20_000 }] },

        // Rank 2: Whirlwind
        { name: "Riv Min-Guard Arm", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Riv Min-Guard Chest", rankRequired: 2, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Riv Min-Guard Leg", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },

        { name: "Prudence Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 14_000 }] },
        { name: "Discretion Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Diligence Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 12_000 }] },

        { name: "Anti-Flak Plating", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Armored Acrobatics", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Armored Evade", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Armored Recovery", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Follow Through", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Eject Magazine", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Tactical Reload", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Lock and Load", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Explosive Demise", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Surplus Diverters", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Gun Glide", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Double-Barrel Drift", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Strafing Slide", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Martial Fury", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Relentless Assault", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Heartseeker", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Impenetrable Offense", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Sword Alone", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Lie In Wait", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },

        // Rank 3: Tempest
        { name: "Riv Comp-Guard Arm", rankRequired: 3, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Riv Comp-Guard Chest", rankRequired: 3, costs: [{ kind: "standing", amount: 40_000 }] },
        { name: "Riv Comp-Guard Leg", rankRequired: 3, costs: [{ kind: "standing", amount: 30_000 }] },

        { name: "Ambition Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 13_000 }] },
        { name: "Volition Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 14_000 }] },
        { name: "Freedom Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] },

        { name: "Afterburn", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rumbled", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Push & Pull", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Deceptive Bond", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Prism Guard", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Discharge Strike", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Ward Recovery", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Antimatter Mine", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Power of Three", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Mesa's Waltz", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Purging Slash", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Signal Flare", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Ice Wave Impedance", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Sapping Reach", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Shield Overload", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Singularity", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Iron Shrapnel", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Kinetic Collision", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Recharge Barrier", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hysterical Fixation", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Purifying Flames", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Defiled Reckoning", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Tear Gas", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },

        // Rank 4: Hurricane
        { name: "Recuperate", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Calculated Victory", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Recover", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Vanquished Prey", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Momentary Pause", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Prize Kill", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Stand Ground", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Quick Charge", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Overcharged", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Spring-Loaded Broadhead", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Voltaic Lance", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Searing Leap", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Rime Vault", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Venomous Rise", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },

        { name: "Enlightenment Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Discovery Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Accord Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },

        // Rank 5: Typhoon
        { name: "Riv Elite-Guard Arm", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Riv Elite-Guard Chest", rankRequired: 5, costs: [{ kind: "standing", amount: 120_000 }] },
        { name: "Riv Elite-Guard Leg", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },

        { name: "Celestia Syandana", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },

        { name: "Braton Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Gorgon Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Latron Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Ack & Brunt Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Dragon Nikana Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Nikana Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Skana Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Dual Skana Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },

        { name: "Angstrum Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
        { name: "Vasto Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
        { name: "Akvasto Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
        { name: "Viper Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
        { name: "Twin Vipers Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },

        { name: "Sybaris Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Strun Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Daikyu Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Furax Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Kronen Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },

        { name: "Lato Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
        { name: "Aklato Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
        { name: "Lex Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
        { name: "Aklex Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },

        { name: "Grinlok Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Tonkor Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Jat Kittag Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },

        { name: "Marelok Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },

        { name: "Opticor Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Soma Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Karak Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Kraken Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Akstiletto Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },

        { name: "Glaive Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Tipedo Conclave Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] },

        {
            name: "Exilus Warframe Adapter Blueprint",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 75_000 }],
            notes: "Blueprint"
        },

        { name: "Mag", rankRequired: 5, costs: [{ kind: "standing", amount: 60_000 }] },
        { name: "Volt", rankRequired: 5, costs: [{ kind: "standing", amount: 60_000 }] },
        { name: "Excalibur", rankRequired: 5, costs: [{ kind: "standing", amount: 60_000 }] },

        { name: "Insight Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Empathy Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Unity Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },

        { name: "Conclave Loadout Slot", rankRequired: 5, costs: [{ kind: "standing", amount: 35_000 }] },

        { name: "Teshin's Refuge Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Lunaro Arena Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] }
    ]
};
