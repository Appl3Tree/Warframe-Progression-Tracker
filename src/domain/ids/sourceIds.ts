// src/domain/ids/sourceIds.ts

export type SourceId = string & { readonly __brand: "SourceId" };

/**
 * Canonical SourceId formats supported:
 *  - "src:<token>"         (app-defined sources)
 *  - "data:<token>"        (data-derived sources: node/relic/enemy-drop/etc.)
 *  - "lotus:/Lotus/..."    (normalized Warframe Lotus type paths)
 *
 * NOTE:
 * We normalize raw "/Lotus/..." values into "lotus:/Lotus/..." so the rest of the
 * codebase never has to deal with multiple representations.
 */

// Keep these strict enough to avoid spaces and weird chars, but flexible enough for our ids.
const SRC_ID_REGEX = /^src:[a-z0-9][a-z0-9._/:/-]*$/i;

// data: ids are generated across multiple ingest layers and use ":" as a segment delimiter.
// Example: data:resource-by-avatar:demolisher-boiler
const DATA_ID_REGEX = /^data:[a-z0-9][a-z0-9._/:/-]*$/i;

// Lotus paths are special-cased for normalization.
const LOTUS_CANONICAL_REGEX = /^lotus:\/Lotus\/.+/;
const LOTUS_RAW_REGEX = /^\/Lotus\/.+/;

/**
 * normalizeSourceId
 * - Accepts the canonical formats above.
 * - Normalizes "/Lotus/..." -> "lotus:/Lotus/..."
 * - Throws on anything else (fail-closed).
 */
export function normalizeSourceId(raw: string): SourceId {
    if (typeof raw !== "string") {
        throw new Error(`Invalid SourceId: ${String(raw)}`);
    }

    const s = raw.trim();
    if (!s) {
        throw new Error(`Invalid SourceId: ${String(raw)}`);
    }

    // Normalize raw Lotus paths.
    if (LOTUS_RAW_REGEX.test(s)) {
        return (`lotus:${s}` as unknown) as SourceId;
    }

    // Accept canonical Lotus ids.
    if (LOTUS_CANONICAL_REGEX.test(s)) {
        return (s as unknown) as SourceId;
    }

    // Accept app-defined ids.
    if (SRC_ID_REGEX.test(s)) {
        return (s as unknown) as SourceId;
    }

    // Accept data-derived ids.
    if (DATA_ID_REGEX.test(s)) {
        return (s as unknown) as SourceId;
    }

    throw new Error(`Invalid SourceId: ${s}`);
}

