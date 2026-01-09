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
}

export interface DailyTask {
    id: Id;
    dateYmd: string; // YYYY-MM-DD
    label: string;
    syndicate?: string;
    details?: string;
    isDone: boolean;
}

/**
 * Minimal syndicate state shape. Phase E will replace/extend this with a
 * fully-typed syndicate catalog model.
 */
export interface SyndicateState {
    id: Id;
    name: string;

    /**
     * Rank index (0-based).
     */
    rank: number;

    /**
     * Current standing into the rank.
     */
    standing: number;

    /**
     * Standing cap for the current rank, if known.
     */
    standingCap?: number;

    /**
     * Optional convenience fields for UI.
     */
    rankLabel?: string;
    dailyCap?: number;

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

    notes?: string;
}

