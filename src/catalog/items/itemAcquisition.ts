// src/catalog/items/itemAcquisition.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { SourceId } from "../../domain/ids/sourceIds";
import { SRC } from "../../domain/ids/sourceIds";
import { deriveAcquisitionByCatalogIdFromSourcesJson } from "./acquisitionFromSources";

// Generated overlay from official drop tables (scripts/genWikiDrops.ts)
import wikiAcqByCatalogId from "../../data/_generated/wiki-acquisition-by-catalog-id.auto.json";

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
        sources: ["system:archwing" as SourceId]
    },

    "items:/Lotus/Types/Vehicles/Railjack/Railjack": {
        sources: ["system:railjack" as SourceId]
    },

    "items:/Lotus/Powersuits/EntratiMech/EntratiMech": {
        sources: ["system:necramech" as SourceId]
    },

    // -----------------------------
    // Helminth system
    // -----------------------------
    "items:/Lotus/Types/Items/Helminth/HelminthResource": {
        sources: ["system:helminth" as SourceId]
    },

    // -----------------------------
    // Veilbreaker (Kahl)
    // -----------------------------
    "items:/Lotus/Types/Items/Kahl/KahlResource": {
        sources: ["system:veilbreaker" as SourceId]
    },

    // -----------------------------
    // Duviri
    // -----------------------------
    "items:/Lotus/Types/Gameplay/Duviri/Resource/DuviriResourceItem": {
        sources: ["system:duviri" as SourceId]
    },

    // -----------------------------
    // Archon Hunts
    // -----------------------------
    "items:/Lotus/Types/Items/Archon/ArchonShard": {
        sources: ["system:archon_hunts" as SourceId]
    },

    // -----------------------------
    // Explicit non-drop Warframes
    // -----------------------------
    "items:/Lotus/Powersuits/Ninja/Ninja": {
        sources: ["enemy:manics" as SourceId]
    },

    "items:/Lotus/Powersuits/Brawler/Brawler": {
        sources: ["boss:jordas_golem" as SourceId]
    },

    // -----------------------------
    // Clan Tech (Dojo Research)
    // -----------------------------
    "items:/Lotus/Weapons/ClanTech/Bio/AcidDartPistol": {
        sources: ["system:clan_research" as SourceId]
    }
};

/**
 * Dataset-derived acquisition (sources.json).
 */
const DERIVED_FROM_SOURCES_JSON: Record<string, AcquisitionDef> =
    deriveAcquisitionByCatalogIdFromSourcesJson();

/**
 * Wiki-derived acquisition overlay (generated).
 * Fail-closed: only includes items that resolved uniquely to a CatalogId during generation.
 */
const WIKI_DERIVED_BY_CATALOG_ID: Record<string, AcquisitionDef> =
    (wikiAcqByCatalogId as Record<string, AcquisitionDef>) ?? {};

/**
 * Canonical resolution:
 * 1) Explicit overrides
 * 2) Dataset-derived (sources.json)
 * 3) Wiki-derived overlay (only for items missing in dataset)
 */
export const ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    ...WIKI_DERIVED_BY_CATALOG_ID,
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
