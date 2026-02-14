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
        planetId: "region:earth_proxima",
        name: "Bendar Cluster",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/bendar-cluster-(caches)",
        planetId: "region:earth_proxima",
        name: "Bendar Cluster (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/bendar-cluster-(extra)",
        planetId: "region:earth_proxima",
        name: "Bendar Cluster (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/earth/iota-temple",
        planetId: "region:earth_proxima",
        name: "Iota Temple",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/iota-temple-(caches)",
        planetId: "region:earth_proxima",
        name: "Iota Temple (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/iota-temple-(extra)",
        planetId: "region:earth_proxima",
        name: "Iota Temple (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/korms-belt",
        planetId: "region:earth_proxima",
        name: "Korm's Belt",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/korms-belt-(caches)",
        planetId: "region:earth_proxima",
        name: "Korm's Belt (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/korms-belt-(extra)",
        planetId: "region:earth_proxima",
        name: "Korm's Belt (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/earth/sover-strait",
        planetId: "region:earth_proxima",
        name: "Sover Strait",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/earth/sover-strait-(caches)",
        planetId: "region:earth_proxima",
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
        planetId: "region:venus_proxima",
        name: "Beacon Shield Ring",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/beacon-shield-ring-(caches)",
        planetId: "region:venus_proxima",
        name: "Beacon Shield Ring (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/beacon-shield-ring-(extra)",
        planetId: "region:venus_proxima",
        name: "Beacon Shield Ring (Extra)",
        nodeType: "mission",
        edges: []
    },

    {
        id: "node:mr/venus/bifrost-echo",
        planetId: "region:venus_proxima",
        name: "Bifrost Echo",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/bifrost-echo-(caches)",
        planetId: "region:venus_proxima",
        name: "Bifrost Echo (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/bifrost-echo-(extra)",
        planetId: "region:venus_proxima",
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
        planetId: "region:venus_proxima",
        name: "Falling Glory",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/falling-glory-(caches)",
        planetId: "region:venus_proxima",
        name: "Falling Glory (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/falling-glory-(extra)",
        planetId: "region:venus_proxima",
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
        planetId: "region:venus_proxima",
        name: "Luckless Expanse",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/luckless-expanse-(caches)",
        planetId: "region:venus_proxima",
        name: "Luckless Expanse (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/luckless-expanse-(extra)",
        planetId: "region:venus_proxima",
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
        planetId: "region:venus_proxima",
        name: "Orvin-Haarc",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/orvin-haarc-(caches)",
        planetId: "region:venus_proxima",
        name: "Orvin-Haarc (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/orvin-haarc-(extra)",
        planetId: "region:venus_proxima",
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
        id: "node:mr/venus/vesper-strait",
        planetId: "region:venus_proxima",
        name: "Vesper Strait",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/vesper-strait-(caches)",
        planetId: "region:venus_proxima",
        name: "Vesper Strait (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/venus/vesper-strait-(extra)",
        planetId: "region:venus_proxima",
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
    // =============================
    // Mars (missionRewards-backed)
    // =============================
    {
        id: "node:mr/mars/arcadia",
        planetId: "planet:mars",
        name: "Arcadia",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/olympus",
        planetId: "planet:mars",
        name: "Olympus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/spear",
        planetId: "planet:mars",
        name: "Spear",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/alator",
        planetId: "planet:mars",
        name: "Alator",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/arval",
        planetId: "planet:mars",
        name: "Arval",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/augustus",
        planetId: "planet:mars",
        name: "Augustus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/ara",
        planetId: "planet:mars",
        name: "Ara",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/martialis",
        planetId: "planet:mars",
        name: "Martialis",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/kadesh",
        planetId: "planet:mars",
        name: "Kadesh",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/war",
        planetId: "planet:mars",
        name: "War",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/gradivus-(caches)",
        planetId: "planet:mars",
        name: "Gradivus (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/wahiba",
        planetId: "planet:mars",
        name: "Wahiba",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/quirinus",
        planetId: "planet:mars",
        name: "Quirinus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/syrtis",
        planetId: "planet:mars",
        name: "Syrtis",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/mars/tyana-pass",
        planetId: "planet:mars",
        name: "Tyana Pass",
        nodeType: "mission",
        edges: []
    },
    // =============================
    // Jupiter (missionRewards-backed)
    // =============================
    {
        id: "node:mr/jupiter/ganymede",
        planetId: "planet:jupiter",
        name: "Ganymede",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/adrastea-(caches)",
        planetId: "planet:jupiter",
        name: "Adrastea (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/amalthea",
        planetId: "planet:jupiter",
        name: "Amalthea",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/metis",
        planetId: "planet:jupiter",
        name: "Metis",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/io",
        planetId: "planet:jupiter",
        name: "Io",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/elara",
        planetId: "planet:jupiter",
        name: "Elara",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/callisto",
        planetId: "planet:jupiter",
        name: "Callisto",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/carpo-(caches)",
        planetId: "planet:jupiter",
        name: "Carpo (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/themisto",
        planetId: "planet:jupiter",
        name: "Themisto",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/the-ropalolyst",
        planetId: "planet:jupiter",
        name: "The Ropalolyst",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/the-ropalolyst-(extra)",
        planetId: "planet:jupiter",
        name: "The Ropalolyst (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/sinai",
        planetId: "planet:jupiter",
        name: "Sinai",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/ananke",
        planetId: "planet:jupiter",
        name: "Ananke",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/galilea",
        planetId: "planet:jupiter",
        name: "Galilea",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/jupiter/cameria",
        planetId: "planet:jupiter",
        name: "Cameria",
        nodeType: "mission",
        edges: []
    },
    // =============================
    // Deimos (drop-data missionRewards) add=10
    // =============================
    {
        id: "node:mr/deimos/armatus",
        planetId: "planet:deimos",
        name: "Armatus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/deimos/cambire",
        planetId: "planet:deimos",
        name: "Cambire",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/deimos/effervo",
        planetId: "planet:deimos",
        name: "Effervo",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/deimos/formido-(caches)",
        planetId: "planet:deimos",
        name: "Formido (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/deimos/hyf",
        planetId: "planet:deimos",
        name: "Hyf",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/deimos/magnacidium",
        planetId: "planet:deimos",
        name: "Magnacidium",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/deimos/munio",
        planetId: "planet:deimos",
        name: "Munio",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/deimos/nex",
        planetId: "planet:deimos",
        name: "Nex",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/deimos/persto",
        planetId: "planet:deimos",
        name: "Persto",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/deimos/terrorem",
        planetId: "planet:deimos",
        name: "Terrorem",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Phobos (drop-data missionRewards) add=16
    // =============================
    {
        id: "node:mr/phobos/drunlo",
        planetId: "planet:phobos",
        name: "Drunlo",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/flimnap",
        planetId: "planet:phobos",
        name: "Flimnap",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/grildrig",
        planetId: "planet:phobos",
        name: "Grildrig",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/gulliver",
        planetId: "planet:phobos",
        name: "Gulliver",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/iliad",
        planetId: "planet:phobos",
        name: "Iliad",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/kepler",
        planetId: "planet:phobos",
        name: "Kepler",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/limtoc",
        planetId: "planet:phobos",
        name: "Limtoc",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/memphis",
        planetId: "planet:phobos",
        name: "Memphis",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/monolith",
        planetId: "planet:phobos",
        name: "Monolith",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/opik",
        planetId: "planet:phobos",
        name: "Opik",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/shklovsky",
        planetId: "planet:phobos",
        name: "Shklovsky",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/skyresh",
        planetId: "planet:phobos",
        name: "Skyresh",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/stickney",
        planetId: "planet:phobos",
        name: "Stickney",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/todd",
        planetId: "planet:phobos",
        name: "Todd",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/wendell",
        planetId: "planet:phobos",
        name: "Wendell",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/phobos/zeugma",
        planetId: "planet:phobos",
        name: "Zeugma",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Ceres (drop-data missionRewards) add=16
    // =============================
    {
        id: "node:mr/ceres/bode",
        planetId: "planet:ceres",
        name: "Bode",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/casta",
        planetId: "planet:ceres",
        name: "Casta",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/cinxia",
        planetId: "planet:ceres",
        name: "Cinxia",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/draco",
        planetId: "planet:ceres",
        name: "Draco",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/egeria",
        planetId: "planet:ceres",
        name: "Egeria",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/exta",
        planetId: "planet:ceres",
        name: "Exta",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/exta-(extra)",
        planetId: "planet:ceres",
        name: "Exta (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/gabii",
        planetId: "planet:ceres",
        name: "Gabii",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/hapke",
        planetId: "planet:ceres",
        name: "Hapke",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/ker-(caches)",
        planetId: "planet:ceres",
        name: "Ker (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/lex",
        planetId: "planet:ceres",
        name: "Lex",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/nuovo",
        planetId: "planet:ceres",
        name: "Nuovo",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/olla",
        planetId: "planet:ceres",
        name: "Olla",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/seimeni",
        planetId: "planet:ceres",
        name: "Seimeni",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/thon-(caches)",
        planetId: "planet:ceres",
        name: "Thon (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/ceres/varro",
        planetId: "planet:ceres",
        name: "Varro",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Europa (drop-data missionRewards) add=16
    // =============================
    {
        id: "node:mr/europa/abaddon",
        planetId: "planet:europa",
        name: "Abaddon",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/beleth",
        planetId: "planet:europa",
        name: "Beleth",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/cholistan",
        planetId: "planet:europa",
        name: "Cholistan",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/cryotic-front",
        planetId: "planet:europa",
        name: "Cryotic Front",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/eligor",
        planetId: "planet:europa",
        name: "Eligor",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/gamygyn",
        planetId: "planet:europa",
        name: "Gamygyn",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/larzac",
        planetId: "planet:europa",
        name: "Larzac",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/lillith",
        planetId: "planet:europa",
        name: "Lillith",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/naamah",
        planetId: "planet:europa",
        name: "Naamah",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/orias",
        planetId: "planet:europa",
        name: "Orias",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/ose",
        planetId: "planet:europa",
        name: "Ose",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/paimon",
        planetId: "planet:europa",
        name: "Paimon",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/shax",
        planetId: "planet:europa",
        name: "Shax",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/valac",
        planetId: "planet:europa",
        name: "Valac",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/valefor",
        planetId: "planet:europa",
        name: "Valefor",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/europa/zagan",
        planetId: "planet:europa",
        name: "Zagan",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Saturn (drop-data missionRewards) add=45
    // =============================
    {
        id: "node:mr/saturn/aegaeon",
        planetId: "planet:saturn",
        name: "Aegaeon",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/annihilation",
        planetId: "planet:saturn",
        name: "Annihilation",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/annihilation-(extra)",
        planetId: "planet:saturn",
        name: "Annihilation (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/anthe",
        planetId: "planet:saturn",
        name: "Anthe",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/calypso-(caches)",
        planetId: "planet:saturn",
        name: "Calypso (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/caracol",
        planetId: "planet:saturn",
        name: "Caracol",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/cassini",
        planetId: "planet:saturn",
        name: "Cassini",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/cephalon-capture",
        planetId: "planet:saturn",
        name: "Cephalon Capture",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/cephalon-capture-(extra)",
        planetId: "planet:saturn",
        name: "Cephalon Capture (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/dione",
        planetId: "planet:saturn",
        name: "Dione",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/helene",
        planetId: "planet:saturn",
        name: "Helene",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/kasios-rest",
        planetId: "region:saturn_proxima",
        name: "Kasio's Rest",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/kasios-rest-(caches)",
        planetId: "region:saturn_proxima",
        name: "Kasio's Rest (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/kasios-rest-(extra)",
        planetId: "region:saturn_proxima",
        name: "Kasio's Rest (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/lunaro-arena",
        planetId: "planet:saturn",
        name: "Lunaro Arena",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/lunaro-arena-(extra)",
        planetId: "planet:saturn",
        name: "Lunaro Arena (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/lupal-pass",
        planetId: "region:saturn_proxima",
        name: "Lupal Pass",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/lupal-pass-(caches)",
        planetId: "region:saturn_proxima",
        name: "Lupal Pass (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/lupal-pass-(extra)",
        planetId: "region:saturn_proxima",
        name: "Lupal Pass (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/mimas",
        planetId: "planet:saturn",
        name: "Mimas",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/mordo-cluster",
        planetId: "region:saturn_proxima",
        name: "Mordo Cluster",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/mordo-cluster-(caches)",
        planetId: "region:saturn_proxima",
        name: "Mordo Cluster (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/mordo-cluster-(extra)",
        planetId: "region:saturn_proxima",
        name: "Mordo Cluster (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/nodo-gap",
        planetId: "region:saturn_proxima",
        name: "Nodo Gap",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/nodo-gap-(caches)",
        planetId: "region:saturn_proxima",
        name: "Nodo Gap (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/nodo-gap-(extra)",
        planetId: "region:saturn_proxima",
        name: "Nodo Gap (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/numa",
        planetId: "planet:saturn",
        name: "Numa",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/pallene-(caches)",
        planetId: "planet:saturn",
        name: "Pallene (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/pandora",
        planetId: "planet:saturn",
        name: "Pandora",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/phoebe",
        planetId: "planet:saturn",
        name: "Phoebe",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/piscinas",
        planetId: "planet:saturn",
        name: "Piscinas",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/rhea",
        planetId: "planet:saturn",
        name: "Rhea",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/team-annihilation",
        planetId: "planet:saturn",
        name: "Team Annihilation",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/team-annihilation-(extra)",
        planetId: "planet:saturn",
        name: "Team Annihilation (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/tethys",
        planetId: "planet:saturn",
        name: "Tethys",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/titan",
        planetId: "planet:saturn",
        name: "Titan",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/vand-cluster",
        planetId: "region:saturn_proxima",
        name: "Vand Cluster",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/vand-cluster-(caches)",
        planetId: "region:saturn_proxima",
        name: "Vand Cluster (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/vand-cluster-(extra)",
        planetId: "region:saturn_proxima",
        name: "Vand Cluster (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/variant-annihilation",
        planetId: "planet:saturn",
        name: "Variant Annihilation",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/variant-annihilation-(extra)",
        planetId: "planet:saturn",
        name: "Variant Annihilation (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/variant-cephalon-capture",
        planetId: "planet:saturn",
        name: "Variant Cephalon Capture",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/variant-cephalon-capture-(extra)",
        planetId: "planet:saturn",
        name: "Variant Cephalon Capture (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/variant-team-annihilation",
        planetId: "planet:saturn",
        name: "Variant Team Annihilation",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/saturn/variant-team-annihilation-(extra)",
        planetId: "planet:saturn",
        name: "Variant Team Annihilation (Extra)",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Uranus (drop-data missionRewards) add=20
    // =============================
    {
        id: "node:mr/uranus/ariel",
        planetId: "planet:uranus",
        name: "Ariel",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/assur",
        planetId: "planet:uranus",
        name: "Assur",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/bianca",
        planetId: "planet:uranus",
        name: "Bianca",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/brutus",
        planetId: "planet:uranus",
        name: "Brutus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/caelus",
        planetId: "planet:uranus",
        name: "Caelus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/caliban",
        planetId: "planet:uranus",
        name: "Caliban",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/cupid",
        planetId: "planet:uranus",
        name: "Cupid",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/desdemona-(caches)",
        planetId: "planet:uranus",
        name: "Desdemona (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/mab",
        planetId: "planet:uranus",
        name: "Mab",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/miranda",
        planetId: "planet:uranus",
        name: "Miranda",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/ophelia",
        planetId: "planet:uranus",
        name: "Ophelia",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/portia-(caches)",
        planetId: "planet:uranus",
        name: "Portia (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/prospero-(caches)",
        planetId: "planet:uranus",
        name: "Prospero (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/rosalind",
        planetId: "planet:uranus",
        name: "Rosalind",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/setebos-(caches)",
        planetId: "planet:uranus",
        name: "Setebos (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/stephano",
        planetId: "planet:uranus",
        name: "Stephano",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/titania",
        planetId: "planet:uranus",
        name: "Titania",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/trinculo",
        planetId: "planet:uranus",
        name: "Trinculo",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/umbriel",
        planetId: "planet:uranus",
        name: "Umbriel",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/uranus/ur",
        planetId: "planet:uranus",
        name: "Ur",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Neptune (drop-data missionRewards) add=35
    // =============================
    {
        id: "node:mr/neptune/arva-vector",
        planetId: "region:neptune_proxima",
        name: "Arva Vector",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/arva-vector-(caches)",
        planetId: "region:neptune_proxima",
        name: "Arva Vector (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/arva-vector-(extra)",
        planetId: "region:neptune_proxima",
        name: "Arva Vector (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/brom-cluster",
        planetId: "region:neptune_proxima",
        name: "Brom Cluster",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/brom-cluster-(caches)",
        planetId: "region:neptune_proxima",
        name: "Brom Cluster (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/brom-cluster-(extra)",
        planetId: "region:neptune_proxima",
        name: "Brom Cluster (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/cephalon-capture",
        planetId: "planet:neptune",
        name: "Cephalon Capture",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/despina",
        planetId: "planet:neptune",
        name: "Despina",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/enkidu-ice-drifts",
        planetId: "region:neptune_proxima",
        name: "Enkidu Ice Drifts",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/enkidu-ice-drifts-(caches)",
        planetId: "region:neptune_proxima",
        name: "Enkidu Ice Drifts (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/enkidu-ice-drifts-(extra)",
        planetId: "region:neptune_proxima",
        name: "Enkidu Ice Drifts (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/galatea",
        planetId: "planet:neptune",
        name: "Galatea",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/halimede-(caches)",
        planetId: "planet:neptune",
        name: "Halimede (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/kelashin",
        planetId: "planet:neptune",
        name: "Kelashin",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/laomedeia",
        planetId: "planet:neptune",
        name: "Laomedeia",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/mammons-prospect",
        planetId: "region:neptune_proxima",
        name: "Mammon's Prospect",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/mammons-prospect-(caches)",
        planetId: "region:neptune_proxima",
        name: "Mammon's Prospect (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/mammons-prospect-(extra)",
        planetId: "region:neptune_proxima",
        name: "Mammon's Prospect (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/nereid",
        planetId: "planet:neptune",
        name: "Nereid",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/nu-gua-mines",
        planetId: "region:neptune_proxima",
        name: "Nu-Gua Mines",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/nu-gua-mines-(caches)",
        planetId: "region:neptune_proxima",
        name: "Nu-Gua Mines (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/nu-gua-mines-(extra)",
        planetId: "region:neptune_proxima",
        name: "Nu-Gua Mines (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/proteus",
        planetId: "planet:neptune",
        name: "Proteus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/psamathe",
        planetId: "planet:neptune",
        name: "Psamathe",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/salacia",
        planetId: "planet:neptune",
        name: "Salacia",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/sovereign-grasp",
        planetId: "region:neptune_proxima",
        name: "Sovereign Grasp",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/sovereign-grasp-(caches)",
        planetId: "region:neptune_proxima",
        name: "Sovereign Grasp (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/sovereign-grasp-(extra)",
        planetId: "region:neptune_proxima",
        name: "Sovereign Grasp (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/thalassa-(caches)",
        planetId: "planet:neptune",
        name: "Thalassa (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/the-index-endurance",
        planetId: "planet:neptune",
        name: "The Index: Endurance",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/the-index-endurance-high-risk",
        planetId: "planet:neptune",
        name: "The Index: Endurance (High Risk)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/the-index-endurance-low-risk",
        planetId: "planet:neptune",
        name: "The Index: Endurance (Low Risk)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/the-index-endurance-medium-risk",
        planetId: "planet:neptune",
        name: "The Index: Endurance (Medium Risk)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/triton",
        planetId: "planet:neptune",
        name: "Triton",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/neptune/yursa",
        planetId: "planet:neptune",
        name: "Yursa",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Pluto (drop-data missionRewards) add=30
    // =============================
    {
        id: "node:mr/pluto/cerberus",
        planetId: "planet:pluto",
        name: "Cerberus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/charon-(caches)",
        planetId: "planet:pluto",
        name: "Charon (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/corb",
        planetId: "planet:pluto",
        name: "Corb",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/cypress-(caches)",
        planetId: "planet:pluto",
        name: "Cypress (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/fentons-field",
        planetId: "region:pluto_proxima",
        name: "Fenton's Field",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/fentons-field-(caches)",
        planetId: "region:pluto_proxima",
        name: "Fenton's Field (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/fentons-field-(extra)",
        planetId: "region:pluto_proxima",
        name: "Fenton's Field (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/hades",
        planetId: "planet:pluto",
        name: "Hades",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/hieracon",
        planetId: "planet:pluto",
        name: "Hieracon",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/hydra",
        planetId: "planet:pluto",
        name: "Hydra",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/khufu-envoy",
        planetId: "region:pluto_proxima",
        name: "Khufu Envoy",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/khufu-envoy-(caches)",
        planetId: "region:pluto_proxima",
        name: "Khufu Envoy (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/khufu-envoy-(extra)",
        planetId: "region:pluto_proxima",
        name: "Khufu Envoy (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/obol-crossing",
        planetId: "region:pluto_proxima",
        name: "Obol Crossing",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/obol-crossing-(caches)",
        planetId: "region:pluto_proxima",
        name: "Obol Crossing (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/obol-crossing-(extra)",
        planetId: "region:pluto_proxima",
        name: "Obol Crossing (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/oceanum",
        planetId: "planet:pluto",
        name: "Oceanum",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/outer-terminus",
        planetId: "planet:pluto",
        name: "Outer Terminus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/palus",
        planetId: "planet:pluto",
        name: "Palus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/peregrine-axis",
        planetId: "region:pluto_proxima",
        name: "Peregrine Axis",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/peregrine-axis-(caches)",
        planetId: "region:pluto_proxima",
        name: "Peregrine Axis (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/peregrine-axis-(extra)",
        planetId: "region:pluto_proxima",
        name: "Peregrine Axis (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/profit-margin",
        planetId: "region:pluto_proxima",
        name: "Profit Margin",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/profit-margin-(caches)",
        planetId: "region:pluto_proxima",
        name: "Profit Margin (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/profit-margin-(extra)",
        planetId: "region:pluto_proxima",
        name: "Profit Margin (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/regna",
        planetId: "planet:pluto",
        name: "Regna",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/sechura",
        planetId: "planet:pluto",
        name: "Sechura",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/seven-sirens",
        planetId: "region:pluto_proxima",
        name: "Seven Sirens",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/seven-sirens-(caches)",
        planetId: "region:pluto_proxima",
        name: "Seven Sirens (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/pluto/seven-sirens-(extra)",
        planetId: "region:pluto_proxima",
        name: "Seven Sirens (Extra)",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Sedna (drop-data missionRewards) add=21
    // =============================
    {
        id: "node:mr/sedna/amarna",
        planetId: "planet:sedna",
        name: "Amarna",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/berehynia",
        planetId: "planet:sedna",
        name: "Berehynia",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/camenae",
        planetId: "planet:sedna",
        name: "Camenae",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/hydron",
        planetId: "planet:sedna",
        name: "Hydron",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/jengu",
        planetId: "planet:sedna",
        name: "Jengu",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/kappa",
        planetId: "planet:sedna",
        name: "Kappa",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/kelpie",
        planetId: "planet:sedna",
        name: "Kelpie",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/merrow",
        planetId: "planet:sedna",
        name: "Merrow",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/naga",
        planetId: "planet:sedna",
        name: "Naga",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/nakki",
        planetId: "planet:sedna",
        name: "Nakki",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/phithale-(caches)",
        planetId: "planet:sedna",
        name: "Phithale (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/rusalka-(caches)",
        planetId: "planet:sedna",
        name: "Rusalka (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/sangeru",
        planetId: "planet:sedna",
        name: "Sangeru",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/scylla",
        planetId: "planet:sedna",
        name: "Scylla",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/selkie",
        planetId: "planet:sedna",
        name: "Selkie",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/tikoloshe",
        planetId: "planet:sedna",
        name: "Tikoloshe",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/undine",
        planetId: "planet:sedna",
        name: "Undine",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/veles",
        planetId: "planet:sedna",
        name: "Veles",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/vodyanoi",
        planetId: "planet:sedna",
        name: "Vodyanoi",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/yam",
        planetId: "planet:sedna",
        name: "Yam",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sedna/yemaja",
        planetId: "planet:sedna",
        name: "Yemaja",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Eris (drop-data missionRewards) add=22
    // =============================
    {
        id: "node:mr/eris/akkad",
        planetId: "planet:eris",
        name: "Akkad",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/brugia",
        planetId: "planet:eris",
        name: "Brugia",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/candiru-(caches)",
        planetId: "planet:eris",
        name: "Candiru (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/cosis",
        planetId: "planet:eris",
        name: "Cosis",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/cyath",
        planetId: "planet:eris",
        name: "Cyath",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/gnathos",
        planetId: "planet:eris",
        name: "Gnathos",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/hymeno",
        planetId: "planet:eris",
        name: "Hymeno",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/isos",
        planetId: "planet:eris",
        name: "Isos",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/ixodes",
        planetId: "planet:eris",
        name: "Ixodes",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/kala-azar",
        planetId: "planet:eris",
        name: "Kala-Azar",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/lepis-(caches)",
        planetId: "planet:eris",
        name: "Lepis (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/naeglar-(caches)",
        planetId: "planet:eris",
        name: "Naeglar (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/nimus",
        planetId: "planet:eris",
        name: "Nimus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/oestrus",
        planetId: "planet:eris",
        name: "Oestrus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/phalan",
        planetId: "planet:eris",
        name: "Phalan",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/psoro-(caches)",
        planetId: "planet:eris",
        name: "Psoro (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/ranova",
        planetId: "planet:eris",
        name: "Ranova",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/sparga",
        planetId: "planet:eris",
        name: "Sparga",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/sporid",
        planetId: "planet:eris",
        name: "Sporid",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/viver-(caches)",
        planetId: "planet:eris",
        name: "Viver (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/xini",
        planetId: "planet:eris",
        name: "Xini",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/eris/zabala",
        planetId: "planet:eris",
        name: "Zabala",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Lua (drop-data missionRewards) add=11
    // =============================
    {
        id: "node:mr/lua/apollo",
        planetId: "region:lua",
        name: "Apollo",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/circulus",
        planetId: "region:lua",
        name: "Circulus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/circulus-(extra)",
        planetId: "region:lua",
        name: "Circulus (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/copernicus",
        planetId: "region:lua",
        name: "Copernicus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/pavlov",
        planetId: "region:lua",
        name: "Pavlov",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/plato-(caches)",
        planetId: "region:lua",
        name: "Plato (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/stofler",
        planetId: "region:lua",
        name: "StöFler",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/tycho",
        planetId: "region:lua",
        name: "Tycho",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/yuvarium",
        planetId: "region:lua",
        name: "Yuvarium",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/yuvarium-(extra)",
        planetId: "region:lua",
        name: "Yuvarium (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/lua/zeipel",
        planetId: "region:lua",
        name: "Zeipel",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Kuva Fortress (drop-data missionRewards) add=6
    // =============================
    {
        id: "node:mr/kuva-fortress/dakata-(caches)",
        planetId: "region:kuva_fortress",
        name: "Dakata (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/garus",
        planetId: "region:kuva_fortress",
        name: "Garus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/nabuk",
        planetId: "region:kuva_fortress",
        name: "Nabuk",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/pago",
        planetId: "region:kuva_fortress",
        name: "Pago",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/tamu",
        planetId: "region:kuva_fortress",
        name: "Tamu",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/taveuni",
        planetId: "region:kuva_fortress",
        name: "Taveuni",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Void (drop-data missionRewards) add=15
    // =============================
    {
        id: "node:mr/void/ani",
        planetId: "region:void",
        name: "Ani",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/aten",
        planetId: "region:void",
        name: "Aten",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/belenus",
        planetId: "region:void",
        name: "Belenus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/hepit",
        planetId: "region:void",
        name: "Hepit",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/marduk",
        planetId: "region:void",
        name: "Marduk",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/marduk-(caches)",
        planetId: "region:void",
        name: "Marduk (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/mithra",
        planetId: "region:void",
        name: "Mithra",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/mot",
        planetId: "region:void",
        name: "Mot",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/oxomoco",
        planetId: "region:void",
        name: "Oxomoco",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/stribog",
        planetId: "region:void",
        name: "Stribog",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/stribog-(caches)",
        planetId: "region:void",
        name: "Stribog (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/taranis",
        planetId: "region:void",
        name: "Taranis",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/teshub",
        planetId: "region:void",
        name: "Teshub",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/tiwaz",
        planetId: "region:void",
        name: "Tiwaz",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/void/ukko",
        planetId: "region:void",
        name: "Ukko",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Zariman (drop-data missionRewards) add=5
    // =============================
    {
        id: "node:mr/zariman/everview-arc",
        planetId: "region:zariman",
        name: "Everview Arc",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/zariman/halako-perimeter",
        planetId: "region:zariman",
        name: "Halako Perimeter",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/zariman/oro-works",
        planetId: "region:zariman",
        name: "Oro Works",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/zariman/the-greenway",
        planetId: "region:zariman",
        name: "The Greenway",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/zariman/tuvul-commons",
        planetId: "region:zariman",
        name: "Tuvul Commons",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Duviri (drop-data missionRewards) add=16
    // =============================
    {
        id: "node:mr/duviri/endless-repeated-rewards",
        planetId: "region:duviri",
        name: "Endless: Repeated Rewards",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-repeated-rewards-hard",
        planetId: "region:duviri",
        name: "Endless: Repeated Rewards (Hard)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-1",
        planetId: "region:duviri",
        name: "Endless: Tier 1",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-1-hard",
        planetId: "region:duviri",
        name: "Endless: Tier 1 (Hard)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-2",
        planetId: "region:duviri",
        name: "Endless: Tier 2",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-3",
        planetId: "region:duviri",
        name: "Endless: Tier 3",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-3-hard",
        planetId: "region:duviri",
        name: "Endless: Tier 3 (Hard)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-4",
        planetId: "region:duviri",
        name: "Endless: Tier 4",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-4-hard",
        planetId: "region:duviri",
        name: "Endless: Tier 4 (Hard)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-6",
        planetId: "region:duviri",
        name: "Endless: Tier 6",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-6-hard",
        planetId: "region:duviri",
        name: "Endless: Tier 6 (Hard)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-7",
        planetId: "region:duviri",
        name: "Endless: Tier 7",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-8",
        planetId: "region:duviri",
        name: "Endless: Tier 8",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-9",
        planetId: "region:duviri",
        name: "Endless: Tier 9",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/endless-tier-9-hard",
        planetId: "region:duviri",
        name: "Endless: Tier 9 (Hard)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/duviri/the-circuit",
        planetId: "region:duviri",
        name: "The Circuit",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Höllvania (drop-data missionRewards) add=11
    // =============================
    {
        id: "node:mr/hollvania/antivirus-bounty",
        planetId: "region:hollvania",
        name: "Antivirus Bounty",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/antivirus-bounty-(caches)",
        planetId: "region:hollvania",
        name: "Antivirus Bounty (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/assassinate-h-09-tank",
        planetId: "region:hollvania",
        name: "Assassinate: H-09 Tank",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/exterminate-scaldra",
        planetId: "region:hollvania",
        name: "Exterminate: Scaldra",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/exterminate-scaldra-(caches)",
        planetId: "region:hollvania",
        name: "Exterminate: Scaldra (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/exterminate-techrot",
        planetId: "region:hollvania",
        name: "Exterminate: Techrot",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/exterminate-techrot-(caches)",
        planetId: "region:hollvania",
        name: "Exterminate: Techrot (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/hell-scrub-scaldra",
        planetId: "region:hollvania",
        name: "Hell-Scrub: Scaldra",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/hell-scrub-techrot",
        planetId: "region:hollvania",
        name: "Hell-Scrub: Techrot",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/legacyte-harvest",
        planetId: "region:hollvania",
        name: "Legacyte Harvest",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/hollvania/solstice-square",
        planetId: "region:hollvania",
        name: "Solstice Square",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Dark Refractory, Deimos (drop-data missionRewards) add=3
    // =============================
    {
        id: "node:mr/dark-refractory-deimos/recall-dactolyst",
        planetId: "region:dark_refractory_deimos",
        name: "Recall: Dactolyst",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/dark-refractory-deimos/recall-hunhullus",
        planetId: "region:dark_refractory_deimos",
        name: "Recall: Hunhullus",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/dark-refractory-deimos/recall-vanguard",
        planetId: "region:dark_refractory_deimos",
        name: "Recall: Vanguard",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Sanctuary (drop-data missionRewards) add=2
    // =============================
    {
        id: "node:mr/sanctuary/elite-sanctuary-onslaught",
        planetId: "auto:sanctuary",
        name: "Elite Sanctuary Onslaught",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/sanctuary/sanctuary-onslaught",
        planetId: "auto:sanctuary",
        name: "Sanctuary Onslaught",
        nodeType: "mission",
        edges: []
    },

    // =============================
    // Veil (drop-data missionRewards) add=30
    // =============================
    {
        id: "node:mr/veil/arc-silver",
        planetId: "region:veil_proxima",
        name: "Arc Silver",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/arc-silver-(caches)",
        planetId: "region:veil_proxima",
        name: "Arc Silver (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/arc-silver-(extra)",
        planetId: "region:veil_proxima",
        name: "Arc Silver (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/calabash",
        planetId: "region:veil_proxima",
        name: "Calabash",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/calabash-(caches)",
        planetId: "region:veil_proxima",
        name: "Calabash (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/calabash-(extra)",
        planetId: "region:veil_proxima",
        name: "Calabash (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/erato",
        planetId: "region:veil_proxima",
        name: "Erato",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/erato-(caches)",
        planetId: "region:veil_proxima",
        name: "Erato (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/erato-(extra)",
        planetId: "region:veil_proxima",
        name: "Erato (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/flexa",
        planetId: "region:veil_proxima",
        name: "Flexa",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/flexa-(caches)",
        planetId: "region:veil_proxima",
        name: "Flexa (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/flexa-(extra)",
        planetId: "region:veil_proxima",
        name: "Flexa (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/h-2-cloud",
        planetId: "region:veil_proxima",
        name: "H-2 Cloud",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/h-2-cloud-(caches)",
        planetId: "region:veil_proxima",
        name: "H-2 Cloud (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/h-2-cloud-(extra)",
        planetId: "region:veil_proxima",
        name: "H-2 Cloud (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/lu-yan",
        planetId: "region:veil_proxima",
        name: "Lu-Yan",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/lu-yan-(caches)",
        planetId: "region:veil_proxima",
        name: "Lu-Yan (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/lu-yan-(extra)",
        planetId: "region:veil_proxima",
        name: "Lu-Yan (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/nsu-grid",
        planetId: "region:veil_proxima",
        name: "Nsu Grid",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/nsu-grid-(caches)",
        planetId: "region:veil_proxima",
        name: "Nsu Grid (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/nsu-grid-(extra)",
        planetId: "region:veil_proxima",
        name: "Nsu Grid (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/numina",
        planetId: "region:veil_proxima",
        name: "Numina",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/numina-(caches)",
        planetId: "region:veil_proxima",
        name: "Numina (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/numina-(extra)",
        planetId: "region:veil_proxima",
        name: "Numina (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/r-9-cloud",
        planetId: "region:veil_proxima",
        name: "R-9 Cloud",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/r-9-cloud-(caches)",
        planetId: "region:veil_proxima",
        name: "R-9 Cloud (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/r-9-cloud-(extra)",
        planetId: "region:veil_proxima",
        name: "R-9 Cloud (Extra)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/sabmir-cloud",
        planetId: "region:veil_proxima",
        name: "Sabmir Cloud",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/sabmir-cloud-(caches)",
        planetId: "region:veil_proxima",
        name: "Sabmir Cloud (Caches)",
        nodeType: "mission",
        edges: []
    },
    {
        id: "node:mr/veil/sabmir-cloud-(extra)",
        planetId: "region:veil_proxima",
        name: "Sabmir Cloud (Extra)",
        nodeType: "mission",
        edges: []
    },
];
