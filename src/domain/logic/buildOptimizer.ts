// src/domain/logic/buildOptimizer.ts
// Build optimizer: beam search for mod selection + polarity-aware slot assignment.

import type { WeaponEntry } from "../catalog/weaponCatalog";
import type { ModEntry } from "../catalog/modCatalog";
import { getModsForWeapon } from "../catalog/modCatalog";
import { calculateBuild, avgCritMultiplier } from "./damageCalc";
import { computeCapacity, effectiveDrain, type CapacityConfig, type SlotConfig } from "./capacityCalc";

export type OptimizeGoal = "damage" | "crit" | "status" | "balanced";

export interface OptimizerOptions {
    ownedModNames?: Set<string>;
    excludedModNames?: Set<string>;
    allowNonMaxRank?: boolean;
    targetFaction?: string;
    /** If set, enforce capacity constraints (skip mods that won't fit). */
    capacityConfig?: CapacityConfig;
    /** Current slot polarities for capacity-aware and assignment passes. */
    slotPolarities?: string[];
    /** Exilus mod (if installed) — included in capacity but not in main slots. */
    exilusMod?: ModEntry | null;
    exilusPolarity?: string;
    exilusRank?: number;
    /**
     * If true and capacityConfig.hasCatalyst is false, the optimizer pretends a
     * catalyst IS installed when checking capacity — useful for planning builds
     * that require a catalyst to fit.
     */
    assumeCatalyst?: boolean;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreEffects(
    weapon: WeaponEntry,
    effects: (import("../catalog/modCatalog").ModEffect | null)[],
    goal: OptimizeGoal,
    targetFaction: string,
): number {
    const { modded, sustainedDPS, burstDPS } = calculateBuild(weapon, effects, targetFaction);
    switch (goal) {
        case "damage":   return sustainedDPS;
        case "crit":     return avgCritMultiplier(modded.critChance, modded.critMultiplier);
        case "status":   return modded.statusChance;
        case "balanced": return burstDPS * (1 + modded.statusChance * 0.5);
    }
}

function scoreSlots(
    weapon: WeaponEntry,
    slots: (ModEntry | null)[],
    ranks: (number | undefined)[],
    goal: OptimizeGoal,
    targetFaction: string,
): number {
    const effects = slots.map((m, i) => {
        if (!m) return null;
        const r = ranks[i] ?? m.fusionLimit;
        return m.effectsByRank[r] ?? m.effect;
    });
    return scoreEffects(weapon, effects, goal, targetFaction);
}

// ── Capacity check ────────────────────────────────────────────────────────────

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

// ── Candidate list ────────────────────────────────────────────────────────────

interface Candidate { mod: ModEntry; rank: number; }

function buildCandidates(allMods: ModEntry[], opts: OptimizerOptions): Candidate[] {
    const { ownedModNames, excludedModNames, allowNonMaxRank, targetFaction = "" } = opts;
    const out: Candidate[] = [];
    for (const mod of allMods) {
        if (excludedModNames?.has(mod.name)) continue;
        if (ownedModNames && !ownedModNames.has(mod.name)) continue;
        // Exclude faction mods unless target faction is selected
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

// ── Beam search: find best SET of mods ───────────────────────────────────────
// Beam search determines WHICH mods to use (ignoring slot placement).
// Slot assignment is handled separately after this step.

const BEAM_WIDTH = 48;

interface BeamState {
    mods: (ModEntry | null)[];
    ranks: (number | undefined)[];
    usedNames: Set<string>;
    score: number;
}

function beamSearch(
    weapon: WeaponEntry,
    candidates: Candidate[],
    goal: OptimizeGoal,
    slotCount: number,
    opts: OptimizerOptions,
): { mods: ModEntry[]; ranks: number[] } {
    const { capacityConfig, slotPolarities = [], targetFaction = "" } = opts;

    let beam: BeamState[] = [{
        mods: Array(slotCount).fill(null),
        ranks: Array(slotCount).fill(undefined),
        usedNames: new Set(),
        score: scoreSlots(weapon, Array(slotCount).fill(null), Array(slotCount).fill(undefined), goal, targetFaction),
    }];

    for (let slotIdx = 0; slotIdx < slotCount; slotIdx++) {
        const nextStates: BeamState[] = [];

        for (const state of beam) {
            // Keep current state (leave slot empty)
            nextStates.push(state);

            for (const { mod, rank } of candidates) {
                if (state.usedNames.has(mod.name)) continue;

                const newMods = [...state.mods];
                const newRanks = [...state.ranks];
                newMods[slotIdx] = mod;
                newRanks[slotIdx] = rank;

                // Capacity guard: check if this set fits at all.
                // Use neutral polarities for beam search so we don't prematurely
                // reject mods that would fit after polarity assignment.
                if (capacityConfig) {
                    const neutralPols = Array(slotCount).fill("");
                    if (!fitsCapacity(newMods, newRanks, capacityConfig, neutralPols)) continue;
                }

                const s = scoreSlots(weapon, newMods, newRanks, goal, targetFaction);
                if (s > state.score) {
                    const newUsed = new Set(state.usedNames);
                    newUsed.add(mod.name);
                    nextStates.push({ mods: newMods, ranks: newRanks, usedNames: newUsed, score: s });
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

// ── Polarity-aware slot assignment ────────────────────────────────────────────
// Given a set of mods, find the assignment of mods→slots that minimises
// total effective capacity cost (matching polarity = cheaper).
// Uses brute force for ≤8 mods (8! = 40320) which is fast enough.
// For larger sets, uses a greedy nearest-fit heuristic.

function assignModsToSlots(
    mods: ModEntry[],
    ranks: number[],
    slotPolarities: string[],
    slotCount: number,
): { mods: (ModEntry | null)[]; ranks: number[] } {
    if (mods.length === 0) {
        return {
            mods: Array(slotCount).fill(null),
            ranks: Array(slotCount).fill(0),
        };
    }

    // Calculate effective drain for each (mod, slot) pair
    const drainMatrix: number[][] = mods.map((mod, mi) =>
        slotPolarities.map(pol => effectiveDrain(mod, pol, ranks[mi]))
    );

    // Pad slots to slotCount
    const nSlots = Math.max(slotCount, mods.length);

    let bestTotalDrain = Infinity;
    let bestAssignment: number[] = mods.map((_, i) => i); // slot index for each mod

    if (mods.length <= 8) {
        // Full permutation search over slot indices
        const slotIndices = Array.from({ length: nSlots }, (_, i) => i);
        function permute(arr: number[], start: number) {
            if (start === mods.length) {
                let total = 0;
                for (let i = 0; i < mods.length; i++) total += drainMatrix[i][arr[i]] ?? 0;
                if (total < bestTotalDrain) {
                    bestTotalDrain = total;
                    bestAssignment = arr.slice(0, mods.length);
                }
                return;
            }
            for (let j = start; j < slotIndices.length; j++) {
                [arr[start], arr[j]] = [arr[j], arr[start]];
                permute(arr, start + 1);
                [arr[start], arr[j]] = [arr[j], arr[start]];
            }
        }
        permute(slotIndices, 0);
    } else {
        // Greedy: assign each mod to its cheapest available slot
        const usedSlots = new Set<number>();
        bestAssignment = mods.map((_, mi) => {
            let bestSlot = -1, bestDrain = Infinity;
            for (let si = 0; si < nSlots; si++) {
                if (usedSlots.has(si)) continue;
                const d = drainMatrix[mi][si] ?? 999;
                if (d < bestDrain) { bestDrain = d; bestSlot = si; }
            }
            if (bestSlot < 0) bestSlot = mi; // fallback
            usedSlots.add(bestSlot);
            return bestSlot;
        });
    }

    // Build result array
    const resultMods: (ModEntry | null)[] = Array(slotCount).fill(null);
    const resultRanks: number[] = Array(slotCount).fill(0);
    for (let mi = 0; mi < mods.length; mi++) {
        const si = bestAssignment[mi];
        if (si < slotCount) {
            resultMods[si] = mods[mi];
            resultRanks[si] = ranks[mi];
        }
    }
    return { mods: resultMods, ranks: resultRanks };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function optimizeBuild(
    weapon: WeaponEntry,
    availableMods: ModEntry[] | null,
    goal: OptimizeGoal,
    slotCount: number,
    opts: OptimizerOptions = {},
): { mods: ModEntry[]; ranks: number[]; slots: (ModEntry | null)[]; slotRanks: number[] } {
    if (!availableMods) availableMods = getModsForWeapon(weapon);
    const { slotPolarities = [], targetFaction = "" } = opts;

    // Apply assumeCatalyst: if set and catalyst not already installed, override capCfg
    const effectiveOpts: OptimizerOptions = opts;
    if (opts.assumeCatalyst && opts.capacityConfig && !opts.capacityConfig.hasCatalyst) {
        (effectiveOpts as any).capacityConfig = { ...opts.capacityConfig, hasCatalyst: true };
    }

    const candidates = buildCandidates(availableMods, effectiveOpts);

    // Step 1: Beam search to find the best SET of mods (slot-order agnostic)
    const { mods, ranks } = beamSearch(weapon, candidates, goal, slotCount, effectiveOpts);

    // Step 2: Assign mods to slots optimally for minimum capacity cost
    const padded = [...slotPolarities];
    while (padded.length < slotCount) padded.push("");

    const { mods: slots, ranks: slotRanks } = assignModsToSlots(mods, ranks, padded, slotCount);

    // Step 3: Final capacity check with real polarities — if still over, drop the most expensive mod
    if (opts.capacityConfig) {
        let iter = 0;
        while (iter++ < slotCount) {
            if (fitsCapacity(slots, slotRanks, opts.capacityConfig, padded)) break;
            // Find the mod with the highest effective drain and remove it
            let worstSlot = -1, worstDrain = -Infinity;
            for (let si = 0; si < slotCount; si++) {
                const m = slots[si];
                if (!m) continue;
                const d = effectiveDrain(m, padded[si] ?? "", slotRanks[si]);
                if (d > worstDrain) { worstDrain = d; worstSlot = si; }
            }
            if (worstSlot < 0) break;
            slots[worstSlot] = null;
            slotRanks[worstSlot] = 0;
        }
    }

    return {
        mods: slots.filter((m): m is ModEntry => m !== null),
        ranks: slotRanks.filter((_, i) => slots[i] !== null),
        slots,
        slotRanks,
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
    polarityNote?: string;
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
    slotPolarities?: string[],
): BuildReasoning {
    const slotCount = chosenMods.length;
    const placed: (ModEntry | null)[] = Array(slotCount).fill(null);
    const placedRanks: (number | undefined)[] = Array(slotCount).fill(undefined);
    const steps: BuildReasoningStep[] = [];

    for (let i = 0; i < chosenMods.length; i++) {
        const before = scoreSlots(weapon, placed, placedRanks, goal, targetFaction);
        placed[i] = chosenMods[i];
        placedRanks[i] = chosenRanks[i];
        const after = scoreSlots(weapon, placed, placedRanks, goal, targetFaction);
        const delta = after - before;
        const pctGain = before > 0 ? (delta / before) * 100 : 0;

        const mod = chosenMods[i];
        const rank = chosenRanks[i];
        const e = mod.effectsByRank[rank] ?? mod.effect;
        const parts: string[] = [];
        if (e.damageBonus > 0) parts.push(`+${(e.damageBonus * 100).toFixed(0)}% dmg`);
        if (e.critChanceBonus > 0) parts.push(`+${(e.critChanceBonus * 100).toFixed(0)}% cc`);
        if (e.critMultBonus > 0) parts.push(`+${(e.critMultBonus * 100).toFixed(0)}% cd`);
        if (e.statusChanceBonus > 0) parts.push(`+${(e.statusChanceBonus * 100).toFixed(0)}% sc`);
        if (e.multishotBonus > 0) parts.push(`+${(e.multishotBonus * 100).toFixed(0)}% ms`);
        if (e.fireRateBonus > 0) parts.push(`+${(e.fireRateBonus * 100).toFixed(0)}% fr`);
        const eleSum = e.heatBonus + e.coldBonus + e.electricityBonus + e.toxinBonus + e.magneticBonus + e.radiationBonus;
        if (eleSum > 0) parts.push(`+${(eleSum * 100).toFixed(0)}% elem`);
        if (e.factionDamageBonus > 0) parts.push(`×${(1 + e.factionDamageBonus).toFixed(2)} ${e.targetFaction}`);
        const rankNote = rank < mod.fusionLimit ? ` (rank ${rank}/${mod.fusionLimit})` : "";

        steps.push({
            modName: mod.name, rank, maxRank: mod.fusionLimit,
            why: `${parts.join(", ")}${rankNote} → +${pctGain.toFixed(1)}% ${goalLabel(goal)}`,
            statBefore: before, statAfter: after, delta, pctGain,
        });
    }

    const finalScore = scoreSlots(weapon, placed, placedRanks, goal, targetFaction);
    const baseScore  = scoreSlots(weapon, Array(slotCount).fill(null), Array(slotCount).fill(undefined), goal, targetFaction);
    const totalGain  = baseScore > 0 ? ((finalScore - baseScore) / baseScore) * 100 : 0;
    const summary    = `${goalLabel(goal)}${targetFaction ? ` vs ${targetFaction}` : ""}. Total gain: +${totalGain.toFixed(1)}% over base weapon.`;

    // Note any polarity savings from assignment
    let polarityNote: string | undefined;
    if (slotPolarities && chosenMods.length > 0) {
        const matchCount = chosenMods.filter((m, i) => {
            // Find what slot the mod was placed in by looking at slotPolarities
            return slotPolarities.some(p => p === m.polarity);
        }).length;
        if (matchCount > 0) {
            polarityNote = `${matchCount} mod${matchCount !== 1 ? "s" : ""} placed in matching polarity slots for reduced capacity cost.`;
        }
    }

    return { goal, targetFaction, steps, summary, polarityNote };
}
