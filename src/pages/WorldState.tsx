// src/pages/WorldState.tsx
// World State page — tabbed layout: Overview | Fissures | Missions | Events
// Data from https://api.warframestat.us (community API, no auth required).

import { useCallback, useEffect, useRef, useState } from "react";
import { useTrackerStore } from "../store/store";
import {
    fetchWorldState,
    processInvasions,
    type WorldStateData,
    type Fissure,
    type WsCycle,
    type DuviriCycle,
    type Archimedea,
    type Calendar,
} from "../lib/worldStateCache";

// ── Utilities ─────────────────────────────────────────────────────────────────

function msToHms(ms: number): string {
    if (ms <= 0) return "Expired";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${String(h % 24).padStart(2, "0")}h ${String(m % 60).padStart(2, "0")}m`;
    if (h > 0) return `${h}h ${String(m % 60).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;
    return `${String(m).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;
}

function useNow(): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    return now;
}

function Countdown({ expiry, className }: { expiry: string; className?: string }) {
    const now = useNow();
    return <span className={className}>{msToHms(new Date(expiry).getTime() - now)}</span>;
}

// ── Visual lookups ─────────────────────────────────────────────────────────────

const CYCLE_VISUALS: Record<string, { label: string; color: string; dot: string }> = {
    day:     { label: "Day",             color: "text-amber-300",  dot: "bg-amber-400" },
    night:   { label: "Night",           color: "text-blue-300",   dot: "bg-blue-400" },
    warm:    { label: "Warm",            color: "text-orange-300", dot: "bg-orange-400" },
    cold:    { label: "Cold",            color: "text-cyan-300",   dot: "bg-cyan-400" },
    fass:    { label: "Fass",            color: "text-red-300",    dot: "bg-red-400" },
    vome:    { label: "Vome",            color: "text-violet-300", dot: "bg-violet-400" },
    grineer: { label: "Grineer Control", color: "text-red-300",    dot: "bg-red-400" },
    corpus:  { label: "Corpus Control",  color: "text-blue-300",   dot: "bg-blue-400" },
    anger:   { label: "Anger",           color: "text-red-300",    dot: "bg-red-400" },
    envy:    { label: "Envy",            color: "text-green-300",  dot: "bg-green-400" },
    fear:    { label: "Fear",            color: "text-violet-300", dot: "bg-violet-400" },
    joy:     { label: "Joy",             color: "text-yellow-300", dot: "bg-yellow-400" },
    sorrow:  { label: "Sorrow",          color: "text-slate-300",  dot: "bg-slate-400" },
    envy2:   { label: "Envy",            color: "text-teal-300",   dot: "bg-teal-400" },
};

function getVisual(state: string) {
    return CYCLE_VISUALS[state.toLowerCase()] ?? { label: state, color: "text-slate-300", dot: "bg-slate-400" };
}

const FACTION_COLORS: Record<string, string> = {
    Grineer:    "text-red-400",
    Corpus:     "text-blue-400",
    Infested:   "text-green-400",
    Infestation:"text-green-400",
    Corrupted:  "text-violet-400",
    Orokin:     "text-violet-400",
    Narmer:     "text-amber-400",
};

const TIER_COLORS: Record<string, string> = {
    Lith:    "bg-amber-900/40 text-amber-300 border-amber-700/50",
    Meso:    "bg-slate-700/40 text-slate-300 border-slate-600/50",
    Neo:     "bg-yellow-900/40 text-yellow-300 border-yellow-700/50",
    Axi:     "bg-violet-900/40 text-violet-300 border-violet-700/50",
    Requiem: "bg-red-900/40 text-red-300 border-red-700/50",
    Omnia:   "bg-pink-900/40 text-pink-300 border-pink-700/50",
};

const TIER_ORDER = ["Lith", "Meso", "Neo", "Axi", "Requiem", "Omnia"];

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "fissures" | "missions" | "events";
const TABS: { key: Tab; label: string }[] = [
    { key: "overview",  label: "Overview"  },
    { key: "fissures",  label: "Fissures"  },
    { key: "missions",  label: "Missions"  },
    { key: "events",    label: "Events"    },
];

// ── Overview tab ──────────────────────────────────────────────────────────────

function CycleCard({ name, cycle, nextLabel }: { name: string; cycle: WsCycle; nextLabel: string }) {
    const vis = getVisual(cycle.state);
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 flex items-center justify-between gap-2">
            <div>
                <div className="text-[11px] text-slate-500 mb-0.5">{name}</div>
                <div className="flex items-center gap-1.5">
                    <span className={["w-2 h-2 rounded-full shrink-0", vis.dot].join(" ")} />
                    <span className={["text-sm font-semibold", vis.color].join(" ")}>{vis.label}</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-slate-500">{nextLabel} in</div>
                <Countdown expiry={cycle.expiry} className="font-mono text-xs text-slate-300" />
            </div>
        </div>
    );
}

function DuviriCard({ cycle }: { cycle: DuviriCycle }) {
    const [open, setOpen] = useState(false);
    const vis = getVisual(cycle.state);

    const normalGroup = cycle.choices.find((g) => g.category === "normal" || g.categoryKey?.includes("NORMAL"));
    const hardGroup   = cycle.choices.find((g) => g.category === "hard"   || g.categoryKey?.includes("HARD"));

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div>
                        <div className="text-[11px] text-slate-500 mb-0.5">Duviri</div>
                        <div className="flex items-center gap-1.5">
                            <span className={["w-2 h-2 rounded-full shrink-0", vis.dot].join(" ")} />
                            <span className={["text-sm font-semibold", vis.color].join(" ")}>{vis.label}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <div className="text-[10px] text-slate-500">next in</div>
                            <Countdown expiry={cycle.expiry} className="font-mono text-xs text-slate-300" />
                        </div>
                    </div>
                </div>
                {/* Circuit choices toggle */}
                {cycle.choices.length > 0 && (
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                    >
                        <svg className={["w-3 h-3 transition-transform", open ? "rotate-90" : ""].join(" ")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                        The Circuit choices
                    </button>
                )}
            </div>
            {/* Expanded circuit panel */}
            {open && cycle.choices.length > 0 && (
                <div className="border-t border-slate-800/60 px-3 py-2.5 space-y-2">
                    {normalGroup && (
                        <div>
                            <div className="text-[10px] text-slate-500 mb-1">Normal — Warframe picks</div>
                            <div className="flex flex-wrap gap-1">
                                {normalGroup.choices.map((name, i) => (
                                    <span key={i} className="rounded-full border border-blue-700/50 bg-blue-950/30 px-2 py-px text-[10px] text-blue-300 font-medium">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {hardGroup && (
                        <div>
                            <div className="text-[10px] text-red-400/70 mb-1">Steel Path — Incarnon picks</div>
                            <div className="flex flex-wrap gap-1">
                                {hardGroup.choices.map((name, i) => (
                                    <span key={i} className="rounded-full border border-red-700/50 bg-red-950/20 px-2 py-px text-[10px] text-red-300 font-medium">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Simaris card ───────────────────────────────────────────────────────────────

function SimarisCard({ target, isTargetActive }: { target: string; isTargetActive: boolean }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
            <div className="text-[11px] text-slate-500 mb-0.5">Sanctuary Onslaught Target</div>
            <div className="flex items-center gap-1.5">
                <span className={["w-2 h-2 rounded-full shrink-0", isTargetActive ? "bg-green-400" : "bg-slate-600"].join(" ")} />
                <span className={["text-sm font-semibold", isTargetActive ? "text-green-300" : "text-slate-300"].join(" ")}>
                    {target || "Unknown"}
                </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
                {isTargetActive ? "Currently active in mission" : "Scan in Sanctuary Onslaught"}
            </div>
        </div>
    );
}

// ── 1999 Calendar modal ────────────────────────────────────────────────────────

const CALENDAR_EVENT_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
    "To Do":      { label: "To Do",      color: "text-sky-300",    bg: "bg-sky-950/30",    border: "border-sky-700/40"    },
    "Big Prize!": { label: "Big Prize!", color: "text-amber-300",  bg: "bg-amber-950/30",  border: "border-amber-700/40"  },
    "Override":   { label: "Override",   color: "text-violet-300", bg: "bg-violet-950/30", border: "border-violet-700/40" },
    "Birthday":   { label: "Birthday",   color: "text-pink-300",   bg: "bg-pink-950/20",   border: "border-pink-900/40"   },
};

function CalendarModal({ calendar, onClose }: { calendar: Calendar; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
                    <div>
                        <div className="text-sm font-semibold text-slate-100">1999 Calendar</div>
                        {calendar.season && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{calendar.season}</div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-2 px-5 py-2.5 border-b border-slate-800/60 shrink-0">
                    {Object.values(CALENDAR_EVENT_STYLES).map((s) => (
                        <span key={s.label} className={["rounded-full border px-2 py-px text-[10px] font-medium", s.color, s.bg, s.border].join(" ")}>
                            {s.label}
                        </span>
                    ))}
                </div>
                {/* Days list */}
                <div className="overflow-y-auto flex-1 p-4">
                    {calendar.days.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-8">No calendar data available.</div>
                    ) : (
                        <div className="space-y-2">
                            {calendar.days.map((day, i) => {
                                const entries = day.events;
                                if (entries.length === 0) return null;
                                const isCurrent = calendar.currentDay !== undefined &&
                                    (String(i) === String(calendar.currentDay) || day.date === String(calendar.currentDay));
                                return (
                                    <div
                                        key={i}
                                        className={[
                                            "rounded-xl border px-3 py-2.5",
                                            isCurrent
                                                ? "border-violet-600/60 bg-violet-950/20"
                                                : "border-slate-800 bg-slate-900/30",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className={["text-[11px] font-semibold", isCurrent ? "text-violet-300" : "text-slate-400"].join(" ")}>
                                                {isCurrent && <span className="mr-1">▶</span>}{day.date || `Day ${i + 1}`}
                                            </span>
                                            {isCurrent && (
                                                <span className="rounded-full border border-violet-600/40 bg-violet-900/30 px-1.5 py-px text-[9px] text-violet-300 font-bold">TODAY</span>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            {entries.map((ev, ei) => {
                                                if (ev.type === "Birthday") {
                                                    return (
                                                        <div key={ei} className="rounded-lg border border-pink-900/40 bg-pink-950/20 px-2.5 py-1.5 flex items-center gap-2">
                                                            <span className="text-base leading-none">🎂</span>
                                                            <span className="text-xs text-pink-200 font-medium">{ev.title}</span>
                                                        </div>
                                                    );
                                                }
                                                const style = CALENDAR_EVENT_STYLES[ev.type] ?? { label: ev.type, color: "text-slate-300", bg: "bg-slate-800/40", border: "border-slate-700/40" };
                                                return (
                                                    <div key={ei} className={["rounded-lg border px-2.5 py-1.5", style.bg, style.border].join(" ")}>
                                                        <div className={["text-[9px] font-bold uppercase tracking-wider mb-0.5", style.color].join(" ")}>
                                                            {style.label}
                                                        </div>
                                                        {ev.title && <div className="text-xs text-slate-200 font-medium">{ev.title}</div>}
                                                        {ev.description && <div className="text-[10px] text-slate-400 mt-0.5">{ev.description}</div>}
                                                        {ev.reward && (
                                                            <div className="mt-1 flex items-center gap-1">
                                                                <span className="text-[9px] text-slate-500">Reward:</span>
                                                                <span className="text-[9px] text-amber-300 font-medium">{ev.reward}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OverviewTab({ data }: { data: WorldStateData }) {
    const now = useNow();
    const [calendarOpen, setCalendarOpen] = useState(false);

    const cycles: Array<{ name: string; cycle: WsCycle; nextLabel: string }> = [
        data.cetusCycle   && { name: "Plains of Eidolon", cycle: data.cetusCycle,   nextLabel: data.cetusCycle.state   === "day"  ? "Night" : "Day"  },
        data.vallisCycle  && { name: "Orb Vallis",        cycle: data.vallisCycle,  nextLabel: data.vallisCycle.state  === "warm" ? "Cold"  : "Warm" },
        data.cambionCycle && { name: "Cambion Drift",     cycle: data.cambionCycle, nextLabel: data.cambionCycle.state === "fass" ? "Vome"  : "Fass" },
        data.zarimanCycle && { name: "Zariman",           cycle: data.zarimanCycle, nextLabel: "Next" },
        data.earthCycle   && { name: "Earth",             cycle: data.earthCycle,   nextLabel: data.earthCycle.state   === "day"  ? "Night" : "Day"  },
    ].filter(Boolean) as Array<{ name: string; cycle: WsCycle; nextLabel: string }>;

    const baroActive = data.voidTrader?.active;
    const baroDue    = data.voidTrader && !baroActive && new Date(data.voidTrader.activation).getTime() > now;

    const cp = data.constructionProgress;

    return (
        <div className="space-y-4">
            {calendarOpen && data.calendar && (
                <CalendarModal calendar={data.calendar} onClose={() => setCalendarOpen(false)} />
            )}

            {/* Cycles grid */}
            <section>
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open World Cycles</div>
                    {data.calendar && (
                        <button
                            onClick={() => setCalendarOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/40 px-2.5 py-1 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                            title="1999 Calendar"
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            1999 Calendar
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {cycles.map((c) => <CycleCard key={c.name} {...c} />)}
                    {data.duviriCycle && <DuviriCard cycle={data.duviriCycle} />}
                    {data.simaris && data.simaris.target && (
                        <SimarisCard target={data.simaris.target} isTargetActive={data.simaris.isTargetActive} />
                    )}
                </div>
            </section>

            {/* Baro + Varzia + Steel Path row */}
            <section>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Traders & Rewards</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">

                    {/* Baro Ki'Teer */}
                    {data.voidTrader && (
                        <div className={[
                            "rounded-xl border px-3 py-2.5",
                            baroActive
                                ? "border-amber-700/60 bg-amber-950/20"
                                : "border-slate-800 bg-slate-900/40",
                        ].join(" ")}>
                            <div className="text-[11px] text-slate-500 mb-0.5">Baro Ki'Teer</div>
                            <div className={["text-sm font-semibold mb-1", baroActive ? "text-amber-300" : "text-slate-400"].join(" ")}>
                                {baroActive ? "● Here Now" : "○ Away"}
                            </div>
                            <div className="text-[11px] text-slate-400">{data.voidTrader.location}</div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                {baroActive
                                    ? <>Leaves <Countdown expiry={data.voidTrader.expiry} className="font-mono text-slate-300" /></>
                                    : baroDue
                                        ? <>Arrives <Countdown expiry={data.voidTrader.activation} className="font-mono text-slate-300" /></>
                                        : null
                                }
                            </div>
                            {baroActive && data.voidTrader.inventory.length > 0 && (
                                <div className="mt-1.5 text-[10px] text-amber-400/80">
                                    {data.voidTrader.inventory.length} items available
                                </div>
                            )}
                            {!baroActive && data.voidTrader.schedule.length > 0 && (
                                <div className="mt-1.5 space-y-0.5">
                                    {data.voidTrader.schedule.slice(0, 3).map((s, i) => (
                                        <div key={i} className="text-[10px] text-slate-500">
                                            {s.item && <span className="text-slate-400 mr-1">{s.item}</span>}
                                            <Countdown expiry={s.expiry} className="font-mono text-slate-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Varzia (Vault Trader) */}
                    {data.vaultTrader && (
                        <div className={[
                            "rounded-xl border px-3 py-2.5",
                            data.vaultTrader.active
                                ? "border-violet-700/60 bg-violet-950/20"
                                : "border-slate-800 bg-slate-900/40",
                        ].join(" ")}>
                            <div className="text-[11px] text-slate-500 mb-0.5">Varzia (Primed Resurgence)</div>
                            <div className={["text-sm font-semibold mb-1", data.vaultTrader.active ? "text-violet-300" : "text-slate-400"].join(" ")}>
                                {data.vaultTrader.active ? "● Active" : "○ Inactive"}
                            </div>
                            {data.vaultTrader.location && (
                                <div className="text-[11px] text-slate-400">{data.vaultTrader.location}</div>
                            )}
                            <div className="text-[10px] text-slate-500 mt-1">
                                {data.vaultTrader.active && data.vaultTrader.expiry
                                    ? <>Ends <Countdown expiry={data.vaultTrader.expiry} className="font-mono text-slate-300" /></>
                                    : data.vaultTrader.activation
                                        ? <>Next <Countdown expiry={data.vaultTrader.activation} className="font-mono text-slate-300" /></>
                                        : null
                                }
                            </div>
                        </div>
                    )}

                    {/* Steel Path current reward */}
                    {data.steelPath?.currentReward && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                            <div className="text-[11px] text-slate-500 mb-0.5">Steel Path Honor</div>
                            <div className="text-sm font-semibold text-slate-200 mb-0.5">
                                {data.steelPath.currentReward.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                                {data.steelPath.currentReward.cost} Steel Essence
                            </div>
                            {data.steelPath.expiry && (
                                <div className="text-[10px] text-slate-500 mt-1">
                                    Rotates <Countdown expiry={data.steelPath.expiry} className="font-mono text-slate-300" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Darvo daily deal */}
                    {data.dailyDeals.length > 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                            <div className="text-[11px] text-slate-500 mb-0.5">Darvo Deal</div>
                            <div className="text-sm font-semibold text-slate-200 mb-0.5 truncate">
                                {data.dailyDeals[0].item}
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-green-400 font-semibold">{data.dailyDeals[0].discount}% off</span>
                                <span className="text-slate-500 line-through">{data.dailyDeals[0].originalPrice.toLocaleString()}</span>
                                <span className="text-yellow-300">{data.dailyDeals[0].salePrice.toLocaleString()} ◈</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                {data.dailyDeals[0].sold}/{data.dailyDeals[0].total} sold ·{" "}
                                <Countdown expiry={data.dailyDeals[0].expiry} className="font-mono text-slate-300" />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Sortie + Archon + Construction */}
            <section>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Weekly & Daily</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">

                    {data.sortie && !data.sortie.expired && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                            <div className="text-[11px] text-slate-500 mb-0.5">Daily Sortie</div>
                            <div className={["text-sm font-semibold", FACTION_COLORS[data.sortie.faction] ?? "text-slate-200"].join(" ")}>
                                {data.sortie.boss}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{data.sortie.faction}</div>
                            {data.sortie.rewardPool && (
                                <span className="inline-block mt-1.5 rounded-full border border-amber-700/50 bg-amber-950/30 px-1.5 py-px text-[10px] text-amber-300">
                                    {data.sortie.rewardPool}
                                </span>
                            )}
                            <div className="text-[10px] text-slate-500 mt-1">
                                Resets <Countdown expiry={data.sortie.expiry} className="font-mono text-slate-300" />
                            </div>
                        </div>
                    )}

                    {data.archonHunt?.active && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                            <div className="text-[11px] text-slate-500 mb-0.5">Weekly Archon Hunt</div>
                            <div className={["text-sm font-semibold", FACTION_COLORS[data.archonHunt.faction] ?? "text-slate-200"].join(" ")}>
                                {data.archonHunt.boss}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{data.archonHunt.faction}</div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                Resets <Countdown expiry={data.archonHunt.expiry} className="font-mono text-slate-300" />
                            </div>
                        </div>
                    )}

                    {data.nightwave && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                            <div className="text-[11px] text-slate-500 mb-0.5">Nightwave</div>
                            <div className="text-sm font-semibold text-blue-300">Season {data.nightwave.season}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                                {data.nightwave.activeChallenges.length} active acts
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                Ends <Countdown expiry={data.nightwave.expiry} className="font-mono text-slate-300" />
                            </div>
                        </div>
                    )}

                    {cp && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                            <div className="text-[11px] text-slate-500 mb-1.5">Construction Progress</div>
                            <div className="space-y-1.5">
                                {[
                                    { label: "Fomorian", value: cp.fomorianProgress, color: "bg-red-500/60",  text: "text-red-400"  },
                                    { label: "Razorback", value: cp.razorbackProgress, color: "bg-blue-500/60", text: "text-blue-400" },
                                    ...(parseFloat(cp.unknownProgress) > 0
                                        ? [{ label: "Unknown", value: cp.unknownProgress, color: "bg-slate-500/60", text: "text-slate-400" }]
                                        : []),
                                ].map(({ label, value, color, text }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-[11px] mb-0.5">
                                            <span className={text}>{label}</span>
                                            <span className="text-slate-300 font-mono">{parseFloat(value).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, parseFloat(value))}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Active global boosters */}
            {data.globalUpgrades.length > 0 && (
                <section>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Boosters</div>
                    <div className="flex flex-wrap gap-2">
                        {data.globalUpgrades.map((g, i) => (
                            <div key={i} className="rounded-xl border border-green-800/40 bg-green-950/20 px-3 py-2">
                                <div className="text-xs font-semibold text-green-300">{g.desc || `${g.operationSymbol}${g.upgradeOperationValue} ${g.upgrade}`}</div>
                                {g.expiry && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                        Ends <Countdown expiry={g.expiry} className="font-mono text-slate-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Sentient Outpost */}
            {data.sentientOutposts?.active && (
                <section>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sentient Outpost</div>
                    <div className="rounded-xl border border-rose-800/50 bg-rose-950/20 px-3 py-2.5 inline-flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold text-rose-300">● Active</span>
                        {data.sentientOutposts.mission && (
                            <>
                                <span className="text-[11px] text-slate-300">{data.sentientOutposts.mission.type}</span>
                                <span className="text-[11px] text-slate-500">{data.sentientOutposts.mission.node}</span>
                                <span className={["text-[11px] font-medium", FACTION_COLORS[data.sentientOutposts.mission.faction] ?? "text-slate-400"].join(" ")}>
                                    {data.sentientOutposts.mission.faction}
                                </span>
                            </>
                        )}
                        {data.sentientOutposts.expiry && (
                            <span className="text-[10px] text-slate-500 ml-auto">
                                Ends <Countdown expiry={data.sentientOutposts.expiry} className="font-mono text-slate-400" />
                            </span>
                        )}
                    </div>
                </section>
            )}

            {/* News */}
            {data.news.length > 0 && (
                <section>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">News</div>
                    <div className="space-y-1.5">
                        {data.news.slice(0, 5).map((n, i) => (
                            <a
                                key={i}
                                href={n.link || undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 hover:bg-slate-800/60 transition-colors group"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                        {n.update && (
                                            <span className="rounded border border-blue-700/50 bg-blue-950/30 px-1 py-px text-[9px] font-bold text-blue-300">UPDATE</span>
                                        )}
                                        {n.primeAccess && (
                                            <span className="rounded border border-amber-700/50 bg-amber-950/30 px-1 py-px text-[9px] font-bold text-amber-300">PRIME</span>
                                        )}
                                        {n.stream && (
                                            <span className="rounded border border-violet-700/50 bg-violet-950/30 px-1 py-px text-[9px] font-bold text-violet-300">STREAM</span>
                                        )}
                                        <span className="text-xs text-slate-200 group-hover:text-slate-100 truncate">{n.message}</span>
                                    </div>
                                    {n.date && (
                                        <div className="text-[10px] text-slate-500">
                                            {new Date(n.date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                {n.link && (
                                    <svg className="w-3 h-3 shrink-0 text-slate-600 group-hover:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>
                                )}
                            </a>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

// ── Fissures tab ──────────────────────────────────────────────────────────────

function FissuresTab({ fissures }: { fissures: Fissure[] }) {
    const now = useNow();
    const [tierFilter, setTierFilter] = useState<string>("All");
    const [showSteel,  setShowSteel]  = useState(false);
    const [showStorm,  setShowStorm]  = useState(true);

    const active = fissures.filter((f) => !f.expired);
    const tiers  = ["All", ...TIER_ORDER.filter((t) => active.some((f) => f.tier === t))];

    const shown = active
        .filter((f) => {
            if (tierFilter !== "All" && f.tier !== tierFilter) return false;
            if (!showSteel && f.isHard) return false;
            if (!showStorm && f.isStorm) return false;
            return true;
        })
        .sort((a, b) => a.tierNum - b.tierNum || new Date(a.expiry).getTime() - new Date(b.expiry).getTime());

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex flex-wrap gap-1">
                    {tiers.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTierFilter(t)}
                            className={[
                                "rounded-full border px-2 py-px text-[11px] font-semibold transition-colors",
                                tierFilter === t
                                    ? "bg-slate-100 text-slate-900 border-slate-100"
                                    : t === "All"
                                        ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                                        : `${TIER_COLORS[t] ?? "border-slate-700 text-slate-300"} bg-transparent hover:opacity-80`,
                            ].join(" ")}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-400">
                        <input type="checkbox" checked={showStorm} onChange={e => setShowStorm(e.target.checked)} className="rounded" />
                        Storm
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-400">
                        <input type="checkbox" checked={showSteel} onChange={e => setShowSteel(e.target.checked)} className="rounded" />
                        Steel Path
                    </label>
                </div>
            </div>

            <div className="text-[11px] text-slate-500 mb-2">{active.length} active fissures · showing {shown.length}</div>

            {shown.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">No fissures match the current filter.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {shown.map((f) => {
                        const ageMs = f.activation ? now - new Date(f.activation).getTime() : 0;
                        const ageMins = ageMs > 0 ? Math.floor(ageMs / 60000) : null;
                        return (
                            <div key={f.id} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 flex items-start gap-2.5">
                                <span className={["shrink-0 mt-0.5 rounded-full border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide", TIER_COLORS[f.tier] ?? "border-slate-700 text-slate-400"].join(" ")}>
                                    {f.tier}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1 text-xs text-slate-200 font-medium">
                                        {f.missionType}
                                        {f.isStorm && <span className="text-[10px] text-cyan-400 font-semibold">STORM</span>}
                                        {f.isHard  && <span className="text-[10px] text-red-400 font-semibold">SP</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{f.node}</div>
                                    <div className="text-[10px] text-slate-500">{f.enemy}</div>
                                    {ageMins !== null && ageMins >= 0 && (
                                        <div className="text-[10px] text-slate-600 mt-0.5">
                                            up {ageMins >= 60 ? `${Math.floor(ageMins / 60)}h ${ageMins % 60}m` : `${ageMins}m`}
                                        </div>
                                    )}
                                </div>
                                <Countdown expiry={f.expiry} className="shrink-0 font-mono text-[10px] text-slate-400 text-right" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Archimedea card ────────────────────────────────────────────────────────────

const ARCHIMEDEA_TAG_LABELS: Record<string, string> = {
    "C T_ L A B": "Temporal Archimedea",
    "C T_ H E X": "The Hex",
};

function ArchimedeaCard({ arch }: { arch: Archimedea }) {
    const title = ARCHIMEDEA_TAG_LABELS[arch.tag] ?? arch.tag;
    const allModifiers = [
        ...(arch.personalModifiers ?? []),
        ...(arch.deviations ?? []),
        ...(arch.risks ?? []),
    ];

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
                <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide">{title}</div>
                {arch.endDate && (
                    <div className="text-[10px] text-slate-500">
                        Ends <Countdown expiry={arch.endDate} className="font-mono text-slate-400" />
                    </div>
                )}
            </div>
            <div className="p-3 space-y-3">
                {/* Missions */}
                {arch.variants.length > 0 && (
                    <div className="space-y-1.5">
                        {arch.variants.map((v, i) => (
                            <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="text-xs font-medium text-slate-200">{v.type}</div>
                                        <div className="text-[10px] text-slate-500">{v.node}</div>
                                    </div>
                                    {v.modifier && (
                                        <span className="shrink-0 rounded-full border border-orange-700/50 bg-orange-950/20 px-1.5 py-px text-[10px] text-orange-300">
                                            {v.modifier}
                                        </span>
                                    )}
                                </div>
                                {v.modifierDescription && (
                                    <div className="mt-1.5 text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5 leading-relaxed">
                                        {v.modifierDescription}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {/* Modifiers / Deviations / Risks */}
                {allModifiers.length > 0 && (
                    <div>
                        <div className="text-[10px] text-slate-500 mb-1.5">Active Modifiers</div>
                        <div className="flex flex-wrap gap-1">
                            {allModifiers.map((m, i) => (
                                <span
                                    key={i}
                                    title={m.description}
                                    className="rounded-full border border-cyan-700/40 bg-cyan-950/20 px-2 py-px text-[10px] text-cyan-300 cursor-default"
                                >
                                    {m.tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Missions tab ──────────────────────────────────────────────────────────────

function MissionsTab({ data }: { data: WorldStateData }) {
    const activeArchs = data.archimedeas.filter((a) => !a.expired);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Sortie */}
            {data.sortie && !data.sortie.expired && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
                        <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide">Daily Sortie</div>
                        <div className="text-[10px] text-slate-500">
                            Resets <Countdown expiry={data.sortie.expiry} className="font-mono text-slate-400" />
                        </div>
                    </div>
                    <div className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs mb-3">
                            <span className={[FACTION_COLORS[data.sortie.faction] ?? "text-slate-300", "font-semibold"].join(" ")}>
                                {data.sortie.faction}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400">{data.sortie.boss}</span>
                            {data.sortie.rewardPool && (
                                <span className="rounded-full border border-amber-700/50 bg-amber-950/30 px-1.5 py-px text-[10px] text-amber-300">
                                    {data.sortie.rewardPool}
                                </span>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            {data.sortie.variants.map((v, i) => (
                                <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <div className="text-xs font-medium text-slate-200">{v.missionType}</div>
                                            <div className="text-[10px] text-slate-500">{v.node}</div>
                                        </div>
                                        {v.modifier && (
                                            <span className="shrink-0 rounded-full border border-orange-700/50 bg-orange-950/20 px-1.5 py-px text-[10px] text-orange-300">
                                                {v.modifier}
                                            </span>
                                        )}
                                    </div>
                                    {v.modifierDescription && (
                                        <div className="mt-1.5 text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5 leading-relaxed">
                                            {v.modifierDescription}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Archon Hunt */}
            {data.archonHunt?.active && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
                        <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide">Weekly Archon Hunt</div>
                        <div className="text-[10px] text-slate-500">
                            Resets <Countdown expiry={data.archonHunt.expiry} className="font-mono text-slate-400" />
                        </div>
                    </div>
                    <div className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs mb-3">
                            <span className={[FACTION_COLORS[data.archonHunt.faction] ?? "text-slate-300", "font-semibold"].join(" ")}>
                                {data.archonHunt.faction}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400">{data.archonHunt.boss}</span>
                        </div>
                        <div className="space-y-1.5">
                            {data.archonHunt.missions.map((m, i) => (
                                <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2">
                                    <span className="w-5 h-5 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <div className="text-xs font-medium text-slate-200">{m.type}</div>
                                        <div className="text-[10px] text-slate-500">{m.node}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Nightwave challenges */}
            {/* Archimedeas */}
            {activeArchs.map((arch) => (
                <ArchimedeaCard key={arch.id} arch={arch} />
            ))}

            {/* Arbitration */}
            {data.arbitration && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
                        <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide">Arbitration</div>
                        <div className="text-[10px] text-slate-500">
                            Rotates <Countdown expiry={data.arbitration.expiry} className="font-mono text-slate-400" />
                        </div>
                    </div>
                    <div className="p-3 flex items-center gap-3">
                        <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-200">{data.arbitration.type}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{data.arbitration.node}</div>
                            <div className={["text-[10px] font-medium mt-0.5", FACTION_COLORS[data.arbitration.enemy] ?? "text-slate-400"].join(" ")}>
                                {data.arbitration.enemy}
                            </div>
                        </div>
                        {data.arbitration.isSteel && (
                            <span className="ml-auto shrink-0 rounded-full border border-red-700/50 bg-red-950/20 px-2 py-px text-[10px] font-bold text-red-300">SP</span>
                        )}
                    </div>
                </div>
            )}

            {/* Kuva Siphons & Floods */}
            {data.kuva.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden lg:col-span-2">
                    <div className="px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
                        <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide">Live Kuva Missions</div>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {data.kuva.map((k, i) => (
                            <div key={i} className={[
                                "rounded-lg border px-2.5 py-2",
                                k.isFlood
                                    ? "border-violet-800/40 bg-violet-950/10"
                                    : "border-slate-800 bg-slate-900/40",
                            ].join(" ")}>
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <span className={["text-xs font-medium", k.isFlood ? "text-violet-300" : "text-slate-200"].join(" ")}>
                                                {k.isFlood ? "Kuva Flood" : "Kuva Siphon"}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{k.node}</div>
                                        <div className="text-[10px] text-slate-400">{k.type}</div>
                                    </div>
                                    <Countdown expiry={k.expiry} className="shrink-0 font-mono text-[10px] text-slate-400 text-right" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.nightwave && data.nightwave.activeChallenges.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden lg:col-span-2">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
                        <div>
                            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                                Nightwave — Season {data.nightwave.season}
                                {data.nightwave.tag && <span className="normal-case font-normal text-slate-400 ml-1">· {data.nightwave.tag}</span>}
                            </div>
                            {data.nightwave.phase > 0 && (
                                <div className="text-[10px] text-slate-500 mt-0.5">Phase {data.nightwave.phase + 1}</div>
                            )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                            Ends <Countdown expiry={data.nightwave.expiry} className="font-mono text-slate-400" />
                        </div>
                    </div>
                    <div className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {data.nightwave.activeChallenges
                                .slice()
                                .sort((a, b) => {
                                    if (a.isElite !== b.isElite) return a.isElite ? -1 : 1;
                                    if (a.isPermanent !== b.isPermanent) return a.isPermanent ? 1 : -1;
                                    if (a.isDaily !== b.isDaily) return a.isDaily ? 1 : -1;
                                    return b.reputation - a.reputation;
                                })
                                .map((act) => (
                                    <div key={act.id} className="rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1 mb-0.5">
                                                    {act.isElite && (
                                                        <span className="rounded border border-amber-700/50 bg-amber-950/30 px-1 py-px text-[9px] font-bold text-amber-300">ELITE</span>
                                                    )}
                                                    {act.isPermanent && (
                                                        <span className="rounded border border-teal-700/50 bg-teal-950/30 px-1 py-px text-[9px] font-bold text-teal-300">STANDING</span>
                                                    )}
                                                    {act.isDaily && !act.isPermanent && (
                                                        <span className="rounded border border-sky-700/50 bg-sky-950/30 px-1 py-px text-[9px] font-bold text-sky-300">DAILY</span>
                                                    )}
                                                    {!act.isDaily && !act.isElite && !act.isPermanent && (
                                                        <span className="rounded border border-slate-700 bg-slate-800/60 px-1 py-px text-[9px] font-bold text-slate-400">WEEKLY</span>
                                                    )}
                                                    <span className="text-xs font-medium text-slate-200">{act.title}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500">{act.desc}</div>
                                                {!act.isPermanent && act.expiry && (
                                                    <div className="text-[10px] text-slate-600 mt-0.5">
                                                        <Countdown expiry={act.expiry} className="font-mono" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <div className="text-xs font-bold text-blue-300">{act.reputation.toLocaleString()}</div>
                                                <div className="text-[9px] text-slate-500">rep</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Events tab ────────────────────────────────────────────────────────────────

function EventsTab({ data }: { data: WorldStateData }) {
    const hasEvents    = data.events.length > 0;
    const hasInvasions = data.invasions.length > 0;
    const hasAcolytes  = data.persistentEnemies.length > 0;
    const toggleInvasionDone = useTrackerStore((s) => s.toggleInvasionDone);
    const isInvasionDone     = useTrackerStore((s) => s.isInvasionDone);

    return (
        <div className="space-y-4">
            {/* Active Events */}
            {hasEvents && (
                <section>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Active Events ({data.events.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.events.map((ev) => {
                            const title = ev.description || ev.tooltip || "Active Event";
                            const subtitle = ev.tooltip && ev.description && ev.tooltip !== ev.description ? ev.tooltip : null;
                            const location = ev.node || ev.victimNode;
                            const hasProgress = ev.currentScore != null && ev.maximumScore != null && ev.maximumScore > 0;
                            const pct = hasProgress ? Math.min(100, (ev.currentScore! / ev.maximumScore!) * 100) : null;
                            return (
                                <div key={ev.id} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                                    {/* Header: title + countdown */}
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="min-w-0">
                                            <div className="text-xs font-medium text-slate-200 leading-tight">{title}</div>
                                            {subtitle && (
                                                <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>
                                            )}
                                        </div>
                                        {ev.expiry && (
                                            <Countdown expiry={ev.expiry} className="shrink-0 font-mono text-[10px] text-slate-400" />
                                        )}
                                    </div>

                                    {/* Location */}
                                    {location && (
                                        <div className="text-[10px] text-slate-500 mb-1">
                                            {ev.affiliatedWith && <span className="text-slate-400">{ev.affiliatedWith} · </span>}
                                            {location}
                                        </div>
                                    )}

                                    {/* Score progress bar (e.g. Thermia Fractures) */}
                                    {hasProgress && (
                                        <div className="mb-1.5">
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                                <span>{ev.scoreLocTag || "Progress"}</span>
                                                <span className="font-mono">{ev.currentScore!.toLocaleString()} / {ev.maximumScore!.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500/70 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Health bar (e.g. Ghoul Purge) */}
                                    {!hasProgress && ev.health != null && (
                                        <div className="mb-1.5">
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                                <span>Progress</span>
                                                <span className="font-mono">{ev.health.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500/70 rounded-full" style={{ width: `${Math.min(100, ev.health)}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Final rewards */}
                                    {ev.rewards.length > 0 && (
                                        <div className="text-[10px] text-amber-300/80 leading-snug">
                                            {ev.rewards.map((r, i) => <span key={i}>{i > 0 ? " · " : ""}{r.asString}</span>)}
                                        </div>
                                    )}

                                    {/* Interim milestone rewards */}
                                    {ev.interimSteps.length > 0 && (
                                        <div className="mt-1.5 space-y-0.5 border-t border-slate-800/60 pt-1.5">
                                            {ev.interimSteps.map((step, i) => (
                                                <div key={i} className="flex items-baseline gap-1.5 text-[10px]">
                                                    <span className={[
                                                        "shrink-0 font-mono",
                                                        hasProgress && ev.currentScore! >= step.goal
                                                            ? "text-green-500/70 line-through"
                                                            : "text-slate-500"
                                                    ].join(" ")}>
                                                        @{step.goal}
                                                    </span>
                                                    <span className={[
                                                        hasProgress && ev.currentScore! >= step.goal
                                                            ? "text-slate-600 line-through"
                                                            : "text-slate-400"
                                                    ].join(" ")}>
                                                        {step.reward.asString}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Invasions */}
            {hasInvasions && (() => {
                const sorted = processInvasions(data.invasions).sort((a, b) => {
                    const aDone = isInvasionDone(a.id) ? 1 : 0;
                    const bDone = isInvasionDone(b.id) ? 1 : 0;
                    return aDone - bDone;
                });
                const doneCount = sorted.filter((inv) => isInvasionDone(inv.id)).length;
                return (
                    <section>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Invasions ({sorted.length}
                            {doneCount > 0 && <span className="text-green-500/80"> · {doneCount} done</span>})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sorted.map((inv) => {
                                const done = isInvasionDone(inv.id);
                                if (done) {
                                    return (
                                        <div key={inv.id} className="rounded-xl border border-green-900/40 bg-green-950/10 px-3 py-2 flex items-center gap-2">
                                            <span className="text-green-500 text-sm shrink-0">✓</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-xs text-slate-500 truncate">{inv.displayLabel}</span>
                                                    <span className="shrink-0 font-mono text-[10px] text-slate-600">{inv.completion.toFixed(1)}%</span>
                                                    {inv.requiredRuns > 0 && (
                                                        <span className="shrink-0 font-mono text-[10px] text-slate-600">
                                                            {Math.round(inv.completion / 100 * inv.requiredRuns).toLocaleString()}/{inv.requiredRuns.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className={["h-full rounded-full opacity-40", inv.vsInfestation ? "bg-green-600" : "bg-red-600"].join(" ")}
                                                        style={{ width: `${Math.min(100, Math.max(0, inv.completion))}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleInvasionDone(inv.id)}
                                                className="shrink-0 text-[10px] text-slate-600 hover:text-slate-400 transition-colors px-1"
                                                title="Mark as not done"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={inv.id} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="text-xs font-medium text-slate-200 min-w-0">{inv.displayLabel}</div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="font-mono text-[10px] text-slate-400">{inv.completion.toFixed(1)}%</span>
                                                {inv.requiredRuns > 0 && (
                                                    <span className="font-mono text-[10px] text-slate-500">
                                                        {Math.round(inv.completion / 100 * inv.requiredRuns).toLocaleString()}/{inv.requiredRuns.toLocaleString()}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => toggleInvasionDone(inv.id)}
                                                    className="text-[10px] text-slate-600 hover:text-green-400 transition-colors px-1 py-0.5 rounded border border-transparent hover:border-green-800/50"
                                                    title="Mark as done"
                                                >
                                                    ✓
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                                            <div
                                                className={["h-full rounded-full", inv.vsInfestation ? "bg-green-600/70" : "bg-red-600/70"].join(" ")}
                                                style={{ width: `${Math.min(100, Math.max(0, inv.completion))}%` }}
                                            />
                                        </div>
                                        {/* Attacker vs Defender with rewards */}
                                        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-1 text-[10px]">
                                            <div>
                                                <div className={["font-semibold flex items-center gap-1", FACTION_COLORS[inv.attackingFaction] ?? "text-slate-400"].join(" ")}>
                                                    {inv.isAttackerWinning && <span title="Winning">▲</span>}
                                                    {inv.attackingFaction}
                                                </div>
                                                {inv.attackerReward?.asString
                                                    ? <div className="text-amber-300/80 mt-0.5 leading-tight">{inv.attackerReward.asString}</div>
                                                    : inv.rewardTypes.length > 0 && <div className="text-slate-500 mt-0.5">{inv.rewardTypes.join(", ")}</div>
                                                }
                                            </div>
                                            <div className="text-slate-600 pt-0.5 text-center">vs</div>
                                            <div className="text-right">
                                                <div className={["font-semibold flex items-center justify-end gap-1", FACTION_COLORS[inv.defendingFaction] ?? "text-slate-400"].join(" ")}>
                                                    {inv.defendingFaction}
                                                    {!inv.isAttackerWinning && <span title="Winning">▲</span>}
                                                </div>
                                                {inv.defenderReward?.asString && (
                                                    <div className="text-amber-300/80 mt-0.5 leading-tight">{inv.defenderReward.asString}</div>
                                                )}
                                            </div>
                                        </div>
                                        {inv.desc && (
                                            <div className="text-[10px] text-slate-500 mt-1.5 border-t border-slate-800/60 pt-1">{inv.desc}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })()}

            {/* Baro inventory if active */}
            {data.voidTrader?.active && data.voidTrader.inventory.length > 0 && (
                <section>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Baro Ki'Teer Inventory
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {data.voidTrader.inventory.map((item, i) => (
                            <div key={i} className="rounded-xl border border-amber-800/30 bg-amber-950/10 px-3 py-2 flex items-center justify-between gap-2">
                                <div className="text-xs text-slate-200 truncate min-w-0">{item.item}</div>
                                <div className="shrink-0 text-right text-[10px] whitespace-nowrap">
                                    <span className="text-amber-300">{item.ducats.toLocaleString()} duc</span>
                                    <span className="text-slate-600 mx-0.5">+</span>
                                    <span className="text-yellow-200">{item.credits.toLocaleString()} cr</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Varzia inventory if active */}
            {data.vaultTrader?.active && data.vaultTrader.inventory.length > 0 && (
                <section>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Varzia Inventory
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {data.vaultTrader.inventory.map((item, i) => (
                            <div key={i} className="rounded-xl border border-violet-800/30 bg-violet-950/10 px-3 py-2 flex items-center justify-between gap-2">
                                <div className="text-xs text-slate-200 truncate min-w-0">{item.item}</div>
                                {item.credits && (
                                    <div className="shrink-0 text-[10px] text-yellow-200 whitespace-nowrap">
                                        {item.credits.toLocaleString()} cr
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Acolytes */}
            {hasAcolytes && (
                <section>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Acolytes ({data.persistentEnemies.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.persistentEnemies.map((enemy, i) => (
                            <div key={i} className={[
                                "rounded-xl border px-3 py-2.5",
                                enemy.isDiscovered
                                    ? "border-rose-800/50 bg-rose-950/10"
                                    : "border-slate-800 bg-slate-900/40",
                            ].join(" ")}>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={["w-2 h-2 rounded-full shrink-0", enemy.isDiscovered ? "bg-rose-400" : "bg-slate-600"].join(" ")} />
                                            <span className="text-xs font-semibold text-slate-200">{enemy.agentType}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                            {enemy.isDiscovered ? `Last seen: ${enemy.lastDiscoveredAt}` : "Not yet located"}
                                        </div>
                                        {enemy.region && (
                                            <div className="text-[10px] text-slate-500">{enemy.region}</div>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-bold text-rose-300">{enemy.healthPercent.toFixed(1)}%</div>
                                        <div className="text-[9px] text-slate-500">health</div>
                                        {enemy.rank > 0 && (
                                            <div className="text-[10px] text-slate-500 mt-0.5">Rank {enemy.rank}</div>
                                        )}
                                    </div>
                                </div>
                                {enemy.healthPercent > 0 && (
                                    <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-rose-600/70 rounded-full"
                                            style={{ width: `${Math.min(100, enemy.healthPercent)}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {!hasEvents && !hasInvasions && !hasAcolytes && (
                <div className="py-8 text-center text-sm text-slate-500">No active events or invasions.</div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type LoadState = "idle" | "loading" | "ok" | "error";

export default function WorldState() {
    const [loadState, setLoadState] = useState<LoadState>("idle");
    const [error, setError]         = useState<string | null>(null);
    const [data, setData]           = useState<WorldStateData | null>(null);
    const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const abortRef = useRef<AbortController | null>(null);

    const refresh = useCallback(async (force = false) => {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoadState("loading");
        setError(null);
        try {
            const d = await fetchWorldState(force);
            if (ac.signal.aborted) return;
            setData(d);
            setFetchedAt(new Date());
            setLoadState("ok");
        } catch (e: any) {
            if (ac.signal.aborted) return;
            setError(e.message ?? "Failed to load.");
            setLoadState("error");
        }
    }, []);

    useEffect(() => {
        refresh();
        const id = setInterval(() => refresh(), 5 * 60 * 1000);
        return () => { clearInterval(id); abortRef.current?.abort(); };
    }, [refresh]);

    return (
        <div className="flex flex-col gap-3 pb-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                    <div className="text-lg font-semibold">World State</div>
                    <div className="text-sm text-slate-400">
                        Live cycles, missions, fissures, and events from warframestat.us
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {fetchedAt && (
                        <span className="text-[11px] text-slate-500">updated {fetchedAt.toLocaleTimeString()}</span>
                    )}
                    <button
                        onClick={() => refresh(true)}
                        disabled={loadState === "loading"}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                        <svg
                            className={["w-3.5 h-3.5", loadState === "loading" ? "animate-spin" : ""].join(" ")}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"
                        >
                            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4" />
                        </svg>
                        {loadState === "loading" ? "Loading…" : "Refresh"}
                    </button>
                </div>
            </div>

            {/* Loading (first load) */}
            {loadState === "loading" && !data && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4" />
                    </svg>
                    Fetching world state…
                </div>
            )}

            {/* Error */}
            {loadState === "error" && !data && (
                <div className="rounded-xl border border-rose-800/50 bg-rose-950/20 p-4 text-xs text-rose-300 space-y-2">
                    <div className="font-semibold">Failed to load world state</div>
                    <p className="text-rose-400/80">{error}</p>
                    <p className="text-rose-500">The warframestat.us API may be temporarily unavailable.</p>
                    <button
                        onClick={() => refresh(true)}
                        className="rounded-lg border border-rose-700/50 px-3 py-1.5 text-[11px] text-rose-300 hover:bg-rose-950/40 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Content */}
            {data && (
                <>
                    {/* Tabs */}
                    <div className="flex gap-0.5 rounded-xl border border-slate-800 bg-slate-900/40 p-1 w-fit">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={[
                                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                    activeTab === tab.key
                                        ? "bg-slate-800 text-slate-100"
                                        : "text-slate-400 hover:text-slate-200",
                                ].join(" ")}
                            >
                                {tab.label}
                                {tab.key === "fissures" && (
                                    <span className="ml-1.5 rounded-full bg-slate-700/60 px-1 text-[10px] text-slate-300">
                                        {data.fissures.filter(f => !f.expired && !f.isHard).length}
                                    </span>
                                )}
                                {tab.key === "events" && data.events.length > 0 && (
                                    <span className="ml-1.5 rounded-full bg-blue-900/60 px-1 text-[10px] text-blue-300">
                                        {data.events.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div>
                        {activeTab === "overview"  && <OverviewTab  data={data} />}
                        {activeTab === "fissures"  && <FissuresTab  fissures={data.fissures} />}
                        {activeTab === "missions"  && <MissionsTab  data={data} />}
                        {activeTab === "events"    && <EventsTab    data={data} />}
                    </div>
                </>
            )}
        </div>
    );
}
