// ===== FILE: src/domain/catalog/syndicates/vendorEntries/steelMeridian.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const STEEL_MERIDIAN_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.STEEL_MERIDIAN,
    name: "Steel Meridian",
    rankUps: [
        {
            rank: -1,
            costs: [
                { kind: "item", name: "Orokin Catalyst", qty: 1 },
                { kind: "credits", amount: 100_000 }
            ]
        },
        {
            rank: 0,
            costs: [
                { kind: "item", name: "Forma", qty: 1 },
                { kind: "credits", amount: 50_000 }
            ]
        },
        {
            rank: 1,
            costs: [
                { kind: "item", name: "Morphics", qty: 2 },
                { kind: "credits", amount: 30_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 2,
            costs: [
                { kind: "item", name: "Forma", qty: 1 },
                { kind: "credits", amount: 50_000 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 3,
            costs: [
                { kind: "item", name: "Orokin Catalyst", qty: 1 },
                { kind: "credits", amount: 100_000 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 4,
            costs: [
                { kind: "item", name: "Aya", qty: 2 },
                { kind: "credits", amount: 250_000 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 5,
            costs: [
                { kind: "item", name: "Aya", qty: 3 },
                { kind: "credits", amount: 500_000 },
                { kind: "standing", amount: 99_000 }
            ]
        }
    ],
            offerings: [
        {
            name: "Steel Meridian Sigil",
            rankRequired: 1,
            costs: [{ kind: "standing", amount: 1_000 }]
        },
        {
            name: "5x Roller Specter",
            rankRequired: 1,
            costs: [{ kind: "standing", amount: 2_500 }]
        },
        {
            name: "Defiance Sigil",
            rankRequired: 1,
            costs: [{ kind: "standing", amount: 2_500 }]
        },
        {
            name: "Armada Sigil",
            rankRequired: 1,
            costs: [{ kind: "standing", amount: 5_000 }]
        },
        {
            name: "Vigilance Sigil",
            rankRequired: 1,
            costs: [{ kind: "standing", amount: 7_500 }]
        },
        {
            name: "Syndicate Relic Pack (3 X Random Void Relics)",
            rankRequired: 2,
            costs: [{ kind: "standing", amount: 20_000 }]
        },
        {
            name: "Abyssal Beacon",
            rankRequired: 2,
            costs: [{ kind: "standing", amount: 5_000 }]
        },
        {
            name: "Uprising Sigil",
            rankRequired: 2,
            costs: [{ kind: "standing", amount: 10_000 }]
        },
        {
            name: "Protectorate Sigil",
            rankRequired: 2,
            costs: [{ kind: "standing", amount: 15_000 }]
        },
        {
            name: "Kaszas Handle",
            rankRequired: 2,
            costs: [{ kind: "standing", amount: 20_000 }]
        },
        {
            name: "Velocitus Receiver",
            rankRequired: 2,
            costs: [{ kind: "standing", amount: 20_000 }]
        },
        {
            name: "Corvas Stock",
            rankRequired: 2,
            costs: [{ kind: "standing", amount: 20_000 }]
        },
        {
            name: "Freedom Fighter Sigil",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 12_000 }]
        },
        {
            name: "Armored Sigil",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 17_000 }]
        },
        {
            name: "Agkuza Guard",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 20_000 }]
        },
        {
            name: "Fluctus Stock",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 20_000 }]
        },
        {
            name: "Squad Health Restore (Large) Blueprint",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 25_000 }],
            notes: "Blueprint"
        },
        {
            name: "Scattered Justice (Hek)",
            rankRequired: 4,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Justice Blades (Dual Cleavers)",
            rankRequired: 4,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Neutralizing Justice (Miter)",
            rankRequired: 4,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Shattering Justice (Sobek)",
            rankRequired: 4,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Rebellion Sigil",
            rankRequired: 4,
            costs: [{ kind: "standing", amount: 15_000 }]
        },
        {
            name: "Unyielding Sigil",
            rankRequired: 4,
            costs: [{ kind: "standing", amount: 20_000 }]
        },
        {
            name: "Insignia Sculpture",
            rankRequired: 4,
            costs: [{ kind: "standing", amount: 50_000 }]
        },
        {
            name: "Path of Statues (Atlas)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Tectonic Fracture (Atlas)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Ore Gaze (Atlas)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Titanic Rumbler (Atlas)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Rubble Heap (Atlas)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Prismatic Companion (Citrine)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Recrystalize (Citrine)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Fireball Frenzy (Ember)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Immolated Radiance (Ember)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Healing Flame (Ember)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Exothermic (Ember)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Surging Dash (Excalibur)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Radiant Finish (Excalibur)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Furious Javelin (Excalibur)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Chromatic Blade (Excalibur)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Freeze Force (Frost)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Ice Wave Impedance (Frost)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Chilling Globe (Frost)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Icy Avalanche (Frost)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Biting Frost (Frost)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Dread Ward (Garuda)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Blood Forge (Garuda)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Blending Talons (Garuda)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Gourmand (Grendel)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Hearty Nourishment (Grendel)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Catapult (Grendel)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Gastro (Grendel)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Accumulating Whipclaw (Khora)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Venari Bodyguard (Khora)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Pilfering Strangledome (Khora)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Volatile Recompense (Kullervo)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Wrath of Ukko (Kullervo)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Ballistic Bullseye (Mesa)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Staggering Shield (Mesa)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Muzzle Flash (Mesa)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Mesa's Waltz (Mesa)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Pyroclastic Flow (Nezha)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Reaping Chakram (Nezha)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Safeguard (Nezha)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Divine Retribution (Nezha)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Controlled Slide (Nezha)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Teeming Virulence (Nidus)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Larva Burst (Nidus)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Parasitic Vitality (Nidus)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Insatiable (Nidus)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Abundant Mutation (Nidus)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Neutron Star (Nova)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Antimatter Absorb (Nova)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Escape Velocity (Nova)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Molecular Fission (Nova)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Smite Infusion (Oberon)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Hallowed Eruption (Oberon)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Phoenix Renewal (Oberon)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Hallowed Reckoning (Oberon)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Wrecking Wall (Qorvex)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Fused Crucible (Qorvex)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Ironclad Charge (Rhino)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Iron Shrapnel (Rhino)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Piercing Roar (Rhino)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Reinforcing Stomp (Rhino)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Venom Dose (Saryn)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Revealing Spores (Saryn)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Regenerative Molt (Saryn)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Contagion Cloud (Saryn)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Prey of Dynar (Voruna)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Ulfrun's Endurance (Voruna)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Vampiric Grasp (Xaku)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "The Relentless Lost (Xaku)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Untime Rift (Xaku)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 25_000 }]
        },
        {
            name: "Champion Sigil",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 30_000 }]
        },
        {
            name: "Vaykor Marelok",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 100_000 }]
        },
        {
            name: "Vaykor Hek",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 125_000 }]
        },
        {
            name: "Vaykor Sydon",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 125_000 }]
        },
        {
            name: "Vaykor Syandana",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 100_000 }]
        },
        {
            name: "Cressa's Garrison Scene",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 100_000 }]
        },
        {
            name: "Grineer Settlement Reactor Scene",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 100_000 }]
        },
        {
            name: "Kuva Throne Scene",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 100_000 }]
        },
        {
            name: "Steel Meridian Stencil",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 125_000 }]
        },
        {
            name: "Exilus Weapon Adapter Blueprint",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 75_000 }],
            notes: "Blueprint"
        },
        {
            name: "Steel Meridian Combat Emote",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 70_000 }]
        },
        {
            name: "Steel Meridian Gunnery Emote",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 70_000 }]
        },
        {
            name: "Steel Meridian Piloting Emote",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 70_000 }]
        },
        {
            name: "Steel Meridian Endurance Emote",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 70_000 }]
        },
        {
            name: "Meridian Armor Set",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 125_000 }]
        },
        {
            name: "Grineer Asteroid Simulacrum",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 100_000 }]
        },
        {
            name: "Vosfor Cache (200x)",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 30_000 }]
        }
    ]
};
