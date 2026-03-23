// src/domain/catalog/arcaneCatalog.ts
// Parses weapon arcane data from All.json.
// Weapon arcanes: Primary *, Secondary *, Melee * prefixes.
// Each has 6 ranks (0–5). Rank 5 = max.

import ALL_RAW from "../../data/All.json";
import type { WeaponCategory } from "./weaponCatalog";
import type { ModEffect } from "./modCatalog";

const ALL = ALL_RAW as Record<string, unknown>[];

export type ArcaneWeaponType = "Primary" | "Secondary" | "Melee";

export interface ArcaneEntry {
    uniqueName: string;
    name: string;
    rarity: string;
    weaponType: ArcaneWeaponType;
    maxRank: number;
    /** Display text for each rank 0..maxRank */
    statsByRank: string[];
    /** Max-rank stats as a combined display string */
    statsLabel: string;
    /** Base (non-conditional) bonus at max rank, e.g. "+30% Reload Speed" */
    baseBonus: string;
    /** Conditional/proc bonus text at max rank */
    procBonus: string;
    /**
     * Parsed permanent (non-conditional) stat bonuses at each rank.
     * Index = rank (0..maxRank). Used to apply arcane stats to calculations.
     */
    permanentEffectByRank: Partial<ModEffect>[];
}

function stripColorTags(s: string): string {
    return s.replace(/<[^>]+>/g, "").trim();
}

function parsePermanentEffect(statLine: string): Partial<ModEffect> {
    const clean = stripColorTags(statLine).replace(/\\n/g, " ").trim();
    // Skip conditional lines
    if (/^(On |While |Gain |If |Enemies|Kill|When|Deals|Deal)/i.test(clean)) return {};
    const m = clean.match(/^([+-]?\d+(?:\.\d+)?)%\s*(.+)/);
    if (!m) return {};
    const value = parseFloat(m[1]) / 100;
    const rest = m[2].toLowerCase().trim();
    if (rest.includes("reload speed")) return { reloadSpeedBonus: value };
    if (rest.includes("critical chance")) return { critChanceBonus: value };
    if (rest.includes("critical damage") || rest.includes("critical multiplier")) return { critMultBonus: value };
    if (rest.includes("damage") && !rest.includes("headshot")) return { damageBonus: value };
    if (rest.includes("status chance")) return { statusChanceBonus: value };
    if (rest.includes("multishot")) return { multishotBonus: value };
    if (rest.includes("fire rate")) return { fireRateBonus: value };
    return {};
}

function parseArcaneStats(levelStats: Array<{ stats: string[] }>): {
    statsByRank: string[];
    statsLabel: string;
    baseBonus: string;
    procBonus: string;
    permanentEffectByRank: Partial<ModEffect>[];
} {
    const statsByRank = levelStats.map(ls =>
        (ls.stats ?? []).map(s => stripColorTags(s).replace(/\\n/g, " ")).join(" | ")
    );

    const maxStats = levelStats[levelStats.length - 1]?.stats ?? [];
    const cleaned = maxStats.map(s => stripColorTags(s).replace(/\\n/g, " "));

    const baseLines: string[] = [];
    const procLines: string[] = [];
    for (const line of cleaned) {
        if (/^(On |While |Gain |If |Enemies|Kill|When|Deals)/i.test(line)) {
            procLines.push(line);
        } else {
            baseLines.push(line);
        }
    }

    // Parse permanent effects at each rank
    const permanentEffectByRank: Partial<ModEffect>[] = levelStats.map(ls => {
        const effect: Partial<ModEffect> = {};
        for (const s of (ls.stats ?? [])) {
            const parsed = parsePermanentEffect(s);
            for (const [k, v] of Object.entries(parsed) as [keyof ModEffect, number][]) {
                (effect[k] as number) = ((effect[k] as number) ?? 0) + v;
            }
        }
        return effect;
    });

    return {
        statsByRank,
        statsLabel: cleaned.join(" · "),
        baseBonus: baseLines.join(" · "),
        procBonus: procLines.join(" · "),
        permanentEffectByRank,
    };
}

function getWeaponType(name: string): ArcaneWeaponType | null {
    if (name.startsWith("Primary "))   return "Primary";
    if (name.startsWith("Secondary ")) return "Secondary";
    if (name.startsWith("Melee "))     return "Melee";
    return null;
}

let _cache: ArcaneEntry[] | null = null;

export function getArcaneCatalog(): ArcaneEntry[] {
    if (_cache) return _cache;
    const out: ArcaneEntry[] = [];

    for (const item of ALL) {
        if (item.category !== "Arcanes") continue;
        const name = String(item.name ?? "");
        const weaponType = getWeaponType(name);
        if (!weaponType) continue;

        const levelStats = item.levelStats as Array<{ stats: string[] }> | undefined;
        if (!levelStats || levelStats.length === 0) continue;

        const parsed = parseArcaneStats(levelStats);

        out.push({
            uniqueName: String(item.uniqueName ?? ""),
            name,
            rarity: String(item.rarity ?? ""),
            weaponType,
            maxRank: levelStats.length - 1,
            ...parsed,
        });
    }

    out.sort((a, b) => a.name.localeCompare(b.name));
    _cache = out;
    return out;
}

export function getArcanesByWeaponCategory(cat: WeaponCategory): ArcaneEntry[] {
    const map: Record<WeaponCategory, ArcaneWeaponType> = {
        Primary: "Primary", Secondary: "Secondary", Melee: "Melee",
    };
    return getArcaneCatalog().filter(a => a.weaponType === map[cat]);
}
