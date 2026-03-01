// ===== FILE: src/domain/catalog/syndicates/vendorEntries/redVeil.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const RED_VEIL_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.RED_VEIL,
    name: "Red Veil",
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
                { kind: "item", name: "Orokin Catalyst", qty: 1 },
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
                { kind: "item", name: "Orokin Catalyst", qty: 1 },
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
        // Rank 1: Respected
        { name: "Red Veil Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "5x Charger Specter", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Blades Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Cull Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Threat Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },

        // Rank 2: Honored
        { name: "Syndicate Relic Pack (3 x Random Void Relics)", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Maelstrom Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Abyssal Beacon", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Lesion Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Kaszas Blade", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Velocitus Stock", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Rathbone Handle", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },

        // Rank 3: Esteemed
        { name: "Ruin Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 12_000 }] },
        { name: "Viscera Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 17_000 }] },
        { name: "Agkuza Handle", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Fluctus Limbs", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
        {
            name: "Squad Ammo Restore (Large) Blueprint",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 25_000 }],
            notes: "Blueprint"
        },

        // Rank 4: Revered
        { name: "Gleaming Blight (Dark Dagger)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Eroding Blight (Embolist)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Stockpiled Blight (Kunai)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Toxic Blight (Mire)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Malevolent Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Covert Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Mark Sculpture", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }] },

        // Rank 5: Exalted (Augments)
        { name: "Seeking Shuriken (Ash)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Smoke Shadow (Ash)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Teleport Rush (Ash)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rising Storm (Ash)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Path of Statues (Atlas)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Tectonic Fracture (Atlas)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Ore Gaze (Atlas)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Titanic Rumbler (Atlas)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rubble Heap (Atlas)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Prismatic Companion (Citrine)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Recrystalize (Citrine)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Spectral Spirit (Dagath)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Fireball Frenzy (Ember)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Immolated Radiance (Ember)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Healing Flame (Ember)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Exothermic (Ember)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Warrior's Rest (Excalibur Umbra)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Dread Ward (Garuda)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Blood Forge (Garuda)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Blending Talons (Garuda)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Gourmand (Grendel)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hearty Nourishment (Grendel)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Catapult (Grendel)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Gastro (Grendel)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Tribunal (Harrow)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Warding Thurible (Harrow)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Lasting Covenant (Harrow)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Jade's Judgment (Jade)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Accumulating Whipclaw (Khora)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Venari Bodyguard (Khora)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Pilfering Strangledome (Khora)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Swift Bite (Lavos)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Valence Formation (Lavos)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Lingering Transmutation (Lavos)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Savior Decoy (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Damage Decoy (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hushed Invisibility (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Safeguard Switch (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Irradiating Disarm (Loki)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Ballistic Bullseye (Mesa)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Staggering Shield (Mesa)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Muzzle Flash (Mesa)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Mesa's Waltz (Mesa)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Soul Survivor (Nekros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Creeping Terrify (Nekros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Despoil (Nekros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Shield of Shadows (Nekros)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Venom Dose (Saryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Revealing Spores (Saryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Regenerative Molt (Saryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Contagion Cloud (Saryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Spellbound Harvest (Titania)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Beguiling Lantern (Titania)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Razorwing Blitz (Titania)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Ironclad Flight (Titania)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Shock Trooper (Volt)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Shocking Speed (Volt)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Transistor Shield (Volt)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Capacitance (Volt)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Prey of Dynar (Voruna)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Ulfrun's Endurance (Voruna)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Target Fixation (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Airburst Rounds (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Jet Stream (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Funnel Clouds (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Anchored Glide (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        // Rank 5: Exalted (misc + weapons/cosmetics)
        { name: "Assassin Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Rakta Ballistica", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Rakta Cernos", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Rakta Dark Dagger", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Asita Rakta Syandana", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },

        { name: "Veil's Binding Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Harrow's Temple Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Infested Ship Bridge Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Hunhow's Chamber Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },

        { name: "Red Veil Stencil", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        {
            name: "Exilus Weapon Adapter Blueprint",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 75_000 }],
            notes: "Blueprint"
        },

        { name: "Red Veil Engineering Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Red Veil Piloting Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Red Veil Armor Set", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Red Veil Temple Simulacrum", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Vosfor Cache (200x)", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
    ]
};
