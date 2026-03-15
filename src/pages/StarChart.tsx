// Star Chart page — shell component.
// The heavy rendering logic lives in ./starChart/ subdirectory:
//   starChartUtils.ts     — item deduplication and source-to-items index
//   starChartMapData.ts   — map constants, visual data, and node-grouping logic
//   StarChartMap.tsx      — interactive SVG canvas (~1800 lines)
//   StarChartListView.tsx — flat node list with completion checkboxes
//   StarChartProximaView.tsx — Railjack/Proxima map
//   StarChartDuviriView.tsx  — Duviri experience panels
//   StarChartModal.tsx    — full-screen overlay modal wrapper

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PlanetId, StarChartNode, StarChartPlanet } from "../domain/models/starChart";
import { STAR_CHART_DATA } from "../domain/catalog/starChart";
import {
    viewBoxToScale,
    buildTabSpecRaw,
    applyExclusiveAssignment,
    normalizeMissionRewardItemsForDisplay,
    groupPlanetNodesForDisplay,
} from "./starChart/starChartMapData";
import type { ViewBox, NodeGroupKind, NodeGroup, TabSpec } from "./starChart/starChartMapData";
import { buildSourceToItemsIndex } from "./starChart/starChartUtils";
import { buildDropMetaLookup } from "./starChart/dropMetaLookup";
import type { DropMetaLookup } from "./starChart/dropMetaLookup";
import StarChartMap from "./starChart/StarChartMap";
import { StarChartListView } from "./starChart/StarChartListView";
import { StarChartProximaView } from "./starChart/StarChartProximaView";
import { StarChartDuviriView } from "./starChart/StarChartDuviriView";
import { StarChartModalStyles, StarChartModal } from "./starChart/StarChartModal";

function Section(props: { title: string; subtitle?: string; children: ReactNode; actions?: ReactNode }) {
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

export default function StarChart() {
    const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId | null>(null);
    const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<NodeGroupKind>("base");

    // ~35% zoom (vb.w=286 → scale=100/286≈0.35), centered on the actual planet
    // cluster centroid rather than the mathematical world center.
    const INITIAL_VB: ViewBox = { x: -100, y: -109, w: 286, h: 286 };
    const [vb, setVb] = useState<ViewBox>(INITIAL_VB);

    const sourceToItemsIndex = useMemo(() => buildSourceToItemsIndex(), []);
    const dropMetaLookup = useMemo<DropMetaLookup>(() => buildDropMetaLookup(), []);

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
        steelPathMode,
        setMainMapMode,
        dropMetaLookup,
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

                        {/* Steel Path toggle — visible in normal map and list modes */}
                        {(viewMode === "list" || mainMapMode === "normal") && (
                            <button
                                className={[
                                    "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                                    steelPathMode
                                        ? "border-amber-500/70 bg-amber-950/60 text-amber-300 hover:bg-amber-900/80"
                                        : "border-slate-700 bg-slate-950/20 text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                                ].join(" ")}
                                title={steelPathMode ? "Tracking Steel Path completions — click to switch to Normal" : "Tracking Normal completions — click to switch to Steel Path"}
                                onClick={() => setSteelPathMode((v) => !v)}
                            >
                                {steelPathMode ? "Steel Path" : "Normal"}
                            </button>
                        )}

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