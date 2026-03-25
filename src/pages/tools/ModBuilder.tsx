// src/pages/tools/ModBuilder.tsx
// Weapon Mod Builder — complete implementation with:
//   polarity icons · mod rank selection · exilus slot · arcane slots ×2
//   riven mod (user-defined stats) · forma counter · multi-attack display
//   beam-search optimizer · owned/excluded/faction/capacity toggles
//   build save+compare · build reasoning · status effect tooltips

import { useEffect, useMemo, useRef, useState } from "react";
import { getWeaponCatalog, type WeaponCategory, type WeaponEntry } from "../../domain/catalog/weaponCatalog";
import { getModsForWeapon, getStancesForWeapon, type ModEntry, type ModEffect, emptyEffect } from "../../domain/catalog/modCatalog";
import { getArcanesByWeaponCategory, type ArcaneEntry } from "../../domain/catalog/arcaneCatalog";
import { calculateBuild } from "../../domain/logic/damageCalc";
import { optimizeBuild, explainBuild, type OptimizeGoal, type BuildReasoning } from "../../domain/logic/buildOptimizer";
import {
    computeCapacity, effectiveDrain,
    maxWeaponRank, type CapacityConfig,
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
    {
        key: "damage",
        label: "Optimized",
        desc: "Finds the best overall build based on the optimizer's current assumptions, selected weapon stats, and any Faction Focus setting.",
    },
    {
        key: "crit",
        label: "Crit",
        desc: "Prioritizes direct-hit and critical damage. Best for weapons that kill through front-loaded shots rather than status ramp.",
    },
    {
        key: "status",
        label: "Status",
        desc: "Prioritizes proc rate, status scaling, and damage-over-time effects. Best for weapons that gain value from Viral, Heat, Corrosive, and other status effects.",
    },
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
const EMPTY_SAVED_BUILDS: SavedBuild[] = [];
const EMPTY_COUNTS: Record<string, number> = {};
const EMPTY_MOD_RANKS: Record<string, number> = {};
const EMPTY_ARCANE_RANKS: Record<string, Record<string, number>> = {};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, d = 0) {
    return n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
}
function uid() { return Math.random().toString(36).slice(2, 10); }
function displayMagazineValue(weapon: WeaponEntry, magazineSize: number) {
    return weapon.hasExplicitMagazineSize ? String(magazineSize) : "∞";
}

interface BuildMathSection {
    title: string;
    lines: string[];
}

interface BuildMathBreakdown {
    sections: BuildMathSection[];
}

interface BuildExportPayload {
    exportedAt: string;
    source: string;
    weapon: {
        name: string;
        uniqueName: string;
        category: WeaponCategory;
        selectedAttack: string | null;
    };
    assumptions: {
        goal: OptimizeGoal;
        targetFaction: string | null;
        weaponRank: number;
        masteryRank: number;
        hasCatalyst: boolean;
        includeArcaneStats: boolean;
        selectedAttackIdx: number;
    };
    build: {
        slots: Array<{
            slot: number;
            mod: string | null;
            uniqueName: string | null;
            rank: number;
            slotPolarity: string;
            modPolarity: string | null;
            statsLabel: string | null;
        }>;
        exilus: {
            enabled: boolean;
            mod: string | null;
            uniqueName: string | null;
            rank: number;
            slotPolarity: string;
            statsLabel: string | null;
        };
        arcane: {
            mod: string | null;
            uniqueName: string | null;
            rank: number;
            statsLabel: string | null;
        };
    };
    calculated: ReturnType<typeof calculateBuild> | null;
    math: BuildMathBreakdown | null;
}

function sumEffects(effects: (ModEffect | null)[]) {
    return effects.reduce((acc, effect) => {
        if (!effect) return acc;
        acc.damageBonus += effect.damageBonus ?? 0;
        acc.impactBonus += effect.impactBonus ?? 0;
        acc.punctureBonus += effect.punctureBonus ?? 0;
        acc.slashBonus += effect.slashBonus ?? 0;
        acc.heatBonus += effect.heatBonus ?? 0;
        acc.coldBonus += effect.coldBonus ?? 0;
        acc.electricityBonus += effect.electricityBonus ?? 0;
        acc.toxinBonus += effect.toxinBonus ?? 0;
        acc.critChanceBonus += effect.critChanceBonus ?? 0;
        acc.critMultBonus += effect.critMultBonus ?? 0;
        acc.statusChanceBonus += effect.statusChanceBonus ?? 0;
        acc.finalStatusChanceBonus += effect.finalStatusChanceBonus ?? 0;
        acc.multishotBonus += effect.multishotBonus ?? 0;
        acc.fireRateBonus += effect.fireRateBonus ?? 0;
        acc.attackSpeedBonus += effect.attackSpeedBonus ?? 0;
        acc.magazineBonus += effect.magazineBonus ?? 0;
        acc.reloadSpeedBonus += effect.reloadSpeedBonus ?? 0;
        acc.statusDamageBonus += effect.statusDamageBonus ?? 0;
        acc.statusDurationBonus += effect.statusDurationBonus ?? 0;
        if (effect.targetFaction) acc.factionDamageBonus += effect.factionDamageBonus ?? 0;
        return acc;
    }, {
        damageBonus: 0,
        impactBonus: 0,
        punctureBonus: 0,
        slashBonus: 0,
        heatBonus: 0,
        coldBonus: 0,
        electricityBonus: 0,
        toxinBonus: 0,
        critChanceBonus: 0,
        critMultBonus: 0,
        statusChanceBonus: 0,
        finalStatusChanceBonus: 0,
        multishotBonus: 0,
        fireRateBonus: 0,
        attackSpeedBonus: 0,
        magazineBonus: 0,
        reloadSpeedBonus: 0,
        statusDamageBonus: 0,
        statusDurationBonus: 0,
        factionDamageBonus: 0,
    });
}

function getOwnedModRank(
    path: string,
    maxRank: number,
    counts: Record<string, number>,
    modRanks: Record<string, number>,
) {
    const owned = Number(counts[`mods:${path}`] ?? counts[path] ?? 0);
    if (owned <= 0) return 0;
    return Math.max(0, Math.min(maxRank, Number(modRanks[path] ?? maxRank)));
}

function buildMathBreakdown(
    weapon: WeaponEntry,
    effects: (ModEffect | null)[],
    targetFaction = "",
): BuildMathBreakdown {
    const totals = sumEffects(effects);
    const result = calculateBuild(weapon, effects, targetFaction);
    const stats = result.modded;
    const ignoresReloadAndMagazine = !!weapon.isExalted;
    const baseDamage = weapon.damage.total;
    const baseDamageMultiplier = 1 + totals.damageBonus;
    const moddedBaseDamage = baseDamage * baseDamageMultiplier;
    const quantScale = moddedBaseDamage / 32;
    const fireRateBonus = weapon.category === "Melee" ? totals.attackSpeedBonus : totals.fireRateBonus;
    const moddedFireRate = weapon.fireRate * (1 + fireRateBonus);
    const moddedReload = ignoresReloadAndMagazine
        ? weapon.reloadTime
        : weapon.reloadTime / Math.max(0.0001, (1 + totals.reloadSpeedBonus));
    const moddedMagazine = ignoresReloadAndMagazine
        ? Math.max(1, weapon.magazineSize)
        : Math.max(1, Math.round(weapon.magazineSize * (1 + totals.magazineBonus)));
    const displayMagazine = displayMagazineValue(weapon, moddedMagazine);
    const avgCritMultiplier = baseDamage > 0 ? stats.averageShotDamage / Math.max(0.0001, stats.arsenalDamage) : 1;
    const sections: BuildMathSection[] = [
        {
            title: "Base Stats",
            lines: [
                `Base damage = ${fmt(baseDamage, 3)}`,
                `Base crit = ${fmt(weapon.critChance * 100, 1)}% × (1 + ${fmt(totals.critChanceBonus * 100, 1)}%) = ${fmt(stats.critChance * 100, 2)}%`,
                `Base crit mult = ${fmt(weapon.critMultiplier, 2)} × (1 + ${fmt(totals.critMultBonus * 100, 1)}%) = ${fmt(stats.critMultiplier, 3)}`,
                `Base status = ${fmt(weapon.statusChance * 100, 1)}% × (1 + ${fmt(totals.statusChanceBonus * 100, 1)}%) + ${fmt(totals.finalStatusChanceBonus * 100, 1)}% = ${fmt(stats.statusChance * 100, 2)}%`,
            ],
        },
        {
            title: "Damage Construction",
            lines: [
                `Modded base damage = ${fmt(baseDamage, 3)} × (1 + ${fmt(totals.damageBonus * 100, 1)}%) = ${fmt(moddedBaseDamage, 3)}`,
                `Physical bonuses: Impact ${fmt(totals.impactBonus * 100, 1)}%, Puncture ${fmt(totals.punctureBonus * 100, 1)}%, Slash ${fmt(totals.slashBonus * 100, 1)}%`,
                `Primary element bonuses: Heat ${fmt(totals.heatBonus * 100, 1)}%, Cold ${fmt(totals.coldBonus * 100, 1)}%, Electric ${fmt(totals.electricityBonus * 100, 1)}%, Toxin ${fmt(totals.toxinBonus * 100, 1)}%`,
                `Final damage breakdown after element ordering and combination = ${Object.entries(stats.damageBreakdown).filter(([, v]) => (v as number) > 0).map(([k, v]) => `${k} ${fmt(v as number, 3)}`).join(", ") || "none"}`,
            ],
        },
        {
            title: "Quantization",
            lines: [
                `Scale = Modded Base Damage / 32 = ${fmt(moddedBaseDamage, 3)} / 32 = ${fmt(quantScale, 5)}`,
                `Each damage type is quantized as Round(Type Damage / Scale) × Scale`,
                `Quantized total direct damage = ${fmt(stats.totalDamage, 3)}`,
                targetFaction ? `Faction multiplier applied after quantization = ×${fmt(1 + totals.factionDamageBonus, 3)} (${targetFaction})` : "No faction multiplier applied",
            ],
        },
        {
            title: "Crit and DPS",
            lines: [
                `Multishot = ${fmt(weapon.multishot, 2)} × (1 + ${fmt(totals.multishotBonus * 100, 1)}%) = ${fmt(stats.multishot, 3)}`,
                `Arsenal damage = Quantized direct damage × multishot = ${fmt(stats.totalDamage, 3)} × ${fmt(stats.multishot, 3)} = ${fmt(stats.arsenalDamage, 3)}`,
                `Average crit multiplier = ${fmt(avgCritMultiplier, 4)}`,
                `Average shot = Arsenal damage × average crit multiplier = ${fmt(stats.arsenalDamage, 3)} × ${fmt(avgCritMultiplier, 4)} = ${fmt(stats.averageShotDamage, 3)}`,
                `Fire rate = ${fmt(weapon.fireRate, 3)} × (1 + ${fmt(fireRateBonus * 100, 1)}%) = ${fmt(moddedFireRate, 3)}`,
                `Burst DPS = Avg Shot × Fire Rate = ${fmt(stats.averageShotDamage, 3)} × ${fmt(stats.fireRate, 3)} = ${fmt(result.burstDPS, 3)}`,
                ignoresReloadAndMagazine
                    ? `Sustained DPS equals burst DPS for exalted weapons; reload and magazine bonuses are ignored = ${fmt(result.sustainedDPS, 3)}`
                    : `Sustained DPS uses reload uptime with mag ${displayMagazine} and reload ${fmt(moddedReload, 3)}s = ${fmt(result.sustainedDPS, 3)}`,
            ],
        },
        {
            title: "Status and DoT",
            lines: [
                `Average procs / shot = multishot × status chance + extra procs = ${fmt(stats.multishot, 3)} × ${fmt(stats.statusChance, 4)} + extras = ${fmt(stats.averageProcsPerShot, 3)}`,
                `Proc weighting by type = ${Object.entries(stats.procChanceByType).map(([k, v]) => `${k} ${fmt((v ?? 0) * 100, 1)}%`).join(", ") || "none"}`,
                `Expected stacks = ${Object.entries(stats.expectedStacksByType).filter(([, v]) => (v ?? 0) > 0).map(([k, v]) => `${k} ${fmt(v ?? 0, 2)}`).join(", ") || "none"}`,
                `DoT per shot = ${fmt(stats.dotDamagePerShot, 3)}`,
                `DoT DPS = ${fmt(stats.dotDps, 3)}`,
                `Status-derived effects: Viral +${fmt(stats.viralHealthDamageBonus * 100, 1)}% health damage, Corrosive ${fmt(stats.corrosiveArmorStrip * 100, 1)}% armor strip, Magnetic +${fmt(stats.magneticShieldDamageBonus * 100, 1)}% shield damage`,
            ],
        },
    ];

    return { sections };
}

function buildExportPayload(args: {
    weapon: WeaponEntry | null;
    selectedAttackIdx: number;
    goal: OptimizeGoal;
    targetFaction: string | null;
    buildCfg: BuildCfg;
    includeArcaneStats: boolean;
    slots: (ModEntry | null)[];
    ranks: number[];
    slotPols: string[];
    exilusEnabled: boolean;
    exilusMod: ModEntry | null;
    exilusRank: number;
    exilusPol: string;
    arcane: ArcaneEntry | null;
    arcaneRank: number;
}): BuildExportPayload | null {
    const {
        weapon, selectedAttackIdx, goal, targetFaction, buildCfg, includeArcaneStats,
        slots, ranks, slotPols, exilusEnabled, exilusMod, exilusRank, exilusPol, arcane, arcaneRank,
    } = args;
    if (!weapon) return null;

    const selectedAttack = weapon.attacks.length > 1 ? weapon.attacks[selectedAttackIdx] ?? null : null;
    const calcWeapon = selectedAttack
        ? {
            ...weapon,
            damage: selectedAttack.damage,
            critChance: selectedAttack.critChance,
            critMultiplier: selectedAttack.critMultiplier,
            statusChance: selectedAttack.statusChance,
            fireRate: selectedAttack.speed || weapon.fireRate,
            chargeTime: selectedAttack.chargeTime ?? null,
        }
        : weapon;

    const effects: (ModEffect | null)[] = slots.map((m, i) => {
        if (!m) return null;
        const r = ranks[i] ?? m.fusionLimit;
        return m.effectsByRank[r] ?? m.effect;
    });
    if (exilusEnabled && exilusMod) {
        effects.push(exilusMod.effectsByRank[exilusRank] ?? exilusMod.effect);
    }
    if (includeArcaneStats && arcane) {
        const ae = arcane.permanentEffectByRank[arcaneRank];
        effects.push({
            ...emptyEffect(),
            ...(ae ?? {}),
            conditionalEffects: [...(ae?.conditionalEffects ?? [])],
        });
    }

    const calculated = calculateBuild(calcWeapon, effects, targetFaction ?? "");
    const math = buildMathBreakdown(calcWeapon, effects, targetFaction ?? "");

    return {
        exportedAt: new Date().toISOString(),
        source: "warframe-progression-tracker/mod-builder",
        weapon: {
            name: weapon.name,
            uniqueName: weapon.uniqueName,
            category: weapon.category,
            selectedAttack: selectedAttack?.name ?? null,
        },
        assumptions: {
            goal,
            targetFaction,
            weaponRank: buildCfg.weaponRank,
            masteryRank: buildCfg.masteryRank,
            hasCatalyst: buildCfg.hasCatalyst,
            includeArcaneStats,
            selectedAttackIdx,
        },
        build: {
            slots: slots.map((m, i) => ({
                slot: i + 1,
                mod: m?.name ?? null,
                uniqueName: m?.uniqueName ?? null,
                rank: m ? (ranks[i] ?? m.fusionLimit) : 0,
                slotPolarity: slotPols[i] ?? "",
                modPolarity: m?.polarity ?? null,
                statsLabel: m ? (m.statsTextByRank[ranks[i] ?? m.fusionLimit] ?? m.statsLabel) : null,
            })),
            exilus: {
                enabled: exilusEnabled,
                mod: exilusMod?.name ?? null,
                uniqueName: exilusMod?.uniqueName ?? null,
                rank: exilusMod ? exilusRank : 0,
                slotPolarity: exilusPol,
                statsLabel: exilusMod ? (exilusMod.statsTextByRank[exilusRank] ?? exilusMod.statsLabel) : null,
            },
            arcane: {
                mod: arcane?.name ?? null,
                uniqueName: arcane?.uniqueName ?? null,
                rank: arcane ? arcaneRank : 0,
                statsLabel: arcane ? (arcane.statsByRank[arcaneRank] ?? arcane.statsLabel) : null,
            },
        },
        calculated,
        math,
    };
}

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
        path: `__riven_${weaponName}`,
        name: `${weaponName} Riven`,
        compatBucket: "Riven",
        rawCompatName: "Riven",
        polarity,
        rarity: "Legendary",
        drain,
        baseDrain: drain - rank,
        fusionLimit: rank,
        statsLabel,
        statsTextByRank: [statsLabel],
        effectsByRank: [effect],  // simplified: same effect at all ranks
        effect,
        hasDamageEffect: true,
        isAura: false,
        isExilus: false,
        isStance: false,
        incompatibilityGroup: "__riven__",
        compatibilityTags: [],
        incompatibilityTags: [],
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

function shouldAutoInstallCatalyst(
    cfg: CapacityConfig,
    slotPols: string[],
    slots: (ModEntry | null)[],
    ranks: number[],
    extraCapacitySlots: Array<{ mod: ModEntry; rank: number; polarity: string }> = [],
): boolean {
    if (cfg.hasCatalyst) return false;
    const slotCfgs = slotPols.map(polarity => ({ polarity }));
    const extraCfgs = extraCapacitySlots.map(slot => ({ polarity: slot.polarity }));
    const extraMods = extraCapacitySlots.map(slot => slot.mod);
    const extraRanks = extraCapacitySlots.map(slot => slot.rank);
    const uncatalyzed = computeCapacity(cfg, [...extraCfgs, ...slotCfgs], [...extraMods, ...slots], [...extraRanks, ...ranks]);
    if (!uncatalyzed.overCapacity) return false;
    const catalyzed = computeCapacity({ ...cfg, hasCatalyst: true }, [...extraCfgs, ...slotCfgs], [...extraMods, ...slots], [...extraRanks, ...ranks]);
    return !catalyzed.overCapacity;
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

function GoalChip({ label, desc, active, onClick }: {
    label: string; desc: string; active: boolean; onClick: () => void;
}) {
    const [show, setShow] = useState(false);
    return (
        <div
            className="relative"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <button
                onClick={onClick}
                className={[
                    "rounded-full px-2.5 py-1 text-[11px] border transition-colors",
                    active ? "bg-slate-100 text-slate-900 border-slate-100" : "bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-900",
                ].join(" ")}
            >
                {label}
            </button>
            {show && (
                <div className="absolute right-0 top-full z-[80] mt-2 w-64 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-[11px] leading-relaxed text-slate-300 shadow-xl">
                    {desc}
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
    weaponName?: string;
    mod: ModEntry | null; rank: number; slotPolarity: string;
    compatMods: ModEntry[]; usedGroups: Set<string>;
    ownedNames: Set<string>; onlyOwned: boolean; isExilusSlot?: boolean;
    excluded: Set<string>;
    onChange: (i: number, m: ModEntry | null) => void;
    onRankChange: (i: number, r: number) => void;
    onPolarityChange: (i: number, p: string) => void;
    onSelectRiven?: (i: number) => void;
    onToggleExclude: (name: string) => void;
    effDrain: number;
    compactEmpty?: boolean;
}

function ModSlot({ index, label, weaponName, mod, rank, slotPolarity, compatMods, usedGroups,
    ownedNames, onlyOwned, isExilusSlot, excluded, onChange, onRankChange, onPolarityChange, onSelectRiven, onToggleExclude, effDrain, compactEmpty }: SlotProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [showDetails, setShowDetails] = useState(false);
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
            if (usedGroups.has(m.incompatibilityGroup) && m.incompatibilityGroup !== mod?.incompatibilityGroup) return false;
            if (onlyOwned && ownedNames.size > 0 && !ownedNames.has(m.name)) return false;
            if (q && !m.name.toLowerCase().includes(q) && !m.statsLabel.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [compatMods, usedGroups, mod, query, onlyOwned, ownedNames, isExilusSlot]);
    const currentStatsLabel = mod ? (mod.statsTextByRank[rank] ?? mod.statsLabel) : "";

    const polMatch    = !!(mod && slotPolarity && slotPolarity === mod.polarity);
    const polMismatch = !!(mod && slotPolarity && slotPolarity !== mod.polarity && slotPolarity !== "");

    return (
        <div className={["relative min-w-0", compactEmpty ? "" : "h-full"].join(" ")} ref={panelRef}>
            <div className={[(compactEmpty && !mod ? "overflow-hidden " : "") + (compactEmpty ? "" : "h-full ") + "rounded-xl border transition-colors",
                mod
                    ? polMismatch ? "border-amber-700/40 bg-slate-900/60"
                                  : "border-slate-600 bg-slate-900/60 hover:border-slate-500"
                    : isExilusSlot ? "border-dashed border-slate-600/50 bg-slate-950/30 hover:border-slate-500"
                                   : "border-dashed border-slate-700/60 bg-slate-950/20 hover:border-slate-600"].join(" ")}>

                <div className={["p-3 flex items-start gap-2 cursor-pointer select-none", mod ? "min-h-[112px]" : compactEmpty ? "min-h-[84px]" : "min-h-[112px]"].join(" ")}
                    onClick={() => { setOpen(x => !x); setQuery(""); }}>
                    {mod ? (
                        <>
                            <div
                                className="relative flex-1 min-w-0"
                                onMouseEnter={() => setShowDetails(true)}
                                onMouseLeave={() => setShowDetails(false)}
                            >
                                <div className="flex min-w-0 items-center gap-1">
                                    {label && <span className="shrink-0 text-[8px] uppercase tracking-wide text-slate-600">{label}</span>}
                                    <span
                                        className="min-w-0 flex-1 text-xs font-semibold leading-tight text-slate-100"
                                        title={mod.name}
                                        style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {mod.name}
                                    </span>
                                    {mod.compatBucket === "Riven" && <span className="text-[9px] px-1 rounded border border-yellow-700/50 bg-yellow-950/30 text-yellow-400">RIVEN</span>}
                                    {mod.effect.targetFaction && <span className="text-[9px] px-1 rounded border border-orange-700/50 bg-orange-950/30 text-orange-400">{mod.effect.targetFaction}</span>}
                                </div>
                                <div
                                    className="mt-1 text-[10px] leading-tight text-slate-400"
                                    title={currentStatsLabel}
                                    style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    {currentStatsLabel}
                                    {rank < mod.fusionLimit && <span className="text-slate-600 ml-1">@{rank}/{mod.fusionLimit}</span>}
                                </div>
                                {showDetails && (
                                    <div className="pointer-events-none absolute left-0 top-full z-[70] mt-2 w-64 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 shadow-xl">
                                        <div className="text-xs font-semibold leading-tight text-slate-100">{mod.name}</div>
                                        <div className="mt-1 text-[11px] leading-relaxed text-slate-300">{currentStatsLabel}</div>
                                    </div>
                                )}
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
                        <div className={["flex items-center gap-1.5 text-slate-600 text-xs w-full justify-center text-center",
                            compactEmpty ? "py-2" : label ? "py-6" : "py-3"].join(" ")}>
                            <span>+</span><span>{label ? `Add ${label}` : "Add Mod"}</span>
                        </div>
                    )}
                </div>

                {/* Rank slider */}
                {mod && mod.fusionLimit > 0 && (
                    <div
                        className="grid grid-cols-[34px_minmax(0,1fr)_46px] items-center gap-2 px-3 pb-2 pt-1"
                        onClick={e => e.stopPropagation()}
                    >
                        <span className="text-[9px] text-slate-600">Rank</span>
                        <div className="min-w-0 px-2">
                            <input
                                type="range"
                                min={0}
                                max={mod.fusionLimit}
                                value={rank}
                                onChange={e => onRankChange(index, +e.target.value)}
                                className="block w-full min-w-0 h-1.5 cursor-pointer appearance-none rounded-full bg-slate-700 accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-blue-300 [&::-webkit-slider-thumb]:bg-slate-100 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-blue-300 [&::-moz-range-thumb]:bg-slate-100"
                            />
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 text-right">{rank}/{mod.fusionLimit}</span>
                    </div>
                )}

                {/* Slot polarity */}
                {(!compactEmpty || mod) && (
                <div className="flex items-center gap-1.5 px-3 pb-2.5 border-t border-slate-800/40 pt-1.5"
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
                )}
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
                        {!isExilusSlot && weaponName && (
                            <button
                                className="w-full px-3 py-2 text-left hover:bg-slate-800/50 transition-colors"
                                onClick={() => {
                                    onSelectRiven?.(index);
                                    setOpen(false);
                                    setQuery("");
                                }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-yellow-300 flex-1 truncate">{weaponName} Riven</span>
                                    <span className="text-[9px] px-1 rounded border border-yellow-700/50 bg-yellow-950/30 text-yellow-400 shrink-0">RIVEN</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Configure custom riven stats for this slot.</div>
                            </button>
                        )}
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
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => { e.stopPropagation(); onToggleExclude(m.name); }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onToggleExclude(m.name);
                                                }
                                            }}
                                            className={["text-[9px] px-1.5 py-0.5 rounded border shrink-0 transition-colors",
                                                excluded.has(m.name)
                                                    ? "border-red-700/60 bg-red-950/30 text-red-300"
                                                    : "border-slate-700 text-slate-500 hover:border-red-700/60 hover:text-red-300"].join(" ")}
                                            title={excluded.has(m.name) ? "Remove from exclusions" : "Exclude from optimizer"}
                                        >
                                            {excluded.has(m.name) ? "Excluded" : "Exclude"}
                                        </span>
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
                <div className="p-3 flex items-start gap-2 min-h-[84px] cursor-pointer select-none"
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
                    <div
                        className="grid grid-cols-[34px_minmax(0,1fr)_46px] items-center gap-2 px-3 pb-2 pt-1 border-t border-slate-800/40"
                        onClick={e => e.stopPropagation()}
                    >
                        <span className="text-[9px] text-slate-600">Rank</span>
                        <div className="min-w-0 px-2">
                            <input
                                type="range"
                                min={0}
                                max={arcane.maxRank}
                                value={rank}
                                onChange={e => onRankChange(+e.target.value)}
                                className="block w-full min-w-0 h-1.5 cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-violet-300 [&::-webkit-slider-thumb]:bg-slate-100 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-violet-300 [&::-moz-range-thumb]:bg-slate-100"
                            />
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 text-right">{rank}/{arcane.maxRank}</span>
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

// ── Riven Modal ───────────────────────────────────────────────────────────────

function RivenModal({ open, weaponName, onClose, onApply }: {
    open: boolean;
    weaponName: string;
    onClose: () => void;
    onApply: (mod: ModEntry) => void;
}) {
    const [stats, setStats] = useState<RivenStat[]>([
        { stat: "critChanceBonus", value: 0 },
        { stat: "damageBonus",     value: 0 },
    ]);
    const [drain, setDrain] = useState(14);
    const [polarity, setPolarity] = useState("");

    useEffect(() => {
        if (!open) return;
        setStats([
            { stat: "critChanceBonus", value: 0 },
            { stat: "damageBonus", value: 0 },
        ]);
        setDrain(14);
        setPolarity("");
    }, [open]);

    function handleApply() {
        const mod = makeRivenEntry(weaponName, stats.filter(s => s.value !== 0), 8, polarity, drain);
        onApply(mod);
        onClose();
    }

    function addStat() {
        if (stats.length < 4) setStats(p => [...p, { stat: "damageBonus", value: 0 }]);
    }
    function removeStat(i: number) { setStats(p => p.filter((_, j) => j !== i)); }
    function updateStat(i: number, field: "stat" | "value", val: string | number) {
        setStats(p => p.map((s, j) => j === i ? { ...s, [field]: val } : s));
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl rounded-2xl border border-yellow-700/40 bg-slate-950 shadow-2xl shadow-black/60 overflow-hidden">
                <div className="border-b border-yellow-800/30 bg-yellow-950/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.22em] text-yellow-400/70">Riven Configuration</div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-lg font-semibold text-slate-100">{weaponName} Riven</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow-700/50 bg-yellow-950/30 text-yellow-400">RIVEN</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:text-slate-200">Close</button>
                    </div>
                </div>
                <div className="space-y-3 px-4 py-4">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">Enter riven stats manually</div>

                    {stats.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <select value={s.stat}
                                onChange={e => updateStat(i, "stat", e.target.value)}
                                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-200 focus:outline-none">
                                {RIVEN_STATS.map(rs => (
                                    <option key={rs.key} value={rs.key}>{rs.label}</option>
                                ))}
                            </select>
                            <input type="number" step="0.1" value={s.value}
                                onChange={e => updateStat(i, "value", parseFloat(e.target.value) || 0)}
                                className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-200 text-right focus:outline-none" />
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
                                className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">Polarity</span>
                            <PolarityPicker value={polarity} onChange={setPolarity} />
                        </div>
                        <button onClick={handleApply}
                            className="ml-auto rounded-lg bg-yellow-700/40 border border-yellow-600/50 px-3 py-1.5 text-xs font-semibold text-yellow-300 hover:bg-yellow-700/60 transition-colors">
                            Apply Riven
                        </button>
                    </div>
                </div>
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
                className={["w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
                    selected ? "border-slate-600 bg-slate-900/60 hover:border-slate-500"
                             : "border-dashed border-slate-700 bg-slate-950/20 hover:border-slate-600"].join(" ")}>
                {selected ? (
                    <><span className="text-sm font-semibold text-slate-100">{selected.name}</span>
                    <span className="text-[11px] text-slate-500">{selected.category} · {selected.weaponType}</span>
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

// ── Saved Builds ──────────────────────────────────────────────────────────────

function SavedBuildsPanel({ weapon, currentSlots, currentRanks, currentPolarities, currentCfg,
    stanceMod, stanceRank, stancePol, exilusMod, exilusPol, arcane1, arcane1Rank, hasExilus, onLoad }: {
    weapon: WeaponEntry | null;
    currentSlots: (ModEntry | null)[]; currentRanks: number[]; currentPolarities: string[];
    currentCfg: { weaponRank: number; hasCatalyst: boolean };
    stanceMod: ModEntry | null; stanceRank: number; stancePol: string;
    exilusMod: ModEntry | null; exilusPol: string;
    arcane1: ArcaneEntry | null; arcane1Rank: number;
    hasExilus: boolean;
    onLoad: (b: SavedBuild) => void;
}) {
    const savedBuilds  = useTrackerStore(s => s.state.modBuilder?.savedBuilds ?? EMPTY_SAVED_BUILDS);
    const saveModBuild = useTrackerStore(s => s.saveModBuild);
    const deleteBuild  = useTrackerStore(s => s.deleteModBuild);
    const allMods      = useMemo(() => weapon ? getModsForWeapon(weapon) : [], [weapon]);
    const panelArcanes = useMemo(() => weapon ? getArcanesByWeaponCategory(weapon.category) : [], [weapon]);
    const [saveName, setSaveName] = useState("");
    const [saving, setSaving]     = useState(false);
    const [comparing, setComparing] = useState<Set<string>>(new Set());

    function handleSave() {
        if (!weapon || !saveName.trim()) return;
        saveModBuild({
            id: uid(), name: saveName.trim(),
            weaponUniqueName: weapon.uniqueName, weaponName: weapon.name,
            slotModUniqueNames: currentSlots.map(m => m?.uniqueName ?? ""),
            slotRanks: [...currentRanks],
            stanceModUniqueName: stanceMod?.uniqueName,
            stanceRank,
            stancePol,
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
    const comparedBuilds = thisWeapon.filter(b => comparing.has(b.id));

    function toggleCompare(id: string) {
        setComparing(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function buildSavedBuildEffects(build: SavedBuild): (ModEffect | null)[] {
        const effects: (ModEffect | null)[] = [];
        for (let i = 0; i < build.slotModUniqueNames.length; i++) {
            const uniqueName = build.slotModUniqueNames[i];
            if (!uniqueName) continue;
            const mod = allMods.find(m => m.uniqueName === uniqueName) ?? null;
            if (!mod) continue;
            const rank = build.slotRanks?.[i] ?? mod.fusionLimit;
            effects.push(mod.effectsByRank[rank] ?? mod.effect);
        }
        if (build.stanceModUniqueName) {
            const mod = allMods.find(m => m.uniqueName === build.stanceModUniqueName) ?? null;
            if (mod) {
                const rank = build.stanceRank ?? mod.fusionLimit;
                effects.push(mod.effectsByRank[rank] ?? mod.effect);
            }
        }
        if (build.hasExilus && build.exilusModUniqueName) {
            const mod = allMods.find(m => m.uniqueName === build.exilusModUniqueName) ?? null;
            if (mod) {
                const rank = build.exilusRank ?? mod.fusionLimit;
                effects.push(mod.effectsByRank[rank] ?? mod.effect);
            }
        }
        if (build.arcane1UniqueName) {
            const arcane = panelArcanes.find(a => a.uniqueName === build.arcane1UniqueName) ?? null;
            if (arcane) {
                const rank = build.arcane1Rank ?? arcane.maxRank;
                const ae = arcane.permanentEffectByRank[rank];
                effects.push({
                    ...emptyEffect(),
                    ...(ae ?? {}),
                    conditionalEffects: [...(ae?.conditionalEffects ?? [])],
                });
            }
        }
        return effects;
    }

    function comparisonRows(stats: ReturnType<typeof calculateBuild>) {
        const rows: Array<[string, string]> = [
            ["Burst DPS", fmt(stats.burstDPS)],
            ["Sustained DPS", fmt(stats.sustainedDPS)],
            ["Avg Shot", fmt(stats.modded.averageShotDamage)],
            ["Arsenal Dmg", fmt(stats.modded.arsenalDamage)],
            ["Crit Chance", `${fmt(stats.modded.critChance * 100, 1)}%`],
            ["Crit Mult", `${fmt(stats.modded.critMultiplier, 2)}x`],
            ["Crit Tier", `${fmt(stats.modded.averageCritTier, 2)}x`],
            ["Status", `${fmt(stats.modded.statusChance * 100, 1)}%`],
            ["Multishot", fmt(stats.modded.multishot, 2)],
            ["Fire Rate", fmt(stats.modded.fireRate, 2)],
            ["Avg Procs", fmt(stats.modded.averageProcsPerShot, 2)],
            ["DoT DPS", fmt(stats.modded.dotDps)],
        ];
        for (const [key, value] of Object.entries(stats.modded.damageBreakdown)) {
            if ((value ?? 0) > 0) rows.push([key[0].toUpperCase() + key.slice(1), fmt(value ?? 0, 1)]);
        }
        return rows;
    }

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
            {comparedBuilds.length > 1 && weapon && (
                <div className="rounded-xl border border-blue-900/40 bg-blue-950/10 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-blue-300 mb-2">Side-by-side comparison</div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${comparedBuilds.length}, minmax(0, 1fr))` }}>
                        {comparedBuilds.map(b => {
                            const stats = calculateBuild(weapon, buildSavedBuildEffects(b));
                            return (
                                <div key={b.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                                    <div className="text-xs font-semibold text-slate-100">{b.name}</div>
                                    <div className="space-y-1">
                                        {comparisonRows(stats).map(([lbl, val]) => (
                                            <div key={lbl} className="flex justify-between gap-2 text-[11px]">
                                                <span className="text-slate-500">{lbl}</span>
                                                <span className="font-mono text-slate-200 text-right">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {savedBuilds.length === 0 && <div className="text-[11px] text-slate-600 text-center py-2">No saved builds yet.</div>}
            {thisWeapon.length > 0 && (
                <div className="space-y-1.5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">This weapon</div>
                    {thisWeapon.map(b => {
                        const stats = weapon ? calculateBuild(weapon, buildSavedBuildEffects(b)) : null;
                        return (
                            <div key={b.id} className={["rounded-lg border px-3 py-2",
                                comparing.has(b.id) ? "border-blue-700/50 bg-blue-950/10" : "border-slate-800 bg-slate-900/40"].join(" ")}>
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
                                        <button onClick={() => toggleCompare(b.id)}
                                            className={["text-[10px] px-2 py-1 rounded border transition-colors",
                                                comparing.has(b.id) ? "border-blue-600 bg-blue-900/40 text-blue-300" : "border-slate-700 text-slate-400 hover:text-slate-200"].join(" ")}>
                                            {comparing.has(b.id) ? "Selected" : "Compare"}
                                        </button>
                                        <button onClick={() => onLoad(b)} className="text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">Load</button>
                                        <button onClick={() => deleteBuild(b.id)} className="text-[10px] text-slate-700 hover:text-red-400 transition-colors px-1">✕</button>
                                    </div>
                                </div>
                                {comparing.has(b.id) && stats && (
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 pt-2 border-t border-slate-800/60">
                                        {comparisonRows(stats).slice(0, 12).map(([lbl, val]) => (
                                            <div key={lbl} className="flex items-center justify-between gap-2 text-[10px]">
                                                <div className="text-slate-600">{lbl}</div>
                                                <div className="font-mono text-blue-300 text-right">{val}</div>
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
    const inventoryCounts = useTrackerStore(s => s.state.inventory.counts ?? EMPTY_COUNTS);
    const inventoryModRanks = useTrackerStore(s => s.state.inventory.modRanks ?? EMPTY_MOD_RANKS);
    const setCount = useTrackerStore(s => s.setCount);
    const setModRank = useTrackerStore(s => s.setModRank);
    const [query, setQuery] = useState("");
    const allMods = useMemo(() => weapon ? getModsForWeapon(weapon) : [], [weapon]);
    const ownedCountForMod = (path: string) => inventoryCounts[`mods:${path}`] ?? inventoryCounts[path] ?? 0;
    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return allMods.filter(m => !q || m.name.toLowerCase().includes(q));
    }, [allMods, query]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Owned Mods</div>
                <div className="flex gap-3 text-[10px]">
                    <button onClick={() => allMods.forEach(m => { setCount(`mods:${m.path}`, 1); setModRank(m.path, m.fusionLimit); })} className="text-slate-400 hover:text-slate-200">All</button>
                    <button onClick={() => allMods.forEach(m => { setCount(`mods:${m.path}`, 0); setModRank(m.path, 0); })} className="text-slate-400 hover:text-slate-200">None</button>
                    <span className="text-slate-600">{allMods.filter(m => Number(ownedCountForMod(m.path)) > 0).length}/{allMods.length} owned</span>
                </div>
            </div>
            <input type="text" placeholder="Filter mods…" value={query} onChange={e => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800 divide-y divide-slate-800/50">
                {filtered.map(m => (
                    <label key={m.uniqueName} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-800/40 cursor-pointer">
                        <input type="checkbox" checked={Number(ownedCountForMod(m.path)) > 0}
                            onChange={() => {
                                const nextOwned = Number(ownedCountForMod(m.path)) > 0 ? 0 : 1;
                                setCount(`mods:${m.path}`, nextOwned);
                                setModRank(m.path, nextOwned > 0 ? m.fusionLimit : 0);
                            }}
                            className="accent-blue-500 shrink-0" />
                        <span className="shrink-0">
                            {m.polarity ? <PolarityIcon polarity={m.polarity} className="w-3.5 h-3.5 opacity-60" /> : <span className="text-slate-700 text-xs">○</span>}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-200 truncate">{m.name}</div>
                            {m.statsLabel && <div className="text-[10px] text-slate-500 truncate">{m.statsLabel}</div>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.preventDefault()}>
                            <button
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center disabled:opacity-30"
                                disabled={Number(ownedCountForMod(m.path)) <= 0 || getOwnedModRank(m.path, m.fusionLimit, inventoryCounts, inventoryModRanks) <= 0}
                                onClick={() => setModRank(m.path, Math.max(0, getOwnedModRank(m.path, m.fusionLimit, inventoryCounts, inventoryModRanks) - 1))}
                            >−</button>
                            <span className={["w-8 text-center text-[10px] font-mono", Number(ownedCountForMod(m.path)) > 0 ? "text-emerald-400" : "text-slate-600"].join(" ")}>
                                R{getOwnedModRank(m.path, m.fusionLimit, inventoryCounts, inventoryModRanks)}
                            </span>
                            <button
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center disabled:opacity-30"
                                disabled={Number(ownedCountForMod(m.path)) <= 0 || getOwnedModRank(m.path, m.fusionLimit, inventoryCounts, inventoryModRanks) >= m.fusionLimit}
                                onClick={() => setModRank(m.path, Math.min(m.fusionLimit, getOwnedModRank(m.path, m.fusionLimit, inventoryCounts, inventoryModRanks) + 1))}
                            >+</button>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}

const ARCANE_TOTAL_PER_RANK: Record<number, number> = {
    0: 1,
    1: 3,
    2: 6,
    3: 10,
    4: 15,
    5: 21,
};

function arcaneEquiv(rank: number): number {
    return ARCANE_TOTAL_PER_RANK[rank] ?? 1;
}

function arcaneTotal(rankCounts: Record<string, number>): number {
    return Object.entries(rankCounts).reduce((sum, [rank, count]) => sum + arcaneEquiv(Number(rank)) * (Number(count) || 0), 0);
}

function maxCraftableArcaneRank(rankCounts: Record<string, number>, maxRank: number): number {
    const total = arcaneTotal(rankCounts);
    for (let rank = maxRank; rank >= 0; rank--) {
        if (total >= (ARCANE_TOTAL_PER_RANK[rank] ?? 1)) return rank;
    }
    return 0;
}

function OwnedArcanesPanel({ weapon }: { weapon: WeaponEntry | null }) {
    const inventoryArcaneRanks = useTrackerStore(s => s.state.inventory.arcaneRanks ?? EMPTY_ARCANE_RANKS);
    const inventoryCounts = useTrackerStore(s => s.state.inventory.counts ?? EMPTY_COUNTS);
    const setArcaneRankCount = useTrackerStore(s => s.setArcaneRankCount);
    const [query, setQuery] = useState("");
    const allArcanes = useMemo(() => weapon ? getArcanesByWeaponCategory(weapon.category) : [], [weapon]);
    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return allArcanes.filter(a => !q || a.name.toLowerCase().includes(q));
    }, [allArcanes, query]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Owned Arcanes</div>
                <div className="text-[10px] text-slate-500">Shared with Mods &amp; Arcanes inventory</div>
            </div>
            <input type="text" placeholder="Filter arcanes…" value={query} onChange={e => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
            <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-slate-800 divide-y divide-slate-800/50">
                {filtered.map(arcane => {
                    const rankCounts = inventoryArcaneRanks[arcane.uniqueName] ?? {};
                    const fallbackCount = Number(inventoryCounts[`mods:${arcane.uniqueName}`] ?? inventoryCounts[arcane.uniqueName] ?? 0);
                    const normalizedRankCounts = Object.keys(rankCounts).length > 0 ? rankCounts : (fallbackCount > 0 ? { "0": fallbackCount } : {});
                    const totalEquiv = arcaneTotal(normalizedRankCounts);
                    const craftableRank = maxCraftableArcaneRank(normalizedRankCounts, arcane.maxRank);
                    return (
                        <div key={arcane.uniqueName} className="px-3 py-3 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-xs text-slate-200 truncate">{arcane.name}</div>
                                    <div className="text-[10px] text-slate-500">{totalEquiv} R0 equiv · usable up to R{craftableRank}</div>
                                </div>
                                <div className="shrink-0 text-[10px] text-slate-500">{arcane.rarity}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: arcane.maxRank + 1 }, (_, rank) => {
                                    const count = Number(normalizedRankCounts[String(rank)] ?? 0);
                                    return (
                                        <div key={rank} className="flex flex-col items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-900/40 px-2 py-1.5">
                                            <span className="text-[9px] text-slate-500 font-mono">R{rank}</span>
                                            <span className="text-[9px] text-slate-600">≡{arcaneEquiv(rank)}</span>
                                            <div className="flex items-center gap-1">
                                                <button className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                                                    onClick={() => setArcaneRankCount(arcane.uniqueName, rank, Math.max(0, count - 1))}>−</button>
                                                <span className={["w-6 text-center text-xs font-mono font-semibold", count > 0 ? "text-emerald-400" : "text-slate-600"].join(" ")}>{count}</span>
                                                <button className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                                                    onClick={() => setArcaneRankCount(arcane.uniqueName, rank, count + 1)}>+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface BuildCfg { weaponRank: number; hasCatalyst: boolean; masteryRank: number; }

export default function ModBuilder() {
    const masteryRank      = useTrackerStore(s => s.state.player.masteryRank) ?? 0;
    const inventoryArcaneRanks = useTrackerStore(s => s.state.inventory.arcaneRanks ?? EMPTY_ARCANE_RANKS);
    const inventoryCounts = useTrackerStore(s => s.state.inventory.counts ?? EMPTY_COUNTS);
    const inventoryModRanks = useTrackerStore(s => s.state.inventory.modRanks ?? EMPTY_MOD_RANKS);

    const [weapon, setWeapon]          = useState<WeaponEntry | null>(null);
    const [slots, setSlots]            = useState<(ModEntry | null)[]>(Array(SLOT_COUNT).fill(null));
    const [ranks, setRanks]            = useState<number[]>(Array(SLOT_COUNT).fill(0));
    const [slotPols, setSlotPols]      = useState<string[]>(Array(SLOT_COUNT).fill(""));
    const [stanceMod, setStanceMod]    = useState<ModEntry | null>(null);
    const [stanceRank, setStanceRank]  = useState(0);
    const [stancePol, setStancePol]    = useState("");
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
    const [showOptimizeOptions, setShowOptimizeOptions] = useState(false);
    // UI
    const [infoTab, setInfoTab]        = useState<"stats"|"why"|"math">("stats");
    const [rivenEditorSlot, setRivenEditorSlot] = useState<number | null>(null);
    const [reasoning, setReasoning]    = useState<BuildReasoning | null>(null);
    const [reasoningMath, setReasoningMath] = useState<BuildMathBreakdown | null>(null);
    const [tab, setTab]                = useState<"build"|"saves"|"owned"|"ownedArcanes"|"exclude">("build");
    const [optimizing, setOptimizing]  = useState(false);
    const [copiedExport, setCopiedExport] = useState(false);

    useEffect(() => {
        setBuildCfg((prev) => {
            if (prev.masteryRank === masteryRank) return prev;
            return { ...prev, masteryRank };
        });
    }, [masteryRank]);

    function resetBuildForWeapon(w: WeaponEntry, opts?: { resetConfig?: boolean }) {
        setSlots(Array(SLOT_COUNT).fill(null));
        setRanks(Array(SLOT_COUNT).fill(0));
        const pols = Array(SLOT_COUNT).fill("") as string[];
        w.polarities.forEach((p, i) => { if (i < SLOT_COUNT) pols[i] = p; });
        setSlotPols(pols);
        setStanceMod(null); setStanceRank(0); setStancePol(w.stancePolarity ?? "");
        setExilusMod(null); setExilusRank(0); setExilusPol(""); setHasExilus(false);
        setRivenMod(null); setRivenSlotIdx(null); setRivenEditorSlot(null);
        setArcane1(null); setArcane1Rank(0);
        setSelectedAttackIdx(0);
        if (opts?.resetConfig) setBuildCfg(p => ({ ...p, weaponRank: 30, hasCatalyst: false }));
        setReasoning(null);
        setReasoningMath(null);
    }

    function handleSelectWeapon(w: WeaponEntry) {
        setWeapon(w);
        resetBuildForWeapon(w, { resetConfig: true });
    }

    const compatMods   = useMemo(() => weapon ? getModsForWeapon(weapon) : [], [weapon]);
    const stanceMods   = useMemo(() => weapon ? getStancesForWeapon(weapon) : [], [weapon]);
    const weaponArcanes = useMemo(() => weapon ? getArcanesByWeaponCategory(weapon.category) : [], [weapon]);
    const ownedSet     = useMemo(() => new Set(
        compatMods
            .filter(mod => Number(inventoryCounts[`mods:${mod.path}`] ?? inventoryCounts[mod.path] ?? 0) > 0)
            .map(mod => mod.name)
    ), [compatMods, inventoryCounts]);
    const ownedModMaxRankByName = useMemo(() => {
        const out: Record<string, number> = {};
        for (const mod of compatMods) {
            if (Number(inventoryCounts[`mods:${mod.path}`] ?? inventoryCounts[mod.path] ?? 0) <= 0) continue;
            out[mod.name] = getOwnedModRank(mod.path, mod.fusionLimit, inventoryCounts, inventoryModRanks);
        }
        return out;
    }, [compatMods, inventoryCounts, inventoryModRanks]);
    const ownedArcaneUniqueNames = useMemo(() => {
        const set = new Set<string>();
        for (const [path, ranks] of Object.entries(inventoryArcaneRanks)) {
            const totalByRanks = Object.values(ranks ?? {}).reduce((sum, count) => sum + (Number(count) || 0), 0);
            const totalByCounts = Number(inventoryCounts[`mods:${path}`] ?? inventoryCounts[path] ?? 0);
            if (totalByRanks > 0 || totalByCounts > 0) set.add(path);
        }
        return set;
    }, [inventoryArcaneRanks, inventoryCounts]);
    const ownedArcaneMaxRankByUniqueName = useMemo(() => {
        const out: Record<string, number> = {};
        for (const arcane of weaponArcanes) {
            const rankCounts = inventoryArcaneRanks[arcane.uniqueName] ?? {};
            const fallbackCount = Number(inventoryCounts[`mods:${arcane.uniqueName}`] ?? inventoryCounts[arcane.uniqueName] ?? 0);
            const normalizedRankCounts = Object.keys(rankCounts).length > 0 ? rankCounts : (fallbackCount > 0 ? { "0": fallbackCount } : {});
            if (arcaneTotal(normalizedRankCounts) > 0) {
                out[arcane.uniqueName] = maxCraftableArcaneRank(normalizedRankCounts, arcane.maxRank);
            }
        }
        return out;
    }, [weaponArcanes, inventoryArcaneRanks, inventoryCounts]);
    const optimizerDiagnostics = useMemo(() => {
        if (!weapon) return null;
        const targetFaction = factionOn ? faction : "";
        const baseCandidates = compatMods.filter(mod => {
            if (mod.isAura) return false;
            if (excluded.has(mod.name)) return false;
            if (onlyOwned && !ownedSet.has(mod.name)) return false;
            if (mod.effect.targetFaction && !targetFaction) return false;
            if (mod.effect.targetFaction && mod.effect.targetFaction.toLowerCase() !== targetFaction.toLowerCase()) return false;
            return true;
        });
        const watchedNames = ["Creeping Bullseye", "Convulsion", "Galvanized Shot", "Primed Target Cracker", "Pistol Gambit"];
        const watched = watchedNames.map((name) => {
            const mod = compatMods.find((entry) => entry.name === name) ?? null;
            const owned = !!mod && ownedSet.has(name);
            const excludedMod = excluded.has(name);
            const factionMismatch = !!mod?.effect.targetFaction &&
                (!targetFaction || mod.effect.targetFaction.toLowerCase() !== targetFaction.toLowerCase());
            const candidate = !!mod && !excludedMod && (!onlyOwned || owned) && !factionMismatch;
            return { name, present: !!mod, owned, excluded: excludedMod, candidate, maxRank: mod ? (ownedModMaxRankByName[name] ?? mod.fusionLimit) : null };
        });
        return {
            compatCount: compatMods.length,
            candidateCount: baseCandidates.length,
            ownedOnly: onlyOwned,
            ownedCount: ownedSet.size,
            excludedCount: excluded.size,
            targetFaction: targetFaction || "None",
            watched,
        };
    }, [weapon, compatMods, excluded, onlyOwned, ownedSet, factionOn, faction, ownedModMaxRankByName]);
    const usedGroups   = useMemo(() => {
        const s = new Set(slots.filter(Boolean).map(m => m!.incompatibilityGroup));
        if (stanceMod) s.add(stanceMod.incompatibilityGroup);
        if (exilusMod) s.add(exilusMod.incompatibilityGroup);
        if (rivenMod)  s.add(rivenMod.incompatibilityGroup);
        return s;
    }, [slots, stanceMod, exilusMod, rivenMod]);

    // Forma count: count slots whose current polarity differs from weapon default
    const formaCount = useMemo(() => {
        if (!weapon) return 0;
        const defaultCounts = new Map<string, number>();
        const currentCounts = new Map<string, number>();
        const addCount = (map: Map<string, number>, polarity: string) => {
            if (!polarity) return;
            map.set(polarity, (map.get(polarity) ?? 0) + 1);
        };
        for (const polarity of weapon.polarities) addCount(defaultCounts, polarity);
        addCount(defaultCounts, weapon.stancePolarity ?? "");
        for (const polarity of slotPols) addCount(currentCounts, polarity);
        addCount(currentCounts, stancePol);
        addCount(currentCounts, exilusPol);
        let changes = 0;
        const allKeys = new Set([...defaultCounts.keys(), ...currentCounts.keys()]);
        for (const key of allKeys) {
            const extra = (currentCounts.get(key) ?? 0) - (defaultCounts.get(key) ?? 0);
            if (extra > 0) changes += extra;
        }
        return changes;
    }, [weapon, slotPols, stancePol, exilusPol]);

    const currentBuildExport = useMemo(() => buildExportPayload({
        weapon,
        selectedAttackIdx,
        goal,
        targetFaction: factionOn ? faction : null,
        buildCfg,
        includeArcaneStats,
        slots,
        ranks,
        slotPols,
        exilusEnabled: hasExilus,
        exilusMod,
        exilusRank,
        exilusPol,
        arcane: arcane1,
        arcaneRank: arcane1Rank,
    }), [
        weapon, selectedAttackIdx, goal, factionOn, faction, buildCfg, includeArcaneStats,
        slots, ranks, slotPols, hasExilus, exilusMod, exilusRank, exilusPol, arcane1, arcane1Rank,
    ]);

    const activeAttack = useMemo(
        () => weapon && weapon.attacks.length > 1 ? (weapon.attacks[selectedAttackIdx] ?? null) : null,
        [weapon, selectedAttackIdx],
    );
    const activeCalcWeapon = useMemo(() => {
        if (!weapon) return null;
        if (!activeAttack) return weapon;
        return {
            ...weapon,
            damage: activeAttack.damage,
            critChance: activeAttack.critChance,
            critMultiplier: activeAttack.critMultiplier,
            statusChance: activeAttack.statusChance,
            fireRate: activeAttack.speed || weapon.fireRate,
            chargeTime: activeAttack.chargeTime ?? null,
        };
    }, [weapon, activeAttack]);
    async function handleCopyBuildExport() {
        if (!currentBuildExport) return;
        const json = JSON.stringify(currentBuildExport, null, 2);
        await navigator.clipboard.writeText(json);
        setCopiedExport(true);
        setTimeout(() => setCopiedExport(false), 2000);
    }

    function handleSlotChange(i: number, mod: ModEntry | null) {
        setSlots(p => { const n = [...p]; n[i] = mod; return n; });
        setRanks(p => { const n = [...p]; n[i] = mod ? mod.fusionLimit : 0; return n; });
        if (!mod && rivenSlotIdx === i) {
            setRivenMod(null);
            setRivenSlotIdx(null);
        }
        if (mod && mod.compatBucket !== "Riven" && rivenSlotIdx === i) {
            setRivenMod(null);
            setRivenSlotIdx(null);
        }
        setReasoning(null);
        setReasoningMath(null);
    }
    function handleRankChange(i: number, r: number) {
        setRanks(p => { const n = [...p]; n[i] = r; return n; });
        setReasoning(null);
        setReasoningMath(null);
    }
    function handlePolChange(i: number, p: string)  {
        setSlotPols(p2 => { const n = [...p2]; n[i] = p; return n; });
        setReasoning(null);
        setReasoningMath(null);
    }
    function handleExilusChange(_: number, m: ModEntry | null) {
        setExilusMod(m); setExilusRank(m ? m.fusionLimit : 0);
        setReasoning(null);
        setReasoningMath(null);
    }
    function toggleExclude(name: string) { setExcluded(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; }); }

    function handleOpenRivenEditor(i: number) {
        setRivenEditorSlot(i);
    }

    function handleRivenUpdate(mod: ModEntry) {
        if (rivenEditorSlot === null) return;
        setRivenMod(mod);
        setSlots(p => { const n = [...p]; n[rivenEditorSlot] = mod; return n; });
        setRanks(p => { const n = [...p]; n[rivenEditorSlot] = mod.fusionLimit; return n; });
        setRivenSlotIdx(rivenEditorSlot);
        setRivenEditorSlot(null);
        setReasoning(null);
        setReasoningMath(null);
    }
    const capacityCfg: CapacityConfig = {
        weaponRank: buildCfg.weaponRank, hasCatalyst: buildCfg.hasCatalyst,
        masteryRank: buildCfg.masteryRank, canOverLevel: weapon?.canOverLevel ?? false,
    };

    const allSlotsForCap = useMemo(() => {
        const s = [...slots];
        if (weapon?.category === "Melee" && stanceMod) s.unshift(stanceMod);
        if (hasExilus) s.push(exilusMod);
        return s;
    }, [slots, stanceMod, exilusMod, hasExilus, weapon]);
    const allPolsForCap  = useMemo(() => {
        const p = [...slotPols];
        if (weapon?.category === "Melee") p.unshift(stancePol);
        if (hasExilus) p.push(exilusPol);
        return p;
    }, [slotPols, stancePol, exilusPol, hasExilus, weapon]);
    const allRanksForCap = useMemo(() => {
        const r = [...ranks];
        if (weapon?.category === "Melee" && stanceMod) r.unshift(stanceRank);
        if (hasExilus) r.push(exilusRank);
        return r;
    }, [ranks, stanceMod, stanceRank, exilusRank, hasExilus, weapon]);
    const activeBuildEffects = useMemo(() => {
        const effects: (ModEffect | null)[] = allSlotsForCap.map((mod, i) => {
            if (!mod) return null;
            const r = allRanksForCap[i] ?? mod.fusionLimit;
            return mod.effectsByRank[r] ?? mod.effect;
        });
        if (includeArcaneStats && arcane1) {
            const ae = arcane1.permanentEffectByRank[arcane1Rank];
            effects.push({
                ...emptyEffect(),
                ...(ae ?? {}),
                conditionalEffects: [...(ae?.conditionalEffects ?? [])],
            });
        }
        return effects;
    }, [allSlotsForCap, allRanksForCap, includeArcaneStats, arcane1, arcane1Rank]);
    const activeMetrics = useMemo(
        () => activeCalcWeapon ? calculateBuild(activeCalcWeapon, activeBuildEffects, factionOn ? faction : "") : null,
        [activeCalcWeapon, activeBuildEffects, factionOn, faction],
    );

    const capacity = useMemo(() => {
        if (!weapon) return null;
        return computeCapacity(capacityCfg, allPolsForCap.map(p => ({ polarity: p })), allSlotsForCap, allRanksForCap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weapon, allSlotsForCap, allPolsForCap, allRanksForCap, buildCfg]);
    const displayedCapacity = useMemo(() => {
        if (!capacity) return null;
        const total = capacity.totalCapacity + capacity.auraGrant;
        const remaining = capacity.remainingCapacity;
        const used = total - remaining;
        return { total, used, remaining, over: capacity.overCapacity };
    }, [capacity]);

    async function handleOptimize() {
        if (!weapon) return;
        if (onlyOwned && ownedSet.size === 0) return;
        setOptimizing(true);
        await new Promise(r => setTimeout(r, 10));
        try {
            let optimizerStanceMod = stanceMod;
            let optimizerStanceRank = stanceRank;
            if (weapon.category === "Melee") {
                const bestStance = stanceMods.reduce<ModEntry | null>((best, current) => {
                    if (!stancePol) return best;
                    if (!best) return current;
                    const bestDrain = effectiveDrain(best, stancePol, best.fusionLimit);
                    const currentDrain = effectiveDrain(current, stancePol, current.fusionLimit);
                    return currentDrain < bestDrain ? current : best;
                }, null);
                optimizerStanceMod = bestStance;
                optimizerStanceRank = bestStance ? bestStance.fusionLimit : 0;
                setStanceMod(bestStance);
                setStanceRank(optimizerStanceRank);
            }

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
                ownedModMaxRankByName: onlyOwned ? ownedModMaxRankByName : undefined,
                ownedArcaneUniqueNames: onlyOwned ? ownedArcaneUniqueNames : undefined,
                ownedArcaneMaxRankByUniqueName: onlyOwned ? ownedArcaneMaxRankByUniqueName : undefined,
                excludedModNames: excluded.size > 0 ? excluded : undefined,
                allowNonMaxRank:  allowNonMax,
                targetFaction:    factionOn ? faction : "",
                capacityConfig:   capForOpt,
                slotPolarities:   slotPols,
                defaultSlotPolarities: weapon.polarities,
                allowCatalyst,
                allowForma,
                optimizeExilus:   optExilus,
                exilusPolarity:   exilusPol,
                optimizeArcane:   optArcane,
                buildForAttack:   atk,
                extraCapacitySlots: weapon.category === "Melee" && optimizerStanceMod
                    ? [{ mod: optimizerStanceMod, rank: optimizerStanceRank, polarity: stancePol }]
                    : undefined,
            });

            let appliedResult = result;
            let appliedCatalyst = buildCfg.hasCatalyst;
            const baseExtraCapacitySlots = weapon.category === "Melee" && optimizerStanceMod
                ? [{ mod: optimizerStanceMod, rank: optimizerStanceRank, polarity: stancePol }]
                : undefined;

            if (!respectCap) {
                const resultSlotsForCap = [...result.slots, ...(optExilus ? [result.exilusMod] : [])];
                const resultRanksForCap = [...result.slotRanks, ...(optExilus ? [result.exilusMod ? result.exilusRank : 0] : [])];
                const resultPolsForCap = [...result.slotPolarities, ...(optExilus ? [exilusPol] : [])];
                const resultExtraCfgs = (baseExtraCapacitySlots ?? []).map(slot => ({ polarity: slot.polarity }));
                const resultExtraMods = (baseExtraCapacitySlots ?? []).map(slot => slot.mod);
                const resultExtraRanks = (baseExtraCapacitySlots ?? []).map(slot => slot.rank);
                const uncatalyzedFit = computeCapacity(
                    capacityCfg,
                    [...resultExtraCfgs, ...resultPolsForCap.map(polarity => ({ polarity }))],
                    [...resultExtraMods, ...resultSlotsForCap],
                    [...resultExtraRanks, ...resultRanksForCap],
                );

                if (uncatalyzedFit.overCapacity) {
                    if (allowCatalyst) {
                        appliedCatalyst = true;
                        const catalyzedCfg = { ...capacityCfg, hasCatalyst: true };
                        const catalyzedFit = computeCapacity(
                            catalyzedCfg,
                            [...resultExtraCfgs, ...resultPolsForCap.map(polarity => ({ polarity }))],
                            [...resultExtraMods, ...resultSlotsForCap],
                            [...resultExtraRanks, ...resultRanksForCap],
                        );

                        if (catalyzedFit.overCapacity && allowForma) {
                            appliedResult = optimizeBuild(weapon, null, goal, SLOT_COUNT, {
                                ownedModNames:    onlyOwned ? ownedSet : undefined,
                                ownedModMaxRankByName: onlyOwned ? ownedModMaxRankByName : undefined,
                                ownedArcaneUniqueNames: onlyOwned ? ownedArcaneUniqueNames : undefined,
                                ownedArcaneMaxRankByUniqueName: onlyOwned ? ownedArcaneMaxRankByUniqueName : undefined,
                                excludedModNames: excluded.size > 0 ? excluded : undefined,
                                allowNonMaxRank:  allowNonMax,
                                targetFaction:    factionOn ? faction : "",
                                capacityConfig:   catalyzedCfg,
                                slotPolarities:   slotPols,
                                defaultSlotPolarities: weapon.polarities,
                                allowCatalyst:    false,
                                allowForma:       true,
                                optimizeExilus:   optExilus,
                                exilusPolarity:   exilusPol,
                                optimizeArcane:   optArcane,
                                buildForAttack:   atk,
                                extraCapacitySlots: baseExtraCapacitySlots,
                            });
                        }
                    } else if (allowForma) {
                        appliedResult = optimizeBuild(weapon, null, goal, SLOT_COUNT, {
                            ownedModNames:    onlyOwned ? ownedSet : undefined,
                            ownedModMaxRankByName: onlyOwned ? ownedModMaxRankByName : undefined,
                            ownedArcaneUniqueNames: onlyOwned ? ownedArcaneUniqueNames : undefined,
                            ownedArcaneMaxRankByUniqueName: onlyOwned ? ownedArcaneMaxRankByUniqueName : undefined,
                            excludedModNames: excluded.size > 0 ? excluded : undefined,
                            allowNonMaxRank:  allowNonMax,
                            targetFaction:    factionOn ? faction : "",
                            capacityConfig:   capacityCfg,
                            slotPolarities:   slotPols,
                            defaultSlotPolarities: weapon.polarities,
                            allowCatalyst:    false,
                            allowForma:       true,
                            optimizeExilus:   optExilus,
                            exilusPolarity:   exilusPol,
                            optimizeArcane:   optArcane,
                            buildForAttack:   atk,
                            extraCapacitySlots: baseExtraCapacitySlots,
                        });
                    }
                }
            }

            // Apply exilus mod if optimized
            if (optExilus) {
                setHasExilus(true);
                setExilusMod(appliedResult.exilusMod);
                setExilusRank(appliedResult.exilusMod ? appliedResult.exilusRank : 0);
            }

            const finalSlotsForCap = [...appliedResult.slots, ...(optExilus ? [appliedResult.exilusMod] : [])];
            const finalRanksForCap = [...appliedResult.slotRanks, ...(optExilus ? [appliedResult.exilusMod ? appliedResult.exilusRank : 0] : [])];
            const finalPolsForCap  = [...appliedResult.slotPolarities, ...(optExilus ? [exilusPol] : [])];

            if (
                appliedCatalyst ||
                appliedResult.needsCatalyst ||
                (allowCatalyst && shouldAutoInstallCatalyst(capacityCfg, finalPolsForCap, finalSlotsForCap, finalRanksForCap, baseExtraCapacitySlots ?? []))
            ) {
                setBuildCfg(p => ({ ...p, hasCatalyst: true }));
                appliedCatalyst = true;
            }

            const defaultMainPols = [...weapon.polarities];
            while (defaultMainPols.length < SLOT_COUNT) defaultMainPols.push("");
            const catalystAwareCfg = { ...capacityCfg, hasCatalyst: appliedCatalyst || buildCfg.hasCatalyst || appliedResult.needsCatalyst };
            const defaultExtraCfgs = (baseExtraCapacitySlots ?? []).map(slot => ({ polarity: slot.polarity }));
            const defaultExtraMods = (baseExtraCapacitySlots ?? []).map(slot => slot.mod);
            const defaultExtraRanks = (baseExtraCapacitySlots ?? []).map(slot => slot.rank);
            const defaultFit = computeCapacity(
                catalystAwareCfg,
                [...defaultExtraCfgs, ...defaultMainPols.map(polarity => ({ polarity }))],
                [...defaultExtraMods, ...appliedResult.slots],
                [...defaultExtraRanks, ...appliedResult.slotRanks],
            );
            let slotPolsToApply = allowForma && !defaultFit.overCapacity
                ? defaultMainPols
                : appliedResult.slotPolarities;
            let stancePolToApply = stancePol;
            let exilusPolToApply = appliedResult.exilusMod ? exilusPol : "";

            if (allowForma) {
                const fullDefaultPols = [
                    ...(weapon.category === "Melee" ? [stancePolToApply] : []),
                    ...defaultMainPols,
                    ...(optExilus ? [exilusPolToApply] : []),
                ];
                const fullDefaultSlots = [
                    ...(weapon.category === "Melee" && optimizerStanceMod ? [optimizerStanceMod] : []),
                    ...appliedResult.slots,
                    ...(optExilus ? [appliedResult.exilusMod] : []),
                ];
                const fullDefaultRanks = [
                    ...(weapon.category === "Melee" && optimizerStanceMod ? [optimizerStanceRank] : []),
                    ...appliedResult.slotRanks,
                    ...(optExilus ? [appliedResult.exilusMod ? appliedResult.exilusRank : 0] : []),
                ];
                const fullDefaultFit = computeCapacity(
                    catalystAwareCfg,
                    fullDefaultPols.map(polarity => ({ polarity })),
                    fullDefaultSlots,
                    fullDefaultRanks,
                );
                if (!fullDefaultFit.overCapacity) {
                    slotPolsToApply = defaultMainPols;
                    stancePolToApply = weapon.stancePolarity ?? "";
                    exilusPolToApply = "";
                }
            }

            // Apply mod slots
            setSlots([...appliedResult.slots] as (ModEntry | null)[]);
            setRanks([...appliedResult.slotRanks] as number[]);

            // Apply polarity changes from forma optimizer
            if (allowForma) {
                setSlotPols([...slotPolsToApply]);
                setStancePol(stancePolToApply);
                setExilusPol(exilusPolToApply);
            }

            // Apply arcane if optimized
            if (optArcane && appliedResult.arcane) {
                setArcane1(appliedResult.arcane);
                setArcane1Rank(appliedResult.arcaneRank);
            }

            setReasoning(explainBuild(weapon, appliedResult.mods, appliedResult.ranks, goal, factionOn ? faction : "", atk));
            const mathEffects: (ModEffect | null)[] = appliedResult.slots.map((m, i) => {
                if (!m) return null;
                const r = appliedResult.slotRanks[i] ?? m.fusionLimit;
                return m.effectsByRank[r] ?? m.effect;
            });
            if (optExilus && appliedResult.exilusMod) {
                mathEffects.push(appliedResult.exilusMod.effectsByRank[appliedResult.exilusRank] ?? appliedResult.exilusMod.effect);
            }
            if (includeArcaneStats && optArcane && appliedResult.arcane) {
                const ae = appliedResult.arcane.permanentEffectByRank[appliedResult.arcaneRank];
                mathEffects.push({
                    ...emptyEffect(),
                    ...(ae ?? {}),
                    conditionalEffects: [...(ae?.conditionalEffects ?? [])],
                });
            }
            const mathWeapon = atk
                ? {
                    ...weapon,
                    damage: atk.damage,
                    critChance: atk.critChance,
                    critMultiplier: atk.critMultiplier,
                    statusChance: atk.statusChance,
                    fireRate: atk.speed || weapon.fireRate,
                    chargeTime: atk.chargeTime ?? null,
                }
                : weapon;
            setReasoningMath(buildMathBreakdown(mathWeapon, mathEffects, factionOn ? faction : ""));
        } finally { setOptimizing(false); }
    }

    function handleLoadBuild(build: SavedBuild) {
        if (!weapon) return;
        const mods = build.slotModUniqueNames.map(un => compatMods.find(m => m.uniqueName === un) ?? null);
        const ns   = [...mods, ...Array(SLOT_COUNT).fill(null)].slice(0, SLOT_COUNT) as (ModEntry | null)[];
        setSlots(ns);
        setRanks(ns.map((m, i) => m ? (build.slotRanks?.[i] ?? m.fusionLimit) : 0));
        setSlotPols([...build.slotPolarities, ...Array(SLOT_COUNT).fill("")].slice(0, SLOT_COUNT));
        setBuildCfg(p => ({ ...p, weaponRank: build.weaponRank, hasCatalyst: build.hasCatalyst }));
        if (build.stanceModUniqueName) {
            const sm = stanceMods.find(m => m.uniqueName === build.stanceModUniqueName) ?? null;
            setStanceMod(sm);
            setStanceRank(sm ? (build.stanceRank ?? sm.fusionLimit) : 0);
        } else {
            setStanceMod(null);
            setStanceRank(0);
        }
        setStancePol(build.stancePol ?? weapon.stancePolarity ?? "");
        setHasExilus(build.hasExilus ?? false);
        if (build.exilusModUniqueName) {
            const em = compatMods.find(m => m.uniqueName === build.exilusModUniqueName) ?? null;
            setExilusMod(em); setExilusRank(em ? (build.exilusRank ?? em.fusionLimit) : 0);
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
            {/* Tabs */}
            <div className="flex gap-1 flex-wrap">
                {(["build","saves","owned","ownedArcanes","exclude"] as const).map(t => (
                    <button key={t} onClick={() => (weapon || t === "build") && setTab(t)}
                        disabled={!weapon && t !== "build"}
                        className={["rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors",
                            tab === t ? "bg-slate-100 text-slate-900 border-slate-100" : "bg-slate-950/40 text-slate-400 border-slate-700 hover:bg-slate-900",
                            !weapon && t !== "build" ? "opacity-40 cursor-not-allowed" : ""].join(" ")}>
                        {t === "build" ? "Build" : t === "saves" ? "Saved Builds" : t === "owned" ? "Owned Mods" : t === "ownedArcanes" ? "Owned Arcanes" : `Excluded${excluded.size ? ` (${excluded.size})` : ""}`}
                    </button>
                ))}
            </div>

            {weapon && tab === "owned"   && <OwnedModsPanel weapon={weapon} />}
            {weapon && tab === "ownedArcanes" && <OwnedArcanesPanel weapon={weapon} />}
            {weapon && tab === "saves"   && <SavedBuildsPanel weapon={weapon} currentSlots={slots} currentRanks={ranks}
                currentPolarities={slotPols} currentCfg={buildCfg}
                stanceMod={stanceMod} stanceRank={stanceRank} stancePol={stancePol}
                exilusMod={exilusMod} exilusPol={exilusPol}
                arcane1={arcane1} arcane1Rank={arcane1Rank}
                hasExilus={hasExilus} onLoad={handleLoadBuild} />}
            {weapon && tab === "exclude" && <ExclusionList allMods={compatMods} excluded={excluded} onToggle={toggleExclude} />}

            {tab === "build" && (
                <>
                            <div className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(8,15,32,0.95))] shadow-[0_24px_80px_rgba(2,6,23,0.45)] overflow-visible">
                                <div className="border-b border-slate-800/80 bg-slate-950/70 px-4 py-3">
                                    <div className="flex flex-wrap items-start gap-3 justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[11px] uppercase tracking-[0.24em] text-orange-300/90">Arsenal Modding</div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <div className="w-[360px] max-w-full">
                                                    <WeaponSelector selected={weapon} onSelect={handleSelectWeapon} />
                                                </div>
                                                {weapon && formaCount > 0 && (
                                                    <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[10px] uppercase tracking-wide text-slate-300">
                                                        {formaCount} forma
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 justify-end">
                                            <div className="flex flex-wrap gap-1.5">
                                                {GOAL_OPTIONS.map(g => (
                                                    <GoalChip
                                                        key={g.key}
                                                        label={g.label}
                                                        desc={g.desc}
                                                        active={goal === g.key}
                                                        onClick={() => setGoal(g.key)}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setShowOptimizeOptions(v => !v)}
                                                className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
                                            >
                                                Options {showOptimizeOptions ? "▴" : "▾"}
                                            </button>
                                            <button onClick={handleOptimize} disabled={optimizing || !weapon}
                                                className="rounded-xl px-4 py-2 text-sm border border-amber-600/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 disabled:opacity-50 transition-colors font-semibold">
                                                {optimizing ? "Optimizing…" : "Optimize Build"}
                                            </button>
                                            <button
                                                onClick={handleCopyBuildExport}
                                                disabled={!currentBuildExport}
                                                className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:opacity-50"
                                            >
                                                {copiedExport ? "Copied Build JSON" : "Copy Build JSON"}
                                            </button>
                                            <button
                                                onClick={() => weapon && resetBuildForWeapon(weapon)}
                                                disabled={!weapon}
                                                className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:opacity-50"
                                            >
                                                Reset Build
                                            </button>
                                        </div>
                                    </div>
                                    {showOptimizeOptions && (
                                        <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-950/30 p-3">
                                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                                                {([
                                                    { label: "Respect Capacity", active: respectCap, set: setRespectCap, desc: "Only use mods that fit within the weapon mod capacity." },
                                                    { label: "Allow Non-Maxed", active: allowNonMax, set: setAllowNonMax, desc: "Try lower-ranked mods so more fit within capacity." },
                                                    { label: "Owned Only", active: onlyOwned, set: setOnlyOwned, desc: "Only use mods you have marked as owned." },
                                                    { label: "Faction Focus", active: factionOn, set: setFactionOn, desc: "Target the selected faction specifically." },
                                                    { label: "Allow Catalyst", active: allowCatalyst, set: setAllowCatalyst, desc: "Assume Orokin Catalyst installed if needed." },
                                                    { label: "Allow Forma", active: allowForma, set: setAllowForma, desc: "Reassign slot polarities to reduce drain." },
                                                    { label: "Optimize Exilus", active: optExilus, set: setOptExilus, desc: "Include the exilus slot in optimization." },
                                                    { label: "Optimize Arcane", active: optArcane, set: setOptArcane, desc: "Choose the best arcane for the build." },
                                                ] as const).map(t => (
                                                    <button key={t.label} onClick={() => t.set(!t.active)} title={t.desc}
                                                        className={["rounded-lg border px-2.5 py-1.5 text-[11px] text-left transition-colors",
                                                            t.active ? "border-sky-700/60 bg-sky-950/20 text-sky-300" : "border-slate-700 bg-slate-900/40 text-slate-500 hover:border-slate-600 hover:text-slate-300"].join(" ")}>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={["w-3 h-3 rounded-full border flex items-center justify-center shrink-0",
                                                                t.active ? "border-sky-400 bg-sky-400" : "border-slate-600"].join(" ")}>
                                                                {t.active && <span className="text-slate-900 text-[8px]">&#10003;</span>}
                                                            </span>
                                                            <span className="font-semibold">{t.label}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                                    <div>
                                                        <label className="text-[10px] uppercase tracking-wide text-slate-500 block mb-1.5">Weapon Rank</label>
                                                        <div className="flex items-center gap-2">
                                                            <input type="range" min={0} max={maxWeaponRank(weapon?.canOverLevel ?? false)} value={buildCfg.weaponRank}
                                                                onChange={e => setBuildCfg(p => ({ ...p, weaponRank: +e.target.value }))} className="flex-1 accent-sky-500" />
                                                            <span className="text-sm font-mono text-slate-200 w-7 text-right">{buildCfg.weaponRank}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase tracking-wide text-slate-500 block mb-1.5">Mastery Rank</label>
                                                        <div className="flex items-center gap-2">
                                                            <input type="range" min={0} max={40} value={buildCfg.masteryRank}
                                                                onChange={e => setBuildCfg(p => ({ ...p, masteryRank: +e.target.value }))} className="flex-1 accent-sky-500" />
                                                            <span className="text-sm font-mono text-slate-200 w-7 text-right">{buildCfg.masteryRank}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase tracking-wide text-slate-500 block mb-1.5">Installed</label>
                                                        <button
                                                            onClick={() => setBuildCfg(p => ({ ...p, hasCatalyst: !p.hasCatalyst }))}
                                                            className={[
                                                                "w-full rounded-lg border px-3 py-2 text-[11px] text-left transition-colors",
                                                                buildCfg.hasCatalyst
                                                                    ? "border-amber-600/60 bg-amber-950/25 text-amber-300"
                                                                    : "border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200",
                                                            ].join(" ")}
                                                            title="Marks whether this weapon already has an Orokin Catalyst installed."
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={[
                                                                    "w-3 h-3 rounded-full border flex items-center justify-center shrink-0",
                                                                    buildCfg.hasCatalyst ? "border-amber-400 bg-amber-400" : "border-slate-600",
                                                                ].join(" ")}>
                                                                    {buildCfg.hasCatalyst && <span className="text-slate-900 text-[8px]">&#10003;</span>}
                                                                </span>
                                                                <span className="font-semibold">Catalyst Installed</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="min-h-[34px] flex items-center justify-start lg:justify-end">
                                                    {factionOn && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {FACTIONS.map(f => (
                                                                <button key={f} onClick={() => setFaction(f)}
                                                                    className={["rounded-full px-2.5 py-1 text-[10px] border transition-colors",
                                                                        faction === f ? "bg-orange-900/40 border-orange-600/60 text-orange-300" : "border-slate-700 text-slate-400 hover:border-slate-600"].join(" ")}>
                                                                    {f}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {weapon ? (
                                <div className="grid xl:grid-cols-[280px_minmax(0,1fr)] gap-4 p-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/55 overflow-hidden">
                                        <div className="border-b border-slate-800/70 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[11px] uppercase tracking-[0.22em] text-orange-300">Capacity</div>
                                                {displayedCapacity && (
                                                    <div className="font-mono text-lg">
                                                        <span className={displayedCapacity.over ? "text-red-400" : "text-orange-300"}>{displayedCapacity.used}</span>
                                                        <span className="text-slate-600">/</span>
                                                        <span className="text-slate-200">{displayedCapacity.total}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {displayedCapacity && (
                                                <>
                                                    <div className="mt-2">
                                                        <CapBar used={displayedCapacity.used} total={displayedCapacity.total} over={displayedCapacity.over} />
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                                                        <span>{displayedCapacity.remaining >= 0 ? `${displayedCapacity.remaining} remaining` : `${Math.abs(displayedCapacity.remaining)} over`}</span>
                                                        <span>{buildCfg.hasCatalyst ? "Catalyzed" : "Uncatalyzed"} · MR {buildCfg.masteryRank}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {activeMetrics && (
                                            <div className="space-y-4 px-4 py-4">
                                                {weapon.attacks.length > 1 && (
                                                    <div className="space-y-2">
                                                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Attack Mode</div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {weapon.attacks.map((atk, i) => (
                                                                <button
                                                                    key={atk.name}
                                                                    onClick={() => setSelectedAttackIdx(i)}
                                                                    className={[
                                                                        "rounded-full border px-2.5 py-1 text-[10px] transition-colors",
                                                                        selectedAttackIdx === i
                                                                            ? "border-sky-400/60 bg-sky-950/40 text-sky-200"
                                                                            : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-500",
                                                                    ].join(" ")}
                                                                >
                                                                    {atk.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-1.5">
                                                    {([
                                                        ["stats", "Weapon Stats"],
                                                        ["why", "Why This Build"],
                                                        ["math", "Math"],
                                                    ] as const).map(([key, label]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => setInfoTab(key)}
                                                            className={[
                                                                "rounded-full border px-2.5 py-1 text-[10px] transition-colors",
                                                                infoTab === key
                                                                    ? "border-sky-400/60 bg-sky-950/40 text-sky-200"
                                                                    : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-500",
                                                            ].join(" ")}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {infoTab === "stats" && (
                                                    <>
                                                        <div>
                                                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">Primary</div>
                                                            <div className="space-y-1.5 text-sm">
                                                                {[
                                                                    ["Attack Speed", `${activeMetrics.modded.fireRate.toFixed(2)}`],
                                                                    ["Magazine", displayMagazineValue(weapon, activeMetrics.modded.magazineSize)],
                                                                    ["Reload", `${activeMetrics.modded.reloadTime.toFixed(2)}s`],
                                                                    ["Multishot", `${activeMetrics.modded.multishot.toFixed(2)}`],
                                                                    ["Burst DPS", fmt(activeMetrics.burstDPS)],
                                                                    ["Sustained DPS", fmt(activeMetrics.sustainedDPS)],
                                                                ].map(([label, value]) => (
                                                                    <div key={label} className="flex items-center justify-between gap-3">
                                                                        <span className="text-sky-200/85">{label}</span>
                                                                        <span className="font-mono text-right text-yellow-200">{value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">Damage</div>
                                                            <div className="space-y-1.5 text-sm">
                                                                {[
                                                                    ["Critical Chance", `${fmt(activeMetrics.modded.critChance * 100, 1)}%`],
                                                                    ["Critical Damage", `${activeMetrics.modded.critMultiplier.toFixed(1)}x`],
                                                                    ["Status", `${fmt(activeMetrics.modded.statusChance * 100, 1)}%`],
                                                                ].map(([label, value]) => (
                                                                    <div key={label} className="flex items-center justify-between gap-3">
                                                                        <span className="text-sky-200/85">{label}</span>
                                                                        <span className="font-mono text-right text-yellow-200">{value}</span>
                                                                    </div>
                                                                ))}
                                                                {Object.entries(activeMetrics.modded.damageBreakdown)
                                                                    .filter(([, value]) => value > 0)
                                                                    .sort((a, b) => b[1] - a[1])
                                                                    .map(([type, value]) => (
                                                                        <div key={type} className="flex items-center justify-between gap-3">
                                                                            <span className={[
                                                                                "capitalize",
                                                                                type === "viral" ? "text-lime-300" :
                                                                                type === "heat" ? "text-orange-300" :
                                                                                type === "cold" ? "text-cyan-300" :
                                                                                type === "electricity" ? "text-violet-300" :
                                                                                type === "toxin" ? "text-emerald-300" :
                                                                                type === "slash" ? "text-red-300" :
                                                                                type === "puncture" ? "text-yellow-100" :
                                                                                type === "impact" ? "text-blue-300" :
                                                                                "text-sky-200/80",
                                                                            ].join(" ")}>{type}</span>
                                                                            <span className="font-mono text-right text-yellow-200">{fmt(value, 1)}</span>
                                                                        </div>
                                                                    ))}
                                                                <div className="flex items-center justify-between gap-3 pt-1 text-base">
                                                                    <span className="text-sky-100">Total</span>
                                                                    <span className="font-mono text-right text-yellow-300">{fmt(activeMetrics.modded.arsenalDamage, 1)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {infoTab === "why" && (
                                                    <div className="space-y-3">
                                                        {reasoning ? (
                                                            <>
                                                                <p className="text-[11px] text-slate-400">{reasoning.summary}</p>
                                                                <div className="space-y-1.5">
                                                                    {reasoning.steps.map((step, i) => (
                                                                        <div key={i} className="rounded-lg bg-slate-900/50 border border-slate-800/50 px-3 py-2">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <span className="text-xs font-semibold text-slate-200">{step.modName}</span>
                                                                                <span className="text-[10px] font-mono text-green-400 shrink-0">+{step.pctGain.toFixed(1)}%</span>
                                                                            </div>
                                                                            <p className="mt-1 text-[10px] text-slate-500">{step.why}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-3 text-[11px] text-slate-500">
                                                                Run the optimizer to generate build reasoning.
                                                            </div>
                                                        )}
                                                        {optimizerDiagnostics && (
                                                            <div className="rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-3">
                                                                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Optimizer Inputs</div>
                                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                                                    <div className="text-slate-500">Compatible Mods</div>
                                                                    <div className="font-mono text-right text-slate-300">{optimizerDiagnostics.compatCount}</div>
                                                                    <div className="text-slate-500">Usable Candidates</div>
                                                                    <div className="font-mono text-right text-slate-300">{optimizerDiagnostics.candidateCount}</div>
                                                                    <div className="text-slate-500">Owned Only</div>
                                                                    <div className="font-mono text-right text-slate-300">{optimizerDiagnostics.ownedOnly ? "On" : "Off"}</div>
                                                                    <div className="text-slate-500">Owned Matches</div>
                                                                    <div className="font-mono text-right text-slate-300">{optimizerDiagnostics.ownedCount}</div>
                                                                    <div className="text-slate-500">Excluded Mods</div>
                                                                    <div className="font-mono text-right text-slate-300">{optimizerDiagnostics.excludedCount}</div>
                                                                    <div className="text-slate-500">Target Faction</div>
                                                                    <div className="font-mono text-right text-slate-300">{optimizerDiagnostics.targetFaction}</div>
                                                                </div>
                                                                <div className="mt-3 space-y-1.5">
                                                                    {optimizerDiagnostics.watched.map((entry) => (
                                                                        <div key={entry.name} className="flex items-center justify-between gap-3 rounded-md border border-slate-800/60 px-2 py-1 text-[11px]">
                                                                            <span className="text-slate-300">{entry.name}</span>
                                                                            <span className="font-mono text-right text-slate-500">
                                                                                {!entry.present ? "missing" :
                                                                                    entry.excluded ? "excluded" :
                                                                                        !entry.owned ? "not-owned" :
                                                                                            entry.candidate ? "candidate" : "filtered"}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {infoTab === "math" && (
                                                    <div className="space-y-3">
                                                        {reasoningMath ? reasoningMath.sections.map((section) => (
                                                            <div key={section.title} className="rounded-lg bg-slate-900/50 border border-slate-800/50 px-3 py-3">
                                                                <div className="text-xs font-semibold text-slate-200 mb-2">{section.title}</div>
                                                                <div className="space-y-1">
                                                                    {section.lines.map((line, idx) => (
                                                                        <div key={idx} className="text-[11px] font-mono text-slate-400 break-words">{line}</div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-3 text-[11px] text-slate-500">
                                                                Run the optimizer to see the substituted math for the current build.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.45),rgba(2,6,23,0.9))] p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Mod Configuration</div>
                                                <div className="text-sm text-slate-300">8 standard slots, plus stance/exilus/arcane support.</div>
                                            </div>
                                            <div className="text-[10px] text-slate-500">{slots.filter(Boolean).length}/{SLOT_COUNT} slots filled</div>
                                        </div>

                                        <div className="space-y-3">
                                            {weapon.category === "Melee" ? (
                                                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
                                                    <div className="space-y-3">
                                                        <div className="grid gap-3 md:grid-cols-2">
                                                            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2">
                                                                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-500">
                                                                    <span>Stance</span>
                                                                    <PolarityPicker value={stancePol} onChange={setStancePol} />
                                                                </div>
                                                                {stanceMods.length > 0 ? (
                                                                    <ModSlot index={0} label="Stance" weaponName={weapon.name} mod={stanceMod} rank={stanceRank}
                                                                        slotPolarity={stancePol} compatMods={stanceMods}
                                                                        usedGroups={usedGroups} ownedNames={ownedSet} onlyOwned={false}
                                                                        excluded={excluded}
                                                                        onChange={(_, m) => { setStanceMod(m); setStanceRank(m ? m.fusionLimit : 0); }}
                                                                        onRankChange={(_, r) => setStanceRank(r)}
                                                                        onPolarityChange={(_, p) => setStancePol(p)}
                                                                        onToggleExclude={toggleExclude}
                                                                        effDrain={stanceMod ? effectiveDrain(stanceMod, stancePol, stanceRank) : 0}
                                                                        compactEmpty={true} />
                                                                ) : (
                                                                    <div className="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-center text-[11px] text-slate-600">
                                                                        No stance slot available.
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2">
                                                                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-500">
                                                                    <span>Exilus</span>
                                                                    <button onClick={() => { setHasExilus(v => !v); if (hasExilus) { setExilusMod(null); setExilusRank(0); } }}
                                                                        className="rounded-full border border-slate-700 px-2 py-0.5 text-[9px] text-slate-300">
                                                                        {hasExilus ? "Installed" : "Unlock"}
                                                                    </button>
                                                                </div>
                                                                {hasExilus ? (
                                                                    <ModSlot index={0} label="Exilus" weaponName={weapon.name} mod={exilusMod} rank={exilusRank}
                                                                        slotPolarity={exilusPol} compatMods={compatMods}
                                                                        usedGroups={usedGroups} ownedNames={ownedSet} onlyOwned={false}
                                                                        isExilusSlot={true}
                                                                        excluded={excluded}
                                                                        onChange={handleExilusChange}
                                                                        onRankChange={(_, r) => setExilusRank(r)}
                                                                        onPolarityChange={(_, p) => setExilusPol(p)}
                                                                        onToggleExclude={toggleExclude}
                                                                        effDrain={exilusMod ? effectiveDrain(exilusMod, exilusPol, exilusRank) : 0}
                                                                        compactEmpty={true} />
                                                                ) : (
                                                                    <div className="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-center text-[11px] text-slate-600">
                                                                        Requires an Exilus Adapter.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="grid auto-rows-[minmax(216px,auto)] grid-cols-2 2xl:grid-cols-4 gap-3">
                                                            {slots.map((mod, i) => (
                                                                <ModSlot key={i} index={i} weaponName={weapon.name} mod={mod} rank={ranks[i] ?? 0}
                                                                    slotPolarity={slotPols[i] ?? ""} compatMods={compatMods}
                                                                    usedGroups={usedGroups} ownedNames={ownedSet} onlyOwned={false}
                                                                    excluded={excluded}
                                                                    onChange={handleSlotChange} onRankChange={handleRankChange}
                                                                    onPolarityChange={handlePolChange}
                                                                    onSelectRiven={handleOpenRivenEditor}
                                                                    onToggleExclude={toggleExclude}
                                                                    effDrain={mod ? effectiveDrain(mod, slotPols[i] ?? "", ranks[i]) : 0} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 self-start">
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <div className="text-[10px] uppercase tracking-wide text-slate-500">Arcane</div>
                                                            {arcane1 && (
                                                                <button
                                                                    onClick={() => setIncludeArcaneStats(v => !v)}
                                                                    className={[
                                                                        "rounded-full border px-2 py-0.5 text-[9px] transition-colors",
                                                                        includeArcaneStats
                                                                            ? "border-violet-700/60 bg-violet-950/30 text-violet-300"
                                                                            : "border-slate-700 text-slate-500",
                                                                    ].join(" ")}
                                                                >
                                                                    {includeArcaneStats ? "Stats On" : "Stats Off"}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <ArcaneSlot label="Arcane Enhancement" arcane={arcane1} rank={arcane1Rank}
                                                            onChange={setArcane1} onRankChange={setArcane1Rank}
                                                            availableArcanes={weaponArcanes} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
                                                    <div className="grid auto-rows-[minmax(216px,auto)] grid-cols-2 2xl:grid-cols-4 gap-3">
                                                        {slots.map((mod, i) => (
                                                            <ModSlot key={i} index={i} weaponName={weapon.name} mod={mod} rank={ranks[i] ?? 0}
                                                                slotPolarity={slotPols[i] ?? ""} compatMods={compatMods}
                                                                usedGroups={usedGroups} ownedNames={ownedSet} onlyOwned={false}
                                                                excluded={excluded}
                                                                onChange={handleSlotChange} onRankChange={handleRankChange}
                                                                onPolarityChange={handlePolChange}
                                                                onSelectRiven={handleOpenRivenEditor}
                                                                onToggleExclude={toggleExclude}
                                                                effDrain={mod ? effectiveDrain(mod, slotPols[i] ?? "", ranks[i]) : 0} />
                                                        ))}
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <div className="text-[10px] uppercase tracking-wide text-slate-500">Arcane</div>
                                                                {arcane1 && (
                                                                    <button
                                                                        onClick={() => setIncludeArcaneStats(v => !v)}
                                                                        className={[
                                                                            "rounded-full border px-2 py-0.5 text-[9px] transition-colors",
                                                                            includeArcaneStats
                                                                                ? "border-violet-700/60 bg-violet-950/30 text-violet-300"
                                                                                : "border-slate-700 text-slate-500",
                                                                        ].join(" ")}
                                                                    >
                                                                        {includeArcaneStats ? "Stats On" : "Stats Off"}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <ArcaneSlot label="Arcane Enhancement" arcane={arcane1} rank={arcane1Rank}
                                                                onChange={setArcane1} onRankChange={setArcane1Rank}
                                                                availableArcanes={weaponArcanes} />
                                                        </div>
                                                        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2">
                                                            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-500">
                                                                <span>Exilus</span>
                                                                <button onClick={() => { setHasExilus(v => !v); if (hasExilus) { setExilusMod(null); setExilusRank(0); } }}
                                                                    className="rounded-full border border-slate-700 px-2 py-0.5 text-[9px] text-slate-300">
                                                                    {hasExilus ? "Installed" : "Unlock"}
                                                                </button>
                                                            </div>
                                                            {hasExilus ? (
                                                                <ModSlot index={0} label="Exilus" weaponName={weapon.name} mod={exilusMod} rank={exilusRank}
                                                                    slotPolarity={exilusPol} compatMods={compatMods}
                                                                    usedGroups={usedGroups} ownedNames={ownedSet} onlyOwned={false}
                                                                    isExilusSlot={true}
                                                                    excluded={excluded}
                                                                    onChange={handleExilusChange}
                                                                    onRankChange={(_, r) => setExilusRank(r)}
                                                                    onPolarityChange={(_, p) => setExilusPol(p)}
                                                                    onToggleExclude={toggleExclude}
                                                                    effDrain={exilusMod ? effectiveDrain(exilusMod, exilusPol, exilusRank) : 0} />
                                                            ) : (
                                                                <div className="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-center text-[11px] text-slate-600">
                                                                    Requires an Exilus Adapter.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-[10px] text-slate-500">
                                                Rivens are configured by selecting a Riven from any standard mod slot.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                ) : (
                                    <div className="p-6 text-center text-slate-500 text-sm">
                                        Choose a weapon from the Arsenal header to start building.
                                    </div>
                                )}
                            </div>

                            <div className="grid 2xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                    <div className="text-sm font-semibold mb-3">Advanced Analysis</div>
                                    {(() => {
                                if (!weapon) return null;

                                // Build the full mod effects list (slots + exilus + arcane)
                                const buildEffects = allSlotsForCap.map((mod, i) => {
                                    if (!mod) return null;
                                    const r = allRanksForCap[i] ?? mod.fusionLimit;
                                    return mod.effectsByRank[r] ?? mod.effect;
                                });
                                if (includeArcaneStats && arcane1) {
                                    const ae = arcane1.permanentEffectByRank[arcane1Rank];
                                    buildEffects.push({
                                        ...emptyEffect(),
                                        ...(ae ?? {}),
                                        conditionalEffects: [...(ae?.conditionalEffects ?? [])],
                                    });
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
                                        fireRate: atk.speed || weapon.fireRate,
                                        chargeTime: atk.chargeTime ?? null,
                                    };
                                    return calculateBuild(synth, buildEffects, factionOn ? faction : "");
                                };

                                // Damage type rows for a given damage object
                                const dmgRows = (d: Record<string, number>) => [
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
                                    const dmgSrc = stats.damageBreakdown;

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
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                                <StatBadge label="Arsenal Damage" value={fmt(stats.arsenalDamage)}
                                                    sub="per shot, no crit" />
                                                <StatBadge label="Avg Shot" value={fmt(stats.averageShotDamage)}
                                                    sub="crit-weighted" />
                                                <StatBadge label="Burst DPS" value={fmt(result.burstDPS)}
                                                    sub="no reload" />
                                                <StatBadge label="Sustained DPS" value={fmt(result.sustainedDPS)}
                                                    sub="with reload" />
                                                <StatBadge label="DoT / Shot" value={fmt(stats.dotDamagePerShot)}
                                                    sub="expected total" />
                                                <StatBadge label="DoT DPS" value={fmt(stats.dotDps)}
                                                    sub="steady-state estimate" />
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
                                                <StatBadge label="Magazine" value={displayMagazineValue(weapon, stats.magazineSize)} />
                                                <StatBadge label="Reload" value={stats.reloadTime.toFixed(2) + "s"} />
                                                <StatBadge label="Avg Procs/Shot"
                                                    value={fmt(stats.averageProcsPerShot, 2)}
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
                                                                    sub={fmt((stats.procChanceByType[e.k as keyof typeof stats.procChanceByType] ?? (e.v / total)) * 100, 0) + "%"}
                                                                    tooltip={STATUS_TIPS[e.k]} />
                                                            ))}
                                                        </div>
                                                        <div className="text-[9px] text-slate-600 mt-1.5">
                                                            Proc distribution uses the modded damage mix. Hover each type to see its status effect.
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
                                            <div className="text-[10px] text-slate-600">
                                                Average crit tier: <span className="font-mono text-slate-300">{stats.averageCritTier.toFixed(2)}x</span>
                                            </div>
                                        </div>
                                    );
                                };

                                const hasMultipleAttacks = weapon.attacks.length > 1;

                                return (
                                    <div className="space-y-4">
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
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                        <div className="text-sm font-semibold mb-3">Build Utilities</div>
                                        <div className="text-[10px] text-slate-600 mb-3">
                                            Copy the current build snapshot for comparisons with other tools, or switch tabs to manage owned mods, exclusions, and saved builds.
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(["saves","owned","ownedArcanes","exclude"] as const).map(t => (
                                                <button key={t} onClick={() => setTab(t)}
                                                    className="rounded-full px-3 py-1 text-xs border border-slate-700 text-slate-300 hover:border-slate-500">
                                                    {t === "saves" ? "Saved Builds" : t === "owned" ? "Owned Mods" : t === "ownedArcanes" ? "Owned Arcanes" : `Excluded${excluded.size ? ` (${excluded.size})` : ""}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                </>
            )}

            {weapon && (
                <RivenModal
                    open={rivenEditorSlot !== null}
                    weaponName={weapon.name}
                    onClose={() => setRivenEditorSlot(null)}
                    onApply={handleRivenUpdate}
                />
            )}
        </div>
    );
}
