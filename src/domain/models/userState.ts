import type { DailyTask, Inventory, ReserveRule, SyndicateState } from "../types";

export type PageKey =
    | "dashboard"
    | "prereqs"
    | "syndicates"
    | "goals"
    | "requirements"
    | "systems"
    | "imports"
    | "settings"
    | "diagnostics";

export interface UserMetaV2 {
    schemaVersion: 2;
    createdAtIso: string;
    updatedAtIso: string;
}

export interface UserPlayerV2 {
    platform: "PC";
    displayName: string;
    masteryRank: number | null;
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

export interface UserStateV2 {
    meta: UserMetaV2;
    player: UserPlayerV2;
    ui: UserUiV2;

    prereqs: UserPrereqsV2;

    inventory: Inventory;
    syndicates: SyndicateState[];
    reserves: ReserveRule[];
    dailyTasks: DailyTask[];
}

