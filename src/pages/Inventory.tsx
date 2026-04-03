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
import ALL_RAW from "../data/_generated/warframe-items-all-lean.auto.json";
import missionRewardsJson from "../../external/warframe-drop-data/raw/missionRewards.json";
import { getRelicByKey } from "../domain/catalog/relicCatalog";
import { getPrimeAvailabilityStatus, getRelicAvailabilityStatus } from "../domain/catalog/vaultedItems";
import { useWorldStateData } from "../lib/useWorldStateData";
import { WorkspaceAction, WorkspaceFilterGroup, WorkspacePillButton, WorkspaceSection, WorkspaceSegmentedButton } from "../components/workspace/WorkspaceChrome";
import {
  COLLECTION_LEDGER_SHELL_CLASS,
  CollectionChipRail,
  CollectionModeBand,
  CollectionModeButton,
  CollectionRefineBand,
  CollectionRefineGroup,
  CollectionResultsBand,
  CollectionUtilityBand,
  CollectionUtilityPanel,
} from "../components/collection/CollectionLedgerShell";
import { getAllWikiBlueprintReferencedCatalogIds } from "../catalog/items/wikiBlueprintRequirements";

const _statusImgs = import.meta.glob<string>("../assets/statuses/*.png", { eager: true, import: "default" });
const STATUS_IMG_INV: Record<string, string> = {};
for (const [p, url] of Object.entries(_statusImgs)) {
  const name = p.split("/").pop()!.replace(".png", "").toLowerCase();
  STATUS_IMG_INV[name] = url;
}

// ── Steel Path drop annotation ────────────────────────────────────────────────
// Builds a lookup: (planet/baseNode/rotation, roundedChance) → true
// when that chance value comes from an (Extra) / Steel Path node in missionRewards.json.
// Used to annotate warframe-items drop location strings that cannot distinguish
// Normal vs Steel Path on their own.
const STEEL_PATH_DROP_CHANCES: Map<string, Set<number>> = (() => {
  const out = new Map<string, Set<number>>();
  const root: any = (missionRewardsJson as any)?.missionRewards ?? missionRewardsJson;
  if (!root || typeof root !== "object") return out;

  for (const [planetName, planetObj] of Object.entries(root as Record<string, any>)) {
    if (!planetObj || typeof planetObj !== "object") continue;
    for (const [nodeName, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
      if (!/\(Extra\)\s*$/i.test(String(nodeName))) continue; // only Steel Path nodes
      const rewards = (nodeObj as any)?.rewards;
      if (!rewards || typeof rewards !== "object") continue;

      // Strip "(Extra)" to get the base node name for matching against location strings.
      const baseNode = String(nodeName).replace(/\s*\(Extra\)\s*$/i, "").trim().toLowerCase();
      const planet = String(planetName).toLowerCase();

      for (const [rotLetter, entries] of Object.entries(rewards as Record<string, any>)) {
        if (!Array.isArray(entries)) continue;
        const rotation = String(rotLetter).toLowerCase();
        const key = `${planet}/${baseNode}/${rotation}`;
        for (const entry of entries) {
          const chance = typeof (entry as any).chance === "number" ? (entry as any).chance : 0;
          if (chance <= 0) continue;
          // missionRewards chance is in %, multiply by 100 to get same scale as Math.round(wfChance * 10000)
          const rounded = Math.round(chance * 100);
          if (!out.has(key)) out.set(key, new Set());
          out.get(key)!.add(rounded);
        }
      }
    }
  }
  return out;
})();

/** Returns true when a warframe-items drop entry corresponds to a Steel Path node. */
function isSteelPathDrop(drop: { location: string; chance: number }): boolean {
  const loc = String(drop.location ?? "");
  // Parse "Planet/Base Node (GameMode), Rotation X" → just take up to the first "("
  const beforeParen = loc.split("(")[0].trim();
  const parts = beforeParen.split("/").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (parts.length < 2) return false;

  const planet = parts[0];
  const node = parts.slice(1).join("/");

  const rotMatch = loc.match(/\bRotation\s+([ABC])\b/i);
  if (!rotMatch) return false;
  const rotation = rotMatch[1].toLowerCase();

  const key = `${planet}/${node}/${rotation}`;
  const roundedChance = Math.round(drop.chance * 10000);
  return STEEL_PATH_DROP_CHANCES.get(key)?.has(roundedChance) ?? false;
}

function isStarChartCollectionSource(sourceId: string): boolean {
  return (
    sourceId.startsWith("data:drop:node:") ||
    sourceId.startsWith("data:missionreward/") ||
    sourceId.startsWith("data:cache:")
  );
}

type SortKey =
  | "az"
  | "za"
  | "type-asc"
  | "type-desc"
  | "count-desc"
  | "count-asc"
  | "owned-first"
  | "unowned-first"
  | "mastered-last"
  | "release-newest"
  | "release-oldest"
  | "mr-asc"
  | "mr-desc";

type InventoryColumnKey =
  | "item"
  | "type"
  | "release"
  | "mr"
  | "available"
  | "count"
  | "mastered"
  | "goal";

const INVENTORY_COLUMN_STORAGE_KEY = "tnh.inventory.visibleColumns";
const DEFAULT_INVENTORY_COLUMNS: InventoryColumnKey[] = [
  "item",
  "type",
  "release",
  "mr",
  "available",
  "count",
  "mastered",
  "goal",
];

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
type TagFilterState = "include" | "exclude";

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

function prettifyPathTail(path: string): string {
  const tail = String(path ?? "").split("/").filter(Boolean).pop() ?? "";
  if (!tail) return "";
  return tail
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

function getInventoryItemTypeLabel(args: {
  rawType: string;
  cls: Classification;
  label: string;
  path: string;
}): string {
  const rawType = String(args.rawType ?? "").trim();
  const label = String(args.label ?? "").trim();
  const path = String(args.path ?? "").trim();

  if (rawType && !rawType.startsWith("/Lotus/")) {
    return rawType;
  }

  if (label.toLowerCase().endsWith(" blueprint")) return "Blueprint";

  if (args.cls.groups.has("components")) {
    if (path.includes("/Weapons/WeaponParts/")) return "Weapon Part";
    if (path.includes("/WarframeRecipes/")) return "Warframe Part";
    if (path.includes("/MoaPetParts/")) return "Moa Part";
    if (path.includes("/CreaturePetParts/")) return "Pet Part";
    if (path.includes("/SentinelParts/")) return "Sentinel Part";
    if (path.includes("/Recipes/")) return "Component";
    return "Part";
  }

  if (args.cls.groups.has("resources")) return "Resource";
  if (args.cls.groups.has("railjack")) return "Railjack";

  if (args.cls.groups.has("companions")) {
    if (args.cls.companionsSub.has("hound")) return "Hound";
    if (args.cls.companionsSub.has("kavat")) return "Kavat";
    if (args.cls.companionsSub.has("kubrow")) return "Kubrow";
    if (args.cls.companionsSub.has("moa")) return "Moa";
    if (args.cls.companionsSub.has("predasite")) return "Predasite";
    if (args.cls.companionsSub.has("sentinel")) return "Sentinel";
    if (args.cls.companionsSub.has("vulpaphyla")) return "Vulpaphyla";
    return "Companion";
  }

  if (args.cls.groups.has("warframesVehicles")) {
    if (args.cls.warframesVehiclesSub.has("archwings")) return "Archwing";
    if (args.cls.warframesVehiclesSub.has("necramechs")) return "Necramech";
    if (args.cls.warframesVehiclesSub.has("warframes")) return "Warframe";
  }

  const firstWeaponClass = (["primary", "secondary", "melee", "companion"] as const).find((wc) =>
    args.cls.weaponClasses.has(wc),
  );
  if (firstWeaponClass) {
    const firstWeaponType = Array.from(args.cls.weaponTypesByClass[firstWeaponClass] ?? [])[0];
    if (firstWeaponType) return titleCase(firstWeaponType);
    return titleCase(firstWeaponClass);
  }

  return prettifyPathTail(path) || "Item";
}

function cycleTagFilterState(current?: TagFilterState): TagFilterState | undefined {
  if (current === "include") return "exclude";
  if (current === "exclude") return undefined;
  return "include";
}

function splitTagFilterState<T extends string>(filters: Partial<Record<T, TagFilterState>>) {
  const included: T[] = [];
  const excluded: T[] = [];
  for (const [key, value] of Object.entries(filters) as Array<[T, TagFilterState]>) {
    if (value === "include") included.push(key);
    if (value === "exclude") excluded.push(key);
  }
  return { included, excluded };
}

function loadVisibleInventoryColumns(): InventoryColumnKey[] {
  if (typeof window === "undefined") return DEFAULT_INVENTORY_COLUMNS;
  try {
    const raw = window.localStorage.getItem(INVENTORY_COLUMN_STORAGE_KEY);
    if (!raw) return DEFAULT_INVENTORY_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_INVENTORY_COLUMNS;
    const valid = parsed.filter((value): value is InventoryColumnKey =>
      DEFAULT_INVENTORY_COLUMNS.includes(value as InventoryColumnKey),
    );
    if (!valid.includes("item")) valid.unshift("item");
    return valid.length > 0 ? valid : DEFAULT_INVENTORY_COLUMNS;
  } catch {
    return DEFAULT_INVENTORY_COLUMNS;
  }
}

function resolveRecordPath(rec: any): string {
  return String(
    rec?.path ??
      rec?.raw?.rawLotus?.uniqueName ??
      rec?.raw?.rawWfcd?.uniqueName ??
      "",
  );
}

function isModularAssemblyPartCatalogId(id: CatalogId): boolean {
  const rec: any = FULL_CATALOG.recordsById[id];
  if (!rec) return false;

  const path = resolveRecordPath(rec);
  if (!path) return false;

  return (
    path.includes("/Weapons/Ostron/Melee/ModularMelee") ||
    path.includes("/Weapons/Sentients/OperatorAmplifiers/") ||
    path.includes("/Weapons/SolarisUnited/Primary/SUModularPrimary") ||
    path.includes("/Weapons/SolarisUnited/Secondary/SUModularSecondary") ||
    path.includes("/Types/Friendly/Pets/MoaPets/MoaPetParts/") ||
    path.includes("/Types/Friendly/Pets/CreaturePets/CreaturePetParts/")
  );
}

function isModularMasteryDriverPath(path: string): boolean {
  return (
    path.includes("/Types/Friendly/Pets/MoaPets/MoaPetParts/MoaPetHead") ||
    path.includes("/Weapons/Ostron/Melee/ModularMelee/") ||
    path.includes("/Weapons/Sentients/OperatorAmplifiers/") ||
    path.includes("/Weapons/SolarisUnited/Primary/SUModularPrimary") ||
    path.includes("/Weapons/SolarisUnited/Secondary/SUModularSecondary")
  );
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

function InvDropRow({ d, small = false, worldState = null, steelPath = false }: {
  d: { chance: number; location: string; rarity: string; type?: string };
  small?: boolean;
  worldState?: import("../lib/worldStateCache").WorldStateData | null;
  steelPath?: boolean;
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
    const availability = relic
      ? getRelicAvailabilityStatus(relic.key, relic.isActive, worldState)
      : "available";
    const quality = d.location.match(/\(([^)]+)\)$/)?.[1];
    const farmUrl = `https://wiki.warframe.com/w/${encodeURIComponent(baseName.replace(/\s+/g, "_"))}`;
    return (
      <div className={[
        "flex items-center gap-1.5 rounded px-2 py-1 border",
        availability === "vaulted"
          ? "bg-red-950/10 border-red-900/40"
          : availability === "prime_resurgence"
            ? "bg-violet-950/10 border-violet-900/40"
            : "bg-slate-900/40 border-slate-800/50",
        sz,
      ].join(" ")}>
        <a href={farmUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 truncate text-slate-300 hover:text-cyan-300 hover:underline transition-colors">{baseName}</a>
        {quality && <span className="shrink-0 text-slate-500">{quality}</span>}
        {availability === "vaulted" && (
          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded border border-red-700/50 bg-red-950/40 text-red-400"
            title="This relic is vaulted — obtain via trading or Prime Resurgence (Varzia)">
            Vaulted
          </span>
        )}
        {availability === "prime_resurgence" && (
          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded border border-violet-700/50 bg-violet-950/40 text-violet-300"
            title="This relic is currently available from Varzia's Prime Resurgence stock">
            Prime Resurgence
          </span>
        )}
        <span className={["font-semibold shrink-0", rarityClass].join(" ")}>{d.rarity}</span>
        <span className="font-mono text-slate-500 shrink-0">{(d.chance * 100).toFixed(2)}%</span>
        <a href={farmUrl} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors">{wikiIconSvg}</a>
      </div>
    );
  }

  // Extract ", Rotation X" suffix so it can be shown as a compact badge instead of
  // being buried in the truncated location string.
  const rotMatch = d.location.match(/,\s*Rotation\s+([ABC])\s*$/i);
  const rotLabel = rotMatch ? rotMatch[1].toUpperCase() : null;
  const locationText = rotMatch ? d.location.slice(0, d.location.length - rotMatch[0].length).trim() : d.location;

  return (
    <div className={["flex items-center gap-1.5 rounded px-2 py-1 bg-slate-900/40 border border-slate-800/50", sz].join(" ")}>
      <span className="flex-1 truncate text-slate-300">{locationText}</span>
      {rotLabel && (
        <span className="rounded px-1 py-px bg-slate-700 text-slate-300 font-mono font-bold shrink-0">{rotLabel}</span>
      )}
      {steelPath && (
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded border border-yellow-700/50 bg-yellow-950/40 text-yellow-400"
          title="This drop rate is from the Steel Path difficulty variant of this mission">
          Steel Path
        </span>
      )}
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

function Section(props: { title: string; children: ReactNode; className?: string; bodyClassName?: string }) {
  return <WorkspaceSection title={props.title} className={props.className} bodyClassName={props.bodyClassName}>{props.children}</WorkspaceSection>;
}

function TabButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <CollectionModeButton active={props.active} onClick={props.onClick}>
      {props.label}
    </CollectionModeButton>
  );
}

function SubTabButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return <WorkspaceSegmentedButton active={props.active} onClick={props.onClick} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm">{props.label}</WorkspaceSegmentedButton>;
}

function PillButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return <WorkspacePillButton label={props.label} active={props.active} onClick={props.onClick} />;
}

function FilterTagButton(props: {
  label: ReactNode;
  state?: TagFilterState;
  onClick: () => void;
  title?: string;
}) {
  const state = props.state;
  return (
    <button
      title={props.title}
      className={[
        "rounded-full px-3 py-1.5 text-sm border transition-colors",
        state === "include"
          ? "bg-slate-100 text-slate-900 border-slate-100"
          : state === "exclude"
            ? "bg-rose-950/30 text-rose-200 border-rose-800/70"
            : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900",
      ].join(" ")}
      onClick={props.onClick}
    >
      <span className={state === "exclude" ? "line-through decoration-rose-300/70" : undefined}>
        {props.label}
      </span>
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
    if ((m.main === "pet" || m.main === "pets") && m.sub) {
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
  const pathLower = normalize(String(rec?.path ?? catalogId));

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
    pathLower.includes("/railjackmiscitems/") ||
    pathLower.includes("/crewship/railjack/") ||
    pathLower.includes("/railjackresourcerecipes/")
  ) {
    cls.groups.add("railjack");
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
function isMasterableItem(cls: Classification, path?: string): boolean {
  if (path && isModularAssemblyPartCatalogId(`items:${path}` as CatalogId)) {
    return isModularMasteryDriverPath(path);
  }
  return (
    cls.groups.has("warframesVehicles") ||
    cls.groups.has("weapons") ||
    cls.groups.has("companions")
  );
}

function inventorySearchAliases(row: Pick<Row, "label" | "cls">): string[] {
  const aliases: string[] = [];

  if (row.cls.isComponent && !/\sblueprint$/i.test(row.label)) {
    aliases.push(`${row.label} Blueprint`);
  }

  return aliases;
}

function inventoryRowDuplicatePenalty(row: Pick<Row, "path" | "label">): number {
  const path = row.path.toLowerCase();
  let penalty = 0;

  if (path.includes("pvpvariant")) penalty += 1000;
  if (path.includes("/storeitems/")) penalty += 700;
  if (path.includes("starterpack")) penalty += 500;
  if (path.includes("tutorial")) penalty += 500;
  if (path.includes("junctionreward")) penalty += 500;
  if (path.includes("rewarditem")) penalty += 450;
  if (path.includes("bundle")) penalty += 400;
  if (path.includes("consumable")) penalty += 300;
  if (path.includes("wounded")) penalty += 300;
  if (path.includes("/base")) penalty += 250;
  if (path.includes("free")) penalty += 150;
  if (path.includes("fixed")) penalty += 150;

  return penalty;
}

function preferInventoryRow(a: Row, b: Row): Row {
  const penaltyA = inventoryRowDuplicatePenalty(a);
  const penaltyB = inventoryRowDuplicatePenalty(b);
  if (penaltyA !== penaltyB) return penaltyA < penaltyB ? a : b;
  if (a.path.length !== b.path.length) return a.path.length < b.path.length ? a : b;
  return String(a.id).localeCompare(String(b.id)) <= 0 ? a : b;
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
  isOverLevel: boolean; // true for Kuva/Tenet/Coda/Paracesis weapons
  itemType: string;
  releaseDate?: string;
  masteryReq: number;
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
type AccessFilter = "all" | "available" | "partial" | "blocked";
type MrColumnFilterMode = "all" | "exists" | "equals" | "lte" | "gte";
type MasteredColumnFilter = "all" | "mastered" | "unmastered" | "na";
type ReleaseColumnFilterMode = "all" | "exists" | "before" | "after";

export default function Inventory() {
  const worldState = useWorldStateData();
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
  const [showAvailableNow, setShowAvailableNow] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [tableTypeFilter, setTableTypeFilter] = useState("all");
  const [tableAccessFilter, setTableAccessFilter] = useState<AccessFilter>("all");
  const [tableMrFilterMode, setTableMrFilterMode] = useState<MrColumnFilterMode>("all");
  const [tableMrFilterValue, setTableMrFilterValue] = useState("");
  const [tableMasteredFilter, setTableMasteredFilter] = useState<MasteredColumnFilter>("all");
  const [tableReleaseFilterMode, setTableReleaseFilterMode] = useState<ReleaseColumnFilterMode>("all");
  const [tableReleaseFilterValue, setTableReleaseFilterValue] = useState("");

  // 5.3: Item detail panel
  const [selectedDetailId, setSelectedDetailId] = useState<CatalogId | null>(
    null,
  );

  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("all");

  const [wfVehTab, setWfVehTab] = useState<WarframesVehiclesTab>("all");
  const [companionsTab, setCompanionsTab] = useState<CompanionsTab>("all");

  const [weaponClassTab, setWeaponClassTab] = useState<WeaponClassTab>("all");
  const [weaponTypeFilters, setWeaponTypeFilters] = useState<Partial<Record<string, TagFilterState>>>({});
  const [visibleColumns, setVisibleColumns] = useState<InventoryColumnKey[]>(() =>
    loadVisibleInventoryColumns(),
  );
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      INVENTORY_COLUMN_STORAGE_KEY,
      JSON.stringify(visibleColumns),
    );
  }, [visibleColumns]);

  function selectPrimaryTab(next: PrimaryTab) {
    setPrimaryTab(next);

    setWfVehTab("all");
    setCompanionsTab("all");

    setWeaponTypeFilters({});
  }

  function selectWeaponClass(next: WeaponClassTab) {
    setWeaponClassTab(next);
    setWeaponTypeFilters({});
  }

  const columnMeta: Record<InventoryColumnKey, { label: string; width: string }> = {
    item: { label: "Item", width: "minmax(320px,1.8fr)" },
    type: { label: "Type", width: "210px" },
    release: { label: "Release", width: "170px" },
    mr: { label: "MR", width: "140px" },
    available: { label: "Access", width: "140px" },
    count: { label: "Count", width: "160px" },
    mastered: { label: "Mastered", width: "140px" },
    goal: { label: "Goal Target", width: "170px" },
  };

  function toggleColumn(column: InventoryColumnKey) {
    if (column === "item") return;
    setVisibleColumns((current) => {
      if (current.includes(column)) {
        return current.filter((value) => value !== column);
      }
      const next = [...current, column];
      return DEFAULT_INVENTORY_COLUMNS.filter((value) => next.includes(value));
    });
  }

  function cycleSort(nextKey: SortKey, alternateKey?: SortKey) {
    setSortKey((current) => {
      if (current === nextKey && alternateKey) return alternateKey;
      return nextKey;
    });
  }

  const inventoryCatalogIds = useMemo(() => {
    const seen = new Set<string>(FULL_CATALOG.displayableInventoryItemIds as CatalogId[]);
    const supplemental: CatalogId[] = [];

    for (const id of FULL_CATALOG.displayableItemIds as CatalogId[]) {
      if (seen.has(id)) continue;
      const rec: any = FULL_CATALOG.recordsById[id];
      if (!rec?.displayName) continue;

      const cls = classifyFromRecord(String(id), rec);
      const collectionRelevant =
        cls.groups.has("warframesVehicles") ||
        cls.groups.has("companions") ||
        cls.groups.has("weapons") ||
        cls.groups.has("resources") ||
        cls.groups.has("components");

      if (!collectionRelevant) continue;

      const acq = getAcquisitionByCatalogId(id);
      const sources = Array.isArray(acq?.sources) ? acq.sources : [];
      if (!sources.some(isStarChartCollectionSource)) continue;

      seen.add(id);
      supplemental.push(id);
    }

    for (const id of getAllWikiBlueprintReferencedCatalogIds()) {
      if (seen.has(id)) continue;
      const rec: any = FULL_CATALOG.recordsById[id];
      if (!rec?.displayName) continue;

      seen.add(id);
      supplemental.push(id);
    }

    return [
      ...(FULL_CATALOG.displayableInventoryItemIds as CatalogId[]),
      ...supplemental,
    ];
  }, []);

  const rows = useMemo<Row[]>(() => {
    const q = normalize(query);

    const base: Row[] = inventoryCatalogIds
      .map((id) => {
        const rec: any = FULL_CATALOG.recordsById[id];
        if (!rec?.displayName) return null;
        const rawPath = resolveRecordPath(rec);
        const allEntry = getAllEntry(rawPath, rec.displayName);

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

        return {
          id,
          label: rec.displayName,
          value: safeInt(counts[String(id)] ?? 0, 0),
          categories,
          cls,
          path: rawPath,
          isMasterable: isMasterableItem(cls, rawPath),
          isOverLevel: isOverLevelWeaponPath(rawPath),
          itemType: getInventoryItemTypeLabel({
            rawType:
              allEntry?.type ??
              rec.type ??
              rec?.raw?.type ??
              rec?.raw?.rawWfcd?.type ??
              rec?.raw?.rawLotus?.type ??
              "",
            cls,
            label: rec.displayName,
            path: rawPath,
          }),
          releaseDate: allEntry?.releaseDate,
          masteryReq:
            allEntry?.masteryReq ??
            rec?.masteryReq ??
            rec?.raw?.masteryReq ??
            rec?.raw?.rawWfcd?.masteryReq ??
            rec?.raw?.rawLotus?.masteryReq ??
            0,
        } as Row;
      })
      .filter((r): r is Row => !!r)
      .filter((r) => {
        if (!q) return true;

        const label = normalize(r.label);
        const id = normalize(String(r.id));
        const aliases = inventorySearchAliases(r).map(normalize).join(" | ");

        // Base searchable fields
        if (label.includes(q) || id.includes(q)) return true;
        if (aliases.includes(q)) return true;

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
        case "type-asc":
          if (a.itemType !== b.itemType) return a.itemType.localeCompare(b.itemType);
          break;
        case "type-desc":
          if (a.itemType !== b.itemType) return b.itemType.localeCompare(a.itemType);
          break;
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
      groups: new Set(["warframesVehicles", "railjack"]),
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
        isOverLevel: false,
        itemType: "Plexus",
        releaseDate: undefined,
        masteryReq: 0,
      });
    }

    const dedupedByLabel = new Map<string, Row>();
    for (const row of base) {
      const key = normalize(row.label);
      const existing = dedupedByLabel.get(key);
      if (!existing) {
        dedupedByLabel.set(key, row);
        continue;
      }
      dedupedByLabel.set(key, preferInventoryRow(existing, row));
    }

    return Array.from(dedupedByLabel.values());
  }, [counts, inventoryCatalogIds, mastered, overLevelMastered, query, hideZero, sortKey]);

  const availableCompanionTabs = useMemo(() => {
    const available = new Set<CompanionsTab>(["all"]);
    for (const row of rows) {
      if (!row.cls.groups.has("companions")) continue;
      if (row.cls.groups.has("components")) continue;
      for (const sub of row.cls.companionsSub) {
        available.add(sub);
      }
    }
    return available;
  }, [rows]);

  useEffect(() => {
    if (companionsTab !== "all" && !availableCompanionTabs.has(companionsTab)) {
      setCompanionsTab("all");
    }
  }, [companionsTab, availableCompanionTabs]);

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

  const filtered = useMemo(() => {
    // Railjack tab — Plexus plus Railjack resources/items.
    if (primaryTab === "railjack") {
      return rows.filter((r) => r.cls.groups.has("railjack"));
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
      return rows.filter((r) => r.cls.groups.has("resources") && !r.cls.groups.has("railjack"));
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
        Object.keys(weaponTypeFilters).length > 0 &&
        weaponClassTab !== "companion" &&
        weaponClassTab !== "all"
      ) {
        const { included, excluded } = splitTagFilterState(weaponTypeFilters);
        const types = r.cls.weaponTypesByClass[weaponClassTab];
        if (!types || types.size === 0) return false;
        const normalizedTypes = Array.from(types).map((t) => normalize(t));
        if (included.length > 0 && !normalizedTypes.some((t) => included.includes(t))) return false;
        if (excluded.length > 0 && normalizedTypes.some((t) => excluded.includes(t))) return false;
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

    if (showAvailableNow) {
      result = result.filter((r) => {
        const requirement = r.masteryReq ?? 0;
        return requirement <= (masteryRank ?? 0);
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

    if (tableTypeFilter !== "all") {
      result = result.filter((r) => r.itemType === tableTypeFilter);
    }

    if (tableAccessFilter !== "all") {
      result = result.filter(
        (r) =>
          determineItemAvailability(r.id, completedPrereqs, masteryRank) ===
          tableAccessFilter,
      );
    }

    if (tableMrFilterMode !== "all") {
      const targetMr = Number(tableMrFilterValue);
      result = result.filter((r) => {
        if (tableMrFilterMode === "exists") return r.masteryReq > 0;
        if (!Number.isFinite(targetMr)) return true;
        if (tableMrFilterMode === "equals") return r.masteryReq === targetMr;
        if (tableMrFilterMode === "lte") return r.masteryReq > 0 && r.masteryReq <= targetMr;
        if (tableMrFilterMode === "gte") return r.masteryReq >= targetMr;
        return true;
      });
    }

    if (tableMasteredFilter !== "all") {
      result = result.filter((r) => {
        const masteredState = checkMastered(
          mastered,
          overLevelMastered,
          String(r.id),
          r.path,
        );
        if (tableMasteredFilter === "mastered") return r.isMasterable && masteredState;
        if (tableMasteredFilter === "unmastered") return r.isMasterable && !masteredState;
        return !r.isMasterable;
      });
    }

    if (tableReleaseFilterMode !== "all") {
      result = result.filter((r) => {
        if (tableReleaseFilterMode === "exists") return Boolean(r.releaseDate);
        if (!r.releaseDate || !tableReleaseFilterValue) return true;
        if (tableReleaseFilterMode === "before") return r.releaseDate < tableReleaseFilterValue;
        if (tableReleaseFilterMode === "after") return r.releaseDate > tableReleaseFilterValue;
        return true;
      });
    }

    return result;
  }, [
    filtered,
    ownershipFilter,
    showAvailableNow,
    showAvailableOnly,
    counts,
    mastered,
    overLevelMastered,
    completedPrereqs,
    masteryRank,
    tableTypeFilter,
    tableAccessFilter,
    tableMrFilterMode,
    tableMrFilterValue,
    tableMasteredFilter,
    tableReleaseFilterMode,
    tableReleaseFilterValue,
  ]);

  const visibleTableColumns = useMemo(() => {
    const ensured = visibleColumns.includes("item")
      ? visibleColumns
      : (["item", ...visibleColumns] as InventoryColumnKey[]);
    return DEFAULT_INVENTORY_COLUMNS.filter((column) => ensured.includes(column));
  }, [visibleColumns]);

  const inventoryGridTemplate = useMemo(
    () => ["48px", ...visibleTableColumns.map((column) => columnMeta[column].width)].join(" "),
    [visibleTableColumns],
  );

  const tableTypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of filtered) {
      if (row.itemType) set.add(row.itemType);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [filtered]);

  const tableMrOptions = useMemo(() => {
    const set = new Set<number>();
    for (const row of filtered) {
      if (row.masteryReq > 0) set.add(row.masteryReq);
    }
    return [...set].sort((a, b) => a - b);
  }, [filtered]);

  const activeColumnFilterCount = useMemo(() => {
    let total = 0;
    if (tableTypeFilter !== "all") total += 1;
    if (tableAccessFilter !== "all") total += 1;
    if (tableMrFilterMode !== "all") total += 1;
    if (tableMasteredFilter !== "all") total += 1;
    if (tableReleaseFilterMode !== "all") total += 1;
    return total;
  }, [
    tableTypeFilter,
    tableAccessFilter,
    tableMrFilterMode,
    tableMasteredFilter,
    tableReleaseFilterMode,
  ]);

  function resetColumnFilters() {
    setTableTypeFilter("all");
    setTableAccessFilter("all");
    setTableMrFilterMode("all");
    setTableMrFilterValue("");
    setTableMasteredFilter("all");
    setTableReleaseFilterMode("all");
    setTableReleaseFilterValue("");
  }

  const displayedRowIdSet = useMemo(
    () => new Set(finalFiltered.map((row) => String(row.id))),
    [finalFiltered],
  );

  const selectedDisplayedCount = useMemo(() => {
    let total = 0;
    for (const id of selectedRowIds) {
      if (displayedRowIdSet.has(id)) total += 1;
    }
    return total;
  }, [selectedRowIds, displayedRowIdSet]);

  const allDisplayedChecked =
    finalFiltered.length > 0 && finalFiltered.every((row) => selectedRowIds.has(String(row.id)));

  useEffect(() => {
    setSelectedRowIds((current) => {
      const next = new Set<string>();
      for (const id of current) {
        if (displayedRowIdSet.has(id)) next.add(id);
      }
      return next.size === current.size ? current : next;
    });
  }, [displayedRowIdSet]);

  function toggleDisplayedSelection(checked: boolean) {
    setSelectedRowIds((current) => {
      const next = new Set(current);
      for (const row of finalFiltered) {
        const id = String(row.id);
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function toggleRowSelection(id: string, checked: boolean) {
    setSelectedRowIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearSelectedRows() {
    setSelectedRowIds(new Set());
    setActionsMenuOpen(false);
  }

  function applyToSelectedRows(run: (row: Row) => void) {
    for (const row of finalFiltered) {
      if (selectedRowIds.has(String(row.id))) run(row);
    }
    clearSelectedRows();
  }

  function applySelectedCountUpdate() {
    const input = window.prompt("Set count for selected items:", "1");
    if (input === null) return;
    const nextCount = Math.max(0, safeInt(input, 0));
    applyToSelectedRows((row) => setCount(String(row.id), nextCount));
  }

  function applySelectedGoalAdd() {
    applyToSelectedRows((row) => {
      if (!goalByCatalogId.has(String(row.id))) addGoalItem(String(row.id), 1);
    });
  }

  function applySelectedMastery(marked: boolean) {
    applyToSelectedRows((row) => {
      if (!row.isMasterable) return;
      if (row.isOverLevel) {
        setOverLevelMastered(String(row.id), marked);
      } else {
        setMastered(String(row.id), marked);
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
    query,
    hideZero,
    ownershipFilter,
    showAvailableNow,
    showAvailableOnly,
    tableTypeFilter,
    tableAccessFilter,
    tableMrFilterMode,
    tableMrFilterValue,
    tableMasteredFilter,
    tableReleaseFilterMode,
    tableReleaseFilterValue,
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Section
        title="Inventory"
        className="flex h-full min-h-0 flex-col md:min-h-[42rem]"
        bodyClassName="flex min-h-0 flex-1 flex-col"
      >
        <div className={COLLECTION_LEDGER_SHELL_CLASS}>
          <CollectionUtilityBand
            primary={
              <CollectionUtilityPanel>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Search Catalog
                  </span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-base text-slate-100 placeholder:text-slate-500"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search items, blueprints, resources..."
                  />
                </label>

                <div className="mt-3 grid gap-2 lg:grid-cols-[auto_1fr] lg:items-start">
                  <div className="pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Ownership
                  </div>
                  <WorkspaceFilterGroup className="gap-2">
                    {(["all", "owned", "unowned"] as const).map((f) => (
                      <PillButton
                        key={f}
                        label={f === "all" ? "All" : f === "owned" ? "Owned" : "Unowned"}
                        active={ownershipFilter === f}
                        onClick={() => setOwnershipFilter(f)}
                      />
                    ))}
                  </WorkspaceFilterGroup>

                  <div className="pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Status
                  </div>
                  <WorkspaceFilterGroup className="gap-2">
                    <PillButton
                      label="Mastered"
                      active={ownershipFilter === "mastered"}
                      onClick={() =>
                        setOwnershipFilter(ownershipFilter === "mastered" ? "all" : "mastered")
                      }
                    />
                    <PillButton
                      label={masteryRank === null ? "Within current MR" : `Within current MR (${masteryRank})`}
                      active={showAvailableNow}
                      onClick={() => {
                        if (masteryRank === null) return;
                        setShowAvailableNow(!showAvailableNow);
                      }}
                    />
                    <PillButton
                      label="Accessible sources"
                      active={showAvailableOnly}
                      onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                    />
                  </WorkspaceFilterGroup>
                </div>
              </CollectionUtilityPanel>
            }
            secondary={
              <CollectionUtilityPanel className="grid gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Sort Rows
                  </span>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                  >
                    <option value="az">Name A→Z</option>
                    <option value="za">Name Z→A</option>
                    <option value="type-asc">Type A→Z</option>
                    <option value="type-desc">Type Z→A</option>
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

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={hideZero}
                      onChange={(e) => setHideZero(e.target.checked)}
                    />
                    Hide zero-count rows
                  </label>
                  <WorkspaceAction
                    className="rounded-full border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100"
                    onClick={() => setSelectedDetailId(null)}
                  >
                    Clear Detail
                  </WorkspaceAction>
                </div>
              </CollectionUtilityPanel>
            }
          />

          <div className="flex min-h-0 flex-1 flex-col">
          <CollectionModeBand>
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
          </CollectionModeBand>

          {primaryTab === "weapons" ? (
            <CollectionRefineBand title="Refine Weapons" className="gap-y-1.5">
              <CollectionChipRail>
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
              </CollectionChipRail>
              {weaponClassTab !== "companion" &&
              weaponClassTab !== "all" &&
              weaponTypeOptions.length > 0 ? (
                <CollectionRefineGroup
                  label="Weapon Type"
                  action={
                    Object.keys(weaponTypeFilters).length > 0 ? (
                      <button
                        className="text-xs text-slate-300 underline hover:text-slate-100"
                        onClick={() => setWeaponTypeFilters({})}
                      >
                        Clear type filters
                      </button>
                    ) : null
                  }
                >
                  <CollectionChipRail>
                    {weaponTypeOptions.map((t) => {
                      const state = weaponTypeFilters[t];
                      return (
                        <FilterTagButton
                          key={t}
                          label={titleCase(t)}
                          state={state}
                          title={
                            state === "include"
                              ? `Including ${titleCase(t)}. Click again to exclude it.`
                              : state === "exclude"
                                ? `Excluding ${titleCase(t)}. Click again to clear it.`
                                : `Click to include ${titleCase(t)}.`
                          }
                          onClick={() => {
                            setWeaponTypeFilters((prev) => {
                              const nextState = cycleTagFilterState(prev[t]);
                              const next = { ...prev };
                              if (!nextState) delete next[t];
                              else next[t] = nextState;
                              return next;
                            });
                          }}
                        />
                      );
                    })}
                  </CollectionChipRail>
                </CollectionRefineGroup>
              ) : null}
            </CollectionRefineBand>
          ) : primaryTab === "warframesVehicles" ? (
            <CollectionRefineBand title="Refine Warframes & Vehicles" className="gap-y-1.5">
              <CollectionChipRail>
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
              </CollectionChipRail>
            </CollectionRefineBand>
          ) : primaryTab === "companions" ? (
            <CollectionRefineBand title="Refine Companions" className="gap-y-1.5">
              <CollectionChipRail>
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
              </CollectionChipRail>
            </CollectionRefineBand>
          ) : null}

          {/* Virtualized list */}
          <CollectionResultsBand
            actions={
              <WorkspaceFilterGroup className="text-xs text-slate-400">
                <span className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5">
                  Rows: {finalFiltered.length}
                </span>
                <span className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5">
                  Filters: {activeColumnFilterCount}
                </span>
                <WorkspaceAction
                  className="rounded-full border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={activeColumnFilterCount === 0}
                  onClick={resetColumnFilters}
                >
                  Clear column filters
                </WorkspaceAction>
                <div className="relative">
                  <WorkspaceAction
                    className="rounded-full border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100"
                    onClick={() => setColumnMenuOpen((open) => !open)}
                  >
                    Customize Columns
                  </WorkspaceAction>
                  {columnMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-56 rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-[0_18px_60px_rgba(2,6,23,0.45)] backdrop-blur">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Visible Columns
                      </div>
                      <div className="space-y-2">
                        {DEFAULT_INVENTORY_COLUMNS.map((column) => (
                          <label key={column} className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={visibleTableColumns.includes(column)}
                              disabled={column === "item"}
                              onChange={() => toggleColumn(column)}
                            />
                            <span>{columnMeta[column].label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </WorkspaceFilterGroup>
            }
          />

          <div ref={listRef} className="min-h-0 flex-1 overflow-auto" onScroll={() => recomputeWindow()}>
            <div className="min-w-max">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
              <div
                className="grid gap-0 text-sm"
                style={{ gridTemplateColumns: inventoryGridTemplate }}
              >
                <div
                  className="flex items-center justify-center px-2 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                  title="Selection"
                  aria-label="Selection column"
                />
                {visibleTableColumns.map((column) => {
                  const sortable =
                    column === "item" ||
                    column === "type" ||
                    column === "release" ||
                    column === "mr" ||
                    column === "count";
                  const sortLabel =
                    column === "item"
                      ? sortKey === "az"
                        ? "A→Z"
                        : sortKey === "za"
                          ? "Z→A"
                          : null
                      : column === "type"
                        ? sortKey === "type-asc"
                          ? "A→Z"
                          : sortKey === "type-desc"
                            ? "Z→A"
                            : null
                        : column === "release"
                          ? sortKey === "release-newest"
                            ? "Newest"
                            : sortKey === "release-oldest"
                              ? "Oldest"
                              : null
                          : column === "mr"
                            ? sortKey === "mr-asc"
                              ? "Low→High"
                              : sortKey === "mr-desc"
                                ? "High→Low"
                                : null
                            : column === "count"
                              ? sortKey === "count-desc"
                                ? "High→Low"
                                : sortKey === "count-asc"
                                  ? "Low→High"
                                  : null
                              : null;

                  return (
                    <button
                      key={column}
                      className={[
                        "flex items-center gap-2 px-3 py-2 text-left font-semibold",
                        sortable ? "text-slate-200 hover:bg-slate-900/70" : "text-slate-300",
                        column === "mastered" ? "justify-center" : "",
                      ].join(" ")}
                      disabled={!sortable}
                      onClick={() => {
                        if (column === "item") cycleSort("az", "za");
                        else if (column === "type") cycleSort("type-asc", "type-desc");
                        else if (column === "release") cycleSort("release-newest", "release-oldest");
                        else if (column === "mr") cycleSort("mr-asc", "mr-desc");
                        else if (column === "count") cycleSort("count-desc", "count-asc");
                      }}
                    >
                      <span>{columnMeta[column].label}</span>
                      {sortLabel && (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                          {sortLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div
                className="grid gap-0 border-t border-slate-800/70 bg-slate-950/90"
                style={{ gridTemplateColumns: inventoryGridTemplate }}
              >
                <div style={{ gridColumn: "span 2 / span 2" }}>
                  <div
                    className="grid items-center"
                    style={{ gridTemplateColumns: "48px minmax(320px,1.8fr)" }}
                  >
                    <div className="flex items-center justify-center px-2 py-2">
                      <input
                        type="checkbox"
                        checked={allDisplayedChecked}
                        onChange={(e) => toggleDisplayedSelection(e.target.checked)}
                        aria-label="Select all displayed items"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <span className="text-xs text-slate-300">Select all</span>
                      <div className="relative">
                        <button
                          className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={selectedDisplayedCount === 0}
                          onClick={() => setActionsMenuOpen((open) => !open)}
                        >
                          Actions
                        </button>
                        {actionsMenuOpen && selectedDisplayedCount > 0 && (
                          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-56 rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-[0_18px_60px_rgba(2,6,23,0.45)] backdrop-blur">
                            <button className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900" onClick={applySelectedGoalAdd}>Add to Goals</button>
                            <button className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900" onClick={applySelectedCountUpdate}>Update Count</button>
                            <button className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900" onClick={() => applySelectedMastery(true)}>Mark Mastery</button>
                            <button className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900" onClick={() => applySelectedMastery(false)}>Unmark Mastery</button>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{selectedDisplayedCount} checked</span>
                    </div>
                  </div>
                </div>
                {visibleTableColumns.filter((column) => column !== "item").map((column) => {
                  if (column === "type") {
                    return (
                      <div key={column} className="px-2 py-2">
                        <select
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                          value={tableTypeFilter}
                          onChange={(e) => setTableTypeFilter(e.target.value)}
                        >
                          <option value="all">All types</option>
                          {tableTypeOptions.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  if (column === "release") {
                    return (
                      <div key={column} className="px-2 py-2 space-y-1">
                        <select
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                          value={tableReleaseFilterMode}
                          onChange={(e) => setTableReleaseFilterMode(e.target.value as ReleaseColumnFilterMode)}
                        >
                          <option value="all">All release</option>
                          <option value="exists">Has date</option>
                          <option value="before">Before</option>
                          <option value="after">After</option>
                        </select>
                        {(tableReleaseFilterMode === "before" || tableReleaseFilterMode === "after") && (
                          <input
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                            type="date"
                            value={tableReleaseFilterValue}
                            onChange={(e) => setTableReleaseFilterValue(e.target.value)}
                          />
                        )}
                      </div>
                    );
                  }
                  if (column === "available") {
                    return (
                      <div key={column} className="px-2 py-2">
                        <select
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                          value={tableAccessFilter}
                          onChange={(e) => setTableAccessFilter(e.target.value as AccessFilter)}
                        >
                          <option value="all">All access</option>
                          <option value="available">Now</option>
                          <option value="partial">Partial</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                    );
                  }
                  if (column === "mr") {
                    return (
                      <div key={column} className="px-2 py-2 space-y-1">
                        <select
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                          value={tableMrFilterMode}
                          onChange={(e) => setTableMrFilterMode(e.target.value as MrColumnFilterMode)}
                        >
                          <option value="all">All MR</option>
                          <option value="exists">Has MR</option>
                          <option value="equals">Equals</option>
                          <option value="lte">At or under</option>
                          <option value="gte">At or above</option>
                        </select>
                        {(tableMrFilterMode === "equals" ||
                          tableMrFilterMode === "lte" ||
                          tableMrFilterMode === "gte") && (
                          <select
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                            value={tableMrFilterValue}
                            onChange={(e) => setTableMrFilterValue(e.target.value)}
                          >
                            <option value="">Any MR</option>
                            {tableMrOptions.map((mr) => (
                              <option key={mr} value={String(mr)}>
                                MR {mr}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  }
                  if (column === "mastered") {
                    return (
                      <div key={column} className="px-2 py-2">
                        <select
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                          value={tableMasteredFilter}
                          onChange={(e) => setTableMasteredFilter(e.target.value as MasteredColumnFilter)}
                        >
                          <option value="all">All states</option>
                          <option value="mastered">Mastered</option>
                          <option value="unmastered">Not mastered</option>
                          <option value="na">N/A</option>
                        </select>
                      </div>
                    );
                  }

                  return <div key={column} className="px-2 py-2" />;
                })}
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
                  const isChecked = selectedRowIds.has(String(r.id));
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
                  const availability = determineItemAvailability(
                    r.id,
                    completedPrereqs,
                    masteryRank,
                  );
                  const availabilityLabel =
                    availability === "available"
                      ? "Now"
                      : availability === "partial"
                        ? "Partial"
                        : "Blocked";
                  const availabilityTone =
                    availability === "available"
                      ? "text-emerald-300 border-emerald-800/50 bg-emerald-950/30"
                      : availability === "partial"
                        ? "text-amber-300 border-amber-800/50 bg-amber-950/30"
                        : "text-rose-300 border-rose-800/50 bg-rose-950/30";
                  const primeAvailability = getPrimeAvailabilityStatus(String(r.id), worldState);
                  const isVaulted = primeAvailability === "vaulted";
                  const isPrimeResurgence = primeAvailability === "prime_resurgence";
                  const hasVaultedParts =
                    !isVaulted &&
                    (rowAllE?.components?.some(
                      (comp) =>
                        comp.uniqueName &&
                        getPrimeAvailabilityStatus(`items:${comp.uniqueName}`, worldState) === "vaulted",
                    ) ??
                      false);

                  return (
                    <div
                      key={String(r.id)}
                      className={[
                        "grid border-b border-slate-800/70 items-center",
                        isSelected ? "bg-slate-900/60" : "",
                      ].join(" ")}
                      style={{ gridTemplateColumns: inventoryGridTemplate, height: ROW_H }}
                    >
                      <div className="px-2 py-2 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleRowSelection(String(r.id), e.target.checked)}
                          aria-label={`Select ${r.label}`}
                        />
                      </div>
                      {visibleTableColumns.map((column) => {
                        if (column === "item") {
                          return (
                            <div key={column} className="px-3 py-2 flex items-center gap-2 min-w-0">
                              <span
                                className={[
                                  "shrink-0 w-2 h-2 rounded-full",
                                  isMastered ? "bg-cyan-400" : isOwned ? "bg-emerald-500" : "bg-slate-700",
                                ].join(" ")}
                                title={isMastered ? "Mastered" : isOwned ? "Owned" : "Not owned"}
                              />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <button
                                    className={[
                                      "min-w-0 truncate text-left text-sm transition-colors hover:text-cyan-300",
                                      isMastered ? "text-cyan-400/80" : isOwned ? "text-slate-100" : "text-slate-400",
                                    ].join(" ")}
                                    onClick={() => setSelectedDetailId(isSelected ? null : r.id)}
                                    title="Click for details"
                                  >
                                    {r.label}
                                  </button>
                                  {isPrimeResurgence && (
                                    <span className="shrink-0 rounded border border-violet-700/50 bg-violet-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
                                      PRIME RESURGENCE
                                    </span>
                                  )}
                                  {isVaulted && (
                                    <span className="shrink-0 rounded border border-rose-700/50 bg-rose-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400">
                                      VAULTED
                                    </span>
                                  )}
                                  {hasVaultedParts && (
                                    <span className="shrink-0 rounded border border-orange-700/50 bg-orange-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">
                                      VAULTED PARTS
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (column === "type") {
                          return (
                            <div key={column} className="px-3 py-2 text-sm text-slate-300">
                              {r.itemType || "—"}
                            </div>
                          );
                        }

                        if (column === "release") {
                          return (
                            <div key={column} className="px-3 py-2 text-sm text-slate-300">
                              {formatReleaseDate(r.releaseDate) ?? "—"}
                            </div>
                          );
                        }

                        if (column === "mr") {
                          return (
                            <div key={column} className="px-3 py-2 text-sm text-slate-300">
                              {r.masteryReq > 0 ? `MR ${r.masteryReq}` : "—"}
                            </div>
                          );
                        }

                        if (column === "available") {
                          return (
                            <div key={column} className="px-3 py-2">
                              <span className={["inline-flex rounded-full border px-2 py-1 text-xs font-semibold", availabilityTone].join(" ")}>
                                {availabilityLabel}
                              </span>
                            </div>
                          );
                        }

                        if (column === "count") {
                          return (
                            <div key={column} className="px-2 py-2 flex items-center gap-1">
                              <button
                                className="shrink-0 w-7 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-base font-bold leading-none flex items-center justify-center"
                                onClick={() => setCount(String(r.id), Math.max(0, r.value - 1))}
                                tabIndex={-1}
                              >
                                −
                              </button>
                              <input
                                className="w-14 rounded-lg border border-slate-700 bg-slate-900 py-1.5 text-center text-sm text-slate-100"
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
                          );
                        }

                        if (column === "mastered") {
                          return (
                            <div key={column} className="px-2 py-2 flex items-center justify-center">
                              {r.isMasterable && (
                                <button
                                  title={isMastered ? "Marked as mastered — click to unmark" : "Click to mark as mastered"}
                                  className={[
                                    "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                                    isMastered
                                      ? "border-cyan-700 bg-cyan-900/60 text-cyan-300 hover:bg-cyan-900"
                                      : "border-slate-700 bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300",
                                  ].join(" ")}
                                  onClick={() => {
                                    if (r.path === "/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness") {
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
                          );
                        }

                        return (
                          <div key={column} className="px-2 py-2">
                            <div className="flex items-center gap-1.5">
                              <input
                                className={[
                                  "w-full rounded-lg border px-2 py-1.5 text-sm text-slate-100",
                                  goal ? "border-slate-700 bg-slate-900" : "border-slate-800 bg-slate-950/40 text-slate-400",
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
                              <div className={["text-xs whitespace-nowrap", goal ? "text-emerald-400" : "text-slate-600"].join(" ")}>
                                {goal ? "On" : "Off"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            </div>

            {finalFiltered.length === 0 && (
              <div className="px-3 py-3 text-sm text-slate-400">
                No matches.
              </div>
            )}
          </div>
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
          const accessExplanation =
            avail === "available"
              ? "At least one acquisition path is open for your current progression."
              : avail === "partial"
                ? "Some acquisition paths are open now, but other sources are still gated by mastery rank or progression requirements."
                : "No current acquisition path is open for your present mastery rank or progression state.";

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
                    {allE && getPrimeAvailabilityStatus(`items:${allE.uniqueName}`, worldState) === "prime_resurgence" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-violet-700/50 bg-violet-950/30 text-violet-300 font-semibold">
                        PRIME RESURGENCE
                      </span>
                    )}
                    {allE && getPrimeAvailabilityStatus(`items:${allE.uniqueName}`, worldState) === "vaulted" && (
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

                  {/* Access explanation */}
                  {avail !== "available" && (
                    <div>
                      <Label color={avail === "partial" ? "text-amber-400" : "text-rose-400"}>
                        {avail === "partial" ? "Why Access Is Partial" : "Why Access Is Blocked"}
                      </Label>
                      <p className={["mb-2 text-xs leading-relaxed", avail === "partial" ? "text-amber-200" : "text-rose-300"].join(" ")}>
                        {accessExplanation}
                      </p>
                      {blockingReasons.length > 0 && (
                      <ul className="space-y-1">
                        {blockingReasons.map((r, i) => (
                          <li
                            key={i}
                            className={["flex items-start gap-1 text-xs", avail === "partial" ? "text-amber-200" : "text-rose-300"].join(" ")}
                          >
                            <span className="mt-0.5 shrink-0">—</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      )}
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
                          // Only resolve catalog acquisition for recipe-path components
                          // (blueprints, parts). Generic resources like Salvage, Neurodes,
                          // Gallium etc. have incomplete or misleading catalog sources —
                          // their drop rows (if any) or wiki link are more accurate.
                          const isRecipeComp = comp.uniqueName
                            ? /\/Recipes\//.test(comp.uniqueName)
                            : false;
                          const compCatalogId = isRecipeComp && comp.uniqueName
                            ? (`items:${comp.uniqueName}` as import("../domain/catalog/loadFullCatalog").CatalogId)
                            : null;
                          const compAcq = compCatalogId
                            ? getAcquisitionByCatalogId(compCatalogId)
                            : null;
                          // Only show "primary" acquisition sources in the header badge.
                          // Drop-table sources (data:drop:*, data:node/*) are already
                          // represented by the drop rows below and would show raw IDs here.
                          // data:crafting is also not useful at the individual component level.
                          const compSources = (compAcq?.sources ?? []).filter(s =>
                            s !== "data:crafting" &&
                            !s.startsWith("data:drop:") &&
                            !s.startsWith("data:node/")
                          );
                          const hasCatalogSources = compSources.length > 0;
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
                                {/* Right side: catalog sources if known, else wiki fallback */}
                                {hasCatalogSources ? (
                                  <span className="ml-auto flex flex-wrap gap-x-2 gap-y-0.5 justify-end">
                                    {compSources.slice(0, 3).map((s) => (
                                      <span key={s} className="text-[10px] text-sky-400">
                                        {SOURCE_INDEX[s as any]?.label ?? s
                                          .replace(/^(?:data|src):/, "")
                                          .replace(/\//g, " › ")
                                          .replace(/-/g, " ")
                                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                                      </span>
                                    ))}
                                    {compSources.length > 3 && (
                                      <span className="text-[10px] text-slate-500">+{compSources.length - 3} more</span>
                                    )}
                                  </span>
                                ) : !hasDrops ? (
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
                                ) : null}
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
                                    .map((d, j) => <InvDropRow key={j} d={d} small worldState={worldState} steelPath={isSteelPathDrop(d)} />)}
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
                            .map((d, i) => <InvDropRow key={i} d={d} worldState={worldState} steelPath={isSteelPathDrop(d)} />)}
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
