// ===== FILE: src/catalog/items/itemAcquisition.ts =====
// src/catalog/items/itemAcquisition.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

import {
    deriveAcquisitionByCatalogIdFromSourcesJson,
    type AcquisitionDef
} from "./acquisitionFromSources";

import { deriveDropDataAcquisitionByCatalogId, MANUAL_ACQUISITION_BY_CATALOG_ID } from "./acquisitionFromDropData";
import { deriveRelicMissionRewardsAcquisitionByCatalogId } from "./acquisitionFromMissionRewardsRelics";
import { deriveRelicsJsonAcquisitionByCatalogId } from "./acquisitionFromRelicsJson";

import { getItemRequirements } from "./itemRequirements";

/**
 * Central acquisition accessor.
 *
 * Rules:
 * - WFCD acquisition is used when present.
 * - warframe-drop-data/raw ingestion is an augment layer.
 * - missionRewards relic indexing is an augment layer.
 * - relics.json is an augment layer (covers vaulted / non-missionRewards relics).
 * - When multiple exist: union the sources.
 *
 * Strict fallback (non-guess):
 * - If item has any recipe requirements: Crafting (Foundry)
 *   (EXCEPT ingredient-like items; those should not become "crafting acquisition" just because a resource blueprint exists)
 * - Else if buildPrice:number => Crafting (Foundry)
 * - Else if marketCost:number => Market purchase (Credits)
 */

const WFCD_ACQ: Record<string, AcquisitionDef> = deriveAcquisitionByCatalogIdFromSourcesJson();
const DROP_DATA_ACQ: Record<string, AcquisitionDef> = deriveDropDataAcquisitionByCatalogId();
const MISSION_RELIC_ACQ: Record<string, AcquisitionDef> = deriveRelicMissionRewardsAcquisitionByCatalogId();
const RELICS_JSON_ACQ: Record<string, AcquisitionDef> = deriveRelicsJsonAcquisitionByCatalogId();

function unionSources(...lists: Array<string[] | undefined>): string[] {
    const set = new Set<string>();

    for (const list of lists) {
        for (const x of list ?? []) {
            if (typeof x === "string" && x.trim()) set.add(x.trim());
        }
    }

    return Array.from(set.values()).sort((x, y) => x.localeCompare(y));
}

function isFiniteNumber(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v);
}

/**
 * Ingredient-like heuristic:
 * If it's a Lotus "Items" path (resources, misc drops, etc.), we treat it as an ingredient.
 * These should NOT be forced to "data:crafting" via recipe-exists fallback.
 */
function isIngredientLike(catalogId: CatalogId): boolean {
    const rec = FULL_CATALOG.recordsById[catalogId];
    const path = String(rec?.path ?? "");

    if (path.startsWith("/Lotus/Types/Items/")) return true;

    const rawType = typeof (rec as any)?.raw?.type === "string" ? String((rec as any).raw.type).toLowerCase() : "";
    if (rawType === "resource") return true;

    return false;
}

/**
 * Blueprint-like heuristic:
 * Blueprints are allowed to remain unmapped for now; do not force them into "data:crafting" via recipe fallback.
 */
function isBlueprintLike(catalogId: CatalogId): boolean {
    const rec = FULL_CATALOG.recordsById[catalogId];
    const path = String(rec?.path ?? "");

    if (path.startsWith("/Lotus/Types/Recipes/")) return true;

    const name = String(rec?.displayName ?? "");
    if (name.toLowerCase().endsWith(" blueprint")) return true;

    return false;
}

function hasRecipe(catalogId: CatalogId): boolean {
    const reqs = getItemRequirements(catalogId);
    return Array.isArray(reqs) && reqs.length > 0;
}

function deriveStrictFallbackSources(catalogId: CatalogId): string[] {
    const out: string[] = [];

    // 1) Recipe implies Foundry crafting (but DO NOT apply to ingredient-like or blueprint-like items)
    if (!isIngredientLike(catalogId) && !isBlueprintLike(catalogId) && hasRecipe(catalogId)) {
        out.push("data:crafting");
        return out;
    }

    const rec = FULL_CATALOG.recordsById[catalogId];
    const raw = rec?.raw as any;

    // Our merged items record keeps rawWfcd/rawLotus.
    const wfcd = raw?.rawWfcd ?? null;
    const lotus = raw?.rawLotus ?? null;

    const buildPrice =
        wfcd?.buildPrice ??
        lotus?.buildPrice ??
        null;

    const marketCost =
        wfcd?.marketCost ??
        lotus?.marketCost ??
        null;

    if (isFiniteNumber(buildPrice) && buildPrice > 0) {
        out.push("data:crafting");
    }

    // IMPORTANT:
    // We treat marketCost as a “Market for Credits” signal. (If later you split plat vs credits,
    // you can refine this, but today we need a stable actionable default.)
    if (isFiniteNumber(marketCost) && marketCost > 0) {
        out.push("data:market/credits");
    }

    return out;
}

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    const key = String(catalogId);

    const wfcd = WFCD_ACQ[key];
    const dd = DROP_DATA_ACQ[key];
    const mr = MISSION_RELIC_ACQ[key];
    const rj = RELICS_JSON_ACQ[key];

    const manual = MANUAL_ACQUISITION_BY_CATALOG_ID[key];
    const sources = unionSources(wfcd?.sources, dd?.sources, mr?.sources, rj?.sources, manual?.sources);

    // Strict fallback only if no sources exist so far.
    if (sources.length === 0) {
        const fallback = deriveStrictFallbackSources(catalogId);
        if (fallback.length === 0) return null;
        return { sources: fallback };
    }

    return { sources };
}

