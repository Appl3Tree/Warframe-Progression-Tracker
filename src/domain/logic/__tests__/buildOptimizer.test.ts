import { describe, expect, it } from "vitest";
import { getArcanesByWeaponCategory } from "../../catalog/arcaneCatalog";
import { getModsForWeapon, getStancesForWeapon } from "../../catalog/modCatalog";
import { getWeaponCatalog } from "../../catalog/weaponCatalog";
import type { WeaponEntry } from "../../catalog/weaponCatalog";
import { emptyEffect } from "../../catalog/modCatalog";
import { debugScoreBuild, optimizeBuild } from "../buildOptimizer";
import { computeCapacity } from "../capacityCalc";
import { calculateBuild } from "../damageCalc";

function makeWeapon(overrides: Partial<WeaponEntry> = {}): WeaponEntry {
    return {
        uniqueName: "/Test/Weapon",
        name: "Test Weapon",
        category: "Primary",
        weaponType: "Rifle",
        modCompat: "Rifle",
        damage: {
            total: 100,
            impact: 10,
            puncture: 20,
            slash: 30,
            heat: 0,
            cold: 0,
            electricity: 0,
            toxin: 40,
            blast: 0,
            radiation: 0,
            gas: 0,
            magnetic: 0,
            viral: 0,
            corrosive: 0,
            void: 0,
            tau: 0,
            true: 0,
        },
        critChance: 0.2,
        critMultiplier: 2,
        statusChance: 0.45,
        fireRate: 8,
        magazineSize: 40,
        hasExplicitMagazineSize: true,
        reloadTime: 3.2,
        multishot: 1,
        trigger: "Auto",
        chargeTime: null,
        polarities: [],
        canOverLevel: false,
        baseSlotCount: 8,
        disposition: 1,
        attacks: [],
        tags: [],
        ...overrides,
    };
}

function countFormaLikeUi(
    weapon: WeaponEntry,
    slotPolarities: string[],
    stancePolarity: string,
    exilusPolarity: string,
): number {
    const defaultCounts = new Map<string, number>();
    const currentCounts = new Map<string, number>();
    const addCount = (map: Map<string, number>, polarity: string) => {
        if (!polarity) return;
        map.set(polarity, (map.get(polarity) ?? 0) + 1);
    };
    for (const polarity of weapon.polarities) addCount(defaultCounts, polarity);
    addCount(defaultCounts, weapon.stancePolarity ?? "");
    for (const polarity of slotPolarities) addCount(currentCounts, polarity);
    addCount(currentCounts, stancePolarity);
    addCount(currentCounts, exilusPolarity);
    let changes = 0;
    const allKeys = new Set([...defaultCounts.keys(), ...currentCounts.keys()]);
    for (const key of allKeys) {
        const extra = (currentCounts.get(key) ?? 0) - (defaultCounts.get(key) ?? 0);
        if (extra > 0) changes += extra;
    }
    return changes;
}

describe("build optimizer scoring", () => {
    it("prefers front-loaded direct damage for burst over ramping status packages", () => {
        const weapon = makeWeapon({
            fireRate: 10,
            magazineSize: 50,
            reloadTime: 4.5,
            critChance: 0.3,
            statusChance: 0.35,
        });

        const directPackage = {
            ...emptyEffect(),
            damageBonus: 1.4,
            multishotBonus: 1.1,
            critChanceBonus: 0.9,
            critMultBonus: 0.9,
        };
        const rampPackage = {
            ...emptyEffect(),
            statusChanceBonus: 1.2,
            statusDamageBonus: 0.9,
            toxinBonus: 0.9,
            finalStatusChanceBonus: 0.25,
            directDamagePerStatusBonus: 0.45,
        };

        const directBurst = debugScoreBuild(weapon, [directPackage], "burst", "grineer");
        const rampBurst = debugScoreBuild(weapon, [rampPackage], "burst", "grineer");

        expect(directBurst).toBeGreaterThan(rampBurst);
    });

    it("counts stacked conditional damage-per-status bonuses for scaling", () => {
        const weapon = makeWeapon({
            statusChance: 0.55,
            fireRate: 12,
            magazineSize: 70,
        });

        const primerPackage = {
            ...emptyEffect(),
            statusChanceBonus: 1.2,
            toxinBonus: 0.9,
            multishotBonus: 0.6,
        };
        const oneStack = {
            ...emptyEffect(),
            conditionalEffects: [{
                trigger: "onKill" as const,
                durationSeconds: 20,
                requiresAiming: false,
                maxStacks: 1,
                stats: { directDamagePerStatusBonus: 0.4 },
            }],
        };
        const threeStacks = {
            ...emptyEffect(),
            conditionalEffects: [{
                trigger: "onKill" as const,
                durationSeconds: 20,
                requiresAiming: false,
                maxStacks: 3,
                stats: { directDamagePerStatusBonus: 0.4 },
            }],
        };

        const oneStackScore = debugScoreBuild(weapon, [primerPackage, oneStack], "scaling", "grineer");
        const threeStackScore = debugScoreBuild(weapon, [primerPackage, threeStacks], "scaling", "grineer");

        expect(threeStackScore).toBeGreaterThan(oneStackScore);
    });

    it("treats magnetic as favored against corpus and radiation as resisted", () => {
        const weapon = makeWeapon({
            damage: {
                total: 100,
                impact: 0,
                puncture: 0,
                slash: 0,
                heat: 0,
                cold: 0,
                electricity: 0,
                toxin: 0,
                blast: 0,
                radiation: 0,
                gas: 0,
                magnetic: 0,
                viral: 0,
                corrosive: 0,
                void: 0,
                tau: 0,
                true: 0,
            },
            statusChance: 0,
            critChance: 0,
            critMultiplier: 1,
        });

        const magneticPackage = { ...emptyEffect(), magneticBonus: 1 };
        const radiationPackage = { ...emptyEffect(), radiationBonus: 1 };

        const magneticScore = debugScoreBuild(weapon, [magneticPackage], "burst", "corpus");
        const radiationScore = debugScoreBuild(weapon, [radiationPackage], "burst", "corpus");

        expect(magneticScore).toBeGreaterThan(radiationScore);
    });

    it("does not award radiation confusion utility against ungrouped corpus targets", () => {
        const weapon = makeWeapon({
            damage: {
                total: 100,
                impact: 0,
                puncture: 0,
                slash: 0,
                heat: 0,
                cold: 0,
                electricity: 0,
                toxin: 0,
                blast: 0,
                radiation: 0,
                gas: 0,
                magnetic: 0,
                viral: 0,
                corrosive: 0,
                void: 0,
                tau: 0,
                true: 0,
            },
            statusChance: 0.8,
            critChance: 0,
            critMultiplier: 1,
            fireRate: 12,
        });

        const radiationPackage = { ...emptyEffect(), radiationBonus: 1 };
        const heatPackage = { ...emptyEffect(), heatBonus: 1 };

        const radiationScore = debugScoreBuild(weapon, [radiationPackage], "scaling", "corpus");
        const heatScore = debugScoreBuild(weapon, [heatPackage], "scaling", "corpus");

        expect(heatScore).toBeGreaterThan(radiationScore);
    });

    it("treats magnetic as resisted and toxin as favored against narmer", () => {
        const weapon = makeWeapon({
            damage: {
                total: 100,
                impact: 0,
                puncture: 0,
                slash: 0,
                heat: 0,
                cold: 0,
                electricity: 0,
                toxin: 0,
                blast: 0,
                radiation: 0,
                gas: 0,
                magnetic: 0,
                viral: 0,
                corrosive: 0,
                void: 0,
                tau: 0,
                true: 0,
            },
            statusChance: 0,
            critChance: 0,
            critMultiplier: 1,
        });

        const magneticPackage = { ...emptyEffect(), magneticBonus: 1 };
        const toxinPackage = { ...emptyEffect(), toxinBonus: 1 };

        const magneticScore = debugScoreBuild(weapon, [magneticPackage], "burst", "narmer");
        const toxinScore = debugScoreBuild(weapon, [toxinPackage], "burst", "narmer");

        expect(toxinScore).toBeGreaterThan(magneticScore);
    });

    it("prefers the bane/crit acceltra prime scaling build over the magnetic variant against grineer", () => {
        const weapon = getWeaponCatalog().find(w => w.name === "Acceltra Prime");
        expect(weapon).toBeTruthy();
        const attack = weapon!.attacks[1];
        expect(attack).toBeTruthy();

        const scoringWeapon = {
            ...weapon!,
            damage: attack.damage,
            critChance: attack.critChance,
            critMultiplier: attack.critMultiplier,
            statusChance: attack.statusChance,
            fireRate: attack.speed || weapon!.fireRate,
            chargeTime: attack.chargeTime ?? null,
        };

        const mods = getModsForWeapon(weapon!);
        const byName = (name: string) => mods.find(m => m.name === name)!;
        const arcane = getArcanesByWeaponCategory(weapon!.category).find(a => a.name === "Primary Merciless");
        const arcaneEffect = arcane?.optimizerEffectByRank[5] ?? arcane?.permanentEffectByRank[5] ?? null;

        const magneticBuild = [
            "Malignant Force",
            "Primed Cryo Rounds",
            "Galvanized Aptitude",
            "Hellfire",
            "Galvanized Chamber",
            "Magnetic Capacity",
            "Galvanized Scope",
            "Vital Sense",
        ].map(byName);

        const baneBuild = [
            "Malignant Force",
            "Primed Cryo Rounds",
            "Galvanized Aptitude",
            "Hellfire",
            "Galvanized Chamber",
            "Critical Delay",
            "Primed Bane Of Grineer",
            "Vital Sense",
        ].map(byName);

        const magneticScore = debugScoreBuild(scoringWeapon, magneticBuild.map(mod => mod.effect), "scaling", "Grineer", arcaneEffect);
        const baneScore = debugScoreBuild(scoringWeapon, baneBuild.map(mod => mod.effect), "scaling", "Grineer", arcaneEffect);

        expect(baneScore).toBeGreaterThan(magneticScore);
    });

    it("reuses built-in polarities, reserves room for exilus, and avoids frozen-only arcanes for War scaling", () => {
        const weapon = getWeaponCatalog().find(w => w.name === "War");
        expect(weapon).toBeTruthy();

        const stance = getStancesForWeapon(weapon!).find(mod => mod.name === "Cleaving Whirlwind");
        expect(stance).toBeTruthy();

        const result = optimizeBuild(weapon!, null, "scaling", 8, {
            targetFaction: "Grineer",
            capacityConfig: {
                weaponRank: 30,
                hasCatalyst: true,
                masteryRank: 22,
                canOverLevel: weapon!.canOverLevel,
            },
            slotPolarities: weapon!.polarities,
            defaultSlotPolarities: weapon!.polarities,
            allowCatalyst: true,
            allowForma: true,
            optimizeExilus: true,
            exilusPolarity: "",
            optimizeArcane: true,
            buildForAttack: weapon!.attacks[0],
            extraCapacitySlots: [{
                mod: stance!,
                rank: stance!.fusionLimit,
                polarity: weapon!.stancePolarity ?? "",
            }],
        });

        expect(result.exilusMod).toBeTruthy();
        expect(result.arcane?.name).not.toBe("Melee Careen");
        expect(
            result.slots.some((mod, index) =>
                !!mod && result.slotPolarities[index] === "naramon" && mod.polarity === "naramon"),
        ).toBe(true);
        expect(
            countFormaLikeUi(weapon!, result.slotPolarities, weapon!.stancePolarity ?? "", result.exilusPolarity),
        ).toBeLessThanOrEqual(5);
    });

    it("only considers exilus-eligible mods for exilus and avoids movement-only no-op picks when better utility exists", () => {
        const weapon = getWeaponCatalog().find(w => w.name === "Acceltra Prime");
        expect(weapon).toBeTruthy();

        const result = optimizeBuild(weapon!, null, "scaling", 8, {
            targetFaction: "Grineer",
            capacityConfig: {
                weaponRank: 30,
                hasCatalyst: true,
                masteryRank: 22,
                canOverLevel: weapon!.canOverLevel,
            },
            slotPolarities: weapon!.polarities,
            defaultSlotPolarities: weapon!.polarities,
            allowCatalyst: true,
            allowForma: true,
            optimizeExilus: true,
            exilusPolarity: "",
            optimizeArcane: true,
            buildForAttack: weapon!.attacks[0],
        });

        expect(result.exilusMod).toBeTruthy();
        expect(result.exilusMod?.isExilus).toBe(true);
        expect(result.exilusMod?.name).not.toBe("Aerial Ace");
        expect((result.exilusMod?.statsLabel ?? "").toLowerCase()).not.toContain("double jump");
    });

    it("respects the configured max forma cap during optimization", () => {
        const weapon = getWeaponCatalog().find(w => w.name === "War");
        expect(weapon).toBeTruthy();

        const stance = getStancesForWeapon(weapon!).find(mod => mod.name === "Cleaving Whirlwind");
        expect(stance).toBeTruthy();

        const result = optimizeBuild(weapon!, null, "scaling", 8, {
            targetFaction: "Grineer",
            capacityConfig: {
                weaponRank: 30,
                hasCatalyst: true,
                masteryRank: 22,
                canOverLevel: weapon!.canOverLevel,
            },
            slotPolarities: weapon!.polarities,
            defaultSlotPolarities: weapon!.polarities,
            allowCatalyst: true,
            allowForma: true,
            maxFormaCount: 1,
            optimizeExilus: true,
            exilusPolarity: "",
            optimizeArcane: true,
            buildForAttack: weapon!.attacks[0],
            extraCapacitySlots: [{
                mod: stance!,
                rank: stance!.fusionLimit,
                polarity: weapon!.stancePolarity ?? "",
            }],
        });

        expect(
            countFormaLikeUi(weapon!, result.slotPolarities, weapon!.stancePolarity ?? "", result.exilusPolarity),
        ).toBeLessThanOrEqual(1);
    });

    it("keeps respected-capacity acceltra builds within capacity and avoids toxin-only arcanes on viral setups", () => {
        const weapon = getWeaponCatalog().find(w => w.name === "Acceltra Prime");
        expect(weapon).toBeTruthy();

        const result = optimizeBuild(weapon!, null, "burst", 8, {
            targetFaction: "Grineer",
            capacityConfig: {
                weaponRank: 30,
                hasCatalyst: true,
                masteryRank: 22,
                canOverLevel: weapon!.canOverLevel,
            },
            slotPolarities: weapon!.polarities,
            defaultSlotPolarities: weapon!.polarities,
            allowCatalyst: true,
            allowForma: true,
            maxFormaCount: 2,
            optimizeExilus: true,
            exilusPolarity: "",
            optimizeArcane: true,
            buildForAttack: weapon!.attacks[0],
        });

        const capacity = computeCapacity(
            {
                weaponRank: 30,
                hasCatalyst: true,
                masteryRank: 22,
                canOverLevel: weapon!.canOverLevel,
            },
            [...result.slotPolarities.map(polarity => ({ polarity })), { polarity: result.exilusPolarity }],
            [...result.slots, result.exilusMod],
            [...result.slotRanks, result.exilusMod ? result.exilusRank : 0],
        );

        expect(capacity.overCapacity).toBe(false);
        expect(result.arcane?.name).not.toBe("Primary Blight");
    });
});

describe("damage calculation ramp interactions", () => {
    it("lets per-hit crit scaling benefit from added multishot", () => {
        const weapon = makeWeapon({
            critChance: 0.12,
            magazineSize: 80,
            fireRate: 14,
        });

        const baseRamp = {
            ...emptyEffect(),
            perHitCritChanceBonus: 0.015,
        };
        const withMultishot = {
            ...baseRamp,
            multishotBonus: 1,
        };

        const baseResult = calculateBuild(weapon, [baseRamp]);
        const multishotResult = calculateBuild(weapon, [withMultishot]);

        expect(multishotResult.modded.critChance).toBeGreaterThan(baseResult.modded.critChance);
    });

    it("lets next-magazine status scaling build stacks faster with multishot", () => {
        const weapon = makeWeapon({
            statusChance: 0.2,
            magazineSize: 12,
            fireRate: 6,
        });

        const nextMagRamp = {
            ...emptyEffect(),
            nextMagazineStatusChancePerShot: 0.08,
            nextMagazineMaxStacks: 10,
        };
        const nextMagRampWithMultishot = {
            ...nextMagRamp,
            multishotBonus: 1,
        };

        const baseResult = calculateBuild(weapon, [nextMagRamp]);
        const multishotResult = calculateBuild(weapon, [nextMagRampWithMultishot]);

        expect(multishotResult.modded.statusChance).toBeGreaterThan(baseResult.modded.statusChance);
    });
});
