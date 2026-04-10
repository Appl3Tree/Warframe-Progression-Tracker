// src/pages/relics/RelicFarming.tsx
import React, { useMemo, useState } from "react";
import { getAllRelics, getRelicByKey, type RelicEntry } from "../../domain/catalog/relicCatalog";
import { getRelicAvailabilityStatus, type RelicAvailabilityStatus } from "../../domain/catalog/relicAvailability";
import { useVaultTraderData } from "../../lib/useVaultTraderData";
import missionRewardsRaw from "../../../external/warframe-drop-data/raw/missionRewards.json";

// Build a static "Planet / Node" → gameMode lookup from the drop data.
// missionRewardsRaw has a single outer key "missionRewards" before the planet map.
const _missionTypeByGroupKey = new Map<string, string>();
{
    const missionRewardsData = (missionRewardsRaw as any).missionRewards as
        Record<string, Record<string, { gameMode?: string }>>;
    for (const [planet, nodes] of Object.entries(missionRewardsData ?? {})) {
        for (const [node, data] of Object.entries(nodes)) {
            if (data?.gameMode) {
                _missionTypeByGroupKey.set(`${planet} / ${node}`, data.gameMode);
            }
        }
    }
}

function getMissionType(groupKey: string): string | undefined {
    return _missionTypeByGroupKey.get(groupKey);
}

const TIER_ORDER = ["Lith", "Meso", "Neo", "Axi"] as const;

const TIER_COLOR: Record<string, string> = {
    Lith: "text-blue-300  border-blue-700/50  bg-blue-950/30",
    Meso: "text-green-300 border-green-700/50 bg-green-950/30",
    Neo:  "text-purple-300 border-purple-700/50 bg-purple-950/30",
    Axi:  "text-amber-300 border-amber-700/50 bg-amber-950/30",
};

type FarmingMode = "max-drops" | "coverage" | "total-chance";

/**
 * "A"  → player stops at rotation A (only A drops count)
 * "AB" → player stops at rotation B (A and B drops count)
 * "any" → player runs through C (all rotations count)
 */
type RotationLimit = "any" | "A" | "AB";

// A single rotation slot within a node (e.g. Rot A, Rot C)
interface RotationEntry {
    rotation: string; // "A", "B", "C", or "" for non-rotation nodes
    relics: Array<{ relic: RelicEntry; chance: number }>;
}

interface ScoredNode {
    groupKey: string; // "Planet / Node"
    planet: string;
    node: string;
    rotations: RotationEntry[]; // sorted by rotation label
    /**
     * Max-drops score: sum of (relic × rotation) pairs — a relic in Rot A and
     * Rot C contributes 2. Primary sort key in "max-drops" mode.
     */
    totalDropCount: number;
    /**
     * Coverage score: number of *distinct* selected relics across all rotations
     * — a relic appearing in multiple rotations still counts as 1.
     * Primary sort key in "coverage" mode.
     */
    uniqueRelicCount: number;
    /** Sum of all per-rotation drop %s — tiebreaker in both modes. */
    totalChance: number;
    /** Mission type e.g. "Survival", "Defense" — undefined if not found in data. */
    missionType: string | undefined;
}

function parsePath(pathLabel: string): { planet: string; node: string; rotation: string } {
    const stripped = pathLabel.replace(/^missionRewards\s*\/\s*/, "");
    const parts = stripped.split(/\s*\/\s*/);
    return { planet: parts[0] ?? "", node: parts[1] ?? "", rotation: parts[2] ?? "" };
}

function computeScores(rotations: RotationEntry[]): Pick<ScoredNode, "totalDropCount" | "uniqueRelicCount" | "totalChance"> {
    const totalDropCount = rotations.reduce((s, rot) => s + rot.relics.length, 0);
    const seenKeys = new Set<string>();
    for (const rot of rotations) {
        for (const { relic } of rot.relics) seenKeys.add(relic.key);
    }
    const totalChance = rotations.reduce(
        (s, rot) => s + rot.relics.reduce((rs, r) => rs + r.chance, 0),
        0,
    );
    return { totalDropCount, uniqueRelicCount: seenKeys.size, totalChance };
}

/** Returns true if this rotation label is within the player's chosen limit. */
function rotationAllowed(rotation: string, limit: RotationLimit): boolean {
    if (limit === "any") return true;
    // Non-rotation nodes (rotation = "") are always included regardless of limit
    if (rotation === "") return true;
    if (limit === "A") return rotation === "A";
    if (limit === "AB") return rotation === "A" || rotation === "B";
    return true;
}

// ---- Sub-components ----

function TierLabel({ tier }: { tier: string }) {
    const colorCls = TIER_COLOR[tier]?.split(" ")[0] ?? "text-slate-400";
    return (
        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${colorCls}`}>
            {tier}
        </div>
    );
}

function TierBadge({ tier }: { tier: string }) {
    const cls = TIER_COLOR[tier] ?? "text-slate-400 border-slate-700 bg-slate-900";
    return (
        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${cls}`}>
            {tier.toUpperCase()}
        </span>
    );
}

function AvailBadge({ avail }: { avail: RelicAvailabilityStatus }) {
    if (avail === "prime_resurgence") {
        return (
            <span className="text-[9px] px-1 py-0.5 rounded border border-violet-700/50 bg-violet-950/30 text-violet-300 font-semibold shrink-0">
                PR
            </span>
        );
    }
    if (avail === "vaulted") {
        return (
            <span className="text-[9px] px-1 py-0.5 rounded border border-red-800/50 bg-red-950/30 text-red-500 font-semibold shrink-0">
                V
            </span>
        );
    }
    return null;
}

function NodeCard({
    node,
    availabilityByKey,
    mode,
}: {
    node: ScoredNode;
    availabilityByKey: Map<string, RelicAvailabilityStatus>;
    mode: FarmingMode;
}) {
    const { planet, node: nodeName, rotations, totalDropCount, uniqueRelicCount, totalChance, missionType } = node;
    const multiRotation = rotations.length > 1 || (rotations.length === 1 && rotations[0].rotation !== "");

    const primaryCount = mode === "coverage" ? uniqueRelicCount : totalDropCount;
    const countBadgeCls = mode === "total-chance"
        ? (totalChance >= 30
            ? "text-amber-200 border-amber-600/50 bg-amber-950/40"
            : totalChance >= 20
                ? "text-green-200 border-green-700/50 bg-green-950/30"
                : totalChance >= 10
                    ? "text-blue-200 border-blue-700/50 bg-blue-950/30"
                    : "text-slate-400 border-slate-700 bg-slate-900/50")
        : (primaryCount >= 4
            ? "text-amber-200 border-amber-600/50 bg-amber-950/40"
            : primaryCount === 3
                ? "text-green-200 border-green-700/50 bg-green-950/30"
                : primaryCount === 2
                    ? "text-blue-200 border-blue-700/50 bg-blue-950/30"
                    : "text-slate-400 border-slate-700 bg-slate-900/50");

    const badgeLabel = mode === "coverage"
        ? `${uniqueRelicCount} unique`
        : mode === "total-chance"
            ? `${totalChance.toFixed(1)}%`
            : `${totalDropCount} drop${totalDropCount === 1 ? "" : "s"}`;

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
            {/* Node header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100 flex-1 min-w-0">
                    <span className="text-slate-400 text-xs shrink-0">{planet}</span>
                    <span className="text-slate-600 shrink-0">›</span>
                    <span className="truncate">{nodeName}</span>
                    {missionType && (
                        <span className="text-[10px] font-normal text-slate-500 shrink-0">
                            {missionType}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {mode !== "total-chance" && (
                        <span className="text-[11px] font-mono text-slate-400" title="Combined drop % across all rotations">
                            {totalChance.toFixed(1)}%
                        </span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${countBadgeCls}`}>
                        {badgeLabel}
                    </span>
                </div>
            </div>

            {/* Rotations */}
            <div className={multiRotation ? "space-y-2" : "space-y-1"}>
                {rotations.map((rot) => (
                    <div key={rot.rotation || "__"}>
                        {multiRotation && (
                            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                                {rot.rotation ? `Rotation ${rot.rotation}` : "Drop"}
                            </div>
                        )}
                        <div className="space-y-1">
                            {rot.relics.map(({ relic, chance }) => {
                                const avail = availabilityByKey.get(relic.key) ?? "vaulted";
                                return (
                                    <div key={relic.key} className="flex items-center gap-2 text-[11px]">
                                        <TierBadge tier={relic.tier} />
                                        <span className={avail === "vaulted" ? "text-slate-500" : "text-slate-300"}>
                                            {relic.displayName}
                                        </span>
                                        <AvailBadge avail={avail} />
                                        <span className="ml-auto font-mono text-slate-500 shrink-0">{chance.toFixed(1)}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---- Main component ----

interface RelicFarmingProps {
    selectedKeys: Set<string>;
    setSelectedKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export default function RelicFarming({ selectedKeys, setSelectedKeys }: RelicFarmingProps) {
    const vaultTrader = useVaultTraderData();

    const allRelics = useMemo(
        () => getAllRelics().sort((a, b) => a.relicName.localeCompare(b.relicName)),
        [],
    );

    const [showVaulted, setShowVaulted] = useState(false);
    const [tierFilter, setTierFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [farmingMode, setFarmingMode] = useState<FarmingMode>("max-drops");
    const [rotationLimit, setRotationLimit] = useState<RotationLimit>("any");
    const [excludedMissionTypes, setExcludedMissionTypes] = useState<Set<string>>(new Set());

    const availabilityByKey = useMemo(() => {
        const map = new Map<string, RelicAvailabilityStatus>();
        for (const relic of allRelics) {
            map.set(relic.key, getRelicAvailabilityStatus(relic.key, relic.isActive, vaultTrader));
        }
        return map;
    }, [allRelics, vaultTrader]);

    const filteredRelics = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allRelics.filter((r) => {
            const avail = availabilityByKey.get(r.key) ?? "vaulted";
            if (!showVaulted && avail === "vaulted") return false;
            if (tierFilter !== "all" && r.tier.toLowerCase() !== tierFilter) return false;
            if (!q) return true;
            if (r.displayName.toLowerCase().includes(q)) return true;
            return r.rewards.some((rw) => rw.itemName.toLowerCase().includes(q));
        });
    }, [allRelics, availabilityByKey, showVaulted, tierFilter, search]);

    const byTier = useMemo(() => {
        const groups = new Map<string, RelicEntry[]>(TIER_ORDER.map((t) => [t, []]));
        for (const r of filteredRelics) {
            groups.get(r.tier)?.push(r);
        }
        return groups;
    }, [filteredRelics]);

    // Build the full node map — no rotation/mission-type filtering here
    const scoredNodes = useMemo((): ScoredNode[] => {
        if (selectedKeys.size === 0) return [];

        type RotationMap = Map<string, Map<string, { relic: RelicEntry; chance: number }>>;
        const nodeMap = new Map<string, { planet: string; node: string; rotationMap: RotationMap }>();

        for (const key of selectedKeys) {
            const relic = getRelicByKey(key);
            if (!relic) continue;

            // Deduplicate within this relic by exact pathLabel, keeping highest chance
            const bestByPath = new Map<string, number>();
            for (const m of relic.missions) {
                const prev = bestByPath.get(m.pathLabel) ?? 0;
                if (m.chance > prev) bestByPath.set(m.pathLabel, m.chance);
            }

            for (const [pathLabel, chance] of bestByPath) {
                const { planet, node, rotation } = parsePath(pathLabel);
                const groupKey = `${planet} / ${node}`;

                if (!nodeMap.has(groupKey)) {
                    nodeMap.set(groupKey, { planet, node, rotationMap: new Map() });
                }
                const nodeData = nodeMap.get(groupKey)!;

                if (!nodeData.rotationMap.has(rotation)) {
                    nodeData.rotationMap.set(rotation, new Map());
                }
                const existing = nodeData.rotationMap.get(rotation)!.get(key);
                if (!existing || chance > existing.chance) {
                    nodeData.rotationMap.get(rotation)!.set(key, { relic, chance });
                }
            }
        }

        return Array.from(nodeMap.values()).map(({ planet, node, rotationMap }) => {
            const rotations: RotationEntry[] = Array.from(rotationMap.entries())
                .map(([rotation, relicMap]) => ({
                    rotation,
                    relics: Array.from(relicMap.values()).sort((a, b) => b.chance - a.chance),
                }))
                .sort((a, b) => a.rotation.localeCompare(b.rotation));

            const gk = `${planet} / ${node}`;
            return {
                groupKey: gk,
                planet,
                node,
                rotations,
                ...computeScores(rotations),
                missionType: getMissionType(gk),
            };
        });
    }, [selectedKeys]);

    // Collect all mission types present in the full result set (before filtering)
    const allMissionTypes = useMemo(() => {
        const types = new Set<string>();
        for (const node of scoredNodes) {
            types.add(node.missionType ?? "Unknown");
        }
        return Array.from(types).sort();
    }, [scoredNodes]);

    // Apply rotation limit + mission type exclusions, recompute scores
    const filteredNodes = useMemo((): ScoredNode[] => {
        return scoredNodes
            .map((node) => {
                // Apply rotation limit
                const allowedRotations = node.rotations.filter((rot) =>
                    rotationAllowed(rot.rotation, rotationLimit),
                );
                if (allowedRotations.length === 0) return null;

                // Apply mission type exclusion
                const mt = node.missionType ?? "Unknown";
                if (excludedMissionTypes.has(mt)) return null;

                // Recompute scores on the filtered rotation set
                return {
                    ...node,
                    rotations: allowedRotations,
                    ...computeScores(allowedRotations),
                };
            })
            .filter((n): n is ScoredNode => n !== null);
    }, [scoredNodes, rotationLimit, excludedMissionTypes]);

    const sortedNodes = useMemo(() => {
        const nodes = filteredNodes.slice();
        if (farmingMode === "coverage") {
            nodes.sort((a, b) => b.uniqueRelicCount - a.uniqueRelicCount || b.totalChance - a.totalChance);
        } else if (farmingMode === "total-chance") {
            nodes.sort((a, b) => b.totalChance - a.totalChance || b.totalDropCount - a.totalDropCount);
        } else {
            nodes.sort((a, b) => b.totalDropCount - a.totalDropCount || b.totalChance - a.totalChance);
        }
        return nodes;
    }, [filteredNodes, farmingMode]);

    function toggleRelic(key: string) {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function toggleMissionType(type: string) {
        setExcludedMissionTypes((prev) => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type);
            else next.add(type);
            return next;
        });
    }

    const selectedCount = selectedKeys.size;
    const vaultedSelectedCount = Array.from(selectedKeys).filter(
        (k) => (availabilityByKey.get(k) ?? "vaulted") === "vaulted",
    ).length;

    const modeDescriptions: Record<FarmingMode, string> = {
        "max-drops":    "Sorted by total relic drops across all rotations — a relic in two rotations counts twice.",
        "coverage":     "Sorted by unique relics per node — duplicate rotations don't add to the score.",
        "total-chance": "Sorted by highest summed drop % across all rotations — pure probability, ignoring variety.",
    };

    const hasResults = selectedCount > 0 && scoredNodes.length > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">
            {/* ── Left: Relic selector ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Select Relics
                        {selectedCount > 0 && (
                            <span className="ml-1.5 text-slate-300 font-semibold">{selectedCount} selected</span>
                        )}
                    </div>
                    {selectedCount > 0 && (
                        <button
                            onClick={() => setSelectedKeys(new Set())}
                            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Search */}
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search relic name or reward…"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-slate-500"
                />

                {/* Tier filter + vault toggle */}
                <div className="flex flex-wrap gap-1.5 items-center">
                    {(["all", "lith", "meso", "neo", "axi"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTierFilter(t)}
                            className={[
                                "rounded-full px-2.5 py-0.5 text-[11px] border transition-colors capitalize",
                                tierFilter === t
                                    ? "bg-slate-100 text-slate-900 border-slate-100"
                                    : "bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-900",
                            ].join(" ")}
                        >
                            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowVaulted((x) => !x)}
                        className={[
                            "rounded-full px-2.5 py-0.5 text-[11px] border transition-colors ml-auto",
                            showVaulted
                                ? "bg-red-950/40 text-red-300 border-red-700/50"
                                : "bg-slate-950/40 text-slate-400 border-slate-700 hover:bg-slate-900",
                        ].join(" ")}
                    >
                        {showVaulted ? "Hide vaulted" : "Show vaulted"}
                    </button>
                </div>

                {/* Relic checklist */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {TIER_ORDER.map((tier) => {
                        const relics = byTier.get(tier) ?? [];
                        if (relics.length === 0) return null;
                        return (
                            <div key={tier}>
                                <TierLabel tier={tier} />
                                <div className="space-y-0.5">
                                    {relics.map((relic) => {
                                        const avail = availabilityByKey.get(relic.key) ?? "vaulted";
                                        const checked = selectedKeys.has(relic.key);
                                        return (
                                            <label
                                                key={relic.key}
                                                className={[
                                                    "flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-colors text-xs select-none",
                                                    checked
                                                        ? "bg-slate-800/70 text-slate-100"
                                                        : "hover:bg-slate-900/60 text-slate-400",
                                                    avail === "vaulted" ? "opacity-60" : "",
                                                ].join(" ")}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleRelic(relic.key)}
                                                    className="rounded border-slate-600 bg-slate-900 accent-slate-400 shrink-0"
                                                />
                                                <span className="flex-1 min-w-0 truncate">{relic.displayName}</span>
                                                <AvailBadge avail={avail} />
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {filteredRelics.length === 0 && (
                        <div className="text-xs text-slate-500 text-center py-4">
                            No relics match the current filter.
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right: Filters + Node results ── */}
            <div className="space-y-3">
                {/* Controls card — ranking mode, rotation limit, mission type filter */}
                {hasResults && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 space-y-3">
                        {/* Ranking mode */}
                        <div className="space-y-1.5">
                            <div className="text-[10px] uppercase tracking-wide text-slate-500">Ranking mode</div>
                            <div className="flex gap-2">
                                {([
                                    { key: "max-drops"    as FarmingMode, label: "Max Drops",   desc: "Every relic × rotation is a separate drop" },
                                    { key: "coverage"     as FarmingMode, label: "Coverage",    desc: "Count each unique relic once per node" },
                                    { key: "total-chance" as FarmingMode, label: "Total %",     desc: "Highest combined drop % wins" },
                                ] as const).map((m) => (
                                    <button
                                        key={m.key}
                                        onClick={() => setFarmingMode(m.key)}
                                        title={m.desc}
                                        className={[
                                            "flex-1 rounded-lg border px-3 py-2 text-xs text-left transition-colors",
                                            farmingMode === m.key
                                                ? "border-slate-400 bg-slate-800 text-slate-100"
                                                : "border-slate-700 bg-slate-900/50 text-slate-400 hover:bg-slate-900 hover:text-slate-300",
                                        ].join(" ")}
                                    >
                                        <div className="font-semibold">{m.label}</div>
                                        <div className="text-[10px] mt-0.5 opacity-70">{m.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rotation limit */}
                        <div className="space-y-1.5">
                            <div className="text-[10px] uppercase tracking-wide text-slate-500">
                                Rotation limit
                                <span className="ml-1.5 normal-case text-slate-600">— how far into a mission are you willing to go?</span>
                            </div>
                            <div className="flex gap-1.5">
                                {([
                                    { key: "any" as RotationLimit, label: "Any",       desc: "Include all rotations (A, B, C)" },
                                    { key: "AB"  as RotationLimit, label: "Stop at B", desc: "Only A and B rotations" },
                                    { key: "A"   as RotationLimit, label: "Stop at A", desc: "First rotation only" },
                                ] as const).map((opt) => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setRotationLimit(opt.key)}
                                        title={opt.desc}
                                        className={[
                                            "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                                            rotationLimit === opt.key
                                                ? "border-slate-400 bg-slate-800 text-slate-100 font-semibold"
                                                : "border-slate-700 bg-slate-900/50 text-slate-400 hover:bg-slate-900 hover:text-slate-300",
                                        ].join(" ")}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mission type filter — only shown when multiple types exist */}
                        {allMissionTypes.length > 1 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Mission type</div>
                                    {excludedMissionTypes.size > 0 && (
                                        <button
                                            onClick={() => setExcludedMissionTypes(new Set())}
                                            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            Show all
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {allMissionTypes.map((type) => {
                                        const excluded = excludedMissionTypes.has(type);
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => toggleMissionType(type)}
                                                className={[
                                                    "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                                                    excluded
                                                        ? "border-slate-800 bg-slate-900/30 text-slate-600 line-through"
                                                        : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-slate-500",
                                                ].join(" ")}
                                            >
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {selectedCount === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center">
                        <div className="text-slate-400 text-sm">Select relics on the left to find the best farming locations.</div>
                        <div className="text-slate-600 text-xs mt-1">
                            Choose a ranking mode to prioritise maximum drop chances or broadest relic coverage.
                        </div>
                    </div>
                ) : sortedNodes.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center">
                        <div className="text-slate-400 text-sm">
                            No nodes match the current filters.
                        </div>
                        <div className="text-slate-600 text-xs mt-1">
                            Try relaxing the rotation limit or re-enabling some mission types.
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-xs text-slate-500">
                            {sortedNodes.length} node{sortedNodes.length === 1 ? "" : "s"} reward at least one of your {selectedCount} selected relic{selectedCount === 1 ? "" : "s"}.
                            {" "}{modeDescriptions[farmingMode]}
                            {vaultedSelectedCount > 0 && (
                                <span className="ml-1 text-red-500/70">
                                    ({vaultedSelectedCount} vaulted relic{vaultedSelectedCount === 1 ? "" : "s"} excluded from results.)
                                </span>
                            )}
                        </div>
                        {sortedNodes.map((node) => (
                            <NodeCard
                                key={node.groupKey}
                                node={node}
                                availabilityByKey={availabilityByKey}
                                mode={farmingMode}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
