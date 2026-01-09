// ===== FILE: src/catalog/requirements/requirementRegistry.ts =====
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";

export type RequirementComponent = {
    catalogId: CatalogId;
    count: number;
};

export type RequirementDef = {
    /**
     * The item this requirement describes (the output item).
     */
    outputCatalogId: CatalogId;

    /**
     * Component requirements (inputs).
     * This is intentionally a manual registry for now (no assumptions).
     */
    components: RequirementComponent[];

    /**
     * Optional notes, e.g., "BP from X, crafted in Foundry".
     */
    note?: string;
};

/**
 * Manual requirement registry (populate over time).
 * Keyed by outputCatalogId.
 */
export const REQUIREMENT_REGISTRY: Record<string, RequirementDef> = {};

export function getRequirementDef(outputCatalogId: CatalogId): RequirementDef | null {
    return REQUIREMENT_REGISTRY[String(outputCatalogId)] ?? null;
}

