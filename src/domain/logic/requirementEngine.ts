// ===== FILE: src/domain/logic/requirementEngine.ts =====
// src/domain/logic/requirementEngine.ts
import type { CatalogId } from "../catalog/loadFullCatalog";
import { FULL_CATALOG } from "../catalog/loadFullCatalog";
import { getItemRequirements } from "../../catalog/items/itemRequirements";
import {
    countUniqueSources,
    overlapSourceKey,
    groupBySource,
    type OverlapGroup
} from "./overlapEngine";

import type { SourceId } from "../ids/sourceIds";
import { SOURCE_INDEX } from "../../catalog/sources/sourceCatalog";
import { getAcquisitionByCatalogId } from "../../catalog/items/itemAcquisition";

import type { PrereqId } from "../ids/prereqIds";

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

/**
 * IMPORTANT: This snapshot is "what you need", not "what is actionable".
 * It must NOT filter based on acquisition knowledge.
 * Actionability is handled by buildFarmingSnapshot().
 */
export function buildRequirementsSnapshot(args: {
    syndicates: any[];
    goals: GoalLike[];
    completedPrereqs: Record<string, boolean>;
    inventory: InventoryLike;
}): RequirementsResult {
    const { syndicates, goals, inventory } = args;

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
        // Still fail-closed on unknown catalog id (data integrity), but DO NOT gate by acquisition.
        if (!FULL_CATALOG.recordsById[catalogId]) return;

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

    /**
     * Goal component expansion (recursive)
     * - Expands an item into all of its recipe requirements (and their requirements, etc.).
     * - Uses getItemRequirements() as the sole source of truth.
     * - Cycle-safe and depth-capped to avoid runaway graphs.
     */
    function addGoalWithRecursiveComponents(args2: {
        goal: GoalLike;
        rootCatalogId: CatalogId;
        rootQty: number;
        rootName: string;
    }): void {
        const { goal, rootCatalogId, rootQty, rootName } = args2;

        const visited = new Set<string>();
        const maxDepth = 25;

        function walk(catalogId: CatalogId, multiplier: number, depth: number): void {
            const k = String(catalogId);
            if (visited.has(k)) return;
            if (depth > maxDepth) return;

            visited.add(k);

            const comps = getItemRequirements(catalogId);
            if (Array.isArray(comps) && comps.length > 0) {
                for (const c of comps) {
                    const cNeed = Math.max(1, safeInt(c.count ?? 0, 0)) * multiplier;
                    if (cNeed <= 0) continue;

                    const compId = c.catalogId as CatalogId;

                    // Add the component line itself
                    addItemNeed(compId, cNeed, {
                        type: "goal",
                        id: goal.id,
                        name: rootName,
                        label: "Goal Component",
                        need: cNeed
                    });

                    // Recurse into that component as well
                    walk(compId, cNeed, depth + 1);
                }
            }

            visited.delete(k);
        }

        // Root item need
        addItemNeed(rootCatalogId, rootQty, {
            type: "goal",
            id: goal.id,
            name: rootName,
            label: "Goal",
            need: rootQty
        });

        // Recursive expansion
        walk(rootCatalogId, rootQty, 0);
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

    // 2) Goals (direct item goals + recursive breakdown via registry)
    for (const g of goals ?? []) {
        if (!g || g.isActive === false) continue;
        if (g.type !== "item") continue;

        const cid = String(g.catalogId) as CatalogId;
        const qty = Math.max(1, safeInt(g.qty ?? 1, 1));

        const rec = FULL_CATALOG.recordsById[cid];
        const goalName = rec?.displayName || cid;

        addGoalWithRecursiveComponents({
            goal: g,
            rootCatalogId: cid,
            rootQty: qty,
            rootName: goalName
        });
    }

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

// ---------------- Farming (acquisition-based) ----------------

export type FarmingItemSource = {
    sourceId: SourceId;
    sourceLabel: string;
};

export type FarmingItemLine = {
    key: CatalogId;
    name: string;
    remaining: number;
    sources: FarmingItemSource[];
};

export type FarmingOverlapItem = {
    key: CatalogId;
    name: string;
    remaining: number;
};

export type FarmingSourceGroup = OverlapGroup<FarmingOverlapItem> & {
    itemCount: number;
    totalRemaining: number;
};

export type HiddenFarmingItem = {
    key: CatalogId;
    name: string;
    remaining: number;
    reason:
        | "unknown-acquisition"
        | "unknown-recipe-acquisition"
        | "missing-prereqs"
        | "no-accessible-sources";

    // Diagnostics payload
    missingPrereqs?: PrereqId[];
    blockedBySources?: SourceId[];

    // Recipe diagnostics (optional)
    blockedByRecipeComponents?: Array<{
        catalogId: CatalogId;
        name: string;
        reason:
            | "unknown-acquisition"
            | "unknown-recipe-acquisition"
            | "missing-prereqs"
            | "no-accessible-sources";
    }>;
};

export type FarmingSnapshot = {
    targeted: FarmingItemLine[];
    overlap: FarmingSourceGroup[];
    hidden: HiddenFarmingItem[];
    stats: {
        actionableItemsWithKnownAcquisition: number;
        hiddenForUnknownAcquisition: number;
        hiddenForUnknownRecipeAcquisition: number;
        hiddenForMissingPrereqs: number;
        hiddenForNoAccessibleSources: number;
        overlapSourceCount: number;
    };
};

/**
 * Accessibility policy:
 * - Any data:* source is actionable by default (we have a known acquisition path).
 * - If a data:* source is present in SOURCE_INDEX with prereqs, those prereqs gate it.
 * - Non-data sources require SOURCE_INDEX and prereqs satisfied.
 */
function canAccessSource(sourceId: SourceId, completedPrereqs: Record<string, boolean>): boolean {
    const sidStr = String(sourceId);

    if (sidStr.startsWith("data:")) {
        const def = SOURCE_INDEX[sourceId];
        if (!def) return true;

        const prereqs = Array.isArray(def.prereqIds) ? def.prereqIds : [];
        for (const pr of prereqs) {
            if (!completedPrereqs[String(pr)]) return false;
        }
        return true;
    }

    const def = SOURCE_INDEX[sourceId];
    if (!def) return false;

    const prereqs = Array.isArray(def.prereqIds) ? def.prereqIds : [];
    for (const pr of prereqs) {
        if (!completedPrereqs[String(pr)]) return false;
    }

    return true;
}

function getMissingPrereqsForSources(args: {
    sourceIds: SourceId[];
    completedPrereqs: Record<string, boolean>;
}): { missingPrereqs: PrereqId[]; blockedBySources: SourceId[]; hasUncuratedGate: boolean } {
    const { sourceIds, completedPrereqs } = args;

    const missing = new Set<PrereqId>();
    const blockedSources: SourceId[] = [];

    let hasUncuratedGate = false;

    for (const sid of sourceIds) {
        const sidStr = String(sid);

        // Data-derived sources are known acquisitions by default.
        // Only treat them as blocked if we explicitly curated prereqs in SOURCE_INDEX and they are unmet.
        if (sidStr.startsWith("data:")) {
            const def = SOURCE_INDEX[sid];
            if (!def) {
                continue;
            }

            const prereqs = Array.isArray(def.prereqIds) ? def.prereqIds : [];
            let thisSourceBlocked = false;

            for (const pr of prereqs) {
                if (!completedPrereqs[String(pr)]) {
                    missing.add(String(pr) as PrereqId);
                    thisSourceBlocked = true;
                }
            }

            if (thisSourceBlocked) {
                blockedSources.push(sid);
            }

            continue;
        }

        const def = SOURCE_INDEX[sid];
        if (!def) {
            // We have a sourceId, but we don't have curated metadata for it.
            // Treat as "uncurated gating" (do not mislabel as "no accessible sources").
            hasUncuratedGate = true;
            blockedSources.push(sid);
            continue;
        }

        const prereqs = Array.isArray(def.prereqIds) ? def.prereqIds : [];

        // Curated prereqs: record missing
        let thisSourceBlocked = false;
        for (const pr of prereqs) {
            if (!completedPrereqs[String(pr)]) {
                missing.add(String(pr) as PrereqId);
                thisSourceBlocked = true;
            }
        }

        if (thisSourceBlocked) {
            blockedSources.push(sid);
        }
    }

    return {
        missingPrereqs: Array.from(missing),
        blockedBySources: blockedSources,
        hasUncuratedGate
    };
}

function getAcquisitionSourcesForCatalogId(catalogId: CatalogId): SourceId[] | null {
    const def = getAcquisitionByCatalogId(catalogId);
    if (!def || !Array.isArray(def.sources) || def.sources.length === 0) return null;
    return def.sources as SourceId[];
}

/**
 * Ingredient/material policy for Farming:
 * - Ingredients should still appear in Requirements (what you need),
 * - but they must NOT force a farmability/acquisition mapping for a crafted item to be considered actionable.
 *
 * This is intentionally conservative and based on the canonical Lotus path prefix for "Items".
 */
function isIngredientLikeCatalogItem(catalogId: CatalogId): boolean {
    const rec = FULL_CATALOG.recordsById[catalogId];
    const path = String(rec?.path ?? "");

    if (path.startsWith("/Lotus/Types/Items/")) return true;

    const rawType = typeof (rec as any)?.raw?.type === "string" ? String((rec as any).raw.type).toLowerCase() : "";
    if (rawType === "resource") return true;

    return false;
}

function isRecipeCatalogItem(catalogId: CatalogId): boolean {
    const rec = FULL_CATALOG.recordsById[catalogId];
    const path = String(rec?.path ?? "");
    return path.startsWith("/Lotus/Types/Recipes/");
}

/**
 * Blueprint-like policy for Farming:
 * - Blueprints/recipes are NOT "ingredients".
 * - They should not be lumped into unknown-acquisition.
 * - Until we wire a blueprint acquisition provider (market/dojo/vendors/drops), they are classified separately.
 */
function isBlueprintLikeCatalogItem(catalogId: CatalogId, name: string): boolean {
    if (isRecipeCatalogItem(catalogId)) return true;
    if (String(name).toLowerCase().endsWith(" blueprint")) return true;
    return false;
}

type AcquireAnalysis =
    | {
          kind: "ok";
          sources: FarmingItemSource[];
      }
    | {
          kind: "hidden";
          hidden: HiddenFarmingItem;
      };

function analyzeCatalogIdForFarming(args: {
    catalogId: CatalogId;
    name: string;
    remaining: number;
    completedPrereqs: Record<string, boolean>;
    visited: Set<string>;
    depth: number;
}): AcquireAnalysis {
    const { catalogId, name, remaining, completedPrereqs, visited, depth } = args;

    // IMPORTANT:
    // The "ingredient unmapped is fine" policy is only for RECIPE COMPONENTS.
    // For the root required item (depth === 0), we still must attempt direct acquisition.
    if (depth > 0 && isIngredientLikeCatalogItem(catalogId)) {
        return { kind: "ok", sources: [] };
    }

    const visitKey = String(catalogId);
    if (visited.has(visitKey)) {
        return {
            kind: "hidden",
            hidden: { key: catalogId, name, remaining, reason: "unknown-acquisition" }
        };
    }

    if (depth > 25) {
        return {
            kind: "hidden",
            hidden: { key: catalogId, name, remaining, reason: "unknown-acquisition" }
        };
    }

    // 1) Try direct acquisition (including blueprint-like items)
    const directSources = getAcquisitionSourcesForCatalogId(catalogId);
    if (directSources && directSources.length > 0) {
        const accessible = directSources
            .filter((sid) => canAccessSource(sid, completedPrereqs))
            .map((sid) => ({
                sourceId: sid,
                sourceLabel: SOURCE_INDEX[sid]?.label ?? String(sid)
            }));

        if (accessible.length > 0) {
            return { kind: "ok", sources: accessible };
        }

        // Direct exists but is currently blocked; we will still consider crafting as an alternate path if recipe exists.
        const comps = getItemRequirements(catalogId);
        if (!Array.isArray(comps) || comps.length === 0) {
            const diag = getMissingPrereqsForSources({ sourceIds: directSources, completedPrereqs });

            const inferredReason: HiddenFarmingItem["reason"] =
                diag.missingPrereqs.length > 0
                    ? "missing-prereqs"
                    : diag.hasUncuratedGate
                        ? "unknown-acquisition"
                        : "no-accessible-sources";

            return {
                kind: "hidden",
                hidden: {
                    key: catalogId,
                    name,
                    remaining,
                    reason: inferredReason,
                    missingPrereqs: diag.missingPrereqs,
                    blockedBySources: diag.blockedBySources
                }
            };
        }
        // else: fall through to crafting analysis
    }

    // If this is a blueprint-like item and we have NO direct acquisition mapping, do NOT label it unknown-acquisition.
    // This is the correct "work remaining": wire a blueprint acquisition provider (market/dojo/vendors/drops).
    if (isBlueprintLikeCatalogItem(catalogId, name)) {
        return {
            kind: "hidden",
            hidden: { key: catalogId, name, remaining, reason: "unknown-recipe-acquisition" }
        };
    }

    // 2) Crafting path (Foundry) if recipe exists
    const recipe = getItemRequirements(catalogId);
    if (!Array.isArray(recipe) || recipe.length === 0) {
        return {
            kind: "hidden",
            hidden: { key: catalogId, name, remaining, reason: "unknown-acquisition" }
        };
    }

    visited.add(visitKey);

    const missingPrereqs = new Set<PrereqId>();
    let anyNoAccessibleSources = false;

    const blockedByRecipeComponents: HiddenFarmingItem["blockedByRecipeComponents"] = [];

    for (const c of recipe) {
        const compId = c.catalogId as CatalogId;
        const compRec = FULL_CATALOG.recordsById[compId];
        const compName = compRec?.displayName ?? String(compId);

        // Ingredient-like components are allowed to be "unmapped".
        // Blueprint-like components are also allowed to be unmapped (they should not gate craftability).
        if (isIngredientLikeCatalogItem(compId) || isBlueprintLikeCatalogItem(compId, compName)) {
            continue;
        }

        const r = analyzeCatalogIdForFarming({
            catalogId: compId,
            name: compName,
            remaining: 1,
            completedPrereqs,
            visited,
            depth: depth + 1
        });

        if (r.kind === "ok") continue;

        const reason = r.hidden.reason;

        blockedByRecipeComponents.push({
            catalogId: compId,
            name: compName,
            reason
        });

        if (reason === "missing-prereqs") {
            for (const p of r.hidden.missingPrereqs ?? []) {
                missingPrereqs.add(p);
            }
        } else if (reason === "no-accessible-sources") {
            anyNoAccessibleSources = true;
        }
    }

    visited.delete(visitKey);

    if ((blockedByRecipeComponents ?? []).some((x) => x.reason === "unknown-acquisition")) {
        return {
            kind: "hidden",
            hidden: {
                key: catalogId,
                name,
                remaining,
                reason: "unknown-acquisition",
                blockedByRecipeComponents
            }
        };
    }

    if ((blockedByRecipeComponents ?? []).some((x) => x.reason === "unknown-recipe-acquisition")) {
        return {
            kind: "hidden",
            hidden: {
                key: catalogId,
                name,
                remaining,
                reason: "unknown-recipe-acquisition",
                blockedByRecipeComponents
            }
        };
    }

    if (missingPrereqs.size > 0) {
        return {
            kind: "hidden",
            hidden: {
                key: catalogId,
                name,
                remaining,
                reason: "missing-prereqs",
                missingPrereqs: Array.from(missingPrereqs),
                blockedByRecipeComponents
            }
        };
    }

    if (anyNoAccessibleSources) {
        return {
            kind: "hidden",
            hidden: {
                key: catalogId,
                name,
                remaining,
                reason: "no-accessible-sources",
                blockedByRecipeComponents
            }
        };
    }

    return {
        kind: "ok",
        sources: [
            {
                sourceId: "data:crafting" as SourceId,
                sourceLabel: "Crafting (Foundry)"
            }
        ]
    };
}

export function buildFarmingSnapshot(args: {
    requirements: RequirementsResult;
    completedPrereqs: Record<string, boolean>;
}): FarmingSnapshot {
    const { requirements, completedPrereqs } = args;

    const targeted: FarmingItemLine[] = [];
    const hidden: HiddenFarmingItem[] = [];

    for (const line of requirements.itemLines) {
        const analysis = analyzeCatalogIdForFarming({
            catalogId: line.key,
            name: line.name,
            remaining: line.remaining,
            completedPrereqs,
            visited: new Set<string>(),
            depth: 0
        });

        if (analysis.kind === "ok") {
            targeted.push({
                key: line.key,
                name: line.name,
                remaining: line.remaining,
                sources: analysis.sources
            });
        } else {
            hidden.push(analysis.hidden);
        }
    }

    targeted.sort((a, b) => {
        if (a.remaining !== b.remaining) return b.remaining - a.remaining;
        return a.name.localeCompare(b.name);
    });

    hidden.sort((a, b) => {
        if (a.reason !== b.reason) return a.reason.localeCompare(b.reason);
        if (a.remaining !== b.remaining) return b.remaining - a.remaining;
        return a.name.localeCompare(b.name);
    });

    const overlapInputs: Array<{ sourceId: string; sourceLabel: string; item: FarmingOverlapItem }> = [];

    for (const l of targeted) {
        for (const s of l.sources) {
            if (!s?.sourceId) continue;
            overlapInputs.push({
                sourceId: String(s.sourceId),
                sourceLabel: s.sourceLabel,
                item: { key: l.key, name: l.name, remaining: l.remaining }
            });
        }
    }

    const rawGroups = groupBySource({ items: overlapInputs });

    const overlap: FarmingSourceGroup[] = rawGroups
        .map((g) => {
            const uniq = new Map<string, FarmingOverlapItem>();
            for (const it of g.items) {
                uniq.set(String(it.key), it);
            }

            const items = Array.from(uniq.values());
            items.sort((a, b) => {
                if (a.remaining !== b.remaining) return b.remaining - a.remaining;
                return a.name.localeCompare(b.name);
            });

            return {
                sourceId: g.sourceId,
                sourceLabel: g.sourceLabel,
                items,
                itemCount: items.length,
                totalRemaining: items.reduce((sum, x) => sum + Math.max(0, Math.floor(x.remaining ?? 0)), 0)
            };
        })
        .filter((g) => g.itemCount >= 2)
        .sort((a, b) => {
            if (a.itemCount !== b.itemCount) return b.itemCount - a.itemCount;
            if (a.totalRemaining !== b.totalRemaining) return b.totalRemaining - a.totalRemaining;
            return a.sourceLabel.localeCompare(b.sourceLabel);
        });

    const hiddenForUnknownAcquisition = hidden.filter((h) => h.reason === "unknown-acquisition").length;
    const hiddenForUnknownRecipeAcquisition = hidden.filter((h) => h.reason === "unknown-recipe-acquisition").length;
    const hiddenForMissingPrereqs = hidden.filter((h) => h.reason === "missing-prereqs").length;
    const hiddenForNoAccessibleSources = hidden.filter((h) => h.reason === "no-accessible-sources").length;

    return {
        targeted,
        overlap,
        hidden,
        stats: {
            actionableItemsWithKnownAcquisition: targeted.length,
            hiddenForUnknownAcquisition,
            hiddenForUnknownRecipeAcquisition,
            hiddenForMissingPrereqs,
            hiddenForNoAccessibleSources,
            overlapSourceCount: overlap.length
        }
    };
}

