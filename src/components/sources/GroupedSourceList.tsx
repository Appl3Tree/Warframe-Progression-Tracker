import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type SourceFamily =
    | "all"
    | "vendor"
    | "mission"
    | "cache"
    | "relic"
    | "enemy"
    | "activity"
    | "market"
    | "quest"
    | "crafting"
    | "other";

export type SourceBadgeTone = "neutral" | "vendor" | "mission" | "cache" | "relic" | "warning" | "success";

export type GroupedSourceBadge = {
    label: string;
    tone?: SourceBadgeTone;
    title?: string;
};

export type GroupedSourceEntry = {
    id: string;
    family: Exclude<SourceFamily, "all">;
    dedupeKey?: string;
    title: string;
    subtitle?: string;
    meta?: string;
    sortValue?: number;
    href?: string;
    badges?: GroupedSourceBadge[];
};

type GroupedSourceListEntry = GroupedSourceEntry & {
    _sortIndex: number;
};

type SourceFamilyMeta = {
    label: string;
    pillActiveClassName: string;
    pillIdleClassName: string;
    accentClassName: string;
    emptyLabel: string;
};

const FAMILY_ORDER: SourceFamily[] = ["all", "vendor", "mission", "cache", "relic", "enemy", "activity", "market", "quest", "crafting", "other"];

const FAMILY_META: Record<SourceFamily, SourceFamilyMeta> = {
    all: {
        label: "All",
        pillActiveClassName: "border-slate-300/70 bg-slate-100 text-slate-950 shadow-[0_8px_24px_rgba(226,232,240,0.18)]",
        pillIdleClassName: "border-slate-700/70 bg-slate-900/55 text-slate-300 hover:border-slate-500/70 hover:bg-slate-800/80",
        accentClassName: "from-slate-200/16 via-slate-200/6 to-transparent",
        emptyLabel: "sources",
    },
    vendor: {
        label: "Vendor",
        pillActiveClassName: "border-amber-300/70 bg-amber-100 text-amber-950 shadow-[0_10px_24px_rgba(251,191,36,0.18)]",
        pillIdleClassName: "border-amber-700/35 bg-amber-950/18 text-amber-200 hover:border-amber-500/50 hover:bg-amber-900/28",
        accentClassName: "from-amber-300/18 via-amber-200/6 to-transparent",
        emptyLabel: "vendor sources",
    },
    mission: {
        label: "Mission Reward",
        pillActiveClassName: "border-cyan-300/70 bg-cyan-100 text-cyan-950 shadow-[0_10px_24px_rgba(34,211,238,0.18)]",
        pillIdleClassName: "border-cyan-700/35 bg-cyan-950/18 text-cyan-200 hover:border-cyan-500/50 hover:bg-cyan-900/28",
        accentClassName: "from-cyan-300/18 via-cyan-200/6 to-transparent",
        emptyLabel: "mission rewards",
    },
    cache: {
        label: "Cache",
        pillActiveClassName: "border-teal-300/70 bg-teal-100 text-teal-950 shadow-[0_10px_24px_rgba(45,212,191,0.16)]",
        pillIdleClassName: "border-teal-700/35 bg-teal-950/18 text-teal-200 hover:border-teal-500/50 hover:bg-teal-900/28",
        accentClassName: "from-teal-300/18 via-teal-200/6 to-transparent",
        emptyLabel: "cache drops",
    },
    relic: {
        label: "Relic",
        pillActiveClassName: "border-violet-300/70 bg-violet-100 text-violet-950 shadow-[0_10px_24px_rgba(167,139,250,0.18)]",
        pillIdleClassName: "border-violet-700/35 bg-violet-950/18 text-violet-200 hover:border-violet-500/50 hover:bg-violet-900/28",
        accentClassName: "from-violet-300/18 via-violet-200/6 to-transparent",
        emptyLabel: "relic paths",
    },
    enemy: {
        label: "Enemy",
        pillActiveClassName: "border-slate-300/70 bg-slate-200 text-slate-950 shadow-[0_10px_24px_rgba(148,163,184,0.18)]",
        pillIdleClassName: "border-slate-700/70 bg-slate-950/28 text-slate-200 hover:border-slate-500/70 hover:bg-slate-900/65",
        accentClassName: "from-slate-300/16 via-slate-300/6 to-transparent",
        emptyLabel: "enemy drops",
    },
    activity: {
        label: "Activity",
        pillActiveClassName: "border-lime-300/70 bg-lime-100 text-lime-950 shadow-[0_10px_24px_rgba(190,242,100,0.18)]",
        pillIdleClassName: "border-lime-700/35 bg-lime-950/18 text-lime-200 hover:border-lime-500/50 hover:bg-lime-900/28",
        accentClassName: "from-lime-300/18 via-lime-200/6 to-transparent",
        emptyLabel: "activity sources",
    },
    market: {
        label: "Market",
        pillActiveClassName: "border-fuchsia-300/70 bg-fuchsia-100 text-fuchsia-950 shadow-[0_10px_24px_rgba(244,114,182,0.16)]",
        pillIdleClassName: "border-fuchsia-700/35 bg-fuchsia-950/18 text-fuchsia-200 hover:border-fuchsia-500/50 hover:bg-fuchsia-900/28",
        accentClassName: "from-fuchsia-300/18 via-fuchsia-200/6 to-transparent",
        emptyLabel: "market sources",
    },
    quest: {
        label: "Quest",
        pillActiveClassName: "border-emerald-300/70 bg-emerald-100 text-emerald-950 shadow-[0_10px_24px_rgba(110,231,183,0.18)]",
        pillIdleClassName: "border-emerald-700/35 bg-emerald-950/18 text-emerald-200 hover:border-emerald-500/50 hover:bg-emerald-900/28",
        accentClassName: "from-emerald-300/18 via-emerald-200/6 to-transparent",
        emptyLabel: "quest sources",
    },
    crafting: {
        label: "Crafting",
        pillActiveClassName: "border-orange-300/70 bg-orange-100 text-orange-950 shadow-[0_10px_24px_rgba(253,186,116,0.18)]",
        pillIdleClassName: "border-orange-700/35 bg-orange-950/18 text-orange-200 hover:border-orange-500/50 hover:bg-orange-900/28",
        accentClassName: "from-orange-300/18 via-orange-200/6 to-transparent",
        emptyLabel: "crafting paths",
    },
    other: {
        label: "Other",
        pillActiveClassName: "border-slate-300/70 bg-slate-100 text-slate-950 shadow-[0_10px_24px_rgba(148,163,184,0.16)]",
        pillIdleClassName: "border-slate-700/70 bg-slate-950/28 text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/65",
        accentClassName: "from-slate-300/16 via-slate-300/6 to-transparent",
        emptyLabel: "other sources",
    },
};

const BADGE_TONE_CLASSNAMES: Record<SourceBadgeTone, string> = {
    neutral: "border-slate-700/70 bg-slate-900/75 text-slate-200",
    vendor: "border-amber-700/45 bg-amber-950/45 text-amber-200",
    mission: "border-cyan-700/45 bg-cyan-950/40 text-cyan-200",
    cache: "border-teal-700/45 bg-teal-950/40 text-teal-200",
    relic: "border-violet-700/45 bg-violet-950/40 text-violet-200",
    warning: "border-rose-700/45 bg-rose-950/40 text-rose-200",
    success: "border-emerald-700/45 bg-emerald-950/40 text-emerald-200",
};

const KNOWN_VENDOR_PREFIXES = [
    "New Loka",
    "Steel Meridian",
    "Arbiters of Hexis",
    "Cephalon Suda",
    "The Perrin Sequence",
    "Red Veil",
    "Conclave",
    "Cephalon Simaris",
    "Operational Supply",
    "The Quills",
    "Vox Solaris",
    "Ventkids",
    "Ostron",
    "Solaris United",
    "Entrati",
    "The Holdfasts",
    "NecraLoid",
    "Kahl's Garrison",
    "Arbitrations",
    "Nokko",
    "Hollvania",
    "Hollvania Central Mall",
];

function joinClasses(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

export function extractInlinePriceMeta(text: string): string | null {
    const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
    if (!normalized) return null;

    const match = normalized.match(
        /\b\d[\d,]*(?:\.\d+)?\s*(standing|credits|credit|platinum|ducats|steel essence|nightwave cred(?:s)?|aya|regal aya|pathos clamps?)\b/i,
    );
    if (!match) return null;

    const amount = match[0]
        .replace(/\bcredit\b/i, "Credits")
        .replace(/\bcredits\b/i, "Credits")
        .replace(/\bstanding\b/i, "Standing")
        .replace(/\bplatinum\b/i, "Platinum")
        .replace(/\bducats\b/i, "Ducats")
        .replace(/\bsteel essence\b/i, "Steel Essence")
        .replace(/\bnightwave cred(?:s)?\b/i, "Nightwave Creds")
        .replace(/\baya\b/i, "Aya")
        .replace(/\bregal aya\b/i, "Regal Aya")
        .replace(/\bpathos clamps?\b/i, "Pathos Clamps");

    return amount;
}

export function classifySourceFamilyFromCatalog(sourceId: string, label: string): Exclude<SourceFamily, "all"> {
    const sid = String(sourceId ?? "").toLowerCase();
    const normalized = String(label ?? "").toLowerCase();

    if (sid === "data:crafting") return "crafting";
    if (sid.startsWith("data:vendor/") || normalized.startsWith("syndicate vendor:")) return "vendor";
    if (sid.startsWith("data:market/")) return "market";
    if (sid.startsWith("data:quest/")) return "quest";
    if (sid.startsWith("data:cache:") || sid.startsWith("data:caches/") || normalized.includes("cache")) return "cache";
    if (
        sid.startsWith("data:missionreward/") ||
        sid.startsWith("data:node/") ||
        sid.startsWith("data:drop:node:") ||
        sid.startsWith("data:bounty/") ||
        normalized.includes("mission reward") ||
        normalized.includes("bounty") ||
        normalized.includes("rotation ") ||
        normalized.includes("cascade") ||
        normalized.includes("flood") ||
        normalized.includes("survival") ||
        normalized.includes("defense")
    ) {
        return "mission";
    }
    if (sid.includes("relic") || normalized.includes("relic")) return "relic";
    if (
        sid.startsWith("data:activity/") ||
        sid.startsWith("data:events/") ||
        normalized.includes("circuit") ||
        normalized.includes("sortie") ||
        normalized.includes("sanctuary") ||
        normalized.includes("eidolon") ||
        normalized.includes("arbitration") ||
        normalized.includes("invasion")
    ) {
        return "activity";
    }
    if (sid.startsWith("src:") || sid.startsWith("data:enemy/")) return "enemy";
    if (!normalized.includes("/") && !normalized.includes(",") && !normalized.includes(":")) return "enemy";
    return "other";
}

export function classifySourceFamilyFromDropLocation(location: string): Exclude<SourceFamily, "all"> {
    const normalized = String(location ?? "").trim();
    const lower = normalized.toLowerCase();

    if (!normalized) return "other";
    if (lower.includes("cache")) return "cache";
    if (normalized.includes("Relic")) return "relic";
    if (
        lower.includes("bounty") ||
        lower.includes("rotation ") ||
        lower.includes("cascade") ||
        lower.includes("flood") ||
        lower.includes("armageddon")
    ) {
        return "mission";
    }
    if (/^[A-Z][a-zA-Z ]+\/[A-Z]/.test(normalized) || normalized.startsWith("Duviri/")) return "mission";

    const commaIndex = normalized.indexOf(", ");
    if (commaIndex > 0) {
        const prefix = normalized.slice(0, commaIndex);
        if (KNOWN_VENDOR_PREFIXES.some((vendor) => prefix.startsWith(vendor))) return "vendor";
    }

    if (
        lower.includes("sortie") ||
        lower.includes("conclave") ||
        lower.includes("sanctuary") ||
        lower.includes("arbitration") ||
        lower.includes("circuit")
    ) {
        return "activity";
    }

    if (!normalized.includes("/") && !normalized.includes(", ")) return "enemy";
    return "other";
}

function normalizeEntryToken(value: string | undefined): string {
    return String(value ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[(),]/g, " ")
        .trim();
}

function familyPriority(family: Exclude<SourceFamily, "all">): number {
    switch (family) {
        case "vendor":
            return 9;
        case "market":
            return 8;
        case "mission":
            return 7;
        case "cache":
            return 6;
        case "relic":
            return 5;
        case "enemy":
            return 4;
        case "activity":
            return 3;
        case "quest":
            return 2;
        case "crafting":
            return 1;
        case "other":
        default:
            return 0;
    }
}

export function dedupeGroupedSourceEntries(entries: GroupedSourceEntry[]): GroupedSourceEntry[] {
    const merged = new Map<string, GroupedSourceListEntry>();

    entries.forEach((entry, index) => {
        const key = entry.dedupeKey
            ? `explicit|${normalizeEntryToken(entry.dedupeKey)}`
            : [normalizeEntryToken(entry.title), normalizeEntryToken(entry.subtitle), normalizeEntryToken(entry.meta)].join("|");
        const candidate: GroupedSourceListEntry = { ...entry, _sortIndex: index };
        const existing = merged.get(key);

        if (!existing) {
            merged.set(key, candidate);
            return;
        }

        const preferred =
            familyPriority(candidate.family) > familyPriority(existing.family) ||
            ((candidate.sortValue ?? Number.NEGATIVE_INFINITY) > (existing.sortValue ?? Number.NEGATIVE_INFINITY)) ||
            (candidate.meta && !existing.meta) ||
            (candidate.href && !existing.href)
                ? candidate
                : existing;
        const secondary = preferred === candidate ? existing : candidate;
        const badgeMap = new Map<string, GroupedSourceBadge>();
        for (const badge of [...(preferred.badges ?? []), ...(secondary.badges ?? [])]) {
            badgeMap.set(`${badge.label}|${badge.tone ?? "neutral"}`, badge);
        }
        merged.set(key, {
            ...preferred,
            meta: preferred.meta ?? secondary.meta,
            sortValue: preferred.sortValue ?? secondary.sortValue,
            href: preferred.href ?? secondary.href,
            badges: [...badgeMap.values()],
            _sortIndex: Math.min(existing._sortIndex, candidate._sortIndex),
        });
    });

    return [...merged.values()].sort((a, b) => a._sortIndex - b._sortIndex);
}

export function GroupedSourceList(props: {
    entries: GroupedSourceEntry[];
    emptyState?: ReactNode;
    compact?: boolean;
    maxHeightClassName?: string;
    className?: string;
    initialActiveFamily?: SourceFamily;
}) {
    const { entries, emptyState, compact = false, maxHeightClassName = "max-h-[26rem]", className, initialActiveFamily } = props;
    const dedupedEntries = useMemo(() => dedupeGroupedSourceEntries(entries), [entries]);
    const compactPreviewCount = 3;

    const countsByFamily = useMemo(() => {
        const counts = new Map<SourceFamily, number>();
        counts.set("all", dedupedEntries.length);
        for (const entry of dedupedEntries) {
            counts.set(entry.family, (counts.get(entry.family) ?? 0) + 1);
        }
        return counts;
    }, [dedupedEntries]);

    const availableFamilies = useMemo(
        () => FAMILY_ORDER.filter((family) => (countsByFamily.get(family) ?? 0) > 0),
        [countsByFamily],
    );

    const [activeFamily, setActiveFamily] = useState<SourceFamily>(initialActiveFamily ?? "all");
    const [compactExpanded, setCompactExpanded] = useState(false);

    useEffect(() => {
        if (availableFamilies.length === 0) {
            if (activeFamily !== "all") setActiveFamily("all");
            return;
        }
        if (!availableFamilies.includes(activeFamily)) {
            setActiveFamily(availableFamilies[0] ?? "all");
        }
    }, [activeFamily, availableFamilies]);

    useEffect(() => {
        if (initialActiveFamily && availableFamilies.includes(initialActiveFamily)) {
            setActiveFamily(initialActiveFamily);
        }
    }, [initialActiveFamily, availableFamilies]);

    useEffect(() => {
        setCompactExpanded(false);
    }, [activeFamily, dedupedEntries]);

    const visibleEntries = useMemo(() => {
        const filtered = activeFamily === "all" ? dedupedEntries : dedupedEntries.filter((entry) => entry.family === activeFamily);
        const orderIndex = new Map(filtered.map((entry, index) => [entry.id, index]));
        return [...filtered].sort((a, b) => {
            const aSort = a.sortValue ?? Number.NEGATIVE_INFINITY;
            const bSort = b.sortValue ?? Number.NEGATIVE_INFINITY;
            if (aSort !== bSort) return bSort - aSort;
            return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0);
        });
    }, [activeFamily, dedupedEntries]);
    const renderedEntries = useMemo(
        () => (compact && !compactExpanded ? visibleEntries.slice(0, compactPreviewCount) : visibleEntries),
        [compact, compactExpanded, visibleEntries],
    );

    if (dedupedEntries.length === 0) {
        return <>{emptyState ?? <div className="text-sm text-slate-500">No source data available.</div>}</>;
    }

    const activeMeta = FAMILY_META[activeFamily];
    const layoutDensity = compact ? "gap-0" : "gap-0";
    const rowPadding = compact ? "px-0 py-0" : "px-0 py-0";
    const titleClassName = compact ? "text-sm" : "text-[15px]";
    const subtitleClassName = compact ? "text-[11px]" : "text-xs";

    return (
        <div
            className={joinClasses(
                compact
                    ? "overflow-hidden"
                    : "overflow-hidden rounded-[26px] border border-slate-800/70 bg-[rgba(5,10,20,0.34)] backdrop-blur-sm",
                className,
            )}
        >
            <div className={joinClasses(compact ? "pb-2" : "border-b border-slate-800/70 px-3 py-3 sm:px-4")}>
                <div className="flex flex-wrap items-center gap-2">
                    {availableFamilies.map((family) => {
                        const meta = FAMILY_META[family];
                        const count = countsByFamily.get(family) ?? 0;
                        const active = family === activeFamily;
                        return (
                            <button
                                key={family}
                                type="button"
                                onClick={() => setActiveFamily(family)}
                                className={joinClasses(
                                    compact
                                        ? "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-200"
                                        : "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200",
                                    active ? meta.pillActiveClassName : meta.pillIdleClassName,
                                )}
                            >
                                <span>{meta.label}</span>
                                <span className={joinClasses("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-black/10" : "bg-white/5")}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={joinClasses("relative", activeMeta.accentClassName)}>
                {!compact ? <div className={joinClasses("absolute inset-x-0 top-0 h-16 bg-gradient-to-b", activeMeta.accentClassName)} /> : null}
                <div className={joinClasses("relative", compact ? "px-2.5 py-1.5" : "px-3 py-2.5 sm:px-4")}>
                    <div className={joinClasses("flex items-center justify-between gap-3", compact ? "mb-1" : "mb-2")}>
                        <div className={joinClasses("font-semibold uppercase tracking-[0.16em] text-slate-400", compact ? "text-[10px]" : "text-[11px]")}>
                            {activeFamily === "all" ? "Sources" : activeMeta.label}
                        </div>
                        <div className={joinClasses("text-slate-500", compact ? "text-[10px]" : "text-[11px]")}>
                            {visibleEntries.length}
                        </div>
                    </div>

                    {visibleEntries.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/35 px-4 py-6 text-sm text-slate-500">
                            No {activeMeta.emptyLabel} available.
                        </div>
                    ) : (
                        <div className={joinClasses(compact ? "" : "overflow-y-auto pr-1", compact ? undefined : maxHeightClassName)}>
                            <div className={joinClasses("flex flex-col", layoutDensity)}>
                                {renderedEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className={joinClasses(
                                            compact
                                                ? "border-b border-slate-800/70 py-2 last:border-b-0"
                                                : "border-b border-slate-800/70 py-3.5 last:border-b-0",
                                            rowPadding,
                                        )}
                                    >
                                        <div className={joinClasses("flex flex-wrap items-start justify-between", compact ? "gap-2" : "gap-3")}>
                                            <div className="min-w-0 flex-1">
                                                {!compact || activeFamily === "all" ? (
                                                    <div className={joinClasses("font-semibold uppercase tracking-[0.16em] text-slate-500", compact ? "mb-0.5 text-[9px]" : "mb-1 text-[10px]")}>
                                                        {FAMILY_META[entry.family].label}
                                                    </div>
                                                ) : null}
                                                {entry.href ? (
                                                    <a
                                                        href={entry.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={joinClasses(
                                                            "block min-w-0 font-medium text-slate-100 transition-colors hover:text-cyan-200 hover:underline",
                                                            titleClassName,
                                                        )}
                                                    >
                                                        {entry.title}
                                                    </a>
                                                ) : (
                                                    <div className={joinClasses("min-w-0 font-medium text-slate-100", titleClassName)}>{entry.title}</div>
                                                )}
                                                {entry.subtitle ? <div className={joinClasses(compact ? "mt-0.5 leading-snug text-slate-500" : "mt-1 max-w-[52ch] leading-relaxed text-slate-400", subtitleClassName)}>{entry.subtitle}</div> : null}
                                            </div>

                                            <div className={joinClasses("flex shrink-0 flex-wrap items-center justify-end", compact ? "gap-1 self-center" : "gap-1.5")}>
                                                {entry.badges?.map((badge, index) => (
                                                    <span
                                                        key={`${entry.id}-badge-${index}`}
                                                        title={badge.title}
                                                        className={joinClasses(
                                                            compact
                                                                ? "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                                                                : "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                                                            BADGE_TONE_CLASSNAMES[badge.tone ?? "neutral"],
                                                        )}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                ))}
                                                {entry.meta ? (
                                                    <span className={joinClasses(
                                                        "rounded-full border font-mono text-slate-300",
                                                        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]",
                                                        compact ? "border-slate-700/60 bg-slate-900" : "border-slate-700/70 bg-slate-950/75",
                                                    )}>
                                                        {entry.meta}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {compact && visibleEntries.length > compactPreviewCount ? (
                                <div className="border-t border-slate-800/70 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setCompactExpanded((value) => !value)}
                                        className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:border-slate-500/70 hover:bg-slate-800"
                                    >
                                        {compactExpanded
                                            ? "Show Less"
                                            : `Show ${visibleEntries.length - compactPreviewCount} More`}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
