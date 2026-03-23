// src/domain/catalog/modCatalog.ts
// Parses weapon mod data from All.json into structured ModEntry objects.
//
// Compat hierarchy:
//   Rifle        → all Rifle + Assault Rifle + PRIMARY (universal primary) mods
//   Sniper       → all Sniper + Rifle + Assault Rifle + PRIMARY mods
//   Shotgun      → all Shotgun + PRIMARY mods
//   Bow          → all Bow + PRIMARY mods
//   Pistol       → all Pistol mods
//   Melee        → all Melee mods
//
// Additionally, weapon-specific augments (e.g. compatName "Hek") are surfaced
// when the selected weapon's name matches the compat name.

import ALL_RAW from "../../data/All.json";
import type { ModCompatName, WeaponEntry } from "./weaponCatalog";

const ALL = ALL_RAW as Record<string, unknown>[];

// Maps raw WFCD compatName → internal bucket key
const COMPAT_MAP: Record<string, string> = {
    "Rifle":          "Rifle",
    "Assault Rifle":  "Rifle",   // AR mods work on all rifles
    "Shotgun":        "Shotgun",
    "Pistol":         "Pistol",
    "Bow":            "Bow",
    "Sniper":         "Sniper",
    "Sniper Rifle":   "Sniper",
    "PRIMARY":        "Primary", // universal primary mods (Vigilante set, Hunter Munitions…)
    "Melee":          "Melee",
};

export interface ModEffect {
    damageBonus: number;
    impactBonus: number;
    punctureBonus: number;
    slashBonus: number;
    heatBonus: number;
    coldBonus: number;
    electricityBonus: number;
    toxinBonus: number;
    magneticBonus: number;
    radiationBonus: number;
    critChanceBonus: number;
    critMultBonus: number;
    statusChanceBonus: number;
    multishotBonus: number;
    fireRateBonus: number;
    magazineBonus: number;
    reloadSpeedBonus: number;
    attackSpeedBonus: number;
    /** Faction damage multiplier as a bonus fraction, e.g. 0.3 = ×1.3. 0 if not a faction mod. */
    factionDamageBonus: number;
    /** Which faction this mod targets, e.g. "Grineer". Empty string if not a faction mod. */
    targetFaction: string;
}

export interface ModEntry {
    uniqueName: string;
    name: string;
    compatBucket: string;
    rawCompatName: string;
    polarity: string;
    rarity: string;
    drain: number;
    baseDrain: number;
    fusionLimit: number;
    statsLabel: string;
    /** Effects at each rank index 0..fusionLimit */
    effectsByRank: ModEffect[];
    /** Max-rank effect (= effectsByRank[fusionLimit]) */
    effect: ModEffect;
    hasDamageEffect: boolean;
    isAura: boolean;
    isExilus: boolean;
    triggerRestriction?: string;
}

// ---- Stat string parser ----

function stripColorTags(s: string): string {
    return s.replace(/<[^>]+>/g, "").trim();
}

function extractPercent(s: string): number | null {
    const m = s.match(/^([+-]?\d+(?:\.\d+)?)\s*%/);
    return m ? parseFloat(m[1]) / 100 : null;
}

function stripParens(s: string): string {
    return s.replace(/\s*\(.*\)$/, "").trim();
}

function parseStatLine(raw: string): Partial<ModEffect> {
    const clean = stripColorTags(raw);
    const value = extractPercent(clean);
    if (value === null) return {};

    const rest = stripParens(clean.replace(/^[+-]?\d+(?:\.\d+)?%\s*/, "").trim()).toLowerCase();

    if (rest === "damage" || rest === "melee damage") return { damageBonus: value };
    if (rest === "critical chance") return { critChanceBonus: value };
    if (rest === "critical damage" || rest === "critical multiplier") return { critMultBonus: value };
    if (rest === "status chance") return { statusChanceBonus: value };
    if (rest === "multishot") return { multishotBonus: value };
    if (rest.startsWith("fire rate")) return { fireRateBonus: value };
    if (rest === "attack speed") return { attackSpeedBonus: value };
    if (rest === "magazine capacity" || rest === "clip size") return { magazineBonus: value };
    if (rest === "reload speed") return { reloadSpeedBonus: value };
    if (rest === "heat") return { heatBonus: value };
    if (rest === "cold") return { coldBonus: value };
    if (rest === "electricity") return { electricityBonus: value };
    if (rest === "toxin") return { toxinBonus: value };
    if (rest === "magnetic") return { magneticBonus: value };
    if (rest === "radiation") return { radiationBonus: value };
    if (rest === "impact") return { impactBonus: value };
    if (rest === "puncture") return { punctureBonus: value };
    if (rest === "slash") return { slashBonus: value };
    return {};
}

/** Parse faction damage lines like "x1.3 Damage to Grineer" → factionDamageBonus=0.3, targetFaction="Grineer" */
function parseFactionLine(raw: string): Partial<ModEffect> {
    const clean = stripColorTags(raw).trim();
    const m = clean.match(/^x([\d.]+)\s+Damage\s+to\s+(.+)$/i);
    if (!m) return {};
    const multiplier = parseFloat(m[1]);
    if (!isFinite(multiplier) || multiplier <= 0) return {};
    return {
        factionDamageBonus: multiplier - 1,   // store as bonus fraction (e.g. 1.3 → 0.3)
        targetFaction: m[2].trim(),
    };
}

export function emptyEffect(): ModEffect {
    return {
        damageBonus: 0, impactBonus: 0, punctureBonus: 0, slashBonus: 0,
        heatBonus: 0, coldBonus: 0, electricityBonus: 0, toxinBonus: 0,
        magneticBonus: 0, radiationBonus: 0,
        critChanceBonus: 0, critMultBonus: 0, statusChanceBonus: 0,
        multishotBonus: 0, fireRateBonus: 0, magazineBonus: 0,
        reloadSpeedBonus: 0, attackSpeedBonus: 0,
        factionDamageBonus: 0, targetFaction: "",
    };
}

function mergeEffect(base: ModEffect, partial: Partial<ModEffect>): ModEffect {
    const out = { ...base };
    for (const k of Object.keys(partial) as (keyof ModEffect)[]) {
        if (k === "targetFaction") {
            // Keep the non-empty faction name
            const v = partial[k];
            if (v) out[k] = v;
        } else {
            (out[k] as number) = ((out[k] as number) ?? 0) + ((partial[k] as number) ?? 0);
        }
    }
    return out;
}

function hasDamageEffect(e: ModEffect): boolean {
    return Object.entries(e).some(([k, v]) =>
        k !== "targetFaction" && v !== 0
    );
}

/** Detect trigger restriction from mod name (e.g. "Semi-Rifle Cannonade" → "Semi") */
function detectTriggerRestriction(name: string): string | undefined {
    if (/^semi-/i.test(name)) return "Semi";
    return undefined;
}

// ── Weapon Exilus mod identification ─────────────────────────────────────────
// WFCD does not tag weapon exilus mods with isExilus — only Warframe mods get
// that flag. This curated set lists all known weapon exilus-compatible mods
// (those that can go in the Exilus Weapon Adapter slot).
// Source: https://warframe.wiki.com/w/Exilus_Weapon_Adapter
const WEAPON_EXILUS_NAMES = new Set([
    "Cautious Shot", "Combustion Beam", "Concealed Explosives",
    "Eagle Eye", "Embedded Catalyzer", "Empowered Quiver",
    "Guided Ordnance", "Hydraulic Crosshairs", "Lethal Momentum",
    "Magnum Force", "Ruinous Extension", "Shell Rush",
    "Silent Battery", "Sinister Reach", "Speed Trigger",
    "Stabilizer", "Steady Hands", "Tainted Mag",
    "Terminal Velocity", "Thunderbolt", "Tidal Impunity",
    "Vigilante Armaments", "Vigilante Fervor", "Vigilante Offense",
    "Vigilante Supplies", "Wildfire",
]);

interface ModCaches {
    /** Generic weapon-class mods, keyed by bucket (Rifle, Shotgun, Pistol, Bow, Sniper, Primary, Melee) */
    byBucket: Map<string, ModEntry[]>;
    /**
     * Weapon-specific augments, keyed by the rawCompatName (weapon name).
     * e.g. "Hek" → [Scattered Justice, …]
     */
    byWeaponName: Map<string, ModEntry[]>;
}

let _caches: ModCaches | null = null;

/**
 * Returns the expected canonical fusionLimit for a mod based on its name.
 * Primed, Galvanized, Umbra, and Legendary mods are rank 10.
 * All other mods are rank 5.
 * We use this to avoid picking up legacy/debug entries in All.json that share
 * a name with a standard mod but have an incorrect fusionLimit (e.g. fl=10
 * for a non-Primed mod, or fl=3 for a partial-rank variant).
 */
function expectedFusionLimit(name: string): number {
    const n = name.toLowerCase();
    if (n.startsWith("primed ") || n.startsWith("galvanized ") ||
        n.startsWith("umbra ") || n.includes("legendary ")) {
        return 10;
    }
    return 5;
}

/**
 * Score an entry for deduplication preference.
 * Higher = preferred.
 * Exact fusionLimit match to expected → 2
 * Off-by-one (e.g. fl=3 partial rank) → 1
 * Further off → 0 (worst)
 */
function dedupScore(name: string, fl: number): number {
    const expected = expectedFusionLimit(name);
    if (fl === expected) return 2;
    if (fl === 3) return 0; // partial-rank variants, always skip
    return 1;
}

function buildCaches(): ModCaches {
    // Deduplicate: keep the entry whose fusionLimit best matches the expected
    // canonical rank for that mod name. This prevents legacy fl=10 entries from
    // overriding real fl=5 standard mods (e.g. "Shotgun Barrage" 165% vs 90%).
    const bestGeneric = new Map<string, { item: Record<string, unknown>; fl: number; score: number }>();
    const bestAugment = new Map<string, { item: Record<string, unknown>; fl: number; score: number }>();

    for (const item of ALL) {
        if (item.category !== "Mods") continue;
        const rawCompat = String(item.compatName ?? "");
        const name = String(item.name ?? "");
        const fl = Number(item.fusionLimit ?? 0);
        const score = dedupScore(name, fl);

        const bucket = COMPAT_MAP[rawCompat];
        if (bucket) {
            // Generic weapon-class mod
            const key = `${name}||${bucket}`;
            const cur = bestGeneric.get(key);
            if (!cur || score > cur.score || (score === cur.score && fl > cur.fl)) {
                bestGeneric.set(key, { item, fl, score });
            }
        } else if (rawCompat && rawCompat.length >= 2 && rawCompat.length <= 30) {
            // Potential weapon-specific augment (compat name looks like a weapon name)
            // Exclude known non-weapon compats
            const skip = new Set(["ANY", "AURA", "BEAST", "COMPANION", "Archgun",
                "Archmelee", "Archwing", "Railjack", "Parazon", "Tome",
                "Assault Saw", "Gunblade", "Bayonet"]);
            if (!skip.has(rawCompat) && !/^\s*[A-Z]+\s*$/.test(rawCompat)) {
                const key = `${name}||${rawCompat}`;
                const cur = bestAugment.get(key);
                const augScore = dedupScore(name, fl);
                if (!cur || augScore > cur.score || (augScore === cur.score && fl > cur.fl)) {
                    bestAugment.set(key, { item: { ...item, _rawCompat: rawCompat }, fl, score: augScore });
                }
            }
        }
    }

    function parseEntry(item: Record<string, unknown>, bucket: string, rawCompat: string): ModEntry | null {
        const levelStats = item.levelStats as Array<{ stats: string[] }> | undefined;
        if (!levelStats || levelStats.length === 0) return null;

        const fl = Number(item.fusionLimit ?? 0);
        const rawBaseDrain = Number(item.baseDrain ?? 2);
        const drain = rawBaseDrain + fl;
        const isAura = rawCompat === "AURA" || rawBaseDrain < 0;
        // isExilus: use the WFCD flag for Warframe mods; use curated list for weapon mods
        const isExilus = !!(item.isExilus) || WEAPON_EXILUS_NAMES.has(String(item.name ?? ""));

        // Build effects at every rank 0..fusionLimit
        const effectsByRank: ModEffect[] = levelStats.map(ls => {
            let e = emptyEffect();
            for (const s of (ls.stats ?? [])) {
                e = mergeEffect(e, parseStatLine(s));
                e = mergeEffect(e, parseFactionLine(s));
            }
            return e;
        });
        // Pad up to fusionLimit if levelStats has fewer entries
        while (effectsByRank.length <= fl) {
            effectsByRank.push(effectsByRank[effectsByRank.length - 1] ?? emptyEffect());
        }
        const effect = effectsByRank[fl] ?? emptyEffect();

        const maxRankStats = levelStats[levelStats.length - 1].stats ?? [];
        const statsLabel = maxRankStats
            .map(s => stripColorTags(s))
            .filter(s => extractPercent(s) !== null)
            .join("  ·  ");

        const name = String(item.name ?? "");

        return {
            uniqueName: String(item.uniqueName ?? ""),
            name,
            compatBucket: bucket,
            rawCompatName: rawCompat,
            polarity: String(item.polarity ?? ""),
            rarity: String(item.rarity ?? ""),
            drain,
            baseDrain: rawBaseDrain,
            fusionLimit: fl,
            statsLabel,
            effectsByRank,
            effect,
            hasDamageEffect: hasDamageEffect(effect),
            isAura,
            isExilus,
            triggerRestriction: detectTriggerRestriction(name),
        };
    }

    const byBucket = new Map<string, ModEntry[]>();
    const byWeaponName = new Map<string, ModEntry[]>();

    for (const { item, fl: _ } of bestGeneric.values()) {
        const rawCompat = String(item.compatName ?? "");
        const bucket = COMPAT_MAP[rawCompat];
        if (!bucket) continue;
        const entry = parseEntry(item, bucket, rawCompat);
        if (!entry) continue;
        if (!byBucket.has(bucket)) byBucket.set(bucket, []);
        byBucket.get(bucket)!.push(entry);
    }

    for (const { item } of bestAugment.values()) {
        const rawCompat = String((item._rawCompat as string | undefined) ?? item.compatName ?? "");
        const entry = parseEntry(item, "Augment", rawCompat);
        if (!entry) continue;
        if (!byWeaponName.has(rawCompat)) byWeaponName.set(rawCompat, []);
        byWeaponName.get(rawCompat)!.push(entry);
    }

    // Sort each list alphabetically
    for (const list of byBucket.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    for (const list of byWeaponName.values()) list.sort((a, b) => a.name.localeCompare(b.name));

    return { byBucket, byWeaponName };
}

function getCaches(): ModCaches {
    if (!_caches) _caches = buildCaches();
    return _caches;
}

// ---- Public API ----

/**
 * Returns the buckets to search for a given weapon modCompat, in priority order.
 * e.g. "Sniper" weapons also accept Rifle and Primary mods.
 */
function bucketsForCompat(compat: ModCompatName): string[] {
    switch (compat) {
        case "Sniper":   return ["Sniper", "Rifle", "Primary"];
        case "Rifle":    return ["Rifle", "Primary"];
        case "Shotgun":  return ["Shotgun", "Primary"];
        // Bows accept Bow-specific mods, all Rifle mods, and universal Primary mods
        case "Bow":      return ["Bow", "Rifle", "Primary"];
        case "Pistol":   return ["Pistol"];
        case "Melee":    return ["Melee"];
    }
}

/**
 * Get all mods compatible with a weapon's modCompat category (no trigger filtering,
 * no weapon-specific augments).  Useful for generic mod browsing.
 */
export function getModsForCompat(compat: ModCompatName): ModEntry[] {
    const { byBucket } = getCaches();
    const seen = new Set<string>();
    const out: ModEntry[] = [];
    for (const bucket of bucketsForCompat(compat)) {
        for (const m of byBucket.get(bucket) ?? []) {
            if (!seen.has(m.name)) { seen.add(m.name); out.push(m); }
        }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all mods valid for a specific weapon instance:
 * - Generic compat mods for the weapon's class
 * - Trigger-restriction filtering (e.g. Cannonade only on Semi weapons)
 * - Weapon-specific augments (e.g. Scattered Justice on Hek/Vaykor Hek)
 */
export function getModsForWeapon(weapon: WeaponEntry): ModEntry[] {
    const { byWeaponName } = getCaches();
    const baseMods = getModsForCompat(weapon.modCompat);

    // Apply trigger restriction
    const trigger = weapon.trigger ?? "";
    const filtered = baseMods.filter(m =>
        !m.triggerRestriction || m.triggerRestriction === trigger
    );

    // Add weapon-specific augments where compat name is a substring of weapon name
    // (handles "Hek" matching both "Hek" and "Vaykor Hek")
    const weaponNameLower = weapon.name.toLowerCase();
    const augments: ModEntry[] = [];
    const augSeen = new Set(filtered.map(m => m.name));

    for (const [compatKey, mods] of byWeaponName.entries()) {
        const compatLower = compatKey.toLowerCase();
        if (weaponNameLower.includes(compatLower) || compatLower.includes(weaponNameLower)) {
            for (const m of mods) {
                if (!augSeen.has(m.name)) {
                    augSeen.add(m.name);
                    augments.push(m);
                }
            }
        }
    }

    const out = [...filtered];
    if (augments.length > 0) out.push(...augments.sort((a, b) => a.name.localeCompare(b.name)));
    return out;
}
