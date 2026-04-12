import { describe, expect, it } from "vitest";
import { getWeaponCatalog } from "../weaponCatalog";
import {
    getIncarnonRecordForWeapon,
    resolveIncarnonState,
} from "../incarnonCatalog";

describe("incarnonCatalog", () => {
    it("finds records for Incarnon Genesis variants and native Incarnons", () => {
        const weapons = getWeaponCatalog();
        const telosBoltor = weapons.find((weapon) => weapon.name === "Telos Boltor") ?? null;
        const phenmor = weapons.find((weapon) => weapon.name === "Phenmor") ?? null;
        const thalys = weapons.find((weapon) => weapon.name === "Thalys") ?? null;

        expect(telosBoltor).toBeTruthy();
        expect(phenmor).toBeTruthy();
        expect(thalys).toBeTruthy();
        expect(getIncarnonRecordForWeapon(telosBoltor)?.kind).toBe("genesis");
        expect(getIncarnonRecordForWeapon(phenmor)?.kind).toBe("native");
        expect(getIncarnonRecordForWeapon(thalys)?.tiers.some((tier) => tier.tier === 1)).toBe(true);
    });

    it("applies static Incarnon stat adjustments to the selected weapon", () => {
        const weapons = getWeaponCatalog();
        const bratonPrime = weapons.find((weapon) => weapon.name === "Braton Prime");
        expect(bratonPrime).toBeTruthy();

        const resolved = resolveIncarnonState(bratonPrime!, 0, {
            unlockedTier: 4,
            selectedOptionsByTier: {
                4: "tier-4-critical-parallel",
            },
        });

        expect(resolved.weapon.attacks[0]?.critChance).toBeCloseTo(0.3, 5);
        expect(resolved.weapon.attacks[0]?.critMultiplier).toBeCloseTo(2.2, 5);
    });

    it("does not auto-apply an evolution when no tier is selected", () => {
        const weapons = getWeaponCatalog();
        const bratonPrime = weapons.find((weapon) => weapon.name === "Braton Prime");
        expect(bratonPrime).toBeTruthy();

        const resolved = resolveIncarnonState(bratonPrime!, 0, {
            unlockedTier: 5,
            selectedOptionsByTier: {},
        });

        expect(resolved.appliedOptions).toHaveLength(0);
        expect(resolved.activeEffects).toHaveLength(0);
        expect(resolved.weapon.attacks[0]?.critChance).toBeCloseTo(bratonPrime!.attacks[0]?.critChance ?? 0, 5);
    });

    it("surfaces modeled Incarnon perk effects for optimizer scoring", () => {
        const weapons = getWeaponCatalog();
        const phenmor = weapons.find((weapon) => weapon.name === "Phenmor");
        expect(phenmor).toBeTruthy();

        const resolved = resolveIncarnonState(phenmor!, 0, {
            unlockedTier: 2,
            selectedOptionsByTier: {
                2: "tier-2-rapid-wrath",
            },
        });

        expect(resolved.activeEffects.some((effect) => effect.fireRateBonus === 0.2)).toBe(true);
    });
});
