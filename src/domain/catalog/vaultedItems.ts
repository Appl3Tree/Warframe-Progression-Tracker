// src/domain/catalog/vaultedItems.ts
// Utility for checking vaulted/prime status of items by catalog ID.
// Uses All.json which has vaulted/isPrime fields per item.

import ALL_RAW from "../../data/All.json";

interface AllEntry {
    uniqueName?: string;
    vaulted?: boolean;
    isPrime?: boolean;
}

// Build lookup: lotus path → {vaulted, isPrime}
const _vaultedByPath = new Map<string, boolean>();
const _isPrimeByPath = new Map<string, boolean>();

for (const item of ALL_RAW as AllEntry[]) {
    const path = item.uniqueName;
    if (!path) continue;
    if (item.vaulted) _vaultedByPath.set(path, true);
    if (item.isPrime) _isPrimeByPath.set(path, true);
}

/**
 * Returns true if the given catalog ID corresponds to a vaulted prime item.
 * CatalogId format: "items:/Lotus/..."
 */
export function isItemVaulted(catalogId: string): boolean {
    const path = catalogId.startsWith("items:") ? catalogId.slice(6) : catalogId;
    return _vaultedByPath.get(path) ?? false;
}

/**
 * Returns true if the given catalog ID corresponds to a prime item.
 * CatalogId format: "items:/Lotus/..."
 */
export function isItemPrime(catalogId: string): boolean {
    const path = catalogId.startsWith("items:") ? catalogId.slice(6) : catalogId;
    return _isPrimeByPath.get(path) ?? false;
}
