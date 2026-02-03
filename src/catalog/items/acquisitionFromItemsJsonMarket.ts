// ===== FILE: src/catalog/items/acquisitionFromItemsJsonMarket.ts =====

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

import ITEMS_JSON from "../../data/items.json";

/**
 * Market acquisition derived from items.json storeData-like fields.
 *
 * Player-meaningful policy:
 * - We only emit market acquisition when an explicit price is present.
 * - RegularPrice => purchasable for Credits (data:market/credits)
 * - PremiumPrice => purchasable for Platinum (data:market/platinum)
 *
 * Notes:
 * - We DO NOT infer blueprint prices from DisplayRecipe relationships here.
 *   If a blueprint (recipe path) itself has an explicit price in items.json, it will be covered.
 * - We intentionally ignore SellingPrice (resale value) because it is not acquisition.
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

const MARKETMODE_VISIBLE = "MM_VISIBLE";
const MARKETMODE_BLOCKLIST = new Set(["MM_NONE", "MM_HIDDEN", "MM_EXCLUDED"]);

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

/**
 * Extract explicit market prices from an items.json record.
 * Supports a few shapes that occur in practice:
 * - rec.data.RegularPrice / rec.data.PremiumPrice
 * - rec.RegularPrice / rec.PremiumPrice
 */
function extractPrices(raw: unknown): { regularPrice: number; premiumPrice: number } {
    if (!isRecord(raw)) return { regularPrice: 0, premiumPrice: 0 };

    const rec = raw as ItemsJsonRecord;
    const data = isRecord(rec.data) ? rec.data : {};

    const regular =
        safeNumber((data as any).RegularPrice) ??
        safeNumber((rec as any).RegularPrice) ??
        0;

    const premium =
        safeNumber((data as any).PremiumPrice) ??
        safeNumber((rec as any).PremiumPrice) ??
        0;

    return {
        regularPrice: regular,
        premiumPrice: premium
    };
}

function getMarketMode(raw: unknown): string | null {
    if (!isRecord(raw)) return null;

    const rec = raw as ItemsJsonRecord;
    const data = isRecord(rec.data) ? rec.data : {};

    const mm =
        safeString((data as any).MarketMode) ??
        safeString((data as any).marketMode) ??
        safeString((rec as any).MarketMode) ??
        safeString((rec as any).marketMode) ??
        null;

    return mm ? mm.trim().toUpperCase() : null;
}

function getShowInMarket(raw: unknown): boolean | null {
    if (!isRecord(raw)) return null;

    const rec = raw as ItemsJsonRecord;
    const data = isRecord(rec.data) ? rec.data : {};

    const v =
        (data as any).ShowInMarket ??
        (data as any).showInMarket ??
        (rec as any).ShowInMarket ??
        (rec as any).showInMarket ??
        null;

    if (v === 0 || v === "0" || v === false) return false;
    if (v === 1 || v === "1" || v === true) return true;

    return null;
}

function shouldAllowMarket(raw: unknown): boolean {
    // 1) ShowInMarket is authoritative when present
    const sim = getShowInMarket(raw);
    if (sim === false) return false;
    if (sim === true) return true;

    // 2) MarketMode is authoritative when present
    const mm = getMarketMode(raw);
    if (mm) return mm === MARKETMODE_VISIBLE;

    // 3) No gating keys present -> fallback to price evidence
    return true;
}

function build(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);

    const root: unknown = ITEMS_JSON;
    if (!isRecord(root)) return out;

    for (const [path, raw] of Object.entries(root)) {
        const p = safeString(path);
        if (!p) continue;

        // items.json should be lotus-path keyed; enforce minimal sanity.
        if (!p.startsWith("/Lotus/")) continue;

        // Market gating:
        // - ShowInMarket=0 => NOT purchasable, even if price exists (Lex Prime case)
        // - MarketMode present => must be MM_VISIBLE
        // - No gating keys => fallback to price evidence
        if (!shouldAllowMarket(raw)) continue;

        const { regularPrice, premiumPrice } = extractPrices(raw);

        // Must have an explicit purchase price to be market-acquirable.
        if (regularPrice <= 0 && premiumPrice <= 0) continue;

        const catalogId = `items:${p}` as CatalogId;

        if (regularPrice > 0) add(out, catalogId, "data:market/credits");
        if (premiumPrice > 0) add(out, catalogId, "data:market/platinum");
    }

    return out;
}

const ITEMS_JSON_MARKET_ACQ_BY_CATALOG_ID: Record<string, AcquisitionDef> = build();

export function deriveItemsJsonMarketAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    return ITEMS_JSON_MARKET_ACQ_BY_CATALOG_ID;
}
