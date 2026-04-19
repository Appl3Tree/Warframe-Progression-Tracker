import { describe, expect, it } from "vitest";
import { getModsForWeapon, getStancesForWeapon } from "../catalog/modCatalog";
import { getWeaponCatalog } from "../catalog/weaponCatalog";
import ITEMS_RAW from "../../data/_generated/items-lean.auto.json";

const ITEMS = ITEMS_RAW as Record<string, {
    name?: string;
    categories?: string[];
    data?: {
        CompatibilityTags?: string[];
    };
}>;

describe("weapon catalog stance inference", () => {
    it("infers Tonbo as a Polearms weapon with available stance mods", () => {
        const tonbo = getWeaponCatalog().find(weapon =>
            weapon.uniqueName === "/Lotus/Weapons/Tenno/Melee/Polearms/FlowerPowerPolearm/FlowerPowerPolearmWep");

        expect(tonbo).toBeTruthy();
        expect(tonbo?.category).toBe("Melee");
        expect(tonbo?.stancePolarity).toBe("zenurik");
        expect(tonbo?.stanceClasses).toContain("Polearms");
        expect(getStancesForWeapon(tonbo!).length).toBeGreaterThan(0);
    });

    it("preserves Ohma tonfa compatibility from items data", () => {
        const ohma = getWeaponCatalog().find((weapon) => weapon.name === "Ohma");

        expect(ohma).toBeTruthy();
        expect(ohma?.category).toBe("Melee");
        expect(ohma?.stancePolarity).toBe("naramon");
        expect(ohma?.polarities).toEqual(["madurai", "naramon"]);
        expect(ohma?.stanceClasses).toContain("Tonfas");
        expect(new Set(getStancesForWeapon(ohma!).map((mod) => mod.name)).has("Sovereign Outcast")).toBe(true);
    });

    it("maps Heavy Scythe weapons to Heavy Scythe stance mods", () => {
        const thalys = getWeaponCatalog().find((weapon) => weapon.name === "Thalys");

        expect(thalys).toBeTruthy();
        expect(thalys?.category).toBe("Melee");
        expect(thalys?.stanceClasses).toContain("Heavy Scythe");
        expect(new Set(getStancesForWeapon(thalys!).map((mod) => mod.name)).has("Galeforce Dawn")).toBe(true);
    });

    it("includes archguns with archgun-only mod compatibility", () => {
        const mausolon = getWeaponCatalog().find((weapon) => weapon.name === "Mausolon");

        expect(mausolon).toBeTruthy();
        expect(mausolon?.category).toBe("Arch-Gun");
        expect(mausolon?.modCompat).toBe("Archgun");

        const mods = new Set(getModsForWeapon(mausolon!).map((mod) => mod.name));
        expect(mods.has("Dual Rounds")).toBe(true);
        expect(mods.has("Serration")).toBe(false);
    });

    it("classifies companion weapons by their actual mod family", () => {
        const sweeper = getWeaponCatalog().find((weapon) => weapon.name === "Sweeper");
        const deconstructor = getWeaponCatalog().find((weapon) => weapon.name === "Deconstructor");
        const akaten = getWeaponCatalog().find((weapon) => weapon.name === "Akaten");
        const hurasClaws = getWeaponCatalog().find((weapon) => weapon.name === "Huras Claws");
        const shadowClaws = getWeaponCatalog().find((weapon) => weapon.name === "Shadow Claws");
        const vulklok = getWeaponCatalog().find((weapon) => weapon.name === "Vulklok");

        expect(sweeper?.category).toBe("Companion");
        expect(sweeper?.modCompat).toBe("Shotgun");
        expect(new Set(getModsForWeapon(sweeper!).map((mod) => mod.name)).has("Hell's Chamber")).toBe(true);
        expect(new Set(getModsForWeapon(sweeper!).map((mod) => mod.name)).has("Serration")).toBe(false);
        expect(new Set(getModsForWeapon(sweeper!).map((mod) => mod.name)).has("Amalgam Shotgun Barrage")).toBe(false);

        expect(deconstructor?.category).toBe("Companion");
        expect(deconstructor?.modCompat).toBe("Melee");
        expect(getStancesForWeapon(deconstructor!).length).toBe(0);
        expect(new Set(getModsForWeapon(deconstructor!).map((mod) => mod.name)).has("Condition Overload")).toBe(true);
        expect(new Set(getModsForWeapon(deconstructor!).map((mod) => mod.name)).has("Blood Rush")).toBe(false);

        expect(akaten?.category).toBe("Companion");
        expect(akaten?.modCompat).toBe("Melee");
        expect(new Set(getModsForWeapon(akaten!).map((mod) => mod.name)).has("Pressure Point")).toBe(true);
        expect(new Set(getModsForWeapon(akaten!).map((mod) => mod.name)).has("Serration")).toBe(false);
        expect(new Set(getModsForWeapon(akaten!).map((mod) => mod.name)).has("Blood Rush")).toBe(false);

        expect(hurasClaws?.category).toBe("Companion");
        expect(hurasClaws?.modCompat).toBe("Melee");
        expect(hurasClaws?.tags).toContain("BEAST_WEAPON");
        expect(hurasClaws?.stanceClasses).toContain("Claws");
        expect(hurasClaws?.stancePolarity).toBe("penjaga");
        expect(new Set(getStancesForWeapon(hurasClaws!).map((mod) => mod.name))).toEqual(new Set([
            "Assassin Posture",
            "Balanced Posture",
            "Elusive Posture",
            "Frenzied Posture",
            "Persistent Posture",
            "Protector Posture",
        ]));
        expect(new Set(getModsForWeapon(hurasClaws!).map((mod) => mod.name)).has("Burning Claws")).toBe(true);
        expect(new Set(getModsForWeapon(hurasClaws!).map((mod) => mod.name)).has("Shocking Claws")).toBe(true);
        expect(new Set(getModsForWeapon(hurasClaws!).map((mod) => mod.name)).has("Maul")).toBe(true);
        expect(new Set(getModsForWeapon(hurasClaws!).map((mod) => mod.name)).has("Mecha Overdrive")).toBe(true);
        expect(new Set(getModsForWeapon(hurasClaws!).map((mod) => mod.name)).has("Pressure Point")).toBe(false);
        expect(new Set(getModsForWeapon(hurasClaws!).map((mod) => mod.name)).has("Condition Overload")).toBe(false);

        expect(new Set(getModsForWeapon(hurasClaws!).map((mod) => mod.name)).has("Swipe")).toBe(false);
        expect(new Set(getModsForWeapon(getWeaponCatalog().find((weapon) => weapon.name === "Smeeta Claws")!).map((mod) => mod.name)).has("Swipe")).toBe(true);

        expect(new Set(getModsForWeapon(shadowClaws!).map((mod) => mod.name)).has("Burning Claws")).toBe(false);

        expect(vulklok?.category).toBe("Companion");
        expect(vulklok?.modCompat).toBe("Sniper");
        expect(new Set(getModsForWeapon(vulklok!).map((mod) => mod.name)).has("Split Chamber")).toBe(true);
        expect(new Set(getModsForWeapon(vulklok!).map((mod) => mod.name)).has("Charged Chamber")).toBe(true);
    });

    it("resolves every non-exalted melee weapon with explicit stance tags to at least one stance mod", () => {
        const weaponsByPath = new Map(getWeaponCatalog().map((weapon) => [weapon.uniqueName, weapon]));
        const failures: Array<{ name: string; path: string; tags: string[] }> = [];

        for (const [path, item] of Object.entries(ITEMS)) {
            if (!item.categories?.includes("melee")) continue;
            const tags = item.data?.CompatibilityTags?.filter((tag) => tag.includes("STANCE")) ?? [];
            if (tags.length === 0) continue;

            const weapon = weaponsByPath.get(path);
            if (!weapon || weapon.isExalted) continue;

            if (getStancesForWeapon(weapon).length === 0) {
                failures.push({
                    name: weapon.name,
                    path,
                    tags,
                });
            }
        }

        expect(failures).toEqual([]);
    });
});
