// ===== FILE: src/components/DailyChecklist.tsx =====
import { useMemo, useState, useRef, useEffect } from "react";
import { useTrackerStore } from "../store/store";
import { toYMD } from "../domain/ymd";

export default function DailyChecklist({ expanded = false }: { expanded?: boolean }) {
    const [label, setLabel]           = useState("");
    const [editingId, setEditingId]   = useState<string | null>(null);
    const [editValue, setEditValue]   = useState("");
    const editInputRef                = useRef<HTMLInputElement>(null);

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
            deleteDailyTask(t.id);
            upsertDailyTask(todayYmd, trimmed, t.syndicate, t.details);
            if (t.isDone) {
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

    // When expanded (full-width, no progression panel), show a multi-column grid
    const taskGridClass = expanded
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5"
        : "flex flex-col gap-1.5";

    function TaskCard({ t }: { t: typeof todayTasks[number] }) {
        const isEditing = editingId === t.id;
        return (
            <div className={[
                "flex items-start gap-2.5 rounded-xl border px-3 py-2 group",
                t.isDone
                    ? "border-emerald-900/30 bg-emerald-950/10 opacity-60"
                    : "border-slate-800 bg-slate-950/30"
            ].join(" ")}>
                <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
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
                                if (e.key === "Enter")  commitEdit(t);
                                if (e.key === "Escape") cancelEdit();
                            }}
                            onBlur={() => commitEdit(t)}
                        />
                    ) : (
                        <div
                            className={[
                                "text-sm font-medium break-words cursor-text",
                                t.isDone ? "line-through text-emerald-600" : "text-slate-200"
                            ].join(" ")}
                            onClick={() => !t.isDone && startEdit(t)}
                            title={t.isDone ? undefined : "Click to edit"}
                        >
                            {t.label}
                        </div>
                    )}
                    {(t.syndicate || t.details) && !isEditing && (
                        <div className="text-xs text-slate-500 mt-0.5">
                            {t.syndicate ? `[${t.syndicate}] ` : ""}{t.details ?? ""}
                        </div>
                    )}
                </div>
                <button
                    className="shrink-0 rounded px-1.5 py-0.5 text-[11px] text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteDailyTask(t.id)}
                    title="Delete task"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">

            {/* ── Fixed header ── */}
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-800/60 shrink-0">
                <div>
                    <div className="text-base font-semibold">Personal Checklist</div>
                    <div className="text-xs text-slate-400 mt-0.5">Click a task to edit it.</div>
                </div>
                <span className="text-xs text-slate-500 font-mono shrink-0">
                    {doneCount}/{todayTasks.length} done
                </span>
            </div>

            {/* ── Fixed add-task row ── */}
            <div className="flex gap-2 px-4 py-2.5 border-b border-slate-800/40 shrink-0">
                <input
                    className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                    placeholder="Add a task for today…"
                />
                <button
                    className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-900 text-sm font-semibold hover:bg-white transition-colors"
                    onClick={handleAdd}
                >
                    Add
                </button>
            </div>

            {/* ── Scrollable task list ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {todayTasks.length === 0 && (
                    <div className="text-sm text-slate-500 mt-1">
                        No tasks yet. Add your first task above.
                    </div>
                )}

                {todayTasks.length > 0 && (
                    <div className={taskGridClass}>
                        {pending.map((t) => <TaskCard key={t.id} t={t} />)}

                        {completed.length > 0 && (
                            <div className={[
                                "flex items-center gap-3 py-1",
                                expanded ? "col-span-full" : ""
                            ].join(" ")}>
                                <div className="flex-1 h-px bg-slate-800" />
                                <span className="text-[10px] text-slate-600">
                                    Completed · {completed.length}
                                </span>
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
