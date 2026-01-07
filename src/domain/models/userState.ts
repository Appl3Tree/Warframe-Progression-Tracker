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

export interface UserMetaV1 {
    schemaVersion: 1;
    createdAtIso: string;
    updatedAtIso: string;
}

export interface UserPlayerV1 {
    platform: "PC";
    displayName: string;
    masteryRank: number | null;
}

export interface UserUiV1 {
    activePage: PageKey;
}

export interface UserStateV1 {
    meta: UserMetaV1;
    player: UserPlayerV1;
    ui: UserUiV1;

    inventory: Inventory;
    syndicates: SyndicateState[];
    reserves: ReserveRule[];
    dailyTasks: DailyTask[];
}

