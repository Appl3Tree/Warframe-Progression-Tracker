import { useMemo, useState } from "react";
import { PREREQ_REGISTRY } from "../catalog/prereqs/prereqRegistry";
import { computePrereqStatuses, buildPrereqIndex } from "../domain/logic/prereqEngine";
import { computeUnlockGraphSnapshot } from "../domain/logic/unlockGraph";
import { deriveCompletedMap, isValidatedBySyndicate } from "../domain/logic/syndicatePrereqs";
import { useTrackerStore } from "../store/store";

type StatusFilter = "all" | "incomplete" | "complete";

// ── Chevron icon ──────────────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
    return (
        <svg
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${open ? "rotate-90" : ""}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="6 3 11 8 6 13" />
        </svg>
    );
}

// ── Thin progress bar ─────────────────────────────────────────────────────────
function ProgressBar({ done, total, className = "" }: { done: number; total: number; className?: string }) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
        <div className={`h-1.5 rounded-full bg-slate-800 overflow-hidden ${className}`}>
            <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Prerequisites() {
    const completedMap       = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const setPrereqCompleted = useTrackerStore((s) => s.setPrereqCompleted);
    const syndicates         = useTrackerStore((s) => s.state.syndicates ?? []);

    const [search, setSearch]             = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [collapsed, setCollapsed]       = useState<Record<string, boolean>>({});

    const mergedMap = useMemo(
        () => deriveCompletedMap(completedMap, syndicates),
        [completedMap, syndicates],
    );

    const index    = useMemo(() => buildPrereqIndex(PREREQ_REGISTRY), []);
    const statuses = useMemo(() => computePrereqStatuses(PREREQ_REGISTRY, mergedMap), [mergedMap]);
    const snap     = useMemo(() => computeUnlockGraphSnapshot(mergedMap, PREREQ_REGISTRY), [mergedMap]);

    const statusById = useMemo(() => {
        const map: Record<string, { completed: boolean; isUnlocked: boolean; missingPrereqs: string[] }> = {};
        for (const s of statuses) map[s.id] = s;
        return map;
    }, [statuses]);

    // Overall totals (always full registry, ignoring search/status filters)
    const totals = useMemo(() => {
        const total = PREREQ_REGISTRY.length;
        const done  = PREREQ_REGISTRY.filter((d) => mergedMap[d.id] === true).length;
        return { total, done };
    }, [mergedMap]);

    // Per-category totals (full registry)
    const categoryTotals = useMemo(() => {
        const result: Record<string, { total: number; done: number }> = {};
        for (const d of PREREQ_REGISTRY) {
            if (!result[d.category]) result[d.category] = { total: 0, done: 0 };
            result[d.category].total++;
            if (mergedMap[d.id]) result[d.category].done++;
        }
        return result;
    }, [mergedMap]);

    // Filtered + grouped items for rendering
    const grouped = useMemo(() => {
        const f = search.trim().toLowerCase();

        const items = PREREQ_REGISTRY.filter((d) => {
            if (f) {
                const hay = `${d.label} ${d.description} ${d.category} ${d.id}`.toLowerCase();
                if (!hay.includes(f)) return false;
            }
            if (statusFilter === "complete")   return mergedMap[d.id] === true;
            if (statusFilter === "incomplete") return mergedMap[d.id] !== true;
            return true;
        });

        const groups: Record<string, typeof items> = {};
        for (const d of items) {
            if (!groups[d.category]) groups[d.category] = [];
            groups[d.category].push(d);
        }

        const rankOf = (id: string) => {
            const v = snap.rankById?.[id];
            return Number.isFinite(v) ? (v as number) : 1_000_000;
        };

        for (const k of Object.keys(groups)) {
            groups[k].sort((a, b) => {
                const diff = rankOf(a.id) - rankOf(b.id);
                return diff !== 0 ? diff : a.label.localeCompare(b.label);
            });
        }

        return groups;
    }, [search, statusFilter, snap.rankById, mergedMap]);

    function labelFor(id: string) {
        return index[id]?.label ?? id;
    }

    function toggleCollapse(cat: string) {
        setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
    }

    const categories = Object.keys(grouped);

    return (
        <div className="flex flex-col gap-4">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold">Prerequisites</div>
                        <div className="text-sm text-slate-400 mt-1">
                            Syndicate rank prerequisites are tracked automatically from the Syndicates page.
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-slate-200">{totals.done}/{totals.total}</div>
                        <div className="text-xs text-slate-500">completed</div>
                    </div>
                </div>

                <ProgressBar done={totals.done} total={totals.total} className="mt-3" />

                {/* Search + status filter */}
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search prerequisites…"
                    />
                    <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1 shrink-0">
                        {(["all", "incomplete", "complete"] as StatusFilter[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={[
                                    "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                                    statusFilter === s
                                        ? "bg-slate-700 text-slate-100"
                                        : "text-slate-400 hover:text-slate-200",
                                ].join(" ")}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Empty state ─────────────────────────────────────────────────── */}
            {categories.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-400 text-center">
                    No prerequisites match your filter.
                </div>
            )}

            {/* ── Category sections ───────────────────────────────────────────── */}
            {categories.map((category) => {
                const defs   = grouped[category];
                const cats   = categoryTotals[category] ?? { total: 0, done: 0 };
                const isOpen = !(collapsed[category] ?? false);
                const allDone = cats.done === cats.total;

                return (
                    <div key={category} className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">

                        {/* Category header — clickable */}
                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-900/50 transition-colors"
                            onClick={() => toggleCollapse(category)}
                        >
                            <Chevron open={isOpen} />

                            <span className={`font-semibold flex-1 ${allDone ? "text-emerald-400" : ""}`}>
                                {category}
                            </span>

                            <span className="text-xs text-slate-400 shrink-0">{cats.done}/{cats.total}</span>

                            <ProgressBar done={cats.done} total={cats.total} className="w-20 shrink-0" />
                        </button>

                        {/* Item list */}
                        {isOpen && (
                            <div className="px-4 pb-3 flex flex-col gap-1.5">
                                {defs.map((d) => {
                                    const st          = statusById[d.id] ?? { completed: false, isUnlocked: false, missingPrereqs: [] };
                                    const locked      = !st.isUnlocked;
                                    const autoTracked = isValidatedBySyndicate(d.id);

                                    return (
                                        <div
                                            key={d.id}
                                            className={[
                                                "rounded-xl border px-3 py-2",
                                                st.completed
                                                    ? "border-emerald-900/40 bg-emerald-950/10"
                                                    : "border-slate-800 bg-slate-950/30",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Checkbox / auto-tracked indicator */}
                                                <div className="shrink-0 mt-0.5">
                                                    {autoTracked ? (
                                                        <div
                                                            title="Tracked automatically via Syndicates"
                                                            className={[
                                                                "w-4 h-4 rounded border flex items-center justify-center",
                                                                st.completed
                                                                    ? "border-sky-700 bg-sky-950"
                                                                    : "border-slate-600 bg-slate-800",
                                                            ].join(" ")}
                                                        >
                                                            {st.completed && (
                                                                <span className="text-[8px] leading-none text-sky-400">✓</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            checked={st.completed}
                                                            onChange={(e) => setPrereqCompleted(d.id, e.target.checked)}
                                                            className="w-4 h-4 accent-emerald-500"
                                                        />
                                                    )}
                                                </div>

                                                {/* Label + badges + description */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className={[
                                                            "text-sm font-medium leading-snug",
                                                            st.completed
                                                                ? "text-slate-400 line-through decoration-slate-600"
                                                                : "text-slate-100",
                                                        ].join(" ")}>
                                                            {d.label}
                                                        </span>

                                                        {d.partOf && (
                                                            <span className="text-[10px] rounded-full border border-sky-800/60 bg-sky-950/40 px-1.5 py-0.5 text-sky-300 leading-tight">
                                                                Ch.{d.chapterIndex} · {d.partOf}
                                                            </span>
                                                        )}

                                                        {autoTracked && !st.completed && (
                                                            <span className="text-[10px] text-sky-500">auto</span>
                                                        )}

                                                        {locked && !st.completed && (
                                                            <span className="text-[10px] text-amber-400/80">locked</span>
                                                        )}
                                                    </div>

                                                    {d.description && (
                                                        <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                                                            {d.description}
                                                        </div>
                                                    )}

                                                    {/* Missing prereqs — compact inline */}
                                                    {locked && !st.completed && st.missingPrereqs.length > 0 && (
                                                        <div className="mt-1 text-[11px] text-amber-500/70">
                                                            Needs: {st.missingPrereqs.map((m) => labelFor(m)).join(", ")}
                                                        </div>
                                                    )}

                                                    {/* Inconsistency warning */}
                                                    {st.completed && locked && (
                                                        <div className="mt-1 text-[11px] text-red-400/70">
                                                            Marked complete but prerequisites unmet — may be from an import.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
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
