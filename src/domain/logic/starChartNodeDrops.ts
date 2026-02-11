// ===== FILE: src/domain/logic/starChartNodeDrops.ts =====

import type { CatalogId } from "../catalog/loadFullCatalog";
import { getDropSourcesForStarChartNode } from "../catalog/starChart/nodeDropSourceMap";
import { getItemsForSourceId, type SourceItemRow } from "./sourceToItemsIndex";

export type StarChartNodeDropRow = SourceItemRow & {
    matchedSources: string[];
};

function uniqByCatalogId(rows: StarChartNodeDropRow[]): StarChartNodeDropRow[] {
    const map = new Map<string, StarChartNodeDropRow>();

    for (const r of rows) {
        const k = String(r.catalogId);
        const existing = map.get(k);
        if (!existing) {
            map.set(k, { ...r, matchedSources: Array.from(new Set(r.matchedSources)).sort() });
            continue;
        }

        const merged = Array.from(new Set([...existing.matchedSources, ...r.matchedSources])).sort((a, b) => a.localeCompare(b));
        map.set(k, { ...existing, matchedSources: merged });
    }

    const out = Array.from(map.values());
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
}

export function getItemsForStarChartNode(nodeId: string): {
    nodeId: string;
    dropSourceIds: string[];
    items: StarChartNodeDropRow[];
} {
    const dropSourceIds = getDropSourcesForStarChartNode(nodeId);

    const rows: StarChartNodeDropRow[] = [];
    for (const sid of dropSourceIds) {
        const items = getItemsForSourceId(sid);
        for (const it of items) {
            rows.push({
                catalogId: it.catalogId as CatalogId,
                name: it.name,
                matchedSources: [sid]
            });
        }
    }

    return {
        nodeId: String(nodeId),
        dropSourceIds,
        items: uniqByCatalogId(rows)
    };
}

