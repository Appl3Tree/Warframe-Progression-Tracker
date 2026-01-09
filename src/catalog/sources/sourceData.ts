// src/catalog/sources/sourceData.ts
//
// Loads and normalizes src/data/sources.json into:
// - a list of unique source labels
// - stable SourceIds for each source label
//
// Important:
// - This does not attempt to “understand” sources (planet, node, vendor).
// - It only provides a stable ID + label so the UI can show it and the engine can treat it as known.

import sourcesText from "../../data/sources.json?raw";

export type RawSourceEntry = {
    source?: string;
    chance?: number;
    rarity?: string;
};

export type RawSourcesMap = Record<string, RawSourceEntry[]>;

function parseSources(): RawSourcesMap {
    try {
        const parsed =
            typeof sourcesText === "string"
                ? (JSON.parse(sourcesText) as unknown)
                : (sourcesText as unknown);

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {};
        }

        return parsed as RawSourcesMap;
    } catch {
        return {};
    }
}

export const RAW_SOURCES_MAP: RawSourcesMap = parseSources();

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
    if (!clean) return "data:unknown";
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
