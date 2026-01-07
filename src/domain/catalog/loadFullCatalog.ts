// src/domain/catalog/loadFullCatalog.ts
//
// Loads all reference datasets from src/data/* and builds a unified catalog
// that the rest of the app can consume deterministically.
//
// Important:
// - These source JSONs contain a small number of invalid JSON escape sequences (e.g. \\' in names).
//   We therefore import them as raw text and sanitize before JSON.parse.
// - Icons are NOT used for UI. Icon paths are only read to classify items as "currency" via the
//   /StoreIcons/Currency/ substring rule.
//
// This module is reference-only. It must never contain user progress.

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
    categories: string[];      // rec.categories if present, else []
    isCurrency?: boolean;      // only for items
    raw: unknown;              // full raw record for future features
    isDisplayable: boolean;
}

export interface FullCatalog {
    recordsById: Record<CatalogId, CatalogRecordBase>;
    idsBySource: Record<CatalogSource, CatalogId[]>;

    // Convenience subsets
    itemIds: CatalogId[];              // all items
    currencyItemIds: CatalogId[];      // items classified as currency
    inventoryItemIds: CatalogId[];     // items excluding currencies

    // Search/index helpers
    nameIndex: Record<string, CatalogId[]>;      // normalized name -> ids
    categoryIndex: Record<string, CatalogId[]>;  // category -> ids

    // Sanity stats
    stats: {
        countsBySource: Record<CatalogSource, number>;
        missingNameBySource: Record<CatalogSource, number>;
        currencyItemCount: number;
        totalCount: number;
    };
}

/**
 * The raw files contain some invalid JSON escape sequences, commonly of the form:
 *   Sevagoth\\\'s Shadow
 * which breaks JSON.parse.
 *
 * We sanitize narrowly:
 * - Replace "\\\\\'" (3 backslashes + apostrophe in the raw text) with "'".
 *
 * This avoids touching valid escapes like \" or \\n.
 */
function sanitizeJsonText(input: string): string {
    // The raw contains three backslashes then an apostrophe.
    // In a JS regex literal: /\\\\\\'/g matches exactly 3 backslashes and a single quote.
    return input.replace(/\\\\\\'/g, "'");
}

function parseJsonMap<T extends Record<string, unknown>>(
    source: CatalogSource,
    rawText: string
): T {
    const cleaned = sanitizeJsonText(rawText);
    try {
        const parsed = JSON.parse(cleaned) as T;
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

function getCurrencyProbe(rec: any): string {
    // Icons are not used for UI, but we read these fields to classify currency items.
    // Prefer data.Icon; then texture_new; then texture.
    return (
        safeString(rec?.data?.Icon) ??
        safeString(rec?.texture_new) ??
        safeString(rec?.texture) ??
        ""
    );
}

function isCurrencyItem(rec: any): boolean {
    const probe = getCurrencyProbe(rec);
    return probe.includes("/StoreIcons/Currency/");
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
    const modsetsMap = parseJsonMap<Record<string, any>>(
        "modsets",
        modsetsText
    );
    const rivensMap = parseJsonMap<Record<string, any>>("rivens", rivensText);
    const moddescriptionsMap = parseJsonMap<Record<string, any>>(
        "moddescriptions",
        moddescriptionsText
    );

    const recordsById: Record<CatalogId, CatalogRecordBase> = {};
    const idsBySource: Record<CatalogSource, CatalogId[]> = {
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
            if (displayName === pathKey) {
                // Means rec.name missing or unusable
                missingNameBySource[source] += 1;
            }

            const categories = getCategories(rec);

            const record: CatalogRecordBase = {
                id,
                source,
                path: pathKey,
                displayName,
                categories,
                raw: rec,
                isDisplayable
            };

            if (source === "items") {
                record.isCurrency = isCurrencyItem(rec);
            }

            recordsById[id] = record;
            idsBySource[source].push(id);

            // Name index (exact normalized name)
            pushIndex(nameIndex, normalizeName(displayName), id);

            // Category index (one-to-many)
            for (const cat of categories) {
                pushIndex(categoryIndex, cat, id);
            }
        }

        // Deterministic ordering (stable UI, stable sanity counts)
        idsBySource[source].sort((a, b) => {
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
    const currencyItemIds = itemIds.filter((id) => recordsById[id].isCurrency);
    const inventoryItemIds = itemIds.filter(
        (id) => !recordsById[id].isCurrency
    );

    const countsBySource: Record<CatalogSource, number> = {
        items: idsBySource.items.length,
        mods: idsBySource.mods.length,
        modsets: idsBySource.modsets.length,
        rivens: idsBySource.rivens.length,
        moddescriptions: idsBySource.moddescriptions.length
    };

    const totalCount =
        countsBySource.items +
        countsBySource.mods +
        countsBySource.modsets +
        countsBySource.rivens +
        countsBySource.moddescriptions;

    return {
        recordsById,
        idsBySource,
        itemIds,
        currencyItemIds,
        inventoryItemIds,
        nameIndex,
        categoryIndex,
        stats: {
            countsBySource,
            missingNameBySource,
            currencyItemCount: currencyItemIds.length,
            totalCount
        }
    };
}

/**
 * Build once; reference-only.
 * If you ever need hot-reload rebuilds, make this a function call from UI instead.
 */
export const FULL_CATALOG: FullCatalog = buildFullCatalog();

