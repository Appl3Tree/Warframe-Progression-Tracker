// src/domain/logic/capacityCalc.ts
// Warframe mod capacity system, per the wiki:
// https://wiki.warframe.com/w/Mod_Capacity
//
// Key rules:
//  - Base capacity = weapon rank (max 30 normally, 40 for Kuva/Tenet/Coda)
//  - Orokin Catalyst doubles available capacity
//  - Minimum mod capacity = 15 + floor(MR / 2); +1 per Legendary Rank after MR 30
//  - Mod drain at rank r = baseDrain + r  (max rank r = fusionLimit)
//  - Matching polarity: halves drain, ceil((drain)/2)
//  - Non-matching polarity: increases drain by Math.round(drain/4)
//  - Aura mods (baseDrain < 0): GRANT capacity instead of consuming it
//    - Base grant = |baseDrain| + fusionLimit
//    - Matching polarity: doubles the grant
//    - Non-matching polarity: reduces grant by 25%, Math.round(grant * 0.75)

import type { ModEntry } from "../catalog/modCatalog";

// ── Polarity helpers ──────────────────────────────────────────────────────────

/**
 * Returns the effective drain cost of a mod in a given slot polarity,
 * at a given mod rank (0 = unranked, fusionLimit = max rank).
 *
 * For aura mods this returns a negative number representing the capacity
 * ADDED (so it can be summed with regular drain costs to get net usage).
 */
export function effectiveDrain(
    mod: ModEntry,
    slotPolarity: string,
    modRank?: number,
): number {
    const rank = modRank ?? mod.fusionLimit; // default to max rank
    const rawDrain = mod.baseDrain + rank;

    if (mod.isAura || mod.isStance) {
        // Aura and stance mods add capacity. WFCD stores baseDrain as a negative value for
        // auras; stances use the same effective rank math but are identified separately.
        // At rank r the base grant is |baseDrain| + r, then matching polarity doubles it
        // while non-matching reduces it by 25%.
        const grant = Math.abs(mod.baseDrain) + rank;
        if (slotPolarity === mod.polarity) {
            return -(grant * 2);
        } else {
            return -Math.round(grant * 0.75);
        }
    }

    if (rawDrain <= 0) return 0;

    if (slotPolarity === mod.polarity) {
        // Matching: halve drain, rounded up
        return Math.ceil(rawDrain / 2);
    } else if (slotPolarity === "" || slotPolarity === "none") {
        // Unset/empty slot polarity — no polarity modifier (neutral)
        return rawDrain;
    } else {
        // Non-matching: add Math.round(drain / 4)
        return rawDrain + Math.round(rawDrain / 4);
    }
}

// ── Capacity pool ─────────────────────────────────────────────────────────────

export interface CapacityConfig {
    /** Current weapon rank (0–30, or 0–40 for over-level weapons) */
    weaponRank: number;
    /** Whether an Orokin Catalyst is installed (doubles capacity) */
    hasCatalyst: boolean;
    /** Player's Mastery Rank (used for minimum capacity calculation) */
    masteryRank: number;
    /** Whether the weapon can go to rank 40 (Kuva/Tenet/Coda) */
    canOverLevel: boolean;
}

/**
 * Maximum possible rank for a weapon.
 */
export function maxWeaponRank(canOverLevel: boolean): number {
    return canOverLevel ? 40 : 30;
}

/**
 * Minimum mod capacity based on player's Mastery Rank.
 * MR 0–30: 15 + floor(MR/2)
 * MR 31+:  30 + (MR - 30)  (i.e. +1 per Legendary Rank)
 */
export function minModCapacity(masteryRank: number): number {
    if (masteryRank <= 30) {
        return 15 + Math.floor(masteryRank / 2);
    }
    return 30 + (masteryRank - 30);
}

/**
 * Total available mod capacity for a weapon, before subtracting mod drain.
 * = max(weaponRank, minModCapacity(MR))  [then optionally × 2 for catalyst]
 */
export function totalModCapacity(cfg: CapacityConfig): number {
    const base = Math.max(cfg.weaponRank, minModCapacity(cfg.masteryRank));
    return cfg.hasCatalyst ? base * 2 : base;
}

// ── Build-level capacity accounting ─────────────────────────────────────────

export interface SlotConfig {
    /** The current polarity of this slot (may differ from weapon default if forma'd) */
    polarity: string;
}

export interface CapacitySummary {
    /** Total available mod capacity (after catalyst, minimum cap) */
    totalCapacity: number;
    /** Capacity consumed by all installed mods (after polarity adjustments) */
    usedCapacity: number;
    /** Capacity added by aura mods (already included in usedCapacity as negative) */
    auraGrant: number;
    /** Remaining free capacity */
    remainingCapacity: number;
    /** True if mods exceed available capacity */
    overCapacity: boolean;
    /** Per-slot breakdown */
    slotBreakdown: Array<{
        slotPolarity: string;
        mod: ModEntry | null;
        modRank: number;
        rawDrain: number;
        effectiveDrain: number;
    }>;
}

/**
 * Compute the full capacity summary for a given weapon build.
 *
 * @param cfg        Weapon capacity configuration (rank, catalyst, MR)
 * @param slots      Array of slot configs (polarity per slot)
 * @param mods       Array of mods (null = empty slot), parallel to slots
 * @param modRanks   Optional per-mod rank overrides (defaults to max rank)
 */
export function computeCapacity(
    cfg: CapacityConfig,
    slots: SlotConfig[],
    mods: (ModEntry | null)[],
    modRanks?: (number | undefined)[],
): CapacitySummary {
    const total = totalModCapacity(cfg);

    let usedCapacity = 0;
    let auraGrant = 0;
    const slotBreakdown: CapacitySummary["slotBreakdown"] = [];

    for (let i = 0; i < slots.length; i++) {
        const slotPol = slots[i]?.polarity ?? "";
        const mod = mods[i] ?? null;
        const rank = modRanks?.[i] ?? (mod?.fusionLimit ?? 0);

        if (!mod) {
            slotBreakdown.push({ slotPolarity: slotPol, mod: null, modRank: 0, rawDrain: 0, effectiveDrain: 0 });
            continue;
        }

        const rawDrain = mod.baseDrain + rank;
        const eff = effectiveDrain(mod, slotPol, rank);

        if (mod.isAura || mod.isStance) {
            auraGrant += Math.abs(eff); // eff is negative for auras
        }

        usedCapacity += eff;
        slotBreakdown.push({ slotPolarity: slotPol, mod, modRank: rank, rawDrain, effectiveDrain: eff });
    }

    const remaining = total - usedCapacity;

    return {
        totalCapacity: total,
        usedCapacity,
        auraGrant,
        remainingCapacity: remaining,
        overCapacity: remaining < 0,
        slotBreakdown,
    };
}
