// src/domain/logic/buildOptimizer.ts
// Greedy build optimizer: fills mod slots to maximize the chosen objective.

import type { WeaponEntry } from "../catalog/weaponCatalog";
import type { ModEntry } from "../catalog/modCatalog";
import { calculateBuild, avgCritMultiplier } from "./damageCalc";

export type OptimizeGoal =
    | "damage"    // maximize sustained DPS
    | "crit"      // maximize crit EV (critChance × critMult)
    | "status"    // maximize status chance
    | "balanced"; // maximize burst DPS (effective crit-weighted)

function score(weapon: WeaponEntry, slots: (ModEntry | null)[], goal: OptimizeGoal): number {
    const effects = slots.map(m => m?.effect ?? null);
    const { modded, sustainedDPS, burstDPS } = calculateBuild(weapon, effects);

    switch (goal) {
        case "damage":
            return sustainedDPS;
        case "crit":
            // Effective crit value: expected crit multiplier
            return avgCritMultiplier(modded.critChance, modded.critMultiplier);
        case "status":
            return modded.statusChance;
        case "balanced":
            // Weighted combo of damage, crit, and status contributions
            return burstDPS * (1 + modded.statusChance * 0.5);
    }
}

/**
 * Greedy best-first optimizer.  Fills up to `slotCount` slots one at a time,
 * each time picking the available mod that maximises the objective score.
 *
 * Returns an array of selected mods (length ≤ slotCount).
 */
export function optimizeBuild(
    weapon: WeaponEntry,
    availableMods: ModEntry[],
    goal: OptimizeGoal,
    slotCount: number,
): ModEntry[] {
    const selected: (ModEntry | null)[] = Array(slotCount).fill(null);
    const usedNames = new Set<string>();

    for (let slotIdx = 0; slotIdx < slotCount; slotIdx++) {
        let bestMod: ModEntry | null = null;
        let bestScore = -Infinity;

        for (const mod of availableMods) {
            if (usedNames.has(mod.name)) continue;
            if (!mod.hasDamageEffect) continue;

            // Temporarily place this mod in the current slot
            selected[slotIdx] = mod;
            const s = score(weapon, selected, goal);
            if (s > bestScore) {
                bestScore = s;
                bestMod = mod;
            }
        }

        if (bestMod) {
            selected[slotIdx] = bestMod;
            usedNames.add(bestMod.name);
        } else {
            selected[slotIdx] = null;
        }
    }

    return selected.filter((m): m is ModEntry => m !== null);
}
