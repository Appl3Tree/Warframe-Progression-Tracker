// ===== FILE: src/catalog/items/itemAcquisition.ts =====

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import ACQUISITION_JSON from "../../data/_generated/item-acquisition.byCatalogId.auto.json";

export type AcquisitionDef = {
    sources: string[];
};

type CompactAcquisitionJson = {
    sourcePool?: unknown;
    byCatalogId?: unknown;
};

function normalizeSources(rawSources: unknown): string[] {
    const sources = Array.isArray(rawSources) ? rawSources : [];
    const normalized = sources
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim());

    return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
}

const ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = (() => {
    const root =
        ACQUISITION_JSON && typeof ACQUISITION_JSON === "object" && !Array.isArray(ACQUISITION_JSON)
            ? (ACQUISITION_JSON as CompactAcquisitionJson)
            : {};

    const sourcePool = Array.isArray(root.sourcePool)
        ? root.sourcePool.filter((value): value is string => typeof value === "string")
        : [];

    const rawByCatalogId =
        root.byCatalogId && typeof root.byCatalogId === "object" && !Array.isArray(root.byCatalogId)
            ? (root.byCatalogId as Record<string, unknown>)
            : Object.fromEntries(
                Object.entries(root as Record<string, unknown>).filter(([key]) => key !== "sourcePool"),
            );

    const out: Record<string, AcquisitionDef> = Object.create(null);

    for (const [catalogId, rawIndices] of Object.entries(rawByCatalogId)) {
        const indices = Array.isArray(rawIndices) ? rawIndices : [];
        const sources = normalizeSources(
            indices
                .map((value) => (typeof value === "number" ? sourcePool[value] : null))
                .filter((value): value is string => typeof value === "string"),
        );
        if (sources.length === 0) continue;
        out[catalogId] = { sources };
    }

    return out;
})();

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    return ACQUISITION_BY_CATALOG_ID[String(catalogId)] ?? null;
}
