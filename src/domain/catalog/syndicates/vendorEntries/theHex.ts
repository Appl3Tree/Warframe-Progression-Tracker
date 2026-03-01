// ===== FILE: src/domain/catalog/syndicates/vendorEntries/theHex.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const THE_HEX_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.THE_HEX,
    name: "The Hex",
    rankUps: [
        {
            rank: 5,
            costs: [
                { kind: "item", name: "Techrot Motherboard", qty: 5 },
                { kind: "item", name: "The Countessa Comic", qty: 1 },
                { kind: "item", name: "On-lyne CD", qty: 1 },
                { kind: "item", name: "Chuggin' Along Sixpack", qty: 1 },
                { kind: "item", name: "Mood Crystal", qty: 1 },
                { kind: "item", name: "Cheddar Crowns Cereal", qty: 1 },
                { kind: "item", name: "35mm Film", qty: 1 },
                { kind: "currency", name: "Höllars", amount: 200_000 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            costs: [
                { kind: "item", name: "Techrot Chitin", qty: 25 },
                { kind: "item", name: "Necracoil", qty: 25 },
                { kind: "item", name: "Efervon Sample", qty: 40 },
                { kind: "other", label: 'KIM: Reach "Liked" with all six members + complete The Hex Finale' },
                { kind: "currency", name: "Höllars", amount: 100_000 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 3,
            costs: [
                { kind: "item", name: "The Countessa Comic", qty: 1 },
                { kind: "item", name: "On-lyne CD", qty: 1 },
                { kind: "item", name: "Chuggin' Along Sixpack", qty: 1 },
                { kind: "item", name: "Mood Crystal", qty: 1 },
                { kind: "item", name: "Cheddar Crowns Cereal", qty: 1 },
                { kind: "item", name: "35mm Film", qty: 1 },
                { kind: "currency", name: "Höllars", amount: 50_000 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            costs: [
                { kind: "item", name: "Experimental Arc-Relay", qty: 5 },
                { kind: "item", name: "Entrati Obols", qty: 12 },
                { kind: "item", name: "Höllvanian Pitchweave Fragment", qty: 25 },
                { kind: "currency", name: "Höllars", amount: 25_000 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            costs: [
                { kind: "item", name: "Efervon Sample", qty: 15 },
                { kind: "item", name: "Höllvanian Pitchweave Fragment", qty: 15 },
                { kind: "currency", name: "Höllars", amount: 10_000 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            costs: []
        }
    ],

    // Multi-vendor syndicate (shared standing bucket).
    // Only include vendors that actually have offerings in the supplied data.
    vendors: [
        {
            id: "aoi",
            name: "Aoi Morohoshi",
            offerings: [
                // Rank 1: Leftovers
                { name: "16-Bit Girls With Machine Guns", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (Caliber Chicks 2)" },
                { name: "Anna Ki In The G.o.b.", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (Caliber Chicks 2)" },
                { name: "Arsenal", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "Core Containment", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },

                // Rank 2: Fresh Slice
                { name: "Psycho Killian", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (Caliber Chicks 2)" },
                { name: "Lundora Calling", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (Caliber Chicks 2)" },
                { name: "Cut Through", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "Infection", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },

                // Rank 3: 2-For-1
                { name: "Anna Ki Is A Punk Rocker", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (Caliber Chicks 2)" },
                { name: "Kick Out The Guns", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (Caliber Chicks 2)" },
                { name: "Numb", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "Party Of Your Lifetime", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (PARTY OF YOUR LIFETIME)" },

                // Rank 4: Hot & Fresh
                { name: "I Wanna Be Your G.o.b.", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (Caliber Chicks 2)" },
                { name: "Biz-Marque Bop", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (Caliber Chicks 2)" },
                { name: "Pick A Side", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "Rotten Lives", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "Shut It Down", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },

                // Rank 5: Pizza Party
                { name: "The Call", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "The Great Despair", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (PARTY OF YOUR LIFETIME)" },
                { name: "Crash Course", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "Alive Again", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "Below Zero", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "From The Stars", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" },
                { name: "The Great Kim", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Somachord (ZeViLa Super Bikers)" }
            ]
        },

        {
            id: "amir",
            name: "Amir Beckett",
            offerings: [
                // Glyphs
                { name: "Pixel Perfect Jillian Glyph", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Pixel Perfect Lillian Glyph", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Pixel Perfect Anna Glyph", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Pixel Perfect Goon Glyph", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Caliber Chicks 2 Glyph", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Jillian Killian Glyph", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Lillian Killian Glyph", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Anna Ki Glyph", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }] },

                // Cyte-09
                { name: "Cyte-09 Chassis Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }], notes: "Blueprint" },
                { name: "Cyte-09 Neuroptics Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }], notes: "Blueprint" },
                { name: "Cyte-09 Systems Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 20_000 }], notes: "Blueprint" },
                { name: "Cyte-09 Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 50_000 }], notes: "Blueprint" },

                // Weapons
                { name: "AX-52 Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }], notes: "Blueprint" },

                { name: "Vesper 77 Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
                { name: "Vesper 77 Barrel Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Vesper 77 Receiver Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Vesper 77 Handle Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

                { name: "Reconifex Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
                { name: "Reconifex Barrel Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Reconifex Receiver Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Reconifex Stock Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

                // Ludoplex
                { name: "Caliber Chicks 2 Ludoplex Rom", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Ollie's Crash Course Ludoplex Rom", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }] }
            ]
        },

        {
            id: "quincy",
            name: "Quincy Isaacs",
            offerings: [
                // Sigils
                { name: "Leftovers Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Fresh Slice Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "2-For-1 Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] },
                { name: "Hot & Fresh Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Pizza Party Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },

                // Cosmetics
                { name: "Viktor's Rapier Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },

                // Visage Inks
                { name: "Ligumi Ink", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Visage Ink" },
                { name: "Yoshijo Ink", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Visage Ink" },
                { name: "Miyeti Ink", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }], notes: "Visage Ink" },
                { name: "Fumiro Ink", rankRequired: 4, costs: [{ kind: "standing", amount: 5_000 }], notes: "Visage Ink" },

                // Pixel glyphs
                { name: "Arthur Pixel Glyph", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Aoi Pixel Glyph", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Amir Pixel Glyph", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Eleanor Pixel Glyph", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Lettie Pixel Glyph", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Quincy Pixel Glyph", rankRequired: 3, costs: [{ kind: "standing", amount: 5_000 }] },

                // Protokol skins
                { name: "Protokol Spectre Pistol Skin", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Protokol Vekesk Pistol Skin", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Protokol Tekna Pistol Skin", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Protokol 95 Pistol Skin", rankRequired: 4, costs: [{ kind: "standing", amount: 10_000 }] },

                // Captura scenes
                { name: "Höllvanian Terrace In Summer Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Höllvanian Tenements In Summer Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Tech Titan Electronics Store Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Höllvania Central Mall Subway", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura scene" },
                { name: "Höllvanian Intersection In Winter Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Höllvanian Historic Quarter In Spring Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Höllvanian Old Town In Fall Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Orbit Arcade Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Central Mall Backroom Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },
                { name: "Höllvanian Collapsed Underground Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Lavo's Playplace Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Höllvanian Subway Junction Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },

                // Simulacrum types
                { name: "Höllvanian Courtyard Simulacrum", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] },
                { name: "Mall Rotunda Simulacrum", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }] }
            ]
        },

        {
            id: "eleanor",
            name: "Eleanor Nightingale",
            offerings: [
                { name: "Primary Crux", rankRequired: 2, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Melee Doughty", rankRequired: 2, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Arcane Camisado", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Arcane Impetus", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Arcane Truculence", rankRequired: 4, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Arcane Bellicose", rankRequired: 4, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Secondary Enervate", rankRequired: 5, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Arcane Crepuscular", rankRequired: 5, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Elemental Vice", rankRequired: 5, costs: [{ kind: "standing", amount: 50_000 }] }
            ]
        },

        {
            id: "flare",
            name: "Flare Varleon",
            offerings: [
                // Temple
                { name: "Temple Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 195 }], notes: "Blueprint" },
                { name: "Temple Chassis Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 65 }], notes: "Blueprint" },
                { name: "Temple Neuroptics Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 65 }], notes: "Blueprint" },
                { name: "Temple Systems Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 65 }], notes: "Blueprint" },

                // Riot-848
                { name: "Riot-848 Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 120 }], notes: "Blueprint" },
                { name: "Riot-848 Barrel Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 60 }], notes: "Blueprint" },
                { name: "Riot-848 Receiver Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 60 }], notes: "Blueprint" },
                { name: "Riot-848 Stock Blueprint", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 60 }], notes: "Blueprint" },

                // Decorations / scene / kuva
                { name: "Temple and the Rippers Poster", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Drum Kit", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Drum Cymbal", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Tom Drum", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Snare Drum", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Musical Equipment (Standard)", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Musical Equipment (Large)", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Musical Equipment (Drawers)", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Musical Equipment (Small, Long)", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Musical Equipment (Small, Square)", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Musical Equipment (Cabinet)", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Electric Keyboard", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 30 }] },
                { name: "Solstice Square Stage Scene", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 100 }] },
                { name: "Kuva (6,000)", rankRequired: 4, costs: [{ kind: "currency", name: "Beating Heartstrings", amount: 110 }], notes: "Weekly limit: 7" }
            ]
        },

        {
            id: "velimir",
            name: "Velimir Volkov II",
            offerings: [
                { name: "Air Hockey Table", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Arcade Ticket Machine", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Foosball Table", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Arcade Machine", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Pinball Machine", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Arcade Racing Machine", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Coffee Table", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Traffic Cone", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Large Couch", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Two-Seater Couch", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Armchair", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Sideboard", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Dining Table", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Floor Lamp", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Locker", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Folding Chair", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Night Stand", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "On-Lyne Cardboard Cutout", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zeke Cardboard Cutout", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Normal Office Chair", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] }
            ]
        },

        {
            id: "minerva",
            name: "Minerva Hendricks",
            offerings: [
                // EFV-8 Mars
                { name: "EFV-8 Mars Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
                { name: "EFV-8 Mars Stock", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "EFV-8 Mars Receiver", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "EFV-8 Mars Barrel", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

                // EFV-5 Jupiter
                { name: "EFV-5 Jupiter Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
                { name: "EFV-5 Jupiter Barrel", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "EFV-5 Jupiter Receiver", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "EFV-5 Jupiter Stock", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

                // Purgator 1
                { name: "Purgator 1 Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
                { name: "Purgator 1 Barrel", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Purgator 1 Receiver", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Purgator 1 Stock", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

                // Dual Viciss
                { name: "Dual Viciss Blueprint", rankRequired: 5, costs: [{ kind: "standing", amount: 15_000 }], notes: "Blueprint" },
                { name: "Dual Viciss Blade", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },
                { name: "Dual Viciss Hilt", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" }
            ]
        },

        {
            id: "kaya",
            name: "Kaya Velasco",
            offerings: [
                { name: "Peely Pak", rankRequired: 5, costs: [{ kind: "currency", name: "Pix Chip", amount: 10 }] },
                { name: "Vosfor Cache (200)", rankRequired: 5, costs: [{ kind: "currency", name: "Pix Chip", amount: 6 }], notes: "Vosfor x200" },
                { name: "Display - Peely Pix", rankRequired: 5, costs: [{ kind: "currency", name: "Pix Chip", amount: 10 }], notes: "Decoration" },

                { name: "Arcane Universal Fallout", rankRequired: 5, costs: [{ kind: "currency", name: "Pix Chip", amount: 5 }], notes: "Weekly limit: 1" },
                { name: "Arcane Hot Shot", rankRequired: 5, costs: [{ kind: "currency", name: "Pix Chip", amount: 5 }], notes: "Weekly limit: 1" },
                { name: "Arcane Escapist", rankRequired: 5, costs: [{ kind: "currency", name: "Pix Chip", amount: 5 }], notes: "Weekly limit: 1" }
            ]
        }
    ]
};
