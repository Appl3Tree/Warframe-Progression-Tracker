// src/domain/catalog/arcaneCatalog.ts
// Parses weapon arcane data from All.json.
// Weapon arcanes: Primary *, Secondary *, Melee * prefixes.
// Each has 6 ranks (0–5). Rank 5 = max.

import ALL_RAW from "../../data/_generated/warframe-items-all-lean.auto.json";
import type { WeaponCategory } from "./weaponCatalog";
import { emptyEffect, type ConditionalEffect, type ConditionalTrigger, type ModEffect } from "./modCatalog";

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
    /** Effects used by the optimizer, including stacked conditional bonuses where parseable. */
    optimizerEffectByRank: Partial<ModEffect>[];
}

function stripColorTags(s: string): string {
    return s.replace(/<[^>]+>/g, "").trim();
}

function addEffect(effect: Partial<ModEffect>, partial: Partial<ModEffect>) {
    for (const [k, v] of Object.entries(partial) as [keyof ModEffect, number][]) {
        if (k === "conditionalEffects") {
            effect.conditionalEffects = [...(effect.conditionalEffects ?? []), ...((v as unknown as ConditionalEffect[]) ?? [])];
            continue;
        }
        (effect[k] as number) = ((effect[k] as number) ?? 0) + v;
    }
}

function parsePercentStatSegment(segment: string, scale = 1): Partial<ModEffect> {
    const stripped = segment.replace(/^[^+-\d]*([+-]?\d)/, "$1");
    const m = stripped.match(/^([+-]?\d+(?:\.\d+)?)%\s*(.+)/);
    if (!m) return {};
    const value = (parseFloat(m[1]) / 100) * scale;
    const rest = m[2].toLowerCase().trim();
    if (rest.includes("reload speed")) return { reloadSpeedBonus: value };
    if (rest.includes("critical chance")) return { critChanceBonus: value };
    if (rest.includes("critical damage") || rest.includes("critical multiplier")) return { critMultBonus: value };
    if (rest.includes("weak point damage")) return { weakPointDamageBonus: value };
    if (rest.includes("weak point critical chance")) return { weakPointCritChanceBonus: value };
    if (rest.includes("headshot multiplier")) return { headshotMultiplierBonus: value };
    if (rest.includes("damage") && !rest.includes("headshot")) return { damageBonus: value };
    if (rest.includes("status chance")) return { statusChanceBonus: value };
    if (rest.includes("multishot")) return { multishotBonus: value };
    if (rest.includes("fire rate")) return { fireRateBonus: value };
    if (rest.includes("ammo efficiency")) return { ammoEfficiencyBonus: value };
    if (rest.includes("combo duration")) return { comboDurationBonus: value };
    if (rest.includes("heat damage")) return { heatBonus: value };
    if (rest.includes("cold damage")) return { coldBonus: value };
    if (rest.includes("toxin damage")) return { toxinBonus: value };
    if (rest.includes("gas damage")) return { gasBonus: value };
    if (rest.includes("corrosive damage")) return { corrosiveBonus: value };
    if (rest.includes("magnetic damage")) return { magneticBonus: value };
    return {};
}

function parseMultiplierStatSegment(segment: string, scale = 1): Partial<ModEffect> {
    const clean = stripColorTags(segment).replace(/\\n/g, " ").trim();
    if (/\bagainst\b/i.test(clean)) return {};
    const damageMatch = clean.match(/^x([\d.]+)\s+.*damage/i);
    if (damageMatch) return { damageBonus: (parseFloat(damageMatch[1]) - 1) * scale };
    return {};
}

function parsePermanentEffect(statLine: string): Partial<ModEffect> {
    const clean = stripColorTags(statLine).replace(/\\n/g, " ").trim();
    const stackMatch = clean.match(/stacks?\s+up\s+to\s+(\d+)x/i);
    const stackMult = stackMatch ? Math.max(1, Number(stackMatch[1])) : 1;
    const effect: Partial<ModEffect> = {};

    // Parse all percent-based clauses, including combined lines like
    // "+3% Critical Damage and +2.25% Multishot".
    const percentSegments = clean.match(/[+-]?\d+(?:\.\d+)?%\s*[^+]+?(?=(?:\s+and\s+[+-]?\d|\s*\|\s*|$))/gi) ?? [];
    for (const segment of percentSegments) addEffect(effect, parsePercentStatSegment(segment, stackMult));

    // Parse multiplier-based lines like "x2.50 Melee Damage..." and x8 damage effects.
    const multiplierSegments = clean.match(/x[\d.]+\s+[^|]+/gi) ?? [];
    for (const segment of multiplierSegments) addEffect(effect, parseMultiplierStatSegment(segment, stackMult));

    return effect;
}

function explodeArcaneLines(raw: string): string[] {
    const clean = stripColorTags(raw).replace(/\\n/g, "\n");
    const lines = clean.split(/\n+/).map(line => line.trim()).filter(Boolean);
    const out: string[] = [];
    let currentTriggerPrefix = "";
    for (const line of lines) {
        if (/^(On |When |If |Gain )[^:]+:\s*$/i.test(line)) {
            currentTriggerPrefix = line;
            continue;
        }
        if (/^(On |When |If |Gain )[^:]+:/i.test(line)) {
            currentTriggerPrefix = line.replace(/^(((?:On |When |If |Gain )[^:]+:)).*$/i, "$1");
        }
        if (currentTriggerPrefix && !/^(On |When |If |Gain )[^:]+:/i.test(line)) out.push(`${currentTriggerPrefix} ${line}`.trim());
        else out.push(line);
    }
    return out;
}

function dedupeDisplaySegments(segments: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const segment of segments) {
        const key = segment.replace(/\s+/g, " ").trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(segment);
    }
    return out;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildArcaneDisplayParts(rawStats: string[]) {
    const cleaned = dedupeDisplaySegments(rawStats.map(s => stripColorTags(s).replace(/\\n/g, " ").trim()));
    const baseLines: string[] = [];
    const procLines: string[] = [];
    for (const line of cleaned) {
        if (/^(On |While |Gain |If |Enemies|Kill|When|Deals)/i.test(line)) procLines.push(line);
        else baseLines.push(line);
    }
    const normalizedProcLines = dedupeDisplaySegments(
        procLines
            .map((line) => {
                let next = line;
                for (const baseLine of baseLines) {
                    if (next.toLowerCase() === baseLine.toLowerCase()) continue;
                    if (!next.toLowerCase().includes(baseLine.toLowerCase())) continue;
                    next = next
                        .replace(new RegExp(`(?:\\s*[|·]\\s*)?${escapeRegExp(baseLine)}`, "i"), "")
                        .replace(/\s{2,}/g, " ")
                        .replace(/\s+\.\s*$/g, ".")
                        .trim();
                }
                return next;
            })
            .filter(Boolean),
    );
    return {
        cleaned,
        baseLines: dedupeDisplaySegments(baseLines),
        procLines: normalizedProcLines,
        combined: [...dedupeDisplaySegments(baseLines), ...normalizedProcLines].filter(Boolean),
    };
}

function parseArcaneConditionalEffect(line: string): Partial<ModEffect> {
    const clean = stripColorTags(line).replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
    const match = clean.match(/^(On Reload From Empty|On Reload|On Precision Headshot Kill|On Headshot Kill|On Weak Point Hit|On Weak Point Kill|On Melee Kill|On Kill or Assist|On Kill|On Base Critical Hits|On Ability Cast|On [A-Za-z ]+ Status Effect|On Weapon [A-Za-z ]+ Status Effect|When [^:]+|If [^:]+|Gain):\s*(.+)$/i);
    if (!match) return {};

    const triggerRaw = match[1].toLowerCase();
    const body = match[2].trim();
    const durationMatch = body.match(/\bfor\s+(\d+(?:\.\d+)?)s\b/i);
    const durationSeconds = durationMatch ? parseFloat(durationMatch[1]) : 0;
    const stackMatch = body.match(/\bstacks?\s+up\s+to\s+(\d+)x\b/i);
    const maxStacks = stackMatch ? Math.max(1, Number(stackMatch[1])) : 1;
    const requiresAiming = /\bwhen aiming\b|\bwhile aiming\b/i.test(body);

    let trigger: ConditionalTrigger | null = null;
    let requiredStatusType: ConditionalEffect["requiredStatusType"];
    if (triggerRaw === "on kill") trigger = "onKill";
    else if (triggerRaw === "on headshot kill" || triggerRaw === "on precision headshot kill") trigger = "onHeadshotKill";
    else if (triggerRaw === "on melee kill") trigger = "onMeleeKill";
    else if (triggerRaw === "on weak point hit") trigger = "onWeakPointHit";
    else if (triggerRaw === "on weak point kill") trigger = "onWeakPointKill";
    else if (triggerRaw === "on kill or assist") trigger = "onKillOrAssist";
    else if (triggerRaw === "on base critical hits") trigger = "onHit";
    else if (triggerRaw === "on reload") trigger = "onReload";
    else if (triggerRaw === "on reload from empty") trigger = "onReloadFromEmpty";
    else if (triggerRaw === "on ability cast") trigger = "onHit";
    else if (triggerRaw.startsWith("on ") && triggerRaw.includes("status effect")) {
        trigger = "onHit";
        const statusMatch = triggerRaw.match(/on weapon ([a-z]+) status effect|on ([a-z]+) status effect/i);
        const statusType = (statusMatch?.[1] ?? statusMatch?.[2] ?? "").toLowerCase();
        if (statusType) {
            requiredStatusType = statusType as ConditionalEffect["requiredStatusType"];
        }
    }
    else if (triggerRaw.startsWith("when ") || triggerRaw === "gain" || triggerRaw.startsWith("if ")) trigger = "onHit";
    if (!trigger) return {};

    const effect = emptyEffect();
    const percentSegments = body.match(/[+-]?\d+(?:\.\d+)?%\s*[^+]+?(?=(?:\s+and\s+[+-]?\d|\s*$))/gi) ?? [];
    for (const segment of percentSegments) addEffect(effect, parsePercentStatSegment(segment));

    const conditionalStats: ConditionalEffect["stats"] = {};
    const keys: (keyof ConditionalEffect["stats"])[] = [
        "damageBonus", "critChanceBonus", "critMultBonus", "statusChanceBonus", "multishotBonus",
        "fireRateBonus", "reloadSpeedBonus", "ammoEfficiencyBonus", "headshotMultiplierBonus" as never,
        "weakPointDamageBonus", "weakPointCritChanceBonus", "heatBonus", "coldBonus", "toxinBonus",
        "gasBonus", "magneticBonus", "corrosiveBonus",
    ].filter(Boolean) as (keyof ConditionalEffect["stats"])[];
    for (const key of keys) {
        const value = effect[key as keyof ModEffect] as number | undefined;
        if (value && value !== 0) (conditionalStats as Record<string, number>)[key] = value;
    }
    if (Object.keys(conditionalStats).length === 0) return {};

    return {
        conditionalEffects: [{ trigger, durationSeconds, requiresAiming, maxStacks, requiredStatusType, stats: conditionalStats }],
    };
}

function sanitizeConditionalEffect(
    partial: Partial<ModEffect>,
    permanent: Partial<ModEffect>,
): Partial<ModEffect> {
    const conditionalEffects = partial.conditionalEffects ?? [];
    if (!conditionalEffects.length) return partial;
    return {
        ...partial,
        conditionalEffects: conditionalEffects
            .map((conditional) => {
                const stats = { ...conditional.stats };
                for (const [key, value] of Object.entries(stats)) {
                    const permanentValue = permanent[key as keyof ModEffect] as number | undefined;
                    if (permanentValue != null && Math.abs(permanentValue - value) < 1e-9) {
                        delete stats[key as keyof typeof stats];
                    }
                }
                return { ...conditional, stats };
            })
            .filter((conditional) => Object.keys(conditional.stats).length > 0),
    };
}

function parseArcaneStats(levelStats: Array<{ stats: string[] }>): {
    statsByRank: string[];
    statsLabel: string;
    baseBonus: string;
    procBonus: string;
    permanentEffectByRank: Partial<ModEffect>[];
    optimizerEffectByRank: Partial<ModEffect>[];
} {
    const maxStats = levelStats[levelStats.length - 1]?.stats ?? [];
    const maxDisplay = buildArcaneDisplayParts(maxStats);

    // Parse permanent effects at each rank
    const permanentEffectByRank: Partial<ModEffect>[] = levelStats.map(ls => {
        const effect: Partial<ModEffect> = {};
        for (const s of (ls.stats ?? [])) {
            const clean = stripColorTags(s).replace(/\\n/g, " ").trim();
            if (/^(On |While |Gain |If |Enemies|Kill|When|Deals)/i.test(clean)) continue;
            const parsed = parsePermanentEffect(s);
            for (const [k, v] of Object.entries(parsed) as [keyof ModEffect, number][]) {
                (effect[k] as number) = ((effect[k] as number) ?? 0) + v;
            }
        }
        return effect;
    });

    const optimizerEffectByRank: Partial<ModEffect>[] = levelStats.map(ls => {
        const effect: Partial<ModEffect> = emptyEffect();
        const permanent: Partial<ModEffect> = {};
        for (const s of (ls.stats ?? [])) {
            const clean = stripColorTags(s).replace(/\\n/g, " ").trim();
            if (/^(On |While |Gain |If |Enemies|Kill|When|Deals)/i.test(clean)) continue;
            addEffect(permanent, parsePermanentEffect(s));
        }
        for (const s of (ls.stats ?? [])) {
            for (const line of explodeArcaneLines(s)) {
                const clean = stripColorTags(line).replace(/\\n/g, " ").trim();
                if (/^(On |While |Gain |If |Enemies|Kill|When|Deals)/i.test(clean)) {
                    addEffect(effect, sanitizeConditionalEffect(parseArcaneConditionalEffect(line), permanent));
                } else {
                    addEffect(effect, parsePermanentEffect(line));
                }
            }
        }
        return effect;
    });

    return {
        statsByRank: levelStats.map(ls =>
            buildArcaneDisplayParts(ls.stats ?? []).combined.join(" | "),
        ),
        statsLabel: maxDisplay.combined.join(" · "),
        baseBonus: maxDisplay.baseLines.join(" · "),
        procBonus: maxDisplay.procLines.join(" · "),
        permanentEffectByRank,
        optimizerEffectByRank,
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
