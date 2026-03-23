// src/domain/catalog/weaponCatalog.ts
// Weapon data catalog built from All.json for the mod builder.

import ALL_RAW from "../../data/All.json";

const ALL = ALL_RAW as Record<string, unknown>[];

export type WeaponCategory = "Primary" | "Secondary" | "Melee";
export type ModCompatName = "Rifle" | "Sniper" | "Shotgun" | "Pistol" | "Bow" | "Melee";

export interface WeaponDamage {
    total: number;
    impact: number;
    puncture: number;
    slash: number;
    heat: number;
    cold: number;
    electricity: number;
    toxin: number;
    blast: number;
    radiation: number;
    gas: number;
    magnetic: number;
    viral: number;
    corrosive: number;
}

export interface WeaponAttack {
    name: string;
    critChance: number;    // 0–1
    critMultiplier: number;
    statusChance: number;  // 0–1
    chargeTime?: number;
    damage: WeaponDamage;
    damageTotal: number;
}

export interface WeaponEntry {
    uniqueName: string;
    name: string;
    category: WeaponCategory;
    /** Internal weapon type as reported by WFCD (e.g. "Rifle", "Shotgun", "Bow", "Sword", "Melee") */
    weaponType: string;
    /** Which mod compat group accepts mods for this weapon */
    modCompat: ModCompatName;
    damage: WeaponDamage;
    critChance: number;
    critMultiplier: number;
    statusChance: number;
    fireRate: number;
    magazineSize: number;
    reloadTime: number;
    multishot: number;
    trigger: string;
    chargeTime: number | null;
    polarities: string[];
    canOverLevel: boolean;
    baseSlotCount: number;
    /**
     * Riven disposition (omegaAttenuation in WFCD). Range 0.5–1.55.
     * Used to calculate max possible riven stat values.
     */
    disposition: number;
    /** All named attacks from the WFCD data */
}

/** Kuva/Tenet/Coda weapons can rank to 40 */
function isOverLevelWeapon(name: string, uniqueName: string): boolean {
    const n = name.toLowerCase();
    const u = uniqueName.toLowerCase();
    return n.startsWith("kuva ") || n.startsWith("tenet ") || n.startsWith("coda ") ||
           u.includes("/kuva/") || u.includes("/tenet/") || u.includes("parvos");
}

/**
 * Extract the canonical charge time for a Charge trigger weapon.
 * Prefers the "best" charged attack (lowest charge time with actual damage),
 * which represents the most efficient DPS shot (e.g. Nataruk Perfect Shot at 0.7s).
 * Falls back to any attack with a charge_time, then to null.
 */
function resolveChargeTime(trigger: string, attacks: unknown[]): number | null {
    if (trigger !== "Charge") return null;
    if (!Array.isArray(attacks) || attacks.length === 0) return null;

    // Collect all attacks that have a numeric charge_time
    const withCT = attacks
        .filter((a): a is Record<string, unknown> =>
            typeof a === "object" && a !== null && typeof (a as any).charge_time === "number"
        )
        .map(a => (a as any).charge_time as number);

    if (withCT.length === 0) return null;

    // Use the minimum charge time — this represents the fastest viable charged shot
    // (e.g. Nataruk's Perfect Shot at 0.7s vs Charged Shot at 1.0s)
    return Math.min(...withCT);
}

function resolveModCompat(category: string, weaponType: string): ModCompatName {
    if (category === "Secondary") return "Pistol";
    if (category === "Melee") return "Melee";
    const t = (weaponType ?? "").toLowerCase();
    if (t === "shotgun") return "Shotgun";
    if (t === "bow") return "Bow";
    if (t === "sniper") return "Sniper";
    return "Rifle";
}

let _cache: WeaponEntry[] | null = null;

function n(v: unknown): number {
    const x = Number(v);
    return isFinite(x) ? x : 0;
}

export function getWeaponCatalog(): WeaponEntry[] {
    if (_cache) return _cache;

    const entries: WeaponEntry[] = [];

    for (const item of ALL) {
        const cat = item.category as string;
        if (cat !== "Primary" && cat !== "Secondary" && cat !== "Melee") continue;
        if (!item.damage || !item.name) continue;
        // Must have some damage or be masterable to count as a real weapon
        if (!item.masterable && !item.wikiaUrl) continue;

        const dmg = item.damage as Record<string, number>;
        const weaponType = String(item.type ?? "");
        const trigger    = String(item.trigger ?? "Auto");
        const rawAttacks = Array.isArray(item.attacks) ? item.attacks as Record<string, unknown>[] : [];

        // Parse named attacks — only keep those with distinct names (skip unnamed / single attacks)
        const parsedAttacks: WeaponAttack[] = rawAttacks
            .filter(a => typeof a.name === "string" && a.name.length > 0 && typeof a.damage === "object" && a.damage)
            .map(a => {
                const ad = a.damage as Record<string, number>;
                const dmgKeys = ["impact","puncture","slash","heat","cold","electricity",
                                 "toxin","blast","radiation","gas","magnetic","viral","corrosive"] as const;
                const attackDmg: WeaponDamage = {
                    total: 0, impact: 0, puncture: 0, slash: 0, heat: 0, cold: 0,
                    electricity: 0, toxin: 0, blast: 0, radiation: 0, gas: 0,
                    magnetic: 0, viral: 0, corrosive: 0,
                };
                for (const k of dmgKeys) attackDmg[k] = n(ad[k]);
                attackDmg.total = dmgKeys.reduce((s, k) => s + attackDmg[k], 0) || n(ad.total);
                return {
                    name: String(a.name),
                    critChance:    n(a.crit_chance) / 100,
                    critMultiplier: n(a.crit_mult) || 1.5,
                    statusChance:  n(a.status_chance) / 100,
                    chargeTime:    typeof a.charge_time === "number" ? a.charge_time : undefined,
                    damage: attackDmg,
                    damageTotal: attackDmg.total,
                };
            });

        const name = String(item.name);
        const uniqueName = String(item.uniqueName ?? "");
        const rawPolarities = Array.isArray(item.polarities)
            ? (item.polarities as unknown[]).map(p => String(p))
            : [];

        entries.push({
            uniqueName,
            name,
            category: cat as WeaponCategory,
            weaponType,
            modCompat: resolveModCompat(cat, weaponType),
            damage: {
                total:       n(dmg.total),
                impact:      n(dmg.impact),
                puncture:    n(dmg.puncture),
                slash:       n(dmg.slash),
                heat:        n(dmg.heat),
                cold:        n(dmg.cold),
                electricity: n(dmg.electricity),
                toxin:       n(dmg.toxin),
                blast:       n(dmg.blast),
                radiation:   n(dmg.radiation),
                gas:         n(dmg.gas),
                magnetic:    n(dmg.magnetic),
                viral:       n(dmg.viral),
                corrosive:   n(dmg.corrosive),
            },
            critChance:    n(item.criticalChance),
            critMultiplier: n(item.criticalMultiplier) || 1.5,
            statusChance:  n(item.procChance) || n(item.statusChance),
            fireRate:      n(item.fireRate) || 1,
            // Bows and some weapons don't report a magazineSize (they have ammo pouch).
            // Default to a large value (quiver size) so DPS calculations work correctly.
            magazineSize:  n(item.magazineSize) || (weaponType.toLowerCase() === "bow" ? 10 : 1),
            reloadTime:    n(item.reloadTime),
            multishot:     n(item.multishot) || 1,
            trigger,
            chargeTime:    resolveChargeTime(trigger, rawAttacks),
            polarities:    rawPolarities,
            canOverLevel:  isOverLevelWeapon(name, uniqueName),
            baseSlotCount: 8,
            disposition:   Number(item.omegaAttenuation ?? 1.0),
            attacks:       parsedAttacks,
        });
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    _cache = entries;
    return entries;
}

export function getWeaponsByCategory(cat: WeaponCategory): WeaponEntry[] {
    return getWeaponCatalog().filter(w => w.category === cat);
}
