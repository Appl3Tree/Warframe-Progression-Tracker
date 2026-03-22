// ===== FILE: src/domain/types.ts =====
export type Id = string;

export interface Inventory {
    /**
     * Credits and Platinum are the only "special" currencies that live outside
     * the canonical item-count map.
     */
    credits: number;
    platinum: number;

    /**
     * Canonical inventory counts keyed by catalog key (path/id from items.json),
     * never by display name.
     *
     * Counts only exist if the user has touched them (sparse map).
     */
    counts: Record<string, number>;

    /**
     * Per-rank arcane copy counts. Key is the raw Lotus path (without "mods:" prefix),
     * value maps string rank ("0"–"5") to number of copies owned at that rank.
     * Sparse: only present when the user has entered data.
     */
    arcaneRanks?: Record<string, Record<string, number>>;
}

export interface DailyTask {
    id: Id;
    dateYmd: string; // YYYY-MM-DD
    label: string;
    syndicate?: string;
    details?: string;
    isDone: boolean;
}

export type ResetChecklistCadence = "daily" | "weekly";
export type ResetDisplayMode = "utc" | "local";

export type ResetChecklistBucket =
    | "primary_daily"
    | "secondary_daily"
    | "weekly_monday"
    | "weekly_friday";

export interface ResetChecklistState {
    /**
     * Current active UTC reset window keys.
     * When these keys change, completion lists are wiped for the new window.
     */
    primaryDailyResetKey: string;
    secondaryDailyResetKey: string;
    weeklyMondayResetKey: string;
    weeklyFridayResetKey: string;

    /**
     * Task ids completed in the current active window.
     */
    completedPrimaryDailyTaskIds: string[];
    completedSecondaryDailyTaskIds: string[];
    completedWeeklyMondayTaskIds: string[];
    completedWeeklyFridayTaskIds: string[];

    /**
     * Presentation-only toggle for the reset header pills.
     * Reset boundaries remain game-accurate UTC.
     */
    timeMode: ResetDisplayMode;
}

export interface SyndicateState {
    id: Id;
    name: string;

    /**
     * Rank index (0-based).
     * For Relay faction syndicates, negative ranks exist (-2..-1).
     */
    rank: number;

    /**
     * Current standing into the rank.
     * For negative ranks, standing is typically negative and approaches 0.
     */
    standing: number;

    /**
     * Computed in UI (based on rank), but kept optional for forward-compat.
     */
    standingCap?: number;

    /**
     * Optional convenience fields for UI.
     */
    rankLabel?: string;
    dailyCap?: number;

    /**
     * Relay faction pledge (one primary pledge at a time).
     */
    pledged?: boolean;

    /**
     * Optional rank-up requirements when defined by embedded ladder data.
     * NOTE: Reserves are derived from this data when it exists.
     */
    nextRankUp?: {
        standingRequired?: number;
        credits?: number;
        platinum?: number;
        items?: Array<{ key: string; count: number; label?: string }>;
    };
}
