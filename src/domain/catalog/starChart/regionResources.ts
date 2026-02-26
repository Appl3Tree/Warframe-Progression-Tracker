// ===== FILE: src/domain/catalog/starChart/regionResources.ts =====

export type RegionResourceRarity = "Common" | "Uncommon" | "Rare";

export type RegionResource = {
    name: string;
    rarity: RegionResourceRarity;
};

/**
 * Canonical keys here are the in-game region names (as shown to the player).
 * You can also look up via planetId/regionId using getRegionResourcesForPlanet().
 */
export const REGION_RESOURCES_BY_REGION: Record<string, RegionResource[]> = {
    Mercury: [
        { name: "Ferrite", rarity: "Common" },
        { name: "Polymer Bundle", rarity: "Uncommon" },
        { name: "Detonite Ampule", rarity: "Uncommon" },
        { name: "Morphics", rarity: "Rare" }
    ],
    Venus: [
        { name: "Alloy Plate", rarity: "Common" },
        { name: "Polymer Bundle", rarity: "Uncommon" },
        { name: "Circuits", rarity: "Uncommon" },
        { name: "Fieldron Sample", rarity: "Uncommon" }
    ],
    Earth: [
        { name: "Ferrite", rarity: "Common" },
        { name: "Rubedo", rarity: "Uncommon" },
        { name: "Detonite Ampule", rarity: "Uncommon" },
        { name: "Neurodes", rarity: "Rare" }
    ],
    Lua: [
        { name: "Ferrite", rarity: "Common" },
        { name: "Rubedo", rarity: "Uncommon" },
        { name: "Detonite Ampule", rarity: "Uncommon" },
        { name: "Neurodes", rarity: "Rare" }
    ],
    Mars: [
        { name: "Salvage", rarity: "Common" },
        { name: "Fieldron Sample", rarity: "Uncommon" },
        { name: "Gallium", rarity: "Rare" },
        { name: "Morphics", rarity: "Rare" }
    ],
    Deimos: [
        { name: "Nano Spores", rarity: "Common" },
        { name: "Mutagen Sample", rarity: "Uncommon" },
        { name: "Neurodes", rarity: "Rare" },
        { name: "Orokin Cell", rarity: "Rare" }
    ],
    Phobos: [
        { name: "Alloy Plate", rarity: "Common" },
        { name: "Plastids", rarity: "Uncommon" },
        { name: "Rubedo", rarity: "Uncommon" },
        { name: "Morphics", rarity: "Rare" }
    ],
    Ceres: [
        { name: "Alloy Plate", rarity: "Common" },
        { name: "Circuits", rarity: "Uncommon" },
        { name: "Detonite Ampule", rarity: "Uncommon" },
        { name: "Orokin Cell", rarity: "Rare" }
    ],
    Jupiter: [
        { name: "Alloy Plate", rarity: "Common" },
        { name: "Salvage", rarity: "Common" },
        { name: "Hexenon", rarity: "Uncommon" },
        { name: "Neural Sensors", rarity: "Rare" }
    ],
    Europa: [
        { name: "Rubedo", rarity: "Uncommon" },
        { name: "Fieldron Sample", rarity: "Uncommon" },
        { name: "Control Module", rarity: "Rare" },
        { name: "Morphics", rarity: "Rare" }
    ],
    Saturn: [
        { name: "Nano Spores", rarity: "Common" },
        { name: "Plastids", rarity: "Uncommon" },
        { name: "Detonite Ampule", rarity: "Uncommon" },
        { name: "Orokin Cell", rarity: "Rare" }
    ],
    Uranus: [
        { name: "Polymer Bundle", rarity: "Uncommon" },
        { name: "Plastids", rarity: "Uncommon" },
        { name: "Detonite Ampule", rarity: "Uncommon" },
        { name: "Gallium", rarity: "Rare" }
    ],
    Neptune: [
        { name: "Ferrite", rarity: "Common" },
        { name: "Nano Spores", rarity: "Common" },
        { name: "Fieldron Sample", rarity: "Uncommon" },
        { name: "Control Module", rarity: "Rare" }
    ],
    Pluto: [
        { name: "Alloy Plate", rarity: "Common" },
        { name: "Rubedo", rarity: "Uncommon" },
        { name: "Plastids", rarity: "Uncommon" },
        { name: "Fieldron Sample", rarity: "Uncommon" },
        { name: "Morphics", rarity: "Rare" }
    ],
    Sedna: [
        { name: "Alloy Plate", rarity: "Common" },
        { name: "Salvage", rarity: "Common" },
        { name: "Rubedo", rarity: "Uncommon" },
        { name: "Detonite Ampule", rarity: "Uncommon" }
    ],
    Eris: [
        { name: "Nano Spores", rarity: "Common" },
        { name: "Plastids", rarity: "Uncommon" },
        { name: "Mutagen Sample", rarity: "Uncommon" },
        { name: "Neurodes", rarity: "Rare" }
    ],
    "Kuva Fortress": [
        { name: "Salvage", rarity: "Common" },
        { name: "Circuits", rarity: "Uncommon" },
        { name: "Detonite Ampule", rarity: "Uncommon" },
        { name: "Neural Sensors", rarity: "Rare" }
    ],
    Void: [
        { name: "Ferrite", rarity: "Common" },
        { name: "Rubedo", rarity: "Uncommon" },
        { name: "Argon Crystal", rarity: "Rare" },
        { name: "Control Module", rarity: "Rare" }
    ],
    Zariman: [
        { name: "Alloy Plate", rarity: "Common" },
        { name: "Ferrite", rarity: "Common" },
        { name: "Voidgel Orb", rarity: "Uncommon" },
        { name: "Entrati Lanthorn", rarity: "Rare" }
    ],
    "Höllvania": [
        { name: "Höllvanian Pitchweave Fragment", rarity: "Common" },
        { name: "Efervon Sample", rarity: "Common" },
        { name: "Experimental Arc-Relay", rarity: "Uncommon" },
        { name: "Techrot Chitin", rarity: "Uncommon" },
        { name: "Techrot Motherboard", rarity: "Rare" }
    ]
};

/**
 * Star chart uses ids like "planet:earth" or "region:kuva_fortress".
 * This maps those ids to REGION_RESOURCES_BY_REGION keys.
 */
const PLANET_ID_TO_REGION_NAME: Record<string, string> = {
    "planet:mercury": "Mercury",
    "planet:venus": "Venus",
    "planet:earth": "Earth",
    "region:lua": "Lua",
    "planet:mars": "Mars",
    "planet:deimos": "Deimos",
    "planet:phobos": "Phobos",
    "planet:ceres": "Ceres",
    "planet:jupiter": "Jupiter",
    "planet:europa": "Europa",
    "planet:saturn": "Saturn",
    "planet:uranus": "Uranus",
    "planet:neptune": "Neptune",
    "planet:pluto": "Pluto",
    "planet:sedna": "Sedna",
    "planet:eris": "Eris",

    "region:kuva_fortress": "Kuva Fortress",
    "region:void": "Void",
    "region:zariman": "Zariman",
    "region:hollvania": "Höllvania"
};

function normalizeRegionNameKey(name: string): string {
    return String(name ?? "").trim();
}

export function getRegionResources(regionName: string): RegionResource[] {
    const key = normalizeRegionNameKey(regionName);
    const arr = REGION_RESOURCES_BY_REGION[key];
    return Array.isArray(arr) ? arr : [];
}

/**
 * Primary lookup for UI: use the planetId first (canonical), fall back to planetName.
 */
export function getRegionResourcesForPlanet(planetId: string, planetName: string): RegionResource[] {
    const mapped = PLANET_ID_TO_REGION_NAME[String(planetId)];
    if (mapped) return getRegionResources(mapped);

    // Fallback: if the StarChart planet.name matches the region key.
    return getRegionResources(planetName);
}
