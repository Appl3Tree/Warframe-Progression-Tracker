// ===== FILE: src/catalog/items/itemRequirements.ts =====
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";

import wfcdReqJson from "../../data/_generated/wfcd-requirements.byCatalogId.auto.json";

export type ItemRequirement = {
    catalogId: CatalogId;
    count: number;
};

function parseMap(raw: unknown): Record<string, any> {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return raw as Record<string, any>;
}

function safeCount(v: unknown): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
}

export function getItemRequirements(outputCatalogId: CatalogId): ItemRequirement[] {
    const raw = parseMap(wfcdReqJson);
    const def = raw[String(outputCatalogId)];

    if (!def || typeof def !== "object") return [];

    const comps = Array.isArray((def as any).components) ? (def as any).components : [];
    const out: ItemRequirement[] = [];

    for (const c of comps) {
        const cid = typeof c?.catalogId === "string" ? c.catalogId : "";
        const cnt = safeCount(c?.count ?? 0);

        if (!cid.startsWith("items:")) continue;
        if (cnt <= 0) continue;

        out.push({
            catalogId: cid as CatalogId,
            count: cnt
        });
    }

    return out;
}

