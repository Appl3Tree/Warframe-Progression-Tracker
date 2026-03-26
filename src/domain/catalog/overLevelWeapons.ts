// src/domain/catalog/overLevelWeapons.ts
//
// Overlevel weapons are weapons that can exceed the standard rank 30 cap.
// They require the player to reach rank 40 (via 5x Forma) to count as mastered.
// Because the affinity needed varies with each Forma cycle, their mastery cannot be
// determined from XP alone — players must confirm mastery manually.
//
// Affected weapon families: Kuva Lich, Tenet, Technocyte Coda, Paracesis.

import PRIMARY_RAW from "../../../external/warframe-items/raw/Primary.json";
import SECONDARY_RAW from "../../../external/warframe-items/raw/Secondary.json";
import ALL_RAW from "../../../external/warframe-items/raw/All.json";

const OVERLEVEL_NAME_PREFIXES = ["Kuva ", "Tenet ", "Coda ", "Dual Coda "];
const OVERLEVEL_EXACT_NAMES = new Set(["Paracesis"]);

const _wfdata = {
    primary:   { items: PRIMARY_RAW as any[] },
    secondary: { items: SECONDARY_RAW as any[] },
    melee:     { items: (ALL_RAW as any[]).filter((i: any) => i.category === "Melee") },
};

function buildOverLevelWeaponPaths(): Set<string> {
    const paths = new Set<string>();

    for (const cat of ["primary", "secondary", "melee"] as const) {
        const items: any[] = _wfdata[cat]?.items ?? [];
        for (const item of items) {
            const name = String(item?.name ?? "");
            const path = String(item?.uniqueName ?? "");
            if (!path) continue;

            if (
                OVERLEVEL_NAME_PREFIXES.some((p) => name.startsWith(p)) ||
                OVERLEVEL_EXACT_NAMES.has(name)
            ) {
                paths.add(path);
            }
        }
    }

    return paths;
}

/** Set of Lotus paths for all overlevel weapons (Kuva/Tenet/Coda/Paracesis). */
export const OVERLEVEL_WEAPON_PATHS: Set<string> = buildOverLevelWeaponPaths();

/** Returns true if the given Lotus path is an overlevel weapon (rank 40 cap). */
export function isOverLevelWeapon(path: string): boolean {
    return OVERLEVEL_WEAPON_PATHS.has(path);
}
