// Star Chart page — shell component.
// The heavy rendering logic lives in ./starChart/ subdirectory:
//   starChartUtils.ts     — item deduplication and source-to-items index
//   starChartMapData.ts   — map constants, visual data, and node-grouping logic
//   StarChartMap.tsx      — interactive SVG canvas (~1800 lines)
//   StarChartListView.tsx — flat node list with completion checkboxes
//   StarChartProximaView.tsx — Railjack/Proxima map
//   StarChartDuviriView.tsx  — Duviri experience panels
//   StarChartModal.tsx    — full-screen overlay modal wrapper

import { useEffect, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { PlanetId, StarChartNode, StarChartPlanet } from "../domain/models/starChart";
import { STAR_CHART_DATA } from "../domain/catalog/starChart";
import { useTrackerStore } from "../store/store";
import {
    EMPTY_NODE_COMPLETED,
    DEFAULT_NODE_GROUP_TAB,
    viewBoxToScale,
    buildTabSpecRaw,
    applyExclusiveAssignment,
    normalizeMissionRewardItemsForDisplay,
    groupPlanetNodesForDisplay,
} from "./starChart/starChartMapData";
import type { ViewBox, NodeGroupKind, NodeGroup, TabSpec } from "./starChart/starChartMapData";
import { buildSourceToItemsIndex } from "./starChart/starChartUtils";
import { getPendingStarChartNodeId } from "../store/starChartNav";
import { buildDropMetaLookup } from "./starChart/dropMetaLookup";
import type { DropMetaLookup } from "./starChart/dropMetaLookup";
import StarChartMap from "./starChart/StarChartMap";
import { StarChartListView } from "./starChart/StarChartListView";
import { StarChartProximaView } from "./starChart/StarChartProximaView";
import { StarChartDuviriView } from "./starChart/StarChartDuviriView";
import { StarChartModalStyles, StarChartModal } from "./starChart/StarChartModal";
import { WorkspaceAction, WorkspaceSection, WorkspaceSegmented, WorkspaceSegmentedButton } from "../components/workspace/WorkspaceChrome";

function Section(props: { title: string; subtitle?: string; children: ReactNode; actions?: ReactNode }) {
    return <WorkspaceSection title={props.title} subtitle={props.subtitle} actions={props.actions}>{props.children}</WorkspaceSection>;
}

export default function StarChart() {
    const nodeCompleted = useTrackerStore((s) => s.state.missions?.nodeCompleted ?? EMPTY_NODE_COMPLETED);
    const steelPathNodeCompleted = useTrackerStore((s) => s.state.missions?.steelPathNodeCompleted ?? EMPTY_NODE_COMPLETED);
    const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId | null>(null);
    const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<NodeGroupKind>(DEFAULT_NODE_GROUP_TAB);

    // Steel Path tracking toggle — declared early so tabsForPanel can read it.
    const [steelPathMode, setSteelPathMode] = useState(false);

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
        const rawKinds: NodeGroupKind[] = ["all", "base", "mission_rewards", "caches"];
        const raw = rawKinds.map((k) => buildTabSpecRaw({ group: selectedGroup, kind: k, sourceToItemsIndex, steelPathMode }));

        // Keep tabs based on whether they have ANY sources, except All which is always shown.
        const keep = raw.filter((s) => s.kind === "all" || s.dropSources.length > 0);

        // Apply exclusive assignment so "Drops" does NOT include items that belong to the other pills.
        const exclusive = applyExclusiveAssignment(keep);

        // Hide empty non-All tabs (after exclusivity), but keep All even if empty (debug).
        const finalTabs = exclusive.filter((t) => t.kind === "all" || t.items.length > 0 || t.dropSources.length > 0);

        // UI-only rule:
        // - Mission Rewards: collapse relic quality variants and drop generic era rows ("Lith", "Lith Relic", etc.)
        // - All: apply the SAME display normalization so you don't see "Lith" there either.
        return finalTabs.map((t) => (
            t.kind === "mission_rewards"
                ? { ...t, items: normalizeMissionRewardItemsForDisplay(t.items) }
                : t
        ));
    }, [selectedGroup, sourceToItemsIndex, steelPathMode]);

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
            setSelectedTab(tabsForPanel[0]?.kind ?? DEFAULT_NODE_GROUP_TAB);
        }
    }, [selectedGroupKey, tabsForPanel, selectedTab]);

    // Consume a pending deep-link node set by Requirements page.
    // Runs once groupedByPlanet is stable (after mount).
    const navigateToPendingNode = useCallback(() => {
        const nodeId = getPendingStarChartNodeId();
        if (!nodeId) return;

        const node = STAR_CHART_DATA.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const planetGroups = groupedByPlanet.get(String(node.planetId)) ?? [];
        const group = planetGroups.find((g) =>
            Object.values(g.kinds).some((ids) => ids?.includes(node.id as any))
        );
        if (!group) return;

        setSelectedPlanetId(node.planetId);
        setSelectedGroupKey(group.key);
        setSelectedTab(DEFAULT_NODE_GROUP_TAB);
    }, [groupedByPlanet]);

    useEffect(() => {
        navigateToPendingNode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [isOpen, setIsOpen] = useState<boolean>(false);

    // View mode: "map" shows the SVG star chart, "list" shows the flat node list.
    const [viewMode, setViewMode] = useState<"map" | "list">("map");

    // Which alternate map is displayed (normal = main star chart).
    const [mainMapMode, setMainMapMode] = useState<"normal" | "proxima" | "duviri">("normal");

    function resetView() {
        setSelectedGroupKey(null);
        setSelectedTab(DEFAULT_NODE_GROUP_TAB);
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

    // Also expose the selected mission node (for missionType/faction display)
    const selectedMissionNode = useMemo<StarChartNode | null>(() => {
        if (!selectedGroup) return null;
        const baseId = selectedGroup.baseNodeId;
        const node = STAR_CHART_DATA.nodes.find((n) => n.id === baseId) ?? null;
        return node?.nodeType === "mission" ? node : null;
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
        selectedMissionNode,
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

    const completedNodeCount = Object.values(steelPathMode ? steelPathNodeCompleted : nodeCompleted).filter(Boolean).length;
    const totalNodeCount = STAR_CHART_DATA.nodes.length;
    const selectedNodeCount = selectedGroup
        ? Object.values(selectedGroup.kinds).reduce((sum, ids) => sum + (ids?.length ?? 0), 0)
        : 0;

    return (
        <div className="space-y-6">
            <StarChartModalStyles />

            <section className="rounded-[24px] border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-1)] px-5 py-4 shadow-[var(--wf-shadow-panel)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--wf-accent-primary)]">
                            Collection Workspace
                        </div>
                        <h1 className="mt-1 text-2xl font-semibold text-[color:var(--wf-text-strong)]">Star Chart</h1>
                        <p className="mt-1 text-sm text-[color:var(--wf-text-muted)]">
                            Explore mission nodes as a research surface, switch between maps and list mode, and inspect which planets and nodes matter to your current acquisition path.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            className="rounded-xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-3 py-2 text-sm font-medium text-[color:var(--wf-text)] transition-colors hover:bg-[color:var(--wf-surface-strong)]"
                            onClick={() => setViewMode("map")}
                        >
                            Map View
                        </button>
                        <button
                            className="rounded-xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-3 py-2 text-sm font-medium text-[color:var(--wf-text)] transition-colors hover:bg-[color:var(--wf-surface-strong)]"
                            onClick={() => setViewMode("list")}
                        >
                            List View
                        </button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
                    <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">Display mode</div>
                        <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">{viewMode === "map" ? "Map" : "List"}</div>
                        <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">
                            {mainMapMode === "normal" ? "Main chart" : mainMapMode === "proxima" ? "Proxima regions" : "Duviri map"}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">Planets</div>
                        <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">{STAR_CHART_DATA.planets.length.toLocaleString()}</div>
                        <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">Mapped planetary regions in the current chart dataset.</div>
                    </div>
                    <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">Tracked nodes</div>
                        <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">{completedNodeCount.toLocaleString()}</div>
                        <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">{steelPathMode ? "Steel Path" : "Normal"} completion marks currently stored.</div>
                    </div>
                    <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">Node catalog</div>
                        <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">{totalNodeCount.toLocaleString()}</div>
                        <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">Total nodes in the star chart dataset.</div>
                    </div>
                    <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">Selected cluster</div>
                        <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">{selectedNodeCount.toLocaleString()}</div>
                        <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">{selectedGroup ? selectedGroup.displayName : "No node group selected."}</div>
                    </div>
                </div>
            </section>

            <Section
                title="Star Chart"
                subtitle={sectionSubtitle}
                actions={
                    <>
                        {/* Map / List toggle */}
                        <WorkspaceSegmented>
                            <WorkspaceSegmentedButton
                                active={viewMode === "map"}
                                onClick={() => setViewMode("map")}
                                className="px-3 py-2 text-sm font-semibold"
                            >
                                Map
                            </WorkspaceSegmentedButton>
                            <WorkspaceSegmentedButton
                                active={viewMode === "list"}
                                onClick={() => setViewMode("list")}
                                className="px-3 py-2 text-sm font-semibold"
                            >
                                List
                            </WorkspaceSegmentedButton>
                        </WorkspaceSegmented>

                        {/* Steel Path toggle — visible in normal map and list modes */}
                        {(viewMode === "list" || mainMapMode === "normal") && (
                            <WorkspaceAction
                                className={[
                                    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                                    steelPathMode
                                        ? "border-amber-500/70 bg-amber-950/60 text-amber-300 hover:bg-amber-900/80"
                                        : "border-slate-700 bg-slate-950/20 text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                                ].join(" ")}
                                title={steelPathMode ? "Tracking Steel Path completions — click to switch to Normal" : "Tracking Normal completions — click to switch to Steel Path"}
                                onClick={() => setSteelPathMode((v) => !v)}
                            >
                                {steelPathMode ? "Steel Path" : "Normal"}
                            </WorkspaceAction>
                        )}

                        {viewMode === "map" && mainMapMode === "normal" && (
                            <>
                                <WorkspaceAction
                                    className="rounded-lg border-slate-700 bg-slate-950/20 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/40"
                                    onClick={() => setIsOpen(true)}
                                >
                                    Open Map
                                </WorkspaceAction>
                                <WorkspaceAction
                                    className="rounded-lg border-slate-700 bg-slate-950/20 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/40"
                                    onClick={resetView}
                                >
                                    Reset View
                                </WorkspaceAction>
                            </>
                        )}
                    </>
                }
            >
                {viewMode === "list" ? (
                    <StarChartListView steelPathMode={steelPathMode} mapMode={mainMapMode} />
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
