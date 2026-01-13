// ===== FILE: src/catalog/sources/sourceCatalog.ts =====
// src/catalog/sources/sourceCatalog.ts

import { normalizeSourceId, type SourceId } from "../../domain/ids/sourceIds";
import wfcdSourceLabels from "../../data/_generated/wfcd-source-label-map.auto.json";

export type Source = {
    id: SourceId;
    label: string;
    type: "drop" | "crafting" | "vendor" | "other";
    prereqIds?: string[];
};

export type RawSource = {
    id: string;
    label: string;
    type?: Source["type"];
    prereqIds?: string[];
};

/**
 * Curated non-drop sources.
 * IDs MUST conform to normalizeSourceId().
 */
const CURATED_SOURCES: RawSource[] = [
    {
        // Keep as data:* since your app is already using data:drop:* as a first-class namespace.
        id: "data:crafting",
        label: "Crafting (Foundry)",
        type: "crafting"
    }
];

/**
 * WFCD-derived drop sources.
 */
function buildDropSources(): RawSource[] {
    const out: RawSource[] = [];

    for (const [sid, label] of Object.entries(wfcdSourceLabels as Record<string, string>)) {
        out.push({
            id: sid,
            label,
            type: "drop"
        });
    }

    return out;
}

export const SOURCE_CATALOG: RawSource[] = [
    ...CURATED_SOURCES,
    ...buildDropSources()
];

export const SOURCE_INDEX: Record<SourceId, Source> = (() => {
    const index = {} as Record<SourceId, Source>;

    for (const raw of SOURCE_CATALOG) {
        const id = normalizeSourceId(raw.id);

        if (index[id]) {
            throw new Error(`Duplicate SourceId detected: ${id}`);
        }

        index[id] = {
            id,
            label: raw.label,
            type: raw.type ?? "other",
            prereqIds: raw.prereqIds
        };
    }

    return index;
})();

export const SOURCES: Source[] = Object.values(SOURCE_INDEX);

