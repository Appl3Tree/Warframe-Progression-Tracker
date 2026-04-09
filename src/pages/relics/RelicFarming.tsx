// src/pages/relics/RelicFarming.tsx
import React, { useMemo, useState } from "react";
import { getAllRelics, getRelicByKey, type RelicEntry } from "../../domain/catalog/relicCatalog";
import { getRelicAvailabilityStatus, type RelicAvailabilityStatus } from "../../domain/catalog/relicAvailability";
import { useVaultTraderData } from "../../lib/useVaultTraderData";

const TIER_ORDER = ["Lith", "Meso", "Neo", "Axi"] as const;

const TIER_COLOR: Record<string, string> = {
    Lith: "text-blue-300  border-blue-700/50  bg-blue-950/30",
    Meso: "text-green-300 border-green-700/50 bg-green-950/30",
    Neo:  "text-purple-300 border-purple-700/50 bg-purple-950/30",
    Axi:  "text-amber-300 border-amber-700/50 bg-amber-950/30",
};

// A single rotation slot within a node (e.g. Rot A, Rot C)
interface RotationEntry {
    rotation: string; // "A", "B", "C", or "" for non-rotation nodes
    relics: Array<{ relic: RelicEntry; chance: number }>;
}

// A mission node (planet + node name) with all its rotation data aggregated
interface ScoredNode {
    groupKey: string; // "Planet / Node"
    planet: string;
    node: string;
    rotations: RotationEntry[]; // sorted by rotation label
    /** Sum of distinct selected-relic drops across all rotations — primary sort key */
    totalDropCount: number;
    /** Sum of all per-rotation drop %s — tiebreaker */
    totalChance: number;
}

function parsePath(pathLabel: string): { planet: string; node: string; rotation: string } {
    const stripped = pathLabel.replace(/^missionRewards\s*\/\s*/, "");
    const parts = stripped.split(/\s*\/\s*/);
    return { planet: parts[0] ?? "", node: parts[1] ?? "", rotation: parts[2] ?? "" };
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
}: {
    node: ScoredNode;
    availabilityByKey: Map<string, RelicAvailabilityStatus>;
}) {
    const { planet, node: nodeName, rotations, totalDropCount, totalChance } = node;
    const multiRotation = rotations.length > 1 || (rotations.length === 1 && rotations[0].rotation !== "");

    const countBadgeCls =
        totalDropCount >= 4
            ? "text-amber-200 border-amber-600/50 bg-amber-950/40"
            : totalDropCount === 3
                ? "text-green-200 border-green-700/50 bg-green-950/30"
                : totalDropCount === 2
                    ? "text-blue-200 border-blue-700/50 bg-blue-950/30"
                    : "text-slate-400 border-slate-700 bg-slate-900/50";

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
            {/* Node header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100 flex-1 min-w-0">
                    <span className="text-slate-400 text-xs shrink-0">{planet}</span>
                    <span className="text-slate-600 shrink-0">›</span>
                    <span className="truncate">{nodeName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400" title="Combined drop % across all rotations">
                        {totalChance.toFixed(1)}%
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${countBadgeCls}`}>
                        {totalDropCount} drop{totalDropCount === 1 ? "" : "s"}
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

    const scoredNodes = useMemo((): ScoredNode[] => {
        if (selectedKeys.size === 0) return [];

        // Group by (planet + node), then by rotation within each group.
        // Each (relic × rotation) pair counts as one independent drop.
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
                // One entry per relic per rotation — keep highest chance if somehow duplicated
                const existing = nodeData.rotationMap.get(rotation)!.get(key);
                if (!existing || chance > existing.chance) {
                    nodeData.rotationMap.get(rotation)!.set(key, { relic, chance });
                }
            }
        }

        return Array.from(nodeMap.values())
            .map(({ planet, node, rotationMap }) => {
                const rotations: RotationEntry[] = Array.from(rotationMap.entries())
                    .map(([rotation, relicMap]) => ({
                        rotation,
                        relics: Array.from(relicMap.values()).sort((a, b) => b.chance - a.chance),
                    }))
                    .sort((a, b) => a.rotation.localeCompare(b.rotation));

                const totalDropCount = rotations.reduce((s, rot) => s + rot.relics.length, 0);
                const totalChance = rotations.reduce(
                    (s, rot) => s + rot.relics.reduce((rs, r) => rs + r.chance, 0),
                    0,
                );

                return {
                    groupKey: `${planet} / ${node}`,
                    planet,
                    node,
                    rotations,
                    totalDropCount,
                    totalChance,
                };
            })
            .sort((a, b) => b.totalDropCount - a.totalDropCount || b.totalChance - a.totalChance);
    }, [selectedKeys]);

    function toggleRelic(key: string) {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    const selectedCount = selectedKeys.size;
    const vaultedSelectedCount = Array.from(selectedKeys).filter(
        (k) => (availabilityByKey.get(k) ?? "vaulted") === "vaulted",
    ).length;

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

            {/* ── Right: Node results ── */}
            <div className="space-y-3">
                {selectedCount === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center">
                        <div className="text-slate-400 text-sm">Select relics on the left to find the best farming locations.</div>
                        <div className="text-slate-600 text-xs mt-1">
                            Nodes are ranked by total drops across all rotations, then by combined drop %.
                        </div>
                    </div>
                ) : scoredNodes.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center">
                        <div className="text-slate-400 text-sm">
                            None of the {selectedCount} selected relic{selectedCount === 1 ? "" : "s"} have active mission drops.
                        </div>
                        <div className="text-slate-600 text-xs mt-1">All selected relics may be vaulted or from Prime Resurgence only.</div>
                    </div>
                ) : (
                    <>
                        <div className="text-xs text-slate-500">
                            {scoredNodes.length} node{scoredNodes.length === 1 ? "" : "s"} reward at least one of your {selectedCount} selected relic{selectedCount === 1 ? "" : "s"}.
                            {" "}Sorted by total drops across all rotations, then by combined drop %.
                            {vaultedSelectedCount > 0 && (
                                <span className="ml-1 text-red-500/70">
                                    ({vaultedSelectedCount} vaulted relic{vaultedSelectedCount === 1 ? "" : "s"} excluded from results.)
                                </span>
                            )}
                        </div>
                        {scoredNodes.map((node) => (
                            <NodeCard
                                key={node.groupKey}
                                node={node}
                                availabilityByKey={availabilityByKey}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
