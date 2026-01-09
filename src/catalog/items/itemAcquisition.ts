// src/catalog/items/itemAcquisition.ts

import type { SourceId } from "../../domain/ids/sourceIds";
import { SRC } from "../../domain/ids/sourceIds";
import { FULL_CATALOG, type CatalogId } from "../../domain/catalog/loadFullCatalog";
import { deriveAcquisitionByCatalogIdFromSourcesJson } from "./acquisitionFromSources";

export interface AcquisitionDef {
    sources: SourceId[];
}

/**
 * Legacy acquisition map keyed by *display name*.
 * Kept for convenience while acquisition authoring is still evolving.
 *
 * IMPORTANT:
 * - This is NOT the canonical key long-term.
 * - The canonical key is CatalogId (see ACQUISITION_BY_CATALOG_ID below).
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
 * Canonical acquisition map keyed by CatalogId.
 *
 * Data sources:
 * 1) sources.json derived mapping (broad coverage)
 * 2) derived from ACQUISITION_BY_DISPLAY_NAME when name -> exactly one CatalogId
 * 3) explicit overrides you author here
 *
 * Precedence:
 * explicit overrides > display-name derived > sources.json derived
 */
const DERIVED_FROM_SOURCES_JSON: Record<string, AcquisitionDef> =
    deriveAcquisitionByCatalogIdFromSourcesJson();

const DERIVED_FROM_DISPLAY_NAME: Record<string, AcquisitionDef> = (() => {
    const out: Record<string, AcquisitionDef> = {};

    for (const [displayName, def] of Object.entries(ACQUISITION_BY_DISPLAY_NAME)) {
        const norm = String(displayName ?? "").trim().toLowerCase();
        if (!norm) continue;

        const matches = FULL_CATALOG.nameIndex?.[norm] ?? [];
        if (matches.length !== 1) {
            // Fail-closed: if the name maps to 0 or >1 catalog ids, do not guess.
            continue;
        }

        const cid = String(matches[0]);
        out[cid] = def;
    }

    return out;
})();

/**
 * Explicit CatalogId acquisition entries belong here.
 * These override derived entries.
 *
 * Note: Keeping this as Record<string, AcquisitionDef> avoids type headaches
 * when authoring raw ids.
 */
const EXPLICIT_ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    // Put explicit CatalogId mappings here when you have them.
    // Example:
    // "items:/Lotus/Types/Items/MiscItems/SomeItem": { sources: [SRC.HUB_CETUS] }
};

export const ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    ...DERIVED_FROM_SOURCES_JSON,
    ...DERIVED_FROM_DISPLAY_NAME,
    ...EXPLICIT_ACQUISITION_BY_CATALOG_ID
};

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    const raw = String(catalogId ?? "").trim();
    if (!raw) return null;

    // Normalize legacy/raw keys:
    // - "/Lotus/..."          -> "items:/Lotus/..."
    // - "items:/Lotus/..."    -> unchanged
    // Fail-closed: do not attempt to guess other prefixes.
    const key = raw.startsWith("items:") ? raw : raw.startsWith("/") ? `items:${raw}` : raw;

    return ACQUISITION_BY_CATALOG_ID[key] ?? null;
}

/**
 * Legacy lookup by display name:
 * - First checks exact display-name mapping
 * - Then attempts display-name -> CatalogId resolution -> CatalogId mapping
 *
 * Fail-closed:
 * - If name maps to 0 or >1 catalog ids, returns null.
 */
export function getAcquisitionByDisplayName(name: string): AcquisitionDef | null {
    const key = String(name ?? "").trim();
    if (!key) return null;

    const direct = ACQUISITION_BY_DISPLAY_NAME[key];
    if (direct) return direct;

    const norm = key.toLowerCase();
    const matches = FULL_CATALOG.nameIndex?.[norm] ?? [];
    if (matches.length !== 1) return null;

    return getAcquisitionByCatalogId(String(matches[0]) as CatalogId);
}

