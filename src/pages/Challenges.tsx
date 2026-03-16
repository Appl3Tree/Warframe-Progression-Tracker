// src/pages/Challenges.tsx
import { useMemo, useState } from "react";
import CHALLENGES_RAW from "../data/challenges.json";
import DICT_RAW from "../data/dict.json";
import { useTrackerStore } from "../store/store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChallengeEntry {
    uniqueName: string;
    name?: string;
    description?: string;
    icon?: string;
    requiredCount?: number;
    hidden?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DICT: Record<string, string> = DICT_RAW as Record<string, string>;

/** Resolve a Lotus language path to its English text, or fall back to the path itself. */
function loc(path: string | undefined): string {
    if (!path) return "";
    if (!path.startsWith("/")) return path;
    // Strip formatting tags like |OPEN_COLOR|...|CLOSE_COLOR| and |COUNT|
    const raw = DICT[path] ?? "";
    if (!raw) return path.split("/").pop() ?? path;
    return raw
        .replace(/\|OPEN_COLOR\|.*?\|CLOSE_COLOR\|/g, "")
        .replace(/\|COUNT\|/g, "#")
        .replace(/\r?\n/g, " ")
        .trim();
}

const ALL_CHALLENGES: ChallengeEntry[] = Object.values(
    CHALLENGES_RAW as Record<string, ChallengeEntry>
).filter(c => !c.hidden && c.uniqueName);

// ─── Component ────────────────────────────────────────────────────────────────

type FilterMode = "all" | "completed" | "incomplete";

export default function Challenges() {
    const challengeProgress = useTrackerStore(s => s.state.challenges?.progress ?? {});
    const challengeCompleted = useTrackerStore(s => s.state.challenges?.completed ?? {});

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterMode>("all");

    const hasImportedData = Object.keys(challengeProgress).length > 0 || Object.keys(challengeCompleted).length > 0;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return ALL_CHALLENGES.filter(c => {
            const name = loc(c.name).toLowerCase();
            const desc = loc(c.description).toLowerCase();
            if (q && !name.includes(q) && !desc.includes(q)) return false;

            if (filter === "completed") {
                return Boolean(challengeCompleted[c.uniqueName]) ||
                    (c.requiredCount !== undefined && (challengeProgress[c.uniqueName] ?? 0) >= c.requiredCount);
            }
            if (filter === "incomplete") {
                const done = Boolean(challengeCompleted[c.uniqueName]) ||
                    (c.requiredCount !== undefined && (challengeProgress[c.uniqueName] ?? 0) >= c.requiredCount);
                return !done;
            }
            return true;
        });
    }, [search, filter, challengeProgress, challengeCompleted]);

    const completedCount = useMemo(() => {
        return ALL_CHALLENGES.filter(c =>
            Boolean(challengeCompleted[c.uniqueName]) ||
            (c.requiredCount !== undefined && (challengeProgress[c.uniqueName] ?? 0) >= c.requiredCount)
        ).length;
    }, [challengeProgress, challengeCompleted]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100">Challenges</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {ALL_CHALLENGES.length} total challenges
                            {hasImportedData && (
                                <span className="ml-2 text-slate-300">
                                    — <span className="text-green-400 font-medium">{completedCount}</span> completed
                                    <span className="text-slate-500 mx-1">·</span>
                                    <span className="text-slate-300 font-medium">{ALL_CHALLENGES.length - completedCount}</span> remaining
                                </span>
                            )}
                        </p>
                    </div>
                    {hasImportedData && (
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-100">
                                    {Math.round((completedCount / ALL_CHALLENGES.length) * 100)}%
                                </div>
                                <div className="text-xs text-slate-500">completion</div>
                            </div>
                        </div>
                    )}
                </div>

                {hasImportedData && (
                    <div className="mt-3">
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                                style={{ width: `${(completedCount / ALL_CHALLENGES.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {!hasImportedData && (
                    <div className="mt-3 rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 text-sm text-slate-400">
                        Import your profile on the <span className="text-slate-200 font-medium">Import / Export</span> page to track your challenge progress.
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <input
                    className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm w-64 placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search challenges…"
                />

                {/* Status filter */}
                {hasImportedData && (
                    <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                        {(["all", "completed", "incomplete"] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={[
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                    filter === f
                                        ? "bg-slate-700 text-slate-100"
                                        : "text-slate-400 hover:text-slate-200"
                                ].join(" ")}
                            >
                                {f === "all" ? "All" : f === "completed" ? "Completed" : "Incomplete"}
                            </button>
                        ))}
                    </div>
                )}

                <span className="text-xs text-slate-500">{filtered.length} shown</span>
            </div>

            {/* Challenge list */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400">No challenges match your search.</div>
                ) : (
                    <div className="divide-y divide-slate-800/60">
                        {filtered.map(c => {
                            const name = loc(c.name);
                            const desc = loc(c.description);
                            const progress = challengeProgress[c.uniqueName] ?? 0;
                            const isCompleted = Boolean(challengeCompleted[c.uniqueName]) ||
                                (c.requiredCount !== undefined && progress >= c.requiredCount);
                            const hasRequired = c.requiredCount !== undefined && c.requiredCount > 0;

                            return (
                                <div
                                    key={c.uniqueName}
                                    className={[
                                        "flex items-start gap-3 px-4 py-3 transition-colors",
                                        isCompleted ? "bg-green-950/10" : "bg-transparent"
                                    ].join(" ")}
                                >
                                    {/* Completion indicator */}
                                    {hasImportedData && (
                                        <div className={[
                                            "shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center",
                                            isCompleted
                                                ? "border-green-500 bg-green-500/20"
                                                : "border-slate-600 bg-transparent"
                                        ].join(" ")}>
                                            {isCompleted && (
                                                <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className={[
                                            "text-sm font-medium",
                                            isCompleted ? "text-green-300" : "text-slate-200"
                                        ].join(" ")}>
                                            {name}
                                        </div>
                                        {desc && (
                                            <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</div>
                                        )}

                                        {/* Progress bar for count-based challenges */}
                                        {hasImportedData && hasRequired && !isCompleted && progress > 0 && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden max-w-[120px]">
                                                    <div
                                                        className="h-full rounded-full bg-blue-500 transition-all"
                                                        style={{ width: `${Math.min(100, (progress / c.requiredCount!) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    {progress.toLocaleString()} / {c.requiredCount!.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {hasImportedData && hasRequired && !isCompleted && progress === 0 && (
                                            <div className="mt-1 text-[11px] text-slate-500">
                                                Requires: {c.requiredCount!.toLocaleString()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Required count badge (if not already showing progress bar) */}
                                    {(!hasImportedData || isCompleted) && hasRequired && (
                                        <div className={[
                                            "shrink-0 text-[11px] font-mono rounded px-1.5 py-0.5",
                                            isCompleted ? "text-green-400/70" : "text-slate-500 bg-slate-800 border border-slate-700"
                                        ].join(" ")}>
                                            {c.requiredCount?.toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
