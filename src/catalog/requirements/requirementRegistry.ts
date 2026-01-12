// src/catalog/requirements/requirementRegistry.ts
// Auto-generated WFCD requirements (outputCatalogId -> def)

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

// Auto-generated WFCD requirements (outputCatalogId -> def)
import wfcdAutoRequirements from "../../data/_generated/wfcd-requirements.byCatalogId.auto.json";

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
     * Manual entries override auto-generated ones.
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

function isKnownCatalogId(id: string): id is CatalogId {
    const key = id as CatalogId;
    return Boolean(FULL_CATALOG.recordsById[key]);
}

// Normalize auto JSON into the same runtime structure (fail-closed).
// Policy:
// - If the OUTPUT item is unknown -> drop.
// - If ANY component is unknown -> drop the ENTIRE requirement entry.
//   (Prevents partial/incorrect recipes from creating misleading plans.)
function normalizeAuto(): Record<string, RequirementDef> {
    const raw = (wfcdAutoRequirements ?? {}) as Record<string, any>;
    const out: Record<string, RequirementDef> = {};

    for (const [k, v] of Object.entries(raw)) {
        const outputCatalogId = String(v?.outputCatalogId ?? k).trim();
        if (!outputCatalogId.startsWith("items:")) continue;
        if (!isKnownCatalogId(outputCatalogId)) continue;

        const compsRaw = Array.isArray(v?.components) ? v.components : [];
        const components: RequirementComponent[] = [];

        let hasUnknownComponent = false;

        for (const c of compsRaw) {
            const cid = String(c?.catalogId ?? "").trim();
            const cnt = Number(c?.count ?? 0);

            if (!cid.startsWith("items:")) {
                hasUnknownComponent = true;
                continue;
            }
            if (!Number.isFinite(cnt) || cnt <= 0) {
                continue;
            }
            if (!isKnownCatalogId(cid)) {
                hasUnknownComponent = true;
                continue;
            }

            components.push({
                catalogId: cid as CatalogId,
                count: Math.max(1, Math.floor(cnt))
            });
        }

        // Fail-closed: require at least 1 component and no unknown components.
        if (components.length === 0) continue;
        if (hasUnknownComponent) continue;

        out[outputCatalogId] = {
            outputCatalogId: outputCatalogId as CatalogId,
            components,
            note: typeof v?.note === "string" ? v.note : undefined
        };
    }

    return out;
}

const AUTO_REQUIREMENTS: Record<string, RequirementDef> = normalizeAuto();

/**
 * Effective requirement registry:
 * - Auto first
 * - Manual overrides win
 */
export const EFFECTIVE_REQUIREMENTS: Record<string, RequirementDef> = {
    ...AUTO_REQUIREMENTS,
    ...REQUIREMENT_REGISTRY
};

export function getRequirementDef(outputCatalogId: CatalogId): RequirementDef | null {
    return EFFECTIVE_REQUIREMENTS[String(outputCatalogId)] ?? null;
}

