// ===== FILE: src/pages/Inventory.tsx =====
// src/pages/Inventory.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  FULL_CATALOG,
  type CatalogId,
} from "../domain/catalog/loadFullCatalog";
import { OVERLEVEL_WEAPON_PATHS } from "../domain/catalog/overLevelWeapons";
import { useTrackerStore } from "../store/store";
import {
  determineItemAvailability,
  getBlockingReasons,
} from "../domain/logic/plannerEngine";
import { getAcquisitionByCatalogId } from "../catalog/items/itemAcquisition";
import { SOURCE_INDEX } from "../catalog/sources/sourceCatalog";
import { getItemRequirements } from "../catalog/items/itemRequirements";
import { uid, nowIso } from "../store/storeUtils";
import ALL_RAW from "../data/All.json";
import { getRelicByKey } from "../domain/catalog/relicCatalog";

const _statusImgs = import.meta.glob<string>("../assets/statuses/*.png", { eager: true, import: "default" });
const STATUS_IMG_INV: Record<string, string> = {};
for (const [p, url] of Object.entries(_statusImgs)) {
  const name = p.split("/").pop()!.replace(".png", "").toLowerCase();
  STATUS_IMG_INV[name] = url;
}

type SortKey =
  | "az"
  | "za"
  | "count-desc"
  | "count-asc"
  | "owned-first"
  | "unowned-first"
  | "mastered-last"
  | "release-newest"
  | "release-oldest"
  | "mr-asc"
  | "mr-desc";

const VANILLA_CUTOFF = "2013-03-25";

function formatReleaseDate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  if (date <= VANILLA_CUTOFF) return "Vanilla";
  return date;
}

type PrimaryTab =
  | "all"
  | "warframesVehicles"
  | "weapons"
  | "companions"
  | "components"
  | "resources"
  | "railjack";

type WarframesVehiclesTab = "all" | "warframes" | "archwings" | "necramechs";
type CompanionsTab =
  | "all"
  | "hound"
  | "kavat"
  | "kubrow"
  | "moa"
  | "sentinel"
  | "predasite"
  | "vulpaphyla";
type WeaponClassTab = "all" | "primary" | "secondary" | "melee" | "companion";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function titleCase(s: string): string {
  if (!s) return s;
  return s
    .split(/[\s_-]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── All.json item index ───────────────────────────────────────────────────

interface AllDrop {
  chance: number;
  location: string;
  rarity: string;
  type: string;
}
interface AllComponent {
  name: string;
  uniqueName?: string;
  description?: string;
  itemCount?: number;
  drops?: AllDrop[];
}
interface AllAbility {
  name: string;
  description: string;
}
interface AllItemEntry {
  uniqueName: string;
  name: string;
  category: string;
  description?: string;
  passiveDescription?: string;
  type?: string;
  imageName?: string;
  // Build
  buildPrice?: number;
  buildQuantity?: number;
  buildTime?: number;
  bpCost?: number;
  consumeOnBuild?: boolean;
  components?: AllComponent[];
  // Mastery / release
  masteryReq?: number;
  releaseDate?: string;
  introduced?: { name: string };
  vaulted?: boolean;
  vaultDate?: string;
  tradable?: boolean;
  isPrime?: boolean;
  // Warframe stats
  health?: number;
  shield?: number;
  armor?: number;
  power?: number;
  sprintSpeed?: number;
  polarities?: string[];
  aura?: string;
  abilities?: AllAbility[];
  exalted?: string[];
  // Weapon stats
  damage?: Record<string, number>;
  totalDamage?: number;
  criticalChance?: number;
  criticalMultiplier?: number;
  procChance?: number;
  fireRate?: number;
  magazineSize?: number;
  reloadTime?: number;
  accuracy?: number;
  multishot?: number;
  noise?: string;
  trigger?: string;
  slot?: number;
  disposition?: number;
  omegaAttenuation?: number;
  // Melee specific
  range?: number;
  followThrough?: number;
  comboDuration?: number;
  heavyAttackDamage?: number;
  slamAttack?: number;
  slideAttack?: number;
  stancePolarity?: string;
  // Companion stats
  stamina?: number;
  // Drops
  drops?: AllDrop[];
  // Wiki
  wikiaUrl?: string;
  wikiaThumbnail?: string;
  // Nightwave challenges
  required?: number;
  standing?: number;
}

const ALL_BY_UNIQUE: Record<string, AllItemEntry> = {};
const ALL_BY_NAME: Record<string, AllItemEntry> = {};
for (const raw of ALL_RAW as AllItemEntry[]) {
  if (raw.uniqueName) {
    if (!ALL_BY_UNIQUE[raw.uniqueName]) ALL_BY_UNIQUE[raw.uniqueName] = raw;
  }
  if (raw.name && !ALL_BY_NAME[raw.name]) ALL_BY_NAME[raw.name] = raw;
}

function getAllEntry(
  uniqueName?: string,
  displayName?: string,
): AllItemEntry | null {
  if (uniqueName) {
    const e = ALL_BY_UNIQUE[uniqueName];
    if (e) return e;
  }
  if (displayName) {
    const e = ALL_BY_NAME[displayName];
    if (e) return e;
  }
  return null;
}

function fmtBuildTime(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(0)}h`;
  return `${(seconds / 86400).toFixed(0)}d`;
}

function fmtPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}
function fmtMult(v: number): string {
  return `${v.toFixed(1)}x`;
}

const DISPOSITION_DOTS: Record<number, string> = {
  1: "●○○○○",
  2: "●●○○○",
  3: "●●●○○",
  4: "●●●●○",
  5: "●●●●●",
};
const POLARITY_LABELS: Record<string, string> = {
  madurai: "Madurai (V)",
  naramon: "Naramon (−)",
  vazarin: "Vazarin (D)",
  zenurik: "Zenurik (=)",
  unairu: "Unairu (⬡)",
  umbra: "Umbra (⬟)",
};

function StatBox({
  label,
  value,
  color = "text-slate-200",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
        {label}
      </div>
      <div className={["text-sm font-semibold", color].join(" ")}>{value}</div>
    </div>
  );
}
function Label({
  children,
  color = "text-slate-400",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      className={[
        "text-xs uppercase tracking-wide font-semibold mb-2",
        color,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

const KNOWN_SYNDICATE_PREFIXES_INV = [
  "New Loka", "Steel Meridian", "Arbiters of Hexis", "Cephalon Suda",
  "The Perrin Sequence", "Red Veil", "Conclave", "Cephalon Simaris",
  "Operational Supply", "The Quills", "Vox Solaris", "Ventkids",
  "Ostron", "Solaris United", "Entrati", "The Holdfasts", "NecraLoid",
  "Kahl's Garrison", "Arbitrations",
];

function classifyDropInv(location: string): "syndicate" | "enemy" | "mission" | "relic" | "other" {
  if (location.includes("Relic")) return "relic";
  if (/^[A-Z][a-zA-Z ]+\/[A-Z]/.test(location) || location.startsWith("Duviri/")) return "mission";
  const commaIdx = location.indexOf(", ");
  if (commaIdx > 0) {
    const org = location.slice(0, commaIdx);
    if (KNOWN_SYNDICATE_PREFIXES_INV.some(p => org.startsWith(p))) return "syndicate";
  }
  if (!location.includes("/") && !location.includes(", ")) return "enemy";
  return "other";
}

function InvDropRow({ d, small = false }: {
  d: { chance: number; location: string; rarity: string; type?: string };
  small?: boolean;
}) {
  const kind = classifyDropInv(d.location);
  const sz = small ? "text-[10px]" : "text-xs";
  const rarityClass =
    d.rarity === "Common" ? "text-slate-400" :
    d.rarity === "Uncommon" ? "text-blue-300" :
    d.rarity === "Rare" ? "text-amber-300" : "text-rose-300";

  const wikiIconSvg = (
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
      <div className={["flex items-center gap-1.5 rounded px-2 py-1 bg-indigo-950/20 border border-indigo-800/30", sz].join(" ")}>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-indigo-400 shrink-0">Purchase</span>
        <a href={wikiUrl(syndName)} target="_blank" rel="noopener noreferrer"
          className="flex-1 truncate text-slate-300 hover:text-indigo-300 hover:underline transition-colors">{syndName}</a>
        {rankLabel && <span className="shrink-0 text-slate-500">{rankLabel}</span>}
        <a href={wikiUrl(syndName)} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors">{wikiIconSvg}</a>
      </div>
    );
  }

  if (kind === "enemy") {
    const farmUrl = `https://wiki.warframe.com/w/${encodeURIComponent(d.location.trim().replace(/\s+/g, "_"))}#Farming_Locations`;
    return (
      <div className={["flex items-center gap-1.5 rounded px-2 py-1 bg-slate-900/40 border border-slate-800/50", sz].join(" ")}>
        <a href={farmUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 truncate text-slate-300 hover:text-cyan-300 hover:underline transition-colors">{d.location}</a>
        <span className={["font-semibold shrink-0", rarityClass].join(" ")}>{d.rarity}</span>
        <span className="font-mono text-slate-500 shrink-0">{(d.chance * 100).toFixed(2)}%</span>
        <a href={farmUrl} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors">{wikiIconSvg}</a>
      </div>
    );
  }

  if (kind === "relic") {
    // "Lith C2 Relic (Exceptional)" → key "lith c2", base name "Lith C2 Relic"
    const baseName = d.location.replace(/\s+\(.*?\)\s*$/, "").trim();
    const relicKey = baseName.replace(/\s+Relic\s*$/i, "").trim().toLowerCase();
    const relic = getRelicByKey(relicKey);
    const isVaulted = relic ? !relic.isActive : false;
    const quality = d.location.match(/\(([^)]+)\)$/)?.[1];
    const farmUrl = `https://wiki.warframe.com/w/${encodeURIComponent(baseName.replace(/\s+/g, "_"))}`;
    return (
      <div className={["flex items-center gap-1.5 rounded px-2 py-1 border", isVaulted ? "bg-red-950/10 border-red-900/40" : "bg-slate-900/40 border-slate-800/50", sz].join(" ")}>
        <a href={farmUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 truncate text-slate-300 hover:text-cyan-300 hover:underline transition-colors">{baseName}</a>
        {quality && <span className="shrink-0 text-slate-500">{quality}</span>}
        {isVaulted && (
          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded border border-red-700/50 bg-red-950/40 text-red-400"
            title="This relic is vaulted — obtain via trading or Prime Resurgence (Varzia)">
            Vaulted
          </span>
        )}
        <span className={["font-semibold shrink-0", rarityClass].join(" ")}>{d.rarity}</span>
        <span className="font-mono text-slate-500 shrink-0">{(d.chance * 100).toFixed(2)}%</span>
        <a href={farmUrl} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors">{wikiIconSvg}</a>
      </div>
    );
  }

  return (
    <div className={["flex items-center gap-1.5 rounded px-2 py-1 bg-slate-900/40 border border-slate-800/50", sz].join(" ")}>
      <span className="flex-1 truncate text-slate-300">{d.location}</span>
      <span className={["font-semibold shrink-0", rarityClass].join(" ")}>{d.rarity}</span>
      <span className="font-mono text-slate-500 shrink-0">{(d.chance * 100).toFixed(2)}%</span>
    </div>
  );
}


/** Render a description string, replacing DT_ status tags and |VAR| placeholders */

const DT_TO_IMG_INV: Record<string, string> = {
  dt_corrosive_color: "essentialcorrosiveglyph", dt_corrosive: "essentialcorrosiveglyph",
  dt_electricity_color: "electricmodbundleicon", dt_electricity: "electricmodbundleicon",
  dt_explosion_color: "essentialblastglyph",    dt_explosion: "essentialblastglyph",
  dt_fire_color: "heatmodbundleicon",            dt_fire: "heatmodbundleicon",
  dt_freeze_color: "coldmodbundleicon",          dt_freeze: "coldmodbundleicon",
  dt_gas_color: "essentialgasglyph",             dt_gas: "essentialgasglyph",
  dt_impact_color: "essentialimpactglyph",
  dt_magnetic_color: "essentialmagneticglyph",  dt_magnetic: "essentialmagneticglyph",
  dt_poison_color: "toxinmodbundleicon",         dt_poison: "toxinmodbundleicon",
  dt_puncture_color: "essentialpunctureglyph",
  dt_radiant_color: "essentialradiationglyph",
  dt_radiation_color: "essentialradiationglyph", dt_radiation: "essentialradiationglyph",
  dt_sentient_color: "essentialtauglyph",        dt_sentient: "essentialtauglyph",
  dt_slash_color: "essentialslashglyph",         dt_slash: "essentialslashglyph",
  dt_viral_color: "essentialviralglyph",         dt_viral: "essentialviralglyph",
};

function renderDesc(text: string, values?: Record<string, string | number>): React.ReactNode {
  const cleaned = text
    .replace(/\n/g, "\n")
    .replace(/<LINE_SEPARATOR>/g, " · ")
    .replace(/<LOWER_IS_BETTER>/g, "")
    .replace(/<[A-Z_]+_SECONDARY_COLOR>/g, "")
    .replace(/<\/[A-Z_]+_SECONDARY_COLOR>/g, "")
    .replace(/<(?!DT_)[A-Z_]+>/g, "");

  const parts = cleaned.split(/(<DT_[A-Z_]+>|\|[A-Z_0-9]+\|)/);
  if (parts.length === 1) return <>{cleaned}</>;

  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("|") && part.endsWith("|")) {
      const varName = part.slice(1, -1);
      const resolved = values?.[varName] ?? values?.[varName.toLowerCase()];
      if (resolved !== undefined) {
        nodes.push(<span key={i} className="text-slate-100 font-semibold">{resolved}</span>);
      } else {
        const label = varName.toLowerCase().replace(/_/g, " ");
        nodes.push(
          <span
            key={i}
            className="inline-flex items-center rounded px-1 text-[10px] font-mono bg-slate-700/60 text-slate-400 border border-slate-600/50 mx-0.5"
            title="Exact value scales with Warframe stats and mods"
          >
            {label}
          </span>
        );
      }
    } else if (part.startsWith("<DT_") && part.endsWith(">")) {
      const key = part.slice(1, -1).toLowerCase();
      const imgUrl = DT_TO_IMG_INV[key] ? STATUS_IMG_INV[DT_TO_IMG_INV[key]] : null;
      if (imgUrl) {
        nodes.push(
          <img key={i} src={imgUrl}
            alt={key.replace("dt_", "").replace("_color", "")}
            title={key.replace("dt_", "").replace(/_color$/, "").replace(/_/g, " ")}
            className="inline w-3.5 h-3.5 object-contain mx-0.5 -mt-0.5"
          />
        );
      }
    } else if (part) {
      nodes.push(<span key={i}>{part}</span>);
    }
  }
  return <>{nodes}</>;
}

function wikiUrl(name: string): string {
  return `https://wiki.warframe.com/w/${encodeURIComponent(name.trim().replace(/\s+/g, "_"))}`;
}
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

function safeInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function Section(props: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-lg font-semibold">{props.title}</div>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

function TabButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "px-3 py-2 text-sm border-b-2",
        props.active
          ? "border-slate-100 text-slate-100"
          : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700",
      ].join(" ")}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function SubTabButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "rounded-lg px-3 py-1.5 text-sm border",
        props.active
          ? "bg-slate-100 text-slate-900 border-slate-100"
          : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900",
      ].join(" ")}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function PillButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "rounded-full px-3 py-1 text-sm border",
        props.active
          ? "bg-slate-100 text-slate-900 border-slate-100"
          : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900",
      ].join(" ")}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function SmallActionButton(props: {
  label: string;
  onClick: () => void;
  tone?: "primary" | "danger" | "neutral";
}) {
  const tone = props.tone ?? "neutral";
  const cls =
    tone === "primary"
      ? "bg-slate-100 text-slate-900 border-slate-100 hover:bg-white"
      : tone === "danger"
        ? "bg-rose-950/40 text-rose-200 border-rose-800 hover:bg-rose-950/70"
        : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900";

  return (
    <button
      className={["rounded-lg px-3 py-2 text-sm border", cls].join(" ")}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

type CategoryMeta = {
  main: string;
  sub: string | null;
};

function splitCategory(raw: string): CategoryMeta {
  const norm = normalize(raw ?? "");
  if (!norm) {
    return { main: "", sub: null };
  }

  const parts = norm.split("-");
  const main = parts[0] ?? "";
  const sub = parts.length > 1 ? parts.slice(1).join("-") : null;
  return { main, sub };
}

type Classification = {
  groups: Set<PrimaryTab>;

  warframesVehiclesSub: Set<Exclude<WarframesVehiclesTab, "all">>;
  companionsSub: Set<Exclude<CompanionsTab, "all">>;

  weaponClasses: Set<WeaponClassTab>;
  weaponTypesByClass: Partial<Record<WeaponClassTab, Set<string>>>;

  isResource: boolean;
  isComponent: boolean;
};

function emptyClassification(): Classification {
  return {
    groups: new Set<PrimaryTab>(),
    warframesVehiclesSub: new Set(),
    companionsSub: new Set(),
    weaponClasses: new Set(),
    weaponTypesByClass: {
      primary: new Set(),
      secondary: new Set(),
      melee: new Set(),
      companion: new Set(),
    },
    isResource: false,
    isComponent: false,
  };
}

const WEAPON_TYPE_BLOCKLIST = new Set<string>([
  "weapon",
  "weapons",
  "gun",
  "guns",
  "melee",
  "primary",
  "secondary",
  "archgun",
  "archguns",
  "tome",
  "tomes",
  "speargun",
  "spearguns",
  "kitgun",
  "kitguns",
]);

function classifyFromCategories(categories: string[]): Classification {
  const cls = emptyClassification();

  const metas = categories.map(splitCategory).filter((m) => m.main.length > 0);

  const mains = new Set<string>(metas.map((m) => m.main));

  // Warframes & Vehicles
  for (const m of metas) {
    if (m.main === "warframe" || m.main === "warframes") {
      cls.groups.add("warframesVehicles");
      cls.warframesVehiclesSub.add("warframes");
    }
    if (m.main === "archwing" || m.main === "archwings") {
      cls.groups.add("warframesVehicles");
      cls.warframesVehiclesSub.add("archwings");
    }
    if (
      m.main === "necramech" ||
      m.main === "necramechs" ||
      m.main === "mech" ||
      m.main === "mechs"
    ) {
      cls.groups.add("warframesVehicles");
      cls.warframesVehiclesSub.add("necramechs");
    }
  }

  // Companions
  for (const m of metas) {
    if (m.main === "pet" && m.sub) {
      const first = normalize(m.sub).split("-")[0];
      if (first === "kavat") {
        cls.groups.add("companions");
        cls.companionsSub.add("kavat");
      } else if (first === "kubrow") {
        cls.groups.add("companions");
        cls.companionsSub.add("kubrow");
      } else if (first === "moa") {
        cls.groups.add("companions");
        cls.companionsSub.add("moa");
      } else if (first === "hound") {
        cls.groups.add("companions");
        cls.companionsSub.add("hound");
      } else if (first === "sentinel") {
        cls.groups.add("companions");
        cls.companionsSub.add("sentinel");
      } else if (first === "vulpaphyla") {
        cls.groups.add("companions");
        cls.companionsSub.add("vulpaphyla");
      } else if (first === "predasite") {
        cls.groups.add("companions");
        cls.companionsSub.add("predasite");
      }
    }

    if (
      m.main === "kavat" ||
      m.main === "kubrow" ||
      m.main === "moa" ||
      m.main === "hound" ||
      m.main === "vulpaphyla" ||
      m.main === "predasite"
    ) {
      cls.groups.add("companions");
      cls.companionsSub.add(m.main as Exclude<CompanionsTab, "all">);
    }
  }

  // Resources / Components (conservative)
  for (const m of metas) {
    const main = m.main;

    if (
      main === "resource" ||
      main === "resources" ||
      main === "material" ||
      main === "materials"
    ) {
      cls.groups.add("resources");
      cls.isResource = true;
    }

    if (
      main === "component" ||
      main === "components" ||
      main === "part" ||
      main === "parts" ||
      main === "blueprint" ||
      main === "blueprints"
    ) {
      cls.groups.add("components");
      cls.isComponent = true;
    }
  }

  // Weapons: class from plain category presence
  if (mains.has("primary")) cls.weaponClasses.add("primary");
  if (mains.has("secondary")) cls.weaponClasses.add("secondary");
  if (mains.has("melee")) cls.weaponClasses.add("melee");

  if (cls.weaponClasses.size > 0) {
    cls.groups.add("weapons");
  }

  // Explicit structured weapon subtypes: `primary-*`, `secondary-*`, `melee-*`
  for (const m of metas) {
    if (m.main === "primary" || m.main === "secondary" || m.main === "melee") {
      const wc = m.main as WeaponClassTab;
      if (m.sub) {
        if (!cls.weaponTypesByClass[wc]) cls.weaponTypesByClass[wc] = new Set();
        cls.weaponTypesByClass[wc]!.add(normalize(m.sub));
      }
    }
  }

  // Add "type-like" categories based on other categories
  const otherTypeCandidates = new Set<string>();

  for (const m of metas) {
    if (m.main === "primary" || m.main === "secondary" || m.main === "melee")
      continue;
    if (m.main === "pet") continue;

    const main = m.main;
    if (!main || WEAPON_TYPE_BLOCKLIST.has(main)) continue;

    if (
      main === "warframe" ||
      main === "warframes" ||
      main === "archwing" ||
      main === "archwings" ||
      main === "necramech" ||
      main === "necramechs" ||
      main === "mech" ||
      main === "mechs" ||
      main === "resource" ||
      main === "resources" ||
      main === "material" ||
      main === "materials" ||
      main === "component" ||
      main === "components" ||
      main === "part" ||
      main === "parts" ||
      main === "blueprint" ||
      main === "blueprints" ||
      main === "kavat" ||
      main === "kubrow" ||
      main === "moa" ||
      main === "hound" ||
      main === "sentinel" ||
      main === "sentinels"
    ) {
      continue;
    }

    otherTypeCandidates.add(main);
  }

  for (const wc of cls.weaponClasses) {
    if (!cls.weaponTypesByClass[wc]) cls.weaponTypesByClass[wc] = new Set();
    for (const t of otherTypeCandidates) {
      cls.weaponTypesByClass[wc]!.add(t);
    }
  }

  // Explicit coercions
  if (mains.has("archgun") || mains.has("archguns")) {
    cls.groups.add("weapons");
    cls.weaponClasses.add("primary");
    if (!cls.weaponTypesByClass.primary)
      cls.weaponTypesByClass.primary = new Set();
    cls.weaponTypesByClass.primary!.add("archgun");
  }

  if (mains.has("speargun") || mains.has("spearguns")) {
    cls.groups.add("weapons");
    cls.weaponClasses.add("primary");
    if (!cls.weaponTypesByClass.primary)
      cls.weaponTypesByClass.primary = new Set();
    cls.weaponTypesByClass.primary!.add("speargun");
  }

  if (mains.has("tome") || mains.has("tomes")) {
    cls.groups.add("weapons");
    cls.weaponClasses.add("secondary");
    if (!cls.weaponTypesByClass.secondary)
      cls.weaponTypesByClass.secondary = new Set();
    cls.weaponTypesByClass.secondary!.add("tome");
  }

  if (mains.has("kitgun") || mains.has("kitguns")) {
    cls.groups.add("weapons");
    cls.weaponClasses.add("secondary");
    if (!cls.weaponTypesByClass.secondary)
      cls.weaponTypesByClass.secondary = new Set();
    cls.weaponTypesByClass.secondary!.add("kitgun");
  }

  return cls;
}

function getRawStringsForHeuristics(id: CatalogId, rec: any): string {
  const parts: string[] = [];

  parts.push(String(id));

  const raw: any = rec?.raw ?? {};
  const wfcd: any = raw?.rawWfcd ?? null;
  const lotus: any = raw?.rawLotus ?? null;

  // Common names in various merges
  const uniq =
    typeof wfcd?.uniqueName === "string"
      ? wfcd.uniqueName
      : typeof lotus?.uniqueName === "string"
        ? lotus.uniqueName
        : typeof raw?.uniqueName === "string"
          ? raw.uniqueName
          : "";

  const type =
    typeof wfcd?.type === "string"
      ? wfcd.type
      : typeof lotus?.type === "string"
        ? lotus.type
        : typeof raw?.type === "string"
          ? raw.type
          : "";

  const productCategory =
    typeof wfcd?.productCategory === "string"
      ? wfcd.productCategory
      : typeof lotus?.productCategory === "string"
        ? lotus.productCategory
        : "";

  const category =
    typeof wfcd?.category === "string"
      ? wfcd.category
      : typeof lotus?.category === "string"
        ? lotus.category
        : "";

  parts.push(uniq, type, productCategory, category);

  return normalize(parts.filter(Boolean).join(" | "));
}

function isCompanionLikeByRawHeuristic(h: string): boolean {
  // Be strict. Do NOT match generic words like "vulpaphyla" or "predasite" here,
  // because many non-companion items contain those words (tags, floofs, lures, glyphs).
  return (
    h.includes("/types/friendly/pets/") ||
    h.includes("catbrowpetpowersuit") ||
    h.includes("kubrowpetpowersuit") ||
    h.includes("petpowersuit") ||
    h.includes("sentinel") ||
    h.includes("moa") ||
    h.includes("hound")
  );
}

function coerceCompanionSubtypeFromHeuristic(
  catalogId: string,
  rec: any,
): Exclude<CompanionsTab, "all"> | null {
  const idh = normalize(String(catalogId));
  const name = normalize(String(rec?.displayName ?? ""));

  // Vulpaphylas: internally "InfestedCatbrowPetPowerSuit" (and BaseInfestedCatbrowPetPowerSuit)
  // The sample shows these live under: /Types/Friendly/Pets/CreaturePets/*InfestedCatbrowPetPowerSuit
  if (
    (idh.includes("/types/friendly/pets/") &&
      idh.includes("infestedcatbrowpetpowersuit")) ||
    (idh.includes("/types/friendly/pets/creaturepets/") &&
      idh.includes("catbrow") &&
      idh.includes("powersuit")) ||
    (name.includes("vulpaphyla") &&
      idh.includes("/types/friendly/pets/") &&
      idh.includes("powersuit"))
  ) {
    return "vulpaphyla";
  }

  // Predasites: internally "InfestedKubrowPetPowerSuit" (common pattern)
  if (
    (idh.includes("/types/friendly/pets/") &&
      idh.includes("infestedkubrowpetpowersuit")) ||
    (name.includes("predasite") &&
      idh.includes("/types/friendly/pets/") &&
      idh.includes("powersuit"))
  ) {
    return "predasite";
  }

  // Normal buckets (avoid name-only matches unless it’s clearly a pet powersuit)
  if (idh.includes("catbrow") && idh.includes("powersuit")) return "kavat";
  if (idh.includes("kubrow") && idh.includes("powersuit")) return "kubrow";
  if (idh.includes("moa") && idh.includes("powersuit")) return "moa";
  if (idh.includes("hound") && idh.includes("powersuit")) return "hound";
  if (idh.includes("sentinel")) return "sentinel";

  return null;
}

function isCompanionWeaponByCatalogId(catalogId: string): boolean {
  const h = normalize(String(catalogId));

  // Beast/robot/sentinel weapons stored under the Pets namespace
  if (h.includes("/types/friendly/pets/") && h.includes("/beastweapons/"))
    return true;
  if (h.includes("/types/friendly/pets/") && h.includes("/robotweapons/"))
    return true;
  if (h.includes("/types/friendly/pets/") && h.includes("/sentinelweapons/"))
    return true;

  // Sentinel weapons stored directly under /Types/Sentinels/SentinelWeapons/
  // (e.g. Artax, Deth Machine Rifle, Deconstructor)
  if (h.includes("/types/sentinels/sentinelweapons/")) return true;

  // Common naming fragments
  if (h.includes("petweapon")) return true;

  return false;
}

function isRelicProjectionItem(catalogId: CatalogId, rec: any): boolean {
  const cid = String(catalogId);
  if (/\/Types\/Game\/Projections\//i.test(cid)) return true;

  const raw = rec?.raw as any;
  const wfcdName =
    raw?.rawWfcd?.uniqueName ?? raw?.rawWfcd?.unique_name ?? null;
  const lotusName =
    raw?.rawLotus?.uniqueName ?? raw?.rawLotus?.unique_name ?? null;

  const u = String(wfcdName ?? lotusName ?? "");
  return /\/Types\/Game\/Projections\//i.test(u);
}

function relicTierFromName(displayName: string): string | null {
  const s = normalize(String(displayName ?? ""));
  if (s.startsWith("lith ")) return "lith";
  if (s.startsWith("meso ")) return "meso";
  if (s.startsWith("neo ")) return "neo";
  if (s.startsWith("axi ")) return "axi";
  return null;
}

function isBaseTemplateCompanion(catalogId: string, rec: any): boolean {
  const idh = normalize(String(catalogId));
  const name = String(rec?.displayName ?? "");
  const isAllCaps = name.length > 0 && name === name.toUpperCase();

  // Only consider pet powersuits; avoids floofs/tags/lures/glyphs etc.
  const isPetPowerSuit =
    idh.includes("/types/friendly/pets/") && idh.includes("powersuit");

  // Common base/template naming
  const looksLikeBaseById = /\/base[a-z0-9_]*powersuit$/i.test(
    String(catalogId),
  );
  const hasBaseFragment =
    idh.includes("baseinfested") ||
    idh.includes("/base") ||
    idh.includes("basepredasite");

  return (
    isPetPowerSuit && (looksLikeBaseById || (hasBaseFragment && isAllCaps))
  );
}

function isRelicProjection(catalogId: string, rec: any): boolean {
  const cid = String(catalogId);

  if (/\/Types\/Game\/Projections\//i.test(cid)) return true;

  const raw = rec?.raw as any;
  const wfcdName =
    raw?.rawWfcd?.uniqueName ?? raw?.rawWfcd?.unique_name ?? null;
  const lotusName =
    raw?.rawLotus?.uniqueName ?? raw?.rawLotus?.unique_name ?? null;

  const u = String(wfcdName ?? lotusName ?? "");
  return /\/Types\/Game\/Projections\//i.test(u);
}

function isBaseTemplateRelic(catalogId: string, rec: any): boolean {
  // Hide base placeholder relic items like "Neo Relic", "Axi Relic", etc.
  // Keep actual projections like "Axi A1 Intact" etc.
  const name = String(rec?.displayName ?? "").trim();
  if (!name) return false;

  // Only apply to actual projection relic entities (avoid hiding unrelated cosmetics/strings)
  if (!isRelicProjection(String(catalogId), rec)) return false;

  // Exact generic base names
  if (/^(Lith|Meso|Neo|Axi)\s+Relic$/i.test(name)) return true;
  if (/^Void\s+Relic$/i.test(name)) return true;

  // Defensive: some base templates are ALLCAPS and very short
  const isAllCaps = name.length > 0 && name === name.toUpperCase();
  if (isAllCaps && /relic/i.test(name) && name.length <= 12) return true;

  return false;
}

/**
 * Minimal fallback classifier:
 * If WFCD categories aren’t sufficient (common for Resources/Components),
 * also use rec.raw.type to bucket.
 */
function classifyFromRecord(catalogId: string, rec: any): Classification {
  const categories = Array.isArray(rec?.categories)
    ? (rec.categories as string[])
    : [];
  const cls = classifyFromCategories(categories);

  // Companion weapons (sentinel, beast, robot) get their own "companion" weapon class tab.
  // IMPORTANT: clear all other weapon classes so they don't bleed into Primary/Secondary/Melee.
  if (isCompanionWeaponByCatalogId(catalogId)) {
    cls.groups.delete("companions");
    cls.companionsSub.clear();
    // Remove from any non-companion weapon classes
    cls.weaponClasses.clear();
    cls.weaponTypesByClass = { companion: new Set() };

    cls.groups.add("weapons");
    cls.weaponClasses.add("companion");

    return cls;
  }

  const rawType =
    typeof rec?.raw?.type === "string" ? normalize(rec.raw.type) : "";

  if (rawType === "resource") {
    cls.groups.add("resources");
    cls.isResource = true;
  }

  if (
    rawType === "blueprint" ||
    rawType === "component" ||
    rawType === "part"
  ) {
    cls.groups.add("components");
    cls.isComponent = true;
  }

  // WFCD sometimes encodes materials as type="Misc"
  const mains = new Set(categories.map((c) => splitCategory(c).main));
  if (!cls.isResource && rawType === "misc" && mains.has("misc")) {
    cls.groups.add("resources");
    cls.isResource = true;
  }

  // Heuristic companion detection + subtype fix-ups.
  // Needed because some companion entities have weak/empty categories (e.g. base VULPAPHYLA powersuit).
  {
    const h = getRawStringsForHeuristics(catalogId as any, rec);

    const cid = normalize(String(catalogId));
    const isPetEntity =
      cid.includes("/types/friendly/pets/") &&
      (cid.includes("powersuit") || h.includes("petpowersuit"));

    // If it is clearly a pet entity, ensure it is in Companions even if categories were empty.
    if (isPetEntity && isCompanionLikeByRawHeuristic(h)) {
      cls.groups.add("companions");
    }

    if (cls.groups.has("companions")) {
      const sub = coerceCompanionSubtypeFromHeuristic(catalogId, rec);
      if (sub) {
        // If it was previously classified as kavat via `pet-kavat`, replace it.
        cls.companionsSub.delete("kavat");
        cls.companionsSub.add(sub);
      }
    }
  }

  return cls;
}

/** Items that contribute to mastery rank when leveled */
function isMasterableItem(cls: Classification): boolean {
  return (
    cls.groups.has("warframesVehicles") ||
    cls.groups.has("weapons") ||
    cls.groups.has("companions")
  );
}

/** Resolve mastery status supporting both catalog ID keys and legacy Lotus path keys */
function checkMastered(
  mastered: Record<string, boolean>,
  overLevelMastered: Record<string, boolean>,
  catalogId: string,
  path: string,
): boolean {
  return (
    mastered[catalogId] === true ||
    mastered[path] === true ||
    overLevelMastered[catalogId] === true ||
    overLevelMastered[path] === true
  );
}

/** Returns true if the given Lotus path is an overlevel weapon. */
function isOverLevelWeaponPath(path: string): boolean {
  return OVERLEVEL_WEAPON_PATHS.has(path);
}

type Row = {
  id: CatalogId;
  label: string;
  value: number;
  categories: string[];
  cls: Classification;
  path: string; // raw Lotus path — used for backward-compat mastery lookup
  isMasterable: boolean;
  tags: string[]; // WFCD tags (Kuva Lich, Tenet, Vandal, Prime, etc.)
  isOverLevel: boolean; // true for Kuva/Tenet/Coda/Paracesis weapons
};

type VirtualWindow = {
  start: number;
  end: number;
  viewportH: number;
  scrollTop: number;
};

// Stable fallback references — avoids creating new objects on every render in ?? fallbacks
// which would cause useSyncExternalStore to detect a new snapshot reference and loop.
const EMPTY_BOOL_RECORD: Record<string, boolean> = {};
const EMPTY_NUM_RECORD: Record<string, number> = {};
const EMPTY_ARRAY: never[] = [];

// 5.2 Filter mode types
type OwnershipFilter = "all" | "owned" | "unowned" | "mastered";

export default function Inventory() {
  const counts = useTrackerStore(
    (s) => s.state.inventory.counts ?? EMPTY_NUM_RECORD,
  );
  const setCount = useTrackerStore((s) => s.setCount);
  const setMastered = useTrackerStore((s) => s.setMastered);
  const setOverLevelMastered = useTrackerStore((s) => s.setOverLevelMastered);
  const mastered = useTrackerStore(
    (s) => s.state.mastery?.mastered ?? EMPTY_BOOL_RECORD,
  );
  const overLevelMastered = useTrackerStore(
    (s) => s.state.mastery?.overLevelMastered ?? EMPTY_BOOL_RECORD,
  );
  const completedPrereqs = useTrackerStore(
    (s) => s.state.prereqs?.completed ?? EMPTY_BOOL_RECORD,
  );
  const masteryRank = useTrackerStore(
    (s) => s.state.player?.masteryRank ?? null,
  );

  const goals = useTrackerStore((s) => s.state.goals ?? EMPTY_ARRAY);
  const addGoalItem = useTrackerStore((s) => s.addGoalItem);
  const removeGoal = useTrackerStore((s) => s.removeGoal);
  const setGoalQty = useTrackerStore((s) => s.setGoalQty);

  const goalByCatalogId = useMemo(() => {
    const map = new Map<string, any>();
    for (const g of goals ?? []) {
      if (!g) continue;
      if (g.type !== "item") continue;
      if (g.isActive === false) continue;
      map.set(String(g.catalogId), g);
    }
    return map;
  }, [goals]);

  const [query, setQuery] = useState("");
  const [hideZero, setHideZero] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("az");

  // 5.2: Additional filter state
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");
  const [showMasteryAvailable, setShowMasteryAvailable] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // 5.3: Item detail panel
  const [selectedDetailId, setSelectedDetailId] = useState<CatalogId | null>(
    null,
  );

  // Overlevel weapons panel state
  const [overLevelOpen, setOverLevelOpen] = useState(false);
  const [overLevelTab, setOverLevelTab] = useState<"kuva" | "tenet" | "coda">(
    "kuva",
  );

  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("all");

  const [wfVehTab, setWfVehTab] = useState<WarframesVehiclesTab>("all");
  const [companionsTab, setCompanionsTab] = useState<CompanionsTab>("all");

  const [weaponClassTab, setWeaponClassTab] = useState<WeaponClassTab>("all");
  const [weaponTypeFilters, setWeaponTypeFilters] = useState<string[]>([]);
  const [weaponTagFilters, setWeaponTagFilters] = useState<string[]>([]);

  function selectPrimaryTab(next: PrimaryTab) {
    setPrimaryTab(next);

    setWfVehTab("all");
    setCompanionsTab("all");

    setWeaponTypeFilters([]);
  }

  function selectWeaponClass(next: WeaponClassTab) {
    setWeaponClassTab(next);
    setWeaponTypeFilters([]);
    setWeaponTagFilters([]);
  }

  const rows = useMemo<Row[]>(() => {
    const q = normalize(query);

    const base: Row[] = (
      FULL_CATALOG.displayableInventoryItemIds as CatalogId[]
    )
      .map((id) => {
        const rec: any = FULL_CATALOG.recordsById[id];
        if (!rec?.displayName) return null;

        const categories = rec.categories ?? [];
        const cls = classifyFromRecord(String(id), rec);

        // Hide base/template companion records like "VULPAPHYLA" / "PREDASITE" (Base*PowerSuit).
        // Keep real companions and non-companion items that mention these words (tags, floofs, lures, glyphs).
        if (
          cls.groups.has("companions") &&
          isBaseTemplateCompanion(String(id), rec)
        ) {
          return null;
        }

        // Hide base/template relic records like "Neo Relic", "Axi Relic", etc.
        // Keep actual projection relic items like "Axi A1 Intact", etc.
        if (isBaseTemplateRelic(String(id), rec)) {
          return null;
        }

        const rawPath = String((rec as any).path ?? "");
        const wfcdRaw = (rec as any).raw?.rawWfcd ?? null;
        const tags: string[] = Array.isArray(wfcdRaw?.tags)
          ? wfcdRaw.tags.filter((t: any) => typeof t === "string")
          : [];

        return {
          id,
          label: rec.displayName,
          value: safeInt(counts[String(id)] ?? 0, 0),
          categories,
          cls,
          path: rawPath,
          isMasterable: isMasterableItem(cls),
          tags,
          isOverLevel: isOverLevelWeaponPath(rawPath),
        } as Row;
      })
      .filter((r): r is Row => !!r)
      .filter((r) => {
        if (!q) return true;

        const label = normalize(r.label);
        const id = normalize(String(r.id));

        // Base searchable fields
        if (label.includes(q) || id.includes(q)) return true;

        // Also search categories (helps a lot for non-obvious items)
        const cats = Array.isArray(r.categories)
          ? r.categories.map(normalize).join(" | ")
          : "";
        if (cats.includes(q)) return true;

        // Relic keyword augmentation:
        // If it’s a relic projection, allow "relic" to match even if displayName doesn’t include it.
        const rec: any = FULL_CATALOG.recordsById[r.id];
        if (isRelicProjectionItem(r.id, rec)) {
          if ("relic".includes(q) || q.includes("relic")) return true;

          // Optional: let "axi/neo/meso/lith" match via derived tier token (even if name format changes)
          const tier = relicTierFromName(r.label);
          if (tier && tier.includes(q)) return true;
        }

        return false;
      })
      .filter((r) => {
        if (!hideZero) return true;
        return r.value > 0;
      });

    base.sort((a, b) => {
      const aCount = safeInt(counts[String(a.id)] ?? 0, 0);
      const bCount = safeInt(counts[String(b.id)] ?? 0, 0);
      const aMastered = checkMastered(
        mastered,
        overLevelMastered,
        String(a.id),
        a.path,
      );
      const bMastered = checkMastered(
        mastered,
        overLevelMastered,
        String(b.id),
        b.path,
      );

      switch (sortKey) {
        case "za":
          return b.label.localeCompare(a.label);
        case "count-desc":
          if (aCount !== bCount) return bCount - aCount;
          break;
        case "count-asc":
          if (aCount !== bCount) return aCount - bCount;
          break;
        case "owned-first": {
          const ao = aCount > 0 ? 0 : 1,
            bo = bCount > 0 ? 0 : 1;
          if (ao !== bo) return ao - bo;
          break;
        }
        case "unowned-first": {
          const ao = aCount === 0 ? 0 : 1,
            bo = bCount === 0 ? 0 : 1;
          if (ao !== bo) return ao - bo;
          break;
        }
        case "mastered-last": {
          const am = aMastered ? 1 : 0,
            bm = bMastered ? 1 : 0;
          if (am !== bm) return am - bm;
          break;
        }
        case "release-newest": {
          const ad = ALL_BY_UNIQUE[a.path]?.releaseDate ?? "";
          const bd = ALL_BY_UNIQUE[b.path]?.releaseDate ?? "";
          if (ad !== bd) return bd > ad ? 1 : -1;
          break;
        }
        case "release-oldest": {
          const ad = ALL_BY_UNIQUE[a.path]?.releaseDate ?? "";
          const bd = ALL_BY_UNIQUE[b.path]?.releaseDate ?? "";
          if (ad !== bd) return ad > bd ? 1 : -1;
          break;
        }
        case "mr-asc": {
          const am = ALL_BY_UNIQUE[a.path]?.masteryReq ?? 0;
          const bm = ALL_BY_UNIQUE[b.path]?.masteryReq ?? 0;
          if (am !== bm) return am - bm;
          break;
        }
        case "mr-desc": {
          const am = ALL_BY_UNIQUE[a.path]?.masteryReq ?? 0;
          const bm = ALL_BY_UNIQUE[b.path]?.masteryReq ?? 0;
          if (am !== bm) return bm - am;
          break;
        }
        default:
          break;
      }
      return a.label.localeCompare(b.label);
    });

    // Add Plexus as a synthetic row — it's not in the catalog but counts toward mastery
    const PLEXUS_PATH = "/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness";
    const PLEXUS_ID = `items:${PLEXUS_PATH}` as CatalogId;
    const plexusCls: Classification = {
      groups: new Set(["warframesVehicles"]),
      warframesVehiclesSub: new Set(["warframes"]),
      weaponClasses: new Set(),
      weaponTypesByClass: {},
      companionsSub: new Set(),
      isResource: false,
      isComponent: false,
    };
    const plexusQ = normalize(query);
    if (
      !plexusQ ||
      "plexus".includes(plexusQ) ||
      "railjack".includes(plexusQ)
    ) {
      base.push({
        id: PLEXUS_ID,
        label: "Plexus",
        value: 0,
        categories: ["warframes"],
        cls: plexusCls,
        path: PLEXUS_PATH,
        isMasterable: true,
        tags: ["Railjack"],
        isOverLevel: false,
      });
    }

    return base;
  }, [counts, mastered, overLevelMastered, query, hideZero, sortKey]);

  // Overlevel weapons: all Kuva/Tenet/Coda/Paracesis weapons from the catalog
  const overLevelRows = useMemo(() => {
    function getOverLevelFamily(label: string): "kuva" | "tenet" | "coda" {
      if (label.startsWith("Coda ") || label.startsWith("Dual Coda "))
        return "coda";
      if (label.startsWith("Tenet ")) return "tenet";
      return "kuva"; // Kuva weapons + Paracesis
    }
    function weaponClassOrder(wc: string): number {
      const w = wc.toLowerCase();
      if (w === "primary") return 0;
      if (w === "secondary") return 1;
      if (w === "melee") return 2;
      return 3;
    }
    return (FULL_CATALOG.displayableInventoryItemIds as CatalogId[])
      .map((id) => {
        const rec: any = FULL_CATALOG.recordsById[id];
        if (!rec?.displayName) return null;
        const path = String((rec as any).path ?? "");
        if (!isOverLevelWeaponPath(path)) return null;
        const isMastered =
          overLevelMastered[String(id)] === true ||
          overLevelMastered[path] === true;
        const wfcdRaw = (rec as any).raw?.rawWfcd ?? null;
        const weaponClass = wfcdRaw?.category ?? "Weapon";
        const label = rec.displayName;
        const family = getOverLevelFamily(label);
        return { id, label, path, isMastered, weaponClass, family };
      })
      .filter((r): r is NonNullable<typeof r> => !!r)
      .sort((a, b) => {
        const co =
          weaponClassOrder(a.weaponClass) - weaponClassOrder(b.weaponClass);
        if (co !== 0) return co;
        return a.label.localeCompare(b.label);
      });
  }, [overLevelMastered]);

  // 5.2: Ownership + availability filter applied after category filtering
  // (computationally expensive filters run only on already-filtered set)

  const weaponTypeOptions = useMemo(() => {
    const set = new Set<string>();
    const tabsToCheck: WeaponClassTab[] =
      weaponClassTab === "all"
        ? ["primary", "secondary", "melee"]
        : [weaponClassTab];
    for (const r of rows) {
      for (const wc of tabsToCheck) {
        if (!r.cls.weaponClasses.has(wc)) continue;
        for (const t of r.cls.weaponTypesByClass[wc] ?? []) {
          if (t && t.trim()) set.add(normalize(t));
        }
      }
    }
    const out = Array.from(set);
    out.sort((a, b) => a.localeCompare(b));
    return out;
  }, [rows, weaponClassTab]);

  const weaponTagOptions = useMemo(() => {
    const set = new Set<string>();
    const tabsToCheck: WeaponClassTab[] =
      weaponClassTab === "all"
        ? ["primary", "secondary", "melee", "companion"]
        : [weaponClassTab];
    for (const r of rows) {
      const matches = tabsToCheck.some((wc) => r.cls.weaponClasses.has(wc));
      if (!matches) continue;
      for (const tag of r.tags) {
        if (tag.trim()) set.add(tag.trim());
      }
    }
    const out = Array.from(set);
    out.sort((a, b) => a.localeCompare(b));
    return out;
  }, [rows, weaponClassTab]);

  const filtered = useMemo(() => {
    // Railjack tab — shows Plexus (which is in the warframesVehicles group)
    if (primaryTab === "railjack") {
      return rows.filter(
        (r) => r.path === "/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness",
      );
    }

    // "All" tab — show warframes, weapons, companions including Plexus synthetic row
    if (primaryTab === "all") {
      return rows.filter((r) => {
        if (r.cls.groups.has("components")) return false;
        if (r.cls.groups.has("resources")) return false;
        return (
          r.cls.groups.has("warframesVehicles") ||
          r.cls.groups.has("weapons") ||
          r.cls.groups.has("companions")
        );
      });
    }

    if (primaryTab === "warframesVehicles") {
      return rows.filter((r) => {
        if (!r.cls.groups.has("warframesVehicles")) return false;
        if (r.cls.groups.has("components")) return false; // blueprints/parts go to their own tab
        if (wfVehTab === "all") return true;
        return r.cls.warframesVehiclesSub.has(wfVehTab);
      });
    }

    if (primaryTab === "companions") {
      return rows.filter((r) => {
        if (!r.cls.groups.has("companions")) return false;
        if (r.cls.groups.has("components")) return false;
        if (companionsTab === "all") return true;
        return r.cls.companionsSub.has(companionsTab);
      });
    }

    if (primaryTab === "resources") {
      // Resources: raw farming materials (Circuits, Plastids, Ferrite, etc.)
      // Some resources also carry the "components" classification in WFCD data;
      // show them here anyway — the Resources tab is their primary home.
      return rows.filter((r) => r.cls.groups.has("resources"));
    }

    if (primaryTab === "components") {
      // "Blueprints & Parts" — actual crafting recipes, parts and components
      // (Ash Neuroptics, Braton Blueprint, etc.), but NOT raw farming resources
      // which happen to have the "components" classification in WFCD.
      return rows.filter(
        (r) =>
          r.cls.groups.has("components") &&
          !r.cls.isResource &&
          !r.cls.groups.has("resources"),
      );
    }

    // Weapons — exclude blueprints/parts
    return rows.filter((r) => {
      if (!r.cls.groups.has("weapons")) return false;
      if (r.cls.groups.has("components")) return false;

      // For "all" tab, show every weapon class
      if (weaponClassTab !== "all" && !r.cls.weaponClasses.has(weaponClassTab))
        return false;

      // Type sub-filter (not applicable to companion tab or all tab)
      if (
        weaponTypeFilters.length > 0 &&
        weaponClassTab !== "companion" &&
        weaponClassTab !== "all"
      ) {
        const allowed = new Set(weaponTypeFilters.map(normalize));
        const types = r.cls.weaponTypesByClass[weaponClassTab];
        if (!types || types.size === 0) return false;
        if (!Array.from(types).some((t) => allowed.has(normalize(t))))
          return false;
      }

      // Tag filter
      if (weaponTagFilters.length > 0) {
        if (!weaponTagFilters.some((tag) => r.tags.includes(tag))) return false;
      }

      return true;
    });
  }, [
    rows,
    primaryTab,
    wfVehTab,
    companionsTab,
    weaponClassTab,
    weaponTypeFilters,
    weaponTagFilters,
  ]);

  // 5.2: Apply additional filters after category tab filtering
  const finalFiltered = useMemo(() => {
    let result = filtered;

    // Ownership / mastery filter
    if (ownershipFilter === "owned") {
      result = result.filter((r) => safeInt(counts[String(r.id)] ?? 0, 0) > 0);
    } else if (ownershipFilter === "unowned") {
      result = result.filter(
        (r) => safeInt(counts[String(r.id)] ?? 0, 0) === 0,
      );
    } else if (ownershipFilter === "mastered") {
      result = result.filter((r) =>
        checkMastered(mastered, overLevelMastered, String(r.id), r.path),
      );
    }

    // Mastery available: any masterable item not yet mastered (owned or not)
    if (showMasteryAvailable) {
      result = result.filter((r) => {
        if (!r.isMasterable) return false;
        return !checkMastered(
          mastered,
          overLevelMastered,
          String(r.id),
          r.path,
        );
      });
    }

    // Available only: at least one acquisition source is accessible
    if (showAvailableOnly) {
      result = result.filter((r) => {
        const avail = determineItemAvailability(
          r.id,
          completedPrereqs,
          masteryRank,
        );
        return avail === "available" || avail === "partial";
      });
    }

    return result;
  }, [
    filtered,
    ownershipFilter,
    showMasteryAvailable,
    showAvailableOnly,
    counts,
    mastered,
    overLevelMastered,
    completedPrereqs,
    masteryRank,
  ]);

  /**
   * Batch update goals for the *currently filtered* item list.
   * This is intentionally a single store transaction to avoid OOM from thousands of renders.
   */
  function setGoalsForFiltered(goalQty: number) {
    const qty = Math.max(0, safeInt(goalQty, 0));
    const ids = new Set<string>(finalFiltered.map((r) => String(r.id)));

    useTrackerStore.setState((st: any) => {
      const nextGoals: any[] = Array.isArray(st?.state?.goals)
        ? [...st.state.goals]
        : [];

      // Index existing active item goals by catalogId
      const idxByCatalogId = new Map<string, number>();
      for (let i = 0; i < nextGoals.length; i++) {
        const g = nextGoals[i];
        if (!g) continue;
        if (g.type !== "item") continue;
        if (g.isActive === false) continue;
        idxByCatalogId.set(String(g.catalogId), i);
      }

      if (qty <= 0) {
        // Clear goals for filtered ids
        const kept = nextGoals.filter((g) => {
          if (!g) return false;
          if (g.type !== "item") return true;
          if (g.isActive === false) return true;
          return !ids.has(String(g.catalogId));
        });
        st.state.goals = kept;
      } else {
        // Set goal=qty for filtered ids (create if missing)
        const iso = nowIso();
        for (const cid of ids) {
          const idx = idxByCatalogId.get(cid);
          if (idx === undefined) {
            nextGoals.push({
              id: uid("goal"),
              type: "item",
              catalogId: cid,
              qty,
              isActive: true,
              createdAtIso: iso,
              updatedAtIso: iso,
            });
          } else {
            const g = nextGoals[idx];
            nextGoals[idx] = {
              ...g,
              qty,
              isActive: true,
              updatedAtIso: iso,
            };
          }
        }
        st.state.goals = nextGoals;
      }

      if (st?.state?.meta) {
        st.state.meta.updatedAtIso = nowIso();
      }
    });
  }

  // -------- Virtualization (manual, no deps) --------
  const listRef = useRef<HTMLDivElement | null>(null);

  // Fixed row height; keep consistent with the row layout below.
  const ROW_H = 56;
  const OVERSCAN = 10;

  const [vw, setVw] = useState<VirtualWindow>({
    start: 0,
    end: 0,
    viewportH: 0,
    scrollTop: 0,
  });

  function recomputeWindow() {
    const el = listRef.current;
    if (!el) return;

    const viewportH = el.clientHeight;
    const scrollTop = el.scrollTop;

    const total = finalFiltered.length;

    const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
    const visibleCount = Math.ceil(viewportH / ROW_H) + OVERSCAN * 2;
    const end = Math.min(total, start + visibleCount);

    setVw({ start, end, viewportH, scrollTop });
  }

  useEffect(() => {
    // After filters change, reset scroll and recompute.
    const el = listRef.current;
    if (el) el.scrollTop = 0;
    // Next tick so layout is stable.
    requestAnimationFrame(() => recomputeWindow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    primaryTab,
    wfVehTab,
    companionsTab,
    weaponClassTab,
    weaponTypeFilters,
    weaponTagFilters,
    query,
    hideZero,
    ownershipFilter,
    showMasteryAvailable,
    showAvailableOnly,
  ]);

  useEffect(() => {
    // Recompute on data length changes.
    requestAnimationFrame(() => recomputeWindow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalFiltered.length]);

  useEffect(() => {
    const onResize = () => recomputeWindow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // -----------------------------------------------

  const totalHeight = finalFiltered.length * ROW_H;
  const slice = finalFiltered.slice(vw.start, vw.end);
  const translateY = vw.start * ROW_H;

  const overLevelTabRows = overLevelRows.filter(
    (r) => r.family === overLevelTab,
  );
  const overLevelMasteredCount = overLevelRows.filter(
    (r) => r.isMastered,
  ).length;

  // Group overLevelTabRows by weapon class for display headers
  const overLevelByClass = overLevelTabRows.reduce<
    Record<string, typeof overLevelTabRows>
  >((acc, r) => {
    const wc = r.weaponClass;
    if (!acc[wc]) acc[wc] = [];
    acc[wc].push(r);
    return acc;
  }, {});
  const classOrder = ["Primary", "Secondary", "Melee"];
  const overLevelClassGroups = classOrder
    .filter((wc) => overLevelByClass[wc]?.length)
    .map((wc) => ({ label: wc, rows: overLevelByClass[wc] }));

  return (
    <div className="space-y-6">
      {/* ── Overlevel Weapons Mastery (collapsible) ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
        <button
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() => setOverLevelOpen((v) => !v)}
          aria-expanded={overLevelOpen}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-100">
              Overlevel Weapons Mastery
            </span>
            <span className="text-xs text-slate-500">
              {overLevelMasteredCount}/{overLevelRows.length} confirmed
            </span>
          </div>
          <svg
            className={[
              "w-4 h-4 text-slate-400 transition-transform",
              overLevelOpen ? "rotate-180" : "",
            ].join(" ")}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {overLevelOpen && (
          <div className="px-4 pb-4">
            <p className="text-xs text-slate-400 mb-3">
              Kuva Lich, Tenet, Technocyte Coda, and Paracesis weapons require{" "}
              <strong className="text-slate-200">Rank 40</strong> to count as
              mastered. They are not auto-detected via profile import (XP across
              Forma cycles is variable). Toggle each weapon once you have
              reached Rank 40.
            </p>

            {/* Family tabs */}
            <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2">
              {(["kuva", "tenet", "coda"] as const).map((tab) => {
                const count = overLevelRows.filter(
                  (r) => r.family === tab,
                ).length;
                const mastered = overLevelRows.filter(
                  (r) => r.family === tab && r.isMastered,
                ).length;
                return (
                  <button
                    key={tab}
                    className={[
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                      overLevelTab === tab
                        ? "bg-slate-100 text-slate-900 border-slate-100"
                        : "bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-800",
                    ].join(" ")}
                    onClick={() => setOverLevelTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span className="ml-1.5 opacity-60">
                      {mastered}/{count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Weapon groups by class */}
            {overLevelClassGroups.length === 0 && (
              <div className="text-xs text-slate-500">
                No weapons in this category.
              </div>
            )}
            {overLevelClassGroups.map(
              ({ label: classLabel, rows: classRows }) => (
                <div key={classLabel} className="mb-4 last:mb-0">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    {classLabel}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {classRows.map((r) => (
                      <button
                        key={String(r.id)}
                        className={[
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          r.isMastered
                            ? "border-cyan-700 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-950/50"
                            : "border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800",
                        ].join(" ")}
                        onClick={() =>
                          setOverLevelMastered(String(r.id), !r.isMastered)
                        }
                        title={
                          r.isMastered
                            ? "Click to mark as not mastered"
                            : "Click to mark as mastered (Rank 40)"
                        }
                      >
                        <span
                          className={[
                            "shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs font-bold",
                            r.isMastered
                              ? "border-cyan-500 bg-cyan-900/60 text-cyan-300"
                              : "border-slate-600 bg-slate-800 text-slate-500",
                          ].join(" ")}
                        >
                          {r.isMastered ? "✓" : ""}
                        </span>
                        <span className="truncate flex-1">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <Section title="Inventory">
        <div className="text-sm text-slate-400">
          Search and edit item counts here. Credits and Platinum are edited in
          the top-right Profile header. Set Personal Goals by entering a Goal
          Target (0 disables).
        </div>

        {
          <>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Search</span>
                  <input
                    className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search items by name..."
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2 justify-end">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Sort by</span>
                  <select
                    className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                  >
                    <option value="az">Name A→Z</option>
                    <option value="za">Name Z→A</option>
                    <option value="count-desc">Count: High→Low</option>
                    <option value="count-asc">Count: Low→High</option>
                    <option value="owned-first">Owned first</option>
                    <option value="unowned-first">Unowned first</option>
                    <option value="mastered-last">Unmastered first</option>
                    <option value="release-newest">Release: Newest first</option>
                    <option value="release-oldest">Release: Oldest first</option>
                    <option value="mr-asc">MR Req: Low → High</option>
                    <option value="mr-desc">MR Req: High → Low</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={hideZero}
                    onChange={(e) => setHideZero(e.target.checked)}
                  />
                  Hide zero
                </label>
              </div>
            </div>

            {/* Additional filters */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 shrink-0">
                  Ownership:
                </span>
                {(["all", "owned", "unowned"] as const).map((f) => (
                  <PillButton
                    key={f}
                    label={
                      f === "all" ? "All" : f === "owned" ? "Owned" : "Unowned"
                    }
                    active={ownershipFilter === f}
                    onClick={() => setOwnershipFilter(f)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 shrink-0">
                  Mastery:
                </span>
                <PillButton
                  label="Mastered"
                  active={ownershipFilter === "mastered"}
                  onClick={() =>
                    setOwnershipFilter(
                      ownershipFilter === "mastered" ? "all" : "mastered",
                    )
                  }
                />
                <PillButton
                  label="Mastery available"
                  active={showMasteryAvailable}
                  onClick={() => setShowMasteryAvailable(!showMasteryAvailable)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PillButton
                  label="Accessible sources"
                  active={showAvailableOnly}
                  onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-400">
                Filtered:{" "}
                <span className="text-slate-200">{finalFiltered.length}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SmallActionButton
                  label="Select all (filtered) → Goal=1"
                  tone="primary"
                  onClick={() => setGoalsForFiltered(1)}
                />
                <SmallActionButton
                  label="Clear (filtered) goals"
                  tone="danger"
                  onClick={() => setGoalsForFiltered(0)}
                />
              </div>
            </div>
          </>
        }

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-2">
            <TabButton
              label="All"
              active={primaryTab === "all"}
              onClick={() => selectPrimaryTab("all")}
            />
            <TabButton
              label="Warframes & Vehicles"
              active={primaryTab === "warframesVehicles"}
              onClick={() => selectPrimaryTab("warframesVehicles")}
            />
            <TabButton
              label="Weapons"
              active={primaryTab === "weapons"}
              onClick={() => selectPrimaryTab("weapons")}
            />
            <TabButton
              label="Companions"
              active={primaryTab === "companions"}
              onClick={() => selectPrimaryTab("companions")}
            />
            <TabButton
              label="Blueprints & Parts"
              active={primaryTab === "components"}
              onClick={() => selectPrimaryTab("components")}
            />
            <TabButton
              label="Resources"
              active={primaryTab === "resources"}
              onClick={() => selectPrimaryTab("resources")}
            />
            <TabButton
              label="Railjack"
              active={primaryTab === "railjack"}
              onClick={() => selectPrimaryTab("railjack")}
            />
          </div>

          {primaryTab === "warframesVehicles" && (
            <div className="px-3 py-3 border-b border-slate-800">
              <div className="text-xs text-slate-400">
                Refine Warframes & Vehicles
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <SubTabButton
                  label="All"
                  active={wfVehTab === "all"}
                  onClick={() => setWfVehTab("all")}
                />
                <SubTabButton
                  label="Warframes"
                  active={wfVehTab === "warframes"}
                  onClick={() => setWfVehTab("warframes")}
                />
                <SubTabButton
                  label="Archwings"
                  active={wfVehTab === "archwings"}
                  onClick={() => setWfVehTab("archwings")}
                />
                <SubTabButton
                  label="Necramechs"
                  active={wfVehTab === "necramechs"}
                  onClick={() => setWfVehTab("necramechs")}
                />
              </div>
            </div>
          )}

          {primaryTab === "companions" && (
            <div className="px-3 py-3 border-b border-slate-800">
              <div className="text-xs text-slate-400">Refine Companions</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <SubTabButton
                  label="All"
                  active={companionsTab === "all"}
                  onClick={() => setCompanionsTab("all")}
                />
                <SubTabButton
                  label="Hound"
                  active={companionsTab === "hound"}
                  onClick={() => setCompanionsTab("hound")}
                />
                <SubTabButton
                  label="Kavat"
                  active={companionsTab === "kavat"}
                  onClick={() => setCompanionsTab("kavat")}
                />
                <SubTabButton
                  label="Kubrow"
                  active={companionsTab === "kubrow"}
                  onClick={() => setCompanionsTab("kubrow")}
                />
                <SubTabButton
                  label="Predasite"
                  active={companionsTab === "predasite"}
                  onClick={() => setCompanionsTab("predasite")}
                />
                <SubTabButton
                  label="Vulpaphyla"
                  active={companionsTab === "vulpaphyla"}
                  onClick={() => setCompanionsTab("vulpaphyla")}
                />
                <SubTabButton
                  label="Moa"
                  active={companionsTab === "moa"}
                  onClick={() => setCompanionsTab("moa")}
                />
                <SubTabButton
                  label="Sentinel"
                  active={companionsTab === "sentinel"}
                  onClick={() => setCompanionsTab("sentinel")}
                />
              </div>
            </div>
          )}

          {primaryTab === "weapons" && (
            <div className="px-3 py-3 border-b border-slate-800">
              <div className="text-xs text-slate-400">Weapon Class</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <SubTabButton
                  label="All"
                  active={weaponClassTab === "all"}
                  onClick={() => selectWeaponClass("all")}
                />
                <SubTabButton
                  label="Primary"
                  active={weaponClassTab === "primary"}
                  onClick={() => selectWeaponClass("primary")}
                />
                <SubTabButton
                  label="Secondary"
                  active={weaponClassTab === "secondary"}
                  onClick={() => selectWeaponClass("secondary")}
                />
                <SubTabButton
                  label="Melee"
                  active={weaponClassTab === "melee"}
                  onClick={() => selectWeaponClass("melee")}
                />
                <SubTabButton
                  label="Companion"
                  active={weaponClassTab === "companion"}
                  onClick={() => selectWeaponClass("companion")}
                />
              </div>

              {weaponClassTab !== "companion" && weaponClassTab !== "all" && (
                <>
                  <div className="mt-3 text-xs text-slate-400">Type</div>
                  {weaponTypeOptions.length === 0 ? (
                    <div className="mt-2 text-sm text-slate-500">
                      No weapon types found for this class.
                    </div>
                  ) : (
                    <>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {weaponTypeOptions.map((t) => {
                          const active = weaponTypeFilters
                            .map(normalize)
                            .includes(t);
                          return (
                            <PillButton
                              key={t}
                              label={titleCase(t)}
                              active={active}
                              onClick={() => {
                                setWeaponTypeFilters((prev) => {
                                  const normPrev = prev.map(normalize);
                                  if (normPrev.includes(t)) {
                                    return prev.filter(
                                      (x) => normalize(x) !== t,
                                    );
                                  }
                                  return [...prev, t];
                                });
                              }}
                            />
                          );
                        })}
                      </div>
                      {weaponTypeFilters.length > 0 && (
                        <div className="mt-2">
                          <button
                            className="text-xs text-slate-300 hover:text-slate-100 underline"
                            onClick={() => setWeaponTypeFilters([])}
                          >
                            Clear type filters
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {weaponTagOptions.length > 0 && (
                <>
                  <div className="mt-3 text-xs text-slate-400">Tags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weaponTagOptions.map((tag) => {
                      const active = weaponTagFilters.includes(tag);
                      return (
                        <PillButton
                          key={tag}
                          label={tag}
                          active={active}
                          onClick={() => {
                            setWeaponTagFilters((prev) =>
                              prev.includes(tag)
                                ? prev.filter((t) => t !== tag)
                                : [...prev, tag],
                            );
                          }}
                        />
                      );
                    })}
                  </div>
                  {weaponTagFilters.length > 0 && (
                    <div className="mt-2">
                      <button
                        className="text-xs text-slate-300 hover:text-slate-100 underline"
                        onClick={() => setWeaponTagFilters([])}
                      >
                        Clear tag filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Virtualized list */}
          <div
            ref={listRef}
            className="max-h-[65vh] overflow-auto"
            onScroll={() => recomputeWindow()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-950/90 border-b border-slate-800">
              <div className="grid grid-cols-[1fr_150px_90px_160px] gap-0 text-sm">
                <div className="px-3 py-2 text-slate-300 font-semibold">
                  Item
                </div>
                <div className="px-3 py-2 text-slate-300 font-semibold">
                  Count
                </div>
                <div className="px-3 py-2 text-slate-300 font-semibold text-center">
                  Mastered
                </div>
                <div className="px-3 py-2 text-slate-300 font-semibold">
                  Goal Target
                </div>
              </div>
            </div>

            {/* Body spacer + window */}
            <div className="relative" style={{ height: totalHeight }}>
              <div
                className="absolute left-0 right-0"
                style={{ transform: `translateY(${translateY}px)` }}
              >
                {slice.map((r) => {
                  const goal = goalByCatalogId.get(String(r.id));
                  const goalTarget = goal ? safeInt(goal.qty ?? 1, 1) : 0;
                  const isSelected = selectedDetailId === r.id;
                  const isOwned = r.value > 0;
                  const isMastered =
                    r.isMasterable &&
                    checkMastered(
                      mastered,
                      overLevelMastered,
                      String(r.id),
                      r.path,
                    );
                  const rowAllE = ALL_BY_UNIQUE[r.path];
                  const isVaulted = rowAllE?.vaulted ?? false;
                  const hasVaultedParts =
                    !isVaulted &&
                    (rowAllE?.components?.some(
                      (comp) =>
                        comp.uniqueName &&
                        ALL_BY_UNIQUE[comp.uniqueName]?.vaulted,
                    ) ??
                      false);

                  return (
                    <div
                      key={String(r.id)}
                      className={[
                        "grid grid-cols-[1fr_150px_90px_160px] border-b border-slate-800/70 items-center",
                        isSelected ? "bg-slate-900/60" : "",
                      ].join(" ")}
                      style={{ height: ROW_H }}
                    >
                      {/* Name + status indicators */}
                      <div className="px-3 py-2 flex items-center gap-2 min-w-0">
                        {/* Ownership/mastery dot */}
                        <span
                          className={[
                            "shrink-0 w-2 h-2 rounded-full",
                            isMastered
                              ? "bg-cyan-400"
                              : isOwned
                                ? "bg-emerald-500"
                                : "bg-slate-700",
                          ].join(" ")}
                          title={
                            isMastered
                              ? "Mastered"
                              : isOwned
                                ? "Owned"
                                : "Not owned"
                          }
                        />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              className={[
                                "text-left truncate text-sm transition-colors hover:text-cyan-300 min-w-0",
                                isMastered
                                  ? "text-cyan-400/80"
                                  : isOwned
                                    ? "text-slate-100"
                                    : "text-slate-400",
                              ].join(" ")}
                              onClick={() =>
                                setSelectedDetailId(isSelected ? null : r.id)
                              }
                              title="Click for details"
                            >
                              {r.label}
                            </button>
                            {isVaulted && (
                              <span
                                className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-rose-700/50 bg-rose-950/40 text-rose-400 font-semibold"
                                title="This prime item is vaulted — obtain via trading or Prime Resurgence (Varzia)"
                              >
                                VAULTED
                              </span>
                            )}
                            {hasVaultedParts && (
                              <span
                                className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-orange-700/50 bg-orange-950/40 text-orange-400 font-semibold"
                                title="This item requires vaulted components to build"
                              >
                                VAULTED PARTS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Count with +/- buttons */}
                      <div className="px-2 py-2 flex items-center gap-1">
                        <button
                          className="shrink-0 w-7 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-base font-bold leading-none flex items-center justify-center"
                          onClick={() =>
                            setCount(String(r.id), Math.max(0, r.value - 1))
                          }
                          tabIndex={-1}
                        >
                          −
                        </button>
                        <input
                          className="w-14 text-center rounded-lg bg-slate-900 border border-slate-700 py-1.5 text-slate-100 text-sm"
                          type="number"
                          min={0}
                          value={r.value}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            setCount(String(r.id), Number.isFinite(n) ? n : 0);
                          }}
                        />
                        <button
                          className="shrink-0 w-7 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-base font-bold leading-none flex items-center justify-center"
                          onClick={() => setCount(String(r.id), r.value + 1)}
                          tabIndex={-1}
                        >
                          +
                        </button>
                      </div>

                      {/* Mastered toggle — only for masterable items */}
                      <div className="px-2 py-2 flex items-center justify-center">
                        {r.isMasterable && (
                          <button
                            title={
                              isMastered
                                ? "Marked as mastered — click to unmark"
                                : "Click to mark as mastered"
                            }
                            className={[
                              "w-8 h-8 rounded-full text-sm font-bold transition-colors flex items-center justify-center",
                              isMastered
                                ? "bg-cyan-900/60 text-cyan-300 border border-cyan-700 hover:bg-cyan-900"
                                : "bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700 hover:text-slate-300",
                            ].join(" ")}
                            onClick={() => {
                              // Plexus uses overLevelMastered; all others use setMastered
                              if (
                                r.path ===
                                "/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness"
                              ) {
                                setOverLevelMastered(String(r.id), !isMastered);
                              } else {
                                setMastered(String(r.id), !isMastered);
                              }
                            }}
                          >
                            {isMastered ? "✓" : "M"}
                          </button>
                        )}
                      </div>

                      {/* Goal target */}
                      <div className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            className={[
                              "w-full rounded-lg border px-2 py-1.5 text-slate-100 text-sm",
                              goal
                                ? "bg-slate-900 border-slate-700"
                                : "bg-slate-950/40 border-slate-800 text-slate-400",
                            ].join(" ")}
                            type="number"
                            min={0}
                            value={goalTarget}
                            onChange={(e) => {
                              const next = safeInt(e.target.value, 0);
                              if (next <= 0) {
                                if (goal) removeGoal(goal.id);
                                return;
                              }
                              if (!goal) {
                                addGoalItem(String(r.id), next);
                                return;
                              }
                              setGoalQty(goal.id, next);
                            }}
                          />
                          <div
                            className={[
                              "text-xs whitespace-nowrap",
                              goal ? "text-emerald-400" : "text-slate-600",
                            ].join(" ")}
                          >
                            {goal ? "On" : "Off"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {finalFiltered.length === 0 && (
              <div className="px-3 py-3 text-sm text-slate-400">
                No matches.
              </div>
            )}
          </div>
        </div>
      </Section>

      {selectedDetailId &&
        (() => {
          const rec: any = FULL_CATALOG.recordsById[selectedDetailId];
          const name = rec?.displayName ?? String(selectedDetailId);
          const uniqueName = String(selectedDetailId).replace(/^[^:]+:/, "");
          const allE = getAllEntry(uniqueName, name);

          const acq = getAcquisitionByCatalogId(selectedDetailId);
          const sources: string[] = Array.isArray(acq?.sources)
            ? (acq.sources as string[])
            : [];
          const recipe = getItemRequirements(selectedDetailId) ?? [];
          const avail = determineItemAvailability(
            selectedDetailId,
            completedPrereqs,
            masteryRank,
          );
          const blockingReasons =
            avail !== "available"
              ? getBlockingReasons(
                  selectedDetailId,
                  completedPrereqs,
                  masteryRank,
                )
              : [];
          const isOwned = safeInt(counts[String(selectedDetailId)] ?? 0, 0) > 0;
          const isMastered = mastered[String(selectedDetailId)] === true;
          const availColor =
            avail === "available"
              ? "text-emerald-400"
              : avail === "partial"
                ? "text-amber-400"
                : "text-rose-400";
          const availLabel =
            avail === "available"
              ? "Available"
              : avail === "partial"
                ? "Partial Access"
                : "Blocked";

          const cat = allE?.category ?? "";
          const isWeapon = [
            "Primary",
            "Secondary",
            "Melee",
            "Arch-Gun",
            "Arch-Melee",
          ].includes(cat);
          const isFrame = cat === "Warframes" || cat === "Archwing";
          const isCompanion = cat === "Sentinels" || cat === "Pets";

          // Collect all drops — item-level + component-level
          const allDrops: Array<{
            source: string;
            drops: AllItemEntry["drops"];
          }> = [];
          if (allE?.drops && allE.drops.length > 0)
            allDrops.push({ source: name, drops: allE.drops });
          if (allE?.components) {
            for (const comp of allE.components) {
              if (comp.drops && comp.drops.length > 0) {
                allDrops.push({ source: comp.name, drops: comp.drops });
              }
            }
          }

          // Damage breakdown — non-zero damage types only
          const dmgTypes = allE?.damage
            ? Object.entries(allE.damage)
                .filter(
                  ([k, v]) =>
                    v > 0 &&
                    ![
                      "total",
                      "shieldDrain",
                      "healthDrain",
                      "energyDrain",
                      "cinematic",
                      "true",
                      "void",
                      "tau",
                    ].includes(k),
                )
                .sort(([, a], [, b]) => b - a)
            : [];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedDetailId(null)} />
              <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
                {/* Modal header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-semibold text-slate-100 truncate">{name}</span>
                    <WikiLink name={name} />
                  </div>
                  <button
                    className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    onClick={() => setSelectedDetailId(null)}
                  >Close</button>
                </div>
                {/* Modal body */}
                <div className="overflow-y-auto flex-1 p-5">
              {/* ── Header row ── */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {allE?.isPrime && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-600/50 bg-amber-950/30 text-amber-300 font-semibold">
                        PRIME
                      </span>
                    )}
                    {allE?.vaulted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-rose-700/50 bg-rose-950/30 text-rose-300 font-semibold">
                        VAULTED
                      </span>
                    )}
                    {allE?.tradable && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-400">
                        Tradable
                      </span>
                    )}
                    {isOwned && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-700 bg-emerald-950/30 text-emerald-300">
                        Owned
                      </span>
                    )}
                    {isMastered && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-700 bg-cyan-950/30 text-cyan-300">
                        Mastered
                      </span>
                    )}
                    <span
                      className={["text-xs font-semibold", availColor].join(
                        " ",
                      )}
                    >
                      {availLabel}
                    </span>
                  </div>
                  {allE?.description && (
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {renderDesc(allE.description, allE.required !== undefined ? { COUNT: allE.required } : undefined)}
                    </p>
                  )}
                  {allE?.passiveDescription && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Passive: {renderDesc(allE.passiveDescription)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── LEFT COLUMN ── */}
                <div className="space-y-4">
                  {/* Mastery / release / type */}
                  <div className="grid grid-cols-2 gap-2">
                    {(allE?.masteryReq ?? 0) > 0 && (
                      <StatBox
                        label="Mastery Required"
                        value={`MR ${allE!.masteryReq}`}
                      />
                    )}
                    {allE?.type && <StatBox label="Type" value={allE.type} />}
                    {allE?.releaseDate && (
                      <StatBox label="Released" value={formatReleaseDate(allE.releaseDate) ?? allE.releaseDate} />
                    )}
                    {allE?.introduced?.name && (
                      <StatBox
                        label="Introduced"
                        value={allE.introduced.name}
                      />
                    )}
                    {allE?.vaultDate && (
                      <StatBox
                        label="Vaulted"
                        value={allE.vaultDate}
                        color="text-rose-300"
                      />
                    )}
                    {isWeapon && allE?.slot !== undefined && (
                      <StatBox
                        label="Slot"
                        value={
                          allE.slot === 0
                            ? "Primary"
                            : allE.slot === 1
                              ? "Secondary"
                              : allE.slot === 2
                                ? "Melee"
                                : String(allE.slot)
                        }
                      />
                    )}
                  </div>

                  {/* Warframe stats */}
                  {(isFrame || isCompanion) && (
                    <div>
                      <Label>Base Stats</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {allE?.health && (
                          <StatBox label="Health" value={allE.health} />
                        )}
                        {allE?.shield && (
                          <StatBox label="Shield" value={allE.shield} />
                        )}
                        {allE?.armor && (
                          <StatBox label="Armor" value={allE.armor} />
                        )}
                        {allE?.power && (
                          <StatBox label="Energy" value={allE.power} />
                        )}
                        {allE?.sprintSpeed && (
                          <StatBox
                            label="Sprint"
                            value={allE.sprintSpeed.toFixed(2)}
                          />
                        )}
                        {allE?.stamina && (
                          <StatBox label="Stamina" value={allE.stamina} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Abilities */}
                  {isFrame && allE?.abilities && allE.abilities.length > 0 && (
                    <div>
                      <Label>Abilities</Label>
                      <div className="space-y-1.5">
                        {allE.abilities.map((ab, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] text-slate-600 font-mono">
                                {i + 1}
                              </span>
                              <span className="text-xs font-semibold text-slate-200">
                                {ab.name}
                              </span>
                              <WikiLink name={ab.name} />
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {renderDesc(ab.description)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Polarities */}
                  {(isFrame || isCompanion) &&
                    allE?.polarities &&
                    allE.polarities.length > 0 && (
                      <div>
                        <Label>Polarities</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {allE.polarities.map((p, i) => (
                            <span
                              key={i}
                              className="text-xs rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-300"
                            >
                              {POLARITY_LABELS[p] ?? p}
                            </span>
                          ))}
                          {allE.aura && (
                            <span className="text-xs rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-300">
                              Aura: {POLARITY_LABELS[allE.aura] ?? allE.aura}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Weapon stats */}
                  {isWeapon && (
                    <div>
                      <Label>Stats</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {allE?.totalDamage && (
                          <StatBox
                            label="Total Damage"
                            value={allE.totalDamage}
                            color="text-orange-300"
                          />
                        )}
                        {allE?.criticalChance !== undefined && (
                          <StatBox
                            label="Crit Chance"
                            value={fmtPct(allE.criticalChance)}
                            color="text-yellow-300"
                          />
                        )}
                        {allE?.criticalMultiplier !== undefined && (
                          <StatBox
                            label="Crit Multiplier"
                            value={fmtMult(allE.criticalMultiplier)}
                            color="text-yellow-300"
                          />
                        )}
                        {allE?.procChance !== undefined && (
                          <StatBox
                            label="Status Chance"
                            value={fmtPct(allE.procChance)}
                          />
                        )}
                        {allE?.fireRate !== undefined && (
                          <StatBox
                            label={
                              cat === "Melee" ? "Attack Speed" : "Fire Rate"
                            }
                            value={allE.fireRate.toFixed(2)}
                          />
                        )}
                        {allE?.magazineSize && (
                          <StatBox label="Magazine" value={allE.magazineSize} />
                        )}
                        {allE?.reloadTime !== undefined && (
                          <StatBox
                            label="Reload"
                            value={`${allE.reloadTime.toFixed(1)}s`}
                          />
                        )}
                        {allE?.accuracy && (
                          <StatBox
                            label="Accuracy"
                            value={allE.accuracy.toFixed(1)}
                          />
                        )}
                        {allE?.multishot && allE.multishot > 1 && (
                          <StatBox label="Multishot" value={allE.multishot} />
                        )}
                        {allE?.noise && (
                          <StatBox label="Noise" value={allE.noise} />
                        )}
                        {allE?.trigger && (
                          <StatBox label="Trigger" value={allE.trigger} />
                        )}
                        {/* Melee specific */}
                        {allE?.range && (
                          <StatBox
                            label="Range"
                            value={`${allE.range.toFixed(1)}m`}
                          />
                        )}
                        {allE?.followThrough !== undefined && (
                          <StatBox
                            label="Follow Through"
                            value={fmtPct(allE.followThrough)}
                          />
                        )}
                        {allE?.comboDuration && (
                          <StatBox
                            label="Combo Duration"
                            value={`${allE.comboDuration}s`}
                          />
                        )}
                        {allE?.heavyAttackDamage && (
                          <StatBox
                            label="Heavy Attack"
                            value={allE.heavyAttackDamage}
                          />
                        )}
                        {allE?.slamAttack && (
                          <StatBox
                            label="Slam Attack"
                            value={allE.slamAttack}
                          />
                        )}
                        {allE?.slideAttack && (
                          <StatBox
                            label="Slide Attack"
                            value={allE.slideAttack}
                          />
                        )}
                        {allE?.stancePolarity && (
                          <StatBox
                            label="Stance Polarity"
                            value={
                              POLARITY_LABELS[allE.stancePolarity] ??
                              allE.stancePolarity
                            }
                          />
                        )}
                        {/* Riven disposition */}
                        {allE?.disposition !== undefined && (
                          <StatBox
                            label="Riven Disposition"
                            value={
                              DISPOSITION_DOTS[allE.disposition] ??
                              String(allE.disposition)
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Damage breakdown */}
                  {dmgTypes.length > 0 && (
                    <div>
                      <Label>Damage Breakdown</Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {dmgTypes.map(([type, val]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/40 px-2 py-1"
                          >
                            <span className="text-[11px] text-slate-400 capitalize">
                              {type}
                            </span>
                            <span className="text-[11px] font-mono text-slate-200">
                              {val.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blocking reasons */}
                  {blockingReasons.length > 0 && (
                    <div>
                      <Label color="text-rose-400">Prerequisites Needed</Label>
                      <ul className="space-y-1">
                        {blockingReasons.map((r, i) => (
                          <li
                            key={i}
                            className="text-xs text-rose-300 flex items-start gap-1"
                          >
                            <span className="mt-0.5 shrink-0">—</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="space-y-4">
                  {/* Build info */}
                  {(allE?.buildPrice || allE?.buildTime || allE?.bpCost) && (
                    <div>
                      <Label>Build Requirements</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {allE.buildPrice && (
                          <StatBox
                            label="Credits"
                            value={allE.buildPrice.toLocaleString()}
                          />
                        )}
                        {allE.bpCost && allE.bpCost !== allE.buildPrice && (
                          <StatBox
                            label="Blueprint"
                            value={`${allE.bpCost.toLocaleString()} cr`}
                          />
                        )}
                        {allE.buildTime && (
                          <StatBox
                            label="Build Time"
                            value={fmtBuildTime(allE.buildTime)}
                          />
                        )}
                        {allE.buildQuantity && allE.buildQuantity > 1 && (
                          <StatBox
                            label="Quantity"
                            value={`×${allE.buildQuantity}`}
                          />
                        )}
                        {allE.consumeOnBuild !== undefined && (
                          <StatBox
                            label="Consumes BP"
                            value={allE.consumeOnBuild ? "Yes" : "No"}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Components with their drops */}
                  {allE?.components && allE.components.length > 0 && (
                    <div>
                      <Label>Components</Label>
                      <div className="space-y-1.5">
                        {allE.components.map((comp, i) => {
                          const hasDrops = comp.drops && comp.drops.length > 0;
                          return (
                            <div
                              key={i}
                              className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-200">
                                  {comp.name}
                                </span>
                                {comp.itemCount && comp.itemCount > 1 && (
                                  <span className="text-[10px] text-slate-500">
                                    ×{comp.itemCount}
                                  </span>
                                )}
                                {/* Item-specific parts (/Recipes/) → parent item #Acquisition
                                    Generic resources (/MiscItems/ etc.) → their own wiki page */}
                                {comp.uniqueName && /\/Recipes\//.test(comp.uniqueName) ? (
                                  <a href={wikiUrl(name) + "#Acquisition"} target="_blank" rel="noopener noreferrer"
                                    title={`Find ${comp.name} on the ${name} wiki page`}
                                    className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                  </a>
                                ) : (
                                  <WikiLink name={comp.name} />
                                )}
                                {!hasDrops && (
                                  <a
                                    href={comp.uniqueName && /\/Recipes\//.test(comp.uniqueName)
                                      ? wikiUrl(name) + "#Acquisition"
                                      : wikiUrl(comp.name) + "#Acquisition"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto text-[10px] text-slate-600 hover:text-slate-300 transition-colors"
                                  >
                                    Where to farm ↗
                                  </a>
                                )}
                              </div>
                              {hasDrops && (
                                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                                  {[...comp.drops!]
                                    .sort((a,b) => {
                                      const aS = classifyDropInv(a.location) === "syndicate";
                                      const bS = classifyDropInv(b.location) === "syndicate";
                                      if (aS !== bS) return aS ? -1 : 1;
                                      return b.chance - a.chance;
                                    })
                                    .slice(0, 8)
                                    .map((d, j) => <InvDropRow key={j} d={d} small />)}
                                  {comp.drops!.length > 8 && (
                                    <div className="text-[10px] text-slate-600">
                                      +{comp.drops!.length - 8} more locations
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Direct item drops (non-prime, resources, relics, gear) */}
                  {allE?.drops &&
                    allE.drops.length > 0 &&
                    (!allE.components || allE.components.length === 0) && (
                      <div>
                        <Label>Acquisition</Label>
                        <div className="space-y-0.5 max-h-48 overflow-y-auto">
                          {[...allE.drops]
                            .sort((a,b) => {
                              const aS = classifyDropInv(a.location) === "syndicate";
                              const bS = classifyDropInv(b.location) === "syndicate";
                              if (aS !== bS) return aS ? -1 : 1;
                              return b.chance - a.chance;
                            })
                            .slice(0, 20)
                            .map((d, i) => <InvDropRow key={i} d={d} />)}
                          {allE.drops.length > 20 && (
                            <div className="text-xs text-slate-600 px-2">
                              +{allE.drops.length - 20} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* No drop data */}
                  {(!allE?.drops || allE.drops.length === 0) &&
                    (!allE?.components ||
                      allE.components.every(
                        (c) => !c.drops || c.drops.length === 0,
                      )) && (
                      <div>
                        <Label>Drop Locations</Label>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          No drop data available.
                          <a
                            href={wikiUrl(name) + "#Acquisition"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-600 hover:text-slate-300 transition-colors flex items-center gap-1"
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
                            Wiki
                          </a>
                        </div>
                      </div>
                    )}

                  {/* Acquisition sources from catalog */}
                  {sources.length > 0 && (
                    <div>
                      <Label>Acquisition ({sources.length})</Label>
                      <ul className="space-y-0.5 max-h-32 overflow-auto">
                        {sources.slice(0, 15).map((s) => (
                          <li key={s} className="text-xs text-slate-300">
                            {SOURCE_INDEX[s as any]?.label ?? s
                                .replace(/^(?:data|src):/, "")
                                .replace(/\//g, " › ")
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </li>
                        ))}
                        {sources.length > 15 && (
                          <li className="text-xs text-slate-500">
                            +{sources.length - 15} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Recipe / crafting components from catalog */}
                  {recipe.length > 0 && (
                    <div>
                      <Label>Crafting Recipe</Label>
                      <ul className="space-y-0.5">
                        {recipe.map((comp) => {
                          const compRec: any =
                            FULL_CATALOG.recordsById[comp.catalogId];
                          const compName =
                            compRec?.displayName ?? String(comp.catalogId);
                          return (
                            <li
                              key={String(comp.catalogId)}
                              className="flex items-center gap-1.5 text-xs text-slate-300"
                            >
                              <span className="text-slate-500 font-mono">
                                ×{comp.count}
                              </span>
                              <span>{compName}</span>
                              <WikiLink name={compName} />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}