// ===== FILE: src/pages/Requirements.tsx =====
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTrackerStore } from "../store/store";
import {
    buildRequirementsSnapshot,
    buildFarmingSnapshot,
    type RequirementViewMode,
    type RequirementExpandMode
} from "../domain/logic/requirementEngine";

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

function downloadJson(filename: string, obj: unknown) {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

function snapshotStamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
        [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("") +
        "-" +
        [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join("")
    );
}

const HIDDEN_REASON_LABEL: Record<string, string> = {
    "out-of-scope": "Out of scope",
    "unknown-acquisition": "Unknown acquisition",
    "unknown-recipe-acquisition": "Unknown recipe acquisition",
    "missing-prereqs": "Missing prerequisites",
    "no-accessible-sources": "No accessible sources",
};

export default function Requirements() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const goals = useTrackerStore((s) => s.state.goals ?? []);
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const inventory = useTrackerStore((s) => s.state.inventory);

    const [mode, setMode] = useState<RequirementViewMode>("targeted");
    const [expandMode, setExpandMode] = useState<RequirementExpandMode>("direct");
    const [query, setQuery] = useState("");
    const [showHidden, setShowHidden] = useState(false);

    const requirements = useMemo(() => {
        return buildRequirementsSnapshot({
            syndicates,
            goals,
            completedPrereqs,
            inventory,
            expandMode
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
        const m = new Map<string, { have: number; totalNeed: number }>();
        for (const l of requirements.itemLines) {
            m.set(String(l.key), { have: l.have, totalNeed: l.totalNeed });
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

                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => {
                                const stamp = snapshotStamp();
                                downloadJson(`requirements-snapshot-${stamp}.json`, requirements);
                            }}
                        >
                            Export Requirements JSON
                        </button>

                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => {
                                const stamp = snapshotStamp();
                                downloadJson(`farming-snapshot-${stamp}.json`, farming);
                            }}
                        >
                            Export Farming JSON
                        </button>

                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => {
                                const stamp = snapshotStamp();
                                downloadJson(`planner-snapshots-${stamp}.json`, { requirements, farming });
                            }}
                        >
                            Export Combined JSON
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-7 gap-3">
                    <MiniStat label="Items (req snapshot)" value={requirements.stats.actionableItemCount.toLocaleString()} />
                    <MiniStat
                        label="Actionable (known + accessible)"
                        value={farming.stats.actionableItemsWithKnownAcquisition.toLocaleString()}
                    />
                    <MiniStat
                        label="Hidden (unknown acquisition)"
                        value={farming.stats.hiddenForUnknownAcquisition.toLocaleString()}
                    />
                    <MiniStat
                        label="Hidden (missing prereqs)"
                        value={farming.stats.hiddenForMissingPrereqs.toLocaleString()}
                    />
                    <MiniStat
                        label="Hidden (no accessible sources)"
                        value={farming.stats.hiddenForNoAccessibleSources.toLocaleString()}
                    />
                    <MiniStat label="Overlap sources" value={farming.stats.overlapSourceCount.toLocaleString()} />
                    <MiniStat
                        label="Remaining currency"
                        value={[
                            `Credits ${requirements.stats.totalRemainingCredits.toLocaleString()}`,
                            `Plat ${requirements.stats.totalRemainingPlatinum.toLocaleString()}`
                        ].join(" · ")}
                    />
                </div>

                {/* Search + hidden toggle */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input
                        type="search"
                        placeholder="Search by item or source…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 min-w-[200px] rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                    />
                    <button
                        onClick={() => setShowHidden((v) => !v)}
                        className={[
                            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
                            showHidden
                                ? "border-slate-500 bg-slate-700 text-slate-100"
                                : "border-slate-700 bg-slate-950/20 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                        ].join(" ")}
                    >
                        {showHidden ? "Hide hidden items" : `Show hidden (${farming.hidden.length})`}
                    </button>
                </div>
            </Section>

            {/* Hidden items */}
            {showHidden && farming.hidden.length > 0 && (
                <Section
                    title="Hidden Items"
                    subtitle={`${farming.hidden.length} items not shown in farming lists${query ? ` · filtered to ${filteredHidden.length}` : ""}`}
                >
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
            {mode === "targeted" && (
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
                                                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                                                        {have.toLocaleString()} / {totalNeed.toLocaleString()}
                                                    </span>
                                                </div>

                                                {/* Sources */}
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {(l.sources ?? []).map((s) => (
                                                        <span
                                                            key={String(s.sourceId)}
                                                            className="text-[10px] rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-slate-300"
                                                        >
                                                            {s.sourceLabel || String(s.sourceId)}
                                                        </span>
                                                    ))}
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
            {mode === "overlap" && (
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
                                                    <div className="text-[11px] font-mono text-slate-400 shrink-0">
                                                        {have.toLocaleString()}/{totalNeed.toLocaleString()}
                                                    </div>
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
