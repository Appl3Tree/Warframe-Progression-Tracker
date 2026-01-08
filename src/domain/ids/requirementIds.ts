export const REQ = {
    // Generic concept requirements (not inventory items)
    MASTERY_RANK: "req_mastery_rank_min",
    CREDITS: "req_credits",
    STANDING: "req_standing",

    // “Segment installed” conceptual requirements (planner gates)
    ORBITER_SEGMENT_VOID_RELICS: "req_orbiter_segment_void_relics",
    ORBITER_SEGMENT_PERSONAL_QUARTERS: "req_orbiter_segment_personal_quarters",
    ORBITER_SEGMENT_MELEE_UPGRADE: "req_orbiter_segment_melee_upgrade",

    HELMINTH_SEGMENT_BASE: "req_helminth_segment_base",
    HELMINTH_SEGMENT_INVIGORATIONS: "req_helminth_segment_invigorations",
    HELMINTH_SEGMENT_ARCHON_SHARDS: "req_helminth_segment_archon_shards",
    HELMINTH_SEGMENT_COALESCENT: "req_helminth_segment_coalescent",

    // Necramech ownership (conceptual requirement)
    NECRAMECH_OWNED: "req_necramech_owned",

    // Kahl
    KAHL_GARRISON_AVAILABLE: "req_kahl_garrison_available"
} as const;

export type RequirementId = (typeof REQ)[keyof typeof REQ];

