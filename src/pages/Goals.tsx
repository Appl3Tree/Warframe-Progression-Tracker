// Goals page — shell component.
// Heavy rendering lives in ./goals/ subdirectory:
//   goalsUtils.ts       — constants, cache, pure helpers
//   GoalsTreeView.tsx   — ZoomableTreeViewport + TreeNode + TreeStyles
//   GoalCard.tsx        — individual goal expansion card
//   GoalsModal.tsx      — full-screen overlay tree modal

import React, { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import { buildRequirementsSnapshot } from "../domain/logic/requirementEngine";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";
import { EMPTY_OBJ, EMPTY_ARR, type GoalRow, type GoalsTab, safeInt } from "./goals/goalsUtils";
import { GoalCard } from "./goals/GoalCard";
import { TreeStyles } from "./goals/GoalsTreeView";

function Section(props: { title: string; subtitle?: string; children: React.ReactNode }) {
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

export default function Goals() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    const goals = useTrackerStore((s) => (Array.isArray((s.state as any).goals) ? (s.state as any).goals : EMPTY_ARR));
    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs?.completed ?? EMPTY_OBJ);
    const inventory = useTrackerStore((s) => s.state.inventory);

    const [tab, setTab] = useState<GoalsTab>("personal");

    // Personal goals filter / sort state
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [filterDone, setFilterDone] = useState<"all" | "remaining" | "done">("all");
    const [sortBy, setSortBy] = useState<"default" | "nameAZ" | "nameZA" | "mostRemaining" | "leastRemaining" | "mostProgress" | "leastProgress">("default");

    // Requirements-only snapshot — only computed when the tab needs it
    const needsRequirements = tab === "requirements" || tab === "total";
    const requirementsOnly = useMemo(() => {
        if (!needsRequirements) return { itemLines: [] as any[] };
        return buildRequirementsSnapshot({
            syndicates,
            goals: [],
            completedPrereqs,
            inventory
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needsRequirements, syndicates, completedPrereqs, inventory]);

    // Sorted + filtered goal IDs — GoalCard fetches its own data from the store
    const { sortedGoalIds, totalGoalCount } = useMemo(() => {
        if (!Array.isArray(goals)) return { sortedGoalIds: [] as string[], totalGoalCount: 0 };

        const raw = (goals as any[])
            .filter((g) => g && g.type === "item")
            .map((g) => {
                const cid = String(g.catalogId) as CatalogId;
                const name = FULL_CATALOG.recordsById[cid]?.displayName ?? cid;
                const qty = Math.max(1, safeInt(g.qty ?? 1, 1));
                const have = safeInt(inventory?.counts?.[cid] ?? 0, 0);
                const remaining = Math.max(0, qty - have);
                return { id: String(g.id), isActive: g.isActive !== false, remaining, have, qty, name };
            });

        const totalGoalCount = raw.length;

        const searchLower = search.trim().toLowerCase();
        let filtered = raw;
        if (searchLower) filtered = filtered.filter((x) => x.name.toLowerCase().includes(searchLower));
        if (filterStatus !== "all") filtered = filtered.filter((x) => x.isActive === (filterStatus === "active"));
        if (filterDone !== "all") filtered = filtered.filter((x) => filterDone === "done" ? x.remaining === 0 : x.remaining > 0);

        filtered.sort((a, b) => {
            switch (sortBy) {
                case "nameAZ": return a.name.localeCompare(b.name);
                case "nameZA": return b.name.localeCompare(a.name);
                case "mostRemaining": return b.remaining - a.remaining || a.name.localeCompare(b.name);
                case "leastRemaining": return a.remaining - b.remaining || a.name.localeCompare(b.name);
                case "mostProgress": {
                    const pa = a.qty > 0 ? a.have / a.qty : 1;
                    const pb = b.qty > 0 ? b.have / b.qty : 1;
                    return pb - pa || a.name.localeCompare(b.name);
                }
                case "leastProgress": {
                    const pa = a.qty > 0 ? a.have / a.qty : 1;
                    const pb = b.qty > 0 ? b.have / b.qty : 1;
                    return pa - pb || a.name.localeCompare(b.name);
                }
                default:
                    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
                    if (a.remaining !== b.remaining) return b.remaining - a.remaining;
                    return a.name.localeCompare(b.name);
            }
        });

        return { sortedGoalIds: filtered.map((x) => x.id), totalGoalCount };
    }, [goals, inventory, search, filterStatus, filterDone, sortBy]);

    // Requirements goals lines (actionable items; remaining > 0 already filtered by engine)
    const requirementsLines = useMemo(() => {
        const base = requirementsOnly.itemLines.slice();
        base.sort((a, b) => {
            if (a.remaining !== b.remaining) return b.remaining - a.remaining;
            return a.name.localeCompare(b.name);
        });
        return base;
    }, [requirementsOnly.itemLines]);

    // Total / compiled goals
    const totalLines = useMemo<GoalRow[]>(() => {
        const map: Record<string, { catalogId: CatalogId; name: string; personalNeed: number; requirementsNeed: number }> = {};

        for (const g of goals ?? []) {
            if (!g || g.isActive === false) continue;
            if (g.type !== "item") continue;

            const cid = String(g.catalogId) as CatalogId;
            const qty = Math.max(1, safeInt(g.qty ?? 1, 1));

            const rec = FULL_CATALOG.recordsById[cid];
            const name = rec?.displayName ?? cid;

            if (!map[cid]) {
                map[cid] = { catalogId: cid, name, personalNeed: 0, requirementsNeed: 0 };
            }
            map[cid].personalNeed += qty;
        }

        for (const l of requirementsOnly.itemLines ?? []) {
            const cid = l.key;
            if (!map[cid]) {
                map[cid] = { catalogId: cid, name: l.name, personalNeed: 0, requirementsNeed: 0 };
            }
            map[cid].requirementsNeed += safeInt(l.totalNeed ?? 0, 0);
        }

        const out: GoalRow[] = Object.values(map).map((x) => {
            const have = safeInt(inventory?.counts?.[String(x.catalogId)] ?? 0, 0);
            const totalNeed = x.personalNeed + x.requirementsNeed;
            const remaining = Math.max(0, totalNeed - have);

            return {
                catalogId: x.catalogId,
                name: x.name,
                personalNeed: x.personalNeed,
                requirementsNeed: x.requirementsNeed,
                totalNeed,
                have,
                remaining
            };
        });

        const filtered = out.filter((r) => r.totalNeed > 0);

        filtered.sort((a, b) => {
            if (a.remaining !== b.remaining) return b.remaining - a.remaining;
            return a.name.localeCompare(b.name);
        });

        return filtered;
    }, [goals, requirementsOnly.itemLines, inventory]);

    return (
        <div className="space-y-6">
            <TreeStyles />

            <Section
                title="Goals"
                subtitle="Track items you're farming and see what your next syndicate rank-ups require. Add personal goals from the Inventory page."
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <PillButton label="Personal Goals" active={tab === "personal"} onClick={() => setTab("personal")} />
                        <PillButton label="Requirements Goals" active={tab === "requirements"} onClick={() => setTab("requirements")} />
                        <PillButton label="Total Goals" active={tab === "total"} onClick={() => setTab("total")} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => setActivePage("inventory")}
                        >
                            Open Inventory (manage Personal Goals)
                        </button>

                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => setActivePage("requirements")}
                        >
                            Open Farming
                        </button>
                    </div>
                </div>
            </Section>

            {tab === "personal" && (
                <Section
                    title="Personal Goals"
                    subtitle={
                        search.trim() || filterStatus !== "all" || filterDone !== "all"
                            ? `Showing ${sortedGoalIds.length.toLocaleString()} of ${totalGoalCount.toLocaleString()} goals`
                            : `${totalGoalCount.toLocaleString()} goals (includes inactive)`
                    }
                >
                    {/* Search + filter + sort bar */}
                    <div className="mb-3 flex flex-wrap gap-2">
                        <input
                            type="search"
                            placeholder="Search by name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 min-w-[160px] rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                        />

                        {/* Active filter */}
                        <div className="flex items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
                            {(["all", "active", "inactive"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={[
                                        "rounded-md px-2.5 py-1 text-xs transition-colors",
                                        filterStatus === s
                                            ? "bg-slate-200 text-slate-900 font-semibold"
                                            : "text-slate-400 hover:text-slate-200"
                                    ].join(" ")}
                                >
                                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Done filter */}
                        <div className="flex items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
                            {(["all", "remaining", "done"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterDone(s)}
                                    className={[
                                        "rounded-md px-2.5 py-1 text-xs transition-colors",
                                        filterDone === s
                                            ? "bg-slate-200 text-slate-900 font-semibold"
                                            : "text-slate-400 hover:text-slate-200"
                                    ].join(" ")}
                                >
                                    {s === "all" ? "All" : s === "remaining" ? "In Progress" : "Done"}
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200"
                        >
                            <option value="default">Active first</option>
                            <option value="nameAZ">Name A → Z</option>
                            <option value="nameZA">Name Z → A</option>
                            <option value="mostRemaining">Most remaining</option>
                            <option value="leastRemaining">Least remaining</option>
                            <option value="mostProgress">Most progress</option>
                            <option value="leastProgress">Least progress</option>
                        </select>
                    </div>

                    {totalGoalCount === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No personal goals yet. Add them from Inventory.
                        </div>
                    ) : sortedGoalIds.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No goals match the current filters.{" "}
                            <button
                                className="underline text-slate-300 hover:text-slate-100"
                                onClick={() => { setSearch(""); setFilterStatus("all"); setFilterDone("all"); }}
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sortedGoalIds.map((goalId) => (
                                <GoalCard key={goalId} goalId={goalId} />
                            ))}
                        </div>
                    )}
                </Section>
            )}

            {tab === "requirements" && (
                <Section
                    title="Requirements Goals"
                    subtitle={`Actionable items: ${requirementsLines.length.toLocaleString()} (derived from Syndicate next-rank steps)`}
                >
                    {requirementsLines.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No actionable requirements right now.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {requirementsLines.map((l) => (
                                <div key={String(l.key)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold break-words">{l.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Need {l.totalNeed.toLocaleString()} · Have {l.have.toLocaleString()} · Remaining{" "}
                                                {l.remaining.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            )}

            {tab === "total" && (
                <Section title="Total Goals" subtitle="Personal + Requirements combined into a single list (summed by item).">
                    {totalLines.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No goals to compile yet.
                        </div>
                    ) : (
                        <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-800 bg-slate-950/30">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-950/90">
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left px-3 py-2 text-slate-300 font-semibold">Item</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[140px]">Personal</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[160px]">Requirements</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[140px]">Total</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[120px]">Have</th>
                                        <th className="text-right px-3 py-2 text-slate-300 font-semibold w-[140px]">Remaining</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {totalLines.map((r) => (
                                        <tr key={String(r.catalogId)} className="border-b border-slate-800/70">
                                            <td className="px-3 py-2 text-slate-100">
                                                <div className="font-semibold">{r.name}</div>
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-200">{r.personalNeed.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-slate-200">{r.requirementsNeed.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-slate-100 font-semibold">{r.totalNeed.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-slate-200">{r.have.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-slate-100 font-semibold">{r.remaining.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Section>
            )}
        </div>
    );
}

