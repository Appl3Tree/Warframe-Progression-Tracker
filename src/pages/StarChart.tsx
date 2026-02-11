// ===== FILE: src/pages/StarChart.tsx =====

import { useMemo, useState } from "react";
import { STAR_CHART_DATA } from "../domain/catalog/starChart";
import type { PlanetId, NodeId, StarChartNode, StarChartPlanet } from "../domain/models/starChart";
import { getDropSourcesForStarChartNode } from "../domain/catalog/starChart/nodeDropSourceMap";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../catalog/items/itemAcquisition";
import { SOURCE_INDEX } from "../catalog/sources/sourceCatalog";
import { normalizeSourceId } from "../domain/ids/sourceIds";

function Card(props: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            {props.subtitle && <div className="text-sm text-slate-400 mt-1">{props.subtitle}</div>}
            <div className="mt-4">{props.children}</div>
        </div>
    );
}

function safeString(v: unknown): string {
    return typeof v === "string" ? v : String(v ?? "");
}

type ItemRow = { catalogId: string; name: string };

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
            typeof rec?.displayName === "string"
                ? rec.displayName
                : typeof rec?.name === "string"
                  ? rec.name
                  : safeString(catalogId);

        const acq = getAcquisitionByCatalogId(catalogId as any);
        const srcs: string[] = Array.isArray((acq as any)?.sources) ? (acq as any).sources.map(String) : [];

        for (const s of srcs) {
            const norm = safeNormalizeSourceId(String(s ?? "").trim());
            if (!norm) continue;

            if (!out[norm]) out[norm] = [];
            out[norm].push({ catalogId: String(catalogId), name });
        }
    }

    for (const k of Object.keys(out)) {
        out[k].sort((a, b) => a.name.localeCompare(b.name));
    }

    return out;
}

export default function StarChart() {
    const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);

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
            arr.sort((a, b) => a.name.localeCompare(b.name));
            m.set(pid, arr);
        }
        return m;
    }, []);

    const sortedPlanets = useMemo(() => {
        const arr = [...STAR_CHART_DATA.planets];
        arr.sort((a, b) => a.sortOrder - b.sortOrder);
        return arr;
    }, []);

    const sourceToItemsIndex = useMemo(() => buildSourceToItemsIndex(), []);

    const selectedPlanet = selectedPlanetId ? planetsById.get(selectedPlanetId) ?? null : null;
    const planetNodes = selectedPlanetId ? nodesByPlanet.get(selectedPlanetId) ?? [] : [];

    const selectedNode: StarChartNode | null = useMemo(() => {
        if (!selectedNodeId) return null;
        return STAR_CHART_DATA.nodes.find((n) => n.id === selectedNodeId) ?? null;
    }, [selectedNodeId]);

    const dropSources = useMemo(() => {
        if (!selectedNode) return [];
        // nodeDropSourceMap already normalizes, but we keep this defensive in case of future edits.
        return getDropSourcesForStarChartNode(selectedNode.id)
            .map((sid) => safeNormalizeSourceId(sid))
            .filter((x): x is string => Boolean(x));
    }, [selectedNode]);

    const dropSourceDetails = useMemo(() => {
        return dropSources.map((sid) => ({
            sid,
            label: SOURCE_INDEX[sid as any]?.label ?? "(missing from SOURCE_INDEX)"
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

    return (
        <div className="space-y-6">
            <Card
                title="Star Chart"
                subtitle="Select a planet/region, then a node. Items are derived from acquisition sources that reference data:node/... and data:missionreward/...."
            >
                <div className="flex flex-wrap gap-2">
                    {sortedPlanets.map((p) => {
                        const active = p.id === selectedPlanetId;
                        return (
                            <button
                                key={p.id}
                                className={[
                                    "rounded-lg border px-3 py-1.5 text-sm",
                                    active
                                        ? "border-slate-500 bg-slate-900 text-slate-100"
                                        : "border-slate-800 bg-slate-950/30 text-slate-200 hover:bg-slate-900/60"
                                ].join(" ")}
                                onClick={() => {
                                    setSelectedPlanetId(p.id);
                                    setSelectedNodeId(null);
                                }}
                            >
                                {p.name}
                            </button>
                        );
                    })}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card
                    title="Nodes"
                    subtitle={selectedPlanet ? `${selectedPlanet.name} (${selectedPlanet.id})` : "Select a planet/region above."}
                >
                    {selectedPlanetId ? (
                        planetNodes.length === 0 ? (
                            <div className="text-sm text-slate-400">No nodes defined yet for this planet/region.</div>
                        ) : (
                            <div className="space-y-2">
                                {planetNodes.map((n) => {
                                    const active = n.id === selectedNodeId;
                                    return (
                                        <button
                                            key={n.id}
                                            className={[
                                                "w-full text-left rounded-xl border p-3",
                                                active
                                                    ? "border-slate-600 bg-slate-900/60"
                                                    : "border-slate-800 bg-slate-950/30 hover:bg-slate-900/40"
                                            ].join(" ")}
                                            onClick={() => setSelectedNodeId(n.id)}
                                        >
                                            <div className="text-sm font-semibold text-slate-100">{n.name}</div>
                                            <div className="mt-1 text-[11px] text-slate-500 font-mono break-words">
                                                {n.id} · type={n.nodeType}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <div className="text-sm text-slate-400">Pick a planet/region to list nodes.</div>
                    )}
                </Card>

                <Card
                    title="Drops / Rewards"
                    subtitle={
                        selectedNode ? `${selectedNode.name} (${selectedNode.id})` : "Select a node to show mapped drop sources and derived items."
                    }
                >
                    {!selectedNode ? (
                        <div className="text-sm text-slate-400">No node selected.</div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Drop SourceIds</div>
                                {dropSourceDetails.length === 0 ? (
                                    <div className="text-sm text-slate-400">No drop sources mapped for this node.</div>
                                ) : (
                                    <ul className="space-y-1">
                                        {dropSourceDetails.map((d) => (
                                            <li key={d.sid} className="text-xs text-slate-200 break-words">
                                                <span className="font-mono">{d.sid}</span>
                                                <span className="text-slate-500"> — {d.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                                    Items with acquisition including these sources
                                </div>
                                {itemsAtNode.length === 0 ? (
                                    <div className="text-sm text-slate-400">No items currently resolve to these sources.</div>
                                ) : (
                                    <div className="max-h-[520px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                        <ul className="list-disc pl-5 space-y-0.5 text-sm text-slate-200">
                                            {itemsAtNode.slice(0, 500).map((it) => (
                                                <li key={it.catalogId} className="break-words">
                                                    <span className="font-semibold">{it.name}</span>{" "}
                                                    <span className="text-slate-500 font-mono">({it.catalogId})</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {itemsAtNode.length > 500 && (
                                            <div className="mt-2 text-xs text-slate-500">Rendering capped at 500 items.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

