import type { CatalogId } from "../catalog/loadFullCatalog";
import { FULL_CATALOG } from "../catalog/loadFullCatalog";
import type { UserGoalV1 } from "../models/userState";

export type GoalCatalogKind = "item" | "mod" | "arcane";

type InventoryLike = {
    counts?: Record<string, number>;
    arcaneRanks?: Record<string, Record<string, number>>;
} | null | undefined;

function safeInt(v: unknown, fallback = 0): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

export function getGoalCatalogKindForCatalogId(catalogId: CatalogId | string): GoalCatalogKind {
    const rec = FULL_CATALOG.recordsById[String(catalogId) as CatalogId];
    if (String(catalogId).startsWith("mods:")) {
        const raw: any = rec?.raw ?? null;
        const type = String(raw?.type ?? raw?.data?.type ?? "").toLowerCase();
        const category = String(raw?.category ?? "").toLowerCase();
        if (type === "arcane" || category === "arcanes") return "arcane";
        return "mod";
    }
    return "item";
}

export function getGoalCatalogKind(goal: Pick<UserGoalV1, "type" | "catalogId">): GoalCatalogKind {
    if (goal.type === "mod" || goal.type === "arcane") return goal.type;
    return getGoalCatalogKindForCatalogId(goal.catalogId);
}

export function getOwnedCountForCatalogId(catalogId: CatalogId | string, inventory: InventoryLike): number {
    const key = String(catalogId);
    const flatCount = safeInt(inventory?.counts?.[key] ?? 0, 0);

    if (getGoalCatalogKindForCatalogId(key) !== "arcane") return flatCount;
    const rawPath = key.startsWith("mods:") ? key.slice("mods:".length) : key;
    const ranks = inventory?.arcaneRanks?.[rawPath];
    if (!ranks || typeof ranks !== "object") return flatCount;
    const rankedTotal = Object.values(ranks).reduce((sum, value) => sum + safeInt(value ?? 0, 0), 0);
    return Math.max(flatCount, rankedTotal);
}

export function getOwnedCountForGoal(goal: Pick<UserGoalV1, "catalogId">, inventory: InventoryLike): number {
    return getOwnedCountForCatalogId(goal.catalogId, inventory);
}
