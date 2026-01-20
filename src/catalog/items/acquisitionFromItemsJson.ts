// ===== FILE: src/catalog/items/acquisitionFromItemsJson.ts =====
// src/catalog/items/acquisitionFromItemsJson.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

import ITEMS from "../../data/items.json";

type ItemsJsonRow = {
    path?: string;
    data?: {
        MarketMode?: string;
    };
};

function parseItemsMap(raw: unknown): Record<string, ItemsJsonRow> {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return raw as Record<string, ItemsJsonRow>;
}

function addSource(
    out: Record<string, AcquisitionDef>,
    catalogId: CatalogId,
    sourceId: string
): void {
    const key = String(catalogId);
    const prev = out[key];

    if (!prev) {
        out[key] = { sources: [sourceId] };
        return;
    }

    if (!prev.sources.includes(sourceId)) {
        out[key] = { sources: [...prev.sources, sourceId] };
    }
}

function isRecipePath(path: string): boolean {
    return path.startsWith("/Lotus/Types/Recipes/");
}

function buildInternal(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const map = parseItemsMap(ITEMS);

    for (const [path, rec] of Object.entries(map)) {
        if (!isRecipePath(path)) continue;
        if (rec?.data?.MarketMode !== "MM_VISIBLE") continue;

        const cid = `items:${path}` as CatalogId;
        addSource(out, cid, "data:market/credits");
    }

    return out;
}

const ITEMS_JSON_ACQ_BY_CATALOG_ID = buildInternal();

export function deriveItemsJsonAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    return ITEMS_JSON_ACQ_BY_CATALOG_ID;
}
