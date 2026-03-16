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
import { useTrackerStore } from "../../store/store";

// ─── Intrinsics Panel ─────────────────────────────────────────────────────────

const RAILJACK_SKILLS = [
    {
        key: "LPS_PILOTING",
        label: "Piloting",
        color: "blue",
        ranks: [
            "Increased Archwing speed in Railjack missions.",
            "Unlock Railjack Maneuver: Void Cloak (brief invisibility).",
            "Further piloting speed increase.",
            "Unlock Tactical Maneuver: Drift (reduces Archwing energy use).",
            "Maximum Railjack boost speed.",
            "Unlock Cosmic Crush: auto-pull loot while piloting.",
            "Increased Archwing strafe speed.",
            "Improved Railjack handling.",
            "Unlock Slipstream: double boost speed briefly.",
            "Maximum piloting mastery.",
        ]
    },
    {
        key: "LPS_GUNNERY",
        label: "Gunnery",
        color: "orange",
        ranks: [
            "Improved turret targeting speed.",
            "Unlock Granum Burst: shoot through surfaces.",
            "Increased turret damage.",
            "Unlock Artax Barrage: multi-hit turret shots.",
            "Faster reload on Railjack turrets.",
            "Unlock Tether: tether enemies in space.",
            "Further turret damage increase.",
            "Improved turret range.",
            "Increased critical chance on turrets.",
            "Maximum gunnery mastery.",
        ]
    },
    {
        key: "LPS_ENGINEERING",
        label: "Engineering",
        color: "green",
        ranks: [
            "Forge resources more quickly.",
            "Unlock Forge Capacity: larger forge batches.",
            "Improved battle avionic recharge.",
            "Unlock Form Up: crew teleport to Railjack.",
            "Faster dome charge reload.",
            "Unlock Slingshot: use Railjack to launch into enemy ships.",
            "Improved repair speed.",
            "Larger resource batch sizes.",
            "Faster dome charge generation.",
            "Maximum engineering mastery.",
        ]
    },
    {
        key: "LPS_TACTICAL",
        label: "Tactical",
        color: "purple",
        ranks: [
            "Increased tactical map update rate.",
            "Unlock Tactical Intrinsic: teleport to crewmates.",
            "Access Tactical Avionics from outside the Railjack.",
            "Unlock Hold Position: command crew to hold.",
            "Improved ability cast speed while in Railjack.",
            "Unlock Overseer: view crew from tactical map.",
            "Further tactical map improvements.",
            "Improved tactical range.",
            "Unlock Transfer Conduit: boost crew abilities.",
            "Maximum tactical mastery.",
        ]
    },
    {
        key: "LPS_COMMAND",
        label: "Command",
        color: "amber",
        ranks: [
            "Unlock crew slot 1.",
            "Improved crew stat generation.",
            "Unlock crew slot 2.",
            "Crew gain improved morale.",
            "Unlock crew slot 3.",
            "Crew gain max stats.",
            "All crew combat improved.",
            "Crew use specials more frequently.",
            "Unlock elite crew assignments.",
            "Maximum command mastery (full crew capacity).",
        ]
    },
];

const DUVIRI_SKILLS = [
    {
        key: "LPS_DRIFT_RIDING",
        label: "Riding",
        color: "cyan",
        ranks: [
            "Increased Kaithe sprint speed.",
            "Unlock Kaithe aerial dash.",
            "Improved Kaithe aerial combat speed.",
            "Kaithe gains additional jump height.",
            "Improved Kaithe double-jump.",
            "Unlock extended Kaithe flight duration.",
            "Further Kaithe maneuverability.",
            "Unlock Kaithe charge attack.",
            "Improved aerial strike damage.",
            "Maximum riding mastery.",
        ]
    },
    {
        key: "LPS_DRIFT_OPPORTUNITY",
        label: "Opportunity",
        color: "amber",
        ranks: [
            "Gain one additional Decree choice.",
            "Improved quality of Decree offerings.",
            "Unlock double Decree roll (reroll once per circuit).",
            "Further Decree quality improvements.",
            "Unlock Decree Duplication chance.",
            "Improved rare Decree drop rate.",
            "Additional Decree choice on each pick.",
            "Further Decree frequency improvements.",
            "Unlock guaranteed rare Decree tier.",
            "Maximum opportunity mastery.",
        ]
    },
    {
        key: "LPS_DRIFT_COMBAT",
        label: "Combat",
        color: "rose",
        ranks: [
            "Increased Drifter melee damage.",
            "Unlock Drifter parry timing window.",
            "Improved pistol damage.",
            "Faster Drifter reload speed.",
            "Increased Drifter critical chance.",
            "Unlock combat finisher moves.",
            "Further melee damage increase.",
            "Improved combat status effects.",
            "Unlock Drifter special attack.",
            "Maximum combat mastery.",
        ]
    },
    {
        key: "LPS_DRIFT_ENDURANCE",
        label: "Endurance",
        color: "green",
        ranks: [
            "Increased Drifter max health.",
            "Improved Drifter armor.",
            "Unlock Drifter health regeneration.",
            "Further health increase.",
            "Improved resistance to knockdown.",
            "Unlock Drifter shield.",
            "Further armor improvements.",
            "Improved health regen rate.",
            "Unlock Drifter energy resistance.",
            "Maximum endurance mastery.",
        ]
    },
    {
        key: "LPS_DRIFT_AGILITY",
        label: "Agility",
        color: "indigo",
        ranks: [
            "Improved Drifter sprint speed.",
            "Unlock Drifter bullet jump.",
            "Further movement speed.",
            "Improved Drifter dodge.",
            "Unlock Drifter double jump.",
            "Improved parkour efficiency.",
            "Further dodge improvements.",
            "Unlock Drifter air glide.",
            "Improved aerial agility.",
            "Maximum agility mastery.",
        ]
    },
];

const COLOR_MAP: Record<string, { bar: string; text: string; border: string; bg: string }> = {
    blue:   { bar: "bg-blue-500",   text: "text-blue-300",   border: "border-blue-700/50",   bg: "bg-blue-950/20" },
    orange: { bar: "bg-orange-500", text: "text-orange-300", border: "border-orange-700/50", bg: "bg-orange-950/20" },
    green:  { bar: "bg-green-500",  text: "text-green-300",  border: "border-green-700/50",  bg: "bg-green-950/20" },
    purple: { bar: "bg-purple-500", text: "text-purple-300", border: "border-purple-700/50", bg: "bg-purple-950/20" },
    amber:  { bar: "bg-amber-500",  text: "text-amber-300",  border: "border-amber-700/50",  bg: "bg-amber-950/20" },
    cyan:   { bar: "bg-cyan-500",   text: "text-cyan-300",   border: "border-cyan-700/50",   bg: "bg-cyan-950/20" },
    rose:   { bar: "bg-rose-500",   text: "text-rose-300",   border: "border-rose-700/50",   bg: "bg-rose-950/20" },
    indigo: { bar: "bg-indigo-500", text: "text-indigo-300", border: "border-indigo-700/50", bg: "bg-indigo-950/20" },
};

const COST_PER_RANK = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]; // intrinsic points needed per rank

function IntrinsicsPanel({ mode, onClose }: { mode: "proxima" | "duviri"; onClose: () => void }) {
    const intrinsics = useTrackerStore(s => s.state.intrinsics);
    const railjack = intrinsics?.railjack ?? {};
    const duviri   = intrinsics?.duviri   ?? {};

    const skills = mode === "proxima" ? RAILJACK_SKILLS : DUVIRI_SKILLS;
    const values = mode === "proxima" ? railjack : duviri;
    const MAX = 10;

    const [expanded, setExpanded] = useState<string | null>(null);

    const totalPoints = skills.reduce((sum, sk) => sum + (values[sk.key] ?? 0), 0);
    const totalMax = skills.length * MAX;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
                    <div>
                        <div className="text-base font-semibold text-slate-100">
                            {mode === "proxima" ? "Railjack" : "Duviri"} Intrinsics
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                            {totalPoints} / {totalMax} points invested
                            {!Object.keys(values).length && " — import your profile to track progress"}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>

                {/* Skills */}
                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                    {skills.map(sk => {
                        const rank = Math.min(values[sk.key] ?? 0, MAX);
                        const isExpanded = expanded === sk.key;
                        const clr = COLOR_MAP[sk.color] ?? COLOR_MAP.blue;
                        const nextCost = rank < MAX ? COST_PER_RANK[rank] : null;

                        return (
                            <div key={sk.key} className={["rounded-xl border overflow-hidden", clr.border, clr.bg].join(" ")}>
                                {/* Skill header */}
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                    onClick={() => setExpanded(isExpanded ? null : sk.key)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={["text-sm font-semibold", clr.text].join(" ")}>{sk.label}</span>
                                            <span className="text-xs text-slate-400 font-mono">R{rank} / {MAX}</span>
                                            {nextCost && rank < MAX && (
                                                <span className="text-[10px] text-slate-500 ml-auto">Next rank: {nextCost} pt{nextCost !== 1 ? "s" : ""}</span>
                                            )}
                                        </div>
                                        {/* Pip bar */}
                                        <div className="flex gap-0.5 mt-1.5">
                                            {Array.from({ length: MAX }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className={["h-1.5 flex-1 rounded-sm", i < rank ? clr.bar : "bg-slate-700"].join(" ")}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <svg
                                        className={["w-4 h-4 text-slate-500 transition-transform shrink-0", isExpanded ? "rotate-180" : ""].join(" ")}
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                {/* Rank details */}
                                {isExpanded && (
                                    <div className="border-t border-slate-700/50 px-4 py-3 space-y-1.5">
                                        {sk.ranks.map((desc, r) => (
                                            <div
                                                key={r}
                                                className={[
                                                    "flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs",
                                                    r < rank ? "bg-slate-800/60" : "bg-slate-900/40 opacity-50"
                                                ].join(" ")}
                                            >
                                                <div className={["shrink-0 w-5 text-center font-mono", r < rank ? clr.text : "text-slate-600"].join(" ")}>
                                                    R{r + 1}
                                                </div>
                                                <div className={r < rank ? "text-slate-200" : "text-slate-500"}>{desc}</div>
                                                <div className="ml-auto shrink-0 text-[10px] text-slate-600 font-mono">
                                                    {COST_PER_RANK[r]} pt
                                                </div>
                                            </div>
                                        ))}
                                        <div className="text-[10px] text-slate-600 pt-1 text-right">
                                            Total to max: {COST_PER_RANK.reduce((a, b) => a + b, 0)} pts
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
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
    const [showIntrinsics, setShowIntrinsics] = useState(false);
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

    const selectedMissionNode = useMemo<StarChartNode | null>(() => {
        if (!selectedGroup) return null;
        const node = STAR_CHART_DATA.nodes.find((n) => n.id === selectedGroup.baseNodeId) ?? null;
        return node?.nodeType === "mission" ? node : null;
    }, [selectedGroup]);

    return (
        <div className="flex h-full flex-col">
            {showIntrinsics && <IntrinsicsPanel mode="proxima" onClose={() => setShowIntrinsics(false)} />}
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
                    className="rounded-lg border border-blue-700/60 bg-blue-950/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-950/50 transition-colors"
                    onClick={() => setShowIntrinsics(true)}
                >
                    Railjack Intrinsics
                </button>
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
                    selectedMissionNode={selectedMissionNode}
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
export { StarChartProximaView, IntrinsicsPanel };
