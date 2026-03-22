// src/pages/tools/ModBuilder.tsx
// Weapon Mod Builder — lets players slot mods and see calculated DPS + optimize.

import { useEffect, useMemo, useRef, useState } from "react";
import { getWeaponCatalog, type WeaponCategory, type WeaponEntry } from "../../domain/catalog/weaponCatalog";
import { getModsForCompat, type ModEntry } from "../../domain/catalog/modCatalog";
import { calculateBuild } from "../../domain/logic/damageCalc";
import { optimizeBuild, type OptimizeGoal } from "../../domain/logic/buildOptimizer";

// ---- Constants ----

const SLOT_COUNT = 8;

const CATEGORY_LABELS: WeaponCategory[] = ["Primary", "Secondary", "Melee"];

const GOAL_OPTIONS: { key: OptimizeGoal; label: string }[] = [
    { key: "damage",   label: "Max Damage (Sustained DPS)" },
    { key: "crit",     label: "Max Critical" },
    { key: "status",   label: "Max Status Chance" },
    { key: "balanced", label: "Balanced (DPS + Status)" },
];

const POLARITY_SYMBOL: Record<string, string> = {
    madurai: "▲", naramon: "■", vazarin: "●", zenurik: "◆",
    unairu: "◇", penjaga: "✦", umbra: "⬡",
};

// ---- Sub-components ----

function StatBadge({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
            <div className="text-sm font-semibold text-slate-100 mt-0.5">{value}</div>
            {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
        </div>
    );
}

function fmt(n: number, decimals = 0): string {
    return n.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

// ---- Mod Slot component ----

interface ModSlotProps {
    index: number;
    mod: ModEntry | null;
    compatMods: ModEntry[];
    usedNames: Set<string>;
    onChange: (index: number, mod: ModEntry | null) => void;
}

function ModSlot({ index, mod, compatMods, usedNames, onChange }: ModSlotProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handle(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return compatMods.filter(m => {
            if (usedNames.has(m.name) && m !== mod) return false;
            if (q && !m.name.toLowerCase().includes(q) && !m.statsLabel.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [compatMods, usedNames, mod, query]);

    const polSym = mod ? (POLARITY_SYMBOL[mod.polarity] ?? "·") : null;

    return (
        <div className="relative" ref={panelRef}>
            {/* Slot button */}
            <div
                className={[
                    "rounded-xl border transition-colors cursor-pointer select-none",
                    mod
                        ? "border-slate-600 bg-slate-900/60 hover:border-slate-500"
                        : "border-dashed border-slate-700/60 bg-slate-950/20 hover:border-slate-600 hover:bg-slate-950/40",
                ].join(" ")}
            >
                <div
                    className="p-2.5 flex items-start gap-2 min-h-[56px]"
                    onClick={() => { setOpen(x => !x); setQuery(""); }}
                >
                    {mod ? (
                        <>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-100 truncate">{mod.name}</span>
                                    {polSym && (
                                        <span className="text-[10px] text-slate-500 shrink-0">{polSym}</span>
                                    )}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{mod.statsLabel}</div>
                            </div>
                            <button
                                className="text-slate-600 hover:text-slate-300 transition-colors shrink-0 mt-0.5"
                                onClick={e => { e.stopPropagation(); onChange(index, null); }}
                                title="Remove mod"
                            >
                                ✕
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs w-full justify-center py-1">
                            <span>+</span>
                            <span>Add Mod</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Picker dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                    <div className="p-2 border-b border-slate-800">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search mods…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                        {mod && (
                            <button
                                className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-800/50 transition-colors"
                                onClick={() => { onChange(index, null); setOpen(false); setQuery(""); }}
                            >
                                Clear slot
                            </button>
                        )}
                        {filtered.length === 0 && (
                            <div className="px-3 py-4 text-xs text-slate-500 text-center">No matching mods</div>
                        )}
                        {filtered.map(m => (
                            <button
                                key={m.uniqueName}
                                className={[
                                    "w-full px-3 py-2 text-left hover:bg-slate-800/50 transition-colors",
                                    m.name === mod?.name ? "bg-slate-800/30" : "",
                                ].join(" ")}
                                onClick={() => { onChange(index, m); setOpen(false); setQuery(""); }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-slate-200">{m.name}</span>
                                    <span className="text-[10px] text-slate-600 ml-auto">{POLARITY_SYMBOL[m.polarity] ?? "·"}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{m.statsLabel}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- Weapon selector ----

function WeaponSelector({
    selected,
    onSelect,
}: {
    selected: WeaponEntry | null;
    onSelect: (w: WeaponEntry) => void;
}) {
    const [query, setQuery] = useState("");
    const [catFilter, setCatFilter] = useState<WeaponCategory | "All">("All");
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function handle(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    const weapons = useMemo(() => getWeaponCatalog(), []);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return weapons.filter(w => {
            if (catFilter !== "All" && w.category !== catFilter) return false;
            return !q || w.name.toLowerCase().includes(q);
        }).slice(0, 100); // cap list to keep it snappy
    }, [weapons, query, catFilter]);

    return (
        <div className="relative" ref={panelRef}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(x => !x)}
                className={[
                    "w-full flex items-center gap-2 rounded-xl border px-4 py-3 text-left transition-colors",
                    selected
                        ? "border-slate-600 bg-slate-900/60 hover:border-slate-500"
                        : "border-dashed border-slate-700 bg-slate-950/20 hover:border-slate-600",
                ].join(" ")}
            >
                {selected ? (
                    <>
                        <span className="text-sm font-semibold text-slate-100">{selected.name}</span>
                        <span className="text-xs text-slate-500">{selected.category} · {selected.weaponType}</span>
                        <span className="ml-auto text-xs text-slate-600">▾</span>
                    </>
                ) : (
                    <span className="text-sm text-slate-500">Select a weapon…</span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                    <div className="p-2 space-y-2 border-b border-slate-800">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search weapons…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
                        />
                        <div className="flex gap-1">
                            {(["All", ...CATEGORY_LABELS] as const).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCatFilter(c)}
                                    className={[
                                        "rounded-full px-2.5 py-0.5 text-xs border transition-colors",
                                        catFilter === c
                                            ? "bg-slate-100 text-slate-900 border-slate-100"
                                            : "bg-slate-950 text-slate-400 border-slate-700 hover:bg-slate-800",
                                    ].join(" ")}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                        {filtered.length === 0 && (
                            <div className="px-3 py-4 text-xs text-slate-500 text-center">No matching weapons</div>
                        )}
                        {filtered.map(w => (
                            <button
                                key={w.uniqueName}
                                className={[
                                    "w-full px-3 py-2 text-left hover:bg-slate-800/50 transition-colors",
                                    w.name === selected?.name ? "bg-slate-800/30" : "",
                                ].join(" ")}
                                onClick={() => { onSelect(w); setOpen(false); setQuery(""); }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-200">{w.name}</span>
                                    <span className="text-[10px] text-slate-500 ml-auto">{w.category}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                    {w.weaponType} · {fmt(w.damage.total)} dmg · {fmt(w.critChance * 100, 1)}% cc · {fmt(w.statusChance * 100, 1)}% sc
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- Main component ----

export default function ModBuilder() {
    const [weapon, setWeapon] = useState<WeaponEntry | null>(null);
    const [slots, setSlots] = useState<(ModEntry | null)[]>(Array(SLOT_COUNT).fill(null));
    const [optimizeGoal, setOptimizeGoal] = useState<OptimizeGoal>("damage");

    // When weapon changes, clear slots
    function handleSelectWeapon(w: WeaponEntry) {
        setWeapon(w);
        setSlots(Array(SLOT_COUNT).fill(null));
    }

    const compatMods = useMemo(
        () => (weapon ? getModsForCompat(weapon.modCompat) : []),
        [weapon],
    );

    const usedNames = useMemo(
        () => new Set(slots.filter(Boolean).map(m => m!.name)),
        [slots],
    );

    function handleSlotChange(index: number, mod: ModEntry | null) {
        setSlots(prev => {
            const next = [...prev];
            next[index] = mod;
            return next;
        });
    }

    function handleOptimize() {
        if (!weapon) return;
        const chosen = optimizeBuild(weapon, compatMods, optimizeGoal, SLOT_COUNT);
        const next = Array(SLOT_COUNT).fill(null) as (ModEntry | null)[];
        chosen.forEach((m, i) => { next[i] = m; });
        setSlots(next);
    }

    // Calculate current stats
    const metrics = useMemo(() => {
        if (!weapon) return null;
        return calculateBuild(weapon, slots.map(m => m?.effect ?? null));
    }, [weapon, slots]);

    const m = metrics?.modded;

    return (
        <div className="space-y-4">
            {/* Weapon selector */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold mb-3">Select Weapon</div>
                <WeaponSelector selected={weapon} onSelect={handleSelectWeapon} />

                {/* Base stat summary */}
                {weapon && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px] text-slate-500">
                        <div><span className="text-slate-400">Base dmg</span> {fmt(weapon.damage.total, 1)}</div>
                        <div><span className="text-slate-400">Crit cc</span> {fmt(weapon.critChance * 100, 1)}%</div>
                        <div><span className="text-slate-400">Crit cd</span> {weapon.critMultiplier.toFixed(1)}x</div>
                        <div><span className="text-slate-400">Status</span> {fmt(weapon.statusChance * 100, 1)}%</div>
                        <div><span className="text-slate-400">FR</span> {weapon.fireRate.toFixed(2)}/s</div>
                        <div><span className="text-slate-400">Mag</span> {weapon.magazineSize} / {weapon.reloadTime.toFixed(1)}s</div>
                    </div>
                )}
            </div>

            {weapon && (
                <>
                    {/* Mod slots */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold">Mod Slots</div>
                            <div className="text-[10px] text-slate-500">
                                {slots.filter(Boolean).length}/{SLOT_COUNT} filled
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {slots.map((mod, i) => (
                                <ModSlot
                                    key={i}
                                    index={i}
                                    mod={mod}
                                    compatMods={compatMods}
                                    usedNames={usedNames}
                                    onChange={handleSlotChange}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Optimizer */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                        <div className="text-sm font-semibold mb-3">Auto-Optimize</div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="flex gap-1.5 flex-wrap">
                                {GOAL_OPTIONS.map(g => (
                                    <button
                                        key={g.key}
                                        onClick={() => setOptimizeGoal(g.key)}
                                        className={[
                                            "rounded-full px-3 py-1 text-xs border transition-colors",
                                            optimizeGoal === g.key
                                                ? "bg-slate-100 text-slate-900 border-slate-100"
                                                : "bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-900",
                                        ].join(" ")}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleOptimize}
                                className="ml-auto rounded-full px-4 py-1.5 text-xs border border-amber-600/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 transition-colors font-semibold"
                            >
                                Optimize ▶
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-2">
                            Fills all slots with the highest-impact mods for the selected goal using a greedy best-first search. Assumes all mods are at max rank.
                        </p>
                    </div>

                    {/* Calculated stats */}
                    {m && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                            <div className="text-sm font-semibold mb-3">Calculated Stats</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                                <StatBadge
                                    label="Arsenal Damage"
                                    value={fmt(m.arsenalDamage, 0)}
                                    sub="per shot (no crit)"
                                />
                                <StatBadge
                                    label="Avg Shot"
                                    value={fmt(m.averageShotDamage, 0)}
                                    sub="crit-weighted"
                                />
                                <StatBadge
                                    label="Burst DPS"
                                    value={fmt(metrics!.burstDPS, 0)}
                                    sub="no reload"
                                />
                                <StatBadge
                                    label="Sustained DPS"
                                    value={fmt(metrics!.sustainedDPS, 0)}
                                    sub="with reload"
                                />
                                <StatBadge
                                    label="Crit Chance"
                                    value={fmt(m.critChance * 100, 1) + "%"}
                                    sub={m.critChance > 1 ? "guaranteed yellow crit" : undefined}
                                />
                                <StatBadge
                                    label="Crit Multiplier"
                                    value={m.critMultiplier.toFixed(2) + "x"}
                                    sub={`yellow crit`}
                                />
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                <StatBadge label="Status" value={fmt(m.statusChance * 100, 1) + "%"} />
                                <StatBadge label="Fire Rate" value={m.fireRate.toFixed(2) + "/s"} />
                                <StatBadge label="Magazine" value={String(m.magazineSize)} />
                                <StatBadge label="Reload" value={m.reloadTime.toFixed(2) + "s"} />
                                <StatBadge label="Multishot" value={m.multishot.toFixed(2) + "x"} />
                            </div>

                            {/* Crit tier note */}
                            {m.critChance > 1 && (
                                <div className="mt-3 rounded-xl border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-400/80">
                                    {m.critChance >= 2
                                        ? `${fmt(m.critChance * 100, 1)}% crit chance — guaranteed orange crits (${fmt((m.critChance - Math.floor(m.critChance)) * 100, 0)}% red crit chance)`
                                        : `${fmt(m.critChance * 100, 1)}% crit chance — guaranteed yellow crits (${fmt((m.critChance - 1) * 100, 0)}% orange crit chance)`
                                    }
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {!weapon && (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/20 p-8 text-center">
                    <div className="text-slate-400 text-sm">Select a weapon above to begin building.</div>
                    <div className="text-slate-600 text-xs mt-1">
                        Supports Primary, Secondary, and Melee weapons. Damage calculated using the Warframe wiki arsenal formula.
                    </div>
                </div>
            )}
        </div>
    );
}
