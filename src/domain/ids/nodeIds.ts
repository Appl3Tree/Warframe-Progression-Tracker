// ===== FILE: src/domain/ids/nodeIds.ts =====

export const ND = {
    // NOTE:
    // Populate this with the complete canonical list when you build out Phase 1.5.
    // Node IDs should be stable and not derived from display names.
} as const;

export type NodeId = (typeof ND)[keyof typeof ND];

