// src/catalog/sources/sourceData.ts
//
// Loads and normalizes src/data/sources.json into:
// - a list of unique source labels
// - stable SourceIds for each source label
//
// Important:
// - This does not attempt to “understand” sources (planet, node, vendor).
// - It only provides a stable ID + label so the UI can show it and the engine can treat it as known.
//
// Stability rule:
// - Prefer the generated mapping (src/data/_generated/source-label-map.auto.json) when present.
// - Fall back to deterministic slugification only if the label is missing from the map.

import sourcesText from "../../data/sources.json?raw";
import labelMapText from "../../data/_generated/source-label-map.auto.json?raw";

export type RawSourceEntry = {
    source?: string;
    chance?: number;
    rarity?: string;
};

export type RawSourcesMap = Record<string, RawSourceEntry[]>;

type LabelMapFile = {
    byLabel?: Record<string, string>;
    defaults?: { fallbackSourceId?: string };
};

function loadJsonLoose(text: unknown): unknown {
    try {
        if (typeof text === "string") return JSON.parse(text) as unknown;
        return text as unknown;
    } catch {
        return null;
    }
}

function parseSources(): RawSourcesMap {
    const parsed = loadJsonLoose(sourcesText);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
    }

    return parsed as RawSourcesMap;
}

function parseLabelMap(): LabelMapFile {
    const parsed = loadJsonLoose(labelMapText);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { byLabel: {}, defaults: { fallbackSourceId: "data:unknown" } };
    }

    const v = parsed as LabelMapFile;
    return {
        byLabel: v.byLabel && typeof v.byLabel === "object" ? v.byLabel : {},
        defaults: v.defaults ?? { fallbackSourceId: "data:unknown" }
    };
}

export const RAW_SOURCES_MAP: RawSourcesMap = parseSources();

const LABEL_MAP: LabelMapFile = parseLabelMap();
const BY_LABEL: Record<string, string> = LABEL_MAP.byLabel ?? {};
const FALLBACK_SOURCE_ID: string = LABEL_MAP.defaults?.fallbackSourceId ?? "data:unknown";

function normalizeLabel(s: unknown): string {
    const v = typeof s === "string" ? s.trim() : "";
    return v;
}

function slugify(s: string): string {
    // Stable, readable, filesystem-safe-ish slug.
    // This does not need to be perfect, only deterministic.
    return s
        .trim()
        .toLowerCase()
        .replace(/['"]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80);
}

export function sourceIdFromLabel(label: string): string {
    const clean = normalizeLabel(label);
    if (!clean) return FALLBACK_SOURCE_ID;

    // 1) Prefer generated stable map (strongest guarantee)
    const mapped = BY_LABEL[clean];
    if (typeof mapped === "string" && mapped.trim()) {
        return mapped.trim();
    }

    // 2) Deterministic fallback (should be rare if map is current)
    return `data:${slugify(clean)}`;
}

export function getAllSourceLabels(): string[] {
    const labels = new Set<string>();

    for (const entries of Object.values(RAW_SOURCES_MAP)) {
        if (!Array.isArray(entries)) continue;

        for (const e of entries) {
            const label = normalizeLabel(e?.source);
            if (!label) continue;
            labels.add(label);
        }
    }

    return Array.from(labels.values()).sort((a, b) => a.localeCompare(b));
}

// Optional helper: given an item unique path (same key used in sources.json), return its raw entries.
export function getRawSourcesForItemPath(itemPath: string): RawSourceEntry[] {
    const key = String(itemPath ?? "").trim();
    if (!key) return [];
    const v = RAW_SOURCES_MAP[key];
    return Array.isArray(v) ? v : [];
}

