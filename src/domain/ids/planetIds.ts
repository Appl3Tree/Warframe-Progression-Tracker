// ===== FILE: src/domain/ids/planetIds.ts =====

export const PL = {
    // NOTE:
    // Populate this with the complete canonical list when you build out Phase 1.5.
    // Keep IDs stable. Names are UI-only and belong in the star chart registries.
} as const;

export type PlanetId = (typeof PL)[keyof typeof PL];

