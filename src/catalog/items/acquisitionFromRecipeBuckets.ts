// ===== FILE: src/catalog/items/acquisitionFromRecipeBuckets.ts =====
// src/catalog/items/acquisitionFromRecipeBuckets.ts

import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

export type AcquisitionDef = {
    sources: string[];
};

const BLUEPRINT_UNCLASSIFIED = "data:blueprint/unclassified";

function safeString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function isRecipeCatalogId(catalogId: string): boolean {
    return catalogId.includes(":/Lotus/Types/Recipes/");
}

function isBlueprintCatalogIdOrName(catalogId: string, rec: any): boolean {
    // Primary: Lotus path token convention
    if (catalogId.includes("Blueprint")) return true;

    // Secondary: display name convention
    const name = safeString(rec?.displayName) || safeString(rec?.name);
    if (name.toLowerCase().endsWith(" blueprint")) return true;

    return false;
}

/**
 * Broad placeholder layer.
 *
 * Policy:
 * - Do NOT invent real acquisition here.
 * - Only apply placeholder to *actual blueprints/recipes* (Blueprint entries).
 * - Do NOT apply placeholder to crafted outputs that merely live under /Recipes/.
 */
export function deriveRecipeBucketAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};

    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    const allIds = Object.keys(recordsById);

    for (const id of allIds) {
        const catalogId = String(id);
        if (!isRecipeCatalogId(catalogId)) continue;

        const rec: any = recordsById[catalogId] ?? null;
        if (!rec) continue;

        // Only bucket true blueprint-like entries.
        if (!isBlueprintCatalogIdOrName(catalogId, rec)) continue;

        out[catalogId] = { sources: [BLUEPRINT_UNCLASSIFIED] };
    }

    return out;
}

