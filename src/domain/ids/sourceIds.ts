// ===== FILE: src/domain/ids/sourceIds.ts =====
// src/domain/ids/sourceIds.ts

export type SourceId = string & { readonly __brand: "SourceId" };

/**
 * Canonical SourceId formats supported:
 *  - "src:<token>"              (curated app-defined sources)
 *  - "lotus:/Lotus/..."         (normalized Warframe Lotus type paths)
 *  - "data:<token...>"          (generated/derived sources, e.g. "data:drop:<hash>")
 *
 * NOTE:
 * We normalize raw "/Lotus/..." values into "lotus:/Lotus/..." so the rest of the
 * codebase never has to deal with multiple representations.
 */

// Curated app IDs. Keep restrictive.
const SRC_ID_REGEX = /^src:[a-z0-9][a-z0-9._/-]*$/i;

// Raw Lotus and canonical Lotus forms.
const LOTUS_PATH_REGEX = /^\/Lotus\/[A-Za-z0-9._/-]+$/;
const LOTUS_ID_REGEX = /^lotus:\/Lotus\/[A-Za-z0-9._/-]+$/;

// Generated/derived sources (WFCD, scripts, etc).
// Must allow additional namespaces after "data:" (e.g. "data:drop:<hash>", "data:vendor:...").
// Deliberately excludes whitespace.
const DATA_ID_REGEX = /^data:[a-z0-9][a-z0-9._:/-]*$/i;

export function isValidSourceId(value: string): boolean {
    if (typeof value !== "string") return false;
    return SRC_ID_REGEX.test(value) || LOTUS_ID_REGEX.test(value) || DATA_ID_REGEX.test(value);
}

export function normalizeSourceId(raw: string): SourceId {
    if (typeof raw !== "string" || raw.trim().length === 0) {
        throw new Error(`normalizeSourceId(): expected non-empty string, got: ${String(raw)}`);
    }

    const v = raw.trim();

    // If already canonical, accept.
    if (isValidSourceId(v)) {
        return v as SourceId;
    }

    // If it's a raw Lotus path, canonicalize it.
    if (LOTUS_PATH_REGEX.test(v)) {
        return (`lotus:${v}` as unknown) as SourceId;
    }

    // Otherwise invalid.
    throw new Error(`Invalid SourceId format: ${raw}`);
}

/**
 * Use this when you need a non-throwing check for raw input.
 */
export function tryNormalizeSourceId(raw: string): { ok: true; id: SourceId } | { ok: false; reason: string } {
    try {
        return { ok: true, id: normalizeSourceId(raw) };
    } catch (e) {
        return { ok: false, reason: e instanceof Error ? e.message : String(e) };
    }
}

