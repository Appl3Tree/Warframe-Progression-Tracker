// ===== FILE: src/domain/logic/startupValidation.ts =====
// src/domain/logic/startupValidation.ts

import { SOURCE_CATALOG } from "../../catalog/sources/sourceCatalog";

type ValidationIssueCode =
    | "SOURCE_ID_INVALID"
    | "SOURCE_ID_DUPLICATE"
    | "SOURCE_LABEL_INVALID";

type ValidationIssue = {
    code: ValidationIssueCode;
    message: string;
};

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
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

export function validateDataOrThrow(): void {
    const issues: ValidationIssue[] = [];

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

        // unified format check first
        if (!isValidSourceIdFormat(id)) {
            issues.push({
                code: "SOURCE_ID_INVALID",
                message: `Source has invalid id format: ${id}`
            });
            continue;
        }

        // namespace check: either data-derived, or curated-like namespaces
        if (isDataDerivedSourceId(id)) continue;

        if (!isCuratedLikeSourceId(id)) {
            issues.push({
                code: "SOURCE_ID_INVALID",
                message: `Source has unknown namespace: ${id}`
            });
        }
    }

    if (issues.length > 0) {
        const lines = issues.map((i) => `- [${i.code}] ${i.message}`);
        throw new Error(`Data integrity validation failed:\n${lines.join("\n")}`);
    }
}

