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

    for (const g of goals ?? []) {
        if (!g || g.isActive === false) continue;
        if (g.type !== "item") continue;

        const cid = String(g.catalogId) as CatalogId;
        const qty = Math.max(1, safeInt(g.qty ?? 1, 1));

        const rec = FULL_CATALOG.recordsById[cid];
        const goalName = rec?.displayName || cid;

        addItemNeed(cid, qty, {
            type: "goal",
            id: g.id,
            name: goalName,
            label: "Goal",
            need: qty
        });

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
    reason: "unknown-acquisition" | "missing-prereqs" | "no-accessible-sources";

    missingPrereqs?: PrereqId[];
    blockedBySources?: SourceId[];

    blockedByRecipeComponents?: Array<{
        catalogId: CatalogId;
        name: string;
        reason: "unknown-acquisition" | "missing-prereqs" | "no-accessible-sources";
    }>;
};

export type FarmingSnapshot = {
    targeted: FarmingItemLine[];
    overlap: FarmingSourceGroup[];
    hidden: HiddenFarmingItem[];
    stats: {
        actionableItemsWithKnownAcquisition: number;
        hiddenForUnknownAcquisition: number;
        hiddenForMissingPrereqs: number;
        hiddenForNoAccessibleSources: number;
        overlapSourceCount: number;
    };
};

/**
 * Same policy as plannerEngine:
 * - data-derived sources with no prereqs are fail-closed by default
 * - EXCEPT WFCD/Wiki auto drop sources (actionable)
 */
function isAutoDropSourceId(sourceId: SourceId): boolean {
    const sid = String(sourceId);
    return (
        sid.startsWith("data:wfcd:") ||
        sid.startsWith("data:wfcd_") ||
        sid.startsWith("wfcd:") ||
        sid.startsWith("data:wiki:") ||
        sid.startsWith("data:wikidrops:") ||
        sid.startsWith("wiki:")
    );
}

function canAccessSource(sourceId: SourceId, completedPrereqs: Record<string, boolean>): boolean {
    const def = SOURCE_INDEX[sourceId];
    if (!def) return false;

    const prereqs = Array.isArray(def.prereqIds) ? def.prereqIds : [];

    const isDataDerived = String(sourceId).startsWith("data:");
    if (isDataDerived && prereqs.length === 0 && !isAutoDropSourceId(sourceId)) {
        return false;
    }

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
        const def = SOURCE_INDEX[sid];
        if (!def) {
            hasUncuratedGate = true;
            blockedSources.push(sid);
            continue;
        }

        const prereqs = Array.isArray(def.prereqIds) ? def.prereqIds : [];
        const isDataDerived = String(sid).startsWith("data:");

        // Treat WFCD/Wiki auto drop sources as actionable even without curated prereqs.
        if (isDataDerived && prereqs.length === 0 && !isAutoDropSourceId(sid)) {
            hasUncuratedGate = true;
            blockedSources.push(sid);
            continue;
        }

        let thisSourceBlocked = false;
        for (const pr of prereqs) {
            if (!completedPrereqs[String(pr)]) {
                missing.add(String(pr) as PrereqId);
                thisSourceBlocked = true;
            }
        }

        if (thisSourceBlocked) blockedSources.push(sid);
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
    return def.sources;
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

    const visitKey = String(catalogId);
    if (visited.has(visitKey)) {
        return {
            kind: "hidden",
            hidden: {
                key: catalogId,
                name,
                remaining,
                reason: "unknown-acquisition"
            }
        };
    }

    if (depth > 25) {
        return {
            kind: "hidden",
            hidden: {
                key: catalogId,
                name,
                remaining,
                reason: "unknown-acquisition"
            }
        };
    }

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

        const comps = getItemRequirements(catalogId);
        if (!Array.isArray(comps) || comps.length === 0) {
            const diag = getMissingPrereqsForSources({ sourceIds: directSources, completedPrereqs });
            return {
                kind: "hidden",
                hidden: {
                    key: catalogId,
                    name,
                    remaining,
                    reason: diag.missingPrereqs.length > 0 ? "missing-prereqs" : "no-accessible-sources",
                    missingPrereqs: diag.missingPrereqs,
                    blockedBySources: diag.blockedBySources
                }
            };
        }
    }

    const recipe = getItemRequirements(catalogId);
    if (!Array.isArray(recipe) || recipe.length === 0) {
        return {
            kind: "hidden",
            hidden: {
                key: catalogId,
                name,
                remaining,
                reason: "unknown-acquisition"
            }
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

        const r = analyzeCatalogIdForFarming({
            catalogId: compId,
            name: compName,
            remaining: 1,
            completedPrereqs,
            visited,
            depth: depth + 1
        });

        if (r.kind === "ok") {
            continue;
        }

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

    if (blockedByRecipeComponents.some((x) => x.reason === "unknown-acquisition")) {
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
                sourceId: "system:crafting" as SourceId,
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
            overlapInputs.push({
                sourceId: String(s.sourceId),
                sourceLabel: s.sourceLabel,
                item: {
                    key: l.key,
                    name: l.name,
                    remaining: l.remaining
                }
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
    const hiddenForMissingPrereqs = hidden.filter((h) => h.reason === "missing-prereqs").length;
    const hiddenForNoAccessibleSources = hidden.filter((h) => h.reason === "no-accessible-sources").length;

    return {
        targeted,
        overlap,
        hidden,
        stats: {
            actionableItemsWithKnownAcquisition: targeted.length,
            hiddenForUnknownAcquisition,
            hiddenForMissingPrereqs,
            hiddenForNoAccessibleSources,
            overlapSourceCount: overlap.length
        }
    };
}

