// ===== FILE: src/domain/catalog/syndicates/rankTitles.ts =====
// Maps each syndicate ID to its rank number → rank title.
// Only ranks that have a named title are included; UI code should gracefully
// fall back to displaying no title when a rank is missing from the map.

import type { SyndicateId } from "../../ids/syndicateIds";
import { SY } from "../../ids/syndicateIds";

export type RankTitleMap = Partial<Record<number, string>>;

export const SYNDICATE_RANK_TITLES: Partial<Record<SyndicateId, RankTitleMap>> = {
    // ── Relay / faction syndicates (ranks −2..5) ──────────────────────────────
    [SY.ARBITERS_OF_HEXIS]: {
        [-2]: "Nemesis",
        [-1]: "Enemy",
        0: "Outsider",
        1: "Principled",
        2: "Authentic",
        3: "Lawful",
        4: "Crusader",
        5: "Maxim",
    },
    [SY.CEPHALON_SUDA]: {
        [-2]: "Nemesis",
        [-1]: "Enemy",
        0: "Outsider",
        1: "Competent",
        2: "Intriguing",
        3: "Intelligent",
        4: "Wise",
        5: "Genius",
    },
    [SY.NEW_LOKA]: {
        [-2]: "Nemesis",
        [-1]: "Enemy",
        0: "Outsider",
        1: "Humane",
        2: "Bountiful",
        3: "Benevolent",
        4: "Pure",
        5: "Flawless",
    },
    [SY.THE_PERRIN_SEQUENCE]: {
        [-2]: "Nemesis",
        [-1]: "Enemy",
        0: "Outsider",
        1: "Associate",
        2: "Senior Associate",
        3: "Executive",
        4: "Senior Executive",
        5: "Partner",
    },
    [SY.RED_VEIL]: {
        [-2]: "Nemesis",
        [-1]: "Enemy",
        0: "Outsider",
        1: "Respected",
        2: "Honored",
        3: "Esteemed",
        4: "Revered",
        5: "Exalted",
    },
    [SY.STEEL_MERIDIAN]: {
        [-2]: "Nemesis",
        [-1]: "Enemy",
        0: "Outsider",
        1: "Brave",
        2: "Defender",
        3: "Valiant",
        4: "Protector",
        5: "General",
    },

    // ── Open-world syndicates (ranks 0..5) ───────────────────────────────────
    [SY.OSTRON]: {
        0: "Neutral",
        1: "Offworlder",
        2: "Visitor",
        3: "Trusted",
        4: "Surah",
        5: "Kin",
    },
    [SY.THE_QUILLS]: {
        0: "Neutral",
        1: "Mote",
        2: "Observer",
        3: "Adherent",
        4: "Instrument",
        5: "Architect",
    },
    [SY.SOLARIS_UNITED]: {
        0: "Neutral",
        1: "Outworlder",
        2: "Rapscallion",
        3: "Doer",
        4: "Cove",
        5: "Old Mate",
    },
    [SY.VOX_SOLARIS]: {
        0: "Neutral",
        1: "Underling",
        2: "Agent",
        3: "Hand",
        4: "Shadow",
        5: "Operative",
    },
    [SY.VENTKIDS]: {
        0: "Neutral",
        1: "Glinty",
        2: "Whozit",
        3: "Proper Felon",
        4: "Primo",
        5: "Logical",
    },
    [SY.ENTRATI]: {
        0: "Neutral",
        1: "Stranger",
        2: "Acquaintance",
        3: "Associate",
        4: "Friend",
        5: "Family",
    },
    [SY.NECRALOID]: {
        1: "Clearance: Agnesis",
        2: "Clearance: Modus",
        3: "Clearance: Odima",
    },
    [SY.CAVIA]: {
        0: "Neutral",
        1: "Newcomer",
        2: "Researcher",
        3: "Scholar",
        4: "Savant",
        5: "Sage",
    },

    // ── Zariman syndicates (ranks 0..5) ──────────────────────────────────────
    [SY.THE_HOLDFASTS]: {
        0: "Neutral",
        1: "Watcher",
        2: "Seeker",
        3: "Mediator",
        4: "Witness",
        5: "Shieldbearer",
    },

    // ── 1999 syndicates (ranks 1..5) ─────────────────────────────────────────
    [SY.THE_HEX]: {
        1: "Leftovers",
        2: "Fresh Slice",
        3: "2-For-1",
        4: "Hot & Fresh",
        5: "Pizza Party",
    },

    // ── Special syndicates ───────────────────────────────────────────────────
    [SY.CONCLAVE]: {
        1: "Mistral",
        2: "Whirlwind",
        3: "Tempest",
        4: "Hurricane",
        5: "Typhoon",
    },
    [SY.NIGHTCAP]: {
        0: "Unknowing",
        1: "Curious",
        2: "Seeker",
        3: "Gardener",
        4: "Steward",
    },
    [SY.KAHLS_GARRISON]: {
        1: "Outpost",
        2: "Encampment",
        3: "Fort",
        4: "Settlement",
        5: "Home",
    },

    // Syndicates with no named rank titles (Nightwave uses prestige numbers,
    // Cephalon Simaris has no ranks, Operational Supply is event-scoped):
    // SY.NIGHTWAVE, SY.CEPHALON_SIMARIS, SY.OPERATIONAL_SUPPLY — omitted intentionally.
};

/** Returns the rank title for a given syndicate and rank, or undefined if not available. */
export function getRankTitle(syndicateId: SyndicateId, rank: number): string | undefined {
    return SYNDICATE_RANK_TITLES[syndicateId]?.[rank];
}
