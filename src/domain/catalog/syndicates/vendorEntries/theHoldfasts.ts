// ===== FILE: src/domain/catalog/syndicates/vendorEntries/theHoldfasts.ts =====
import { SY } from "../../../ids/syndicateIds";
import type { SyndicateVendorEntry } from "../syndicateVendorCatalog";

export const THE_HOLDFASTS_VENDOR_ENTRY: SyndicateVendorEntry = {
    id: SY.THE_HOLDFASTS,
    name: "The Holdfasts",
    rankUps: [
        {
            rank: 5,
            costs: [
                { kind: "item", name: "Voidplume Pinion", qty: 5 },
                { kind: "item", name: "Thrax Plasm", qty: 90 },
                { kind: "item", name: "Entrati Lanthorn", qty: 20 },
                { kind: "credits", amount: 200_000 },
                { kind: "standing", amount: 99_000 }
            ]
        },
        {
            rank: 4,
            costs: [
                { kind: "item", name: "Voidplume Quill", qty: 15 },
                { kind: "item", name: "Thrax Plasm", qty: 60 },
                { kind: "item", name: "Voidgel Orb", qty: 40 },
                { kind: "credits", amount: 100_000 },
                { kind: "standing", amount: 70_000 }
            ]
        },
        {
            rank: 3,
            costs: [
                { kind: "item", name: "Voidplume Crest", qty: 10 },
                { kind: "item", name: "Entrati Lanthorn", qty: 10 },
                { kind: "item", name: "Ferrite", qty: 5_000 },
                { kind: "credits", amount: 50_000 },
                { kind: "standing", amount: 44_000 }
            ]
        },
        {
            rank: 2,
            costs: [
                { kind: "item", name: "Voidplume Vane", qty: 10 },
                { kind: "item", name: "Voidgel Orb", qty: 10 },
                { kind: "item", name: "Alloy Plate", qty: 5_000 },
                { kind: "credits", amount: 25_000 },
                { kind: "standing", amount: 22_000 }
            ]
        },
        {
            rank: 1,
            costs: [
                { kind: "item", name: "Voidplume Down", qty: 5 },
                { kind: "item", name: "Ferrite", qty: 2_000 },
                { kind: "item", name: "Alloy Plate", qty: 2_000 },
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
    offerings: [],
    vendors: [
        {
            id: "yonta",
            name: "Archimedean Yonta",
            offerings: [
                // Supplies (costs in Voidplume Pinion)
                { name: "Voidplume Down Ornament", rankRequired: 0, costs: [{ kind: "currency", name: "Voidplume Pinion", amount: 1 }] },
                { name: "Voidplume Vane Ornament", rankRequired: 0, costs: [{ kind: "currency", name: "Voidplume Pinion", amount: 1 }] },
                { name: "35,000 Kuva", rankRequired: 0, costs: [{ kind: "currency", name: "Voidplume Pinion", amount: 5 }], notes: "Weekly" },

                // Trade for Lua Thrax Plasm (alternate currency)
                { name: "Voruna Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 125 }], notes: "Blueprint" },
                { name: "Voruna Chassis Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 75 }], notes: "Blueprint" },
                { name: "Voruna Neuroptics Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 75 }], notes: "Blueprint" },
                { name: "Voruna Systems Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 75 }], notes: "Blueprint" },

                { name: "Sarofang Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 100 }], notes: "Blueprint" },
                { name: "Sarofang Blade", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 50 }], notes: "Blueprint" },
                { name: "Sarofang Handle", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 50 }], notes: "Blueprint" },

                { name: "Perigale Blueprint", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 100 }], notes: "Blueprint" },
                { name: "Perigale Barrel", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 50 }], notes: "Blueprint" },
                { name: "Perigale Receiver", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 50 }], notes: "Blueprint" },
                { name: "Perigale Stock", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 50 }], notes: "Blueprint" },

                { name: "Arcane Blessing", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 15 }] },
                { name: "Arcane Rise", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 15 }] },
                { name: "Primary Frostbite", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 15 }] },
                { name: "Conjunction Voltage", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 15 }] },

                { name: "Lua Circulus Scene", rankRequired: 0, costs: [{ kind: "currency", name: "Lua Thrax Plasm", amount: 250 }] }
            ]
        },

        {
            id: "hombask",
            name: "Hombask",
            offerings: [
                // Dormizone Items
                { name: "Zariman Container (Small)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Crate (Large)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Crate (Large, Open)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Crate Lid (Large)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Crate", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Crate (Open)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Crate Lid", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Container (Tall)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Container (Tall, Open)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Container Lid", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Box (Slim)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Box (Slim, Open)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Storage Box Lid (Slim)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Gas Cylinder Storage", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Gas Cylinder Storage (Empty)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Extractor Unit", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Foot Locker", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Foot Locker (Open)", rankRequired: 0, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Foot Locker Lid", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Stacking Locker (Small)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Stacking Locker (Large)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Fuel Cylinder", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Waste Receptacle (Standing)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Monitoring Cube", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Bench (Curved Inward)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Bench (Curved Outward)", rankRequired: 0, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Bench (Curved Inward, 90 Degrees)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Bench (Curved Outward, 90 Degrees)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Bench (Single)", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Hallway Divider", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Wall Panel", rankRequired: 0, costs: [{ kind: "standing", amount: 3_500 }] },

                { name: "Zariman Stationary Globe Light", rankRequired: 1, costs: [{ kind: "standing", amount: 6_000 }] },
                { name: "Zariman Globe Light", rankRequired: 1, costs: [{ kind: "standing", amount: 6_000 }] },
                { name: "Zariman Tube Light", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
                { name: "Zariman Flushmount Light", rankRequired: 1, costs: [{ kind: "standing", amount: 2_000 }] },
                { name: "Zariman Portable Generator", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Generator Light", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Pre-Orokin Lua Globe", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Globe Base", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Locker (Low, Long)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Cabinet (Low, Long)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Cabinet (Low, Short)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Wall Locker (Long)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Wall Locker (Short)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Wall Cabinet (Short)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Wall Locker (Tall)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Wall Cabinet (Tall)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Chair", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Desk", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Table (Large)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Side Table", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Wall Planter", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Green Plant", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Hydro Planter", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Hydro Planter Door Panel", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Bench (Straight, Long)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Bench (Curved Inward, Long)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Bench (Curved Inward, Long, 60 Degrees)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Bench (Curved Outward, Long, 60 Degrees)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Bench (Curved Inward, Long, 90 Degrees)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Zariman Bench (Curved Outward, Long, 90 Degrees)", rankRequired: 1, costs: [{ kind: "standing", amount: 7_500 }] },

                { name: "Zariman Beverage Dispenser", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Food Container", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Food Can", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Tumbler Cup", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Cup", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Bottle", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Kitchen Knife", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Food Pouch", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Spoon", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Lunch Tray", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Waste Extractors (3)", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zariman Kitchen Boiler", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zariman Nutrition Cube Warmer", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zariman Nutrition Cube Steamer", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zariman Nutrition Cube Blender", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zariman Nutrition Cube Hydrator", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zariman Tea Steeper", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zariman Nutrition Cube Maker", rankRequired: 2, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zariman Nutrition Brick (Protein)", rankRequired: 2, costs: [{ kind: "standing", amount: 1_000 }] },
                { name: "Zariman Nutrition Cube (Carbohydrate)", rankRequired: 2, costs: [{ kind: "standing", amount: 1_000 }] },
                { name: "Zariman Nutrition Cube (Fiber)", rankRequired: 2, costs: [{ kind: "standing", amount: 1_000 }] },
                { name: "Zariman Nutrition Cube (Fat)", rankRequired: 2, costs: [{ kind: "standing", amount: 1_000 }] },
                { name: "Zariman Nutrition Cube (Vitamins)", rankRequired: 2, costs: [{ kind: "standing", amount: 1_000 }] },
                { name: "Zariman Food Tray", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Nutrition Cube Processor", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Fry Pan", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Salad Spinner", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },
                { name: "Zariman Sterilizer", rankRequired: 2, costs: [{ kind: "standing", amount: 3_500 }] },

                { name: "Zariman Lunaro Hanging Banner (Short)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zariman Lunaro Hanging Banner (Long)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zariman Park Sign", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zariman Rug", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zariman Rug (Wrinkled)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zariman Floor Pad", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zariman Planets Mobile (Saturn)", rankRequired: 3, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman Planets Mobile (Jupiter)", rankRequired: 3, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman Test Tube Station", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }] },
                { name: "Zariman Beaker Set", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }] },
                { name: "Zariman Boiling Flask", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }] },
                { name: "Zariman Plinth", rankRequired: 3, costs: [{ kind: "standing", amount: 3_000 }] },
                { name: "Zariman Tool Case", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zariman Wall Panel (Double)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zariman Wall Panel (Quintuple)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Zariman Wall Panel (Large, Single)", rankRequired: 3, costs: [{ kind: "standing", amount: 20_000 }] },

                { name: "Zariman School Crafts", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman Biology Class Crafts", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman Horse Poster", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman Classroom Helix Artwork", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman Origin System Poster", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman Illustration", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman School Crafts Collage", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman Poster Arrangement", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman School Art Display", rankRequired: 4, costs: [{ kind: "standing", amount: 2_500 }] },
                { name: "Zariman Statue (Child)", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Zariman Statue (Lunaro Child)", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Zariman Statue (Colonist Woman)", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Zariman Statue (Colonist Man)", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Zariman Statue (Athlete)", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Zariman Statue (Drummer)", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Zariman Statue (Meditating)", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Zariman Statue (Executor Tuvul)", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },
                { name: "Zariman Statue Plinth", rankRequired: 4, costs: [{ kind: "standing", amount: 30_000 }] },

                { name: "Zariman Albrecht Entrati Painting", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
                { name: "Zariman Yonta Portrait", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
                { name: "Zariman Ballas Portrait", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
                { name: "Zariman Shoes", rankRequired: 5, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Zariman Trophy (Lunaro)", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
                { name: "Zariman Trophy (Lunaro Goal)", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },
                { name: "Zariman Trophy (Lunaro Ball)", rankRequired: 5, costs: [{ kind: "standing", amount: 40_000 }] },

                { name: "Verd-Ie Sentinel Skin", rankRequired: 5, costs: [{ kind: "standing", amount: 60_000 }] },
                { name: "Verd-Ie Sentinel Mask", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Verd-Ie Sentinel Tail", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Verd-Ie Sentinel Wings", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },

                { name: "Vista Suite Key", rankRequired: 5, costs: [{ kind: "standing", amount: 100_000 }] },

                // Voidshells and Scenes
                { name: "Tarnished Morphics", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }], notes: "Voidshell" },
                { name: "Ayatan Elegance", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }], notes: "Voidshell" },
                { name: "White Sun Veneer", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }], notes: "Voidshell" },
                { name: "Homestead Twill", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }], notes: "Voidshell" },
                { name: "Cephalon Adornment", rankRequired: 1, costs: [{ kind: "standing", amount: 10_000 }], notes: "Voidshell" },

                { name: "Zariman Amphitheatre Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Dormizone Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Cargo Bay Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Brig Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Agri-Zone Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Hall Of Legems Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Habitation Zone Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Lunaro Court Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Albrecht Park Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Serenity Levels Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Angel Roost Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Chrysalith Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Schoolyard Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Docking Bay Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" },
                { name: "Zariman Reliquary Drive Scene", rankRequired: 5, costs: [{ kind: "standing", amount: 25_000 }], notes: "Captura" }
            ]
        },

        {
            id: "cavalero",
            name: "Cavalero",
            offerings: [
                // Sigils
                { name: "Holdfasts Fallen Sigil", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Holdfasts Watcher Sigil", rankRequired: 2, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Holdfasts Guardian Sigil", rankRequired: 3, costs: [{ kind: "standing", amount: 15_000 }] },
                { name: "Holdfasts Seraph Sigil", rankRequired: 4, costs: [{ kind: "standing", amount: 20_000 }] },
                { name: "Holdfasts Angel Sigil", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }] },

                // Incarnon weapon blueprints (as listed in provided data)
                { name: "Laetum Blueprint", rankRequired: 0, costs: [{ kind: "standing", amount: 3_000 }], notes: "Blueprint" },
                { name: "Innodem Blueprint", rankRequired: 1, costs: [{ kind: "standing", amount: 5_500 }], notes: "Blueprint" },
                { name: "Phenmor Blueprint", rankRequired: 2, costs: [{ kind: "standing", amount: 6_000 }], notes: "Blueprint" },
                { name: "Felarx Blueprint", rankRequired: 3, costs: [{ kind: "standing", amount: 8_000 }], notes: "Blueprint" },
                { name: "Praedos Blueprint", rankRequired: 4, costs: [{ kind: "standing", amount: 9_000 }], notes: "Blueprint" },

                // Arcanes / miscellany
                { name: "Eternal Eradicate", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Cascadia Accuracy", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Fractalized Reset", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Molt Vigor", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },
                { name: "Emergence Savior", rankRequired: 1, costs: [{ kind: "standing", amount: 5_000 }] },

                { name: "Eternal Onslaught", rankRequired: 2, costs: [{ kind: "standing", amount: 5_500 }] },
                { name: "Cascadia Flare", rankRequired: 2, costs: [{ kind: "standing", amount: 5_500 }] },

                { name: "Cascadia Empowered", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Molt Efficiency", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }] },
                { name: "Emergence Renewed", rankRequired: 3, costs: [{ kind: "standing", amount: 7_500 }] },

                { name: "Molt Reconstruct", rankRequired: 4, costs: [{ kind: "standing", amount: 8_500 }] },
                { name: "Eternal Logistics", rankRequired: 4, costs: [{ kind: "standing", amount: 8_500 }] },

                { name: "Cascadia Overcharge", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Emergence Dissipate", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Molt Augmented", rankRequired: 5, costs: [{ kind: "standing", amount: 10_000 }] },
                { name: "Amp Arcane Adapter", rankRequired: 5, costs: [{ kind: "standing", amount: 20_000 }] },

                { name: "Raptwing Ephemera", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }], notes: "Blueprint" },
                { name: "Seraphayre Ephemera", rankRequired: 5, costs: [{ kind: "standing", amount: 30_000 }], notes: "Blueprint" }
            ]
        }
    ]
};
