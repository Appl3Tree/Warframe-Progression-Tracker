// ===== FILE: src/pages/StarChart.tsx =====

import { useEffect, useMemo, useRef, useState } from 'react';
import { STAR_CHART_DATA } from '../domain/catalog/starChart';
import type { NodeId, PlanetId, StarChartNode, StarChartPlanet } from '../domain/models/starChart';
import { getDropSourcesForStarChartNode } from '../domain/catalog/starChart/nodeDropSourceMap';
import { FULL_CATALOG } from '../domain/catalog/loadFullCatalog';
import { getAcquisitionByCatalogId } from '../catalog/items/itemAcquisition';
import { SOURCE_INDEX } from '../catalog/sources/sourceCatalog';
import { normalizeSourceId } from '../domain/ids/sourceIds';

type ItemRow = { catalogId: string; name: string };

function Section(props: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
    return (
        <div className='rounded-2xl border border-slate-800 bg-slate-950/40 p-4'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='min-w-0'>
                    <div className='text-lg font-semibold'>{props.title}</div>
                    {props.subtitle && <div className='text-sm text-slate-400 mt-1'>{props.subtitle}</div>}
                </div>
                {props.actions && <div className='flex items-center gap-2'>{props.actions}</div>}
            </div>
            <div className='mt-4'>{props.children}</div>
        </div>
    );
}

function safeString(v: unknown): string {
    return typeof v === 'string' ? v : String(v ?? '');
}

function safeNormalizeSourceId(raw: string): string | null {
    try {
        return normalizeSourceId(raw);
    } catch {
        return null;
    }
}

function buildSourceToItemsIndex(): Record<string, ItemRow[]> {
    const out: Record<string, ItemRow[]> = Object.create(null);

    const ids = FULL_CATALOG.displayableInventoryItemIds ?? [];
    for (const catalogId of ids) {
        const rec: any = (FULL_CATALOG as any).recordsById?.[catalogId] ?? null;
        const name =
            typeof rec?.displayName === 'string'
                ? rec.displayName
                : typeof rec?.name === 'string'
                  ? rec.name
                  : safeString(catalogId);

        const acq = getAcquisitionByCatalogId(catalogId as any);
        const srcs: string[] = Array.isArray((acq as any)?.sources) ? (acq as any).sources.map(String) : [];

        for (const s of srcs) {
            const norm = safeNormalizeSourceId(String(s ?? '').trim());
            if (!norm) continue;

            if (!out[norm]) out[norm] = [];
            out[norm].push({ catalogId: String(catalogId), name });
        }
    }

    for (const k of Object.keys(out)) out[k].sort((a, b) => a.name.localeCompare(b.name));
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

type ManualPos = { x: number; y: number };

const MANUAL_POS: Record<string, ManualPos> = {
    'region:void': { x: 16, y: 52 },
    'region:zariman': { x: 12, y: 35 },

    'planet:sedna': { x: 51, y: 14 },
    'planet:ceres': { x: 41, y: 26 },
    'planet:phobos': { x: 67, y: 26 },
    'planet:mars': { x: 62, y: 33 },
    'planet:eris': { x: 79, y: 37 },

    'planet:jupiter': { x: 34, y: 44 },
    'planet:europa': { x: 22, y: 45 },
    'planet:deimos': { x: 55, y: 35 },
    'planet:earth': { x: 62, y: 47 },
    'region:lua': { x: 67, y: 48 },
    'planet:pluto': { x: 86, y: 46 },

    'planet:mercury': { x: 45, y: 56 },
    'planet:venus': { x: 56, y: 64 },
    'planet:neptune': { x: 78, y: 75 },
    'planet:saturn': { x: 33, y: 71 },
    'planet:uranus': { x: 52, y: 82 },

    'region:kuva_fortress': { x: 34, y: 58 }
};

function isInMainMap(p: StarChartPlanet): boolean {
    if (p.kind === 'hub') return false;

    if (p.id === 'region:duviri') return false;
    if (p.id.endsWith('_proxima')) return false;
    if (p.id === 'region:dark_refractory_deimos') return false;
    if (p.id === 'auto:sanctuary') return false;
    if (p.id === 'region:hollvania') return false;

    if (p.id === 'region:zariman') return true;
    if (p.id === 'region:void') return true;
    if (p.id === 'region:lua') return true;
    if (p.id === 'region:kuva_fortress') return true;

    return p.kind === 'planet';
}

type ViewBox = { x: number; y: number; w: number; h: number };

function clampViewBox(vb: ViewBox): ViewBox {
    const margin = 8;

    const minW = 10;
    const maxW = 130;

    const w = clamp(vb.w, minW, maxW);
    const h = clamp(vb.h, minW, maxW);

    const minX = -margin;
    const minY = -margin;
    const maxX = 100 + margin - w;
    const maxY = 100 + margin - h;

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

type PlanetLayout = { planet: StarChartPlanet; x: number; y: number; r: number };

function getPlanetRadius(p: StarChartPlanet): number {
    if (p.kind === 'planet') return 2.1;
    if (p.kind === 'region') return 1.9;
    return 1.6;
}

function nodeRevealAlpha(scale: number): number {
    const a = (scale - 1.55) / 0.9;
    return clamp(a, 0, 1);
}

type NodeLayout = { node: StarChartNode; x: number; y: number; ring: number; order: number };

/**
 * Returns a stable transform that keeps an SVG element the same on-screen size
 * regardless of zoom (scale).
 */
function screenStableTransform(anchorX: number, anchorY: number, scale: number): string {
    const inv = 1 / Math.max(0.0001, scale);
    return `translate(${anchorX} ${anchorY}) scale(${inv}) translate(${-anchorX} ${-anchorY})`;
}

/**
 * Best-effort extraction of node placement from STAR_CHART_DATA.
 * Supports a few common shapes without hard-coding your domain types:
 * - n.pos: { x, y } in [0..100], [0..1], or [-1..1]
 * - n.x/n.y (same ranges)
 */
function getNodeLocalNormalizedPos(n: StarChartNode): { x: number; y: number } | null {
    const anyN: any = n as any;

    const raw =
        (anyN && typeof anyN === 'object' && anyN.pos && typeof anyN.pos === 'object' && anyN.pos) ||
        (anyN && typeof anyN === 'object' && (typeof anyN.x === 'number' || typeof anyN.y === 'number') && { x: anyN.x, y: anyN.y }) ||
        null;

    if (!raw) return null;

    const rx = Number(raw.x);
    const ry = Number(raw.y);
    if (!Number.isFinite(rx) || !Number.isFinite(ry)) return null;

    // Case 1: already normalized to [-1..1]
    if (Math.abs(rx) <= 1.05 && Math.abs(ry) <= 1.05) {
        return { x: clamp(rx, -1, 1), y: clamp(ry, -1, 1) };
    }

    // Case 2: normalized to [0..1]
    if (rx >= -0.05 && rx <= 1.05 && ry >= -0.05 && ry <= 1.05) {
        const nx = (rx - 0.5) * 2;
        const ny = (ry - 0.5) * 2;
        return { x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) };
    }

    // Case 3: "percent" style [0..100]
    if (rx >= -5 && rx <= 105 && ry >= -5 && ry <= 105) {
        const nx = ((rx - 50) / 50);
        const ny = ((ry - 50) / 50);
        return { x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) };
    }

    return null;
}

function StarChartMap(props: {
    isInModal: boolean;
    vb: ViewBox;
    setVb: React.Dispatch<React.SetStateAction<ViewBox>>;
    selectedPlanetId: PlanetId | null;
    setSelectedPlanetId: React.Dispatch<React.SetStateAction<PlanetId | null>>;
    selectedNodeId: NodeId | null;
    setSelectedNodeId: React.Dispatch<React.SetStateAction<NodeId | null>>;
    itemsAtNode: ItemRow[];
    dropSourceDetails: Array<{ sid: string; label: string }>;
    selectedNode: StarChartNode | null;
}) {
    const {
        isInModal,
        vb,
        setVb,
        selectedPlanetId,
        setSelectedPlanetId,
        selectedNodeId,
        setSelectedNodeId,
        itemsAtNode,
        dropSourceDetails,
        selectedNode
    } = props;

    const svgRef = useRef<SVGSVGElement | null>(null);

    const vbRef = useRef<ViewBox>(vb);
    useEffect(() => {
        vbRef.current = vb;
    }, [vb]);

    const scale = useMemo(() => viewBoxToScale(vb), [vb]);
    const reveal = useMemo(() => nodeRevealAlpha(scale), [scale]);

    const planetsById = useMemo(() => {
        const m = new Map<string, StarChartPlanet>();
        for (const p of STAR_CHART_DATA.planets) m.set(p.id, p);
        return m;
    }, []);

    const nodesByPlanet = useMemo(() => {
        const m = new Map<string, StarChartNode[]>();
        for (const n of STAR_CHART_DATA.nodes) {
            const pid = n.planetId;
            if (!m.has(pid)) m.set(pid, []);
            m.get(pid)!.push(n);
        }
        for (const [pid, arr] of m.entries()) {
            // Keep stable ordering for deterministic layout.
            // (If your data has sortOrder, we can auto-detect and use it.)
            const hasSortOrder = arr.some((x: any) => typeof (x as any).sortOrder === 'number');
            if (hasSortOrder) {
                arr.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            } else {
                arr.sort((a, b) => a.name.localeCompare(b.name));
            }
            m.set(pid, arr);
        }
        return m;
    }, []);

    const sortedPlanets = useMemo(() => {
        const arr = [...STAR_CHART_DATA.planets];
        arr.sort((a, b) => a.sortOrder - b.sortOrder);
        return arr;
    }, []);

    const [kuvaPhase, setKuvaPhase] = useState<number>(0);
    useEffect(() => {
        let raf: number | null = null;
        let last = 0;
        const step = (t: number) => {
            if (!last) last = t;
            const dt = Math.min(64, t - last);
            last = t;
            setKuvaPhase((prev) => prev + dt * 0.00012);
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => {
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    const overviewPlanets = useMemo((): PlanetLayout[] => {
        const filtered = sortedPlanets.filter((p) => isInMainMap(p));
        const out: PlanetLayout[] = [];

        for (const p of filtered) {
            const manual = MANUAL_POS[p.id];

            const fallbackAngle = hashToUnitFloat(p.id) * Math.PI * 2;
            const fallbackRadius = p.kind === 'planet' ? 34 : 41;
            const fx = 50 + Math.cos(fallbackAngle) * fallbackRadius;
            const fy = 50 + Math.sin(fallbackAngle) * fallbackRadius;

            let x = manual?.x ?? fx;
            let y = manual?.y ?? fy;

            if (p.id === 'region:kuva_fortress') {
                const anchor = manual ?? { x: 34, y: 58 };
                const amp = 1.8;
                x = anchor.x + Math.cos(kuvaPhase) * amp;
                y = anchor.y + Math.sin(kuvaPhase) * amp;
            }

            out.push({ planet: p, x, y, r: getPlanetRadius(p) });
        }

        return out;
    }, [sortedPlanets, kuvaPhase]);

    const overviewPosById = useMemo(() => {
        const m = new Map<string, { x: number; y: number }>();
        for (const p of overviewPlanets) m.set(p.planet.id, { x: p.x, y: p.y });
        return m;
    }, [overviewPlanets]);

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

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        let dragging = false;
        let startClient: { x: number; y: number } | null = null;
        let startVb: ViewBox | null = null;

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;

            const t = e.target as HTMLElement | null;
            if (t?.closest('[data-clickable="true"]')) return;

            dragging = true;
            startClient = { x: e.clientX, y: e.clientY };
            startVb = vbRef.current;
            svg.setPointerCapture(e.pointerId);
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!dragging || !startClient || !startVb) return;

            const dxPx = e.clientX - startClient.x;
            const dyPx = e.clientY - startClient.y;

            const rect = svg.getBoundingClientRect();
            const dxWorld = (dxPx / rect.width) * startVb.w;
            const dyWorld = (dyPx / rect.height) * startVb.h;

            setVb(clampViewBox({ ...startVb, x: startVb.x - dxWorld, y: startVb.y - dyWorld }));
        };

        const onPointerUp = (e: PointerEvent) => {
            if (!dragging) return;
            dragging = false;
            startClient = null;
            startVb = null;
            try {
                svg.releasePointerCapture(e.pointerId);
            } catch {
                // ignore
            }
        };

        svg.addEventListener('pointerdown', onPointerDown);
        svg.addEventListener('pointermove', onPointerMove);
        svg.addEventListener('pointerup', onPointerUp);
        svg.addEventListener('pointercancel', onPointerUp);
        svg.addEventListener('pointerleave', onPointerUp);

        return () => {
            svg.removeEventListener('pointerdown', onPointerDown);
            svg.removeEventListener('pointermove', onPointerMove);
            svg.removeEventListener('pointerup', onPointerUp);
            svg.removeEventListener('pointercancel', onPointerUp);
            svg.removeEventListener('pointerleave', onPointerUp);
        };
    }, [setVb]);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const p = svgPointFromClient(e);
            if (!p) return;

            const delta = clamp(e.deltaY, -180, 180);
            const factor = delta < 0 ? 1 / 1.14 : 1.14;

            setVb((prev) => vbZoomAt(prev, p, factor));
        };

        svg.addEventListener('wheel', onWheel, { passive: false });
        return () => svg.removeEventListener('wheel', onWheel as any);
    }, [setVb]);

    const viewCenter = useMemo(() => ({ x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 }), [vb]);

    const autoFocusedPlanetId = useMemo((): PlanetId | null => {
        if (scale < 1.2) return null;

        let best: { id: PlanetId; d: number } | null = null;
        for (const p of overviewPlanets) {
            const dx = p.x - viewCenter.x;
            const dy = p.y - viewCenter.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (!best || d < best.d) best = { id: p.planet.id, d };
        }

        if (!best) return null;
        if (best.d > 20) return null;

        return best.id;
    }, [overviewPlanets, viewCenter.x, viewCenter.y, scale]);

    const focusedPlanetId: PlanetId | null = selectedPlanetId ?? autoFocusedPlanetId;
    const focusedPlanet = focusedPlanetId ? planetsById.get(focusedPlanetId) ?? null : null;

    const focusedPlanetPos = useMemo(() => {
        if (!focusedPlanetId) return null;
        return overviewPosById.get(focusedPlanetId) ?? null;
    }, [focusedPlanetId, overviewPosById]);

    const focusedPlanetNodes = useMemo(() => {
        if (!focusedPlanetId) return [] as StarChartNode[];
        return nodesByPlanet.get(focusedPlanetId) ?? [];
    }, [focusedPlanetId, nodesByPlanet]);

    const planetMode = useMemo(() => Boolean(focusedPlanetPos && reveal > 0.12), [focusedPlanetPos, reveal]);

    useEffect(() => {
        if (scale <= 1.10 && selectedPlanetId) {
            setSelectedPlanetId(null);
            setSelectedNodeId(null);
        }
    }, [scale, selectedPlanetId, setSelectedPlanetId, setSelectedNodeId]);

    function zoomToPlanet(pid: PlanetId, targetScale: number) {
        const pos = overviewPosById.get(pid);
        if (!pos) return;

        const targetW = 100 / targetScale;
        const targetH = targetW;

        setVb(
            clampViewBox({
                x: pos.x - targetW / 2,
                y: pos.y - targetH / 2,
                w: targetW,
                h: targetH
            })
        );
    }

    function onClickPlanet(pid: PlanetId) {
        setSelectedPlanetId(pid);
        setSelectedNodeId(null);
        zoomToPlanet(pid, 4.2);
    }

    const focusedDiskR = useMemo(() => {
        const r = vb.w * 0.36;
        return clamp(r, 6.5, 28.0);
    }, [vb.w]);

    const nodesClusterR = focusedDiskR * 0.86;

    const otherPlanetsOpacity = useMemo(() => {
        if (!planetMode) return 1;
        return clamp(1 - reveal * 1.15, 0, 1);
    }, [planetMode, reveal]);

    const nodeDotR = useMemo(() => {
        const r = 1.15 / scale;
        return clamp(r, 0.26, 0.62);
    }, [scale]);

    const focusedNodeLayout = useMemo((): NodeLayout[] => {
        if (!focusedPlanetPos) return [];
        if (focusedPlanetNodes.length === 0) return [];

        const cx = focusedPlanetPos.x;
        const cy = focusedPlanetPos.y;

        // Prefer explicit placements if present in STAR_CHART_DATA.
        const normalized = focusedPlanetNodes.map((n) => ({ n, pos: getNodeLocalNormalizedPos(n) }));
        const hasAnyExplicit = normalized.some((x) => Boolean(x.pos));

        const layouts: NodeLayout[] = [];

        if (hasAnyExplicit) {
            // Place explicit nodes exactly; fill the rest with a deterministic ring fallback.
            const maxR = nodesClusterR * 0.95;

            // 1) Explicit
            for (let i = 0; i < normalized.length; i++) {
                const { n, pos } = normalized[i];
                if (!pos) continue;

                const x = cx + pos.x * maxR;
                const y = cy + pos.y * maxR;

                // ring/order are still used for link grouping; keep stable.
                layouts.push({ node: n, x, y, ring: 0, order: i });
            }

            // 2) Fallback for missing
            const missing = normalized.filter((x) => !x.pos).map((x) => x.n);
            if (missing.length > 0) {
                const ringCount = 3;

                for (let i = 0; i < missing.length; i++) {
                    const n = missing[i];
                    const hRing = hashToUnitFloat(n.id + ':ring');
                    const ring = Math.floor(hRing * ringCount);

                    const ringT = ringCount <= 1 ? 0 : ring / (ringCount - 1);
                    const r = nodesClusterR * (0.34 + ringT * 0.56);

                    const a0 = hashToUnitFloat(n.id + ':ang') * Math.PI * 2;
                    const a = a0 + i * (Math.PI * 2 / Math.max(12, missing.length));

                    const jx = (hashToUnitFloat(n.id + ':jx') - 0.5) * (focusedDiskR * 0.06);
                    const jy = (hashToUnitFloat(n.id + ':jy') - 0.5) * (focusedDiskR * 0.06);

                    const x = cx + Math.cos(a) * r + jx;
                    const y = cy + Math.sin(a) * r + jy;

                    layouts.push({ node: n, x, y, ring, order: 1000 + i });
                }
            }
        } else {
            // Pure deterministic ring layout (previous behavior), but cleaner spacing.
            const count = focusedPlanetNodes.length;
            const ringCount = 3;

            const rings: number[] = [];
            for (let i = 0; i < count; i++) {
                const n = focusedPlanetNodes[i];
                const h = hashToUnitFloat(n.id + ':ring');
                const ring = Math.floor(h * ringCount);
                rings.push(ring);
            }

            for (let i = 0; i < count; i++) {
                const n = focusedPlanetNodes[i];

                const ring = rings[i] ?? 0;
                const ringT = ringCount <= 1 ? 0 : ring / (ringCount - 1);

                const r = nodesClusterR * (0.34 + ringT * 0.56);

                const a0 = hashToUnitFloat(n.id + ':ang') * Math.PI * 2;
                const a = a0 + i * (Math.PI * 2 / Math.max(14, count));

                const jx = (hashToUnitFloat(n.id + ':jx') - 0.5) * (focusedDiskR * 0.06);
                const jy = (hashToUnitFloat(n.id + ':jy') - 0.5) * (focusedDiskR * 0.06);

                const x = cx + Math.cos(a) * r + jx;
                const y = cy + Math.sin(a) * r + jy;

                layouts.push({ node: n, x, y, ring, order: i });
            }
        }

        // Clamp to disk boundary
        const maxR = focusedDiskR * 0.90;
        for (const l of layouts) {
            const dx = l.x - cx;
            const dy = l.y - cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > maxR) {
                const s = maxR / d;
                l.x = cx + dx * s;
                l.y = cy + dy * s;
            }
        }

        return layouts;
    }, [focusedPlanetPos, focusedPlanetNodes, nodesClusterR, focusedDiskR]);

    const focusedLinks = useMemo(() => {
        if (focusedNodeLayout.length < 2) return [] as Array<{ a: NodeLayout; b: NodeLayout }>;

        const byRing = new Map<number, NodeLayout[]>();
        for (const n of focusedNodeLayout) {
            const arr = byRing.get(n.ring) ?? [];
            arr.push(n);
            byRing.set(n.ring, arr);
        }
        for (const arr of byRing.values()) arr.sort((a, b) => a.order - b.order);

        const links: Array<{ a: NodeLayout; b: NodeLayout }> = [];

        for (const arr of byRing.values()) {
            for (let i = 0; i < arr.length - 1; i++) links.push({ a: arr[i], b: arr[i + 1] });
        }

        const all = [...focusedNodeLayout];
        for (let i = 0; i < Math.min(28, all.length); i++) {
            const a = all[i];
            const pick = Math.floor(hashToUnitFloat(a.node.id + ':x') * all.length);
            const b = all[pick];
            if (!b || b.node.id === a.node.id) continue;
            links.push({ a, b });
        }

        return links.slice(0, 64);
    }, [focusedNodeLayout]);

    const clipId = useMemo(() => {
        const base = focusedPlanetId ? focusedPlanetId.replace(/[^a-z0-9_:-]/gi, '_') : 'none';
        return `clip_${base}`;
    }, [focusedPlanetId]);

    const focusedPlanetLabel = useMemo(() => {
        if (!focusedPlanet) return '';
        return focusedPlanet.name.toUpperCase();
    }, [focusedPlanet]);

    return (
        <div className={['relative w-full', isInModal ? 'h-full' : 'h-[72vh] min-h-[560px]'].join(' ')}>
            {/* Drop panel overlay (stays inside map, both normal + modal) */}
            <div className='absolute right-4 top-4 z-30 w-[520px] max-w-[42vw] pointer-events-none'>
                <div className='pointer-events-auto rounded-2xl border border-slate-800 bg-slate-950/55 p-3 backdrop-blur-sm'>
                    <div className='text-sm font-semibold text-slate-100'>
                        {selectedNode ? `Drops · ${selectedNode.name}` : 'Drops / Rewards'}
                    </div>
                    <div className='mt-1 text-xs text-slate-400'>
                        {selectedNode ? `${selectedNode.name} (${selectedNode.id})` : 'Zoom into a planet then click a node.'}
                    </div>

                    {!selectedNode ? (
                        <div className='mt-3 text-sm text-slate-400'>No node selected.</div>
                    ) : (
                        <div className='mt-3 space-y-3'>
                            <div>
                                <div className='mb-2 text-[11px] uppercase tracking-wide text-slate-500'>Drop SourceIds</div>
                                {dropSourceDetails.length === 0 ? (
                                    <div className='text-sm text-slate-400'>No drop sources mapped for this node.</div>
                                ) : (
                                    <ul className='space-y-1'>
                                        {dropSourceDetails.map((d) => (
                                            <li key={d.sid} className='text-xs text-slate-200 break-words'>
                                                <span className='font-mono'>{d.sid}</span>
                                                <span className='text-slate-500'> — {d.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <div className='mb-2 text-[11px] uppercase tracking-wide text-slate-500'>
                                    Items with acquisition including these sources
                                </div>
                                {itemsAtNode.length === 0 ? (
                                    <div className='text-sm text-slate-400'>No items currently resolve to these sources.</div>
                                ) : (
                                    <div className='max-h-[420px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/30 p-2'>
                                        <ul className='list-disc pl-5 space-y-0.5 text-sm text-slate-200'>
                                            {itemsAtNode.slice(0, 300).map((it) => (
                                                <li key={it.catalogId} className='break-words'>
                                                    <span className='font-semibold'>{it.name}</span>{' '}
                                                    <span className='text-slate-500 font-mono'>({it.catalogId})</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {itemsAtNode.length > 300 && (
                                            <div className='mt-2 text-xs text-slate-500'>Rendering capped at 300 items.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className='absolute inset-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 select-none'>
                <svg
                    ref={svgRef}
                    className='absolute inset-0 h-full w-full z-10 cursor-grab active:cursor-grabbing'
                    viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
                    preserveAspectRatio='xMidYMid meet'
                >
                    <defs>
                        <radialGradient id='bg0' cx='50%' cy='50%' r='70%'>
                            <stop offset='0%' stopColor='rgba(148,163,184,0.14)' />
                            <stop offset='58%' stopColor='rgba(2,6,23,0.0)' />
                        </radialGradient>
                        <radialGradient id='bg1' cx='25%' cy='45%' r='62%'>
                            <stop offset='0%' stopColor='rgba(56,189,248,0.10)' />
                            <stop offset='52%' stopColor='rgba(2,6,23,0.0)' />
                        </radialGradient>
                        <radialGradient id='bg2' cx='80%' cy='30%' r='58%'>
                            <stop offset='0%' stopColor='rgba(16,185,129,0.10)' />
                            <stop offset='45%' stopColor='rgba(2,6,23,0.0)' />
                        </radialGradient>

                        {focusedPlanetPos && (
                            <clipPath id={clipId}>
                                <circle cx={focusedPlanetPos.x} cy={focusedPlanetPos.y} r={focusedDiskR} />
                            </clipPath>
                        )}
                    </defs>

                    <rect x={-30} y={-30} width={160} height={160} fill='rgba(2,6,23,1)' />
                    <rect x={-30} y={-30} width={160} height={160} fill='url(#bg0)' />
                    <rect x={-30} y={-30} width={160} height={160} fill='url(#bg1)' opacity={0.85} />
                    <rect x={-30} y={-30} width={160} height={160} fill='url(#bg2)' opacity={0.8} />

                    <g opacity={0.9}>
                        <circle cx={50} cy={50} r={34} fill='none' stroke='rgba(148,163,184,0.14)' strokeWidth={0.18} />
                        <circle cx={50} cy={50} r={44} fill='none' stroke='rgba(148,163,184,0.10)' strokeWidth={0.18} />
                        <circle cx={50} cy={50} r={52} fill='none' stroke='rgba(148,163,184,0.07)' strokeWidth={0.18} />
                    </g>

                    {/* Overview planets (labels are screen-stable so they don't become unreadable when zoomed) */}
                    <g opacity={otherPlanetsOpacity}>
                        {overviewPlanets.map((pl) => {
                            const p = pl.planet;
                            const active = p.id === selectedPlanetId;
                            const focused = p.id === focusedPlanetId;

                            const fill = active
                                ? 'rgba(226,232,240,0.18)'
                                : focused
                                  ? 'rgba(2,6,23,0.55)'
                                  : 'rgba(2,6,23,0.45)';
                            const stroke = active
                                ? 'rgba(226,232,240,0.85)'
                                : focused
                                  ? 'rgba(148,163,184,0.55)'
                                  : 'rgba(148,163,184,0.35)';

                            const labelY = pl.y - (p.kind === 'planet' ? 3.2 : -3.2);

                            return (
                                <g
                                    key={p.id}
                                    data-clickable='true'
                                    onClick={() => onClickPlanet(p.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <circle cx={pl.x} cy={pl.y} r={pl.r} fill={fill} stroke={stroke} strokeWidth={0.22} />

                                    <text
                                        x={pl.x}
                                        y={labelY}
                                        textAnchor='middle'
                                        fontSize={1.6}
                                        fill={active ? 'rgba(226,232,240,0.95)' : 'rgba(226,232,240,0.78)'}
                                        style={{ letterSpacing: '0.35em', textTransform: 'uppercase' } as any}
                                        transform={screenStableTransform(pl.x, labelY, scale)}
                                    >
                                        {p.name.toUpperCase()}
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    {focusedPlanetPos && reveal > 0.01 && (
                        <g opacity={reveal}>
                            <circle
                                cx={focusedPlanetPos.x}
                                cy={focusedPlanetPos.y}
                                r={focusedDiskR}
                                fill='rgba(2,6,23,0.55)'
                                stroke='rgba(148,163,184,0.22)'
                                strokeWidth={0.25}
                            />
                            <circle
                                cx={focusedPlanetPos.x - focusedDiskR * 0.22}
                                cy={focusedPlanetPos.y - focusedDiskR * 0.22}
                                r={focusedDiskR * 0.62}
                                fill='rgba(226,232,240,0.05)'
                            />

                            {/* Focused planet name (screen-stable) */}
                            {focusedPlanet && (
                                <text
                                    x={focusedPlanetPos.x}
                                    y={focusedPlanetPos.y - focusedDiskR - 2.0}
                                    textAnchor='middle'
                                    fontSize={2.1}
                                    fill='rgba(226,232,240,0.92)'
                                    style={{ letterSpacing: '0.42em', textTransform: 'uppercase' } as any}
                                    transform={screenStableTransform(focusedPlanetPos.x, focusedPlanetPos.y - focusedDiskR - 2.0, scale)}
                                >
                                    {focusedPlanetLabel}
                                </text>
                            )}
                        </g>
                    )}

                    {focusedPlanetPos && focusedPlanet && reveal > 0.01 && (
                        <g clipPath={`url(#${clipId})`} opacity={reveal} pointerEvents={reveal > 0.15 ? 'auto' : 'none'}>
                            <g opacity={0.92}>
                                {focusedLinks.map((l, idx) => (
                                    <line
                                        key={`ln-${idx}`}
                                        x1={l.a.x}
                                        y1={l.a.y}
                                        x2={l.b.x}
                                        y2={l.b.y}
                                        stroke='rgba(226,232,240,0.24)'
                                        strokeWidth={0.14}
                                    />
                                ))}
                            </g>

                            {focusedNodeLayout.map((nd) => {
                                const n = nd.node;
                                const isActive = n.id === selectedNodeId;

                                const nodeFill = isActive ? 'rgba(226,232,240,0.38)' : 'rgba(2,6,23,0.70)';
                                const nodeStroke = isActive ? 'rgba(226,232,240,0.95)' : 'rgba(148,163,184,0.62)';

                                // Keep node label readable (screen-stable), but keep the dot itself in world-space.
                                const labelDx = 2.6;
                                const labelDy = 2.0;

                                const labelX = nd.x + labelDx;
                                const labelY = nd.y - labelDy;

                                return (
                                    <g
                                        key={n.id}
                                        data-clickable='true'
                                        onClick={() => setSelectedNodeId((prev) => (prev === n.id ? null : n.id))}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <circle cx={nd.x} cy={nd.y} r={nodeDotR} fill={nodeFill} stroke={nodeStroke} strokeWidth={0.18} />

                                        <text
                                            x={labelX}
                                            y={labelY}
                                            fontSize={1.05}
                                            fill={isActive ? 'rgba(226,232,240,0.95)' : 'rgba(226,232,240,0.82)'}
                                            style={{ letterSpacing: '0.26em', textTransform: 'uppercase' } as any}
                                            transform={screenStableTransform(labelX, labelY, scale)}
                                        >
                                            {n.name.toUpperCase()}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    )}
                </svg>

                <div className='absolute bottom-3 left-3 z-30 rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-2 text-xs text-slate-400 backdrop-blur-sm pointer-events-none'>
                    Drag to pan · Wheel to zoom · Click planet to jump-zoom
                </div>

                <div className='absolute top-3 left-3 z-30 flex items-center gap-2'>
                    <div className='rounded-lg border border-slate-800 bg-slate-950/55 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-sm'>
                        {Math.round(scale * 100)}%
                    </div>
                    <button
                        className='rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900'
                        onClick={() => setVb((prev) => vbZoomAt(prev, { x: prev.x + prev.w / 2, y: prev.y + prev.h / 2 }, 1.14))}
                    >
                        +
                    </button>
                    <button
                        className='rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900'
                        onClick={() => setVb((prev) => vbZoomAt(prev, { x: prev.x + prev.w / 2, y: prev.y + prev.h / 2 }, 1 / 1.14))}
                    >
                        −
                    </button>
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

function StarChartModal(props: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const { isOpen, title, subtitle, onClose, children } = props;

    useEffect(() => {
        if (!isOpen) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className='wf-star-overlay' role='dialog' aria-modal='true' onMouseDown={onClose}>
            <div className='wf-star-modal' onMouseDown={(e) => e.stopPropagation()}>
                <div className='wf-star-modal-header'>
                    <div className='wf-star-modal-title'>
                        <div className='t1'>{title}</div>
                        <div className='t2'>{subtitle}</div>
                    </div>

                    <div className='wf-star-modal-actions'>
                        <button
                            className='rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900'
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className='wf-star-modal-body'>{children}</div>
            </div>
        </div>
    );
}

export default function StarChart() {
    const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);

    const [vb, setVb] = useState<ViewBox>({ x: 0, y: 0, w: 100, h: 100 });

    const sourceToItemsIndex = useMemo(() => buildSourceToItemsIndex(), []);

    const selectedNode: StarChartNode | null = useMemo(() => {
        if (!selectedNodeId) return null;
        return STAR_CHART_DATA.nodes.find((n) => n.id === selectedNodeId) ?? null;
    }, [selectedNodeId]);

    const dropSources = useMemo(() => {
        if (!selectedNode) return [];
        return getDropSourcesForStarChartNode(selectedNode.id)
            .map((sid) => safeNormalizeSourceId(sid))
            .filter((x): x is string => Boolean(x));
    }, [selectedNode]);

    const dropSourceDetails = useMemo(() => {
        return dropSources.map((sid) => ({
            sid,
            label: SOURCE_INDEX[sid as any]?.label ?? '(missing from SOURCE_INDEX)'
        }));
    }, [dropSources]);

    const itemsAtNode = useMemo(() => {
        const acc: ItemRow[] = [];
        for (const sid of dropSources) {
            const rows = sourceToItemsIndex[sid] ?? [];
            acc.push(...rows);
        }

        const seen = new Set<string>();
        const uniq: ItemRow[] = [];
        for (const r of acc) {
            if (seen.has(r.catalogId)) continue;
            seen.add(r.catalogId);
            uniq.push(r);
        }

        uniq.sort((a, b) => a.name.localeCompare(b.name));
        return uniq;
    }, [dropSources, sourceToItemsIndex]);

    const [isOpen, setIsOpen] = useState<boolean>(false);

    function resetView() {
        setSelectedNodeId(null);
        setSelectedPlanetId(null);
        setVb({ x: 0, y: 0, w: 100, h: 100 });
    }

    return (
        <div className='space-y-6'>
            <StarChartModalStyles />

            <Section
                title='Star Chart'
                subtitle='Drag to pan. Wheel to zoom. Click a planet to jump-zoom. Zoom closer to reveal node charts, then click nodes to see drops.'
                actions={
                    <>
                        <button
                            className='rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40'
                            onClick={() => setIsOpen(true)}
                        >
                            Open Map
                        </button>
                        <button
                            className='rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40'
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
                    selectedNodeId={selectedNodeId}
                    setSelectedNodeId={setSelectedNodeId}
                    itemsAtNode={itemsAtNode}
                    dropSourceDetails={dropSourceDetails}
                    selectedNode={selectedNode}
                />
            </Section>

            <StarChartModal
                isOpen={isOpen}
                title='Star Chart'
                subtitle='Drag to pan · Wheel to zoom · Click planet to jump-zoom · Click node for drops'
                onClose={() => setIsOpen(false)}
            >
                <StarChartMap
                    isInModal={true}
                    vb={vb}
                    setVb={setVb}
                    selectedPlanetId={selectedPlanetId}
                    setSelectedPlanetId={setSelectedPlanetId}
                    selectedNodeId={selectedNodeId}
                    setSelectedNodeId={setSelectedNodeId}
                    itemsAtNode={itemsAtNode}
                    dropSourceDetails={dropSourceDetails}
                    selectedNode={selectedNode}
                />
            </StarChartModal>
        </div>
    );
}

