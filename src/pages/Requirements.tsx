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

function downloadJson(filename: string, obj: unknown) {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

function snapshotStamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
        [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("") +
        "-" +
        [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join("")
    );
}

function formatSourcesForUi(sources: Array<{ sourceLabel?: string; sourceId: string }> | undefined): string {
    const list = sources ?? [];
    if (list.length === 0) return "(unmapped)";
    return list.map((s) => String(s.sourceLabel ?? s.sourceId)).join(", ");
}

export default function Requirements() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const goals = useTrackerStore((s) => s.state.goals ?? []);
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const inventory = useTrackerStore((s) => s.state.inventory);

    const [mode, setMode] = useState<RequirementViewMode>("targeted");

    // Search & hidden are fixed for now (no unused setters)
    const query = "";
    const showHidden = true;

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

            return (l.sources ?? []).some(
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

            return (g.items ?? []).some((it) => normalize(it.name).includes(q) || normalize(String(it.key)).includes(q));
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
                subtitle="Targeted shows actionable sources for each needed item. Overlap groups items by a shared acquisition source."
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

                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => {
                                const stamp = snapshotStamp();
                                downloadJson(`requirements-snapshot-${stamp}.json`, requirements);
                            }}
                        >
                            Export Requirements JSON
                        </button>

                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => {
                                const stamp = snapshotStamp();
                                downloadJson(`farming-snapshot-${stamp}.json`, farming);
                            }}
                        >
                            Export Farming JSON
                        </button>

                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-slate-100 text-sm font-semibold hover:bg-slate-900/40"
                            onClick={() => {
                                const stamp = snapshotStamp();
                                downloadJson(`planner-snapshots-${stamp}.json`, { requirements, farming });
                            }}
                        >
                            Export Combined JSON
                        </button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-7 gap-3">
                    <MiniStat label="Items (req snapshot)" value={requirements.stats.actionableItemCount.toLocaleString()} />
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
                    <MiniStat label="Overlap sources" value={farming.stats.overlapSourceCount.toLocaleString()} />
                    <MiniStat
                        label="Remaining currency"
                        value={[
                            `Credits ${requirements.stats.totalRemainingCredits.toLocaleString()}`,
                            `Plat ${requirements.stats.totalRemainingPlatinum.toLocaleString()}`
                        ].join(" · ")}
                    />
                </div>
            </Section>

            {showHidden && (
                <Section title="Hidden Items">
                    {filteredHidden.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                            No hidden items.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredHidden.map((h) => (
                                <div key={String(h.key)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                    <div className="text-sm font-semibold">{h.name}</div>
                                    <div className="text-xs text-slate-400">
                                        Remaining {h.remaining} · Reason{" "}
                                        <span className="font-mono">{h.reason}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            )}

            {mode === "targeted" ? (
                <Section title="Targeted Farming">
                    {filteredTargeted.map((l) => (
                        <div key={String(l.key)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <div className="text-sm font-semibold">{l.name}</div>
                            <div className="text-xs text-slate-400">Remaining {l.remaining}</div>
                            <div className="mt-2 text-xs text-slate-400 break-words">
                                Sources:{" "}
                                <span className="font-mono">
                                    {formatSourcesForUi(l.sources as any)}
                                </span>
                            </div>
                        </div>
                    ))}
                </Section>
            ) : (
                <Section title="Overlap Farming">
                    {filteredOverlap.map((g) => (
                        <div key={g.sourceId} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <div className="text-sm font-semibold">{g.sourceLabel}</div>
                            <div className="mt-2 text-xs text-slate-400">
                                Items: <span className="font-mono">{(g.items ?? []).length}</span>
                            </div>
                        </div>
                    ))}
                </Section>
            )}
        </div>
    );
}

