// ===== FILE: src/pages/Systems.tsx =====
// src/pages/Systems.tsx

import { useMemo, useState } from "react";
import { STAR_CHART_DATA } from "../domain/catalog/starChart";
import { getDropSourcesForStarChartNode } from "../domain/catalog/starChart/nodeDropSourceMap";
import { getLootForStarChartNode } from "../domain/logic/nodeLootIndex";
import { SOURCE_INDEX } from "../catalog/sources/sourceCatalog";

function Card(props: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            {props.subtitle && <div className="text-sm text-slate-400 mt-1">{props.subtitle}</div>}
            <div className="mt-4">{props.children}</div>
        </div>
    );
}

export default function Systems() {
    const planets = useMemo(() => {
        const ps = [...STAR_CHART_DATA.planets];
        ps.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
        return ps;
    }, []);

    const nodes = useMemo(() => {
        const ns = [...STAR_CHART_DATA.nodes];
        ns.sort((a, b) => a.name.localeCompare(b.name));
        return ns;
    }, []);

    const [planetId, setPlanetId] = useState<string>(() => planets[0]?.id ?? "");
    const nodesForPlanet = useMemo(() => nodes.filter((n) => n.planetId === planetId), [nodes, planetId]);

    const [nodeId, setNodeId] = useState<string>(() => nodesForPlanet[0]?.id ?? "");
    const selectedNode = useMemo(() => nodes.find((n) => n.id === nodeId) ?? null, [nodes, nodeId]);

    // Keep node selection valid when planet changes
    useMemo(() => {
        const first = nodesForPlanet[0]?.id ?? "";
        if (!nodeId || !nodesForPlanet.some((n) => n.id === nodeId)) {
            setNodeId(first);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planetId, nodesForPlanet]);

    const dropSourceIds = useMemo(() => {
        if (!nodeId) return [];
        return getDropSourcesForStarChartNode(nodeId);
    }, [nodeId]);

    const loot = useMemo(() => {
        if (!nodeId) return [];
        try {
            return getLootForStarChartNode(nodeId);
        } catch {
            return [];
        }
    }, [nodeId]);

    const planetName = useMemo(() => planets.find((p) => p.id === planetId)?.name ?? planetId, [planets, planetId]);

    return (
        <div className="space-y-6">
            <Card title="Systems" subtitle="Nightwave and Kahl appear here, separate from core progression.">
                <div className="text-sm text-slate-300">
                    This page now also hosts a Star Chart browser (data-linked to drop sources).
                </div>
            </Card>

            <Card
                title="Star Chart Browser (Prototype)"
                subtitle="Select a planet and node to see which catalog items reference that node's drop-table sources."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Planet</div>
                        <select
                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200"
                            value={planetId}
                            onChange={(e) => setPlanetId(e.target.value)}
                        >
                            {planets.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Node</div>
                        <select
                            className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200"
                            value={nodeId}
                            onChange={(e) => setNodeId(e.target.value)}
                            disabled={nodesForPlanet.length === 0}
                        >
                            {nodesForPlanet.length === 0 ? (
                                <option value="">(No nodes defined for {planetName} yet)</option>
                            ) : (
                                nodesForPlanet.map((n) => (
                                    <option key={n.id} value={n.id}>
                                        {n.name} [{n.nodeType}]
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Selection</div>
                    {selectedNode ? (
                        <div className="text-sm text-slate-200 break-words">
                            <span className="font-semibold">{selectedNode.name}</span>{" "}
                            <span className="text-slate-500 font-mono">({selectedNode.id})</span>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-400">No node selected.</div>
                    )}

                    <div className="mt-2 text-xs text-slate-400">
                        Drop-source ids mapped to this node:{" "}
                        <span className="font-mono">{dropSourceIds.length}</span>
                    </div>

                    {dropSourceIds.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {dropSourceIds.slice(0, 10).map((sid) => {
                                const label = SOURCE_INDEX[sid as any]?.label ?? null;
                                return (
                                    <div key={sid} className="text-xs break-words">
                                        <span className="font-mono text-slate-200">{sid}</span>
                                        {label && <span className="text-slate-500"> — {label}</span>}
                                    </div>
                                );
                            })}
                            {dropSourceIds.length > 10 && (
                                <div className="text-xs text-slate-500">
                                    Showing 10 of {dropSourceIds.length}.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Obtainable items (by source reference)</div>
                        <div className="text-xs text-slate-400">
                            Count: <span className="font-mono">{loot.length}</span>
                        </div>
                    </div>

                    {dropSourceIds.length === 0 ? (
                        <div className="mt-2 text-sm text-slate-400">
                            This node has no mapped drop sources yet. Populate:
                            <span className="font-mono"> STAR_CHART_NODE_TO_DROP_SOURCES</span>.
                        </div>
                    ) : loot.length === 0 ? (
                        <div className="mt-2 text-sm text-slate-400">
                            No catalog items currently reference these sources. (This can be normal early on.)
                        </div>
                    ) : (
                        <ul className="mt-3 list-disc pl-5 space-y-0.5 text-sm text-slate-200">
                            {loot.slice(0, 200).map((it) => (
                                <li key={it.catalogId} className="break-words">
                                    <span className="font-semibold">{it.name}</span>{" "}
                                    <span className="text-slate-500 font-mono">({it.catalogId})</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {loot.length > 200 && (
                        <div className="mt-2 text-xs text-slate-500">
                            Rendering capped at 200 items for responsiveness.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

