// ===== FILE: src/catalog/items/itemAcquisition.ts =====

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import ACQUISITION_JSON from "../../data/_generated/item-acquisition.byCatalogId.auto.json";

export type AcquisitionDef = {
    sources: string[];
};

function normalizeSources(rawSources: unknown): string[] {
    const sources = Array.isArray(rawSources) ? rawSources : [];
    const normalized = sources
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim());

    return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
}

const ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = (() => {
    const raw =
        ACQUISITION_JSON && typeof ACQUISITION_JSON === "object" && !Array.isArray(ACQUISITION_JSON)
            ? (ACQUISITION_JSON as Record<string, unknown>)
            : {};

    const out: Record<string, AcquisitionDef> = Object.create(null);

    for (const [catalogId, rec] of Object.entries(raw)) {
        const sources = normalizeSources((rec as any)?.sources);
        if (sources.length === 0) continue;
        out[catalogId] = { sources };
    }

    return out;
})();

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    return ACQUISITION_BY_CATALOG_ID[String(catalogId)] ?? null;
}
