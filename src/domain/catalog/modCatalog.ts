// src/domain/catalog/modCatalog.ts
// Parses weapon mod data from All.json into structured ModEntry objects.

import ALL_RAW from "../../data/All.json";
import type { ModCompatName } from "./weaponCatalog";

const ALL = ALL_RAW as Record<string, unknown>[];

// The set of generic weapon compat categories we care about.
// Excludes weapon-specific augments, warframe mods, etc.
const WEAPON_COMPATS = new Set<string>([
    "Rifle", "Shotgun", "Pistol", "Bow", "Melee",
    // Assault Rifle / Sniper / etc. are treated as Rifle for our purposes
    "Assault Rifle", "Sniper Rifle", "Sniper",
]);

export interface ModEffect {
    /** General damage multiplier — additive with other damage mods */
    damageBonus: number;
    impactBonus: number;
    punctureBonus: number;
    slashBonus: number;
    /** Elemental damage — expressed as % of base damage */
    heatBonus: number;
    coldBonus: number;
    electricityBonus: number;
    toxinBonus: number;
    magneticBonus: number;
    radiationBonus: number;
    /** Crit / status */
    critChanceBonus: number;
    critMultBonus: number;
    statusChanceBonus: number;
    /** Multishot / rate / mag */
    multishotBonus: number;
    fireRateBonus: number;
    magazineBonus: number;
    reloadSpeedBonus: number;
    /** Melee-specific attack speed (treated like fireRate) */
    attackSpeedBonus: number;
}

export interface ModEntry {
    uniqueName: string;
    name: string;
    /** "Rifle" | "Shotgun" | "Pistol" | "Bow" | "Melee" (normalised) */
    compatName: ModCompatName;
    polarity: string;
    rarity: string;
    /** Drain at max rank (baseDrain + fusionLimit) */
    drain: number;
    fusionLimit: number;
    /** Human-readable summary of max-rank stats */
    statsLabel: string;
    effect: ModEffect;
    /** True if this mod has any damage-relevant effects */
    hasDamageEffect: boolean;
}

// ---- Stat string parser ----

function stripColorTags(s: string): string {
    return s.replace(/<[^>]+>/g, "").trim();
}

/** Extract leading signed number (interpreted as fraction, e.g. "+165%" → 1.65) */
function extractPercent(s: string): number | null {
    const m = s.match(/^([+-]?\d+(?:\.\d+)?)\s*%/);
    return m ? parseFloat(m[1]) / 100 : null;
}

/** Strip trailing parenthetical annotation like "(x2 for Bows)" */
function stripParens(s: string): string {
    return s.replace(/\s*\(.*\)$/, "").trim();
}

function parseStatLine(raw: string): Partial<ModEffect> {
    const clean = stripColorTags(raw);
    const value = extractPercent(clean);
    if (value === null) return {};

    // Text after the leading "±N% " portion
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

function emptyEffect(): ModEffect {
    return {
        damageBonus: 0, impactBonus: 0, punctureBonus: 0, slashBonus: 0,
        heatBonus: 0, coldBonus: 0, electricityBonus: 0, toxinBonus: 0,
        magneticBonus: 0, radiationBonus: 0,
        critChanceBonus: 0, critMultBonus: 0, statusChanceBonus: 0,
        multishotBonus: 0, fireRateBonus: 0, magazineBonus: 0,
        reloadSpeedBonus: 0, attackSpeedBonus: 0,
    };
}

function mergeEffect(base: ModEffect, partial: Partial<ModEffect>): ModEffect {
    const out = { ...base };
    for (const k of Object.keys(partial) as (keyof ModEffect)[]) {
        out[k] = (out[k] ?? 0) + (partial[k] ?? 0);
    }
    return out;
}

function hasDamageEffect(e: ModEffect): boolean {
    return (
        e.damageBonus !== 0 || e.critChanceBonus !== 0 || e.critMultBonus !== 0 ||
        e.statusChanceBonus !== 0 || e.multishotBonus !== 0 || e.fireRateBonus !== 0 ||
        e.attackSpeedBonus !== 0 || e.magazineBonus !== 0 || e.reloadSpeedBonus !== 0 ||
        e.heatBonus !== 0 || e.coldBonus !== 0 || e.electricityBonus !== 0 ||
        e.toxinBonus !== 0 || e.impactBonus !== 0 || e.punctureBonus !== 0 ||
        e.slashBonus !== 0 || e.magneticBonus !== 0 || e.radiationBonus !== 0
    );
}

/** Normalise compatName to our canonical set */
function normaliseCompat(raw: string): ModCompatName | null {
    const t = raw.trim();
    if (t === "Rifle" || t === "Assault Rifle" || t === "Sniper Rifle" || t === "Sniper") return "Rifle";
    if (t === "Shotgun") return "Shotgun";
    if (t === "Pistol") return "Pistol";
    if (t === "Bow") return "Bow";
    if (t === "Melee") return "Melee";
    return null;
}

// ---- Public API ----

/** Map from (name+compat) → best version (highest fusionLimit) */
let _cache: Map<ModCompatName, ModEntry[]> | null = null;

function buildCache(): Map<ModCompatName, ModEntry[]> {
    // Dedup key: keep highest-fusionLimit entry per (name, compat)
    const best = new Map<string, { entry: Record<string, unknown>; fl: number }>();

    for (const item of ALL) {
        if (item.category !== "Mods") continue;
        const rawCompat = String(item.compatName ?? "");
        if (!WEAPON_COMPATS.has(rawCompat)) continue;
        const compat = normaliseCompat(rawCompat);
        if (!compat) continue;
        const name = String(item.name ?? "");
        const fl = Number(item.fusionLimit ?? 0);
        const key = `${name}||${compat}`;
        const cur = best.get(key);
        if (!cur || fl > cur.fl) best.set(key, { entry: item, fl });
    }

    const byCompat = new Map<ModCompatName, ModEntry[]>();
    const compats: ModCompatName[] = ["Rifle", "Shotgun", "Pistol", "Bow", "Melee"];
    for (const c of compats) byCompat.set(c, []);

    for (const { entry } of best.values()) {
        const rawCompat = String(entry.compatName ?? "");
        const compat = normaliseCompat(rawCompat)!;
        const levelStats = entry.levelStats as Array<{ stats: string[] }> | undefined;
        if (!levelStats || levelStats.length === 0) continue;

        const maxRankStats = levelStats[levelStats.length - 1].stats ?? [];
        let effect = emptyEffect();
        for (const s of maxRankStats) {
            effect = mergeEffect(effect, parseStatLine(s));
        }

        const fl = Number(entry.fusionLimit ?? 0);
        const drain = Number(entry.baseDrain ?? 2) + fl;

        // Stats label: join stripped, de-colored strings
        const statsLabel = maxRankStats
            .map(s => stripColorTags(s))
            .filter(s => extractPercent(s) !== null)
            .join("  ·  ");

        const modEntry: ModEntry = {
            uniqueName: String(entry.uniqueName ?? ""),
            name: String(entry.name ?? ""),
            compatName: compat,
            polarity: String(entry.polarity ?? ""),
            rarity: String(entry.rarity ?? ""),
            drain,
            fusionLimit: fl,
            statsLabel,
            effect,
            hasDamageEffect: hasDamageEffect(effect),
        };

        byCompat.get(compat)!.push(modEntry);
    }

    // Sort each compat list alphabetically
    for (const list of byCompat.values()) {
        list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return byCompat;
}

function getCache(): Map<ModCompatName, ModEntry[]> {
    if (!_cache) _cache = buildCache();
    return _cache;
}

/**
 * Get all mods compatible with the given weapon compat category.
 * Bow weapons accept both Bow mods AND Rifle mods.
 */
export function getModsForCompat(compat: ModCompatName): ModEntry[] {
    const cache = getCache();
    if (compat === "Bow") {
        // Bow-specific mods + Rifle mods that also apply
        const bow = cache.get("Bow") ?? [];
        const rifle = cache.get("Rifle") ?? [];
        const seen = new Set<string>();
        const out: ModEntry[] = [];
        for (const m of [...bow, ...rifle]) {
            if (!seen.has(m.name)) { seen.add(m.name); out.push(m); }
        }
        return out.sort((a, b) => a.name.localeCompare(b.name));
    }
    return cache.get(compat) ?? [];
}
