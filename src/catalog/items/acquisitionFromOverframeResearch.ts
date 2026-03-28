// ===== FILE: src/catalog/items/acquisitionFromOverframeResearch.ts =====
//
// Derives clan-tech / dojo-research acquisition from the overframe-gg items.json snapshot.
//
// The existing acquisitionFromClanTech.ts works only for items whose weapon uniqueName
// contains the "/Lotus/Weapons/ClanTech/" path prefix (e.g. Ignis). Weapons like Venka
// (/Lotus/Weapons/Tenno/Melee/Claws/TennoClaws) are under the Tenno weapon path even
// though their blueprint requires dojo research — so they were silently dropped.
//
// The reliable ground truth is the presence of ResearchIngredients in the overframe-gg
// data. Any blueprint record with that field is a clan-lab research item. We map both
// the blueprint catalogId and the resultItemType weapon catalogId to the appropriate lab.

import OVERFRAME_ITEMS from "../../../external/overframe-gg/items.json";
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

// These must all exist in curatedSources.ts SOURCE_INDEX.
const LAB_CHEM    = "data:dojo/chem-lab";
const LAB_ENERGY  = "data:dojo/energy-lab";
const LAB_BIO     = "data:dojo/bio-lab";
const LAB_OROKIN  = "data:dojo/orokin-lab";
const LAB_TENNO   = "data:clan/tenno-lab";
const LAB_DAGATH  = "data:dojo/dagaths-hollow";
const LAB_GENERIC = "data:dojo/research";
// The crafted output weapon is obtained by crafting the blueprint in the Foundry.
const SOURCE_CRAFTING = "data:crafting";

/**
 * Infer the dojo lab from the blueprint's Lotus path.
 *
 * The path filename segment encodes the faction that built/themed the weapon,
 * which correlates 1-to-1 with the lab it lives in:
 *   Inf* / Infested*          → Bio Lab
 *   Crp* / Corpus*            → Chem Lab
 *   Grn* / Grineer*           → Energy Lab
 *   Tenno* / Tn* / Tno*       → Tenno Lab
 *   Orokin*                   → Orokin Lab
 *   Dagath* / DagathsHollow*  → Dagath's Hollow
 *
 * Anything else falls back to the generic "Research in the Dojo" source.
 */
function inferLabFromBlueprintPath(blueprintPath: string): string {
    // Use only the last path segment so we're comparing the blueprint name, not a parent dir.
    const seg = (blueprintPath.split("/").pop() ?? "").toLowerCase();

    if (seg.startsWith("inf") || seg.includes("infested"))         return LAB_BIO;
    if (seg.startsWith("crp") || seg.startsWith("corpus"))         return LAB_CHEM;
    if (seg.startsWith("grn") || seg.startsWith("grineer"))        return LAB_ENERGY;
    if (seg.startsWith("orokin"))                                   return LAB_OROKIN;
    if (seg.startsWith("dagath"))                                   return LAB_DAGATH;
    // Tenno-prefixed and Tn/Tno abbreviations all go to Tenno Lab.
    if (
        seg.startsWith("tenno") ||
        seg.startsWith("tn") ||
        seg.startsWith("tno")
    ) return LAB_TENNO;

    return LAB_GENERIC;
}

function addSource(
    out: Record<string, AcquisitionDef>,
    catalogId: CatalogId,
    sourceId: string,
): void {
    const key = String(catalogId);
    const prev = out[key];
    if (!prev) {
        out[key] = { sources: [sourceId] };
        return;
    }
    const existing = new Set((prev.sources ?? []).map(String));
    if (!existing.has(sourceId)) {
        out[key] = { ...prev, sources: [...(prev.sources ?? []), sourceId] };
    }
}

/**
 * Returns a catalogId → AcquisitionDef map for every clan-lab research blueprint
 * and its crafted output weapon found in the overframe-gg items.json snapshot.
 *
 * Acquisition semantics:
 *   Blueprint catalogId  → lab source (player researches/replicates it from the dojo)
 *   Result weapon catalogId → data:crafting (player crafts the blueprint in the Foundry)
 *
 * The market/platinum source for the weapon comes from a separate acquisition layer and
 * is intentionally NOT duplicated here.
 */
export function deriveOverframeResearchAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);

    const records = OVERFRAME_ITEMS as Record<string, any>;

    for (const [path, rec] of Object.entries(records)) {
        const data: any = rec?.data ?? {};

        // Only process blueprint records that have ResearchIngredients — the definitive
        // indicator of a dojo-lab research item.
        if (!Array.isArray(data.ResearchIngredients) || data.ResearchIngredients.length === 0) {
            continue;
        }

        const sourceId = inferLabFromBlueprintPath(path);

        // 1) The blueprint itself is obtained from the dojo lab.
        const blueprintCid = `items:${path}` as CatalogId;
        addSource(out, blueprintCid, sourceId);

        // 2) The crafted output weapon is obtained by crafting the blueprint in the Foundry —
        //    not from the lab directly.
        const resultPath: string | null =
            typeof data.resultItemType === "string" && data.resultItemType.startsWith("/Lotus/")
                ? data.resultItemType
                : null;

        if (resultPath) {
            const resultCid = `items:${resultPath}` as CatalogId;
            addSource(out, resultCid, SOURCE_CRAFTING);
        }
    }

    return out;
}
