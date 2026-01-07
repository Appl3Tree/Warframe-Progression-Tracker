export type Id = string;

export type CurrencyKey =
    | "credits"
    | "standing"
    | "aya"
    | "voidTraces";

export type RequirementKey =
    | "Sly Vulpaphyla Tag"
    | "Vizier Predasite Tag"
    | "Mother Token"
    | "Son Token"
    | "Father Token"
    | "Orokin Orientation Matrix"
    | "Zymos Barrel Blueprint"
    | "Maprico"
    | "Cetus Wisp"
    | "Eidolon Shard"
    | "Training Debt-Bond"
    | "Vega Toroid"
    | "Calda Toroid"
    | "Sola Toroid"
    | "Voidplume Down"
    | "Ferrite"
    | "Alloy Plate"
    | "Shrill Voca"
    | "Entrati Obols"
    | "Rubedo"
    | "Efervon Sample"
    | "Höllvanian Pitchweave Fragment"
    | "Hollars";

export interface Requirement {
    key: RequirementKey;
    need: number;
}

export interface RankUp {
    title: string;
    requirements: Requirement[];
}

export interface SyndicateState {
    id: Id;
    name: string;

    // Standing progression
    rankLabel: string;               // e.g. "Rank 2", "Rank 0", "Rank 5"
    standingCurrent: number;
    standingMaxForRank: number;

    // Caps (if you want to track them explicitly)
    dailyCap?: number;

    // Next rank up requirements (from your in-game screenshots)
    nextRankUp?: RankUp;

    // Notes you can edit in UI
    notes: string;
}

export interface Inventory {
    // Currency-like
    credits: number;
    voidTraces: number;
    aya: number;

    // All trackable requirement items
    items: Record<string, number>;
}

export interface DailyTask {
    id: Id;
    dateYmd: string; // YYYY-MM-DD
    label: string;
    isDone: boolean;
    syndicate?: string;
    details?: string;
}

export interface ReserveRule {
    id: Id;
    label: string;
    items: Array<{ key: string; minKeep: number }>;
    isEnabled: boolean;
}
