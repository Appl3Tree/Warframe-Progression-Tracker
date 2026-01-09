// ===== FILE: src/pages/Requirements.tsx =====
import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import { buildRequirementsSnapshot, type RequirementViewMode } from "../domain/logic/requirementEngine";

function normalize(s: string): string {
    return s.trim().toLowerCase();
}

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

function MiniStat(props: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2">
            <div className="text-xs text-slate-400">{props.label}</div>
            <div className="mt-0.5 font-mono text-sm text-slate-100">{props.value}</div>
        </div>
    );
}

export default function Requirements() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const goals = useTrackerStore((s) => s.state.goals ?? []);
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const inventory = useTrackerStore((s) => s.state.inventory);

    const [mode, setMode] = useState<RequirementViewMode>("targeted");
    const [query, setQuery] = useState("");

    const snapshot = useMemo(() => {
        return buildRequirementsSnapshot({
            syndicates,
            goals,
            completedPrereqs,
            inventory
        });
    }, [syndicates, goals, completedPrereqs, inventory]);

    const filteredItemLines = useMemo(() => {
        const q = normalize(query);
        const base = snapshot.itemLines;

        if (!q) return base;

        return base.filter((l) => {
            if (normalize(l.name).includes(q)) return true;
            if (normalize(String(l.key)).includes(q)) return true;

            return l.sources.some((s) => {
                if (normalize(s.name).includes(q)) return true;
                if (normalize(s.label).includes(q)) return true;
                return false;
            });
        });
    }, [snapshot.itemLines, query]);

    const overlapLines = useMemo(() => {
        const base = filteredItemLines.filter((x) => x.uniqueSourceCount >= 2);

        base.sort((a, b) => {
            if (a.uniqueSourceCount !== b.uniqueSourceCount) return b.uniqueSourceCount - a.uniqueSourceCount;
            if (a.remaining !== b.remaining) return b.remaining - a.remaining;
            return a.name.localeCompare(b.name);
        });

        return base;
    }, [filteredItemLines]);

    const visibleLines = mode === "targeted" ? filteredItemLines : overlapLines;

    return (
        <div className="space-y-6">
            <Section
                title="Farming"
                subtitle="Aggregates requirements from your Syndicate next-rank steps and your personal Goals. Targeted shows everything actionable now. Overlap highlights items that satisfy multiple sources."
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <PillButton label="Targeted Farming" active={mode === "targeted"} onClick={() => setMode("targeted")} />
                        <PillButton label="Overlap Farming" active={mode === "overlap"} onClick={() => setMode("overlap")} />
                    </div>

                    <div className="flex items-center gap-2">
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

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
                    <MiniStat label="Actionable items" value={snapshot.stats.actionableItemCount.toLocaleString()} />
                    <MiniStat label="Overlap items" value={snapshot.stats.overlapItemCount.toLocaleString()} />
                    <MiniStat label="Remaining items (sum)" value={snapshot.stats.totalRemainingItems.toLocaleString()} />
                    <MiniStat
                        label="Remaining currency"
                        value={[
                            `Credits ${snapshot.stats.totalRemainingCredits.toLocaleString()}`,
                            `Plat ${snapshot.stats.totalRemainingPlatinum.toLocaleString()}`
                        ].join(" · ")}
                    />
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-slate-400">Search</span>
                            <input
                                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by item name, catalog id, source name, or label..."
                            />
                        </label>
                    </div>
                </div>
            </Section>

            {snapshot.currencyLines.length > 0 && (
                <Section
                    title="Currency Requirements"
                    subtitle="Credits and Platinum are treated as special currency. Everything else is an item requirement."
                >
                    <div className="space-y-2">
                        {snapshot.currencyLines.map((l) => (
                            <div key={l.key} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold break-words">{l.name}</div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Need {l.totalNeed.toLocaleString()} · Have {l.have.toLocaleString()} · Remaining{" "}
                                            {l.remaining.toLocaleString()}
                                            {mode === "overlap" ? ` · Sources ${l.uniqueSourceCount}` : ""}
                                        </div>
                                    </div>
                                </div>

                                {l.sources.length > 0 && (
                                    <div className="mt-2 text-xs text-slate-400">
                                        Needed for:
                                        <ul className="mt-1 list-disc pl-5 space-y-1">
                                            {l.sources.slice(0, 10).map((s, idx) => (
                                                <li key={`${l.key}_${idx}`}>
                                                    {s.type === "syndicate" ? "Syndicate" : "Goal"}: {s.name} · {s.label} ({s.need.toLocaleString()})
                                                </li>
                                            ))}
                                            {l.sources.length > 10 && <li>…and {l.sources.length - 10} more.</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            <Section
                title={mode === "targeted" ? "Targeted Farming" : "Overlap Farming"}
                subtitle={
                    mode === "targeted"
                        ? "Everything below is accessible now (gated items are excluded)."
                        : "Only items that contribute to 2+ unique sources (syndicates and/or goals) are shown."
                }
            >
                {visibleLines.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                        No remaining requirements found for the current filters.
                        {mode === "overlap" && <div className="mt-2">Overlap view will be empty if nothing overlaps.</div>}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visibleLines.map((l) => (
                            <div key={String(l.key)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold break-words">{l.name}</div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Need {l.totalNeed.toLocaleString()} · Have {l.have.toLocaleString()} · Remaining{" "}
                                            {l.remaining.toLocaleString()}
                                            {mode === "overlap" ? ` · Sources ${l.uniqueSourceCount}` : ""}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-1 break-words">
                                            Key: <span className="font-mono">{String(l.key)}</span>
                                        </div>
                                    </div>
                                </div>

                                {l.sources.length > 0 && (
                                    <div className="mt-2 text-xs text-slate-400">
                                        Needed for:
                                        <ul className="mt-1 list-disc pl-5 space-y-1">
                                            {l.sources.slice(0, 10).map((s, idx) => (
                                                <li key={`${String(l.key)}_${idx}`}>
                                                    {s.type === "syndicate" ? "Syndicate" : "Goal"}: {s.name} · {s.label} ({s.need.toLocaleString()})
                                                </li>
                                            ))}
                                            {l.sources.length > 10 && <li>…and {l.sources.length - 10} more.</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
}

