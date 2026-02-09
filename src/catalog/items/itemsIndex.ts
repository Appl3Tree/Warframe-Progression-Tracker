// src/catalog/items/itemsIndex.ts

/**
 * Items Index
 *
 * PHASE 1.2 will add full acquisition and variant modeling.
 *
 * For PHASE 1.1 we still need a deterministic, canonical index that:
 * - is derived directly from FULL_CATALOG
 * - provides stable lookup by CatalogId and by normalized display name
 * - never guesses missing names (non-displayable items are excluded from name lookup)
 */

import { FULL_CATALOG, type CatalogId } from "../../domain/catalog/loadFullCatalog";

export type ItemIndexEntry = {
    id: CatalogId;
    displayName: string;
    categories: string[];
    isDisplayable: boolean;
};

function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

export const ITEM_INDEX_BY_ID: Record<CatalogId, ItemIndexEntry> = (() => {
    const out: Record<CatalogId, ItemIndexEntry> = {} as Record<CatalogId, ItemIndexEntry>;

    for (const id of FULL_CATALOG.itemIds) {
        const rec = FULL_CATALOG.recordsById[id];
        out[id] = {
            id,
            displayName: rec.displayName,
            categories: rec.categories ?? [],
            isDisplayable: rec.isDisplayable
        };
    }

    return out;
})();

/**
 * Scope boundary exports.
 *
 * DISPLAYABLE_ITEM_IDS:
 * - Everything UI-displayable from the items source.
 *
 * INVENTORY_ITEM_IDS:
 * - Anything we can prove is inventory-real (wfdata allowlist + recipe-producing-allowed extension).
 * - May include non-displayable items.
 *
 * PROGRESSION_ITEM_IDS:
 * - The Phase 1 progression scope: displayable AND inventory-real.
 * - This is the correct list to feed planners / farming / goal pickers right now.
 */
export const DISPLAYABLE_ITEM_IDS: CatalogId[] = FULL_CATALOG.displayableItemIds.slice();

export const INVENTORY_ITEM_IDS: CatalogId[] = FULL_CATALOG.inventoryItemIds.slice();

export const PROGRESSION_ITEM_IDS: CatalogId[] = FULL_CATALOG.displayableInventoryItemIds.slice();

export const ITEM_IDS_ALL: CatalogId[] = FULL_CATALOG.itemIds.slice();

/**
 * Name index for displayable items only (UI-safe).
 * Multiple items can share a display name, so values are arrays.
 */
export const ITEM_IDS_BY_NORMALIZED_NAME: Record<string, CatalogId[]> = (() => {
    const out: Record<string, CatalogId[]> = {};

    for (const id of FULL_CATALOG.displayableItemIds) {
        const rec = FULL_CATALOG.recordsById[id];
        const key = normalizeName(rec.displayName);
        if (!out[key]) out[key] = [];
        out[key].push(id);
    }

    // Stable ordering for determinism
    for (const k of Object.keys(out)) {
        out[k].sort((a, b) => {
            const ra = FULL_CATALOG.recordsById[a];
            const rb = FULL_CATALOG.recordsById[b];
            return ra.displayName.localeCompare(rb.displayName) || a.localeCompare(b);
        });
    }

    return out;
})();

/**
 * Best-effort lookup:
 * - Returns ALL matching ids (could be multiple)
 * - Never falls back to non-displayable records
 */
export function findItemIdsByDisplayName(name: string): CatalogId[] {
    const key = normalizeName(name);
    return ITEM_IDS_BY_NORMALIZED_NAME[key] ? ITEM_IDS_BY_NORMALIZED_NAME[key].slice() : [];
}
