// src/domain/logic/buildOptimizer.ts
// Build optimizer: beam search for mod selection + polarity-aware slot assignment.
//
// Phase 1 — Beam search: finds the best SET of mods, checking capacity with
//            the real slot polarities (not neutral) so polarity-matching mods
//            correctly count as cheaper.
// Phase 2 — Slot assignment: places selected mods into the slots that minimise
//            total effective drain (matching polarity first).
// Phase 3 — Post-check: if the assigned build is still over capacity, drop the
//            most expensive mod one at a time until it fits.

import type { WeaponEntry, WeaponAttack } from "../catalog/weaponCatalog";
import type { ModEntry } from "../catalog/modCatalog";
import { getModsForWeapon } from "../catalog/modCatalog";
import type { ArcaneEntry } from "../catalog/arcaneCatalog";
import { getArcanesByWeaponCategory } from "../catalog/arcaneCatalog";
import { calculateBuild, avgCritMultiplier } from "./damageCalc";
import { computeCapacity, effectiveDrain, type CapacityConfig, type SlotConfig } from "./capacityCalc";

export type OptimizeGoal = "damage" | "crit" | "status" | "balanced";

export interface OptimizerOptions {
    ownedModNames?: Set<string>;
    excludedModNames?: Set<string>;
    allowNonMaxRank?: boolean;
    targetFaction?: string;
    /** If set, enforce capacity constraint using this config. */
    capacityConfig?: CapacityConfig;
    /** Slot polarities for the 8 main slots (used for both capacity and assignment). */
    slotPolarities?: string[];
    /**
     * If true, optimizer assumes a Catalyst is installed (doubles capacity) regardless
     * of capacityConfig.hasCatalyst. Also marks the result as needing a catalyst.
     */
    allowCatalyst?: boolean;
    /**
     * If true, optimizer is free to assign any polarity to any slot (simulating forma).
     * It will pick the polarity that minimises drain for each placed mod.
     * The returned slotPolarities reflect the optimal polarities to use.
     */
    allowForma?: boolean;
    /**
     * If true, also try adding an exilus mod to the exilus slot.
     * The returned result will include exilusMod / exilusRank if one was selected.
     */
    optimizeExilus?: boolean;
    exilusPolarity?: string;
    /**
     * If provided, score builds against this specific attack rather than the weapon base.
     * Pass weapon.attacks[selectedAttackIdx] here.
     */
    buildForAttack?: WeaponAttack | null;
    /**
     * If true, also try all available arcanes and select the best one.
     * Requires the weapon category to be known (from weapon.category).
     */
    optimizeArcane?: boolean;
}

export interface OptimizeResult {
    mods: ModEntry[];
    ranks: number[];
    /** Full 8-slot array (null = empty slot), in polarity-aware placement order. */
    slots: (ModEntry | null)[];
    slotRanks: number[];
    /** Optimal polarities per slot (reflects forma if allowForma was set). */
    slotPolarities: string[];
    /** Whether a catalyst is needed for this build. */
    needsCatalyst: boolean;
    /** Exilus mod selected (if optimizeExilus was true). */
    exilusMod: ModEntry | null;
    exilusRank: number;
    /** Arcane selected (if optimizeArcane was true). */
    arcane: ArcaneEntry | null;
    arcaneRank: number;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function makeWeaponForAttack(weapon: WeaponEntry, atk: WeaponAttack | null | undefined): WeaponEntry {
    if (!atk) return weapon;
    return {
        ...weapon,
        damage:        atk.damage,
        critChance:    atk.critChance,
        critMultiplier: atk.critMultiplier,
        statusChance:  atk.statusChance,
        chargeTime:    atk.chargeTime ?? null,
    };
}

function scoreEffects(
    weapon: WeaponEntry,
    effects: (import("../catalog/modCatalog").ModEffect | null)[],
    goal: OptimizeGoal,
    targetFaction: string,
    arcaneEffect?: Partial<import("../catalog/modCatalog").ModEffect> | null,
): number {
    const allEffects = arcaneEffect ? [...effects, arcaneEffect as any] : effects;
    const { modded, sustainedDPS, burstDPS } = calculateBuild(weapon, allEffects, targetFaction);
    const statusWeight =
        (modded.procChanceByType.slash ?? 0) * 1.35 +
        (modded.procChanceByType.viral ?? 0) * 1.25 +
        (modded.procChanceByType.heat ?? 0) * 1.15 +
        (modded.procChanceByType.corrosive ?? 0) * 1.1 +
        (modded.procChanceByType.cold ?? 0) * 1.05;
    switch (goal) {
        case "damage":   return sustainedDPS;
        case "crit":     return avgCritMultiplier(modded.critChance, modded.critMultiplier);
        case "status":   return modded.averageProcsPerShot * (1 + statusWeight);
        case "balanced": return burstDPS * (1 + modded.averageProcsPerShot * 0.35 + statusWeight * 0.25);
    }
}

function scoreSlots(
    weapon: WeaponEntry,
    slots: (ModEntry | null)[],
    ranks: (number | undefined)[],
    goal: OptimizeGoal,
    targetFaction: string,
    arcaneEffect?: Partial<import("../catalog/modCatalog").ModEffect> | null,
): number {
    const effects = slots.map((m, i) => {
        if (!m) return null;
        const r = ranks[i] ?? m.fusionLimit;
        return m.effectsByRank[r] ?? m.effect;
    });
    return scoreEffects(weapon, effects, goal, targetFaction, arcaneEffect);
}

// ── Capacity ──────────────────────────────────────────────────────────────────

function fitsCapacity(
    slots: (ModEntry | null)[],
    ranks: (number | undefined)[],
    cfg: CapacityConfig,
    pols: string[],
): boolean {
    const slotCfgs: SlotConfig[] = pols.map(p => ({ polarity: p }));
    while (slotCfgs.length < slots.length) slotCfgs.push({ polarity: "" });
    return !computeCapacity(cfg, slotCfgs, slots, ranks).overCapacity;
}

// ── Optimal polarity for a mod in a slot ─────────────────────────────────────
// When allowForma is true, we can set any polarity. The cheapest is always
// to match the mod's own polarity (halves drain). For auras we want matching too.

function bestPolarity(mod: ModEntry): string {
    return mod.polarity ?? "";
}

// ── Candidate list ────────────────────────────────────────────────────────────

interface Candidate { mod: ModEntry; rank: number; }

function buildCandidates(allMods: ModEntry[], opts: OptimizerOptions): Candidate[] {
    const { ownedModNames, excludedModNames, allowNonMaxRank, targetFaction = "" } = opts;
    const out: Candidate[] = [];
    for (const mod of allMods) {
        if (mod.isAura) continue; // auras go in the aura slot, not regular slots
        if (excludedModNames?.has(mod.name)) continue;
        if (ownedModNames && !ownedModNames.has(mod.name)) continue;
        if (mod.effect.targetFaction && !targetFaction) continue;
        if (mod.effect.targetFaction &&
            mod.effect.targetFaction.toLowerCase() !== targetFaction.toLowerCase()) continue;
        if (allowNonMaxRank) {
            for (let r = mod.fusionLimit; r >= 0; r--) out.push({ mod, rank: r });
        } else {
            out.push({ mod, rank: mod.fusionLimit });
        }
    }
    return out;
}

// ── Polarity-aware slot assignment ────────────────────────────────────────────
// For each mod (sorted by savings potential: largest drain difference wins first pick),
// assign it to the unoccupied slot with the minimum effective drain.
// If allowForma, every slot can take any polarity — we just set the slot polarity
// to match the mod's own polarity for minimum cost.

export function assignModsToSlots(
    mods: ModEntry[],
    ranks: number[],
    slotPolarities: string[],
    slotCount: number,
    allowForma: boolean,
): { slotMods: (ModEntry | null)[]; slotRanks: number[]; resultPolarities: string[] } {
    const slotMods:    (ModEntry | null)[] = Array(slotCount).fill(null);
    const slotRanks:   number[]            = Array(slotCount).fill(0);
    const resultPols:  string[]            = [...slotPolarities];
    while (resultPols.length < slotCount) resultPols.push("");

    const usedSlots = new Set<number>();

    // Sort mods by savings potential (largest polarity benefit first)
    const withSavings = mods.map((mod, mi) => {
        const rank = ranks[mi];
        if (allowForma) {
            // With forma: all slots cost the same (we'll match polarity), savings = 0
            return { mod, rank, savingsPotential: 0 };
        }
        const drains = resultPols.map(pol => effectiveDrain(mod, pol, rank));
        return { mod, rank, savingsPotential: Math.max(...drains) - Math.min(...drains) };
    });
    withSavings.sort((a, b) => b.savingsPotential - a.savingsPotential);

    for (const { mod, rank } of withSavings) {
        let bestSlot = -1;
        let bestDrain = Infinity;
        for (let si = 0; si < slotCount; si++) {
            if (usedSlots.has(si)) continue;
            const drain = allowForma
                ? effectiveDrain(mod, bestPolarity(mod), rank)   // with forma: always matching
                : effectiveDrain(mod, resultPols[si], rank);
            if (drain < bestDrain) { bestDrain = drain; bestSlot = si; }
        }
        if (bestSlot >= 0) {
            slotMods[bestSlot] = mod;
            slotRanks[bestSlot] = rank;
            if (allowForma && mod.polarity) resultPols[bestSlot] = mod.polarity;
            usedSlots.add(bestSlot);
        }
    }

    return { slotMods, slotRanks, resultPolarities: resultPols };
}

// ── Beam search ───────────────────────────────────────────────────────────────
// Scores each candidate set using the REAL slot polarities (or optimal forma
// polarities if allowForma is set) — this avoids over-conservative capacity
// rejection that was killing builds with polarity-matched mods.

const BEAM_WIDTH = 64;

interface BeamState {
    mods: (ModEntry | null)[];
    ranks: (number | undefined)[];
    usedGroups: Set<string>;
    score: number;
}

function beamSearch(
    weapon: WeaponEntry,
    candidates: Candidate[],
    goal: OptimizeGoal,
    slotCount: number,
    opts: OptimizerOptions,
): { mods: ModEntry[]; ranks: number[] } {
    const {
        capacityConfig,
        targetFaction = "",
        allowForma = false,
    } = opts;

    // Effective polarities for capacity checking during beam search.
    // If allowForma, we'll use each mod's own polarity for its slot (best case).
    // If not, use the real slot polarities.
    const getCheckPols = (mods: (ModEntry | null)[]): string[] => {
        if (!allowForma) {
            const pols = [...(opts.slotPolarities ?? [])];
            while (pols.length < slotCount) pols.push("");
            return pols;
        }
        // With forma: each placed mod gets its own polarity; empty slots are neutral
        return mods.map(m => (m && m.polarity) ? m.polarity : "");
    };

    const arcaneEffect = null;

    let beam: BeamState[] = [{
        mods:      Array(slotCount).fill(null),
        ranks:     Array(slotCount).fill(undefined),
        usedGroups: new Set(),
        score:     scoreSlots(weapon, Array(slotCount).fill(null), Array(slotCount).fill(undefined), goal, targetFaction),
    }];

    for (let slotIdx = 0; slotIdx < slotCount; slotIdx++) {
        const nextStates: BeamState[] = [];

        for (const state of beam) {
            nextStates.push(state); // keep empty-slot option

            for (const { mod, rank } of candidates) {
                if (state.usedGroups.has(mod.incompatibilityGroup)) continue;

                const newMods  = [...state.mods];
                const newRanks = [...state.ranks];
                newMods[slotIdx]  = mod;
                newRanks[slotIdx] = rank;

                if (capacityConfig) {
                    const checkPols = getCheckPols(newMods);
                    if (!fitsCapacity(newMods, newRanks, capacityConfig, checkPols)) continue;
                }

                const s = scoreSlots(weapon, newMods, newRanks, goal, targetFaction, arcaneEffect);
                if (s > state.score) {
                    const newUsed = new Set(state.usedGroups);
                    newUsed.add(mod.incompatibilityGroup);
                    nextStates.push({ mods: newMods, ranks: newRanks, usedGroups: newUsed, score: s });
                }
            }
        }

        nextStates.sort((a, b) => b.score - a.score);
        beam = nextStates.slice(0, BEAM_WIDTH);
    }

    const best = beam[0];
    const resultMods: ModEntry[] = [];
    const resultRanks: number[] = [];
    for (let i = 0; i < slotCount; i++) {
        const m = best.mods[i];
        if (m) { resultMods.push(m); resultRanks.push(best.ranks[i] ?? m.fusionLimit); }
    }
    return { mods: resultMods, ranks: resultRanks };
}

// ── Exilus optimization ───────────────────────────────────────────────────────

function optimizeExilusSlot(
    weapon: WeaponEntry,
    allMods: ModEntry[],
    mainSlots: (ModEntry | null)[],
    mainSlotRanks: number[],
    mainSlotPolarities: string[],
    mainBuildEffects: (import("../catalog/modCatalog").ModEffect | null)[],
    goal: OptimizeGoal,
    targetFaction: string,
    exilusPolarity: string,
    opts: OptimizerOptions,
): { mod: ModEntry | null; rank: number } {
    const eligibleExilus = allMods.filter(m =>
        m.isExilus &&
        !m.isAura &&
        !(opts.excludedModNames?.has(m.name)) &&
        (!opts.ownedModNames || opts.ownedModNames.has(m.name))
    );
    if (!eligibleExilus.length) return { mod: null, rank: 0 };

    const baseScore = scoreEffects(weapon, mainBuildEffects, goal, targetFaction);
    let bestMod: ModEntry | null = null;
    let bestRank = 0;
    let bestScore = baseScore;

    for (const mod of eligibleExilus) {
        const minRank = opts.allowNonMaxRank ? 0 : mod.fusionLimit;
        for (let r = mod.fusionLimit; r >= minRank; r--) {
            if (opts.capacityConfig) {
                const capSlots = [...mainSlots, mod];
                const capRanks = [...mainSlotRanks, r];
                const capPols = [...mainSlotPolarities, exilusPolarity];
                if (!fitsCapacity(capSlots, capRanks, opts.capacityConfig, capPols)) continue;
            }
            const e = mod.effectsByRank[r] ?? mod.effect;
            const s = scoreEffects(weapon, [...mainBuildEffects, e], goal, targetFaction);
            if (s >= bestScore) { bestScore = s; bestMod = mod; bestRank = r; }
        }
    }
    return { mod: bestMod, rank: bestRank };
}

// ── Arcane optimization ───────────────────────────────────────────────────────

function optimizeArcaneSlot(
    weapon: WeaponEntry,
    mainBuildEffects: (import("../catalog/modCatalog").ModEffect | null)[],
    goal: OptimizeGoal,
    targetFaction: string,
): { arcane: ArcaneEntry | null; rank: number } {
    const arcanes = getArcanesByWeaponCategory(weapon.category);
    if (!arcanes.length) return { arcane: null, rank: 0 };

    const baseScore = scoreEffects(weapon, mainBuildEffects, goal, targetFaction);
    let bestArcane: ArcaneEntry | null = null;
    let bestRank = 0;
    let bestScore = baseScore;

    for (const arc of arcanes) {
        const e = arc.optimizerEffectByRank[arc.maxRank] ?? arc.permanentEffectByRank[arc.maxRank] ?? {};
        if (!Object.keys(e).length) continue;
        const s = scoreEffects(weapon, [...mainBuildEffects, e as any], goal, targetFaction);
        if (s >= bestScore) { bestScore = s; bestArcane = arc; bestRank = arc.maxRank; }
    }
    return { arcane: bestArcane, rank: bestRank };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function optimizeBuild(
    weapon: WeaponEntry,
    availableMods: ModEntry[] | null,
    goal: OptimizeGoal,
    slotCount: number,
    opts: OptimizerOptions = {},
): OptimizeResult {
    if (!availableMods) availableMods = getModsForWeapon(weapon);

    const {
        slotPolarities = [],
        targetFaction = "",
        allowCatalyst = false,
        allowForma = false,
        optimizeExilus = false,
        exilusPolarity = "",
        optimizeArcane = false,
        buildForAttack = null,
    } = opts;

    // Score against the selected attack if specified
    const scoringWeapon = makeWeaponForAttack(weapon, buildForAttack);

    // Resolve effective capacity config
    let capCfg = opts.capacityConfig;
    if (capCfg && allowCatalyst && !capCfg.hasCatalyst) {
        capCfg = { ...capCfg, hasCatalyst: true };
    }

    // Effective options used inside beam search
    const effectiveOpts: OptimizerOptions = { ...opts, capacityConfig: capCfg };

    const candidates = buildCandidates(availableMods, effectiveOpts);

    // Phase 1: Beam search — find best set of mods
    const { mods, ranks } = beamSearch(scoringWeapon, candidates, goal, slotCount, effectiveOpts);

    // Phase 2: Assign mods to slots with polarity awareness
    const padded = [...slotPolarities];
    while (padded.length < slotCount) padded.push("");

    const { slotMods, slotRanks, resultPolarities } = assignModsToSlots(
        mods, ranks, padded, slotCount, allowForma
    );

    // Phase 3: Post-check capacity with real polarities; drop most expensive mod if over
    if (capCfg) {
        let iter = 0;
        while (iter++ < slotCount) {
            if (fitsCapacity(slotMods, slotRanks, capCfg, resultPolarities)) break;
            let worstSlot = -1, worstDrain = -Infinity;
            for (let si = 0; si < slotCount; si++) {
                const m = slotMods[si];
                if (!m) continue;
                const d = effectiveDrain(m, resultPolarities[si] ?? "", slotRanks[si]);
                if (d > worstDrain) { worstDrain = d; worstSlot = si; }
            }
            if (worstSlot < 0) break;
            slotMods[worstSlot] = null;
            slotRanks[worstSlot] = 0;
        }
    }

    // Phase 4: Exilus slot optimization
    const mainEffects = slotMods.map((m, i) => {
        if (!m) return null;
        const r = slotRanks[i] ?? m.fusionLimit;
        return m.effectsByRank[r] ?? m.effect;
    });

    let exilusMod: ModEntry | null = null;
    let exilusRank = 0;
    if (optimizeExilus) {
        const ex = optimizeExilusSlot(
            scoringWeapon, availableMods, slotMods, slotRanks, resultPolarities, mainEffects, goal, targetFaction, exilusPolarity, effectiveOpts
        );
        exilusMod = ex.mod;
        exilusRank = ex.rank;
    }

    // Phase 5: Arcane optimization
    let arcane: ArcaneEntry | null = null;
    let arcaneRank = 0;
    if (optimizeArcane) {
        const allEffects = exilusMod
            ? [...mainEffects, exilusMod.effectsByRank[exilusRank] ?? exilusMod.effect]
            : mainEffects;
        const arc = optimizeArcaneSlot(scoringWeapon, allEffects, goal, targetFaction);
        arcane = arc.arcane;
        arcaneRank = arc.rank;
    }

    return {
        mods: slotMods.filter((m): m is ModEntry => m !== null),
        ranks: slotRanks.filter((_, i) => slotMods[i] !== null),
        slots: slotMods,
        slotRanks,
        slotPolarities: resultPolarities,
        needsCatalyst: allowCatalyst && !!(opts.capacityConfig && !opts.capacityConfig.hasCatalyst),
        exilusMod,
        exilusRank,
        arcane,
        arcaneRank,
    };
}

// ── Build reasoning ───────────────────────────────────────────────────────────

export interface BuildReasoningStep {
    modName: string;
    rank: number;
    maxRank: number;
    why: string;
    statBefore: number;
    statAfter: number;
    delta: number;
    pctGain: number;
}

export interface BuildReasoning {
    goal: OptimizeGoal;
    targetFaction: string;
    steps: BuildReasoningStep[];
    summary: string;
}

function goalLabel(goal: OptimizeGoal): string {
    switch (goal) {
        case "damage":   return "Sustained DPS";
        case "crit":     return "Crit EV";
        case "status":   return "Status Chance";
        case "balanced": return "Balanced DPS";
    }
}

export function explainBuild(
    weapon: WeaponEntry,
    chosenMods: ModEntry[],
    chosenRanks: number[],
    goal: OptimizeGoal,
    targetFaction = "",
    buildForAttack?: WeaponAttack | null,
): BuildReasoning {
    const scoringWeapon = makeWeaponForAttack(weapon, buildForAttack);
    const slotCount = chosenMods.length;
    const placed:      (ModEntry | null)[]    = Array(slotCount).fill(null);
    const placedRanks: (number | undefined)[] = Array(slotCount).fill(undefined);
    const steps: BuildReasoningStep[] = [];

    for (let i = 0; i < chosenMods.length; i++) {
        const before = scoreSlots(scoringWeapon, placed, placedRanks, goal, targetFaction);
        placed[i]      = chosenMods[i];
        placedRanks[i] = chosenRanks[i];
        const after    = scoreSlots(scoringWeapon, placed, placedRanks, goal, targetFaction);
        const delta    = after - before;
        const pctGain  = before > 0 ? (delta / before) * 100 : 0;

        const mod  = chosenMods[i];
        const rank = chosenRanks[i];
        const e    = mod.effectsByRank[rank] ?? mod.effect;
        const parts: string[] = [];
        if (e.damageBonus > 0)       parts.push(`+${(e.damageBonus * 100).toFixed(0)}% dmg`);
        if (e.critChanceBonus > 0)   parts.push(`+${(e.critChanceBonus * 100).toFixed(0)}% cc`);
        if (e.critMultBonus > 0)     parts.push(`+${(e.critMultBonus * 100).toFixed(0)}% cd`);
        if (e.statusChanceBonus > 0) parts.push(`+${(e.statusChanceBonus * 100).toFixed(0)}% sc`);
        if (e.multishotBonus > 0)    parts.push(`+${(e.multishotBonus * 100).toFixed(0)}% ms`);
        if (e.fireRateBonus > 0)     parts.push(`+${(e.fireRateBonus * 100).toFixed(0)}% fr`);
        const eleSum = e.heatBonus + e.coldBonus + e.electricityBonus + e.toxinBonus + e.magneticBonus + e.radiationBonus;
        if (eleSum > 0)              parts.push(`+${(eleSum * 100).toFixed(0)}% elem`);
        if (e.factionDamageBonus > 0) parts.push(`×${(1 + e.factionDamageBonus).toFixed(2)} ${e.targetFaction}`);
        const rankNote = rank < mod.fusionLimit ? ` (rank ${rank}/${mod.fusionLimit})` : "";

        steps.push({
            modName: mod.name, rank, maxRank: mod.fusionLimit,
            why: `${parts.join(", ")}${rankNote} → +${pctGain.toFixed(1)}% ${goalLabel(goal)}`,
            statBefore: before, statAfter: after, delta, pctGain,
        });
    }

    const finalScore = scoreSlots(scoringWeapon, placed, placedRanks, goal, targetFaction);
    const baseScore  = scoreSlots(scoringWeapon, Array(slotCount).fill(null), Array(slotCount).fill(undefined), goal, targetFaction);
    const totalGain  = baseScore > 0 ? ((finalScore - baseScore) / baseScore) * 100 : 0;
    const summary    = `${goalLabel(goal)}${targetFaction ? ` vs ${targetFaction}` : ""}. Total gain: +${totalGain.toFixed(1)}% over unmodded weapon.`;

    return { goal, targetFaction, steps, summary };
}
