// src/components/syndicates/SimarisSynthesisModal.tsx
// Cephalon Simaris synthesis target database — location guide for all synthesis targets.

import { useMemo, useState } from "react";
import { SYNTHESIS_TARGETS, SYNTHESIS_TIPS, type SynthesisTarget } from "../../../external/steam-guide/synthesisTargets";

// ─── Types & helpers ──────────────────────────────────────────────────────────

function normalize(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, "");
}

const FACTION_COLORS: Record<string, string> = {
    Grineer:  "text-red-400 border-red-800/50 bg-red-950/20",
    Corpus:   "text-blue-400 border-blue-800/50 bg-blue-950/20",
    Infested: "text-green-400 border-green-800/50 bg-green-950/20",
    Orokin:   "text-amber-400 border-amber-800/50 bg-amber-950/20",
    Mixed:    "text-purple-400 border-purple-800/50 bg-purple-950/20",
};

const FACTION_FILTERS = ["All", "Grineer", "Corpus", "Infested", "Orokin"] as const;
type FactionFilter = typeof FACTION_FILTERS[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ text, className }: { text: string; className: string }) {
    return (
        <span className={["text-[10px] font-semibold px-1.5 py-0.5 rounded border", className].join(" ")}>
            {text}
        </span>
    );
}

function TargetCard({ target, expanded, onToggle }: {
    target: SynthesisTarget;
    expanded: boolean;
    onToggle: () => void;
}) {
    const factionColor = FACTION_COLORS[target.faction] ?? FACTION_COLORS.Mixed;

    return (
        <div className={[
            "rounded-xl border overflow-hidden transition-colors",
            expanded ? "border-slate-600 bg-slate-900/60" : "border-slate-800 bg-slate-900/30 hover:bg-slate-900/50"
        ].join(" ")}>
            {/* Header row */}
            <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={onToggle}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-100">{target.name}</span>
                        {target.isResearch && (
                            <Badge text="Research" className="text-amber-400 border-amber-700/50 bg-amber-950/20" />
                        )}
                        <Badge
                            text={target.faction}
                            className={factionColor}
                        />
                        <span className="text-[11px] text-slate-600">
                            {target.locations.length} location{target.locations.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
                <svg
                    className={["w-4 h-4 text-slate-500 transition-transform shrink-0", expanded ? "rotate-180" : ""].join(" ")}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-3">
                    {/* Tips */}
                    {target.tips && (
                        <div className="rounded-lg bg-amber-950/20 border border-amber-800/30 px-3 py-2 text-xs text-amber-300">
                            ⚠ {target.tips}
                        </div>
                    )}

                    {/* Research note */}
                    {target.isResearch && (
                        <div className="rounded-lg bg-amber-950/10 border border-amber-800/20 px-3 py-2 text-xs text-amber-400/80">
                            [Research] — Only available as a daily target via Cephalon Simaris. Speak to him in any Relay.
                        </div>
                    )}

                    {/* Endo rewards */}
                    {target.endoRewards && target.endoRewards.length > 0 && (
                        <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1.5">Endo Rewards</div>
                            <div className="flex flex-wrap gap-2">
                                {target.endoRewards.map((r, i) => (
                                    <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-center">
                                        <div className="text-[10px] text-slate-500">{r.qty}x targets</div>
                                        <div className="text-sm font-mono font-semibold text-amber-300">
                                            {typeof r.endo === "number" ? `${r.endo.toLocaleString()} Endo` : "?"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location table */}
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1.5">Locations</div>
                        {target.locations.length === 0 ? (
                            <div className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2 text-xs text-slate-500">
                                No locations are currently listed for this target.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="text-left pb-1.5 pr-3 text-slate-500 font-semibold">Planet</th>
                                            <th className="text-left pb-1.5 pr-3 text-slate-500 font-semibold">Node</th>
                                            <th className="text-left pb-1.5 pr-3 text-slate-500 font-semibold">Type</th>
                                            <th className="text-left pb-1.5 pr-3 text-slate-500 font-semibold">Faction</th>
                                            <th className="text-left pb-1.5 text-slate-500 font-semibold">Level</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {target.locations.map((loc, i) => (
                                            <tr key={i} className={["border-b border-slate-800/50", i % 2 === 0 ? "" : "bg-slate-900/30"].join(" ")}>
                                                <td className="py-1.5 pr-3 font-semibold text-slate-200">{loc.planet}</td>
                                                <td className="py-1.5 pr-3 text-slate-300">{loc.mission}</td>
                                                <td className="py-1.5 pr-3 text-slate-400">{loc.missionType}</td>
                                                <td className="py-1.5 pr-3 text-slate-400">{loc.faction}</td>
                                                <td className="py-1.5 text-slate-400 font-mono">{loc.level}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function SimarisSynthesisModal({ open, onClose }: {
    open: boolean;
    onClose: () => void;
}) {
    const [search, setSearch] = useState("");
    const [faction, setFaction] = useState<FactionFilter>("All");
    const [researchOnly, setResearchOnly] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"targets" | "tips" | "howto">("targets");

    const filtered = useMemo(() => {
        const q = normalize(search);
        return SYNTHESIS_TARGETS.filter(t => {
            if (faction !== "All" && t.faction !== faction) return false;
            if (researchOnly && !t.isResearch) return false;
            if (!q) return true;
            if (normalize(t.name).includes(q)) return true;
            if (normalize(t.faction).includes(q)) return true;
            return t.locations.some(l =>
                normalize(l.planet).includes(q) ||
                normalize(l.mission).includes(q) ||
                normalize(l.missionType).includes(q) ||
                normalize(l.faction).includes(q)
            );
        });
    }, [search, faction, researchOnly]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
                    <div>
                        <div className="text-base font-semibold text-slate-100">Cephalon Simaris — Synthesis Targets</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                            Synthesis target locations by node, faction, and level
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 shrink-0"
                    >
                        Close
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 shrink-0">
                    {(["targets", "tips", "howto"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={[
                                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                                activeTab === tab
                                    ? "border-blue-500 text-blue-300"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                            ].join(" ")}
                        >
                            {tab === "targets" ? `Targets (${SYNTHESIS_TARGETS.length})` : tab === "tips" ? "Warframe Tips" : "How To"}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">

                    {/* ── Targets tab ── */}
                    {activeTab === "targets" && (
                        <div className="p-4 space-y-3">
                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    className="flex-1 min-w-48 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                                    placeholder="Search targets, planets, missions…"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setExpandedId(null); }}
                                    autoFocus
                                />
                                <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                                    {FACTION_FILTERS.map(f => (
                                        <button
                                            key={f}
                                            onClick={() => { setFaction(f); setExpandedId(null); }}
                                            className={[
                                                "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                                                faction === f ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"
                                            ].join(" ")}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => { setResearchOnly(v => !v); setExpandedId(null); }}
                                    className={[
                                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                                        researchOnly
                                            ? "border-amber-600/60 bg-amber-950/30 text-amber-300"
                                            : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
                                    ].join(" ")}
                                >
                                    Research only
                                </button>
                                <span className="text-xs text-slate-600">{filtered.length} shown</span>
                            </div>

                            {/* Target list */}
                            {filtered.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-500">No targets match your search.</div>
                            ) : (
                                <div className="space-y-2">
                                    {filtered.map(t => (
                                        <TargetCard
                                            key={t.name}
                                            target={t}
                                            expanded={expandedId === t.name}
                                            onToggle={() => setExpandedId(expandedId === t.name ? null : t.name)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Warframe Tips tab ── */}
                    {activeTab === "tips" && (
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-slate-400">
                                These Warframe abilities can help slow or immobilize synthesis targets and make them easier to scan.
                            </p>
                            <div className="rounded-xl border border-slate-800 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/60">
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Warframe</th>
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Ability</th>
                                            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Effect</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SYNTHESIS_TIPS.map((tip, i) => (
                                            <tr key={i} className={["border-b border-slate-800/50", i % 2 === 0 ? "" : "bg-slate-900/20"].join(" ")}>
                                                <td className="px-4 py-2 font-semibold text-slate-200">{tip.warframe}</td>
                                                <td className="px-4 py-2 text-blue-300">{tip.ability}</td>
                                                <td className="px-4 py-2 text-slate-400">{tip.effect}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-2 text-sm text-slate-400">
                                <div className="text-slate-200 font-semibold text-xs uppercase tracking-wide mb-2">Kinetic Siphon Traps</div>
                                <p>Can be thrown near a target to suspend it briefly.</p>
                            </div>
                        </div>
                    )}

                    {/* ── How To tab ── */}
                    {activeTab === "howto" && (
                        <div className="p-4 space-y-4 text-sm text-slate-400">
                            <div className="space-y-3">
                                {[
                                    {
                                        n: "1", title: "Get a daily task",
                                        body: "Visit Cephalon Simaris in a Relay and ask for a target. Daily tasks reset at 00:00 GMT."
                                    },
                                    {
                                        n: "2", title: "Equip Synthesis Scanner",
                                        body: "Bring at least one Synthesis Scanner in your gear wheel before starting the mission. Codex Scanners do not count for synthesis."
                                    },
                                    {
                                        n: "3", title: "Use the listed nodes",
                                        body: "Use the listed nodes as your starting point. Invasions can temporarily change a node's faction and block a listed spawn."
                                    },
                                    {
                                        n: "4", title: "Find the target",
                                        body: "When a target is present, Simaris will announce it. Use the Synthesis Scanner, zoom in, and follow the trail until the target is marked."
                                    },
                                    {
                                        n: "5", title: "Scan the target nodes",
                                        body: "Scan each highlighted node until the target dematerializes. Do not kill it before the scan completes."
                                    },
                                    {
                                        n: "6", title: "Collect standing",
                                        body: "Successful synthesis awards Simaris standing, and higher-level targets award more."
                                    },
                                    {
                                        n: "7", title: "Claim reward",
                                        body: "Return to Simaris after finishing the task to claim the daily reward."
                                    },
                                ].map(s => (
                                    <div key={s.n} className="flex gap-3">
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-900/50 border border-blue-700/50 text-blue-300 text-xs font-bold flex items-center justify-center mt-0.5">
                                            {s.n}
                                        </div>
                                        <div>
                                            <div className="text-slate-200 font-semibold mb-0.5">{s.title}</div>
                                            <div className="text-slate-400 text-sm leading-relaxed">{s.body}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-xl border border-blue-800/30 bg-blue-950/20 p-4 text-xs text-blue-300">
                                <div className="font-semibold mb-1">Disputed squad behavior omitted</div>
                                Squad-sharing rules, host-only spawn rules, and exact standing-sharing range are intentionally not hardcoded here because they are easy to misstate and the target dataset in this modal is focused on confirmed node data.
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-xs text-slate-400">
                                <div className="font-semibold text-slate-300 mb-1">Invasion note</div>
                                Invasions can temporarily change mission factions. If a location is occupied by the wrong faction, the listed target will not spawn there until the mission returns to its regular faction.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
