// ===== FILE: src/catalog/sources/sourceData.ts =====
// src/catalog/sources/sourceData.ts
//
// Loads and normalizes sources into:
// - a list of unique source labels
// - stable SourceIds for each source label
//
// Sources of truth:
// 1) src/data/_generated/source-label-map.auto.json (label -> id mapping, preferred for stability)
// 2) src/data/_generated/wfcd-source-label-map.auto.json (id -> label mapping; we reverse it to label -> id)
//
// Stability rule:
// - Prefer the generated mapping (source-label-map.auto.json) when present.
// - Use WFCD map as an additional mapping layer.
// - Fall back to deterministic slugification only if label is missing from both maps.

import labelMapText from "../../data/_generated/source-label-map.auto.json?raw";
import wfcdLabelMapText from "../../data/_generated/wfcd-source-label-map.auto.json?raw";

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

type WfcdSourceIdToLabel = Record<string, string>;

function parseWfcdSourceIdToLabel(): WfcdSourceIdToLabel {
    const parsed = loadJsonLoose(wfcdLabelMapText);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
    }

    return parsed as Record<string, string>;
}

const LABEL_MAP: LabelMapFile = parseLabelMap();
const FALLBACK_SOURCE_ID: string = LABEL_MAP.defaults?.fallbackSourceId ?? "data:unknown";

/**
 * Map: label -> sourceId
 * - primary: generated stable map (source-label-map.auto.json)
 * - secondary: WFCD reverse map (wfcd-source-label-map.auto.json)
 */
const BY_LABEL: Record<string, string> = (() => {
    const out: Record<string, string> = {};

    // 1) primary stable label->id mapping
    const primary = LABEL_MAP.byLabel ?? {};
    for (const [label, id] of Object.entries(primary)) {
        if (typeof label !== "string" || typeof id !== "string") continue;
        const l = label.trim();
        const i = id.trim();
        if (!l || !i) continue;
        out[l] = i;
    }

    // 2) WFCD id->label mapping, reverse it into label->id
    const wfcd = parseWfcdSourceIdToLabel();
    for (const [id, label] of Object.entries(wfcd)) {
        if (typeof id !== "string" || typeof label !== "string") continue;
        const i = id.trim();
        const l = label.replace(/\s+/g, " ").trim();
        if (!i || !l) continue;

        // Do NOT override primary mapping for the same label (primary is “more stable”).
        if (!out[l]) out[l] = i;
    }

    return out;
})();

function normalizeLabel(s: unknown): string {
    const v = typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";
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

    // 2) Deterministic fallback (should be rare if maps are current)
    return `data:${slugify(clean)}`;
}

export function getAllSourceLabels(): string[] {
    const labels = new Set<string>();

    // WFCD labels (id->label map values)
    const wfcd = parseWfcdSourceIdToLabel();
    for (const label of Object.values(wfcd)) {
        const l = normalizeLabel(label);
        if (!l) continue;
        labels.add(l);
    }

    return Array.from(labels.values()).sort((a, b) => a.localeCompare(b));
}

