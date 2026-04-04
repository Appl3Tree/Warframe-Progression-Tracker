import relicGoalIndexRaw from "../../data/_generated/relic-goal-index.auto.json";

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

type RelicGoalIndexRow = {
    displayName: string;
    edges: Array<{
        catalogId: string;
        count: number;
    }>;
};

const RELIC_GOAL_INDEX = relicGoalIndexRaw as Record<string, RelicGoalIndexRow>;

function safeInt(v: unknown, fallback: number): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

export function buildRelicGoalItemNames(args: {
    goals: GoalLike[];
    inventory: InventoryLike;
    maxDepth?: number;
}): Set<string> {
    const { goals, inventory } = args;
    const maxDepth = Math.max(1, safeInt(args.maxDepth ?? 25, 25));
    const itemNames = new Set<string>();

    function walk(catalogId: string, qty: number, depth: number): void {
        const row = RELIC_GOAL_INDEX[catalogId];
        if (!row) return;

        const have = safeInt(inventory?.counts?.[catalogId] ?? 0, 0);
        const remaining = Math.max(0, qty - have);
        if (remaining <= 0) return;

        itemNames.add(row.displayName || catalogId);
        if (depth >= maxDepth) return;

        for (const edge of row.edges ?? []) {
            const childNeed = Math.max(1, safeInt(edge.count ?? 1, 1)) * remaining;
            walk(edge.catalogId, childNeed, depth + 1);
        }
    }

    for (const goal of goals ?? []) {
        if (!goal || goal.isActive === false || goal.type !== "item") continue;
        const qty = Math.max(1, safeInt(goal.qty ?? 1, 1));
        walk(String(goal.catalogId), qty, 0);
    }

    return itemNames;
}

export function getRelicGoalDisplayName(catalogId: string): string | null {
    return RELIC_GOAL_INDEX[String(catalogId)]?.displayName ?? null;
}
