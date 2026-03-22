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

export interface WeaponEntry {
    uniqueName: string;
    name: string;
    category: WeaponCategory;
    /** Internal weapon type as reported by WFCD (e.g. "Rifle", "Shotgun", "Bow", "Sword", "Melee") */
    weaponType: string;
    /** Which mod compat group accepts mods for this weapon */
    modCompat: ModCompatName;
    damage: WeaponDamage;
    critChance: number;       // 0–1
    critMultiplier: number;   // e.g. 2.0
    statusChance: number;     // 0–1
    fireRate: number;         // shots/attacks per second
    magazineSize: number;
    reloadTime: number;       // seconds
    multishot: number;        // base shots per trigger pull
    trigger: string;
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

        entries.push({
            uniqueName: String(item.uniqueName ?? ""),
            name: String(item.name),
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
            magazineSize:  n(item.magazineSize),
            reloadTime:    n(item.reloadTime),
            multishot:     n(item.multishot) || 1,
            trigger:       String(item.trigger ?? "Auto"),
        });
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    _cache = entries;
    return entries;
}

export function getWeaponsByCategory(cat: WeaponCategory): WeaponEntry[] {
    return getWeaponCatalog().filter(w => w.category === cat);
}
