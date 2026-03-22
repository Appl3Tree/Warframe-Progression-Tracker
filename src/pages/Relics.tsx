// src/pages/Relics.tsx
import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import { useShallow } from "zustand/react/shallow";
import {
    buildRequirementsSnapshot,
    buildFarmingSnapshot,
} from "../domain/logic/requirementEngine";
import {
    scoreRelicsForItems,
    type RelicEntry,
    type ScoredRelic,
} from "../domain/catalog/relicCatalog";

// ---- Helpers ----

const RARITY_COLOR: Record<string, string> = {
    Rare:     "text-amber-400 border-amber-700/50 bg-amber-950/30",
    Uncommon: "text-slate-300 border-slate-600/50 bg-slate-900/40",
    Common:   "text-slate-400 border-slate-700/40 bg-slate-950/30",
};

const RARITY_LABEL: Record<string, string> = {
    Rare: "R", Uncommon: "UC", Common: "C",
};

const TIER_COLOR: Record<string, string> = {
    Lith: "text-blue-300  border-blue-700/50  bg-blue-950/30",
    Meso: "text-green-300 border-green-700/50 bg-green-950/30",
    Neo:  "text-purple-300 border-purple-700/50 bg-purple-950/30",
    Axi:  "text-amber-300 border-amber-700/50 bg-amber-950/30",
};

// Void trace costs per refinement level
const REFINEMENT_COSTS = [
    { label: "Intact",      traces: 0,   dropRates: { Rare: 2,  Uncommon: 11,    Common: 25.33 } },
    { label: "Exceptional", traces: 25,  dropRates: { Rare: 4,  Uncommon: 13,    Common: 23.33 } },
    { label: "Flawless",    traces: 50,  dropRates: { Rare: 6,  Uncommon: 17,    Common: 20    } },
    { label: "Radiant",     traces: 100, dropRates: { Rare: 10, Uncommon: 20,    Common: 16.67 } },
];

// ---- Sub-components ----

function TierBadge({ tier }: { tier: string }) {
    const cls = TIER_COLOR[tier] ?? "text-slate-400 border-slate-700 bg-slate-900";
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${cls}`}>
            {tier.toUpperCase()}
        </span>
    );
}

function RarityBadge({ rarity }: { rarity: string }) {
    const cls = RARITY_COLOR[rarity] ?? "text-slate-400 border-slate-700 bg-slate-900";
    return (
        <span className={`text-[9px] px-1 py-0.5 rounded border font-semibold shrink-0 ${cls}`}>
            {RARITY_LABEL[rarity] ?? rarity}
        </span>
    );
}

function MissionList({ relic }: { relic: RelicEntry }) {
    const [expanded, setExpanded] = useState(false);
    if (relic.missions.length === 0) {
        return <span className="text-xs text-red-400/80 italic">No active missions (vaulted)</span>;
    }

    // Deduplicate by pathLabel, keep highest chance per path
    const deduped = new Map<string, { pathLabel: string; rotation: string; chance: number }>();
    for (const m of relic.missions) {
        const existing = deduped.get(m.pathLabel);
        if (!existing || m.chance > existing.chance) deduped.set(m.pathLabel, m);
    }
    const missions = Array.from(deduped.values()).sort((a, b) => b.chance - a.chance);
    const shown = expanded ? missions : missions.slice(0, 3);

    return (
        <div className="mt-1 space-y-0.5">
            {shown.map((m) => {
                const parts = m.pathLabel.replace(/missionRewards\s*\/\s*/, "").split(" / ");
                const [planet, node, rot] = parts;
                return (
                    <div key={m.pathLabel} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="text-slate-500">{planet}</span>
                        <span className="text-slate-600">›</span>
                        <span>{node}</span>
                        {rot && (
                            <>
                                <span className="text-slate-600">›</span>
                                <span className="text-slate-500">Rot {rot}</span>
                            </>
                        )}
                        <span className="text-slate-600 ml-auto">{m.chance.toFixed(1)}%</span>
                    </div>
                );
            })}
            {missions.length > 3 && (
                <button
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={() => setExpanded((x) => !x)}
                >
                    {expanded ? "Show less" : `+${missions.length - 3} more locations`}
                </button>
            )}
        </div>
    );
}

function RelicCard({ scored, goalItems }: { scored: ScoredRelic; goalItems: Set<string> }) {
    const { relic, matchedItems } = scored;
    const [showAll, setShowAll] = useState(false);

    // Separate matched rewards (from goals) from the rest
    const allRewards = relic.rewards;
    const otherRewards = allRewards.filter((rw) => !goalItems.has(rw.itemName));

    return (
        <div className={[
            "rounded-xl border p-3 transition-colors",
            relic.isActive
                ? "border-slate-700 bg-slate-950/40"
                : "border-slate-800/60 bg-slate-950/20 opacity-75",
        ].join(" ")}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <TierBadge tier={relic.tier} />
                <span className="text-sm font-semibold text-slate-100">{relic.displayName}</span>
                {!relic.isActive && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-red-700/50 bg-red-950/30 text-red-400 font-semibold shrink-0">
                        VAULTED
                    </span>
                )}
                <span className="ml-auto text-[10px] text-slate-500">
                    {matchedItems.length}/{allRewards.length} slots match
                </span>
            </div>

            {/* Matched items (from goals) */}
            <div className="space-y-1 mb-2">
                {matchedItems.map((rw) => (
                    <div key={rw.itemName} className="flex items-center gap-1.5 text-xs">
                        <RarityBadge rarity={rw.rarity} />
                        <span className="text-slate-200 font-medium">{rw.itemName}</span>
                        <span className="ml-auto text-slate-500 text-[10px] font-mono">{rw.chance}%</span>
                    </div>
                ))}
            </div>

            {/* Other rewards (collapsible) */}
            {otherRewards.length > 0 && (
                <>
                    <button
                        className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors mb-1"
                        onClick={() => setShowAll((x) => !x)}
                    >
                        {showAll ? "Hide other rewards" : `Show ${otherRewards.length} other rewards`}
                    </button>
                    {showAll && (
                        <div className="space-y-0.5 mb-2">
                            {otherRewards.map((rw) => (
                                <div key={rw.itemName} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <RarityBadge rarity={rw.rarity} />
                                    <span>{rw.itemName}</span>
                                    <span className="ml-auto font-mono">{rw.chance}%</span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Mission locations */}
            <div className="border-t border-slate-800 pt-2 mt-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Where to farm</div>
                <MissionList relic={relic} />
            </div>
        </div>
    );
}

// ---- Void Trace Calculator ----

function VoidTraceCalc() {
    const [traces, setTraces] = useState(0);
    const [target, setTarget] = useState<"Exceptional" | "Flawless" | "Radiant">("Radiant");
    const [runs, setRuns] = useState(10);

    const targetLevel = REFINEMENT_COSTS.find((r) => r.label === target)!;
    const cost = targetLevel.traces;
    const canRefine = cost > 0 ? Math.floor(traces / cost) : Infinity;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-lg font-semibold mb-1">Void Trace Budget</div>
                <p className="text-sm text-slate-400 mb-4">
                    Refining relics improves drop rates. Each refinement consumes void traces. See how many refinements you can afford.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Void traces you have</label>
                        <input
                            type="number"
                            min={0}
                            max={3300}
                            value={traces}
                            onChange={(e) => setTraces(Math.max(0, Math.min(3300, parseInt(e.target.value) || 0)))}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-500"
                        />
                        <div className="text-[10px] text-slate-600 mt-1">Max capacity: 3,300 traces</div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Target refinement</label>
                        <div className="flex gap-1.5">
                            {(["Exceptional", "Flawless", "Radiant"] as const).map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setTarget(lvl)}
                                    className={[
                                        "flex-1 rounded-lg px-2 py-2 text-xs border transition-colors",
                                        target === lvl
                                            ? "bg-slate-100 text-slate-900 border-slate-100"
                                            : "bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-900"
                                    ].join(" ")}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/50 p-3">
                    <div className="text-sm text-slate-300">
                        With <span className="text-slate-100 font-semibold">{traces.toLocaleString()} traces</span> you can
                        refine to <span className="text-slate-100 font-semibold">{target}</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                        {cost === 0 ? "∞" : canRefine.toLocaleString()}
                        <span className="text-sm text-slate-400 font-normal ml-2">times</span>
                    </div>
                    {cost > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                            {cost} traces per refinement
                            {canRefine > 0 && ` · ${(canRefine * cost).toLocaleString()} traces used · ${(traces - canRefine * cost).toLocaleString()} remaining`}
                        </div>
                    )}
                </div>
            </div>

            {/* Drop rate comparison table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-lg font-semibold mb-1">Drop Rate Comparison</div>
                <p className="text-sm text-slate-400 mb-4">
                    How refinement improves your odds. Each relic has 3 common, 2 uncommon, and 1 rare slot.
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                                <th className="text-left pb-2 pr-4">Refinement</th>
                                <th className="text-right pb-2 pr-4">Cost</th>
                                <th className="text-right pb-2 pr-4 text-amber-400">Rare</th>
                                <th className="text-right pb-2 pr-4 text-slate-300">Uncommon</th>
                                <th className="text-right pb-2">Common</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {REFINEMENT_COSTS.map((lvl) => (
                                <tr
                                    key={lvl.label}
                                    className={[
                                        "transition-colors",
                                        lvl.label === target ? "bg-slate-800/40" : ""
                                    ].join(" ")}
                                >
                                    <td className="py-2 pr-4 text-slate-200 font-medium">
                                        {lvl.label}
                                        {lvl.label === target && (
                                            <span className="ml-2 text-[10px] text-slate-500">← selected</span>
                                        )}
                                    </td>
                                    <td className="py-2 pr-4 text-right text-slate-400 font-mono">
                                        {lvl.traces === 0 ? "free" : `${lvl.traces} traces`}
                                    </td>
                                    <td className="py-2 pr-4 text-right text-amber-400 font-mono font-semibold">
                                        {lvl.dropRates.Rare}%
                                    </td>
                                    <td className="py-2 pr-4 text-right text-slate-300 font-mono">
                                        {lvl.dropRates.Uncommon}%
                                    </td>
                                    <td className="py-2 text-right text-slate-400 font-mono">
                                        {lvl.dropRates.Common}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <p className="text-[11px] text-slate-600 mt-3">
                    Percentages are per-slot. Each slot is rolled independently. With 4 players each picking a reward, the effective rare chance per run is roughly 4× the per-slot rate when running Radiant relics cooperatively.
                </p>
            </div>

            {/* Runs calculator */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-lg font-semibold mb-1">Runs → Traces Earned</div>
                <p className="text-sm text-slate-400 mb-4">
                    Estimate how many traces you'll earn from cracking relics. Opening a relic rewards traces based on how rare your chosen reward was.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Planned runs</label>
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            value={runs}
                            onChange={(e) => setRuns(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-500"
                        />
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
                        <div className="text-xs text-slate-400">Estimated traces earned</div>
                        <div className="text-xl font-bold mt-0.5">{(runs * 6).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500 mt-1">~6 traces/run average (varies by rarity picked)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---- Main Page ----

export default function Relics() {
    const { goals, completedPrereqs, inventory } = useTrackerStore(
        useShallow((s) => ({
            goals: s.state.goals ?? [],
            completedPrereqs: s.state.prereqs?.completed ?? {},
            inventory: s.state.inventory,
        }))
    );

    const [tab, setTab] = useState<"goals" | "traces">("goals");
    const [tierFilter, setTierFilter] = useState<string>("all");
    const [showVaulted, setShowVaulted] = useState(false);

    // Build farming snapshot for active goals only (no syndicates — syndicate items aren't in relics)
    const farmingItems = useMemo(() => {
        const requirements = buildRequirementsSnapshot({
            syndicates: [],
            goals: goals.filter((g) => g.isActive),
            completedPrereqs,
            inventory,
            expandMode: "direct",
            syndicateScope: "nextOnly",
        });
        const farming = buildFarmingSnapshot({ requirements, completedPrereqs });
        return farming.targeted;
    }, [goals, completedPrereqs, inventory]);

    // Find all relic-sourced items and map to relic catalog entries
    const { scoredRelics, goalItemNames } = useMemo(() => {
        const itemNames = new Set<string>();

        // Build: itemName → catalogId (for remaining count)
        const itemsByCatalogId = new Map<string, { name: string; remaining: number }>();

        for (const line of farmingItems) {
            for (const source of line.sources) {
                const sid = String(source.sourceId);
                if (!sid.startsWith("src:relic/")) continue;
                // This item is relic-farmable — collect its display name
                itemNames.add(line.name);
                itemsByCatalogId.set(String(line.key), { name: line.name, remaining: line.remaining });
                break;
            }
        }

        const scored = scoreRelicsForItems(itemNames);
        return { scoredRelics: scored, goalItemNames: itemNames };
    }, [farmingItems]);

    const filteredRelics = useMemo(() => {
        return scoredRelics.filter((sr) => {
            if (!showVaulted && !sr.relic.isActive) return false;
            if (tierFilter !== "all" && sr.relic.tier.toLowerCase() !== tierFilter) return false;
            return true;
        });
    }, [scoredRelics, showVaulted, tierFilter]);

    const hasActiveGoals = goals.some((g) => g.isActive);
    const hasRelicItems = scoredRelics.length > 0;

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Relic Farming</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Find which relics contain your goal items and plan your void fissure runs.
                </p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1.5">
                {([
                    { key: "goals", label: "Goal Tracker" },
                    { key: "traces", label: "Void Trace Calc" },
                ] as const).map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={[
                            "rounded-full px-4 py-1.5 text-sm border transition-colors",
                            tab === t.key
                                ? "bg-slate-100 text-slate-900 border-slate-100"
                                : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900"
                        ].join(" ")}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Goal Tracker tab */}
            {tab === "goals" && (
                <div className="space-y-4">
                    {!hasActiveGoals ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center">
                            <div className="text-slate-400 text-sm">No active goals set.</div>
                            <div className="text-slate-600 text-xs mt-1">Add goals in the Goals page to see which relics to farm.</div>
                        </div>
                    ) : !hasRelicItems ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center">
                            <div className="text-slate-400 text-sm">No relic-farmable items found in your active goals.</div>
                            <div className="text-slate-600 text-xs mt-1">
                                Your goals may require crafting, trading, or vendor purchases rather than relic cracking.
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Items to find</div>
                                    <div className="mt-0.5 font-mono text-sm text-slate-100">{goalItemNames.size}</div>
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Relevant relics</div>
                                    <div className="mt-0.5 font-mono text-sm text-slate-100">{scoredRelics.length}</div>
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Active relics</div>
                                    <div className="mt-0.5 font-mono text-sm text-slate-100">
                                        {scoredRelics.filter((s) => s.relic.isActive).length}
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-slate-500">Tier:</span>
                                {["all", "lith", "meso", "neo", "axi"].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTierFilter(t)}
                                        className={[
                                            "rounded-full px-3 py-1 text-xs border transition-colors capitalize",
                                            tierFilter === t
                                                ? "bg-slate-100 text-slate-900 border-slate-100"
                                                : "bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-900"
                                        ].join(" ")}
                                    >
                                        {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowVaulted((x) => !x)}
                                    className={[
                                        "rounded-full px-3 py-1 text-xs border transition-colors ml-auto",
                                        showVaulted
                                            ? "bg-red-950/40 text-red-300 border-red-700/50"
                                            : "bg-slate-950/40 text-slate-400 border-slate-700 hover:bg-slate-900"
                                    ].join(" ")}
                                >
                                    {showVaulted ? "Hide vaulted" : "Show vaulted"}
                                </button>
                            </div>

                            {/* Goal items needed */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                                <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Items needed from relics</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {Array.from(goalItemNames).sort().map((name) => (
                                        <span
                                            key={name}
                                            className="text-xs px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900/50 text-slate-300"
                                        >
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Relic cards */}
                            {filteredRelics.length === 0 ? (
                                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-400 text-center">
                                    No relics match the current filter.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-500">
                                        Sorted by relevance — relics containing more of your needed items appear first.
                                        {!showVaulted && scoredRelics.some((s) => !s.relic.isActive) && (
                                            <span className="ml-1">
                                                <button
                                                    className="text-red-400 hover:text-red-300 underline"
                                                    onClick={() => setShowVaulted(true)}
                                                >
                                                    {scoredRelics.filter((s) => !s.relic.isActive).length} vaulted relics hidden
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                    {filteredRelics.map((sr) => (
                                        <RelicCard key={sr.relic.key} scored={sr} goalItems={goalItemNames} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Void Trace Calc tab */}
            {tab === "traces" && <VoidTraceCalc />}
        </div>
    );
}
