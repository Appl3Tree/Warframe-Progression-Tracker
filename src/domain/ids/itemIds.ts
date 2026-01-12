// src/domain/ids/itemIds.ts

/**
 * Canonical Item IDs
 *
 * PHASE 1.1 requirement: stable internal IDs for items.
 *
 * In this codebase, the canonical item identifier is the CatalogId produced by
 * loadFullCatalog.ts, specifically the "items:*" namespace.
 *
 * This file intentionally avoids enumerating items (that is PHASE 1.2) and instead
 * defines the canonical type boundary and runtime guards.
 */

import type { CatalogId } from "../catalog/loadFullCatalog";

export type ItemId = CatalogId;

export function isItemId(v: unknown): v is ItemId {
    return typeof v === "string" && v.startsWith("items:");
}

export function assertItemId(v: unknown, context: string): ItemId {
    if (!isItemId(v)) {
        throw new Error(`Invalid ItemId in ${context}: ${String(v)}`);
    }
    return v;
}

