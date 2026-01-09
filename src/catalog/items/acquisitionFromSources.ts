// src/catalog/items/acquisitionFromSources.ts
//
// Derives acquisition sources for CatalogIds from src/data/sources.json.
//
// Contract:
// - Input keys in sources.json look like "/Lotus/Types/..."
// - Your CatalogId for items is "items:/Lotus/Types/..."
// - We map each entry's "source" string to a data-derived SourceId "data:<slug>"

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { SourceId } from "../../domain/ids/sourceIds";
import type { AcquisitionDef } from "./itemAcquisition";
import { RAW_SOURCES_MAP, sourceIdFromLabel } from "../sources/sourceData";

function toItemCatalogId(pathKey: string): CatalogId {
    return `items:${pathKey}` as CatalogId;
}

export function deriveAcquisitionByCatalogIdFromSourcesJson(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};

    for (const [pathKey, entries] of Object.entries(RAW_SOURCES_MAP)) {
        if (!Array.isArray(entries) || entries.length === 0) continue;

        const cid = toItemCatalogId(pathKey);

        // Fail-closed on unknown catalog id.
        if (!FULL_CATALOG.recordsById[cid]) continue;

        const sourceIds: SourceId[] = [];

        for (const e of entries) {
            const label = typeof e?.source === "string" ? e.source.trim() : "";
            if (!label) continue;
            sourceIds.push(sourceIdFromLabel(label) as SourceId);
        }

        const uniq = Array.from(new Set(sourceIds));
        if (uniq.length === 0) continue;

        out[String(cid)] = { sources: uniq };
    }

    return out;
}

