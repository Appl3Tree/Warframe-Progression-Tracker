import { STAR_CHART_NODES } from "../catalog/starChart/nodes";

const STEEL_PATH_PLANET_IDS = new Set([
    "planet:mercury",
    "planet:venus",
    "planet:earth",
    "planet:mars",
    "planet:phobos",
    "planet:ceres",
    "planet:jupiter",
    "planet:europa",
    "planet:saturn",
    "planet:uranus",
    "planet:neptune",
    "planet:pluto",
    "planet:sedna",
    "planet:eris",
    "planet:deimos",
    "region:void",
    "region:lua",
    "region:kuva_fortress",
]);

const STEEL_PATH_EXCLUDED_NODE_IDS = new Set([
    "node:mr/uranus/brutus",
]);

const NIGHTMARE_EXCLUDED_PLANET_IDS = new Set([
    "region:earth_proxima",
    "region:venus_proxima",
    "region:saturn_proxima",
    "region:neptune_proxima",
    "region:pluto_proxima",
    "planet:zariman",
    "region:zariman",
    "region:albrechts_laboratories",
    "region:hollvania",
    "region:duviri",
]);

function isDuplicateVariantNode(nodeId: string): boolean {
    return /-\(extra\)$|-\(caches\)$/i.test(nodeId);
}

function buildRequiredNodeIds(): { steelPath: string[]; nightmareByPlanet: Record<string, string[]> } {
    const steelPath = new Set<string>();
    const nightmareByPlanet = new Map<string, Set<string>>();

    for (const node of STAR_CHART_NODES) {
        if (node.nodeType === "hub") continue;
        if (isDuplicateVariantNode(node.id)) continue;

        if (STEEL_PATH_PLANET_IDS.has(node.planetId) && !STEEL_PATH_EXCLUDED_NODE_IDS.has(node.id)) {
            steelPath.add(node.id);
        }

        if (node.nodeType === "junction") continue;
        if (NIGHTMARE_EXCLUDED_PLANET_IDS.has(node.planetId)) continue;

        const set = nightmareByPlanet.get(node.planetId) ?? new Set<string>();
        set.add(node.id);
        nightmareByPlanet.set(node.planetId, set);
    }

    return {
        steelPath: [...steelPath].sort(),
        nightmareByPlanet: Object.fromEntries(
            [...nightmareByPlanet.entries()]
                .map(([planetId, ids]) => [planetId, [...ids].sort()] as const)
        ),
    };
}

const REQUIRED = buildRequiredNodeIds();

function areAllNodesComplete(nodeIds: readonly string[], nodeCompletedMap: Record<string, boolean>): boolean {
    return nodeIds.length > 0 && nodeIds.every((nodeId) => nodeCompletedMap[nodeId] === true);
}

export function isSteelPathUnlockedFromNodeCompletion(nodeCompletedMap: Record<string, boolean> = {}): boolean {
    return areAllNodesComplete(REQUIRED.steelPath, nodeCompletedMap);
}

export function getNightmareUnlockedPlanetIds(nodeCompletedMap: Record<string, boolean> = {}): string[] {
    return Object.entries(REQUIRED.nightmareByPlanet)
        .filter(([, nodeIds]) => areAllNodesComplete(nodeIds, nodeCompletedMap))
        .map(([planetId]) => planetId)
        .sort();
}

export function isNightmareUnlockedFromNodeCompletion(nodeCompletedMap: Record<string, boolean> = {}): boolean {
    return getNightmareUnlockedPlanetIds(nodeCompletedMap).length > 0;
}
