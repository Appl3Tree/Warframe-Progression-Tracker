// src/catalog/items/itemAcquisition.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { SourceId } from "../../domain/ids/sourceIds";
import { SRC } from "../../domain/ids/sourceIds";
import { deriveAcquisitionByCatalogIdFromSourcesJson } from "./acquisitionFromSources";

export interface AcquisitionDef {
    sources: SourceId[];
}

/**
 * Display-name convenience only.
 * Never used for canonical resolution.
 */
export const ACQUISITION_BY_DISPLAY_NAME: Record<string, AcquisitionDef> = {
    "Mother Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Father Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Son Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Daughter Token": { sources: [SRC.VENDOR_ENTRATI] },

    "Training Debt-Bond": { sources: [SRC.VENDOR_SOLARIS_UNITED] },

    "Voidplume Down": { sources: [SRC.VENDOR_HOLDFASTS] },
    "Entrati Obols": { sources: [SRC.VENDOR_CAVIA] },
    "Shrill Voca": { sources: [SRC.VENDOR_CAVIA] }
};

/**
 * Explicit, verified, non-guess overrides.
 */
const EXPLICIT_ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    // -----------------------------
    // Core system unlocks
    // -----------------------------
    "items:/Lotus/Powersuits/Archwing/StandardArchwing": {
        sources: ["system:archwing"]
    },
    "items:/Lotus/Types/Vehicles/Railjack/Railjack": {
        sources: ["system:railjack"]
    },
    "items:/Lotus/Powersuits/EntratiMech/EntratiMech": {
        sources: ["system:necramech"]
    },

    // -----------------------------
    // Helminth system
    // -----------------------------
    "items:/Lotus/Types/Items/Helminth/HelminthResource": {
        sources: ["system:helminth"]
    },

    // -----------------------------
    // Veilbreaker (Kahl)
    // -----------------------------
    "items:/Lotus/Types/Items/Kahl/KahlResource": {
        sources: ["system:veilbreaker"]
    },

    // -----------------------------
    // Duviri
    // -----------------------------
    "items:/Lotus/Types/Gameplay/Duviri/Resource/DuviriResourceItem": {
        sources: ["system:duviri"]
    },

    // -----------------------------
    // Archon Hunts
    // -----------------------------
    "items:/Lotus/Types/Items/Archon/ArchonShard": {
        sources: ["system:archon_hunts"]
    },

    // -----------------------------
    // Explicit non-drop Warframes
    // -----------------------------
    "items:/Lotus/Powersuits/Ninja/Ninja": {
        sources: ["enemy:manics"]
    },
    "items:/Lotus/Powersuits/Brawler/Brawler": {
        sources: ["boss:jordas_golem"]
    },

    // -----------------------------
    // Clan Tech (Dojo Research)
    // -----------------------------
    "items:/Lotus/Weapons/ClanTech/Bio/AcidDartPistol": {
        sources: ["system:clan_research"]
    }
};

/**
 * Dataset-derived acquisition (sources.json).
 */
const DERIVED_FROM_SOURCES_JSON: Record<string, AcquisitionDef> =
    deriveAcquisitionByCatalogIdFromSourcesJson();

/**
 * Canonical resolution:
 * 1) Explicit
 * 2) Dataset-derived
 * 3) Unknown → null
 */
export const ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    ...DERIVED_FROM_SOURCES_JSON,
    ...EXPLICIT_ACQUISITION_BY_CATALOG_ID
};

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    const raw = String(catalogId ?? "").trim();
    if (!raw) return null;

    const key = raw.startsWith("items:")
        ? raw
        : raw.startsWith("/")
            ? `items:${raw}`
            : raw;

    return ACQUISITION_BY_CATALOG_ID[key] ?? null;
}

export function getAcquisitionByDisplayName(name: string): AcquisitionDef | null {
    const key = String(name ?? "").trim();
    if (!key) return null;
    return ACQUISITION_BY_DISPLAY_NAME[key] ?? null;
}

