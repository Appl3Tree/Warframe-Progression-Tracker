// ===== FILE: src/domain/ids/syndicateIds.ts =====
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
