// ===== FILE: src/catalog/items/acquisitionFromClanTech.ts =====

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

/**
 * ClanTech / Dojo research acquisition.
 *
 * Player-meaningful policy:
 * - If an item has rawLotus.storeData.DisplayRecipe that points to a ClanTech blueprint path,
 *   then the item is obtainable via Clan Dojo research (lab purchase + craft).
 *
 * Deterministic evidence:
 * - DisplayRecipe starts with "/Lotus/Weapons/ClanTech/"
 * - The lab segment is the path component immediately after "ClanTech":
 *     /Lotus/Weapons/ClanTech/<LabSegment>/...
 *
 * We emit lab-specific sources when possible; otherwise fall back to generic dojo research.
 *
 * Output SourceIds must exist in SOURCE_INDEX (sourceCatalog.ts).
 */
function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function add(out: Record<string, AcquisitionDef>, catalogId: CatalogId, sourceId: string): void {
    const key = String(catalogId);
    const prev = out[key];

    if (!prev) {
        out[key] = { sources: [sourceId] };
        return;
    }

    const set = new Set((prev.sources ?? []).map((s) => String(s)));
    if (set.has(sourceId)) return;

    out[key] = { sources: [...(prev.sources ?? []), sourceId] };
}

function deriveDojoSourceIdFromClanTechDisplayRecipe(displayRecipe: string): string | null {
    const dr = safeString(displayRecipe);
    if (!dr) return null;

    const prefix = "/Lotus/Weapons/ClanTech/";
    if (!dr.startsWith(prefix)) return null;

    // Example:
    // /Lotus/Weapons/ClanTech/Chemical/RegorAxeShieldBlueprint
    const parts = dr.split("/").filter((p) => p.length > 0);
    // ["Lotus","Weapons","ClanTech","Chemical",...]
    const idx = parts.indexOf("ClanTech");
    if (idx < 0) return "data:dojo/research";

    const segment = safeString(parts[idx + 1]) ?? "";
    const seg = segment.toLowerCase();

    // Known lab segments observed in your sample: Bio, Chemical, Energy
    // Orokin lab is also common in ClanTech
    if (seg === "bio") return "data:dojo/bio-lab";
    if (seg === "chemical") return "data:dojo/chem-lab";
    if (seg === "energy") return "data:dojo/energy-lab";
    if (seg === "orokin") return "data:dojo/orokin-lab";

    // Some datasets may use "tenno" or other segments; keep player-meaningful generic fallback.
    return "data:dojo/research";
}

export function deriveClanTechAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);

    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    for (const [id, rec] of Object.entries(recordsById)) {
        const cid = id as CatalogId;

        const rawLotus: any = rec?.raw?.rawLotus ?? null;
        const dr = safeString(rawLotus?.storeData?.DisplayRecipe);
        if (!dr) continue;

        const sourceId = deriveDojoSourceIdFromClanTechDisplayRecipe(dr);
        if (!sourceId) continue;

        add(out, cid, sourceId);
    }

    return out;
}
