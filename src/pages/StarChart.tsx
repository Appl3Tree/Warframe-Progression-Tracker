// ===== FILE: src/pages/StarChart.tsx =====

import React, { useEffect, useMemo, useRef, useState } from "react";
import { STAR_CHART_DATA } from "../domain/catalog/starChart";
import type { NodeId, PlanetId, StarChartNode, StarChartPlanet } from "../domain/models/starChart";
import { getDropSourcesForStarChartNode } from "../domain/catalog/starChart/nodeDropSourceMap";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../catalog/items/itemAcquisition";
import { SOURCE_INDEX } from "../catalog/sources/sourceCatalog";
import { normalizeSourceId } from "../domain/ids/sourceIds";
import { getRegionResourcesForPlanet } from "../domain/catalog/starChart/regionResources";
import { PREREQ_REGISTRY } from "../catalog/prereqs/prereqRegistry";
import { useTrackerStore } from "../store/store";

const EMPTY_NODE_COMPLETED: Record<string, boolean> = {};

type ItemRow = { catalogId: string; name: string };

function Section(props: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-lg font-semibold">{props.title}</div>
                    {props.subtitle && <div className="mt-1 text-sm text-slate-400">{props.subtitle}</div>}
                </div>
                {props.actions && <div className="flex items-center gap-2">{props.actions}</div>}
            </div>
            <div className="mt-4">{props.children}</div>
        </div>
    );
}

function safeString(v: unknown): string {
    return typeof v === "string" ? v : String(v ?? "");
}

function safeNormalizeSourceId(raw: string): string | null {
    try {
        return normalizeSourceId(raw);
    } catch {
        return null;
    }
}

/**
 * Some nodes will resolve multiple catalogIds that are effectively the "same thing" to the user.
 * This normalizes by display name so we can collapse duplicates without breaking pill separation.
 */
function itemNameKey(name: string): string {
    return String(name ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function isLotusLikeText(s: string): boolean {
    const t = String(s ?? "").toLowerCase();
    return t.includes("/lotus/") || t.includes("lotus/");
}

/**
 * If multiple catalogIds share the same display name, keep a deterministic "best" row:
 * - Prefer non-Lotus-path looking ids/names
 * - Prefer shorter catalogId (more human-friendly internal ids tend to be shorter)
 * - Tie-break on catalogId lexicographically for stability
 */
function pickBestRowForSameName(a: ItemRow, b: ItemRow): ItemRow {
    const aLotus = isLotusLikeText(a.catalogId) || isLotusLikeText(a.name);
    const bLotus = isLotusLikeText(b.catalogId) || isLotusLikeText(b.name);

    if (aLotus !== bLotus) return aLotus ? b : a;

    if (a.catalogId.length !== b.catalogId.length) return a.catalogId.length < b.catalogId.length ? a : b;

    return a.catalogId.localeCompare(b.catalogId) <= 0 ? a : b;
}

function dedupeItemsByName(items: ItemRow[]): ItemRow[] {
    const byName = new Map<string, ItemRow>();

    for (const it of items) {
        const k = itemNameKey(it.name);
        if (!k) continue;

        const prev = byName.get(k);
        if (!prev) {
            byName.set(k, it);
            continue;
        }
        byName.set(k, pickBestRowForSameName(prev, it));
    }

    const out = [...byName.values()];
    out.sort((a, b) => a.name.localeCompare(b.name) || a.catalogId.localeCompare(b.catalogId));
    return out;
}

function buildSourceToItemsIndex(): Record<string, ItemRow[]> {
    const out: Record<string, ItemRow[]> = Object.create(null);

    // IMPORTANT:
    // For the Star Chart drop panel we want "any and all items that can be earned/dropped there".
    // Do NOT restrict to displayableInventoryItemIds, because that tends to exclude resources and other non-inventory records.
    const recordsById: Record<string, any> = ((FULL_CATALOG as any).recordsById ?? {}) as any;

    // Prefer all records, but keep a fallback to the older list if needed.
    const allIds = Object.keys(recordsById);
    const ids = allIds.length > 0 ? allIds : (FULL_CATALOG.displayableInventoryItemIds ?? []);

    for (const catalogId of ids) {
        const rec: any = recordsById?.[catalogId] ?? null;

        const name =
            typeof rec?.displayName === "string"
                ? rec.displayName
                : typeof rec?.name === "string"
                    ? rec.name
                    : safeString(catalogId);

        const acq = getAcquisitionByCatalogId(catalogId as any);
        const srcs: string[] = Array.isArray((acq as any)?.sources) ? (acq as any).sources.map(String) : [];

        for (const s of srcs) {
            const norm = safeNormalizeSourceId(String(s ?? "").trim());
            if (!norm) continue;

            if (!out[norm]) out[norm] = [];
            out[norm].push({ catalogId: String(catalogId), name });
        }
    }

    // Keep per-source lists deterministic (still may contain duplicates; we dedupe again at tab level).
    for (const k of Object.keys(out)) {
        out[k].sort((a, b) => a.name.localeCompare(b.name) || a.catalogId.localeCompare(b.catalogId));
    }

    return out;
}

function hashToUnitFloat(input: string): number {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function smoothstep01(t: number): number {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
}

type ManualPos = { x: number; y: number };

const MANUAL_POS: Record<string, ManualPos> = {
    // Positions matched against the in-game star chart screenshot.
    // Coordinate space: 0–100 before MAP_POS_SCALE is applied, origin top-left.

    // Far left
    "region:void":    { x: 14, y: 44 },
    "region:zariman": { x: 13, y: 29 },

    // Top cluster (inner system / Grineer territory)
    "planet:sedna":  { x: 51, y: 10 },
    "planet:ceres":  { x: 41, y: 26 },
    "planet:phobos": { x: 65, y: 22 },
    "planet:mars":   { x: 60, y: 29 },
    "planet:eris":   { x: 75, y: 29 },

    // Mid left
    "planet:europa":  { x: 25, y: 46 },
    "planet:jupiter": { x: 33, y: 43 },

    // Mid centre
    "planet:deimos":  { x: 55, y: 33 },

    // Mid right — Earth/Lua/Pluto band
    "planet:earth":   { x: 63, y: 46 },
    "region:lua":     { x: 68, y: 47 },
    "planet:pluto":   { x: 83, y: 47 },

    // Lower centre
    "planet:mercury": { x: 45, y: 55 },
    "planet:venus":   { x: 55, y: 62 },

    // Lower right
    "planet:neptune": { x: 73, y: 73 },

    // Lower left
    "planet:saturn":  { x: 37, y: 70 },

    // Bottom centre
    "planet:uranus":  { x: 50, y: 81 },

    // Kuva Fortress: orbit anchor — x/y ignored, position computed from MAP_CENTER.
    "region:kuva_fortress": { x: 50, y: 50 }
};

function isInMainMap(p: StarChartPlanet): boolean {
    if (p.kind === "hub") return false;

    if (p.id === "region:duviri") return false;
    if (p.id.endsWith("_proxima")) return false;
    if (p.id === "region:dark_refractory_deimos") return false;
    if (p.id === "auto:sanctuary") return false;
    if (p.id === "region:hollvania") return false;

    if (p.id === "region:zariman") return true;
    if (p.id === "region:void") return true;
    if (p.id === "region:lua") return true;
    if (p.id === "region:kuva_fortress") return true;

    return p.kind === "planet";
}

type ViewBox = { x: number; y: number; w: number; h: number };

// World bounds — large enough that expanded planet disks never clip at the edges.
const WORLD_MIN = -100;
const WORLD_MAX = 200;

// Kuva Fortress completes its route every ~50 hours.
const KUVA_PERIOD_MS = 50 * 3600 * 1000;
const KUVA_RAD_PER_MS = (Math.PI * 2) / KUVA_PERIOD_MS;

// Scale from 0-100 manual space to world space.  Reduced from 5.0 → 3.5 so
// planets appear as compactly clustered as the in-game star chart rather than
// spread across the full canvas with large empty gaps.
const MAP_POS_SCALE = 3.5;
const MAP_CENTER = { x: 50, y: 50 };

function mapScalePos(p: { x: number; y: number }): { x: number; y: number } {
    const dx = p.x - MAP_CENTER.x;
    const dy = p.y - MAP_CENTER.y;
    return { x: MAP_CENTER.x + dx * MAP_POS_SCALE, y: MAP_CENTER.y + dy * MAP_POS_SCALE };
}

// ── Planet visual palette ────────────────────────────────────────────────────
// Colours match Warframe's in-game appearance as closely as possible.
// `light` = sphere highlight, `base` = midtone, `dark` = shadow, `glow` = halo fill.
const PLANET_COLORS: Record<string, { base: string; light: string; dark: string; glow: string }> = {
    "planet:mercury":        { base: "#9c9090", light: "#d8d0cc", dark: "#3e3030", glow: "rgba(180,160,160,0.40)" },
    "planet:venus":          { base: "#d09c30", light: "#f0cc70", dark: "#705010", glow: "rgba(220,170,50,0.50)" },
    "planet:earth":          { base: "#2868d0", light: "#60a8f8", dark: "#0a1e5c", glow: "rgba(50,120,240,0.55)" },
    "planet:mars":           { base: "#c84028", light: "#f07060", dark: "#600808", glow: "rgba(220,70,40,0.55)" },
    "planet:deimos":         { base: "#9a6040", light: "#c49070", dark: "#401808", glow: "rgba(170,100,60,0.40)" },
    "planet:phobos":         { base: "#706898", light: "#a098c8", dark: "#282048", glow: "rgba(120,110,180,0.40)" },
    "planet:ceres":          { base: "#5888a0", light: "#80b8d0", dark: "#183040", glow: "rgba(80,150,190,0.45)" },
    "planet:jupiter":        { base: "#c07838", light: "#eaa868", dark: "#603010", glow: "rgba(210,140,60,0.50)" },
    "planet:europa":         { base: "#78c0e8", light: "#b8e0f8", dark: "#103860", glow: "rgba(120,200,240,0.55)" },
    "planet:saturn":         { base: "#c8a030", light: "#f0c860", dark: "#604808", glow: "rgba(220,175,50,0.50)" },
    "planet:uranus":         { base: "#40b8c8", light: "#70dae8", dark: "#084850", glow: "rgba(60,190,210,0.50)" },
    "planet:neptune":        { base: "#183cb8", light: "#4070e8", dark: "#080e50", glow: "rgba(30,80,220,0.55)" },
    "planet:pluto":          { base: "#887060", light: "#b09080", dark: "#302018", glow: "rgba(150,130,110,0.38)" },
    "planet:sedna":          { base: "#c03848", light: "#f06878", dark: "#601018", glow: "rgba(210,60,70,0.50)" },
    "planet:eris":           { base: "#7030b8", light: "#a060e0", dark: "#300858", glow: "rgba(130,50,200,0.50)" },
    "region:lua":            { base: "#b0b0c0", light: "#e0e0f0", dark: "#404050", glow: "rgba(200,200,220,0.50)" },
    "region:kuva_fortress":  { base: "#b82020", light: "#e05050", dark: "#580808", glow: "rgba(200,40,40,0.60)" },
    "region:void":           { base: "#6840c0", light: "#9870e8", dark: "#200858", glow: "rgba(120,80,210,0.50)" },
    "region:zariman":        { base: "#b88820", light: "#e0b050", dark: "#583808", glow: "rgba(200,150,40,0.50)" },
    "region:duviri":         { base: "#607090", light: "#88a0c0", dark: "#182030", glow: "rgba(100,130,170,0.40)" },
    "region:sanctuary":      { base: "#409880", light: "#68c8a8", dark: "#104028", glow: "rgba(60,170,140,0.45)" },
    "region:hollvania":      { base: "#507060", light: "#789090", dark: "#182820", glow: "rgba(80,120,100,0.38)" },
    "region:dark_refractory_deimos": { base: "#806048", light: "#b09070", dark: "#302010", glow: "rgba(150,110,80,0.38)" },
};
const DEFAULT_PLANET_COLOR = { base: "#507090", light: "#80a0c0", dark: "#182030", glow: "rgba(80,120,170,0.40)" };

function planetGradId(planetId: string): string {
    return `pg_${String(planetId).replace(/[^a-z0-9]/gi, "_")}`;
}

// Stable star field (precomputed at module load so it never flickers).
const STARFIELD: Array<{ x: number; y: number; r: number; o: number }> = (() => {
    const out: Array<{ x: number; y: number; r: number; o: number }> = [];
    let s = 0xf3a1b5c7;
    const rand = () => {
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0;
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0;
        return (s >>> 0) / 4294967296;
    };
    for (let i = 0; i < 200; i++) {
        out.push({
            x: WORLD_MIN - 15 + rand() * (WORLD_MAX - WORLD_MIN + 30),
            y: WORLD_MIN - 15 + rand() * (WORLD_MAX - WORLD_MIN + 30),
            r: 0.08 + rand() * 0.24,
            o: 0.15 + rand() * 0.72,
        });
    }
    return out;
})();

function clampViewBox(vb: ViewBox): ViewBox {
    const margin = 10;

    // Allow MUCH deeper zoom-in than before.
    // scale = 100 / vb.w, so vb.w=3 => ~3333% max.
    const minW = 3;
    const maxW = WORLD_MAX - WORLD_MIN + margin * 2;

    const w = clamp(vb.w, minW, maxW);
    const h = clamp(vb.h, minW, maxW);

    const minX = WORLD_MIN - margin;
    const minY = WORLD_MIN - margin;
    const maxX = WORLD_MAX + margin - w;
    const maxY = WORLD_MAX + margin - h;

    const x = clamp(vb.x, minX, maxX);
    const y = clamp(vb.y, minY, maxY);

    return { x, y, w, h };
}

function vbZoomAt(vb: ViewBox, worldPt: { x: number; y: number }, zoomFactor: number): ViewBox {
    const nextW = vb.w * zoomFactor;
    const nextH = vb.h * zoomFactor;

    const rx = (worldPt.x - vb.x) / vb.w;
    const ry = (worldPt.y - vb.y) / vb.h;

    const nextX = worldPt.x - rx * nextW;
    const nextY = worldPt.y - ry * nextH;

    return clampViewBox({ x: nextX, y: nextY, w: nextW, h: nextH });
}

function viewBoxToScale(vb: ViewBox): number {
    return 100 / vb.w;
}

function nodeRevealAlpha(scale: number): number {
    // Wider window (0.9 → 2.5) so the disk grows gradually rather than popping in.
    const a = (scale - 1.55) / 2.5;
    return clamp(a, 0, 1);
}

type PlanetLayout = { planet: StarChartPlanet; x: number; y: number; r: number };

function getPlanetRadius(p: StarChartPlanet): number {
    // Doubled vs original sizing.
    if (p.kind === "planet") return 4.2;
    if (p.kind === "region") return 3.8;
    return 3.2;
}

type NodeGroupKind = "all" | "base" | "mission_rewards" | "caches" | "extra" | "other";

type NodeGroup = {
    key: string;
    planetId: PlanetId;
    displayName: string;
    baseNodeId: NodeId;
    kinds: Partial<Record<Exclude<NodeGroupKind, "all">, NodeId[]>>;
};

function baseKeyFromNode(n: StarChartNode): string {
    const id = String(n.id);
    const stripId = id.replace(/-(caches)$/i, "").replace(/-(extra)$/i, "");

    const nm = String(n.name ?? "");
    const stripName = nm
        .replace(/\s*\(Caches\)\s*$/i, "")
        .replace(/\s*\(Extra\)\s*$/i, "")
        .replace(/\s*\(Mission Rewards\)\s*$/i, "");

    return `${String(n.planetId)}::${stripId}::${stripName}`;
}

function displayNameFromBase(n: StarChartNode): string {
    return String(n.name ?? "").replace(/\s*\((Caches|Extra|Mission Rewards)\)\s*$/i, "").trim();
}

function parseNodeVariant(n: StarChartNode): { baseKey: string; kind: Exclude<NodeGroupKind, "all"> } {
    const name = (n.name ?? "").toLowerCase();
    const id = String(n.id);

    if (id.includes("-(caches)") || name.includes("(caches)")) return { baseKey: baseKeyFromNode(n), kind: "caches" };
    if (id.includes("-(extra)") || name.includes("(extra)")) return { baseKey: baseKeyFromNode(n), kind: "extra" };
    if (name.includes("(mission rewards)") || name.includes("mission rewards")) return { baseKey: baseKeyFromNode(n), kind: "mission_rewards" };

    return { baseKey: baseKeyFromNode(n), kind: "base" };
}

type NodeLayout = {
    group: NodeGroup;
    cx: number;
    cy: number;
    r: number;
    lx: number;
    ly: number;
    lAnchor: "start" | "end";
};

type TabSpec = {
    kind: NodeGroupKind;
    label: string;
    nodeId: NodeId | null;
    dropSources: string[];
    dropSourceDetails: Array<{ sid: string; label: string }>;
    items: ItemRow[];
};

function computeItemsForSources(args: { dropSources: string[]; sourceToItemsIndex: Record<string, ItemRow[]> }): ItemRow[] {
    const { dropSources, sourceToItemsIndex } = args;

    const acc: ItemRow[] = [];
    for (const sid of dropSources) {
        const rows = sourceToItemsIndex[sid] ?? [];
        acc.push(...rows);
    }

    // First: dedupe by catalogId (exact duplicates from multiple sources)
    const seenCatalog = new Set<string>();
    const uniqByCatalog: ItemRow[] = [];
    for (const r of acc) {
        if (seenCatalog.has(r.catalogId)) continue;
        seenCatalog.add(r.catalogId);
        uniqByCatalog.push(r);
    }

    // Second: dedupe by display name (collapses "same item" represented by multiple catalogIds)
    const uniqByName = dedupeItemsByName(uniqByCatalog);

    return uniqByName;
}

function tabLabel(kind: NodeGroupKind): string {
    if (kind === "all") return "All";
    if (kind === "base") return "Drops";
    if (kind === "mission_rewards") return "Mission Rewards";
    if (kind === "caches") return "Caches";
    if (kind === "extra") return "Extra";
    return "Other";
}

function pickNodeIdForTab(group: NodeGroup | null, tab: NodeGroupKind): NodeId | null {
    if (!group) return null;
    if (tab === "all") return group.baseNodeId;

    const ids = group.kinds[tab as Exclude<NodeGroupKind, "all">] ?? [];
    if (ids && ids.length) return ids[0] ?? null;

    if (tab === "base") return group.baseNodeId;
    return group.baseNodeId;
}

function isMissionRewardSourceId(sid: string): boolean {
    return sid.startsWith("data:missionreward/");
}

/**
 * Source filtering is ONLY for missionreward separation:
 * - Mission Rewards tab: missionreward/*
 * - All other tabs: exclude missionreward/*
 *
 * USER REQUESTED CHANGE:
 * Combine "Mission Rewards" + what used to be "Extra" into the Mission Rewards pill.
 * That means Mission Rewards shows ALL sources (missionreward/* + non-missionreward/*),
 * and the Extra pill should be effectively empty/hidden.
 */
function filterSourcesForTab(kind: NodeGroupKind, sids: string[]): string[] {
    if (kind === "mission_rewards") return sids; // <-- combined (Mission Rewards + Extra)
    if (kind === "all") return sids;
    if (kind === "extra") return []; // <-- effectively removed
    return sids.filter((s) => !isMissionRewardSourceId(s));
}

/**
 * Mission Rewards relics: collapse variants (Intact/Exceptional/Flawless/Radiant) into just the relic name.
 * BUT: do NOT allow "Lith" (generic era) to appear as a mission reward row.
 */
function missionRewardRelicDisplayName(name: string): string {
    const s0 = String(name ?? "").replace(/\s+/g, " ").trim();
    if (!s0) return s0;

    // If it looks like a relic name, keep ONLY "Era Code" (e.g., "Lith D7"), dropping everything else.
    // This catches: "Lith D7", "Lith D7 Radiant", "Lith D7 (Radiant)", "Lith D7 Relic Radiant", etc.
    const m = s0.match(/\b(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]{1,6})\b/);
    if (m) {
        const eraRaw = m[1];
        const code = m[2];

        const era = eraRaw.charAt(0).toUpperCase() + eraRaw.slice(1).toLowerCase();
        return `${era} ${code.toUpperCase()}`;
    }

    // If it DOESN'T have an era+code token, don't try to "fix" it into an era.
    // (This is what would otherwise allow generic "Lith" / "Lith Relic" to sneak in.)
    return s0;
}

function normalizeMissionRewardItemsForDisplay(items: ItemRow[]): ItemRow[] {
    const mapped: ItemRow[] = items.map((it) => ({
        ...it,
        name: missionRewardRelicDisplayName(it.name)
    }));

    // Drop generic era-only mission reward rows: "Lith", "Meso", "Neo", "Axi" and also "* Relic".
    const genericEraOnly = /^(Lith|Meso|Neo|Axi)$/i;
    const genericEraRelic = /^(Lith|Meso|Neo|Axi)\s+Relic$/i;

    const filtered = mapped.filter((it) => {
        const n = it.name.trim();
        if (genericEraOnly.test(n)) return false;
        if (genericEraRelic.test(n)) return false;
        return true;
    });

    // Dedupe after collapsing names.
    return dedupeItemsByName(filtered);
}

function buildTabSpecRaw(args: { group: NodeGroup; kind: NodeGroupKind; sourceToItemsIndex: Record<string, ItemRow[]> }): TabSpec {
    const { group, kind, sourceToItemsIndex } = args;

    const nodeId = pickNodeIdForTab(group, kind);

    const rawSources = !nodeId
        ? []
        : getDropSourcesForStarChartNode(nodeId)
              .map((sid) => safeNormalizeSourceId(sid))
              .filter((x): x is string => Boolean(x));

    const dropSources = filterSourcesForTab(kind, rawSources);

    const dropSourceDetails = dropSources.map((sid) => ({
        sid,
        label: SOURCE_INDEX[sid as any]?.label ?? "(missing from SOURCE_INDEX)"
    }));

    const items = computeItemsForSources({ dropSources, sourceToItemsIndex });

    return {
        kind,
        label: tabLabel(kind),
        nodeId,
        dropSources,
        dropSourceDetails,
        items
    };
}

/**
 * Enforce "respective pill only" behavior:
 * - Items should appear in exactly one of: Mission Rewards, Caches, Extra, Drops.
 * - Priority order: mission_rewards -> caches -> extra -> base.
 * - All tab is a union of the full set (no exclusivity).
 *
 * NOTE: Exclusivity is enforced by *normalized display name* (not catalogId) so you don't
 * see the "same item" repeated across pills.
 *
 * USER REQUESTED CHANGE:
 * Extra is removed (its content is now in Mission Rewards). So we should NOT reserve items
 * for Extra anymore. Treat Extra as empty.
 */
function applyExclusiveAssignment(specs: TabSpec[]): TabSpec[] {
    const byKind = new Map<NodeGroupKind, TabSpec>();
    for (const s of specs) byKind.set(s.kind, s);

    const mr = byKind.get("mission_rewards") ?? null;
    const caches = byKind.get("caches") ?? null;
    const base = byKind.get("base") ?? null;
    const all = byKind.get("all") ?? null;

    const mrSet = new Set<string>((mr?.items ?? []).map((x) => itemNameKey(x.name)));
    const cachesSetRaw = new Set<string>((caches?.items ?? []).map((x) => itemNameKey(x.name)));
    const baseSetRaw = new Set<string>((base?.items ?? []).map((x) => itemNameKey(x.name)));

    const cachesSet = new Set<string>();
    for (const k of cachesSetRaw) {
        if (!k) continue;
        if (mrSet.has(k)) continue;
        cachesSet.add(k);
    }

    const baseSet = new Set<string>();
    for (const k of baseSetRaw) {
        if (!k) continue;
        if (mrSet.has(k)) continue;
        if (cachesSet.has(k)) continue;
        baseSet.add(k);
    }

    function filterItems(items: ItemRow[], keep: Set<string>): ItemRow[] {
        const out = items.filter((x) => keep.has(itemNameKey(x.name)));
        return dedupeItemsByName(out);
    }

    const outSpecs: TabSpec[] = [];

    for (const s of specs) {
        if (s.kind === "mission_rewards") {
            outSpecs.push({ ...s, items: dedupeItemsByName(s.items) });
            continue;
        }
        if (s.kind === "caches") {
            outSpecs.push({ ...s, items: filterItems(s.items, cachesSet) });
            continue;
        }
        if (s.kind === "extra") {
            outSpecs.push({ ...s, items: [] });
            continue;
        }
        if (s.kind === "base") {
            outSpecs.push({ ...s, items: filterItems(s.items, baseSet) });
            continue;
        }
        if (s.kind === "all" && all) {
            outSpecs.push({ ...s, items: dedupeItemsByName(s.items) });
            continue;
        }
        outSpecs.push({ ...s, items: dedupeItemsByName(s.items) });
    }

    return outSpecs;
}

function StarChartMap(props: {
    isInModal: boolean;
    vb: ViewBox;
    setVb: React.Dispatch<React.SetStateAction<ViewBox>>;
    selectedPlanetId: PlanetId | null;
    setSelectedPlanetId: React.Dispatch<React.SetStateAction<PlanetId | null>>;
    selectedPlanetName: string | null;
    selectedGroupKey: string | null;
    setSelectedGroupKey: React.Dispatch<React.SetStateAction<string | null>>;
    selectedTab: NodeGroupKind;
    setSelectedTab: React.Dispatch<React.SetStateAction<NodeGroupKind>>;
    selectedGroupDisplayName: string | null;
    tabsForPanel: TabSpec[];
    activeTab: TabSpec | null;
    focusedTitle: string | null;
    showDropsPanel: boolean;
    /** 6.5: Junction inspector — populated when the selected node is a junction */
    junctionNode: StarChartNode | null;
    /** 4.4: Base node ID for the selected group (for node completion tracking) */
    selectedGroupBaseNodeId: NodeId | null;
}) {
    const {
        isInModal,
        vb,
        setVb,
        selectedPlanetId,
        setSelectedPlanetId,
        selectedPlanetName,
        selectedGroupKey,
        setSelectedGroupKey,
        selectedTab,
        setSelectedTab,
        selectedGroupDisplayName,
        tabsForPanel,
        activeTab,
        focusedTitle,
        showDropsPanel,
        junctionNode,
        selectedGroupBaseNodeId
    } = props;

    // 6.5: Build prereq label index for junction inspector
    const prereqLabelIndex = useMemo(() => {
        const m: Record<string, string> = {};
        for (const d of PREREQ_REGISTRY) {
            m[d.id] = d.label;
        }
        return m;
    }, []);

    // 6.5: Derive unlocked planet name for junction node
    const planetsById = useMemo(() => {
        const m = new Map<string, StarChartPlanet>();
        for (const p of STAR_CHART_DATA.planets) m.set(p.id, p);
        return m;
    }, []);

    // 4.4: Per-node completion tracking
    const setNodeCompleted = useTrackerStore((s) => s.setNodeCompleted);
    const nodeCompletedMap = useTrackerStore((s) => s.state.missions?.nodeCompleted ?? EMPTY_NODE_COMPLETED);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const vbRef = useRef<ViewBox>(vb);
    useEffect(() => {
        vbRef.current = vb;
    }, [vb]);

    // Smooth zoom animation: lerp current vb toward a target vb.
    const zoomAnimTargetRef = useRef<ViewBox | null>(null);
    const zoomAnimRafRef = useRef<number | null>(null);

    function cancelZoomAnim() {
        if (zoomAnimRafRef.current !== null) {
            cancelAnimationFrame(zoomAnimRafRef.current);
            zoomAnimRafRef.current = null;
        }
        zoomAnimTargetRef.current = null;
    }

    function animateToVb(target: ViewBox) {
        zoomAnimTargetRef.current = target;
        if (zoomAnimRafRef.current !== null) return; // loop already running

        const SPRING = 0.011; // exponential decay rate — higher = snappier
        let lastT = 0;

        const step = (t: number) => {
            zoomAnimRafRef.current = null;
            const dt = lastT ? Math.min(t - lastT, 64) : 16;
            lastT = t;

            const tgt = zoomAnimTargetRef.current;
            if (!tgt) return;

            const cur = vbRef.current;
            const alpha = 1 - Math.exp(-SPRING * dt);

            const nx = lerp(cur.x, tgt.x, alpha);
            const ny = lerp(cur.y, tgt.y, alpha);
            const nw = lerp(cur.w, tgt.w, alpha);
            const nh = lerp(cur.h, tgt.h, alpha);

            // Stop animating once within 0.3 world-units of target
            if (Math.abs(nw - tgt.w) < 0.3 && Math.abs(nx - tgt.x) < 0.3 && Math.abs(ny - tgt.y) < 0.3) {
                setVb(tgt);
                zoomAnimTargetRef.current = null;
                return;
            }

            setVb(clampViewBox({ x: nx, y: ny, w: nw, h: nh }));
            zoomAnimRafRef.current = requestAnimationFrame(step);
        };

        zoomAnimRafRef.current = requestAnimationFrame(step);
    }

    // If the pointer moved enough to be considered a drag, suppress all click handlers for this gesture.
    const suppressClickRef = useRef<boolean>(false);

    const [boundsTick, setBoundsTick] = useState(0);

    // cache pixel size of the SVG
    const [svgSize, setSvgSize] = useState<{ w: number; h: number } | null>(null);

    // hide heavy HTML labels while dragging
    const [isDragging, setIsDragging] = useState(false);

    // Panel UX state (end-user friendly)
    const [showDebugSources, setShowDebugSources] = useState(false);
    const [itemFilter, setItemFilter] = useState("");

    useEffect(() => {
        // When node selection changes, reset UX state
        setShowDebugSources(false);
        setItemFilter("");
    }, [selectedGroupKey, selectedTab]);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const update = () => {
            setBoundsTick((x) => x + 1);
            const r = svg.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) setSvgSize({ w: r.width, h: r.height });
        };

        update();

        const ro = new ResizeObserver(() => update());
        ro.observe(svg);
        return () => ro.disconnect();
    }, []);

    const scale = useMemo(() => viewBoxToScale(vb), [vb]);
    const revealRaw = useMemo(() => nodeRevealAlpha(scale), [scale]);
    const reveal = useMemo(() => smoothstep01(revealRaw), [revealRaw]);

    const groupedByPlanet = useMemo(() => {
        const out = new Map<string, NodeGroup[]>();

        for (const n of STAR_CHART_DATA.nodes) {
            const pid = String(n.planetId);
            const v = parseNodeVariant(n);
            const key = v.baseKey;

            if (!out.has(pid)) out.set(pid, []);
            const arr = out.get(pid)!;

            let g = arr.find((x) => x.key === key) ?? null;
            if (!g) {
                g = {
                    key,
                    planetId: n.planetId,
                    displayName: displayNameFromBase(n),
                    baseNodeId: n.id,
                    kinds: {}
                };
                arr.push(g);
            }

            if (!g.kinds[v.kind]) g.kinds[v.kind] = [];
            g.kinds[v.kind]!.push(n.id);

            if (v.kind === "base") g.baseNodeId = n.id;
        }

        for (const [pid, arr] of out.entries()) {
            arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
            out.set(pid, arr);
        }

        return out;
    }, []);

    const sortedPlanets = useMemo(() => {
        const arr = [...STAR_CHART_DATA.planets];
        arr.sort((a, b) => a.sortOrder - b.sortOrder);
        return arr;
    }, []);

    // Kuva Fortress: initialise phase from real time so it's at an approximate
    // position on first render, then animate at the correct 50-hour rate.
    const [kuvaPhase, setKuvaPhase] = useState<number>(
        () => ((Date.now() % KUVA_PERIOD_MS) / KUVA_PERIOD_MS) * Math.PI * 2
    );
    useEffect(() => {
        let raf: number | null = null;
        let last = 0;
        const step = (t: number) => {
            if (!last) last = t;
            const dt = Math.min(64, t - last);
            last = t;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setKuvaPhase((prev) => prev + dt * KUVA_RAD_PER_MS);
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => {
            if (raf) cancelAnimationFrame(raf);
        };
    }, [KUVA_RAD_PER_MS]);

    const overviewPlanets = useMemo((): PlanetLayout[] => {
        const filtered = sortedPlanets.filter((p) => isInMainMap(p));
        const out: PlanetLayout[] = [];

        for (const p of filtered) {
            const manual = MANUAL_POS[p.id];

            const fallbackAngle = hashToUnitFloat(p.id) * Math.PI * 2;
            const fallbackRadius = p.kind === "planet" ? 34 : 41;
            const fx = 50 + Math.cos(fallbackAngle) * fallbackRadius;
            const fy = 50 + Math.sin(fallbackAngle) * fallbackRadius;

            let x0 = manual?.x ?? fx;
            let y0 = manual?.y ?? fy;

            if (p.id === "region:kuva_fortress") {
                // Kuva Fortress orbits the chart centre.  At MAP_POS_SCALE=3.5
                // orbitR=9.8 manual → 34.3 world, safely between Mercury (24.8)
                // and Venus (45.5) — minimum clearance ~9.5 world > 8.4 sum of
                // base radii, so disks never overlap at any phase.
                const orbitR = 9.8;
                x0 = MAP_CENTER.x + Math.cos(kuvaPhase) * orbitR;
                y0 = MAP_CENTER.y + Math.sin(kuvaPhase) * orbitR;
            }

            const scaled = mapScalePos({ x: x0, y: y0 });
            out.push({ planet: p, x: scaled.x, y: scaled.y, r: getPlanetRadius(p) });
        }

        return out;
    }, [sortedPlanets, kuvaPhase]);

    // Fast lookup for click-to-zoom
    const planetCenterById = useMemo(() => {
        const m = new Map<string, { x: number; y: number; r: number }>();
        for (const pl of overviewPlanets) {
            m.set(pl.planet.id, { x: pl.x, y: pl.y, r: pl.r });
        }
        return m;
    }, [overviewPlanets]);

    // Lines between planets derived from junction nodes — shown in the overview layer.
    const junctionEdges = useMemo(() => {
        const out: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [];
        for (const node of STAR_CHART_DATA.nodes) {
            if (node.nodeType !== "junction" || !node.unlocksPlanetId) continue;
            const from = planetCenterById.get(node.planetId);
            const to = planetCenterById.get(node.unlocksPlanetId);
            if (!from || !to) continue;
            out.push({ from, to });
        }
        return out;
    }, [planetCenterById]);

    function svgPointFromClient(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
        const svg = svgRef.current;
        if (!svg) return null;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;

        const ctm = svg.getScreenCTM();
        if (!ctm) return null;

        const inv = ctm.inverse();
        const out = pt.matrixTransform(inv);
        return { x: out.x, y: out.y };
    }

    // IMPORTANT: our overlay is in the *SVG element's pixel box*, while the SVG viewBox uses preserveAspectRatio="xMidYMid meet".
    // That means there can be letterboxing padding. This projection matches the SVG renderer exactly.
    function worldToOverlayPx(world: { x: number; y: number }): { x: number; y: number } | null {
        const s = svgSize;
        if (!s) return null;

        const scalePx = Math.min(s.w / vb.w, s.h / vb.h);
        const padX = (s.w - vb.w * scalePx) / 2;
        const padY = (s.h - vb.h * scalePx) / 2;

        const x = padX + (world.x - vb.x) * scalePx;
        const y = padY + (world.y - vb.y) * scalePx;

        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return { x, y };
    }

    // Pan (throttled to rAF to reduce drag lag)
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        let pointerDown = false;
        let startClient: { x: number; y: number } | null = null;
        let startVb: ViewBox | null = null;
        let didStartDragging = false;

        let rafId: number | null = null;
        let pendingVb: ViewBox | null = null;

        function flush() {
            rafId = null;
            if (!pendingVb) return;
            setVb(pendingVb);
            pendingVb = null;
        }

        const DRAG_START_PX = 4;

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;

            pointerDown = true;
            didStartDragging = false;
            suppressClickRef.current = false;

            startClient = { x: e.clientX, y: e.clientY };
            startVb = vbRef.current;
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!pointerDown || !startClient || !startVb) return;

            const dxPx = e.clientX - startClient.x;
            const dyPx = e.clientY - startClient.y;

            if (!didStartDragging) {
                const dist = Math.sqrt(dxPx * dxPx + dyPx * dyPx);
                if (dist < DRAG_START_PX) return;

                didStartDragging = true;
                suppressClickRef.current = true;
                cancelZoomAnim();
                setIsDragging(true);

                try {
                    svg.setPointerCapture(e.pointerId);
                } catch {
                    // ignore
                }
            }

            const rect = svg.getBoundingClientRect();
            const dxWorld = (dxPx / rect.width) * startVb.w;
            const dyWorld = (dyPx / rect.height) * startVb.h;

            pendingVb = clampViewBox({ ...startVb, x: startVb.x - dxWorld, y: startVb.y - dyWorld });

            if (rafId == null) {
                rafId = requestAnimationFrame(flush);
            }
        };

        const endDrag = (e: PointerEvent) => {
            if (!pointerDown) return;

            pointerDown = false;

            if (didStartDragging) {
                setIsDragging(false);
            }

            startClient = null;
            startVb = null;

            if (rafId != null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            if (pendingVb) {
                setVb(pendingVb);
                pendingVb = null;
            }

            if (didStartDragging) {
                try {
                    svg.releasePointerCapture(e.pointerId);
                } catch {
                    // ignore
                }
            }
        };

        svg.addEventListener("pointerdown", onPointerDown);
        svg.addEventListener("pointermove", onPointerMove);
        svg.addEventListener("pointerup", endDrag);
        svg.addEventListener("pointercancel", endDrag);
        svg.addEventListener("pointerleave", endDrag);
        svg.addEventListener("pointerleave", endDrag);

        return () => {
            if (rafId != null) cancelAnimationFrame(rafId);
            svg.removeEventListener("pointerdown", onPointerDown);
            svg.removeEventListener("pointermove", onPointerMove);
            svg.removeEventListener("pointerup", endDrag);
            svg.removeEventListener("pointercancel", endDrag);
            svg.removeEventListener("pointerleave", endDrag);
            svg.removeEventListener("pointerleave", endDrag);
        };
    }, [setVb]);

    // Wheel zoom
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const p = svgPointFromClient(e);
            if (!p) return;

            // Cancel any smooth click-zoom so scroll feels immediate.
            cancelZoomAnim();

            const delta = clamp(e.deltaY, -180, 180);
            const factor = delta < 0 ? 1 / 1.18 : 1.18;

            setVb((prev) => vbZoomAt(prev, p, factor));
        };

        svg.addEventListener("wheel", onWheel, { passive: false });
        return () => svg.removeEventListener("wheel", onWheel as any);
    }, [setVb]);

    // Clear selection when zoomed out.
    useEffect(() => {
        if (scale <= 1.10 && selectedPlanetId) {
            setSelectedPlanetId(null);
            setSelectedGroupKey(null);
        }
    }, [scale, selectedPlanetId, setSelectedPlanetId, setSelectedGroupKey]);

    // Keep nodes/lines from getting “noisy” as you zoom further in.
    const nodeDotR = useMemo(() => {
        const r = 0.86 / scale;
        return clamp(r, 0.16, 0.36);
    }, [scale]);

    const lineStroke = useMemo(() => {
        // Keep lines thin as scale increases (but never disappear).
        return clamp(0.20 / scale, 0.06, 0.14);
    }, [scale]);

    const lineStrokeHi = useMemo(() => {
        return clamp(0.28 / scale, 0.08, 0.18);
    }, [scale]);

    const circleStroke = useMemo(() => {
        return clamp(0.42 / scale, 0.12, 0.28);
    }, [scale]);

    const nodeStroke = useMemo(() => {
        return clamp(0.30 / scale, 0.10, 0.20);
    }, [scale]);

    const edgesById = useMemo(() => {
        const m = new Map<string, string[]>();
        for (const n of STAR_CHART_DATA.nodes as any[]) {
            const id = String(n.id);
            const edges = Array.isArray(n.edges) ? n.edges.map(String) : [];
            m.set(id, edges);
        }
        return m;
    }, []);

    function nodeManualLocal(n: StarChartNode): { x: number; y: number } | null {
        const anyN = n as any;
        const p = anyN?.pos;
        if (!p) return null;
        const x = typeof p.x === "number" ? p.x : Number(p.x);
        const y = typeof p.y === "number" ? p.y : Number(p.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return { x, y };
    }

    function getNodeRecordById(id: NodeId): StarChartNode | null {
        const n = (STAR_CHART_DATA.nodes as StarChartNode[]).find((x) => x.id === id);
        return n ?? null;
    }

    function groupBaseNode(group: NodeGroup): StarChartNode | null {
        return getNodeRecordById(group.baseNodeId);
    }

    const expandedRadiusByPlanetId = useMemo(() => {
        const out = new Map<string, number>();

        // World is now 420 units wide; cap disk radius so isolated planets don't
        // dominate the screen and close pairs stay comfortably separate.
        const desired = clamp(vb.w * 0.28, 10.0, 26.0);

        for (let i = 0; i < overviewPlanets.length; i++) {
            const a = overviewPlanets[i];

            let minDist = Infinity;
            for (let j = 0; j < overviewPlanets.length; j++) {
                if (i === j) continue;
                const b = overviewPlanets[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < minDist) minDist = d;
            }

            // Use the planet's own base radius as the minimum cap so that when
            // Kuva Fortress (or any two closely-spaced planets) approaches,
            // their disks never visually overlap — Math.max(8) was too large
            // for the ~12-world-unit closest approach Kuva makes to Earth.
            const padBetween = 4.0;
            const neighborCap = Number.isFinite(minDist) ? Math.max(a.r, minDist / 2 - padBetween) : desired;

            out.set(a.planet.id, Math.min(desired, neighborCap));
        }

        return out;
    }, [overviewPlanets, vb.w]);

    function computePlanetNodeLayout(args: {
        planetId: PlanetId;
        planetCx: number;
        planetCy: number;
        diskR: number;
        groups: NodeGroup[];
    }): { layouts: NodeLayout[]; links: Array<{ a: NodeLayout; b: NodeLayout }> } {
        const { planetCx: cx, planetCy: cy, diskR, groups } = args;

        if (!groups.length) return { layouts: [], links: [] };

        const clusterR = diskR * 0.92;

        const pts: Array<{
            group: NodeGroup;
            x: number;
            y: number;
            r: number;
            hasManual: boolean;
        }> = [];

        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            const base = groupBaseNode(g);
            const manual = base ? nodeManualLocal(base) : null;

            if (manual) {
                const mx = clamp(manual.x, -0.98, 0.98);
                const my = clamp(manual.y, -0.98, 0.98);
                pts.push({
                    group: g,
                    x: cx + mx * diskR,
                    y: cy + my * diskR,
                    r: nodeDotR,
                    hasManual: true
                });
                continue;
            }

            const a = (i / Math.max(1, groups.length)) * Math.PI * 2;
            const r0 = clusterR * (0.48 + 0.48 * hashToUnitFloat(g.key + ":r"));
            pts.push({
                group: g,
                x: cx + Math.cos(a) * r0,
                y: cy + Math.sin(a) * r0,
                r: nodeDotR,
                hasManual: false
            });
        }

        const steps = 70;
        const padding = nodeDotR * 3.1;
        const pull = 0.008;

        for (let s = 0; s < steps; s++) {
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                if (a.hasManual) continue;

                const dx0 = a.x - cx;
                const dy0 = a.y - cy;
                a.x -= dx0 * pull;
                a.y -= dy0 * pull;

                for (let j = 0; j < pts.length; j++) {
                    if (i === j) continue;
                    const b = pts[j];

                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
                    const minD = a.r + b.r + padding;

                    if (d < minD) {
                        const push = (minD - d) * 0.42;
                        const ux = dx / d;
                        const uy = dy / d;

                        const wA = b.hasManual ? 1.0 : 0.5;
                        const wB = b.hasManual ? 0.0 : 0.5;

                        a.x += ux * push * wA;
                        a.y += uy * push * wA;

                        b.x -= ux * push * wB;
                        b.y -= uy * push * wB;
                    }
                }
            }
        }

        const layouts: NodeLayout[] = pts.map((p) => {
            const ang = Math.atan2(p.y - cy, p.x - cx);
            const preferRight = Math.cos(ang) >= 0;

            const labelDist = nodeDotR * 3.1;
            const lxA = p.x + (preferRight ? labelDist : -labelDist);
            const lyA = p.y;

            const altRight = !preferRight;
            const lxB = p.x + (altRight ? labelDist : -labelDist);
            const lyB = p.y;

            function penalty(lx: number, ly: number): number {
                let pen = 0;
                for (const q of pts) {
                    const dx = lx - q.x;
                    const dy = ly - q.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    const minD = q.r + nodeDotR * 3.4;
                    if (d < minD) pen += minD - d;
                }
                return pen;
            }

            const pA = penalty(lxA, lyA);
            const pB = penalty(lxB, lyB);

            const useRight = pA <= pB ? preferRight : altRight;

            return {
                group: p.group,
                cx: p.x,
                cy: p.y,
                r: p.r,
                lx: p.x + (useRight ? labelDist : -labelDist),
                ly: p.y,
                lAnchor: useRight ? "start" : "end"
            };
        });

        const groupByBaseNodeId = new Map<string, NodeGroup>();
        for (const g of groups) groupByBaseNodeId.set(String(g.baseNodeId), g);

        const byKey = new Map<string, NodeLayout>();
        for (const l of layouts) byKey.set(l.group.key, l);

        const outLinks: Array<{ a: NodeLayout; b: NodeLayout }> = [];

        for (const l of layouts) {
            const aBaseId = String(l.group.baseNodeId);
            const edges = edgesById.get(aBaseId) ?? [];
            for (const toId of edges) {
                const toGroup = groupByBaseNodeId.get(String(toId));
                if (!toGroup) continue;
                const b = byKey.get(toGroup.key);
                if (!b) continue;
                outLinks.push({ a: l, b });
            }
        }

        const seen = new Set<string>();
        const uniq: Array<{ a: NodeLayout; b: NodeLayout }> = [];
        for (const e of outLinks) {
            const k1 = `${e.a.group.key}=>${e.b.group.key}`;
            const k2 = `${e.b.group.key}=>${e.a.group.key}`;
            if (seen.has(k1) || seen.has(k2)) continue;
            seen.add(k1);
            uniq.push(e);
        }

        return { layouts, links: uniq };
    }

    const zoomedPlanetLayers = useMemo(() => {
        if (reveal <= 0.01) {
            return [] as Array<{
                planet: StarChartPlanet;
                cx: number;
                cy: number;
                baseR: number;
                diskR: number;
                grownR: number;
                clipId: string;
                layouts: NodeLayout[];
                links: Array<{ a: NodeLayout; b: NodeLayout }>;
            }>;
        }

        const out: Array<{
            planet: StarChartPlanet;
            cx: number;
            cy: number;
            baseR: number;
            diskR: number;
            grownR: number;
            clipId: string;
            layouts: NodeLayout[];
            links: Array<{ a: NodeLayout; b: NodeLayout }>;
        }> = [];

        for (const pl of overviewPlanets) {
            const pid = pl.planet.id as PlanetId;
            const groups = groupedByPlanet.get(String(pid)) ?? [];
            const diskR = expandedRadiusByPlanetId.get(pid) ?? 18;
            const grownR = lerp(pl.r, diskR, reveal);

            const clipBase = String(pid).replace(/[^a-z0-9_:-]/gi, "_");
            const clipId = `clip_${clipBase}`;

            const { layouts, links } = computePlanetNodeLayout({
                planetId: pid,
                planetCx: pl.x,
                planetCy: pl.y,
                diskR,
                groups
            });

            out.push({
                planet: pl.planet,
                cx: pl.x,
                cy: pl.y,
                baseR: pl.r,
                diskR,
                grownR,
                clipId,
                layouts,
                links
            });
        }

        return out;
    }, [overviewPlanets, groupedByPlanet, expandedRadiusByPlanetId, reveal, nodeDotR, edgesById]);

    const canInteractPlanetNodes = reveal > 0.18;

    function zoomIntoPlanet(pid: PlanetId) {
        const c = planetCenterById.get(pid);
        if (!c) return;

        // Always zoom all the way in (vb.w=20 → scale=5 → past the full-reveal threshold).
        // This guarantees one click takes you from any zoom level straight to the node view.
        const zoomW = 20;
        animateToVb(clampViewBox({
            x: c.x - zoomW / 2,
            y: c.y - zoomW / 2,
            w: zoomW,
            h: zoomW
        }));
    }

    function onClickPlanet(pid: PlanetId) {
        if (suppressClickRef.current) return;

        setSelectedPlanetId(pid);
        setSelectedGroupKey(null);
        setSelectedTab("base");
        zoomIntoPlanet(pid);
    }

    function onClickGroup(pid: PlanetId, g: NodeGroup) {
        if (suppressClickRef.current) return;

        setSelectedPlanetId(pid);
        if (selectedGroupKey === g.key) {
            setSelectedGroupKey(null);
            setSelectedTab("base");
            return;
        }
        setSelectedGroupKey(g.key);
        setSelectedTab("base");
    }

    function onMapBackgroundClick() {
        if (suppressClickRef.current) return;

        setSelectedGroupKey(null);
        setSelectedTab("base");
    }

    // Global orbit rings (world-space radii from MAP_CENTER).
    // Five evenly-spaced rings from inner planets out to the edge — matches
    // the faint concentric circles visible in the in-game star chart.
    const orbitRings = useMemo(() => {
        const base = [8, 16, 24, 32, 40]; // × 5.0 = 40, 80, 120, 160, 200 world units
        return base.map((r) => r * MAP_POS_SCALE);
    }, []);

    // Radial sector spokes emanating from MAP_CENTER — the faint "pie-slice"
    // lines visible in the in-game star chart (12 spokes = every 30°).
    const sectorSpokes = useMemo(() => {
        const spokeLen = 200; // world units — long enough to reach map edges
        return Array.from({ length: 12 }, (_, i) => {
            const angle = (i * Math.PI * 2) / 12;
            return {
                x2: MAP_CENTER.x + Math.cos(angle) * spokeLen,
                y2: MAP_CENTER.y + Math.sin(angle) * spokeLen
            };
        });
    }, []);

    const overviewLayerOpacity = useMemo(() => clamp(1 - reveal * 1.15, 0, 1), [reveal]);


    // SCREEN-SPACE locked label: put it a fixed PX amount above the *screen-projected* circle top.
    function circleTopLabelPx(centerWorld: { x: number; y: number }, rWorld: number, padPx: number): { x: number; y: number } | null {
        const topPx = worldToOverlayPx({ x: centerWorld.x, y: centerWorld.y - rWorld });
        if (!topPx) return null;
        return { x: topPx.x, y: topPx.y - padPx };
    }

    const overviewPlanetLabelScreens = useMemo(() => {
        const out: Array<{ id: string; x: number; y: number; text: string; opacity: number }> = [];
        const padPx = 10;

        for (const pl of overviewPlanets) {
            const p = circleTopLabelPx({ x: pl.x, y: pl.y }, pl.r, padPx);
            if (!p) continue;
            out.push({
                id: pl.planet.id,
                x: p.x,
                y: p.y,
                text: pl.planet.name,
                opacity: 0.95 * overviewLayerOpacity
            });
        }

        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overviewPlanets, boundsTick, overviewLayerOpacity, vb, svgSize]);

    const zoomedPlanetLabelScreens = useMemo(() => {
        if (!canInteractPlanetNodes) return [];
        const out: Array<{ id: string; x: number; y: number; text: string; opacity: number }> = [];
        const padPx = 12;

        for (const zl of zoomedPlanetLayers) {
            const p = circleTopLabelPx({ x: zl.cx, y: zl.cy }, zl.grownR, padPx);
            if (!p) continue;
            out.push({
                id: zl.planet.id,
                x: p.x,
                y: p.y,
                text: zl.planet.name,
                opacity: reveal
            });
        }

        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoomedPlanetLayers, canInteractPlanetNodes, reveal, boundsTick, vb, svgSize]);

    const nodeLabelScreens = useMemo(() => {
        if (!canInteractPlanetNodes) return [];
        const out: Array<{ key: string; x: number; y: number; text: string; anchor: "start" | "end" }> = [];

        for (const zl of zoomedPlanetLayers) {
            for (const nd of zl.layouts) {
                const p = worldToOverlayPx({ x: nd.lx, y: nd.ly });
                if (!p) continue;
                out.push({
                    key: `${zl.planet.id}::${nd.group.key}`,
                    x: p.x,
                    y: p.y,
                    text: nd.group.displayName,
                    anchor: nd.lAnchor
                });
            }
        }

        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoomedPlanetLayers, canInteractPlanetNodes, boundsTick, vb, svgSize]);

    // Region resources are merged into Drops (base tab) for the selected planet.
    const regionResources = useMemo(() => {
        if (!selectedPlanetId || !selectedPlanetName) return [];
        return getRegionResourcesForPlanet(selectedPlanetId, selectedPlanetName);
    }, [selectedPlanetId, selectedPlanetName]);

    const mergedActiveItems = useMemo(() => {
        if (!activeTab) return [];
        if (activeTab.kind !== "base") return activeTab.items;

        const rrRows: ItemRow[] = regionResources.map((r) => ({
            catalogId: `region_resource:${String(selectedPlanetId)}:${r.name}`,
            name: r.name
        }));

        return dedupeItemsByName([...rrRows, ...activeTab.items]);
    }, [activeTab, regionResources, selectedPlanetId]);

    const filteredActiveItems = useMemo(() => {
        const q = itemFilter.trim().toLowerCase();
        if (!activeTab) return [];
        if (!q) return mergedActiveItems;

        return mergedActiveItems.filter((it) => it.name.toLowerCase().includes(q) || it.catalogId.toLowerCase().includes(q));
    }, [activeTab, itemFilter, mergedActiveItems]);

    return (
        <div className={["relative w-full", isInModal ? "h-full" : "h-[72vh] min-h-[560px]"].join(" ")}>
            {showDropsPanel && (
                <div className="absolute bottom-4 right-4 top-4 z-40 w-[520px] max-w-[42vw] pointer-events-none">
                    <div className="pointer-events-auto h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/55 backdrop-blur-sm">
                        <div className="h-full overflow-auto overscroll-contain p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-slate-100">
                                        {selectedGroupKey
                                            ? selectedGroupDisplayName
                                                ? `Node · ${selectedGroupDisplayName}`
                                                : "Node Drops / Rewards"
                                            : selectedPlanetName
                                               ? `Drops · ${selectedPlanetName}`
                                                : "Drops"}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-400">Click the selected node again to unselect.</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        className="rounded-lg border brder-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                                        onClick={() => {
                                            setSelectedGroupKey(null);
                                            setSelectedTab("base");
                                            setSelectedPlanetId(null);
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            {/* 6.5 Junction Inspector */}
                            {junctionNode && junctionNode.nodeType === "junction" && (
                                <div className="mt-3 rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-3 space-y-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Junction</div>

                                    {junctionNode.unlocksPlanetId && (
                                        <div>
                                            <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Unlocks</div>
                                            <div className="text-sm text-slate-200 font-semibold">
                                                {planetsById.get(junctionNode.unlocksPlanetId)?.name ?? junctionNode.unlocksPlanetId}
                                            </div>
                                        </div>
                                    )}

                                    {Array.isArray(junctionNode.prereqIds) && junctionNode.prereqIds.length > 0 && (
                                        <div>
                                            <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Requirements</div>
                                            <ul className="space-y-1">
                                                {junctionNode.prereqIds.map((pid) => (
                                                    <li key={pid} className="text-xs text-slate-300 flex items-center gap-1">
                                                        <span className="text-cyan-500">—</span>
                                                        {prereqLabelIndex[pid] ?? pid}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="text-[11px] text-slate-500">
                                        Completing this junction unlocks access to the next planet and its mission nodes.
                                    </div>
                                </div>
                            )}

                            {/* 4.4: Node completion toggle */}
                            {selectedGroupBaseNodeId && (
                                <div className="mt-3 flex items-center gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(nodeCompletedMap[selectedGroupBaseNodeId])}
                                            onChange={(e) => setNodeCompleted(selectedGroupBaseNodeId, e.target.checked)}
                                        />
                                        <span>Mark node as completed</span>
                                    </label>
                                </div>
                            )}

                            {selectedGroupKey && (
                                <>
                                    {tabsForPanel.length > 0 && (
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            {tabsForPanel.map((t) => {
                                                const active = t.kind === selectedTab;

                                                const count =
                                                    t.kind === "base"
                                                        ? dedupeItemsByName([
                                                              ...t.items,
                                                              ...regionResources.map((r) => ({
                                                                  catalogId: `region_resource:${String(selectedPlanetId)}:${r.name}`,
                                                                  name: r.name
                                                              }))
                                                          ]).length
                                                        : t.items.length;

                                                return (
                                                    <button
                                                        key={`tab-${t.kind}`}
                                                        className={[
                                                            "rounded-full px-3 py-1 text-xs border",
                                                            active
                                                                ? "bg-slate-100 text-slate-900 border-slate-100"
                                                                : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900"
                                                        ].join(" ")}
                                                        onClick={() => setSelectedTab(t.kind)}
                                                    >
                                                        {t.label}
                                                        <span className="ml-2 text-[10px] opacity-70">({count})</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <input
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                                            placeholder="Filter items by name or id…"
                                            value={itemFilter}
                                            onChange={(e) => setItemFilter(e.target.value)}
                                        />
                                        <div className="flex w-full items-center justify-between">
                                            <button className="text-slate-400 hover:text-slate-200" onClick={() => setShowDebugSources((v) => !v)}>
                                                {showDebugSources ? "Hide debug source ids" : "Show debug source ids"}
                                            </button>
                                            {activeTab && (
                                                <div className="text-xs text-slate-500">
                                                    Showing {filteredActiveItems.length} of {mergedActiveItems.length}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        {showDebugSources && (
                                            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                                <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Debug: SourceIds for this tab</div>
                                                {!activeTab || activeTab.dropSourceDetails.length === 0 ? (
                                                    <div className="text-sm text-slate-400">No sources mapped for this tab.</div>
                                                ) : (
                                                    <ul className="space-y-1">
                                                        {activeTab.dropSourceDetails.map((d) => (
                                                            <li key={d.sid} className="break-words text-xs text-slate-200">
                                                                <span className="font-mono">{d.sid}</span>
                                                                <span className="text-slate-500"> — {d.label}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Obtainable here</div>

                                            {!activeTab ? (
                                                <div className="text-sm text-slate-400">No tab selected.</div>
                                            ) : filteredActiveItems.length === 0 ? (
                                                <div className="text-sm text-slate-400">No items resolve for this tab in the current catalog mapping.</div>
                                            ) : (
                                                <div className="max-h-[520px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/30 p-2">
                                                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-200">
                                                        {filteredActiveItems.slice(0, 600).map((it) => (
                                                            <li key={it.catalogId} className="break-words">
                                                                <span className="font-semibold">{it.name}</span>
                                                                {/*<div className="mt-0.5 text-[11px] text-slate-500 font-mono">{it.catalogId}</div>*/}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {filteredActiveItems.length > 600 && (
                                                        <div className="mt-2 text-xs text-slate-500">Rendering capped at 600 items.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 select-none">
                <svg
                    ref={svgRef}
                    className="absolute inset-0 z-10 h-full w-full cursor-grab active:cursor-grabbing"
                    style={{ touchAction: "none" }}
                    viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
                    preserveAspectRatio="xMidYMid meet"
                    onClick={(e) => {
                        const t = e.target as HTMLElement | null;
                        if (t?.closest?.('[data-clickable="true"]')) return;
                        onMapBackgroundClick();
                    }}
                >
                    <defs>
                        {/* Nebula background gradients */}
                        <radialGradient id="bg0" cx="50%" cy="50%" r="70%">
                            <stop offset="0%" stopColor="rgba(20,40,110,0.24)" />
                            <stop offset="60%" stopColor="rgba(2,6,23,0.0)" />
                        </radialGradient>
                        <radialGradient id="bg1" cx="20%" cy="38%" r="56%">
                            <stop offset="0%" stopColor="rgba(50,20,150,0.18)" />
                            <stop offset="52%" stopColor="rgba(2,6,23,0.0)" />
                        </radialGradient>
                        <radialGradient id="bg2" cx="78%" cy="28%" r="54%">
                            <stop offset="0%" stopColor="rgba(20,60,170,0.16)" />
                            <stop offset="48%" stopColor="rgba(2,6,23,0.0)" />
                        </radialGradient>
                        <radialGradient id="bg3" cx="60%" cy="74%" r="46%">
                            <stop offset="0%" stopColor="rgba(90,20,130,0.13)" />
                            <stop offset="44%" stopColor="rgba(2,6,23,0.0)" />
                        </radialGradient>

                        {/* Sun glow at chart centre */}
                        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%"   stopColor="rgba(255,248,190,0.98)" />
                            <stop offset="30%"  stopColor="rgba(255,210,90,0.60)" />
                            <stop offset="65%"  stopColor="rgba(255,150,30,0.22)" />
                            <stop offset="100%" stopColor="rgba(255,100,0,0)" />
                        </radialGradient>

                        {/* Per-planet sphere gradients — highlight upper-left like a lit sphere */}
                        {STAR_CHART_DATA.planets.map((p) => {
                            const col = PLANET_COLORS[p.id] ?? DEFAULT_PLANET_COLOR;
                            const gId = planetGradId(p.id);
                            return (
                                <radialGradient key={gId} id={gId} cx="30%" cy="25%" r="72%">
                                    <stop offset="0%"   stopColor={col.light} stopOpacity={0.95} />
                                    <stop offset="48%"  stopColor={col.base}  stopOpacity={0.95} />
                                    <stop offset="100%" stopColor={col.dark}  stopOpacity={0.95} />
                                </radialGradient>
                            );
                        })}

                        {/* ClipPaths for zoomed planet disks */}
                        {zoomedPlanetLayers.map((zl) => (
                            <clipPath key={`clipdef-${zl.clipId}`} id={zl.clipId}>
                                <circle cx={zl.cx} cy={zl.cy} r={zl.diskR} />
                            </clipPath>
                        ))}
                    </defs>

                    {/* ── Deep-space background ──────────────────────────────────── */}
                    <rect x={WORLD_MIN - 80} y={WORLD_MIN - 80} width={WORLD_MAX - WORLD_MIN + 160} height={WORLD_MAX - WORLD_MIN + 160} fill="rgba(1,4,18,1)" />
                    <rect x={WORLD_MIN - 80} y={WORLD_MIN - 80} width={WORLD_MAX - WORLD_MIN + 160} height={WORLD_MAX - WORLD_MIN + 160} fill="url(#bg0)" />
                    <rect x={WORLD_MIN - 80} y={WORLD_MIN - 80} width={WORLD_MAX - WORLD_MIN + 160} height={WORLD_MAX - WORLD_MIN + 160} fill="url(#bg1)" />
                    <rect x={WORLD_MIN - 80} y={WORLD_MIN - 80} width={WORLD_MAX - WORLD_MIN + 160} height={WORLD_MAX - WORLD_MIN + 160} fill="url(#bg2)" />
                    <rect x={WORLD_MIN - 80} y={WORLD_MIN - 80} width={WORLD_MAX - WORLD_MIN + 160} height={WORLD_MAX - WORLD_MIN + 160} fill="url(#bg3)" />

                    {/* ── Star field ─────────────────────────────────────────────── */}
                    <g pointerEvents="none">
                        {STARFIELD.map((s, i) => (
                            <circle key={`star-${i}`} cx={s.x} cy={s.y} r={s.r} fill="white" fillOpacity={s.o} />
                        ))}
                    </g>

                    {/* ── Radial sector spokes (very faint, match in-game chart) ──── */}
                    <g opacity={overviewLayerOpacity * 0.35} pointerEvents="none">
                        {sectorSpokes.map((s, idx) => (
                            <line
                                key={`spoke-${idx}`}
                                x1={MAP_CENTER.x}
                                y1={MAP_CENTER.y}
                                x2={s.x2}
                                y2={s.y2}
                                stroke="rgba(100,160,240,0.22)"
                                strokeWidth={lineStroke * 0.6}
                                strokeDasharray="1.2 2.4"
                            />
                        ))}
                    </g>

                    {/* ── Orbital rings (dashed, fade with zoom) ─────────────────── */}
                    <g opacity={overviewLayerOpacity * 0.6} pointerEvents="none">
                        {orbitRings.map((r, idx) => (
                            <circle
                                key={`ring-${idx}`}
                                cx={MAP_CENTER.x}
                                cy={MAP_CENTER.y}
                                r={r}
                                fill="none"
                                stroke="rgba(80,130,220,0.22)"
                                strokeWidth={lineStroke * 0.75}
                                strokeDasharray="0.9 1.8"
                            />
                        ))}
                    </g>

                    {/* ── Sun at chart centre ─────────────────────────────────────── */}
                    <g pointerEvents="none" opacity={overviewLayerOpacity}>
                        <circle cx={MAP_CENTER.x} cy={MAP_CENTER.y} r={10} fill="url(#sunGlow)" />
                        <circle cx={MAP_CENTER.x} cy={MAP_CENTER.y} r={2.0} fill="rgba(255,252,200,0.98)" />
                    </g>

                    {/* ── Overview: junction connection lines between planets ──────── */}
                    <g opacity={overviewLayerOpacity * 0.55} pointerEvents="none">
                        {junctionEdges.map((e, i) => (
                            <line
                                key={`jline-${i}`}
                                x1={e.from.x} y1={e.from.y}
                                x2={e.to.x}   y2={e.to.y}
                                stroke="rgba(100,160,230,0.55)"
                                strokeWidth={lineStroke * 0.75}
                                strokeDasharray="0.7 1.4"
                            />
                        ))}
                    </g>

                    {/* ── Overview: planet spheres ─────────────────────────────────── */}
                    <g opacity={overviewLayerOpacity}>
                        {overviewPlanets.map((pl) => {
                            const p = pl.planet;
                            const isSelected = p.id === selectedPlanetId;
                            const col = PLANET_COLORS[p.id] ?? DEFAULT_PLANET_COLOR;
                            const gId = planetGradId(p.id);

                            return (
                                <g key={p.id} data-clickable="true" onClick={() => onClickPlanet(p.id)} style={{ cursor: "pointer" }}>
                                    {/* Glow halo */}
                                    <circle cx={pl.x} cy={pl.y} r={pl.r * 1.80} fill={col.glow} />
                                    {/* Selection ring */}
                                    {isSelected && (
                                        <circle cx={pl.x} cy={pl.y} r={pl.r * 1.42} fill="none" stroke={col.light} strokeWidth={circleStroke * 0.85} strokeOpacity={0.80} />
                                    )}
                                    {/* Sphere */}
                                    <circle cx={pl.x} cy={pl.y} r={pl.r} fill={`url(#${gId})`} stroke={col.light} strokeWidth={circleStroke} strokeOpacity={isSelected ? 1.0 : 0.55} />
                                </g>
                            );
                        })}
                    </g>

                    {/* Zoomed-in layer: all planets expanded + nodes inside each */}
                    {reveal > 0.01 && (
                        <g>
                            {zoomedPlanetLayers.map((zl) => {
                                const pid = zl.planet.id as PlanetId;

                                const zCol = PLANET_COLORS[pid] ?? DEFAULT_PLANET_COLOR;
                                const zGId = planetGradId(pid);
                                // At low reveal the disk looks identical to the overview sphere (gradient fill,
                                // no dark interior) so the crossfade is seamless.  As reveal increases the
                                // gradient fades out and the dark interior fades in to keep nodes readable.
                                const sphereAlpha = clamp(1 - reveal * 2.2, 0, 1);
                                const diskAlpha   = clamp(reveal * 1.6,     0, 1);
                                return (
                                    <g key={`zl-${zl.planet.id}`}>
                                        <g data-clickable="true" onClick={() => onClickPlanet(pid)} style={{ cursor: "pointer" }}>
                                            {/* Glow halo — always present */}
                                            <circle cx={zl.cx} cy={zl.cy} r={zl.grownR * 1.14} fill={zCol.glow} fillOpacity={0.32} />
                                            {/* Sphere gradient at low reveal — matches overview appearance */}
                                            <circle cx={zl.cx} cy={zl.cy} r={zl.grownR} fill={`url(#${zGId})`} fillOpacity={sphereAlpha} />
                                            {/* Dark interior fades in so nodes become readable */}
                                            <circle cx={zl.cx} cy={zl.cy} r={zl.grownR} fill="rgba(1,4,18,0.80)" fillOpacity={diskAlpha} stroke={zCol.base} strokeWidth={circleStroke} strokeOpacity={0.50} />
                                            {/* Thin inner rim accent */}
                                            <circle cx={zl.cx} cy={zl.cy} r={zl.grownR * 0.97} fill="none" stroke={zCol.light} strokeWidth={circleStroke * 0.35} strokeOpacity={0.22 * diskAlpha} />
                                        </g>

                                        <g pointerEvents={canInteractPlanetNodes ? "auto" : "none"} opacity={clamp(reveal * 3.0, 0, 1)}>
                                            <g opacity={0.85}>
                                                {zl.links.map((l, idx) => {
                                                    const isSelectedA = selectedGroupKey === l.a.group.key && selectedPlanetId === pid;
                                                    const isSelectedB = selectedGroupKey === l.b.group.key && selectedPlanetId === pid;
                                                    const hi = isSelectedA || isSelectedB;

                                                    return (
                                                        <line
                                                            key={`ln-${zl.planet.id}-${idx}`}
                                                            x1={l.a.cx}
                                                            y1={l.a.cy}
                                                            x2={l.b.cx}
                                                            y2={l.b.cy}
                                                            stroke={hi ? "rgba(226,232,240,0.55)" : "rgba(226,232,240,0.22)"}
                                                            strokeWidth={hi ? lineStrokeHi : lineStroke}
                                                        />
                                                    );
                                                })}
                                            </g>

                                            {zl.layouts.map((nd) => {
                                                const isActive = selectedPlanetId === pid && selectedGroupKey === nd.group.key;
                                                const isCompleted = Boolean(nodeCompletedMap[nd.group.baseNodeId]);

                                                const nodeFill = isActive
                                                    ? zCol.base + "44"
                                                    : isCompleted
                                                        ? "rgba(16,185,129,0.22)"
                                                        : "rgba(1,4,18,0.80)";
                                                const nodeStrokeCol = isActive
                                                    ? zCol.light
                                                    : isCompleted
                                                        ? "rgba(52,211,153,0.80)"
                                                        : "rgba(140,160,200,0.58)";

                                                return (
                                                    <g
                                                        key={`nd-${zl.planet.id}-${nd.group.key}`}
                                                        data-clickable="true"
                                                        onClick={() => onClickGroup(pid, nd.group)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <circle cx={nd.cx} cy={nd.cy} r={nd.r} fill={nodeFill} stroke={nodeStrokeCol} strokeWidth={nodeStroke} />
                                                    </g>
                                                );
                                            })}
                                        </g>
                                    </g>
                                );
                            })}
                        </g>
                    )}
                </svg>

                <div className="pointer-events-none absolute inset-0 z-30">
                    {overviewPlanetLabelScreens.map((p) => (
                        <div
                            key={`pllbl-${p.id}`}
                            className="absolute text-[11px] tracking-[0.35em] text-slate-200"
                            style={{
                                left: p.x,
                                top: p.y,
                                opacity: p.opacity,
                                transform: "translate(-50%, -50%)",
                                textTransform: "uppercase",
                                textShadow: "0 2px 10px rgba(0,0,0,0.65)",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {p.text}
                        </div>
                    ))}

                    {zoomedPlanetLabelScreens.map((p) => (
                        <div
                            key={`zpl-${p.id}`}
                            className="absolute text-[12px] font-semibold tracking-[0.35em] text-slate-100"
                            style={{
                                left: p.x,
                                top: p.y,
                                opacity: p.opacity,
                                transform: "translate(-50%, -50%)",
                                textTransform: "uppercase",
                                textShadow: "0 2px 10px rgba(0,0,0,0.65)",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {p.text}
                        </div>
                    ))}

                    {canInteractPlanetNodes &&
                        !isDragging &&
                        nodeLabelScreens.map((l) => (
                            <div
                                key={`lbl-${l.key}`}
                                className="absolute text-[11px] tracking-[0.22em] text-slate-100"
                                style={{
                                    left: l.x,
                                    top: l.y,
                                    opacity: clamp(reveal * 3.0, 0, 1),
                                    transform: l.anchor === "end" ? "translate(-100%, -50%)" : "translate(0%, -50%)",
                                    textTransform: "uppercase",
                                    textShadow: "0 2px 10px rgba(0,0,0,0.65)",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {l.text}
                            </div>
                        ))}
                </div>

                <div className="pointer-events-none absolute bottom-3 left-3 z-30 rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-2 text-xs text-slate-400 backdrop-blur-sm">
                    Drag to pan · Wheel to zoom · Click a planet to zoom into it · Zoom in to expand all planets and reveal nodes · Click node again to unselect
                </div>

                <div className="absolute left-3 top-3 z-30 flex items-center gap-2">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/55 px-3 py-1.5 text-xxt-slate-300 backdrop-blur-sm">
                        {Math.round(scale * 100)}%
                    </div>

                    <button
                        className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                        onClick={() => {
                            const center = { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
                            setVb((prev) => vbZoomAt(prev, center, 1 / 1.10));
                        }}
                        title="Zoom In"
                    >
                        +
                    </button>

                    <button
                        className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                        onClick={() => {
                            const center = { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
                            setVb((prev) => vbZoomAt(prev, center, 1.10));
                        }}
                        title="Zoom Out"
                    >
                        −
                    </button>

                    {focusedTitle && <div className="ml-2 hidden text-xs text-slate-500 sm:block">{focusedTitle}</div>}
                </div>
            </div>
        </div>
    );
}

function StarChartModalStyles() {
    return (
        <style>{`
.wf-star-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(2, 6, 23, 0.72);
    backdrop-filter: ur(6px);
    display: flex;
    align-items: center;
    justify-content: center;

    padding:
        max(8px, env(safe-area-inset-top))
        max(8px, env(safe-area-inset-right))
        max(8px, env(safe-area-inset-bottom))
        max(8px, env(safe-area-inset-left));
}

.wf-star-modal {
    width: 100%;
    height: 100%;
    border: 1px solid rgba(30, 41, 59, 0.8);
    background: rgba(2, 6, 23, 0.92);
    border-radius: 16px;
    box-shadow: 0 20px 80px rgba(0,0,0,0.55);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.wf-star-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(30, 41, 59, 0.8);
}

.wf-star-modal-title {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.wf-star-modal-title .t1 {
    font-size: 14px;
    font-weight: 700;
    color: rgba(226, 232, 240, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wf-star-modal-title .t2 {
    font-size: 12px;
    color: rgba(148, 163, 184, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wf-star-modal-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.wf-star-modal-body {
    flex: 1;
    overflow: hidden;
    padding: 0;
}
        `}</style>
    );
}

function StarChartModal(props: { isOpen: boolean; title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
    const { isOpen, title, subtitle, onClose, children } = props;

    useEffect(() => {
        if (!isOpen) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="wf-star-overlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
            <div className="wf-star-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="wf-star-modal-header">
                    <div className="wf-star-modal-title">
                        <div className="t1">{title}</div>
                        <div className="t2">{subtitle}</div>
                    </div>

                    <div className="wf-star-modal-actions">
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className="wf-star-modal-body">{children}</div>
            </div>
        </div>
    );
}

export default function StarChart() {
    const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId | null>(null);
    const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<NodeGroupKind>("base");

    const initialWorldSpan = WORLD_MAX - WORLD_MIN;
    const [vb, setVb] = useState<ViewBox>({ x: WORLD_MIN, y: WORLD_MIN, w: initialWorldSpan, h: initialWorldSpan });

    const sourceToItemsIndex = useMemo(() => buildSourceToItemsIndex(), []);

    const planetsById = useMemo(() => {
        const m = new Map<string, StarChartPlanet>();
        for (const p of STAR_CHART_DATA.planets) m.set(p.id, p);
        return m;
    }, []);

    const groupedByPlanet = useMemo(() => {
        const out = new Map<string, NodeGroup[]>();

        for (const n of STAR_CHART_DATA.nodes) {
            const pid = String(n.planetId);
            const v = parseNodeVariant(n);
            const key = v.baseKey;

            if (!out.has(pid)) out.set(pid, []);
            const arr = out.get(pid)!;

            let g = arr.find((x) => x.key === key) ?? null;
            if (!g) {
                g = {
                    key,
                    planetId: n.planetId,
                    displayName: displayNameFromBase(n),
                    baseNodeId: n.id,
                    kinds: {}
                };
                arr.push(g);
            }

            if (!g.kinds[v.kind]) g.kinds[v.kind] = [];
            g.kinds[v.kind]!.push(n.id);

            if (v.kind === "base") g.baseNodeId = n.id;
        }

        for (const [pid, arr] of out.entries()) {
            arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
            out.set(pid, arr);
        }

        return out;
    }, []);

    const scale = useMemo(() => viewBoxToScale(vb), [vb]);
    const focusedPlanet = useMemo(() => (selectedPlanetId ? planetsById.get(selectedPlanetId) ?? null : null), [selectedPlanetId, planetsById]);

    const focusedPlanetGroups = useMemo(() => {
        if (!selectedPlanetId) return [] as NodeGroup[];
        return groupedByPlanet.get(selectedPlanetId) ?? [];
    }, [selectedPlanetId, groupedByPlanet]);

    const selectedGroup = useMemo(() => {
        if (!selectedGroupKey) return null;
        return focusedPlanetGroups.find((g) => g.key === selectedGroupKey) ?? null;
    }, [selectedGroupKey, focusedPlanetGroups]);

    const tabsForPanel = useMemo(() => {
        if (!selectedGroup) return [] as TabSpec[];

        // Build the raw tabs first.
        const rawKinds: NodeGroupKind[] = ["all", "base", "mission_rewards", "caches", "extra"];
        const raw = rawKinds.map((k) => buildTabSpecRaw({ group: selectedGroup, kind: k, sourceToItemsIndex }));

        // Keep tabs based on whether they have ANY sources, except All which is always shown.
        const keep = raw.filter((s) => s.kind === "all" || s.dropSources.length > 0);

        // Apply exclusive assignment so "Drops" does NOT include items that belong to the other pills.
        const exclusive = applyExclusiveAssignment(keep);

        // Hide empty non-All tabs (after exclusivity), but keep All even if empty (debug).
        const finalTabs = exclusive.filter((t) => t.kind === "all" || t.items.length > 0 || t.dropSources.length > 0);

        // UI-only rule:
        // - Mission Rewards: collapse relic quality variants and drop generic era rows ("Lith", "Lith Relic", etc.)
        // - All: apply the SAME display normalization so you don't see "Lith" there either.
        return finalTabs.map((t) => {
            // UI-only: collapse relic refinement variants anywhere they appear in node tabs.
            // (Prevents “Exceptional/Flawless/Radiant” noise even if a relic leaks into Extra/Drops.)
            return { ...t, items: normalizeMissionRewardItemsForDisplay(t.items) };
        });
    }, [selectedGroup, sourceToItemsIndex]);

    const activeTab = useMemo(() => {
        if (!selectedGroup) return null;
        const t = tabsForPanel.find((x) => x.kind === selectedTab) ?? null;
        return t ?? (tabsForPanel[0] ?? null);
    }, [selectedGroup, tabsForPanel, selectedTab]);

    useEffect(() => {
        if (!selectedGroupKey) return;

        const allowed = new Set(tabsForPanel.map((t) => t.kind));
        if (allowed.size === 0) return;

        if (!allowed.has(selectedTab)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedTab(tabsForPanel[0]?.kind ?? "base");
        }
    }, [selectedGroupKey, tabsForPanel, selectedTab]);

    const [isOpen, setIsOpen] = useState<boolean>(false);

    function resetView() {
        setSelectedGroupKey(null);
        setSelectedTab("base");
        setSelectedPlanetId(null);
        setVb({ x: WORLD_MIN, y: WORLD_MIN, w: initialWorldSpan, h: initialWorldSpan });
    }

    const focusedTitle = useMemo(() => {
        if (scale <= 1.15) return null;
        if (!focusedPlanet) return null;
        return `Selected: ${focusedPlanet.name}`;
    }, [scale, focusedPlanet]);

    const showDropsPanel = Boolean(selectedGroupKey);

    // 6.5: Resolve junction node for the selected group
    const junctionNode = useMemo<StarChartNode | null>(() => {
        if (!selectedGroup) return null;
        const baseId = selectedGroup.baseNodeId;
        const node = STAR_CHART_DATA.nodes.find((n) => n.id === baseId) ?? null;
        return node?.nodeType === "junction" ? node : null;
    }, [selectedGroup]);

    return (
        <div className="space-y-6">
            <StarChartModalStyles />

            <Section
                title="Star Chart"
                subtitle="Drag to pan. Wheel to zoom. Click a planet to zoom into it. Zoom in to expand all planets and reveal nodes. Click a node to view obtainable items."
                actions={
                    <>
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/40"
                            onClick={() => setIsOpen(true)}
                        >
                            Open Map
                        </button>
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/40"
                            onClick={resetView}
                        >
                            Reset View
                        </button>
                    </>
                }
            >
                <StarChartMap
                    isInModal={false}
                    vb={vb}
                    setVb={setVb}
                    selectedPlanetId={selectedPlanetId}
                    setSelectedPlanetId={setSelectedPlanetId}
                    selectedPlanetName={focusedPlanet?.name ?? null}
                    selectedGroupKey={selectedGroupKey}
                    setSelectedGroupKey={setSelectedGroupKey}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                    selectedGroupDisplayName={selectedGroup?.displayName ?? null}
                    tabsForPanel={tabsForPanel}
                    activeTab={activeTab}
                    focusedTitle={focusedTitle}
                    showDropsPanel={showDropsPanel}
                    junctionNode={junctionNode}
                    selectedGroupBaseNodeId={selectedGroup?.baseNodeId ?? null}
                />
            </Section>

            <StarChartModal
                isOpen={isOpen}
                title="Star Chart"
                subtitle="Drag to pan · Wheel to zoom · Click a planet to zoom into it · Click node again to unselect"
                onClose={() => setIsOpen(false)}
            >
                <StarChartMap
                    isInModal={true}
                    vb={vb}
                    setVb={setVb}
                    selectedPlanetId={selectedPlanetId}
                    setSelectedPlanetId={setSelectedPlanetId}
                    selectedPlanetName={focusedPlanet?.name ?? null}
                    selectedGroupKey={selectedGroupKey}
                    setSelectedGroupKey={setSelectedGroupKey}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                    selectedGroupDisplayName={selectedGroup?.displayName ?? null}
                    tabsForPanel={tabsForPanel}
                    activeTab={activeTab}
                    focusedTitle={focusedTitle}
                    showDropsPanel={showDropsPanel}
                    junctionNode={junctionNode}
                    selectedGroupBaseNodeId={selectedGroup?.baseNodeId ?? null}
                />
            </StarChartModal>
        </div>
    );
}
