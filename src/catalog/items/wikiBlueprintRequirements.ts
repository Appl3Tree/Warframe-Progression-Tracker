import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import WIKI_BLUEPRINTS_JSON from "../../data/_generated/wiki-blueprints.auto.json";

export type WikiBlueprintRequirement = {
    catalogId: CatalogId;
    count: number;
};

type WikiBlueprintPart = {
    Count?: number;
    Name?: string;
    Type?: string;
    Cost?: {
        Credits?: number;
        Parts?: WikiBlueprintPart[];
        Rush?: number;
        Time?: number;
    };
};

type WikiBlueprintRecord = {
    Name?: string;
    Result?: string;
    Parts?: WikiBlueprintPart[];
    Credits?: number;
    MarketCost?: number;
    Rush?: number;
    Time?: number;
    ProductCategory?: string;
};

function normalizeName(value: string): string {
    return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function safeString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function safeCount(value: unknown): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
}

function looksLikeWikiBlueprintRecord(value: unknown): value is WikiBlueprintRecord {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const record = value as WikiBlueprintRecord;
    return Boolean(record.Name || record.Result || record.Parts);
}

function collectWikiBlueprintRecords(raw: unknown): Record<string, WikiBlueprintRecord> {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

    const out: Record<string, WikiBlueprintRecord> = {};

    for (const section of Object.values(raw as Record<string, unknown>)) {
        if (!section || typeof section !== "object" || Array.isArray(section)) continue;

        for (const [key, value] of Object.entries(section as Record<string, unknown>)) {
            if (!looksLikeWikiBlueprintRecord(value)) continue;
            out[key] = value;
        }
    }

    return out;
}

const WIKI_BLUEPRINTS: Record<string, WikiBlueprintRecord> = collectWikiBlueprintRecords(WIKI_BLUEPRINTS_JSON as any);

const WIKI_BY_RESULT = new Map<string, WikiBlueprintRecord>();
const WIKI_BY_BLUEPRINT_NAME = new Map<string, WikiBlueprintRecord>();
const WIKI_BY_KEY = new Map<string, WikiBlueprintRecord>();

for (const [key, record] of Object.entries(WIKI_BLUEPRINTS)) {
    WIKI_BY_KEY.set(normalizeName(key), record);

    const result = safeString(record?.Result);
    if (result) WIKI_BY_RESULT.set(normalizeName(result), record);

    const blueprintName = safeString(record?.Name);
    if (blueprintName) WIKI_BY_BLUEPRINT_NAME.set(normalizeName(blueprintName), record);
}

function lookupCatalogIdByDisplayName(displayName: string): CatalogId | null {
    const hits = FULL_CATALOG.nameIndex[normalizeName(displayName)] ?? [];
    const itemId = hits.find((id) => String(id).startsWith("items:"));
    return (itemId ?? hits[0] ?? null) as CatalogId | null;
}

function getOutputSiblingBlueprintCatalogId(outputCatalogId: CatalogId): CatalogId | null {
    const candidate = `${String(outputCatalogId)}Blueprint` as CatalogId;
    return FULL_CATALOG.recordsById[candidate] ? candidate : null;
}

function baseResultNames(resultName: string): string[] {
    const trimmed = safeString(resultName) ?? "";
    if (!trimmed) return [];

    const variants = new Set<string>([trimmed]);
    variants.add(trimmed.replace(/\s*\([^)]*\)\s*$/g, "").trim());

    return [...variants].filter(Boolean);
}

function findWikiBlueprintRecordForCatalogId(catalogId: CatalogId): WikiBlueprintRecord | null {
    const rec = FULL_CATALOG.recordsById[catalogId];
    if (!rec) return null;

    const displayName = safeString(rec.displayName) ?? "";
    const normalized = normalizeName(displayName);
    const isExplicitBlueprint = normalized.endsWith(" blueprint") || String(catalogId).toLowerCase().endsWith("blueprint");

    if (isExplicitBlueprint) {
        return (
            WIKI_BY_BLUEPRINT_NAME.get(normalized)
            ?? WIKI_BY_RESULT.get(normalizeName(displayName.replace(/\s+blueprint$/i, "")))
            ?? WIKI_BY_KEY.get(normalizeName(displayName.replace(/\s+blueprint$/i, "")))
            ?? null
        );
    }

    return WIKI_BY_RESULT.get(normalized) ?? WIKI_BY_KEY.get(normalized) ?? null;
}

function resolvePartCatalogId(part: WikiBlueprintPart, parentResultName: string): CatalogId | null {
    const rawName = safeString(part?.Name);
    if (!rawName) return null;

    const type = normalizeName(safeString(part?.Type) ?? "");
    const candidates: string[] = [];
    const parentNames = baseResultNames(parentResultName);
    const rawWithoutPrime = rawName.replace(/^Prime\s+/i, "").trim();

    if (type === "item" || type === "primepart") {
        for (const parentName of parentNames) {
            candidates.push(`${parentName} ${rawName}`);
            if (rawWithoutPrime && rawWithoutPrime !== rawName) {
                candidates.push(`${parentName} ${rawWithoutPrime}`);
            }
            candidates.push(`${parentName} ${rawName} Blueprint`);
            if (rawWithoutPrime && rawWithoutPrime !== rawName) {
                candidates.push(`${parentName} ${rawWithoutPrime} Blueprint`);
            }
        }
        candidates.push(rawName);
        if (rawWithoutPrime && rawWithoutPrime !== rawName) {
            candidates.push(rawWithoutPrime);
            candidates.push(`${rawWithoutPrime} Blueprint`);
        }
    } else {
        candidates.push(rawName);
        for (const parentName of parentNames) {
            candidates.push(`${parentName} ${rawName}`);
        }
    }

    const seen = new Set<string>();
    const deduped = candidates.filter((candidate) => {
        const key = normalizeName(candidate);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    for (const candidate of deduped) {
        const cid = lookupCatalogIdByDisplayName(candidate);
        if (cid) return cid;
    }

    return null;
}

function requirementsFromWikiRecord(
    outputCatalogId: CatalogId,
    record: WikiBlueprintRecord,
): WikiBlueprintRequirement[] {
    const parts = Array.isArray(record?.Parts) ? record.Parts : [];
    const resultName = safeString(record?.Result) ?? safeString(record?.Name)?.replace(/\s+blueprint$/i, "") ?? "";

    const out: WikiBlueprintRequirement[] = [];

    for (const part of parts) {
        const count = safeCount(part?.Count ?? 0);
        if (count <= 0) continue;

        const cid = resolvePartCatalogId(part, resultName);
        if (!cid) continue;
        if (String(cid) === String(outputCatalogId)) continue;

        out.push({ catalogId: cid, count });
    }

    return out;
}

export function getWikiBlueprintRequirements(outputCatalogId: CatalogId): WikiBlueprintRequirement[] {
    const record = findWikiBlueprintRecordForCatalogId(outputCatalogId);
    if (!record) return [];

    const rec = FULL_CATALOG.recordsById[outputCatalogId];
    const displayName = safeString(rec?.displayName) ?? "";
    const isExplicitBlueprint =
        normalizeName(displayName).endsWith(" blueprint")
        || String(outputCatalogId).toLowerCase().endsWith("blueprint");

    if (isExplicitBlueprint) {
        return requirementsFromWikiRecord(outputCatalogId, record);
    }

    const siblingBlueprint = getOutputSiblingBlueprintCatalogId(outputCatalogId);
    if (siblingBlueprint) {
        return [{ catalogId: siblingBlueprint, count: 1 }];
    }

    return requirementsFromWikiRecord(outputCatalogId, record);
}

export function getAllWikiBlueprintReferencedCatalogIds(): CatalogId[] {
    const out = new Set<CatalogId>();

    for (const record of Object.values(WIKI_BLUEPRINTS)) {
        const resultName = safeString(record?.Result) ?? "";
        const parts = Array.isArray(record?.Parts) ? record.Parts : [];

        for (const part of parts) {
            const count = safeCount(part?.Count ?? 0);
            if (count <= 0) continue;

            const cid = resolvePartCatalogId(part, resultName);
            if (!cid) continue;
            out.add(cid);
        }
    }

    return [...out].sort((a, b) => String(a).localeCompare(String(b)));
}
