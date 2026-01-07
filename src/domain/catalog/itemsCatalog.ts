import rawItems from "../../data/items.json";

export interface RawItemRecord {
    id?: number;
    name?: string;
    path?: string;
    categories?: string[];
    data?: {
        Icon?: string;
        LocalizeTag?: string;
        LocalizeDescTag?: string;
        [k: string]: unknown;
    };
    texture_new?: string;
    texture?: string;
    tag?: string;
    parent?: string;
    parents?: string[];
    [k: string]: unknown;
}

export interface CatalogItem {
    key: string;              // canonical key = path (unique)
    name: string;             // display name (already uppercased in many records)
    categories: string[];     // from source; used for grouping/filtering
    icon: string | null;      // prefer data.Icon, else texture_new, else texture
    isCurrency: boolean;      // derived from icon path rule
    raw: RawItemRecord;       // keep original for future expansion
}

export interface ItemsCatalog {
    byKey: Record<string, CatalogItem>;
    allKeys: string[];
    currencyKeys: string[];
    itemKeys: string[];
    byCategory: Record<string, string[]>; // category -> keys
    nameIndex: Record<string, string[]>;  // normalized name -> keys (handles duplicates)
}

/**
 * Raw JSON is an object: { [path: string]: RawItemRecord }
 */
const RAW_MAP = rawItems as Record<string, RawItemRecord>;

function pickIcon(rec: RawItemRecord): string | null {
    return rec.data?.Icon ?? rec.texture_new ?? rec.texture ?? null;
}

function isCurrencyByIcon(icon: string | null): boolean {
    if (!icon) return false;
    return icon.includes("/StoreIcons/Currency/");
}

function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

export function buildItemsCatalog(): ItemsCatalog {
    const byKey: Record<string, CatalogItem> = {};
    const byCategory: Record<string, string[]> = {};
    const nameIndex: Record<string, string[]> = {};

    for (const [key, rec] of Object.entries(RAW_MAP)) {
        const icon = pickIcon(rec);
        const name = rec.name ?? key; // fallback to key if name missing
        const categories = rec.categories ?? [];

        const item: CatalogItem = {
            key,
            name,
            categories,
            icon,
            isCurrency: isCurrencyByIcon(icon),
            raw: rec
        };

        byKey[key] = item;

        for (const cat of categories) {
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(key);
        }

        const n = normalizeName(name);
        if (!nameIndex[n]) nameIndex[n] = [];
        nameIndex[n].push(key);
    }

    const allKeys = Object.keys(byKey);

    const currencyKeys = allKeys.filter((k) => byKey[k].isCurrency);
    const itemKeys = allKeys.filter((k) => !byKey[k].isCurrency);

    // Keep deterministic ordering for UI.
    currencyKeys.sort((a, b) => byKey[a].name.localeCompare(byKey[b].name));
    itemKeys.sort((a, b) => byKey[a].name.localeCompare(byKey[b].name));

    return {
        byKey,
        allKeys,
        currencyKeys,
        itemKeys,
        byCategory,
        nameIndex
    };
}

/**
 * Build once and re-use.
 */
export const ITEMS_CATALOG: ItemsCatalog = buildItemsCatalog();

