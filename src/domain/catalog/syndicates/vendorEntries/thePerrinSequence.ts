// ===== FILE: src/domain/catalog/syndicates/vendorEntries/thePerrinSequence.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const THE_PERRIN_SEQUENCE_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.THE_PERRIN_SEQUENCE,
    name: "The Perrin Sequence",
    rankUps: [
        {
            rank: 5,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Aya", qty: 3 },
                { kind: "credits", amount: 500_000 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Aya", qty: 2 },
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
                { kind: "item", name: "Detonite Ampule", qty: 2 },
                { kind: "credits", amount: 30_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Polymer Bundle", qty: 100 },
                { kind: "credits", amount: 10_000 }
            ]
        },
        {
            // Neutral band
            rank: 0,
            minimumStanding: -5_000,
            costs: [
                { kind: "item", name: "Forma", qty: 1 },
                { kind: "credits", amount: 50_000 },
                { kind: "standing", amount: 0 }
            ]
        },
        {
            rank: -1,
            minimumStanding: -22_000,
            costs: [
                { kind: "item", name: "Orokin Reactor", qty: 1 },
                { kind: "credits", amount: 100_000 },
                { kind: "standing", amount: 0 }
            ]
        },
        {
            rank: -2,
            minimumStanding: -44_000,
            costs: []
        }
    ],
    offerings: [
        // Rank 1: Associate
        { name: "Perrin Sequence Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "5x Moa Specter", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Progress Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Opportunity Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Calculating Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },

        // Rank 2: Senior Associate
        { name: "Syndicate Relic Pack (3 X Random Void Relics)", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Synergy Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Directives Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Abyssal Beacon", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Onorix Handle", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Phaedra Receiver", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },

        // Rank 3: Executive
        { name: "Strategy Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 12_000 }] },
        { name: "Tessellations Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 17_000 }] },
        { name: "Centaur Blade", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Cyngas Stock", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        {
            name: "Squad Energy Restore (Large) Blueprint",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 25_000 }],
            notes: "Blueprint"
        },

        // Rank 4: Senior Executive
        { name: "Toxic Sequence (Acrid)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Deadly Sequence (Grinlok)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Voltage Sequence (Lanka)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Sequence Burn (Spectra)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Optimum Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Capital Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Quittance Sculpture", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }] },

        // Rank 5: Partner (Augments)
        { name: "Sonic Fracture (Banshee)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Resonance (Banshee)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Savage Silence (Banshee)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Resonating Quake (Banshee)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Razor Mortar (Caliban)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Afterburn (Chroma)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Everlasting Ward (Chroma)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Vexing Retaliation (Chroma)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Guardian Armor (Chroma)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Guided Effigy (Chroma)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Spectral Spirit (Dagath)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Mach Crash (Gauss)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Thermal Transfer (Gauss)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Conductive Sphere (Gyre)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Coil Recharge (Gyre)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Cathode Current (Gyre)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Reverse Rotorswell (Gyre)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Balefire Surge (Hildryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Blazing Pillage (Hildryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Aegis Gale (Hildryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Desiccation's Curse (Inaros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Elemental Sandstorm (Inaros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Negation Armor (Inaros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Empowered Quiver (Ivara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Piercing Navigator (Ivara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Infiltrate (Ivara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Concentrated Arrow (Ivara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Greedy Pull (Mag)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Magnetized Discharge (Mag)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Counter Pulse (Mag)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Fracturing Crush (Mag)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Soul Survivor (Nekros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Creeping Terrify (Nekros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Despoil (Nekros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Shield of Shadows (Nekros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Teeming Virulence (Nidus)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Larva Burst (Nidus)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Parasitic Vitality (Nidus)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Insatiable (Nidus)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Abundant Mutation (Nidus)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Repair Dispensary (Protea)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Temporal Artillery (Protea)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Temporal Erosion (Protea)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Thrall Pact (Revenant)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Mesmer Shield (Revenant)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Blinding Reave (Revenant)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Ironclad Charge (Rhino)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Iron Shrapnel (Rhino)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Piercing Roar (Rhino)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Reinforcing Stomp (Rhino)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Pool Of Life (Trinity)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Vampire Leech (Trinity)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Abating Link (Trinity)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Champion's Blessing (Trinity)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Swing Line (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Eternal War (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Prolonged Paralysis (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hysterical Assault (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Enraged (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Tesla Bank (Vauban)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Repelling Bastille (Vauban)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Photon Repeater (Vauban)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Shadow Haze (Sevagoth)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Dark Propagation (Sevagoth)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        // Rank 5: Partner (misc + weapons/cosmetics)
        { name: "Chairman Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Secura Dual Cestra", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Secura Penta", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Secura Lecta", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Secura Syandana", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Ergo's Boardroom Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Corpus Gas City Conduit Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Mycona Colony Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "The Perrin Sequence Stencil", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        {
            name: "Exilus Weapon Adapter Blueprint",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 75_000 }],
            notes: "Blueprint"
        },
        { name: "Perrin Piloting Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Perrin Endurance Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Perrin Armor Set", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Ambulas Arena Simulacrum", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Vosfor Cache (200x)", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
    ],
};
