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

// ⚠ Intrinsic investments CANNOT be reset. Invest carefully.

const RAILJACK_SKILLS = [
    {
        key: "LPS_PILOTING",
        label: "Piloting",
        color: "blue",
        ranks: [
            "Boost — Hold Shift to boost Engine Speed. Firing pilot guns interrupts boosting.",
            "Vector Maneuver — Tap Shift to burst Directional Thrusters.",
            "Vectored Evasion — Nearby enemy projectiles lose lock-on during Vector Maneuver.",
            "Drift Maneuver — During Vector, press & hold Shift to drift in any direction.",
            "Boosted Scavenger — 3× loot pickup radius while boosting/drifting/dodging. Hidden derelicts marked.",
            "Ram Jammer — 25% chance to jam an incoming Ramsled's targeting, causing it to overshoot and explode.",
            "Necramech Haste — Necramech movement speed +10% (also applies outside Empyrean).",
            "Aeronaut — Archwing speed +20% (also applies outside Empyrean).",
            "Ramming Speed — Incoming damage reduced by 25%. Ramming enemies while Boosting deals 2,000 Impact damage.",
            "Railjack Blink — Double-tap Space to instantly translate the Railjack 1,000m forward, leaving turbulence that slows nearby enemies.",
        ]
    },
    {
        key: "LPS_GUNNERY",
        label: "Gunnery",
        color: "orange",
        ranks: [
            "Target Sync — Target lead indicators and ordnance lock-on. Crewship projectiles also lock onto targets.",
            "Phantom Eye — Swivel Turrets gain full 360° combat engagement with no movement restrictions.",
            "Archwing Slingshot — High-velocity Archwing deployment (range 1,850m). Penetrates crewship hulls, depositing Tenno inside.",
            "Archwing Fury — Archwing attraction range +25m, melee range +0.75m, damage +20% (applies outside Empyrean).",
            "Necramech Fury — Necramech gun damage +20% (also applies outside Empyrean).",
            "Cold Trigger — Turret heat accretion reduced by 20%.",
            "Advanced Gunnery — Overheat recovery time reduced by 50%. Slingshot range extended by 50%.",
            "Vengeful Archwing — Archwing damage +25%, ability strength/range/efficiency all +20% (applies outside Empyrean, including Landscapes).",
            "Flush Heat Sinks — Reloading overheated weapons cools them to 0 in 0.5 seconds.",
            "Reflex Aim — Aim snaps turrets to nearest lead indicator for 3s, but turret overheats 20% faster. ⚠ Many players stop at R9 — the auto-aim behaviour of Reflex Aim is widely considered annoying and counterproductive.",
        ]
    },
    {
        key: "LPS_ENGINEERING",
        label: "Engineering",
        color: "green",
        ranks: [
            "Applied Omni — Accelerated hazard suppression and hull repair. Timed repair circle for instant repair.",
            "Rapid Support — Air Support Charges cooldown reduced by 50% (to 5 minutes, also outside Empyrean).",
            "Ordnance Forge — Unlocks ability to craft Ordnance at the Resource Forge mid-mission.",
            "Dome Charge Forge — Unlocks ability to craft Dome Charges at the Resource Forge mid-mission.",
            "Optimized Forge — Forge yields +25%. Unlocks crafting Hull Restores at the Forge.",
            "Forge Accelerator — Forge processing speed +25% (cooldown reduced to 2 min 15 sec).",
            "Full Optimization — Further Forge yields +25% (total +50% with Optimized Forge).",
            "Vigilant Archwing — Archwing health/shields/armor all +30% (also applies outside Empyrean).",
            "Vigilant Necramech — Necramech health/shields both +25% (also applies outside Empyrean).",
            "Anastasis — Remotely repair onboard hazards via the Tactical Menu. Spawns a repair drone (5 sec). Cannot be used during an active Electrical Hazard.",
        ]
    },
    {
        key: "LPS_TACTICAL",
        label: "Tactical",
        color: "purple",
        ranks: [
            "Tactical System — Deploy Tactical Mods and access crew tracking via Tactical Menu (L). Shows Railjack map, teammate positions, health and shields.",
            "Ability Kinesis & Overseer — Remotely activate crewmates' Warframe abilities from Tactical Menu. View from other players' perspectives.",
            "Command Link — Fast-travel within the Railjack (Bridge, Archwing exits, Turrets, Slingshot, Forge). Issue scripted mission commands to crew.",
            "Recall Warp — Omni gear teleports you back aboard from anywhere after 5 seconds.",
            "Deploy Necramechs — Use Necramech Summon in grounded combat within Railjack missions.",
            "Tactical Efficiency — Battle Mod energy consumption reduced by 25%.",
            "Tactical Response — Tactical Mod cooldown reduced by 20%.",
            "Archwing Tactical Blink & Necramech Cooldown — Archwing Blink cooldown −25%, Necramech summon cooldown −25% (also applies outside Empyrean).",
            "Swift Tactics — Further reduces Tactical Mod cooldown by 20% (combined 36% with Rank 7, stacks multiplicatively).",
            "Join Warp — Warp from ship to a crew member's last location after 5 seconds.",
        ]
    },
    {
        key: "LPS_COMMAND",
        label: "Command",
        color: "amber",
        ranks: [
            "1st Crew Member — Unlocks first crew slot. Hire crew from Ticker in Fortuna.",
            "Competency Gain — Assign 1 competency point to crew members.",
            "2nd Crew Member — Unlocks second crew slot.",
            "Competency Gain — Assign 1 additional competency point to crew members.",
            "3rd Crew Member — Unlocks third crew slot.",
            "Competency Gain — Assign 1 additional competency point to crew members.",
            "Competency Retraining — Redistribute previously assigned competency points.",
            "Unusual Crewmates — Converted Liches become available as crew (Defender role only, no weapons/systems/competency).",
            "On Call — Designate one crew member to be summoned in non-Railjack missions for up to 3 minutes (10 min cooldown, infinite uses).",
            "Elite Crewmates — Stronger crew available from Ticker with 2 extra competency points and a unique random trait.",
        ]
    },
];

// Railjack intrinsic point costs per rank: 1, 2, 4, 8, 16, 32, 64, 128, 256, 512
// Cumulative to max: 1023 points per skill
const RAILJACK_COST_PER_RANK = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];

const DUVIRI_SKILLS = [
    {
        key: "LPS_DRIFT_COMBAT",
        label: "Combat",
        color: "rose",
        ranks: [
            "Deadly Decrees — Each active Decree grants +10% damage (additive with Serration/Hornet Strike, affects some Warframe abilities).",
            "Adrenaline Surge — In Duviri, Restorative boosts movement speed for 5 seconds.",
            "Transference Sync — Unlock Transference Surge: briefly summon a Warframe in Duviri (press 5 when bar is full, lasts 10 seconds).",
            "Swifter Strike — In Duviri, Drifter Power Strike cooldown reduced by 30%.",
            "Swifter Abilities — In Duviri, Drifter ability cooldown reduced by 20% (Restorative: 12s, Smoke Screen: 48s).",
            "Neural Pulse — Guiding Hand exposes a weakpoint on enemies for 10s. Hitting a weakpoint deals 3× damage.",
            "Weaponmaster — In Duviri, weapon critical hit chance +20% additively (also affects Warframes).",
            "Transference Synergy — Transference Surge duration +50% (increased to 15 seconds).",
            "Muscle Mass — Drifter deals +25% damage. In the Origin System, both Drifter and Operator receive this boost.",
            "Overpowering Abilities — In Duviri, using an Ability increases damage by 150% for 3 seconds.",
        ]
    },
    {
        key: "LPS_DRIFT_RIDING",
        label: "Riding",
        color: "cyan",
        ranks: [
            "Summon Kaithe — Tap 1 to summon your Kaithe. (Required during The Duviri Paradox quest.)",
            "Cavalier Strength — Increased resistance to being dismounted by enemies.",
            "Hoof Stomp — Press 3 while riding to command your Kaithe to stomp, knocking back enemies and reducing their armor.",
            "Fast Travel — Use the map to fast travel to central Duviri locations and Materliths.",
            "Smooth Path — Plants and rocks are marked on the map when riding your Kaithe.",
            "Steadfast Dismount — Press 4 while riding to dismount and gain 150 Overguard (150 second cooldown).",
            "Endurance Racer — Reduce cooldown between dashes.",
            "Unique Identity — Name your Kaithe.",
            "Equestrian Bond — Receive Kaithe Summon for Origin System Open World missions.",
            "Herd Travel — Use the map to fast travel to other Drifters.",
        ]
    },
    {
        key: "LPS_DRIFT_OPPORTUNITY",
        label: "Opportunity",
        color: "amber",
        ranks: [
            "Expanded Decrees — Decree selections offer one additional option (3 → 4 choices).",
            "Expanded Arsenal — Gain two additional weapon choices in Teshin's Cave (4 → 6 options).",
            "Lucky Opener — Gain a free Decree when you enter Duviri.",
            "Warframe Abundance — One additional Warframe option in Teshin's Cave (3 → 4). Also enables preview of offerings in the Star Chart.",
            "Treasure Finder — +50% chance to receive Rare Decrees.",
            "Fresh Hand — Discard offered Decrees and get a new selection, up to 3 times per Duviri visit.",
            "Maximized Arsenal — Two more weapon choices in Teshin's Cave (further increases to 8 options).",
            "Warframe Diversity — One more Warframe option in Teshin's Cave (further increases to 5 options).",
            "High Value Vendor — Acrithis's stock now includes one Arcane per day. Steel Path Circuit also allows a Riven Mod or Kuva.",
            "Stranger in Black — An unlikely ally occasionally appears in Teshin's Cave. Unlocks Stalker as a playable Warframe option.",
        ]
    },
    {
        key: "LPS_DRIFT_ENDURANCE",
        label: "Endurance",
        color: "green",
        ranks: [
            "Fortifying Decrees — Each active Decree grants +25 Health to Drifter (also affects Warframes).",
            "Restorative Decree — Gaining a Decree fully restores Health and Energy (also affects Warframes).",
            "Determination — One additional Revive available in Duviri (also affects Warframes).",
            "Deft Defender — Parry grants +25 Health. Precise Parry grants +50 Health.",
            "Born Survivor — +50% additional Health.",
            "Precision Power — On Precise Parry, gain extra charge for Transference Surge.",
            "Sharpshooter's Bounty — Landing a headshot restores +10 Health/s for 5s (also affects Warframes).",
            "Tenacity — One additional Revive available in Duviri (also affects Warframes).",
            "Tough As Old Boots — Gain +5 Health/s as Drifter. In the Origin System, both Drifter and Operator receive this boost.",
            "Cheat Death — Fatal damage leaves you at 20% Health and invulnerable for 3 seconds (200s cooldown, also affects Warframes).",
        ]
    },
];

// Duviri intrinsic point costs per rank: 20, 25, 30, 45, 65, 90, 125, 160, 205, 255
// Cumulative to max: 1,020 points per skill (4,080 total for all 4 skills)
const DUVIRI_COST_PER_RANK = [20, 25, 30, 45, 65, 90, 125, 160, 205, 255];

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



function IntrinsicsPanel({ mode, onClose }: { mode: "proxima" | "duviri"; onClose: () => void }) {
    const intrinsics = useTrackerStore(s => s.state.intrinsics);
    const railjack = intrinsics?.railjack ?? {};
    const duviri   = intrinsics?.duviri   ?? {};

    const skills = mode === "proxima" ? RAILJACK_SKILLS : DUVIRI_SKILLS;
    const values = mode === "proxima" ? railjack : duviri;
    const costPerRank = mode === "proxima" ? RAILJACK_COST_PER_RANK : DUVIRI_COST_PER_RANK;
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
                        <div className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            Intrinsic investments cannot be reset — choose carefully.
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
                        const nextCost = rank < MAX ? costPerRank[rank] : null;

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
                                                <span className="text-[10px] text-slate-500 ml-auto">Next rank: {nextCost.toLocaleString()} pts</span>
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
                                                    {costPerRank[r].toLocaleString()} pts
                                                </div>
                                            </div>
                                        ))}
                                        <div className="text-[10px] text-slate-600 pt-1 text-right">
                                            Total to max: {costPerRank.reduce((a, b) => a + b, 0).toLocaleString()} pts
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