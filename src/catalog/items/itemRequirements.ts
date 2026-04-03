// ===== FILE: src/catalog/items/itemRequirements.ts =====
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

import wfcdReqJson from "../../data/_generated/wfcd-requirements.byCatalogId.auto.json";
import { getWikiBlueprintRequirements } from "./wikiBlueprintRequirements";

export type ItemRequirement = {
    catalogId: CatalogId;
    count: number;
};

export type ItemRequirementEdgeProvenance =
    | "wfcd"
    | "lotus-recipe"
    | "wiki-blueprint"
    | "wfcd-output-blueprint"
    | "derived-output-blueprint";

export type ItemRequirementTerminalReason =
    | "market"
    | "vendor"
    | "unresolved"
    | "no-recipe-required";

export type ItemRequirementEdge = ItemRequirement & {
    provenance: ItemRequirementEdgeProvenance;
};

export type ItemRequirementResolution = {
    outputCatalogId: CatalogId;
    edges: ItemRequirementEdge[];
    terminalReason: ItemRequirementTerminalReason | null;
};

function parseMap(raw: unknown): Record<string, any> {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return raw as Record<string, any>;
}

function safeCount(v: unknown): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
}

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function isRecipeLike(rec: any): boolean {
    const parent = safeString(rec?.parent) ?? "";
    if (parent === "/Lotus/Types/Game/RecipeItem") return true;

    const path = safeString(rec?.path) ?? "";
    if (path.toLowerCase().startsWith("/lotus/types/recipes/")) return true;

    const pc = safeString(rec?.data?.ProductCategory);
    if (pc === "Recipes") return true;

    return false;
}

function getResultItemTypePath(rec: any): string | null {
    // Different inputs use different keys.
    const a = safeString(rec?.data?.resultItemType);
    if (a) return a;

    const b = safeString(rec?.data?.ResultItem);
    if (b) return b;

    return null;
}

/**
 * Some merged wfcd records do not carry a path; the CatalogId already does.
 * CatalogId format is "items:/Lotus/....".
 */
function catalogIdToLotusPath(catalogId: CatalogId): string | null {
    const s = String(catalogId);
    if (!s.startsWith("items:/Lotus/")) return null;
    return s.slice("items:".length);
}

function toItemsCatalogId(path: string): CatalogId {
    return `items:${path}` as CatalogId;
}

/**
 * Canonicalize certain "component" ids coming from wfcd requirements.
 *
 * Problem:
 * - wfcd requirements sometimes reference reusable resource blueprint recipe items
 *   like "/Lotus/Types/Recipes/Components/GalliumResourceBlueprint".
 *
 * Fix:
 * - If a component is a recipe item and it produces a "/Lotus/Types/Items/..." resource,
 *   rewrite the requirement component to that produced item instead.
 *
 * This is NOT guessing. It is following the recipe's own declared output.
 */
function canonicalizeComponentCatalogId(cid: CatalogId): CatalogId {
    if (!String(cid).startsWith("items:")) return cid;

    const rec = FULL_CATALOG.recordsById[cid];
    if (!rec) return cid;

    const raw: any = rec.raw as any;
    // Our merged record shape:
    // raw.rawLotus is most likely to contain recipe metadata.
    const lotus = raw?.rawLotus ?? null;
    const wfcd = raw?.rawWfcd ?? null;
    const merged = lotus ?? wfcd ?? raw ?? null;

    if (!merged || !isRecipeLike(merged)) return cid;

    const resultPath = getResultItemTypePath(merged);
    if (!resultPath) return cid;

    // Only rewrite to real item paths (resources, etc.)
    if (!resultPath.startsWith("/Lotus/Types/Items/")) return cid;

    const outCid = toItemsCatalogId(resultPath);
    if (!FULL_CATALOG.recordsById[outCid]) return cid;

    return outCid;
}

/**
 * Treat a recipe record as "blueprint-ish" only if it looks like an actual foundry/research blueprint,
 * not a bogus/derived "resource blueprint" or garbage edge that causes Control Module-style false recipes.
 *
 * Deterministic rule (no guessing):
 * - the record must be a RecipeItem AND
 * - the catalog displayName OR uniqueName-ish path strongly indicates Blueprint.
 */
function isBlueprintishRecipeCatalogId(recipeCatalogId: CatalogId): boolean {
    const rec: any = FULL_CATALOG.recordsById[recipeCatalogId] ?? null;
    const name = String(rec?.displayName ?? rec?.name ?? "").toLowerCase();
    const cid = String(recipeCatalogId).toLowerCase();

    if (name.includes("blueprint")) return true;
    if (cid.includes("blueprint")) return true;

    return false;
}

/**
 * If wfcd-requirements has no entry keyed by the *output item* itself (common for weapons/frames),
 * resolve via a RecipeItem that produces that output:
 *   recipe.data.resultItemType == "/Lotus/Types/Weapons/...."
 *
 * Fail-closed:
 * - If 0 recipes found, return null.
 * - If >1 recipes found, return null (ambiguity).
 * - If the recipe exists but has no wfcd-requirements entry, return null.
 */
function resolveRecipeRequirementsKeyForOutput(outputCatalogId: CatalogId, reqMap: Record<string, any>): CatalogId | null {
    const outPath = catalogIdToLotusPath(outputCatalogId);
    if (!outPath) return null;

    const candidates: CatalogId[] = [];

    for (const cid of FULL_CATALOG.displayableInventoryItemIds ?? []) {
        const s = String(cid);
        if (!s.startsWith("items:/Lotus/Types/Recipes/")) continue;

        const rec = FULL_CATALOG.recordsById[cid];
        if (!rec) continue;

        const raw: any = rec.raw as any;
        const lotus = raw?.rawLotus ?? null;
        const wfcd = raw?.rawWfcd ?? null;
        const merged = lotus ?? wfcd ?? raw ?? null;

        if (!merged || !isRecipeLike(merged)) continue;

        const resultPath = getResultItemTypePath(merged);
        if (!resultPath) continue;

        if (resultPath === outPath) {
            // Only accept if wfcd-requirements actually has this recipe key.
            if (reqMap[String(cid)]) {
                candidates.push(cid);
            }
        }
    }

    if (candidates.length !== 1) return null;
    return candidates[0];
}

/* =========================================================================================
 * Lotus recipe fallback (WFCD gaps)
 * ========================================================================================= */

type LotusIngredientRow = {
    itemType: string;
    count: number;
};

function safeLotusPathToItemsCatalogId(path: string): CatalogId | null {
    const p = safeString(path);
    if (!p) return null;
    if (!p.startsWith("/Lotus/")) return null;

    const cid = toItemsCatalogId(p);
    // Fail-closed: only accept if it exists in FULL_CATALOG
    if (!FULL_CATALOG.recordsById[cid]) return null;

    return cid;
}

function extractLotusIngredientsFromMergedRecipe(merged: any): LotusIngredientRow[] {
    const data = merged?.data ?? merged ?? null;
    if (!data || typeof data !== "object") return [];

    // Warframe item schemas vary; try several known-ish containers deterministically.
    const candidates = [
        (data as any).Ingredients,
        (data as any).ingredients,
        (data as any).mIngredients,
        (data as any).Recipe,
        (data as any).recipe
    ];

    let arr: any[] = [];
    for (const c of candidates) {
        if (Array.isArray(c)) {
            arr = c;
            break;
        }
        // Some schemas wrap the list under .ingredients/.Ingredients
        if (c && typeof c === "object") {
            const innerA = (c as any).Ingredients;
            const innerB = (c as any).ingredients;
            if (Array.isArray(innerA)) {
                arr = innerA;
                break;
            }
            if (Array.isArray(innerB)) {
                arr = innerB;
                break;
            }
        }
    }

    if (!Array.isArray(arr) || arr.length === 0) return [];

    const out: LotusIngredientRow[] = [];

    for (const row of arr) {
        if (!row || typeof row !== "object") continue;

        const itemType =
            safeString((row as any).ItemType) ??
            safeString((row as any).itemType) ??
            safeString((row as any).type) ??
            safeString((row as any).Type) ??
            null;

        const cnt =
            safeCount((row as any).ItemCount) ||
            safeCount((row as any).itemCount) ||
            safeCount((row as any).Count) ||
            safeCount((row as any).count) ||
            0;

        if (!itemType) continue;
        if (cnt <= 0) continue;

        out.push({ itemType, count: cnt });
    }

    return out;
}

function getMergedRecordForCatalogId(catalogId: CatalogId): any | null {
    const rec = FULL_CATALOG.recordsById[catalogId];
    if (!rec) return null;

    const raw: any = rec.raw as any;
    const lotus = raw?.rawLotus ?? null;
    const wfcd = raw?.rawWfcd ?? null;

    // Prefer lotus for recipe ingredient fields when present.
    return lotus ?? wfcd ?? raw ?? null;
}

function isDirectMarketPurchasableOutput(catalogId: CatalogId): boolean {
    const rec = FULL_CATALOG.recordsById[catalogId];
    if (!rec) return false;

    const raw: any = rec.raw as any;
    const data =
        raw?.rawLotus?.data
        ?? raw?.data
        ?? null;

    if (!data || typeof data !== "object") return false;

    const regularPrice = Number((data as any).RegularPrice ?? 0);
    const premiumPrice = Number((data as any).PremiumPrice ?? 0);
    return (Number.isFinite(regularPrice) && regularPrice > 0) || (Number.isFinite(premiumPrice) && premiumPrice > 0);
}

/**
 * Find the unique "blueprint-ish" RecipeItem CatalogId that produces the given output lotus path.
 * Fail-closed: if 0 or >1 candidates, return null.
 *
 * This is the key guard that prevents false "recipes" from creating Control Module ingredients.
 */
function findUniqueBlueprintRecipeCatalogIdProducingOutput(outputCatalogId: CatalogId): CatalogId | null {
    const outPath = catalogIdToLotusPath(outputCatalogId);
    if (!outPath) return null;

    const candidates: CatalogId[] = [];

    for (const cid of FULL_CATALOG.displayableInventoryItemIds ?? []) {
        const s = String(cid);
        if (!s.startsWith("items:/Lotus/Types/Recipes/")) continue;

        if (!isBlueprintishRecipeCatalogId(cid)) continue;

        const merged = getMergedRecordForCatalogId(cid);
        if (!merged || !isRecipeLike(merged)) continue;

        const resultPath = getResultItemTypePath(merged);
        if (!resultPath) continue;

        if (resultPath === outPath) {
            candidates.push(cid);
        }
    }

    if (candidates.length !== 1) return null;
    return candidates[0];
}

/**
 * WFCD can sometimes present a crafted item as having:
 *   [Blueprint] + [Blueprint ingredients]
 * directly on the output item.
 *
 * This creates the exact double-counting you saw (Ack & Brunt, etc).
 *
 * Fix (deterministic):
 * - If the WFCD component list contains a *single* recipe-like component that produces the output item,
 *   then the output item's requirements are ONLY that blueprint component (and its count),
 *   and all other WFCD material requirements are ignored at this layer.
 *
 * The blueprint (recipe item) is responsible for its own ingredient list.
 */
function extractBlueprintComponentOnlyForOutput(outputCatalogId: CatalogId, def: any): ItemRequirement[] | null {
    const outPath = catalogIdToLotusPath(outputCatalogId);
    if (!outPath) return null;

    const comps = Array.isArray(def?.components) ? def.components : [];
    if (comps.length === 0) return null;

    const blueprintCandidates: Array<{ cid: CatalogId; count: number }> = [];

    for (const c of comps) {
        const cidRaw = typeof c?.catalogId === "string" ? c.catalogId : "";
        const cnt = safeCount(c?.count ?? 0);

        if (!cidRaw.startsWith("items:")) continue;
        if (cnt <= 0) continue;

        const cid = cidRaw as CatalogId;
        const merged = getMergedRecordForCatalogId(cid);
        if (!merged || !isRecipeLike(merged)) continue;

        const resultPath = getResultItemTypePath(merged);
        if (!resultPath) continue;

        // Must be a blueprint-ish recipe and must produce this output.
        if (resultPath !== outPath) continue;
        if (!isBlueprintishRecipeCatalogId(cid)) continue;

        blueprintCandidates.push({ cid, count: cnt });
    }

    if (blueprintCandidates.length !== 1) return null;

    return [
        {
            catalogId: blueprintCandidates[0].cid,
            count: blueprintCandidates[0].count
        }
    ];
}

function normalizeAndFilterSelfEdges(outputCatalogId: CatalogId, reqs: ItemRequirement[]): ItemRequirement[] {
    const out: ItemRequirement[] = [];

    for (const r of reqs) {
        if (!r) continue;

        const cid = r.catalogId;
        const cnt = safeCount(r.count);

        if (!String(cid).startsWith("items:")) continue;
        if (cnt <= 0) continue;

        // Kill self-recursive edges (e.g., Forma -> Forma).
        if (String(cid) === String(outputCatalogId)) continue;

        out.push({ catalogId: cid, count: cnt });
    }

    return out;
}

function getLotusRecipeRequirementsForRecipeItem(recipeCatalogId: CatalogId): ItemRequirement[] {
    const merged = getMergedRecordForCatalogId(recipeCatalogId);
    if (!merged || !isRecipeLike(merged)) return [];

    const ingredients = extractLotusIngredientsFromMergedRecipe(merged);
    if (ingredients.length === 0) return [];

    const out: ItemRequirement[] = [];

    for (const ing of ingredients) {
        const cid = safeLotusPathToItemsCatalogId(ing.itemType);
        if (!cid) continue;

        const canon = canonicalizeComponentCatalogId(cid);

        out.push({
            catalogId: canon,
            count: ing.count
        });
    }

    return out;
}

function getWikiRecipeRequirements(recipeCatalogId: CatalogId): ItemRequirement[] {
    return getWikiBlueprintRequirements(recipeCatalogId);
}

function getWikiRequirementsForOutputItem(outputCatalogId: CatalogId): ItemRequirement[] {
    return getWikiBlueprintRequirements(outputCatalogId);
}

function toRequirementEdges(
    outputCatalogId: CatalogId,
    reqs: ItemRequirement[],
    provenance: ItemRequirementEdgeProvenance,
): ItemRequirementEdge[] {
    return normalizeAndFilterSelfEdges(outputCatalogId, reqs).map((req) => ({
        ...req,
        provenance
    }));
}

function recipeItemHasMeaningfulRequirements(recipeCatalogId: CatalogId, reqMap: Record<string, any>): boolean {
    const def = reqMap[String(recipeCatalogId)];
    if (def && typeof def === "object") {
        const comps = Array.isArray((def as any).components) ? (def as any).components : [];
        if (comps.some((c: any) => typeof c?.catalogId === "string" && safeCount(c?.count ?? 0) > 0)) {
            return true;
        }
    }

    if (getLotusRecipeRequirementsForRecipeItem(recipeCatalogId).length > 0) return true;
    if (getWikiRecipeRequirements(recipeCatalogId).length > 0) return true;

    return false;
}

export function getCraftingBlueprintCatalogIdForOutput(outputCatalogId: CatalogId): CatalogId | null {
    const reqMap = parseMap(wfcdReqJson);
    const candidates = new Set<CatalogId>();

    const siblingBlueprint = `${String(outputCatalogId)}Blueprint` as CatalogId;
    if (FULL_CATALOG.recordsById[siblingBlueprint]) {
        candidates.add(siblingBlueprint);
    }

    const uniqueBlueprint = findUniqueBlueprintRecipeCatalogIdProducingOutput(outputCatalogId);
    if (uniqueBlueprint) {
        candidates.add(uniqueBlueprint);
    }

    for (const candidate of candidates) {
        if (recipeItemHasMeaningfulRequirements(candidate, reqMap)) {
            return candidate;
        }
    }

    return null;
}

function getCraftingBlueprintEdgeForOutput(outputCatalogId: CatalogId): ItemRequirementEdge | null {
    const raw = parseMap(wfcdReqJson);
    const siblingBlueprint = `${String(outputCatalogId)}Blueprint` as CatalogId;
    if (FULL_CATALOG.recordsById[siblingBlueprint] && recipeItemHasMeaningfulRequirements(siblingBlueprint, raw)) {
        return {
            catalogId: siblingBlueprint,
            count: 1,
            provenance: "derived-output-blueprint"
        };
    }

    const uniqueBlueprint = findUniqueBlueprintRecipeCatalogIdProducingOutput(outputCatalogId);
    if (uniqueBlueprint && recipeItemHasMeaningfulRequirements(uniqueBlueprint, raw)) {
        return {
            catalogId: uniqueBlueprint,
            count: 1,
            provenance: "derived-output-blueprint"
        };
    }

    return null;
}

function getLotusRecipeRequirementsForOutputItem(outputCatalogId: CatalogId): ItemRequirement[] {
    const recipeCid = getCraftingBlueprintCatalogIdForOutput(outputCatalogId);
    if (!recipeCid) return [];

    // IMPORTANT SEMANTICS:
    // Output item requires ONLY its blueprint/recipe item.
    // The blueprint expands to its ingredients.
    return [
        {
            catalogId: recipeCid,
            count: 1
        }
    ];
}

export function resolveItemRequirementGraph(outputCatalogId: CatalogId): ItemRequirementResolution {
    const raw = parseMap(wfcdReqJson);

    const mergedOutput = getMergedRecordForCatalogId(outputCatalogId);
    const outputIsRecipe = Boolean(mergedOutput && isRecipeLike(mergedOutput));
    const directMarketPurchasable = isDirectMarketPurchasableOutput(outputCatalogId);
    const craftingBlueprintCatalogId = getCraftingBlueprintCatalogIdForOutput(outputCatalogId);
    const craftingBlueprintEdge = getCraftingBlueprintEdgeForOutput(outputCatalogId);

    // =========================
    // Case 1: Output is itself a recipe item (Blueprint, component recipe, etc.)
    // =========================
    if (outputIsRecipe) {
        // Prefer WFCD requirements if keyed by this recipe id.
        const def = raw[String(outputCatalogId)];
        if (def && typeof def === "object") {
            const comps = Array.isArray((def as any).components) ? (def as any).components : [];
            const out: ItemRequirement[] = [];

            for (const c of comps) {
                const cidRaw = typeof c?.catalogId === "string" ? c.catalogId : "";
                const cnt = safeCount(c?.count ?? 0);

                if (!cidRaw.startsWith("items:")) continue;
                if (cnt <= 0) continue;

                const cid = canonicalizeComponentCatalogId(cidRaw as CatalogId);

                out.push({
                    catalogId: cid,
                    count: cnt
                });
            }

            return {
                outputCatalogId,
                edges: toRequirementEdges(outputCatalogId, out, "wfcd"),
                terminalReason: null
            };
        }

        // Otherwise, lotus fallback for the recipe item itself.
        const lotusFallback = getLotusRecipeRequirementsForRecipeItem(outputCatalogId);
        if (lotusFallback.length > 0) {
            return {
                outputCatalogId,
                edges: toRequirementEdges(outputCatalogId, lotusFallback, "lotus-recipe"),
                terminalReason: null
            };
        }

        const wikiFallback = getWikiRecipeRequirements(outputCatalogId);
        if (wikiFallback.length > 0) {
            return {
                outputCatalogId,
                edges: toRequirementEdges(outputCatalogId, wikiFallback, "wiki-blueprint"),
                terminalReason: null
            };
        }

        return {
            outputCatalogId,
            edges: [],
            terminalReason: "unresolved"
        };
    }

    // =========================
    // Case 2: Output is a non-recipe item (weapon, resource, etc.)
    // =========================

    if (directMarketPurchasable && !craftingBlueprintCatalogId) {
        return {
            outputCatalogId,
            edges: [],
            terminalReason: "market"
        };
    }

    // Primary: WFCD requirements keyed by the output item itself.
    let def = raw[String(outputCatalogId)];

    // Fallback (WFCD): requirements keyed by a recipe that produces the output item.
    if (!def || typeof def !== "object") {
        const recipeKey = resolveRecipeRequirementsKeyForOutput(outputCatalogId, raw);
        if (recipeKey) {
            def = raw[String(recipeKey)];
        }
    }

    // If WFCD yielded a definition, enforce blueprint semantics if the WFCD def includes the blueprint.
    if (def && typeof def === "object") {
        const blueprintOnly = extractBlueprintComponentOnlyForOutput(outputCatalogId, def);
        if (blueprintOnly) {
            return {
                outputCatalogId,
                edges: toRequirementEdges(outputCatalogId, blueprintOnly, "wfcd-output-blueprint"),
                terminalReason: null
            };
        }

        // Otherwise, accept the WFCD component list (but still fail-closed on self-edges).
        const comps = Array.isArray((def as any).components) ? (def as any).components : [];
        const out: ItemRequirement[] = [];

        for (const c of comps) {
            const cidRaw = typeof c?.catalogId === "string" ? c.catalogId : "";
            const cnt = safeCount(c?.count ?? 0);

            if (!cidRaw.startsWith("items:")) continue;
            if (cnt <= 0) continue;

            const cid = canonicalizeComponentCatalogId(cidRaw as CatalogId);

            out.push({
                catalogId: cid,
                count: cnt
            });
        }

        return {
            outputCatalogId,
            edges: toRequirementEdges(outputCatalogId, out, "wfcd"),
            terminalReason: null
        };
    }

    // Final fallback order:
    // 1) lotus-derived blueprint/output recipe structure
    // 2) wiki blueprint data
    // If neither exists, the item is treated as terminal here.
    if (craftingBlueprintEdge) {
        return {
            outputCatalogId,
            edges: [craftingBlueprintEdge],
            terminalReason: null
        };
    }

    const lotusOutputFallback = getLotusRecipeRequirementsForOutputItem(outputCatalogId);
    if (lotusOutputFallback.length > 0) {
        return {
            outputCatalogId,
            edges: toRequirementEdges(outputCatalogId, lotusOutputFallback, "derived-output-blueprint"),
            terminalReason: null
        };
    }

    const wikiOutputFallback = getWikiRequirementsForOutputItem(outputCatalogId);
    if (wikiOutputFallback.length > 0) {
        return {
            outputCatalogId,
            edges: toRequirementEdges(outputCatalogId, wikiOutputFallback, "wiki-blueprint"),
            terminalReason: null
        };
    }

    return {
        outputCatalogId,
        edges: [],
        terminalReason: "unresolved"
    };
}

export function getItemRequirements(outputCatalogId: CatalogId): ItemRequirement[] {
    return resolveItemRequirementGraph(outputCatalogId).edges.map(({ catalogId, count }) => ({
        catalogId,
        count
    }));
}
