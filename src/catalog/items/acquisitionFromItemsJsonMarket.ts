// ===== FILE: src/catalog/items/acquisitionFromItemsJsonMarket.ts =====
// src/catalog/items/acquisitionFromItemsJsonMarket.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

import ITEMS_JSON from "../../data/items.json";

/**
 * Market blueprint acquisition.
 *
 * Policy (strict / non-inferential, but not artificially constrained):
 * - Emit market acquisition only when items.json explicitly indicates it is a recipe store item AND has a price.
 * - MarketMode may be MM_HIDDEN even for legitimately purchasable blueprints (e.g., some starter weapon BPs).
 * - Therefore, MarketMode is not the gating condition.
 *
 * Evidence rules:
 * - Must be under /Lotus/Types/Recipes/
 * - Must be a recipe store item:
 *     StoreItemSpecialization == "/Lotus/Types/Game/StoreItemSpecializations/RecipeStoreItem"
 *   OR ProductCategory == "Recipes"
 * - Must have explicit prices:
 *     RegularPrice > 0 => data:market/credits
 *     PremiumPrice > 0 => data:market
 *
 * Output SourceIds must exist in SOURCE_INDEX (sourceCatalog.ts).
 */
type ItemsJsonRecord = {
    path?: string;
    data?: Record<string, unknown>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function safeNumber(v: unknown): number | null {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return null;
    return n;
}

function isRecipePath(p: string): boolean {
    return p.startsWith("/Lotus/Types/Recipes/");
}

function add(out: Record<string, AcquisitionDef>, catalogId: CatalogId, sourceId: string): void {
    const key = String(catalogId);
    const prev = out[key];

    if (!prev) {
        out[key] = { sources: [sourceId] };
        return;
    }

    const set = new Set((prev.sources ?? []).map((s) => String(s)));
    if (set.has(sourceId)) return;

    out[key] = { sources: [...(prev.sources ?? []), sourceId] };
}

function isExplicitRecipeStoreItem(data: Record<string, unknown>): boolean {
    const specialization = safeString((data as any).StoreItemSpecialization) ?? "";
    const productCategory = safeString((data as any).ProductCategory) ?? "";

    if (specialization === "/Lotus/Types/Game/StoreItemSpecializations/RecipeStoreItem") return true;
    if (productCategory === "Recipes") return true;

    return false;
}

function build(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);

    const root: unknown = ITEMS_JSON;
    if (!isRecord(root)) return out;

    for (const [path, raw] of Object.entries(root)) {
        if (!safeString(path) || !isRecipePath(path)) continue;
        if (!isRecord(raw)) continue;

        const rec = raw as ItemsJsonRecord;
        const data = isRecord(rec.data) ? rec.data : {};

        // Key gate: must be explicitly a recipe store item (not inferred)
        if (!isExplicitRecipeStoreItem(data)) continue;

        const regularPrice = safeNumber((data as any).RegularPrice) ?? 0;
        const premiumPrice = safeNumber((data as any).PremiumPrice) ?? 0;

        // Must have an explicit price to be considered market-acquirable
        if (regularPrice <= 0 && premiumPrice <= 0) continue;

        const catalogId = `items:${path}` as CatalogId;

        if (regularPrice > 0) add(out, catalogId, "data:market/credits");
        if (premiumPrice > 0) add(out, catalogId, "data:market");
    }

    return out;
}

const ITEMS_JSON_MARKET_ACQ_BY_CATALOG_ID: Record<string, AcquisitionDef> = build();

export function deriveItemsJsonMarketAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    return ITEMS_JSON_MARKET_ACQ_BY_CATALOG_ID;
}
