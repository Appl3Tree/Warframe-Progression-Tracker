// ===== FILE: src/components/DailyChecklist.tsx =====
import { useMemo, useState, useRef, useEffect } from "react";
import { useTrackerStore } from "../store/store";
import { toYMD } from "../domain/ymd";

export default function DailyChecklist({ expanded = false }: { expanded?: boolean }) {
    const [label, setLabel]       = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const editInputRef = useRef<HTMLInputElement>(null);

    const dailyTasks      = useTrackerStore((s) => s.state.dailyTasks) ?? [];
    const upsertDailyTask = useTrackerStore((s) => s.upsertDailyTask);
    const toggleDailyTask = useTrackerStore((s) => s.toggleDailyTask);
    const deleteDailyTask = useTrackerStore((s) => s.deleteDailyTask);

    const todayYmd = toYMD(new Date());

    const todayTasks = useMemo(
        () => (dailyTasks ?? []).filter((t) => t.dateYmd === todayYmd),
        [dailyTasks, todayYmd]
    );

    useEffect(() => {
        if (editingId) editInputRef.current?.focus();
    }, [editingId]);

    function handleAdd() {
        const trimmed = label.trim();
        if (!trimmed) return;
        upsertDailyTask(todayYmd, trimmed);
        setLabel("");
    }

    function startEdit(t: { id: string; label: string }) {
        setEditingId(t.id);
        setEditValue(t.label);
    }

    function commitEdit(t: { id: string; label: string; isDone: boolean; syndicate?: string; details?: string }) {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== t.label) {
            // Delete old, insert new preserving done state
            deleteDailyTask(t.id);
            upsertDailyTask(todayYmd, trimmed, t.syndicate, t.details);
            // Re-toggle if it was done — upsert always creates as undone
            if (t.isDone) {
                // The new task won't exist in store yet; toggle by label match on next tick
                setTimeout(() => {
                    const updated = useTrackerStore.getState().state.dailyTasks
                        .find((x) => x.dateYmd === todayYmd && x.label === trimmed);
                    if (updated && !updated.isDone) toggleDailyTask(updated.id);
                }, 0);
            }
        }
        setEditingId(null);
        setEditValue("");
    }

    function cancelEdit() {
        setEditingId(null);
        setEditValue("");
    }

    const doneCount = todayTasks.filter((t) => t.isDone).length;
    const pending   = todayTasks.filter((t) => !t.isDone);
    const completed = todayTasks.filter((t) =>  t.isDone);
    const gridClass = expanded
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1"
        : "flex flex-col gap-2";

    function TaskCard({ t }: { t: typeof todayTasks[number] }) {
        const isEditing = editingId === t.id;
        const cardClass = t.isDone
            ? "flex items-start gap-3 rounded-xl border border-emerald-900/30 bg-emerald-950/10 px-3 py-2 opacity-70 group"
            : "flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 group";

        return (
            <div key={t.id} className={cardClass}>
                <input
                    type="checkbox"
                    className="mt-1 shrink-0"
                    checked={t.isDone}
                    onChange={() => toggleDailyTask(t.id)}
                />
                <div className="min-w-0 flex-1">
                    {isEditing ? (
                        <input
                            ref={editInputRef}
                            className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-0.5 text-sm text-slate-100 focus:outline-none focus:border-slate-400"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") commitEdit(t);
                                if (e.key === "Escape") cancelEdit();
                            }}
                            onBlur={() => commitEdit(t)}
                        />
                    ) : (
                        <div
                            className={`text-sm font-semibold break-words cursor-text ${t.isDone ? "line-through text-emerald-500" : "text-slate-200"}`}
                            onClick={() => startEdit(t)}
                            title="Click to edit"
                        >
                            {t.label}
                        </div>
                    )}
                    {(t.syndicate || t.details) && !isEditing && (
                        <div className="text-xs text-slate-400 break-words">
                            {t.syndicate ? `[${t.syndicate}] ` : ""}{t.details ?? ""}
                        </div>
                    )}
                </div>
                <button
                    className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteDailyTask(t.id)}
                >
                    Delete
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Personal Checklist</div>
                    <div className="text-sm text-slate-400">
                        Add tasks for today. Click a task to edit it.
                    </div>
                </div>
                <div className="text-sm text-slate-300">
                    {doneCount}/{todayTasks.length} done
                </div>
            </div>

            <div className="mt-3 flex gap-2">
                <input
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                    placeholder="Add a task for today…"
                />
                <button
                    className="rounded-lg bg-slate-100 px-4 py-2 text-slate-900 font-semibold"
                    onClick={handleAdd}
                >
                    Add
                </button>
            </div>

            <div className="mt-4">
                {todayTasks.length === 0 && (
                    <div className="text-sm text-slate-400">
                        No tasks yet. Add your first task above.
                    </div>
                )}

                {todayTasks.length > 0 && (
                    <div className={gridClass}>
                        {pending.map((t) => <TaskCard key={t.id} t={t} />)}

                        {completed.length > 0 && (
                            <div className={expanded ? "col-span-full flex items-center gap-3 py-1 px-1" : "flex items-center gap-3 py-1 px-1"}>
                                <div className="flex-1 h-px bg-slate-800" />
                                <span className="text-[11px] text-slate-600">Completed · {completed.length}</span>
                                <div className="flex-1 h-px bg-slate-800" />
                            </div>
                        )}

                        {completed.map((t) => <TaskCard key={t.id} t={t} />)}
                    </div>
                )}
            </div>
        </div>
    );
}