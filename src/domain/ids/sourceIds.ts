// src/domain/ids/sourceIds.ts

/**
 * Canonical Source IDs
 *
 * Rules:
 * - Curated, stable IDs live in SRC.
 * - Non-curated sources MUST be deterministic and namespaced.
 * - "system:*" is a first-class namespace for non-UI, progression/system acquisition sources.
 */

export const SRC = {
    HUB_CETUS: "hub:cetus",
    HUB_FORTUNA: "hub:fortuna",
    HUB_NECRALISK: "hub:necralisk",
    HUB_ZARIMAN: "hub:zariman",
    HUB_SANCTUM: "hub:sanctum",

    VENDOR_QUILLS: "vendor:quills",
    VENDOR_SOLARIS_UNITED: "vendor:solaris_united",
    VENDOR_ENTRATI: "vendor:entrati",
    VENDOR_NECRALOID: "vendor:necraloid",
    VENDOR_HOLDFASTS: "vendor:holdfasts",
    VENDOR_CAVIA: "vendor:cavia"
} as const;

export type CuratedSourceId = (typeof SRC)[keyof typeof SRC];

export type SourceId =
    | CuratedSourceId
    | `data:${string}`
    | `boss:${string}`
    | `enemy:${string}`
    | `mission:${string}`
    | `quest:${string}`
    | `vendor:${string}`
    | `hub:${string}`
    | `syndicate:${string}`
    | `relic:${string}`
    | `system:${string}`;

export function isSourceId(v: unknown): v is SourceId {
    if (typeof v !== "string" || v.trim().length === 0) return false;

    for (const id of Object.values(SRC)) {
        if (v === id) return true;
    }

    const okPrefixes = [
        "data:",
        "boss:",
        "enemy:",
        "mission:",
        "quest:",
        "vendor:",
        "hub:",
        "syndicate:",
        "relic:",
        "system:"
    ];

    return okPrefixes.some((p) => v.startsWith(p)) && v.length > 4;
}

