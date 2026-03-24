// src/pages/tools/ModBuilder.tsx
// Weapon Mod Builder — complete implementation with:
//   polarity icons · mod rank selection · exilus slot · arcane slots ×2
//   riven mod (user-defined stats) · forma counter · multi-attack display
//   beam-search optimizer · owned/excluded/faction/capacity toggles
//   build save+compare · build reasoning · status effect tooltips

import { useEffect, useMemo, useRef, useState } from "react";
import { getWeaponCatalog, type WeaponCategory, type WeaponEntry } from "../../domain/catalog/weaponCatalog";
import { getModsForWeapon, type ModEntry, type ModEffect, emptyEffect } from "../../domain/catalog/modCatalog";
import { getArcanesByWeaponCategory, type ArcaneEntry } from "../../domain/catalog/arcaneCatalog";
import { calculateBuild } from "../../domain/logic/damageCalc";
import { optimizeBuild, explainBuild, type OptimizeGoal, type BuildReasoning } from "../../domain/logic/buildOptimizer";
import {
    computeCapacity, totalModCapacity, minModCapacity, effectiveDrain,
    maxWeaponRank, type CapacityConfig, type SlotConfig,
} from "../../domain/logic/capacityCalc";
import { useTrackerStore } from "../../store/store";
import type { SavedBuild } from "../../domain/models/userState";

// ── Polarity icons ────────────────────────────────────────────────────────────

const _polImgs = import.meta.glob<string>("../../assets/polarities/*.svg", {
    eager: true, query: "?url", import: "default",
});
const POL_IMG: Record<string, string> = {};
for (const [p, url] of Object.entries(_polImgs)) {
    POL_IMG[p.split("/").pop()!.replace(".svg", "").toLowerCase()] = url as string;
}
const POL_FILE: Record<string, string> = {
    madurai: "madurai_pol", naramon: "naramon_pol", vazarin: "vazarin_pol",
    zenurik: "zenurik_pol", unairu:  "unairu_pol",  penjaga: "penjaga_pol",
    umbra:   "umbra_pol",   any:     "any_pol",
};
function PolarityIcon({ polarity, className = "w-4 h-4" }: { polarity: string; className?: string }) {
    const src = POL_IMG[POL_FILE[polarity] ?? ""] ?? null;
    if (!src) return <span className="text-slate-600 text-[10px]">○</span>;
    return <img src={src} alt={polarity} className={className} style={{ filter: "brightness(0) invert(1) opacity(0.65)" }} />;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SLOT_COUNT = 8;
const CATEGORY_LABELS: WeaponCategory[] = ["Primary", "Secondary", "Melee"];
const GOAL_OPTIONS: { key: OptimizeGoal; label: string; desc: string }[] = [
    { key: "damage",   label: "Max Damage",  desc: "Maximizes sustained DPS — best all-around." },
    { key: "crit",     label: "Max Crit",    desc: "Maximizes crit EV (CC × CD)." },
    { key: "status",   label: "Max Status",  desc: "Maximizes status chance for proc builds." },
    { key: "balanced", label: "Balanced",    desc: "Balances burst DPS with status chance." },
];
const FACTIONS = ["Grineer", "Corpus", "Infested", "Orokin", "The Murmur"];
const POLARITY_OPTS = [
    { key: "",        label: "None"    },
    { key: "madurai", label: "Madurai" },
    { key: "naramon", label: "Naramon" },
    { key: "vazarin", label: "Vazarin" },
    { key: "zenurik", label: "Zenurik" },
    { key: "unairu",  label: "Unairu"  },
    { key: "penjaga", label: "Penjaga" },
    { key: "umbra",   label: "Umbra"   },
];
const STATUS_TIPS: Record<string, string> = {
    impact:      "Knockback (5 stacks max): Staggers enemy, increases Parazon mercy kill threshold by 8% per stack (max +40%). Enemy only.",
    puncture:    "Weakened (5 stacks max): 1st stack −40% enemy damage. Each subsequent stack −10% more, max −80%. Also grants +5% enemy Crit Chance threshold per stack (max +25%).",
    slash:       "Bleed: Deals 35% base damage/sec over 6s, ignoring armor. Each proc is independent — multiple stacks deal multiple simultaneous DoTs.",
    heat:        "Ignite: Deals 50% base damage/sec as Heat DoT over 6s. Enemy panics for 4s. Gradually strips up to 50% armor over duration.",
    cold:        "Freeze (10 stacks max): −50% movement/fire/attack speed. Each extra stack adds −5% slow (max −90% at 9 stacks). At 10 stacks: enemy freezes solid for 3s, shields stop recharging, +1.0 crit multiplier bonus.",
    electricity: "Tesla Chain: Deals 50% base damage/sec as Electricity to enemies within 3m. Stuns primary target for 3s.",
    toxin:       "Poison: Deals 50% base damage/sec as Toxin DoT over 6s. Bypasses shields — damage goes directly to health.",
    blast:       "Detonate (10 stacks max): Each stack explodes after 1.5s for 30% base damage. At 10 stacks or on death: explosion hits all enemies within 5m for 300% × stacks. Removed the old 'inaccuracy' effect.",
    corrosive:   "Corrosion (10 stacks max): Removes 26% armor on first stack, then 6% per additional stack — max 80% armor stripped at 10 stacks. Lasts 8s per stack.",
    gas:         "Gas Cloud: Deals 50% base damage/sec as Gas DoT in a 3m radius (up to 6m at 10 stacks). Stacks increase radius by 0.3m each.",
    magnetic:    "Disrupt (10 stacks max): Amplifies damage to Shields/Overguard by 100% (first stack), +25% each subsequent stack (max +325%). Stops shield regen. On shield break: deals Electricity damage equal to 3% of max shields per stack.",
    radiation:   "Confusion (10 stacks max): Enemy attacks closest ally, receives +100% friendly-fire damage (first stack), +50% per additional stack (max +550% at 10). Lasts 12s per stack.",
    viral:       "Virus (10 stacks max): Amplifies damage to health by 100% (first stack), +25% each subsequent stack (max +325%). Lasts 6s per stack.",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, d = 0) {
    return n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
}
function uid() { return Math.random().toString(36).slice(2, 10); }

// Build a synthetic ModEntry from riven stat values
function makeRivenEntry(
    weaponName: string,
    stats: RivenStat[],
    rank: number,
    polarity: string,
    drain: number,
): ModEntry {
    let effect = emptyEffect();
    for (const s of stats) {
        const bonus = s.value / 100;
        switch (s.stat) {
            case "critChanceBonus":   effect = { ...effect, critChanceBonus:   effect.critChanceBonus   + bonus }; break;
            case "critMultBonus":     effect = { ...effect, critMultBonus:     effect.critMultBonus     + bonus }; break;
            case "damageBonus":       effect = { ...effect, damageBonus:       effect.damageBonus       + bonus }; break;
            case "statusChanceBonus": effect = { ...effect, statusChanceBonus: effect.statusChanceBonus + bonus }; break;
            case "multishotBonus":    effect = { ...effect, multishotBonus:    effect.multishotBonus    + bonus }; break;
            case "fireRateBonus":     effect = { ...effect, fireRateBonus:     effect.fireRateBonus     + bonus }; break;
            case "heatBonus":         effect = { ...effect, heatBonus:         effect.heatBonus         + bonus }; break;
            case "coldBonus":         effect = { ...effect, coldBonus:         effect.coldBonus         + bonus }; break;
            case "electricityBonus":  effect = { ...effect, electricityBonus:  effect.electricityBonus  + bonus }; break;
            case "toxinBonus":        effect = { ...effect, toxinBonus:        effect.toxinBonus        + bonus }; break;
            case "magneticBonus":     effect = { ...effect, magneticBonus:     effect.magneticBonus     + bonus }; break;
            case "radiationBonus":    effect = { ...effect, radiationBonus:    effect.radiationBonus    + bonus }; break;
            case "magazineBonus":     effect = { ...effect, magazineBonus:     effect.magazineBonus     + bonus }; break;
            case "reloadSpeedBonus":  effect = { ...effect, reloadSpeedBonus:  effect.reloadSpeedBonus  + bonus }; break;
        }
    }
    const statsLabel = stats
        .filter(s => s.value !== 0)
        .map(s => `${s.value > 0 ? "+" : ""}${s.value.toFixed(1)}% ${RIVEN_STAT_LABELS[s.stat] ?? s.stat}`)
        .join("  ·  ");
    return {
        uniqueName: `__riven_${weaponName}`,
        name: `${weaponName} Riven`,
        compatBucket: "Riven",
        rawCompatName: "Riven",
        polarity,
        rarity: "Legendary",
        drain,
        baseDrain: drain - rank,
        fusionLimit: rank,
        statsLabel,
        effectsByRank: [effect],  // simplified: same effect at all ranks
        effect,
        hasDamageEffect: true,
        isAura: false,
        isExilus: false,
    };
}

// ── Riven stat definitions ────────────────────────────────────────────────────

const RIVEN_STATS = [
    { key: "critChanceBonus",   label: "Critical Chance" },
    { key: "critMultBonus",     label: "Critical Damage" },
    { key: "damageBonus",       label: "Damage" },
    { key: "statusChanceBonus", label: "Status Chance" },
    { key: "multishotBonus",    label: "Multishot" },
    { key: "fireRateBonus",     label: "Fire Rate" },
    { key: "heatBonus",         label: "Heat" },
    { key: "coldBonus",         label: "Cold" },
    { key: "electricityBonus",  label: "Electricity" },
    { key: "toxinBonus",        label: "Toxin" },
    { key: "magneticBonus",     label: "Magnetic" },
    { key: "radiationBonus",    label: "Radiation" },
    { key: "magazineBonus",     label: "Magazine" },
    { key: "reloadSpeedBonus",  label: "Reload Speed" },
] as const;

const RIVEN_STAT_LABELS: Record<string, string> = Object.fromEntries(RIVEN_STATS.map(s => [s.key, s.label]));

interface RivenStat {
    stat: typeof RIVEN_STATS[number]["key"];
    value: number; // raw number e.g. 120.5 means +120.5%
}

// ── Polarity picker ───────────────────────────────────────────────────────────

function PolarityPicker({ value, onChange }: { value: string; onChange: (p: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(v => !v)}
                className="flex items-center justify-center w-6 h-6 rounded border border-slate-700/60 hover:border-slate-500 transition-colors"
                title="Change slot polarity">
                {value ? <PolarityIcon polarity={value} className="w-3.5 h-3.5" /> : <span className="text-slate-600 text-xs">○</span>}
            </button>
            {open && (
                <div className="absolute z-50 top-full left-0 mt-1 w-32 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                    {POLARITY_OPTS.map(o => (
                        <button key={o.key} onClick={() => { onChange(o.key); setOpen(false); }}
                            className={["w-full flex items-center gap-2 px-2.5 py-1.5 text-xs transition-colors",
                                o.key === value ? "bg-slate-700/60 text-slate-100" : "text-slate-300 hover:bg-slate-800"].join(" ")}>
                            <span className="w-5 flex items-center justify-center">
                                {o.key ? <PolarityIcon polarity={o.key} className="w-3.5 h-3.5" /> : <span className="text-slate-600">○</span>}
                            </span>
                            <span>{o.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Stat Badge ────────────────────────────────────────────────────────────────

function StatBadge({ label, value, sub, highlight, tooltip }: {
    label: string; value: string; sub?: string; highlight?: boolean; tooltip?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className={["rounded-lg border px-3 py-2 relative select-none",
            highlight ? "border-amber-700/50 bg-amber-950/20" : "border-slate-700/60 bg-slate-900/50",
            tooltip ? "cursor-help" : ""].join(" ")}
            onMouseEnter={() => tooltip && setShow(true)}
            onMouseLeave={() => setShow(false)}>
            <div className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
                {label}{tooltip && <span className="text-slate-700 text-[8px]">?</span>}
            </div>
            <div className={["text-sm font-semibold mt-0.5", highlight ? "text-amber-300" : "text-slate-100"].join(" ")}>{value}</div>
            {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
            {show && tooltip && (
                <div className="absolute bottom-full left-0 mb-1.5 z-50 w-60 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-[11px] text-slate-300 shadow-xl leading-relaxed pointer-events-none">
                    {tooltip}
                </div>
            )}
        </div>
    );
}

function CapBar({ used, total, over }: { used: number; total: number; over: boolean }) {
    const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
    return (
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className={["h-full rounded-full transition-all",
                over ? "bg-red-500" : pct > 85 ? "bg-amber-500" : "bg-blue-500"].join(" ")}
                style={{ width: `${pct}%` }} />
        </div>
    );
}

// ── Mod Slot ──────────────────────────────────────────────────────────────────

interface SlotProps {
    index: number; label?: string;
    mod: ModEntry | null; rank: number; slotPolarity: string;
    compatMods: ModEntry[]; usedNames: Set<string>;
    ownedNames: Set<string>; onlyOwned: boolean; isExilusSlot?: boolean;
    onChange: (i: number, m: ModEntry | null) => void;
    onRankChange: (i: number, r: number) => void;
    onPolarityChange: (i: number, p: string) => void;
    effDrain: number;
}

function ModSlot({ index, label, mod, rank, slotPolarity, compatMods, usedNames,
    ownedNames, onlyOwned, isExilusSlot, onChange, onRankChange, onPolarityChange, effDrain }: SlotProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return compatMods.filter(m => {
            if (isExilusSlot && !m.isExilus) return false;
            if (m.compatBucket === "Riven") return false;  // rivens go in a dedicated slot
            if (usedNames.has(m.name) && m !== mod) return false;
            if (onlyOwned && ownedNames.size > 0 && !ownedNames.has(m.name)) return false;
            if (q && !m.name.toLowerCase().includes(q) && !m.statsLabel.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [compatMods, usedNames, mod, query, onlyOwned, ownedNames, isExilusSlot]);

    const polMatch    = !!(mod && slotPolarity && slotPolarity === mod.polarity);
    const polMismatch = !!(mod && slotPolarity && slotPolarity !== mod.polarity && slotPolarity !== "");

    return (
        <div className="relative" ref={panelRef}>
            <div className={["rounded-xl border transition-colors",
                mod
                    ? polMismatch ? "border-amber-700/40 bg-slate-900/60"
                                  : "border-slate-600 bg-slate-900/60 hover:border-slate-500"
                    : isExilusSlot ? "border-dashed border-slate-600/50 bg-slate-950/30 hover:border-slate-500"
                                   : "border-dashed border-slate-700/60 bg-slate-950/20 hover:border-slate-600"].join(" ")}>

                <div className="p-2.5 flex items-start gap-2 min-h-[56px] cursor-pointer select-none"
                    onClick={() => { setOpen(x => !x); setQuery(""); }}>
                    {mod ? (
                        <>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                    {label && <span className="text-[8px] uppercase tracking-wide text-slate-600">{label}</span>}
                                    <span className="text-xs font-semibold text-slate-100 truncate">{mod.name}</span>
                                    {mod.compatBucket === "Riven" && <span className="text-[9px] px-1 rounded border border-yellow-700/50 bg-yellow-950/30 text-yellow-400">RIVEN</span>}
                                    {mod.effect.targetFaction && <span className="text-[9px] px-1 rounded border border-orange-700/50 bg-orange-950/30 text-orange-400">{mod.effect.targetFaction}</span>}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    {mod.statsLabel}
                                    {rank < mod.fusionLimit && <span className="text-slate-600 ml-1">@{rank}/{mod.fusionLimit}</span>}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <button className="text-slate-600 hover:text-slate-300 text-xs"
                                    onClick={e => { e.stopPropagation(); onChange(index, null); }}>✕</button>
                                <span className={["text-[9px] font-mono font-bold px-1 py-0.5 rounded",
                                    effDrain < 0 ? "text-green-300 bg-green-950/40" :
                                    polMatch    ? "text-green-400 bg-green-950/30" :
                                    polMismatch ? "text-amber-400 bg-amber-950/30" : "text-slate-400 bg-slate-800/60"].join(" ")}>
                                    {effDrain < 0 ? `+${Math.abs(effDrain)}` : effDrain}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className={["flex items-center gap-1.5 text-slate-600 text-xs w-full justify-center",
                            label ? "mt-3 mb-1" : "py-1"].join(" ")}>
                            {label && <span className="text-[8px] uppercase tracking-wide text-slate-600 absolute top-1.5 left-2.5">{label}</span>}
                            <span>+</span><span>{label ? `Add ${label}` : "Add Mod"}</span>
                        </div>
                    )}
                </div>

                {/* Rank slider */}
                {mod && mod.fusionLimit > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 pb-1.5" onClick={e => e.stopPropagation()}>
                        <span className="text-[9px] text-slate-600 shrink-0">Rank</span>
                        <input type="range" min={0} max={mod.fusionLimit} value={rank}
                            onChange={e => onRankChange(index, +e.target.value)}
                            className="flex-1 h-1 accent-blue-500 cursor-pointer" />
                        <span className="text-[9px] font-mono text-slate-400 w-8 text-right shrink-0">{rank}/{mod.fusionLimit}</span>
                    </div>
                )}

                {/* Slot polarity */}
                <div className="flex items-center gap-1.5 px-2.5 pb-2 border-t border-slate-800/40 pt-1.5"
                    onClick={e => e.stopPropagation()}>
                    <span className="text-[9px] text-slate-600 uppercase tracking-wide">Slot</span>
                    <PolarityPicker value={slotPolarity} onChange={p => onPolarityChange(index, p)} />
                    {mod?.polarity && (
                        <div className="ml-auto flex items-center gap-1">
                            <span className="text-[9px] text-slate-600">mod</span>
                            <PolarityIcon polarity={mod.polarity} className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>

            {/* Mod picker dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                    <div className="p-2 border-b border-slate-800">
                        <input ref={inputRef} type="text" placeholder="Search mods…" value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                        {mod && (
                            <button className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-800/50"
                                onClick={() => { onChange(index, null); setOpen(false); setQuery(""); }}>
                                Clear slot
                            </button>
                        )}
                        {filtered.length === 0 && <div className="px-3 py-4 text-xs text-slate-500 text-center">No matching mods</div>}
                        {filtered.map(m => {
                            const eff      = effectiveDrain(m, slotPolarity);
                            const match    = !!(slotPolarity && slotPolarity === m.polarity);
                            const mismatch = !!(slotPolarity && slotPolarity !== m.polarity && slotPolarity !== "");
                            const owned    = ownedNames.size === 0 || ownedNames.has(m.name);
                            return (
                                <button key={m.uniqueName}
                                    className={["w-full px-3 py-2 text-left hover:bg-slate-800/50 transition-colors",
                                        m.name === mod?.name ? "bg-slate-800/30" : "",
                                        !owned ? "opacity-50" : ""].join(" ")}
                                    onClick={() => { onChange(index, m); setOpen(false); setQuery(""); }}>
                                    <div className="flex items-center gap-1.5">
                                        <span className="shrink-0 w-4">
                                            {m.polarity ? <PolarityIcon polarity={m.polarity} className="w-3.5 h-3.5" /> : <span className="text-slate-700 text-xs">○</span>}
                                        </span>
                                        <span className="text-xs font-medium text-slate-200 flex-1 truncate">{m.name}</span>
                                        {!owned && <span className="text-[9px] text-slate-600 shrink-0">(unowned)</span>}
                                        {m.effect.targetFaction && <span className="text-[9px] px-1 rounded border border-orange-700/50 bg-orange-950/30 text-orange-400 shrink-0">{m.effect.targetFaction}</span>}
                                        <span className={["text-[9px] font-mono font-bold shrink-0 px-1 rounded",
                                            match ? "text-green-400 bg-green-950/30" : mismatch ? "text-amber-400 bg-amber-950/30" : "text-slate-500"].join(" ")}>
                                            {eff < 0 ? `+${Math.abs(eff)}` : eff}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 pl-5">
                                        {m.statsLabel || "—"}
                                        <span className="text-slate-700 ml-1">{m.rarity}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Arcane Slot ───────────────────────────────────────────────────────────────

function ArcaneSlot({ label, arcane, rank, onChange, onRankChange, availableArcanes }: {
    label: string;
    arcane: ArcaneEntry | null;
    rank: number;
    onChange: (a: ArcaneEntry | null) => void;
    onRankChange: (r: number) => void;
    availableArcanes: ArcaneEntry[];
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return availableArcanes.filter(a => !q || a.name.toLowerCase().includes(q));
    }, [availableArcanes, query]);

    // Current stats at rank
    const statAtRank = arcane ? (arcane.statsByRank[rank] ?? arcane.statsLabel) : null;

    return (
        <div className="relative" ref={panelRef}>
            <div className={["rounded-xl border transition-colors",
                arcane ? "border-slate-600 bg-slate-900/60 hover:border-slate-500"
                       : "border-dashed border-slate-700/60 bg-slate-950/20 hover:border-slate-600"].join(" ")}>
                <div className="p-2.5 flex items-start gap-2 min-h-[56px] cursor-pointer select-none"
                    onClick={() => { setOpen(x => !x); setQuery(""); }}>
                    {arcane ? (
                        <>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-[8px] uppercase tracking-wide text-violet-400/60">{label}</span>
                                    <span className="text-xs font-semibold text-slate-100 truncate">{arcane.name}</span>
                                    <span className="text-[9px] px-1 rounded border border-violet-700/50 bg-violet-950/30 text-violet-400 shrink-0">{arcane.rarity}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={statAtRank ?? ""}>
                                    {statAtRank}
                                    {rank < arcane.maxRank && <span className="text-slate-600 ml-1">@{rank}/{arcane.maxRank}</span>}
                                </div>
                            </div>
                            <button className="text-slate-600 hover:text-slate-300 text-xs shrink-0"
                                onClick={e => { e.stopPropagation(); onChange(null); }}>✕</button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs w-full">
                            <span className="text-[8px] uppercase tracking-wide text-violet-400/40 mr-1">{label}</span>
                            <span>+</span><span>Add Arcane</span>
                        </div>
                    )}
                </div>

                {/* Rank slider */}
                {arcane && (
                    <div className="flex items-center gap-1.5 px-2.5 pb-2 border-t border-slate-800/40 pt-1.5"
                        onClick={e => e.stopPropagation()}>
                        <span className="text-[9px] text-slate-600 shrink-0">Rank</span>
                        <input type="range" min={0} max={arcane.maxRank} value={rank}
                            onChange={e => onRankChange(+e.target.value)}
                            className="flex-1 h-1 accent-violet-500 cursor-pointer" />
                        <span className="text-[9px] font-mono text-slate-400 w-8 text-right shrink-0">{rank}/{arcane.maxRank}</span>
                    </div>
                )}
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                    <div className="p-2 border-b border-slate-800">
                        <input ref={inputRef} type="text" placeholder="Search arcanes…" value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                        {arcane && <button className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-800/50"
                            onClick={() => { onChange(null); setOpen(false); }}>Clear slot</button>}
                        {filtered.length === 0 && <div className="px-3 py-4 text-xs text-slate-500 text-center">No arcanes found</div>}
                        {filtered.map(a => (
                            <button key={a.uniqueName}
                                className={["w-full px-3 py-2 text-left hover:bg-slate-800/50 transition-colors",
                                    a.name === arcane?.name ? "bg-slate-800/30" : ""].join(" ")}
                                onClick={() => { onChange(a); onRankChange(a.maxRank); setOpen(false); setQuery(""); }}>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-slate-200 flex-1 truncate">{a.name}</span>
                                    <span className="text-[9px] px-1 rounded border border-violet-700/50 bg-violet-950/30 text-violet-400 shrink-0">{a.rarity}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{a.statsLabel}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Riven Slot ────────────────────────────────────────────────────────────────

function RivenSlotEditor({ weaponName, rivenMod, rivenDrain, rivenPolarity, onUpdate, onRemove }: {
    weaponName: string;
    rivenMod: ModEntry | null;
    rivenDrain: number;
    rivenPolarity: string;
    onUpdate: (mod: ModEntry) => void;
    onRemove: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [stats, setStats] = useState<RivenStat[]>([
        { stat: "critChanceBonus", value: 0 },
        { stat: "damageBonus",     value: 0 },
    ]);
    const [drain, setDrain]     = useState(rivenDrain || 14);
    const [polarity, setPolarity] = useState(rivenPolarity || "");

    function handleApply() {
        const mod = makeRivenEntry(weaponName, stats.filter(s => s.value !== 0), 8, polarity, drain);
        onUpdate(mod);
        setOpen(false);
    }

    function addStat() {
        if (stats.length < 4) setStats(p => [...p, { stat: "damageBonus", value: 0 }]);
    }
    function removeStat(i: number) { setStats(p => p.filter((_, j) => j !== i)); }
    function updateStat(i: number, field: "stat" | "value", val: string | number) {
        setStats(p => p.map((s, j) => j === i ? { ...s, [field]: val } : s));
    }

    return (
        <div className="rounded-xl border border-yellow-700/40 bg-yellow-950/10">
            <div className="p-2.5 flex items-center gap-2 cursor-pointer" onClick={() => setOpen(v => !v)}>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[8px] uppercase tracking-wide text-yellow-400/60">Riven</span>
                        <span className="text-xs font-semibold text-slate-100 truncate">
                            {rivenMod ? rivenMod.name : `${weaponName} Riven Mod`}
                        </span>
                        <span className="text-[9px] px-1 rounded border border-yellow-700/50 bg-yellow-950/30 text-yellow-400">RIVEN</span>
                    </div>
                    {rivenMod && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{rivenMod.statsLabel}</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {rivenMod && <button className="text-slate-600 hover:text-red-400 text-xs" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>}
                    <svg className={["w-4 h-4 text-slate-500 transition-transform", open ? "rotate-180" : ""].join(" ")}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
            </div>

            {open && (
                <div className="border-t border-yellow-800/30 px-3 py-3 space-y-2.5" onClick={e => e.stopPropagation()}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">Enter riven stats manually</div>

                    {stats.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <select value={s.stat}
                                onChange={e => updateStat(i, "stat", e.target.value)}
                                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none">
                                {RIVEN_STATS.map(rs => (
                                    <option key={rs.key} value={rs.key}>{rs.label}</option>
                                ))}
                            </select>
                            <input type="number" step="0.1" value={s.value}
                                onChange={e => updateStat(i, "value", parseFloat(e.target.value) || 0)}
                                className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 text-right focus:outline-none" />
                            <span className="text-[10px] text-slate-500">%</span>
                            <button onClick={() => removeStat(i)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
                        </div>
                    ))}
                    {stats.length < 4 && (
                        <button onClick={addStat} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">+ Add stat</button>
                    )}

                    <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">Drain</span>
                            <input type="number" min={0} max={20} value={drain}
                                onChange={e => setDrain(+e.target.value)}
                                className="w-14 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">Polarity</span>
                            <PolarityPicker value={polarity} onChange={setPolarity} />
                        </div>
                        <button onClick={handleApply}
                            className="ml-auto rounded-lg bg-yellow-700/40 border border-yellow-600/50 px-3 py-1 text-xs font-semibold text-yellow-300 hover:bg-yellow-700/60 transition-colors">
                            Apply Riven
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Multi-Attack Display ──────────────────────────────────────────────────────

function AttackBreakdown({ weapon }: { weapon: WeaponEntry }) {
    if (weapon.attacks.length <= 1) return null;
    return (
        <div className="mt-3 pt-3 border-t border-slate-800/50">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Attack Modes</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {weapon.attacks.map(atk => {
                    const dmgTypes = Object.entries({
                        Impact: atk.damage.impact, Puncture: atk.damage.puncture,
                        Slash: atk.damage.slash, Heat: atk.damage.heat, Cold: atk.damage.cold,
                        Elec: atk.damage.electricity, Toxin: atk.damage.toxin,
                    }).filter(([, v]) => v > 0);
                    return (
                        <div key={atk.name} className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-xs font-semibold text-slate-200">{atk.name}</span>
                                {atk.chargeTime != null && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-blue-700/40 bg-blue-950/30 text-blue-400">
                                        {atk.chargeTime.toFixed(1)}s charge
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-[10px]">
                                <div><span className="text-slate-500">Dmg</span> <span className="text-slate-200 font-mono">{fmt(atk.damageTotal, 1)}</span></div>
                                <div><span className="text-slate-500">CC</span> <span className="text-slate-200 font-mono">{fmt(atk.critChance * 100, 0)}%</span></div>
                                <div><span className="text-slate-500">CD</span> <span className="text-slate-200 font-mono">{atk.critMultiplier.toFixed(1)}x</span></div>
                                <div><span className="text-slate-500">SC</span> <span className="text-slate-200 font-mono">{fmt(atk.statusChance * 100, 0)}%</span></div>
                                {dmgTypes.slice(0, 2).map(([type, val]) => (
                                    <div key={type}><span className="text-slate-500">{type}</span> <span className="text-slate-200 font-mono">{fmt(val, 1)}</span></div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Weapon Selector ───────────────────────────────────────────────────────────

function WeaponSelector({ selected, onSelect }: { selected: WeaponEntry | null; onSelect: (w: WeaponEntry) => void }) {
    const [query, setQuery] = useState("");
    const [cat, setCat] = useState<WeaponCategory | "All">("All");
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);
    const weapons  = useMemo(() => getWeaponCatalog(), []);
    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return weapons.filter(w => (cat === "All" || w.category === cat) && (!q || w.name.toLowerCase().includes(q))).slice(0, 100);
    }, [weapons, query, cat]);

    return (
        <div className="relative" ref={panelRef}>
            <button onClick={() => setOpen(x => !x)}
                className={["w-full flex items-center gap-2 rounded-xl border px-4 py-3 text-left transition-colors",
                    selected ? "border-slate-600 bg-slate-900/60 hover:border-slate-500"
                             : "border-dashed border-slate-700 bg-slate-950/20 hover:border-slate-600"].join(" ")}>
                {selected ? (
                    <><span className="text-sm font-semibold text-slate-100">{selected.name}</span>
                    <span className="text-xs text-slate-500">{selected.category} · {selected.weaponType}</span>
                    {selected.canOverLevel && <span className="text-[9px] px-1 rounded border border-orange-700/50 bg-orange-950/30 text-orange-400 font-semibold">LVL40</span>}
                    <span className="ml-auto text-xs text-slate-600">▾</span></>
                ) : <span className="text-sm text-slate-500">Select a weapon…</span>}
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                    <div className="p-2 space-y-2 border-b border-slate-800">
                        <input ref={inputRef} type="text" placeholder="Search weapons…" value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
                        <div className="flex gap-1">
                            {(["All", ...CATEGORY_LABELS] as const).map(c => (
                                <button key={c} onClick={() => setCat(c)}
                                    className={["rounded-full px-2.5 py-0.5 text-xs border transition-colors",
                                        cat === c ? "bg-slate-100 text-slate-900 border-slate-100" : "bg-slate-950 text-slate-400 border-slate-700 hover:bg-slate-800"].join(" ")}>{c}</button>
                            ))}
                        </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                        {filtered.map(w => (
                            <button key={w.uniqueName}
                                className={["w-full px-3 py-2 text-left hover:bg-slate-800/50 transition-colors",
                                    w.name === selected?.name ? "bg-slate-800/30" : ""].join(" ")}
                                onClick={() => { onSelect(w); setOpen(false); setQuery(""); }}>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-200">{w.name}</span>
                                    {w.attacks.length > 1 && <span className="text-[9px] px-1 rounded border border-blue-700/40 bg-blue-950/30 text-blue-400">{w.attacks.length} attacks</span>}
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

// ── Exclusion List ────────────────────────────────────────────────────────────

function ExclusionList({ allMods, excluded, onToggle }: {
    allMods: ModEntry[]; excluded: Set<string>; onToggle: (name: string) => void;
}) {
    const [query, setQuery] = useState("");
    const filteredAll = useMemo(() => {
        const q = query.toLowerCase();
        return allMods.filter(m => !q || m.name.toLowerCase().includes(q)).slice(0, 60);
    }, [allMods, query]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Excluded Mods</div>
                <span className="text-[10px] text-slate-600">{excluded.size} excluded · Excluded mods are never used by the optimizer</span>
            </div>
            <input type="text" placeholder="Search to add/remove exclusions…" value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
            {excluded.size > 0 && (
                <div>
                    <div className="text-[10px] text-slate-600 mb-1.5 uppercase tracking-wide">Currently excluded</div>
                    <div className="flex flex-wrap gap-1.5">
                        {[...excluded].filter(n => !query || n.toLowerCase().includes(query.toLowerCase())).map(name => (
                            <button key={name} onClick={() => onToggle(name)}
                                className="rounded-full px-2.5 py-0.5 text-[10px] border border-red-700/60 bg-red-950/30 text-red-300 hover:bg-red-900/40 transition-colors">
                                ✕ {name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {filteredAll.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 divide-y divide-slate-800/50">
                    {filteredAll.map(m => (
                        <button key={m.uniqueName} onClick={() => onToggle(m.name)}
                            className={["w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-slate-800/50",
                                excluded.has(m.name) ? "text-red-300 bg-red-950/10" : "text-slate-300"].join(" ")}>
                            <span className="w-4 shrink-0 text-center">{excluded.has(m.name) ? "✕" : "+"}</span>
                            {m.polarity && <PolarityIcon polarity={m.polarity} className="w-3 h-3 opacity-50 shrink-0" />}
                            <span className="flex-1 truncate">{m.name}</span>
                            <span className="text-slate-600 ml-auto shrink-0 truncate max-w-[120px]">{m.statsLabel.slice(0, 24)}</span>
                        </button>
                    ))}
                </div>
            )}
            {!query && excluded.size === 0 && (
                <div className="text-[11px] text-slate-600 text-center py-1">Search above to exclude mods from the optimizer.</div>
            )}
        </div>
    );
}

// ── Reasoning Panel ───────────────────────────────────────────────────────────

function ReasoningPanel({ reasoning }: { reasoning: BuildReasoning }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
            <button className="w-full flex items-center justify-between px-4 py-3" onClick={() => setOpen(v => !v)}>
                <span className="text-sm font-semibold">Why this build?</span>
                <svg className={["w-4 h-4 text-slate-500 transition-transform", open ? "rotate-180" : ""].join(" ")}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {open && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
                    <p className="text-[11px] text-slate-400 pt-3">{reasoning.summary}</p>
                    <div className="space-y-1.5">
                        {reasoning.steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-lg bg-slate-900/50 border border-slate-800/50 px-3 py-2">
                                <span className="text-[10px] font-mono text-slate-600 shrink-0 mt-0.5">#{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-slate-200">{step.modName}</span>
                                        <span className="text-[10px] font-mono text-green-400 shrink-0">+{step.pctGain.toFixed(1)}%</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{step.why}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Saved Builds ──────────────────────────────────────────────────────────────

function SavedBuildsPanel({ weapon, currentSlots, currentRanks, currentPolarities, currentCfg,
    exilusMod, exilusPol, arcane1, arcane1Rank, hasExilus, onLoad }: {
    weapon: WeaponEntry | null;
    currentSlots: (ModEntry | null)[]; currentRanks: number[]; currentPolarities: string[];
    currentCfg: { weaponRank: number; hasCatalyst: boolean };
    exilusMod: ModEntry | null; exilusPol: string;
    arcane1: ArcaneEntry | null; arcane1Rank: number;
    hasExilus: boolean;
    onLoad: (b: SavedBuild) => void;
}) {
    const savedBuilds  = useTrackerStore(s => s.getSavedBuilds());
    const saveModBuild = useTrackerStore(s => s.saveModBuild);
    const deleteBuild  = useTrackerStore(s => s.deleteModBuild);
    const allMods      = useMemo(() => weapon ? getModsForWeapon(weapon) : [], [weapon]);
    const [saveName, setSaveName] = useState("");
    const [saving, setSaving]     = useState(false);
    const [comparing, setComparing] = useState<string | null>(null);

    function handleSave() {
        if (!weapon || !saveName.trim()) return;
        saveModBuild({
            id: uid(), name: saveName.trim(),
            weaponUniqueName: weapon.uniqueName, weaponName: weapon.name,
            slotModUniqueNames: currentSlots.map(m => m?.uniqueName ?? ""),
            slotPolarities: [...currentPolarities],
            weaponRank: currentCfg.weaponRank, hasCatalyst: currentCfg.hasCatalyst,
            hasExilus,
            exilusModUniqueName: exilusMod?.uniqueName,
            exilusPol,
            arcane1UniqueName: arcane1?.uniqueName, arcane1Rank,
            createdAt: new Date().toISOString(),
        });
        setSaveName(""); setSaving(false);
    }

    const thisWeapon = savedBuilds.filter(b => weapon && b.weaponUniqueName === weapon.uniqueName);
    const others     = savedBuilds.filter(b => !weapon || b.weaponUniqueName !== weapon.uniqueName);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Saved Builds</div>
                {weapon && <button onClick={() => setSaving(v => !v)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">{saving ? "Cancel" : "+ Save current"}</button>}
            </div>
            {saving && (
                <div className="flex gap-2">
                    <input type="text" placeholder="Build name…" value={saveName} onChange={e => setSaveName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
                    <button onClick={handleSave} disabled={!saveName.trim()}
                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-colors">Save</button>
                </div>
            )}
            {savedBuilds.length === 0 && <div className="text-[11px] text-slate-600 text-center py-2">No saved builds yet.</div>}
            {thisWeapon.length > 0 && (
                <div className="space-y-1.5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">This weapon</div>
                    {thisWeapon.map(b => {
                        const mods  = b.slotModUniqueNames.map(un => allMods.find(m => m.uniqueName === un) ?? null);
                        const stats = weapon ? calculateBuild(weapon, mods.map(m => m?.effect ?? null)) : null;
                        return (
                            <div key={b.id} className={["rounded-lg border px-3 py-2",
                                comparing === b.id ? "border-blue-700/50 bg-blue-950/10" : "border-slate-800 bg-slate-900/40"].join(" ")}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold text-slate-200 truncate">{b.name}</div>
                                        <div className="text-[10px] text-slate-500">
                                            {b.slotModUniqueNames.filter(Boolean).length} mods · Rank {b.weaponRank}
                                            {b.hasCatalyst ? " · ◈" : ""}
                                            {b.hasExilus ? " · Exilus" : ""}
                                            {b.arcane1UniqueName ? " · Arcane" : ""}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => setComparing(comparing === b.id ? null : b.id)}
                                            className={["text-[10px] px-2 py-1 rounded border transition-colors",
                                                comparing === b.id ? "border-blue-600 bg-blue-900/40 text-blue-300" : "border-slate-700 text-slate-400 hover:text-slate-200"].join(" ")}>
                                            Compare
                                        </button>
                                        <button onClick={() => onLoad(b)} className="text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">Load</button>
                                        <button onClick={() => deleteBuild(b.id)} className="text-[10px] text-slate-700 hover:text-red-400 transition-colors px-1">✕</button>
                                    </div>
                                </div>
                                {comparing === b.id && stats && (
                                    <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-800/60">
                                        {[["DPS", fmt(stats.sustainedDPS)], ["Crit%", fmt(stats.modded.critChance*100,1)+"%"], ["Status%", fmt(stats.modded.statusChance*100,1)+"%"]].map(([lbl, val]) => (
                                            <div key={lbl} className="text-center">
                                                <div className="text-[9px] text-slate-600 uppercase">{lbl}</div>
                                                <div className="text-[11px] font-mono text-blue-300">{val}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {others.length > 0 && (
                <div className="space-y-1.5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">Other weapons</div>
                    {others.map(b => (
                        <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                            <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-200 truncate">{b.name}</div>
                                <div className="text-[10px] text-slate-500">{b.weaponName} · {b.slotModUniqueNames.filter(Boolean).length} mods</div>
                            </div>
                            <button onClick={() => deleteBuild(b.id)} className="text-[10px] text-slate-700 hover:text-red-400 transition-colors px-1 shrink-0">✕</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Owned Mods ────────────────────────────────────────────────────────────────

function OwnedModsPanel({ weapon }: { weapon: WeaponEntry | null }) {
    const getOwned = useTrackerStore(s => s.getOwnedModNames);
    const setOwned = useTrackerStore(s => s.setOwnedModNames);
    const [query, setQuery] = useState("");
    const owned   = useMemo(() => new Set(getOwned()), [getOwned]);
    const allMods = useMemo(() => weapon ? getModsForWeapon(weapon) : [], [weapon]);
    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return allMods.filter(m => !q || m.name.toLowerCase().includes(q));
    }, [allMods, query]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Owned Mods</div>
                <div className="flex gap-3 text-[10px]">
                    <button onClick={() => setOwned(allMods.map(m => m.name))} className="text-slate-400 hover:text-slate-200">All</button>
                    <button onClick={() => setOwned([])} className="text-slate-400 hover:text-slate-200">None</button>
                    <span className="text-slate-600">{owned.size}/{allMods.length} owned</span>
                </div>
            </div>
            <input type="text" placeholder="Filter mods…" value={query} onChange={e => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800 divide-y divide-slate-800/50">
                {filtered.map(m => (
                    <label key={m.uniqueName} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-800/40 cursor-pointer">
                        <input type="checkbox" checked={owned.has(m.name)}
                            onChange={() => { const n = new Set(owned); n.has(m.name) ? n.delete(m.name) : n.add(m.name); setOwned([...n]); }}
                            className="accent-blue-500 shrink-0" />
                        <span className="shrink-0">
                            {m.polarity ? <PolarityIcon polarity={m.polarity} className="w-3.5 h-3.5 opacity-60" /> : <span className="text-slate-700 text-xs">○</span>}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-200 truncate">{m.name}</div>
                            {m.statsLabel && <div className="text-[10px] text-slate-500 truncate">{m.statsLabel}</div>}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface BuildCfg { weaponRank: number; hasCatalyst: boolean; masteryRank: number; }

export default function ModBuilder() {
    const masteryRank      = useTrackerStore(s => s.state.player.masteryRank) ?? 0;
    const getOwnedModNames = useTrackerStore(s => s.getOwnedModNames);

    const [weapon, setWeapon]          = useState<WeaponEntry | null>(null);
    const [slots, setSlots]            = useState<(ModEntry | null)[]>(Array(SLOT_COUNT).fill(null));
    const [ranks, setRanks]            = useState<number[]>(Array(SLOT_COUNT).fill(0));
    const [slotPols, setSlotPols]      = useState<string[]>(Array(SLOT_COUNT).fill(""));
    // Exilus
    const [hasExilus, setHasExilus]    = useState(false);
    const [exilusMod, setExilusMod]    = useState<ModEntry | null>(null);
    const [exilusRank, setExilusRank]  = useState(0);
    const [exilusPol, setExilusPol]    = useState("");
    // Riven
    const [rivenMod, setRivenMod]      = useState<ModEntry | null>(null);
    const [rivenSlotIdx, setRivenSlotIdx] = useState<number | null>(null); // which slot holds riven
    // Arcanes — weapons only have 1 arcane slot
    const [arcane1, setArcane1]        = useState<ArcaneEntry | null>(null);
    const [arcane1Rank, setArcane1Rank]= useState(0);
    const [includeArcaneStats, setIncludeArcaneStats] = useState(true);
    // Attack mode selection
    const [selectedAttackIdx, setSelectedAttackIdx] = useState(0);
    // Excluded
    const [excluded, setExcluded]      = useState<Set<string>>(new Set());
    // Build config
    const [buildCfg, setBuildCfg]      = useState<BuildCfg>({ weaponRank: 30, hasCatalyst: false, masteryRank });
    // Optimizer
    const [goal, setGoal]              = useState<OptimizeGoal>("damage");
    const [respectCap, setRespectCap]    = useState(false);
    const [allowNonMax, setAllowNonMax]  = useState(false);
    const [onlyOwned, setOnlyOwned]      = useState(false);
    const [factionOn, setFactionOn]      = useState(false);
    const [faction, setFaction]          = useState("Grineer");
    const [allowCatalyst, setAllowCatalyst] = useState(false);
    const [allowForma, setAllowForma]    = useState(false);
    const [optExilus, setOptExilus]      = useState(false);
    const [optArcane, setOptArcane]      = useState(false);
    // UI
    const [reasoning, setReasoning]    = useState<BuildReasoning | null>(null);
    const [tab, setTab]                = useState<"build"|"saves"|"owned"|"exclude">("build");
    const [optimizing, setOptimizing]  = useState(false);

    useEffect(() => { setBuildCfg(p => ({ ...p, masteryRank })); }, [masteryRank]);

    function handleSelectWeapon(w: WeaponEntry) {
        setWeapon(w);
        setSlots(Array(SLOT_COUNT).fill(null));
        setRanks(Array(SLOT_COUNT).fill(0));
        const pols = Array(SLOT_COUNT).fill("") as string[];
        w.polarities.forEach((p, i) => { if (i < SLOT_COUNT) pols[i] = p; });
        setSlotPols(pols);
        setExilusMod(null); setExilusRank(0); setExilusPol(""); setHasExilus(false);
        setRivenMod(null); setRivenSlotIdx(null);
        setArcane1(null); setArcane1Rank(0);
        setSelectedAttackIdx(0);
        setBuildCfg(p => ({ ...p, weaponRank: 30, hasCatalyst: false }));
        setReasoning(null);
    }

    const compatMods   = useMemo(() => weapon ? getModsForWeapon(weapon) : [], [weapon]);
    const weaponArcanes = useMemo(() => weapon ? getArcanesByWeaponCategory(weapon.category) : [], [weapon]);
    const ownedSet     = useMemo(() => new Set(getOwnedModNames()), [getOwnedModNames]);
    const usedNames    = useMemo(() => {
        const s = new Set(slots.filter(Boolean).map(m => m!.name));
        if (exilusMod) s.add(exilusMod.name);
        if (rivenMod)  s.add(rivenMod.name);
        return s;
    }, [slots, exilusMod, rivenMod]);

    // Forma count: count slots whose current polarity differs from weapon default
    const formaCount = useMemo(() => {
        if (!weapon) return 0;
        return slotPols.filter((p, i) => {
            const defaultPol = weapon.polarities[i] ?? "";
            return p !== "" && p !== defaultPol;
        }).length;
    }, [weapon, slotPols]);

    function handleSlotChange(i: number, mod: ModEntry | null) {
        setSlots(p => { const n = [...p]; n[i] = mod; return n; });
        setRanks(p => { const n = [...p]; n[i] = mod ? mod.fusionLimit : 0; return n; });
        setReasoning(null);
    }
    function handleRankChange(i: number, r: number) { setRanks(p => { const n = [...p]; n[i] = r; return n; }); }
    function handlePolChange(i: number, p: string)  { setSlotPols(p2 => { const n = [...p2]; n[i] = p; return n; }); }
    function handleExilusChange(_: number, m: ModEntry | null) { setExilusMod(m); setExilusRank(m ? m.fusionLimit : 0); }
    function toggleExclude(name: string) { setExcluded(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; }); }

    // For a riven: place it into the first empty normal slot
    function handleRivenUpdate(mod: ModEntry) {
        setRivenMod(mod);
        // Find or keep the riven slot
        const targetIdx = rivenSlotIdx ?? slots.findIndex(s => s === null);
        if (targetIdx >= 0) {
            setSlots(p => { const n = [...p]; n[targetIdx] = mod; return n; });
            setRanks(p => { const n = [...p]; n[targetIdx] = mod.fusionLimit; return n; });
            setRivenSlotIdx(targetIdx);
        }
    }
    function handleRivenRemove() {
        if (rivenSlotIdx !== null) {
            setSlots(p => { const n = [...p]; n[rivenSlotIdx] = null; return n; });
            setRanks(p => { const n = [...p]; n[rivenSlotIdx] = 0; return n; });
        }
        setRivenMod(null); setRivenSlotIdx(null);
    }

    const capacityCfg: CapacityConfig = {
        weaponRank: buildCfg.weaponRank, hasCatalyst: buildCfg.hasCatalyst,
        masteryRank: buildCfg.masteryRank, canOverLevel: weapon?.canOverLevel ?? false,
    };

    const allSlotsForCap = useMemo(() => {
        const s = [...slots];
        if (hasExilus) s.push(exilusMod);
        return s;
    }, [slots, exilusMod, hasExilus]);
    const allPolsForCap  = useMemo(() => { const p = [...slotPols]; if (hasExilus) p.push(exilusPol); return p; }, [slotPols, exilusPol, hasExilus]);
    const allRanksForCap = useMemo(() => { const r = [...ranks]; if (hasExilus) r.push(exilusRank); return r; }, [ranks, exilusRank, hasExilus]);

    const capacity = useMemo(() => {
        if (!weapon) return null;
        return computeCapacity(capacityCfg, allPolsForCap.map(p => ({ polarity: p })), allSlotsForCap, allRanksForCap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weapon, allSlotsForCap, allPolsForCap, allRanksForCap, buildCfg]);

    async function handleOptimize() {
        if (!weapon) return;
        if (onlyOwned && ownedSet.size === 0) return;
        setOptimizing(true);
        await new Promise(r => setTimeout(r, 10));
        try {
            // Resolve which attack to optimize for
            const atk = weapon.attacks.length > 1 ? weapon.attacks[selectedAttackIdx] : null;

            // If allowCatalyst, override capacityCfg to hasCatalyst:true
            const capForOpt = respectCap ? (
                allowCatalyst && !buildCfg.hasCatalyst
                    ? { ...capacityCfg, hasCatalyst: true }
                    : capacityCfg
            ) : undefined;

            const result = optimizeBuild(weapon, null, goal, SLOT_COUNT, {
                ownedModNames:    onlyOwned ? ownedSet : undefined,
                excludedModNames: excluded.size > 0 ? excluded : undefined,
                allowNonMaxRank:  allowNonMax,
                targetFaction:    factionOn ? faction : "",
                capacityConfig:   capForOpt,
                slotPolarities:   slotPols,
                allowCatalyst,
                allowForma,
                optimizeExilus:   optExilus && hasExilus,
                exilusPolarity:   exilusPol,
                optimizeArcane:   optArcane,
                buildForAttack:   atk,
            });

            // Apply mod slots
            setSlots([...result.slots] as (ModEntry | null)[]);
            setRanks([...result.slotRanks] as number[]);

            // Apply polarity changes from forma optimizer
            if (allowForma) setSlotPols([...result.slotPolarities]);

            // Apply catalyst marker if optimizer needed it
            if (result.needsCatalyst) setBuildCfg(p => ({ ...p, hasCatalyst: true }));

            // Apply exilus mod if optimized
            if (optExilus && hasExilus && result.exilusMod) {
                setExilusMod(result.exilusMod);
                setExilusRank(result.exilusRank);
            }

            // Apply arcane if optimized
            if (optArcane && result.arcane) {
                setArcane1(result.arcane);
                setArcane1Rank(result.arcaneRank);
            }

            setReasoning(explainBuild(weapon, result.mods, result.ranks, goal, factionOn ? faction : "", atk));
        } finally { setOptimizing(false); }
    }

    function handleLoadBuild(build: SavedBuild) {
        if (!weapon) return;
        const mods = build.slotModUniqueNames.map(un => compatMods.find(m => m.uniqueName === un) ?? null);
        const ns   = [...mods, ...Array(SLOT_COUNT).fill(null)].slice(0, SLOT_COUNT) as (ModEntry | null)[];
        setSlots(ns); setRanks(ns.map(m => m ? m.fusionLimit : 0));
        setSlotPols([...build.slotPolarities, ...Array(SLOT_COUNT).fill("")].slice(0, SLOT_COUNT));
        setBuildCfg(p => ({ ...p, weaponRank: build.weaponRank, hasCatalyst: build.hasCatalyst }));
        setHasExilus(build.hasExilus ?? false);
        if (build.exilusModUniqueName) {
            const em = compatMods.find(m => m.uniqueName === build.exilusModUniqueName) ?? null;
            setExilusMod(em); setExilusRank(em ? em.fusionLimit : 0);
        }
        setExilusPol(build.exilusPol ?? "");
        if (build.arcane1UniqueName) {
            const a = weaponArcanes.find(a => a.uniqueName === build.arcane1UniqueName) ?? null;
            setArcane1(a); setArcane1Rank(build.arcane1Rank ?? 0);
        }
        setTab("build");
    }

    return (
        <div className="space-y-4">
            {/* Weapon selector */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold mb-3">Select Weapon</div>
                <WeaponSelector selected={weapon} onSelect={handleSelectWeapon} />
                {weapon && (
                    <>
                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px] text-slate-500">
                            <div><span className="text-slate-400">Dmg</span> {fmt(weapon.damage.total, 1)}</div>
                            <div><span className="text-slate-400">CC</span> {fmt(weapon.critChance * 100, 1)}%</div>
                            <div><span className="text-slate-400">CD</span> {weapon.critMultiplier.toFixed(1)}x</div>
                            <div><span className="text-slate-400">SC</span> {fmt(weapon.statusChance * 100, 1)}%</div>
                            <div><span className="text-slate-400">FR</span> {weapon.fireRate.toFixed(2)}/s</div>
                            <div><span className="text-slate-400">Mag</span> {weapon.magazineSize}/{weapon.reloadTime.toFixed(1)}s</div>
                        </div>
                        <AttackBreakdown weapon={weapon} />
                    </>
                )}
            </div>

            {weapon && (
                <>
                    {/* Tabs */}
                    <div className="flex gap-1 flex-wrap">
                        {(["build","saves","owned","exclude"] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={["rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors",
                                    tab === t ? "bg-slate-100 text-slate-900 border-slate-100" : "bg-slate-950/40 text-slate-400 border-slate-700 hover:bg-slate-900"].join(" ")}>
                                {t === "build" ? "Build" : t === "saves" ? "Saved Builds" : t === "owned" ? "Owned Mods" : `Excluded${excluded.size ? ` (${excluded.size})` : ""}`}
                            </button>
                        ))}
                    </div>

                    {tab === "owned"   && <OwnedModsPanel weapon={weapon} />}
                    {tab === "saves"   && <SavedBuildsPanel weapon={weapon} currentSlots={slots} currentRanks={ranks}
                        currentPolarities={slotPols} currentCfg={buildCfg}
                        exilusMod={exilusMod} exilusPol={exilusPol}
                        arcane1={arcane1} arcane1Rank={arcane1Rank}
                        hasExilus={hasExilus} onLoad={handleLoadBuild} />}
                    {tab === "exclude" && <ExclusionList allMods={compatMods} excluded={excluded} onToggle={toggleExclude} />}

                    {tab === "build" && (
                        <>
                            {/* Config */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                <div className="text-sm font-semibold mb-3 flex items-center gap-3">
                                    Configuration
                                    {formaCount > 0 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded border border-slate-600 bg-slate-800/60 text-slate-300">
                                            {formaCount} forma required
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wide text-slate-500 block mb-1.5">Weapon Rank</label>
                                        <div className="flex items-center gap-2">
                                            <input type="range" min={0} max={maxWeaponRank(weapon.canOverLevel)} value={buildCfg.weaponRank}
                                                onChange={e => setBuildCfg(p => ({ ...p, weaponRank: +e.target.value }))} className="flex-1 accent-blue-500" />
                                            <span className="text-sm font-mono text-slate-200 w-7 text-right">{buildCfg.weaponRank}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wide text-slate-500 block mb-1.5">Mastery Rank</label>
                                        <div className="flex items-center gap-2">
                                            <input type="range" min={0} max={40} value={buildCfg.masteryRank}
                                                onChange={e => setBuildCfg(p => ({ ...p, masteryRank: +e.target.value }))} className="flex-1 accent-blue-500" />
                                            <span className="text-sm font-mono text-slate-200 w-7 text-right">{buildCfg.masteryRank}</span>
                                        </div>
                                        <div className="text-[9px] text-slate-600 mt-0.5">Min cap: {minModCapacity(buildCfg.masteryRank)}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-wide text-slate-500">Orokin Catalyst</label>
                                        <button onClick={() => setBuildCfg(p => ({ ...p, hasCatalyst: !p.hasCatalyst }))}
                                            className={["flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                                                buildCfg.hasCatalyst ? "border-cyan-700/60 bg-cyan-950/30 text-cyan-300" : "border-slate-700 bg-slate-900/40 text-slate-500 hover:border-slate-600 hover:text-slate-300"].join(" ")}>
                                            {buildCfg.hasCatalyst ? "◈ Installed — ×2 capacity" : "○ Not installed"}
                                        </button>
                                        <div className="text-[10px] text-slate-400">
                                            Total: <span className="font-mono text-slate-200 font-semibold">{totalModCapacity(capacityCfg)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Capacity bar */}
                            {capacity && (
                                <div className={["rounded-2xl border p-4",
                                    capacity.overCapacity ? "border-red-700/50 bg-red-950/20" : "border-slate-800 bg-slate-950/40"].join(" ")}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-semibold flex items-center gap-2">
                                            Mod Capacity
                                            {capacity.overCapacity && <span className="text-xs font-normal text-red-400">⚠ Over capacity!</span>}
                                        </div>
                                        <div className="font-mono text-sm flex items-center gap-1">
                                            <span className={capacity.overCapacity ? "text-red-400" : "text-slate-200"}>{capacity.usedCapacity}</span>
                                            <span className="text-slate-600">/</span>
                                            <span className="text-slate-300">{capacity.totalCapacity}</span>
                                            {capacity.auraGrant > 0 && <span className="text-[10px] text-green-400 ml-1">(+{capacity.auraGrant} aura)</span>}
                                        </div>
                                    </div>
                                    <CapBar used={capacity.usedCapacity} total={capacity.totalCapacity} over={capacity.overCapacity} />
                                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                                        <span>{capacity.remainingCapacity >= 0 ? `${capacity.remainingCapacity} remaining` : `${Math.abs(capacity.remainingCapacity)} over`}</span>
                                        <span>{buildCfg.hasCatalyst ? "Catalyzed ×2 · " : ""}Rank {buildCfg.weaponRank} · MR{buildCfg.masteryRank}</span>
                                    </div>
                                </div>
                            )}

                            {/* Mod slots */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-semibold">Mod Slots</div>
                                    <span className="text-[10px] text-slate-500">{slots.filter(Boolean).length}/{SLOT_COUNT} filled</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {slots.map((mod, i) => (
                                        <ModSlot key={i} index={i} mod={mod} rank={ranks[i] ?? 0}
                                            slotPolarity={slotPols[i] ?? ""} compatMods={compatMods}
                                            usedNames={usedNames} ownedNames={ownedSet} onlyOwned={false}
                                            onChange={handleSlotChange} onRankChange={handleRankChange}
                                            onPolarityChange={handlePolChange}
                                            effDrain={mod ? effectiveDrain(mod, slotPols[i] ?? "", ranks[i]) : 0} />
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-800/50 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                                    <span><span className="text-green-400 font-bold">#</span> matching (½ cost)</span>
                                    <span><span className="text-amber-400 font-bold">#</span> non-matching (+¼ cost)</span>
                                    <span><span className="text-slate-400 font-bold">#</span> no polarity (base cost)</span>
                                </div>
                            </div>

                            {/* Exilus slot */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-semibold">Exilus Weapon Slot</div>
                                    <button onClick={() => { setHasExilus(v => !v); if (hasExilus) { setExilusMod(null); setExilusRank(0); } }}
                                        className={["text-xs px-3 py-1 rounded-full border transition-colors",
                                            hasExilus ? "border-blue-700/60 bg-blue-950/20 text-blue-300" : "border-slate-700 text-slate-500 hover:border-slate-600"].join(" ")}>
                                        {hasExilus ? "Adapter installed" : "Install Exilus Adapter"}
                                    </button>
                                </div>
                                {hasExilus ? (
                                    <ModSlot index={0} label="Exilus" mod={exilusMod} rank={exilusRank}
                                        slotPolarity={exilusPol} compatMods={compatMods}
                                        usedNames={usedNames} ownedNames={ownedSet} onlyOwned={false}
                                        isExilusSlot={true}
                                        onChange={handleExilusChange}
                                        onRankChange={(_, r) => setExilusRank(r)}
                                        onPolarityChange={(_, p) => setExilusPol(p)}
                                        effDrain={exilusMod ? effectiveDrain(exilusMod, exilusPol, exilusRank) : 0} />
                                ) : (
                                    <div className="text-[11px] text-slate-600 text-center py-1">Requires an Exilus Weapon Adapter to unlock.</div>
                                )}
                            </div>

                            {/* Arcane slot — weapons have 1 slot */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-semibold">Arcane Enhancement</div>
                                    {arcane1 && (
                                        <button
                                            onClick={() => setIncludeArcaneStats(v => !v)}
                                            className={["text-xs px-2.5 py-1 rounded-full border transition-colors",
                                                includeArcaneStats
                                                    ? "border-violet-700/60 bg-violet-950/30 text-violet-300"
                                                    : "border-slate-700 text-slate-500 hover:border-slate-600"].join(" ")}
                                        >
                                            {includeArcaneStats ? "◈ Stats included in calc" : "○ Stats excluded from calc"}
                                        </button>
                                    )}
                                </div>
                                <ArcaneSlot label="Arcane" arcane={arcane1} rank={arcane1Rank}
                                    onChange={setArcane1} onRankChange={setArcane1Rank}
                                    availableArcanes={weaponArcanes} />
                                {arcane1 && (
                                    <div className="mt-2 text-[10px] text-slate-600">
                                        Permanent stats (like Reload Speed) are included in DPS calculations when toggled on.
                                        Conditional procs (On Kill, On Headshot, etc.) are display-only.
                                    </div>
                                )}
                            </div>

                            {/* Riven slot */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                <div className="text-sm font-semibold mb-3">Riven Mod</div>
                                <RivenSlotEditor
                                    weaponName={weapon.name}
                                    rivenMod={rivenMod}
                                    rivenDrain={16}
                                    rivenPolarity={rivenMod?.polarity ?? ""}
                                    onUpdate={handleRivenUpdate}
                                    onRemove={handleRivenRemove} />
                                <div className="mt-2 text-[10px] text-slate-600">
                                    Riven stats are entered manually. The riven occupies one of the 8 standard mod slots.
                                </div>
                            </div>

                            {/* Optimizer */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                                <div className="text-sm font-semibold">Auto-Optimize</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {GOAL_OPTIONS.map(g => (
                                        <button key={g.key} onClick={() => setGoal(g.key)} title={g.desc}
                                            className={["rounded-full px-3 py-1 text-xs border transition-colors",
                                                goal === g.key ? "bg-slate-100 text-slate-900 border-slate-100" : "bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-900"].join(" ")}>
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                                {/* Row 1 — filter / search */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {([
                                        { k: "cap",     label: "Respect Capacity", active: respectCap,  set: setRespectCap,  desc: "Only use mods that fit within the weapon mod capacity." },
                                        { k: "nonmax",  label: "Allow Non-Maxed",  active: allowNonMax, set: setAllowNonMax, desc: "Try lower-ranked mods so more fit within capacity." },
                                        { k: "owned",   label: "Owned Only",       active: onlyOwned,   set: setOnlyOwned,   desc: "Only use mods you have marked as owned." },
                                        { k: "faction", label: "Faction Focus",    active: factionOn,   set: setFactionOn,   desc: "Include faction damage mods in the build." },
                                    ] as const).map(t => (
                                        <button key={t.k} onClick={() => t.set(!t.active)} title={t.desc}
                                            className={["rounded-lg border px-2.5 py-2 text-xs text-left transition-colors",
                                                t.active ? "border-blue-700/60 bg-blue-950/20 text-blue-300" : "border-slate-700 bg-slate-900/40 text-slate-500 hover:border-slate-600 hover:text-slate-300"].join(" ")}>
                                            <div className="flex items-center gap-1.5">
                                                <span className={["w-3 h-3 rounded-full border flex items-center justify-center shrink-0",
                                                    t.active ? "border-blue-400 bg-blue-400" : "border-slate-600"].join(" ")}>
                                                    {t.active && <span className="text-slate-900 text-[8px]">&#10003;</span>}
                                                </span>
                                                <span className="font-semibold">{t.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Row 2 — gear auto-apply */}
                                <div className="space-y-1.5">
                                    <div className="text-[10px] text-slate-600 uppercase tracking-wide">Auto-apply to build</div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {([
                                            { k: "catalyst", label: "Allow Catalyst",  active: allowCatalyst, set: setAllowCatalyst, desc: "Assume Orokin Catalyst installed (doubles capacity). Marks build as needing one." },
                                            { k: "forma",    label: "Allow Forma",     active: allowForma,    set: setAllowForma,    desc: "Reassign slot polarities for minimum drain. Updates your slot polarities." },
                                            { k: "exilus",   label: "Optimize Exilus", active: optExilus,     set: setOptExilus,     desc: "Pick best exilus mod. Requires Exilus Adapter to be installed." },
                                            { k: "arcane",   label: "Optimize Arcane", active: optArcane,     set: setOptArcane,     desc: "Pick best arcane enhancement with permanent stat bonuses." },
                                        ] as const).map(t => (
                                            <button key={t.k} onClick={() => t.set(!t.active)} title={t.desc}
                                                className={["rounded-lg border px-2.5 py-2 text-xs text-left transition-colors",
                                                    t.active ? "border-cyan-700/60 bg-cyan-950/20 text-cyan-300" : "border-slate-700 bg-slate-900/40 text-slate-500 hover:border-slate-600 hover:text-slate-300"].join(" ")}>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={["w-3 h-3 rounded-full border flex items-center justify-center shrink-0",
                                                        t.active ? "border-cyan-400 bg-cyan-400" : "border-slate-600"].join(" ")}>
                                                        {t.active && <span className="text-slate-900 text-[8px]">&#10003;</span>}
                                                    </span>
                                                    <span className="font-semibold">{t.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {optExilus && !hasExilus && (
                                        <div className="text-[10px] text-amber-500 mt-1">&#9888; Install Exilus Adapter above to enable exilus optimization.</div>
                                    )}
                                </div>

                                {factionOn && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">Target</span>
                                        {FACTIONS.map(f => (
                                            <button key={f} onClick={() => setFaction(f)}
                                                className={["rounded-full px-2.5 py-0.5 text-xs border transition-colors",
                                                    faction === f ? "bg-orange-900/40 border-orange-600/60 text-orange-300" : "border-slate-700 text-slate-400 hover:border-slate-600"].join(" ")}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {onlyOwned && ownedSet.size === 0 && (
                                    <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-400">
                                        &#9888; No mods marked as owned — optimizer will return no results. Go to Owned Mods tab first.
                                    </div>
                                )}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <button onClick={handleOptimize} disabled={optimizing}
                                        className="rounded-full px-5 py-2 text-xs border border-amber-600/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 disabled:opacity-50 transition-colors font-semibold">
                                        {optimizing ? "Optimizing…" : "Optimize ▶"}
                                    </button>
                                    <p className="text-[10px] text-slate-600">
                                        Beam search (width 64).{respectCap ? " Capacity-constrained." : ""}{allowNonMax ? " Sub-ranked mods allowed." : ""}{allowCatalyst ? " Catalyst assumed." : ""}{allowForma ? " Forma assigned." : ""}{onlyOwned && ownedSet.size > 0 ? " Owned only." : ""}{factionOn ? ` vs ${faction}.` : ""}{optExilus && hasExilus ? " Exilus included." : ""}{optArcane ? " Arcane included." : ""}
                                    </p>
                                </div>
                            </div>

                            {reasoning && <ReasoningPanel reasoning={reasoning} />}

                            {/* ── Calculated Stats ── */}
                            {(() => {
                                if (!weapon) return null;

                                // Build the full mod effects list (slots + exilus + arcane)
                                const buildEffects = allSlotsForCap.map((mod, i) => {
                                    if (!mod) return null;
                                    const r = allRanksForCap[i] ?? mod.fusionLimit;
                                    return mod.effectsByRank[r] ?? mod.effect;
                                });
                                if (includeArcaneStats && arcane1) {
                                    const ae = arcane1.permanentEffectByRank[arcane1Rank] ?? {};
                                    buildEffects.push(ae as any);
                                }

                                // Helper: compute metrics for any attack (or base weapon)
                                const calcForAttack = (atkIdx: number) => {
                                    const atk = weapon.attacks[atkIdx];
                                    if (!atk) return calculateBuild(weapon, buildEffects, factionOn ? faction : "");
                                    const synth = {
                                        ...weapon,
                                        damage: atk.damage,
                                        critChance: atk.critChance,
                                        critMultiplier: atk.critMultiplier,
                                        statusChance: atk.statusChance,
                                        chargeTime: atk.chargeTime ?? null,
                                    };
                                    return calculateBuild(synth, buildEffects, factionOn ? faction : "");
                                };

                                // Damage type rows for a given damage object
                                const dmgRows = (d: typeof weapon.damage) => [
                                    { k: "impact",      l: "Impact",   v: d.impact },
                                    { k: "puncture",    l: "Punct",    v: d.puncture },
                                    { k: "slash",       l: "Slash",    v: d.slash },
                                    { k: "heat",        l: "Heat",     v: d.heat },
                                    { k: "cold",        l: "Cold",     v: d.cold },
                                    { k: "electricity", l: "Elec",     v: d.electricity },
                                    { k: "toxin",       l: "Toxin",    v: d.toxin },
                                    { k: "blast",       l: "Blast",    v: d.blast },
                                    { k: "radiation",   l: "Rad",      v: d.radiation },
                                    { k: "gas",         l: "Gas",      v: d.gas },
                                    { k: "magnetic",    l: "Mag",      v: d.magnetic },
                                    { k: "viral",       l: "Viral",    v: d.viral },
                                    { k: "corrosive",   l: "Corr",     v: d.corrosive },
                                ].filter(e => e.v > 0);

                                // Render stats for a single attack
                                const renderAttackStats = (atkIdx: number, label?: string) => {
                                    const result = calcForAttack(atkIdx);
                                    const stats  = result.modded;
                                    const atk    = weapon.attacks[atkIdx];
                                    const dmgSrc = atk ? atk.damage : weapon.damage;

                                    return (
                                        <div key={atkIdx} className={weapon.attacks.length > 1 ? "border border-slate-800/60 rounded-xl p-3 space-y-3" : "space-y-3"}>
                                            {label && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-slate-300">{label}</span>
                                                    {atk?.chargeTime != null && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-blue-700/40 bg-blue-950/30 text-blue-400">
                                                            {atk.chargeTime.toFixed(1)}s charge
                                                        </span>
                                                    )}
                                                    {atkIdx === selectedAttackIdx && weapon.attacks.length > 1 && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-green-700/40 bg-green-950/30 text-green-400 ml-auto">
                                                            ← building for
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Primary stats */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <StatBadge label="Arsenal Damage" value={fmt(stats.arsenalDamage)}
                                                    sub="per shot, no crit" />
                                                <StatBadge label="Avg Shot" value={fmt(stats.averageShotDamage)}
                                                    sub="crit-weighted" />
                                                <StatBadge label="Burst DPS" value={fmt(result.burstDPS)}
                                                    sub="no reload" />
                                                <StatBadge label="Sustained DPS" value={fmt(result.sustainedDPS)}
                                                    sub="with reload" />
                                            </div>

                                            {/* Crit + status */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <StatBadge label="Crit Chance"
                                                    value={fmt(stats.critChance * 100, 1) + "%"}
                                                    highlight={stats.critChance >= 1}
                                                    sub={stats.critChance > 1 ? (stats.critChance >= 2 ? "orange guaranteed" : "yellow guaranteed") : undefined}
                                                    tooltip={
                                                        stats.critChance >= 2
                                                            ? `Guaranteed orange crits. ${fmt((stats.critChance - Math.floor(stats.critChance)) * 100, 0)}% chance for red crit per shot.`
                                                            : stats.critChance >= 1
                                                                ? `Guaranteed yellow crits. ${fmt((stats.critChance - 1) * 100, 0)}% chance for orange crit per shot.`
                                                                : undefined
                                                    } />
                                                <StatBadge label="Crit Multiplier"
                                                    value={stats.critMultiplier.toFixed(2) + "x"}
                                                    sub="yellow crit" />
                                                <StatBadge label="Status Chance"
                                                    value={fmt(stats.statusChance * 100, 1) + "%"}
                                                    tooltip="Chance per pellet/projectile to trigger a status effect. Over 100% = multiple procs per hit." />
                                                <StatBadge label="Multishot"
                                                    value={stats.multishot.toFixed(2) + "x"}
                                                    tooltip="Projectiles per trigger pull. Each pellet rolls status independently." />
                                            </div>

                                            {/* Fire rate + magazine */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <StatBadge label="Fire Rate"
                                                    value={stats.fireRate.toFixed(3) + "/s"}
                                                    tooltip={atk?.chargeTime != null
                                                        ? `Effective rate = 1 / (${atk.chargeTime.toFixed(2)}s charge + ${(1/weapon.fireRate).toFixed(2)}s delay). Fire rate mods also speed up charge time.`
                                                        : "Shots per second."} />
                                                <StatBadge label="Magazine" value={String(stats.magazineSize)} />
                                                <StatBadge label="Reload" value={stats.reloadTime.toFixed(2) + "s"} />
                                                <StatBadge label="Avg Procs/Shot"
                                                    value={fmt(stats.multishot * stats.statusChance, 2)}
                                                    tooltip="Average number of status procs per trigger pull = Multishot × Status Chance." />
                                            </div>

                                            {/* Damage type breakdown */}
                                            {(() => {
                                                const rows = dmgRows(dmgSrc);
                                                if (!rows.length) return null;
                                                const total = rows.reduce((s, r) => s + r.v, 0);
                                                return (
                                                    <div className="pt-2 border-t border-slate-800/50">
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">
                                                            Damage Types
                                                            <span className="normal-case font-normal text-slate-600 ml-1">(hover for status effect)</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {rows.map(e => (
                                                                <StatBadge key={e.k} label={e.l}
                                                                    value={fmt(e.v, 1)}
                                                                    sub={fmt(e.v / total * 100, 0) + "%"}
                                                                    tooltip={STATUS_TIPS[e.k]} />
                                                            ))}
                                                        </div>
                                                        <div className="text-[9px] text-slate-600 mt-1.5">
                                                            Proc distribution is proportional to damage share. Hover each type to see its status effect.
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Crit tier warning */}
                                            {stats.critChance > 1 && (
                                                <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-400/80">
                                                    {stats.critChance >= 2
                                                        ? `${fmt(stats.critChance * 100, 1)}% crit — guaranteed orange crits (${fmt((stats.critChance - Math.floor(stats.critChance)) * 100, 0)}% red per shot)`
                                                        : `${fmt(stats.critChance * 100, 1)}% crit — guaranteed yellow crits (${fmt((stats.critChance - 1) * 100, 0)}% orange per shot)`}
                                                </div>
                                            )}
                                        </div>
                                    );
                                };

                                const hasMultipleAttacks = weapon.attacks.length > 1;

                                return (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="text-sm font-semibold flex items-center gap-2">
                                                Calculated Stats
                                                {factionOn && <span className="text-xs font-normal text-orange-400">vs {faction}</span>}
                                                {includeArcaneStats && arcane1 && arcane1.baseBonus && (
                                                    <span className="text-xs font-normal text-violet-400">+ {arcane1.name} (perm)</span>
                                                )}
                                            </div>
                                            {hasMultipleAttacks && (
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">Optimize for</span>
                                                    {weapon.attacks.map((atk, i) => (
                                                        <button key={i}
                                                            onClick={() => setSelectedAttackIdx(i)}
                                                            className={["rounded-full px-2.5 py-0.5 text-xs border transition-colors",
                                                                selectedAttackIdx === i
                                                                    ? "bg-slate-100 text-slate-900 border-slate-100"
                                                                    : "border-slate-700 text-slate-400 hover:border-slate-500"].join(" ")}>
                                                            {atk.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {hasMultipleAttacks ? (
                                            /* Show stats for every attack */
                                            <div className="space-y-3">
                                                {weapon.attacks.map((atk, i) => renderAttackStats(i, atk.name))}
                                            </div>
                                        ) : (
                                            /* Single attack weapon */
                                            renderAttackStats(0)
                                        )}
                                    </div>
                                );
                            })()}

                        </>
                    )}
                </>
            )}

            {!weapon && (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/20 p-8 text-center">
                    <div className="text-slate-400 text-sm">Select a weapon to begin building.</div>
                    <div className="text-slate-600 text-xs mt-1">Polarity icons · Mod rank sliders · Exilus & Arcane slots · Riven mod · Forma counter · Beam search optimizer</div>
                </div>
            )}
        </div>
    );
}
