// ===== FILE: src/domain/models/userState.ts =====
import type { DailyTask, Inventory, SyndicateState } from "../types";

export type PageKey =
    | "dashboard"
    | "prereqs"
    | "syndicates"
    | "goals"
    | "requirements"
    | "systems"
    | "imports"
    | "settings"
    | "diagnostics"
    | "inventory";

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

    goals: UserGoalV1[];

    mastery: {
        xpByItem: Record<string, number>;
        mastered: Record<string, boolean>;
    };

    missions: {
        completesByTag: Record<string, number>;
    };
}

