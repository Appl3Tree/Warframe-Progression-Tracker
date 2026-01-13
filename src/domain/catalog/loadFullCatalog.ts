// ===== FILE: src/domain/catalog/loadFullCatalog.ts =====
// src/domain/catalog/loadFullCatalog.ts
//
// Unified catalog loader.
//
// Canonical rules (WFCD-first):
// - Items come from src/data/_generated/wfcd-items.byCatalogId.auto.json (authoritative).
// - Legacy src/data/items.json is no longer ingested to avoid duplicates and category drift.
// - Other datasets (mods, rivens, etc.) remain as-is until explicitly migrated.
//
// Display rule:
// - If record has no name, we set displayName to the path key, and mark isDisplayable=false.
//   UI must filter to isDisplayable===true for user-facing lists.

import wfcdItemsJson from "../../data/_generated/wfcd-items.byCatalogId.auto.json";

import modsJson from "../../data/mods.json";
import modsetsJson from "../../data/modsets.json";
import rivensJson from "../../data/rivens.json";
import moddescriptionsJson from "../../data/moddescriptions.json";

export type CatalogSource =
    | "items"
    | "mods"
    | "modsets"
    | "rivens"
    | "moddescriptions";

export type CatalogId = `${CatalogSource}:${string}`;

export interface CatalogRecordBase {
    id: CatalogId;
    source: CatalogSource;
    path: string;
    displayName: string;
    isDisplayable: boolean;
    categories: string[];
    raw: unknown;
}

export interface FullCatalog {
    recordsById: Record<CatalogId, CatalogRecordBase>;

    idsBySource: Record<CatalogSource, CatalogId[]>;
    displayableIdsBySource: Record<CatalogSource, CatalogId[]>;

    itemIds: CatalogId[];
    inventoryItemIds: CatalogId[];

    displayableItemIds: CatalogId[];
    displayableInventoryItemIds: CatalogId[];

    nameIndex: Record<string, CatalogId[]>;
    categoryIndex: Record<string, CatalogId[]>;

    stats: {
        countsBySource: Record<CatalogSource, number>;
        displayableCountsBySource: Record<CatalogSource, number>;
        missingNameBySource: Record<CatalogSource, number>;
        totalCount: number;
        totalDisplayableCount: number;
    };
}

function parseJsonMap(source: string, raw: unknown): Record<string, any> {
    try {
        const parsed =
            typeof raw === "string"
                ? (JSON.parse(raw) as unknown)
                : raw;

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Root must be an object map.");
        }

        return parsed as Record<string, any>;
    } catch (e: any) {
        const msg =
            typeof e?.message === "string"
                ? e.message
                : String(e);

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
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function getDisplayName(pathKey: string, rec: any): string {
    const n = safeString(rec?.name);
    return n ?? pathKey;
}

function getCategories(rec: any): string[] {
    // WFCD items use "category" (singular) primarily.
    // We store a normalized categories array with at least that value when present.
    const out: string[] = [];

    const single = safeString(rec?.category);
    if (single) out.push(single);

    const c = rec?.categories;
    if (Array.isArray(c)) {
        for (const x of c) {
            if (typeof x === "string" && x.trim()) out.push(x.trim());
        }
    }

    // Stable unique
    return Array.from(new Set(out));
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
    // Items: WFCD authoritative map is already keyed by "items:<uniqueName>".
    // We need to ingest it into the catalog under source "items" but preserve the full path key.
    const wfcdMapRaw = parseJsonMap("_generated/wfcd-items.byCatalogId.auto", wfcdItemsJson);

    // Convert "items:<path>" -> path key "<path>" for catalog storage
    const itemsMap: Record<string, any> = {};
    for (const [cid, rec] of Object.entries(wfcdMapRaw)) {
        const k = String(cid);
        if (!k.startsWith("items:")) continue;
        const pathKey = k.slice("items:".length);
        itemsMap[pathKey] = rec;
    }

    const modsMap = parseJsonMap("mods", modsJson);
    const modsetsMap = parseJsonMap("modsets", modsetsJson);
    const rivensMap = parseJsonMap("rivens", rivensJson);
    const moddescriptionsMap = parseJsonMap("moddescriptions", moddescriptionsJson);

    const recordsById: Record<CatalogId, CatalogRecordBase> = {} as any;
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

        idsBySource[source].sort((a, b) => recordsById[a].displayName.localeCompare(recordsById[b].displayName));
        displayableIdsBySource[source].sort((a, b) => recordsById[a].displayName.localeCompare(recordsById[b].displayName));
    }

    ingestMap("items", itemsMap);
    ingestMap("mods", modsMap);
    ingestMap("modsets", modsetsMap);
    ingestMap("rivens", rivensMap);
    ingestMap("moddescriptions", moddescriptionsMap);

    const itemIds = idsBySource.items.slice();
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

