// ===== FILE: src/catalog/items/itemAcquisition.ts =====
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import {
    deriveAcquisitionByCatalogIdFromSourcesJson,
    type AcquisitionDef
} from "./acquisitionFromSources";

import { deriveDropDataAcquisitionByCatalogId } from "./acquisitionFromDropData";

/**
 * Central acquisition accessor.
 *
 * Rules:
 * - WFCD drop-data acquisition is used when present.
 * - warframe-drop-data/raw ingestion is an augment layer to eliminate unknown-acquisition.
 * - When both exist: union the sources.
 */

const WFCD_ACQ: Record<string, AcquisitionDef> = deriveAcquisitionByCatalogIdFromSourcesJson();
const DROP_DATA_ACQ: Record<string, AcquisitionDef> = deriveDropDataAcquisitionByCatalogId();

function unionSources(a: string[] | undefined, b: string[] | undefined): string[] {
    const set = new Set<string>();
    for (const x of a ?? []) {
        if (typeof x === "string" && x.trim()) set.add(x.trim());
    }
    for (const x of b ?? []) {
        if (typeof x === "string" && x.trim()) set.add(x.trim());
    }
    return Array.from(set.values()).sort((x, y) => x.localeCompare(y));
}

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    const key = String(catalogId);

    const wfcd = WFCD_ACQ[key];
    const dd = DROP_DATA_ACQ[key];

    if (!wfcd && !dd) return null;

    const sources = unionSources(wfcd?.sources, dd?.sources);
    if (sources.length === 0) return null;

    return { sources };
}

