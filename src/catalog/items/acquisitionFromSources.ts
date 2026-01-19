// ===== FILE: src/catalog/items/acquisitionFromSources.ts =====
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";

import wfcdAcqJson from "../../data/_generated/wfcd-acquisition.byCatalogId.auto.json";

/**
 * Acquisition definition:
 * - sources[] are SourceIds that exist in SOURCE_INDEX (sourceCatalog.ts).
 */
export type AcquisitionDef = {
    sources: string[];
};

function parseMap(raw: unknown): Record<string, any> {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return raw as Record<string, any>;
}

function normalizeSources(rawSources: unknown): string[] {
    const sources = Array.isArray(rawSources) ? rawSources : [];
    const norm = sources
        .filter((x: any) => typeof x === "string" && x.trim().length > 0)
        .map((x: string) => x.trim());

    // Preserve duplicates? No. Stable unique list.
    return Array.from(new Set(norm)).sort((a, b) => a.localeCompare(b));
}

/**
 * Derived once at module load, to avoid recomputing on every call.
 */
const WFCD_ACQ_BY_CATALOG_ID: Record<string, AcquisitionDef> = (() => {
    const raw = parseMap(wfcdAcqJson);
    const out: Record<string, AcquisitionDef> = {};

    for (const [cid, rec] of Object.entries(raw)) {
        const sources = normalizeSources((rec as any)?.sources);
        if (sources.length === 0) continue;
        out[String(cid)] = { sources };
    }

    return out;
})();

export function deriveAcquisitionByCatalogIdFromSourcesJson(): Record<string, AcquisitionDef> {
    // Return the already-derived map (treat as read-only).
    return WFCD_ACQ_BY_CATALOG_ID;
}

export function getAcquisitionDefFromSources(catalogId: CatalogId): AcquisitionDef | null {
    return WFCD_ACQ_BY_CATALOG_ID[String(catalogId)] ?? null;
}

