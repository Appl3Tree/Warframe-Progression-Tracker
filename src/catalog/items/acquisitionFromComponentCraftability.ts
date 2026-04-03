// ===== FILE: src/catalog/items/acquisitionFromComponentCraftability.ts =====
//
// Infers "data:crafting" acquisition for top-level items (warframes, weapons, companions…)
// that are assembled in the Foundry from components with known drop sources.
//
// Follie and other freshly-added frames are the canonical motivating case: they have no
// explicit acquisition mapping yet, but their component blueprints already have drop data
// in warframe-items. This adapter bridges that gap so the planner treats them as craftable
// rather than "Blocked".

import ALL from "../../data/_generated/warframe-items-all-lean.auto.json";
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

const SOURCE_CRAFTING = "data:crafting";

/**
 * Returns a catalogId → AcquisitionDef map for every top-level item in warframe-items
 * that has at least one component with drop data (i.e. it can be assembled in the Foundry).
 *
 * This is a fallback-of-last-resort: itemAcquisition.ts only reaches this layer when every
 * other acquisition layer has produced no sources for the item.
 */
export function deriveComponentCraftabilityAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);

    for (const item of ALL as any[]) {
        const uniqueName = typeof item.uniqueName === "string" ? item.uniqueName : null;
        if (!uniqueName) continue;

        const components: any[] = Array.isArray(item.components) ? item.components : [];
        if (components.length === 0) continue;

        // Require at least one component to have actual drop data so we don't mark
        // placeholder / stub items as craftable.
        const hasDroppableComponent = components.some(
            (c: any) => Array.isArray(c.drops) && c.drops.length > 0
        );
        if (!hasDroppableComponent) continue;

        const catalogId = `items:${uniqueName}` as CatalogId;
        out[String(catalogId)] = { sources: [SOURCE_CRAFTING] };
    }

    return out;
}
