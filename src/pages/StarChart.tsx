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
import { PR } from "../domain/ids/prereqIds";
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

// Map planet/region IDs → the webp filename in /public/planets/
const PLANET_IMAGES: Record<string, string> = {
    "planet:mercury":       "Mercury.webp",
    "planet:venus":         "Venus.webp",
    "planet:earth":         "Earth.webp",
    "planet:mars":          "Mars.webp",
    "planet:phobos":        "Phobos.webp",
    "planet:deimos":        "Deimos.webp",
    "planet:ceres":         "Ceres.webp",
    "planet:jupiter":       "Jupiter.webp",
    "planet:europa":        "Europa.webp",
    "planet:saturn":        "Saturn.webp",
    "planet:uranus":        "Uranus.webp",
    "planet:neptune":       "Neptune.webp",
    "planet:pluto":         "Pluto.webp",
    "planet:sedna":         "Sedna.webp",
    "planet:eris":          "Eris.webp",
    "region:void":          "Void.webp",
    "region:lua":           "Lua.webp",
    "region:kuva_fortress": "Kuva_Fortress.webp",
    "region:zariman":       "New_Zariman.webp",
    "region:earth_proxima":   "Earth.webp",
    "region:venus_proxima":   "Venus.webp",
    "region:saturn_proxima":  "Saturn.webp",
    "region:neptune_proxima": "Neptune.webp",
    "region:pluto_proxima":   "Pluto.webp",
    "region:veil_proxima":    "Kuva_Fortress.webp",
};

// Returns the URL for a planet's image, or null if not mapped.
// Uses Vite's BASE_URL so it works in both dev (/) and production (/Warframe-Progression-Tracker/).
function planetImgUrl(planetId: string): string | null {
    const file = PLANET_IMAGES[planetId];
    if (!file) return null;
    return `${import.meta.env.BASE_URL}planets/${file}`;
}

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
    "region:kuva_fortress": { x: 50, y: 50 },

    // Proxima regions — arc left to right matching in-game Railjack nav order
    "region:earth_proxima":   { x: 20, y: 50 },
    "region:venus_proxima":   { x: 35, y: 30 },
    "region:saturn_proxima":  { x: 50, y: 50 },
    "region:neptune_proxima": { x: 65, y: 30 },
    "region:pluto_proxima":   { x: 70, y: 60 },
    "region:veil_proxima":    { x: 83, y: 45 },
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
const WORLD_MIN = -160;
const WORLD_MAX = 260;

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
    if (p.kind === "planet") return 5.5;
    if (p.kind === "region") return 5.0;
    return 4.5;
}

type NodeGroupKind = "all" | "base" | "mission_rewards" | "caches" | "extra" | "other";

type NodeGroup = {
    key: string;
    planetId: PlanetId;
    displayName: string;
    baseNodeId: NodeId;
    nodeType: StarChartNode["nodeType"];
    kinds: Partial<Record<Exclude<NodeGroupKind, "all">, NodeId[]>>;
};

function baseKeyFromNode(n: StarChartNode): string {
    const id = String(n.id);
    const stripId = id.replace(/-\(caches\)$/i, "").replace(/-\(extra\)$/i, "");

    const nm = String(n.name ?? "");
    const stripName = stripTrailingNodeQualifier(nm);

    return `${String(n.planetId)}::${stripId}::${stripName}`;
}

function stripTrailingNodeQualifier(name: string): string {
    return String(name ?? "")
        .replace(/\s*\([^)]*\)\s*$/i, "")
        .trim();
}

function displayNameFromBase(n: StarChartNode): string {
    return stripTrailingNodeQualifier(String(n.name ?? ""));
}

function parseNodeVariant(n: StarChartNode): { baseKey: string; kind: Exclude<NodeGroupKind, "all"> } {
    const name = (n.name ?? "").toLowerCase();
    const id = String(n.id);

    if (id.includes("-(caches)") || name.includes("(caches)")) return { baseKey: baseKeyFromNode(n), kind: "caches" };
    if (id.includes("-(extra)") || name.includes("(extra)")) return { baseKey: baseKeyFromNode(n), kind: "extra" };
    if (name.includes("(mission rewards)") || name.includes("mission rewards")) return { baseKey: baseKeyFromNode(n), kind: "mission_rewards" };

    return { baseKey: baseKeyFromNode(n), kind: "base" };
}

function groupPlanetNodesForDisplay(nodes: StarChartNode[]): NodeGroup[] {
    const byKey = new Map<string, NodeGroup>();

    for (const n of nodes) {
        const v = parseNodeVariant(n);
        const key = v.baseKey;

        let g = byKey.get(key) ?? null;
        if (!g) {
            g = {
                key,
                planetId: n.planetId,
                displayName: displayNameFromBase(n),
                baseNodeId: n.id,
                nodeType: n.nodeType,
                kinds: {}
            };
            byKey.set(key, g);
        }

        if (!g!.kinds[v.kind]) g!.kinds[v.kind] = [];
        g!.kinds[v.kind]!.push(n.id);
        if (v.kind === "base") g!.baseNodeId = n.id;
    }

    return [...byKey.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// Node positions are stored as fractions of the disk radius so they remain
// stable regardless of zoom level or the animated grownR.
// Multiply by zl.grownR at render time to get world coordinates.
type NodeLayout = {
    group: NodeGroup;
    ncx: number; // (node_world_x - planet_cx) / diskR
    ncy: number;
    nlx: number; // (label_world_x - planet_cx) / diskR
    nly: number;
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
    /** Whether we're tracking Steel Path completions instead of normal ones */
    steelPathMode: boolean;
    setSteelPathMode: React.Dispatch<React.SetStateAction<boolean>>;
    /** Navigate to a different map view (proxima / duviri) */
    setMainMapMode: (mode: "normal" | "proxima" | "duviri") => void;
    /** Optional filter controlling which planets appear — defaults to isInMainMap */
    planetFilter?: (p: StarChartPlanet) => boolean;
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
        selectedGroupBaseNodeId,
        steelPathMode,
        setSteelPathMode,
        setMainMapMode,
        planetFilter = isInMainMap,
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
    const setNodeCompleted        = useTrackerStore((s) => s.setNodeCompleted);
    const setBulkNodesCompleted   = useTrackerStore((s) => s.setBulkNodesCompleted);
    const setSteelPathNodeCompleted      = useTrackerStore((s) => s.setSteelPathNodeCompleted);
    const setBulkSteelPathNodesCompleted = useTrackerStore((s) => s.setBulkSteelPathNodesCompleted);
    const nodeCompletedMap       = useTrackerStore((s) => s.state.missions?.nodeCompleted       ?? EMPTY_NODE_COMPLETED);
    const spNodeCompletedMap     = useTrackerStore((s) => s.state.missions?.steelPathNodeCompleted ?? EMPTY_NODE_COMPLETED);
    const completedPrereqs       = useTrackerStore((s) => s.state.prereqs?.completed            ?? EMPTY_NODE_COMPLETED);

    // When in Steel Path mode, setters and raw map point to the SP tracking store.
    const activeSetNodeCompleted      = steelPathMode ? setSteelPathNodeCompleted      : setNodeCompleted;
    const activeSetBulkNodesCompleted = steelPathMode ? setBulkSteelPathNodesCompleted : setBulkNodesCompleted;
    const activeRawNodeMap            = steelPathMode ? spNodeCompletedMap             : nodeCompletedMap;

    // Nodes that are implicitly completed by finishing specific quests/milestones.
    // Completing Vor's Prize requires clearing these early Earth nodes, so we
    // treat them as done whenever the quest prereq is marked complete.
    // (Only applies to normal mode — Steel Path has no prereq derivations.)
    const VORS_PRIZE_IMPLIES_COMPLETED: Record<string, true> = {
        "node:junction_mercury_venus":  true,  // unlocks Venus
        "node:junction_venus_earth":    true,  // unlocks Earth
        "node:mr/earth/e-prime":        true,
        "node:mr/earth/mariana":        true,
        "node:mr/earth/mantle":         true,
        "node:mr/earth/gaia":           true,
        "node:mr/earth/pacific":        true,
        "node:mr/earth/cambria":        true,
        "node:hub/earth/strata-relay":  true,
    };

    // Merge prereq-derived completions with manually tracked ones.
    // Manual entries always win (so a user can un-check a derived node if desired).
    // In Steel Path mode there are no prereq derivations — everything is manual.
    const effectiveNodeCompletedMap = useMemo(() => {
        if (steelPathMode) return activeRawNodeMap;
        const derived: Record<string, boolean> = completedPrereqs[PR.VORS_PRIZE]
            ? { ...VORS_PRIZE_IMPLIES_COMPLETED }
            : {};
        return { ...derived, ...nodeCompletedMap };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [steelPathMode, completedPrereqs, nodeCompletedMap, spNodeCompletedMap]);

    // Derive which planets are unlocked from completed junctions.
    // Mercury is the starting planet and is always accessible.
    const unlockedPlanetIds = useMemo(() => {
        const unlocked = new Set<string>(["planet:mercury"]);
        for (const n of STAR_CHART_DATA.nodes) {
            if (n.nodeType === "junction" && n.unlocksPlanetId && effectiveNodeCompletedMap[n.id]) {
                unlocked.add(n.unlocksPlanetId);
            }
        }
        return unlocked;
    }, [effectiveNodeCompletedMap]);

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
    const [showLegend, setShowLegend] = useState(false);
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
        const byPlanet = new Map<string, StarChartNode[]>();

        for (const n of STAR_CHART_DATA.nodes) {
            const pid = String(n.planetId);
            const arr = byPlanet.get(pid) ?? [];
            arr.push(n);
            byPlanet.set(pid, arr);
        }

        for (const [pid, nodes] of byPlanet.entries()) {
            out.set(pid, groupPlanetNodesForDisplay(nodes));
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
        const filtered = sortedPlanets.filter((p) => planetFilter(p));
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

    // Pan + pinch-to-zoom (pointer events handle both mouse and touch/stylus)
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        // Track all active pointers so we can detect two-finger pinch
        const activePointers = new Map<number, { x: number; y: number }>();

        // Single-pointer pan state
        let startClient: { x: number; y: number } | null = null;
        let startVb: ViewBox | null = null;
        let didStartDragging = false;

        // Two-pointer pinch state
        let pinchStartDist = 0;
        let pinchStartVb: ViewBox | null = null;
        let pinchStartMid: { x: number; y: number } | null = null;

        let rafId: number | null = null;
        let pendingVb: ViewBox | null = null;

        function flush() {
            rafId = null;
            if (!pendingVb) return;
            setVb(pendingVb);
            pendingVb = null;
        }

        function scheduleFlush(next: ViewBox) {
            pendingVb = next;
            if (rafId == null) rafId = requestAnimationFrame(flush);
        }

        function ptDist(a: { x: number; y: number }, b: { x: number; y: number }) {
            const dx = a.x - b.x; const dy = a.y - b.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function ptMid(a: { x: number; y: number }, b: { x: number; y: number }) {
            return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        }

        /** Convert a client-space point to SVG world coordinates. */
        function clientToWorld(cx: number, cy: number): { x: number; y: number } | null {
            if (!svg) return null;
            const rect = svg.getBoundingClientRect();
            const vb   = vbRef.current;
            const scalePx = Math.min(rect.width / vb.w, rect.height / vb.h);
            const padX    = (rect.width  - vb.w * scalePx) / 2;
            const padY    = (rect.height - vb.h * scalePx) / 2;
            const wx = vb.x + (cx - rect.left - padX) / scalePx;
            const wy = vb.y + (cy - rect.top  - padY) / scalePx;
            if (!Number.isFinite(wx) || !Number.isFinite(wy)) return null;
            return { x: wx, y: wy };
        }

        const DRAG_START_PX = 4;

        const onPointerDown = (e: PointerEvent) => {
            // Mouse: only left button; touch/pen: all pointers
            if (e.pointerType === "mouse" && e.button !== 0) return;

            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activePointers.size === 1) {
                // First pointer — start potential pan
                startClient = { x: e.clientX, y: e.clientY };
                startVb     = vbRef.current;
                didStartDragging     = false;
                suppressClickRef.current = false;
            } else if (activePointers.size === 2) {
                // Second pointer arrived — cancel pan, begin pinch
                if (didStartDragging) { setIsDragging(false); didStartDragging = false; }
                suppressClickRef.current = true;
                cancelZoomAnim();
                const pts       = Array.from(activePointers.values());
                pinchStartDist  = ptDist(pts[0], pts[1]);
                pinchStartMid   = ptMid(pts[0], pts[1]);
                pinchStartVb    = vbRef.current;
                startClient     = null; // disable pan path while pinching
            }
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!activePointers.has(e.pointerId)) return;
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activePointers.size >= 2) {
                // ── Two-finger pinch zoom ──
                if (!pinchStartVb || !pinchStartMid || pinchStartDist < 1) return;
                const pts     = Array.from(activePointers.values());
                const curDist = ptDist(pts[0], pts[1]);
                if (curDist < 1) return;
                const factor   = pinchStartDist / curDist; // <1 = zoom in, >1 = zoom out
                const worldMid = clientToWorld(pinchStartMid.x, pinchStartMid.y);
                if (!worldMid) return;
                scheduleFlush(clampViewBox(vbZoomAt(pinchStartVb, worldMid, factor)));
                return;
            }

            // ── Single-pointer pan ──
            if (!startClient || !startVb) return;
            const dxPx = e.clientX - startClient.x;
            const dyPx = e.clientY - startClient.y;

            if (!didStartDragging) {
                if (Math.sqrt(dxPx * dxPx + dyPx * dyPx) < DRAG_START_PX) return;
                didStartDragging = true;
                suppressClickRef.current = true;
                cancelZoomAnim();
                setIsDragging(true);
                try { svg.setPointerCapture(e.pointerId); } catch { /* ignore */ }
            }

            const rect = svg.getBoundingClientRect();
            scheduleFlush(clampViewBox({
                ...startVb,
                x: startVb.x - (dxPx / rect.width)  * startVb.w,
                y: startVb.y - (dyPx / rect.height) * startVb.h,
            }));
        };

        const endPointer = (e: PointerEvent) => {
            activePointers.delete(e.pointerId);

            if (activePointers.size < 2) {
                // Pinch ended — clear pinch state
                pinchStartDist = 0;
                pinchStartVb   = null;
                pinchStartMid  = null;
            }

            if (activePointers.size === 0) {
                if (didStartDragging) {
                    setIsDragging(false);
                    try { svg.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
                }
                startClient      = null;
                startVb          = null;
                didStartDragging = false;
                if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
                if (pendingVb)     { setVb(pendingVb); pendingVb = null; }
            } else if (activePointers.size === 1) {
                // One finger lifted — resume pan from the remaining pointer's position
                const [, pt] = Array.from(activePointers.entries())[0];
                startClient      = { x: pt.x, y: pt.y };
                startVb          = vbRef.current;
                didStartDragging = false;
            }
        };

        svg.addEventListener("pointerdown",   onPointerDown);
        svg.addEventListener("pointermove",   onPointerMove);
        svg.addEventListener("pointerup",     endPointer);
        svg.addEventListener("pointercancel", endPointer);
        svg.addEventListener("pointerleave",  endPointer);

        return () => {
            if (rafId != null) cancelAnimationFrame(rafId);
            svg.removeEventListener("pointerdown",   onPointerDown);
            svg.removeEventListener("pointermove",   onPointerMove);
            svg.removeEventListener("pointerup",     endPointer);
            svg.removeEventListener("pointercancel", endPointer);
            svg.removeEventListener("pointerleave",  endPointer);
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
        const r = 1.1 / scale;
        return clamp(r, 0.22, 0.48);
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

    // Physics runs in a unit disk (center = 0, radius = 1) with a fixed node
    // size so that the resulting normalized positions never shift with zoom.
    const LAYOUT_NODE_R = 0.035; // node radius as a fraction of diskR

    function computePlanetNodeLayout(args: {
        planetId: PlanetId;
        groups: NodeGroup[];
    }): { layouts: NodeLayout[]; links: Array<{ a: NodeLayout; b: NodeLayout }> } {
        const { groups } = args;

        if (!groups.length) return { layouts: [], links: [] };

        const clusterR = 0.92; // fraction of unit disk

        const pts: Array<{
            group: NodeGroup;
            x: number;
            y: number;
            hasManual: boolean;
        }> = [];

        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            const base = groupBaseNode(g);
            const manual = base ? nodeManualLocal(base) : null;

            if (manual) {
                pts.push({
                    group: g,
                    x: clamp(manual.x, -0.98, 0.98),
                    y: clamp(manual.y, -0.98, 0.98),
                    hasManual: true
                });
                continue;
            }

            const a = (i / Math.max(1, groups.length)) * Math.PI * 2;
            const r0 = clusterR * (0.48 + 0.48 * hashToUnitFloat(g.key + ":r"));
            pts.push({
                group: g,
                x: Math.cos(a) * r0,
                y: Math.sin(a) * r0,
                hasManual: false
            });
        }

        const steps = 70;
        const padding = LAYOUT_NODE_R * 3.1;
        const pull = 0.008;

        for (let s = 0; s < steps; s++) {
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                if (a.hasManual) continue;

                // Gentle pull toward center (coords are relative to 0,0)
                a.x -= a.x * pull;
                a.y -= a.y * pull;

                for (let j = 0; j < pts.length; j++) {
                    if (i === j) continue;
                    const b = pts[j];

                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
                    const minD = LAYOUT_NODE_R * 2 + padding;

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

        const labelDist = LAYOUT_NODE_R * 3.1;

        const layouts: NodeLayout[] = pts.map((p) => {
            const ang = Math.atan2(p.y, p.x);
            const preferRight = Math.cos(ang) >= 0;
            const altRight = !preferRight;

            function penalty(lx: number, ly: number): number {
                let pen = 0;
                for (const q of pts) {
                    const dx = lx - q.x;
                    const dy = ly - q.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    const minD = LAYOUT_NODE_R * 4.4;
                    if (d < minD) pen += minD - d;
                }
                return pen;
            }

            const lxA = p.x + (preferRight ? labelDist : -labelDist);
            const lxB = p.x + (altRight ? labelDist : -labelDist);
            const useRight = penalty(lxA, p.y) <= penalty(lxB, p.y) ? preferRight : altRight;

            return {
                group: p.group,
                ncx: p.x,
                ncy: p.y,
                nlx: p.x + (useRight ? labelDist : -labelDist),
                nly: p.y,
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

    // Stable layout: only recomputes when planet groupings change, not on zoom/pan.
    const planetNodeLayouts = useMemo(() => {
        const out = new Map<string, { layouts: NodeLayout[]; links: Array<{ a: NodeLayout; b: NodeLayout }> }>();
        for (const [planetId, groups] of groupedByPlanet) {
            out.set(planetId, computePlanetNodeLayout({ planetId: planetId as PlanetId, groups }));
        }
        return out;
    }, [groupedByPlanet, edgesById]);

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
            const diskR = expandedRadiusByPlanetId.get(pid) ?? 18;
            const grownR = lerp(pl.r, diskR, reveal);
            const clipBase = String(pid).replace(/[^a-z0-9_:-]/gi, "_");
            const clipId = `clip_${clipBase}`;
            const { layouts, links } = planetNodeLayouts.get(String(pid)) ?? { layouts: [], links: [] };

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
    }, [overviewPlanets, planetNodeLayouts, expandedRadiusByPlanetId, reveal]);

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
                const p = worldToOverlayPx({
                    x: zl.cx + nd.nlx * zl.grownR,
                    y: zl.cy + nd.nly * zl.grownR
                });
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

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
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
                                            checked={Boolean(effectiveNodeCompletedMap[selectedGroupBaseNodeId])}
                                            onChange={(e) => activeSetNodeCompleted(selectedGroupBaseNodeId, e.target.checked)}
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

                        {/* ClipPaths for zoomed planet disks (node clipping) */}
                        {zoomedPlanetLayers.map((zl) => (
                            <clipPath key={`clipdef-${zl.clipId}`} id={zl.clipId}>
                                <circle cx={zl.cx} cy={zl.cy} r={zl.diskR} />
                            </clipPath>
                        ))}

                        {/* Soft circular vignette mask reused by all planet images.
                             maskContentUnits="objectBoundingBox" means x/y/w/h=0..1
                             maps to the exact bounding box of whatever element uses it,
                             so one mask definition works for every planet size. */}
                        <radialGradient id="sphereVignette" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
                            <stop offset="68%" stopColor="white" stopOpacity="1" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                        <mask id="sphereVignetteMask" maskContentUnits="objectBoundingBox">
                            <rect x="0" y="0" width="1" height="1" fill="url(#sphereVignette)" />
                        </mask>

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
                            const gId = planetGradId(p.id);

                            const imgUrl = planetImgUrl(p.id);
                            return (
                                <g key={p.id} data-clickable="true" onClick={() => onClickPlanet(p.id)} style={{ cursor: "pointer" }}>
                                    {/* Selection ring — neutral white, no color fill */}
                                    {isSelected && (
                                        <circle cx={pl.x} cy={pl.y} r={pl.r * 1.45} fill="none" stroke="rgba(226,232,240,0.90)" strokeWidth={circleStroke * 1.1} />
                                    )}
                                    {/* Sphere — planet image if available, gradient fallback */}
                                    {imgUrl ? (
                                        <image
                                            href={imgUrl}
                                            x={pl.x - pl.r} y={pl.y - pl.r}
                                            width={pl.r * 2} height={pl.r * 2}
                                            preserveAspectRatio="xMidYMid meet"
                                            mask="url(#sphereVignetteMask)"
                                        />
                                    ) : (
                                        <circle cx={pl.x} cy={pl.y} r={pl.r} fill={`url(#${gId})`} stroke="rgba(180,200,230,0.55)" strokeWidth={circleStroke} />
                                    )}
                                </g>
                            );
                        })}
                    </g>

                    {/* Zoomed-in layer: all planets expanded + nodes inside each */}
                    {reveal > 0.01 && (
                        <g>
                            {zoomedPlanetLayers.map((zl) => {
                                const pid = zl.planet.id as PlanetId;

                                const zGId = planetGradId(pid);
                                // Dark overlay fades in as you zoom in so mission nodes stay readable.
                                const diskAlpha = clamp(reveal * 1.6, 0, 1);
                                return (
                                    <g key={`zl-${zl.planet.id}`}>
                                        <g data-clickable="true" onClick={() => onClickPlanet(pid)} style={{ cursor: "pointer" }}>
                                            {/* Planet image grows with grownR — gradient fallback for unmapped planets */}
                                            {(() => {
                                                const imgUrl = planetImgUrl(pid);
                                                return imgUrl ? (
                                                    <image
                                                        href={imgUrl}
                                                        x={zl.cx - zl.grownR} y={zl.cy - zl.grownR}
                                                        width={zl.grownR * 2} height={zl.grownR * 2}
                                                        preserveAspectRatio="xMidYMid meet"
                                                        mask="url(#sphereVignetteMask)"
                                                    />
                                                ) : (
                                                    <circle cx={zl.cx} cy={zl.cy} r={zl.grownR} fill={`url(#${zGId})`} />
                                                );
                                            })()}
                                            {/* Very subtle dark tint — just enough to lift node text without hiding the image */}
                                            <circle cx={zl.cx} cy={zl.cy} r={zl.grownR} fill="rgba(1,4,18,0.28)" fillOpacity={diskAlpha} />
                                        </g>

                                        <g pointerEvents={canInteractPlanetNodes ? "auto" : "none"} opacity={clamp(reveal * 3.0, 0, 1)}>
                                            <g opacity={0.90}>
                                                {zl.links.map((l, idx) => {
                                                    const isSelectedA = selectedGroupKey === l.a.group.key && selectedPlanetId === pid;
                                                    const isSelectedB = selectedGroupKey === l.b.group.key && selectedPlanetId === pid;
                                                    const hi = isSelectedA || isSelectedB;

                                                    // Expand normalized coords to world space
                                                    const ax1 = zl.cx + l.a.ncx * zl.grownR;
                                                    const ay1 = zl.cy + l.a.ncy * zl.grownR;
                                                    const ax2 = zl.cx + l.b.ncx * zl.grownR;
                                                    const ay2 = zl.cy + l.b.ncy * zl.grownR;
                                                    return (
                                                        <line
                                                            key={`ln-${zl.planet.id}-${idx}`}
                                                            x1={ax1} y1={ay1}
                                                            x2={ax2} y2={ay2}
                                                            stroke={hi ? "rgba(255,255,255,0.75)" : "rgba(200,215,235,0.38)"}
                                                            strokeWidth={hi ? lineStrokeHi : lineStroke}
                                                        />
                                                    );
                                                })}
                                            </g>

                                            {zl.layouts.map((nd) => {
                                                const isActive = selectedPlanetId === pid && selectedGroupKey === nd.group.key;
                                                const isCompleted = Boolean(effectiveNodeCompletedMap[nd.group.baseNodeId]);
                                                const isAvailable = !isCompleted && unlockedPlanetIds.has(String(pid));
                                                const isLocked = !isCompleted && !isAvailable;

                                                // 3-state: active > completed (grey) > available (blue) > locked
                                                const nodeFill = isActive
                                                    ? "rgba(255,255,255,0.18)"
                                                    : isCompleted
                                                        ? "rgba(51,65,85,0.50)"
                                                        : isAvailable
                                                            ? "rgba(59,130,246,0.10)"
                                                            : "rgba(1,4,18,0.35)";
                                                const nodeStrokeCol = isActive
                                                    ? "rgba(255,255,255,0.95)"
                                                    : isCompleted
                                                        ? "rgba(148,163,184,0.70)"
                                                        : isAvailable
                                                            ? "rgba(147,197,253,0.85)"
                                                            : "rgba(100,116,139,0.45)";

                                                // Expand normalized coords to world space
                                                const acx = zl.cx + nd.ncx * zl.grownR;
                                                const acy = zl.cy + nd.ncy * zl.grownR;
                                                const r = nodeDotR;

                                                // Shape by nodeType (locked nodes always show padlock)
                                                let shape: React.ReactNode;
                                                if (isLocked) {
                                                    const lk = r * 1.05;
                                                    shape = (
                                                        <g>
                                                            <path
                                                                d={`M ${acx - lk*0.45},${acy - lk*0.05} L ${acx - lk*0.45},${acy - lk*0.62} A ${lk*0.45},${lk*0.45} 0 0,1 ${acx + lk*0.45},${acy - lk*0.62} L ${acx + lk*0.45},${acy - lk*0.05}`}
                                                                fill="none" stroke={nodeStrokeCol} strokeWidth={nodeStroke * 1.1} strokeLinecap="round"
                                                            />
                                                            <rect x={acx - lk*0.65} y={acy - lk*0.12} width={lk*1.3} height={lk*1.05} rx={lk*0.18}
                                                                fill={nodeFill} stroke={nodeStrokeCol} strokeWidth={nodeStroke} />
                                                            <circle cx={acx} cy={acy + lk*0.25} r={lk*0.18} fill={nodeStrokeCol} />
                                                        </g>
                                                    );
                                                } else {
                                                    switch (nd.group.nodeType) {
                                                        case "junction": {
                                                            // Diamond outline + right-pointing arrow (matches in-game icon)
                                                            const jd = r * 1.35;
                                                            const arrowPts = `${acx - r*0.42},${acy - r*0.60} ${acx + r*0.68},${acy} ${acx - r*0.42},${acy + r*0.60}`;
                                                            shape = (
                                                                <g>
                                                                    <polygon points={`${acx},${acy-jd} ${acx+jd},${acy} ${acx},${acy+jd} ${acx-jd},${acy}`}
                                                                        fill="rgba(8,16,36,0.75)" stroke={nodeStrokeCol} strokeWidth={nodeStroke} />
                                                                    <polygon points={arrowPts} fill={nodeStrokeCol} />
                                                                </g>
                                                            );
                                                            break;
                                                        }
                                                        case "boss": {
                                                            // 5-pointed star — assassination/boss encounter
                                                            const bPts = Array.from({length: 10}, (_, i) => {
                                                                const a = (i * Math.PI / 5) - Math.PI / 2;
                                                                const rr = i % 2 === 0 ? r * 1.2 : r * 0.5;
                                                                return `${acx + Math.cos(a) * rr},${acy + Math.sin(a) * rr}`;
                                                            }).join(" ");
                                                            shape = <polygon points={bPts} fill={nodeFill} stroke={nodeStrokeCol} strokeWidth={nodeStroke} />;
                                                            break;
                                                        }
                                                        case "quest": {
                                                            // Upward triangle — story/quest mission
                                                            const qPts = `${acx},${acy - r*1.2} ${acx + r*1.1},${acy + r*0.75} ${acx - r*1.1},${acy + r*0.75}`;
                                                            shape = <polygon points={qPts} fill={nodeFill} stroke={nodeStrokeCol} strokeWidth={nodeStroke} />;
                                                            break;
                                                        }
                                                        case "hub": {
                                                            // Two circles — relay/social hub
                                                            shape = (
                                                                <g>
                                                                    <circle cx={acx - r*0.38} cy={acy - r*0.1} r={r*0.42} fill={nodeFill} stroke={nodeStrokeCol} strokeWidth={nodeStroke * 0.9} />
                                                                    <circle cx={acx + r*0.38} cy={acy - r*0.1} r={r*0.42} fill={nodeFill} stroke={nodeStrokeCol} strokeWidth={nodeStroke * 0.9} />
                                                                </g>
                                                            );
                                                            break;
                                                        }
                                                        case "special": {
                                                            // Octagon — one-off unique node
                                                            const oPts = Array.from({length: 8}, (_, i) => {
                                                                const a = (i * Math.PI / 4) - Math.PI / 8;
                                                                return `${acx + Math.cos(a) * r*1.05},${acy + Math.sin(a) * r*1.05}`;
                                                            }).join(" ");
                                                            shape = <polygon points={oPts} fill={nodeFill} stroke={nodeStrokeCol} strokeWidth={nodeStroke} />;
                                                            break;
                                                        }
                                                        default: {
                                                            // Diamond — standard mission
                                                            const dPts = `${acx},${acy - r} ${acx + r},${acy} ${acx},${acy + r} ${acx - r},${acy}`;
                                                            shape = <polygon points={dPts} fill={nodeFill} stroke={nodeStrokeCol} strokeWidth={nodeStroke} />;
                                                        }
                                                    }
                                                }

                                                return (
                                                    <g
                                                        key={`nd-${zl.planet.id}-${nd.group.key}`}
                                                        data-clickable="true"
                                                        onClick={() => onClickGroup(pid, nd.group)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <circle cx={acx} cy={acy} r={nodeDotR * 2} fill="transparent" />
                                                        {shape}
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
                                // Selected planet label stays fully visible as overview fades
                                opacity: p.id === selectedPlanetId ? 1 : p.opacity,
                                transform: "translate(-50%, -50%)",
                                textTransform: "uppercase",
                                textShadow: "-1px -1px 0 rgba(0,0,0,0.95), 1px -1px 0 rgba(0,0,0,0.95), -1px 1px 0 rgba(0,0,0,0.95), 1px 1px 0 rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.8)",
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
                                // Selected planet label stays fully visible as zoom reveal fades
                                opacity: p.id === selectedPlanetId ? 1 : p.opacity,
                                transform: "translate(-50%, -50%)",
                                textTransform: "uppercase",
                                textShadow: "-1px -1px 0 rgba(0,0,0,0.95), 1px -1px 0 rgba(0,0,0,0.95), -1px 1px 0 rgba(0,0,0,0.95), 1px 1px 0 rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.8)",
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
                                    textShadow: "-1px -1px 0 rgba(0,0,0,0.95), 1px -1px 0 rgba(0,0,0,0.95), -1px 1px 0 rgba(0,0,0,0.95), 1px 1px 0 rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.8)",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {l.text}
                            </div>
                        ))}
                </div>

                {/* ── Bottom-right controls: Legend + Help ────────────────────── */}
                <div className="absolute bottom-3 right-3 z-30 flex items-end gap-2">
                    {/* Collapsible legend panel */}
                    <div className="flex flex-col items-end gap-2">
                        {showLegend && (
                            <div className="rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-xs text-slate-300 backdrop-blur-sm">
                                <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Node Types</div>
                                {([
                                    { label: "Mission",  desc: "Standard mission",           shape: "diamond"  },
                                    { label: "Junction", desc: "Unlocks next planet",        shape: "junction" },
                                    { label: "Boss",     desc: "Assassination encounter",    shape: "boss"     },
                                    { label: "Quest",    desc: "Story mission",              shape: "quest"    },
                                    { label: "Hub",      desc: "Relay / social hub",         shape: "hub"      },
                                    { label: "Special",  desc: "Unique one-off node",        shape: "special"  },
                                ] as const).map(({ label, desc, shape }) => (
                                    <div key={label} className="flex items-center gap-2.5 py-0.5">
                                        <svg width="18" height="18" viewBox="-9 -9 18 18" className="shrink-0">
                                            {shape === "diamond"  && <polygon points="0,-6 6,0 0,6 -6,0" fill="rgba(147,197,253,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.2" />}
                                            {shape === "junction" && <>
                                                <polygon points="0,-6.5 6.5,0 0,6.5 -6.5,0" fill="rgba(10,20,50,0.75)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.2" />
                                                <polygon points="-2.8,-3.5 4,0 -2.8,3.5" fill="rgba(147,197,253,0.85)" />
                                            </>}
                                            {shape === "boss"     && (() => {
                                                const pts = Array.from({length:10},(_,i)=>{const a=(i*Math.PI/5)-Math.PI/2,rr=i%2===0?7:3;return `${Math.cos(a)*rr},${Math.sin(a)*rr}`;}).join(" ");
                                                return <polygon points={pts} fill="rgba(147,197,253,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.2" />;
                                            })()}
                                            {shape === "quest"    && <polygon points="0,-7 6.5,4.5 -6.5,4.5" fill="rgba(147,197,253,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.2" />}
                                            {shape === "hub"      && <>
                                                <circle cx="-2.5" cy="-0.5" r="3" fill="rgba(147,197,253,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.1" />
                                                <circle cx="2.5"  cy="-0.5" r="3" fill="rgba(147,197,253,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.1" />
                                            </>}
                                            {shape === "special"  && (() => {
                                                const pts = Array.from({length:8},(_,i)=>{const a=(i*Math.PI/4)-Math.PI/8;return `${Math.cos(a)*6},${Math.sin(a)*6}`;}).join(" ");
                                                return <polygon points={pts} fill="rgba(147,197,253,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.2" />;
                                            })()}
                                        </svg>
                                        <div>
                                            <span className="font-semibold text-slate-200">{label}</span>
                                            <span className="ml-1.5 text-slate-500">{desc}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-2 border-t border-slate-800 pt-2">
                                    <div className="mb-1.5 text-[10px] uppercase tracking-widest text-slate-500">Completion</div>
                                    {([
                                        { label: "Available",  stroke: "rgba(147,197,253,0.85)", fill: "rgba(59,130,246,0.10)"  },
                                        { label: "Completed",  stroke: "rgba(148,163,184,0.70)", fill: "rgba(51,65,85,0.50)"    },
                                        { label: "Locked",     stroke: "rgba(100,116,139,0.45)", fill: "rgba(1,4,18,0.35)"      },
                                    ] as const).map(({ label, stroke, fill }) => (
                                        <div key={label} className="flex items-center gap-2.5 py-0.5">
                                            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm border" style={{ borderColor: stroke, background: fill }} />
                                            <span className="text-slate-300">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-sm hover:bg-slate-900/80 transition-colors"
                            onClick={() => setShowLegend((v) => !v)}
                        >
                            {showLegend ? "Hide Legend" : "Legend"}
                        </button>
                    </div>

                    {/* Help tooltip — replaces the always-visible hint bar */}
                    <div className="group relative">
                        <button className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-950/70 text-xs text-slate-400 backdrop-blur-sm hover:bg-slate-900/80 transition-colors">
                            ?
                        </button>
                        <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-72 rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs leading-relaxed text-slate-400 backdrop-blur-sm group-hover:block">
                            Drag to pan · Scroll to zoom · Click a planet to zoom in · Zoom in to expand planets and reveal nodes · Click a node to see drops · Click again to deselect
                        </div>
                    </div>
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

                    {focusedTitle && (
                        <div className="ml-2 hidden items-center gap-2 sm:flex">
                            <div className="text-xs text-slate-400">{focusedTitle}</div>
                            {selectedPlanetId && (() => {
                                const ids = (groupedByPlanet.get(selectedPlanetId) ?? []).map((g) => g.baseNodeId);
                                const allDone = ids.every((id) => effectiveNodeCompletedMap[id]);
                                return (
                                    <button
                                        className="rounded border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                                        title="Toggle completion for all nodes on this planet"
                                        onClick={() => activeSetBulkNodesCompleted(ids, !allDone)}
                                    >
                                        {allDone ? "Unmark all" : "Mark all complete"}
                                    </button>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* ── Steel Path toggle (middle-right) ─────────────────────── */}
                <div className="absolute right-3 top-1/2 z-30 -translate-y-1/2">
                    <button
                        className={[
                            "flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-sm transition-colors",
                            steelPathMode
                                ? "border-amber-500/70 bg-amber-950/70 text-amber-300 hover:bg-amber-900/80"
                                : "border-slate-600 bg-slate-950/70 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                        ].join(" ")}
                        title={steelPathMode ? "Switch to Normal mode" : "Switch to Steel Path mode"}
                        onClick={() => setSteelPathMode((v) => !v)}
                    >
                        {/* Steel Path crossed-swords icon (SVG approximation) */}
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="4" y1="18" x2="18" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                            <line x1="4" y1="4"  x2="18" y2="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                            <circle cx="11" cy="11" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4"/>
                        </svg>
                        <span>{steelPathMode ? "Steel Path" : "Normal"}</span>
                    </button>
                </div>

                {/* ── Alternative map buttons (top-right) ─────────────────── */}
                <div className="absolute right-3 top-3 z-30 flex flex-col gap-2">
                    {/* Railjack / Proxima */}
                    <button
                        className="group flex h-14 w-14 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-slate-600 bg-slate-950/80 backdrop-blur-sm hover:border-cyan-500/60 hover:bg-slate-900/90 transition-colors"
                        title="Open Railjack / Proxima map"
                        onClick={() => setMainMapMode("proxima")}
                    >
                        {/* Railjack silhouette */}
                        <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-300 group-hover:text-cyan-300 transition-colors">
                            <path d="M16 2 L30 11 L24 12 L22 18 L16 13 L10 18 L8 12 L2 11 Z" stroke="currentColor" strokeWidth="1.2" fill="rgba(100,180,255,0.08)"/>
                            <line x1="16" y1="2" x2="16" y2="13" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
                        </svg>
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 group-hover:text-cyan-300 transition-colors">Proxima</span>
                    </button>

                    {/* Duviri */}
                    <button
                        className="group flex h-14 w-14 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-slate-600 bg-slate-950/80 backdrop-blur-sm hover:border-purple-500/60 hover:bg-slate-900/90 transition-colors"
                        title="Open Duviri map"
                        onClick={() => setMainMapMode("duviri")}
                    >
                        {/* Duviri mask silhouette */}
                        <svg width="22" height="24" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-300 group-hover:text-purple-300 transition-colors">
                            <path d="M11 2 C6 2 2 6 2 11 C2 16 5 20 9 21 L9 23 L13 23 L13 21 C17 20 20 16 20 11 C20 6 16 2 11 2 Z" stroke="currentColor" strokeWidth="1.2" fill="rgba(180,100,255,0.08)"/>
                            <path d="M7 10 C7 9 8 8.5 9 9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                            <path d="M15 10 C15 9 14 8.5 13 9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                            <path d="M8 13 Q11 15.5 14 13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                            <line x1="4"  y1="8"  x2="2"  y2="6"  stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                            <line x1="18" y1="8"  x2="20" y2="6"  stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 group-hover:text-purple-300 transition-colors">Duviri</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// List view: flat planet/node list with completion checkboxes
// ─────────────────────────────────────────────────────────────────────────────
type SCListProps = {
    steelPathMode: boolean;
};

function StarChartListView({ steelPathMode }: SCListProps) {
    const setNodeCompleted          = useTrackerStore((s) => s.setNodeCompleted);
    const setSteelPathNodeCompleted = useTrackerStore((s) => s.setSteelPathNodeCompleted);
    const setBulkNodesCompleted          = useTrackerStore((s) => s.setBulkNodesCompleted);
    const setBulkSteelPathNodesCompleted = useTrackerStore((s) => s.setBulkSteelPathNodesCompleted);
    const nodeCompletedMap   = useTrackerStore((s) => s.state.missions?.nodeCompleted           ?? EMPTY_NODE_COMPLETED);
    const spNodeCompletedMap = useTrackerStore((s) => s.state.missions?.steelPathNodeCompleted  ?? EMPTY_NODE_COMPLETED);
    const completedPrereqs   = useTrackerStore((s) => s.state.prereqs?.completed               ?? EMPTY_NODE_COMPLETED);

    const activeMap        = steelPathMode ? spNodeCompletedMap   : nodeCompletedMap;
    const activeSetOne     = steelPathMode ? setSteelPathNodeCompleted : setNodeCompleted;
    const activeSetBulk    = steelPathMode ? setBulkSteelPathNodesCompleted : setBulkNodesCompleted;

    const VORS_PRIZE_IMPLIES_COMPLETED: Record<string, true> = {
        "node:junction_mercury_venus": true,
        "node:junction_venus_earth":   true,
        "node:mr/earth/e-prime":       true,
        "node:mr/earth/mariana":       true,
        "node:mr/earth/mantle":        true,
        "node:mr/earth/gaia":          true,
        "node:mr/earth/pacific":       true,
        "node:mr/earth/cambria":       true,
        "node:hub/earth/strata-relay": true,
    };

    const effectiveMap = useMemo(() => {
        if (steelPathMode) return activeMap;
        const derived: Record<string, boolean> = completedPrereqs[PR.VORS_PRIZE]
            ? { ...VORS_PRIZE_IMPLIES_COMPLETED }
            : {};
        return { ...derived, ...nodeCompletedMap };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [steelPathMode, completedPrereqs, nodeCompletedMap, spNodeCompletedMap]);

    // Build unlocked set (always from normal junctions, not SP)
    const unlockedPlanetIds = useMemo(() => {
        const unlocked = new Set<string>(["planet:mercury"]);
        for (const n of STAR_CHART_DATA.nodes) {
            if (n.nodeType === "junction" && n.unlocksPlanetId) {
                const base = n.id;
                const vorsImplied = VORS_PRIZE_IMPLIES_COMPLETED[base];
                if (vorsImplied && completedPrereqs[PR.VORS_PRIZE]) {
                    unlocked.add(n.unlocksPlanetId);
                } else if (nodeCompletedMap[base]) {
                    unlocked.add(n.unlocksPlanetId);
                }
            }
        }
        return unlocked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [completedPrereqs, nodeCompletedMap]);

    // Planets in the main map, ordered by name
    const planets = useMemo(() =>
        STAR_CHART_DATA.planets.filter(isInMainMap).sort((a, b) => a.name.localeCompare(b.name)),
    []);

    // Nodes grouped by planet
    const groupedByPlanet = useMemo(() => {
        const m = new Map<string, StarChartNode[]>();
        for (const n of STAR_CHART_DATA.nodes) {
            const arr = m.get(n.planetId) ?? [];
            arr.push(n);
            m.set(n.planetId, arr);
        }
        return m;
    }, []);

    const [search, setSearch] = useState("");
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const q = search.trim().toLowerCase();

    const nodeTypeLabel: Record<string, string> = {
        mission: "", junction: "Junction", boss: "Boss", quest: "Quest", hub: "Hub", special: "Special"
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <input
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                    placeholder="Filter planets or nodes…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {planets.map((planet) => {
                const nodes = (groupedByPlanet.get(planet.id) ?? [])
                    .filter((n) => !q || n.name.toLowerCase().includes(q) || planet.name.toLowerCase().includes(q))
                    .sort((a, b) => a.name.localeCompare(b.name));

                if (nodes.length === 0) return null;

                const isUnlocked = steelPathMode || unlockedPlanetIds.has(planet.id);
                const allDone = nodes.every((n) => effectiveMap[n.id]);
                const isCollapsed = collapsed.has(planet.id);
                const doneCount = nodes.filter((n) => effectiveMap[n.id]).length;

                return (
                    <div key={planet.id} className={["rounded-xl border", isUnlocked ? "border-slate-700" : "border-slate-800/60"].join(" ")}>
                        {/* Planet header */}
                        <div
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 select-none"
                            onClick={() => setCollapsed((prev) => {
                                const next = new Set(prev);
                                if (next.has(planet.id)) next.delete(planet.id);
                                else next.add(planet.id);
                                return next;
                            })}
                        >
                            <span className="text-xs text-slate-500 w-3">{isCollapsed ? "▶" : "▼"}</span>
                            <span className={["flex-1 text-sm font-semibold uppercase tracking-widest", isUnlocked ? "text-slate-200" : "text-slate-600"].join(" ")}>
                                {planet.name}
                            </span>
                            <span className="text-xs text-slate-500">{doneCount}/{nodes.length}</span>
                            {isUnlocked && (
                                <button
                                    className="rounded border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        activeSetBulk(nodes.map((n) => n.id), !allDone);
                                    }}
                                >
                                    {allDone ? "Unmark all" : "Mark all"}
                                </button>
                            )}
                        </div>

                        {/* Node list */}
                        {!isCollapsed && (
                            <div className="border-t border-slate-800/60 px-3 py-1 space-y-0.5">
                                {nodes.map((node) => {
                                    const isCompleted = Boolean(effectiveMap[node.id]);
                                    const isLocked    = !isUnlocked;
                                    const typeLabel   = nodeTypeLabel[node.nodeType] ?? "";
                                    return (
                                        <label
                                            key={node.id}
                                            className={[
                                                "flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-slate-800/40",
                                                isLocked ? "opacity-40" : ""
                                            ].join(" ")}
                                        >
                                            <input
                                                type="checkbox"
                                                disabled={isLocked}
                                                checked={isCompleted}
                                                onChange={(e) => activeSetOne(node.id, e.target.checked)}
                                                className="accent-blue-400"
                                            />
                                            <span className={isCompleted ? "text-slate-500 line-through" : "text-slate-200"}>
                                                {displayNameFromBase(node)}
                                            </span>
                                            {typeLabel && (
                                                <span className="ml-auto text-[10px] text-slate-600 uppercase tracking-widest">{typeLabel}</span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Proxima / Railjack map — reuses StarChartMap with a proxima planet filter
// ─────────────────────────────────────────────────────────────────────────────

// Calibrated to show all 6 proxima regions with padding at initial load.
// Proxima world positions span roughly x: -55 to 165, y: -20 to 85.
const PROXIMA_INITIAL_VB: ViewBox = { x: -95, y: -60, w: 301, h: 185 };

function isProximaPlanet(p: StarChartPlanet): boolean {
    return p.id.endsWith("_proxima");
}

function StarChartProximaView({ onBack }: { onBack: () => void }) {
    const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId | null>(null);
    const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<NodeGroupKind>("base");
    const [vb, setVb] = useState<ViewBox>(PROXIMA_INITIAL_VB);
    const [steelPathMode, setSteelPathMode] = useState(false);

    const sourceToItemsIndex = useMemo(() => buildSourceToItemsIndex(), []);

    const planetsById = useMemo(() => {
        const m = new Map<string, StarChartPlanet>();
        for (const p of STAR_CHART_DATA.planets) m.set(p.id, p);
        return m;
    }, []);

    const groupedByPlanet = useMemo(() => {
        const out = new Map<string, NodeGroup[]>();
        const byPlanet = new Map<string, StarChartNode[]>();
        for (const n of STAR_CHART_DATA.nodes) {
            const pid = String(n.planetId);
            const arr = byPlanet.get(pid) ?? [];
            arr.push(n);
            byPlanet.set(pid, arr);
        }
        for (const [pid, nodes] of byPlanet.entries()) {
            out.set(pid, groupPlanetNodesForDisplay(nodes));
        }
        return out;
    }, []);

    const focusedPlanet = useMemo(() => (selectedPlanetId ? planetsById.get(selectedPlanetId) ?? null : null), [selectedPlanetId, planetsById]);
    const focusedPlanetGroups = useMemo(() => selectedPlanetId ? (groupedByPlanet.get(selectedPlanetId) ?? []) : [], [selectedPlanetId, groupedByPlanet]);
    const selectedGroup = useMemo(() => selectedGroupKey ? (focusedPlanetGroups.find((g) => g.key === selectedGroupKey) ?? null) : null, [selectedGroupKey, focusedPlanetGroups]);

    const tabsForPanel = useMemo(() => {
        if (!selectedGroup) return [] as TabSpec[];
        const rawKinds: NodeGroupKind[] = ["all", "base", "mission_rewards", "caches", "extra"];
        const raw = rawKinds.map((k) => buildTabSpecRaw({ group: selectedGroup, kind: k, sourceToItemsIndex }));
        const keep = raw.filter((s) => s.kind === "all" || s.dropSources.length > 0);
        const exclusive = applyExclusiveAssignment(keep);
        const finalTabs = exclusive.filter((t) => t.kind === "all" || t.items.length > 0 || t.dropSources.length > 0);
        return finalTabs.map((t) => ({ ...t, items: normalizeMissionRewardItemsForDisplay(t.items) }));
    }, [selectedGroup, sourceToItemsIndex]);

    const activeTab = useMemo(() => {
        if (!selectedGroup) return null;
        return tabsForPanel.find((x) => x.kind === selectedTab) ?? tabsForPanel[0] ?? null;
    }, [selectedGroup, tabsForPanel, selectedTab]);

    useEffect(() => {
        if (!selectedGroupKey) return;
        const allowed = new Set(tabsForPanel.map((t) => t.kind));
        if (allowed.size === 0) return;
        if (!allowed.has(selectedTab)) setSelectedTab(tabsForPanel[0]?.kind ?? "base");
    }, [selectedGroupKey, tabsForPanel, selectedTab]);

    const scale = useMemo(() => viewBoxToScale(vb), [vb]);
    const focusedTitle = useMemo(() => {
        if (scale <= 1.15 || !focusedPlanet) return null;
        return `Selected: ${focusedPlanet.name}`;
    }, [scale, focusedPlanet]);

    const showDropsPanel = Boolean(selectedGroupKey);

    const junctionNode = useMemo<StarChartNode | null>(() => {
        if (!selectedGroup) return null;
        const node = STAR_CHART_DATA.nodes.find((n) => n.id === selectedGroup.baseNodeId) ?? null;
        return node?.nodeType === "junction" ? node : null;
    }, [selectedGroup]);

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
                <button
                    className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    onClick={onBack}
                >← Back to Star Chart</button>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-100">Proxima / Railjack</div>
                    <div className="text-xs text-slate-500">Drag to pan · Wheel to zoom · Click a region to expand · Click a node to view drops</div>
                </div>
                <button
                    className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    onClick={() => { setSelectedGroupKey(null); setSelectedTab("base"); setSelectedPlanetId(null); setVb(PROXIMA_INITIAL_VB); }}
                >Reset View</button>
            </div>
            <div className="flex-1 min-h-0">
                <StarChartMap
                    isInModal={false}
                    vb={vb} setVb={setVb}
                    selectedPlanetId={selectedPlanetId} setSelectedPlanetId={setSelectedPlanetId}
                    selectedPlanetName={focusedPlanet?.name ?? null}
                    selectedGroupKey={selectedGroupKey} setSelectedGroupKey={setSelectedGroupKey}
                    selectedTab={selectedTab} setSelectedTab={setSelectedTab}
                    selectedGroupDisplayName={selectedGroup?.displayName ?? null}
                    tabsForPanel={tabsForPanel} activeTab={activeTab}
                    focusedTitle={focusedTitle}
                    showDropsPanel={showDropsPanel}
                    junctionNode={junctionNode}
                    selectedGroupBaseNodeId={selectedGroup?.baseNodeId ?? null}
                    steelPathMode={steelPathMode} setSteelPathMode={setSteelPathMode}
                    setMainMapMode={() => {}}
                    planetFilter={isProximaPlanet}
                />
            </div>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// Duviri — four archway experience panels
// ─────────────────────────────────────────────────────────────────────────────

const DUVIRI_EXPERIENCES = [
    {
        id: "duviri_isleweaver",
        nodeId: "node:duviri/isleweaver",
        label: "Isleweaver",
        description: <>Explore the Undercroft with a randomly chosen Warframe.<br /><br />Challenge Neci Rusalka in the spiral:<br />"The Triumph of Dust."</>,
        color: { base: "#9b4dca", border: "rgba(180,100,255,0.45)", glow: "rgba(130,50,200,0.35)", text: "#d8b4fe" },
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                <path d="M12 3L4 9v6l8 6 8-6V9L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M12 3v18M4 9l8 6 8-6" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
            </svg>
        ),
    },
    {
        id: "duviri_circuit",
        nodeId: "node:duviri/circuit",
        label: "The Circuit",
        description: <>Complete the weekly Circuit for Warframes and Incarnon Genesis adapters.<br /><br />Warframe only. Battle through an endless chain of missions.</>,
        color: { base: "#e6a817", border: "rgba(230,168,23,0.45)", glow: "rgba(200,140,20,0.35)", text: "#fde68a" },
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                <polygon points="12,2 15.5,9 23,10 17.5,15.5 19,23 12,19.5 5,23 6.5,15.5 1,10 8.5,9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: "duviri_experience",
        nodeId: "node:duviri/experience",
        label: "The Duviri Experience",
        description: <>The main story arc — explore the Spiral and complete Decrees.<br /><br />Duviri as it was intended to be played.<br />Story and side objectives together.</>,
        color: { base: "#64748b", border: "rgba(148,163,184,0.40)", glow: "rgba(100,130,170,0.30)", text: "#cbd5e1" },
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 3C12 3 7 8 7 12s5 9 5 9" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
                <path d="M12 3C12 3 17 8 17 12s-5 9-5 9" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
                <path d="M3 12h18" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
            </svg>
        ),
    },
    {
        id: "duviri_lone_story",
        nodeId: "node:duviri/lone_story",
        label: "The Lone Story",
        description: <>A journey through the Spiral.<br /><br />Just the Spiral's story. Duviri devoid of all side objectives.</>,
        color: { base: "#0ea5e9", border: "rgba(56,189,248,0.40)", glow: "rgba(14,165,233,0.30)", text: "#7dd3fc" },
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                <path d="M12 22s-8-6-8-12a8 8 0 1 1 16 0c0 6-8 12-8 12z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
    },
];

function DuviriArchway({ exp, isCompleted, onToggle }: {
    exp: typeof DUVIRI_EXPERIENCES[0];
    isCompleted: boolean;
    onToggle: () => void;
}) {
    // The archway shape: a rectangular panel with a rounded arch top, matching the in-game aesthetic
    const { color } = exp;

    return (
        <button
            onClick={onToggle}
            className="group relative flex flex-col items-center text-center transition-all duration-200 focus:outline-none"
            style={{ width: "100%" }}
        >
            {/* Archway frame — no overflow:hidden so description text is never clipped */}
            <div
                className="relative w-full transition-all duration-200 group-hover:scale-[1.02]"
                style={{
                    borderRadius: "50% 50% 6px 6px / 32px 32px 6px 6px",
                    border: `1px solid ${isCompleted ? "rgba(52,211,153,0.6)" : color.border}`,
                    background: isCompleted
                        ? "linear-gradient(180deg, rgba(6,20,14,0.95) 0%, rgba(4,30,20,0.92) 100%)"
                        : `linear-gradient(180deg, rgba(8,12,28,0.96) 0%, rgba(5,8,20,0.92) 100%)`,
                    boxShadow: isCompleted
                        ? `0 0 28px rgba(52,211,153,0.20), inset 0 0 40px rgba(52,211,153,0.06)`
                        : `0 0 28px ${color.glow}, inset 0 0 40px ${color.glow}`,
                    paddingTop: "48px",
                    paddingBottom: "24px",
                    paddingLeft: "16px",
                    paddingRight: "16px",
                }}
            >
                {/* Inner arch glow line at the top */}
                <div
                    className="absolute inset-x-4 top-0 h-px"
                    style={{
                        background: isCompleted
                            ? "linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)"
                            : `linear-gradient(90deg, transparent, ${color.border}, transparent)`,
                        borderRadius: "50%",
                        top: "6px",
                    }}
                />

                {/* Icon area */}
                <div
                    className="mx-auto mb-4 flex items-center justify-center rounded-full"
                    style={{
                        width: "56px",
                        height: "56px",
                        background: isCompleted ? "rgba(6,40,24,0.80)" : "rgba(10,14,34,0.80)",
                        border: `1px solid ${isCompleted ? "rgba(52,211,153,0.40)" : color.border}`,
                        color: isCompleted ? "#34d399" : color.text,
                    }}
                >
                    {exp.icon}
                </div>

                {/* Label */}
                <div
                    className="text-sm font-bold uppercase tracking-widest mb-2 leading-tight"
                    style={{ color: isCompleted ? "#34d399" : color.text }}
                >
                    {exp.label}
                </div>

                {/* Description */}
                <div className="text-[11px] leading-relaxed text-slate-400 px-1">
                    {exp.description}
                </div>

                {/* Completion badge */}
                {isCompleted && (
                    <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Complete
                    </div>
                )}

                {/* Corner decorations */}
                <div className="absolute bottom-2 left-2 w-4 h-4 opacity-30"
                    style={{ borderLeft: `1px solid ${color.text}`, borderBottom: `1px solid ${color.text}` }} />
                <div className="absolute bottom-2 right-2 w-4 h-4 opacity-30"
                    style={{ borderRight: `1px solid ${color.text}`, borderBottom: `1px solid ${color.text}` }} />
            </div>

            {/* Label below arch */}
            <div
                className="mt-2 text-[11px] font-medium uppercase tracking-widest"
                style={{ color: isCompleted ? "#6ee7b7" : "rgba(148,163,184,0.7)" }}
            >
                {isCompleted ? "✓ Done" : "Click to mark"}
            </div>
        </button>
    );
}

function StarChartDuviriView({ onBack }: { onBack: () => void }) {
    const setNodeCompleted = useTrackerStore((s) => s.setNodeCompleted);
    const nodeCompletedMap = useTrackerStore((s) => s.state.missions?.nodeCompleted ?? EMPTY_NODE_COMPLETED);

    const completedCount = DUVIRI_EXPERIENCES.filter((e) => nodeCompletedMap[e.nodeId]).length;

    return (
        <div className="flex h-[72vh] min-h-[560px] flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
                <button
                    className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    onClick={onBack}
                >← Back to Star Chart</button>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-100">Duviri Paradox</div>
                    <div className="text-xs text-slate-500">
                        {completedCount}/{DUVIRI_EXPERIENCES.length} experiences complete · Click a panel to mark as done
                    </div>
                </div>
            </div>

            {/* Archway panels — dark atmospheric background */}
            <div
                className="flex-1 overflow-auto"
                style={{
                    background: "radial-gradient(ellipse at 50% 0%, rgba(40,30,80,0.40) 0%, rgba(2,6,23,0) 70%), rgb(2,6,23)",
                }}
            >
                {/* Sorrow Spiral header — references current Spiral emotion shown in-game */}
                <div className="flex flex-col items-center pt-6 pb-2">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-slate-600 mb-1">The Spiral</div>
                    <div className="text-lg font-semibold text-slate-300 tracking-wide">Duviri</div>
                    <div className="mt-1 text-xs text-slate-500">Choose your path through the Undercroft</div>
                </div>

                {/* Four archway panels — 1 col on very small phones, 2 on sm+, 4 on lg+ */}
                <div className="grid grid-cols-1 gap-4 px-4 pb-6 pt-2 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                    {DUVIRI_EXPERIENCES.map((exp) => (
                        <DuviriArchway
                            key={exp.id}
                            exp={exp}
                            isCompleted={Boolean(nodeCompletedMap[exp.nodeId])}
                            onToggle={() => setNodeCompleted(exp.nodeId, !nodeCompletedMap[exp.nodeId])}
                        />
                    ))}
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
    backdrop-filter: blur(6px);
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

    // ~35% zoom (vb.w=286 → scale=100/286≈0.35), centered on the actual planet
    // cluster centroid rather than the mathematical world center.
    const INITIAL_VB: ViewBox = { x: -100, y: -109, w: 286, h: 286 };
    const [vb, setVb] = useState<ViewBox>(INITIAL_VB);

    const sourceToItemsIndex = useMemo(() => buildSourceToItemsIndex(), []);

    const planetsById = useMemo(() => {
        const m = new Map<string, StarChartPlanet>();
        for (const p of STAR_CHART_DATA.planets) m.set(p.id, p);
        return m;
    }, []);

    const groupedByPlanet = useMemo(() => {
        const out = new Map<string, NodeGroup[]>();
        const byPlanet = new Map<string, StarChartNode[]>();

        for (const n of STAR_CHART_DATA.nodes) {
            const pid = String(n.planetId);
            const arr = byPlanet.get(pid) ?? [];
            arr.push(n);
            byPlanet.set(pid, arr);
        }

        for (const [pid, nodes] of byPlanet.entries()) {
            out.set(pid, groupPlanetNodesForDisplay(nodes));
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

    // View mode: "map" shows the SVG star chart, "list" shows the flat node list.
    const [viewMode, setViewMode] = useState<"map" | "list">("map");

    // Which alternate map is displayed (normal = main star chart).
    const [mainMapMode, setMainMapMode] = useState<"normal" | "proxima" | "duviri">("normal");

    // Steel Path tracking toggle.
    const [steelPathMode, setSteelPathMode] = useState(false);

    function resetView() {
        setSelectedGroupKey(null);
        setSelectedTab("base");
        setSelectedPlanetId(null);
        setVb(INITIAL_VB);
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

    const sharedMapProps = {
        vb, setVb,
        selectedPlanetId, setSelectedPlanetId,
        selectedPlanetName: focusedPlanet?.name ?? null,
        selectedGroupKey, setSelectedGroupKey,
        selectedTab, setSelectedTab,
        selectedGroupDisplayName: selectedGroup?.displayName ?? null,
        tabsForPanel, activeTab, focusedTitle,
        showDropsPanel, junctionNode,
        selectedGroupBaseNodeId: selectedGroup?.baseNodeId ?? null,
        steelPathMode, setSteelPathMode,
        setMainMapMode,
    };

    const sectionSubtitle =
        viewMode === "list"
            ? "Flat list of all star chart nodes. Check off nodes as you complete them."
            : mainMapMode === "proxima"
            ? "Railjack mission regions."
            : mainMapMode === "duviri"
            ? "The Duviri Paradox."
            : "Drag to pan. Wheel to zoom. Click a planet to expand it. Click a node to view obtainable items.";

    return (
        <div className="space-y-6">
            <StarChartModalStyles />

            <Section
                title="Star Chart"
                subtitle={sectionSubtitle}
                actions={
                    <>
                        {/* Map / List toggle */}
                        <div className="flex rounded-lg border border-slate-700 overflow-hidden text-sm font-semibold">
                            <button
                                className={["px-3 py-2 transition-colors", viewMode === "map" ? "bg-slate-700 text-slate-100" : "bg-slate-950/20 text-slate-400 hover:bg-slate-900/40"].join(" ")}
                                onClick={() => setViewMode("map")}
                            >
                                Map
                            </button>
                            <button
                                className={["px-3 py-2 transition-colors border-l border-slate-700", viewMode === "list" ? "bg-slate-700 text-slate-100" : "bg-slate-950/20 text-slate-400 hover:bg-slate-900/40"].join(" ")}
                                onClick={() => setViewMode("list")}
                            >
                                List
                            </button>
                        </div>

                        {viewMode === "map" && mainMapMode === "normal" && (
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
                        )}
                    </>
                }
            >
                {viewMode === "list" ? (
                    <StarChartListView steelPathMode={steelPathMode} />
                ) : mainMapMode === "proxima" ? (
                    <StarChartProximaView onBack={() => setMainMapMode("normal")} />
                ) : mainMapMode === "duviri" ? (
                    <StarChartDuviriView onBack={() => setMainMapMode("normal")} />
                ) : (
                    <StarChartMap isInModal={false} {...sharedMapProps} />
                )}
            </Section>

            <StarChartModal
                isOpen={isOpen}
                title="Star Chart"
                subtitle="Drag to pan · Wheel to zoom · Click a planet to zoom into it · Click node again to unselect"
                onClose={() => setIsOpen(false)}
            >
                <StarChartMap isInModal={true} {...sharedMapProps} />
            </StarChartModal>
        </div>
    );
}