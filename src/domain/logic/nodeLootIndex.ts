// ===== FILE: src/domain/logic/nodeLootIndex.ts =====

import { FULL_CATALOG } from "../catalog/loadFullCatalog";
import { deriveDropDataAcquisitionByCatalogId } from "../../catalog/items/acquisitionFromDropData";
import { getDropSourcesForStarChartNode } from "../catalog/starChart/nodeDropSourceMap";

export type NodeLootItem = {
    catalogId: string;
    name: string;
};

type LootIndex = {
    bySourceId: Record<string, NodeLootItem[]>;
};

let _cache: LootIndex | null = null;

function buildLootIndex(): LootIndex {
    const bySourceId: Record<string, NodeLootItem[]> = Object.create(null);

    const acqByCatalogId = deriveDropDataAcquisitionByCatalogId();
    const recordsById: Record<string, any> = (FULL_CATALOG as any)?.recordsById ?? {};

    for (const [catalogId, def] of Object.entries(acqByCatalogId)) {
        const sources = Array.isArray((def as any)?.sources) ? (def as any).sources : [];
        if (sources.length === 0) continue;

        const rec = recordsById[catalogId];
        const name =
            typeof rec?.displayName === "string"
                ? rec.displayName
                : typeof rec?.name === "string"
                    ? rec.name
                    : String(catalogId);

        const item: NodeLootItem = { catalogId: String(catalogId), name: String(name) };

        for (const sidRaw of sources) {
            const sid = String(sidRaw ?? "").trim();
            if (!sid) continue;

            if (!bySourceId[sid]) bySourceId[sid] = [];
            bySourceId[sid].push(item);
        }
    }

    for (const sid of Object.keys(bySourceId)) {
        bySourceId[sid].sort((a, b) => a.name.localeCompare(b.name));
    }

    return { bySourceId };
}

function getIndex(): LootIndex {
    if (!_cache) _cache = buildLootIndex();
    return _cache;
}

export function getLootForSourceId(sourceId: string): NodeLootItem[] {
    const sid = String(sourceId ?? "").trim();
    if (!sid) return [];
    return getIndex().bySourceId[sid] ?? [];
}

export function getLootForStarChartNode(nodeId: string): NodeLootItem[] {
    const sids = getDropSourcesForStarChartNode(nodeId);
    if (sids.length === 0) return [];

    const out: NodeLootItem[] = [];
    const seen = new Set<string>();

    for (const sid of sids) {
        const rows = getLootForSourceId(sid);
        for (const it of rows) {
            if (seen.has(it.catalogId)) continue;
            seen.add(it.catalogId);
            out.push(it);
        }
    }

    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
}

export function invalidateNodeLootIndexCache(): void {
    _cache = null;
}

