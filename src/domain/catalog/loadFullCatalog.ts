// src/domain/catalog/loadFullCatalog.ts
//
// Loads all reference datasets from src/data/* and builds a unified catalog.
//
// Important:
// - Icons are NOT used for UI.
// - Display rule: if record has no name, we set displayName to the path key, and mark isDisplayable=false.
//   UI must filter to isDisplayable===true for user-facing lists.

import itemsText from "../../data/items.json?raw";
import modsText from "../../data/mods.json?raw";
import modsetsText from "../../data/modsets.json?raw";
import rivensText from "../../data/rivens.json?raw";
import moddescriptionsText from "../../data/moddescriptions.json?raw";

export type CatalogSource =
    | "items"
    | "mods"
    | "modsets"
    | "rivens"
    | "moddescriptions";

export type CatalogId = `${CatalogSource}:${string}`;

export interface CatalogRecordBase {
    id: CatalogId;             // namespaced: source:pathKey
    source: CatalogSource;     // which file it came from
    path: string;              // original JSON map key
    displayName: string;       // rec.name if present, else path
    isDisplayable: boolean;    // true only when a real name exists
    categories: string[];      // rec.categories if present, else []
    raw: unknown;              // full raw record for future features
}

export interface FullCatalog {
    recordsById: Record<CatalogId, CatalogRecordBase>;

    // All ids, grouped by source (includes non-displayable)
    idsBySource: Record<CatalogSource, CatalogId[]>;

    // Displayable-only ids, grouped by source (for any user-facing UI)
    displayableIdsBySource: Record<CatalogSource, CatalogId[]>;

    // Convenience subsets (ALL items, includes non-displayable)
    itemIds: CatalogId[];
    inventoryItemIds: CatalogId[];

    // Convenience subsets (DISPLAYABLE ONLY)
    displayableItemIds: CatalogId[];
    displayableInventoryItemIds: CatalogId[];

    // Search/index helpers (includes non-displayable by design; UI filters after)
    nameIndex: Record<string, CatalogId[]>;      // normalized name -> ids
    categoryIndex: Record<string, CatalogId[]>;  // category -> ids

    // Sanity stats
    stats: {
        countsBySource: Record<CatalogSource, number>;
        displayableCountsBySource: Record<CatalogSource, number>;
        missingNameBySource: Record<CatalogSource, number>;
        totalCount: number;
        totalDisplayableCount: number;
    };
}

function parseJsonMap<T extends Record<string, unknown>>(
    source: CatalogSource,
    rawText: string
): T {
    try {
        const parsed = JSON.parse(rawText) as T;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error(
                `Expected top-level object map but got ${Array.isArray(parsed) ? "array" : typeof parsed}`
            );
        }
        return parsed;
    } catch (err) {
        const msg =
            err instanceof Error ? err.message : "Unknown JSON.parse error";
        throw new Error(`Failed to parse ${source}.json: ${msg}`);
    }
}

function toCatalogId(source: CatalogSource, pathKey: string): CatalogId {
    return `${source}:${pathKey}`;
}

function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.length > 0 ? v : null;
}

function getDisplayName(pathKey: string, rec: any): string {
    const n = safeString(rec?.name);
    return n ?? pathKey;
}

function getCategories(rec: any): string[] {
    const c = rec?.categories;
    if (!Array.isArray(c)) return [];
    return c.filter((x: any) => typeof x === "string");
}

function pushIndex(
    index: Record<string, CatalogId[]>,
    key: string,
    id: CatalogId
): void {
    if (!index[key]) index[key] = [];
    index[key].push(id);
}

export function buildFullCatalog(): FullCatalog {
    const itemsMap = parseJsonMap<Record<string, any>>("items", itemsText);
    const modsMap = parseJsonMap<Record<string, any>>("mods", modsText);
    const modsetsMap = parseJsonMap<Record<string, any>>("modsets", modsetsText);
    const rivensMap = parseJsonMap<Record<string, any>>("rivens", rivensText);
    const moddescriptionsMap = parseJsonMap<Record<string, any>>("moddescriptions", moddescriptionsText);

    const recordsById: Record<CatalogId, CatalogRecordBase> = {};
    const idsBySource: Record<CatalogSource, CatalogId[]> = {
        items: [],
        mods: [],
        modsets: [],
        rivens: [],
        moddescriptions: []
    };

    const displayableIdsBySource: Record<CatalogSource, CatalogId[]> = {
        items: [],
        mods: [],
        modsets: [],
        rivens: [],
        moddescriptions: []
    };

    const nameIndex: Record<string, CatalogId[]> = {};
    const categoryIndex: Record<string, CatalogId[]> = {};

    const missingNameBySource: Record<CatalogSource, number> = {
        items: 0,
        mods: 0,
        modsets: 0,
        rivens: 0,
        moddescriptions: 0
    };

    function ingestMap(source: CatalogSource, map: Record<string, any>): void {
        for (const [pathKey, rec] of Object.entries(map)) {
            const id = toCatalogId(source, pathKey);

            const displayName = getDisplayName(pathKey, rec);
            const isDisplayable = displayName !== pathKey;

            if (!isDisplayable) {
                missingNameBySource[source] += 1;
            }

            const categories = getCategories(rec);

            const record: CatalogRecordBase = {
                id,
                source,
                path: pathKey,
                displayName,
                isDisplayable,
                categories,
                raw: rec
            };

            recordsById[id] = record;
            idsBySource[source].push(id);

            if (isDisplayable) {
                displayableIdsBySource[source].push(id);
            }

            pushIndex(nameIndex, normalizeName(displayName), id);

            for (const cat of categories) {
                pushIndex(categoryIndex, cat, id);
            }
        }

        idsBySource[source].sort((a, b) => {
            const ra = recordsById[a];
            const rb = recordsById[b];
            return ra.displayName.localeCompare(rb.displayName);
        });

        displayableIdsBySource[source].sort((a, b) => {
            const ra = recordsById[a];
            const rb = recordsById[b];
            return ra.displayName.localeCompare(rb.displayName);
        });
    }

    ingestMap("items", itemsMap);
    ingestMap("mods", modsMap);
    ingestMap("modsets", modsetsMap);
    ingestMap("rivens", rivensMap);
    ingestMap("moddescriptions", moddescriptionsMap);

    const itemIds = idsBySource.items.slice();

    // New rule: everything in items.json is a normal item.
    const inventoryItemIds = itemIds.slice();

    const displayableItemIds = displayableIdsBySource.items.slice();
    const displayableInventoryItemIds = displayableItemIds.slice();

    const countsBySource: Record<CatalogSource, number> = {
        items: idsBySource.items.length,
        mods: idsBySource.mods.length,
        modsets: idsBySource.modsets.length,
        rivens: idsBySource.rivens.length,
        moddescriptions: idsBySource.moddescriptions.length
    };

    const displayableCountsBySource: Record<CatalogSource, number> = {
        items: displayableIdsBySource.items.length,
        mods: displayableIdsBySource.mods.length,
        modsets: displayableIdsBySource.modsets.length,
        rivens: displayableIdsBySource.rivens.length,
        moddescriptions: displayableIdsBySource.moddescriptions.length
    };

    const totalCount =
        countsBySource.items +
        countsBySource.mods +
        countsBySource.modsets +
        countsBySource.rivens +
        countsBySource.moddescriptions;

    const totalDisplayableCount =
        displayableCountsBySource.items +
        displayableCountsBySource.mods +
        displayableCountsBySource.modsets +
        displayableCountsBySource.rivens +
        displayableCountsBySource.moddescriptions;

    return {
        recordsById,
        idsBySource,
        displayableIdsBySource,

        itemIds,
        inventoryItemIds,

        displayableItemIds,
        displayableInventoryItemIds,

        nameIndex,
        categoryIndex,

        stats: {
            countsBySource,
            displayableCountsBySource,
            missingNameBySource,
            totalCount,
            totalDisplayableCount
        }
    };
}

export const FULL_CATALOG: FullCatalog = buildFullCatalog();

