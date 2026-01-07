import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import { toYMD } from "../domain/ymd";

export default function DailyChecklist() {
    const [label, setLabel] = useState("");

    const dailyTasks = useTrackerStore((s) => s.state.dailyTasks) ?? [];
    const upsertDailyTask = useTrackerStore((s) => s.upsertDailyTask);
    const toggleDailyTask = useTrackerStore((s) => s.toggleDailyTask);
    const deleteDailyTask = useTrackerStore((s) => s.deleteDailyTask);

    const todayYmd = toYMD(new Date());

    const todayTasks = useMemo(() => {
        return (dailyTasks ?? []).filter((t) => t.dateYmd === todayYmd);
    }, [dailyTasks, todayYmd]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Daily Checklist</div>
                    <div className="text-sm text-slate-400">
                        Add tasks for today. Completion is stored locally.
                    </div>
                </div>
                <div className="text-sm text-slate-300">
                    {todayTasks.filter((t) => t.isDone).length}/{todayTasks.length} done
                </div>
            </div>

            <div className="mt-3 flex gap-2">
                <input
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Add a task for today (e.g., ‘Cap Ostron standing’)"
                />
                <button
                    className="rounded-lg bg-slate-100 px-4 py-2 text-slate-900 font-semibold"
                    onClick={() => {
                        const trimmed = label.trim();
                        if (!trimmed) {
                            return;
                        }
                        upsertDailyTask(todayYmd, trimmed);
                        setLabel("");
                    }}
                >
                    Add
                </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
                {todayTasks.length === 0 && (
                    <div className="text-sm text-slate-400">
                        No tasks yet. Add your first task above.
                    </div>
                )}

                {todayTasks.map((t) => (
                    <div
                        key={t.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2"
                    >
                        <input
                            type="checkbox"
                            className="mt-1"
                            checked={t.isDone}
                            onChange={() => toggleDailyTask(t.id)}
                        />

                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold break-words">{t.label}</div>
                            {(t.syndicate || t.details) && (
                                <div className="text-xs text-slate-400 break-words">
                                    {t.syndicate ? `[${t.syndicate}] ` : ""}
                                    {t.details ?? ""}
                                </div>
                            )}
                        </div>

                        <button
                            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900"
                            onClick={() => deleteDailyTask(t.id)}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

