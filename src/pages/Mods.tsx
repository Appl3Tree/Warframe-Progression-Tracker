// src/pages/Mods.tsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import MODS_RAW from "../data/mods.json";
import RIVENS_RAW from "../data/rivens.json";
import MODDESC_RAW from "../data/moddescriptions.json";
import ALL_RAW from "../data/All.json";
import MOD_LOCATIONS_RAW from "../../external/warframe-drop-data/raw/modLocations.json";

// Build a lookup from All.json keyed by uniqueName — includes Mods + Arcanes
interface AllModDrop {
  chance: number;
  location: string;
  rarity: string;
  type: string;
}
interface AllModEntry {
  uniqueName: string;
  name: string;
  category?: string;
  compatName?: string;
  type?: string;
  rarity?: string;
  baseDrain?: number;
  fusionLimit?: number;
  isExilus?: boolean;
  isAugment?: boolean;
  isUtility?: boolean;
  isPrime?: boolean;
  imageName?: string;
  levelStats?: { stats: string[] }[];
  drops?: AllModDrop[];
  introduced?: { name: string; date?: string };
  releaseDate?: string;
  tradable?: boolean;
  transmutable?: boolean;
  description?: string;
  modSet?: string;
  modSetValues?: number[];
  polarity?: string;
  wikiaThumbnail?: string;
  wikiaUrl?: string;
}
const VANILLA_CUTOFF = "2013-03-25";

function formatReleaseDate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  if (date <= VANILLA_CUTOFF) return "Vanilla";
  return date;
}

type ModSortKey = "az" | "release-newest" | "release-oldest";

const ALL_MODS_BY_PATH: Record<string, AllModEntry> = {};
// Name-based fallback — used when mods.json path doesn't match All.json uniqueName
const ALL_MODS_BY_NAME: Record<string, AllModEntry> = {};
// Arcane lookup by name (arcanes use name not uniqueName as key in some contexts)
const ALL_ARCANES_BY_NAME: Record<string, AllModEntry> = {};
for (const item of ALL_RAW as AllModEntry[]) {
  if (!item.uniqueName) continue;
  if (item.category === "Mods") {
    const existing = ALL_MODS_BY_PATH[item.uniqueName];
    if (!existing || (item.levelStats && !existing.levelStats)) {
      ALL_MODS_BY_PATH[item.uniqueName] = item as AllModEntry;
    }
    // Name index — prefer entries with levelStats
    if (item.name) {
      const existingByName = ALL_MODS_BY_NAME[item.name];
      if (!existingByName || (item.levelStats && !existingByName.levelStats)) {
        ALL_MODS_BY_NAME[item.name] = item as AllModEntry;
      }
    }
  } else if (item.category === "Arcanes") {
    if (item.name) ALL_ARCANES_BY_NAME[item.name] = item as AllModEntry;
    ALL_MODS_BY_PATH[item.uniqueName] = item as AllModEntry;
  }
}

const MODDESC: Record<
  string,
  { LocTag?: string; Ranks?: Record<string, string>[] }
> = MODDESC_RAW as Record<
  string,
  { LocTag?: string; Ranks?: Record<string, string>[] }
>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocKeyWordScript {
  [key: string]: number[] | string | unknown;
}

interface ModUpgrade {
  UpgradeType?: string;
  Value?: number;
  DisplayAsPercent?: number;
  OperationType?: string;
  LocTag?: string;
  LocKeyWordScript?: LocKeyWordScript;
}

interface ModData {
  ArtifactPolarity?: string;
  BaseDrain?: string;
  FusionLimit?: string;
  FusionLimitRange?: [number, number];
  ItemCompatibility?: string;
  Upgrades?: ModUpgrade[];
  Rarity?: string;
}

interface ModEntry {
  path: string;
  name: string;
  categories?: string[];
  data?: ModData;
  parents?: string[];
}

type ModSection = "mods" | "arcanes";

type ModCategory =
  | "all"
  | "warframe"
  | "aura"
  | "augment"
  | "primary"
  | "secondary"
  | "melee"
  | "exilus"
  | "vehicles"
  | "archgun"
  | "archmelee"
  | "robotic"
  | "beast"
  | "railjack"
  | "antique"
  | "parazon"
  | "tome"
  | "rivens";

type ArcaneCategory =
  | "all"
  | "warframe"
  | "operator"
  | "amps"
  | "tektolyst"
  | "primary"
  | "secondary"
  | "melee"
  | "kitguns"
  | "zaws";

type Polarity = "madurai" | "vazarin" | "naramon" | "zenurik" | "umbra" | "any";

type ParazonFilter = "all" | "requiem" | "antivirus";

// ─── Constants ────────────────────────────────────────────────────────────────

const MOD_CATEGORIES: { key: ModCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "warframe", label: "Warframe" },
  { key: "aura", label: "Aura" },
  { key: "augment", label: "Augment" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "melee", label: "Melee" },
  { key: "exilus", label: "Exilus" },
  { key: "vehicles", label: "Vehicles" },
  { key: "archgun", label: "Archgun" },
  { key: "archmelee", label: "Archmelee" },
  { key: "robotic", label: "Robotic" },
  { key: "beast", label: "Beast" },
  { key: "railjack", label: "Railjack" },
  { key: "antique", label: "Antique" },
  { key: "rivens", label: "Rivens" },
  { key: "parazon", label: "Parazon" },
  { key: "tome", label: "Tome" },
];

const ARCANE_CATEGORIES: { key: ArcaneCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "warframe", label: "Warframe" },
  { key: "operator", label: "Operator" },
  { key: "amps", label: "Amps" },
  { key: "tektolyst", label: "Tektolyst Artifacts" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "melee", label: "Melee" },
  { key: "kitguns", label: "Kitguns" },
  { key: "zaws", label: "Zaws" },
];

// Polarity SVG assets — use ?url so Vite returns URL strings, not React components
const _polImgs = import.meta.glob<string>("../assets/polarities/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
const POL_IMG: Record<string, string> = {};
for (const [p, url] of Object.entries(_polImgs)) {
  const name = p.split("/").pop()!.replace(".svg", "").toLowerCase();
  POL_IMG[name] = url as string;
}

// Status effect PNG assets
const _statusImgs = import.meta.glob<string>("../assets/statuses/*.png", {
  eager: true,
  import: "default",
});
const STATUS_IMG: Record<string, string> = {};
for (const [p, url] of Object.entries(_statusImgs)) {
  const name = p.split("/").pop()!.replace(".png", "").toLowerCase();
  STATUS_IMG[name] = url;
}

// Map DT_ color tags → status image filenames (both bare and _COLOR variants)
const DT_TO_IMG: Record<string, string> = {
  dt_corrosive_color: "essentialcorrosiveglyph",
  dt_corrosive: "essentialcorrosiveglyph",
  dt_electricity_color: "electricmodbundleicon",
  dt_electricity: "electricmodbundleicon",
  dt_explosion_color: "essentialblastglyph",
  dt_explosion: "essentialblastglyph",
  dt_fire_color: "heatmodbundleicon",
  dt_fire: "heatmodbundleicon",
  dt_freeze_color: "coldmodbundleicon",
  dt_freeze: "coldmodbundleicon",
  dt_gas_color: "essentialgasglyph",
  dt_gas: "essentialgasglyph",
  dt_impact_color: "essentialimpactglyph",
  dt_magnetic_color: "essentialmagneticglyph",
  dt_magnetic: "essentialmagneticglyph",
  dt_poison_color: "toxinmodbundleicon",
  dt_poison: "toxinmodbundleicon",
  dt_puncture_color: "essentialpunctureglyph",
  dt_radiant_color: "essentialradiationglyph",
  dt_radiation_color: "essentialradiationglyph",
  dt_radiation: "essentialradiationglyph",
  dt_sentient_color: "essentialtauglyph",
  dt_sentient: "essentialtauglyph",
  dt_slash_color: "essentialslashglyph",
  dt_slash: "essentialslashglyph",
  dt_viral_color: "essentialviralglyph",
  dt_viral: "essentialviralglyph",
};

/** Render a description/stat string:
 *  - Replaces <DT_*> / <DT_*_COLOR> tags with inline status icons
 *  - Strips other formatting tags (<AFFINITY_SHARE>, <HEALTH>, etc.)
 *  - Renders |VAR| placeholders as a subtle "mod-scaled" badge
 */
function renderStatString(stat: string): React.ReactNode {
  const cleaned = stat
    .replace(/<LINE_SEPARATOR>/g, " · ")
    .replace(/<LOWER_IS_BETTER>/g, "")
    .replace(/<[A-Z_]+_SECONDARY_COLOR>/g, "")
    .replace(/<\/[A-Z_]+_SECONDARY_COLOR>/g, "")
    .replace(/<(?!DT_)[A-Z_]+>/g, "");

  // Split on DT_ damage type tags, |VARIABLE| tokens, and newlines
  const parts = cleaned.split(/(<DT_[A-Z_]+>|\|[A-Z_0-9]+\||\n)/);
  if (parts.length === 1) return <>{cleaned}</>;

  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "\n") {
      nodes.push(<br key={i} />);
    } else if (part.startsWith("<DT_") && part.endsWith(">")) {
      const key = part.slice(1, -1).toLowerCase();
      const imgName = DT_TO_IMG[key];
      const imgUrl = imgName ? STATUS_IMG[imgName] : null;
      if (imgUrl) {
        nodes.push(
          <img
            key={i}
            src={imgUrl}
            alt={key.replace("dt_", "").replace("_color", "")}
            title={key
              .replace("dt_", "")
              .replace(/_color$/, "")
              .replace(/_/g, " ")}
            className="inline w-3.5 h-3.5 object-contain mx-0.5 -mt-0.5"
          />,
        );
      }
    } else if (part.startsWith("|") && part.endsWith("|")) {
      const label = part.slice(1, -1).toLowerCase().replace(/_/g, " ");
      nodes.push(
        <span
          key={i}
          className="inline-flex items-center rounded px-1 py-0 text-[10px] font-mono bg-slate-700/60 text-slate-400 border border-slate-600/50 mx-0.5"
          title="Exact value scales with Warframe stats and mods"
        >
          {label}
        </span>,
      );
    } else if (part) {
      nodes.push(<span key={i}>{part}</span>);
    }
  }
  return <>{nodes}</>;
}
// Helper: get polarity image URL by AP_ key
function polImg(ap: string | undefined): string | null {
  if (!ap) return null;
  const key = ap.replace("AP_", "").toLowerCase();
  // Map AP names to file names
  const fileMap: Record<string, string> = {
    attack: "madurai_pol",
    defense: "vazarin_pol",
    tactic: "naramon_pol",
    power: "zenurik_pol",
    umbra: "umbra_pol",
    ward: "unairu_pol",
    penjaga: "penjaga_pol",
    any: "any_pol",
  };
  const fname = fileMap[key];
  if (!fname) return null;
  return POL_IMG[fname] ?? null;
}


/** Convert All.json polarity name (e.g. "naramon") to AP_ format (e.g. "AP_TACTIC")
 *  so it works with polImg() and polarityLabel() */
const POLARITY_NAME_TO_AP: Record<string, string> = {
  madurai: "AP_ATTACK",
  vazarin: "AP_DEFENSE",
  naramon: "AP_TACTIC",
  zenurik: "AP_POWER",
  umbra: "AP_UMBRA",
  unairu: "AP_WARD",
  penjaga: "AP_PENJAGA",
  any: "AP_ANY",
};
function toAP(polarity: string | undefined): string | undefined {
  if (!polarity) return undefined;
  if (polarity.startsWith("AP_")) return polarity; // already in AP_ format
  return POLARITY_NAME_TO_AP[polarity.toLowerCase()];
}

const POLARITIES: { key: Polarity; label: string; ap: string }[] = [
  { key: "madurai", label: "Madurai", ap: "AP_ATTACK" },
  { key: "vazarin", label: "Vazarin", ap: "AP_DEFENSE" },
  { key: "naramon", label: "Naramon", ap: "AP_TACTIC" },
  { key: "zenurik", label: "Zenurik", ap: "AP_POWER" },
  { key: "umbra", label: "Umbra", ap: "AP_UMBRA" },
  { key: "any", label: "Any", ap: "AP_ANY" },
];

// Endo + credit base costs (EBC/CrBC) by rarity — verified from Warframe wiki
// Endo:   Common=10, Uncommon/Peculiar=20, Rare/Amalgam/Riven=30, Legendary=40
// Credit: Common=483, Uncommon/Peculiar=966, Rare/Amalgam/Riven=1449, Legendary=1932
const ENDO_BASE: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 20,
  PECULIAR: 20,
  RARE: 30,
  AMALGAM: 30,
  LEGENDARY: 40,
};
const CREDIT_BASE: Record<string, number> = {
  COMMON: 483,
  UNCOMMON: 966,
  PECULIAR: 966,
  RARE: 1449,
  AMALGAM: 1449,
  LEGENDARY: 1932,
};

/** Calculate total endo cost from fromRank (exclusive) to toRank (inclusive).
 *  Formula: sum of EBC × 2^r for r from fromRank to toRank-1
 *  Which equals: EBC × 2^fromRank × (2^(toRank-fromRank) - 1)
 */
function calcEndoCost(
  rarity: string | undefined,
  fromRank: number,
  toRank: number,
): number {
  const ebc = ENDO_BASE[rarity?.toUpperCase() ?? "COMMON"] ?? 10;
  if (toRank <= fromRank) return 0;
  // Sum EBC × 2^r for r = fromRank..toRank-1
  let total = 0;
  for (let r = fromRank; r < toRank; r++) {
    total += ebc * Math.pow(2, r);
  }
  return total;
}

/** Calculate total credit cost from fromRank (exclusive) to toRank (inclusive).
 *  Same formula structure as endo but using CrBC.
 */
function calcCreditCost(
  rarity: string | undefined,
  fromRank: number,
  toRank: number,
): number {
  const crbc = CREDIT_BASE[rarity?.toUpperCase() ?? "COMMON"] ?? 483;
  if (toRank <= fromRank) return 0;
  let total = 0;
  for (let r = fromRank; r < toRank; r++) {
    total += crbc * Math.pow(2, r);
  }
  return total;
}

const UPGRADE_TYPE_LABELS: Record<string, string> = {
  WEAPON_DAMAGE_AMOUNT: "Damage",
  WEAPON_FIRE_RATE: "Fire Rate",
  WEAPON_RELOAD_SPEED: "Reload Speed",
  WEAPON_AMMO_EFFICIENCY: "Ammo Efficiency",
  WEAPON_AMMO_MAX: "Ammo Max",
  WEAPON_MULTISHOT: "Multishot",
  WEAPON_RANGE: "Range",
  WEAPON_PUNCH_THROUGH: "Punch Through",
  WEAPON_ZOOM: "Zoom",
  WEAPON_CRITICAL_CHANCE: "Critical Chance",
  WEAPON_CRITICAL_DAMAGE: "Critical Damage",
  WEAPON_STATUS_CHANCE: "Status Chance",
  WEAPON_STATUS_DURATION: "Status Duration",
  WEAPON_RECOIL: "Recoil",
  WEAPON_SPREAD: "Accuracy",
  WEAPON_DAMAGE_TYPE_FIRE: "Heat Damage",
  WEAPON_DAMAGE_TYPE_COLD: "Cold Damage",
  WEAPON_DAMAGE_TYPE_ELECTRIC: "Electric Damage",
  WEAPON_DAMAGE_TYPE_TOXIN: "Toxin Damage",
  WEAPON_DAMAGE_TYPE_BLAST: "Blast Damage",
  WEAPON_DAMAGE_TYPE_CORROSIVE: "Corrosive Damage",
  WEAPON_DAMAGE_TYPE_VIRAL: "Viral Damage",
  WEAPON_DAMAGE_TYPE_RADIATION: "Radiation Damage",
  WEAPON_DAMAGE_TYPE_MAGNETIC: "Magnetic Damage",
  WEAPON_DAMAGE_TYPE_GAS: "Gas Damage",
  WEAPON_AMMO_CONSUME_RATE: "Ammo Consumption",
  AVATAR_ABILITY_STRENGTH: "Ability Strength",
  AVATAR_ABILITY_DURATION: "Ability Duration",
  AVATAR_ABILITY_RANGE: "Ability Range",
  AVATAR_ABILITY_EFFICIENCY: "Ability Efficiency",
  AVATAR_MAX_SHIELDS: "Shield Capacity",
  AVATAR_MAX_HEALTH: "Health",
  AVATAR_MAX_POWER: "Energy Max",
  AVATAR_POWER_REGEN: "Energy Regen",
  AVATAR_ARMOR: "Armor",
  AVATAR_SPRINT_BOOST: "Sprint Speed",
  AVATAR_ABILITY_AUGMENT: "Ability Augment",
  MELEE_ATTACK_SPEED: "Attack Speed",
  MELEE_CRITICAL_CHANCE: "Critical Chance",
  MELEE_CRITICAL_DAMAGE: "Critical Damage",
  MELEE_STATUS_CHANCE: "Status Chance",
  MELEE_RANGE: "Melee Range",
  MELEE_CHANNELING_EFFICIENCY: "Channeling Efficiency",
};

function labelForUpgradeType(type: string | undefined): string {
  if (!type) return "Effect";
  return (
    UPGRADE_TYPE_LABELS[type] ??
    type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeMaxRank(qa: string | undefined): number {
  switch (qa) {
    case "QA_NONE":
      return 0;
    case "QA_LOW":
      return 3;
    case "QA_MEDIUM":
      return 5;
    case "QA_HIGH":
      return 5;
    case "QA_VERY_HIGH":
      return 10;
    default:
      return 5;
  }
}

function decodeBaseDrain(qa: string | undefined): number {
  switch (qa) {
    case "QA_NONE":
      return 0;
    case "QA_LOW":
      return 2;
    case "QA_MEDIUM":
      return 4;
    case "QA_HIGH":
      return 6;
    case "QA_VERY_HIGH":
      return 10;
    default:
      return 4;
  }
}

function formatValue(v: number, displayAsPercent: number | undefined): string {
  if (displayAsPercent) {
    const pct = Math.round(v * 100 * 10) / 10;
    return (v >= 0 ? "+" : "") + pct + "%";
  }
  return (v >= 0 ? "+" : "") + String(Math.round(v * 100) / 100);
}

function polarityLabel(ap: string | undefined): string {
  const p = POLARITIES.find((x) => x.ap === ap);
  if (p) return p.label;
  if (ap === "AP_WARD") return "Aura";
  if (ap === "AP_PRECEPT") return "Precept";
  return ap ? ap.replace("AP_", "") : "—";
}

function rarityColor(rarity: string | undefined): string {
  switch (rarity) {
    case "COMMON":
      return "text-slate-400";
    case "UNCOMMON":
      return "text-amber-400";
    case "RARE":
      return "text-orange-400";
    case "LEGENDARY":
      return "text-cyan-300";
    default:
      return "text-slate-400";
  }
}

function rarityBg(rarity: string | undefined): string {
  switch (rarity) {
    case "COMMON":
      return "bg-slate-800/60 border-slate-700";
    case "UNCOMMON":
      return "bg-amber-950/30 border-amber-800/50";
    case "RARE":
      return "bg-orange-950/30 border-orange-800/50";
    case "LEGENDARY":
      return "bg-cyan-950/30 border-cyan-800/50";
    default:
      return "bg-slate-800/60 border-slate-700";
  }
}

function normalize(s: string): string {
  return s.toLowerCase();
}

// ─── Classification ────────────────────────────────────────────────────────────

// Set of compatName values that indicate a specific warframe augment
// (frame name as compatName, e.g. "Volt", "Excalibur", "Khora")
const KNOWN_GENERIC_COMPAT = new Set([
  "WARFRAME",
  "ANY",
  "COMPANION",
  "ROBOTIC",
  "BEAST",
  "AURA",
  "PRIMARY",
  "Melee",
  "Pistol",
  "Shotgun",
  "Rifle",
  "Assault Rifle",
  "Sniper",
  "Bow",
  "K-Drive",
  "Archwing",
  "Necramech",
  "Archgun",
  "Archmelee",
  "Moa",
  "Hound",
  "Kavat",
  "Kubrow",
  "Sentinel",
  "Parazon",
  "Tome",
  "Claws",
  "Daggers",
  "Dual Daggers",
  "Thrown Melee",
  "",
]);

/**
 * Returns all categories a mod belongs to.
 * PRIMARY CLASSIFIER: All.json `type` field — it's authoritative.
 * FALLBACK: mods.json ItemCompatibility for mods not in All.json.
 *
 * IMPORTANT: Do NOT use isAugment from All.json — it marks items that *accept* mods,
 * not mods that are augments. Use type/compatName instead.
 */
function classifyModCategories(entry: ModEntry): ModCategory[] {
  const path = entry.path ?? "";
  const compat = entry.data?.ItemCompatibility ?? "";
  const polarity = entry.data?.ArtifactPolarity ?? "";

  const allEntry = ALL_MODS_BY_PATH[path] ?? ALL_MODS_BY_NAME[entry.name ?? ""];
  const modType = allEntry?.type ?? "";
  const compatName = allEntry?.compatName ?? "";

  // ── All.json type field (authoritative) ──────────────────────────────────
  switch (modType) {
    case "Warframe Mod":
      // Within warframe mods, check for sub-types:
      if (compatName === "AURA") return ["aura", "warframe"];
      if (allEntry?.isExilus) return ["exilus"];
      // Specific warframe name = augment
      if (compatName && !KNOWN_GENERIC_COMPAT.has(compatName))
        return ["augment"];
      return ["warframe"];

    case "Primary Mod":
    case "Shotgun Mod":
      return ["primary"];

    case "Secondary Mod":
      // Tome mods have type="Secondary Mod" but compatName="Tome" — check first
      if (compatName === "Tome") return ["tome"];
      return ["secondary"];

    case "Melee Mod":
      return ["melee"];

    case "Stance Mod":
      // Arch-melee stances
      if (compatName.toLowerCase().includes("arch")) return ["archmelee"];
      return ["melee"];

    case "Companion Mod": {
      const cn = compatName.toUpperCase();
      if (cn === "ROBOTIC" || cn === "SENTINEL") return ["robotic"];
      if (cn === "BEAST") return ["beast"];
      // MOA / Hound
      if (compatName === "Moa" || compatName === "Hound") return ["robotic"];
      if (compatName === "Kavat" || compatName === "Kubrow") return ["beast"];
      return ["robotic"]; // fallback companion
    }

    case "Plexus Mod":
    case "Railjack Mod":
      return ["railjack"];

    case "Arch-Gun Mod":
      return ["archgun"];

    case "Arch-Melee Mod":
      return ["archmelee"];

    case "Necramech Mod":
    case "K-Drive Mod":
    case "Archwing Mod":
      return ["vehicles"];

    case "Parazon Mod":
      return ["parazon"];

    case "Tektolyst Artifact Mod":
      return ["antique"];

    case "Tome Mod":
      return ["tome"];
  }

  // ── Fallback: mods.json ItemCompatibility (for mods missing from All.json) ──

  if (compat.includes("Grimoire") || path.includes("Invocation"))
    return ["tome"];
  if (compat.includes("TnHackingDevice") || compat.includes("HackingDevice"))
    return ["parazon"];
  if (compat.includes("Antique")) return ["antique"];
  if (path.includes("/Mods/Aura/") || polarity === "AP_WARD")
    return ["aura", "warframe"];
  if (path.includes("OrokinChallenge")) return ["exilus"];
  if (compat.includes("ArchGun")) return ["archgun"];
  if (compat.includes("ArchMeleeWeapon") || compat.includes("ArchMelee"))
    return ["archmelee"];
  if (
    compat.includes("BaseMechSuit") ||
    compat.includes("HoverboardSuit") ||
    compat.includes("FlightJetPack")
  )
    return ["vehicles"];
  if (
    compat.includes("SentinelPowerSuit") ||
    compat.includes("ZanukaPet") ||
    compat.includes("MoaPet")
  )
    return ["robotic"];
  if (
    compat.includes("CatbrowPet") ||
    compat.includes("BeastPet") ||
    compat.includes("KubrowPet")
  )
    return ["beast"];
  if (compat.includes("Railjack") || compat.includes("CrewShip"))
    return ["railjack"];
  if (compat.includes("PlayerMeleeWeapon")) return ["melee"];
  if (compat.includes("LotusPistol") || compat.includes("LotusAkimbo"))
    return ["secondary"];
  if (
    compat.includes("LotusRifle") ||
    compat.includes("LotusShotgun") ||
    compat.includes("LotusBow") ||
    compat.includes("LotusLongGun")
  )
    return ["primary"];
  if (
    compat.includes("/Lotus/Powersuits/") &&
    !compat.includes("PlayerPowerSuit")
  )
    return ["augment"];

  return ["warframe"];
}

function classifyArcaneCategory(entry: ModEntry): ArcaneCategory | null {
  const compat = entry.data?.ItemCompatibility ?? "";

  if (compat.includes("PlayerPowerSuit")) return "warframe";
  if (compat.includes("OperatorSuit")) return "operator";
  if (
    compat.includes("OperatorAmplifier") ||
    compat.includes("OperatorAmpWeapon")
  )
    return "amps";
  if (
    compat.includes("LotusAntiqueWeapon") ||
    compat.includes("Antiques/Lotus")
  )
    return "tektolyst";
  if (compat.includes("LotusModularWeapon") || compat.includes("Ostron/Melee"))
    return "zaws";
  if (compat.includes("LotusBulletWeapon")) return "kitguns";
  if (
    compat.includes("LotusLongGun") ||
    compat.includes("LotusShotgun") ||
    compat.includes("LotusLongBow") ||
    compat.includes("LotusBow")
  )
    return "primary";
  if (compat.includes("LotusPistol") || compat.includes("LotusAkimbo"))
    return "secondary";
  if (compat.includes("PlayerMeleeWeapon")) return "melee";

  return null;
}

// ─── Data Preparation ─────────────────────────────────────────────────────────

// Build mod-location lookup by name (lowercase)
type EnemyDrop = {
  enemyName: string;
  rarity: string;
  chance: number;
  enemyModDropChance: number;
};
type ModLocationEntry = { modName: string; enemies: EnemyDrop[] };

const modLocationLookup = new Map<string, EnemyDrop[]>();
const rawLocations = (MOD_LOCATIONS_RAW as any).modLocations as
  | ModLocationEntry[]
  | undefined;
if (Array.isArray(rawLocations)) {
  for (const entry of rawLocations) {
    if (entry.modName && Array.isArray(entry.enemies)) {
      modLocationLookup.set(normalize(entry.modName), entry.enemies);
    }
  }
}

// Parse mods.json
const ALL_ENTRIES: ModEntry[] = Object.entries(MODS_RAW as Record<string, any>)
  .map(([path, val]) => ({ path, ...val }) as ModEntry)
  .filter((e) => e.name && typeof e.name === "string");

// Mods (category "mod"), excluding OperatorSuit ones (those are arcanes)
const MOD_ENTRIES_BASE: ModEntry[] = ALL_ENTRIES.filter(
  (e) =>
    e.categories?.[0] === "mod" &&
    e.data?.ItemCompatibility !== "/Lotus/Powersuits/Operator/OperatorSuit",
);

// Supplement with Railjack/Plexus mods from All.json — these are not in mods.json
const MODS_BASE_PATHS = new Set(MOD_ENTRIES_BASE.map((e) => e.path));
const RAILJACK_SUPPLEMENT: ModEntry[] = (ALL_RAW as any[])
  .filter(
    (item) =>
      item.category === "Mods" &&
      (item.type === "Plexus Mod" || item.type === "Railjack Mod") &&
      item.name &&
      item.name !== "Unfused Artifact" &&
      !MODS_BASE_PATHS.has(item.uniqueName),
  )
  .map((item) => ({
    path: item.uniqueName as string,
    name: item.name as string,
    categories: ["mod"] as string[],
    data: undefined,
  }));

const MOD_ENTRIES: ModEntry[] = [...MOD_ENTRIES_BASE, ...RAILJACK_SUPPLEMENT];

// Arcanes: category "arcane" + category "mod" with OperatorSuit compat (Magus series)
const ARCANE_ENTRIES: ModEntry[] = ALL_ENTRIES.filter(
  (e) =>
    e.categories?.[0] === "arcane" ||
    (e.categories?.[0] === "mod" &&
      e.data?.ItemCompatibility === "/Lotus/Powersuits/Operator/OperatorSuit"),
);

// Rivens from rivens.json
const RIVEN_ENTRIES: ModEntry[] = Object.entries(
  RIVENS_RAW as Record<string, any>,
)
  .map(([path, val]) => ({ path, ...val }) as ModEntry)
  .filter((e) => e.name);

// Arcane total needed per rank: triangular numbers
const ARCANE_TOTAL_PER_RANK: Record<number, number> = {
  0: 1,
  1: 3,
  2: 6,
  3: 10,
  4: 15,
  5: 21,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
        active
          ? "bg-blue-600 text-white border-blue-500"
          : "bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-slate-100",
      ].join(" ")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SubPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "px-2.5 py-1 rounded-md text-xs border transition-colors whitespace-nowrap",
        active
          ? "bg-slate-700 text-slate-100 border-slate-500"
          : "bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200",
      ].join(" ")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ─── Rank Cost Calculator ─────────────────────────────────────────────────────

function RankCostCalculator({
  maxRank,
  rarity,
}: {
  maxRank: number;
  rarity: string | undefined;
}) {
  const [fromRank, setFromRank] = useState(0);
  const [toRank, setToRank] = useState(maxRank);

  if (maxRank === 0) return null;

  const endoCost = calcEndoCost(rarity, fromRank, toRank);
  const creditCost = calcCreditCost(rarity, fromRank, toRank);

  const rankOptions = Array.from({ length: maxRank + 1 }, (_, i) => i);

  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-700 p-3 space-y-3">
      <div className="text-xs font-semibold text-slate-300">
        Upgrade Cost Calculator
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5 text-slate-400">
          From rank
          <select
            value={fromRank}
            onChange={(e) => {
              const v = Number(e.target.value);
              setFromRank(v);
              if (toRank <= v) setToRank(Math.min(v + 1, maxRank));
            }}
            className="rounded bg-slate-800 border border-slate-600 px-1.5 py-0.5 text-slate-100"
          >
            {rankOptions.slice(0, maxRank).map((r) => (
              <option key={r} value={r}>
                R{r}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-slate-400">
          to rank
          <select
            value={toRank}
            onChange={(e) => {
              const v = Number(e.target.value);
              setToRank(v);
              if (fromRank >= v) setFromRank(Math.max(0, v - 1));
            }}
            className="rounded bg-slate-800 border border-slate-600 px-1.5 py-0.5 text-slate-100"
          >
            {rankOptions.slice(1).map((r) => (
              <option key={r} value={r}>
                R{r}
              </option>
            ))}
          </select>
        </label>
      </div>
      {fromRank < toRank ? (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Endo</span>
            <span className="font-mono font-semibold text-amber-300">
              {endoCost.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Credits</span>
            <span className="font-mono font-semibold text-yellow-400">
              {creditCost.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500">
          Select a target rank higher than starting rank.
        </div>
      )}
    </div>
  );
}


// ─── Drop classification & smart rendering ────────────────────────────────────

const SYNDICATE_ORGS = new Set([
  "New Loka", "Steel Meridian", "Arbiters of Hexis", "Cephalon Suda",
  "The Perrin Sequence", "Red Veil", "Conclave", "Cephalon Simaris",
  "Operational Supply", "The Quills", "Vox Solaris", "Ventkids",
  "Ostron", "Solaris United", "Entrati", "The Holdfasts", "NecraLoid",
  "Kahl's Garrison", "Arbitrations",
  "Nokko", "Höllvania",
]);

type DropKind = "syndicate" | "enemy" | "mission" | "relic" | "other";

function classifyDrop(location: string): DropKind {
  if (location.includes("Relic")) return "relic";
  if (/^[A-Z][a-zA-Z ]+\/[A-Z]/.test(location) || location.startsWith("Duviri/")) return "mission";
  const commaIdx = location.indexOf(", ");
  if (commaIdx > 0) {
    const org = location.slice(0, commaIdx);
    for (const s of SYNDICATE_ORGS) { if (org.startsWith(s)) return "syndicate"; }
  }
  if (!location.includes("/") && !location.includes(", ")) return "enemy";
  return "other";
}

function DropRow({ d }: { d: AllModDrop }) {
  const kind = classifyDrop(d.location);
  const rarityClass =
    d.rarity === "Common"   ? "text-slate-400" :
    d.rarity === "Uncommon" ? "text-blue-300"  :
    d.rarity === "Rare"     ? "text-amber-300" : "text-rose-300";

  const wikiIcon = (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );

  if (kind === "syndicate") {
    const commaIdx = d.location.indexOf(", ");
    const syndName = commaIdx > 0 ? d.location.slice(0, commaIdx) : d.location;
    const rankLabel = commaIdx > 0 ? d.location.slice(commaIdx + 2) : "";
    return (
      <div className="flex items-center gap-2 text-xs rounded px-2 py-1.5 bg-indigo-950/20 border border-indigo-800/30">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400 shrink-0">Purchase</span>
        <a href={wikiUrl(syndName)} target="_blank" rel="noopener noreferrer"
          className="flex-1 min-w-0 text-slate-300 truncate hover:text-indigo-300 hover:underline transition-colors">
          {syndName}
        </a>
        {rankLabel && <span className="shrink-0 text-slate-500 text-[11px]">{rankLabel}</span>}
        <a href={wikiUrl(syndName)} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors">{wikiIcon}</a>
      </div>
    );
  }

  if (kind === "enemy") {
    return (
      <div className="flex items-center gap-2 text-xs rounded px-2 py-1.5 bg-slate-900/50 border border-slate-800/50">
        <a href={enemyWikiUrl(d.location)} target="_blank" rel="noopener noreferrer"
          className="flex-1 min-w-0 text-slate-300 truncate hover:text-cyan-300 hover:underline transition-colors">
          {d.location}
        </a>
        <span className={["shrink-0 font-semibold text-[11px]", rarityClass].join(" ")}>{d.rarity}</span>
        <span className="shrink-0 font-mono text-slate-500 text-[11px]">{(d.chance * 100).toFixed(2)}%</span>
        <a href={enemyWikiUrl(d.location)} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors">{wikiIcon}</a>
      </div>
    );
  }

  // mission / relic / other
  return (
    <div className="flex items-center gap-2 text-xs rounded px-2 py-1.5 bg-slate-900/50 border border-slate-800/50">
      <span className="flex-1 min-w-0 text-slate-300 truncate">{d.location}</span>
      <span className={["shrink-0 font-semibold text-[11px]", rarityClass].join(" ")}>{d.rarity}</span>
      <span className="shrink-0 font-mono text-slate-500 text-[11px]">{(d.chance * 100).toFixed(2)}%</span>
    </div>
  );
}

function DropsSection({ drops, name }: { drops: AllModDrop[]; name: string }) {
  if (drops.length === 0) {
    return (
      <div className="text-xs text-slate-500 flex items-center gap-2">
        No drop data available.
        <a href={wikiUrl(name) + "#Acquisition"} target="_blank" rel="noopener noreferrer"
          className="text-slate-600 hover:text-slate-300 transition-colors flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Wiki
        </a>
      </div>
    );
  }
  const sorted = [...drops].sort((a, b) => {
    const aS = classifyDrop(a.location) === "syndicate";
    const bS = classifyDrop(b.location) === "syndicate";
    if (aS !== bS) return aS ? -1 : 1;
    return b.chance - a.chance;
  });
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        Acquisition <span className="normal-case font-normal text-slate-600">({drops.length})</span>
      </div>
      <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
        {sorted.map((d, i) => <DropRow key={i} d={d} />)}
      </div>
    </div>
  );
}

// ─── Drop Locations (legacy — uses modLocations.json enemy data) ───────────────

/** Build a Warframe wiki URL for any item/mod/arcane name */
function wikiUrl(name: string): string {
  const slug = name.trim().replace(/\s+/g, "_");
  return `https://wiki.warframe.com/w/${encodeURIComponent(slug)}`;
}

/** Small unobtrusive wiki link icon — opens wiki in a new tab */
function WikiLink({ name }: { name: string }) {
  return (
    <a
      href={wikiUrl(name)}
      target="_blank"
      rel="noopener noreferrer"
      title={`${name} on Warframe Wiki`}
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors"
      aria-label={`${name} wiki`}
    >
      <svg
        className="w-3 h-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

/** Build a Warframe wiki URL for an enemy, boss, or location name */
function enemyWikiUrl(name: string): string {
  const slug = name.trim().replace(/\s+/g, "_");
  return `https://wiki.warframe.com/w/${encodeURIComponent(slug)}#Farming_Locations`;
}


// ─── Mod Detail Panel ─────────────────────────────────────────────────────────

function ModModal({
  entry,
  isRiven = false,
  onClose,
}: {
  entry: ModEntry;
  isRiven?: boolean;
  onClose: () => void;
}) {
  const data = entry.data;
  const allEntry = ALL_MODS_BY_PATH[entry.path] ?? ALL_MODS_BY_NAME[entry.name ?? ""];

  const maxRank = isRiven
    ? (data?.FusionLimitRange?.[1] ?? 8)
    : (allEntry?.fusionLimit ?? decodeMaxRank(data?.FusionLimit));
  const baseDrain = allEntry?.baseDrain ?? decodeBaseDrain(data?.BaseDrain);
  const upgrades = data?.Upgrades ?? [];
  const polarity = data?.ArtifactPolarity ?? allEntry?.polarity;
  const rarityRaw = allEntry?.rarity ?? data?.Rarity ?? "COMMON";
  const rarity = rarityRaw.toUpperCase();
  // Clamp levelStats to maxRank+1 — All.json occasionally has more entries than fusionLimit
  const levelStats = (allEntry?.levelStats ?? []).slice(0, maxRank + 1);
  const allDrops: AllModDrop[] = allEntry?.drops ?? [];
  // Legacy enemy drops from modLocations.json as fallback
  const legacyDrops = modLocationLookup.get(normalize(entry.name)) ?? [];
  const drops: AllModDrop[] = allDrops.length > 0
    ? allDrops
    : legacyDrops.map(d => ({ chance: d.chance, location: d.enemyName, rarity: d.rarity, type: entry.name }));

  const rarityLabel = rarityRaw.charAt(0).toUpperCase() + rarityRaw.slice(1).toLowerCase();

  // Determine if this is a warframe augment (compatName is a specific warframe name, not a weapon type)
  const GENERIC_COMPAT = new Set(["WARFRAME","ANY","COMPANION","ROBOTIC","BEAST","PRIMARY","Melee",
    "Pistol","Shotgun","Rifle","Assault Rifle","Sniper","Bow","K-Drive","Archwing","Necramech",
    "Archgun","Archmelee","Moa","Hound","Kavat","Kubrow","Sentinel","Parazon","Tome","AURA",
    "Claws","Daggers","Dual Daggers","Thrown Melee","Plexus Mod","Railjack Mod",""]);
  const isWarframeAugment = allEntry?.isAugment && allEntry?.compatName && !GENERIC_COMPAT.has(allEntry.compatName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">

        {/* ── Modal header ── */}
        <div className={["flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0", rarityBg(rarity)].join(" ")}>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-base font-bold text-slate-100">{entry.name}</span>
            <WikiLink name={entry.name} />
            <span className={["text-xs font-semibold px-2 py-0.5 rounded-full border", rarityColor(rarity), rarityBg(rarity)].join(" ")}>
              {rarityLabel}
            </span>
            {polarity && (() => {
              const img = polImg(polarity);
              return img ? (
                <span className="rounded-full p-1 border border-slate-600 bg-slate-800 flex items-center justify-center w-6 h-6" title={polarityLabel(polarity)}>
                  <img src={img} alt={polarityLabel(polarity)} className="w-4 h-4 object-contain pol-icon" />
                </span>
              ) : (
                <span className="text-xs rounded-full px-2 py-0.5 border border-slate-600 bg-slate-800 text-slate-300">{polarityLabel(polarity)}</span>
              );
            })()}
            {maxRank > 0 && <span className="text-xs text-slate-400">Max Rank {maxRank}</span>}
            {allEntry?.isExilus    && <span className="text-[10px] px-1.5 py-0.5 rounded border border-sky-700/50    bg-sky-950/30    text-sky-300    font-semibold">EXILUS</span>}
            {allEntry?.isUtility   && <span className="text-[10px] px-1.5 py-0.5 rounded border border-green-700/50  bg-green-950/30  text-green-300  font-semibold">UTILITY</span>}
            {allEntry?.isPrime     && <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-600/50  bg-amber-950/30  text-amber-300  font-semibold">PRIME</span>}
            {isWarframeAugment     && <span className="text-[10px] px-1.5 py-0.5 rounded border border-purple-700/50 bg-purple-950/30 text-purple-300 font-semibold">AUGMENT</span>}
            {allEntry?.tradable    && <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600    bg-slate-800    text-slate-400">Tradable</span>}
            {allEntry?.transmutable && <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600   bg-slate-800    text-slate-400">Transmutable</span>}
          </div>
          <button className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800" onClick={onClose}>Close</button>
        </div>

        {/* ── Modal body ── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Description */}
          {allEntry?.description && (
            <p className="text-sm text-slate-400 leading-relaxed">{renderStatString(allEntry.description)}</p>
          )}

          {/* Meta tags row */}
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
            {allEntry?.type        && <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5">{allEntry.type}</span>}
            {allEntry?.compatName  && <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5">Fits: {allEntry.compatName}</span>}
            {isWarframeAugment     && allEntry?.compatName && <span className="rounded border border-purple-900/50 bg-purple-950/20 px-2 py-0.5 text-purple-400">Augment for: {allEntry.compatName}</span>}
            {allEntry?.introduced  && <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5">Added: {allEntry.introduced.name}</span>}
            {allEntry?.releaseDate && <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5">{formatReleaseDate(allEntry.releaseDate) ?? allEntry.releaseDate}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ── LEFT: Effects ── */}
            <div className="space-y-4">

              {/* Per-rank effects from levelStats */}
              {levelStats.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Effects per Rank</div>
                  <div className="space-y-1">
                    {levelStats.map((ls, r) => (
                      <div key={r} className={["flex items-start gap-2 rounded px-2 py-1.5 text-xs",
                        r === levelStats.length - 1 ? "bg-cyan-950/30 border border-cyan-800/40" : "bg-slate-800/50"
                      ].join(" ")}>
                        <span className="shrink-0 text-slate-500 font-mono w-5">R{r}</span>
                        <span className="text-slate-200">
                          {ls.stats.map((s, si) => (
                            <span key={si}>{si > 0 && "  ·  "}{renderStatString(s)}</span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback: raw upgrade values */}
              {levelStats.length === 0 && upgrades.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Effects</div>
                  <div className="space-y-1.5">
                    {upgrades.slice(0, 4).map((u, i) => {
                      if (!u.UpgradeType || u.Value === undefined) return null;
                      const label = labelForUpgradeType(u.UpgradeType);
                      const perRank = u.Value;
                      const maxVal = perRank * (maxRank > 0 ? maxRank + 1 : 1);
                      return (
                        <div key={i} className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs text-slate-300">{label}</span>
                            <span className="text-xs font-mono text-slate-200">
                              {formatValue(perRank, u.DisplayAsPercent)}&nbsp;/&nbsp;rank&nbsp;→&nbsp;
                              <span className="text-cyan-300 font-semibold">{formatValue(maxVal, u.DisplayAsPercent)}&nbsp;at&nbsp;R{maxRank}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Capacity cost per rank */}
              {baseDrain > 0 && maxRank > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Mod Capacity Cost</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: maxRank + 1 }, (_, r) => (
                      <div key={r} className="text-center">
                        <div className="text-[10px] text-slate-500 mb-0.5">R{r}</div>
                        <div className="w-8 text-center rounded bg-slate-800 border border-slate-600 py-1 text-xs text-slate-200 font-mono">{baseDrain + r}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgrade cost calculator */}
              {!isRiven && <RankCostCalculator maxRank={maxRank} rarity={rarity} />}
            </div>

            {/* ── RIGHT: Acquisition ── */}
            <div>
              <DropsSection drops={drops} name={entry.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Arcane Detail Panel ──────────────────────────────────────────────────────

/** Humanize ALL_CAPS variable names from moddescriptions into readable labels.
 *  e.g. AMMO_EFFICIENCY → "Ammo Efficiency", CRIT_CHANCE → "Crit Chance" */
function humanizeVarName(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

/** Extract per-rank values for script-driven arcanes (UpgradeType === "NONE").
 *  Falls back to LocKeyWordScript level arrays. */
function extractScriptLevels(u: ModUpgrade): number[] | null {
  const script = u.LocKeyWordScript;
  if (!script) return null;
  for (const [k, v] of Object.entries(script)) {
    if (
      k.startsWith("_") &&
      k.endsWith("Levels") &&
      Array.isArray(v) &&
      v.length > 0
    ) {
      return v as number[];
    }
  }
  return null;
}

function ArcaneDetail({ entry, onClose }: { entry: ModEntry; onClose: () => void }) {
  const data = entry.data;
  const maxRank = decodeMaxRank(data?.FusionLimit);
  const upgrades = (data?.Upgrades ?? []).concat((data as any)?.ExtraUpgrades ?? []);

  // Look up in All.json by uniqueName (path) first, then by name
  const allEntry = ALL_MODS_BY_PATH[entry.path] ?? ALL_ARCANES_BY_NAME[entry.name];
  const allDrops: AllModDrop[] = allEntry?.drops ?? [];
  const legacyDrops = modLocationLookup.get(normalize(entry.name)) ?? [];
  const drops: AllModDrop[] = allDrops.length > 0
    ? allDrops
    : legacyDrops.map(d => ({ chance: d.chance, location: d.enemyName, rarity: d.rarity, type: entry.name }));

  // Effects: moddescriptions.json → All.json levelStats → Upgrades fallback
  // All.json levelStats take priority over raw Upgrades data because All.json
  // contains the actual human-readable per-rank descriptions, while Upgrades
  // data is game-internal and often only represents a subset of the arcane's effects.
  const modDesc = MODDESC[entry.path];
  const descRanks = modDesc?.Ranks;
  type EffectRow = { label: string; values: string[] };
  const effectRows: EffectRow[] = [];

  const hasAllJsonLevelStats = (allEntry?.levelStats?.length ?? 0) > 0;

  if (descRanks && descRanks.length > 0) {
    const varNames = Object.keys(descRanks[0]);
    for (const varName of varNames) {
      const vals = descRanks.map((r) => r[varName] ?? "");
      if (vals.every((v) => v === "")) continue;
      effectRows.push({ label: humanizeVarName(varName), values: vals });
    }
  } else if (upgrades.length > 0 && !hasAllJsonLevelStats) {
    for (const u of upgrades.slice(0, 4)) {
      const type = u.UpgradeType;
      const isNoneType = !type || type === "NONE";
      if (isNoneType) {
        const levels = extractScriptLevels(u);
        if (levels && levels.length > 0) {
          const isPercent = u.DisplayAsPercent;
          const fmt = (v: number) => isPercent ? `${Math.round(v * 100 * 10) / 10}%` : String(Math.round(v * 100) / 100);
          effectRows.push({ label: "Effect", values: levels.map(fmt) });
        }
      } else {
        const val = u.Value;
        if (val === undefined || val === null) continue;
        const label = labelForUpgradeType(type);
        const isPercent = u.DisplayAsPercent;
        const fmt = (v: number) => isPercent
          ? `${v >= 0 ? "+" : ""}${Math.round(v * 100 * 10) / 10}%`
          : `${v >= 0 ? "+" : ""}${Math.round(v * 100) / 100}`;
        effectRows.push({ label, values: Array.from({ length: maxRank + 1 }, (_, r) => fmt(val * (r + 1))) });
      }
    }
  }

  // All.json levelStats: used when moddescriptions.json has no Ranks data.
  // Clamp to maxRank+1 in case All.json has excess entries.
  const levelStats = effectRows.length === 0 ? (allEntry?.levelStats ?? []).slice(0, maxRank + 1) : [];
  const rarityRaw = allEntry?.rarity ?? "";
  const rarity = rarityRaw.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-base font-bold text-slate-100">{entry.name}</span>
            <WikiLink name={entry.name} />
            <span className="text-xs text-slate-400">Max Rank: {maxRank}</span>
            {rarityRaw && (
              <span className={["text-xs font-semibold px-2 py-0.5 rounded-full border", rarityColor(rarity), rarityBg(rarity)].join(" ")}>
                {rarityRaw.charAt(0).toUpperCase() + rarityRaw.slice(1).toLowerCase()}
              </span>
            )}
            {allEntry?.tradable && <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-400">Tradable</span>}
            {allEntry?.type && <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-400">{allEntry.type}</span>}
            {allEntry?.introduced && <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-500">{allEntry.introduced.name}</span>}
          </div>
          <button className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800" onClick={onClose}>Close</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Effects */}
            <div className="space-y-3">
              {effectRows.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Effects per Rank</div>
                  {effectRows.map((row, i) => (
                    <div key={i} className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 mb-2">
                      <div className="text-xs text-slate-300 font-medium mb-1.5">{row.label}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {row.values.map((v, r) => (
                          <div key={r} className="text-center">
                            <div className="text-[9px] text-slate-600 mb-0.5">R{r}</div>
                            <div className={["rounded px-1.5 py-0.5 text-[11px] font-mono border",
                              r === row.values.length - 1 ? "bg-cyan-950/40 border-cyan-800/60 text-cyan-300" : "bg-slate-900 border-slate-700 text-slate-300"
                            ].join(" ")}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : levelStats.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Effects per Rank</div>
                  <div className="space-y-1">
                    {levelStats.map((ls, r) => (
                      <div key={r} className={["flex items-start gap-2 rounded px-2 py-1.5 text-xs",
                        r === levelStats.length - 1 ? "bg-cyan-950/30 border border-cyan-800/40" : "bg-slate-800/50"
                      ].join(" ")}>
                        <span className="shrink-0 text-slate-500 font-mono w-5">R{r}</span>
                        <span className="text-slate-200">
                          {ls.stats.map((s, si) => (
                            <span key={si}>{si > 0 && "  ·  "}{renderStatString(s)}</span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">No effect data available.</div>
              )}
            </div>

            {/* Acquisition */}
            <div>
              <DropsSection drops={drops} name={entry.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Mods() {
  const [section, setSection] = useState<ModSection>("mods");

  // Mods state
  const [modCategory, setModCategory] = useState<ModCategory>("all");
  const [modPolarity, setModPolarity] = useState<Polarity | null>(null);
  const [parazonFilter, setParazonFilter] = useState<ParazonFilter>("all");
  const [modSearch, setModSearch] = useState("");
  const [modSort, setModSort] = useState<ModSortKey>("az");
  const [selectedMod, setSelectedMod] = useState<ModEntry | null>(null);

  // Arcanes state
  const [arcaneCategory, setArcaneCategory] = useState<ArcaneCategory>("all");
  const [arcaneSearch, setArcaneSearch] = useState("");
  const [arcaneSort, setArcaneSort] = useState<ModSortKey>("az");
  const [selectedArcane, setSelectedArcane] = useState<ModEntry | null>(null);

  // ── Mods list ──────────────────────────────────────────────────────────────

  const filteredMods = useMemo<ModEntry[]>(() => {
    const q = normalize(modSearch.trim());

    // Rivens are from a separate source
    if (modCategory === "rivens") {
      return RIVEN_ENTRIES.filter((e) => !q || normalize(e.name).includes(q));
    }

    let list: ModEntry[];
    if (modCategory === "all") {
      list = [...MOD_ENTRIES, ...RIVEN_ENTRIES];
    } else {
      list = MOD_ENTRIES.filter((e) => {
        const cats = classifyModCategories(e);
        return cats.includes(modCategory);
      });
    }

    // Polarity sub-filter (skip for "all", "antique", "parazon", "rivens")
    if (
      modPolarity !== null &&
      modCategory !== "all" &&
      modCategory !== "antique" &&
      modCategory !== "parazon"
    ) {
      const ap = POLARITIES.find((p) => p.key === modPolarity)?.ap;
      if (ap) list = list.filter((e) => {
        const entryAP = e.data?.ArtifactPolarity ?? toAP(ALL_MODS_BY_PATH[e.path]?.polarity ?? ALL_MODS_BY_NAME[e.name]?.polarity);
        return entryAP === ap;
      });
    }



    // Parazon sub-filter
    if (modCategory === "parazon") {
      if (parazonFilter === "requiem") {
        list = list.filter(
          (e) =>
            e.name.match(
              /Ris|Fass|Vome|Xata|Khra|Jahu|Netra|Lohk|Naeg|Mend|Vis|Netra|Kel|Xol/i,
            ) || e.path.includes("Requiem"),
        );
      } else if (parazonFilter === "antivirus") {
        list = list.filter(
          (e) => e.name.includes("Antivirus") || e.path.includes("Antivirus"),
        );
      }
    }

    if (q) list = list.filter((e) => normalize(e.name).includes(q));

    list.sort((a, b) => {
      if (modSort === "release-newest" || modSort === "release-oldest") {
        const ad = (ALL_MODS_BY_PATH[a.path] ?? ALL_MODS_BY_NAME[a.name])?.releaseDate ?? "";
        const bd = (ALL_MODS_BY_PATH[b.path] ?? ALL_MODS_BY_NAME[b.name])?.releaseDate ?? "";
        if (ad !== bd) return modSort === "release-newest" ? (bd > ad ? 1 : -1) : (ad > bd ? 1 : -1);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [modCategory, modPolarity, parazonFilter, modSearch, modSort]);

  // ── Arcanes list ───────────────────────────────────────────────────────────

  const filteredArcanes = useMemo<ModEntry[]>(() => {
    const q = normalize(arcaneSearch.trim());

    let list: ModEntry[];
    if (arcaneCategory === "all") {
      list = [...ARCANE_ENTRIES];
    } else {
      list = ARCANE_ENTRIES.filter((e) => {
        const cat = classifyArcaneCategory(e);
        return cat === arcaneCategory;
      });
    }

    if (q) list = list.filter((e) => normalize(e.name).includes(q));

    list.sort((a, b) => {
      if (arcaneSort === "release-newest" || arcaneSort === "release-oldest") {
        const ad = ALL_ARCANES_BY_NAME[a.name]?.releaseDate ?? "";
        const bd = ALL_ARCANES_BY_NAME[b.name]?.releaseDate ?? "";
        if (ad !== bd) return arcaneSort === "release-newest" ? (bd > ad ? 1 : -1) : (ad > bd ? 1 : -1);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [arcaneCategory, arcaneSearch, arcaneSort]);

  // ── Virtualization ─────────────────────────────────────────────────────────
  // Each row is a button with py-2.5 + text-sm + border ≈ 42px, plus mb-0.5 gap.
  const MOD_ROW_H = 44;
  const OVERSCAN = 8;

  const modsListRef = useRef<HTMLDivElement | null>(null);
  const [modsVw, setModsVw] = useState({ start: 0, end: 50 });

  const arcanesListRef = useRef<HTMLDivElement | null>(null);
  const [arcanesVw, setArcanesVw] = useState({ start: 0, end: 50 });

  function recomputeModsWindow() {
    const el = modsListRef.current;
    if (!el) return;
    const viewportH = el.clientHeight;
    const scrollTop = el.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / MOD_ROW_H) - OVERSCAN);
    const end = Math.min(filteredMods.length, start + Math.ceil(viewportH / MOD_ROW_H) + OVERSCAN * 2);
    setModsVw({ start, end });
  }

  function recomputeArcanesWindow() {
    const el = arcanesListRef.current;
    if (!el) return;
    const viewportH = el.clientHeight;
    const scrollTop = el.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / MOD_ROW_H) - OVERSCAN);
    const end = Math.min(filteredArcanes.length, start + Math.ceil(viewportH / MOD_ROW_H) + OVERSCAN * 2);
    setArcanesVw({ start, end });
  }

  useEffect(() => {
    if (modsListRef.current) modsListRef.current.scrollTop = 0;
    requestAnimationFrame(() => recomputeModsWindow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMods.length]);

  useEffect(() => {
    if (arcanesListRef.current) arcanesListRef.current.scrollTop = 0;
    requestAnimationFrame(() => recomputeArcanesWindow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredArcanes.length]);

  useEffect(() => {
    const onResize = () => { recomputeModsWindow(); recomputeArcanesWindow(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const showPolarityFilter =
    modCategory !== "all" &&
    modCategory !== "rivens" &&
    modCategory !== "antique" &&
    modCategory !== "parazon";

  return (
    <div className="space-y-6">
      {/* ── Mod modal ── */}
      {selectedMod && (
        <ModModal
          entry={selectedMod}
          isRiven={modCategory === "rivens"}
          onClose={() => setSelectedMod(null)}
        />
      )}
      {/* ── Arcane modal ── */}
      {selectedArcane && (
        <ArcaneDetail
          entry={selectedArcane}
          onClose={() => setSelectedArcane(null)}
        />
      )}
      <Section title="Mods & Arcanes">
        <div className="text-sm text-slate-400 mb-4">
          Browse mods and arcanes by category. Click any entry for details
          including upgrade costs, effects, and drop locations.
        </div>

        {/* Primary tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 mb-5">
          {(["mods", "arcanes"] as const).map((s) => (
            <button
              key={s}
              className={[
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                section === s
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600",
              ].join(" ")}
              onClick={() => setSection(s)}
            >
              {s === "mods" ? "Mods" : "Arcanes"}
            </button>
          ))}
        </div>

        {/* ── MODS ── */}
        {section === "mods" && (
          <div>
            {/* Category pills */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Category
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MOD_CATEGORIES.map((c) => (
                  <CategoryPill
                    key={c.key}
                    label={c.label}
                    active={modCategory === c.key}
                    onClick={() => {
                      setModCategory(c.key);
                      setModPolarity(null);
                      setParazonFilter("all");
                      setSelectedMod(null);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Polarity sub-filter */}
            {showPolarityFilter && (
              <div className="mb-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Polarity
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <SubPill
                    label="All"
                    active={modPolarity === null}
                    onClick={() => setModPolarity(null)}
                  />
                  {POLARITIES.map((p) => {
                    const img = polImg(p.ap);
                    return (
                      <button
                        key={p.key}
                        title={p.label}
                        onClick={() =>
                          setModPolarity(modPolarity === p.key ? null : p.key)
                        }
                        className={[
                          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition-colors",
                          modPolarity === p.key
                            ? "bg-slate-700 text-slate-100 border-slate-500"
                            : "bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200",
                        ].join(" ")}
                      >
                        {img ? (
                          <img
                            src={img}
                            alt={p.label}
                            className="w-4 h-4 object-contain pol-icon"
                          />
                        ) : (
                          <span>{p.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}



            {/* Parazon sub-filter */}
            {modCategory === "parazon" && (
              <div className="mb-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Type
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["all", "requiem", "antivirus"] as const).map((f) => (
                    <SubPill
                      key={f}
                      label={
                        f === "all"
                          ? "All"
                          : f === "requiem"
                            ? "Requiem"
                            : "Antivirus"
                      }
                      active={parazonFilter === f}
                      onClick={() => setParazonFilter(f)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search + Sort */}
            <div className="mb-3 flex flex-wrap gap-2 items-end">
              <input
                className="flex-1 min-w-[200px] max-w-sm rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                value={modSearch}
                onChange={(e) => {
                  setModSearch(e.target.value);
                  setSelectedMod(null);
                }}
                placeholder="Search mods…"
              />
              <select
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm"
                value={modSort}
                onChange={(e) => setModSort(e.target.value as ModSortKey)}
              >
                <option value="az">Name A→Z</option>
                <option value="release-newest">Release: Newest first</option>
                <option value="release-oldest">Release: Oldest first</option>
              </select>
            </div>

            {/* Mod list */}
            <div className="text-xs text-slate-500 mb-2">
              {filteredMods.length} mods
            </div>
            {filteredMods.length === 0 ? (
              <div className="text-sm text-slate-400 py-4">No mods found.</div>
            ) : (
              <div
                ref={modsListRef}
                className="max-h-[55vh] overflow-auto pr-1"
                onScroll={() => recomputeModsWindow()}
              >
                <div className="relative" style={{ height: filteredMods.length * MOD_ROW_H }}>
                  <div
                    className="absolute left-0 right-0"
                    style={{ transform: `translateY(${modsVw.start * MOD_ROW_H}px)` }}
                  >
                    {filteredMods.slice(modsVw.start, modsVw.end).map((e) => {
                      const isSelected = selectedMod?.path === e.path;
                      const _allE = ALL_MODS_BY_PATH[e.path] ?? ALL_MODS_BY_NAME[e.name];
                      const polarity = e.data?.ArtifactPolarity ?? toAP(_allE?.polarity);
                      const rarityRaw = e.data?.Rarity ?? ALL_MODS_BY_PATH[e.path]?.rarity ?? "";
                      const rarity = rarityRaw.toUpperCase();
                      return (
                        <div key={e.path} className="flex items-center gap-1 mb-0.5">
                          <button
                            className={[
                              "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors border",
                              isSelected
                                ? "bg-slate-700 border-slate-500 text-slate-100"
                                : "bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 hover:border-slate-700",
                            ].join(" ")}
                            onClick={() => setSelectedMod(isSelected ? null : e)}
                          >
                            <span className="flex-1 font-medium truncate">{e.name}</span>
                            {polarity &&
                              (() => {
                                const img = polImg(polarity);
                                return img ? (
                                  <img
                                    src={img}
                                    alt={polarityLabel(polarity)}
                                    title={polarityLabel(polarity)}
                                    className="shrink-0 w-4 h-4 object-contain pol-icon opacity-70"
                                  />
                                ) : (
                                  <span className="shrink-0 text-[11px] text-slate-500">
                                    {polarityLabel(polarity)}
                                  </span>
                                );
                              })()}
                            {rarity && (
                              <span className={["shrink-0 text-[11px] font-medium", rarityColor(rarity)].join(" ")}>
                                {rarity.charAt(0) + rarity.slice(1).toLowerCase()}
                              </span>
                            )}
                          </button>
                          <WikiLink name={e.name} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ARCANES ── */}
        {section === "arcanes" && (
          <div>
            {/* Category pills */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Category
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ARCANE_CATEGORIES.map((c) => (
                  <CategoryPill
                    key={c.key}
                    label={c.label}
                    active={arcaneCategory === c.key}
                    onClick={() => {
                      setArcaneCategory(c.key);
                      setSelectedArcane(null);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Search + Sort */}
            <div className="mb-3 flex flex-wrap gap-2 items-end">
              <input
                className="flex-1 min-w-[200px] max-w-sm rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                value={arcaneSearch}
                onChange={(e) => {
                  setArcaneSearch(e.target.value);
                  setSelectedArcane(null);
                }}
                placeholder="Search arcanes…"
              />
              <select
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm"
                value={arcaneSort}
                onChange={(e) => setArcaneSort(e.target.value as ModSortKey)}
              >
                <option value="az">Name A→Z</option>
                <option value="release-newest">Release: Newest first</option>
                <option value="release-oldest">Release: Oldest first</option>
              </select>
            </div>

            {/* Rank guide */}
            <div className="mb-4 rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3">
              <div className="text-xs font-semibold text-slate-400 mb-2">
                Copies needed to reach rank:
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                {Object.entries(ARCANE_TOTAL_PER_RANK).map(([r, n]) => (
                  <span key={r} className="text-slate-400">
                    <span className="font-semibold text-slate-200">R{r}</span>:{" "}
                    {n} {n === 1 ? "copy" : "copies"}
                  </span>
                ))}
              </div>
            </div>

            {/* Arcane list */}
            <div className="text-xs text-slate-500 mb-2">
              {filteredArcanes.length} arcanes
            </div>
            {filteredArcanes.length === 0 ? (
              <div className="text-sm text-slate-400 py-4">No arcanes found.</div>
            ) : (
              <div
                ref={arcanesListRef}
                className="max-h-[55vh] overflow-auto pr-1"
                onScroll={() => recomputeArcanesWindow()}
              >
                <div className="relative" style={{ height: filteredArcanes.length * MOD_ROW_H }}>
                  <div
                    className="absolute left-0 right-0"
                    style={{ transform: `translateY(${arcanesVw.start * MOD_ROW_H}px)` }}
                  >
                    {filteredArcanes.slice(arcanesVw.start, arcanesVw.end).map((e) => {
                      const isSelected = selectedArcane?.path === e.path;
                      return (
                        <div key={e.path} className="flex items-center gap-1 mb-0.5">
                          <button
                            className={[
                              "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors border",
                              isSelected
                                ? "bg-slate-700 border-slate-500 text-slate-100"
                                : "bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 hover:border-slate-700",
                            ].join(" ")}
                            onClick={() => setSelectedArcane(isSelected ? null : e)}
                          >
                            <span className="flex-1 font-medium truncate">{e.name}</span>
                          </button>
                          <WikiLink name={e.name} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}