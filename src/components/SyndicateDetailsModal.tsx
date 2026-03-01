// ===== FILE: src/components/SyndicateDetailsModal.tsx =====
import { useEffect, useMemo, useState } from "react";
import type {
    SyndicateCostLine,
    SyndicateOffering,
    SyndicateRankUpRequirement,
    SyndicateVendorEntry
} from "../domain/catalog/syndicates/syndicateVendorCatalog";

type ModalTab = "ranks" | "offerings";

type OwnedMap = Record<string, boolean>;

type OfferSortKey = "rankAsc" | "rankDesc" | "nameAsc" | "nameDesc" | "standingAsc" | "standingDesc";

type OwnedFilter = "all" | "owned" | "unowned";

type VendorOfferingGroup = {
    id: string;
    name: string;
    offerings: SyndicateOffering[];
};

type VendorishEntry = SyndicateVendorEntry & {
    vendors?: VendorOfferingGroup[];
};

type OfferingWithVendor = SyndicateOffering & {
    vendorId: string;      // "zuud", "legs", etc. OR "main"
    vendorName: string;    // "Rude Zuud", etc. OR entry.name
};

function offeringKey(o: OfferingWithVendor): string {
    // Unique within a syndicate even if two vendors sell the same named item.
    return `${o.vendorId}::${o.name}`;
}

function formatCostLine(c: SyndicateCostLine): string {
    if (c.kind === "credits") return `${c.amount.toLocaleString()} Credits`;
    if (c.kind === "standing") return `${c.amount.toLocaleString()} Standing`;
    if (c.kind === "item") return `${c.qty.toLocaleString()}x ${c.name}`;
    if (c.kind === "currency") return `${c.amount.toLocaleString()} ${c.name}`;
    if (c.kind === "other") return c.amount === undefined ? c.label : `${c.amount.toLocaleString()} ${c.label}`;
    return "Unknown cost";
}

function PillButton(props: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            className={[
                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                props.active
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "bg-slate-950/30 text-slate-200 border-slate-700 hover:bg-slate-900"
            ].join(" ")}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
}

function EmptyState(props: { title: string; body: string }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
            <div className="text-sm font-semibold text-slate-100">{props.title}</div>
            <div className="mt-1 text-xs text-slate-400">{props.body}</div>
        </div>
    );
}

function inputClass(): string {
    return "w-full rounded-xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/40";
}

function selectClass(): string {
    return "w-full rounded-xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500/40";
}

function smallLabelClass(): string {
    return "text-[11px] text-slate-400";
}

function chipClass(): string {
    return "inline-flex items-center rounded-full border border-slate-700 bg-slate-950/30 px-2 py-0.5 text-xs text-slate-200";
}

function sumCosts(costs: SyndicateCostLine[]): {
    standing: number;
    credits: number;
    currencies: Record<string, number>;
    items: Record<string, number>;
    other: Record<string, number>;
} {
    let standing = 0;
    let credits = 0;
    const currencies: Record<string, number> = {};
    const items: Record<string, number> = {};
    const other: Record<string, number> = {};

    for (const c of costs) {
        if (!c) continue;
        if (c.kind === "standing") {
            standing += c.amount ?? 0;
        } else if (c.kind === "credits") {
            credits += c.amount ?? 0;
        } else if (c.kind === "currency") {
            const k = c.name ?? "Currency";
            currencies[k] = (currencies[k] ?? 0) + (c.amount ?? 0);
        } else if (c.kind === "item") {
            const k = c.name ?? "Item";
            items[k] = (items[k] ?? 0) + (c.qty ?? 0);
        } else if (c.kind === "other") {
            const k = c.label ?? "Other";
            other[k] = (other[k] ?? 0) + (c.amount ?? 0);
        }
    }

    return { standing, credits, currencies, items, other };
}

function mergeCostSums(
    a: ReturnType<typeof sumCosts>,
    b: ReturnType<typeof sumCosts>
): ReturnType<typeof sumCosts> {
    const currencies: Record<string, number> = { ...a.currencies };
    const items: Record<string, number> = { ...a.items };
    const other: Record<string, number> = { ...a.other };

    for (const [k, v] of Object.entries(b.currencies)) currencies[k] = (currencies[k] ?? 0) + v;
    for (const [k, v] of Object.entries(b.items)) items[k] = (items[k] ?? 0) + v;
    for (const [k, v] of Object.entries(b.other)) other[k] = (other[k] ?? 0) + v;

    return {
        standing: a.standing + b.standing,
        credits: a.credits + b.credits,
        currencies,
        items,
        other
    };
}

function countCostLineStanding(costs: SyndicateCostLine[]): number {
    let s = 0;
    for (const c of costs) {
        if (c?.kind === "standing") s += c.amount ?? 0;
    }
    return s;
}

function renderCostSummaryBlocks(sum: ReturnType<typeof sumCosts>) {
    const currencyEntries = Object.entries(sum.currencies).sort((a, b) => a[0].localeCompare(b[0]));
    const itemEntries = Object.entries(sum.items).sort((a, b) => a[0].localeCompare(b[0]));
    const otherEntries = Object.entries(sum.other).sort((a, b) => a[0].localeCompare(b[0]));

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
                <span className={chipClass()}>
                    Standing: <span className="ml-1 font-mono">{sum.standing.toLocaleString()}</span>
                </span>
                <span className={chipClass()}>
                    Credits: <span className="ml-1 font-mono">{sum.credits.toLocaleString()}</span>
                </span>
            </div>

            {currencyEntries.length ? (
                <div className="flex flex-wrap gap-2">
                    {currencyEntries.map(([k, v]) => (
                        <span key={`cur-${k}`} className={chipClass()}>
                            {k}: <span className="ml-1 font-mono">{v.toLocaleString()}</span>
                        </span>
                    ))}
                </div>
            ) : null}

            {itemEntries.length ? (
                <div className="flex flex-wrap gap-2">
                    {itemEntries.map(([k, v]) => (
                        <span key={`item-${k}`} className={chipClass()}>
                            {k}: <span className="ml-1 font-mono">{v.toLocaleString()}</span>
                        </span>
                    ))}
                </div>
            ) : null}

            {otherEntries.length ? (
                <div className="flex flex-wrap gap-2">
                    {otherEntries.map(([k, v]) => (
                        <span key={`other-${k}`} className={chipClass()}>
                            {k}: <span className="ml-1 font-mono">{v.toLocaleString()}</span>
                        </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

/**
 * Ranks list (transition view). No minimum-standing shown (redundant with main page).
 */
function RankUpTransitionsList(props: { rows: SyndicateRankUpRequirement[] }) {
    const rows = props.rows ?? [];
    if (rows.length === 0) {
        return (
            <EmptyState
                title="No rank-up data yet"
                body="Populate src/domain/catalog/syndicates/syndicateVendorCatalog.ts and this will render automatically."
            />
        );
    }

    const byRank = new Map<number, SyndicateRankUpRequirement>();
    for (const r of rows) {
        if (r && typeof r.rank === "number") byRank.set(r.rank, r);
    }

    const ranks = [...byRank.keys()].sort((a, b) => a - b);

    if (ranks.length < 2) {
        const only = byRank.get(ranks[0])!;
        return (
            <EmptyState
                title="Not enough rank rows to show transitions"
                body={`Only Rank ${only.rank} exists in the catalog. Add adjacent ranks so we can show "Rank A → Rank B" transitions.`}
            />
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {ranks.slice(1).map((toRank) => {
                const to = byRank.get(toRank);
                if (!to) return null;

                const fromRank = toRank - 1;
                const from = byRank.get(fromRank);

                const costs = Array.isArray((to as any).costs) ? ((to as any).costs as SyndicateCostLine[]) : [];
                const hasAnyCost = costs.length > 0;

                return (
                    <div key={`transition-${fromRank}-${toRank}`} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-100">
                                Rank {fromRank} → Rank {toRank}
                            </div>

                            <div className="text-[11px] text-slate-400">
                                {hasAnyCost ? (
                                    <span>
                                        {countCostLineStanding(costs).toLocaleString()} Standing
                                    </span>
                                ) : (
                                    <span className="text-amber-300/90">Not populated</span>
                                )}
                            </div>
                        </div>

                        {!from ? (
                            <div className="mt-2 text-xs text-amber-300/90">
                                Note: Rank {fromRank} row is not present in the catalog yet. This transition is shown using the costs stored on Rank{" "}
                                {toRank}, but the previous-rank metadata is missing.
                            </div>
                        ) : null}

                        <div className="mt-3">
                            <div className="text-xs text-slate-400 mb-2">Rank Up Costs</div>

                            {hasAnyCost ? (
                                <div className="flex flex-wrap gap-2">
                                    {costs.map((c: SyndicateCostLine, i: number) => (
                                        <span key={i} className={chipClass()}>
                                            {formatCostLine(c)}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-amber-300/90">
                                    Rank-up data not populated for this transition. (Do not assume this is free.)
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ownedStorageKey(syndicateId: string): string {
    return `wfpt:syndicateOwned:${syndicateId}`;
}

function canUseLocalStorage(): boolean {
    try {
        if (typeof window === "undefined") return false;
        if (!window.localStorage) return false;
        const k = "__wfpt_ls_test__";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
        return true;
    } catch {
        return false;
    }
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function OfferingRow(props: {
    offering: OfferingWithVendor;
    owned: boolean;
    onToggleOwned: () => void;
}) {
    const o = props.offering;
    const standingCost = countCostLineStanding(o.costs);

    return (
        <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex items-start gap-3">
                    <button
                        className={[
                            "mt-0.5 h-5 w-5 rounded border transition flex items-center justify-center",
                            props.owned
                                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                                : "border-slate-700 bg-slate-950/30 text-slate-400 hover:bg-slate-900"
                        ].join(" ")}
                        onClick={props.onToggleOwned}
                        title={props.owned ? "Mark as unowned" : "Mark as owned"}
                        aria-label={props.owned ? "Owned" : "Unowned"}
                    >
                        {props.owned ? (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M20 6L9 17l-5-5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        ) : null}
                    </button>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-slate-100 break-words">{o.name}</div>

                            {o.vendorId !== "main" ? (
                                <span className="text-[11px] rounded-full border border-slate-700 bg-slate-950/30 px-2 py-0.5 text-slate-300">
                                    {o.vendorName}
                                </span>
                            ) : null}

                            {props.owned ? (
                                <span className="text-[11px] rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-emerald-200">
                                    Owned
                                </span>
                            ) : null}

                            {o.notes ? (
                                <span className="text-[11px] rounded-full border border-slate-700 bg-slate-950/30 px-2 py-0.5 text-slate-300">
                                    {o.notes}
                                </span>
                            ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                            {o.costs.map((c, i) => (
                                <span key={i} className={chipClass()}>
                                    {formatCostLine(c)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 text-right">
                    <div className="text-xs text-slate-400">
                        Rank <span className="font-mono text-slate-200">{o.rankRequired}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                        Standing <span className="font-mono text-slate-200">{standingCost.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SyndicateDetailsModal(props: {
    open: boolean;
    onClose: () => void;

    title: string;
    entry: SyndicateVendorEntry | null;

    initialTab: ModalTab;
}) {
    const [tab, setTab] = useState<ModalTab>(props.initialTab);

    // Offerings controls
    const [query, setQuery] = useState<string>("");
    const [maxRank, setMaxRank] = useState<number | null>(null);
    const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>("all");
    const [sortKey, setSortKey] = useState<OfferSortKey>("rankAsc");
    const [selectedVendorId, setSelectedVendorId] = useState<string>("all");

    // Owned toggle map (persisted per syndicate)
    const syndicateId = props.entry?.id ?? "";
    const [owned, setOwned] = useState<OwnedMap>({});

    useEffect(() => {
        if (props.open) setTab(props.initialTab);
    }, [props.open, props.initialTab]);

    // Reset controls when opening
    useEffect(() => {
        if (!props.open) return;
        setQuery("");
        setMaxRank(null);
        setOwnedFilter("all");
        setSortKey("rankAsc");
        setSelectedVendorId("all");
    }, [props.open, syndicateId]);

    // ESC close
    useEffect(() => {
        if (!props.open) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") props.onClose();
        }

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [props.open, props.onClose]);

    // Load owned map for this syndicate on open / id change
    useEffect(() => {
        if (!props.open) return;
        if (!syndicateId) {
            setOwned({});
            return;
        }
        if (!canUseLocalStorage()) {
            setOwned({});
            return;
        }

        try {
            const raw = localStorage.getItem(ownedStorageKey(syndicateId));
            setOwned(safeJsonParse<OwnedMap>(raw, {}));
        } catch {
            setOwned({});
        }
    }, [props.open, syndicateId]);

    // Persist owned map
    useEffect(() => {
        if (!props.open) return;
        if (!syndicateId) return;
        if (!canUseLocalStorage()) return;

        try {
            localStorage.setItem(ownedStorageKey(syndicateId), JSON.stringify(owned));
        } catch {
            // ignore
        }
    }, [props.open, syndicateId, owned]);

    function toggleOwned(key: string) {
        setOwned((prev) => {
            const next = { ...prev };
            next[key] = !Boolean(next[key]);
            return next;
        });
    }

    const entry = props.entry;

    const rankUps = useMemo(() => entry?.rankUps ?? [], [entry]);

    const { vendorGroups, offerings } = useMemo(() => {
        const e = entry as VendorishEntry | null;

        const groups: VendorOfferingGroup[] = Array.isArray(e?.vendors) ? e!.vendors! : [];
        const hasGroups = groups.length > 0;

        if (!hasGroups) {
            const base: OfferingWithVendor[] = (e?.offerings ?? []).map((o) => ({
                ...o,
                vendorId: "main",
                vendorName: e?.name ?? "Vendor"
            }));
            return { vendorGroups: [] as VendorOfferingGroup[], offerings: base };
        }

        const all: OfferingWithVendor[] = groups.flatMap((g) =>
            (g.offerings ?? []).map((o) => ({
                ...o,
                vendorId: g.id,
                vendorName: g.name
            }))
        );

        if (selectedVendorId === "all") {
            return { vendorGroups: groups, offerings: all };
        }

        return {
            vendorGroups: groups,
            offerings: all.filter((o) => o.vendorId === selectedVendorId)
        };
    }, [entry, selectedVendorId]);

    const maxRankOptions = useMemo(() => {
        const ranks = new Set<number>();
        for (const o of offerings) ranks.add(o.rankRequired);
        return [...ranks].sort((a, b) => a - b);
    }, [offerings]);

    // ---- Derived offerings view (filter + sort) ----
    const filteredOfferings = useMemo(() => {
        const rows = offerings ?? [];
        const q = query.trim().toLowerCase();

        const filtered = rows.filter((o) => {
            const isOwned = Boolean(owned[offeringKey(o)]);
            if (ownedFilter === "owned" && !isOwned) return false;
            if (ownedFilter === "unowned" && isOwned) return false;

            if (maxRank !== null && o.rankRequired > maxRank) return false;

            if (!q) return true;
            const hay = `${o.name} ${o.notes ?? ""}`.toLowerCase();
            return hay.includes(q);
        });

        const sorted = [...filtered].sort((a, b) => {
            if (sortKey === "rankAsc") return a.rankRequired - b.rankRequired || a.name.localeCompare(b.name);
            if (sortKey === "rankDesc") return b.rankRequired - a.rankRequired || a.name.localeCompare(b.name);
            if (sortKey === "nameAsc") return a.name.localeCompare(b.name);
            if (sortKey === "nameDesc") return b.name.localeCompare(a.name);
            if (sortKey === "standingAsc")
                return countCostLineStanding(a.costs) - countCostLineStanding(b.costs) || a.name.localeCompare(b.name);
            if (sortKey === "standingDesc")
                return countCostLineStanding(b.costs) - countCostLineStanding(a.costs) || a.name.localeCompare(b.name);
            return 0;
        });

        return sorted;
    }, [offerings, query, ownedFilter, maxRank, sortKey, owned]);

    const offerStats = useMemo(() => {
        const total = offerings.length;
        const shown = filteredOfferings.length;
        let ownedShown = 0;
        let unownedShown = 0;

        for (const o of filteredOfferings) {
            if (owned[offeringKey(o)]) ownedShown++;
            else unownedShown++;
        }

        return { total, shown, ownedShown, unownedShown };
    }, [offerings.length, filteredOfferings, owned]);

    const offerSumFiltered = useMemo(() => {
        return filteredOfferings.reduce((acc, o) => mergeCostSums(acc, sumCosts(o.costs)), sumCosts([]));
    }, [filteredOfferings]);

    const offerSumUnowned = useMemo(() => {
        return filteredOfferings.reduce((acc, o) => {
            if (owned[offeringKey(o)]) return acc;
            return mergeCostSums(acc, sumCosts(o.costs));
        }, sumCosts([]));
    }, [filteredOfferings, owned]);

    const rankUpSum = useMemo(() => {
        if (!rankUps.length) return sumCosts([]);

        const byRank = new Map<number, SyndicateRankUpRequirement>();
        for (const r of rankUps) {
            if (r && typeof r.rank === "number") byRank.set(r.rank, r);
        }

        const ranks = [...byRank.keys()].sort((a, b) => a - b);
        if (ranks.length < 2) return sumCosts([]);

        return ranks.slice(1).reduce((acc, toRank) => {
            const to = byRank.get(toRank);
            const costs = Array.isArray((to as any)?.costs) ? ((to as any).costs as SyndicateCostLine[]) : [];
            return mergeCostSums(acc, sumCosts(costs));
        }, sumCosts([]));
    }, [rankUps]);

    if (!props.open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onMouseDown={() => props.onClose()} />

            <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6">
                <div
                    className="w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-800">
                        <div className="min-w-0">
                            <div className="text-lg font-semibold text-slate-100 truncate">{props.title}</div>
                            <div className="mt-1 text-xs text-slate-400">
                                {entry ? "Data is rendered from the syndicate vendor catalog." : "No catalog entry found for this syndicate yet."}
                            </div>
                        </div>

                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                            onClick={() => props.onClose()}
                        >
                            Close
                        </button>
                    </div>

                    {/* Tabs / toolbar */}
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                            <PillButton active={tab === "ranks"} label="Ranks" onClick={() => setTab("ranks")} />
                            <PillButton active={tab === "offerings"} label="Offerings" onClick={() => setTab("offerings")} />
                        </div>

                        {tab === "offerings" ? (
                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
                                <div className="lg:col-span-5">
                                    <div className={smallLabelClass()}>Search</div>
                                    <input
                                        className={inputClass()}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Name or notes..."
                                    />
                                </div>

                                {vendorGroups.length ? (
                                    <div className="lg:col-span-3">
                                        <div className={smallLabelClass()}>Vendor</div>
                                        <select
                                            className={selectClass()}
                                            value={selectedVendorId}
                                            onChange={(e) => setSelectedVendorId(e.target.value)}
                                        >
                                            <option key="vendor_all" value="all">All vendors</option>
                                            {vendorGroups.map((v) => (
                                                <option key={`vendor_${v.id}`} value={v.id}>
                                                    {v.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                <div className="lg:col-span-3">
                                    <div className={smallLabelClass()}>Max Rank</div>
                                    <select
                                        className={selectClass()}
                                        value={maxRank === null ? "all" : String(maxRank)}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setMaxRank(v === "all" ? null : Number(v));
                                        }}
                                    >
                                        <option key="all" value="all">All ranks</option>
                                        {maxRankOptions.map((r) => (
                                            <option key={`rank_lte_${r}`} value={String(r)}>
                                                Rank ≤ {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="lg:col-span-2">
                                    <div className={smallLabelClass()}>Owned</div>
                                    <select className={selectClass()} value={ownedFilter} onChange={(e) => setOwnedFilter(e.target.value as OwnedFilter)}>
                                        <option value="all">All</option>
                                        <option value="unowned">Unowned only</option>
                                        <option value="owned">Owned only</option>
                                    </select>
                                </div>

                                <div className="lg:col-span-2">
                                    <div className={smallLabelClass()}>Sort</div>
                                    <select className={selectClass()} value={sortKey} onChange={(e) => setSortKey(e.target.value as OfferSortKey)}>
                                        <option value="rankAsc">Rank ↑</option>
                                        <option value="rankDesc">Rank ↓</option>
                                        <option value="nameAsc">Name A→Z</option>
                                        <option value="nameDesc">Name Z→A</option>
                                        <option value="standingAsc">Standing ↑</option>
                                        <option value="standingDesc">Standing ↓</option>
                                    </select>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Content + summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
                        <div className="lg:col-span-8">
                            <div className="max-h-[70vh] overflow-auto pr-1">
                                {tab === "ranks" ? (
                                    entry ? (
                                        rankUps.length ? (
                                            <RankUpTransitionsList rows={rankUps} />
                                        ) : entry.rankInfo ? (
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                                                <div className="text-sm font-semibold text-slate-100">Ranks</div>
                                                <div className="mt-2 text-xs text-slate-400 whitespace-pre-wrap">{entry.rankInfo}</div>
                                            </div>
                                        ) : (
                                            <EmptyState
                                                title="No rank-up data"
                                                body="This syndicate does not have rank-up sacrifices, or the catalog entry is not populated."
                                            />
                                        )
                                    ) : (
                                        <EmptyState title="Missing catalog entry" body="Add a matching entry in syndicateVendorCatalog.ts." />
                                    )
                                ) : entry ? (
                                    offerings.length ? (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 overflow-hidden">
                                            <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-3 border-b border-slate-800 text-xs text-slate-400">
                                                <div>Item</div>
                                                <div className="text-right">Rank / Cost</div>
                                            </div>

                                            <div className="divide-y divide-slate-800">
                                                {filteredOfferings.map((o) => (
                                                    <OfferingRow
                                                        key={offeringKey(o)}
                                                        offering={o}
                                                        owned={Boolean(owned[offeringKey(o)])}
                                                        onToggleOwned={() => toggleOwned(offeringKey(o))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <EmptyState
                                            title="No offerings data yet"
                                            body="Populate src/domain/catalog/syndicates/syndicateVendorCatalog.ts and this will render automatically."
                                        />
                                    )
                                ) : (
                                    <EmptyState title="Missing catalog entry" body="Add a matching entry in syndicateVendorCatalog.ts." />
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                                <div className="text-sm font-semibold text-slate-100">Summary</div>

                                {tab === "offerings" ? (
                                    <>
                                        <div className="mt-2 text-xs text-slate-400">
                                            Showing <span className="font-mono text-slate-200">{offerStats.shown.toLocaleString()}</span> of{" "}
                                            <span className="font-mono text-slate-200">{offerStats.total.toLocaleString()}</span> offerings.
                                            {offerStats.shown ? (
                                                <>
                                                    {" "}
                                                    (<span className="font-mono text-slate-200">{offerStats.unownedShown.toLocaleString()}</span> unowned,{" "}
                                                    <span className="font-mono text-slate-200">{offerStats.ownedShown.toLocaleString()}</span> owned)
                                                </>
                                            ) : null}
                                        </div>

                                        <div className="mt-4">
                                            <div className="text-xs text-slate-400 mb-2">Total Cost (Filtered)</div>
                                            {renderCostSummaryBlocks(offerSumFiltered)}
                                        </div>

                                        <div className="mt-4">
                                            <div className="text-xs text-slate-400 mb-2">Total Cost (Filtered, Unowned Only)</div>
                                            {renderCostSummaryBlocks(offerSumUnowned)}
                                        </div>

                                        <div className="mt-4">
                                            <div className="text-xs text-slate-400 mb-2">Actions</div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    className="rounded-xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
                                                    onClick={() => {
                                                        setOwnedFilter("unowned");
                                                        setSortKey("standingAsc");
                                                    }}
                                                    title="Switch to a shopping-focused view"
                                                >
                                                    Plan Purchases (Unowned + lowest standing first)
                                                </button>

                                                <button
                                                    className="rounded-xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
                                                    onClick={() => {
                                                        setQuery("");
                                                        setMaxRank(null);
                                                        setOwnedFilter("all");
                                                        setSortKey("rankAsc");
                                                    }}
                                                    title="Reset filters and sorting"
                                                >
                                                    Reset View
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 text-[11px] text-slate-500">
                                            Owned state is stored locally per syndicate (browser localStorage).
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mt-3">
                                            <div className="text-xs text-slate-400 mb-2">Total Rank-Up Cost</div>
                                            {renderCostSummaryBlocks(rankUpSum)}
                                        </div>

                                        <div className="mt-4 text-[11px] text-slate-500">
                                            Totals are summed from the “to-rank” costs across transitions shown in this panel.
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
