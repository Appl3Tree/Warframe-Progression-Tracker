// src/catalog/items/isTrackablePath.ts
//
// Trackable scope gate for the catalog.
// v1: only items we can reasonably model as farmable / earnable right now.
// We intentionally exclude cosmetics, UI defs, enemies, etc.
// As we expand scope later, we relax these rules.

const EXCLUDE_PREFIXES: readonly string[] = [
    // Cosmetics mega-buckets (NOT tracking yet)
    "/Lotus/Upgrades/Skins/",

    // Store defs are mostly cosmetics/palettes/glyphs/etc. for now
    "/Lotus/Types/StoreItems/",

    // Not player inventory items
    "/Lotus/Types/Enemies/",
    "/Lotus/Types/Challenges/",
    "/Lotus/Interface/Graphics/",

    // Decorations / social / vanity (NOT tracking yet)
    "/Lotus/Types/Items/ShipDecos/",
    "/Lotus/Types/Items/Emotes/",
    "/Lotus/Types/Items/Titles/",
    "/Lotus/Types/Items/SongItems/",
    "/Lotus/Types/Items/PhotoBooth/",

    // Genetics / cosmetics for pets (NOT tracking yet)
    "/Lotus/Types/Game/KubrowPet/",
    "/Lotus/Types/Game/CatbrowPet/",

    // Wildlife avatars (not inventory)
    "/Lotus/Types/NeutralCreatures/",
];

function isExcluded(path: string): boolean {
    for (const p of EXCLUDE_PREFIXES) {
        if (path.startsWith(p)) return true;
    }
    return false;
}

export function isTrackablePath(path: string): boolean {
    if (isExcluded(path)) return false;

    // Trackable buckets (v1)
    if (path.startsWith("/Lotus/Powersuits/")) return true;                 // Warframes, Archwings, etc.
    if (path.startsWith("/Lotus/Weapons/")) return true;                    // Weapons
    if (path.startsWith("/Lotus/Upgrades/Mods/")) return true;              // Mods
    if (path.startsWith("/Lotus/Upgrades/CosmeticEnhancers/")) return true;  // Arcanes
    if (path.startsWith("/Lotus/Types/Game/Projections/")) return true;      // Relics
    if (path.startsWith("/Lotus/Types/Restoratives/")) return true;          // Gear (mostly earnable/craftable)
    if (path.startsWith("/Lotus/Types/Sentinels/")) return true;             // Sentinels + precepts
    if (path.startsWith("/Lotus/Types/Friendly/")) return true;              // Pets + pet weapons + precepts

    // NOTE:
    // /Lotus/Types/Items/* includes a lot of “stuff”, but also huge noise buckets (decorations etc.).
    // We’ll enable resource tracking later with a dedicated allowlist.

    return false;
}

export function getTrackableExclusionPrefixes(): readonly string[] {
    return EXCLUDE_PREFIXES;
}
