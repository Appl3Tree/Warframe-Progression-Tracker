export const SY = {
    // Open-world / hub syndicates
    OSTRON: "syndicate_ostron",
    QUILLS: "syndicate_quills",
    SOLARIS_UNITED: "syndicate_solaris_united",
    VOX_SOLARIS: "syndicate_vox_solaris",
    ENTRATI: "syndicate_entrati",
    NECRALOID: "syndicate_necraloid",
    HOLDFATS: "syndicate_holdfasts",
    CAVIA: "syndicate_cavia",
    VENTKIDS: "syndicate_ventkids",
    HEX_1999: "syndicate_hex_1999",

    // Relay syndicates (shared-cap bucket)
    STEEL_MERIDIAN: "syndicate_steel_meridian",
    ARBITERS_OF_HEXIS: "syndicate_arbiters_of_hexis",
    CEPHALON_SUDA: "syndicate_cephalon_suda",
    PERRIN_SEQUENCE: "syndicate_perrin_sequence",
    NEW_LOKA: "syndicate_new_loka",
    RED_VEIL: "syndicate_red_veil",

    // Special standing systems
    CEPHALON_SIMARIS: "syndicate_cephalon_simaris",
    CONCLAVE: "syndicate_conclave"
} as const;

export type SyndicateId = (typeof SY)[keyof typeof SY];

