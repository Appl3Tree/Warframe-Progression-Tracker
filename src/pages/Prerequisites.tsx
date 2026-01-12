// ===== FILE: src/pages/Prerequisites.tsx =====
import { useMemo, useState } from "react";
import { PREREQ_REGISTRY } from "../catalog/prereqs/prereqRegistry";
import { computePrereqStatuses, buildPrereqIndex } from "../domain/logic/prereqEngine";
import { computeUnlockGraphSnapshot } from "../domain/logic/unlockGraph";
import { useTrackerStore } from "../store/store";

export default function Prerequisites() {
    const completedMap = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const setPrereqCompleted = useTrackerStore((s) => s.setPrereqCompleted);

    const [filter, setFilter] = useState("");

    const index = useMemo(() => buildPrereqIndex(PREREQ_REGISTRY), []);
    const statuses = useMemo(
        () => computePrereqStatuses(PREREQ_REGISTRY, completedMap),
        [completedMap]
    );

    const snap = useMemo(
        () => computeUnlockGraphSnapshot(completedMap, PREREQ_REGISTRY),
        [completedMap]
    );

    const statusById = useMemo(() => {
        const map: Record<string, { completed: boolean; isUnlocked: boolean; missingPrereqs: string[] }> = {};
        for (const s of statuses) {
            map[s.id] = s;
        }
        return map;
    }, [statuses]);

    const grouped = useMemo(() => {
        const f = filter.trim().toLowerCase();

        const items = PREREQ_REGISTRY.filter((d) => {
            if (!f) return true;
            const hay = `${d.label} ${d.description} ${d.category} ${d.id}`.toLowerCase();
            return hay.includes(f);
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
                const ra = rankOf(a.id);
                const rb = rankOf(b.id);
                if (ra !== rb) return ra - rb;
                return a.label.localeCompare(b.label);
            });
        }

        return groups;
    }, [filter, snap.rankById]);

    const totals = useMemo(() => {
        const total = PREREQ_REGISTRY.length;
        const done = PREREQ_REGISTRY.filter((d) => completedMap[d.id] === true).length;
        return { total, done };
    }, [completedMap]);

    function labelFor(id: string): string {
        const def = index[id];
        return def ? def.label : id;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold">Prerequisites</div>
                        <div className="text-sm text-slate-400 mt-1">
                            Unknown prerequisites are assumed not complete. Locks are computed from prerequisites.
                        </div>
                    </div>

                    <div className="text-sm text-slate-300">
                        {totals.done}/{totals.total} marked complete
                    </div>
                </div>

                <div className="mt-3">
                    <input
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter prereqs (e.g., ‘Zariman’, ‘Helminth’, ‘New War’)"
                    />
                </div>
            </div>

            {Object.keys(grouped).length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
                    No prerequisites match your filter.
                </div>
            )}

            {Object.entries(grouped).map(([category, defs]) => (
                <div key={category} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="text-lg font-semibold">{category}</div>

                    <div className="mt-3 flex flex-col gap-2">
                        {defs.map((d) => {
                            const st = statusById[d.id] ?? { completed: false, isUnlocked: false, missingPrereqs: [] };
                            const locked = !st.isUnlocked;

                            return (
                                <div
                                    key={d.id}
                                    className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold break-words">
                                                {d.label}
                                                {locked && (
                                                    <span className="ml-2 text-xs text-amber-300">
                                                        Locked
                                                    </span>
                                                )}
                                                {!locked && (
                                                    <span className="ml-2 text-xs text-emerald-300">
                                                        Unlocked
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 break-words mt-1">
                                                {d.description}
                                            </div>
                                            <div className="text-[11px] text-slate-500 break-words mt-1">
                                                ID: {d.id}
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={st.completed}
                                                onChange={(e) => setPrereqCompleted(d.id, e.target.checked)}
                                            />
                                            Complete
                                        </label>
                                    </div>

                                    {locked && st.missingPrereqs.length > 0 && (
                                        <div className="mt-2 rounded-lg border border-amber-900/40 bg-amber-950/20 p-2">
                                            <div className="text-xs font-semibold text-amber-200">
                                                Missing prerequisites:
                                            </div>
                                            <ul className="mt-1 list-disc pl-5 text-xs text-amber-100">
                                                {st.missingPrereqs.map((m) => (
                                                    <li key={m}>{labelFor(m)}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {st.completed && locked && (
                                        <div className="mt-2 text-xs text-red-300">
                                            This is marked complete, but its prerequisites are not marked complete. If you imported progress, this can be normal.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

