import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { FULL_CATALOG, type CatalogId } from "../src/domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../src/catalog/items/itemAcquisition";
import { MANUAL_ACQUISITION_BY_CATALOG_ID } from "../src/catalog/items/manualAcquisitionByCatalogId";

import WARFRAME_ITEMS_ALL from "../src/data/_generated/warframe-items-all-lean.auto.json";
import blueprintLocationsJson from "../external/warframe-drop-data/raw/blueprintLocations.json";
import enemyBlueprintTablesJson from "../external/warframe-drop-data/raw/enemyBlueprintTables.json";
import syndicatesJson from "../external/warframe-drop-data/raw/syndicates.json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MARKDOWN_OUTPUT = path.join(ROOT, "UNKNOWN_SOURCE_AUDIT.md");
const JSON_OUTPUT = path.join(ROOT, "src/data/_generated/unknown-source-audit.auto.json");

const BLUEPRINT_UNCLASSIFIED = "data:blueprint/unclassified";

type CatalogRecord = {
    displayName?: string;
    name?: string;
    path?: string;
    raw?: {
        rawLotus?: {
            data?: {
                resultItemType?: string;
            };
        };
    };
};

type SourceEvidence = {
    count: number;
    samples: string[];
};

type AuditRow = {
    catalogId: string;
    displayName: string;
    path: string;
    bucket: string;
    candidateNames: string[];
    evidence: {
        warframeDrops: SourceEvidence;
        blueprintTables: SourceEvidence;
        syndicates: SourceEvidence;
    };
    likelyFixPath: string;
};

type JsonReport = {
    generatedAt: string;
    summary: {
        catalogCount: number;
        displayableCount: number;
        withAcquisition: number;
        withoutAcquisition: number;
        displayableWithoutAcquisition: number;
        placeholderBlueprints: number;
        zeroSourceDisplayableRecipes: number;
        coarseManualMappings: number;
    };
    placeholderBlueprints: {
        byBucket: Array<{ bucket: string; count: number }>;
        byLikelyFixPath: Array<{ likelyFixPath: string; count: number }>;
        rows: AuditRow[];
    };
    zeroSourceDisplayableRecipes: Array<{
        catalogId: string;
        displayName: string;
        path: string;
        siblingBlueprintCatalogId: string | null;
    }>;
    displayableWithoutAcquisition: {
        byPrefix: Array<{ prefix: string; count: number }>;
        samples: Array<{ catalogId: string; displayName: string; path: string }>;
    };
    coarseManualMappings: Array<{ catalogId: string; sources: string[] }>;
};

function normalizeSpaces(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function foldDiacritics(value: string): string {
    return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(value: string): string {
    return normalizeSpaces(foldDiacritics(value)).toLowerCase();
}

function normalizeNameNoPunct(value: string): string {
    return normalizeName(value).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function trimSamples(values: Iterable<string>, limit = 5): string[] {
    return Array.from(values).slice(0, limit);
}

function recordFor(catalogId: string): CatalogRecord | null {
    return ((FULL_CATALOG as any).recordsById?.[catalogId] as CatalogRecord | undefined) ?? null;
}

function displayNameFor(catalogId: string): string {
    const rec = recordFor(catalogId);
    return String(rec?.displayName ?? rec?.name ?? rec?.path ?? catalogId);
}

function pathFor(catalogId: string): string {
    const rec = recordFor(catalogId);
    return String(rec?.path ?? catalogId);
}

function bucketForPath(itemPath: string): string {
    const parts = itemPath.split("/").filter(Boolean);
    return parts.length === 0 ? itemPath : `/${parts.slice(0, 4).join("/")}`;
}

function humanizeLotusPathTail(itemPath: string): string {
    const tail = String(itemPath ?? "").split("/").filter(Boolean).pop() ?? "";
    if (!tail) return "";

    return normalizeSpaces(
        tail
            .replace(/[_-]+/g, " ")
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    );
}

function buildCandidateNames(catalogId: string): string[] {
    const rec = recordFor(catalogId);
    const out: string[] = [];

    const displayName = normalizeSpaces(String(rec?.displayName ?? ""));
    if (displayName && !displayName.startsWith("/Lotus/")) out.push(displayName);

    const rawName = normalizeSpaces(String(rec?.name ?? ""));
    if (rawName && !rawName.startsWith("/Lotus/")) out.push(rawName);

    const itemPath = pathFor(catalogId);
    const humanizedTail = humanizeLotusPathTail(itemPath);
    if (humanizedTail) out.push(humanizedTail);

    const humanizedTailNoBp = normalizeSpaces(humanizedTail.replace(/\bBlueprint\b/i, "").trim());
    if (humanizedTailNoBp) out.push(humanizedTailNoBp);

    const resultItemType = rec?.raw?.rawLotus?.data?.resultItemType;
    if (typeof resultItemType === "string" && resultItemType.length > 0) {
        const resultCatalogId = `items:${resultItemType}` as CatalogId;
        const resultDisplayName = normalizeSpaces(displayNameFor(resultCatalogId));
        if (resultDisplayName && !resultDisplayName.startsWith("/Lotus/")) {
            if (resultDisplayName.toLowerCase().endsWith(" blueprint")) {
                out.push(resultDisplayName);
            } else {
                out.push(`${resultDisplayName} Blueprint`);
            }
        }
    }

    return uniqueStrings(out);
}

function isBlueprintLike(catalogId: string, displayName: string): boolean {
    return catalogId.includes("Blueprint") || displayName.toLowerCase().endsWith(" blueprint");
}

function buildWarframeDropTypeEvidence(): Map<string, Set<string>> {
    const evidence = new Map<string, Set<string>>();
    const stack: unknown[] = [WARFRAME_ITEMS_ALL as unknown];

    while (stack.length > 0) {
        const current = stack.pop();
        if (Array.isArray(current)) {
            for (const value of current) stack.push(value);
            continue;
        }
        if (!current || typeof current !== "object") continue;

        const obj = current as Record<string, unknown>;
        const holderName = normalizeSpaces(String(obj.name ?? obj.uniqueName ?? ""));

        const drops = Array.isArray(obj.drops) ? obj.drops : [];
        for (const drop of drops) {
            if (!drop || typeof drop !== "object") continue;
            const typed = drop as Record<string, unknown>;
            const dropType = normalizeSpaces(String(typed.type ?? ""));
            if (!dropType) continue;
            const key = normalizeNameNoPunct(dropType);
            if (!key) continue;
            const location = normalizeSpaces(String(typed.location ?? ""));
            const sample = holderName && location ? `${dropType} <- ${holderName} @ ${location}` : dropType;
            if (!evidence.has(key)) evidence.set(key, new Set<string>());
            evidence.get(key)!.add(sample);
        }

        for (const value of Object.values(obj)) {
            if (value && typeof value === "object") stack.push(value);
        }
    }

    return evidence;
}

function buildBlueprintTableEvidence(): Map<string, Set<string>> {
    const evidence = new Map<string, Set<string>>();

    const blueprintRows = Array.isArray((blueprintLocationsJson as any)?.blueprintLocations)
        ? (blueprintLocationsJson as any).blueprintLocations
        : Array.isArray(blueprintLocationsJson)
          ? blueprintLocationsJson
          : [];
    for (const row of blueprintRows as Array<Record<string, unknown>>) {
        const blueprintName = normalizeSpaces(String(row.blueprintName ?? row.itemName ?? ""));
        if (!blueprintName) continue;
        const key = normalizeNameNoPunct(blueprintName);
        if (!key) continue;
        const enemySamples = Array.isArray(row.enemies)
            ? row.enemies
                .map((enemy) => normalizeSpaces(String((enemy as Record<string, unknown>)?.enemyName ?? "")))
                .filter(Boolean)
            : [];
        const sample = enemySamples.length > 0
            ? `${blueprintName} <- ${enemySamples.slice(0, 3).join(", ")}`
            : blueprintName;
        if (!evidence.has(key)) evidence.set(key, new Set<string>());
        evidence.get(key)!.add(sample);
    }

    const enemyRows = Array.isArray((enemyBlueprintTablesJson as any)?.enemyBlueprintTables)
        ? (enemyBlueprintTablesJson as any).enemyBlueprintTables
        : Array.isArray(enemyBlueprintTablesJson)
          ? enemyBlueprintTablesJson
          : [];
    for (const row of enemyRows as Array<Record<string, unknown>>) {
        const enemyName = normalizeSpaces(String(row.enemyName ?? ""));
        const items = Array.isArray(row.items) ? row.items : [];
        for (const item of items) {
            if (!item || typeof item !== "object") continue;
            const typed = item as Record<string, unknown>;
            const blueprintName = normalizeSpaces(String(typed.blueprintName ?? typed.itemName ?? ""));
            if (!blueprintName) continue;
            const key = normalizeNameNoPunct(blueprintName);
            if (!key) continue;
            const sample = enemyName ? `${blueprintName} <- ${enemyName}` : blueprintName;
            if (!evidence.has(key)) evidence.set(key, new Set<string>());
            evidence.get(key)!.add(sample);
        }
    }

    return evidence;
}

function buildSyndicateEvidence(): Map<string, Set<string>> {
    const evidence = new Map<string, Set<string>>();
    const root = (syndicatesJson as any)?.syndicates ?? syndicatesJson;

    for (const [syndicateName, entries] of Object.entries(root as Record<string, unknown>)) {
        if (!Array.isArray(entries)) continue;
        for (const entry of entries) {
            if (!entry || typeof entry !== "object") continue;
            const typed = entry as Record<string, unknown>;
            const itemName = normalizeSpaces(String(typed.item ?? ""));
            if (!itemName) continue;
            const key = normalizeNameNoPunct(itemName);
            if (!key) continue;
            const place = normalizeSpaces(String(typed.place ?? ""));
            const sample = place
                ? `${itemName} <- Syndicate Vendor: ${syndicateName} (${place})`
                : `${itemName} <- Syndicate Vendor: ${syndicateName}`;
            if (!evidence.has(key)) evidence.set(key, new Set<string>());
            evidence.get(key)!.add(sample);
        }
    }

    return evidence;
}

function summarizeEvidence(
    candidateNames: string[],
    evidenceByName: Map<string, Set<string>>,
): SourceEvidence {
    const merged = new Set<string>();
    for (const candidateName of candidateNames) {
        const key = normalizeNameNoPunct(candidateName);
        for (const sample of evidenceByName.get(key) ?? []) merged.add(sample);
    }

    return {
        count: merged.size,
        samples: trimSamples(merged),
    };
}

function likelyFixPathFor(row: Omit<AuditRow, "likelyFixPath">): string {
    if (row.evidence.syndicates.count > 0) return "syndicates-name-join";
    if (row.evidence.blueprintTables.count > 0) return "drop-data-blueprint-tables";
    if (row.evidence.warframeDrops.count > 0) return "warframe-items-drop-type-join";
    return "manual-or-new-source";
}

function collectPlaceholderBlueprintRows(): AuditRow[] {
    const warframeDropEvidence = buildWarframeDropTypeEvidence();
    const blueprintTableEvidence = buildBlueprintTableEvidence();
    const syndicateEvidence = buildSyndicateEvidence();

    const rows: AuditRow[] = [];

    for (const catalogId of Object.keys((FULL_CATALOG as any).recordsById ?? {})) {
        const sources = getAcquisitionByCatalogId(catalogId as CatalogId)?.sources ?? [];
        if (!sources.includes(BLUEPRINT_UNCLASSIFIED)) continue;

        const displayName = displayNameFor(catalogId);
        if (!isBlueprintLike(catalogId, displayName)) continue;

        const candidateNames = buildCandidateNames(catalogId);
        const rowBase = {
            catalogId,
            displayName,
            path: pathFor(catalogId),
            bucket: bucketForPath(pathFor(catalogId)),
            candidateNames,
            evidence: {
                warframeDrops: summarizeEvidence(candidateNames, warframeDropEvidence),
                blueprintTables: summarizeEvidence(candidateNames, blueprintTableEvidence),
                syndicates: summarizeEvidence(candidateNames, syndicateEvidence),
            },
        };

        rows.push({
            ...rowBase,
            likelyFixPath: likelyFixPathFor(rowBase),
        });
    }

    rows.sort((a, b) => a.path.localeCompare(b.path));
    return rows;
}

function collectZeroSourceDisplayableRecipes(): Array<{
    catalogId: string;
    displayName: string;
    path: string;
    siblingBlueprintCatalogId: string | null;
}> {
    const rows: Array<{
        catalogId: string;
        displayName: string;
        path: string;
        siblingBlueprintCatalogId: string | null;
    }> = [];

    for (const catalogId of FULL_CATALOG.displayableItemIds as CatalogId[]) {
        const sources = getAcquisitionByCatalogId(catalogId)?.sources ?? [];
        if (sources.length > 0) continue;

        const itemPath = pathFor(String(catalogId));
        if (!itemPath.includes("/Types/Recipes/")) continue;

        const siblingBlueprintCatalogId = String(catalogId).includes("Blueprint")
            ? null
            : ((FULL_CATALOG as any).recordsById?.[`${catalogId}Blueprint`] ? `${catalogId}Blueprint` : null);

        rows.push({
            catalogId: String(catalogId),
            displayName: displayNameFor(String(catalogId)),
            path: itemPath,
            siblingBlueprintCatalogId,
        });
    }

    rows.sort((a, b) => a.path.localeCompare(b.path));
    return rows;
}

function collectDisplayableWithoutAcquisition(): {
    byPrefix: Array<{ prefix: string; count: number }>;
    samples: Array<{ catalogId: string; displayName: string; path: string }>;
} {
    const prefixCounts = new Map<string, number>();
    const samples: Array<{ catalogId: string; displayName: string; path: string }> = [];

    for (const catalogId of FULL_CATALOG.displayableItemIds as CatalogId[]) {
        const sources = getAcquisitionByCatalogId(catalogId)?.sources ?? [];
        if (sources.length > 0) continue;

        const itemPath = pathFor(String(catalogId));
        const prefix = bucketForPath(itemPath);
        prefixCounts.set(prefix, (prefixCounts.get(prefix) ?? 0) + 1);

        if (samples.length < 150) {
            samples.push({
                catalogId: String(catalogId),
                displayName: displayNameFor(String(catalogId)),
                path: itemPath,
            });
        }
    }

    return {
        byPrefix: Array.from(prefixCounts.entries())
            .map(([prefix, count]) => ({ prefix, count }))
            .sort((a, b) => b.count - a.count || a.prefix.localeCompare(b.prefix)),
        samples,
    };
}

function collectCoarseManualMappings(): Array<{ catalogId: string; sources: string[] }> {
    return Object.entries(MANUAL_ACQUISITION_BY_CATALOG_ID)
        .filter(([_, sources]) => sources.some((source) => source.startsWith("data:activity/")))
        .map(([catalogId, sources]) => ({ catalogId, sources: [...sources] }))
        .sort((a, b) => a.catalogId.localeCompare(b.catalogId));
}

function countCatalogWithAcquisition(): number {
    let count = 0;
    for (const catalogId of Object.keys((FULL_CATALOG as any).recordsById ?? {})) {
        if ((getAcquisitionByCatalogId(catalogId as CatalogId)?.sources?.length ?? 0) > 0) count++;
    }
    return count;
}

function countDisplayableWithoutAcquisition(): number {
    let count = 0;
    for (const catalogId of FULL_CATALOG.displayableItemIds as CatalogId[]) {
        if ((getAcquisitionByCatalogId(catalogId)?.sources?.length ?? 0) === 0) count++;
    }
    return count;
}

function groupCounts(values: string[]): Array<{ value: string; count: number }> {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function renderTable(rows: string[][]): string {
    if (rows.length === 0) return "";
    const [header, ...body] = rows;
    const separator = header.map(() => "---");
    return [header, separator, ...body]
        .map((row) => `| ${row.join(" | ")} |`)
        .join("\n");
}

function renderMarkdown(report: JsonReport): string {
    const placeholderByBucketRows = renderTable([
        ["Bucket", "Count"],
        ...report.placeholderBlueprints.byBucket.slice(0, 20).map(({ bucket, count }) => [bucket, String(count)]),
    ]);

    const placeholderByFixRows = renderTable([
        ["Likely Fix Path", "Count"],
        ...report.placeholderBlueprints.byLikelyFixPath.map(({ likelyFixPath, count }) => [likelyFixPath, String(count)]),
    ]);

    const recipeGapRows = renderTable([
        ["CatalogId", "Display Name", "Sibling Blueprint"],
        ...report.zeroSourceDisplayableRecipes.slice(0, 40).map((row) => [
            `\`${row.catalogId}\``,
            row.displayName,
            row.siblingBlueprintCatalogId ? `\`${row.siblingBlueprintCatalogId}\`` : "",
        ]),
    ]);

    const topDisplayableGapRows = renderTable([
        ["Displayable No-Acq Prefix", "Count"],
        ...report.displayableWithoutAcquisition.byPrefix.slice(0, 20).map(({ prefix, count }) => [prefix, String(count)]),
    ]);

    const blueprintExamples = report.placeholderBlueprints.rows.slice(0, 25).map((row) => {
        const evidenceParts = [
            row.evidence.warframeDrops.count > 0 ? `warframe-items drops: ${row.evidence.warframeDrops.count}` : null,
            row.evidence.blueprintTables.count > 0 ? `drop-data tables: ${row.evidence.blueprintTables.count}` : null,
            row.evidence.syndicates.count > 0 ? `syndicates: ${row.evidence.syndicates.count}` : null,
        ].filter(Boolean);
        const evidence = evidenceParts.length > 0 ? evidenceParts.join(", ") : "no current raw evidence";
        return `- \`${row.catalogId}\` (${row.displayName}) -> ${row.likelyFixPath}; ${evidence}`;
    }).join("\n");

    const coarseManualRows = report.coarseManualMappings
        .slice(0, 30)
        .map((row) => `- \`${row.catalogId}\` -> ${row.sources.join(", ")}`)
        .join("\n");

    return [
        "# Unknown Source Audit",
        "",
        `Generated: ${report.generatedAt}`,
        "",
        "## Summary",
        "",
        `- Catalog records: ${report.summary.catalogCount}`,
        `- Catalog records with acquisition: ${report.summary.withAcquisition}`,
        `- Catalog records without acquisition: ${report.summary.withoutAcquisition}`,
        `- Displayable records: ${report.summary.displayableCount}`,
        `- Displayable records without acquisition: ${report.summary.displayableWithoutAcquisition}`,
        `- Placeholder blueprint records (\`${BLUEPRINT_UNCLASSIFIED}\`): ${report.summary.placeholderBlueprints}`,
        `- Displayable recipe/component records with zero acquisition: ${report.summary.zeroSourceDisplayableRecipes}`,
        `- Manual coarse activity/vendor mappings still in place: ${report.summary.coarseManualMappings}`,
        "",
        "## Placeholder Blueprint Buckets",
        "",
        placeholderByBucketRows,
        "",
        "## Placeholder Blueprint Likely Fix Paths",
        "",
        placeholderByFixRows,
        "",
        "Interpretation:",
        "- `warframe-items-drop-type-join`: the blueprint name already appears in `warframe-items` drop `type` fields, so the derivation layer should be able to assign a real source from those locations.",
        "- `drop-data-blueprint-tables`: the blueprint already exists in `blueprintLocations.json` or `enemyBlueprintTables.json`, so the join is probably failing or incomplete.",
        "- `syndicates-name-join`: the blueprint name exists in `syndicates.json` but is not currently mapped to the catalog record.",
        "- `manual-or-new-source`: current raw datasets do not expose an obvious matching source string for the catalog record, so this likely needs a manual mapping or a new importer/source family.",
        "",
        "## Placeholder Blueprint Examples",
        "",
        blueprintExamples,
        "",
        "## Zero-Source Displayable Recipe/Component Records",
        "",
        recipeGapRows,
        "",
        "These are displayable `/Types/Recipes/` records that still return no acquisition at all. They are a separate gap from placeholder blueprints and are good candidates for recipe-output or sibling-blueprint inheritance fixes.",
        "",
        "## Displayable No-Acquisition Prefixes",
        "",
        topDisplayableGapRows,
        "",
        "Most of the remaining displayable no-acquisition population is cosmetics, glyphs, decorations, enemy avatars, and other non-progression records. The `displayableWithoutAcquisition.byPrefix` section in the JSON output keeps the full distribution if we want to carve those down later.",
        "",
        "## Manual Coarse Mappings",
        "",
        coarseManualRows,
        "",
    ].join("\n");
}

async function main(): Promise<void> {
    const placeholderBlueprintRows = collectPlaceholderBlueprintRows();
    const zeroSourceDisplayableRecipes = collectZeroSourceDisplayableRecipes();
    const displayableWithoutAcquisition = collectDisplayableWithoutAcquisition();
    const coarseManualMappings = collectCoarseManualMappings();

    const withAcquisition = countCatalogWithAcquisition();
    const withoutAcquisition = Object.keys((FULL_CATALOG as any).recordsById ?? {}).length - withAcquisition;
    const displayableWithoutAcquisitionCount = countDisplayableWithoutAcquisition();

    const byBucket = groupCounts(placeholderBlueprintRows.map((row) => row.bucket)).map(({ value, count }) => ({
        bucket: value,
        count,
    }));
    const byLikelyFixPath = groupCounts(placeholderBlueprintRows.map((row) => row.likelyFixPath)).map(({ value, count }) => ({
        likelyFixPath: value,
        count,
    }));

    const report: JsonReport = {
        generatedAt: new Date().toISOString(),
        summary: {
            catalogCount: Object.keys((FULL_CATALOG as any).recordsById ?? {}).length,
            displayableCount: FULL_CATALOG.displayableItemIds.length,
            withAcquisition,
            withoutAcquisition,
            displayableWithoutAcquisition: displayableWithoutAcquisitionCount,
            placeholderBlueprints: placeholderBlueprintRows.length,
            zeroSourceDisplayableRecipes: zeroSourceDisplayableRecipes.length,
            coarseManualMappings: coarseManualMappings.length,
        },
        placeholderBlueprints: {
            byBucket,
            byLikelyFixPath,
            rows: placeholderBlueprintRows,
        },
        zeroSourceDisplayableRecipes,
        displayableWithoutAcquisition,
        coarseManualMappings,
    };

    await writeFile(JSON_OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
    await writeFile(MARKDOWN_OUTPUT, `${renderMarkdown(report)}\n`, "utf-8");

    console.log(
        JSON.stringify(
            {
                markdownOutput: path.relative(ROOT, MARKDOWN_OUTPUT),
                jsonOutput: path.relative(ROOT, JSON_OUTPUT),
                summary: report.summary,
            },
            null,
            2,
        ),
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
