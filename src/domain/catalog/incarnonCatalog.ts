import INCARNON_RAW from "../../data/_generated/incarnon-evolutions.auto.json";
import type { WeaponAttack, WeaponDamage, WeaponEntry } from "./weaponCatalog";
import { emptyEffect, type ConditionalEffect, type ModEffect } from "./modCatalog";

export type IncarnonTier = 1 | 2 | 3 | 4 | 5;
export type IncarnonAttackScope = "all" | "normal" | "incarnon";

type RawIncarnonOption = {
    id: string;
    name: string;
    descriptionLines: string[];
    notes: string[];
};

type RawIncarnonTier = {
    tier: number;
    options: RawIncarnonOption[];
};

type RawIncarnonRecord = {
    weaponName: string;
    familyName: string;
    sourcePage: string;
    kind: "genesis" | "native";
    tiers: RawIncarnonTier[];
};

type ScopedWeaponAdjustment = {
    scope: IncarnonAttackScope;
    baseDamageFlat?: number;
    critChanceFlat?: number;
    critMultiplierFlat?: number;
    statusChanceFlat?: number;
    magazineSizeFlat?: number;
};

type ScopedEffect = {
    scope: IncarnonAttackScope;
    effect: ModEffect;
};

export interface IncarnonOptionModel {
    adjustments: ScopedWeaponAdjustment[];
    effects: ScopedEffect[];
    unsupportedLines: string[];
    modeledLineCount: number;
}

export interface IncarnonOption {
    id: string;
    name: string;
    descriptionLines: string[];
    notes: string[];
    model: IncarnonOptionModel;
}

export interface IncarnonTierEntry {
    tier: IncarnonTier;
    options: IncarnonOption[];
}

export interface IncarnonWeaponRecord {
    weaponName: string;
    familyName: string;
    sourcePage: string;
    kind: "genesis" | "native";
    tiers: IncarnonTierEntry[];
}

export interface IncarnonBuildConfig {
    unlockedTier: number;
    selectedOptionsByTier: Partial<Record<IncarnonTier, string>>;
}

export interface ResolvedIncarnonState {
    record: IncarnonWeaponRecord | null;
    appliedOptions: IncarnonOption[];
    weapon: WeaponEntry;
    activeEffects: ModEffect[];
}

const RAW_RECORDS = INCARNON_RAW as RawIncarnonRecord[];

function normalize(value: string) {
    return String(value ?? "").trim().toLowerCase();
}

function isIncarnonAttack(attack: Pick<WeaponAttack, "name">) {
    return /incarnon/i.test(String(attack.name ?? ""));
}

function attackMatchesScope(attack: Pick<WeaponAttack, "name">, scope: IncarnonAttackScope) {
    if (scope === "all") return true;
    const incarnon = isIncarnonAttack(attack);
    return scope === "incarnon" ? incarnon : !incarnon;
}

function cloneDamage(damage: WeaponDamage): WeaponDamage {
    return { ...damage };
}

function positiveDamageKeys(damage: WeaponDamage) {
    return (Object.keys(damage) as Array<keyof WeaponDamage>).filter((key) => key !== "total" && (damage[key] ?? 0) > 0);
}

function applyBaseDamageFlat(damage: WeaponDamage, amount: number): WeaponDamage {
    if (!amount) return damage;
    const keys = positiveDamageKeys(damage);
    if (!keys.length) return damage;
    const total = keys.reduce((sum, key) => sum + (damage[key] ?? 0), 0);
    if (total <= 0) return damage;

    const next = cloneDamage(damage);
    for (const key of keys) {
        const share = (damage[key] ?? 0) / total;
        next[key] = (next[key] ?? 0) + amount * share;
    }
    next.total = (next.total ?? total) + amount;
    return next;
}

function scopeForLine(line: string, notes: string[]): IncarnonAttackScope {
    const text = normalize(`${line} ${notes.join(" ")}`);
    if (
        text.includes("only affects incarnon form") ||
        text.includes("affects only incarnon form") ||
        /for incarnon form\b/.test(text)
    ) {
        return "incarnon";
    }
    if (
        text.includes("does not affect incarnon form") ||
        text.includes("only affects untransformed") ||
        text.includes("affects untransformed") ||
        text.includes("only untransformed")
    ) {
        return "normal";
    }
    return "all";
}

function triggerFromLine(line: string): ConditionalEffect["trigger"] | null {
    const normalized = normalize(line);
    if (normalized.startsWith("on reload from empty:")) return "onReloadFromEmpty";
    if (normalized.startsWith("on reload:")) return "onReload";
    if (normalized.startsWith("on headshot kill:")) return "onHeadshotKill";
    if (normalized.startsWith("on weakpoint kill:")) return "onWeakPointKill";
    if (normalized.startsWith("on consecutive weakpoint hits:")) return "onWeakPointHit";
    if (normalized.startsWith("on weakpoint hits:")) return "onWeakPointHit";
    if (normalized.startsWith("on weakpoint hit:")) return "onWeakPointHit";
    if (normalized.startsWith("on punch through hit:")) return "onPunchThroughHit";
    if (normalized.startsWith("on kill:")) return "onKill";
    if (normalized.startsWith("on 2 headshots within 2 seconds:")) return "onHeadshot";
    if (normalized.startsWith("on headshot:")) return "onHeadshot";
    return null;
}

function durationFromLine(line: string) {
    const match = line.match(/\bfor\s+(\d+(?:\.\d+)?)\s*seconds?\b/i);
    return match ? Number(match[1]) : 0;
}

function maxStacksFromLine(line: string) {
    const match = line.match(/\bstacks?\s+up\s+to\s+(\d+)(?:x)?\b/i);
    return match ? Number(match[1]) : 1;
}

function pushEffect(target: ScopedEffect[], scope: IncarnonAttackScope, patch: Partial<ModEffect>) {
    if (!Object.keys(patch).length) return;
    const existing = target.find((entry) => entry.scope === scope);
    if (existing) {
        Object.assign(existing.effect, {
            ...existing.effect,
            ...Object.fromEntries(
                Object.entries(patch).map(([key, value]) => [key, (existing.effect as any)[key] + (value ?? 0)]),
            ),
        });
        return;
    }
    const effect = emptyEffect();
    Object.assign(effect, patch);
    target.push({ scope, effect });
}

function pushAdjustment(target: ScopedWeaponAdjustment[], scope: IncarnonAttackScope, patch: Omit<ScopedWeaponAdjustment, "scope">) {
    if (!Object.keys(patch).length) return;
    const existing = target.find((entry) => entry.scope === scope);
    if (existing) {
        for (const [key, value] of Object.entries(patch)) {
            (existing as any)[key] = ((existing as any)[key] ?? 0) + (value ?? 0);
        }
        return;
    }
    target.push({ scope, ...patch });
}

function conditionalPatch(trigger: ConditionalEffect["trigger"], durationSeconds: number, maxStacks: number, stats: ConditionalEffect["stats"]): Partial<ModEffect> {
    return {
        conditionalEffects: [{
            trigger,
            durationSeconds,
            requiresAiming: false,
            maxStacks,
            stats,
        }],
    };
}

function parsePercent(value: string) {
    return Number(value) / 100;
}

function parseCritMultiplierPercent(value: string) {
    return Number(value) / 100;
}

function buildOptionModel(option: RawIncarnonOption): IncarnonOptionModel {
    const adjustments: ScopedWeaponAdjustment[] = [];
    const effects: ScopedEffect[] = [];
    const unsupportedLines: string[] = [];
    let modeledLineCount = 0;

    const allNotes = option.notes ?? [];

    for (const rawLine of option.descriptionLines ?? []) {
        const line = rawLine.trim();
        if (!line) continue;

        const scope = scopeForLine(line, allNotes);
        const trigger = triggerFromLine(line);
        const statsLine = trigger ? line.replace(/^On [^:]+:\s*/i, "") : line;
        const additiveNoteText = normalize(`${statsLine} ${allNotes.join(" ")}`);

        const addStaticEffect = (patch: Partial<ModEffect>) => {
            pushEffect(effects, scope, patch);
            modeledLineCount += 1;
        };
        const addConditionalEffect = (stats: ConditionalEffect["stats"]) => {
            if (!trigger) {
                unsupportedLines.push(line);
                return;
            }
            addStaticEffect(conditionalPatch(trigger, durationFromLine(line), maxStacksFromLine(line), stats));
        };
        const addAdjustment = (patch: Omit<ScopedWeaponAdjustment, "scope">) => {
            pushAdjustment(adjustments, scope, patch);
            modeledLineCount += 1;
        };

        let matched = true;
        if (/increase base damage by [+-]?\d+(?:\.\d+)?/i.test(statsLine) && !trigger && !/^with\b/i.test(statsLine)) {
            const match = statsLine.match(/increase base damage by ([+-]?\d+(?:\.\d+)?)/i);
            addAdjustment({ baseDamageFlat: Number(match?.[1] ?? 0) });
        } else if (/increase base critical chance by [+-]?\d+(?:\.\d+)?%/i.test(statsLine)) {
            const match = statsLine.match(/increase base critical chance by ([+-]?\d+(?:\.\d+)?)%/i);
            addAdjustment({ critChanceFlat: parsePercent(match?.[1] ?? "0") });
        } else if (/increase base critical damage multiplier by [+-]?\d+(?:\.\d+)?x/i.test(statsLine)) {
            const match = statsLine.match(/increase base critical damage multiplier by ([+-]?\d+(?:\.\d+)?)x/i);
            addAdjustment({ critMultiplierFlat: Number(match?.[1] ?? 0) });
        } else if (/increase base status chance by [+-]?\d+(?:\.\d+)?%/i.test(statsLine)) {
            const match = statsLine.match(/increase base status chance by ([+-]?\d+(?:\.\d+)?)%/i);
            addAdjustment({ statusChanceFlat: parsePercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*fire rate/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*fire rate/i);
            trigger ? addConditionalEffect({ fireRateBonus: parsePercent(match?.[1] ?? "0") }) : addStaticEffect({ fireRateBonus: parsePercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*projectile speed/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*projectile speed/i);
            trigger ? addConditionalEffect({ projectileSpeedBonus: parsePercent(match?.[1] ?? "0") }) : addStaticEffect({ projectileSpeedBonus: parsePercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*reload speed/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*reload speed/i);
            trigger ? addConditionalEffect({ reloadSpeedBonus: parsePercent(match?.[1] ?? "0") }) : addStaticEffect({ reloadSpeedBonus: parsePercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*accuracy/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*accuracy/i);
            trigger ? addConditionalEffect({ accuracyBonus: parsePercent(match?.[1] ?? "0") }) : addStaticEffect({ accuracyBonus: parsePercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*multishot/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*multishot/i);
            trigger ? addConditionalEffect({ multishotBonus: parsePercent(match?.[1] ?? "0") }) : addStaticEffect({ multishotBonus: parsePercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*ammo efficiency/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*ammo efficiency/i);
            trigger ? addConditionalEffect({ ammoEfficiencyBonus: parsePercent(match?.[1] ?? "0") }) : addStaticEffect({ ammoEfficiencyBonus: parsePercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?\s*punch through/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)\s*punch through/i);
            trigger ? addConditionalEffect({ punchThrough: Number(match?.[1] ?? 0) }) : addStaticEffect({ punchThrough: Number(match?.[1] ?? 0) });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*magazine capacity/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*magazine capacity/i);
            trigger ? addConditionalEffect({ magazineBonus: parsePercent(match?.[1] ?? "0") }) : addStaticEffect({ magazineBonus: parsePercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?\s*magazine capacity/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)\s*magazine capacity/i);
            addAdjustment({ magazineSizeFlat: Number(match?.[1] ?? 0) });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*headshot damage/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*headshot damage/i);
            trigger ? addConditionalEffect({ headshotMultiplierBonus: parsePercent(match?.[1] ?? "0") }) : addStaticEffect({ headshotMultiplierBonus: parsePercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*critical damage/i.test(statsLine) && /flat value|added after mods/i.test(additiveNoteText)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*critical damage/i);
            trigger
                ? addConditionalEffect({ finalCritMultiplierBonus: parseCritMultiplierPercent(match?.[1] ?? "0") })
                : addStaticEffect({ finalCritMultiplierBonus: parseCritMultiplierPercent(match?.[1] ?? "0") });
        } else if (/[+-]?\d+(?:\.\d+)?%\s*critical chance/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*critical chance/i);
            const value = parsePercent(match?.[1] ?? "0");
            if (/flat value|added after mods/i.test(additiveNoteText)) {
                trigger ? addConditionalEffect({ finalCritChanceBonus: value }) : addStaticEffect({ finalCritChanceBonus: value });
            } else {
                trigger ? addConditionalEffect({ critChanceBonus: value }) : addStaticEffect({ critChanceBonus: value });
            }
        } else if (/[+-]?\d+(?:\.\d+)?%\s*status chance/i.test(statsLine)) {
            const match = statsLine.match(/([+-]?\d+(?:\.\d+)?)%\s*status chance/i);
            const value = parsePercent(match?.[1] ?? "0");
            if (/flat value|added after mods|added last/i.test(additiveNoteText)) {
                trigger ? addConditionalEffect({ finalStatusChanceBonus: value }) : addStaticEffect({ finalStatusChanceBonus: value });
            } else {
                trigger ? addConditionalEffect({ statusChanceBonus: value }) : addStaticEffect({ statusChanceBonus: value });
            }
        } else {
            matched = false;
        }

        if (!matched) unsupportedLines.push(line);
    }

    return {
        adjustments,
        effects,
        unsupportedLines,
        modeledLineCount,
    };
}

const RECORDS: IncarnonWeaponRecord[] = RAW_RECORDS.map((record) => ({
    weaponName: record.weaponName,
    familyName: record.familyName,
    sourcePage: record.sourcePage,
    kind: record.kind,
    tiers: record.tiers
        .filter((tier): tier is RawIncarnonTier & { tier: IncarnonTier } => tier.tier >= 1 && tier.tier <= 5)
        .map((tier) => ({
            tier: tier.tier,
            options: tier.options.map((option) => ({
                ...option,
                model: buildOptionModel(option),
            })),
        })),
}));

const RECORDS_BY_NAME = new Map(RECORDS.map((record) => [normalize(record.weaponName), record]));

export function getIncarnonRecordForWeapon(weapon: WeaponEntry | string | null | undefined): IncarnonWeaponRecord | null {
    const name = typeof weapon === "string" ? weapon : weapon?.name;
    if (!name) return null;
    return RECORDS_BY_NAME.get(normalize(name)) ?? null;
}

export function getDefaultIncarnonUnlockedTier(record: IncarnonWeaponRecord | null) {
    if (!record) return 0;
    return record.kind === "native" ? 5 : 0;
}

export function getDefaultIncarnonSelections(record: IncarnonWeaponRecord | null): Partial<Record<IncarnonTier, string>> {
    if (!record) return {};
    return Object.fromEntries(
        record.tiers
            .filter((tier) => tier.options.length > 0)
            .map((tier) => [tier.tier, tier.options[0].id]),
    ) as Partial<Record<IncarnonTier, string>>;
}

function applyScopedAdjustmentToAttack(attack: WeaponAttack, adjustment: ScopedWeaponAdjustment) {
    let next: WeaponAttack = { ...attack };
    if (adjustment.baseDamageFlat) {
        const damage = applyBaseDamageFlat(next.damage, adjustment.baseDamageFlat);
        next = { ...next, damage, damageTotal: damage.total };
    }
    if (adjustment.critChanceFlat) next = { ...next, critChance: next.critChance + adjustment.critChanceFlat };
    if (adjustment.critMultiplierFlat) next = { ...next, critMultiplier: next.critMultiplier + adjustment.critMultiplierFlat };
    if (adjustment.statusChanceFlat) next = { ...next, statusChance: next.statusChance + adjustment.statusChanceFlat };
    return next;
}

function syncWeaponTopLevelFromAttack(weapon: WeaponEntry, attacks: WeaponAttack[]) {
    const first = attacks[0];
    if (!first) return weapon;
    return {
        ...weapon,
        attacks,
        damage: first.damage,
        critChance: first.critChance,
        critMultiplier: first.critMultiplier,
        statusChance: first.statusChance,
        magazineSize: weapon.magazineSize,
    };
}

function activeScopeForSelectedAttack(weapon: WeaponEntry, selectedAttackIdx: number): IncarnonAttackScope {
    const selectedAttack = weapon.attacks[selectedAttackIdx] ?? weapon.attacks[0];
    return selectedAttack && isIncarnonAttack(selectedAttack) ? "incarnon" : "normal";
}

export function resolveIncarnonState(
    weapon: WeaponEntry,
    selectedAttackIdx: number,
    config: IncarnonBuildConfig,
): ResolvedIncarnonState {
    const record = getIncarnonRecordForWeapon(weapon);
    if (!record) {
        return { record, appliedOptions: [], weapon, activeEffects: [] };
    }
    const selectedTierIds = Object.values(config.selectedOptionsByTier ?? {}).filter(Boolean);
    if (!selectedTierIds.length) {
        return { record, appliedOptions: [], weapon, activeEffects: [] };
    }

    const selectedScope = activeScopeForSelectedAttack(weapon, selectedAttackIdx);
    const appliedOptions: IncarnonOption[] = [];
    let nextWeapon: WeaponEntry = { ...weapon, attacks: weapon.attacks.map((attack) => ({ ...attack, damage: { ...attack.damage } })) };
    const activeEffects: ModEffect[] = [];

    for (const tier of record.tiers) {
        const selectedId = config.selectedOptionsByTier[tier.tier];
        if (!selectedId) continue;
        const option = tier.options.find((entry) => entry.id === selectedId);
        if (!option) continue;
        appliedOptions.push(option);

        let attacks = nextWeapon.attacks.map((attack) => ({ ...attack, damage: { ...attack.damage } }));
        for (const adjustment of option.model.adjustments) {
            attacks = attacks.map((attack) =>
                attackMatchesScope(attack, adjustment.scope) ? applyScopedAdjustmentToAttack(attack, adjustment) : attack,
            );
            if (adjustment.scope === "normal" && adjustment.magazineSizeFlat) {
                nextWeapon = { ...nextWeapon, magazineSize: nextWeapon.magazineSize + adjustment.magazineSizeFlat };
            }
        }
        nextWeapon = syncWeaponTopLevelFromAttack(nextWeapon, attacks);

        for (const scopedEffect of option.model.effects) {
            if (scopedEffect.scope !== "all" && scopedEffect.scope !== selectedScope) continue;
            activeEffects.push(scopedEffect.effect);
        }
    }

    return { record, appliedOptions, weapon: nextWeapon, activeEffects };
}
