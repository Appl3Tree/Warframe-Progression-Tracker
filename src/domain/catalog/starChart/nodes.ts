// ===== FILE: src/domain/catalog/starChart/nodes.ts =====

import type { StarChartNode } from "../../models/starChart";
import { PR } from "../../ids/prereqIds";

/**
 * Authoritative node registry.
 *
 * Conventions:
 * - Mission nodes that exist in drop-data missionRewards.json should use:
 *     node:mr/<group>/<node>
 *   where <group>/<node> match the missionRewards keys (tokenized or raw; tokenized preferred).
 *
 * - Junctions are nodes with nodeType="junction".
 */
export const STAR_CHART_NODES: StarChartNode[] = [
    // =============================
    // Junctions (placeholders for now)
    // =============================
    {
        id: "node:junction_earth_mars",
        planetId: "planet:earth",
        name: "Earth → Mars Junction",
        nodeType: "junction",
        edges: [],
        unlocksPlanetId: "planet:mars",
        prereqIds: [PR.VORS_PRIZE]
    },
    {
        id: "node:junction_saturn_uranus",
        planetId: "planet:saturn",
        name: "Saturn → Uranus Junction",
        nodeType: "junction",
        edges: [],
        unlocksPlanetId: "planet:uranus",
        prereqIds: [PR.VORS_PRIZE]
    },

    // =============================
    // Earth (missionRewards-backed starters)
    // These ids auto-map to data:node/<planet>/<node> via nodeDropSourceMap.ts
    // =============================
    {
        id: "node:mr/earth/cambria",
        planetId: "planet:earth",
        name: "Cambria",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/everest",
        planetId: "planet:earth",
        name: "Everest",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/gaia",
        planetId: "planet:earth",
        name: "Gaia",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/lith",
        planetId: "planet:earth",
        name: "Lith",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/mantle",
        planetId: "planet:earth",
        name: "Mantle",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/pacific",
        planetId: "planet:earth",
        name: "Pacific",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Earth variants that exist as separate missionRewards keys
    // (Caches/Extra) should map deterministically too.
    // =============================
    {
        id: "node:mr/earth/bendar-cluster",
        planetId: "planet:earth",
        name: "Bendar Cluster",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/bendar-cluster-(caches)",
        planetId: "planet:earth",
        name: "Bendar Cluster (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/bendar-cluster-(extra)",
        planetId: "planet:earth",
        name: "Bendar Cluster (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/earth/iota-temple",
        planetId: "planet:earth",
        name: "Iota Temple",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/iota-temple-(caches)",
        planetId: "planet:earth",
        name: "Iota Temple (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/iota-temple-(extra)",
        planetId: "planet:earth",
        name: "Iota Temple (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/earth/korms-belt",
        planetId: "planet:earth",
        name: "Korm's Belt",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/korms-belt-(caches)",
        planetId: "planet:earth",
        name: "Korm's Belt (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/korms-belt-(extra)",
        planetId: "planet:earth",
        name: "Korm's Belt (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/earth/sover-strait",
        planetId: "planet:earth",
        name: "Sover Strait",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/sover-strait-(caches)",
        planetId: "planet:earth",
        name: "Sover Strait (Caches)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/earth/cervantes-(caches)",
        planetId: "planet:earth",
        name: "Cervantes (Caches)",
        nodeType: "mission",
        edges: []
    },

    // A few more from your list (no suffix variants)
    {
        id: "node:mr/earth/coba",
        planetId: "planet:earth",
        name: "Coba",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/erpo",
        planetId: "planet:earth",
        name: "Erpo",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/oro",
        planetId: "planet:earth",
        name: "Oro",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/sayas-visions",
        planetId: "planet:earth",
        name: "Saya's Visions",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Venus (missionRewards-backed)
    // =============================
    {
        id: "node:mr/venus/beacon-shield-ring",
        planetId: "planet:venus",
        name: "Beacon Shield Ring",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/beacon-shield-ring-(caches)",
        planetId: "planet:venus",
        name: "Beacon Shield Ring (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/beacon-shield-ring-(extra)",
        planetId: "planet:venus",
        name: "Beacon Shield Ring (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/bifrost-echo",
        planetId: "planet:venus",
        name: "Bifrost Echo",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/bifrost-echo-(caches)",
        planetId: "planet:venus",
        name: "Bifrost Echo (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/bifrost-echo-(extra)",
        planetId: "planet:venus",
        name: "Bifrost Echo (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/cytherean",
        planetId: "planet:venus",
        name: "Cytherean",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/falling-glory",
        planetId: "planet:venus",
        name: "Falling Glory",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/falling-glory-(caches)",
        planetId: "planet:venus",
        name: "Falling Glory (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/falling-glory-(extra)",
        planetId: "planet:venus",
        name: "Falling Glory (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/fossa",
        planetId: "planet:venus",
        name: "Fossa",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/ishtar-(caches)",
        planetId: "planet:venus",
        name: "Ishtar (Caches)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/kiliken",
        planetId: "planet:venus",
        name: "Kiliken",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/linea",
        planetId: "planet:venus",
        name: "Linea",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/luckless-expanse",
        planetId: "planet:venus",
        name: "Luckless Expanse",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/luckless-expanse-(caches)",
        planetId: "planet:venus",
        name: "Luckless Expanse (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/luckless-expanse-(extra)",
        planetId: "planet:venus",
        name: "Luckless Expanse (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/malva",
        planetId: "planet:venus",
        name: "Malva",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/montes",
        planetId: "planet:venus",
        name: "Montes",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/orvin-haarc",
        planetId: "planet:venus",
        name: "Orvin-Haarc",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/orvin-haarc-(caches)",
        planetId: "planet:venus",
        name: "Orvin-Haarc (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/orvin-haarc-(extra)",
        planetId: "planet:venus",
        name: "Orvin-Haarc (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/romula",
        planetId: "planet:venus",
        name: "Romula",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/tessera",
        planetId: "planet:venus",
        name: "Tessera",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/unda",
        planetId: "planet:venus",
        name: "Unda",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/v-prime",
        planetId: "planet:venus",
        name: "V Prime",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/venera",
        planetId: "planet:venus",
        name: "Venera",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/vesper",
        planetId: "planet:venus",
        name: "Vesper",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/vesper-strait",
        planetId: "planet:venus",
        name: "Vesper Strait",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/vesper-strait-(caches)",
        planetId: "planet:venus",
        name: "Vesper Strait (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/vesper-strait-(extra)",
        planetId: "planet:venus",
        name: "Vesper Strait (Extra)",
        nodeType: "mission",
        edges: []
    },
    // =============================
    // Mercury (missionRewards-backed)
    // =============================
    {
        id: "node:mr/mercury/apollodorus",
        planetId: "planet:mercury",
        name: "Apollodorus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mercury/caduceus",
        planetId: "planet:mercury",
        name: "Caduceus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mercury/caloris",
        planetId: "planet:mercury",
        name: "Caloris",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mercury/elion",
        planetId: "planet:mercury",
        name: "Elion",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mercury/lares",
        planetId: "planet:mercury",
        name: "Lares",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mercury/neruda-(caches)",
        planetId: "planet:mercury",
        name: "Neruda (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mercury/odin",
        planetId: "planet:mercury",
        name: "Odin",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mercury/suisei",
        planetId: "planet:mercury",
        name: "Suisei",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mercury/terminus-(caches)",
        planetId: "planet:mercury",
        name: "Terminus (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mercury/tolstoj",
        planetId: "planet:mercury",
        name: "Tolstoj",
        nodeType: "mission",
        edges: []
    },
];
