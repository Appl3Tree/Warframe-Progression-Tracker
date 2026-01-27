// ===== FILE: src/catalog/items/itemAcquisition.ts =====

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

import {
    deriveAcquisitionByCatalogIdFromSourcesJson,
    type AcquisitionDef
} from "./acquisitionFromSources";

import { MANUAL_ACQUISITION_BY_CATALOG_ID } from "./manualAcquisitionByCatalogId";
import { deriveDropDataAcquisitionByCatalogId } from "./acquisitionFromDropData";
import { deriveRelicMissionRewardsAcquisitionByCatalogId } from "./acquisitionFromMissionRewardsRelics";
import { deriveRelicsJsonAcquisitionByCatalogId } from "./acquisitionFromRelicsJson";
import { deriveWarframeItemsAcquisitionByCatalogId } from "./acquisitionFromWarframeItems";
import { deriveItemsJsonMarketAcquisitionByCatalogId } from "./acquisitionFromItemsJsonMarket";
import { deriveRecipeBucketAcquisitionByCatalogId } from "./acquisitionFromRecipeBuckets";

import ITEMS_JSON from "../../data/items.json";

const BLUEPRINT_UNCLASSIFIED = "data:blueprint/unclassified";
const SOURCE_CRAFTING = "data:crafting";

const WFCD_ACQ: Record<string, AcquisitionDef> = deriveAcquisitionByCatalogIdFromSourcesJson();
const DROP_DATA_ACQ: Record<string, AcquisitionDef> = deriveDropDataAcquisitionByCatalogId();
const MISSION_RELIC_ACQ: Record<string, AcquisitionDef> = deriveRelicMissionRewardsAcquisitionByCatalogId();
const RELICS_JSON_ACQ: Record<string, AcquisitionDef> = deriveRelicsJsonAcquisitionByCatalogId();
const WARFRAME_ITEMS_ACQ: Record<string, AcquisitionDef> = deriveWarframeItemsAcquisitionByCatalogId();
const ITEMS_JSON_MARKET_ACQ: Record<string, AcquisitionDef> = deriveItemsJsonMarketAcquisitionByCatalogId();
const RECIPE_BUCKET_ACQ: Record<string, AcquisitionDef> = deriveRecipeBucketAcquisitionByCatalogId();

function unionSources(...lists: Array<string[] | undefined>): string[] {
    const set = new Set<string>();

    for (const list of lists) {
        for (const x of list ?? []) {
            if (typeof x !== "string") continue;
            const s = x.trim();
            if (!s) continue;
            set.add(s);
        }
    }

    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function toItemsCatalogIdFromLotusPath(lotusPath: string): CatalogId | null {
    const p = safeString(lotusPath);
    if (!p) return null;
    if (!p.startsWith("/Lotus/")) return null;
    return `items:${p}` as CatalogId;
}

function extractDisplayRecipePath(obj: any): string | null {
    if (!obj || typeof obj !== "object") return null;

    const a = safeString(obj?.data?.DisplayRecipe);
    if (a) return a;

    const b = safeString(obj?.DisplayRecipe);
    if (b) return b;

    return null;
}

/**
 * items.json fallback:
 * FULL_CATALOG may not retain items.json fields in record.raw for some records.
 * Vinquibus part outputs are one confirmed case.
 */
function getDisplayRecipeCatalogIdFromItemsJson(outputCatalogId: CatalogId): CatalogId | null {
    const k = String(outputCatalogId);
    if (!k.startsWith("items:/Lotus/")) return null;

    const lotusPath = k.replace(/^items:/, ""); // "/Lotus/..."
    const root: any = ITEMS_JSON as any;

    const rec = root?.[lotusPath];
    if (!rec || typeof rec !== "object") return null;

    const p = extractDisplayRecipePath(rec);
    if (!p) return null;

    const cid = toItemsCatalogIdFromLotusPath(p);
    if (!cid) return null;

    if ((FULL_CATALOG as any).recordsById?.[String(cid)]) return cid;

    return null;
}

/**
 * Deterministic recipe-output augmentation:
 * If an item declares a DisplayRecipe, union the blueprint’s acquisition onto the output.
 */
function getDisplayRecipeCatalogIdForOutput(outputCatalogId: CatalogId): CatalogId | null {
    const fromItemsJson = getDisplayRecipeCatalogIdFromItemsJson(outputCatalogId);
    if (fromItemsJson) return fromItemsJson;

    const rec: any = (FULL_CATALOG as any).recordsById?.[String(outputCatalogId)];
    if (!rec) return null;

    const raw: any = rec.raw as any;

    const candidates: any[] = [
        raw?.rawLotus,
        raw?.rawWfcd,
        raw?.rawItemsJson,
        raw?.rawItemsJSON,
        raw?.rawItems,
        raw?.rawMarket,
        raw?.rawItemsJsonMarket,
        raw
    ].filter(Boolean);

    for (const c of candidates) {
        const p = extractDisplayRecipePath(c);
        if (!p) continue;

        const cid = toItemsCatalogIdFromLotusPath(p);
        if (!cid) continue;

        if ((FULL_CATALOG as any).recordsById?.[String(cid)]) return cid;
    }

    return null;
}

function isRecipePathCatalogId(catalogId: CatalogId): boolean {
    return String(catalogId).includes(":/Lotus/Types/Recipes/");
}

function isBlueprintLikeCatalogItem(catalogId: CatalogId): boolean {
    const cidStr = String(catalogId);

    if (cidStr.includes(":/Lotus/Types/Recipes/")) return true;

    const rec: any = (FULL_CATALOG as any).recordsById?.[cidStr];
    const name = safeString(rec?.displayName) ?? safeString(rec?.name) ?? "";
    const path = safeString(rec?.path) ?? "";

    if (name.toLowerCase().endsWith(" blueprint")) return true;
    if (path.toLowerCase().endsWith("blueprint")) return true;

    if (cidStr.toLowerCase().endsWith("blueprint")) return true;

    return false;
}

function stripPlaceholderWhenRedundant(sources: string[]): string[] {
    if (sources.length <= 1) return sources;
    if (!sources.includes(BLUEPRINT_UNCLASSIFIED)) return sources;
    return sources.filter((s) => s !== BLUEPRINT_UNCLASSIFIED);
}

function removeFallbackSources(sources: string[]): string[] {
    // Today we only have one explicit placeholder fallback.
    // Centralizing this now ensures future fallbacks cannot leak into manual mappings.
    return sources.filter((s) => s !== BLUEPRINT_UNCLASSIFIED);
}

/**
 * Deterministic crafted-part inference:
 * If the current CatalogId is a recipe-path *part* (not a blueprint record) AND
 * there exists a sibling "<id>Blueprint" record that has real acquisition sources,
 * then this record is a crafted output of that blueprint => acquire via crafting.
 *
 * This avoids the incorrect blanket rule where invasion-awarded parts get marked as crafted.
 */
function maybeCraftedFromSiblingBlueprint(catalogId: CatalogId, seen: Set<string>): boolean {
    const key = String(catalogId);

    if (!isRecipePathCatalogId(catalogId)) return false;

    // If the id itself already looks like a blueprint record, this is not a crafted output.
    if (key.toLowerCase().endsWith("blueprint")) return false;

    const rec: any = (FULL_CATALOG as any).recordsById?.[key];
    const name = safeString(rec?.displayName) ?? safeString(rec?.name) ?? "";
    if (name.toLowerCase().endsWith(" blueprint")) return false;

    const blueprintKey = `${key}Blueprint`;
    const blueprintCid = blueprintKey as CatalogId;

    // Must exist in catalog to be considered.
    if (!(FULL_CATALOG as any).recordsById?.[blueprintKey]) return false;

    const blueprintAcq = getAcquisitionByCatalogIdInternal(blueprintCid, seen);
    const srcs = blueprintAcq?.sources ?? [];

    // Only accept if the blueprint has a real source (not just placeholder).
    const real = srcs.filter((s) => s !== BLUEPRINT_UNCLASSIFIED);
    return real.length > 0;
}

function gatherDirectSources(catalogId: CatalogId): string[] {
    const key = String(catalogId);

    const wfcd = WFCD_ACQ[key];
    const dd = DROP_DATA_ACQ[key];
    const mr = MISSION_RELIC_ACQ[key];
    const rj = RELICS_JSON_ACQ[key];
    const wi = WARFRAME_ITEMS_ACQ[key];
    const im = ITEMS_JSON_MARKET_ACQ[key];
    const rb = RECIPE_BUCKET_ACQ[key];

    return unionSources(wfcd?.sources, dd?.sources, mr?.sources, rj?.sources, wi?.sources, im?.sources, rb?.sources);
}

function getAcquisitionByCatalogIdInternal(catalogId: CatalogId, seen: Set<string>): AcquisitionDef | null {
    const key = String(catalogId);
    if (seen.has(key)) return null;
    seen.add(key);

    // Manual entries are authoritative and must suppress fallback behaviors.
    const hasManual = (MANUAL_ACQUISITION_BY_CATALOG_ID[key]?.length ?? 0) > 0;

    // 1) Direct union across layers
    let sources = gatherDirectSources(catalogId);

    // 1.1) Manual precedence rule:
    // If a manual mapping exists for this catalogId, then no placeholder/fallback sources
    // are allowed to appear in the final sources list, even if other layers contribute them.
    if (hasManual) {
        sources = removeFallbackSources(sources);
    }

    // 2) If any real sources exist, drop placeholder
    // (This still applies even when hasManual=false, and remains safe when hasManual=true)
    sources = stripPlaceholderWhenRedundant(sources);

    // 3) If this is a crafted output of a sibling blueprint with real acquisition, mark as crafting.
    // Only applies when there are no sources AND no manual mapping exists.
    if (!hasManual && sources.length === 0) {
        const crafted = maybeCraftedFromSiblingBlueprint(catalogId, seen);
        if (crafted) {
            sources = [SOURCE_CRAFTING];
        }
    }

    // 4) DisplayRecipe inheritance: output -> blueprint
    const recipeCid = getDisplayRecipeCatalogIdForOutput(catalogId);
    if (recipeCid) {
        const recipeAcq = getAcquisitionByCatalogIdInternal(recipeCid, seen);
        if (recipeAcq?.sources?.length) {
            sources = unionSources(
                sources.filter((s) => s !== BLUEPRINT_UNCLASSIFIED),
                recipeAcq.sources
            );
        }
    }

    // 4.1) Manual precedence rule (again):
    // DisplayRecipe inheritance can reintroduce fallback placeholders from the blueprint.
    // If manual exists for the output, suppress fallback after inheritance too.
    if (hasManual) {
        sources = removeFallbackSources(sources);
    }

    // 5) Final placeholder cleanup
    sources = stripPlaceholderWhenRedundant(sources);

    // 6) Blueprint-like fallback:
    // If we still have no sources, do NOT hide it as unknown. Keep it actionable with a known placeholder.
    // Do not apply this fallback when a manual mapping exists.
    if (!hasManual && sources.length === 0 && isBlueprintLikeCatalogItem(catalogId)) {
        sources = [BLUEPRINT_UNCLASSIFIED];
    }

    if (sources.length === 0) return null;
    return { sources };
}

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    return getAcquisitionByCatalogIdInternal(catalogId, new Set<string>());
}

