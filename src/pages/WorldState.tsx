// ===== FILE: src/pages/WorldState.tsx =====
// Live Warframe world state — cycles, sortie, archon hunt, fissures, nightwave.
// Data sourced from https://api.warframestat.us (community API, no auth required).

import { useCallback, useEffect, useRef, useState } from "react";

// ── API types (minimal — only fields the UI uses) ─────────────────────────────

type WsCycle = {
    state: string;      // e.g. "day", "night", "warm", "cold", "fass", "vome"
    expiry: string;     // ISO timestamp when current state ends
    timeLeft: string;   // pre-formatted by API (fallback display)
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

type WorldStateData = {
    cetusCycle:   WsCycle;
    valesCycle:   WsCycle;
    cambionCycle: WsCycle;
    zarimanCycle: WsCycle;
    sortie:       Sortie;
    archonHunt:   ArchonHunt;
    fissures:     Fissure[];
    nightwave:    Nightwave | null;
};

// ── Fetching ──────────────────────────────────────────────────────────────────

const API = "https://api.warframestat.us/pc";

async function fetchWorldState(): Promise<WorldStateData> {
    const get = <T>(path: string) =>
        fetch(`${API}/${path}?language=en`).then((r) => {
            if (!r.ok) throw new Error(`${path} ${r.status}`);
            return r.json() as Promise<T>;
        });

    const [cetusCycle, valesCycle, cambionCycle, zarimanCycle, sortie, archonHunt, fissures, nightwave] =
        await Promise.all([
            get<WsCycle>("cetusCycle"),
            get<WsCycle>("valesCycle"),
            get<WsCycle>("cambionCycle"),
            get<WsCycle>("zarimanCycle"),
            get<Sortie>("sortie"),
            get<ArchonHunt>("archonHunt"),
            get<Fissure[]>("fissures"),
            get<Nightwave>("nightwave").catch(() => null),
        ]);

    return { cetusCycle, valesCycle, cambionCycle, zarimanCycle, sortie, archonHunt, fissures, nightwave };
}

// ── Time formatting ───────────────────────────────────────────────────────────

function msToHms(ms: number): string {
    if (ms <= 0) return "Expired";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0)  return `${d}d ${String(h % 24).padStart(2, "0")}h ${String(m % 60).padStart(2, "0")}m`;
    if (h > 0)  return `${h}h ${String(m % 60).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;
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
    const ms  = new Date(expiry).getTime() - now;
    return <span className={className}>{msToHms(ms)}</span>;
}

// ── Cycle colours and labels ──────────────────────────────────────────────────

type CycleVisual = { label: string; color: string; icon: string };

const CYCLE_VISUALS: Record<string, CycleVisual> = {
    // Cetus
    day:   { label: "Day",   color: "text-amber-400",  icon: "☀️" },
    night: { label: "Night", color: "text-blue-400",   icon: "🌙" },
    // Vallis
    warm:  { label: "Warm",  color: "text-orange-400", icon: "🔥" },
    cold:  { label: "Cold",  color: "text-cyan-400",   icon: "❄️" },
    // Cambion
    fass:  { label: "Fass",  color: "text-red-400",    icon: "🔴" },
    vome:  { label: "Vome",  color: "text-violet-400", icon: "🟣" },
    // Zariman
    grineer: { label: "Grineer Control", color: "text-red-400",   icon: "⚔️" },
    corpus:  { label: "Corpus Control",  color: "text-blue-400",  icon: "🔷" },
};

function getVisual(state: string): CycleVisual {
    return CYCLE_VISUALS[state.toLowerCase()] ?? { label: state, color: "text-slate-300", icon: "•" };
}

// ── Fissure tier colours ──────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
    Lith:    "bg-amber-900/40 text-amber-300 border-amber-700/50",
    Meso:    "bg-slate-700/40 text-slate-300 border-slate-600/50",
    Neo:     "bg-yellow-900/40 text-yellow-300 border-yellow-700/50",
    Axi:     "bg-violet-900/40 text-violet-300 border-violet-700/50",
    Requiem: "bg-red-900/40 text-red-300 border-red-700/50",
    Omnia:   "bg-pink-900/40 text-pink-300 border-pink-700/50",
};

// ── Section wrapper ───────────────────────────────────────────────────────────

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="text-sm font-semibold text-slate-200">{title}</div>
                {action}
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

// ── Open World Cycles ─────────────────────────────────────────────────────────

function CycleRow({
    location,
    sublabel,
    cycle,
    nextLabel,
}: {
    location: string;
    sublabel: string;
    cycle: WsCycle;
    nextLabel: string;
}) {
    const vis = getVisual(cycle.state);
    const now = useNow();
    const ms  = new Date(cycle.expiry).getTime() - now;
    const pct = Math.max(0, Math.min(100, (ms / (ms + 1)) * 100)); // approximate, just visual

    return (
        <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-800/60 last:border-0">
            <div className="min-w-0">
                <div className="text-sm font-medium text-slate-200">{location}</div>
                <div className="text-xs text-slate-500">{sublabel}</div>
            </div>
            <div className="text-right shrink-0">
                <div className={["text-sm font-bold", vis.color].join(" ")}>
                    {vis.icon} {vis.label}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                    {nextLabel} in <Countdown expiry={cycle.expiry} className="font-mono font-semibold text-slate-200" />
                </div>
            </div>
        </div>
    );
}

function OpenWorldCycles({ data }: { data: WorldStateData }) {
    return (
        <Card title="Open World Cycles">
            <CycleRow location="Plains of Eidolon"  sublabel="Cetus"    cycle={data.cetusCycle}   nextLabel={data.cetusCycle.state === "day" ? "Night" : "Day"} />
            <CycleRow location="Orb Vallis"          sublabel="Fortuna"  cycle={data.valesCycle}   nextLabel={data.valesCycle.state === "warm" ? "Cold" : "Warm"} />
            <CycleRow location="Cambion Drift"       sublabel="Necralisk" cycle={data.cambionCycle} nextLabel={data.cambionCycle.state === "fass" ? "Vome" : "Fass"} />
            <CycleRow location="Zariman Ten Zero"    sublabel="Angels of the Zariman" cycle={data.zarimanCycle} nextLabel="Next control" />
        </Card>
    );
}

// ── Sortie ────────────────────────────────────────────────────────────────────

const FACTION_COLORS: Record<string, string> = {
    Grineer:    "text-red-400",
    Corpus:     "text-blue-400",
    Infested:   "text-green-400",
    Corrupted:  "text-violet-400",
    Orokin:     "text-violet-400",
};

function SortieCard({ sortie }: { sortie: Sortie }) {
    const factionColor = FACTION_COLORS[sortie.faction] ?? "text-slate-300";
    return (
        <Card title="Daily Sortie" action={
            <div className="text-xs text-slate-500">
                Resets in <Countdown expiry={sortie.expiry} className="font-mono text-slate-400" />
            </div>
        }>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className={["font-semibold", factionColor].join(" ")}>{sortie.faction}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{sortie.boss}</span>
                {sortie.rewardPool && (
                    <>
                        <span className="text-slate-600">·</span>
                        <span className="rounded-full border border-amber-700/50 bg-amber-950/30 px-2 py-0.5 text-amber-300">
                            {sortie.rewardPool}
                        </span>
                    </>
                )}
            </div>
            <div className="space-y-2">
                {sortie.variants.map((v, i) => (
                    <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-sm font-medium text-slate-200">{v.missionType}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{v.node}</div>
                            </div>
                            {v.modifier && (
                                <span className="shrink-0 rounded-full border border-orange-700/50 bg-orange-950/20 px-2 py-0.5 text-xs text-orange-300">
                                    {v.modifier}
                                </span>
                            )}
                        </div>
                        {v.modifierDescription && (
                            <div className="mt-1 text-xs text-slate-500">{v.modifierDescription}</div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ── Archon Hunt ───────────────────────────────────────────────────────────────

function ArchonHuntCard({ hunt }: { hunt: ArchonHunt }) {
    const factionColor = FACTION_COLORS[hunt.faction] ?? "text-slate-300";
    return (
        <Card title="Weekly Archon Hunt" action={
            <div className="text-xs text-slate-500">
                Resets in <Countdown expiry={hunt.expiry} className="font-mono text-slate-400" />
            </div>
        }>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className={["font-semibold", factionColor].join(" ")}>{hunt.faction}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{hunt.boss}</span>
            </div>
            <div className="space-y-2">
                {hunt.missions.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                            {i + 1}
                        </span>
                        <div>
                            <div className="text-sm font-medium text-slate-200">{m.type}</div>
                            <div className="text-xs text-slate-500">{m.node}</div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ── Void Fissures ─────────────────────────────────────────────────────────────

const TIER_ORDER = ["Lith", "Meso", "Neo", "Axi", "Requiem", "Omnia"];

function FissuresCard({ fissures }: { fissures: Fissure[] }) {
    const [tierFilter, setTierFilter] = useState<string>("All");
    const [showSteel, setShowSteel]   = useState(false);

    const active = fissures.filter((f) => !f.expired);
    const tiers  = ["All", ...TIER_ORDER.filter((t) => active.some((f) => f.tier === t))];

    const shown = active.filter((f) => {
        if (tierFilter !== "All" && f.tier !== tierFilter) return false;
        if (!showSteel && f.isHard) return false;
        return true;
    }).sort((a, b) => a.tierNum - b.tierNum || new Date(a.expiry).getTime() - new Date(b.expiry).getTime());

    return (
        <Card title={`Void Fissures (${active.length})`}>
            {/* Filters */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                {tiers.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTierFilter(t)}
                        className={[
                            "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                            tierFilter === t
                                ? "bg-slate-100 text-slate-900 border-slate-100"
                                : t === "All"
                                    ? "border-slate-700 bg-slate-950/30 text-slate-300 hover:bg-slate-900"
                                    : `border ${TIER_COLORS[t] ?? "border-slate-700 text-slate-300"} bg-transparent hover:opacity-80`,
                        ].join(" ")}
                    >
                        {t}
                    </button>
                ))}
                <label className="ml-auto flex items-center gap-1.5 cursor-pointer text-xs text-slate-400">
                    <input type="checkbox" checked={showSteel} onChange={e => setShowSteel(e.target.checked)} className="rounded" />
                    Steel Path
                </label>
            </div>

            {shown.length === 0 ? (
                <div className="text-sm text-slate-500 py-2">No fissures match the current filter.</div>
            ) : (
                <div className="divide-y divide-slate-800/60">
                    {shown.map((f) => (
                        <div key={f.id} className="flex items-center gap-3 py-2.5">
                            <span className={["shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", TIER_COLORS[f.tier] ?? "border-slate-700 text-slate-400"].join(" ")}>
                                {f.tier}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm text-slate-200 truncate">
                                    {f.missionType}
                                    {f.isStorm && <span className="ml-1.5 text-[10px] text-cyan-400 font-semibold">STORM</span>}
                                    {f.isHard  && <span className="ml-1.5 text-[10px] text-red-400 font-semibold">STEEL PATH</span>}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{f.node}</div>
                            </div>
                            <Countdown expiry={f.expiry} className="shrink-0 font-mono text-xs text-slate-400" />
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ── Nightwave ─────────────────────────────────────────────────────────────────

function NightwaveCard({ nightwave }: { nightwave: Nightwave }) {
    const acts = nightwave.activeChallenges.slice().sort((a, b) => {
        // Elite → Weekly → Daily
        if (a.isElite !== b.isElite) return a.isElite ? -1 : 1;
        if (a.isDaily !== b.isDaily) return a.isDaily ? 1 : -1;
        return b.reputation - a.reputation;
    });

    return (
        <Card title={`Nightwave — Season ${nightwave.season}`} action={
            <div className="text-xs text-slate-500">
                Ends <Countdown expiry={nightwave.expiry} className="font-mono text-slate-400" />
            </div>
        }>
            <div className="space-y-2">
                {acts.map((act) => (
                    <div key={act.id} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                    {act.isElite && (
                                        <span className="rounded-full border border-amber-700/50 bg-amber-950/30 px-1.5 py-px text-[10px] font-bold text-amber-300">ELITE</span>
                                    )}
                                    {act.isDaily && (
                                        <span className="rounded-full border border-sky-700/50 bg-sky-950/30 px-1.5 py-px text-[10px] font-bold text-sky-300">DAILY</span>
                                    )}
                                    {!act.isDaily && !act.isElite && (
                                        <span className="rounded-full border border-slate-700 bg-slate-800/60 px-1.5 py-px text-[10px] font-bold text-slate-400">WEEKLY</span>
                                    )}
                                    <div className="text-sm font-medium text-slate-200">{act.title}</div>
                                </div>
                                <div className="text-xs text-slate-500">{act.desc}</div>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="text-sm font-bold text-blue-300">{act.reputation.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-500">Standing</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type LoadState = "idle" | "loading" | "ok" | "error";

export default function WorldState() {
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
            setError(e.message ?? "Failed to load world state.");
            setLoadState("error");
        }
    }, []);

    // Fetch on mount, refresh every 5 minutes
    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 5 * 60 * 1000);
        return () => { clearInterval(id); abortRef.current?.abort(); };
    }, [refresh]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold">World State</div>
                        <div className="text-sm text-slate-400 mt-0.5">
                            Live game state — cycles, sorties, fissures and more. Auto-refreshes every 5 minutes.
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {fetchedAt && (
                            <span className="text-xs text-slate-500">
                                Updated {fetchedAt.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={refresh}
                            disabled={loadState === "loading"}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900 transition-colors disabled:opacity-50"
                        >
                            <svg
                                className={["w-3.5 h-3.5", loadState === "loading" ? "animate-spin" : ""].join(" ")}
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"
                            >
                                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
                            </svg>
                            {loadState === "loading" ? "Loading…" : "Refresh"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Data source notice */}
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/20 px-4 py-2.5 flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-3.5 h-3.5 shrink-0 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Data from <a href="https://api.warframestat.us" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-300 underline">api.warframestat.us</a> — a community-maintained world state mirror, not affiliated with Digital Extremes.
            </div>

            {/* Loading */}
            {loadState === "loading" && !data && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 flex items-center justify-center gap-3 text-slate-400">
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
                    Fetching world state…
                </div>
            )}

            {/* Error */}
            {loadState === "error" && !data && (
                <div className="rounded-2xl border border-rose-800/50 bg-rose-950/20 p-4 text-sm text-rose-300 space-y-2">
                    <div className="font-semibold">Failed to load world state</div>
                    <p className="text-rose-400/80">{error}</p>
                    <p className="text-xs text-rose-500">Check your network connection. The API at warframestat.us may be temporarily unavailable.</p>
                    <button onClick={refresh} className="mt-1 rounded-lg border border-rose-700/50 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-950/40 transition-colors">
                        Try again
                    </button>
                </div>
            )}

            {/* Content */}
            {data && (
                <div className="space-y-4">
                    {/* Top row — cycles, sortie, archon */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <OpenWorldCycles data={data} />
                        <div className="space-y-4">
                            <SortieCard sortie={data.sortie} />
                            <ArchonHuntCard hunt={data.archonHunt} />
                        </div>
                    </div>

                    {/* Fissures — full width */}
                    <FissuresCard fissures={data.fissures} />

                    {/* Nightwave */}
                    {data.nightwave && data.nightwave.activeChallenges.length > 0 && (
                        <NightwaveCard nightwave={data.nightwave} />
                    )}
                </div>
            )}
        </div>
    );
}
