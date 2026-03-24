// src/domain/logic/damageCalc.ts
// Damage + status calculations for the mod builder / optimizer.

import type { WeaponEntry } from "../catalog/weaponCatalog";
import type { ModEffect } from "../catalog/modCatalog";

type DamageKey =
    | "impact" | "puncture" | "slash"
    | "heat" | "cold" | "electricity" | "toxin"
    | "blast" | "radiation" | "gas" | "magnetic" | "viral" | "corrosive";

const DAMAGE_KEYS: DamageKey[] = [
    "impact", "puncture", "slash",
    "heat", "cold", "electricity", "toxin",
    "blast", "radiation", "gas", "magnetic", "viral", "corrosive",
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
    arsenalDamage: number;
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
    };
}

function roundQuantized(value: number, quantum: number): number {
    if (quantum <= 0) return value;
    return Math.round(value / quantum) * quantum;
}

export function avgCritMultiplier(critChance: number, critMult: number): number {
    if (critChance <= 0) return 1;
    const guaranteedTier = Math.floor(critChance);
    const frac = critChance - guaranteedTier;
    const low = 1 + guaranteedTier * (critMult - 1);
    const high = 1 + (guaranteedTier + 1) * (critMult - 1);
    return (1 - frac) * low + frac * high;
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

export function calculateBuild(
    weapon: WeaponEntry,
    mods: (ModEffect | null)[],
    targetFaction = "",
): DamageMetrics {
    let damageBonus = 0;
    let impactBonus = 0;
    let punctureBonus = 0;
    let slashBonus = 0;
    let critChanceBonus = 0;
    let critMultBonus = 0;
    let statusChanceBonus = 0;
    let finalStatusChanceBonus = 0;
    let multishotBonus = 0;
    let fireRateBonus = 0;
    let magazineBonus = 0;
    let reloadSpeedBonus = 0;
    let attackSpeedBonus = 0;
    let factionDamageBonus = 0;
    let impactStatusAppliesMagneticChance = 0;
    let impactStatusAppliesSlashChance = 0;
    let impactStatusExtraProcLowFireRateThreshold = 0;
    let impactStatusExtraProcLowFireRateMultiplier = 1;
    let critAppliesSlashChance = 0;

    const orderedPrimaryElementBonuses: Array<{ type: DamageKey; value: number; order: number }> = [];
    const directBonusBreakdown = emptyBreakdown();

    mods.forEach((e, index) => {
        if (!e) return;
        damageBonus += e.damageBonus;
        impactBonus += e.impactBonus;
        punctureBonus += e.punctureBonus;
        slashBonus += e.slashBonus;
        critChanceBonus += e.critChanceBonus;
        critMultBonus += e.critMultBonus;
        statusChanceBonus += e.statusChanceBonus;
        finalStatusChanceBonus += e.finalStatusChanceBonus;
        multishotBonus += e.multishotBonus;
        fireRateBonus += e.fireRateBonus;
        magazineBonus += e.magazineBonus;
        reloadSpeedBonus += e.reloadSpeedBonus;
        attackSpeedBonus += e.attackSpeedBonus;
        impactStatusAppliesMagneticChance += e.impactStatusAppliesMagneticChance;
        impactStatusAppliesSlashChance += e.impactStatusAppliesSlashChance;
        impactStatusExtraProcLowFireRateThreshold = Math.max(impactStatusExtraProcLowFireRateThreshold, e.impactStatusExtraProcLowFireRateThreshold);
        impactStatusExtraProcLowFireRateMultiplier = Math.max(impactStatusExtraProcLowFireRateMultiplier, e.impactStatusExtraProcLowFireRateMultiplier || 1);
        critAppliesSlashChance += e.critAppliesSlashChance;

        if (targetFaction && e.targetFaction && e.targetFaction.toLowerCase() === targetFaction.toLowerCase()) {
            factionDamageBonus += e.factionDamageBonus;
        }

        const orderedEntries: Array<[DamageKey, number]> = [
            ["heat", e.heatBonus],
            ["cold", e.coldBonus],
            ["electricity", e.electricityBonus],
            ["toxin", e.toxinBonus],
        ];
        for (const [type, value] of orderedEntries) {
            if (value > 0) orderedPrimaryElementBonuses.push({ type, value, order: index });
        }

        directBonusBreakdown.magnetic += e.magneticBonus;
        directBonusBreakdown.radiation += e.radiationBonus;
    });

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

    rawBreakdown.magnetic += totalBase * directBonusBreakdown.magnetic;
    rawBreakdown.radiation += totalBase * directBonusBreakdown.radiation;

    const quantum = totalBase / 16;
    const damageBreakdown = emptyBreakdown();
    for (const key of DAMAGE_KEYS) {
        damageBreakdown[key] = roundQuantized(rawBreakdown[key], quantum);
    }

    const totalDamage = totalDamageOf(damageBreakdown) * (1 + factionDamageBonus);
    const moddedMultishot = weapon.multishot * (1 + multishotBonus);
    const arsenalDamage = totalDamage * moddedMultishot;

    const critChance = weapon.critChance * (1 + critChanceBonus);
    const critMultiplier = weapon.critMultiplier * (1 + critMultBonus);
    const averageCritTier = Math.max(0, critChance);
    const statusChance = weapon.statusChance * (1 + statusChanceBonus) + finalStatusChanceBonus;

    const rawFireRate = weapon.fireRate * (1 + (weapon.category === "Melee" ? attackSpeedBonus : fireRateBonus));
    let fireRate = rawFireRate;
    if (weapon.trigger === "Charge" && weapon.chargeTime !== null && weapon.chargeTime > 0) {
        const moddedChargeTime = weapon.chargeTime / (1 + fireRateBonus);
        fireRate = 1 / (moddedChargeTime + 1 / Math.max(0.0001, rawFireRate));
    }

    const magazineSize = Math.max(1, Math.round(weapon.magazineSize * (1 + magazineBonus)));
    const reloadTime = weapon.reloadTime / (1 + reloadSpeedBonus);
    const averageShotDamage = arsenalDamage * avgCritMultiplier(critChance, critMultiplier);
    const shotsPerMag = magazineSize;

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

    const modded: ModdedWeaponStats = {
        arsenalDamage,
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
    };

    const burstDPS = averageShotDamage * fireRate;
    const sustainedDPS = reloadTime <= 0
        ? burstDPS
        : burstDPS * ((shotsPerMag / Math.max(0.0001, fireRate)) / ((shotsPerMag / Math.max(0.0001, fireRate)) + reloadTime));

    return { modded, burstDPS, sustainedDPS };
}
