// src/catalog/prereqs/milestoneRegistry.ts
import { PR } from "../../domain/ids/prereqIds";
import type { PrereqId } from "../../domain/ids/prereqIds";

export type MilestoneCategory =
    | "Mainline"
    | "StarChart"
    | "Hubs"
    | "Systems"
    | "Railjack"
    | "Duviri"
    | "OpenWorlds"
    | "Orbiter"
    | "Helminth"
    | "Kahl"
    | "Other";

export type MilestoneRule =
    | {
          type: "all";
          prereqIds: PrereqId[];
      }
    | {
          type: "any";
          prereqIds: PrereqId[];
          /**
           * Default: 1
           */
          need?: number;
      };

export interface MilestoneDef {
    id: string;
    label: string;
    description: string;
    category: MilestoneCategory;

    /**
     * If true, show milestone even when complete (useful for major “chapter” markers).
     * Default: false.
     */
    showWhenComplete?: boolean;

    /**
     * Derived completion rule.
     */
    rule: MilestoneRule;
}

/**
 * Milestones are derived rollups of prereqs. They are NOT directly user-completed.
 *
 * Design intent:
 * - Milestones provide higher-level “chapter / capability” markers.
 * - Prereqs remain the canonical atomic progress tracking.
 * - All references MUST be valid PR.* ids (no guessing, no unknown ids).
 */
export const MILESTONE_REGISTRY: MilestoneDef[] = [
    // -----------------------------
    // Mainline (story spine)
    // -----------------------------
    {
        id: "ms_main_started",
        label: "Started Your Journey",
        description: "You have completed the tutorial and entered the core progression spine.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.VORS_PRIZE] }
    },
    {
        id: "ms_main_open_worlds_introduced",
        label: "First Open World Introduced",
        description: "You have access to at least one open world hub (Cetus, Fortuna, or Necralisk).",
        category: "OpenWorlds",
        showWhenComplete: true,
        rule: {
            type: "any",
            prereqIds: [PR.HUB_CETUS, PR.HUB_FORTUNA, PR.HUB_NECRALISK],
            need: 1
        }
    },
    {
        id: "ms_main_operator_chapter",
        label: "Operator Chapter Reached",
        description: "Operator is unlocked (major turning point in mainline progression).",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SECOND_DREAM, PR.SYSTEM_OPERATOR] }
    },
    {
        id: "ms_main_war_within_complete",
        label: "The War Within Complete",
        description: "You have completed The War Within and advanced Operator progression systems.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.WAR_WITHIN] }
    },
    {
        id: "ms_main_personal_quarters",
        label: "Personal Quarters Available",
        description: "Your Orbiter Personal Quarters are accessible (required for certain story steps).",
        category: "Orbiter",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYSTEM_ORBITER_PERSONAL_QUARTERS] }
    },
    {
        id: "ms_main_harrow_chain_complete",
        label: "Chains of Harrow Complete",
        description: "You have completed Chains of Harrow (mainline continuation).",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.CHAINS_HARROW] }
    },
    {
        id: "ms_main_apostasy_and_sacrifice",
        label: "Apostasy Prologue + The Sacrifice Complete",
        description: "You have completed Apostasy Prologue and The Sacrifice.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.APOSTASY, PR.SACRIFICE] }
    },
    {
        id: "ms_main_new_war_complete",
        label: "The New War Complete",
        description: "Major story arc milestone, unlocking post-New War systems and content.",
        category: "Mainline",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.NEW_WAR] }
    },
    {
        id: "ms_main_archon_hunts",
        label: "Archon Hunts Available",
        description: "Archon Hunts are unlocked (post-New War capability).",
        category: "Systems",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYSTEM_ARCHON_HUNTS] }
    },
    {
        id: "ms_main_zariman_chapter",
        label: "Zariman Chapter Reached",
        description: "You have access to the Zariman and Holdfasts content.",
        category: "Hubs",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.ANGELS_ZARIMAN, PR.HUB_ZARIMAN] }
    },
    {
        id: "ms_main_whispers_chapter",
        label: "Sanctum Anatomica Chapter Reached",
        description: "You have access to Sanctum Anatomica and Cavia content.",
        category: "Hubs",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.WHISPERS_WALL, PR.HUB_SANCTUM] }
    },

    // -----------------------------
    // Star Chart (junction gates modeled as prereqs)
    // -----------------------------
    {
        id: "ms_star_earth_to_mars",
        label: "Star Chart: Earth → Mars Junction Complete",
        description: "Early Star Chart gate that enables core progression features.",
        category: "StarChart",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.JUNCTION_EARTH_MARS] }
    },
    {
        id: "ms_star_saturn_to_uranus",
        label: "Star Chart: Saturn → Uranus Junction Complete",
        description: "Mid-Star Chart gate used as a prerequisite for certain major content.",
        category: "StarChart",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.JUNCTION_SATURN_URANUS] }
    },

    // -----------------------------
    // Hubs / Open Worlds
    // -----------------------------
    {
        id: "ms_hub_cetus",
        label: "Cetus Access",
        description: "You can enter Cetus and the Plains of Eidolon.",
        category: "Hubs",
        rule: { type: "all", prereqIds: [PR.HUB_CETUS] }
    },
    {
        id: "ms_hub_fortuna",
        label: "Fortuna Access",
        description: "You can enter Fortuna and Orb Vallis.",
        category: "Hubs",
        rule: { type: "all", prereqIds: [PR.HUB_FORTUNA] }
    },
    {
        id: "ms_hub_necralisk",
        label: "Necralisk Access",
        description: "You can enter the Necralisk on Deimos.",
        category: "Hubs",
        rule: { type: "all", prereqIds: [PR.HUB_NECRALISK] }
    },
    {
        id: "ms_open_worlds_all_three",
        label: "All Three Core Open Worlds Accessible",
        description: "You have access to Cetus, Fortuna, and Necralisk.",
        category: "OpenWorlds",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.HUB_CETUS, PR.HUB_FORTUNA, PR.HUB_NECRALISK] }
    },

    // -----------------------------
    // Systems (high-level capabilities)
    // -----------------------------
    {
        id: "ms_system_operator_unlocked",
        label: "Operator Unlocked",
        description: "Operator system is available.",
        category: "Systems",
        rule: { type: "all", prereqIds: [PR.SYSTEM_OPERATOR] }
    },
    {
        id: "ms_system_necramech_owned",
        label: "Necramech Owned",
        description: "You own at least one Necramech.",
        category: "Systems",
        rule: { type: "all", prereqIds: [PR.SYSTEM_NECRAMECH] }
    },

    // -----------------------------
    // Orbiter Segments
    // -----------------------------
    {
        id: "ms_orbiter_void_relics",
        label: "Void Relics Available",
        description: "Void Relic refinement and related UI are available.",
        category: "Orbiter",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYSTEM_ORBITER_VOID_RELICS] }
    },
    {
        id: "ms_orbiter_melee_upgrade",
        label: "Melee Upgrade Segment Installed",
        description: "Melee Exilus and Melee Arcane slots are available (Tennokai-related gate).",
        category: "Orbiter",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYSTEM_ORBITER_MELEE_UPGRADE] }
    },

    // -----------------------------
    // Railjack
    // -----------------------------
    {
        id: "ms_railjack_quest_complete",
        label: "Rising Tide Complete",
        description: "You have completed Rising Tide (Railjack ownership progression).",
        category: "Railjack",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.RISING_TIDE] }
    },
    {
        id: "ms_railjack_owned",
        label: "Railjack Owned (Ship Built)",
        description: "You own a Railjack and can run Railjack missions.",
        category: "Railjack",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYSTEM_RAILJACK] }
    },

    // -----------------------------
    // Helminth and upgrades
    // -----------------------------
    {
        id: "ms_helminth_unlocked",
        label: "Helminth Unlocked",
        description: "Helminth infirmary is usable (segment acquired and installed).",
        category: "Helminth",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.SYSTEM_HELMINTH] }
    },
    {
        id: "ms_helminth_invigorations",
        label: "Helminth Invigorations Available",
        description: "Invigorations are available (requires Helminth unlocked and segment installed).",
        category: "Helminth",
        rule: { type: "all", prereqIds: [PR.SYSTEM_HELMINTH_INVIGORATIONS] }
    },
    {
        id: "ms_helminth_archon_shards",
        label: "Helminth Archon Shards Available",
        description: "Helminth Archon Shard operations are available (post-New War progression).",
        category: "Helminth",
        rule: { type: "all", prereqIds: [PR.SYSTEM_HELMINTH_ARCHON_SHARDS] }
    },
    {
        id: "ms_helminth_coalescent",
        label: "Helminth Coalescent Segment Available",
        description: "Helminth Coalescent segment is available after Sanctum/Cavia progression.",
        category: "Helminth",
        rule: { type: "all", prereqIds: [PR.SYSTEM_HELMINTH_COALESCENT] }
    },

    // -----------------------------
    // Kahl / Veilbreaker
    // -----------------------------
    {
        id: "ms_veilbreaker_complete",
        label: "Veilbreaker Complete",
        description: "Veilbreaker content is unlocked (Kahl progression path).",
        category: "Kahl",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.VEILBREAKER] }
    },
    {
        id: "ms_kahl_garrison_available",
        label: "Kahl’s Garrison Available",
        description: "Kahl weekly missions and related progression are available.",
        category: "Kahl",
        rule: { type: "all", prereqIds: [PR.SYSTEM_KAHL_GARRISON] }
    },

    // -----------------------------
    // Duviri
    // -----------------------------
    {
        id: "ms_duviri_unlocked",
        label: "Duviri Unlocked",
        description: "Duviri access is available (modeled as a quest prereq gate).",
        category: "Duviri",
        showWhenComplete: true,
        rule: { type: "all", prereqIds: [PR.DUVIRI_PARADOX] }
    }
];

