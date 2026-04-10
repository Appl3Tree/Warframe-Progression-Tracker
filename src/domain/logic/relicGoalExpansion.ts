import relicGoalIndexRaw from "../../data/_generated/relic-goal-index.auto.json";
import { getAllRelicRewardItemNames } from "../../domain/catalog/relicCatalog";

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

// Lazily-initialized set of every display name that actually appears as a relic
// reward — used to decide whether an intermediate crafting node should be added
// to the item-name set (it should only be if it IS itself a relic drop).
let _relicRewardNames: Set<string> | null = null;
function relicRewardNames(): Set<string> {
    return (_relicRewardNames ??= new Set(getAllRelicRewardItemNames()));
}

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

        const edges = row.edges ?? [];
        const have = safeInt(inventory?.counts?.[catalogId] ?? 0, 0);
        const remaining = Math.max(0, qty - have);
        const name = row.displayName || catalogId;
        const isRelicReward = relicRewardNames().has(name);

        // Early-exit only for items that are NOT themselves relic rewards (e.g.
        // the assembled weapon "Perigale Prime", or crafted components that are
        // consumed rather than collected). If we already have enough of those,
        // nothing in this branch needs farming.
        //
        // Items that ARE relic rewards (e.g. "Perigale Prime Blueprint") must
        // continue recursing even when remaining = 0: owning the Blueprint does
        // not mean Barrel/Stock/Receiver are satisfied — they are independent
        // sibling relic drops listed as children of the Blueprint in the index.
        if (remaining <= 0 && !isRelicReward) return;

        // Add to the target set only when we still need to collect this item,
        // and only when it could be a relic drop:
        //   • Leaf nodes (no edges) — e.g. "Perigale Prime Barrel" — use prefix
        //     expansion to reach the matching relic reward name.
        //   • Intermediate relic rewards — e.g. "Perigale Prime Blueprint" —
        //     exact-matched by the expansion function.
        // Non-relic-reward intermediates (assembled "Perigale Prime") are never
        // added; their prefix would over-expand to already-satisfied parts.
        if (remaining > 0 && (edges.length === 0 || isRelicReward)) {
            itemNames.add(name);
        }

        if (depth >= maxDepth) return;

        // Use qty (total needed by the parent craft) rather than remaining as
        // the multiplier for children. This is critical when an intermediate
        // relic-drop item is already owned (remaining = 0): its siblings still
        // need to be checked, so children must receive the full parent qty, not
        // remaining * edge.count = 0.
        for (const edge of edges) {
            const childNeed = Math.max(1, safeInt(edge.count ?? 1, 1)) * qty;
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
