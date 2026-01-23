// ===== FILE: src/domain/catalog/loadFullCatalog.ts =====
// src/domain/catalog/loadFullCatalog.ts

import wfcdItemsJson from "../../data/_generated/wfcd-items.byCatalogId.auto.json";
import lotusItemsJson from "../../data/items.json";
import wfdataJson from "../../data/wfdata.json";

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

        inventoryAllowCount: number;
        inventoryItemCount: number;
        displayableInventoryItemCount: number;
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

function uniqueStable(list: string[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of list) {
        if (!x || typeof x !== "string") continue;
        const v = x.trim();
        if (!v) continue;
        if (seen.has(v)) continue;
        seen.add(v);
        out.push(v);
    }
    return out;
}

function getCategoriesFromWfcdLike(rec: any): string[] {
    const out: string[] = [];

    const single = safeString(rec?.category);
    if (single) out.push(single);

    const c = rec?.categories;
    if (Array.isArray(c)) {
        for (const x of c) {
            if (typeof x === "string" && x.trim()) out.push(x.trim());
        }
    }

    return uniqueStable(out);
}

function getCategoriesFromLotusItem(rec: any): string[] {
    const out: string[] = [];
    const c = rec?.categories;

    if (Array.isArray(c)) {
        for (const x of c) {
            if (typeof x === "string" && x.trim()) out.push(x.trim());
        }
    }

    return uniqueStable(out);
}

function pushIndex(
    index: Record<string, CatalogId[]>,
    key: string,
    id: CatalogId
): void {
    if (!index[key]) index[key] = [];
    index[key].push(id);
}

type FoundryOverrides = {
    // Direct path -> preferred label (for components and explicit blueprint components)
    byPath: Record<string, string>;

    // resultItemType -> preferred label for the *result item* (used to name recipe blueprints)
    byResultItemType: Record<string, string>;
};

function flattenFoundryItems(wfdata: any): any[] {
    if (!wfdata || typeof wfdata !== "object") return [];

    const buckets = [
        wfdata?.warframes?.items,
        wfdata?.primary?.items,
        wfdata?.secondary?.items,
        wfdata?.melee?.items,
        wfdata?.archwing?.items,
        wfdata?.companions?.items,
        wfdata?.resources?.items,
        wfdata?.miscellaneous?.items,
        wfdata?.items?.items
    ];

    const out: any[] = [];
    for (const b of buckets) {
        if (!Array.isArray(b)) continue;
        for (const it of b) out.push(it);
    }
    return out;
}

const GENERIC_COMPONENT_SLOT_NAMES = new Set<string>([
    "barrel",
    "receiver",
    "stock",
    "chassis",
    "neuroptics",
    "systems",
    "harness",
    "wings",
    "blade",
    "hilt",
    "gauntlet",
    "handle",
    "grip",
    "string",
    "upper limb",
    "lower limb",
    "link",
    "disc",
    "core",
    "cerebrum",
    "carapace",
    "head",
    "blueprint"
]);

function buildFoundryOverrides(wfdataRaw: any): FoundryOverrides {
    const byPath: Record<string, string> = {};
    const byResultItemType: Record<string, string> = {};

    const items = flattenFoundryItems(wfdataRaw);

    for (const it of items) {
        const itemName = safeString(it?.name);
        if (!itemName) continue;

        const comps = it?.components;
        if (!Array.isArray(comps) || comps.length === 0) continue;

        for (const c of comps) {
            const slotName = safeString(c?.name);
            const path = safeString(c?.uniqueName);
            if (!slotName || !path) continue;

            const slotNorm = slotName.trim().toLowerCase();

            const baseLabel =
                slotNorm === "blueprint"
                    ? `${itemName} Blueprint`
                    : GENERIC_COMPONENT_SLOT_NAMES.has(slotNorm)
                        ? `${itemName} ${slotName}`
                        : slotName;

            byPath[path] = baseLabel;

            if (path.startsWith("/Lotus/Types/Recipes/Weapons/WeaponParts/")) {
                byResultItemType[path] = baseLabel;
            }
        }
    }

    return { byPath, byResultItemType };
}

function isRecipeItem(rec: any): boolean {
    const parent = safeString(rec?.parent) ?? "";
    if (parent === "/Lotus/Types/Game/RecipeItem") return true;

    const pc = safeString(rec?.data?.ProductCategory);
    if (pc === "Recipes") return true;

    const path = safeString(rec?.path) ?? "";
    if (path && path.toLowerCase().startsWith("/lotus/types/recipes/")) return true;

    return false;
}

function getResultItemType(rec: any): string | null {
    const a = safeString(rec?.data?.resultItemType);
    if (a) return a;

    const b = safeString(rec?.data?.ResultItem);
    if (b) return b;

    return null;
}

function isWeaponPartRecipePath(pathKey: string): boolean {
    return String(pathKey).startsWith("/Lotus/Types/Recipes/Weapons/WeaponParts/");
}

function applyFoundryOverrideName(
    pathKey: string,
    wfcdRec: any | null,
    lotusRec: any | null,
    ov: FoundryOverrides
): string | null {
    // 1) Direct path match
    const direct = ov.byPath[pathKey];
    if (direct) {
        // Critical: WeaponParts recipe-path records must NOT be forced into "... Blueprint".
        // These are treated as craftable outputs in the farming layer (data:crafting).
        if (isWeaponPartRecipePath(pathKey)) {
            return direct;
        }

        const srcName =
            safeString(wfcdRec?.name) ??
            safeString(lotusRec?.name) ??
            null;

        if (!srcName) return direct;

        const srcHasBlueprint = /\bblueprint\b/i.test(srcName);
        const directHasBlueprint = /\bblueprint\b/i.test(direct);

        if (srcHasBlueprint && !directHasBlueprint) {
            return `${direct} Blueprint`;
        }

        return direct;
    }

    // 2) Recipe items: name as "<ResultLabel> Blueprint" when safe
    const merged = lotusRec ?? wfcdRec;
    if (merged && isRecipeItem(merged)) {
        // Critical: Do NOT auto-name WeaponParts recipe records as "... Blueprint".
        // That breaks the farming crafted-output rule and reintroduces unknown-acquisition.
        if (isWeaponPartRecipePath(pathKey)) {
            return null;
        }

        const r = getResultItemType(merged);
        if (r) {
            const resultLabel = ov.byResultItemType[r];
            if (resultLabel) {
                return `${resultLabel} Blueprint`;
            }
        }
    }

    return null;
}

function mergeItemRecord(
    pathKey: string,
    wfcdRec: any | null,
    lotusRec: any | null,
    ov: FoundryOverrides
): any {
    const overrideName = applyFoundryOverrideName(pathKey, wfcdRec, lotusRec, ov);

    const name =
        overrideName ??
        safeString(wfcdRec?.name) ??
        safeString(lotusRec?.name) ??
        pathKey;

    const wfcdCats = wfcdRec ? getCategoriesFromWfcdLike(wfcdRec) : [];
    const lotusCats = lotusRec ? getCategoriesFromLotusItem(lotusRec) : [];
    const categories = uniqueStable([...wfcdCats, ...lotusCats]);

    const category =
        safeString(wfcdRec?.category) ??
        (categories.length > 0 ? categories[0] : null);

    const type =
        safeString(wfcdRec?.type) ??
        safeString(lotusRec?.storeItemType) ??
        safeString(lotusRec?.data?.type) ??
        safeString(lotusRec?.tag) ??
        null;

    return {
        name,
        category,
        categories,
        type,
        rawWfcd: wfcdRec ?? null,
        rawLotus: lotusRec ?? null,

        path: pathKey,
        parent: lotusRec?.parent ?? wfcdRec?.parent ?? null,
        data: lotusRec?.data ?? wfcdRec?.data ?? null
    };
}

function buildInventoryAllowSetFromWfdata(wfdataRaw: any): Set<string> {
    const allow = new Set<string>();
    const items = flattenFoundryItems(wfdataRaw);

    for (const it of items) {
        const u = safeString(it?.uniqueName);
        if (u) allow.add(u);

        const comps = it?.components;
        if (Array.isArray(comps)) {
            for (const c of comps) {
                const cu = safeString(c?.uniqueName);
                if (cu) allow.add(cu);
            }
        }
    }

    return allow;
}

function extendAllowWithRecipesProducingAllowed(
    allow: Set<string>,
    lotusItemsByPath: Record<string, any>
): Set<string> {
    const out = new Set<string>(allow);

    for (const [pathKey, rec] of Object.entries(lotusItemsByPath)) {
        if (!rec) continue;
        if (!isRecipeItem(rec)) continue;

        const r = getResultItemType(rec);
        if (!r) continue;

        if (allow.has(r)) {
            out.add(pathKey);
        }
    }

    return out;
}

export function buildFullCatalog(): FullCatalog {
    const wfcdMapRaw = parseJsonMap("_generated/wfcd-items.byCatalogId.auto", wfcdItemsJson);

    const wfcdItemsByPath: Record<string, any> = {};
    for (const [cid, rec] of Object.entries(wfcdMapRaw)) {
        const k = String(cid);
        if (!k.startsWith("items:")) continue;
        const pathKey = k.slice("items:".length);
        wfcdItemsByPath[pathKey] = rec;
    }

    const lotusItemsByPath = parseJsonMap("items", lotusItemsJson);

    const foundryOverrides = buildFoundryOverrides(wfdataJson);

    const allowBase = buildInventoryAllowSetFromWfdata(wfdataJson);
    const inventoryAllow = extendAllowWithRecipesProducingAllowed(allowBase, lotusItemsByPath);

    const itemsMap: Record<string, any> = {};
    const allPaths = new Set<string>([
        ...Object.keys(lotusItemsByPath),
        ...Object.keys(wfcdItemsByPath)
    ]);

    for (const pathKey of allPaths) {
        const wfcdRec = wfcdItemsByPath[pathKey] ?? null;
        const lotusRec = lotusItemsByPath[pathKey] ?? null;
        itemsMap[pathKey] = mergeItemRecord(pathKey, wfcdRec, lotusRec, foundryOverrides);
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

            const categories = getCategoriesFromWfcdLike(rec);

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

    const inventoryItemIds = itemIds.filter((id) => {
        const rec = recordsById[id];
        if (!rec) return false;
        return inventoryAllow.has(rec.path);
    });

    const displayableItemIds = displayableIdsBySource.items.slice();

    const displayableInventoryItemIds = displayableItemIds.filter((id) => {
        const rec = recordsById[id];
        if (!rec) return false;
        return inventoryAllow.has(rec.path);
    });

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
            totalDisplayableCount,

            inventoryAllowCount: inventoryAllow.size,
            inventoryItemCount: inventoryItemIds.length,
            displayableInventoryItemCount: displayableInventoryItemIds.length
        }
    };
}

export const FULL_CATALOG: FullCatalog = buildFullCatalog();

