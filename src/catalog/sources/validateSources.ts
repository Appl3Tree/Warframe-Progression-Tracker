// ===== FILE: src/catalog/sources/validateSources.ts =====

import { SOURCE_CATALOG, SOURCE_INDEX } from "./sourceCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../items/itemAcquisition";

type ValidationIssue = {
    code: string;
    sourceId: string;
    message: string;
};

const CURATED_DOMAIN_PREFIXES = [
    "data:vendor",
    "data:market",
    "data:dojo",
    "data:quest",
    "data:nightwave",
    "data:invasion",
    "data:baro",
    "data:events",
    "data:pets",
    "data:lich",
    "data:duviri",
    "data:abyssal-zone",
    "data:arbitrations",
    "data:system",
];

function inCuratedDomain(id: string): boolean {
    return CURATED_DOMAIN_PREFIXES.some((p) => id === p || id.startsWith(p + "/"));
}

function isParentBucket(all: string[], id: string): boolean {
    return all.some((x) => x !== id && x.startsWith(id + "/"));
}

/**
 * “Actionable” means the source describes an acquisition action the player can perform.
 * This is intentionally conservative; adjust tokens as you harden taxonomy.
 */
function isActionableLabel(label: string): boolean {
    const t = label.toLowerCase();

    // Verbs / actions
    const actionTokens = [
        "buy",
        "purchase",
        "shop",
        "vendor",
        "research",
        "replicate",
        "craft",
        "farm",
        "drop",
        "mission",
        "bounty",
        "quest",
        "reward",
        "earn",
        "trade",
        "baro",
        "nightwave",
        "invasion",
        "event",
        "incub",
        "synth",
        "scan",
        "helminth",
        "starter",
        "ducat",
        "arbitration",
        "duviri",
        "lich",
        "sister",
        "teshin",
        "simaris",
    ];

    return actionTokens.some((x) => t.includes(x));
}

/**
 * These are “concept buckets” that you do NOT want used as leaf acquisition actions.
 * If you keep these source IDs, they should only exist as taxonomy and never appear in item sources.
 */
function isClearlyNonActionableId(sourceId: string): boolean {
    return (
        sourceId === "data:pets/kavat" ||
        sourceId === "data:pets/kubrow" ||
        sourceId === "data:pets/helminth-charger"
    );
}

export function validateSources(): { issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    const curatedIdsAll = SOURCE_CATALOG.map((s) => s.id);
    const curatedIds = curatedIdsAll.filter(inCuratedDomain);

    // 1) Curated sources must exist in SOURCE_INDEX
    for (const sid of curatedIds) {
        if (!SOURCE_INDEX[sid]) {
            issues.push({
                code: "curated_missing_from_index",
                sourceId: sid,
                message: "Curated source exists in SOURCE_CATALOG but not in SOURCE_INDEX.",
            });
        }
    }

    // 2) Parent buckets may exist, but should not be “actionable”
    //    (They are taxonomy, not acquisition steps)
    const parents = curatedIds.filter((sid) => isParentBucket(curatedIds, sid));
    for (const sid of parents) {
        const label = SOURCE_INDEX[sid]?.label ?? "";
        if (label && isActionableLabel(label)) {
            issues.push({
                code: "parent_bucket_looks_actionable",
                sourceId: sid,
                message: `Parent bucket label looks like an action; parent buckets should be taxonomy only. label="${label}"`,
            });
        }
    }

    // 3) Leaf sources should have actionable labels
    const parentSet = new Set(parents);
    const leaves = curatedIds.filter((sid) => !parentSet.has(sid));
    for (const sid of leaves) {
        const label = SOURCE_INDEX[sid]?.label ?? "";
        if (!label) continue;

        if (!isActionableLabel(label)) {
            issues.push({
                code: "leaf_not_actionable",
                sourceId: sid,
                message: `Leaf source label does not look like an acquisition action. label="${label}"`,
            });
        }
    }

    // 4) No item may ever resolve to a parent bucket, or to an explicitly-non-actionable leaf
    const forbiddenUsed: Array<{ sid: string; exampleCid: string }> = [];
    const used = new Map<string, number>();

    for (const cid of FULL_CATALOG.itemIds as string[]) {
        const def = getAcquisitionByCatalogId(cid as any);
        const srcs = (def as any)?.sources as string[] | undefined;
        for (const sid of srcs ?? []) {
            used.set(sid, (used.get(sid) ?? 0) + 1);

            if (parentSet.has(sid) || isClearlyNonActionableId(sid)) {
                if (forbiddenUsed.length < 25) forbiddenUsed.push({ sid, exampleCid: cid });
            }
        }
    }

    for (const f of forbiddenUsed) {
        issues.push({
            code: "forbidden_source_used_by_item",
            sourceId: f.sid,
            message: `Forbidden source is referenced by computed acquisition. exampleCatalogId="${f.exampleCid}"`,
        });
    }

    // 5) Unused curated leaves: allow, but surface them clearly (you decide whether to delete or fill)
    for (const sid of leaves) {
        const count = used.get(sid) ?? 0;
        if (count === 0) {
            issues.push({
                code: "curated_leaf_unused",
                sourceId: sid,
                message: "Curated leaf source is unused by computed acquisition.",
            });
        }
    }

    return { issues };
}

export function runSourceValidationOrThrow(): void {
    const { issues } = validateSources();

    const errors = issues.filter(
        (i) =>
            i.code === "curated_missing_from_index" ||
            i.code === "parent_bucket_looks_actionable" ||
            i.code === "leaf_not_actionable" ||
            i.code === "forbidden_source_used_by_item"
    );

    const warnings = issues.filter((i) => !errors.includes(i));

    if (warnings.length) {
        console.log("[source-validation] warnings:", warnings.length);
        for (const w of warnings) {
            console.log(`WARN ${w.code}  ${w.sourceId}  ${w.message}`);
        }
    }

    if (errors.length) {
        console.log("[source-validation] errors:", errors.length);
        for (const e of errors) {
            console.log(`ERR  ${e.code}  ${e.sourceId}  ${e.message}`);
        }
        throw new Error("Source validation failed.");
    }

    console.log("[source-validation] OK");
}
