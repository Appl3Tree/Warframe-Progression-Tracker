// StarChartListView — flat planet/node list with completion checkboxes.
// Extracted from StarChart.tsx as part of Phase 5 file decomposition.

import { useMemo, useState } from "react";
import { STAR_CHART_DATA } from "../../domain/catalog/starChart";
import type { StarChartNode } from "../../domain/models/starChart";
import { PR } from "../../domain/ids/prereqIds";
import { useTrackerStore } from "../../store/store";
import { EMPTY_NODE_COMPLETED, VORS_PRIZE_IMPLIES_COMPLETED, isInMainMap, displayNameFromBase } from "./starChartMapData";

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
export { StarChartListView };
