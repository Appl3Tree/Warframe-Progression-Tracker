// ===== FILE: src/catalog/items/itemRequirements.ts =====
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

import wfcdReqJson from "../../data/_generated/wfcd-requirements.byCatalogId.auto.json";

export type ItemRequirement = {
    catalogId: CatalogId;
    count: number;
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
 * If wfcd-requirements has no entry keyed by the *output item* itself (common for weapons),
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

export function getItemRequirements(outputCatalogId: CatalogId): ItemRequirement[] {
    const raw = parseMap(wfcdReqJson);

    // Primary: requirements keyed by the output item itself.
    let def = raw[String(outputCatalogId)];

    // Fallback: requirements keyed by a recipe that produces the output item.
    if (!def || typeof def !== "object") {
        const recipeKey = resolveRecipeRequirementsKeyForOutput(outputCatalogId, raw);
        if (recipeKey) {
            def = raw[String(recipeKey)];
        }
    }

    if (!def || typeof def !== "object") return [];

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

    return out;
}

