// ===== FILE: src/pages/Requirements.tsx =====
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTrackerStore } from "../store/store";
import { useShallow } from "zustand/react/shallow";
import { setPendingStarChartNodeId, sourceIdToStarChartNodeId } from "../store/starChartNav";

/** Format a raw sourceId into a readable fallback label when no sourceLabel is available. */
function formatRawSourceId(raw: string): string {
    // Strip the "data:" or "src:" prefix and convert slashes/hyphens to spaces
    return raw
        .replace(/^(?:data|src):/, "")
        .replace(/\//g, " › ")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || raw;
}
import {
    buildRequirementsSnapshot,
    buildFarmingSnapshot,
    type RequirementViewMode,
    type RequirementExpandMode
} from "../domain/logic/requirementEngine";
import type { CurrencyRequirementLine } from "../domain/logic/requirementEngine";

function normalize(s: string): string {
    return s.trim().toLowerCase();
}

function Section(props: { title: string; subtitle?: string; children: ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            {props.subtitle && <div className="text-sm text-slate-400 mt-1">{props.subtitle}</div>}
            <div className="mt-4">{props.children}</div>
        </div>
    );
}

function PillButton(props: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            className={[
                "rounded-full px-3 py-1 text-sm border",
                props.active
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900"
            ].join(" ")}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
}

function MiniStat(props: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{props.label}</div>
            <div className="mt-0.5 font-mono text-sm text-slate-100">{props.value}</div>
        </div>
    );
}

const HIDDEN_REASON_LABEL: Record<string, string> = {
    "out-of-scope": "Out of scope",
    "unknown-acquisition": "Unknown acquisition",
    "unknown-recipe-acquisition": "Unknown recipe acquisition",
    "missing-prereqs": "Missing prerequisites",
    "no-accessible-sources": "No accessible sources",
};

// Inline count editor for farming items
function InlineCountEditor(props: {
    catalogId: string;
    have: number;
    totalNeed: number;
}) {
    const setCount = useTrackerStore(s => s.setCount);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");

    function commit() {
        const n = parseInt(draft, 10);
        if (!isNaN(n) && n >= 0) {
            setCount(props.catalogId, n);
        }
        setEditing(false);
    }

    if (editing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    autoFocus
                    type="number"
                    min={0}
                    className="w-20 rounded border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-slate-400"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") commit();
                        if (e.key === "Escape") setEditing(false);
                    }}
                    onBlur={commit}
                />
                <span className="text-[11px] text-slate-500">/ {props.totalNeed.toLocaleString()}</span>
            </div>
        );
    }

    return (
        <button
            className="flex items-center gap-1 group"
            onClick={() => { setDraft(String(props.have)); setEditing(true); }}
            title="Click to update your count"
        >
            <span className="text-[11px] text-slate-400 font-mono group-hover:text-slate-200 transition-colors">
                {props.have.toLocaleString()} / {props.totalNeed.toLocaleString()}
            </span>
            <svg className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
        </button>
    );
}

function CurrencyCostChip(props: { line: CurrencyRequirementLine }) {
    const { line: cl } = props;
    const remaining = cl.remaining ?? cl.totalNeed;
    const isMet = remaining <= 0;
    const isPlatinum = cl.key === "platinum";

    return (
        <div className={[
            "rounded-xl border px-4 py-3 flex items-center gap-3",
            isMet
                ? "border-green-800/40 bg-green-950/20"
                : isPlatinum
                    ? "border-indigo-800/40 bg-indigo-950/20"
                    : "border-yellow-800/40 bg-yellow-950/10"
        ].join(" ")}>
            <div className="text-2xl">{isPlatinum ? "◈" : "🪙"}</div>
            <div>
                <div className="text-sm font-semibold text-slate-100">{cl.name}</div>
                <div className={["text-xs font-mono", isMet ? "text-green-400" : "text-slate-300"].join(" ")}>
                    {isMet
                        ? `✓ ${cl.totalNeed.toLocaleString()} (covered)`
                        : `Need ${cl.totalNeed.toLocaleString()}${cl.have > 0 ? ` · Have ${cl.have.toLocaleString()} · Still need ${remaining.toLocaleString()}` : ""}`}
                </div>
                {cl.sources.length > 0 && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                        {cl.sources.slice(0, 3).map(s => s.name).join(", ")}
                        {cl.sources.length > 3 && ` +${cl.sources.length - 3} more`}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Requirements() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    const { syndicates, goals, completedPrereqs, inventory } = useTrackerStore(
        useShallow((s) => ({
            syndicates: s.state.syndicates ?? [],
            goals: s.state.goals ?? [],
            completedPrereqs: s.state.prereqs?.completed ?? {},
            inventory: s.state.inventory,
        }))
    );

    const [mode, setMode] = useState<RequirementViewMode>("targeted");
    const [expandMode, setExpandMode] = useState<RequirementExpandMode>("direct");
    const [query, setQuery] = useState("");
    const [showHidden, setShowHidden] = useState(false);
    // "farming" = default farming view (platinum excluded from overlap/targeted display)
    // "platinum" = platinum cost summary view
    const [platView, setPlatView] = useState<"farming" | "platinum">("farming");

    const requirements = useMemo(() => {
        return buildRequirementsSnapshot({
            syndicates,
            goals,
            completedPrereqs,
            inventory,
            expandMode,
            // Farming page always shows all remaining rank requirements so players can
            // plan their full farming runs, not just the immediate next rank.
            syndicateScope: "allRemaining"
        });
    }, [syndicates, goals, completedPrereqs, inventory, expandMode]);

    const farming = useMemo(() => {
        return buildFarmingSnapshot({
            requirements,
            completedPrereqs
        });
    }, [requirements, completedPrereqs]);

    // Build a lookup map from requirements so targeted cards can show have/totalNeed.
    const reqLineByKey = useMemo(() => {
        const m = new Map<string, { have: number; totalNeed: number; catalogId?: string }>();
        for (const l of requirements.itemLines) {
            m.set(String(l.key), { have: l.have, totalNeed: l.totalNeed, catalogId: String(l.key) });
        }
        return m;
    }, [requirements.itemLines]);

    const filteredTargeted = useMemo(() => {
        const q = normalize(query);
        if (!q) return farming.targeted;

        return farming.targeted.filter((l) => {
            if (normalize(l.name).includes(q)) return true;
            if (normalize(String(l.key)).includes(q)) return true;

            return (l.sources ?? []).some(
                (s) => normalize(s.sourceLabel).includes(q) || normalize(String(s.sourceId)).includes(q)
            );
        });
    }, [farming.targeted, query]);

    const filteredOverlap = useMemo(() => {
        const q = normalize(query);
        if (!q) return farming.overlap;

        return farming.overlap.filter((g) => {
            if (normalize(g.sourceLabel).includes(q)) return true;
            if (normalize(String(g.sourceId)).includes(q)) return true;

            return (g.items ?? []).some((it) => normalize(it.name).includes(q) || normalize(String(it.key)).includes(q));
        });
    }, [farming.overlap, query]);

    const filteredHidden = useMemo(() => {
        if (!showHidden) return [];
        const q = normalize(query);
        if (!q) return farming.hidden;

        return farming.hidden.filter((h) => {
            if (normalize(h.name).includes(q)) return true;
            if (normalize(String(h.key)).includes(q)) return true;
            return normalize(h.reason).includes(q);
        });
    }, [farming.hidden, query, showHidden]);

    return (
        <div className="space-y-6">
            <Section
                title="Farming"
                subtitle="Targeted shows actionable sources for each needed item. Overlap groups items by a shared acquisition source."
            >
                {/* Mode + expand toggles */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <PillButton
                            label="Targeted Farming"
                            active={mode === "targeted"}
                            onClick={() => setMode("targeted")}
                        />
                        <PillButton
                            label="Overlap Farming"
                            active={mode === "overlap"}
                            onClick={() => setMode("overlap")}
                        />

                        <div className="w-px h-7 bg-slate-800 mx-1" />

                        <PillButton
                            label="Top-level only"
                            active={expandMode === "direct"}
                            onClick={() => setExpandMode("direct")}
                        />
                        <PillButton
                            label="Expand crafted deps"
                            active={expandMode === "recursive"}
                            onClick={() => setExpandMode("recursive")}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => setActivePage("goals")}
                        >
                            Open Goals
                        </button>
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => setActivePage("inventory")}
                        >
                            Open Inventory
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <MiniStat label="Items needed" value={requirements.stats.actionableItemCount.toLocaleString()} />
                    <MiniStat
                        label="Targeted sources"
                        value={farming.targeted.length.toLocaleString()}
                    />
                    <MiniStat
                        label="Overlap sources"
                        value={farming.overlap.length.toLocaleString()}
                    />
                    <MiniStat
                        label="Hidden items"
                        value={farming.hidden.length.toLocaleString()}
                    />
                </div>

                {/* Credit costs — always shown when non-zero (not platinum) */}
                {requirements.currencyLines.some(cl => cl.key === "credits" && cl.totalNeed > 0) && (
                    <div className="mt-4 space-y-2">
                        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Credit costs (rank-ups)</div>
                        <div className="flex flex-wrap gap-3">
                            {requirements.currencyLines
                                .filter(cl => cl.key === "credits")
                                .map(cl => <CurrencyCostChip key={cl.key} line={cl} />)}
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="mt-4">
                    <input
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search items or sources…"
                    />
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <PillButton
                        label={showHidden ? "Hide hidden items" : `Show hidden items (${farming.hidden.length})`}
                        active={showHidden}
                        onClick={() => setShowHidden(v => !v)}
                    />
                    <PillButton
                        label="Farming View"
                        active={platView === "farming"}
                        onClick={() => setPlatView("farming")}
                    />
                    <PillButton
                        label={`Platinum View${requirements.currencyLines.some(cl => cl.key === "platinum" && cl.totalNeed > 0) ? ` (${(requirements.currencyLines.find(cl => cl.key === "platinum")?.remaining ?? 0).toLocaleString()} ◈ needed)` : ""}`}
                        active={platView === "platinum"}
                        onClick={() => setPlatView("platinum")}
                    />
                </div>
            </Section>

            {/* Platinum view */}
            {platView === "platinum" && (
                <Section
                    title="Platinum Cost Summary"
                    subtitle="Platinum purchase price for each goal item (from the in-game Market), plus any syndicate rank-up platinum costs."
                >
                    {requirements.currencyLines.filter(cl => cl.key === "platinum" && cl.totalNeed > 0).length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No platinum costs found. Add warframes, weapons, or other purchasable items as goals to see their market prices here.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requirements.currencyLines
                                .filter(cl => cl.key === "platinum")
                                .map(cl => {
                                    const remaining = cl.remaining ?? cl.totalNeed;
                                    const isMet = remaining <= 0;
                                    return (
                                        <div key={cl.key}>
                                            <div className={[
                                                "rounded-xl border px-4 py-3 flex items-center gap-4 mb-3",
                                                isMet ? "border-green-800/40 bg-green-950/20" : "border-indigo-800/40 bg-indigo-950/20"
                                            ].join(" ")}>
                                                <div className="text-3xl">◈</div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-slate-100">Total Platinum</div>
                                                    <div className={["text-sm font-mono font-semibold", isMet ? "text-green-400" : "text-indigo-300"].join(" ")}>
                                                        {isMet
                                                            ? `✓ Covered (have ${cl.have.toLocaleString()} ◈)`
                                                            : `${remaining.toLocaleString()} ◈ still needed`}
                                                    </div>
                                                    {!isMet && cl.have > 0 && (
                                                        <div className="text-xs text-slate-400 mt-0.5">
                                                            Have {cl.have.toLocaleString()} ◈ · Total required {cl.totalNeed.toLocaleString()} ◈
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Per-source breakdown */}
                                            {cl.sources.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold px-1">Breakdown by item / rank-up</div>
                                                    {cl.sources.map((s, i) => (
                                                        <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 flex items-center justify-between gap-2">
                                                            <div className="text-xs text-slate-300 min-w-0">
                                                                <span className="font-semibold">{s.name}</span>
                                                                {s.label && <span className="text-slate-500"> · {s.label}</span>}
                                                            </div>
                                                            <div className="text-xs font-mono text-indigo-300 shrink-0">{s.need.toLocaleString()} ◈</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </Section>
            )}

            {/* Hidden items */}
            {showHidden && (
                <Section title="Hidden Items" subtitle="Items excluded from farming view">
                    {filteredHidden.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No hidden items match the search.
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {filteredHidden.map((h) => (
                                <div key={String(h.key)} className="rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold break-words">{h.name}</div>
                                        {(h as any).blockedByRecipeComponents?.length > 0 && (
                                            <div className="text-[11px] text-slate-500 mt-0.5 break-words">
                                                Blocked components: {((h as any).blockedByRecipeComponents as string[]).join(", ")}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-slate-400">Need {h.remaining.toLocaleString()}</span>
                                        <span className="text-[10px] rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-400 font-mono">
                                            {HIDDEN_REASON_LABEL[h.reason] ?? h.reason}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            )}

            {/* Targeted farming */}
            {platView === "farming" && mode === "targeted" && (
                <Section
                    title="Targeted Farming"
                    subtitle={`${filteredTargeted.length.toLocaleString()} item${filteredTargeted.length !== 1 ? "s" : ""} with known acquisition sources`}
                >
                    {filteredTargeted.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            {query ? "No items match the search." : "No actionable items. Add goals or syndicate rank-ups to get started."}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredTargeted.map((l) => {
                                const detail = reqLineByKey.get(String(l.key));
                                const have = detail?.have ?? 0;
                                const totalNeed = detail?.totalNeed ?? l.remaining;
                                const pct = totalNeed > 0 ? Math.min(100, Math.round((have / totalNeed) * 100)) : 0;
                                const catalogId = String(l.key);

                                return (
                                    <div key={String(l.key)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold break-words">{l.name}</div>

                                                {/* Progress bar */}
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-sky-500 transition-all"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <InlineCountEditor
                                                        catalogId={catalogId}
                                                        have={have}
                                                        totalNeed={totalNeed}
                                                    />
                                                </div>

                                                {/* Sources */}
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {(l.sources ?? []).map((s) => {
                                                        const nodeId = sourceIdToStarChartNodeId(String(s.sourceId));
                                                        if (nodeId) {
                                                            return (
                                                                <button
                                                                    key={String(s.sourceId)}
                                                                    className="text-[10px] rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-slate-300 hover:border-cyan-700 hover:text-cyan-300 hover:bg-cyan-950/30 transition-colors cursor-pointer"
                                                                    title="Open in Star Chart"
                                                                    onClick={() => {
                                                                        setPendingStarChartNodeId(nodeId);
                                                                        setActivePage("starchart");
                                                                    }}
                                                                >
                                                                    {s.sourceLabel || formatRawSourceId(String(s.sourceId))} ↗
                                                                </button>
                                                            );
                                                        }
                                                        return (
                                                            <span
                                                                key={String(s.sourceId)}
                                                                className="text-[10px] rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-slate-300"
                                                            >
                                                                {s.sourceLabel || formatRawSourceId(String(s.sourceId))}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <div className="text-xs font-mono text-slate-100 font-semibold">
                                                    {l.remaining.toLocaleString()} remaining
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Section>
            )}

            {/* Overlap farming */}
            {platView === "farming" && mode === "overlap" && (
                <Section
                    title="Overlap Farming"
                    subtitle={`${filteredOverlap.length.toLocaleString()} source${filteredOverlap.length !== 1 ? "s" : ""} covering 2+ needed items`}
                >
                    {filteredOverlap.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            {query ? "No sources match the search." : "No overlap sources found."}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredOverlap.map((g) => (
                                <div key={g.sourceId} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="text-sm font-semibold">{g.sourceLabel}</div>
                                        <div className="shrink-0 text-right">
                                            <div className="text-xs font-mono text-slate-400">
                                                {g.itemCount} item{g.itemCount !== 1 ? "s" : ""}
                                            </div>
                                            <div className="text-xs font-mono text-slate-300 font-semibold">
                                                {g.totalRemaining.toLocaleString()} total remaining
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                        {(g.items ?? []).map((it) => {
                                            const detail = reqLineByKey.get(String(it.key));
                                            const have = detail?.have ?? 0;
                                            const totalNeed = detail?.totalNeed ?? it.remaining;

                                            return (
                                                <div
                                                    key={String(it.key)}
                                                    className="rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 py-1.5 flex items-center justify-between gap-2"
                                                >
                                                    <div className="text-xs text-slate-200 truncate">{it.name}</div>
                                                    <InlineCountEditor
                                                        catalogId={String(it.key)}
                                                        have={have}
                                                        totalNeed={totalNeed}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            )}
        </div>
    );
}
