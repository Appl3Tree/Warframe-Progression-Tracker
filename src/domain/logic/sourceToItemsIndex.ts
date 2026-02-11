// ===== FILE: src/domain/logic/sourceToItemsIndex.ts =====

import type { CatalogId } from "../catalog/loadFullCatalog";
import { FULL_CATALOG } from "../catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../../catalog/items/itemAcquisition";

export type SourceItemRow = {
    catalogId: CatalogId;
    name: string;
};

export type SourceToItemsIndex = Record<string, SourceItemRow[]>;

function uniqByCatalogId(rows: SourceItemRow[]): SourceItemRow[] {
    const seen = new Set<string>();
    const out: SourceItemRow[] = [];
    for (const r of rows) {
        const k = String(r.catalogId);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(r);
    }
    return out;
}

export function buildSourceToItemsIndex(): SourceToItemsIndex {
    const out: Record<string, SourceItemRow[]> = Object.create(null);

    const ids = FULL_CATALOG.displayableInventoryItemIds ?? [];
    for (const cid of ids) {
        const rec: any = (FULL_CATALOG as any).recordsById?.[String(cid)] ?? null;
        const name =
            typeof rec?.displayName === "string"
                ? rec.displayName
                : typeof rec?.name === "string"
                    ? rec.name
                    : String(cid);

        const acq = getAcquisitionByCatalogId(cid as any);
        const sources = Array.isArray(acq?.sources) ? acq!.sources : [];

        for (const sid of sources) {
            const key = String(sid);
            if (!out[key]) out[key] = [];
            out[key].push({ catalogId: cid as any, name });
        }
    }

    for (const [sid, rows] of Object.entries(out)) {
        const deduped = uniqByCatalogId(rows);
        deduped.sort((a, b) => a.name.localeCompare(b.name));
        out[sid] = deduped;
    }

    return out;
}

// Build once. This is what the UI should use.
export const SOURCE_TO_ITEMS_INDEX: SourceToItemsIndex = buildSourceToItemsIndex();

export function getItemsForSourceId(sourceId: string): SourceItemRow[] {
    return SOURCE_TO_ITEMS_INDEX[String(sourceId)] ?? [];
}

