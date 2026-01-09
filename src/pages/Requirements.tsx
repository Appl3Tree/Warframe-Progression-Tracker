// ===== FILE: src/pages/Requirements.tsx =====
import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import {
    buildRequirementsSnapshot,
    buildFarmingSnapshot,
    type RequirementViewMode
} from "../domain/logic/requirementEngine";

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
        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{props.label}</div>
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
    const [showHidden, setShowHidden] = useState(true);

    const requirements = useMemo(() => {
        return buildRequirementsSnapshot({
            syndicates,
            goals,
            completedPrereqs,
            inventory
        });
    }, [syndicates, goals, completedPrereqs, inventory]);

    const farming = useMemo(() => {
        return buildFarmingSnapshot({
            requirements,
            completedPrereqs
        });
    }, [requirements, completedPrereqs]);

    const filteredTargeted = useMemo(() => {
        const q = normalize(query);
        if (!q) return farming.targeted;

        return farming.targeted.filter((l) => {
            if (normalize(l.name).includes(q)) return true;
            if (normalize(String(l.key)).includes(q)) return true;

            return l.sources.some(
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

            return g.items.some((it) => normalize(it.name).includes(q) || normalize(String(it.key)).includes(q));
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
                subtitle="Targeted shows actionable sources for each needed item. Overlap groups items by a shared acquisition source. Actionable lists are fail-closed; missing mappings/unlocks are shown separately under Hidden."
            >
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
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-7 gap-3">
                    <MiniStat
                        label="Items (req snapshot)"
                        value={requirements.stats.actionableItemCount.toLocaleString()}
                    />
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
                    <MiniStat
                        label="Overlap sources"
                        value={farming.stats.overlapSourceCount.toLocaleString()}
                    />
                    <MiniStat
                        label="Remaining currency"
                        value={[
                            `Credits ${requirements.stats.totalRemainingCredits.toLocaleString()}`,
                            `Plat ${requirements.stats.totalRemainingPlatinum.toLocaleString()}`
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
                                placeholder="Search item name/id, source label/id, or hidden reason..."
                            />
                        </label>
                    </div>

                    <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={showHidden}
                                onChange={(e) => setShowHidden(e.target.checked)}
                            />
                            Show Hidden
                        </label>
                    </div>
                </div>
            </Section>

            {requirements.currencyLines.length > 0 && (
                <Section
                    title="Currency Requirements"
                    subtitle="Credits and Platinum are tracked separately. Currency sources are contextual (syndicate/goal), not drop locations."
                >
                    <div className="space-y-2">
                        {requirements.currencyLines.map((l) => (
                            <div key={l.key} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                <div className="text-sm font-semibold break-words">{l.name}</div>
                                <div className="text-xs text-slate-400 mt-1">
                                    Need {l.totalNeed.toLocaleString()} · Have {l.have.toLocaleString()} · Remaining{" "}
                                    {l.remaining.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {showHidden && (
                <Section
                    title="Hidden Items"
                    subtitle="These are required items that are not currently actionable due to missing acquisition mapping or locked sources. Add mappings in src/catalog/items/itemAcquisition.ts (do not guess)."
                >
                    {filteredHidden.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No hidden items for the current filters.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredHidden.map((h) => (
                                <div
                                    key={String(h.key)}
                                    className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold break-words">{h.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Remaining {h.remaining.toLocaleString()} · Reason{" "}
                                                <span className="font-mono">{h.reason}</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-1 break-words">
                                                Key: <span className="font-mono">{String(h.key)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            )}

            {mode === "targeted" ? (
                <Section
                    title="Targeted Farming"
                    subtitle="Only items with known acquisition AND at least one accessible-now source are shown."
                >
                    {filteredTargeted.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No actionable items found for the current filters.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredTargeted.map((l) => (
                                <div
                                    key={String(l.key)}
                                    className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                                >
                                    <div className="text-sm font-semibold break-words">{l.name}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Remaining {l.remaining.toLocaleString()}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1 break-words">
                                        Key: <span className="font-mono">{String(l.key)}</span>
                                    </div>

                                    <div className="mt-2 text-xs text-slate-400">
                                        Farm at:
                                        <ul className="mt-1 list-disc pl-5 space-y-1">
                                            {l.sources.map((s) => (
                                                <li key={`${String(l.key)}_${String(s.sourceId)}`}>
                                                    {s.sourceLabel}{" "}
                                                    <span className="text-slate-500">
                                                        (<span className="font-mono">{String(s.sourceId)}</span>)
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            ) : (
                <Section
                    title="Overlap Farming"
                    subtitle="Groups by acquisition source and shows sources that advance 2+ distinct items."
                >
                    {filteredOverlap.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No overlapping sources found for the current filters.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredOverlap.map((g) => (
                                <div
                                    key={`${g.sourceId}::${g.sourceLabel}`}
                                    className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                                >
                                    <div className="text-sm font-semibold break-words">{g.sourceLabel}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Items {g.itemCount.toLocaleString()} · Remaining (sum){" "}
                                        {g.totalRemaining.toLocaleString()}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1 break-words">
                                        Source: <span className="font-mono">{String(g.sourceId)}</span>
                                    </div>

                                    <div className="mt-2 text-xs text-slate-400">
                                        Advances:
                                        <ul className="mt-1 list-disc pl-5 space-y-1">
                                            {g.items.slice(0, 20).map((it) => (
                                                <li key={`${String(g.sourceId)}_${String(it.key)}`}>
                                                    {it.name}{" "}
                                                    <span className="text-slate-500">
                                                        (Remaining {it.remaining.toLocaleString()} ·{" "}
                                                        <span className="font-mono">{String(it.key)}</span>)
                                                    </span>
                                                </li>
                                            ))}
                                            {g.items.length > 20 && <li>…and {g.items.length - 20} more.</li>}
                                        </ul>
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
