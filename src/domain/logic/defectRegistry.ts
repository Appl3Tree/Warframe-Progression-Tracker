// src/domain/logic/defectRegistry.ts
//
// Defect registry — a typed, aggregated list of known data defects.
//
// Populated once at module load from static catalog data.
// Safe to import from any module (no store dependency).
//
// Consumers:
//   - Diagnostics page (summary + detailed tables)
//   - Release-gate checks (getReleaseBlockingDefects)
//   - Future: Defect page, CI scripts
//
// Adding new defect categories:
//   1. Add the category name to DefectCategory.
//   2. Write a build*Defects() function.
//   3. Call it in the module-load section at the bottom.

import { FULL_CATALOG } from "../catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../../catalog/items/itemAcquisition";
import { SOURCE_INDEX } from "../../catalog/sources/sourceCatalog";
import UNRESOLVED_RAW from "../../data/_generated/wfcd-acquisition.unresolved.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DefectSeverity =
    /** Blocks a release — data is wrong or missing in a way that actively misleads players. */
    | "release-blocking"
    /** Degrades the experience but doesn't give wrong information. */
    | "warning"
    /** Expected gap or known limitation; not actionable right now. */
    | "info";

export type DefectCategory =
    /** Displayable inventory item has no acquisition sources. */
    | "missing-acquisition"
    /** Item's acquisition sources reference IDs not in SOURCE_CATALOG. */
    | "unknown-source"
    /** WFCD data entry couldn't be mapped to a catalogId. */
    | "unresolved-wfcd";

export type Defect = {
    /** Stable, unique identifier for this defect instance. */
    id: string;
    category: DefectCategory;
    severity: DefectSeverity;
    message: string;
    /** Arbitrary key-value metadata for display / debugging. */
    context?: Record<string, string>;
};

export type DefectSummary = {
    total: number;
    byCategory: Partial<Record<DefectCategory, number>>;
    bySeverity: Partial<Record<DefectSeverity, number>>;
};

// ---------------------------------------------------------------------------
// Registry (mutable during module load; frozen after)
// ---------------------------------------------------------------------------

const _defects: Defect[] = [];

// ---------------------------------------------------------------------------
// Build: catalog completeness — missing acquisition
// ---------------------------------------------------------------------------

function buildAcquisitionDefects(): void {
    const ids = FULL_CATALOG.displayableInventoryItemIds;

    for (const id of ids) {
        const rec = (FULL_CATALOG as any).recordsById?.[id];
        const name = typeof rec?.displayName === "string" ? rec.displayName : String(id);

        const acq = getAcquisitionByCatalogId(id);
        const srcs: string[] = Array.isArray((acq as any)?.sources) ? (acq as any).sources : [];

        if (!acq || srcs.length === 0) {
            _defects.push({
                id: `missing-acquisition:${id}`,
                category: "missing-acquisition",
                severity: "warning",
                message: `Item has no acquisition sources: ${name}`,
                context: { catalogId: String(id), name }
            });
        }
    }
}

// ---------------------------------------------------------------------------
// Build: catalog completeness — unknown source references
// ---------------------------------------------------------------------------

function buildUnknownSourceDefects(): void {
    const ids = FULL_CATALOG.displayableInventoryItemIds;

    for (const id of ids) {
        const rec = (FULL_CATALOG as any).recordsById?.[id];
        const name = typeof rec?.displayName === "string" ? rec.displayName : String(id);

        const acq = getAcquisitionByCatalogId(id);
        const srcs: string[] = Array.isArray((acq as any)?.sources) ? (acq as any).sources : [];

        if (srcs.length === 0) continue; // already flagged as missing-acquisition

        const unknown = srcs.filter((s) => !SOURCE_INDEX[s as any]);
        if (unknown.length === 0) continue;

        _defects.push({
            id: `unknown-source:${id}`,
            category: "unknown-source",
            severity: "warning",
            message: `Item references ${unknown.length} unknown source ID(s): ${name}`,
            context: {
                catalogId: String(id),
                name,
                unknownSources: unknown.slice(0, 3).join(", ") + (unknown.length > 3 ? ` …+${unknown.length - 3} more` : "")
            }
        });
    }
}

// ---------------------------------------------------------------------------
// Build: WFCD unresolved items
// ---------------------------------------------------------------------------

function buildWfcdUnresolvedDefects(): void {
    const raw = UNRESOLVED_RAW as Record<string, { itemName: string; count: number; examples: string[] }>;

    for (const [key, def] of Object.entries(raw)) {
        _defects.push({
            id: `unresolved-wfcd:${key}`,
            category: "unresolved-wfcd",
            severity: "info",
            message: `WFCD item could not be mapped to a catalog ID: "${def.itemName}" (×${def.count})`,
            context: {
                itemName: def.itemName,
                count: String(def.count),
                exampleSources: (def.examples ?? []).slice(0, 2).join("; ")
            }
        });
    }
}

// ---------------------------------------------------------------------------
// Module-load: populate registry
// ---------------------------------------------------------------------------

buildAcquisitionDefects();
buildUnknownSourceDefects();
buildWfcdUnresolvedDefects();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All registered defects. Read-only after module load. */
export const DEFECT_REGISTRY: readonly Defect[] = _defects;

/**
 * Register additional defects at runtime (e.g. from validation warnings captured
 * after startup). Idempotent — duplicate IDs are silently skipped.
 */
export function registerDefects(defects: Defect[]): void {
    const existing = new Set(_defects.map((d) => d.id));
    for (const d of defects) {
        if (!existing.has(d.id)) {
            _defects.push(d);
            existing.add(d.id);
        }
    }
}

export function getDefectsByCategory(category: DefectCategory): readonly Defect[] {
    return _defects.filter((d) => d.category === category);
}

export function getDefectsBySeverity(severity: DefectSeverity): readonly Defect[] {
    return _defects.filter((d) => d.severity === severity);
}

/**
 * Returns defects that should block a release.
 * Currently none are emitted automatically; this is the hook for future
 * explicit release gates (e.g. "item X must have an acquisition path").
 */
export function getReleaseBlockingDefects(): readonly Defect[] {
    return _defects.filter((d) => d.severity === "release-blocking");
}

export function getDefectSummary(): DefectSummary {
    const byCategory: Partial<Record<DefectCategory, number>> = {};
    const bySeverity: Partial<Record<DefectSeverity, number>> = {};

    for (const d of _defects) {
        byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;
        bySeverity[d.severity] = (bySeverity[d.severity] ?? 0) + 1;
    }

    return { total: _defects.length, byCategory, bySeverity };
}
