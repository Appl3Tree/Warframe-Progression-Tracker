// src/catalog/items/itemAcquisition.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { SourceId } from "../../domain/ids/sourceIds";
import { SRC } from "../../domain/ids/sourceIds";
import { deriveAcquisitionByCatalogIdFromSourcesJson } from "./acquisitionFromSources";

export interface AcquisitionDef {
    sources: SourceId[];
}

/**
 * Hand-authored acquisition map keyed by *display name*.
 *
 * IMPORTANT:
 * - This is allowed only as a hand-authored convenience surface.
 * - It MUST NOT be used to “resolve” dataset acquisition.
 * - It MUST NOT attempt display-name -> CatalogId matching (no heuristics).
 *
 * Canonical join for dataset-derived acquisition is by raw "/Lotus/..." path only
 * (see acquisitionFromSources.ts and sources.json contract).
 */
export const ACQUISITION_BY_DISPLAY_NAME: Record<string, AcquisitionDef> = {
    "Mother Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Father Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Son Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Daughter Token": { sources: [SRC.VENDOR_ENTRATI] },

    "Sly Vulpaphyla Tag": { sources: [SRC.HUB_NECRALISK] },
    "Vizier Predasite Tag": { sources: [SRC.HUB_NECRALISK] },

    "Orokin Orientation Matrix": { sources: [SRC.VENDOR_NECRALOID] },

    "Training Debt-Bond": { sources: [SRC.VENDOR_SOLARIS_UNITED] },
    "Vega Toroid": { sources: [SRC.HUB_FORTUNA] },
    "Calda Toroid": { sources: [SRC.HUB_FORTUNA] },
    "Sola Toroid": { sources: [SRC.HUB_FORTUNA] },

    "Voidplume Down": { sources: [SRC.VENDOR_HOLDFASTS] },
    "Entrati Obols": { sources: [SRC.VENDOR_CAVIA] },
    "Shrill Voca": { sources: [SRC.VENDOR_CAVIA] }
};

/**
 * Hand-authored acquisition map keyed by CatalogId.
 *
 * These entries are the canonical hand-authored overrides and MUST take precedence
 * over dataset-derived acquisition.
 */
const EXPLICIT_ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    // Put explicit CatalogId mappings here when you have them.
    // Example:
    // "items:/Lotus/Types/Items/MiscItems/SomeItem": { sources: [SRC.HUB_CETUS] }
};

/**
 * Dataset-derived acquisition map keyed by CatalogId.
 *
 * Built from sources.json using the ONLY permitted join:
 * - sources.json keys: "/Lotus/..."
 * - CatalogId: "items:/Lotus/..."
 */
const DERIVED_FROM_SOURCES_JSON: Record<string, AcquisitionDef> =
    deriveAcquisitionByCatalogIdFromSourcesJson();

/**
 * Canonical acquisition resolution hierarchy (HARD RULE):
 * 1) Hand-authored (this file): EXPLICIT_ACQUISITION_BY_CATALOG_ID
 * 2) Dataset-derived (sources.json): DERIVED_FROM_SOURCES_JSON
 * 3) Unknown => null (fail-closed)
 *
 * Note: No display-name -> CatalogId matching is allowed in canonical resolution.
 */
export const ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    ...DERIVED_FROM_SOURCES_JSON,
    ...EXPLICIT_ACQUISITION_BY_CATALOG_ID
};

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    const raw = String(catalogId ?? "").trim();
    if (!raw) return null;

    // Normalize legacy/raw keys:
    // - "/Lotus/..."       -> "items:/Lotus/..."
    // - "items:/Lotus/..." -> unchanged
    // Fail-closed: do not guess other prefixes.
    const key = raw.startsWith("items:") ? raw : raw.startsWith("/") ? `items:${raw}` : raw;

    // 1) Hand-authored explicit override
    const explicit = EXPLICIT_ACQUISITION_BY_CATALOG_ID[key];
    if (explicit) return explicit;

    // 2) Dataset-derived acquisition
    return DERIVED_FROM_SOURCES_JSON[key] ?? null;
}

/**
 * Legacy lookup by display name:
 * - Only checks the hand-authored display-name mapping.
 * - No name->CatalogId resolution is permitted (no heuristics).
 */
export function getAcquisitionByDisplayName(name: string): AcquisitionDef | null {
    const key = String(name ?? "").trim();
    if (!key) return null;
    return ACQUISITION_BY_DISPLAY_NAME[key] ?? null;
}
