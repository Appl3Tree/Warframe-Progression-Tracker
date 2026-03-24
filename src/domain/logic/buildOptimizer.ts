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
import type { ModEntry, ModEffect } from "../catalog/modCatalog";
import { emptyEffect, getModsForWeapon } from "../catalog/modCatalog";
import type { ArcaneEntry } from "../catalog/arcaneCatalog";
import { getArcanesByWeaponCategory } from "../catalog/arcaneCatalog";
import { calculateBuild, avgCritMultiplier, estimateConditionalUptime } from "./damageCalc";
import { computeCapacity, effectiveDrain, type CapacityConfig, type SlotConfig } from "./capacityCalc";

export type OptimizeGoal = "damage" | "crit" | "status" | "balanced";

export interface OptimizerOptions {
    ownedModNames?: Set<string>;
    ownedArcaneUniqueNames?: Set<string>;
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

const PROC_DAMAGE_KEYS = [
    "impact", "puncture", "slash",
    "heat", "cold", "electricity", "toxin",
    "blast", "radiation", "gas", "magnetic", "viral", "corrosive",
] as const;

interface TargetProfile {
    armor: number;
    healthShare: number;
    shieldShare: number;
    grouped: boolean;
    effectiveHealth: number;
    healthMaterial: "flesh" | "clonedFlesh" | "infestedFlesh" | "machinery" | "robotic";
    armorMaterial: "" | "ferriteArmor" | "alloyArmor";
    shieldMaterial: "" | "shield" | "protoShield";
}

function getTargetProfile(targetFaction: string): TargetProfile {
    switch (targetFaction.toLowerCase()) {
        case "grineer":
            return {
                armor: 2700,
                healthShare: 1,
                shieldShare: 0,
                grouped: false,
                effectiveHealth: 25000,
                healthMaterial: "clonedFlesh",
                armorMaterial: "ferriteArmor",
                shieldMaterial: "",
            };
        case "corpus":
            return {
                armor: 0,
                healthShare: 0.4,
                shieldShare: 0.6,
                grouped: false,
                effectiveHealth: 18000,
                healthMaterial: "flesh",
                armorMaterial: "",
                shieldMaterial: "shield",
            };
        case "infested":
            return {
                armor: 0,
                healthShare: 1,
                shieldShare: 0,
                grouped: true,
                effectiveHealth: 16000,
                healthMaterial: "infestedFlesh",
                armorMaterial: "",
                shieldMaterial: "",
            };
        case "orokin":
            return {
                armor: 1200,
                healthShare: 0.85,
                shieldShare: 0.15,
                grouped: false,
                effectiveHealth: 22000,
                healthMaterial: "flesh",
                armorMaterial: "alloyArmor",
                shieldMaterial: "protoShield",
            };
        case "the murmur":
            return {
                armor: 600,
                healthShare: 1,
                shieldShare: 0,
                grouped: false,
                effectiveHealth: 20000,
                healthMaterial: "robotic",
                armorMaterial: "alloyArmor",
                shieldMaterial: "",
            };
        default:
            return {
                armor: 0,
                healthShare: 1,
                shieldShare: 0,
                grouped: false,
                effectiveHealth: 18000,
                healthMaterial: "flesh",
                armorMaterial: "",
                shieldMaterial: "",
            };
    }
}

const HEALTH_TYPE_MODIFIERS: Partial<Record<TargetProfile["healthMaterial"], Partial<Record<typeof PROC_DAMAGE_KEYS[number], number>>>> = {
    flesh: {
        impact: 0.25,
        slash: -0.25,
        toxin: 0.5,
        viral: 0.5,
        gas: -0.25,
    },
    clonedFlesh: {
        slash: 0.25,
        heat: 0.25,
        viral: 0.75,
        gas: -0.5,
    },
    infestedFlesh: {
        slash: 0.25,
        heat: 0.5,
        gas: 0.75,
        radiation: -0.5,
        viral: -0.5,
    },
    machinery: {
        electricity: 0.5,
        toxin: -0.25,
        blast: 0.75,
        viral: -0.25,
    },
    robotic: {
        puncture: 0.25,
        electricity: 0.5,
        toxin: -0.25,
        radiation: 0.25,
    },
};

const ARMOR_TYPE_MODIFIERS: Partial<Record<Exclude<TargetProfile["armorMaterial"], "">, Partial<Record<typeof PROC_DAMAGE_KEYS[number], number>>>> = {
    ferriteArmor: {
        puncture: 0.5,
        slash: -0.15,
        blast: -0.25,
        corrosive: 0.75,
    },
    alloyArmor: {
        puncture: 0.15,
        slash: -0.5,
        cold: 0.25,
        electricity: -0.5,
        magnetic: -0.5,
        radiation: 0.75,
    },
};

const SHIELD_TYPE_MODIFIERS: Partial<Record<Exclude<TargetProfile["shieldMaterial"], "">, Partial<Record<typeof PROC_DAMAGE_KEYS[number], number>>>> = {
    shield: {
        impact: 0.5,
        puncture: -0.2,
        cold: 0.5,
        magnetic: 0.75,
        radiation: -0.25,
    },
    protoShield: {
        impact: 0.15,
        puncture: 0.5,
        heat: -0.5,
        corrosive: -0.5,
        magnetic: 0.75,
    },
};

function typeMaterialModifier(
    damageType: typeof PROC_DAMAGE_KEYS[number],
    table: Partial<Record<typeof PROC_DAMAGE_KEYS[number], number>> | undefined,
): number {
    return 1 + (table?.[damageType] ?? 0);
}

function directDamageTypeMultiplier(
    damageType: typeof PROC_DAMAGE_KEYS[number],
    target: TargetProfile,
    effectiveArmorMultiplier: number,
    viralHealthDamageBonus: number,
    magneticShieldDamageBonus: number,
): number {
    const healthModifier =
        target.healthShare *
        typeMaterialModifier(damageType, HEALTH_TYPE_MODIFIERS[target.healthMaterial]) *
        typeMaterialModifier(damageType, target.armorMaterial ? ARMOR_TYPE_MODIFIERS[target.armorMaterial] : undefined) *
        effectiveArmorMultiplier *
        (1 + viralHealthDamageBonus);
    const shieldModifier =
        target.shieldShare *
        typeMaterialModifier(damageType, target.shieldMaterial ? SHIELD_TYPE_MODIFIERS[target.shieldMaterial] : undefined) *
        (1 + magneticShieldDamageBonus);
    return healthModifier + shieldModifier;
}

function armorDamageMultiplier(armor: number): number {
    if (armor <= 0) return 1;
    return Math.max(0.1, 1 - 0.9 * Math.sqrt(armor / 2700));
}

function dotRealizationFactor(timeToKill: number, duration: number): number {
    if (duration <= 0 || !Number.isFinite(timeToKill) || timeToKill <= 0) return 1;
    if (timeToKill < duration) return Math.max(0.05, timeToKill / (2 * duration));
    return Math.max(0.2, 1 - duration / (2 * timeToKill));
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
        fireRate:      atk.speed || weapon.fireRate,
        chargeTime:    atk.chargeTime ?? null,
    };
}

function scoreEffects(
    weapon: WeaponEntry,
    effects: (ModEffect | null)[],
    goal: OptimizeGoal,
    targetFaction: string,
    arcaneEffect?: Partial<ModEffect> | null,
): number {
    const normalizedArcaneEffect = arcaneEffect
        ? { ...emptyEffect(), ...arcaneEffect, conditionalEffects: [...(arcaneEffect.conditionalEffects ?? [])] }
        : null;
    const allEffects = normalizedArcaneEffect ? [...effects, normalizedArcaneEffect] : effects;
    const { modded, sustainedDPS, burstDPS } = calculateBuild(weapon, allEffects, targetFaction);
    let statusDurationBonus = 0;
    let statusDamageBonus = 0;
    let projectileSpeedBonus = 0;
    let accuracyBonus = 0;
    let blastRadiusBonus = 0;
    let beamRangeBonus = 0;
    let punchThrough = 0;
    let rangeBonus = 0;
    let headshotMultiplierBonus = 0;
    let weakPointDamageBonus = 0;
    let weakPointCritChanceBonus = 0;
    let comboDurationBonus = 0;
    let initialComboBonus = 0;
    let comboCountChanceBonus = 0;
    let heavyAttackEfficiencyBonus = 0;
    let heavyAttackWindUpBonus = 0;
    let lifeStealBonus = 0;
    let ammoEfficiencyBonus = 0;
    let directDamagePerStatusBonus = 0;
    let finalStatusChanceBonus = 0;
    const conditionalEffects = allEffects.flatMap(effect => effect?.conditionalEffects ?? []);

    for (const effect of allEffects) {
        if (!effect) continue;
        statusDurationBonus += effect.statusDurationBonus ?? 0;
        statusDamageBonus += effect.statusDamageBonus ?? 0;
        projectileSpeedBonus += effect.projectileSpeedBonus ?? 0;
        accuracyBonus += effect.accuracyBonus ?? 0;
        blastRadiusBonus += effect.blastRadiusBonus ?? 0;
        beamRangeBonus += effect.beamRangeBonus ?? 0;
        punchThrough += effect.punchThrough ?? 0;
        rangeBonus += effect.rangeBonus ?? 0;
        headshotMultiplierBonus += effect.headshotMultiplierBonus ?? 0;
        weakPointDamageBonus += effect.weakPointDamageBonus ?? 0;
        weakPointCritChanceBonus += effect.weakPointCritChanceBonus ?? 0;
        comboDurationBonus += effect.comboDurationBonus ?? 0;
        initialComboBonus += effect.initialComboBonus ?? 0;
        comboCountChanceBonus += effect.comboCountChanceBonus ?? 0;
        heavyAttackEfficiencyBonus += effect.heavyAttackEfficiencyBonus ?? 0;
        heavyAttackWindUpBonus += effect.heavyAttackWindUpBonus ?? 0;
        lifeStealBonus += effect.lifeStealBonus ?? 0;
        ammoEfficiencyBonus += effect.ammoEfficiencyBonus ?? 0;
        directDamagePerStatusBonus += effect.directDamagePerStatusBonus ?? 0;
        finalStatusChanceBonus += effect.finalStatusChanceBonus ?? 0;
    }

    const baselineFireRate = weapon.fireRate * (1 + (weapon.category === "Melee" ? 0 : 0));
    const baselineMagazineSize = Math.max(1, Math.round(weapon.magazineSize));
    for (const conditional of conditionalEffects) {
        const uptime = estimateConditionalUptime(conditional, baselineFireRate, baselineMagazineSize);
        ammoEfficiencyBonus += (conditional.stats.ammoEfficiencyBonus ?? 0) * uptime;
        directDamagePerStatusBonus += (conditional.stats.directDamagePerStatusBonus ?? 0) * uptime;
    }

    const statusWeight =
        modded.dotDps / Math.max(1, sustainedDPS) +
        modded.viralHealthDamageBonus * 0.3 +
        modded.heatArmorStrip * 0.25 +
        modded.corrosiveArmorStrip * 0.3 +
        modded.magneticShieldDamageBonus * 0.15 +
        modded.coldSlow * 0.08 +
        modded.coldCritDamageBonus * 0.12 +
        modded.punctureEnemyDamageReduction * 0.08 +
        modded.punctureCritChanceBonus * 0.15 +
        modded.impactMercyThresholdBonus * 0.05 +
        modded.radiationAllyDamageBonus * 0.04 +
        modded.tauStatusVulnerability * 0.08;
    const rangedUtility =
        punchThrough * 0.08 +
        beamRangeBonus * 0.25 +
        projectileSpeedBonus * 0.05 +
        accuracyBonus * 0.03 +
        blastRadiusBonus * 0.12 +
        headshotMultiplierBonus * 0.08 +
        weakPointDamageBonus * 0.18 +
        weakPointCritChanceBonus * 0.16;
    const meleeUtility =
        rangeBonus * 0.1 +
        (comboDurationBonus / 10) * 0.08 +
        (initialComboBonus / 20) * 0.06 +
        comboCountChanceBonus * 0.08 +
        heavyAttackEfficiencyBonus * 0.07 +
        heavyAttackWindUpBonus * 0.05;
    const sharedUtility =
        statusDamageBonus * 0.2 +
        statusDurationBonus * 0.08 +
        lifeStealBonus * 0.04 +
        ammoEfficiencyBonus * 0.12 +
        finalStatusChanceBonus * 0.2;
    const utilityWeight = sharedUtility + (weapon.category === "Melee" ? meleeUtility : rangedUtility);
    const estimatedStatusTypes =
        PROC_DAMAGE_KEYS.reduce((count, key) => count + ((modded.procChanceByType[key] ?? 0) > 0.02 ? 1 : 0), 0) +
        Object.values(modded.extraProcsPerShot).reduce((count, value) => count + ((value ?? 0) > 0.01 ? 1 : 0), 0);
    const directDamagePerStatusWeight = directDamagePerStatusBonus * Math.max(1, Math.min(6, estimatedStatusTypes));
    const target = getTargetProfile(targetFaction);
    const combinedArmorStrip = 1 - ((1 - modded.heatArmorStrip) * (1 - modded.corrosiveArmorStrip));
    const strippedArmor = target.armor * Math.max(0, 1 - combinedArmorStrip);
    const effectiveArmorMultiplier = armorDamageMultiplier(strippedArmor);
    const activeStatusTypes = Math.max(
        1,
        Object.entries(modded.expectedStacksByType).reduce((count, [, value]) => count + ((value ?? 0) >= 0.25 ? 1 : 0), 0),
    );
    const directDamagePerStatusMultiplier = 1 + directDamagePerStatusBonus * activeStatusTypes;
    const directTypeWeightTotal = PROC_DAMAGE_KEYS.reduce(
        (sum, key) => sum + (modded.damageBreakdown[key] ?? 0),
        0,
    );
    const targetAdjustedDirectMultiplier = directTypeWeightTotal > 0
        ? PROC_DAMAGE_KEYS.reduce((sum, key) => {
            const share = (modded.damageBreakdown[key] ?? 0) / directTypeWeightTotal;
            if (share <= 0) return sum;
            let typeMultiplier = directDamageTypeMultiplier(
                key,
                target,
                effectiveArmorMultiplier,
                modded.viralHealthDamageBonus,
                modded.magneticShieldDamageBonus,
            );
            if (key === "toxin" && target.shieldShare > 0) {
                // Toxin bypasses most shields, so its shield contribution is smaller but its health contribution remains.
                typeMultiplier += target.shieldShare * 0.1;
            }
            return sum + share * typeMultiplier;
        }, 0)
        : 1;
    const adjustedDirectDps = sustainedDPS *
        Math.max(0.1, targetAdjustedDirectMultiplier) *
        directDamagePerStatusMultiplier;
    const estimatedTimeToKill = target.effectiveHealth / Math.max(1, adjustedDirectDps);
    const realizedSlashFactor = dotRealizationFactor(estimatedTimeToKill, 6 * (1 + statusDurationBonus));
    const realizedHeatFactor = dotRealizationFactor(estimatedTimeToKill, 6 * (1 + statusDurationBonus));
    const realizedToxinFactor = dotRealizationFactor(estimatedTimeToKill, 6 * (1 + statusDurationBonus));
    const realizedElectricFactor = dotRealizationFactor(estimatedTimeToKill, 6 * (1 + statusDurationBonus));
    const realizedGasFactor = dotRealizationFactor(estimatedTimeToKill, 6 * (1 + statusDurationBonus));
    const adjustedDotDps =
        (modded.dotDpsByType.slash ?? 0) * target.healthShare * (1 + modded.viralHealthDamageBonus) * realizedSlashFactor +
        (modded.dotDpsByType.heat ?? 0) * target.healthShare * effectiveArmorMultiplier * (1 + modded.viralHealthDamageBonus) * realizedHeatFactor +
        (modded.dotDpsByType.toxin ?? 0) * (
            target.healthShare * effectiveArmorMultiplier * (1 + modded.viralHealthDamageBonus) +
            target.shieldShare * 0.35
        ) * realizedToxinFactor +
        (modded.dotDpsByType.electricity ?? 0) * (
            (target.healthShare * effectiveArmorMultiplier + target.shieldShare) *
            (target.grouped ? 1.2 : 1)
        ) * realizedElectricFactor +
        (modded.dotDpsByType.gas ?? 0) * (
            target.healthShare *
            effectiveArmorMultiplier *
            (1 + modded.viralHealthDamageBonus) *
            (target.grouped ? 1.25 : 1.05)
        ) * realizedGasFactor;
    const blastUtilityDps = modded.blastDetonationDamagePerShot * modded.fireRate * (target.grouped ? 1.25 : 0.75);
    const gasUtility = modded.gasCloudRadius * 0.04;
    const coldCritMultiplierGain = modded.coldCritDamageBonus > 0
        ? avgCritMultiplier(modded.critChance + modded.punctureCritChanceBonus, modded.critMultiplier + modded.coldCritDamageBonus) /
          Math.max(1, avgCritMultiplier(modded.critChance, modded.critMultiplier))
        : 1;
    const punctureCritGain = avgCritMultiplier(modded.critChance + modded.punctureCritChanceBonus, modded.critMultiplier) /
        Math.max(1, avgCritMultiplier(modded.critChance, modded.critMultiplier));
    const targetAdjustedDamageScore =
        ((adjustedDirectDps * coldCritMultiplierGain * punctureCritGain) + adjustedDotDps + blastUtilityDps) *
        (1 + gasUtility);

    switch (goal) {
        case "damage":   return targetAdjustedDamageScore * (1 + directDamagePerStatusWeight * 0.35 + utilityWeight * 0.25);
        case "crit":     return avgCritMultiplier(modded.critChance, modded.critMultiplier) * (1 + (headshotMultiplierBonus + weakPointCritChanceBonus + weakPointDamageBonus) * 0.35 + directDamagePerStatusWeight * 0.15 + utilityWeight * 0.08);
        case "status":   return ((modded.averageProcsPerShot + adjustedDotDps * 0.02 + blastUtilityDps * 0.01) * (1 + statusWeight + finalStatusChanceBonus + directDamagePerStatusWeight * 0.2)) * (1 + statusDamageBonus * 0.35 + statusDurationBonus * 0.15 + utilityWeight * 0.12);
        case "balanced": return (targetAdjustedDamageScore + burstDPS * 0.25) * (1 + modded.averageProcsPerShot * 0.35 + statusWeight * 0.25 + directDamagePerStatusWeight * 0.25 + utilityWeight * 0.2);
    }
}

function scoreSlots(
    weapon: WeaponEntry,
    slots: (ModEntry | null)[],
    ranks: (number | undefined)[],
    goal: OptimizeGoal,
    targetFaction: string,
    arcaneEffect?: Partial<ModEffect> | null,
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

const BEAM_WIDTH = 256;

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
                const newUsed = new Set(state.usedGroups);
                newUsed.add(mod.incompatibilityGroup);
                nextStates.push({ mods: newMods, ranks: newRanks, usedGroups: newUsed, score: s });
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
    mainBuildEffects: (ModEffect | null)[],
    goal: OptimizeGoal,
    targetFaction: string,
    opts: OptimizerOptions,
): { arcane: ArcaneEntry | null; rank: number } {
    const arcanes = getArcanesByWeaponCategory(weapon.category).filter(arc =>
        !opts.ownedArcaneUniqueNames || opts.ownedArcaneUniqueNames.has(arc.uniqueName)
    );
    if (!arcanes.length) return { arcane: null, rank: 0 };

    const baseScore = scoreEffects(weapon, mainBuildEffects, goal, targetFaction);
    let bestArcane: ArcaneEntry | null = null;
    let bestRank = 0;
    let bestScore = baseScore;

    for (const arc of arcanes) {
        for (let rank = arc.maxRank; rank >= 0; rank--) {
            const e = arc.optimizerEffectByRank[rank] ?? arc.permanentEffectByRank[rank] ?? {};
            if (!Object.keys(e).length) continue;
            const s = scoreEffects(weapon, mainBuildEffects, goal, targetFaction, e);
            if (s >= bestScore) { bestScore = s; bestArcane = arc; bestRank = rank; }
        }
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
        const arc = optimizeArcaneSlot(scoringWeapon, allEffects, goal, targetFaction, effectiveOpts);
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
