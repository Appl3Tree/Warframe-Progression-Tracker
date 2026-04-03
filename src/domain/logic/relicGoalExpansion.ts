import type { CatalogId } from "../catalog/loadFullCatalog";
import { FULL_CATALOG } from "../catalog/loadFullCatalog";
import { resolveItemRequirementGraph } from "../../catalog/items/itemRequirements";

type GoalLike = {
    id: string;
    type: string;
    catalogId: string;
    qty: number;
    isActive: boolean;
};

type InventoryLike = {
    counts?: Record<string, number>;
};

function safeInt(v: unknown, fallback: number): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

function isExplicitBlueprintItem(catalogId: CatalogId, name: string): boolean {
    const cidStr = String(catalogId).toLowerCase();
    const nm = String(name ?? "").toLowerCase();
    return nm.endsWith(" blueprint") || cidStr.endsWith("blueprint");
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

type RequirementComponent = {
    catalogId: CatalogId;
    count: number;
};

function makeRequirementResolver() {
    const cache = new Map<string, RequirementComponent[]>();

    return function getDirectRequirementsForExpansion(catalogId: CatalogId): RequirementComponent[] {
        const key = String(catalogId);
        const cached = cache.get(key);
        if (cached) return cached;

        const rec = FULL_CATALOG.recordsById[catalogId];
        const name = rec?.displayName ?? String(catalogId);
        const resolution = resolveItemRequirementGraph(catalogId);

        if (!isExplicitBlueprintItem(catalogId, name)) {
            const blueprintEdge = resolution.edges.find((edge) =>
                edge.provenance === "wfcd-output-blueprint" || edge.provenance === "derived-output-blueprint",
            );
            if (isDirectMarketPurchasableOutput(catalogId) && !blueprintEdge) {
                cache.set(key, []);
                return [];
            }
            if (blueprintEdge) {
                const result = [{ catalogId: blueprintEdge.catalogId, count: blueprintEdge.count }];
                cache.set(key, result);
                return result;
            }
        }

        const agg = new Map<string, number>();
        for (const edge of resolution.edges) {
            const cid = String(edge.catalogId ?? "");
            if (!cid) continue;
            agg.set(cid, (agg.get(cid) ?? 0) + Math.max(1, safeInt(edge.count ?? 1, 1)));
        }

        const result = Array.from(agg.entries())
            .map(([cid, count]) => ({ catalogId: cid as CatalogId, count }))
            .sort((a, b) => String(a.catalogId).localeCompare(String(b.catalogId)));

        cache.set(key, result);
        return result;
    };
}

export function buildRelicGoalItemNames(args: {
    goals: GoalLike[];
    inventory: InventoryLike;
    maxDepth?: number;
}): Set<string> {
    const { goals, inventory } = args;
    const maxDepth = Math.max(1, safeInt(args.maxDepth ?? 25, 25));
    const getDirectRequirementsForExpansion = makeRequirementResolver();
    const itemNames = new Set<string>();

    function walk(catalogId: CatalogId, qty: number, depth: number): void {
        const rec = FULL_CATALOG.recordsById[catalogId];
        if (!rec) return;

        const have = safeInt(inventory?.counts?.[String(catalogId)] ?? 0, 0);
        const remaining = Math.max(0, qty - have);
        if (remaining <= 0) return;

        itemNames.add(rec.displayName ?? String(catalogId));
        if (depth >= maxDepth) return;

        const comps = getDirectRequirementsForExpansion(catalogId);
        for (const comp of comps) {
            const childNeed = Math.max(1, safeInt(comp.count ?? 1, 1)) * remaining;
            walk(comp.catalogId, childNeed, depth + 1);
        }
    }

    for (const goal of goals ?? []) {
        if (!goal || goal.isActive === false || goal.type !== "item") continue;
        const cid = String(goal.catalogId) as CatalogId;
        const qty = Math.max(1, safeInt(goal.qty ?? 1, 1));
        walk(cid, qty, 0);
    }

    return itemNames;
}
