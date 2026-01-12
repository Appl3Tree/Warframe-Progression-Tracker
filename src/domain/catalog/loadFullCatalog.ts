// src/domain/catalog/loadFullCatalog.ts
//
// Loads all reference datasets from src/data/* and builds a unified catalog.
//
// Important:
// - Icons are NOT used for UI.
// - Display rule: if record has no name, we set displayName to the path key, and mark isDisplayable=false.
//   UI must filter to isDisplayable===true for user-facing lists.
//
// WFCD append behavior:
// - We load src/data/_generated/wfcd-items-append.auto.json and merge it into items.json at runtime.
// - Fail-closed: existing items.json wins on key collisions.

import itemsJson from "../../data/items.json";

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

function friendlyFromLotusPath(pathKey: string): string | null {
    const s = String(pathKey ?? "").trim();
    if (!s) return null;
    if (!s.startsWith("/Lotus/")) return null;

    const last = s.split("/").filter(Boolean).pop() ?? "";
    if (!last) return null;

    // Insert spaces for:
    // - "BrokenWarBlueprint" -> "Broken War Blueprint"
    // - "KuvaOgrisBlueprint" -> "Kuva Ogris Blueprint"
    // - Acronym boundaries: "XYZThing" -> "XYZ Thing"
    let out = last
        .replace(/_/g, " ")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .trim();

    // If it still looks like junk, bail.
    if (!out || out.length < 2) return null;

    return out;
}

function getDisplayNameForRecord(source: CatalogSource, pathKey: string, rec: any): string {
    const n = safeString(rec?.name);
    if (n) return n;

    // If WFCD (or other) lacks a name for an items:/Lotus/... key,
    // derive a human-friendly display name rather than showing the raw path.
    if (source === "items") {
        const friendly = friendlyFromLotusPath(pathKey);
        if (friendly) return friendly;
    }

    return pathKey;
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
    const itemsMap = parseJsonMap("items", itemsJson);

    const modsMap = parseJsonMap("mods", modsJson);
    const modsetsMap = parseJsonMap("modsets", modsetsJson);
    const rivensMap = parseJsonMap("rivens", rivensJson);
    const moddescriptionsMap = parseJsonMap("moddescriptions", moddescriptionsJson);

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

            const displayName = getDisplayNameForRecord(source, pathKey, rec);
            const isDisplayable = displayName !== pathKey;

            if (!isDisplayable) {
                // Only count as missing-name if we truly had to fall back to the raw key.
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

            // Only index displayable names.
            if (isDisplayable) {
                pushIndex(nameIndex, normalizeName(displayName), id);
            }

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

