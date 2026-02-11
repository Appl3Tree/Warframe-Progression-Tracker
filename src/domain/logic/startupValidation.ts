// ===== FILE: src/domain/logic/startupValidation.ts =====
// src/domain/logic/startupValidation.ts

import { SOURCE_CATALOG } from "../../catalog/sources/sourceCatalog";
import { STAR_CHART_DATA } from "../catalog/starChart";

type ValidationIssueCode =
    | "SOURCE_ID_INVALID"
    | "SOURCE_ID_DUPLICATE"
    | "SOURCE_LABEL_INVALID"
    | "STAR_CHART_EMPTY"
    | "STAR_CHART_PLANET_INVALID"
    | "STAR_CHART_NODE_INVALID"
    | "STAR_CHART_NODE_EDGE_INVALID"
    | "STAR_CHART_JUNCTION_NODE_INVALID";

type ValidationIssue = {
    code: ValidationIssueCode;
    message: string;
};

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

function isSrcSourceId(id: string): boolean {
    return id.startsWith("src:");
}

function isCuratedLikeSourceId(id: string): boolean {
    return (
        id.startsWith("system:") ||
        id.startsWith("node:") ||
        id.startsWith("vendor:") ||
        id.startsWith("quest:") ||
        id.startsWith("syndicate:") ||
        id.startsWith("faction:") ||
        id.startsWith("market:") ||
        id.startsWith("clan:") ||
        id.startsWith("event:") ||
        id.startsWith("relic:") ||
        id.startsWith("bounty:") ||
        id.startsWith("transient:") ||
        id.startsWith("activity:") ||
        id.startsWith("enemy:")
    );
}

function isDataDerivedSourceId(id: string): boolean {
    return id.startsWith("data:");
}

function isValidSourceIdFormat(id: string): boolean {
    if (!isNonEmptyString(id)) return false;
    if (id.includes(" ")) return false;
    if (id.startsWith("/")) return false;
    if (!id.includes(":")) return false;
    if (id.includes("\\") || id.includes("//")) return false;
    return true;
}

function validateSources(issues: ValidationIssue[]): void {
    if (!Array.isArray(SOURCE_CATALOG) || SOURCE_CATALOG.length === 0) {
        issues.push({
            code: "SOURCE_LABEL_INVALID",
            message: "SOURCE_CATALOG is empty or not an array."
        });
    }

    const seen = new Set<string>();

    for (const s of SOURCE_CATALOG ?? []) {
        const id = String((s as any)?.id ?? "").trim();
        const label = String((s as any)?.label ?? "").trim();

        if (!id) {
            issues.push({
                code: "SOURCE_ID_INVALID",
                message: "Source has missing id."
            });
            continue;
        }

        if (!label) {
            issues.push({
                code: "SOURCE_LABEL_INVALID",
                message: `Source (${id}) has missing label.`
            });
        }

        if (seen.has(id)) {
            issues.push({
                code: "SOURCE_ID_DUPLICATE",
                message: `Duplicate source id: ${id}`
            });
        } else {
            seen.add(id);
        }

        if (!isValidSourceIdFormat(id)) {
            issues.push({
                code: "SOURCE_ID_INVALID",
                message: `Source has invalid id format: ${id}`
            });
            continue;
        }

        // Allowed namespaces:
        // - canonical app SourceIds: src:...
        // - data-derived legacy ids: data:...
        // - curated-like legacy ids: node:, vendor:, etc
        if (isSrcSourceId(id)) continue;
        if (isDataDerivedSourceId(id)) continue;

        if (!isCuratedLikeSourceId(id)) {
            issues.push({
                code: "SOURCE_ID_INVALID",
                message: `Source has unknown namespace: ${id}`
            });
        }
    }
}

type StarChartValidationMode = "off" | "on";

/**
 * Keep this OFF until Phase 1.5 registries are fully populated.
 * When ON, startup becomes fail-closed for Star Chart correctness.
 */
const STAR_CHART_VALIDATION_MODE: StarChartValidationMode = "off";

function validateStarChart(issues: ValidationIssue[]): void {
    if (STAR_CHART_VALIDATION_MODE !== "on") return;

    const data = STAR_CHART_DATA;

    if (!data || !Array.isArray(data.planets) || !Array.isArray(data.nodes) || data.planets.length === 0 || data.nodes.length === 0) {
        issues.push({
            code: "STAR_CHART_EMPTY",
            message: "STAR_CHART_DATA is missing or empty (planets/nodes required)."
        });
        return;
    }

    const planetIds = new Set<string>();
    const nodeIds = new Set<string>();

    for (const p of data.planets) {
        const id = String((p as any)?.id ?? "").trim();
        const name = String((p as any)?.name ?? "").trim();
        const kind = String((p as any)?.kind ?? "").trim();
        const sortOrder = (p as any)?.sortOrder;

        if (!id || id.includes(" ")) {
            issues.push({
                code: "STAR_CHART_PLANET_INVALID",
                message: `Planet has invalid id: ${id || "(missing)"}`
            });
            continue;
        }

        if (!name) {
            issues.push({
                code: "STAR_CHART_PLANET_INVALID",
                message: `Planet (${id}) has missing name.`
            });
        }

        if (kind !== "planet" && kind !== "hub" && kind !== "region") {
            issues.push({
                code: "STAR_CHART_PLANET_INVALID",
                message: `Planet (${id}) has invalid kind: ${kind}`
            });
        }

        if (typeof sortOrder !== "number" || !Number.isFinite(sortOrder)) {
            issues.push({
                code: "STAR_CHART_PLANET_INVALID",
                message: `Planet (${id}) has invalid sortOrder.`
            });
        }

        if (planetIds.has(id)) {
            issues.push({
                code: "STAR_CHART_PLANET_INVALID",
                message: `Duplicate planet id: ${id}`
            });
        } else {
            planetIds.add(id);
        }
    }

    for (const n of data.nodes) {
        const id = String((n as any)?.id ?? "").trim();
        const planetId = String((n as any)?.planetId ?? "").trim();
        const name = String((n as any)?.name ?? "").trim();
        const nodeType = String((n as any)?.nodeType ?? "").trim();
        const edges = (n as any)?.edges;

        if (!id || id.includes(" ")) {
            issues.push({
                code: "STAR_CHART_NODE_INVALID",
                message: `Node has invalid id: ${id || "(missing)"}`
            });
            continue;
        }

        if (!planetId || !planetIds.has(planetId)) {
            issues.push({
                code: "STAR_CHART_NODE_INVALID",
                message: `Node (${id}) references unknown planetId: ${planetId}`
            });
        }

        if (!name) {
            issues.push({
                code: "STAR_CHART_NODE_INVALID",
                message: `Node (${id}) has missing name.`
            });
        }

        if (nodeType !== "mission" && nodeType !== "hub" && nodeType !== "junction" && nodeType !== "special") {
            issues.push({
                code: "STAR_CHART_NODE_INVALID",
                message: `Node (${id}) has invalid nodeType: ${nodeType}`
            });
        }

        if (!Array.isArray(edges)) {
            issues.push({
                code: "STAR_CHART_NODE_INVALID",
                message: `Node (${id}) has non-array edges.`
            });
        }

        if (nodeIds.has(id)) {
            issues.push({
                code: "STAR_CHART_NODE_INVALID",
                message: `Duplicate node id: ${id}`
            });
        } else {
            nodeIds.add(id);
        }
    }

    // Edge validation after nodeIds set is complete
    for (const n of data.nodes) {
        const id = String((n as any)?.id ?? "").trim();
        const edges = (n as any)?.edges;

        if (!Array.isArray(edges)) continue;

        for (const e of edges) {
            const edgeId = String(e ?? "").trim();
            if (!edgeId) continue;

            if (!nodeIds.has(edgeId)) {
                issues.push({
                    code: "STAR_CHART_NODE_EDGE_INVALID",
                    message: `Node (${id}) has edge to unknown nodeId: ${edgeId}`
                });
            }
        }
    }

    // Junction-as-node validation
    for (const n of data.nodes) {
        const id = String((n as any)?.id ?? "").trim();
        const nodeType = String((n as any)?.nodeType ?? "").trim();

        if (nodeType !== "junction") continue;

        const unlocksPlanetId = String((n as any)?.unlocksPlanetId ?? "").trim();
        const prereqIds = (n as any)?.prereqIds;

        if (!unlocksPlanetId || !planetIds.has(unlocksPlanetId)) {
            issues.push({
                code: "STAR_CHART_JUNCTION_NODE_INVALID",
                message: `Junction node (${id}) has invalid unlocksPlanetId: ${unlocksPlanetId || "(missing)"}`
            });
        }

        if (!Array.isArray(prereqIds) || prereqIds.length === 0) {
            issues.push({
                code: "STAR_CHART_JUNCTION_NODE_INVALID",
                message: `Junction node (${id}) prereqIds must be a non-empty array.`
            });
        } else {
            for (const pr of prereqIds) {
                const prId = String(pr ?? "").trim();
                if (!prId) {
                    issues.push({
                        code: "STAR_CHART_JUNCTION_NODE_INVALID",
                        message: `Junction node (${id}) has empty prereq id.`
                    });
                }
            }
        }
    }
}

export function validateDataOrThrow(): void {
    const issues: ValidationIssue[] = [];

    validateSources(issues);
    validateStarChart(issues);

    if (issues.length > 0) {
        const lines = issues.map((i) => `- [${i.code}] ${i.message}`);
        throw new Error(`Data integrity validation failed:\n${lines.join("\n")}`);
    }
}

