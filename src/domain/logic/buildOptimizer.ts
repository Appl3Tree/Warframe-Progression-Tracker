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

import { usesMeleeDamageModel, type WeaponEntry, type WeaponAttack } from "../catalog/weaponCatalog";
import type { ModEntry, ModEffect } from "../catalog/modCatalog";
import { emptyEffect, getModsForWeapon } from "../catalog/modCatalog";
import type { ArcaneEntry } from "../catalog/arcaneCatalog";
import { getArcanesForWeapon } from "../catalog/arcaneCatalog";
import { calculateBuild, avgCritMultiplier, estimateConditionalStackFactor, estimateConditionalUptime } from "./damageCalc";
import { computeCapacity, effectiveDrain, type CapacityConfig, type SlotConfig } from "./capacityCalc";

export type OptimizeGoal = "burst" | "scaling" | "crit" | "status";
export type LegacyOptimizeGoal = OptimizeGoal | "damage";

export function normalizeOptimizeGoal(goal: LegacyOptimizeGoal | null | undefined): OptimizeGoal {
    switch (goal) {
        case "damage":
        case "burst":
            return "burst";
        case "scaling":
        case "crit":
        case "status":
            return goal;
        default:
            return "burst";
    }
}

export interface OptimizerOptions {
    ownedModNames?: Set<string>;
    ownedModMaxRankByName?: Record<string, number>;
    ownedArcaneUniqueNames?: Set<string>;
    ownedArcaneMaxRankByUniqueName?: Record<string, number>;
    excludedModNames?: Set<string>;
    allowNonMaxRank?: boolean;
    targetFaction?: string;
    /** If set, enforce capacity constraint using this config. */
    capacityConfig?: CapacityConfig;
    /** Slot polarities for the 8 main slots (used for both capacity and assignment). */
    slotPolarities?: string[];
    /** Weapon default slot polarities, used to minimize unnecessary forma. */
    defaultSlotPolarities?: string[];
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
    /** Maximum total forma-equivalent polarity changes the optimizer may use. */
    maxFormaCount?: number;
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
    /** Mods that are always present for capacity accounting, e.g. melee stance. */
    extraCapacitySlots?: Array<{
        mod: ModEntry;
        rank: number;
        polarity: string;
    }>;
    /** Effects already present and locked into the build. */
    preEquippedEffects?: (ModEffect | null)[];
    /** Filled main slots that should remain untouched during optimization. */
    lockedSlots?: (ModEntry | null)[];
    lockedSlotRanks?: (number | undefined)[];
    /** Filled main slot positions whose polarities must remain unchanged. */
    lockedSlotMask?: boolean[];
    /** Incompatibility groups already present and locked into the build. */
    lockedIncompatibilityGroups?: Set<string>;
    /** Unique mod names already present and locked into the build. */
    lockedUniqueNames?: Set<string>;
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
    exilusPolarity: string;
    /** Arcane selected (if optimizeArcane was true). */
    arcane: ArcaneEntry | null;
    arcaneRank: number;
}

function resultUsesAnyNonMaxed(result: OptimizeResult): boolean {
    if (result.exilusMod && result.exilusRank < result.exilusMod.fusionLimit) return true;
    return result.slots.some((mod, index) => !!mod && (result.slotRanks[index] ?? mod.fusionLimit) < mod.fusionLimit);
}

function scoreOptimizeResult(
    weapon: WeaponEntry,
    result: OptimizeResult,
    goal: OptimizeGoal,
    targetFaction: string,
    buildForAttack?: WeaponAttack | null,
): number {
    const scoringWeapon = makeWeaponForAttack(weapon, buildForAttack);
    const effects: (ModEffect | null)[] = result.slots.map((mod, index) => {
        if (!mod) return null;
        const rank = result.slotRanks[index] ?? mod.fusionLimit;
        return mod.effectsByRank[rank] ?? mod.effect;
    });
    if (result.exilusMod) {
        effects.push(result.exilusMod.effectsByRank[result.exilusRank] ?? result.exilusMod.effect);
    }
    const arcaneEffect =
        result.arcane
            ? (result.arcane.optimizerEffectByRank[result.arcaneRank] ?? result.arcane.permanentEffectByRank[result.arcaneRank] ?? null)
            : null;
    return scoreEffects(scoringWeapon, effects, goal, targetFaction, arcaneEffect);
}

const PROC_DAMAGE_KEYS = [
    "impact", "puncture", "slash",
    "heat", "cold", "electricity", "toxin",
    "blast", "radiation", "gas", "magnetic", "viral", "corrosive",
    "void", "tau", "true",
] as const;

export const CANONICAL_FACTIONS = [
    "Grineer",
    "Kuva Grineer",
    "Corpus",
    "Corpus Amalgam",
    "Infested",
    "Infested Deimos",
    "Orokin",
    "Sentient",
    "Narmer",
    "The Murmur",
    "Zariman",
    "Scaldra (1999)",
    "Techrot (1999)",
    "Anarchs",
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

const FACTION_DAMAGE_MODIFIERS: Partial<Record<string, Partial<Record<typeof PROC_DAMAGE_KEYS[number], number>>>> = {
    grineer: {
        corrosive: 0.5,
        impact: 0.5,
    },
    "kuva grineer": {
        impact: 0.5,
        corrosive: 0.5,
        heat: -0.5,
    },
    corpus: {
        magnetic: 0.5,
        puncture: 0.5,
    },
    "corpus amalgam": {
        magnetic: 0.5,
        electricity: 0.5,
        blast: -0.5,
    },
    infested: {
        heat: 0.5,
        slash: 0.5,
    },
    "infested deimos": {
        blast: 0.5,
        gas: 0.5,
        viral: -0.5,
    },
    "deimos infested": {
        blast: 0.5,
        gas: 0.5,
        viral: -0.5,
    },
    orokin: {
        puncture: 0.5,
        viral: 0.5,
        radiation: -0.5,
    },
    "the murmur": {
        radiation: 0.5,
        electricity: 0.5,
        viral: -0.5,
    },
    zariman: {
        void: 0.5,
    },
    sentient: {
        radiation: 0.5,
        cold: 0.5,
        corrosive: -0.5,
    },
    narmer: {
        slash: 0.5,
        toxin: 0.5,
        magnetic: -0.5,
    },
    techrot: {
        magnetic: 0.5,
        gas: 0.5,
        cold: -0.5,
    },
    "techrot (1999)": {
        magnetic: 0.5,
        gas: 0.5,
        cold: -0.5,
    },
    scaldra: {
        corrosive: 0.5,
        impact: 0.5,
        gas: -0.5,
    },
    "scaldra (1999)": {
        corrosive: 0.5,
        impact: 0.5,
        gas: -0.5,
    },
    anarchs: {
        impact: 0.5,
        electricity: 0.5,
        radiation: -0.5,
    },
};

function factionSignature(faction: string): string {
    const damageMods = FACTION_DAMAGE_MODIFIERS[faction.toLowerCase()] ?? {};
    return PROC_DAMAGE_KEYS
        .map((key) => `${key}:${damageMods[key] ?? 0}`)
        .join("|");
}

export interface FactionFocusOption {
    label: string;
    value: string;
}

export function getFactionFocusOptions(): FactionFocusOption[] {
    const grouped = new Map<string, string[]>();
    for (const faction of CANONICAL_FACTIONS) {
        const signature = factionSignature(faction);
        if (!grouped.has(signature)) grouped.set(signature, []);
        grouped.get(signature)!.push(faction);
    }
    return [...grouped.values()].map((group) => ({
        label: group.join(" / "),
        value: group[0],
    }));
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
        case "corpus amalgam":
            return {
                armor: 450,
                healthShare: 0.7,
                shieldShare: 0.3,
                grouped: false,
                effectiveHealth: 20000,
                healthMaterial: "robotic",
                armorMaterial: "alloyArmor",
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
        case "infested deimos":
        case "deimos infested":
            return {
                armor: 400,
                healthShare: 1,
                shieldShare: 0,
                grouped: true,
                effectiveHealth: 18000,
                healthMaterial: "infestedFlesh",
                armorMaterial: "ferriteArmor",
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
        case "zariman":
            return {
                armor: 800,
                healthShare: 0.8,
                shieldShare: 0.2,
                grouped: false,
                effectiveHealth: 23000,
                healthMaterial: "flesh",
                armorMaterial: "alloyArmor",
                shieldMaterial: "protoShield",
            };
        case "kuva grineer":
            return {
                armor: 3200,
                healthShare: 1,
                shieldShare: 0,
                grouped: false,
                effectiveHealth: 28000,
                healthMaterial: "clonedFlesh",
                armorMaterial: "ferriteArmor",
                shieldMaterial: "",
            };
        case "sentient":
            return {
                armor: 900,
                healthShare: 0.85,
                shieldShare: 0.15,
                grouped: false,
                effectiveHealth: 24000,
                healthMaterial: "robotic",
                armorMaterial: "alloyArmor",
                shieldMaterial: "protoShield",
            };
        case "narmer":
            return {
                armor: 700,
                healthShare: 0.7,
                shieldShare: 0.3,
                grouped: false,
                effectiveHealth: 22000,
                healthMaterial: "flesh",
                armorMaterial: "alloyArmor",
                shieldMaterial: "protoShield",
            };
        case "techrot":
        case "techrot (1999)":
            return {
                armor: 0,
                healthShare: 0.85,
                shieldShare: 0.15,
                grouped: true,
                effectiveHealth: 18500,
                healthMaterial: "infestedFlesh",
                armorMaterial: "",
                shieldMaterial: "shield",
            };
        case "scaldra":
        case "scaldra (1999)":
            return {
                armor: 2200,
                healthShare: 1,
                shieldShare: 0,
                grouped: false,
                effectiveHealth: 24000,
                healthMaterial: "clonedFlesh",
                armorMaterial: "ferriteArmor",
                shieldMaterial: "",
            };
        case "anarchs":
            return {
                armor: 500,
                healthShare: 0.85,
                shieldShare: 0.15,
                grouped: false,
                effectiveHealth: 21000,
                healthMaterial: "flesh",
                armorMaterial: "alloyArmor",
                shieldMaterial: "shield",
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

function directDamageTypeMultiplier(
    damageType: typeof PROC_DAMAGE_KEYS[number],
    targetFaction: string,
    target: TargetProfile,
    effectiveArmorMultiplier: number,
    viralHealthDamageBonus: number,
    magneticShieldDamageBonus: number,
): number {
    const factionModifier = 1 + (FACTION_DAMAGE_MODIFIERS[targetFaction.toLowerCase()]?.[damageType] ?? 0);
    if (damageType === "toxin") {
        // Toxin direct damage bypasses shields entirely — it goes straight to health.
        // Because effectiveHealth includes shield HP in the denominator of TtK, we must
        // use 1/healthShare (not healthShare) so the formula yields the correct kill time.
        // For unshielded targets healthShare=1, so this is a no-op there.
        return factionModifier *
            effectiveArmorMultiplier *
            (1 + viralHealthDamageBonus) /
            Math.max(0.01, target.healthShare);
    }
    const healthModifier =
        target.healthShare *
        effectiveArmorMultiplier *
        (1 + viralHealthDamageBonus);
    const shieldModifier =
        target.shieldShare *
        (1 + magneticShieldDamageBonus);
    return factionModifier * (healthModifier + shieldModifier);
}

function armorDamageMultiplier(armor: number): number {
    if (armor <= 0) return 1;
    // Wiki formula: Damage Multiplier = 300 / (Net Armor + 300)
    // This means 300 armor → 50% reduction, 1200 → 80%, 2700 → 90%, etc.
    return 300 / (armor + 300);
}

/**
 * Estimates what fraction of a DoT proc's total damage is realized within the kill window.
 *
 * tickDelay: seconds before the first tick fires.
 *   - Slash / Heat / Toxin: 1s (first tick at t=1s)
 *   - Electricity / Gas:    0s (first tick is immediate, at t=0)
 *
 * With a delay, a kill that lands before the first tick yields zero DoT, so the
 * effective realized window is (timeToKill - tickDelay). Without a delay the full
 * timeToKill window counts.
 */
function dotRealizationFactor(timeToKill: number, duration: number, tickDelay = 0): number {
    if (duration <= 0 || !Number.isFinite(timeToKill) || timeToKill <= 0) return 1;
    const effectiveTime = Math.max(0, timeToKill - tickDelay);
    if (effectiveTime <= 0) return 0;
    if (effectiveTime < duration) return Math.max(0.05, effectiveTime / (2 * duration));
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
    const initialEffects = normalizedArcaneEffect ? [...effects, normalizedArcaneEffect] : effects;
    const ungatedEffects = initialEffects.map((effect) => {
        if (!effect?.conditionalEffects?.length) return effect;
        return {
            ...effect,
            conditionalEffects: effect.conditionalEffects.filter((conditional) => !conditional.requiredStatusType),
        };
    });
    const preview = calculateBuild(weapon, ungatedEffects, targetFaction);
    const allEffects = initialEffects.map((effect) => {
        if (!effect?.conditionalEffects?.length) return effect;
        return {
            ...effect,
            conditionalEffects: effect.conditionalEffects.filter((conditional) =>
                !conditional.requiredStatusType ||
                (preview.modded.expectedStacksByType[conditional.requiredStatusType] ?? 0) >= 0.25,
            ),
        };
    });
    const { modded, burstDPS, sustainedDPS } = calculateBuild(weapon, allEffects, targetFaction);
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

    const baselineFireRate = weapon.fireRate * (1 + (usesMeleeDamageModel(weapon.category) ? 0 : 0));
    const baselineMagazineSize = Math.max(1, Math.round(weapon.magazineSize));
    for (const conditional of conditionalEffects) {
        if (conditional.requiredStatusType && (modded.expectedStacksByType[conditional.requiredStatusType] ?? 0) < 0.25) {
            continue;
        }
        const factor =
            estimateConditionalUptime(conditional, baselineFireRate, baselineMagazineSize) *
            estimateConditionalStackFactor(conditional, baselineFireRate, baselineMagazineSize);
        ammoEfficiencyBonus += (conditional.stats.ammoEfficiencyBonus ?? 0) * factor;
        directDamagePerStatusBonus += (conditional.stats.directDamagePerStatusBonus ?? 0) * factor;
    }

    const target = getTargetProfile(targetFaction);
    // Magnetic's shield damage amplification is already captured in adjustedDirectDps via
    // (1 + magneticShieldDamageBonus) in directDamageTypeMultiplier. The extra utility here
    // represents only the binary shield-regen suppression effect — it doesn't scale with stacks.
    const magneticUtilityWeight = target.shieldShare > 0 && modded.magneticShieldDamageBonus > 0
        ? target.shieldShare * 0.06
        : 0;
    const radiationUtilityWeight = target.grouped
        ? modded.radiationAllyDamageBonus * 0.04
        : 0;
    // NOTE: heatArmorStrip, corrosiveArmorStrip, and the full magneticShieldDamageBonus are
    // intentionally excluded from statusWeight. Their value is already fully captured via
    // effectiveArmorMultiplier / (1 + magneticShieldDamageBonus) in adjustedDirectDps / adjustedDotDps.
    // Including them here would double-count in scalingScore.
    const statusWeight =
        modded.dotDps / Math.max(1, sustainedDPS) +
        modded.viralHealthDamageBonus * 0.3 +
        magneticUtilityWeight +
        modded.coldSlow * 0.08 +
        modded.coldCritDamageBonus * 0.12 +
        modded.punctureEnemyDamageReduction * 0.08 +
        modded.punctureCritChanceBonus * 0.15 +
        modded.impactMercyThresholdBonus * 0.05 +
        radiationUtilityWeight +
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
    const utilityWeight = sharedUtility + (usesMeleeDamageModel(weapon.category) ? meleeUtility : rangedUtility);
    const combinedArmorStrip = 1 - ((1 - modded.heatArmorStrip) * (1 - modded.corrosiveArmorStrip));
    const strippedArmor = target.armor * Math.max(0, 1 - combinedArmorStrip);
    const effectiveArmorMultiplier = armorDamageMultiplier(strippedArmor);
    const effectiveStatusTypes = Math.max(
        1,
        Object.entries(modded.expectedStacksByType).reduce((count, [key, value]) => {
            if ((value ?? 0) < 0.25) return count;
            if (key === "magnetic" && target.shieldShare <= 0) return count;
            return count + 1;
        }, 0),
    );
    const directDamagePerStatusWeight = directDamagePerStatusBonus * effectiveStatusTypes;
    // CO / Galvanized Aptitude are additive with damage mods (Serration/Pressure Point bracket),
    // not a separate multiplicative layer. Wiki formula:
    //   Damage = Base × [1 + damageMods + (coBonus × n)] × (1 + elementalMods) × …
    // To apply this correctly on top of burstDPS (which already includes damageMods), we divide
    // the new bracket by the old bracket: (1 + damageMods + coBonus×n) / (1 + damageMods).
    const damageBracket = 1 + modded.totalDamageBonus;
    const directDamagePerStatusMultiplier = (damageBracket + directDamagePerStatusWeight) / damageBracket;
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
                targetFaction,
                target,
                effectiveArmorMultiplier,
                modded.viralHealthDamageBonus,
                modded.magneticShieldDamageBonus,
            );
            return sum + share * typeMultiplier;
        }, 0)
        : 1;
    const adjustedBurstDirectDps = burstDPS *
        Math.max(0.1, targetAdjustedDirectMultiplier) *
        directDamagePerStatusMultiplier;
    const adjustedDirectDps = sustainedDPS *
        Math.max(0.1, targetAdjustedDirectMultiplier) *
        directDamagePerStatusMultiplier;
    const estimatedTimeToKill = target.effectiveHealth / Math.max(1, adjustedDirectDps);
    const dotDuration = 6 * (1 + statusDurationBonus);
    // Slash/Heat/Toxin first tick fires 1s after the proc — a fast kill can land before any tick.
    // Electricity/Gas tick immediately (t=0), so they are always at least partially realized.
    const realizedSlashFactor    = dotRealizationFactor(estimatedTimeToKill, dotDuration, 1);
    const realizedHeatFactor     = dotRealizationFactor(estimatedTimeToKill, dotDuration, 1);
    const realizedToxinFactor    = dotRealizationFactor(estimatedTimeToKill, dotDuration, 1);
    const realizedElectricFactor = dotRealizationFactor(estimatedTimeToKill, dotDuration, 0);
    const realizedGasFactor      = dotRealizationFactor(estimatedTimeToKill, dotDuration, 0);
    // Faction damage type affinity multipliers for each DoT type.
    // These mirror the post-Update-36.0 flat per-faction modifiers from FACTION_DAMAGE_MODIFIERS,
    // applied to the DoT layer since faction affinities affect DoT damage in addition to direct hits.
    const factionMod = (key: typeof PROC_DAMAGE_KEYS[number]) =>
        1 + (FACTION_DAMAGE_MODIFIERS[targetFaction.toLowerCase()]?.[key] ?? 0);

    // For shield-bypassing DoTs (Slash, Toxin, Gas) the effective target is only the health pool.
    // Because effectiveHealth includes shield HP, the correct factor is 1/healthShare (not healthShare),
    // so that TtK = effectiveHealth / (dotDps × factor) yields the true health-only kill time.
    // For unshielded targets healthShare=1, so this is a no-op there.
    const shieldBypassHealthFactor = 1 / Math.max(0.01, target.healthShare);
    const adjustedDotDps =
        // Slash: bypasses armor AND shields — goes directly to health.
        (modded.dotDpsByType.slash ?? 0) * factionMod("slash") * shieldBypassHealthFactor * (1 + modded.viralHealthDamageBonus) * realizedSlashFactor +
        // Heat: goes through armor, hits health (does NOT bypass shields).
        (modded.dotDpsByType.heat ?? 0) * factionMod("heat") * target.healthShare * effectiveArmorMultiplier * (1 + modded.viralHealthDamageBonus) * realizedHeatFactor +
        // Toxin: bypasses shields, goes to health through armor.
        (modded.dotDpsByType.toxin ?? 0) * factionMod("toxin") * shieldBypassHealthFactor * effectiveArmorMultiplier * (1 + modded.viralHealthDamageBonus) * realizedToxinFactor +
        // Electricity: AoE DoT to all enemies in 3m radius, hits both health (armor-reduced) and shields.
        // Viral amplifies the health-damage portion only.
        (modded.dotDpsByType.electricity ?? 0) * factionMod("electricity") * (
            (target.healthShare * effectiveArmorMultiplier * (1 + modded.viralHealthDamageBonus) + target.shieldShare) *
            (target.grouped ? 1.2 : 1)
        ) * realizedElectricFactor +
        // Gas: AoE cloud dealing Gas-type damage to all enemies in 3m radius (including target).
        // Gas is NOT Toxin-type — it does NOT bypass shields. Treated like Electricity: hits both
        // health (armor-reduced) and shields. Viral applies to the health portion only.
        (modded.dotDpsByType.gas ?? 0) * factionMod("gas") * (
            (target.healthShare * effectiveArmorMultiplier * (1 + modded.viralHealthDamageBonus) + target.shieldShare) *
            (target.grouped ? 1.25 : 1)
        ) * realizedGasFactor;
    // blastDetonationDamagePerShot is the single-target detonation value (0.3× base per stack).
    // The AoE component deals 3.0× base per stack to each surrounding enemy — 10× the single value.
    // Wiki: AoE hits all enemies within 5m of the target EXCEPT the initial target itself.
    // For grouped targets we assume ~2 nearby enemies are in the blast radius on average.
    // For non-grouped (single target) we discount the single-target detonation to 75% utilization.
    const BLAST_AOE_NEARBY_ENEMIES = 2;
    const blastGroupedMultiplier = (0.3 + 3.0 * BLAST_AOE_NEARBY_ENEMIES) / 0.3; // = 21
    const blastUtilityDps = modded.blastDetonationDamagePerShot * modded.fireRate *
        (target.grouped ? blastGroupedMultiplier : 0.75);
    // Gas radius utility only matters when there are nearby enemies to hit.
    const gasUtility = target.grouped ? modded.gasCloudRadius * 0.04 : 0;
    const coldCritMultiplierGain = modded.coldCritDamageBonus > 0
        ? avgCritMultiplier(modded.critChance + modded.punctureCritChanceBonus, modded.critMultiplier + modded.coldCritDamageBonus) /
          Math.max(1, avgCritMultiplier(modded.critChance, modded.critMultiplier))
        : 1;
    const punctureCritGain = avgCritMultiplier(modded.critChance + modded.punctureCritChanceBonus, modded.critMultiplier) /
        Math.max(1, avgCritMultiplier(modded.critChance, modded.critMultiplier));
    // Cold's crit multiplier bonus and Puncture's crit chance bonus apply to DoT crits too,
    // not just direct hits — apply the combined gain to both components.
    const burstDamageScore =
        (
            (adjustedBurstDirectDps + adjustedDotDps * 0.8) * coldCritMultiplierGain * punctureCritGain +
            blastUtilityDps * 0.45
        ) *
        (1 + gasUtility * 0.18);

    const burstScore =
        burstDamageScore *
        (1 + directDamagePerStatusWeight * 0.05 + utilityWeight * 0.08 + modded.averageProcsPerShot * 0.02);
    const scalingScore =
        (
            adjustedDirectDps * (1 + directDamagePerStatusWeight * 0.12) +
            adjustedDotDps * 1.35 +
            blastUtilityDps * 0.85
        ) *
        (1 + statusWeight * 0.9 + finalStatusChanceBonus * 0.45 + utilityWeight * 0.22) *
        (1 + modded.averageProcsPerShot * 0.2 + statusDamageBonus * 0.35 + statusDurationBonus * 0.18 + directDamagePerStatusWeight * 0.05);

    switch (goal) {
        case "burst":    return burstScore;
        case "scaling":  return scalingScore;
        case "crit":     return avgCritMultiplier(modded.critChance, modded.critMultiplier) * (1 + (headshotMultiplierBonus + weakPointCritChanceBonus + weakPointDamageBonus) * 0.35 + directDamagePerStatusWeight * 0.15 + utilityWeight * 0.08);
        case "status":   return ((modded.averageProcsPerShot + adjustedDotDps * 0.02 + blastUtilityDps * 0.01) * (1 + statusWeight + finalStatusChanceBonus + directDamagePerStatusWeight * 0.2)) * (1 + statusDamageBonus * 0.35 + statusDurationBonus * 0.15 + utilityWeight * 0.12);
    }
}

function scoreSlots(
    weapon: WeaponEntry,
    slots: (ModEntry | null)[],
    ranks: (number | undefined)[],
    goal: OptimizeGoal,
    targetFaction: string,
    arcaneEffect?: Partial<ModEffect> | null,
    baseEffects: (ModEffect | null)[] = [],
): number {
    const effects = slots.map((m, i) => {
        if (!m) return null;
        const r = ranks[i] ?? m.fusionLimit;
        return m.effectsByRank[r] ?? m.effect;
    });
    return scoreEffects(weapon, [...baseEffects, ...effects], goal, targetFaction, arcaneEffect);
}

export function debugScoreBuild(
    weapon: WeaponEntry,
    effects: (ModEffect | null)[],
    goal: OptimizeGoal,
    targetFaction: string,
    arcaneEffect?: Partial<ModEffect> | null,
): number {
    return scoreEffects(weapon, effects, goal, targetFaction, arcaneEffect);
}

// ── Capacity ──────────────────────────────────────────────────────────────────

function fitsCapacity(
    slots: (ModEntry | null)[],
    ranks: (number | undefined)[],
    cfg: CapacityConfig,
    pols: string[],
    extraCapacitySlots: OptimizerOptions["extraCapacitySlots"] = [],
): boolean {
    const slotCfgs: SlotConfig[] = pols.map(p => ({ polarity: p }));
    while (slotCfgs.length < slots.length) slotCfgs.push({ polarity: "" });
    const extraCfgs = extraCapacitySlots.map(slot => ({ polarity: slot.polarity }));
    const extraMods = extraCapacitySlots.map(slot => slot.mod);
    const extraRanks = extraCapacitySlots.map(slot => slot.rank);
    return !computeCapacity(
        cfg,
        [...extraCfgs, ...slotCfgs],
        [...extraMods, ...slots],
        [...extraRanks, ...ranks],
    ).overCapacity;
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
    const { ownedModNames, ownedModMaxRankByName, excludedModNames, allowNonMaxRank, targetFaction = "", lockedIncompatibilityGroups, lockedUniqueNames } = opts;
    const out: Candidate[] = [];
    for (const mod of allMods) {
        if (mod.isAura) continue; // auras go in the aura slot, not regular slots
        if (excludedModNames?.has(mod.name)) continue;
        if (ownedModNames && !ownedModNames.has(mod.name)) continue;
        if (lockedIncompatibilityGroups?.has(mod.incompatibilityGroup)) continue;
        if (lockedUniqueNames?.has(mod.uniqueName)) continue;
        if (mod.effect.targetFaction && !targetFaction) continue;
        if (mod.effect.targetFaction &&
            mod.effect.targetFaction.toLowerCase() !== targetFaction.toLowerCase()) continue;
        const maxAllowedRank = Math.max(
            0,
            Math.min(
                mod.fusionLimit,
                ownedModMaxRankByName?.[mod.name] ?? mod.fusionLimit,
            ),
        );
        if (allowNonMaxRank) {
            for (let r = maxAllowedRank; r >= 0; r--) out.push({ mod, rank: r });
        } else {
            out.push({ mod, rank: maxAllowedRank });
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
        let bestMatchScore = Infinity;
        for (let si = 0; si < slotCount; si++) {
            if (usedSlots.has(si)) continue;
            const matchScore = allowForma
                ? ((resultPols[si] ?? "") === (mod.polarity ?? "") ? 0 : 1)
                : 0;
            const drain = allowForma
                ? effectiveDrain(mod, bestPolarity(mod), rank)   // with forma: always matching
                : effectiveDrain(mod, resultPols[si], rank);
            if (
                matchScore < bestMatchScore ||
                (matchScore === bestMatchScore && drain < bestDrain)
            ) {
                bestMatchScore = matchScore;
                bestDrain = drain;
                bestSlot = si;
            }
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

export function minimizePolaritiesByCapacity(
    baseMainPolarities: string[],
    slotMods: (ModEntry | null)[],
    slotRanks: number[],
    capacityConfig?: CapacityConfig,
    extraCapacitySlots: Array<{ mod: ModEntry; rank: number; polarity: string }> = [],
    exilus?: { mod: ModEntry | null; rank: number; basePolarity: string },
    maxAdditionalPolarities?: number,
    lockedSlotMask: boolean[] = [],
): { mainPolarities: string[]; exilusPolarity: string } {
    const mainPolarities = Array(slotMods.length).fill("");
    let exilusPolarity = "";

    for (let i = 0; i < slotMods.length; i++) {
        if (lockedSlotMask[i]) mainPolarities[i] = baseMainPolarities[i] ?? "";
    }

    if (!capacityConfig) {
        for (let i = 0; i < slotMods.length; i++) {
            if (lockedSlotMask[i]) continue;
            mainPolarities[i] = slotMods[i]?.polarity ?? "";
        }
        exilusPolarity = exilus?.mod?.polarity ?? "";
        return { mainPolarities, exilusPolarity };
    }

    const poolCounts = new Map<string, number>();
    const addPool = (polarity: string) => {
        if (!polarity) return;
        poolCounts.set(polarity, (poolCounts.get(polarity) ?? 0) + 1);
    };
    for (const polarity of baseMainPolarities) addPool(polarity);
    addPool(exilus?.basePolarity ?? "");

    type Candidate = { kind: "main" | "exilus"; index: number; polarity: string; savings: number };
    const byPolarity = new Map<string, Candidate[]>();
    const addCandidate = (candidate: Candidate) => {
        if (!candidate.polarity) return;
        if (!byPolarity.has(candidate.polarity)) byPolarity.set(candidate.polarity, []);
        byPolarity.get(candidate.polarity)!.push(candidate);
    };

    for (let i = 0; i < slotMods.length; i++) {
        if (lockedSlotMask[i]) continue;
        const mod = slotMods[i];
        if (!mod) continue;
        const rank = slotRanks[i] ?? mod.fusionLimit;
        addCandidate({
            kind: "main",
            index: i,
            polarity: mod.polarity ?? "",
            savings: effectiveDrain(mod, "", rank) - effectiveDrain(mod, mod.polarity ?? "", rank),
        });
    }
    if (exilus?.mod) {
        addCandidate({
            kind: "exilus",
            index: -1,
            polarity: exilus.mod.polarity ?? "",
            savings: effectiveDrain(exilus.mod, "", exilus.rank) - effectiveDrain(exilus.mod, exilus.mod.polarity ?? "", exilus.rank),
        });
    }

    const assigned = new Set<string>();
    for (const [polarity, candidates] of byPolarity.entries()) {
        candidates.sort((a, b) => b.savings - a.savings);
        let freeMatches = poolCounts.get(polarity) ?? 0;
        for (const candidate of candidates) {
            if (freeMatches <= 0) break;
            if (candidate.kind === "main") mainPolarities[candidate.index] = polarity;
            else exilusPolarity = polarity;
            assigned.add(`${candidate.kind}:${candidate.index}`);
            freeMatches--;
        }
    }

    const fitsCurrent = () => fitsCapacity(
        slotMods,
        slotRanks,
        capacityConfig,
        mainPolarities,
        [
            ...extraCapacitySlots,
            ...(exilus?.mod ? [{ mod: exilus.mod, rank: exilus.rank, polarity: exilusPolarity }] : []),
        ],
    );

    if (!fitsCurrent()) {
        const remaining: Candidate[] = [];
        for (const candidates of byPolarity.values()) {
            for (const candidate of candidates) {
                if (!assigned.has(`${candidate.kind}:${candidate.index}`)) remaining.push(candidate);
            }
        }
        remaining.sort((a, b) => b.savings - a.savings);
        let addedPolarities = 0;
        for (const candidate of remaining) {
            if (maxAdditionalPolarities != null && addedPolarities >= maxAdditionalPolarities) break;
            if (candidate.kind === "main") mainPolarities[candidate.index] = candidate.polarity;
            else exilusPolarity = candidate.polarity;
            addedPolarities++;
            if (fitsCurrent()) break;
        }
    }

    return { mainPolarities, exilusPolarity };
}

function getCapacityAwarePolarities(
    slotMods: (ModEntry | null)[],
    slotRanks: number[],
    slotCount: number,
    opts: OptimizerOptions,
    exilus?: { mod: ModEntry | null; rank: number; basePolarity: string },
): { mainPolarities: string[]; exilusPolarity: string } {
    const paddedDefaults = [...(opts.defaultSlotPolarities ?? opts.slotPolarities ?? [])];
    while (paddedDefaults.length < slotCount) paddedDefaults.push("");
    if (!opts.allowForma) {
        const mainPolarities = [...(opts.slotPolarities ?? [])];
        while (mainPolarities.length < slotCount) mainPolarities.push("");
        return { mainPolarities, exilusPolarity: exilus?.basePolarity ?? (opts.exilusPolarity ?? "") };
    }
    return minimizePolaritiesByCapacity(
        paddedDefaults,
        slotMods,
        slotRanks,
        opts.capacityConfig,
        opts.extraCapacitySlots ?? [],
        exilus,
        opts.maxFormaCount,
        opts.lockedSlotMask ?? [],
    );
}

// ── Beam search ───────────────────────────────────────────────────────────────
// Scores each candidate set using the REAL slot polarities (or optimal forma
// polarities if allowForma is set) — this avoids over-conservative capacity
// rejection that was killing builds with polarity-matched mods.

const BEAM_WIDTH = 512;
const BEAM_WIDTH_PER_FILLED_COUNT = 128;

interface BeamState {
    mods: (ModEntry | null)[];
    ranks: (number | undefined)[];
    usedGroups: Set<string>;
    score: number;
    filledCount: number;
}

function beamStateSignature(state: BeamState): string {
    return state.mods
        .map((mod, index) => {
            if (!mod) return null;
            const rank = state.ranks[index] ?? mod.fusionLimit;
            return `${mod.uniqueName}@${rank}`;
        })
        .filter((part): part is string => !!part)
        .sort()
        .join("|");
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
        extraCapacitySlots = [],
        preEquippedEffects = [],
        lockedSlots = [],
        lockedSlotRanks = [],
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
        const ranks = mods.map((mod) => mod?.fusionLimit ?? 0);
        return getCapacityAwarePolarities(mods, ranks, slotCount, opts).mainPolarities;
    };

    const arcaneEffect = null;

    let beam: BeamState[] = [{
        mods:      [...Array(slotCount).fill(null)].map((_, i) => lockedSlots[i] ?? null),
        ranks:     [...Array(slotCount).fill(undefined)].map((_, i) => lockedSlotRanks[i]),
        usedGroups: new Set(lockedSlots.filter((mod): mod is ModEntry => !!mod).map((mod) => mod.incompatibilityGroup)),
        score:     scoreSlots(
            weapon,
            [...Array(slotCount).fill(null)].map((_, i) => lockedSlots[i] ?? null),
            [...Array(slotCount).fill(undefined)].map((_, i) => lockedSlotRanks[i]),
            goal,
            targetFaction,
            undefined,
            preEquippedEffects,
        ),
        filledCount: lockedSlots.filter(Boolean).length,
    }];

    for (let slotIdx = 0; slotIdx < slotCount; slotIdx++) {
        if (lockedSlots[slotIdx]) continue;
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
                    if (!fitsCapacity(newMods, newRanks, capacityConfig, checkPols, extraCapacitySlots)) continue;
                }

                const s = scoreSlots(weapon, newMods, newRanks, goal, targetFaction, arcaneEffect, preEquippedEffects);
                const newUsed = new Set(state.usedGroups);
                newUsed.add(mod.incompatibilityGroup);
                nextStates.push({
                    mods: newMods,
                    ranks: newRanks,
                    usedGroups: newUsed,
                    score: s,
                    filledCount: state.filledCount + 1,
                });
            }
        }

        const deduped = new Map<string, BeamState>();
        for (const candidate of nextStates) {
            const signature = beamStateSignature(candidate);
            const existing = deduped.get(signature);
            if (!existing || candidate.score > existing.score) {
                deduped.set(signature, candidate);
            }
        }

        const byFilledCount = new Map<number, BeamState[]>();
        for (const candidate of deduped.values()) {
            if (!byFilledCount.has(candidate.filledCount)) byFilledCount.set(candidate.filledCount, []);
            byFilledCount.get(candidate.filledCount)!.push(candidate);
        }

        const diversified: BeamState[] = [];
        for (const states of byFilledCount.values()) {
            states.sort((a, b) => b.score - a.score);
            diversified.push(...states.slice(0, BEAM_WIDTH_PER_FILLED_COUNT));
        }

        diversified.sort((a, b) => b.score - a.score);
        beam = diversified.slice(0, BEAM_WIDTH);
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

function refineBuildSet(
    weapon: WeaponEntry,
    selectedMods: ModEntry[],
    selectedRanks: number[],
    candidates: Candidate[],
    goal: OptimizeGoal,
    opts: OptimizerOptions,
    extraEffects: (ModEffect | null)[] = [],
    arcaneEffect?: Partial<ModEffect> | null,
): { mods: ModEntry[]; ranks: number[] } {
    const {
        slotPolarities = [],
        targetFaction = "",
        allowForma = false,
        capacityConfig,
        preEquippedEffects = [],
    } = opts;

    let mods = [...selectedMods];
    let ranks = [...selectedRanks];
    const padded = [...slotPolarities];
    while (padded.length < mods.length) padded.push("");

    const scoreCurrent = (modsToScore: ModEntry[], ranksToScore: number[]) => {
        const effects = modsToScore.map((mod, index) => mod.effectsByRank[ranksToScore[index]] ?? mod.effect);
        return scoreEffects(weapon, [...preEquippedEffects, ...effects, ...extraEffects], goal, targetFaction, arcaneEffect);
    };

    let improved = true;
    while (improved) {
        improved = false;
        let bestScore = scoreCurrent(mods, ranks);
        let bestMods = mods;
        let bestRanks = ranks;

        const presentGroups = new Set(mods.map(mod => mod.incompatibilityGroup));
        const presentNames = new Set(mods.map(mod => mod.uniqueName));

        for (let replaceIdx = 0; replaceIdx < mods.length; replaceIdx++) {
            const replaced = mods[replaceIdx];
            const baseGroups = new Set(presentGroups);
            baseGroups.delete(replaced.incompatibilityGroup);
            const baseNames = new Set(presentNames);
            baseNames.delete(replaced.uniqueName);

            for (const candidate of candidates) {
                if (baseGroups.has(candidate.mod.incompatibilityGroup)) continue;
                if (baseNames.has(candidate.mod.uniqueName)) continue;

                const trialMods = [...mods];
                const trialRanks = [...ranks];
                trialMods[replaceIdx] = candidate.mod;
                trialRanks[replaceIdx] = candidate.rank;

                const { slotMods, slotRanks, resultPolarities } = assignModsToSlots(
                    trialMods,
                    trialRanks,
                    padded,
                    trialMods.length,
                    allowForma,
                );

                const capPolarities = allowForma
                    ? getCapacityAwarePolarities(slotMods, slotRanks, trialMods.length, opts).mainPolarities
                    : resultPolarities;
                if (capacityConfig && !fitsCapacity(slotMods, slotRanks, capacityConfig, capPolarities, opts.extraCapacitySlots)) continue;

                const compactMods = slotMods.filter((mod): mod is ModEntry => !!mod);
                const compactRanks = slotMods.flatMap((mod, index) => (mod ? [slotRanks[index]] : []));
                const trialScore = scoreCurrent(compactMods, compactRanks);
                if (trialScore > bestScore) {
                    bestScore = trialScore;
                    bestMods = compactMods;
                    bestRanks = compactRanks;
                    improved = true;
                }
            }
        }

        mods = bestMods;
        ranks = bestRanks;
    }

    return { mods, ranks };
}

function fillEmptySlots(
    weapon: WeaponEntry,
    selectedMods: ModEntry[],
    selectedRanks: number[],
    candidates: Candidate[],
    goal: OptimizeGoal,
    slotCount: number,
    opts: OptimizerOptions,
    extraEffects: (ModEffect | null)[] = [],
    arcaneEffect?: Partial<ModEffect> | null,
): { mods: ModEntry[]; ranks: number[] } {
    const {
        slotPolarities = [],
        targetFaction = "",
        allowForma = false,
        capacityConfig,
        preEquippedEffects = [],
    } = opts;

    let mods = [...selectedMods];
    let ranks = [...selectedRanks];
    const padded = [...slotPolarities];
    while (padded.length < slotCount) padded.push("");

    const scoreCurrent = (modsToScore: ModEntry[], ranksToScore: number[]) => {
        const effects = modsToScore.map((mod, index) => mod.effectsByRank[ranksToScore[index]] ?? mod.effect);
        return scoreEffects(weapon, [...preEquippedEffects, ...effects, ...extraEffects], goal, targetFaction, arcaneEffect);
    };

    let improved = true;
    while (improved && mods.length < slotCount) {
        improved = false;
        const presentGroups = new Set(mods.map(mod => mod.incompatibilityGroup));
        const presentNames = new Set(mods.map(mod => mod.uniqueName));
        const baseScore = scoreCurrent(mods, ranks);
        let bestScore = baseScore;
        let bestMods = mods;
        let bestRanks = ranks;

        for (const candidate of candidates) {
            if (presentGroups.has(candidate.mod.incompatibilityGroup)) continue;
            if (presentNames.has(candidate.mod.uniqueName)) continue;

            const trialMods = [...mods, candidate.mod];
            const trialRanks = [...ranks, candidate.rank];
            const { slotMods, slotRanks, resultPolarities } = assignModsToSlots(
                trialMods,
                trialRanks,
                padded,
                slotCount,
                allowForma,
            );

            const capPolarities = allowForma
                ? getCapacityAwarePolarities(slotMods, slotRanks, slotCount, opts).mainPolarities
                : resultPolarities;
            if (capacityConfig && !fitsCapacity(slotMods, slotRanks, capacityConfig, capPolarities, opts.extraCapacitySlots)) continue;

            const compactMods = slotMods.filter((mod): mod is ModEntry => !!mod);
            const compactRanks = slotMods.flatMap((mod, index) => (mod ? [slotRanks[index]] : []));
            const trialScore = scoreCurrent(compactMods, compactRanks);
            if (trialScore > bestScore) {
                bestScore = trialScore;
                bestMods = compactMods;
                bestRanks = compactRanks;
                improved = true;
            }
        }

        mods = bestMods;
        ranks = bestRanks;
    }

    return { mods, ranks };
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
): { mod: ModEntry | null; rank: number; polarity: string } {
    const eligibleExilus = allMods.filter(m =>
        m.isExilus &&
        !m.isAura &&
        !(opts.excludedModNames?.has(m.name)) &&
        (!opts.ownedModNames || opts.ownedModNames.has(m.name))
    );
    if (!eligibleExilus.length) return { mod: null, rank: 0, polarity: exilusPolarity };

    const baseScore = scoreEffects(weapon, mainBuildEffects, goal, targetFaction);
    let bestImprovingMod: ModEntry | null = null;
    let bestImprovingRank = 0;
    let bestImprovingPolarity = exilusPolarity;
    let bestImprovingScore = baseScore;
    let bestFallbackMod: ModEntry | null = null;
    let bestFallbackRank = 0;
    let bestFallbackPolarity = exilusPolarity;
    let bestFallbackHeuristic = -Infinity;
    let bestFallbackScore = -Infinity;

    for (const mod of eligibleExilus) {
        const minRank = opts.allowNonMaxRank ? 0 : mod.fusionLimit;
        for (let r = mod.fusionLimit; r >= minRank; r--) {
            const candidatePolarity = opts.allowForma ? bestPolarity(mod) : exilusPolarity;
            if (opts.capacityConfig) {
                const capSlots = [...mainSlots, mod];
                const capRanks = [...mainSlotRanks, r];
                const cappedPolarities = opts.allowForma
                    ? getCapacityAwarePolarities(
                        mainSlots,
                        mainSlotRanks,
                        mainSlots.length,
                        opts,
                        { mod, rank: r, basePolarity: exilusPolarity },
                    )
                    : { mainPolarities: [...mainSlotPolarities], exilusPolarity: candidatePolarity };
                const capPols = cappedPolarities.mainPolarities;
                const capExtraSlots = [
                    ...(opts.extraCapacitySlots ?? []),
                    { mod, rank: r, polarity: cappedPolarities.exilusPolarity },
                ];
                if (!fitsCapacity(capSlots, capRanks, opts.capacityConfig, capPols, capExtraSlots)) continue;
            }
            const e = mod.effectsByRank[r] ?? mod.effect;
            const s = scoreEffects(weapon, [...mainBuildEffects, e], goal, targetFaction);
            if (s > bestImprovingScore + 1e-9) {
                bestImprovingScore = s;
                bestImprovingMod = mod;
                bestImprovingRank = r;
                bestImprovingPolarity = candidatePolarity;
            }

            const fallbackHeuristic = scoreExilusUtilityFallback(weapon, mod, e, goal);
            if (
                fallbackHeuristic > bestFallbackHeuristic + 1e-9 ||
                (Math.abs(fallbackHeuristic - bestFallbackHeuristic) <= 1e-9 && s > bestFallbackScore + 1e-9)
            ) {
                bestFallbackHeuristic = fallbackHeuristic;
                bestFallbackScore = s;
                bestFallbackMod = mod;
                bestFallbackRank = r;
                bestFallbackPolarity = candidatePolarity;
            }
        }
    }

    if (bestImprovingMod) {
        return { mod: bestImprovingMod, rank: bestImprovingRank, polarity: bestImprovingPolarity };
    }
    return { mod: bestFallbackMod, rank: bestFallbackRank, polarity: bestFallbackPolarity };
}

function scoreExilusUtilityFallback(
    weapon: WeaponEntry,
    mod: ModEntry,
    effect: Partial<ModEffect> | null | undefined,
    goal: OptimizeGoal,
): number {
    const e = effect ?? {};
    const text = (mod.statsLabel ?? mod.statsTextByRank[mod.fusionLimit] ?? "").toLowerCase();

    let score = 0;

    score += Math.max(0, e.reloadSpeedBonus ?? 0) * (usesMeleeDamageModel(weapon.category) ? 0.02 : 0.22);
    score += Math.max(0, e.projectileSpeedBonus ?? 0) * 0.12;
    score += Math.max(0, e.accuracyBonus ?? 0) * 0.08;
    score += Math.max(0, e.blastRadiusBonus ?? 0) * 0.25;
    score += Math.max(0, e.beamRangeBonus ?? 0) * 0.28;
    score += Math.max(0, e.rangeBonus ?? 0) * 0.18;
    score += Math.max(0, e.statusDurationBonus ?? 0) * 0.12;
    score += Math.max(0, e.statusDamageBonus ?? 0) * 0.18;
    score += Math.max(0, e.finalStatusChanceBonus ?? 0) * 0.2;
    score += Math.max(0, e.ammoEfficiencyBonus ?? 0) * 0.12;
    score += Math.max(0, e.headshotMultiplierBonus ?? 0) * 0.05;
    score += Math.max(0, e.weakPointDamageBonus ?? 0) * 0.08;
    score += Math.max(0, e.weakPointCritChanceBonus ?? 0) * 0.08;

    if (!usesMeleeDamageModel(weapon.category) && /holstered/.test(text) && /reload/.test(text)) score += 0.16;
    if (/reload/.test(text) && !/holstered/.test(text)) score += 0.06;
    if (/accuracy/.test(text) && !(e.accuracyBonus ?? 0)) score += 0.05;
    if (/recoil/.test(text)) score += 0.05;
    if (/ammo/.test(text)) score += 0.04;
    if (/stagger/.test(text) && !usesMeleeDamageModel(weapon.category)) score += 0.06;
    if (/projectile speed/.test(text) && !(e.projectileSpeedBonus ?? 0)) score += 0.04;
    if (/beam range/.test(text) && !(e.beamRangeBonus ?? 0)) score += 0.05;
    if (/punch through/.test(text) && !(e.punchThrough ?? 0)) score += 0.05;
    if (/tennokai/.test(text)) score += goal === "scaling" || goal === "status" ? 0.22 : 0.12;
    if (/status chance/.test(text) && /tennokai/.test(text)) score += 0.08;
    if (/silence|silent|noise/.test(text)) score += 0.01;
    if (/zoom/.test(text)) score += 0.005;
    if (/double jump|airborne|movement speed/.test(text)) score += 0.002;

    return score;
}

// ── Arcane optimization ───────────────────────────────────────────────────────

function optimizeArcaneSlot(
    weapon: WeaponEntry,
    mainBuildEffects: (ModEffect | null)[],
    goal: OptimizeGoal,
    targetFaction: string,
    opts: OptimizerOptions,
): { arcane: ArcaneEntry | null; rank: number } {
    const arcanes = getArcanesForWeapon(weapon).filter(arc =>
        !opts.ownedArcaneUniqueNames || opts.ownedArcaneUniqueNames.has(arc.uniqueName)
    );
    if (!arcanes.length) return { arcane: null, rank: 0 };

    const baseScore = scoreEffects(weapon, mainBuildEffects, goal, targetFaction);
    let bestArcane: ArcaneEntry | null = null;
    let bestRank = 0;
    let bestScore = baseScore;

    for (const arc of arcanes) {
        const ownedMaxRank = opts.ownedArcaneMaxRankByUniqueName?.[arc.uniqueName];
        const rankCap = ownedMaxRank == null ? arc.maxRank : Math.min(arc.maxRank, ownedMaxRank);
        for (let rank = rankCap; rank >= 0; rank--) {
            const e = arc.optimizerEffectByRank[rank] ?? arc.permanentEffectByRank[rank] ?? {};
            if (!Object.keys(e).length) continue;
            const s = scoreEffects(weapon, mainBuildEffects, goal, targetFaction, e);
            if (s >= bestScore) { bestScore = s; bestArcane = arc; bestRank = rank; }
        }
    }
    return { arcane: bestArcane, rank: bestRank };
}

// ── Public API ────────────────────────────────────────────────────────────────

function optimizeBuildInternal(
    weapon: WeaponEntry,
    availableMods: ModEntry[] | null,
    goal: OptimizeGoal,
    slotCount: number,
    opts: OptimizerOptions = {},
): OptimizeResult {
    if (!availableMods) availableMods = getModsForWeapon(weapon);

    const {
        slotPolarities = [],
        defaultSlotPolarities = slotPolarities,
        targetFaction = "",
        allowCatalyst = false,
        allowForma = false,
        optimizeExilus = false,
        exilusPolarity = "",
        optimizeArcane = false,
        buildForAttack = null,
        lockedSlots = [],
        lockedSlotRanks = [],
        preEquippedEffects = [],
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
    const hasLockedMainSlots = lockedSlots.some(Boolean);

    // Phase 1: Beam search — find best set of mods
    const initial = beamSearch(scoringWeapon, candidates, goal, slotCount, effectiveOpts);
    let mods = initial.mods;
    let ranks = initial.ranks;
    if (!hasLockedMainSlots) {
        ({ mods, ranks } = refineBuildSet(
            scoringWeapon,
            initial.mods,
            initial.ranks,
            candidates,
            goal,
            effectiveOpts,
        ));
    }

    // Phase 2: Assign mods to slots with polarity awareness
    const padded = [...slotPolarities];
    while (padded.length < slotCount) padded.push("");
    const paddedDefaults = [...defaultSlotPolarities];
    while (paddedDefaults.length < slotCount) paddedDefaults.push("");
    const assignmentPolarities = allowForma ? paddedDefaults : padded;

    const assigned = hasLockedMainSlots
        ? {
            slotMods: [...Array(slotCount).fill(null)].map((_, i) => lockedSlots[i] ?? null),
            slotRanks: [...Array(slotCount).fill(0)].map((_, i) => lockedSlots[i] ? (lockedSlotRanks[i] ?? lockedSlots[i]!.fusionLimit) : 0),
            resultPolarities: [...assignmentPolarities],
        }
        : assignModsToSlots(mods, ranks, assignmentPolarities, slotCount, allowForma);
    const slotMods = assigned.slotMods;
    const slotRanks = assigned.slotRanks;
    const resultPolarities = assigned.resultPolarities;
    if (hasLockedMainSlots) {
        const unlockedMods = mods.flatMap((mod, index) => (mod && !lockedSlots[index] ? [mod] : []));
        const unlockedRanks = mods.flatMap((mod, index) => (mod && !lockedSlots[index] ? [ranks[index]] : []));
        for (let i = 0; i < slotCount; i++) {
            if (lockedSlots[i]) continue;
            const nextMod = unlockedMods.shift() ?? null;
            const nextRank = unlockedRanks.shift() ?? 0;
            slotMods[i] = nextMod;
            slotRanks[i] = nextMod ? nextRank : 0;
        }
    }
    let finalPolarities = allowForma
        ? minimizePolaritiesByCapacity(
            paddedDefaults,
            slotMods,
            slotRanks,
            capCfg,
            effectiveOpts.extraCapacitySlots ?? [],
            undefined,
            effectiveOpts.maxFormaCount,
            effectiveOpts.lockedSlotMask ?? [],
        ).mainPolarities
        : resultPolarities;

    // Phase 3: Post-check capacity with real polarities; drop most expensive mod if over
    if (capCfg) {
        let iter = 0;
        while (iter++ < slotCount) {
            if (fitsCapacity(slotMods, slotRanks, capCfg, finalPolarities, effectiveOpts.extraCapacitySlots)) break;
            let worstSlot = -1, worstDrain = -Infinity;
            for (let si = 0; si < slotCount; si++) {
                const m = slotMods[si];
                if (!m) continue;
                const d = effectiveDrain(m, finalPolarities[si] ?? "", slotRanks[si]);
                if (d > worstDrain) { worstDrain = d; worstSlot = si; }
            }
            if (worstSlot < 0) break;
            slotMods[worstSlot] = null;
            slotRanks[worstSlot] = 0;
        }
        if (allowForma) {
            finalPolarities = minimizePolaritiesByCapacity(
                paddedDefaults,
                slotMods,
                slotRanks,
                capCfg,
                effectiveOpts.extraCapacitySlots ?? [],
                undefined,
                effectiveOpts.maxFormaCount,
                effectiveOpts.lockedSlotMask ?? [],
            ).mainPolarities;
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
    let finalExilusPolarity = exilusPolarity;
    if (optimizeExilus) {
        const ex = optimizeExilusSlot(
            scoringWeapon, availableMods, slotMods, slotRanks, finalPolarities, mainEffects, goal, targetFaction, exilusPolarity, effectiveOpts
        );
        exilusMod = ex.mod;
        exilusRank = ex.rank;
        finalExilusPolarity = ex.polarity;
        if (!exilusMod) {
            const forcedEx = optimizeExilusSlot(
                scoringWeapon,
                availableMods,
                slotMods,
                slotRanks,
                finalPolarities,
                mainEffects,
                goal,
                targetFaction,
                exilusPolarity,
                { ...effectiveOpts, capacityConfig: undefined },
            );
            exilusMod = forcedEx.mod;
            exilusRank = forcedEx.rank;
            finalExilusPolarity = forcedEx.polarity;
        }
    }

    const contextualCapacitySlots = exilusMod
        ? [
            ...(effectiveOpts.extraCapacitySlots ?? []),
            { mod: exilusMod, rank: exilusRank, polarity: finalExilusPolarity },
        ]
        : (effectiveOpts.extraCapacitySlots ?? []);

    if (capCfg && exilusMod) {
        let iter = 0;
        while (iter++ < slotCount) {
            if (fitsCapacity(slotMods, slotRanks, capCfg, finalPolarities, contextualCapacitySlots)) break;
            let weakestSlot = -1;
            let weakestPenalty = Infinity;
            for (let si = 0; si < slotCount; si++) {
                const m = slotMods[si];
                if (!m) continue;
                const trialMods = [...slotMods];
                const trialRanks = [...slotRanks];
                trialMods[si] = null;
                trialRanks[si] = 0;
                const currentScore = scoreSlots(scoringWeapon, slotMods, slotRanks, goal, targetFaction);
                const trialScore = scoreSlots(scoringWeapon, trialMods, trialRanks, goal, targetFaction);
                const penalty = currentScore - trialScore;
                if (penalty < weakestPenalty) {
                    weakestPenalty = penalty;
                    weakestSlot = si;
                }
            }
            if (weakestSlot < 0) break;
            slotMods[weakestSlot] = null;
            slotRanks[weakestSlot] = 0;
        }
    }

    // Phase 5: Arcane optimization
    let arcane: ArcaneEntry | null = null;
    let arcaneRank = 0;
    if (optimizeArcane) {
        const allEffects = exilusMod
            ? [...preEquippedEffects, ...mainEffects, exilusMod.effectsByRank[exilusRank] ?? exilusMod.effect]
            : [...preEquippedEffects, ...mainEffects];
        const arc = optimizeArcaneSlot(scoringWeapon, allEffects, goal, targetFaction, effectiveOpts);
        arcane = arc.arcane;
        arcaneRank = arc.rank;
    }

    const contextualExtraEffects: (ModEffect | null)[] = [];
    if (exilusMod) contextualExtraEffects.push(exilusMod.effectsByRank[exilusRank] ?? exilusMod.effect);
    const contextualArcaneEffect =
        arcane
            ? (arcane.optimizerEffectByRank[arcaneRank] ?? arcane.permanentEffectByRank[arcaneRank] ?? null)
            : null;

    if (!hasLockedMainSlots) {
        const refinedWithContext = refineBuildSet(
            scoringWeapon,
            slotMods.filter((m): m is ModEntry => !!m),
            slotMods.flatMap((m, i) => (m ? [slotRanks[i]] : [])),
            candidates,
            goal,
            { ...effectiveOpts, extraCapacitySlots: contextualCapacitySlots },
            contextualExtraEffects,
            contextualArcaneEffect,
        );
        const filledWithContext = fillEmptySlots(
            scoringWeapon,
            refinedWithContext.mods,
            refinedWithContext.ranks,
            candidates,
            goal,
            slotCount,
            { ...effectiveOpts, extraCapacitySlots: contextualCapacitySlots },
            contextualExtraEffects,
            contextualArcaneEffect,
        );
        mods = filledWithContext.mods;
        ranks = filledWithContext.ranks;
    } else {
        mods = slotMods.filter((m, i): m is ModEntry => !!m && !lockedSlots[i]);
        ranks = slotMods.flatMap((m, i) => (m && !lockedSlots[i] ? [slotRanks[i]] : []));
    }

    const reassigned = hasLockedMainSlots
        ? {
            slotMods: [...slotMods],
            slotRanks: [...slotRanks],
            resultPolarities: [...resultPolarities],
        }
        : assignModsToSlots(mods, ranks, assignmentPolarities, slotCount, allowForma);
    const minimizedFinalPolarities = allowForma
        ? minimizePolaritiesByCapacity(
            paddedDefaults,
            reassigned.slotMods,
            reassigned.slotRanks,
            capCfg,
            effectiveOpts.extraCapacitySlots ?? [],
            exilusMod ? { mod: exilusMod, rank: exilusRank, basePolarity: exilusPolarity } : undefined,
            effectiveOpts.maxFormaCount,
            effectiveOpts.lockedSlotMask ?? [],
        )
        : { mainPolarities: reassigned.resultPolarities, exilusPolarity: finalExilusPolarity };
    let reassignedPolarities = minimizedFinalPolarities.mainPolarities;
    if (allowForma && exilusMod) {
        finalExilusPolarity = minimizedFinalPolarities.exilusPolarity;
    }
    for (let i = 0; i < slotCount; i++) {
        slotMods[i] = reassigned.slotMods[i];
        slotRanks[i] = reassigned.slotRanks[i];
        finalPolarities[i] = reassignedPolarities[i];
    }

    if (capCfg) {
        const finalExtraCapacitySlots = exilusMod
            ? [
                ...(effectiveOpts.extraCapacitySlots ?? []),
                { mod: exilusMod, rank: exilusRank, polarity: finalExilusPolarity },
            ]
            : (effectiveOpts.extraCapacitySlots ?? []);
        let iter = 0;
        while (iter++ < slotCount) {
            if (fitsCapacity(slotMods, slotRanks, capCfg, finalPolarities, finalExtraCapacitySlots)) break;
            let weakestSlot = -1;
            let weakestPenalty = Infinity;
            for (let si = 0; si < slotCount; si++) {
                const m = slotMods[si];
                if (!m) continue;
                const trialMods = [...slotMods];
                const trialRanks = [...slotRanks];
                trialMods[si] = null;
                trialRanks[si] = 0;
                const currentScore = scoreSlots(scoringWeapon, slotMods, slotRanks, goal, targetFaction, contextualArcaneEffect);
                const trialScore = scoreSlots(scoringWeapon, trialMods, trialRanks, goal, targetFaction, contextualArcaneEffect);
                const penalty = currentScore - trialScore;
                if (penalty < weakestPenalty) {
                    weakestPenalty = penalty;
                    weakestSlot = si;
                }
            }
            if (weakestSlot < 0) break;
            slotMods[weakestSlot] = null;
            slotRanks[weakestSlot] = 0;
            if (allowForma) {
                const recapped = minimizePolaritiesByCapacity(
                    paddedDefaults,
                    slotMods,
                    slotRanks,
                    capCfg,
                    effectiveOpts.extraCapacitySlots ?? [],
                    exilusMod ? { mod: exilusMod, rank: exilusRank, basePolarity: exilusPolarity } : undefined,
                    effectiveOpts.maxFormaCount,
                    effectiveOpts.lockedSlotMask ?? [],
                );
                finalPolarities = recapped.mainPolarities;
                finalExilusPolarity = exilusMod ? recapped.exilusPolarity : "";
            }
        }
    }

    const scoreFinalMainSlots = (trialSlots: (ModEntry | null)[], trialRanks: number[]) =>
        scoreSlots(
            scoringWeapon,
            trialSlots,
            trialRanks,
            goal,
            targetFaction,
            contextualArcaneEffect,
            contextualExtraEffects,
        );

    let greedyImproved = true;
    while (greedyImproved && slotMods.some((mod) => !mod)) {
        greedyImproved = false;
        const baseScore = scoreFinalMainSlots(slotMods, slotRanks);
        let bestCandidate: {
            slotIndex: number;
            mod: ModEntry;
            rank: number;
            score: number;
            polarities: string[];
            exilusPolarity: string;
        } | null = null;

        const presentGroups = new Set(slotMods.filter((mod): mod is ModEntry => !!mod).map((mod) => mod.incompatibilityGroup));
        const presentNames = new Set(slotMods.filter((mod): mod is ModEntry => !!mod).map((mod) => mod.uniqueName));
        const emptyIndexes = slotMods.flatMap((mod, index) => (mod ? [] : [index]));

        for (const candidate of candidates) {
            if (presentGroups.has(candidate.mod.incompatibilityGroup)) continue;
            if (presentNames.has(candidate.mod.uniqueName)) continue;

            for (const slotIndex of emptyIndexes) {
                const trialSlots = [...slotMods];
                const trialRanks = [...slotRanks];
                trialSlots[slotIndex] = candidate.mod;
                trialRanks[slotIndex] = candidate.rank;

                let trialPolarities = [...finalPolarities];
                let trialExilusPolarity = finalExilusPolarity;
                if (allowForma) {
                    const minimized = minimizePolaritiesByCapacity(
                        paddedDefaults,
                        trialSlots,
                        trialRanks,
                        capCfg,
                        effectiveOpts.extraCapacitySlots ?? [],
                        exilusMod ? { mod: exilusMod, rank: exilusRank, basePolarity: exilusPolarity } : undefined,
                        effectiveOpts.maxFormaCount,
                        effectiveOpts.lockedSlotMask ?? [],
                    );
                    trialPolarities = minimized.mainPolarities;
                    trialExilusPolarity = exilusMod ? minimized.exilusPolarity : "";
                }

                const trialExtraCapacitySlots = exilusMod
                    ? [
                        ...(effectiveOpts.extraCapacitySlots ?? []),
                        { mod: exilusMod, rank: exilusRank, polarity: trialExilusPolarity },
                    ]
                    : (effectiveOpts.extraCapacitySlots ?? []);

                if (capCfg && !fitsCapacity(trialSlots, trialRanks, capCfg, trialPolarities, trialExtraCapacitySlots)) continue;

                const trialScore = scoreFinalMainSlots(trialSlots, trialRanks);
                if (trialScore <= baseScore + 1e-9) continue;

                if (!bestCandidate || trialScore > bestCandidate.score + 1e-9) {
                    bestCandidate = {
                        slotIndex,
                        mod: candidate.mod,
                        rank: candidate.rank,
                        score: trialScore,
                        polarities: trialPolarities,
                        exilusPolarity: trialExilusPolarity,
                    };
                }
            }
        }

        if (bestCandidate) {
            slotMods[bestCandidate.slotIndex] = bestCandidate.mod;
            slotRanks[bestCandidate.slotIndex] = bestCandidate.rank;
            finalPolarities = bestCandidate.polarities;
            finalExilusPolarity = exilusMod ? bestCandidate.exilusPolarity : "";
            greedyImproved = true;
        }
    }

    const originalCapCfg = opts.capacityConfig;
    const needsCatalyst =
        !!(
            allowCatalyst &&
            originalCapCfg &&
            !originalCapCfg.hasCatalyst &&
            !fitsCapacity(slotMods, slotRanks, originalCapCfg, finalPolarities, effectiveOpts.extraCapacitySlots) &&
            fitsCapacity(slotMods, slotRanks, { ...originalCapCfg, hasCatalyst: true }, finalPolarities, effectiveOpts.extraCapacitySlots)
        );

    return {
        mods: slotMods.filter((m): m is ModEntry => m !== null),
        ranks: slotRanks.filter((_, i) => slotMods[i] !== null),
        slots: slotMods,
        slotRanks,
        slotPolarities: finalPolarities,
        needsCatalyst,
        exilusMod,
        exilusRank,
        exilusPolarity: exilusMod ? finalExilusPolarity : "",
        arcane,
        arcaneRank,
    };
}

export function optimizeBuild(
    weapon: WeaponEntry,
    availableMods: ModEntry[] | null,
    goal: OptimizeGoal,
    slotCount: number,
    opts: OptimizerOptions = {},
): OptimizeResult {
    const maxOnlyOpts: OptimizerOptions = { ...opts, allowNonMaxRank: false };
    const maxOnlyResult = optimizeBuildInternal(weapon, availableMods, goal, slotCount, maxOnlyOpts);

    if (!opts.allowNonMaxRank) return maxOnlyResult;

    const nonMaxResult = optimizeBuildInternal(weapon, availableMods, goal, slotCount, opts);
    if (!resultUsesAnyNonMaxed(nonMaxResult)) return maxOnlyResult;

    const baseScore = scoreOptimizeResult(weapon, maxOnlyResult, goal, opts.targetFaction ?? "", opts.buildForAttack);
    const nonMaxScore = scoreOptimizeResult(weapon, nonMaxResult, goal, opts.targetFaction ?? "", opts.buildForAttack);
    return nonMaxScore > baseScore ? nonMaxResult : maxOnlyResult;
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
        case "burst": return "Burst";
        case "scaling": return "Scaling";
        case "crit": return "Crit Focus";
        case "status": return "Status Focus";
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
    const totalMultiplier = baseScore > 0 ? finalScore / baseScore : 0;
    const summary    = `${goalLabel(goal)}${targetFaction ? ` vs ${targetFaction}` : ""}. Final score: ${totalMultiplier.toFixed(1)}x base${baseScore > 0 ? ` (+${totalGain.toFixed(1)}% vs unmodded)` : ""}.`;

    return { goal, targetFaction, steps, summary };
}
