// ===== FILE: src/catalog/items/itemRequirements.ts =====
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { getRequirementDef, type RequirementComponent } from "../requirements/requirementRegistry";

/**
 * Returns the component requirements for a given catalog item, if you have defined it in the registry.
 * If there is no entry, returns an empty list (fail-closed: we do not invent recipe data).
 */
export function getItemRequirements(outputCatalogId: CatalogId): RequirementComponent[] {
    const def = getRequirementDef(outputCatalogId);
    if (!def) return [];
    return Array.isArray(def.components) ? def.components : [];
}

