// src/domain/logic/startupValidation.ts

import { PR, type PrereqId } from "../ids/prereqIds";
import { PREREQ_REGISTRY } from "../../catalog/prereqs/prereqRegistry";

import { SOURCE_CATALOG, SOURCE_INDEX } from "../../catalog/sources/sourceCatalog";
import { isSourceId, type SourceId } from "../ids/sourceIds";

import { FULL_CATALOG, type CatalogId } from "../catalog/loadFullCatalog";
import { getRequirementDef } from "../../catalog/requirements/requirementRegistry";
import { getAcquisitionByCatalogId } from "../../catalog/items/itemAcquisition";

type Defect = {
    code: string;
    message: string;
};

function push(defects: Defect[], code: string, message: string): void {
    defects.push({ code, message });
}

function uniq<T>(arr: T[]): T[] {
    const out: T[] = [];
    const seen = new Set<string>();
    for (const v of arr) {
        const k = String(v);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(v);
    }
    return out;
}

function buildPrereqUniverse(): { all: PrereqId[]; set: Set<string> } {
    const all = Object.values(PR) as PrereqId[];
    return { all, set: new Set(all.map(String)) };
}

export function validateDataIntegrity(): Defect[] {
    const defects: Defect[] = [];

    const prVals = Object.values(PR).map(String);
    const prUniq = uniq(prVals);
    if (prUniq.length !== prVals.length) {
        push(defects, "PR_DUPLICATE", "Duplicate prereq IDs detected in PR constant table.");
    }

    const universe = buildPrereqUniverse();
    const registryIds = PREREQ_REGISTRY.map((p) => String(p.id));
    const registrySet = new Set(registryIds);

    for (const id of universe.all) {
        if (!registrySet.has(String(id))) {
            push(defects, "PREREQ_MISSING_DEF", `PREREQ_REGISTRY is missing definition for prereqId: ${String(id)}`);
        }
    }

    for (const id of registryIds) {
        if (!universe.set.has(id)) {
            push(defects, "PREREQ_UNKNOWN_ID", `PREREQ_REGISTRY contains unknown prereqId not present in PR: ${id}`);
        }
    }

    for (const def of PREREQ_REGISTRY) {
        for (const req of def.prerequisites ?? []) {
            if (!universe.set.has(String(req))) {
                push(
                    defects,
                    "PREREQ_DANGLING_EDGE",
                    `Prereq "${String(def.id)}" has unresolved prerequisite "${String(req)}"`
                );
            }
        }
    }

    const sourceSeen = new Set<string>();
    for (const s of SOURCE_CATALOG) {
        const id = String(s.id);

        if (!isSourceId(id)) {
            push(defects, "SOURCE_ID_INVALID", `Source has invalid id format: ${id}`);
        }

        if (sourceSeen.has(id)) {
            push(defects, "SOURCE_ID_DUPLICATE", `Duplicate source id in SOURCE_CATALOG: ${id}`);
        }
        sourceSeen.add(id);

        for (const p of s.prereqIds ?? []) {
            if (!universe.set.has(String(p))) {
                push(defects, "SOURCE_DANGLING_PREREQ", `Source "${id}" references unknown prereqId: ${String(p)}`);
            }
        }

        if (typeof (s as any).mrRequired !== "undefined") {
            const mr = (s as any).mrRequired;
            if (typeof mr !== "number" || !Number.isFinite(mr) || mr < 0 || Math.floor(mr) !== mr) {
                push(defects, "SOURCE_MR_INVALID", `Source "${id}" has invalid mrRequired: ${String(mr)}`);
            }
        }
    }

    const ids = Object.keys(FULL_CATALOG.recordsById) as CatalogId[];
    if (ids.length !== FULL_CATALOG.stats.totalCount) {
        push(
            defects,
            "CATALOG_COUNT_MISMATCH",
            `FULL_CATALOG count mismatch: recordsById=${ids.length}, stats.totalCount=${FULL_CATALOG.stats.totalCount}`
        );
    }

    // Validate any requirement registry entries that exist.
    for (const outputId of FULL_CATALOG.inventoryItemIds) {
        const def = getRequirementDef(outputId);
        if (!def) continue;

        if (String(def.outputCatalogId) !== String(outputId)) {
            push(defects, "REQ_OUTPUT_MISMATCH", `RequirementDef outputCatalogId mismatch for key=${String(outputId)}`);
        }

        for (const c of def.components ?? []) {
            const cid = String(c.catalogId);
            if (!FULL_CATALOG.recordsById[cid as CatalogId]) {
                push(
                    defects,
                    "REQ_COMPONENT_UNKNOWN",
                    `RequirementDef for ${String(outputId)} references unknown component catalogId: ${cid}`
                );
            }
            if (
                typeof c.count !== "number" ||
                !Number.isFinite(c.count) ||
                c.count <= 0 ||
                Math.floor(c.count) !== c.count
            ) {
                push(
                    defects,
                    "REQ_COMPONENT_COUNT_INVALID",
                    `RequirementDef for ${String(outputId)} has invalid component count for ${cid}: ${String(c.count)}`
                );
            }
        }
    }

    return defects;
}

/**
 * Completeness defects (PHASE 1.2+). This intentionally does NOT throw, so you can
 * iterate while still having an explicit defect list to drive data work.
 *
 * Wire this into the Diagnostics page (or console) to make missing coverage visible.
 */
export function validateDataCompleteness(): Defect[] {
    const defects: Defect[] = [];

    // Acquisition coverage for displayable inventory items.
    // We only validate displayable inventory items because non-displayable records are not user-facing.
    for (const id of FULL_CATALOG.displayableInventoryItemIds) {
        const acq = getAcquisitionByCatalogId(id);
        if (!acq) {
            push(defects, "ACQ_MISSING", `Missing acquisition for item: ${String(id)} (${FULL_CATALOG.recordsById[id]?.displayName ?? "?"})`);
            continue;
        }

        const srcs = Array.isArray(acq.sources) ? acq.sources : [];
        if (srcs.length === 0) {
            push(defects, "ACQ_EMPTY", `Empty acquisition sources for item: ${String(id)} (${FULL_CATALOG.recordsById[id]?.displayName ?? "?"})`);
            continue;
        }

        for (const sid of srcs) {
            const s = String(sid) as SourceId;
            if (!isSourceId(s)) {
                push(defects, "ACQ_SOURCE_INVALID", `Invalid SourceId "${String(sid)}" referenced by item: ${String(id)}`);
                continue;
            }
            if (!SOURCE_INDEX[s]) {
                push(defects, "ACQ_SOURCE_UNKNOWN", `Unknown source "${s}" referenced by item: ${String(id)}`);
            }
        }
    }

    return defects;
}

export function validateDataOrThrow(): void {
    const defects = validateDataIntegrity();
    if (defects.length === 0) return;

    const lines = defects.map((d) => `- [${d.code}] ${d.message}`);
    throw new Error(`Data integrity validation failed:\n${lines.join("\n")}`);
}

