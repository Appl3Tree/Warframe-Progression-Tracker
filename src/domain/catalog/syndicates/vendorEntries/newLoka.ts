// ===== FILE: src/domain/catalog/syndicates/vendorEntries/newLoka.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const NEW_LOKA_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.NEW_LOKA,
    name: "New Loka",
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
                { kind: "item", name: "Fieldron Sample", qty: 2 },
                { kind: "credits", amount: 30_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Ferrite", qty: 1_000 },
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
        // Rank 1: Humane
        { name: "New Loka Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "5x Ancient Healer Specter", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Sacrifice Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Seed Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Rebirth Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },

        // Rank 2: Bountiful
        { name: "Syndicate Relic Pack (3 X Random Void Relics)", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Growth Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Clarity Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Onorix Blade", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Phaedra Stock", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Rathbone Head", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Abyssal Beacon", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },

        // Rank 3: Benevolent
        { name: "Bloom Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 12_000 }] },
        { name: "Purity Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 17_000 }] },
        { name: "Agkuza Blade", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Centaur Handle", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
        {
            name: "Squad Health Restore (Large) Blueprint",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 25_000 }],
            notes: "Blueprint"
        },

        // Rank 4: Pure
        { name: "Winds of Purity (Furis)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Disarming Purity (Panthera)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Bright Purity (Skana)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Lasting Purity (Vulkar)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Gaia Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Bounty Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Seed Sculpture", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }] },

        // Rank 5: Flawless (Augments)
        { name: "Elusive Retribution (Baruuk)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Endless Lullaby (Baruuk)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Reactive Storm (Baruuk)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Duality (Equinox)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Calm & Frenzy (Equinox)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Peaceful Provocation (Equinox)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Energy Transfer (Equinox)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Shattered Storm (Gara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Mending Splinters (Gara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Spectrosiphon (Gara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Viral Tempest (Hydroid)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Tidal Impunity (Hydroid)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rousing Plunder (Hydroid)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Pilfering Swarm (Hydroid)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Omikuji's Fortune (Koumei)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Volatile Recompense (Kullervo)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Wrath of Ukko (Kullervo)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Swift Bite (Lavos)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Valence Formation (Lavos)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Lingering Transmutation (Lavos)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Greedy Pull (Mag)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Magnetized Discharge (Mag)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Counter Pulse (Mag)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Fracturing Crush (Mag)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Mind Freak (Nyx)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Pacifying Bolts (Nyx)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Chaos Sphere (Nyx)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Assimilate (Nyx)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Smite Infusion (Oberon)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hallowed Eruption (Oberon)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Phoenix Renewal (Oberon)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hallowed Reckoning (Oberon)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Partitioned Mallet (Octavia)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Conductor (Octavia)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        // NOTE: Your pasted wiki text has "Rank 5: Exalted" for Spellbound Harvest here, but this is New Loka.
        // I’m treating it as a typo and keeping rankRequired=5 under Flawless.
        { name: "Spellbound Harvest (Titania)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Beguiling Lantern (Titania)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Razorwing Blitz (Titania)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Ironclad Flight (Titania)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Axios Javelineers (Styanax)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Tharros Lethality (Styanax)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Intrepid Stand (Styanax)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Pool Of Life (Trinity)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Vampire Leech (Trinity)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Abating Link (Trinity)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Champion's Blessing (Trinity)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Swing Line (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Eternal War (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Prolonged Paralysis (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hysterical Assault (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Enraged (Valkyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Fused Reservoir (Wisp)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Critical Surge (Wisp)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Cataclysmic Gate (Wisp)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Target Fixation (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Airburst Rounds (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Jet Stream (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Funnel Clouds (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Anchored Glide (Zephyr)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Celestial Stomp (Wukong)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Enveloping Cloud (Wukong)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Primal Rage (Wukong)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Merulina Guardian (Yareli)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Loyal Merulina (Yareli)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Surging Blades (Yareli)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        // Rank 5: Flawless (misc + weapons/cosmetics)
        { name: "Humanity Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Sancti Castanas", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Sancti Tigris", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Sancti Magistar", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Sancti Syandana", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },

        { name: "Amaryn's Retreat Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Grineer Shipyards Manufactory Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Silver Grove Shrine Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },

        { name: "New Loka Stencil", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        {
            name: "Exilus Weapon Adapter Blueprint",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 75_000 }],
            notes: "Blueprint"
        },

        { name: "New Loka Combat Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "New Loka Engineering Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "New Loka Piloting Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "New Loka Endurance Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },

        { name: "Lokan Armor Set", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Moonlit Courtyard Simulacrum", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Vosfor Cache (200x)", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
    ]
};
