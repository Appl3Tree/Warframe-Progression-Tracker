// ===== FILE: src/domain/catalog/syndicates/vendorEntries/arbitersOfHexis.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const ARBITERS_OF_HEXIS_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.ARBITERS_OF_HEXIS,
    name: "Arbiters of Hexis",
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
                { kind: "item", name: "Gallium", qty: 2 },
                { kind: "credits", amount: 30_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Alloy Plate", qty: 500 },
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
        // Rank 1: Principled
        { name: "Arbiter Of Hexis Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "5x Corrupted Lancer Specter", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Guiding Path Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Bending Will Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Discipline Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },

        // Rank 2: Authentic
        { name: "Syndicate Relic Pack (3 x Random Void Relics)", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Abyssal Beacon", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Will Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Choice Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Decurion Barrel", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Phaedra Barrel", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Corvas Barrel", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },

        // Rank 3: Lawful
        { name: "Grasp Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 12_000 }] },
        { name: "Potential Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 17_000 }] },
        { name: "Cyngas Barrel", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Centaur Aegis", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
        {
            name: "Squad Energy Restore (Large) Blueprint",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 25_000 }],
            notes: "Blueprint"
        },

        // Rank 4: Crusader
        { name: "Gilded Truth (Burston Prime)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Blade of Truth (Jaw Sword)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Avenging Truth (Silva & Aegis)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Stinging Truth (Viper)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Succession Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Surpassing Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Medallion Sculpture", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }] },

        // Rank 5: Maxim (Augments)
        { name: "Seeking Shuriken (Ash)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Smoke Shadow (Ash)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Teleport Rush (Ash)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rising Storm (Ash)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Elusive Retribution (Baruuk)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Endless Lullaby (Baruuk)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Reactive Storm (Baruuk)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Duality (Equinox)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Calm & Frenzy (Equinox)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Peaceful Provocation (Equinox)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Energy Transfer (Equinox)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Surging Dash (Excalibur)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Radiant Finish (Excalibur)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Furious Javelin (Excalibur)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Chromatic Blade (Excalibur)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Warrior's Rest (Excalibur Umbra)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Shattered Storm (Gara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Mending Splinters (Gara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Spectrosiphon (Gara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Mach Crash (Gauss)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Thermal Transfer (Gauss)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Conductive Sphere (Gyre)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Coil Recharge (Gyre)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Cathode Current (Gyre)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Reverse Rotorswell (Gyre)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Tribunal (Harrow)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Warding Thurible (Harrow)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Lasting Covenant (Harrow)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Desiccation's Curse (Inaros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Elemental Sandstorm (Inaros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Negation Armor (Inaros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Jade's Judgment (Jade)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Omikuji's Fortune (Koumei)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rift Haven (Limbo)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rift Torrent (Limbo)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Cataclysmic Continuum (Limbo)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Savior Decoy (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Damage Decoy (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hushed Invisibility (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Safeguard Switch (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Irradiating Disarm (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hall of Malevolence (Mirage)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Explosive Legerdemain (Mirage)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Total Eclipse (Mirage)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Mind Freak (Nyx)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Pacifying Bolts (Nyx)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Chaos Sphere (Nyx)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Assimilate (Nyx)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Repair Dispensary (Protea)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Temporal Artillery (Protea)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Temporal Erosion (Protea)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Axios Javelineers (Styanax)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Tharros Lethality (Styanax)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Intrepid Stand (Styanax)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Shock Trooper (Volt)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Shocking Speed (Volt)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Transistor Shield (Volt)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Capacitance (Volt)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Celestial Stomp (Wukong)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Enveloping Cloud (Wukong)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Primal Rage (Wukong)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        // Rank 5: Maxim (misc + weapons/cosmetics)
        { name: "Truth Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Telos Akbolto", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Telos Boltor", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Telos Boltace", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Telos Syandana", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Arbiter's Tribunal Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Lua Nursery Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Lua Containment Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Arbiters of Hexis Stencil", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        {
            name: "Exilus Weapon Adapter Blueprint",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 75_000 }],
            notes: "Blueprint"
        },
        { name: "Arbiters Combat Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Arbiters Engineering Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Arbiters Gunnery Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Arbiters Piloting Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Arbiters Endurance Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Hexis Armor Set", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Zanuka Arena Simulacrum", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Vosfor Cache (200x)", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
    ],
};
