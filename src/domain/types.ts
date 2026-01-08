export type Id = string;

export interface Inventory {
    /**
     * Canonical inventory: keyed by catalog key (path from items.json),
     * not by display name.
     *
     * Counts only exist if the user has touched them (sparse map).
     */
    counts: Record<string, number>;
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

    /**
     * Reserve items by canonical key (catalog path).
     */
    items: Array<{ key: string; minKeep: number }>;

    isEnabled: boolean;
}

