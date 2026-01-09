// ===== FILE: src/domain/logic/requirementEngine.ts =====
import type { CatalogId } from "../catalog/loadFullCatalog";
import { FULL_CATALOG } from "../catalog/loadFullCatalog";
import { canAccessCatalogItem } from "./plannerEngine";
import { getItemRequirements } from "../../catalog/items/itemRequirements";
import { countUniqueSources, overlapSourceKey } from "./overlapEngine";

export type RequirementViewMode = "targeted" | "overlap";

export type RequirementSource =
    | {
        type: "syndicate";
        id: string;
        name: string;
        label: string;
        need: number;
    }
    | {
        type: "goal";
        id: string;
        name: string;
        label: string;
        need: number;
    };

export type ItemRequirementLine = {
    key: CatalogId;
    name: string;
    totalNeed: number;
    have: number;
    remaining: number;
    sources: RequirementSource[];
    uniqueSourceCount: number;
};

export type CurrencyRequirementLine = {
    key: "credits" | "platinum";
    name: string;
    totalNeed: number;
    have: number;
    remaining: number;
    sources: RequirementSource[];
    uniqueSourceCount: number;
};

export type RequirementsResult = {
    itemLines: ItemRequirementLine[];
    currencyLines: CurrencyRequirementLine[];
    stats: {
        actionableItemCount: number;
        overlapItemCount: number;
        totalRemainingItems: number;
        totalRemainingCredits: number;
        totalRemainingPlatinum: number;
    };
};

type InventoryLike = {
    credits?: number;
    platinum?: number;
    counts?: Record<string, number>;
};

type GoalLike = {
    id: string;
    type: string;
    catalogId: string;
    qty: number;
    isActive: boolean;
};

function safeInt(v: unknown, fallback: number): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

export function buildRequirementsSnapshot(args: {
    syndicates: any[];
    goals: GoalLike[];
    completedPrereqs: Record<string, boolean>;
    inventory: InventoryLike;
}): RequirementsResult {
    const { syndicates, goals, completedPrereqs, inventory } = args;

    const itemAgg: Record<
        string,
        {
            key: CatalogId;
            name: string;
            totalNeed: number;
            sources: RequirementSource[];
        }
    > = {};

    const currencyAgg: Record<
        "credits" | "platinum",
        {
            key: "credits" | "platinum";
            name: string;
            totalNeed: number;
            sources: RequirementSource[];
        }
    > = {
        credits: { key: "credits", name: "Credits", totalNeed: 0, sources: [] },
        platinum: { key: "platinum", name: "Platinum", totalNeed: 0, sources: [] }
    };

    function addItemNeed(catalogId: CatalogId, need: number, source: RequirementSource) {
        if (!FULL_CATALOG.recordsById[catalogId]) return;

        const access = canAccessCatalogItem(catalogId, completedPrereqs);
        if (!access.allowed) return;

        const rec = FULL_CATALOG.recordsById[catalogId];
        const name = rec?.displayName || String(catalogId);

        const mapKey = String(catalogId);
        if (!itemAgg[mapKey]) {
            itemAgg[mapKey] = { key: catalogId, name, totalNeed: 0, sources: [] };
        }

        itemAgg[mapKey].totalNeed += need;
        itemAgg[mapKey].sources.push(source);
    }

    function addCurrencyNeed(key: "credits" | "platinum", need: number, source: RequirementSource) {
        currencyAgg[key].totalNeed += need;
        currencyAgg[key].sources.push(source);
    }

    // 1) Syndicate next-rank requirements
    for (const syn of syndicates ?? []) {
        const syndicateId = typeof syn?.id === "string" ? syn.id : "";
        const syndicateName = typeof syn?.name === "string" ? syn.name : syndicateId || "Unknown Syndicate";

        const nr = syn?.nextRankUp;
        if (!nr || typeof nr !== "object") continue;

        const rankTitle =
            (typeof nr?.title === "string" && nr.title.trim()) ||
            (typeof syn?.rankLabel === "string" && syn.rankLabel.trim()) ||
            "Next Rank";

        const creditsNeed = safeInt(nr?.credits ?? 0, 0);
        if (creditsNeed > 0) {
            addCurrencyNeed("credits", creditsNeed, {
                type: "syndicate",
                id: syndicateId,
                name: syndicateName,
                label: String(rankTitle),
                need: creditsNeed
            });
        }

        const platNeed = safeInt(nr?.platinum ?? 0, 0);
        if (platNeed > 0) {
            addCurrencyNeed("platinum", platNeed, {
                type: "syndicate",
                id: syndicateId,
                name: syndicateName,
                label: String(rankTitle),
                need: platNeed
            });
        }

        const items = Array.isArray(nr?.items) ? nr.items : [];
        for (const it of items) {
            const key = typeof it?.key === "string" ? it.key : "";
            const need = safeInt(it?.count ?? 0, 0);
            if (!key || need <= 0) continue;

            addItemNeed(key as CatalogId, need, {
                type: "syndicate",
                id: syndicateId,
                name: syndicateName,
                label: String(rankTitle),
                need
            });
        }
    }

    // 2) Goals (direct item goals + optional breakdown via registry)
    for (const g of goals ?? []) {
        if (!g || g.isActive === false) continue;
        if (g.type !== "item") continue;

        const cid = String(g.catalogId) as CatalogId;
        const qty = Math.max(1, safeInt(g.qty ?? 1, 1));

        const rec = FULL_CATALOG.recordsById[cid];
        const goalName = rec?.displayName || cid;

        // 2a) The goal itself is a farming requirement (direct acquisition).
        addItemNeed(cid, qty, {
            type: "goal",
            id: g.id,
            name: goalName,
            label: "Goal",
            need: qty
        });

        // 2b) Optional recipe breakdown (only if you define it in registry).
        const comps = getItemRequirements(cid);
        for (const c of comps) {
            const cNeed = Math.max(1, safeInt(c.count ?? 0, 0)) * qty;
            if (cNeed <= 0) continue;

            const compRec = FULL_CATALOG.recordsById[c.catalogId];
            const compName = compRec?.displayName || String(c.catalogId);

            addItemNeed(c.catalogId, cNeed, {
                type: "goal",
                id: g.id,
                name: goalName,
                label: `Goal Component: ${compName}`,
                need: cNeed
            });
        }
    }

    // Build lines
    const itemLines: ItemRequirementLine[] = Object.values(itemAgg)
        .map((agg) => {
            const have = safeInt(inventory?.counts?.[String(agg.key)] ?? 0, 0);
            const remaining = Math.max(0, agg.totalNeed - have);

            const sources = [...agg.sources];
            sources.sort((a, b) => (b.need ?? 0) - (a.need ?? 0));

            const sourceKeys = sources.map((s) => overlapSourceKey(s.type, s.id, s.label));
            const uniqueSourceCount = countUniqueSources(sourceKeys);

            return {
                key: agg.key,
                name: agg.name,
                totalNeed: agg.totalNeed,
                have,
                remaining,
                sources,
                uniqueSourceCount
            };
        })
        .filter((l) => l.remaining > 0);

    itemLines.sort((a, b) => {
        if (a.remaining !== b.remaining) return b.remaining - a.remaining;
        return a.name.localeCompare(b.name);
    });

    const currencyLines: CurrencyRequirementLine[] = (["credits", "platinum"] as const)
        .map((k) => {
            const agg = currencyAgg[k];
            const have = k === "credits" ? safeInt(inventory?.credits ?? 0, 0) : safeInt(inventory?.platinum ?? 0, 0);
            const remaining = Math.max(0, agg.totalNeed - have);

            const sources = [...agg.sources];
            sources.sort((a, b) => (b.need ?? 0) - (a.need ?? 0));

            const sourceKeys = sources.map((s) => overlapSourceKey(s.type, s.id, s.label));
            const uniqueSourceCount = countUniqueSources(sourceKeys);

            return {
                key: k,
                name: agg.name,
                totalNeed: agg.totalNeed,
                have,
                remaining,
                sources,
                uniqueSourceCount
            };
        })
        .filter((l) => l.totalNeed > 0);

    const overlapItemCount = itemLines.filter((x) => x.uniqueSourceCount >= 2).length;

    const totalRemainingItems = itemLines.reduce((sum, x) => sum + x.remaining, 0);
    const totalRemainingCredits = currencyLines.find((x) => x.key === "credits")?.remaining ?? 0;
    const totalRemainingPlatinum = currencyLines.find((x) => x.key === "platinum")?.remaining ?? 0;

    return {
        itemLines,
        currencyLines,
        stats: {
            actionableItemCount: itemLines.length,
            overlapItemCount,
            totalRemainingItems,
            totalRemainingCredits,
            totalRemainingPlatinum
        }
    };
}

