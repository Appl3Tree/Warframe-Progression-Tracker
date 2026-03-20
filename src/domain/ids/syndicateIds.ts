// ===== FILE: src/domain/ids/syndicateIds.ts =====

/** Human-readable display name for each syndicate ID. */
export const SYNDICATE_DISPLAY_NAME: Record<string, string> = {
    syndicate_ostron:            "Ostron",
    syndicate_quills:            "The Quills",
    syndicate_solaris_united:    "Solaris United",
    syndicate_vox_solaris:       "Vox Solaris",
    syndicate_entrati:           "Entrati",
    syndicate_necraloid:         "Necraloid",
    syndicate_ventkids:          "Vent Kids",
    syndicate_cavia:             "Cavia",
    syndicate_hex_1999:          "The Hex",
    syndicate_holdfasts:         "The Holdfasts",
    syndicate_steel_meridian:    "Steel Meridian",
    syndicate_arbiters_of_hexis: "Arbiters of Hexis",
    syndicate_cephalon_suda:     "Cephalon Suda",
    syndicate_perrin_sequence:   "The Perrin Sequence",
    syndicate_new_loka:          "New Loka",
    syndicate_red_veil:          "Red Veil",
    syndicate_cephalon_simaris:  "Cephalon Simaris",
    syndicate_conclave:          "Conclave",
    syndicate_kahls_garrison:    "Kahl's Garrison",
    syndicate_nightcap:          "Nightcap",
    syndicate_nightwave:         "Nightwave",
    syndicate_operational_supply:"Operational Supply",
};

/** Returns the human-readable name for a syndicate ID, or the raw ID if unknown. */
export function getSyndicateDisplayName(id: string): string {
    return SYNDICATE_DISPLAY_NAME[id] ?? id;
}

export const SY = {
    // Open-world / hub syndicates
    OSTRON: "syndicate_ostron",
    THE_QUILLS: "syndicate_quills",
    SOLARIS_UNITED: "syndicate_solaris_united",
    VOX_SOLARIS: "syndicate_vox_solaris",
    ENTRATI: "syndicate_entrati",
    NECRALOID: "syndicate_necraloid",
    VENTKIDS: "syndicate_ventkids",
    CAVIA: "syndicate_cavia",
    THE_HEX: "syndicate_hex_1999",
    THE_HOLDFASTS: "syndicate_holdfasts",

    // Relay syndicates (shared-cap bucket)
    STEEL_MERIDIAN: "syndicate_steel_meridian",
    ARBITERS_OF_HEXIS: "syndicate_arbiters_of_hexis",
    CEPHALON_SUDA: "syndicate_cephalon_suda",
    THE_PERRIN_SEQUENCE: "syndicate_perrin_sequence",
    NEW_LOKA: "syndicate_new_loka",
    RED_VEIL: "syndicate_red_veil",

    // Special standing systems (non-faction, non-relay)
    CEPHALON_SIMARIS: "syndicate_cephalon_simaris",
    CONCLAVE: "syndicate_conclave",

    // Neutral but non-standard progression (no normal Standing meter)
    KAHLS_GARRISON: "syndicate_kahls_garrison",
    NIGHTCAP: "syndicate_nightcap",

    // System-style progression / event syndicates
    // Nightwave uses its own "Nightwave standing/points" loop (Acts -> ranks), not normal Syndicate standing.
    NIGHTWAVE: "syndicate_nightwave",
    // Event-scoped standing vendor (operations)
    OPERATIONAL_SUPPLY: "syndicate_operational_supply"
} as const;

export type SyndicateId = (typeof SY)[keyof typeof SY];
