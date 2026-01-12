// ===== FILE: src/domain/ids/sourceIds.ts =====
// Full file replacement: restores `isSourceId` while keeping SYSTEM_CRAFTING.

export const SRC = {
    // -----------------------------
    // Hubs
    // -----------------------------
    HUB_CETUS: "hub:cetus",
    HUB_FORTUNA: "hub:fortuna",
    HUB_NECRALISK: "hub:necralisk",
    HUB_ZARIMAN: "hub:zariman",
    HUB_SANCTUM: "hub:sanctum",

    // -----------------------------
    // Vendors
    // -----------------------------
    VENDOR_QUILLS: "vendor:quills",
    VENDOR_SOLARIS_UNITED: "vendor:solaris_united",
    VENDOR_ENTRATI: "vendor:entrati",
    VENDOR_NECRALOID: "vendor:necraloid",
    VENDOR_HOLDFASTS: "vendor:holdfasts",
    VENDOR_CAVIA: "vendor:cavia",

    // -----------------------------
    // Systems (curated)
    // -----------------------------
    SYSTEM_ARCHWING: "system:archwing",
    SYSTEM_RAILJACK: "system:railjack",
    SYSTEM_NECRAMECH: "system:necramech",
    SYSTEM_HELMINTH: "system:helminth",
    SYSTEM_VEILBREAKER: "system:veilbreaker",
    SYSTEM_DUVIRI: "system:duviri",
    SYSTEM_ARCHON_HUNTS: "system:archon_hunts",
    SYSTEM_CLAN_RESEARCH: "system:clan_research",

    // NEW: Foundry crafting as a first-class acquisition path
    SYSTEM_CRAFTING: "system:crafting"
} as const;

export type SourceId =
    | (typeof SRC)[keyof typeof SRC]
    | `data:${string}`
    | `enemy:${string}`
    | `boss:${string}`
    | `system:${string}`;

/**
 * Runtime guard used by acquisition loaders.
 * Must be conservative (fail-closed).
 */
export function isSourceId(v: unknown): v is SourceId {
    if (typeof v !== "string") return false;
    const s = v.trim();
    if (!s) return false;

    // Known curated SRC values
    for (const val of Object.values(SRC)) {
        if (s === val) return true;
    }

    // Allow structured ids (used for data-derived sources and future expansion)
    if (s.startsWith("data:") && s.length > "data:".length) return true;
    if (s.startsWith("enemy:") && s.length > "enemy:".length) return true;
    if (s.startsWith("boss:") && s.length > "boss:".length) return true;
    if (s.startsWith("system:") && s.length > "system:".length) return true;

    return false;
}

