// src/domain/logic/damageCalc.ts
// Pure damage calculation functions based on the Warframe wiki damage formulas.
// Reference: https://wiki.warframe.com/w/Damage/Damage_Calculation

import type { WeaponEntry } from "../catalog/weaponCatalog";
import type { ModEffect } from "../catalog/modCatalog";

// ---- Types ----

export interface ModdedWeaponStats {
    /** Arsenal-displayed total damage per shot (includes multishot) */
    arsenalDamage: number;
    /** Average damage per trigger input, weighted by crit probability */
    averageShotDamage: number;
    critChance: number;
    critMultiplier: number;
    statusChance: number;
    fireRate: number;
    magazineSize: number;
    reloadTime: number;
    multishot: number;
    /** Shots per magazine (accounts for ammo cost, assumed 1 here) */
    shotsPerMag: number;
}

export interface DamageMetrics {
    modded: ModdedWeaponStats;
    /** Damage per second assuming continuous fire (no reload) */
    burstDPS: number;
    /** Damage per second accounting for reload downtime */
    sustainedDPS: number;
}

// ---- Helpers ----

/**
 * Average crit damage multiplier, piecewise-correct for > 100% crit chance.
 *
 *  - For c ≤ 1:  1 + c × (m − 1)          (mix of non-crits and yellow crits)
 *  - For c > 1:  c × m                      (guaranteed crits, escalating tiers)
 *
 * Where m is the yellow-crit multiplier (e.g. 2.0 = 2× damage on crit).
 */
export function avgCritMultiplier(critChance: number, critMult: number): number {
    if (critChance <= 1) {
        return 1 + critChance * (critMult - 1);
    }
    // c > 1: every shot crits, floor(c) gives guaranteed tier, frac(c) gives
    // chance to roll into next tier.  Average = critMult × critChance.
    return critMult * critChance;
}

// ---- Main calculation ----

/**
 * Apply a list of mod effects to a weapon and return calculated stats + DPS.
 * Follows the Warframe wiki Arsenal Total Damage formula.
 *
 * Arsenal Total Damage =
 *   BaseDamage
 *   × [1 + elemental% + impactDist × impact% + punctDist × punct% + slashDist × slash%]
 *   × (1 + damage%)
 *   × [baseMultishot × (1 + multishot%)]
 */
export function calculateBuild(
    weapon: WeaponEntry,
    mods: (ModEffect | null)[],
): DamageMetrics {
    // Aggregate all mod bonuses (additive stacking within each category)
    let damageBonus = 0;
    let impactBonus = 0;
    let punctureBonus = 0;
    let slashBonus = 0;
    let heatBonus = 0;
    let coldBonus = 0;
    let electricityBonus = 0;
    let toxinBonus = 0;
    let magneticBonus = 0;
    let radiationBonus = 0;
    let critChanceBonus = 0;
    let critMultBonus = 0;
    let statusChanceBonus = 0;
    let multishotBonus = 0;
    let fireRateBonus = 0;
    let magazineBonus = 0;
    let reloadSpeedBonus = 0;
    let attackSpeedBonus = 0;

    for (const e of mods) {
        if (!e) continue;
        damageBonus      += e.damageBonus;
        impactBonus      += e.impactBonus;
        punctureBonus    += e.punctureBonus;
        slashBonus       += e.slashBonus;
        heatBonus        += e.heatBonus;
        coldBonus        += e.coldBonus;
        electricityBonus += e.electricityBonus;
        toxinBonus       += e.toxinBonus;
        magneticBonus    += e.magneticBonus;
        radiationBonus   += e.radiationBonus;
        critChanceBonus  += e.critChanceBonus;
        critMultBonus    += e.critMultBonus;
        statusChanceBonus+= e.statusChanceBonus;
        multishotBonus   += e.multishotBonus;
        fireRateBonus    += e.fireRateBonus;
        magazineBonus    += e.magazineBonus;
        reloadSpeedBonus += e.reloadSpeedBonus;
        attackSpeedBonus += e.attackSpeedBonus;
    }

    const base = weapon.damage;
    const totalBase = base.total || 1; // guard against 0

    // Unmodded physical distributions
    const impactDist  = base.impact    / totalBase;
    const punctDist   = base.puncture  / totalBase;
    const slashDist   = base.slash     / totalBase;

    // Total elemental bonus (all elemental mods sum together)
    const elementalBonusSum =
        heatBonus + coldBonus + electricityBonus + toxinBonus +
        magneticBonus + radiationBonus;

    // Inner bracket of the arsenal formula
    const inner = 1
        + elementalBonusSum
        + impactDist   * impactBonus
        + punctDist    * punctureBonus
        + slashDist    * slashBonus;

    // Arsenal total damage per shot (includes multishot, excludes crit)
    const moddedMultishot = weapon.multishot * (1 + multishotBonus);
    const arsenalDamage = totalBase * inner * (1 + damageBonus) * moddedMultishot;

    // Modded secondary stats
    const critChance   = weapon.critChance    * (1 + critChanceBonus);
    const critMult     = weapon.critMultiplier * (1 + critMultBonus);
    const statusChance = weapon.statusChance  * (1 + statusChanceBonus);

    // Fire rate / attack speed: melee uses attackSpeed; ranged uses fireRate
    const frMod = weapon.category === "Melee"
        ? attackSpeedBonus
        : fireRateBonus;
    const fireRate = weapon.fireRate * (1 + frMod);

    const magazineSize = Math.max(1, Math.round(weapon.magazineSize * (1 + magazineBonus)));
    const reloadTime   = reloadSpeedBonus > 0
        ? weapon.reloadTime / (1 + reloadSpeedBonus)
        : weapon.reloadTime;

    // Average shot damage (crit-weighted)
    const averageShotDamage = arsenalDamage * avgCritMultiplier(critChance, critMult);

    const shotsPerMag = magazineSize; // assuming 1 ammo per shot

    const modded: ModdedWeaponStats = {
        arsenalDamage,
        averageShotDamage,
        critChance,
        critMultiplier: critMult,
        statusChance,
        fireRate,
        magazineSize,
        reloadTime,
        multishot: moddedMultishot,
        shotsPerMag,
    };

    // Burst DPS (no reload downtime)
    const burstDPS = averageShotDamage * fireRate;

    // Sustained DPS (accounts for reload)
    // shootTime = shotsPerMag / fireRate; totalCycleTime = shootTime + reloadTime
    let sustainedDPS: number;
    if (reloadTime <= 0 || shotsPerMag <= 0) {
        sustainedDPS = burstDPS;
    } else {
        const shootTime = shotsPerMag / fireRate;
        const proportion = shootTime / (shootTime + reloadTime);
        sustainedDPS = burstDPS * proportion;
    }

    return { modded, burstDPS, sustainedDPS };
}
