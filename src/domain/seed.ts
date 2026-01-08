import type { Inventory, ReserveRule, SyndicateState } from "./types";

export const SEED_INVENTORY: Inventory = {
    counts: {}
};

export const SEED_RESERVES: ReserveRule[] = [];

/**
 * Brand-new user: no personal progress.
 * Phase E will populate from syndicate catalogs.
 */
export const SEED_SYNDICATES: SyndicateState[] = [];

