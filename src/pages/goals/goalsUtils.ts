// Pure utilities for the Goals page — requirement caching, display helpers,
// and shared constants.  Extracted from Goals.tsx (Phase 5 decomposition).

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import { getItemRequirements, resolveItemRequirementGraph } from "../../catalog/items/itemRequirements";
import type React from "react";

export type GoalsTab = "personal" | "requirements" | "total";

export const EMPTY_OBJ: Record<string, boolean> = {};
export const EMPTY_ARR: any[] = [];

// Cache for ingredient requirements — catalog data is static at runtime
export const _reqsCache = new Map<string, Array<{ catalogId: CatalogId; count: number }>>();
export function getCachedIngredients(bpCid: CatalogId): Array<{ catalogId: CatalogId; count: number }> {
    const key = String(bpCid);
    if (_reqsCache.has(key)) return _reqsCache.get(key)!;
    const raw = getItemRequirements(bpCid);
    const agg = new Map<string, number>();
    if (Array.isArray(raw)) {
        for (const r of raw) {
            const cid = String((r as any).catalogId ?? "");
            if (!cid) continue;
            agg.set(cid, (agg.get(cid) ?? 0) + Math.max(1, safeInt((r as any).count ?? 1, 1)));
        }
    }
    const result = Array.from(agg.entries()).map(([cid, count]) => ({ catalogId: cid as CatalogId, count }));
    _reqsCache.set(key, result);
    return result;
}

// Inline style object for CSS content-visibility (skips off-screen rendering — free virtualization)
export const CARD_STYLE = { contentVisibility: "auto", containIntrinsicSize: "auto 110px" } as React.CSSProperties;


export type GoalRow = {
    catalogId: CatalogId;
    name: string;
    personalNeed: number;
    requirementsNeed: number;
    totalNeed: number;
    have: number;
    remaining: number;
};

export function safeInt(v: unknown, fallback: number): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

export function isExplicitBlueprintItem(catalogId: CatalogId, name: string): boolean {
    const cidStr = String(catalogId).toLowerCase();
    const nm = String(name ?? "").toLowerCase();
    if (nm.endsWith(" blueprint")) return true;
    if (cidStr.endsWith("blueprint")) return true;
    return false;
}

function isDirectMarketPurchasableOutput(catalogId: CatalogId): boolean {
    const rec = FULL_CATALOG.recordsById[catalogId];
    const raw: any = rec?.raw as any;
    const data = raw?.rawLotus?.data ?? raw?.data ?? null;
    if (!data || typeof data !== "object") return false;

    const regularPrice = Number((data as any).RegularPrice ?? 0);
    const premiumPrice = Number((data as any).PremiumPrice ?? 0);
    return (Number.isFinite(regularPrice) && regularPrice > 0) || (Number.isFinite(premiumPrice) && premiumPrice > 0);
}

export type ReqChild = {
    catalogId: CatalogId;
    count: number;
};

export function getDirectRequirementsForExpansion(catalogId: CatalogId): ReqChild[] {
    const rec = FULL_CATALOG.recordsById[catalogId];
    const name = rec?.displayName ?? String(catalogId);
    const resolution = resolveItemRequirementGraph(catalogId);

    // Craftable OUTPUT => show Blueprint only (qty 1) and let Blueprint expand to ingredients.
    if (!isExplicitBlueprintItem(catalogId, name)) {
        const blueprintEdge = resolution.edges.find((edge) =>
            edge.provenance === "wfcd-output-blueprint" || edge.provenance === "derived-output-blueprint",
        );
        if (isDirectMarketPurchasableOutput(catalogId) && !blueprintEdge) return [];
        if (blueprintEdge) {
            return [{ catalogId: blueprintEdge.catalogId, count: blueprintEdge.count }];
        }
    }

    const raw = resolution.edges;
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const agg = new Map<string, ReqChild>();
    for (const c of raw) {
        const cid = String((c as any).catalogId ?? "") as CatalogId;
        if (!cid) continue;
        const ct = Math.max(1, safeInt((c as any).count ?? 0, 0));

        const existing = agg.get(cid);
        if (existing) {
            existing.count += ct;
        } else {
            agg.set(cid, { catalogId: cid, count: ct });
        }
    }

    return Array.from(agg.values()).sort((a, b) => String(a.catalogId).localeCompare(String(b.catalogId)));
}

export function fmtI(n: number): string {
    return Math.max(0, Math.floor(Number(n) || 0)).toLocaleString();
}

/* =========================================================================================
 * Tree UI (modal) - connector fixes + LOCAL zoom/pan (no page zoom)
 * ========================================================================================= */

export function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

export type ZoomState = {
    scale: number;
    panX: number;
    panY: number;
};

