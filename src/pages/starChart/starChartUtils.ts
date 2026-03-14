// Shared utilities for the Star Chart feature — item deduplication and
// source-to-items index construction.  These functions are used by the page
// shell, StarChartMap, and StarChartProximaView.

import { normalizeSourceId } from "../../domain/ids/sourceIds";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../../catalog/items/itemAcquisition";

export type ItemRow = { catalogId: string; name: string };

export function safeString(v: unknown): string {
    return typeof v === "string" ? v : String(v ?? "");
}

export function safeNormalizeSourceId(raw: string): string | null {
    try {
        return normalizeSourceId(raw);
    } catch {
        return null;
    }
}

export function itemNameKey(name: string): string {
    return String(name ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

export function isLotusLikeText(s: string): boolean {
    const t = String(s ?? "").toLowerCase();
    return t.includes("/lotus/") || t.includes("lotus/");
}

/**
 * If multiple catalogIds share the same display name, keep a deterministic "best" row:
 * - Prefer non-Lotus-path looking ids/names
 * - Prefer shorter catalogId (more human-friendly internal ids tend to be shorter)
 * - Tie-break on catalogId lexicographically for stability
 */
export function pickBestRowForSameName(a: ItemRow, b: ItemRow): ItemRow {
    const aLotus = isLotusLikeText(a.catalogId) || isLotusLikeText(a.name);
    const bLotus = isLotusLikeText(b.catalogId) || isLotusLikeText(b.name);

    if (aLotus !== bLotus) return aLotus ? b : a;

    if (a.catalogId.length !== b.catalogId.length) return a.catalogId.length < b.catalogId.length ? a : b;

    return a.catalogId.localeCompare(b.catalogId) <= 0 ? a : b;
}

export function dedupeItemsByName(items: ItemRow[]): ItemRow[] {
    const byName = new Map<string, ItemRow>();

    for (const it of items) {
        const k = itemNameKey(it.name);
        if (!k) continue;

        const prev = byName.get(k);
        if (!prev) {
            byName.set(k, it);
            continue;
        }
        byName.set(k, pickBestRowForSameName(prev, it));
    }

    const out = [...byName.values()];
    out.sort((a, b) => a.name.localeCompare(b.name) || a.catalogId.localeCompare(b.catalogId));
    return out;
}

export function buildSourceToItemsIndex(): Record<string, ItemRow[]> {
    const out: Record<string, ItemRow[]> = Object.create(null);

    // IMPORTANT:
    // For the Star Chart drop panel we want "any and all items that can be earned/dropped there".
    // Do NOT restrict to displayableInventoryItemIds, because that tends to exclude resources and other non-inventory records.
    const recordsById: Record<string, any> = ((FULL_CATALOG as any).recordsById ?? {}) as any;

    // Prefer all records, but keep a fallback to the older list if needed.
    const allIds = Object.keys(recordsById);
    const ids = allIds.length > 0 ? allIds : (FULL_CATALOG.displayableInventoryItemIds ?? []);

    for (const catalogId of ids) {
        const rec: any = recordsById?.[catalogId] ?? null;

        const name =
            typeof rec?.displayName === "string"
                ? rec.displayName
                : typeof rec?.name === "string"
                    ? rec.name
                    : safeString(catalogId);

        const acq = getAcquisitionByCatalogId(catalogId as any);
        const srcs: string[] = Array.isArray((acq as any)?.sources) ? (acq as any).sources.map(String) : [];

        for (const s of srcs) {
            const norm = safeNormalizeSourceId(String(s ?? "").trim());
            if (!norm) continue;

            if (!out[norm]) out[norm] = [];
            out[norm].push({ catalogId: String(catalogId), name });
        }
    }

    // Keep per-source lists deterministic (still may contain duplicates; we dedupe again at tab level).
    for (const k of Object.keys(out)) {
        out[k].sort((a, b) => a.name.localeCompare(b.name) || a.catalogId.localeCompare(b.catalogId));
    }

    return out;
}
