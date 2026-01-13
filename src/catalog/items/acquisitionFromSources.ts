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

export function deriveAcquisitionByCatalogIdFromSourcesJson(): Record<string, AcquisitionDef> {
    const raw = parseMap(wfcdAcqJson);

    const out: Record<string, AcquisitionDef> = {};

    for (const [cid, rec] of Object.entries(raw)) {
        const sources = Array.isArray((rec as any)?.sources) ? (rec as any).sources : [];
        const norm = sources.filter((x: any) => typeof x === "string" && x.trim().length > 0);

        if (norm.length === 0) continue;

        out[String(cid)] = { sources: norm };
    }

    return out;
}

export function getAcquisitionDefFromSources(catalogId: CatalogId): AcquisitionDef | null {
    const all = deriveAcquisitionByCatalogIdFromSourcesJson();
    return all[String(catalogId)] ?? null;
}

