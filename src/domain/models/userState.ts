// ===== FILE: src/domain/models/userState.ts =====
import type {
    DailyTask,
    Inventory,
    ResetChecklistState,
    SyndicateState
} from "../types";

export type PageKey =
    | "dashboard"
    | "prereqs"
    | "syndicates"
    | "goals"
    | "requirements"
    | "handbook"
    | "imports"
    | "settings"
    | "diagnostics"
    | "inventory"
    | "starchart"
    | "mods"
    | "challenges"
    | "intrinsics";

export interface UserMetaV2 {
    schemaVersion: 2;
    createdAtIso: string;
    updatedAtIso: string;
}

export type PlatformKey = "PC" | "PlayStation" | "Xbox" | "Switch" | "Mobile";

export interface UserPlayerV2 {
    platform: PlatformKey;

    accountId: string;
    displayName: string;
    masteryRank: number | null;

    clanName?: string;
    clanTier?: number;
    clanClass?: number;
    clanXp?: number;
}

export interface UserUiV2 {
    activePage: PageKey;
    expandedGoalNodes: Record<string, boolean>;
}

export interface UserPrereqsV2 {
    /**
     * Sparse boolean map:
     * - missing key = false (unknown => assume not completed)
     */
    completed: Record<string, boolean>;
}

export type GoalType = "item";

export interface UserGoalV1 {
    id: string;

    type: GoalType;

    /**
     * Canonical catalog id (e.g. "items:/Lotus/Types/...")
     * This must match inventory.counts keys.
     */
    catalogId: string;

    /**
     * How many the user wants.
     */
    qty: number;

    /**
     * Optional note for the goal.
     */
    note?: string;

    /**
     * Whether the goal is currently active.
     */
    isActive: boolean;

    /**
     * Per-component completion tracking.
     * Keys are step identifiers (e.g. "blueprint", "resources", "crafted").
     */
    completedComponents?: Record<string, boolean>;

    createdAtIso: string;
    updatedAtIso: string;
}

export interface UserStateV2 {
    meta: UserMetaV2;
    player: UserPlayerV2;
    ui: UserUiV2;

    prereqs: UserPrereqsV2;

    inventory: Inventory;
    syndicates: SyndicateState[];
    dailyTasks: DailyTask[];
    resetChecklist: ResetChecklistState;

    goals: UserGoalV1[];

    mastery: {
        xpByItem: Record<string, number>;
        mastered: Record<string, boolean>;
        /** Manually confirmed mastery for overlevel weapons (Kuva/Tenet/Coda/Paracesis). */
        overLevelMastered: Record<string, boolean>;
    };

    missions: {
        completesByTag: Record<string, number>;
        /** Manually toggled per-node completion (boolean, by node ID). */
        nodeCompleted?: Record<string, boolean>;
        /** Steel Path per-node completion — tracked separately from normal mode. */
        steelPathNodeCompleted?: Record<string, boolean>;
    };

    challenges?: {
        /** Progress count by challenge uniqueName (e.g. "/Lotus/Types/Challenges/Find1Mod" → 1). */
        progress: Record<string, number>;
        /** Whether the challenge is marked completed. */
        completed: Record<string, boolean>;
    };

    intrinsics?: {
        /** Railjack intrinsic skill ranks. Keys are STYPE_* strings (e.g. "STYPE_PILOTING" → 5). */
        railjack: Record<string, number>;
        /** Duviri intrinsic skill ranks. Keys are STYPE_DUVIRI_* strings. */
        duviri: Record<string, number>;
    };
}
