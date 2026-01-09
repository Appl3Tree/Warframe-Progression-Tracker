// ===== FILE: src/pages/Goals.tsx =====
import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";
import { buildRequirementsSnapshot } from "../domain/logic/requirementEngine";

type GoalsTab = "personal" | "requirements" | "total";

const EMPTY_OBJ: Record<string, boolean> = {};
const EMPTY_ARR: any[] = [];

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

type GoalRow = {
    catalogId: CatalogId;
    name: string;
    personalNeed: number;
    requirementsNeed: number;
    totalNeed: number;
    have: number;
    remaining: number;
};

function safeInt(v: unknown, fallback: number): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

export default function Goals() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    const goals = useTrackerStore((s) => (Array.isArray((s.state as any).goals) ? (s.state as any).goals : EMPTY_ARR));
    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs?.completed ?? EMPTY_OBJ);
    const inventory = useTrackerStore((s) => s.state.inventory);

    const setGoalQty = useTrackerStore((s) => s.setGoalQty);
    const setGoalNote = useTrackerStore((s) => s.setGoalNote);
    const toggleGoalActive = useTrackerStore((s) => s.toggleGoalActive);
    const removeGoal = useTrackerStore((s) => s.removeGoal);

    const [tab, setTab] = useState<GoalsTab>("personal");

    // Requirements-only snapshot (syndicates + inventory; NO personal goals included)
    const requirementsOnly = useMemo(() => {
        return buildRequirementsSnapshot({
            syndicates,
            goals: [],
            completedPrereqs,
            inventory
        });
    }, [syndicates, completedPrereqs, inventory]);

    // Personal goals lines (only active item goals)
    const personalLines = useMemo(() => {
        const out: Array<{
            goalId: string;
            catalogId: CatalogId;
            name: string;
            qty: number;
            note: string;
            isActive: boolean;
            have: number;
            remaining: number;
        }> = [];

        for (const g of goals ?? []) {
            if (!g || g.type !== "item") continue;

            const cid = String(g.catalogId) as CatalogId;
            const rec = FULL_CATALOG.recordsById[cid];
            const name = rec?.displayName ?? cid;

            const qty = Math.max(1, safeInt(g.qty ?? 1, 1));
            const have = safeInt(inventory?.counts?.[String(cid)] ?? 0, 0);
            const remaining = Math.max(0, qty - have);

            out.push({
                goalId: String(g.id),
                catalogId: cid,
                name,
                qty,
                note: String(g.note ?? ""),
                isActive: g.isActive !== false,
                have,
                remaining
            });
        }

        out.sort((a, b) => {
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
            if (a.remaining !== b.remaining) return b.remaining - a.remaining;
            return a.name.localeCompare(b.name);
        });

        return out;
    }, [goals, inventory]);

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

        // Personal needs: use the goal qty directly as "need" (per your example),
        // remaining computed later using inventory.have.
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

        // Requirements needs: use engine totalNeed (already filtered by accessibility in engine)
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

        // Hide rows that have no need at all (defensive) and prioritize remaining
        const filtered = out.filter((r) => r.totalNeed > 0);

        filtered.sort((a, b) => {
            if (a.remaining !== b.remaining) return b.remaining - a.remaining;
            return a.name.localeCompare(b.name);
        });

        return filtered;
    }, [goals, requirementsOnly.itemLines, inventory]);

    return (
        <div className="space-y-6">
            <Section
                title="Goals"
                subtitle="This page is a read-only view of what you are farming for. Add/remove Personal Goals from Inventory; Requirements Goals come from your Syndicate next-rank steps."
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
                    subtitle={`Count: ${personalLines.length.toLocaleString()} (includes inactive)`}
                >
                    {personalLines.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No personal goals yet. Add them from Inventory.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {personalLines.map((g) => (
                                <div key={g.goalId} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="text-sm font-semibold break-words">{g.name}</div>
                                                <span
                                                    className={[
                                                        "text-[11px] rounded-full border px-2 py-0.5",
                                                        g.isActive ? "border-emerald-800 text-emerald-300" : "border-slate-700 text-slate-400"
                                                    ].join(" ")}
                                                >
                                                    {g.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Need {g.qty.toLocaleString()} · Have {g.have.toLocaleString()} · Remaining {g.remaining.toLocaleString()}
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-1 break-words">
                                                Key: <span className="font-mono">{String(g.catalogId)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-xs hover:bg-slate-900/40"
                                                onClick={() => toggleGoalActive(g.goalId)}
                                            >
                                                Toggle
                                            </button>

                                            <button
                                                className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-red-200 text-xs hover:bg-red-950/30"
                                                onClick={() => removeGoal(g.goalId)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3">
                                        <label className="flex flex-col gap-1">
                                            <span className="text-xs text-slate-400">Goal Qty</span>
                                            <input
                                                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                                                type="number"
                                                min={1}
                                                value={g.qty}
                                                onChange={(e) => {
                                                    const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
                                                    setGoalQty(g.goalId, n);
                                                }}
                                            />
                                        </label>

                                        <label className="flex flex-col gap-1">
                                            <span className="text-xs text-slate-400">Note</span>
                                            <input
                                                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                                                value={g.note}
                                                onChange={(e) => setGoalNote(g.goalId, e.target.value)}
                                                placeholder="Optional"
                                            />
                                        </label>
                                    </div>
                                </div>
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
                                            <div className="text-[11px] text-slate-500 mt-1 break-words">
                                                Key: <span className="font-mono">{String(l.key)}</span>
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
                <Section
                    title="Total Goals"
                    subtitle="Personal + Requirements combined into a single list (summed by item)."
                >
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
                                                <div className="text-[11px] text-slate-500 break-words">
                                                    <span className="font-mono">{String(r.catalogId)}</span>
                                                </div>
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

