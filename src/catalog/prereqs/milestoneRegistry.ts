// ===== FILE: src/catalog/prereqs/milestoneRegistry.ts =====
//
// Milestone definitions — derived rollups of prereqs for high-level capability tracking.
// Updated: 2026-03 — covers all content through The Hex / The Old Peace.
//
// Design intent:
// - Milestones are derived; they are NOT directly user-completed.
// - Prereqs remain the canonical atomic progress tracking.
// - All references MUST be valid PR.* ids.

import { PR } from "../../domain/ids/prereqIds";
import type { PrereqId } from "../../domain/ids/prereqIds";

export type MilestoneCategory =
    | "Mainline"
    | "SideQuests"
    | "StarChart"
    | "Hubs"
    | "OpenWorlds"
    | "Systems"
    | "Orbiter"
    | "Segments"
    | "Focus"
    | "Amps"
    | "Companions"
    | "Necramech"
    | "Railjack"
    | "Helminth"
    | "Activities"
    | "Syndicates"
    | "Duviri"
    | "Kahl"
    | "Other";

export type MilestoneRule =
    | { type: "all"; prereqIds: PrereqId[] }
    | { type: "any"; prereqIds: PrereqId[]; need?: number };

export interface MilestoneDef {
    id: string;
    label: string;
    description: string;
    category: MilestoneCategory;
    showWhenComplete?: boolean;
    rule: MilestoneRule;
}

export const MILESTONE_REGISTRY: MilestoneDef[] = [

    // =========================================================================
    // MAINLINE STORY SPINE
    // =========================================================================
    {
        id: "ms_main_started",
        label: "Started Your Journey",
        description: "Completed the tutorial and opened the core progression spine.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.VORS_PRIZE] }
    },
    {
        id: "ms_main_operator_unlocked",
        label: "Operator Unlocked (The Second Dream)",
        description: "Operator mode is active. Major turning point in the Tenno story.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SECOND_DREAM, PR.FOCUS_UNLOCKED] }
    },
    {
        id: "ms_main_war_within_complete",
        label: "The War Within Complete",
        description: "Full Operator Transference unlocked, Focus tree fully accessible, Kuva Fortress open.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.WAR_WITHIN] }
    },
    {
        id: "ms_main_arc2_complete",
        label: "Arc 2 Complete (Chains → The Sacrifice)",
        description: "You have completed Chains of Harrow, Apostasy Prologue, and The Sacrifice.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.CHAINS_HARROW, PR.APOSTASY, PR.SACRIFICE] }
    },
    {
        id: "ms_main_new_war_complete",
        label: "The New War Complete",
        description: "Largest story milestone. Zariman, Veilbreaker, Archon Hunts, and Kahl content all unlocked.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.NEW_WAR] }
    },
    {
        id: "ms_main_zariman_chapter",
        label: "Zariman Chapter Reached",
        description: "Angels of the Zariman complete. Zariman hub and Holdfasts accessible.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ANGELS_ZARIMAN, PR.HUB_ZARIMAN] }
    },
    {
        id: "ms_main_whispers_chapter",
        label: "Sanctum Anatomica Chapter Reached",
        description: "Whispers in the Walls complete. Sanctum, Cavia, and Netracells accessible.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.WHISPERS_WALL, PR.HUB_SANCTUM] }
    },
    {
        id: "ms_main_1999_chapter",
        label: "1999 Chapter Reached (The Hex)",
        description: "The Hex complete. Höllvania and all 1999 content accessible.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.THE_HEX, PR.HUB_HOLLVANIA] }
    },
    {
        id: "ms_main_arc6_reached",
        label: "Arc 6 Reached (The Old Peace)",
        description: "⚠️ Update 41 content. The Old Peace complete. Dark Refractory and Descendia accessible.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.THE_OLD_PEACE] }
    },

    // =========================================================================
    // SIDE QUESTS
    // =========================================================================
    {
        id: "ms_sq_railjack_ready",
        label: "Rising Tide Complete",
        description: "Railjack construction quest done. Ship is buildable.",
        category: "SideQuests",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.RISING_TIDE] }
    },
    {
        id: "ms_sq_veilbreaker_complete",
        label: "Veilbreaker Complete",
        description: "Kahl's Garrison and Archon Hunts fully unlocked.",
        category: "SideQuests",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.VEILBREAKER] }
    },
    {
        id: "ms_sq_call_tempestarii",
        label: "Call of the Tempestarii Complete",
        description: "Sisters of Parvos system and Corpus Proxima Railjack nodes unlocked.",
        category: "SideQuests",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.CALL_TEMPESTARII] }
    },
    {
        id: "ms_sq_jade_shadows",
        label: "Jade Shadows Complete",
        description: "Jade Warframe blueprint available.",
        category: "SideQuests",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.JADE_SHADOWS] }
    },
    {
        id: "ms_sq_warframe_bp_quests_early",
        label: "Early Warframe BP Quests Done",
        description: "Hidden Messages (Mirage) and Howl of the Kubrow complete.",
        category: "SideQuests",
        rule: { type: "all", prereqIds: [PR.HIDDEN_MESSAGES, PR.HOWL_KUBROW] }
    },
    {
        id: "ms_sq_warframe_bp_quests_mid",
        label: "Mid Warframe BP Quests Done",
        description: "Limbo Theorem, Stolen Dreams, The New Strange, and Jordas Precept complete.",
        category: "SideQuests",
        rule: { type: "all", prereqIds: [PR.LIMBO_THEOREM, PR.JORDAS_PRECEPT, PR.GLAST_GAMBIT] }
    },
    {
        id: "ms_sq_warframe_bp_quests_all",
        label: "All Warframe BP Quests Done",
        description: "All warframe blueprint quests complete: Limbo, Titania, Inaros, Octavia, Atlas, Nidus, Revenant, Mirage, Mesa.",
        category: "SideQuests",
        rule: {
            type: "all",
            prereqIds: [
                PR.LIMBO_THEOREM, PR.SILVER_GROVE, PR.SANDS_INAROS, PR.OCTAVIA_ANTHEM,
                PR.JORDAS_PRECEPT, PR.GLAST_GAMBIT, PR.MASK_REVENANT,
                PR.HIDDEN_MESSAGES, PR.PATIENT_ZERO
            ]
        }
    },

    // =========================================================================
    // STAR CHART
    // =========================================================================
    {
        id: "ms_star_earth_to_mars",
        label: "Star Chart: Earth → Mars",
        description: "Core early junction. Unlocks Void Relic and Incubator segments.",
        category: "StarChart",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.JUNCTION_EARTH_MARS] }
    },
    {
        id: "ms_star_to_saturn",
        label: "Star Chart: Saturn Reached",
        description: "Europa → Saturn junction complete. Mid-game gate.",
        category: "StarChart",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.JUNCTION_EUROPA_SATURN] }
    },
    {
        id: "ms_star_to_sedna",
        label: "Star Chart: Sedna Reached",
        description: "Pluto → Sedna junction complete. Required for The War Within.",
        category: "StarChart",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.JUNCTION_PLUTO_SEDNA] }
    },
    {
        id: "ms_star_eris_reached",
        label: "Star Chart: Eris Reached",
        description: "Sedna → Eris junction complete. Unlocks Infested Salvage, Nidus quest, and Atlas quest.",
        category: "StarChart",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.JUNCTION_SEDNA_ERIS] }
    },
    {
        id: "ms_star_lua_reached",
        label: "Star Chart: Lua Reached",
        description: "Earth → Lua junction unlocked (requires The Second Dream). Unlocks Octavia's Anthem.",
        category: "StarChart",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.JUNCTION_EARTH_LUA] }
    },
    {
        id: "ms_star_kuva_fortress_reached",
        label: "Star Chart: Kuva Fortress Reached",
        description: "Eris → Kuva Fortress junction complete. Required for Kuva Lich system.",
        category: "StarChart",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.JUNCTION_ERIS_KUVA_FORTRESS] }
    },

    // =========================================================================
    // HUBS / OPEN WORLDS
    // =========================================================================
    {
        id: "ms_hub_first_open_world",
        label: "First Open World Accessible",
        description: "You have access to at least one open world hub.",
        category: "OpenWorlds",
        showWhenComplete: true,
        rule: { type: "any", prereqIds: [PR.HUB_CETUS, PR.HUB_FORTUNA, PR.HUB_NECRALISK], need: 1 }
    },
    {
        id: "ms_hub_cetus",
        label: "Cetus Access",
        description: "Plains of Eidolon accessible. Ostron standing available.",
        category: "Hubs",
        rule: { type: "all", prereqIds: [PR.HUB_CETUS] }
    },
    {
        id: "ms_hub_fortuna",
        label: "Fortuna Access",
        description: "Orb Vallis accessible. Solaris United and Vox Solaris standing available.",
        category: "Hubs",
        rule: { type: "all", prereqIds: [PR.HUB_FORTUNA] }
    },
    {
        id: "ms_hub_necralisk",
        label: "Necralisk Access",
        description: "Cambion Drift accessible. Entrati and Necraloid standing available.",
        category: "Hubs",
        rule: { type: "all", prereqIds: [PR.HUB_NECRALISK] }
    },
    {
        id: "ms_hub_all_three_core",
        label: "All Three Core Open Worlds Accessible",
        description: "Cetus, Fortuna, and Necralisk all accessible.",
        category: "OpenWorlds",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.HUB_CETUS, PR.HUB_FORTUNA, PR.HUB_NECRALISK] }
    },
    {
        id: "ms_hub_zariman",
        label: "Zariman Access",
        description: "Chrysalith and Holdfasts syndicate accessible.",
        category: "Hubs",
        rule: { type: "all", prereqIds: [PR.HUB_ZARIMAN] }
    },
    {
        id: "ms_hub_sanctum",
        label: "Sanctum Anatomica Access",
        description: "Cavia syndicate accessible.",
        category: "Hubs",
        rule: { type: "all", prereqIds: [PR.HUB_SANCTUM] }
    },
    {
        id: "ms_hub_hollvania",
        label: "Höllvania Access",
        description: "1999 content accessible.",
        category: "Hubs",
        rule: { type: "all", prereqIds: [PR.HUB_HOLLVANIA] }
    },
    {
        id: "ms_hub_all_open_worlds",
        label: "All Open Worlds Accessible",
        description: "All six hubs open: Cetus, Fortuna, Necralisk, Zariman, Sanctum, and Höllvania.",
        category: "OpenWorlds",
        showWhenComplete: true,
        rule: {
            type: "all",
            prereqIds: [
                PR.HUB_CETUS, PR.HUB_FORTUNA, PR.HUB_NECRALISK,
                PR.HUB_ZARIMAN, PR.HUB_SANCTUM, PR.HUB_HOLLVANIA
            ]
        }
    },

    // =========================================================================
    // ORBITER SEGMENTS
    // =========================================================================
    {
        id: "ms_orbiter_personal_quarters",
        label: "Personal Quarters Installed",
        description: "Apostasy Prologue can now be triggered.",
        category: "Orbiter",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SEGMENT_PERSONAL_QUARTERS] }
    },
    {
        id: "ms_orbiter_void_relics",
        label: "Void Relic Segment Installed",
        description: "Void Fissures and Relic refinement available.",
        category: "Orbiter",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SEGMENT_VOID_RELIC] }
    },
    {
        id: "ms_orbiter_incubator",
        label: "Incubator Installed",
        description: "Kubrow and Kavat companion breeding available.",
        category: "Orbiter",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SEGMENT_INCUBATOR] }
    },
    {
        id: "ms_orbiter_melee_upgrade",
        label: "Melee Upgrade Segment Installed",
        description: "Melee Exilus and Melee Arcane slots unlocked.",
        category: "Orbiter",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SEGMENT_MELEE_UPGRADE] }
    },

    // =========================================================================
    // HELMINTH
    // =========================================================================
    {
        id: "ms_helminth_base",
        label: "Helminth Unlocked",
        description: "Helminth subsume system active. Can subsume Warframe abilities.",
        category: "Helminth",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SEGMENT_HELMINTH] }
    },
    {
        id: "ms_helminth_invigorations",
        label: "Helminth Invigorations Available",
        description: "Weekly Invigoration buffs unlocked.",
        category: "Helminth",
        rule: { type: "all", prereqIds: [PR.SEGMENT_HELMINTH_INVIGORATION] }
    },
    {
        id: "ms_helminth_archon_shards",
        label: "Archon Shard Socketing Available",
        description: "Archon Shards can be slotted into Warframes for stat bonuses.",
        category: "Helminth",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SEGMENT_HELMINTH_ARCHON_SHARD] }
    },
    {
        id: "ms_helminth_coalescent",
        label: "Tauforged Shard Crafting Available",
        description: "Archon Shards can be fused into Tauforged shards for stronger bonuses.",
        category: "Helminth",
        rule: { type: "all", prereqIds: [PR.SEGMENT_HELMINTH_COALESCENT] }
    },
    {
        id: "ms_helminth_full",
        label: "Full Helminth System Unlocked",
        description: "All four Helminth segments installed: base, invigorations, Archon shards, and Coalescent.",
        category: "Helminth",
        showWhenComplete: true,
        rule: {
            type: "all",
            prereqIds: [
                PR.SEGMENT_HELMINTH,
                PR.SEGMENT_HELMINTH_INVIGORATION,
                PR.SEGMENT_HELMINTH_ARCHON_SHARD,
                PR.SEGMENT_HELMINTH_COALESCENT
            ]
        }
    },

    // =========================================================================
    // FOCUS / OPERATOR
    // =========================================================================
    {
        id: "ms_focus_partial",
        label: "Focus System Active (Partial)",
        description: "2 passives per school unlocked. Full tree requires The War Within + The Quills.",
        category: "Focus",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.FOCUS_UNLOCKED] }
    },
    {
        id: "ms_focus_full",
        label: "Full Focus Trees Unlocked",
        description: "All 10 Ways per school now unlockable. Requires War Within + Saya's Vigil + Quills rank 1.",
        category: "Focus",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.FOCUS_FULL] }
    },
    {
        id: "ms_focus_all_schools",
        label: "All Five Focus Schools Owned",
        description: "All five Focus schools available (one free at end of Second Dream; four more bought for 50k Focus each).",
        category: "Focus",
        rule: {
            type: "all",
            prereqIds: [
                PR.FOCUS_SCHOOL_ZENURIK, PR.FOCUS_SCHOOL_VAZARIN,
                PR.FOCUS_SCHOOL_NARAMON, PR.FOCUS_SCHOOL_UNAIRU,
                PR.FOCUS_SCHOOL_MADURAI
            ]
        }
    },

    // =========================================================================
    // AMPS
    // =========================================================================
    {
        id: "ms_amp_starter",
        label: "Mote Amp Available",
        description: "Starter Amp obtainable from Quill Onkko at Cetus.",
        category: "Amps",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.AMP_MOTE] }
    },
    {
        id: "ms_amp_eidolon_ready",
        label: "Amp: Eidolon-Ready (T4 Propa Build)",
        description: "T4 Amp parts unlocked from The Quills. Propa scaffold available for Tridolon runs.",
        category: "Amps",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.AMP_TIER4] }
    },
    {
        id: "ms_amp_endgame",
        label: "Amp: Endgame Tier (T7 Vox Solaris)",
        description: "Best-in-slot T7 Amp parts from Vox Solaris rank 3 available.",
        category: "Amps",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.AMP_TIER7] }
    },
    {
        id: "ms_amp_gilded",
        label: "Amp Gilding Unlocked",
        description: "Can gild Amps to boost base damage and add a Focus Lens slot.",
        category: "Amps",
        rule: { type: "all", prereqIds: [PR.AMP_GILDING] }
    },

    // =========================================================================
    // COMPANIONS
    // =========================================================================
    {
        id: "ms_companion_kubrow",
        label: "Kubrow Breeding Available",
        description: "Can breed Kubrow companions. Requires Howl of the Kubrow + Incubator.",
        category: "Companions",
        rule: { type: "all", prereqIds: [PR.COMPANION_KUBROW] }
    },
    {
        id: "ms_companion_kavat",
        label: "Kavat Breeding Available",
        description: "Can breed Kavat companions using Kavat Genetic Code (Mars Survival).",
        category: "Companions",
        rule: { type: "all", prereqIds: [PR.COMPANION_KAVAT] }
    },
    {
        id: "ms_companion_moa",
        label: "MOA Companion Available",
        description: "Can build MOA robotic companions in Fortuna.",
        category: "Companions",
        rule: { type: "all", prereqIds: [PR.COMPANION_MOA] }
    },
    {
        id: "ms_companion_deimos",
        label: "Deimos Companions Available",
        description: "Predasites and Vulpaphylas can be acquired through the Daughter at Necralisk.",
        category: "Companions",
        rule: { type: "any", prereqIds: [PR.COMPANION_PREDASITE, PR.COMPANION_VULPAPHYLA], need: 1 }
    },
    {
        id: "ms_companion_all_types",
        label: "All Companion Types Accessible",
        description: "All companion types are accessible: Kubrow, Kavat, Helminth Charger, MOA, Predasite, Vulpaphyla, and Nautilus.",
        category: "Companions",
        rule: {
            type: "all",
            prereqIds: [
                PR.COMPANION_KUBROW, PR.COMPANION_KAVAT, PR.COMPANION_HELMINTH_CHARGER,
                PR.COMPANION_MOA, PR.COMPANION_PREDASITE, PR.COMPANION_VULPAPHYLA,
                PR.COMPANION_NAUTILUS
            ]
        }
    },

    // =========================================================================
    // NECRAMECH
    // =========================================================================
    {
        id: "ms_necramech_unlocked",
        label: "Necramech System Unlocked",
        description: "Can deploy a Necramech in open worlds and Railjack. Required for The New War.",
        category: "Necramech",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.NECRAMECH_UNLOCKED] }
    },
    {
        id: "ms_necramech_both",
        label: "Both Necramechs Available",
        description: "Both Voidrig and Bonewidow blueprint parts unlocked from Necraloid standing.",
        category: "Necramech",
        rule: { type: "all", prereqIds: [PR.NECRAMECH_VOIDRIG, PR.NECRAMECH_BONEWIDOW] }
    },

    // =========================================================================
    // RAILJACK
    // =========================================================================
    {
        id: "ms_railjack_constructed",
        label: "Railjack Built",
        description: "Railjack is constructed and ready for missions.",
        category: "Railjack",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.RAILJACK_CONSTRUCTED] }
    },
    {
        id: "ms_railjack_intrinsics",
        label: "Railjack Intrinsics Active",
        description: "Intrinsics skill tree unlocked on first Railjack mission.",
        category: "Railjack",
        rule: { type: "all", prereqIds: [PR.RAILJACK_INTRINSICS] }
    },
    {
        id: "ms_railjack_full_access",
        label: "Full Railjack Access (Corpus Proxima + Void Storms)",
        description: "All Railjack node types available including Corpus Proxima and Void Storm Fissures.",
        category: "Railjack",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.RAILJACK_CORPUS_NODES, PR.RAILJACK_VOID_STORMS] }
    },

    // =========================================================================
    // ENDGAME ACTIVITIES
    // =========================================================================
    {
        id: "ms_activity_sorties",
        label: "Sorties Available",
        description: "Daily Sortie missions unlocked.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_SORTIES] }
    },
    {
        id: "ms_activity_arbitrations",
        label: "Arbitrations Available",
        description: "Endless endgame with instant-death mechanic unlocked.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_ARBITRATIONS] }
    },
    {
        id: "ms_activity_eidolon_basic",
        label: "Eidolon Hunting Started (Teralyst)",
        description: "Can fight the Teralyst (1-cap) on the Plains at night.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_EIDOLON_TERALYST] }
    },
    {
        id: "ms_activity_eidolon_full",
        label: "Tridolon Hunting Ready",
        description: "T4 Amp and Eidolon experience in place for full 3-cap runs.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_EIDOLON_TRIDOLON] }
    },
    {
        id: "ms_activity_archon_hunts",
        label: "Archon Hunts Available",
        description: "Weekly Archon fights unlocked. Archon Shards are now a progression resource.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_ARCHON_HUNTS] }
    },
    {
        id: "ms_activity_kahl",
        label: "Kahl's Garrison Available",
        description: "Kahl weekly missions unlocked.",
        category: "Kahl",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_KAHL_BREAK_NARMER] }
    },
    {
        id: "ms_activity_netracells",
        label: "Netracells Available",
        description: "Up to 5 weekly Netracell runs now available.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_NETRACELLS] }
    },
    {
        id: "ms_activity_deep_archimedea",
        label: "Deep Archimedea Available",
        description: "Elite weekly endgame content available. Cavia Family rank required.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_DEEP_ARCHIMEDEA] }
    },
    {
        id: "ms_activity_profit_taker",
        label: "Profit-Taker Heist Available",
        description: "Vox Solaris Old Mate rank reached. Profit-Taker heist unlocked.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_PROFIT_TAKER] }
    },
    {
        id: "ms_activity_steel_path",
        label: "Steel Path Available",
        description: "Star chart fully cleared (up to New War). Steel Path toggle unlocked.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_STEEL_PATH] }
    },
    {
        id: "ms_activity_steel_path_full",
        label: "Steel Path Fully Active (Honors + Circuit)",
        description: "Steel Path, Teshin's shop, and Steel Path Circuit all available.",
        category: "Activities",
        showWhenComplete: true,
        rule: {
            type: "all",
            prereqIds: [PR.ACTIVITY_STEEL_PATH, PR.ACTIVITY_STEEL_PATH_HONORS, PR.ACTIVITY_CIRCUIT_STEEL_PATH]
        }
    },
    {
        id: "ms_activity_kuva_lich",
        label: "Kuva Lich System Available",
        description: "Kuva Lich nemesis system unlocked.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_KUVA_LICH] }
    },
    {
        id: "ms_activity_sister_parvos",
        label: "Sister of Parvos System Available",
        description: "Sister of Parvos nemesis system unlocked.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_SISTER_PARVOS] }
    },
    {
        id: "ms_activity_both_nemesis",
        label: "Both Nemesis Systems Available",
        description: "Both Kuva Lich and Sister of Parvos systems unlocked.",
        category: "Activities",
        rule: { type: "all", prereqIds: [PR.ACTIVITY_KUVA_LICH, PR.ACTIVITY_SISTER_PARVOS] }
    },
    {
        id: "ms_activity_void_fissures",
        label: "Void Fissures Available",
        description: "Can crack Void Relics in Void Fissure missions.",
        category: "Activities",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_VOID_FISSURES] }
    },
    {
        id: "ms_activity_void_storms",
        label: "Void Storms Available",
        description: "Can crack Void Relics inside Railjack missions.",
        category: "Activities",
        rule: { type: "all", prereqIds: [PR.ACTIVITY_VOID_STORMS] }
    },
    {
        id: "ms_activity_zariman_all",
        label: "All Zariman Mission Types Available",
        description: "All four Zariman mission types accessible: Void Flood, Void Cascade, Mirror Defense, Conjunction Survival.",
        category: "Activities",
        rule: {
            type: "all",
            prereqIds: [
                PR.ACTIVITY_VOID_FLOOD, PR.ACTIVITY_VOID_ANGELS,
                PR.ACTIVITY_MIRROR_DEFENSE, PR.ACTIVITY_CONJUNCTION_SURVIVAL
            ]
        }
    },
    {
        id: "ms_activity_circuit",
        label: "The Circuit Available",
        description: "Duviri Circuit run mode accessible. Best source of Incarnon Genesis adapters.",
        category: "Duviri",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ACTIVITY_CIRCUIT] }
    },
    {
        id: "ms_activity_all_bounties",
        label: "All Open World Bounties Available",
        description: "Bounty missions available across all five open worlds: Plains, Vallis, Deimos, Zariman, Sanctum.",
        category: "Activities",
        rule: {
            type: "all",
            prereqIds: [
                PR.ACTIVITY_CETUS_BOUNTIES, PR.ACTIVITY_FORTUNA_BOUNTIES,
                PR.ACTIVITY_DEIMOS_BOUNTIES, PR.ACTIVITY_ZARIMAN_BOUNTIES,
                PR.ACTIVITY_CAVIA_BOUNTIES
            ]
        }
    },

    // =========================================================================
    // DUVIRI
    // =========================================================================
    {
        id: "ms_duviri_unlocked",
        label: "Duviri Unlocked",
        description: "The Duviri Paradox complete. Circuit and Drifter Intrinsics available.",
        category: "Duviri",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.DUVIRI_PARADOX] }
    },

    // =========================================================================
    // SYNDICATES — KEY MILESTONES
    // =========================================================================
    {
        id: "ms_syndicate_quills_t4",
        label: "The Quills: Architect Rank (T4 Amps)",
        description: "Max Quills rank reached. Best Eidolon-tier Amp parts available.",
        category: "Syndicates",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYNDICATE_QUILLS_RANK4] }
    },
    {
        id: "ms_syndicate_entrati_helminth",
        label: "Entrati: Helminth Segments Available",
        description: "Entrati Associate rank reached. Base Helminth segment purchasable.",
        category: "Syndicates",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYNDICATE_ENTRATI_RANK3] }
    },
    {
        id: "ms_syndicate_entrati_family",
        label: "Entrati: Family Rank",
        description: "Max Entrati rank reached. Helminth Invigoration segment purchasable.",
        category: "Syndicates",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYNDICATE_ENTRATI_RANK5] }
    },
    {
        id: "ms_syndicate_vox_old_mate",
        label: "Vox Solaris: Old Mate Rank",
        description: "Max Vox Solaris rank reached. Profit-Taker Orb heist unlocked.",
        category: "Syndicates",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYNDICATE_VOX_RANK5] }
    },
    {
        id: "ms_syndicate_cavia_family",
        label: "Cavia: Family Rank",
        description: "Max Cavia rank. Deep Archimedea and weekly Archon Shard purchasing unlocked.",
        category: "Syndicates",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYNDICATE_CAVIA_RANK5] }
    },
];