// ===== FILE: src/domain/catalog/syndicates/vendorEntries/necraloid.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const NECRALOID_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.NECRALOID,
    name: "Necraloid",
    rankUps: [
        {
            rank: 3,
            costs: [
                { kind: "item", name: "Orokin Animus Matrix", qty: 15 },
                { kind: "item", name: "Void Traces", qty: 350 },
                { kind: "item", name: "Trumna Barrel Blueprint", qty: 1 },
                { kind: "item", name: "Father Token", qty: 20 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            costs: [
                { kind: "item", name: "Orokin Ballistics Matrix", qty: 15 },
                { kind: "item", name: "Void Traces", qty: 250 },
                { kind: "item", name: "Sepulcrum Barrel Blueprint", qty: 1 },
                { kind: "item", name: "Father Token", qty: 20 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            costs: [
                { kind: "item", name: "Orokin Orientation Matrix", qty: 10 },
                { kind: "item", name: "Void Traces", qty: 150 },
                { kind: "item", name: "Zymos Barrel Blueprint", qty: 1 },
                { kind: "item", name: "Father Token", qty: 20 },
                { kind: "standing", amount: 5_000 }
            ]
        },
        {
            rank: 0,
            costs: []
        }
    ],
    offerings: [
        // Rank 1: Clearance: Agnesis
        { name: "Voidrig Casing Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
        { name: "Voidrig Engine Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
        { name: "Voidrig Capsule Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
        { name: "Voidrig Weapon Pod Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }], notes: "Blueprint" },
        { name: "Necraloid Agnesis Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },

        { name: "Damaged Necramech Weapon Barrel", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Damaged Necramech Weapon Receiver", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },
        { name: "Damaged Necramech Weapon Stock", rankRequired: 1, costs: [{ kind: "standing", amount: 2_500 }] },

        // Rank 2: Clearance: Modus
        { name: "Voidrig Necramech Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }], notes: "Blueprint" },

        { name: "Bonewidow Casing Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }], notes: "Blueprint" },
        { name: "Bonewidow Engine Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }], notes: "Blueprint" },
        { name: "Bonewidow Capsule Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }], notes: "Blueprint" },
        { name: "Bonewidow Weapon Pod Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }], notes: "Blueprint" },

        { name: "Cortege Barrel Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
        { name: "Cortege Receiver Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
        { name: "Cortege Stock Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },

        { name: "Morgha Barrel Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
        { name: "Morgha Receiver Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },
        { name: "Morgha Stock Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 4_000 }], notes: "Blueprint" },

        { name: "Bonewidow In Action Glyph", rankRequired: 2, costs: [{ kind: "standing", amount: 7_500 }] },
        { name: "Voidrig In Action Glyph", rankRequired: 2, costs: [{ kind: "standing", amount: 7_500 }] },

        { name: "Necramech Vitality", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Necramech Refuel", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Necraloid Modus Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },

        // Rank 3: Clearance: Odima
        { name: "Bonewidow Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 10_000 }], notes: "Blueprint" },
        { name: "Cortege Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 8_000 }], notes: "Blueprint" },
        { name: "Morgha Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 8_000 }], notes: "Blueprint" },

        { name: "Necramech Intensify", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Necramech Pressure Point", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Necramech Efficiency", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Necramech Drift", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Necramech Friction", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },
        { name: "Necramech Flow", rankRequired: 3, costs: [{ kind: "standing", amount: 25_000 }] },

        { name: "Deimos Chamber Scene", rankRequired: 3, costs: [{ kind: "standing", amount: 70_000 }] },

        { name: "Loid Sentinel Skin", rankRequired: 3, costs: [{ kind: "standing", amount: 30_000 }] },
        { name: "Loid Sentinel Mask", rankRequired: 3, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Loid Sentinel Tail", rankRequired: 3, costs: [{ kind: "standing", amount: 10_000 }] },
        { name: "Loid Sentinel Wing", rankRequired: 3, costs: [{ kind: "standing", amount: 10_000 }] },

        { name: "Ayatan Kitha Sculpture", rankRequired: 3, costs: [{ kind: "standing", amount: 50_000 }] },
        { name: "Necraloid Odima Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] }
    ]
};
