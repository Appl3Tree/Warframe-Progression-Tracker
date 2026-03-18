// src/components/DashboardWorldState.tsx
// Live World State embedded in the Dashboard — cycles, sortie, archon hunt,
// Baro Ki'Teer, active events, fissures, nightwave.
// Data from https://api.warframestat.us (community API, no auth required).
// Fetches the full /pc endpoint in a single request to avoid sub-endpoint issues.

import { useCallback, useEffect, useRef, useState } from "react";

// ── API types ─────────────────────────────────────────────────────────────────

type WsCycle = {
    state: string;
    expiry: string;
    timeLeft: string;
};

type SortieMission = {
    missionType: string;
    modifier: string;
    modifierDescription: string;
    node: string;
};

type Sortie = {
    boss: string;
    faction: string;
    rewardPool: string;
    variants: SortieMission[];
    expiry: string;
    expired: boolean;
};

type ArchonMission = { node: string; type: string };

type ArchonHunt = {
    boss: string;
    faction: string;
    missions: ArchonMission[];
    expiry: string;
    active: boolean;
};

type Fissure = {
    id: string;
    node: string;
    missionType: string;
    tier: string;
    tierNum: number;
    expiry: string;
    eta: string;
    isStorm: boolean;
    isHard: boolean;
    enemy: string;
    expired: boolean;
};

type NightwaveAct = {
    id: string;
    isDaily: boolean;
    isElite: boolean;
    desc: string;
    title: string;
    reputation: number;
    expiry: string;
};

type Nightwave = {
    season: number;
    activeChallenges: NightwaveAct[];
    expiry: string;
};

type TraderItem = {
    item: string;
    ducats: number;
    credits: number;
};

type VoidTrader = {
    active: boolean;
    character: string;
    location: string;
    inventory: TraderItem[];
    activation: string;
    expiry: string;
};

type WsEvent = {
    id: string;
    description: string;
    tooltip: string;
    expiry: string;
    active: boolean;
};

type WorldStateData = {
    cetusCycle:   WsCycle;
    valesCycle:   WsCycle;
    cambionCycle: WsCycle;
    zarimanCycle: WsCycle;
    sortie:       Sortie;
    archonHunt:   ArchonHunt;
    fissures:     Fissure[];
    nightwave:    Nightwave | null;
    voidTrader:   VoidTrader | null;
    events:       WsEvent[];
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

const API = "https://api.warframestat.us/pc";

async function fetchWorldState(): Promise<WorldStateData> {
    const res = await fetch(`${API}?language=en`);
    if (!res.ok) throw new Error(`World state API returned ${res.status}`);
    const j = await res.json();
    return {
        cetusCycle:   j.cetusCycle,
        valesCycle:   j.valesCycle,
        cambionCycle: j.cambionCycle,
        zarimanCycle: j.zarimanCycle,
        sortie:       j.sortie,
        archonHunt:   j.archonHunt,
        fissures:     Array.isArray(j.fissures)  ? j.fissures  : [],
        nightwave:    j.nightwave  ?? null,
        voidTrader:   j.voidTrader ?? null,
        events:       Array.isArray(j.events)
            ? (j.events as WsEvent[]).filter((e) => e.active !== false)
            : [],
    };
}

// ── Time ──────────────────────────────────────────────────────────────────────

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

// ── Visuals ───────────────────────────────────────────────────────────────────

const CYCLE_VISUALS: Record<string, { label: string; color: string; icon: string }> = {
    day:     { label: "Day",             color: "text-amber-400",  icon: "☀️" },
    night:   { label: "Night",           color: "text-blue-400",   icon: "🌙" },
    warm:    { label: "Warm",            color: "text-orange-400", icon: "🔥" },
    cold:    { label: "Cold",            color: "text-cyan-400",   icon: "❄️" },
    fass:    { label: "Fass",            color: "text-red-400",    icon: "🔴" },
    vome:    { label: "Vome",            color: "text-violet-400", icon: "🟣" },
    grineer: { label: "Grineer Control", color: "text-red-400",    icon: "⚔️" },
    corpus:  { label: "Corpus Control",  color: "text-blue-400",   icon: "🔷" },
};

function getVisual(state: string) {
    return CYCLE_VISUALS[state.toLowerCase()] ?? { label: state, color: "text-slate-300", icon: "•" };
}

const FACTION_COLORS: Record<string, string> = {
    Grineer:   "text-red-400",
    Corpus:    "text-blue-400",
    Infested:  "text-green-400",
    Corrupted: "text-violet-400",
    Orokin:    "text-violet-400",
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

// ── Sub-components ────────────────────────────────────────────────────────────

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{title}</div>
                {aside}
            </div>
            <div className="p-3">{children}</div>
        </div>
    );
}

function CyclesPanel({ data }: { data: WorldStateData }) {
    const cycles = [
        { loc: "Plains of Eidolon", cycle: data.cetusCycle,   next: data.cetusCycle.state   === "day"  ? "Night" : "Day"  },
        { loc: "Orb Vallis",        cycle: data.valesCycle,   next: data.valesCycle.state   === "warm" ? "Cold"  : "Warm" },
        { loc: "Cambion Drift",     cycle: data.cambionCycle, next: data.cambionCycle.state === "fass" ? "Vome"  : "Fass" },
        { loc: "Zariman",           cycle: data.zarimanCycle, next: "Next" },
    ];
    return (
        <Panel title="Open World Cycles">
            <div className="space-y-2">
                {cycles.map(({ loc, cycle, next }) => {
                    const vis = getVisual(cycle.state);
                    return (
                        <div key={loc} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-slate-400 text-xs">{loc}</span>
                            <div className="text-right">
                                <span className={["font-semibold text-xs", vis.color].join(" ")}>
                                    {vis.icon} {vis.label}
                                </span>
                                <span className="text-slate-500 text-xs ml-1.5">
                                    → {next} <Countdown expiry={cycle.expiry} className="font-mono text-slate-300" />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
}

function SortiePanel({ sortie }: { sortie: Sortie }) {
    const color = FACTION_COLORS[sortie.faction] ?? "text-slate-300";
    return (
        <Panel
            title="Daily Sortie"
            aside={<div className="text-[10px] text-slate-500">Resets <Countdown expiry={sortie.expiry} className="font-mono text-slate-400" /></div>}
        >
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className={["font-semibold", color].join(" ")}>{sortie.faction}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{sortie.boss}</span>
                {sortie.rewardPool && (
                    <span className="rounded-full border border-amber-700/50 bg-amber-950/30 px-1.5 py-px text-[10px] text-amber-300">
                        {sortie.rewardPool}
                    </span>
                )}
            </div>
            <div className="space-y-1.5">
                {sortie.variants.map((v, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-1.5">
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
                ))}
            </div>
        </Panel>
    );
}

function ArchonPanel({ hunt }: { hunt: ArchonHunt }) {
    const color = FACTION_COLORS[hunt.faction] ?? "text-slate-300";
    return (
        <Panel
            title="Weekly Archon Hunt"
            aside={<div className="text-[10px] text-slate-500">Resets <Countdown expiry={hunt.expiry} className="font-mono text-slate-400" /></div>}
        >
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className={["font-semibold", color].join(" ")}>{hunt.faction}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{hunt.boss}</span>
            </div>
            <div className="space-y-1.5">
                {hunt.missions.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-1.5">
                        <span className="w-4 h-4 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {i + 1}
                        </span>
                        <div>
                            <div className="text-xs font-medium text-slate-200">{m.type}</div>
                            <div className="text-[10px] text-slate-500">{m.node}</div>
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function VoidTraderPanel({ trader }: { trader: VoidTrader }) {
    const now = useNow();
    const msUntilArrival  = new Date(trader.activation).getTime() - now;
    const msUntilDeparture = new Date(trader.expiry).getTime() - now;

    return (
        <Panel
            title="Baro Ki'Teer"
            aside={
                <div className="text-[10px] text-slate-500">
                    {trader.active
                        ? <>Leaves <Countdown expiry={trader.expiry} className="font-mono text-slate-400" /></>
                        : msUntilArrival > 0
                            ? <>Arrives <Countdown expiry={trader.activation} className="font-mono text-slate-400" /></>
                            : msUntilDeparture > 0
                                ? <>Leaves <Countdown expiry={trader.expiry} className="font-mono text-slate-400" /></>
                                : null
                    }
                </div>
            }
        >
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className={trader.active ? "font-semibold text-amber-300" : "text-slate-500"}>
                    {trader.active ? "● Available" : "○ Away"}
                </span>
                {trader.location && (
                    <>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">{trader.location}</span>
                    </>
                )}
            </div>

            {trader.active && trader.inventory.length > 0 ? (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    {trader.inventory.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-1.5">
                            <div className="text-xs font-medium text-slate-200 truncate min-w-0">{item.item}</div>
                            <div className="flex items-center gap-2 shrink-0 text-[10px] whitespace-nowrap">
                                <span className="text-amber-300">{item.ducats.toLocaleString()} duc</span>
                                <span className="text-slate-600">+</span>
                                <span className="text-yellow-200">{item.credits.toLocaleString()} cr</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : !trader.active ? (
                <div className="text-xs text-slate-500">
                    Next visit in <Countdown expiry={trader.activation} className="font-mono text-slate-400" />
                </div>
            ) : (
                <div className="text-xs text-slate-500">Inventory not yet available.</div>
            )}
        </Panel>
    );
}

function EventsPanel({ events }: { events: WsEvent[] }) {
    if (events.length === 0) return null;
    return (
        <Panel title={`Active Events (${events.length})`}>
            <div className="space-y-1.5">
                {events.map((ev) => (
                    <div key={ev.id} className="rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-xs font-medium text-slate-200">
                                    {ev.description || ev.tooltip || "Unnamed Event"}
                                </div>
                                {ev.tooltip && ev.description && ev.tooltip !== ev.description && (
                                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{ev.tooltip}</div>
                                )}
                            </div>
                            {ev.expiry && (
                                <Countdown expiry={ev.expiry} className="shrink-0 font-mono text-[10px] text-slate-400" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function FissuresPanel({ fissures }: { fissures: Fissure[] }) {
    const [tierFilter, setTierFilter] = useState<string>("All");
    const [showSteel, setShowSteel]   = useState(false);

    const active = fissures.filter((f) => !f.expired);
    const tiers  = ["All", ...TIER_ORDER.filter((t) => active.some((f) => f.tier === t))];

    const shown = active
        .filter((f) => {
            if (tierFilter !== "All" && f.tier !== tierFilter) return false;
            if (!showSteel && f.isHard) return false;
            return true;
        })
        .sort((a, b) => a.tierNum - b.tierNum || new Date(a.expiry).getTime() - new Date(b.expiry).getTime());

    return (
        <Panel title={`Void Fissures (${active.length} active)`}>
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                {tiers.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTierFilter(t)}
                        className={[
                            "rounded-full border px-2 py-px text-[10px] font-semibold transition-colors",
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
                <label className="ml-auto flex items-center gap-1 cursor-pointer text-[10px] text-slate-400">
                    <input type="checkbox" checked={showSteel} onChange={e => setShowSteel(e.target.checked)} className="rounded" />
                    Steel Path
                </label>
            </div>
            {shown.length === 0 ? (
                <div className="text-xs text-slate-500 py-1">No fissures match the current filter.</div>
            ) : (
                <div className="divide-y divide-slate-800/40">
                    {shown.map((f) => (
                        <div key={f.id} className="flex items-center gap-2.5 py-2">
                            <span className={["shrink-0 rounded-full border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide", TIER_COLORS[f.tier] ?? "border-slate-700 text-slate-400"].join(" ")}>
                                {f.tier}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs text-slate-200 truncate">
                                    {f.missionType}
                                    {f.isStorm && <span className="ml-1 text-[10px] text-cyan-400 font-semibold">STORM</span>}
                                    {f.isHard  && <span className="ml-1 text-[10px] text-red-400 font-semibold">SP</span>}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">{f.node}</div>
                            </div>
                            <Countdown expiry={f.expiry} className="shrink-0 font-mono text-[10px] text-slate-400" />
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}

function NightwavePanel({ nightwave }: { nightwave: Nightwave }) {
    const acts = nightwave.activeChallenges.slice().sort((a, b) => {
        if (a.isElite !== b.isElite) return a.isElite ? -1 : 1;
        if (a.isDaily !== b.isDaily) return a.isDaily ? 1 : -1;
        return b.reputation - a.reputation;
    });

    return (
        <Panel
            title={`Nightwave — Season ${nightwave.season}`}
            aside={<div className="text-[10px] text-slate-500">Ends <Countdown expiry={nightwave.expiry} className="font-mono text-slate-400" /></div>}
        >
            <div className="space-y-1.5">
                {acts.map((act) => (
                    <div key={act.id} className="rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1 mb-0.5">
                                    {act.isElite && <span className="rounded border border-amber-700/50 bg-amber-950/30 px-1 py-px text-[9px] font-bold text-amber-300">ELITE</span>}
                                    {act.isDaily && <span className="rounded border border-sky-700/50 bg-sky-950/30 px-1 py-px text-[9px] font-bold text-sky-300">DAILY</span>}
                                    {!act.isDaily && !act.isElite && <span className="rounded border border-slate-700 bg-slate-800/60 px-1 py-px text-[9px] font-bold text-slate-400">WEEKLY</span>}
                                    <span className="text-xs font-medium text-slate-200">{act.title}</span>
                                </div>
                                <div className="text-[10px] text-slate-500">{act.desc}</div>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="text-xs font-bold text-blue-300">{act.reputation.toLocaleString()}</div>
                                <div className="text-[9px] text-slate-500">standing</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

type LoadState = "idle" | "loading" | "ok" | "error";

export default function DashboardWorldState() {
    const [loadState, setLoadState] = useState<LoadState>("idle");
    const [error, setError]         = useState<string | null>(null);
    const [data, setData]           = useState<WorldStateData | null>(null);
    const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const refresh = useCallback(async () => {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoadState("loading");
        setError(null);
        try {
            const d = await fetchWorldState();
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
        const id = setInterval(refresh, 5 * 60 * 1000);
        return () => { clearInterval(id); abortRef.current?.abort(); };
    }, [refresh]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <div className="text-sm font-semibold text-slate-200">World State</div>
                    {fetchedAt && (
                        <span className="text-[10px] text-slate-500">· updated {fetchedAt.toLocaleTimeString()}</span>
                    )}
                </div>
                <button
                    onClick={refresh}
                    disabled={loadState === "loading"}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/30 px-2.5 py-1 text-[11px] text-slate-400 hover:bg-slate-900 transition-colors disabled:opacity-40"
                >
                    <svg
                        className={["w-3 h-3", loadState === "loading" ? "animate-spin" : ""].join(" ")}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                    >
                        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
                    </svg>
                    {loadState === "loading" ? "Loading…" : "Refresh"}
                </button>
            </div>

            <div className="p-4">
                {/* Loading skeleton */}
                {loadState === "loading" && !data && (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
                        </svg>
                        Fetching world state…
                    </div>
                )}

                {/* Error */}
                {loadState === "error" && !data && (
                    <div className="rounded-xl border border-rose-800/50 bg-rose-950/20 p-3 text-xs text-rose-300 space-y-2">
                        <div className="font-semibold">Failed to load world state</div>
                        <p className="text-rose-400/80">{error}</p>
                        <p className="text-rose-500">The warframestat.us API may be temporarily unavailable.</p>
                        <button onClick={refresh} className="rounded-lg border border-rose-700/50 px-2.5 py-1 text-[11px] text-rose-300 hover:bg-rose-950/40 transition-colors">
                            Try again
                        </button>
                    </div>
                )}

                {/* Content */}
                {data && (
                    <div className="space-y-3">
                        {/* Row 1: Cycles + Sortie + Archon */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <CyclesPanel data={data} />
                            <SortiePanel sortie={data.sortie} />
                            <ArchonPanel hunt={data.archonHunt} />
                        </div>

                        {/* Row 2: Baro Ki'Teer + Events */}
                        {(data.voidTrader || data.events.length > 0) && (
                            <div className={[
                                "grid gap-3",
                                data.voidTrader && data.events.length > 0
                                    ? "grid-cols-1 lg:grid-cols-2"
                                    : "grid-cols-1",
                            ].join(" ")}>
                                {data.voidTrader && <VoidTraderPanel trader={data.voidTrader} />}
                                {data.events.length > 0 && <EventsPanel events={data.events} />}
                            </div>
                        )}

                        {/* Row 3: Fissures (full width) */}
                        <FissuresPanel fissures={data.fissures} />

                        {/* Row 4: Nightwave (if active) */}
                        {data.nightwave && data.nightwave.activeChallenges.length > 0 && (
                            <NightwavePanel nightwave={data.nightwave} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
