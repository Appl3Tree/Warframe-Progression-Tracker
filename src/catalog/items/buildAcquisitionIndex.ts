// ===== FILE: src/catalog/items/buildAcquisitionIndex.ts =====

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import { deriveAcquisitionByCatalogIdFromSourcesJson, type AcquisitionDef } from "./acquisitionFromSources";
import { MANUAL_ACQUISITION_BY_CATALOG_ID } from "./manualAcquisitionByCatalogId";
import { deriveDropDataAcquisitionByCatalogId } from "./acquisitionFromDropData";
import { deriveRelicMissionRewardsAcquisitionByCatalogId } from "./acquisitionFromMissionRewardsRelics";
import { deriveRelicsJsonAcquisitionByCatalogId } from "./acquisitionFromRelicsJson";
import { deriveWarframeItemsAcquisitionByCatalogId } from "./acquisitionFromWarframeItems";
import { deriveItemsJsonMarketAcquisitionByCatalogId } from "./acquisitionFromItemsJsonMarket";
import { deriveRecipeBucketAcquisitionByCatalogId } from "./acquisitionFromRecipeBuckets";
import { deriveClanTechAcquisitionByCatalogId } from "./acquisitionFromClanTech";
import { deriveComponentCraftabilityAcquisitionByCatalogId } from "./acquisitionFromComponentCraftability";
import { deriveFishingBaitAcquisitionByCatalogId } from "./acquisitionFromFishingBaits";
import { deriveFishingTrophyAcquisitionByCatalogId } from "./acquisitionFromFishingTrophies";
import { deriveOverframeResearchAcquisitionByCatalogId } from "./acquisitionFromOverframeResearch";
import { deriveRestorativeBlueprintAcquisitionByCatalogId } from "./acquisitionFromRestorativeBlueprints";
import { deriveSolarisOperatorArmorAcquisitionByCatalogId } from "./acquisitionFromSolarisOperatorArmor";
import { deriveWeaponSkinBlueprintAcquisitionByCatalogId } from "./acquisitionFromWeaponSkinBlueprints";
import { deriveWeaponPartBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromWeaponPartBlueprintFamilies";
import { deriveDeimosPetBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromDeimosPetBlueprintFamilies";
import { deriveNecraloidBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromNecraloidBlueprintFamilies";
import { deriveDeimosWeaponBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromDeimosWeaponBlueprintFamilies";
import { deriveDeimosProspectingBlueprintAcquisitionByCatalogId } from "./acquisitionFromDeimosProspectingBlueprints";
import { deriveSolarisRecipeBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromSolarisRecipeBlueprintFamilies";
import { deriveEidolonProspectingBlueprintAcquisitionByCatalogId } from "./acquisitionFromEidolonProspectingBlueprints";
import { deriveDroneAndComponentBlueprintAcquisitionByCatalogId } from "./acquisitionFromDroneAndComponentBlueprints";
import { deriveFishingAndCurativeBlueprintAcquisitionByCatalogId } from "./acquisitionFromFishingAndCurativeBlueprints";
import { deriveHoundBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromHoundBlueprintFamilies";
import { deriveLandingCraftBlueprintAcquisitionByCatalogId } from "./acquisitionFromLandingCraftBlueprints";
import { deriveLandingCraftComponentBlueprintAcquisitionByCatalogId } from "./acquisitionFromLandingCraftComponentBlueprints";
import { deriveMarketCosmeticBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromMarketCosmeticBlueprintFamilies";
import { deriveMoaPetBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromMoaPetBlueprintFamilies";
import { deriveOperatorArmorBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromOperatorArmorBlueprintFamilies";
import { deriveQuestKeyBlueprintAcquisitionByCatalogId } from "./acquisitionFromQuestKeyBlueprints";
import { deriveSynthicatorBlueprintAcquisitionByCatalogId } from "./acquisitionFromSynthicatorBlueprints";
import { deriveWarframeSkinBlueprintFamilyAcquisitionByCatalogId } from "./acquisitionFromWarframeSkinBlueprintFamilies";
import { deriveIncarnonGenesisAcquisitionByCatalogId } from "./acquisitionFromIncarnonGenesis";
import { deriveNightwaveFamilyAcquisitionByCatalogId } from "./acquisitionFromNightwaveFamilies";
import { deriveResourceAndTagFamilyAcquisitionByCatalogId } from "./acquisitionFromResourceAndTagFamilies";
import { deriveRestorativeFamilyAcquisitionByCatalogId } from "./acquisitionFromRestorativeFamilies";
import { deriveModAndArcaneFamilyAcquisitionByCatalogId } from "./acquisitionFromModAndArcaneFamilies";

import { getItemRequirements } from "./itemRequirements";

import ITEMS_JSON from "../../data/_generated/items-lean.auto.json";

const BLUEPRINT_UNCLASSIFIED = "data:blueprint/unclassified";
const SOURCE_CRAFTING = "data:crafting";

const WFCD_ACQ: Record<string, AcquisitionDef> = deriveAcquisitionByCatalogIdFromSourcesJson();
const DROP_DATA_ACQ: Record<string, AcquisitionDef> = deriveDropDataAcquisitionByCatalogId();
const MISSION_RELIC_ACQ: Record<string, AcquisitionDef> = deriveRelicMissionRewardsAcquisitionByCatalogId();
const RELICS_JSON_ACQ: Record<string, AcquisitionDef> = deriveRelicsJsonAcquisitionByCatalogId();
const WARFRAME_ITEMS_ACQ: Record<string, AcquisitionDef> = deriveWarframeItemsAcquisitionByCatalogId();
const ITEMS_JSON_MARKET_ACQ: Record<string, AcquisitionDef> = deriveItemsJsonMarketAcquisitionByCatalogId();
const RECIPE_BUCKET_ACQ: Record<string, AcquisitionDef> = deriveRecipeBucketAcquisitionByCatalogId();
const CLAN_TECH_ACQ: Record<string, AcquisitionDef> = deriveClanTechAcquisitionByCatalogId();
const COMPONENT_CRAFT_ACQ: Record<string, AcquisitionDef> = deriveComponentCraftabilityAcquisitionByCatalogId();
const FISHING_BAIT_ACQ: Record<string, AcquisitionDef> = deriveFishingBaitAcquisitionByCatalogId();
const FISHING_TROPHY_ACQ: Record<string, AcquisitionDef> = deriveFishingTrophyAcquisitionByCatalogId();
const OVERFRAME_RESEARCH_ACQ: Record<string, AcquisitionDef> = deriveOverframeResearchAcquisitionByCatalogId();
const RESTORATIVE_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveRestorativeBlueprintAcquisitionByCatalogId();
const SOLARIS_OPERATOR_ARMOR_ACQ: Record<string, AcquisitionDef> = deriveSolarisOperatorArmorAcquisitionByCatalogId();
const WEAPON_SKIN_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveWeaponSkinBlueprintAcquisitionByCatalogId();
const WEAPON_PART_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveWeaponPartBlueprintFamilyAcquisitionByCatalogId();
const DEIMOS_PET_BLUEPRINT_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveDeimosPetBlueprintFamilyAcquisitionByCatalogId();
const NECRALOID_BLUEPRINT_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveNecraloidBlueprintFamilyAcquisitionByCatalogId();
const DEIMOS_WEAPON_BLUEPRINT_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveDeimosWeaponBlueprintFamilyAcquisitionByCatalogId();
const DEIMOS_PROSPECTING_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveDeimosProspectingBlueprintAcquisitionByCatalogId();
const SOLARIS_RECIPE_BLUEPRINT_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveSolarisRecipeBlueprintFamilyAcquisitionByCatalogId();
const EIDOLON_PROSPECTING_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveEidolonProspectingBlueprintAcquisitionByCatalogId();
const DRONE_AND_COMPONENT_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveDroneAndComponentBlueprintAcquisitionByCatalogId();
const FISHING_AND_CURATIVE_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveFishingAndCurativeBlueprintAcquisitionByCatalogId();
const HOUND_BLUEPRINT_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveHoundBlueprintFamilyAcquisitionByCatalogId();
const LANDING_CRAFT_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveLandingCraftBlueprintAcquisitionByCatalogId();
const LANDING_CRAFT_COMPONENT_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveLandingCraftComponentBlueprintAcquisitionByCatalogId();
const MARKET_COSMETIC_BLUEPRINT_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveMarketCosmeticBlueprintFamilyAcquisitionByCatalogId();
const MOA_PET_BLUEPRINT_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveMoaPetBlueprintFamilyAcquisitionByCatalogId();
const OPERATOR_ARMOR_BLUEPRINT_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveOperatorArmorBlueprintFamilyAcquisitionByCatalogId();
const QUEST_KEY_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveQuestKeyBlueprintAcquisitionByCatalogId();
const SYNTHICATOR_BLUEPRINT_ACQ: Record<string, AcquisitionDef> = deriveSynthicatorBlueprintAcquisitionByCatalogId();
const WARFRAME_SKIN_BLUEPRINT_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveWarframeSkinBlueprintFamilyAcquisitionByCatalogId();
const INCARNON_GENESIS_ACQ: Record<string, AcquisitionDef> = deriveIncarnonGenesisAcquisitionByCatalogId();
const NIGHTWAVE_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveNightwaveFamilyAcquisitionByCatalogId();
const RESOURCE_AND_TAG_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveResourceAndTagFamilyAcquisitionByCatalogId();
const RESTORATIVE_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveRestorativeFamilyAcquisitionByCatalogId();
const MOD_AND_ARCANE_FAMILY_ACQ: Record<string, AcquisitionDef> = deriveModAndArcaneFamilyAcquisitionByCatalogId();

const RECIPE_CATALOG_ID_PREFIX = "items:/Lotus/Types/Recipes/";

function isRecipeCatalogIdString(id: string): boolean {
    return typeof id === "string" && id.startsWith(RECIPE_CATALOG_ID_PREFIX);
}

function stripItemsPrefix(id: string): string {
    return String(id ?? "").replace(/^items:/, "");
}

/**
 * Index recipe ids by their rawLotus parent/parents lotus path.
 * Key shape: "/Lotus/Weapons/..."  ->  [ "items:/Lotus/Types/Recipes/..." ... ]
 *
 * This covers cases where weapon/item records have:
 *  - no blueprintId
 *  - no components
 * but recipes still point back at the output via parent/parents.
 */
const RECIPE_IDS_BY_PARENT_PATH: Record<string, string[]> = (() => {
    const out: Record<string, Set<string>> = Object.create(null);

    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    for (const [id, rec] of Object.entries(recordsById)) {
        if (!isRecipeCatalogIdString(id)) continue;

        const rawLotus: any = rec?.raw?.rawLotus ?? null;
        if (!rawLotus) continue;

        const parent = typeof rawLotus.parent === "string" ? rawLotus.parent : null;
        const parents = Array.isArray(rawLotus.parents) ? rawLotus.parents : [];

        const parentPaths: string[] = [];
        if (parent) parentPaths.push(parent);
        for (const p of parents) {
            if (typeof p === "string" && p.length > 0) parentPaths.push(p);
        }

        for (const p of parentPaths) {
            const key = stripItemsPrefix(p); // normalize to "/Lotus/..."
            if (!key) continue;

            if (!out[key]) out[key] = new Set<string>();
            out[key].add(String(id));
        }
    }

    const finalized: Record<string, string[]> = Object.create(null);
    for (const [k, set] of Object.entries(out)) {
        finalized[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    }
    return finalized;
})();

const RECIPE_IDS_BY_RESULT_PATH: Record<string, string[]> = (() => {
    const out: Record<string, Set<string>> = Object.create(null);

    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    for (const [id, rec] of Object.entries(recordsById)) {
        if (!isRecipeCatalogIdString(id)) continue;

        const rawLotus: any = rec?.raw?.rawLotus ?? rec?.raw ?? null;
        if (!rawLotus || typeof rawLotus !== "object") continue;

        const resultCandidates = [
            safeString(rawLotus?.data?.resultItemType),
            safeString(rawLotus?.data?.ResultItem),
            safeString(rawLotus?.resultItemType),
            safeString(rawLotus?.ResultItem),
        ].filter((value): value is string => typeof value === "string" && value.length > 0);

        for (const rawPath of resultCandidates) {
            const key = stripItemsPrefix(rawPath);
            if (!key || !key.startsWith("/Lotus/")) continue;
            if (!out[key]) out[key] = new Set<string>();
            out[key].add(String(id));
        }
    }

    const finalized: Record<string, string[]> = Object.create(null);
    for (const [k, set] of Object.entries(out)) {
        finalized[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    }
    return finalized;
})();

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

function isWeaponPartRecipePathCatalogId(catalogId: CatalogId): boolean {
    return String(catalogId).startsWith("items:/Lotus/Types/Recipes/Weapons/WeaponParts/");
}

function isExplicitBlueprintLikeByNameOrId(catalogId: CatalogId): boolean {
    const cidStr = String(catalogId);
    const rec: any = (FULL_CATALOG as any).recordsById?.[cidStr];

    const name = safeString(rec?.displayName) ?? safeString(rec?.name) ?? "";
    const path = safeString(rec?.path) ?? "";

    if (name.toLowerCase().endsWith(" blueprint")) return true;
    if (path.toLowerCase().endsWith("blueprint")) return true;
    if (cidStr.toLowerCase().endsWith("blueprint")) return true;

    return false;
}

/**
 * Blueprint-like classification used ONLY for fallback placeholder behavior.
 *
 * IMPORTANT:
 * - Do NOT treat all /Lotus/Types/Recipes/* items as blueprint-like.
 * - WeaponParts under /Recipes/Weapons/WeaponParts/* include real “part outputs” and must not
 *   be forced into blueprint fallback.
 */
function isBlueprintLikeCatalogItem(catalogId: CatalogId): boolean {
    if (isWeaponPartRecipePathCatalogId(catalogId)) return false;

    // Recipe-path records are often blueprints, but we do not blanket-classify them.
    // Explicit blueprint indicators control fallback.
    return isExplicitBlueprintLikeByNameOrId(catalogId);
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

/**
 * Guarded crafting inference:
 * If this is a recipe-path OUTPUT (not an explicit blueprint item) and we can prove it has a recipe
 * (ingredients), then it is obtainable via Foundry crafting.
 *
 * This is intentionally fail-closed:
 * - No recipe ingredients => not crafting
 * - Manual mapping present => do not infer
 */
function maybeCraftedFromRecipeIngredients(catalogId: CatalogId): boolean {
    if (!isRecipePathCatalogId(catalogId)) return false;
    if (isExplicitBlueprintLikeByNameOrId(catalogId)) return false;

    const reqs = getItemRequirements(catalogId);
    return Array.isArray(reqs) && reqs.length > 0;
}

function getRecipeIdsByResultPath(catalogId: CatalogId): string[] {
    const rec: any = (FULL_CATALOG as any).recordsById?.[String(catalogId)] ?? null;

    const candidatePaths = new Set<string>();
    const addPath = (value: unknown) => {
        const path = safeString(value);
        if (!path) return;
        const normalized = stripItemsPrefix(path);
        if (!normalized.startsWith("/Lotus/")) return;
        candidatePaths.add(normalized);
    };

    addPath(rec?.path);
    addPath(String(catalogId).replace(/^items:/, ""));
    addPath(rec?.raw?.path);
    addPath(rec?.raw?.rawLotus?.path);
    addPath(rec?.raw?.rawLotus?.storeItemType);

    const recipeIds = new Set<string>();
    for (const path of candidatePaths) {
        for (const recipeId of RECIPE_IDS_BY_RESULT_PATH[path] ?? []) {
            recipeIds.add(recipeId);
        }
    }

    return Array.from(recipeIds.values()).sort((a, b) => a.localeCompare(b));
}

function getPowersuitAliasCatalogIds(catalogId: CatalogId): CatalogId[] {
    const rec: any = (FULL_CATALOG as any).recordsById?.[String(catalogId)] ?? null;
    const lotusPath = safeString(rec?.path) ?? stripItemsPrefix(String(catalogId));
    if (!lotusPath.startsWith("/Lotus/Powersuits/")) return [];

    const segments = lotusPath.split("/");
    const tail = segments.pop() ?? "";
    if (!tail) return [];

    const candidateTails = new Set<string>();

    if (tail.endsWith("BaseSuit")) {
        candidateTails.add(tail.slice(0, -8));
    }
    if (tail.endsWith("BaseClaws")) {
        candidateTails.add(`${tail.slice(0, -9)}Claws`);
    }
    if (tail.endsWith("Base")) {
        candidateTails.add(tail.slice(0, -4));
    }
    if (tail.startsWith("Base") && tail.length > 4) {
        candidateTails.add(tail.slice(4));
    }

    const out: CatalogId[] = [];
    for (const candidateTail of candidateTails) {
        if (!candidateTail || candidateTail === tail) continue;
        const candidatePath = [...segments, candidateTail].join("/");
        const candidateCatalogId = `items:${candidatePath}` as CatalogId;
        if (candidateCatalogId === catalogId) continue;
        if ((FULL_CATALOG as any).recordsById?.[String(candidateCatalogId)]) {
            out.push(candidateCatalogId);
        }
    }

    return out.sort((a, b) => String(a).localeCompare(String(b)));
}

function getPowersuitParentCatalogIds(catalogId: CatalogId): CatalogId[] {
    const rec: any = (FULL_CATALOG as any).recordsById?.[String(catalogId)] ?? null;
    const lotusPath = safeString(rec?.path) ?? stripItemsPrefix(String(catalogId));
    if (!lotusPath.startsWith("/Lotus/Powersuits/")) return [];

    const segments = lotusPath.split("/");
    if (segments.length < 5) return [];

    const folder = segments[segments.length - 2];
    if (!folder) return [];

    const baseSegments = segments.slice(0, -1);
    const out: CatalogId[] = [];
    for (const tail of [folder, `${folder}BaseSuit`]) {
        const candidatePath = [...baseSegments, tail].join("/");
        const candidateCatalogId = `items:${candidatePath}` as CatalogId;
        if (candidateCatalogId === catalogId) continue;
        if ((FULL_CATALOG as any).recordsById?.[String(candidateCatalogId)]) {
            out.push(candidateCatalogId);
        }
    }

    return out.sort((a, b) => String(a).localeCompare(String(b)));
}

const POWERSUIT_ALIAS_EXCEPTIONS: Record<string, CatalogId[]> = {
    "items:/Lotus/Powersuits/AntiMatter/NovaBaseSuit": ["items:/Lotus/Powersuits/AntiMatter/Anti" as CatalogId],
    "items:/Lotus/Powersuits/EntratiMech/BaseMechSuit": [
        "items:/Lotus/Powersuits/EntratiMech/NechroTech" as CatalogId,
        "items:/Lotus/Powersuits/EntratiMech/ThanoTech" as CatalogId,
    ],
};

function gatherDirectSources(catalogId: CatalogId): string[] {
    const key = String(catalogId);

    const wfcd = WFCD_ACQ[key];
    const dd = DROP_DATA_ACQ[key];
    const mr = MISSION_RELIC_ACQ[key];
    const rj = RELICS_JSON_ACQ[key];
    const wi = WARFRAME_ITEMS_ACQ[key];
    const im = ITEMS_JSON_MARKET_ACQ[key];
    const rb = RECIPE_BUCKET_ACQ[key];
    const ct = CLAN_TECH_ACQ[key];
    const or = OVERFRAME_RESEARCH_ACQ[key];
    const cc = COMPONENT_CRAFT_ACQ[key];
    const fb = FISHING_BAIT_ACQ[key];
    const ft = FISHING_TROPHY_ACQ[key];
    const rs = RESTORATIVE_BLUEPRINT_ACQ[key];
    const so = SOLARIS_OPERATOR_ARMOR_ACQ[key];
    const ws = WEAPON_SKIN_BLUEPRINT_ACQ[key];
    const wp = WEAPON_PART_FAMILY_ACQ[key];
    const dp = DEIMOS_PET_BLUEPRINT_FAMILY_ACQ[key];
    const nb = NECRALOID_BLUEPRINT_FAMILY_ACQ[key];
    const dw = DEIMOS_WEAPON_BLUEPRINT_FAMILY_ACQ[key];
    const dpr = DEIMOS_PROSPECTING_BLUEPRINT_ACQ[key];
    const sr = SOLARIS_RECIPE_BLUEPRINT_FAMILY_ACQ[key];
    const ep = EIDOLON_PROSPECTING_BLUEPRINT_ACQ[key];
    const dc = DRONE_AND_COMPONENT_BLUEPRINT_ACQ[key];
    const fc = FISHING_AND_CURATIVE_BLUEPRINT_ACQ[key];
    const hb = HOUND_BLUEPRINT_FAMILY_ACQ[key];
    const lc = LANDING_CRAFT_BLUEPRINT_ACQ[key];
    const lcc = LANDING_CRAFT_COMPONENT_BLUEPRINT_ACQ[key];
    const mcb = MARKET_COSMETIC_BLUEPRINT_FAMILY_ACQ[key];
    const mp = MOA_PET_BLUEPRINT_FAMILY_ACQ[key];
    const oa = OPERATOR_ARMOR_BLUEPRINT_FAMILY_ACQ[key];
    const qk = QUEST_KEY_BLUEPRINT_ACQ[key];
    const sb = SYNTHICATOR_BLUEPRINT_ACQ[key];
    const wsb = WARFRAME_SKIN_BLUEPRINT_FAMILY_ACQ[key];
    const ig = INCARNON_GENESIS_ACQ[key];
    const nw = NIGHTWAVE_FAMILY_ACQ[key];
    const rtf = RESOURCE_AND_TAG_FAMILY_ACQ[key];
    const rf = RESTORATIVE_FAMILY_ACQ[key];
    const maf = MOD_AND_ARCANE_FAMILY_ACQ[key];

    return unionSources(
        wfcd?.sources,
        dd?.sources,
        mr?.sources,
        rj?.sources,
        wi?.sources,
        im?.sources,
        rb?.sources,
        ct?.sources,
        or?.sources,
        cc?.sources,
        fb?.sources,
        ft?.sources,
        rs?.sources,
        so?.sources,
        ws?.sources,
        wp?.sources,
        dp?.sources,
        nb?.sources,
        dw?.sources,
        dpr?.sources,
        sr?.sources,
        ep?.sources,
        dc?.sources,
        fc?.sources,
        hb?.sources,
        lc?.sources,
        lcc?.sources,
        mcb?.sources,
        mp?.sources,
        oa?.sources,
        qk?.sources,
        sb?.sources,
        wsb?.sources,
        ig?.sources,
        nw?.sources,
        rtf?.sources,
        rf?.sources,
        maf?.sources
    );
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

    // 2.5)
    // Targeted fix: some Void relic variants are incorrectly attributed to data:node/void/*
    // by one of the acquisition layers. Relics should not be sourced from node drops.
    {
        const rec: any = (FULL_CATALOG as any).recordsById?.[key] ?? null;

        const isRelic = String(rec?.type ?? "").toLowerCase() === "relic";

        if (isRelic) {
            sources = sources.filter((s) => !String(s).startsWith("data:node/void/"));
        }
    }

    // 3) If this is a crafted output of a sibling blueprint with real acquisition, mark as crafting.
    // Only applies when there are no sources AND no manual mapping exists.
    if (!hasManual && sources.length === 0) {
        const crafted = maybeCraftedFromSiblingBlueprint(catalogId, seen);
        if (crafted) {
            sources = [SOURCE_CRAFTING];
        }
    }

    // 3.1) Guarded recipe-ingredient crafting inference:
    // If there are still no sources, and we can prove it has recipe ingredients, it is Foundry craftable.
    if (!hasManual && sources.length === 0) {
        const craftedByIngredients = maybeCraftedFromRecipeIngredients(catalogId);
        if (craftedByIngredients) {
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

    // 7) Recipe parent/parents backreference:
    // If we have no sources for an item/weapon, try to resolve via recipes that declare
    // this item's lotus path as rawLotus.parent/rawLotus.parents.
    if (sources.length === 0) {
        const rec: any = (FULL_CATALOG as any).recordsById?.[key] ?? null;

        // Prefer canonical record.path; otherwise derive from catalogId
        const lotusPath =
            (typeof rec?.path === "string" && rec.path.startsWith("/Lotus/") ? rec.path : null) ??
            stripItemsPrefix(key);

        const recipeIds = RECIPE_IDS_BY_PARENT_PATH[lotusPath] ?? [];
        for (const rid of recipeIds) {
            const recipeAcq = getAcquisitionByCatalogIdInternal(rid as any, seen);
            if (recipeAcq?.sources?.length) {
                sources = unionSources(
                    sources.filter((s) => s !== BLUEPRINT_UNCLASSIFIED),
                    recipeAcq.sources
                );
                break;
            }
        }
    }

    // 7.1) Recipe result backreference:
    // Some built outputs do not expose DisplayRecipe or parent links cleanly, but recipe records
    // still declare the resultItemType/result item path. Use that to inherit the blueprint source.
    {
        const shouldBackfillFromRecipeResult =
            sources.length === 0 ||
            (sources.length === 1 && sources[0] === "data:market/platinum");

        if (shouldBackfillFromRecipeResult) {
            for (const rid of getRecipeIdsByResultPath(catalogId)) {
                const recipeAcq = getAcquisitionByCatalogIdInternal(rid as CatalogId, seen);
                if (!recipeAcq?.sources?.length) continue;

                sources = unionSources(
                    sources.filter((s) => s !== BLUEPRINT_UNCLASSIFIED),
                    recipeAcq.sources,
                );
            }
        }
    }

    // 7.2) PowerSuit alias backreference:
    // Many player-facing Warframes and exalted items have duplicate Base/BaseSuit records
    // that should inherit the real source from their canonical sibling entry.
    if (sources.length === 0) {
        for (const exceptionCatalogId of POWERSUIT_ALIAS_EXCEPTIONS[key] ?? []) {
            const exceptionAcq = getAcquisitionByCatalogIdInternal(exceptionCatalogId, seen);
            if (!exceptionAcq?.sources?.length) continue;
            sources = unionSources(exceptionAcq.sources);
            break;
        }
    }

    if (sources.length === 0) {
        for (const aliasCatalogId of getPowersuitAliasCatalogIds(catalogId)) {
            const aliasAcq = getAcquisitionByCatalogIdInternal(aliasCatalogId, seen);
            if (!aliasAcq?.sources?.length) continue;
            sources = unionSources(aliasAcq.sources);
            break;
        }
    }

    // 7.3) PowerSuit parent fallback:
    // Exalted/companion power entries often live beside their owning Warframe and should
    // inherit that Warframe's acquisition when they do not have an independent source.
    if (sources.length === 0) {
        for (const parentCatalogId of getPowersuitParentCatalogIds(catalogId)) {
            const parentAcq = getAcquisitionByCatalogIdInternal(parentCatalogId, seen);
            if (!parentAcq?.sources?.length) continue;
            sources = unionSources(parentAcq.sources);
            break;
        }
    }

    if (sources.length === 0) return null;
    return { sources };
}

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    return getAcquisitionByCatalogIdInternal(catalogId, new Set<string>());
}

export function buildAcquisitionIndex(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const catalogId of Object.keys(recordsById)) {
        const def = getAcquisitionByCatalogId(catalogId as CatalogId);
        if (!def?.sources?.length) continue;
        out[catalogId] = { sources: [...def.sources].sort((a, b) => a.localeCompare(b)) };
    }

    return out;
}
