import { PREREQ_REGISTRY, describePrereqCondition } from "../../catalog/prereqs/prereqRegistry";
import { SOURCE_INDEX } from "../../catalog/sources/sourceCatalog";
import { buildPrereqIndex } from "../../domain/logic/prereqEngine";
import { getAcquisitionByCatalogId } from "../../catalog/items/itemAcquisition";
import { classifySourceFamilyFromCatalog, type GroupedSourceEntry } from "./GroupedSourceList";

const PREREQ_INDEX = buildPrereqIndex(PREREQ_REGISTRY);

function titleCaseToken(token: string): string {
    return token
        .split("-")
        .filter(Boolean)
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join(" ");
}

function cleanWfItemsLocationLabel(sourceLabel: string | undefined, fallbackToken: string): string {
    const normalized = String(sourceLabel ?? "")
        .replace(/^WFItems Location(?: \(Legacy\))?:\s*/i, "")
        .replace(/^\d+[xX]\s+/i, "")
        .trim();
    return normalized || titleCaseToken(fallbackToken);
}

function describeWfItemsLocationPresentation(
    sourceId: string,
    sourceLabel?: string,
): (Pick<GroupedSourceEntry, "title" | "family"> & { preserveRequirements?: boolean }) | null {
    if (!sourceId.startsWith("data:wfitems:loc:")) return null;
    const token = sourceId.slice("data:wfitems:loc:".length);
    const body = cleanWfItemsLocationLabel(sourceLabel, token);

    const vendorLikePrefixes = [
        "Cephalon Simaris",
        "Steel Meridian",
        "The Perrin Sequence",
        "Arbiters of Hexis",
        "Arbiters",
        "Cephalon Suda",
        "New Loka",
        "Red Veil",
        "Conclave",
        "Solaris United",
        "Vox Solaris",
        "NecraLoid",
        "The Holdfasts",
        "The Quills",
        "Entrati",
        "Ostron",
        "Ventkids",
    ];

    const vendorPrefix = vendorLikePrefixes.find((prefix) => body.startsWith(`${prefix},`));
    if (vendorPrefix) {
        const suffix = body.slice(vendorPrefix.length + 1).trim();
        return {
            title: suffix ? `Vendor: ${vendorPrefix} (${suffix})` : `Vendor: ${vendorPrefix}`,
            family: "vendor",
            preserveRequirements: true,
        };
    }

    if (/^eidolon-(teralyst|gantulyst|hydrolyst)$/.test(token)) {
        return {
            title: `Activity: ${titleCaseToken(token)} Hunt`,
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (/^sister-of-parvos-ascension-(hard-)?mode$/.test(token)) {
        return {
            title: token.includes("hard")
                ? "Activity: Ascension (Sister of Parvos, Hard Mode)"
                : "Activity: Ascension (Sister of Parvos)",
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (token === "operation-orphix-venom") {
        return {
            title: "Activity: Operation Orphix Venom",
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (token === "profittaker") {
        return {
            title: "Activity: Profit-Taker Orb",
            family: "activity",
            preserveRequirements: true,
        };
    }

    if ([
        "kela-de-thaym",
        "jackal",
        "councilor-vay-hek",
        "vay-hek-terra-frame",
        "corrupted-vor",
        "phorid",
        "ambulas",
        "terra-ambulas",
        "kavat",
        "kubrow",
        "hyekka",
        "kuva-hyekka",
        "drahk",
        "kuva-drahk",
    ].includes(token) || /^hyena-(ln2|ng|pb|th)$/.test(token)) {
        return {
            title: `Enemy: ${titleCaseToken(token)}`,
            family: "enemy",
            preserveRequirements: true,
        };
    }

    if (token.includes("rotation-")) {
        const rotationMatch = body.match(/^(.*?),\s*Rotation\s*([A-Z])$/i);
        return {
            title: rotationMatch
                ? `Mission: ${rotationMatch[1]} (Rotation ${rotationMatch[2].toUpperCase()})`
                : `Mission: ${titleCaseToken(token.replace(/-rotation-([abc])$/, ""))} (Rotation ${token.slice(-1).toUpperCase()})`,
            family: /Arbitrations|Nightmare Mode|Duviri|Sanctuary|Ascension/i.test(body) ? "activity" : "mission",
            preserveRequirements: true,
        };
    }

    if (token.includes("storage-container") || token.includes("carrypod")) {
        return {
            title: `Container: ${titleCaseToken(token)}`,
            family: "cache",
            preserveRequirements: false,
        };
    }

    if (token.endsWith("-enemies") || token.endsWith("-enemy")) {
        return {
            title: `Area: ${body}`,
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (/^(Arbitrations|Nightmare Mode Rewards|Nightmare Mode Rescue|Elite Sanctuary Onslaught|Sanctuary Onslaught|Duviri .*|Kullervo's Hold|The Circuit|Profit-Taker|Exploiter Orb)/i.test(body)) {
        return {
            title: `Activity: ${body}`,
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (token.includes("specter")) {
        return {
            title: `Enemy: ${body}`,
            family: "enemy",
            preserveRequirements: true,
        };
    }

    return {
        title: `Enemy: ${body}`,
        family: "enemy",
        preserveRequirements: true,
    };
}

type RequirementDescriptor = {
    label: string;
    key: string;
};

function appendRequirement(
    out: RequirementDescriptor[],
    seen: Set<string>,
    label: string,
    key?: string,
) {
    const normalizedLabel = String(label ?? "").trim();
    if (!normalizedLabel) return;
    const dedupeKey = key ?? normalizedLabel;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    out.push({ label: normalizedLabel, key: dedupeKey });
}

function describePrereqRequirements(prereqId: string): RequirementDescriptor[] {
    if (!prereqId) return [];
    const def = PREREQ_INDEX[prereqId];
    if (!def) return [{ label: prereqId, key: prereqId }];

    const out: RequirementDescriptor[] = [];
    const seen = new Set<string>();

    appendRequirement(out, seen, def.label, def.id);

    if (Array.isArray(def.conditions) && def.conditions.length > 0) {
        for (const condition of def.conditions) {
            appendRequirement(
                out,
                seen,
                describePrereqCondition(condition, (id) => PREREQ_INDEX[id]?.label ?? id),
            );
        }
    }

    return out;
}

export function buildCatalogSourceEntries(catalogId: string | undefined): GroupedSourceEntry[] {
    if (!catalogId) return [];

    const acquisition = getAcquisitionByCatalogId(catalogId as `items:${string}`);
    const sourceIdsRaw = Array.isArray(acquisition?.sources) ? acquisition.sources : [];
    const sourceIdSet = new Set(sourceIdsRaw);
    const hasNonWfItemsLocationSource = sourceIdsRaw.some((sourceId) => !sourceId.startsWith("data:wfitems:loc:"));
    const sourceIds = sourceIdsRaw.filter((sourceId) => {
        if (sourceId.startsWith("data:wfitems:loc:") && hasNonWfItemsLocationSource) return false;
        if (!sourceId.startsWith("data:drop:node:")) return true;
        const normalizedNodeId = `data:node/${sourceId.slice("data:drop:node:".length).replace(/:/g, "/")}`;
        return !sourceIdSet.has(normalizedNodeId);
    });

    const entries = sourceIds.map((sourceId) => {
        const source = SOURCE_INDEX[sourceId as keyof typeof SOURCE_INDEX];
        const presentationOverride = describeWfItemsLocationPresentation(sourceId, source?.label);
        const title = presentationOverride?.title ?? source?.label ?? sourceId;
        const requirements = presentationOverride?.preserveRequirements !== false && Array.isArray(source?.prereqIds)
            ? Array.from(
                new Map(
                    source.prereqIds
                        .flatMap((prereqId) => describePrereqRequirements(prereqId))
                        .map((descriptor) => [descriptor.key, descriptor.label] as const),
                ).values(),
            )
            : [];

        return {
            id: sourceId,
            family: presentationOverride?.family ?? classifySourceFamilyFromCatalog(sourceId, title),
            title,
            subtitle: requirements.length > 0 ? `Requires: ${requirements.join(" · ")}` : undefined,
        };
    });

    return Array.from(
        new Map(entries.map((entry) => [`${entry.family}::${entry.title}::${entry.subtitle ?? ""}`, entry] as const)).values(),
    );
}
