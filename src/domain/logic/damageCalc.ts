// src/domain/logic/damageCalc.ts
// Damage + status calculations for the mod builder / optimizer.

import { usesMeleeDamageModel, type WeaponEntry } from "../catalog/weaponCatalog";
import type { ConditionalEffect, ModEffect } from "../catalog/modCatalog";

type DamageKey =
    | "impact" | "puncture" | "slash"
    | "heat" | "cold" | "electricity" | "toxin"
    | "blast" | "radiation" | "gas" | "magnetic" | "viral" | "corrosive"
    | "void" | "tau" | "true";

const DAMAGE_KEYS: DamageKey[] = [
    "impact", "puncture", "slash",
    "heat", "cold", "electricity", "toxin",
    "blast", "radiation", "gas", "magnetic", "viral", "corrosive",
    "void", "tau", "true",
];

const PRIMARY_ELEMENTS: DamageKey[] = ["heat", "cold", "electricity", "toxin"];

const COMBINED_ELEMENTS: Record<string, DamageKey> = {
    "cold+electricity": "magnetic",
    "electricity+cold": "magnetic",
    "heat+cold": "blast",
    "cold+heat": "blast",
    "heat+electricity": "radiation",
    "electricity+heat": "radiation",
    "heat+toxin": "gas",
    "toxin+heat": "gas",
    "cold+toxin": "viral",
    "toxin+cold": "viral",
    "electricity+toxin": "corrosive",
    "toxin+electricity": "corrosive",
};

export interface ModdedWeaponStats {
    rawDamageBreakdown: Record<DamageKey, number>;
    arsenalDamage: number;
    /**
     * Sum of all additive damage bonuses applied to base damage (e.g. Serration, Pressure Point,
     * conditional bonuses). Used by the optimizer to correctly apply Condition Overload and
     * Galvanized Aptitude as additive within this bracket rather than as a separate multiplier.
     */
    totalDamageBonus: number;
    averageShotDamage: number;
    critChance: number;
    critMultiplier: number;
    averageCritTier: number;
    statusChance: number;
    fireRate: number;
    magazineSize: number;
    reloadTime: number;
    multishot: number;
    shotsPerMag: number;
    damageBreakdown: Record<DamageKey, number>;
    totalDamage: number;
    procChanceByType: Partial<Record<DamageKey, number>>;
    averageProcsPerShot: number;
    extraProcsPerShot: Partial<Record<DamageKey, number>>;
    procRatePerSecondByType: Partial<Record<DamageKey, number>>;
    expectedStacksByType: Partial<Record<DamageKey, number>>;
    dotDamagePerShot: number;
    dotDps: number;
    dotDamagePerShotByType: Partial<Record<DamageKey, number>>;
    dotDpsByType: Partial<Record<DamageKey, number>>;
    viralHealthDamageBonus: number;
    heatArmorStrip: number;
    corrosiveArmorStrip: number;
    magneticShieldDamageBonus: number;
    radiationAllyDamageBonus: number;
    coldSlow: number;
    coldCritDamageBonus: number;
    punctureEnemyDamageReduction: number;
    punctureCritChanceBonus: number;
    impactMercyThresholdBonus: number;
    blastDetonationDamagePerShot: number;
    gasCloudRadius: number;
    tauStatusVulnerability: number;
    /** AoE elemental status spread chance (0–1). Melee Influence-type arcane effect. */
    aoeElementalStatusSpreadChance: number;
    aoeElementalStatusSpreadRadius: number;
}

const AIMING_UPTIME_ASSUMPTION = 0.75;
const ON_KILL_UPTIME_ASSUMPTION = 0.6;
const ON_HEADSHOT_UPTIME_ASSUMPTION = 0.55;
const ON_HEADSHOT_KILL_UPTIME_ASSUMPTION = 0.35;
const ON_HIT_UPTIME_ASSUMPTION = 0.85;
const WEAK_POINT_HIT_UPTIME_ASSUMPTION = 0.55;
const HIT_RATE_ASSUMPTION = 0.75;
const WEAK_POINT_HIT_RATE_ASSUMPTION = 0.45;

function shouldAssumeFullyStacked(conditional: ConditionalEffect): boolean {
    switch (conditional.trigger) {
        case "onKill":
        case "onHeadshotKill":
        case "onWeakPointKill":
        case "onMeleeKill":
        case "onKillOrAssist":
            return true;
        default:
            return false;
    }
}

export interface DamageMetrics {
    modded: ModdedWeaponStats;
    burstDPS: number;
    sustainedDPS: number;
}

function emptyBreakdown(): Record<DamageKey, number> {
    return {
        impact: 0, puncture: 0, slash: 0,
        heat: 0, cold: 0, electricity: 0, toxin: 0,
        blast: 0, radiation: 0, gas: 0, magnetic: 0, viral: 0, corrosive: 0,
        void: 0, tau: 0, true: 0,
    };
}

function roundQuantized(value: number, quantum: number): number {
    if (quantum <= 0) return value;
    return Math.round(value / quantum) * quantum;
}

export function avgCritMultiplier(critChance: number, critMult: number): number {
    if (critChance <= 0) return 1;
    return 1 + critChance * (critMult - 1);
}

function collapsePrimaryElements(entries: Array<{ type: DamageKey; value: number; order: number }>) {
    const merged = new Map<DamageKey, { value: number; order: number }>();
    for (const entry of entries) {
        const existing = merged.get(entry.type);
        if (existing) {
            existing.value += entry.value;
            existing.order = Math.min(existing.order, entry.order);
        } else {
            merged.set(entry.type, { value: entry.value, order: entry.order });
        }
    }
    return [...merged.entries()]
        .map(([type, meta]) => ({ type, value: meta.value, order: meta.order }))
        .sort((a, b) => a.order - b.order);
}

function combineElementQueue(queue: Array<{ type: DamageKey; value: number; order: number }>) {
    const out = emptyBreakdown();
    const collapsed = collapsePrimaryElements(queue);
    let i = 0;
    while (i < collapsed.length) {
        const current = collapsed[i];
        const next = collapsed[i + 1];
        if (next) {
            const combo = COMBINED_ELEMENTS[`${current.type}+${next.type}`];
            if (combo) {
                out[combo] += current.value + next.value;
                i += 2;
                continue;
            }
        }
        out[current.type] += current.value;
        i += 1;
    }
    return out;
}

function totalDamageOf(breakdown: Record<DamageKey, number>) {
    return DAMAGE_KEYS.reduce((sum, key) => sum + breakdown[key], 0);
}

function scaleForStacks(stacks: number, first: number, additional: number, cap: number): number {
    if (stacks <= 0) return 0;
    if (stacks <= 1) return first * stacks;
    return Math.min(cap, first + additional * (stacks - 1));
}

function scaleLinearCap(stacks: number, perStack: number, cap: number): number {
    if (stacks <= 0) return 0;
    return Math.min(cap, stacks * perStack);
}

export function estimateConditionalUptime(
    conditional: ConditionalEffect,
    fireRate: number,
    magazineSize: number,
): number {
    if (shouldAssumeFullyStacked(conditional)) {
        return conditional.requiresAiming ? AIMING_UPTIME_ASSUMPTION : 1;
    }
    let uptime = 0;
    switch (conditional.trigger) {
        case "onReload":
        case "onReloadFromEmpty": {
            const magTime = magazineSize / Math.max(0.0001, fireRate);
            uptime = conditional.durationSeconds > 0 ? Math.min(1, conditional.durationSeconds / Math.max(0.0001, magTime)) : 1;
            break;
        }
        case "onKill":
            uptime = ON_KILL_UPTIME_ASSUMPTION;
            break;
        case "onHeadshot":
            uptime = ON_HEADSHOT_UPTIME_ASSUMPTION;
            break;
        case "onHeadshotKill":
            uptime = ON_HEADSHOT_KILL_UPTIME_ASSUMPTION;
            break;
        case "onHit":
            uptime = ON_HIT_UPTIME_ASSUMPTION;
            break;
        case "onPunchThroughHit":
            uptime = ON_HIT_UPTIME_ASSUMPTION * 0.45;
            break;
        case "onWeakPointHit":
            uptime = WEAK_POINT_HIT_UPTIME_ASSUMPTION;
            break;
        case "onWeakPointKill":
            uptime = ON_HEADSHOT_KILL_UPTIME_ASSUMPTION * 0.9;
            break;
        case "onMeleeKill":
        case "onKillOrAssist":
            uptime = ON_KILL_UPTIME_ASSUMPTION;
            break;
        case "onConsecutiveThrow":
            uptime = 0.45;
            break;
    }
    if (conditional.requiresAiming) uptime *= AIMING_UPTIME_ASSUMPTION;
    return Math.max(0, Math.min(1, uptime));
}

function estimateConditionalStackFactor(
    conditional: ConditionalEffect,
    fireRate: number,
    _magazineSize: number,
): number {
    if ((conditional.maxStacks ?? 1) <= 1) return 1;
    if (shouldAssumeFullyStacked(conditional)) {
        return conditional.maxStacks ?? 1;
    }

    switch (conditional.trigger) {
        case "onKill":
        case "onMeleeKill":
        case "onKillOrAssist":
            return Math.max(1, conditional.maxStacks * 0.7);
        case "onHeadshotKill":
        case "onWeakPointKill":
            return Math.max(1, conditional.maxStacks * 0.5);
        case "onHit":
        case "onConsecutiveThrow": {
            const expected = fireRate * Math.max(0.25, conditional.durationSeconds || 0.25) * HIT_RATE_ASSUMPTION;
            return Math.max(1, Math.min(conditional.maxStacks, expected * 0.85));
        }
        case "onWeakPointHit": {
            const expected = fireRate * Math.max(0.25, conditional.durationSeconds || 0.25) * WEAK_POINT_HIT_RATE_ASSUMPTION;
            return Math.max(1, Math.min(conditional.maxStacks, expected * 0.8));
        }
        default:
            return 1;
    }
}

export { estimateConditionalStackFactor };

export function calculateBuild(
    weapon: WeaponEntry,
    mods: (ModEffect | null)[],
    targetFaction = "",
): DamageMetrics {
    const ignoresReloadAndMagazine = !!weapon.isExalted || !!weapon.selectedAttackIsIncarnon;
    let damageBonus = 0;
    let impactBonus = 0;
    let punctureBonus = 0;
    let slashBonus = 0;
    let critChanceBonus = 0;
    let finalCritChanceBonus = 0;
    let critMultBonus = 0;
    let finalCritMultiplierBonus = 0;
    let statusChanceBonus = 0;
    let finalStatusChanceBonus = 0;
    let multishotBonus = 0;
    let fireRateBonus = 0;
    let magazineBonus = 0;
    let reloadSpeedBonus = 0;
    let attackSpeedBonus = 0;
    let blastBonus = 0;
    let gasBonus = 0;
    let magneticBonus = 0;
    let radiationBonus = 0;
    let viralBonus = 0;
    let corrosiveBonus = 0;
    let voidBonus = 0;
    let tauBonus = 0;
    let trueBonus = 0;
    let perHitCritChanceBonus = 0;
    let nextMagazineStatusChancePerShot = 0;
    let nextMagazineMultishotPerShot = 0;
    let nextMagazineMaxStacks = 0;
    let factionDamageBonus = 0;
    let impactStatusAppliesMagneticChance = 0;
    let impactStatusAppliesSlashChance = 0;
    let impactStatusExtraProcLowFireRateThreshold = 0;
    let impactStatusExtraProcLowFireRateMultiplier = 1;
    let critAppliesSlashChance = 0;
    let aoeElementalStatusSpreadChance = 0;
    let aoeElementalStatusSpreadRadius = 0;
    const conditionalEffects: ConditionalEffect[] = [];

    const orderedPrimaryElementBonuses: Array<{ type: DamageKey; value: number; order: number }> = [];
    const directBonusBreakdown = emptyBreakdown();

    mods.forEach((e, index) => {
        if (!e) return;
        damageBonus += e.damageBonus ?? 0;
        impactBonus += e.impactBonus ?? 0;
        punctureBonus += e.punctureBonus ?? 0;
        slashBonus += e.slashBonus ?? 0;
        critChanceBonus += e.critChanceBonus ?? 0;
        finalCritChanceBonus += e.finalCritChanceBonus ?? 0;
        critMultBonus += e.critMultBonus ?? 0;
        finalCritMultiplierBonus += e.finalCritMultiplierBonus ?? 0;
        statusChanceBonus += e.statusChanceBonus ?? 0;
        finalStatusChanceBonus += e.finalStatusChanceBonus ?? 0;
        multishotBonus += e.multishotBonus ?? 0;
        fireRateBonus += e.fireRateBonus ?? 0;
        if (!ignoresReloadAndMagazine) {
            magazineBonus += e.magazineBonus ?? 0;
            reloadSpeedBonus += e.reloadSpeedBonus ?? 0;
        }
        attackSpeedBonus += e.attackSpeedBonus ?? 0;
        blastBonus += e.blastBonus ?? 0;
        gasBonus += e.gasBonus ?? 0;
        magneticBonus += e.magneticBonus ?? 0;
        radiationBonus += e.radiationBonus ?? 0;
        viralBonus += e.viralBonus ?? 0;
        corrosiveBonus += e.corrosiveBonus ?? 0;
        voidBonus += e.voidBonus ?? 0;
        tauBonus += e.tauBonus ?? 0;
        trueBonus += e.trueBonus ?? 0;
        perHitCritChanceBonus += e.perHitCritChanceBonus ?? 0;
        nextMagazineStatusChancePerShot += e.nextMagazineStatusChancePerShot ?? 0;
        nextMagazineMultishotPerShot += e.nextMagazineMultishotPerShot ?? 0;
        nextMagazineMaxStacks = Math.max(nextMagazineMaxStacks, e.nextMagazineMaxStacks ?? 0);
        impactStatusAppliesMagneticChance += e.impactStatusAppliesMagneticChance ?? 0;
        impactStatusAppliesSlashChance += e.impactStatusAppliesSlashChance ?? 0;
        impactStatusExtraProcLowFireRateThreshold = Math.max(impactStatusExtraProcLowFireRateThreshold, e.impactStatusExtraProcLowFireRateThreshold ?? 0);
        impactStatusExtraProcLowFireRateMultiplier = Math.max(impactStatusExtraProcLowFireRateMultiplier, e.impactStatusExtraProcLowFireRateMultiplier || 1);
        critAppliesSlashChance += e.critAppliesSlashChance ?? 0;
        aoeElementalStatusSpreadChance = Math.max(aoeElementalStatusSpreadChance, e.aoeElementalStatusSpreadChance ?? 0);
        aoeElementalStatusSpreadRadius = Math.max(aoeElementalStatusSpreadRadius, e.aoeElementalStatusSpreadRadius ?? 0);
        conditionalEffects.push(...(e.conditionalEffects ?? []));

        if (targetFaction && e.targetFaction && e.targetFaction.toLowerCase() === targetFaction.toLowerCase()) {
            factionDamageBonus += e.factionDamageBonus ?? 0;
        }

        const orderedEntries: Array<[DamageKey, number]> = [
            ["heat", e.heatBonus ?? 0],
            ["cold", e.coldBonus ?? 0],
            ["electricity", e.electricityBonus ?? 0],
            ["toxin", e.toxinBonus ?? 0],
        ];
        for (const [type, value] of orderedEntries) {
            if (value > 0) orderedPrimaryElementBonuses.push({ type, value, order: index });
        }

        directBonusBreakdown.blast += e.blastBonus ?? 0;
        directBonusBreakdown.gas += e.gasBonus ?? 0;
        directBonusBreakdown.magnetic += e.magneticBonus ?? 0;
        directBonusBreakdown.radiation += e.radiationBonus ?? 0;
        directBonusBreakdown.viral += e.viralBonus ?? 0;
        directBonusBreakdown.corrosive += e.corrosiveBonus ?? 0;
        directBonusBreakdown.void += e.voidBonus ?? 0;
        directBonusBreakdown.tau += e.tauBonus ?? 0;
        directBonusBreakdown.true += e.trueBonus ?? 0;
    });

    const baseFireRateBonus = usesMeleeDamageModel(weapon.category) ? attackSpeedBonus : fireRateBonus;
    const baselineRawFireRate = weapon.fireRate * (1 + baseFireRateBonus);
    const baselineMagazineSize = Math.max(1, Math.round(weapon.magazineSize * (1 + magazineBonus)));
    let conditionalDamageBonus = 0;
    let conditionalCritChanceBonus = 0;
    let conditionalFinalCritChanceBonus = 0;
    let conditionalCritMultBonus = 0;
    let conditionalFinalCritMultiplierBonus = 0;
    let conditionalStatusChanceBonus = 0;
    let conditionalMultishotBonus = 0;
    let conditionalFireRateBonus = 0;
    let conditionalReloadSpeedBonus = 0;
    const conditionalDirectBonusBreakdown = emptyBreakdown();
    for (const conditional of conditionalEffects) {
        const factor =
            estimateConditionalUptime(conditional, baselineRawFireRate, baselineMagazineSize) *
            estimateConditionalStackFactor(conditional, baselineRawFireRate, baselineMagazineSize);
        conditionalDamageBonus += (conditional.stats.damageBonus ?? 0) * factor;
        conditionalCritChanceBonus += (conditional.stats.critChanceBonus ?? 0) * factor;
        conditionalFinalCritChanceBonus += (conditional.stats.finalCritChanceBonus ?? 0) * factor;
        conditionalCritMultBonus += (conditional.stats.critMultBonus ?? 0) * factor;
        conditionalFinalCritMultiplierBonus += (conditional.stats.finalCritMultiplierBonus ?? 0) * factor;
        conditionalStatusChanceBonus += (conditional.stats.statusChanceBonus ?? 0) * factor;
        conditionalMultishotBonus += (conditional.stats.multishotBonus ?? 0) * factor;
        conditionalFireRateBonus += (conditional.stats.fireRateBonus ?? 0) * factor;
        if (!ignoresReloadAndMagazine) {
            conditionalReloadSpeedBonus += (conditional.stats.reloadSpeedBonus ?? 0) * factor;
        }
        conditionalDirectBonusBreakdown.blast += (conditional.stats.blastBonus ?? 0) * factor;
        conditionalDirectBonusBreakdown.gas += (conditional.stats.gasBonus ?? 0) * factor;
        conditionalDirectBonusBreakdown.magnetic += (conditional.stats.magneticBonus ?? 0) * factor;
        conditionalDirectBonusBreakdown.radiation += (conditional.stats.radiationBonus ?? 0) * factor;
        conditionalDirectBonusBreakdown.viral += (conditional.stats.viralBonus ?? 0) * factor;
        conditionalDirectBonusBreakdown.corrosive += (conditional.stats.corrosiveBonus ?? 0) * factor;
        conditionalDirectBonusBreakdown.void += (conditional.stats.voidBonus ?? 0) * factor;
        conditionalDirectBonusBreakdown.tau += (conditional.stats.tauBonus ?? 0) * factor;
        conditionalDirectBonusBreakdown.true += (conditional.stats.trueBonus ?? 0) * factor;
    }

    damageBonus += conditionalDamageBonus;
    critChanceBonus += conditionalCritChanceBonus;
    finalCritChanceBonus += conditionalFinalCritChanceBonus;
    critMultBonus += conditionalCritMultBonus;
    finalCritMultiplierBonus += conditionalFinalCritMultiplierBonus;
    statusChanceBonus += conditionalStatusChanceBonus;
    multishotBonus += conditionalMultishotBonus;
    fireRateBonus += conditionalFireRateBonus;
    reloadSpeedBonus += conditionalReloadSpeedBonus;

    const projectedMultishot = weapon.multishot * (1 + multishotBonus);
    const expectedHitsPerMag = baselineMagazineSize * projectedMultishot * HIT_RATE_ASSUMPTION;
    if (perHitCritChanceBonus > 0) {
        critChanceBonus += perHitCritChanceBonus * Math.max(0, expectedHitsPerMag - 1) / 2;
    }
    if (nextMagazineMaxStacks > 0) {
        const nextMagStacks = Math.min(nextMagazineMaxStacks, baselineMagazineSize * projectedMultishot * HIT_RATE_ASSUMPTION);
        statusChanceBonus += nextMagazineStatusChancePerShot * nextMagStacks * 0.5;
        multishotBonus += nextMagazineMultishotPerShot * nextMagStacks * 0.5;
    }

    const baseDamageMultiplier = 1 + damageBonus;
    const totalBase = Math.max(0.0001, totalDamageOf({
        impact: weapon.damage.impact,
        puncture: weapon.damage.puncture,
        slash: weapon.damage.slash,
        heat: weapon.damage.heat,
        cold: weapon.damage.cold,
        electricity: weapon.damage.electricity,
        toxin: weapon.damage.toxin,
        blast: weapon.damage.blast,
        radiation: weapon.damage.radiation,
        gas: weapon.damage.gas,
        magnetic: weapon.damage.magnetic,
        viral: weapon.damage.viral,
        corrosive: weapon.damage.corrosive,
        void: weapon.damage.void,
        tau: weapon.damage.tau,
        true: weapon.damage.true,
    }) * baseDamageMultiplier);

    const rawBreakdown = emptyBreakdown();
    rawBreakdown.impact = weapon.damage.impact * baseDamageMultiplier * (1 + impactBonus);
    rawBreakdown.puncture = weapon.damage.puncture * baseDamageMultiplier * (1 + punctureBonus);
    rawBreakdown.slash = weapon.damage.slash * baseDamageMultiplier * (1 + slashBonus);

    const innateQueue: Array<{ type: DamageKey; value: number; order: number }> = [];
    PRIMARY_ELEMENTS.forEach((type, idx) => {
        const baseValue = weapon.damage[type];
        if (baseValue > 0) innateQueue.push({ type, value: baseValue * baseDamageMultiplier, order: mods.length + idx });
    });

    const moddedElementQueue = orderedPrimaryElementBonuses.map(entry => ({
        ...entry,
        value: totalBase * entry.value,
    }));
    const combinedPrimaries = combineElementQueue([...moddedElementQueue, ...innateQueue]);
    for (const key of DAMAGE_KEYS) rawBreakdown[key] += combinedPrimaries[key];

    rawBreakdown.blast += weapon.damage.blast * baseDamageMultiplier;
    rawBreakdown.radiation += weapon.damage.radiation * baseDamageMultiplier;
    rawBreakdown.gas += weapon.damage.gas * baseDamageMultiplier;
    rawBreakdown.magnetic += weapon.damage.magnetic * baseDamageMultiplier;
    rawBreakdown.viral += weapon.damage.viral * baseDamageMultiplier;
    rawBreakdown.corrosive += weapon.damage.corrosive * baseDamageMultiplier;
    rawBreakdown.void += weapon.damage.void * baseDamageMultiplier;
    rawBreakdown.tau += weapon.damage.tau * baseDamageMultiplier;
    rawBreakdown.true += weapon.damage.true * baseDamageMultiplier;

    for (const key of ["blast", "gas", "magnetic", "radiation", "viral", "corrosive", "void", "tau", "true"] as const) {
        rawBreakdown[key] += totalBase * (directBonusBreakdown[key] + conditionalDirectBonusBreakdown[key]);
    }

    const quantumScale = totalBase / 32;
    const damageBreakdown = emptyBreakdown();
    for (const key of DAMAGE_KEYS) {
        damageBreakdown[key] = roundQuantized(rawBreakdown[key], quantumScale);
    }

    const totalDamage = totalDamageOf(damageBreakdown);
    const moddedMultishot = weapon.multishot * (1 + multishotBonus);
    const arsenalDamage = totalDamage * moddedMultishot;

    const critChance = weapon.critChance * (1 + critChanceBonus) + finalCritChanceBonus;
    const critMultiplier = weapon.critMultiplier * (1 + critMultBonus) + finalCritMultiplierBonus;
    const averageCritTier = Math.max(0, critChance);
    const statusChance = weapon.statusChance * (1 + statusChanceBonus) + finalStatusChanceBonus;

    const rawFireRate = weapon.fireRate * (1 + (usesMeleeDamageModel(weapon.category) ? attackSpeedBonus : fireRateBonus));
    let fireRate = rawFireRate;
    if (weapon.trigger === "Charge" && weapon.chargeTime !== null && weapon.chargeTime > 0) {
        const moddedChargeTime = weapon.chargeTime / (1 + fireRateBonus);
        fireRate = 1 / (moddedChargeTime + 1 / Math.max(0.0001, rawFireRate));
    }

    const magazineSize = ignoresReloadAndMagazine
        ? Math.max(1, weapon.magazineSize)
        : Math.max(1, Math.round(weapon.magazineSize * (1 + magazineBonus)));
    const reloadTime = ignoresReloadAndMagazine
        ? weapon.reloadTime
        : weapon.reloadTime / (1 + reloadSpeedBonus);
    const averageShotDamage = arsenalDamage * avgCritMultiplier(critChance, critMultiplier);
    const shotsPerMag = magazineSize / Math.max(0.0001, weapon.ammoCostPerShot ?? 1);

    const procChanceByType: Partial<Record<DamageKey, number>> = {};
    const baseDamageTotal = totalDamageOf(damageBreakdown);
    if (baseDamageTotal > 0) {
        for (const key of DAMAGE_KEYS) {
            if (damageBreakdown[key] > 0) procChanceByType[key] = damageBreakdown[key] / baseDamageTotal;
        }
    }
    const baseProcsPerShot = moddedMultishot * statusChance;
    const impactProcChance = procChanceByType.impact ?? 0;
    const lowFireRateApplies =
        impactStatusExtraProcLowFireRateThreshold > 0 &&
        fireRate < impactStatusExtraProcLowFireRateThreshold;
    const impactStatusMultiplier = lowFireRateApplies
        ? impactStatusExtraProcLowFireRateMultiplier
        : 1;
    const extraProcsPerShot: Partial<Record<DamageKey, number>> = {};
    const addExtraProc = (key: DamageKey, value: number) => {
        if (value <= 0) return;
        extraProcsPerShot[key] = (extraProcsPerShot[key] ?? 0) + value;
    };
    addExtraProc("magnetic", baseProcsPerShot * impactProcChance * impactStatusAppliesMagneticChance * impactStatusMultiplier);
    addExtraProc("slash", baseProcsPerShot * impactProcChance * impactStatusAppliesSlashChance * impactStatusMultiplier);
    addExtraProc("slash", moddedMultishot * Math.min(1, critChance) * critAppliesSlashChance);

    const totalExtraProcsPerShot = Object.values(extraProcsPerShot).reduce((sum, value) => sum + (value ?? 0), 0);
    const averageProcsPerShot = baseProcsPerShot + totalExtraProcsPerShot;
    if (averageProcsPerShot > 0) {
        const combinedWeights: Partial<Record<DamageKey, number>> = {};
        for (const key of DAMAGE_KEYS) {
            const baseWeight = (procChanceByType[key] ?? 0) * baseProcsPerShot;
            const extraWeight = extraProcsPerShot[key] ?? 0;
            const combined = baseWeight + extraWeight;
            if (combined > 0) combinedWeights[key] = combined / averageProcsPerShot;
        }
        Object.assign(procChanceByType, combinedWeights);
    }

    const procRatePerSecondByType: Partial<Record<DamageKey, number>> = {};
    for (const key of DAMAGE_KEYS) {
        const perShot = averageProcsPerShot * (procChanceByType[key] ?? 0);
        if (perShot > 0) procRatePerSecondByType[key] = perShot * fireRate;
    }

    const statusDurationMultiplier = Math.max(0, 1 + mods.reduce((sum, effect) => sum + (effect?.statusDurationBonus ?? 0), 0));
    const critAverageMultiplier = avgCritMultiplier(critChance, critMultiplier);
    const statusDamageMultiplier = 1 + mods.reduce((sum, effect) => sum + (effect?.statusDamageBonus ?? 0), 0);
    const dotBaseDamagePerProc =
        totalBase *
        Math.max(0, 1 + factionDamageBonus) *
        Math.max(0, 1 + factionDamageBonus) *
        statusDamageMultiplier *
        critAverageMultiplier;

    const dotConfig: Partial<Record<DamageKey, { duration: number; multiplier: number; bonus: number }>> = {
        slash: { duration: 6, multiplier: 0.35, bonus: 0 },
        electricity: { duration: 6, multiplier: 0.5, bonus: 0 },
        heat: { duration: 6, multiplier: 0.5, bonus: 0 },
        toxin: { duration: 6, multiplier: 0.5, bonus: 0 },
        gas: { duration: 6, multiplier: 0.5, bonus: 0 },
    };

    const dotDamagePerShotByType: Partial<Record<DamageKey, number>> = {};
    const dotDpsByType: Partial<Record<DamageKey, number>> = {};
    let dotDamagePerShot = 0;
    let dotDps = 0;
    for (const [key, config] of Object.entries(dotConfig) as Array<[DamageKey, { duration: number; multiplier: number; bonus: number }]>) {
        const expectedProcsPerShotForType = averageProcsPerShot * (procChanceByType[key] ?? 0);
        if (expectedProcsPerShotForType <= 0) continue;
        const duration = config.duration * statusDurationMultiplier;
        if (duration <= 0) continue;
        const perProcTotal =
            dotBaseDamagePerProc *
            config.multiplier *
            duration *
            (1 +
                (key === "heat" ? (mods.reduce((sum, effect) => sum + (effect?.heatBonus ?? 0), 0)) :
                 key === "electricity" ? (mods.reduce((sum, effect) => sum + (effect?.electricityBonus ?? 0), 0)) :
                 key === "toxin" ? (mods.reduce((sum, effect) => sum + (effect?.toxinBonus ?? 0), 0)) :
                 key === "gas" ? 0 :
                 0));
        const perShotDamage = expectedProcsPerShotForType * perProcTotal;
        dotDamagePerShotByType[key] = perShotDamage;
        dotDpsByType[key] = perShotDamage * fireRate;
        dotDamagePerShot += perShotDamage;
        dotDps += perShotDamage * fireRate;
    }

    const expectedStacksByType: Partial<Record<DamageKey, number>> = {};
    const expectedStacks = (type: DamageKey, duration: number, cap?: number) => {
        const rate = procRatePerSecondByType[type] ?? 0;
        const stacks = rate * duration * statusDurationMultiplier;
        return cap ? Math.min(cap, stacks) : stacks;
    };
    expectedStacksByType.impact = expectedStacks("impact", 6, 5);
    expectedStacksByType.puncture = expectedStacks("puncture", 10, 5);
    expectedStacksByType.slash = expectedStacks("slash", 6);
    expectedStacksByType.heat = expectedStacks("heat", 6);
    expectedStacksByType.cold = expectedStacks("cold", 6, 10);
    expectedStacksByType.electricity = expectedStacks("electricity", 6);
    expectedStacksByType.toxin = expectedStacks("toxin", 6);
    expectedStacksByType.blast = expectedStacks("blast", 1.5, 10);
    expectedStacksByType.corrosive = expectedStacks("corrosive", 8, 10);
    expectedStacksByType.gas = expectedStacks("gas", 6, 10);
    expectedStacksByType.magnetic = expectedStacks("magnetic", 6, 10);
    expectedStacksByType.radiation = expectedStacks("radiation", 12, 10);
    expectedStacksByType.viral = expectedStacks("viral", 6, 10);
    expectedStacksByType.tau = expectedStacks("tau", 8, 10);

    const coldStacks = expectedStacksByType.cold ?? 0;
    const heatStacks = expectedStacksByType.heat ?? 0;
    const viralStacks = expectedStacksByType.viral ?? 0;
    const corrosiveStacks = expectedStacksByType.corrosive ?? 0;
    const magneticStacks = expectedStacksByType.magnetic ?? 0;
    const punctureStacks = expectedStacksByType.puncture ?? 0;
    const impactStacks = expectedStacksByType.impact ?? 0;
    const gasStacks = expectedStacksByType.gas ?? 0;
    const radiationStacks = expectedStacksByType.radiation ?? 0;
    const tauStacks = expectedStacksByType.tau ?? 0;

    const coldSlow = coldStacks >= 10 ? 1 : scaleForStacks(Math.min(coldStacks, 9), 0.5, 0.05, 0.9);
    // Wiki: +0.1 on first proc, +0.05 per subsequent proc, max +0.45 at 9 stacks (before freeze).
    // At 10 stacks the enemy freezes and the bonus jumps to +1.0 flat.
    const coldCritDamageBonus =
        coldStacks >= 10
            ? 1.0
            : scaleForStacks(Math.min(coldStacks, 9), 0.1, 0.05, 0.45);
    const viralHealthDamageBonus = scaleForStacks(viralStacks, 1.0, 0.25, 3.25);
    const heatArmorStrip = Math.min(0.5, 0.5 * Math.min(1, heatStacks));
    const corrosiveArmorStrip = scaleForStacks(corrosiveStacks, 0.26, 0.06, 0.8);
    const magneticShieldDamageBonus = scaleForStacks(magneticStacks, 1.0, 0.25, 3.25);
    const radiationAllyDamageBonus = scaleForStacks(radiationStacks, 1.0, 0.5, 5.5);
    const punctureEnemyDamageReduction = scaleForStacks(punctureStacks, 0.4, 0.1, 0.8);
    const punctureCritChanceBonus = scaleLinearCap(punctureStacks, 0.05, 0.25);
    const impactMercyThresholdBonus = scaleLinearCap(impactStacks, 0.08, 0.4);
    const blastDetonationDamagePerShot =
        averageProcsPerShot *
        (procChanceByType.blast ?? 0) *
        totalBase *
        0.3;
    const gasCloudRadius =
        gasStacks <= 0
            ? 0
            : Math.min(6, 3 + Math.max(0, Math.min(10, gasStacks) - 1) * 0.3);
    const tauStatusVulnerability = scaleLinearCap(tauStacks, 0.1, 1.0);

    const modded: ModdedWeaponStats = {
        rawDamageBreakdown: rawBreakdown,
        arsenalDamage,
        totalDamageBonus: damageBonus,
        averageShotDamage,
        critChance,
        critMultiplier,
        averageCritTier,
        statusChance,
        fireRate,
        magazineSize,
        reloadTime,
        multishot: moddedMultishot,
        shotsPerMag,
        damageBreakdown,
        totalDamage: totalDamageOf(damageBreakdown),
        procChanceByType,
        averageProcsPerShot,
        extraProcsPerShot,
        procRatePerSecondByType,
        expectedStacksByType,
        dotDamagePerShot,
        dotDps,
        dotDamagePerShotByType,
        dotDpsByType,
        viralHealthDamageBonus,
        heatArmorStrip,
        corrosiveArmorStrip,
        magneticShieldDamageBonus,
        radiationAllyDamageBonus,
        coldSlow,
        coldCritDamageBonus,
        punctureEnemyDamageReduction,
        punctureCritChanceBonus,
        impactMercyThresholdBonus,
        blastDetonationDamagePerShot,
        gasCloudRadius,
        tauStatusVulnerability,
        aoeElementalStatusSpreadChance,
        aoeElementalStatusSpreadRadius,
    };

    const burstDPS = averageShotDamage * fireRate;
    const sustainedDPS = ignoresReloadAndMagazine
        ? burstDPS
        : reloadTime <= 0
        ? burstDPS
        : burstDPS * ((shotsPerMag / Math.max(0.0001, fireRate)) / ((shotsPerMag / Math.max(0.0001, fireRate)) + reloadTime));

    return { modded, burstDPS, sustainedDPS };
}
