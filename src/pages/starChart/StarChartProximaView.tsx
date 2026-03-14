// StarChartProximaView — Railjack/Proxima map view.
// Extracted from StarChart.tsx as part of Phase 5 file decomposition.

import { useEffect, useMemo, useState } from "react";
import { STAR_CHART_DATA } from "../../domain/catalog/starChart";
import type { PlanetId, StarChartNode, StarChartPlanet } from "../../domain/models/starChart";
import {
    groupPlanetNodesForDisplay,
    buildTabSpecRaw,
    applyExclusiveAssignment,
    normalizeMissionRewardItemsForDisplay,
    viewBoxToScale,
} from "./starChartMapData";
import type { ViewBox, NodeGroupKind, NodeGroup, TabSpec } from "./starChartMapData";
import { buildSourceToItemsIndex } from "./starChartUtils";
import StarChartMap from "./StarChartMap";

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
    // Railjack/Proxima has no Steel Path variant — always use normal mode.
    const steelPathMode = false;

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
                    steelPathMode={steelPathMode}
                    setMainMapMode={() => {}}
                    hideAlternateMaps={true}
                    planetFilter={isProximaPlanet}
                />
            </div>
        </div>
    );
}
export { StarChartProximaView };
