// ===== FILE: src/domain/ids/prereqIds.ts =====
//
// Comprehensive registry of all trackable prerequisites in Warframe.
// Updated: 2026-03 — covers all content through The Hex / Update 38 + hotfixes.
//
// Naming convention:
//   QUEST_*      — story or side quest completion gate  (key prefix is the quest name)
//   JUNCTION_    — star chart junction (planet-to-planet unlock)
//   HUB_*        — open-world / hub access
//   SYSTEM_*     — major gameplay system unlock (feature gate, not a quest)
//   SEGMENT_*    — Orbiter segment installation
//   FOCUS_*      — Focus school / Operator progression milestones
//   AMP_*        — Operator Amp tier unlocks
//   COMPANION_*  — companion system unlock milestones
//   NECRAMECH_*  — Necramech system milestones
//   RAILJACK_*   — Railjack system milestones
//   ACTIVITY_*   — specific repeatable endgame activity access gates
//   SYNDICATE_*  — syndicate rank milestones that gate content
//   MR_*         — Mastery Rank thresholds that gate content
//
// ⚠️  REGISTRY NOTE: Adding a key here does NOT automatically surface it in the
//     planner. You must also add a matching entry in prereqRegistry.ts with its
//     displayName, category, and prerequisites array.
//
// Sources verified against:
//   warframe.fandom.com/wiki/Quest | wiki.warframe.com/w/Orbiter_Segments
//   wiki.warframe.com/w/Focus | wiki.warframe.com/w/The_Steel_Path
//   wiki.warframe.com/w/Sortie | wiki.warframe.com/w/Arbitrations
//   wiki.warframe.com/w/Archon_Hunt | wiki.warframe.com/w/Helminth

export const PR = {

    // =========================================================================
    // MAIN STORY QUESTS
    // =========================================================================

    // -------------------------------------------------------------------------
    // Arc 1 — The Awakening (tutorial + early game)
    // -------------------------------------------------------------------------
    VORS_PRIZE:             "quest_vors_prize",             // Forced tutorial; installs all base Orbiter segments
    THE_TEACHER:            "quest_the_teacher",            // Modding tutorial (Update 40, Oct 2025)
    ONCE_AWAKE:             "quest_once_awake",             // Mercury Grineer arc; req. Vors Prize
    ARCHWING:               "quest_the_archwing",           // Unlocks Archwing gear + missions; req. Once Awake + Earth junc.
    STOLEN_DREAMS:          "quest_stolen_dreams",          // Unlocks Cephalon Simaris relay scanner; req. Mars access
    NEW_STRANGE:            "quest_the_new_strange",        // Unlocks Simaris standing + Chroma BP; req. Stolen Dreams
    NATAH:                  "quest_natah",                  // Gatekeeper to Second Dream; req. Pluto access

    // -------------------------------------------------------------------------
    // Arc 2 — The Second Dream / War Within
    // -------------------------------------------------------------------------
    SECOND_DREAM:           "quest_the_second_dream",       // Unlocks Operator/Transcendence, Focus (partial); req. Natah
    WAR_WITHIN:             "quest_the_war_within",         // Upgrades Operator to full Transference + Void powers;
                                                            //   unlocks Kuva Fortress, Sorties, Kuva Lich;
                                                            //   gates full Focus tree + Quills access;
                                                            //   req. Second Dream + Sedna access
    CHAINS_HARROW:          "quest_chains_of_harrow",       // Harrow BP; req. Sedna access
    APOSTASY:               "quest_apostasy_prologue",      // Short cinematic; req. War Within + Personal Quarters segment
    SACRIFICE:              "quest_the_sacrifice",          // Excalibur Umbra; req. Apostasy Prologue

    // -------------------------------------------------------------------------
    // Arc 3 — The New War
    // -------------------------------------------------------------------------
    CHIMERA_PROLOGUE:       "quest_chimera_prologue",       // Short cinematic; req. The Sacrifice
    ERRA:                   "quest_erra",                   // Short cinematic; req. Chimera Prologue
    PRELUDE_TO_WAR:         "quest_prelude_to_war",         // Compilation of miniquests; req. Erra
    NEW_WAR:                "quest_the_new_war",            // Major story gate; unlocks Zariman, Veilbreaker, Jade Shadows;
                                                            //   req. Prelude to War + Railjack + Necramech
    JADE_SHADOWS:           "quest_jade_shadows",           // Jade Warframe; req. New War

    // -------------------------------------------------------------------------
    // Arc 4 — The Duviri Paradox
    // Note: Can be started from The Second Dream (alt entry point),
    //       but completing it is REQUIRED for The Hex (Arc 5 late).
    // -------------------------------------------------------------------------
    DUVIRI_PARADOX:         "quest_the_duviri_paradox",     // Unlocks The Circuit, Drifter Intrinsics, Incarnon Genesis adapters;
                                                            //   required prerequisite for The Hex

    // -------------------------------------------------------------------------
    // Arc 5 — Angels of Zariman / Whispers in the Walls / 1999
    // -------------------------------------------------------------------------
    ANGELS_ZARIMAN:         "quest_angels_of_the_zariman",  // Zariman hub, Holdfasts syndicate, Incarnon weapons; req. New War
    WHISPERS_WALL:          "quest_whispers_in_the_walls",  // Sanctum Anatomica, Netracells, Qorvex; req. Angels of Zariman
    THE_LOTUS_EATERS:       "quest_the_lotus_eaters",       // Gates The Hex; req. Whispers in the Walls
    THE_HEX:                "quest_the_hex",                // Hollvania / 1999 content; req. Lotus Eaters + Duviri Paradox

    // -------------------------------------------------------------------------
    // Arc 6 — The Old Peace (Update 41, Dec 2025)
    // ⚠️  Verify exact prerequisite chain against wiki before adding to registry
    // -------------------------------------------------------------------------
    THE_OLD_PEACE:          "quest_the_old_peace",          // Dark Refractory / Descendia content; req. The Lotus Eaters (tentative)

    // =========================================================================
    // SIDE QUESTS — Feature Gates
    // =========================================================================

    HOWL_KUBROW:            "quest_howl_of_the_kubrow",     // Unlocks Kubrow incubation & breeding; no hard quest prereq
    SAYA_VIGIL:             "quest_sayas_vigil",            // Gara BP; combined with War Within unlocks The Quills; req. one Cetus Bounty
    VOX_SOLARIS:            "quest_vox_solaris",            // Unlocks Vox Solaris syndicate; auto-starts on first Fortuna visit
    HEART_OF_DEIMOS:        "quest_heart_of_deimos",        // Unlocks Necralisk / Cambion Drift / Entrati; req. Mars-Deimos junction
    RISING_TIDE:            "quest_rising_tide",            // Unlocks Railjack construction; req. War Within
    VEILBREAKER:            "quest_veilbreaker",            // Unlocks Kahl's Garrison + Archon Hunts; req. New War
    CALL_TEMPESTARII:       "quest_call_of_the_tempestarii",// Unlocks Sisters of Parvos + Railjack Corpus nodes; req. Rising Tide
    DEADLOCK_PROTOCOL:      "quest_the_deadlock_protocol",  // Protea BP; Sisters of Parvos eligibility; req. Corpus Ship Granum Void

    // =========================================================================
    // SIDE QUESTS — Warframe Blueprint Quests
    // =========================================================================

    LIMBO_THEOREM:          "quest_the_limbo_theorem",      // Limbo BP; req. Void access
    SILVER_GROVE:           "quest_the_silver_grove",       // Titania BP; req. Cetus + MR7 + New Loka relay talk
    SANDS_INAROS:           "quest_sands_of_inaros",        // Inaros BP; beacon purchased from Baro Ki'Teer
    OCTAVIA_ANTHEM:         "quest_octavias_anthem",        // Octavia BP; req. Lua access (Earth-Lua junction)
    JORDAS_PRECEPT:         "quest_the_jordas_precept",     // Atlas BP; req. Archwing + Eris access
    GLAST_GAMBIT:           "quest_the_glast_gambit",       // Nidus BP; req. Eris + Infested Salvage access
    MASK_REVENANT:          "quest_mask_of_the_revenant",   // Revenant BP; req. Cetus + Quills rank 1 (Observer)
    HIDDEN_MESSAGES:        "quest_hidden_messages",        // Mirage BP; req. Saturn access
    PATIENT_ZERO:           "quest_patient_zero",           // Infested Salvage node + Mesa BP; req. Eris access

    // =========================================================================
    // STAR CHART JUNCTIONS
    // =========================================================================

    JUNCTION_MERCURY_VENUS:         "junction_mercury_venus",
    JUNCTION_VENUS_EARTH:           "junction_venus_earth",
    JUNCTION_EARTH_MARS:            "junction_earth_mars",
    JUNCTION_MARS_PHOBOS:           "junction_mars_phobos",
    JUNCTION_MARS_CERES:            "junction_mars_ceres",
    JUNCTION_MARS_DEIMOS:           "junction_mars_deimos",
    JUNCTION_PHOBOS_CERES:          "junction_phobos_ceres",
    JUNCTION_CERES_JUPITER:         "junction_ceres_jupiter",
    JUNCTION_JUPITER_EUROPA:        "junction_jupiter_europa",
    JUNCTION_EUROPA_SATURN:         "junction_europa_saturn",
    JUNCTION_SATURN_URANUS:         "junction_saturn_uranus",
    JUNCTION_URANUS_NEPTUNE:        "junction_uranus_neptune",
    JUNCTION_NEPTUNE_PLUTO:         "junction_neptune_pluto",
    JUNCTION_PLUTO_SEDNA:           "junction_pluto_sedna",
    JUNCTION_SEDNA_ERIS:            "junction_sedna_eris",
    JUNCTION_EARTH_LUA:             "junction_earth_lua",
    JUNCTION_ERIS_KUVA_FORTRESS:    "junction_eris_kuva_fortress",

    // =========================================================================
    // OPEN WORLD HUBS
    // =========================================================================

    HUB_CETUS:              "hub_cetus",                    // Plains of Eidolon; gates Ostron / The Quills / Eidolon hunts
    HUB_FORTUNA:            "hub_fortuna",                  // Orb Vallis; gates Solaris United / Vox Solaris / Profit-Taker
    HUB_NECRALISK:          "hub_necralisk",                // Cambion Drift; gates Entrati / Necraloid / Helminth segment
    HUB_ZARIMAN:            "hub_zariman",                  // Chrysalith; gates Holdfasts; req. Angels of Zariman
    HUB_SANCTUM:            "hub_sanctum_anatomica",        // Sanctum Anatomica; gates Cavia; req. Whispers in the Walls
    HUB_HOLLVANIA:          "hub_hollvania",                // 1999 hub; req. The Hex
    HUB_RELAY:              "hub_relay",                    // Any Relay; gates Cephalon Simaris, Syndicates, Conclave
    HUB_DRIFTERS_CAMP:      "hub_drifters_camp",            // Drifter's Camp; gates Kahl's Garrison; req. New War

    // =========================================================================
    // ORBITER SEGMENTS
    // =========================================================================

    // Obtained via Vor's Prize (base ship function; always present):
    SEGMENT_ARSENAL:                "segment_arsenal",
    SEGMENT_COMMUNICATIONS:         "segment_communications",
    SEGMENT_CODEX_SCANNER:          "segment_codex_scanner",
    SEGMENT_FOUNDRY:                "segment_foundry",
    SEGMENT_MODDING:                "segment_modding_table",

    // Obtained via Junctions or Quests:
    SEGMENT_INCUBATOR:              "segment_incubator",                // Companion incubation; granted via a junction
    SEGMENT_VOID_RELIC:             "segment_void_relic",               // Void fissures & relics
    SEGMENT_PERSONAL_QUARTERS:      "segment_personal_quarters",        // War Within quest reward; REQUIRED for Apostasy Prologue
    SEGMENT_MELEE_UPGRADE:          "segment_melee_upgrade",            // Melee Arcanes + Exilus slots; Whispers in the Walls reward

    // Helminth sub-segments (all require SEGMENT_HELMINTH installed first):
    SEGMENT_HELMINTH:               "segment_helminth",                 // Base Helminth subsume system;
                                                                        //   MR8 + Entrati rank 3 (Associate);
                                                                        //   purchased from Son for 15,000 Standing;
                                                                        //   also requires Heart of Deimos quest
    SEGMENT_HELMINTH_INVIGORATION:  "segment_helminth_invigoration",    // Weekly Invigoration buffs;
                                                                        //   MR8 + Entrati rank 5 (Family);
                                                                        //   purchased from Son for 30,000 Standing
    SEGMENT_HELMINTH_ARCHON_SHARD:  "segment_helminth_archon_shard",    // Archon Shard socketing into Warframes;
                                                                        //   blueprint reward from completing Veilbreaker
    SEGMENT_HELMINTH_COALESCENT:    "segment_helminth_coalescent",      // Archon Shard fusion (create Tauforged shards);
                                                                        //   purchased from Bird 3 (Cavia);
                                                                        //   req. Cavia rank 2 (Researcher)

    // =========================================================================
    // OPERATOR / FOCUS SYSTEM
    // =========================================================================

    FOCUS_UNLOCKED:                 "focus_system_unlocked",            // Focus passives (2 per school); req. Second Dream completion
    FOCUS_FULL:                     "focus_full_trees_unlocked",        // All 10 Ways per school unlockable;
                                                                        //   req. War Within + Saya's Vigil + visiting The Quills

    // Focus Schools (choose 1 at end of Second Dream; buy others for 50,000 Focus each):
    FOCUS_SCHOOL_ZENURIK:           "focus_school_zenurik",             // Energy/Void regen — most popular for energy sustain
    FOCUS_SCHOOL_VAZARIN:           "focus_school_vazarin",             // Healing / Operator survival
    FOCUS_SCHOOL_NARAMON:           "focus_school_naramon",             // Melee combo / shadow step
    FOCUS_SCHOOL_UNAIRU:            "focus_school_unairu",              // Defense stripping / armor break
    FOCUS_SCHOOL_MADURAI:           "focus_school_madurai",             // Damage amp / Void Strike (Eidolon meta)

    // =========================================================================
    // AMP SYSTEM (Operator weapon tiers)
    // Tiers 1–4 from The Quills (Cetus); tiers 5–7 from Vox Solaris (Fortuna)
    // =========================================================================

    AMP_MOTE:               "amp_mote",                                 // Starter Amp; req. War Within + visiting Quill Onkko
    AMP_SIROCCO:            "amp_sirocco",                              // Pre-built Amp reward from The New War
    AMP_TIER1:              "amp_tier1_parts",                          // Raplak/Pencha/Clapkra parts; req. Quills rank 1
    AMP_TIER2:              "amp_tier2_parts",                          // Shwaak/Shraksun/Juttni parts; req. Quills rank 2
    AMP_TIER3:              "amp_tier3_parts",                          // Granmu/Phahd/Lohrin parts; req. Quills rank 3
    AMP_TIER4:              "amp_tier4_parts",                          // Propa/Klebrik/Certus parts; req. Quills rank 4 (Architect)
    AMP_TIER5:              "amp_tier5_parts",                          // Propa scaffold / T5 brace; req. Vox Solaris rank 1
    AMP_TIER6:              "amp_tier6_parts",                          // T6 parts; req. Vox Solaris rank 2
    AMP_TIER7:              "amp_tier7_parts",                          // T7 parts (best-in-slot); req. Vox Solaris rank 3
    AMP_GILDING:            "amp_gilding_unlocked",                     // Gild Amp (base dmg boost + Lens slot); req. Quills rank 3 or Vox rank 3

    // =========================================================================
    // COMPANION SYSTEMS
    // =========================================================================

    COMPANION_KUBROW:               "companion_kubrow_breeding",        // Kubrow; req. Howl of the Kubrow + Incubator segment
    COMPANION_KAVAT:                "companion_kavat_breeding",         // Kavat; req. Incubator segment + Kavat Genetic Code (Mars Survival)
    COMPANION_HELMINTH_CHARGER:     "companion_helminth_charger",       // Req. Nidus Helminth cyst (natural or from another player) + Incubator
    COMPANION_MOA:                  "companion_moa",                    // MOA robotic companion; crafted in Fortuna; req. Solaris United rank 1
    COMPANION_HOUND:                "companion_hound",                  // Hound; obtained by keeping a defeated Sister of Parvos's Hound
    COMPANION_PREDASITE:            "companion_predasite",              // Req. Necralisk + Daughter (Son's sister); Deimos companion
    COMPANION_VULPAPHYLA:           "companion_vulpaphyla",             // Req. Necralisk + Daughter; Deimos fox companion
    COMPANION_NAUTILUS:             "companion_nautilus",               // Archwing companion; blueprint from Rising Tide quest

    // =========================================================================
    // NECRAMECH SYSTEM
    // =========================================================================

    NECRAMECH_UNLOCKED:     "system_necramech_unlocked",                // Deploy Necramech in open worlds + Railjack;
                                                                        //   req. Heart of Deimos quest;
                                                                        //   craft Voidrig or Bonewidow from Necraloid standing
    NECRAMECH_VOIDRIG:      "system_necramech_voidrig",                 // Voidrig (gun platform); req. Necraloid standing
    NECRAMECH_BONEWIDOW:    "system_necramech_bonewidow",               // Bonewidow (melee); req. Necraloid standing

    // =========================================================================
    // RAILJACK SYSTEM
    // =========================================================================

    RAILJACK_CONSTRUCTED:   "system_railjack_constructed",              // Railjack built + playable; req. Rising Tide quest
    RAILJACK_INTRINSICS:    "system_railjack_intrinsics",               // Intrinsics skill tree; unlocked on first Railjack mission
    RAILJACK_CORPUS_NODES:  "system_railjack_corpus_nodes",             // Corpus Proxima nodes; req. Call of the Tempestarii
    RAILJACK_VOID_STORMS:   "system_railjack_void_storms",              // Void Storm Fissures in Railjack; req. Call of the Tempestarii

    // =========================================================================
    // ENDGAME ACTIVITIES
    // =========================================================================

    // ---- Daily ----
    ACTIVITY_SORTIES:               "activity_sorties",                 // Daily 3-mission Sortie; req. War Within + MR5 + rank-30 frame
    ACTIVITY_EIDOLON_TERALYST:      "activity_eidolon_teralyst",        // Eidolon Teralyst (1-cap); req. Plains of Eidolon at night;
                                                                        //   effective hunting req. good Amp (T2+) + Operator arcanes
    ACTIVITY_EIDOLON_TRIDOLON:      "activity_eidolon_tridolon",        // Full Tridolon (3-cap: Tera + Gant + Hydro);
                                                                        //   req. Eidolon Teralyst experience + strong Amp (T4+)
    ACTIVITY_ROPALOLYST:            "activity_ropalolyst",              // Jupiter assassination boss node;
                                                                        //   req. New Strange + Jupiter junction clear

    // ---- Weekly ----
    ACTIVITY_ARCHON_HUNTS:          "activity_archon_hunts",            // Weekly 3-stage Archon fight; req. Veilbreaker + rank-30 frame
    ACTIVITY_KAHL_BREAK_NARMER:     "activity_kahl_break_narmer",       // Kahl weekly missions; req. Veilbreaker quest
    ACTIVITY_NETRACELLS:            "activity_netracells",              // 5x weekly Netracell runs; req. Whispers in the Walls
    ACTIVITY_ARBITRATIONS:          "activity_arbitrations",            // Arbitration rotation; req. Pluto-Eris junction task (Update 39+);
                                                                        //   rank-30 frame required; instant-death on down
    ACTIVITY_DEEP_ARCHIMEDEA:       "activity_deep_archimedea",         // Elite endgame activity; req. Whispers + Cavia rank 5 (Family)

    // ---- Open World Bounties ----
    ACTIVITY_CETUS_BOUNTIES:        "activity_cetus_bounties",          // Plains bounty missions; req. Cetus access
    ACTIVITY_FORTUNA_BOUNTIES:      "activity_fortuna_bounties",        // Vallis bounty missions; req. Fortuna access
    ACTIVITY_DEIMOS_BOUNTIES:       "activity_deimos_bounties",         // Cambion Drift bounties; req. Necralisk
    ACTIVITY_ZARIMAN_BOUNTIES:      "activity_zariman_bounties",        // Zariman Chrysalith missions; req. Angels of Zariman
    ACTIVITY_CAVIA_BOUNTIES:        "activity_cavia_bounties",          // Sanctum Anatomica bounties; req. Whispers in the Walls

    // ---- Open World Bosses ----
    ACTIVITY_PROFIT_TAKER:          "activity_profit_taker",            // Orb Vallis heist boss; req. Vox Solaris rank 5 (Old Mate) + Archwing
    ACTIVITY_EXPLOITER_ORB:         "activity_exploiter_orb",           // Orb Vallis thermia fight; req. Fortuna + Thermia Fractures active

    // ---- Steel Path ----
    ACTIVITY_STEEL_PATH:            "activity_steel_path",              // Steel Path star chart toggle;
                                                                        //   req. all nodes cleared up to The New War
                                                                        //   (Zariman/Sanctum/Hollvania nodes NOT required as of Hotfix 38.5.3)
    ACTIVITY_STEEL_PATH_HONORS:     "activity_steel_path_honors",       // Teshin's shop for Steel Essence; req. Steel Path + any Relay
    ACTIVITY_CIRCUIT_STEEL_PATH:    "activity_circuit_steel_path",      // Steel Path Circuit (Incarnon Genesis adapters);
                                                                        //   req. Duviri Paradox + Steel Path

    // ---- Void Fissures ----
    ACTIVITY_VOID_FISSURES:         "activity_void_fissures",           // Void Relic cracking; req. Void Relic segment
    ACTIVITY_VOID_STORMS:           "activity_void_storms",             // Railjack Void Fissures; req. Railjack + Call of Tempestarii

    // ---- Nemesis Systems ----
    ACTIVITY_KUVA_LICH:             "activity_kuva_lich",               // Kuva Lich nemesis; req. War Within + MR5 + Rising Tide
    ACTIVITY_SISTER_PARVOS:         "activity_sister_of_parvos",        // Sister of Parvos nemesis; req. Call of Tempestarii + Deadlock Protocol

    // ---- Zariman activities ----
    ACTIVITY_VOID_ANGELS:           "activity_void_angels",             // Void Angel fights in Zariman missions; req. Angels of Zariman
    ACTIVITY_CONJUNCTION_SURVIVAL:  "activity_conjunction_survival",    // Zariman Conjunction Survival missions; req. Angels of Zariman
    ACTIVITY_VOID_FLOOD:            "activity_void_flood",              // Zariman Void Flood missions; req. Angels of Zariman
    ACTIVITY_MIRROR_DEFENSE:        "activity_mirror_defense",          // Zariman Mirror Defense missions; req. Angels of Zariman

    // ---- The Circuit (Duviri) ----
    ACTIVITY_CIRCUIT:               "activity_the_circuit",             // Circuit run mode; req. Duviri Paradox
    ACTIVITY_CIRCUIT_STEEL_PATH_2:  "activity_circuit_sp",              // Steel Path Circuit; req. Duviri + Steel Path

    // =========================================================================
    // SYNDICATE RANK MILESTONES
    // (Track when specific rank-gated content becomes available)
    // =========================================================================

    // The Quills (Cetus) — gates Amp tiers and Mask of the Revenant:
    SYNDICATE_QUILLS_RANK1:         "syndicate_quills_rank1",           // Observer — T1 Amps + Mask of Revenant quest trigger
    SYNDICATE_QUILLS_RANK2:         "syndicate_quills_rank2",           // Adherent — T2 Amp parts + Amp gilding
    SYNDICATE_QUILLS_RANK3:         "syndicate_quills_rank3",           // Instrument — T3 Amp parts
    SYNDICATE_QUILLS_RANK4:         "syndicate_quills_rank4",           // Architect — T4 Amp parts (best from Quills)

    // Entrati (Necralisk) — gates Helminth:
    SYNDICATE_ENTRATI_RANK3:        "syndicate_entrati_rank3",          // Associate (rank 3) — Helminth Segment BP (also req. MR8)
    SYNDICATE_ENTRATI_RANK5:        "syndicate_entrati_rank5",          // Family (rank 5) — Helminth Invigoration Segment BP (also req. MR8)

    // Cavia (Sanctum Anatomica) — gates Coalescent + Deep Archimedea:
    SYNDICATE_CAVIA_RANK2:          "syndicate_cavia_rank2",            // Researcher — Helminth Coalescent Segment BP (Bird 3)
    SYNDICATE_CAVIA_RANK5:          "syndicate_cavia_rank5",            // Family — Deep Archimedea + weekly Archon Shard purchase

    // The Hex (Höllvania / 1999) — gates Temporal Archimedea:
    SYNDICATE_HEX_RANK5:            "syndicate_hex_rank5",              // Pizza Party (rank 5) — Temporal Archimedea access

    // Vox Solaris (Fortuna) — gates Profit-Taker + T5–7 Amp parts:
    SYNDICATE_VOX_RANK1:            "syndicate_vox_rank1",              // Little Duck contact — T5 Amp parts
    SYNDICATE_VOX_RANK2:            "syndicate_vox_rank2",              // Neutral — T6 Amp parts
    SYNDICATE_VOX_RANK3:            "syndicate_vox_rank3",              // Mistral — T7 Amp parts + Amp gilding
    SYNDICATE_VOX_RANK5:            "syndicate_vox_rank5",              // Old Mate — Profit-Taker Orb heist

    // =========================================================================
    // MASTERY RANK THRESHOLDS
    // =========================================================================

    MR_5:                           "mastery_rank_5",                   // Gates: Sorties, Vay Hek node on Oro (Earth)
    MR_8:                           "mastery_rank_8",                   // Gates: Helminth Segment + Invigoration Segment purchase
    MR_10:                          "mastery_rank_10",                  // Common informal threshold for certain content
    MR_15:                          "mastery_rank_15",                  // Various item purchase gates
    MR_30:                          "mastery_rank_30",                  // Riven cap, some quality-of-life features

} as const;

export type PrereqId = (typeof PR)[keyof typeof PR];