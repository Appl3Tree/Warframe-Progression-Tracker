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
 * Average crit damage multiplier per hit, matching the Warframe wiki formula exactly.
 *
 * Wiki (Damage/Calculation p.7):
 *   Average Shot = Total Damage × (1 + Modded Crit Chance × (Modded Crit Mult − 1))
 *
 * The generalised piecewise form handles CC > 100%:
 *   - floor(CC) gives the guaranteed crit tier (e.g. CC=2.5 → always orange crit)
 *   - frac(CC) is the chance to roll one tier higher (e.g. CC=2.5 → 50% red crit)
 *   - low  = 1 + floor(CC) × (CM − 1)   [guaranteed tier multiplier]
 *   - high = 1 + ceil(CC)  × (CM − 1)   [next tier multiplier]
 *   - result = (1 − frac) × low + frac × high
 *
 * This correctly collapses to (1 + CC × (CM−1)) for CC ≤ 1, and gives:
 *   CC=1.6, CM=2.0 → (0.4 × 2) + (0.6 × 3) = 2.6  (NOT 1.6×2.0=3.2)
 *   CC=2.5, CM=2.0 → (0.5 × 3) + (0.5 × 4) = 3.5  (NOT 2.5×2.0=5.0)
 */
export function avgCritMultiplier(critChance: number, critMult: number): number {
    if (critChance <= 0) return 1;
    const frac = critChance - Math.floor(critChance);
    const low  = 1 + Math.floor(critChance) * (critMult - 1);
    const high = 1 + Math.ceil(critChance)  * (critMult - 1);
    return (1 - frac) * low + frac * high;
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
    /** Optional: which faction to calculate damage against. Empty = no faction bonus. */
    targetFaction = "",
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
    let factionDamageBonus = 0;

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
        // Only apply faction bonus if the mod targets the selected faction
        if (targetFaction && e.targetFaction &&
            e.targetFaction.toLowerCase() === targetFaction.toLowerCase()) {
            factionDamageBonus += e.factionDamageBonus;
        }
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
    // Faction damage is a multiplicative bonus applied after all other mods (wiki: "Faction Damage Bonus")
    const moddedMultishot = weapon.multishot * (1 + multishotBonus);
    const arsenalDamage = totalBase * inner * (1 + damageBonus) * moddedMultishot * (1 + factionDamageBonus);

    // Modded secondary stats
    const critChance   = weapon.critChance    * (1 + critChanceBonus);
    const critMult     = weapon.critMultiplier * (1 + critMultBonus);
    const statusChance = weapon.statusChance  * (1 + statusChanceBonus);

    // Fire rate / attack speed: melee uses attackSpeed; ranged uses fireRate.
    // For Charge trigger weapons the wiki formula is:
    //   Effective Fire Rate = 1 / (Modded Charge Time + 1 / Modded Fire Rate)
    // where Modded Charge Time = Base Charge Time / (1 + fireRateBonus) because
    // fire rate mods reduce charge time on charge weapons.
    const rawFireRate = weapon.fireRate * (1 + (weapon.category === "Melee" ? attackSpeedBonus : fireRateBonus));
    let fireRate: number;
    if (weapon.trigger === "Charge" && weapon.chargeTime !== null && weapon.chargeTime > 0) {
        // Charge time is also shortened by fire rate mods (they act as charge speed)
        const moddedChargeTime = weapon.chargeTime / (1 + fireRateBonus);
        fireRate = 1 / (moddedChargeTime + 1 / rawFireRate);
    } else {
        fireRate = rawFireRate;
    }

    const magazineSize = Math.max(1, Math.round(weapon.magazineSize * (1 + magazineBonus)));
    // Always apply the speed formula — a bonus of 0 is a no-op (divides by 1)
    const reloadTime = weapon.reloadTime / (1 + reloadSpeedBonus);

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
