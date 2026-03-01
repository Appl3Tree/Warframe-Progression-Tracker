// ===== FILE: src/domain/catalog/syndicates/vendorEntries/cephalonSuda.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const CEPHALON_SUDA_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.CEPHALON_SUDA,
    name: "Cephalon Suda",
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
                { kind: "item", name: "Control Module", qty: 2 },
                { kind: "credits", amount: 30_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            minimumStanding: 0,
            costs: [
                { kind: "item", name: "Circuits", qty: 500 },
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
        // Rank 1: Competent
        { name: "Cephalon Suda Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 1_000 }] },
        { name: "5x Shield Osprey Specter", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Query Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Searching Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Pattern Match Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },

        // Rank 2: Intriguing
        { name: "Syndicate Relic Pack (3 x Random Void Relics)", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Abyssal Beacon", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
        { name: "Atomic Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Manifold Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Decurion Receiver", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Velocitus Barrel", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Corvas Receiver", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }] },

        // Rank 3: Intelligent
        { name: "Fractal Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 12_000 }] },
        { name: "Multivariate Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 17_000 }] },
        { name: "Cyngas Receiver", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Fluctus Barrel", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
        {
            name: "Squad Shield Restore (Large) Blueprint",
            rankRequired: 3,
            costs: [{ kind: "standing", amount: 25_000 }],
            notes: "Blueprint"
        },

        // Rank 4: Wise
        { name: "Entropy Spike (Bolto)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Entropy Flight (Kestrel)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Entropy Detonation (Obex)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Entropy Burst (Supra)", rankRequired: 4, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Labyrinth Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }] },
        { name: "Hexan Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
        { name: "Datum Sculpture", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }] },

        // Rank 5: Genius (Augments)
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
        { name: "Freeze Force (Frost)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Ice Wave Impedance (Frost)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Chilling Globe (Frost)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Icy Avalanche (Frost)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Biting Frost (Frost)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Balefire Surge (Hildryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Blazing Pillage (Hildryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Aegis Gale (Hildryn)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Viral Tempest (Hydroid)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Tidal Impunity (Hydroid)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rousing Plunder (Hydroid)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Pilfering Swarm (Hydroid)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Empowered Quiver (Ivara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Piercing Navigator (Ivara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Infiltrate (Ivara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Concentrated Arrow (Ivara)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rift Haven (Limbo)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Rift Torrent (Limbo)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Cataclysmic Continuum (Limbo)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Hall of Malevolence (Mirage)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Explosive Legerdemain (Mirage)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Total Eclipse (Mirage)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Pyroclastic Flow (Nezha)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Reaping Chakram (Nezha)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Safeguard (Nezha)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Divine Retribution (Nezha)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Controlled Slide (Nezha)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Neutron Star (Nova)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Antimatter Absorb (Nova)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Escape Velocity (Nova)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Molecular Fission (Nova)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Partitioned Mallet (Octavia)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Conductor (Octavia)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Wrecking Wall (Qorvex)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Fused Crucible (Qorvex)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Thrall Pact (Revenant)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Mesmer Shield (Revenant)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Blinding Reave (Revenant)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Shadow Haze (Sevagoth)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Dark Propagation (Sevagoth)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Tesla Bank (Vauban)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Repelling Bastille (Vauban)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Photon Repeater (Vauban)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Fused Reservoir (Wisp)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Critical Surge (Wisp)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Cataclysmic Gate (Wisp)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Vampiric Grasp (Xaku)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "The Relentless Lost (Xaku)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Untime Rift (Xaku)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Merulina Guardian (Yareli)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Loyal Merulina (Yareli)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Surging Blades (Yareli)", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

        // Rank 5: Genius (misc + weapons/cosmetics)
        { name: "Oracle Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Synoid Gammacor", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Synoid Simulor", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Synoid Heliocor", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Synoid Syandana", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Suda's Datascape Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Hunhow's Datascape Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Corpus Ice Planet Wreckage Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Chamber Of The Lotus Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Cephalon Suda Stencil", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        {
            name: "Exilus Weapon Adapter Blueprint",
            rankRequired: 5,
            costs: [{ kind: "standing", amount: 75_000 }],
            notes: "Blueprint"
        },
        { name: "Cephalon Suda Combat Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Cephalon Suda Engineering Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Cephalon Suda Gunnery Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Cephalon Suda Piloting Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Cephalon Suda Endurance Emote", rankRequired: 5, costs: [{ kind: "standing", amount: 70_000 }] },
        { name: "Suda Armor Set", rankRequired: 5, costs: [{ kind: "standing", amount: 125_000 }] },
        { name: "Orokin Derelict Simulacrum", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
        { name: "Vosfor Cache (200x)", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] }
    ],
};
