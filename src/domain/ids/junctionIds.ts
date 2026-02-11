// ===== FILE: src/domain/ids/junctionIds.ts =====

export const JN = {
    // NOTE:
    // Populate this with the complete canonical list when you build out Phase 1.5.
    // Junction IDs should line up with PR.JUNCTION_* prereqs where applicable.
} as const;

export type JunctionId = (typeof JN)[keyof typeof JN];

