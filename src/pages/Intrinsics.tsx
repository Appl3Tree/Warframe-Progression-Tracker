// ===== FILE: src/pages/Intrinsics.tsx =====
import { useTrackerStore } from "../store/store";

// ── Data ──────────────────────────────────────────────────────────────────────

const RAILJACK_INTRINSICS = [
    {
        key: "LPS_PILOTING",
        label: "Piloting",
        description: "Controls the Railjack's speed, dodge, and maneuverability in combat.",
        color: "blue"
    },
    {
        key: "LPS_GUNNERY",
        label: "Gunnery",
        description: "Improves the Railjack's turret damage, range, and aim assistance.",
        color: "red"
    },
    {
        key: "LPS_ENGINEERING",
        label: "Engineering",
        description: "Enhances damage control, forge efficiency, and critical systems.",
        color: "yellow"
    },
    {
        key: "LPS_TACTICAL",
        label: "Tactical",
        description: "Unlocks tactical menu abilities and reduces their cooldowns.",
        color: "purple"
    },
    {
        key: "LPS_COMMAND",
        label: "Command",
        description: "Allows additional crew slots and improves NPC crew competence.",
        color: "green"
    },
] as const;

const DUVIRI_INTRINSICS = [
    {
        key: "LPS_DRIFT_RIDING",
        label: "Agility",
        description: "Improves Kaithe traversal, aerial combat, and sprint speed.",
        color: "cyan"
    },
    {
        key: "LPS_DRIFT_ENDURANCE",
        label: "Endurance",
        description: "Increases Drifter health, armor, and resilience in the Duviri Paradox.",
        color: "orange"
    },
    {
        key: "LPS_DRIFT_OPPORTUNITY",
        label: "Opportunity",
        description: "Increases decrees offered per pick and reward quality.",
        color: "amber"
    },
    {
        key: "LPS_DRIFT_COMBAT",
        label: "Might",
        description: "Boosts Drifter weapon damage and melee combat effectiveness.",
        color: "rose"
    },
    {
        key: "LPS_DRIFT_AGILITY",
        label: "Wits",
        description: "Improves puzzle solving and decree interactions in the Duviri Paradox.",
        color: "indigo"
    },
] as const;

const MAX_RANK = 10;

// ── Color map ─────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { bar: string; pip: string; text: string }> = {
    blue:   { bar: "bg-blue-500",   pip: "bg-blue-400",   text: "text-blue-300" },
    red:    { bar: "bg-red-500",    pip: "bg-red-400",    text: "text-red-300" },
    yellow: { bar: "bg-yellow-500", pip: "bg-yellow-400", text: "text-yellow-300" },
    purple: { bar: "bg-purple-500", pip: "bg-purple-400", text: "text-purple-300" },
    green:  { bar: "bg-green-500",  pip: "bg-green-400",  text: "text-green-300" },
    cyan:   { bar: "bg-cyan-500",   pip: "bg-cyan-400",   text: "text-cyan-300" },
    orange: { bar: "bg-orange-500", pip: "bg-orange-400", text: "text-orange-300" },
    amber:  { bar: "bg-amber-500",  pip: "bg-amber-400",  text: "text-amber-300" },
    rose:   { bar: "bg-rose-500",   pip: "bg-rose-400",   text: "text-rose-300" },
    indigo: { bar: "bg-indigo-500", pip: "bg-indigo-400", text: "text-indigo-300" },
};

// ── Components ────────────────────────────────────────────────────────────────

function IntrinsicCard(props: {
    label: string;
    description: string;
    rank: number;
    color: string;
}) {
    const { label, description, rank, color } = props;
    const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
    const pct = Math.min(100, (rank / MAX_RANK) * 100);
    const maxed = rank >= MAX_RANK;

    return (
        <div className={[
            "rounded-xl border p-4 transition-colors",
            maxed ? "border-slate-600 bg-slate-900/60" : "border-slate-800 bg-slate-950/40"
        ].join(" ")}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className={["text-sm font-semibold", maxed ? c.text : "text-slate-200"].join(" ")}>
                            {label}
                        </span>
                        {maxed && (
                            <span className={["text-[10px] font-bold rounded px-1.5 py-0.5 border", c.text, "border-current opacity-80"].join(" ")}>
                                MAX
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{description}</p>
                </div>
                <div className={["text-2xl font-bold font-mono shrink-0", maxed ? c.text : "text-slate-100"].join(" ")}>
                    {rank}
                    <span className="text-sm text-slate-600 font-normal">/{MAX_RANK}</span>
                </div>
            </div>

            {/* Pip bar */}
            <div className="mt-3 flex gap-1">
                {Array.from({ length: MAX_RANK }).map((_, i) => (
                    <div
                        key={i}
                        className={[
                            "flex-1 h-2 rounded-full transition-all",
                            i < rank ? c.pip : "bg-slate-800"
                        ].join(" ")}
                    />
                ))}
            </div>

            {/* Progress label */}
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                <span>{pct.toFixed(0)}%</span>
                {!maxed && <span>{MAX_RANK - rank} rank{MAX_RANK - rank !== 1 ? "s" : ""} to max</span>}
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const EMPTY_INTRINSICS: Record<string, number> = {};

export default function Intrinsics() {
    const railjack = useTrackerStore(s => s.state.intrinsics?.railjack ?? EMPTY_INTRINSICS);
    const duviri   = useTrackerStore(s => s.state.intrinsics?.duviri   ?? EMPTY_INTRINSICS);

    const hasData = Object.keys(railjack).length > 0 || Object.keys(duviri).length > 0;

    const railjackTotal = RAILJACK_INTRINSICS.reduce((sum, sk) => sum + (railjack[sk.key] ?? 0), 0);
    const railjackMax   = RAILJACK_INTRINSICS.length * MAX_RANK;
    const duviriTotal   = DUVIRI_INTRINSICS.reduce((sum, sk) => sum + (duviri[sk.key] ?? 0), 0);
    const duviriMax     = DUVIRI_INTRINSICS.length * MAX_RANK;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100">Intrinsics</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Railjack and Duviri skill ranks imported from your profile.
                        </p>
                    </div>
                    {hasData && (
                        <div className="flex gap-4 text-right">
                            <div>
                                <div className="text-lg font-bold text-slate-100 font-mono">{railjackTotal}<span className="text-sm text-slate-600">/{railjackMax}</span></div>
                                <div className="text-xs text-slate-500">Railjack points</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-slate-100 font-mono">{duviriTotal}<span className="text-sm text-slate-600">/{duviriMax}</span></div>
                                <div className="text-xs text-slate-500">Duviri points</div>
                            </div>
                        </div>
                    )}
                </div>

                {!hasData && (
                    <div className="mt-3 rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 text-sm text-slate-400">
                        Import your profile on the <span className="text-slate-200 font-medium">Import / Export</span> page to view your intrinsic ranks.
                        Intrinsics are read from the <span className="font-mono text-slate-300 text-xs">PlayerSkills</span> field in your profile data.
                    </div>
                )}
            </div>

            {/* Railjack */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-base font-semibold text-slate-100">Railjack Intrinsics</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Earned by completing Railjack missions in the Proxima regions.
                        </p>
                    </div>
                    {hasData && (
                        <div className="ml-auto shrink-0">
                            <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${(railjackTotal / railjackMax) * 100}%` }} />
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 text-right">{railjackTotal}/{railjackMax}</div>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {RAILJACK_INTRINSICS.map(sk => (
                        <IntrinsicCard
                            key={sk.key}
                            label={sk.label}
                            description={sk.description}
                            rank={railjack[sk.key] ?? 0}
                            color={sk.color}
                        />
                    ))}
                </div>
            </div>

            {/* Duviri */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-base font-semibold text-slate-100">Duviri Intrinsics</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Earned by completing Duviri Paradox content.
                        </p>
                    </div>
                    {hasData && (
                        <div className="ml-auto shrink-0">
                            <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${(duviriTotal / duviriMax) * 100}%` }} />
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 text-right">{duviriTotal}/{duviriMax}</div>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {DUVIRI_INTRINSICS.map(sk => (
                        <IntrinsicCard
                            key={sk.key}
                            label={sk.label}
                            description={sk.description}
                            rank={duviri[sk.key] ?? 0}
                            color={sk.color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
