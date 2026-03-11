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
    // Junctions — full Star Chart progression chain
    // =============================
    {
        id: "node:junction_mercury_venus",
        planetId: "planet:mercury",
        name: "Mercury → Venus Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:venus",
        prereqIds: []
    },
    {
        id: "node:junction_venus_earth",
        planetId: "planet:venus",
        name: "Venus → Earth Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:earth",
        prereqIds: [PR.JUNCTION_MERCURY_VENUS]
    },
    {
        id: "node:junction_earth_mars",
        planetId: "planet:earth",
        name: "Earth → Mars Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:mars",
        prereqIds: [PR.VORS_PRIZE, PR.JUNCTION_VENUS_EARTH]
    },
    {
        id: "node:junction_mars_phobos",
        planetId: "planet:mars",
        name: "Mars → Phobos Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:phobos",
        prereqIds: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: "node:junction_mars_ceres",
        planetId: "planet:mars",
        name: "Mars → Ceres Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:ceres",
        prereqIds: [PR.JUNCTION_EARTH_MARS]
    },
    {
        id: "node:junction_mars_deimos",
        planetId: "planet:mars",
        name: "Mars → Deimos Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:deimos",
        prereqIds: [PR.JUNCTION_EARTH_MARS, PR.HEART_OF_DEIMOS]
    },
    {
        id: "node:junction_phobos_ceres",
        planetId: "planet:phobos",
        name: "Phobos → Ceres Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:ceres",
        prereqIds: [PR.JUNCTION_MARS_PHOBOS]
    },
    {
        id: "node:junction_ceres_jupiter",
        planetId: "planet:ceres",
        name: "Ceres → Jupiter Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:jupiter",
        prereqIds: [PR.JUNCTION_PHOBOS_CERES]
    },
    {
        id: "node:junction_jupiter_europa",
        planetId: "planet:jupiter",
        name: "Jupiter → Europa Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:europa",
        prereqIds: [PR.JUNCTION_CERES_JUPITER]
    },
    {
        id: "node:junction_europa_saturn",
        planetId: "planet:europa",
        name: "Europa → Saturn Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:saturn",
        prereqIds: [PR.JUNCTION_JUPITER_EUROPA, PR.ARCHWING]
    },
    {
        id: "node:junction_saturn_uranus",
        planetId: "planet:saturn",
        name: "Saturn → Uranus Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:uranus",
        prereqIds: [PR.JUNCTION_EUROPA_SATURN, PR.STOLEN_DREAMS]
    },
    {
        id: "node:junction_uranus_neptune",
        planetId: "planet:uranus",
        name: "Uranus → Neptune Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:neptune",
        prereqIds: [PR.JUNCTION_SATURN_URANUS]
    },
    {
        id: "node:junction_neptune_pluto",
        planetId: "planet:neptune",
        name: "Neptune → Pluto Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:pluto",
        prereqIds: [PR.JUNCTION_URANUS_NEPTUNE]
    },
    {
        id: "node:junction_pluto_sedna",
        planetId: "planet:pluto",
        name: "Pluto → Sedna Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:sedna",
        prereqIds: [PR.JUNCTION_NEPTUNE_PLUTO]
    },
    {
        id: "node:junction_sedna_eris",
        planetId: "planet:sedna",
        name: "Sedna → Eris Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "planet:eris",
        prereqIds: [PR.JUNCTION_PLUTO_SEDNA, PR.NEW_STRANGE]
    },
    {
        id: "node:junction_earth_lua",
        planetId: "planet:earth",
        name: "Earth → Lua Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "region:lua",
        prereqIds: [PR.SECOND_DREAM]
    },
    {
        id: "node:junction_eris_kuva_fortress",
        planetId: "planet:eris",
        name: "Eris → Kuva Fortress Junction",
        nodeType: "junction",
        pos: undefined,
        edges: [],
        unlocksPlanetId: "region:kuva_fortress",
        prereqIds: [PR.JUNCTION_SEDNA_ERIS, PR.WAR_WITHIN]
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/everest",
        planetId: "planet:earth",
        name: "Everest",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/gaia",
        planetId: "planet:earth",
        name: "Gaia",
        nodeType: "mission",
        pos: { x: -0.2, y: 0.45 },
        edges: []
    },
    {
        id: "node:mr/earth/lith",
        planetId: "planet:earth",
        name: "Lith",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/mantle",
        planetId: "planet:earth",
        name: "Mantle",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/pacific",
        planetId: "planet:earth",
        name: "Pacific",
        nodeType: "mission",
        pos: { x: 0.80, y: 0.7},
        edges: ["node:mr/earth/gaia",]
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
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/earth/iota-temple",
        planetId: "region:earth_proxima",
        name: "Iota Temple",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/korms-belt",
        planetId: "region:earth_proxima",
        name: "Korm's Belt",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/earth/sover-strait",
        planetId: "region:earth_proxima",
        name: "Sover Strait",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
,

    // A few more from your list (no suffix variants)
    {
        id: "node:mr/earth/coba",
        planetId: "planet:earth",
        name: "Coba",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/erpo",
        planetId: "planet:earth",
        name: "Erpo",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/oro",
        planetId: "planet:earth",
        name: "Oro",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/sayas-visions",
        planetId: "planet:earth",
        name: "Saya's Visions",
        nodeType: "quest",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/cervantes",
        planetId: "planet:earth",
        name: "Cervantes",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/bifrost-echo",
        planetId: "region:venus_proxima",
        name: "Bifrost Echo",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/cytherean",
        planetId: "planet:venus",
        name: "Cytherean",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/falling-glory",
        planetId: "region:venus_proxima",
        name: "Falling Glory",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/fossa",
        planetId: "planet:venus",
        name: "Fossa",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
,

    {
        id: "node:mr/venus/kiliken",
        planetId: "planet:venus",
        name: "Kiliken",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/venus/linea",
        planetId: "planet:venus",
        name: "Linea",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/luckless-expanse",
        planetId: "region:venus_proxima",
        name: "Luckless Expanse",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/malva",
        planetId: "planet:venus",
        name: "Malva",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/venus/montes",
        planetId: "planet:venus",
        name: "Montes",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/orvin-haarc",
        planetId: "region:venus_proxima",
        name: "Orvin-Haarc",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/romula",
        planetId: "planet:venus",
        name: "Romula",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/venus/tessera",
        planetId: "planet:venus",
        name: "Tessera",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/venus/unda",
        planetId: "planet:venus",
        name: "Unda",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/v-prime",
        planetId: "planet:venus",
        name: "V Prime",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    {
        id: "node:mr/venus/venera",
        planetId: "planet:venus",
        name: "Venera",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/venus/vesper-strait",
        planetId: "region:venus_proxima",
        name: "Vesper Strait",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/venus/ishtar",
        planetId: "planet:venus",
        name: "Ishtar",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mercury/caduceus",
        planetId: "planet:mercury",
        name: "Caduceus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mercury/caloris",
        planetId: "planet:mercury",
        name: "Caloris",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mercury/elion",
        planetId: "planet:mercury",
        name: "Elion",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mercury/lares",
        planetId: "planet:mercury",
        name: "Lares",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mercury/odin",
        planetId: "planet:mercury",
        name: "Odin",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mercury/suisei",
        planetId: "planet:mercury",
        name: "Suisei",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mercury/tolstoj",
        planetId: "planet:mercury",
        name: "Tolstoj",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mercury/neruda",
        planetId: "planet:mercury",
        name: "Neruda",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mercury/terminus",
        planetId: "planet:mercury",
        name: "Terminus",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/olympus",
        planetId: "planet:mars",
        name: "Olympus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/spear",
        planetId: "planet:mars",
        name: "Spear",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/alator",
        planetId: "planet:mars",
        name: "Alator",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/arval",
        planetId: "planet:mars",
        name: "Arval",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/augustus",
        planetId: "planet:mars",
        name: "Augustus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/ara",
        planetId: "planet:mars",
        name: "Ara",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/martialis",
        planetId: "planet:mars",
        name: "Martialis",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/kadesh",
        planetId: "planet:mars",
        name: "Kadesh",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/war",
        planetId: "planet:mars",
        name: "War",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/wahiba",
        planetId: "planet:mars",
        name: "Wahiba",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/quirinus",
        planetId: "planet:mars",
        name: "Quirinus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/syrtis",
        planetId: "planet:mars",
        name: "Syrtis",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/tyana-pass",
        planetId: "planet:mars",
        name: "Tyana Pass",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/mars/gradivus",
        planetId: "planet:mars",
        name: "Gradivus",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/amalthea",
        planetId: "planet:jupiter",
        name: "Amalthea",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/metis",
        planetId: "planet:jupiter",
        name: "Metis",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/io",
        planetId: "planet:jupiter",
        name: "Io",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/elara",
        planetId: "planet:jupiter",
        name: "Elara",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/callisto",
        planetId: "planet:jupiter",
        name: "Callisto",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/themisto",
        planetId: "planet:jupiter",
        name: "Themisto",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/the-ropalolyst",
        planetId: "planet:jupiter",
        name: "The Ropalolyst",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/sinai",
        planetId: "planet:jupiter",
        name: "Sinai",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/ananke",
        planetId: "planet:jupiter",
        name: "Ananke",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/galilea",
        planetId: "planet:jupiter",
        name: "Galilea",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/cameria",
        planetId: "planet:jupiter",
        name: "Cameria",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/adrastea",
        planetId: "planet:jupiter",
        name: "Adrastea",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/jupiter/carpo",
        planetId: "planet:jupiter",
        name: "Carpo",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/deimos/cambire",
        planetId: "planet:deimos",
        name: "Cambire",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/deimos/effervo",
        planetId: "planet:deimos",
        name: "Effervo",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/deimos/hyf",
        planetId: "planet:deimos",
        name: "Hyf",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/deimos/magnacidium",
        planetId: "planet:deimos",
        name: "Magnacidium",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/deimos/munio",
        planetId: "planet:deimos",
        name: "Munio",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/deimos/nex",
        planetId: "planet:deimos",
        name: "Nex",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/deimos/persto",
        planetId: "planet:deimos",
        name: "Persto",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/deimos/terrorem",
        planetId: "planet:deimos",
        name: "Terrorem",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/deimos/formido",
        planetId: "planet:deimos",
        name: "Formido",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/flimnap",
        planetId: "planet:phobos",
        name: "Flimnap",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/grildrig",
        planetId: "planet:phobos",
        name: "Grildrig",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/gulliver",
        planetId: "planet:phobos",
        name: "Gulliver",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/iliad",
        planetId: "planet:phobos",
        name: "Iliad",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/kepler",
        planetId: "planet:phobos",
        name: "Kepler",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/limtoc",
        planetId: "planet:phobos",
        name: "Limtoc",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/memphis",
        planetId: "planet:phobos",
        name: "Memphis",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/monolith",
        planetId: "planet:phobos",
        name: "Monolith",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/opik",
        planetId: "planet:phobos",
        name: "Opik",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/shklovsky",
        planetId: "planet:phobos",
        name: "Shklovsky",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/skyresh",
        planetId: "planet:phobos",
        name: "Skyresh",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/stickney",
        planetId: "planet:phobos",
        name: "Stickney",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/todd",
        planetId: "planet:phobos",
        name: "Todd",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/wendell",
        planetId: "planet:phobos",
        name: "Wendell",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/phobos/zeugma",
        planetId: "planet:phobos",
        name: "Zeugma",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/casta",
        planetId: "planet:ceres",
        name: "Casta",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/cinxia",
        planetId: "planet:ceres",
        name: "Cinxia",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/draco",
        planetId: "planet:ceres",
        name: "Draco",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/egeria",
        planetId: "planet:ceres",
        name: "Egeria",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/exta",
        planetId: "planet:ceres",
        name: "Exta",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/gabii",
        planetId: "planet:ceres",
        name: "Gabii",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/hapke",
        planetId: "planet:ceres",
        name: "Hapke",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/lex",
        planetId: "planet:ceres",
        name: "Lex",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/nuovo",
        planetId: "planet:ceres",
        name: "Nuovo",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/olla",
        planetId: "planet:ceres",
        name: "Olla",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/seimeni",
        planetId: "planet:ceres",
        name: "Seimeni",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/varro",
        planetId: "planet:ceres",
        name: "Varro",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/ker",
        planetId: "planet:ceres",
        name: "Ker",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/ceres/thon",
        planetId: "planet:ceres",
        name: "Thon",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/beleth",
        planetId: "planet:europa",
        name: "Beleth",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/cholistan",
        planetId: "planet:europa",
        name: "Cholistan",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/cryotic-front",
        planetId: "planet:europa",
        name: "Cryotic Front",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/eligor",
        planetId: "planet:europa",
        name: "Eligor",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/gamygyn",
        planetId: "planet:europa",
        name: "Gamygyn",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/larzac",
        planetId: "planet:europa",
        name: "Larzac",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/lillith",
        planetId: "planet:europa",
        name: "Lillith",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/naamah",
        planetId: "planet:europa",
        name: "Naamah",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/orias",
        planetId: "planet:europa",
        name: "Orias",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/ose",
        planetId: "planet:europa",
        name: "Ose",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/paimon",
        planetId: "planet:europa",
        name: "Paimon",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/shax",
        planetId: "planet:europa",
        name: "Shax",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/valac",
        planetId: "planet:europa",
        name: "Valac",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/valefor",
        planetId: "planet:europa",
        name: "Valefor",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/europa/zagan",
        planetId: "planet:europa",
        name: "Zagan",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/annihilation",
        planetId: "planet:saturn",
        name: "Annihilation",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/anthe",
        planetId: "planet:saturn",
        name: "Anthe",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/caracol",
        planetId: "planet:saturn",
        name: "Caracol",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/cassini",
        planetId: "planet:saturn",
        name: "Cassini",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/cephalon-capture",
        planetId: "planet:saturn",
        name: "Cephalon Capture",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/dione",
        planetId: "planet:saturn",
        name: "Dione",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/helene",
        planetId: "planet:saturn",
        name: "Helene",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/kasios-rest",
        planetId: "region:saturn_proxima",
        name: "Kasio's Rest",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/lunaro-arena",
        planetId: "planet:saturn",
        name: "Lunaro Arena",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/lupal-pass",
        planetId: "region:saturn_proxima",
        name: "Lupal Pass",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/mimas",
        planetId: "planet:saturn",
        name: "Mimas",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/mordo-cluster",
        planetId: "region:saturn_proxima",
        name: "Mordo Cluster",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/nodo-gap",
        planetId: "region:saturn_proxima",
        name: "Nodo Gap",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/numa",
        planetId: "planet:saturn",
        name: "Numa",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/pandora",
        planetId: "planet:saturn",
        name: "Pandora",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/phoebe",
        planetId: "planet:saturn",
        name: "Phoebe",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/piscinas",
        planetId: "planet:saturn",
        name: "Piscinas",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/rhea",
        planetId: "planet:saturn",
        name: "Rhea",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/team-annihilation",
        planetId: "planet:saturn",
        name: "Team Annihilation",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/tethys",
        planetId: "planet:saturn",
        name: "Tethys",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/titan",
        planetId: "planet:saturn",
        name: "Titan",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/vand-cluster",
        planetId: "region:saturn_proxima",
        name: "Vand Cluster",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/variant-annihilation",
        planetId: "planet:saturn",
        name: "Variant Annihilation",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/variant-cephalon-capture",
        planetId: "planet:saturn",
        name: "Variant Cephalon Capture",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/variant-team-annihilation",
        planetId: "planet:saturn",
        name: "Variant Team Annihilation",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn-proxima/pallene",
        planetId: "region:saturn_proxima",
        name: "Pallene",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/calypso",
        planetId: "planet:saturn",
        name: "Calypso",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/saturn/pallene",
        planetId: "planet:saturn",
        name: "Pallene",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/assur",
        planetId: "planet:uranus",
        name: "Assur",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/bianca",
        planetId: "planet:uranus",
        name: "Bianca",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/brutus",
        planetId: "planet:uranus",
        name: "Brutus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/caelus",
        planetId: "planet:uranus",
        name: "Caelus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/caliban",
        planetId: "planet:uranus",
        name: "Caliban",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/cupid",
        planetId: "planet:uranus",
        name: "Cupid",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/mab",
        planetId: "planet:uranus",
        name: "Mab",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/miranda",
        planetId: "planet:uranus",
        name: "Miranda",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/ophelia",
        planetId: "planet:uranus",
        name: "Ophelia",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/rosalind",
        planetId: "planet:uranus",
        name: "Rosalind",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/stephano",
        planetId: "planet:uranus",
        name: "Stephano",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/titania",
        planetId: "planet:uranus",
        name: "Titania",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/trinculo",
        planetId: "planet:uranus",
        name: "Trinculo",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/umbriel",
        planetId: "planet:uranus",
        name: "Umbriel",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/ur",
        planetId: "planet:uranus",
        name: "Ur",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/desdemona",
        planetId: "planet:uranus",
        name: "Desdemona",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/portia",
        planetId: "planet:uranus",
        name: "Portia",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/prospero",
        planetId: "planet:uranus",
        name: "Prospero",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/uranus/setebos",
        planetId: "planet:uranus",
        name: "Setebos",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/brom-cluster",
        planetId: "region:neptune_proxima",
        name: "Brom Cluster",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/cephalon-capture",
        planetId: "planet:neptune",
        name: "Cephalon Capture",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/despina",
        planetId: "planet:neptune",
        name: "Despina",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/enkidu-ice-drifts",
        planetId: "region:neptune_proxima",
        name: "Enkidu Ice Drifts",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/galatea",
        planetId: "planet:neptune",
        name: "Galatea",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/kelashin",
        planetId: "planet:neptune",
        name: "Kelashin",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/laomedeia",
        planetId: "planet:neptune",
        name: "Laomedeia",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/mammons-prospect",
        planetId: "region:neptune_proxima",
        name: "Mammon's Prospect",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/nereid",
        planetId: "planet:neptune",
        name: "Nereid",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/nu-gua-mines",
        planetId: "region:neptune_proxima",
        name: "Nu-Gua Mines",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/proteus",
        planetId: "planet:neptune",
        name: "Proteus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/psamathe",
        planetId: "planet:neptune",
        name: "Psamathe",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/salacia",
        planetId: "planet:neptune",
        name: "Salacia",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/sovereign-grasp",
        planetId: "region:neptune_proxima",
        name: "Sovereign Grasp",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/the-index-endurance",
        planetId: "planet:neptune",
        name: "The Index: Endurance",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/the-index-endurance-high-risk",
        planetId: "planet:neptune",
        name: "The Index: Endurance (High Risk)",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/the-index-endurance-low-risk",
        planetId: "planet:neptune",
        name: "The Index: Endurance (Low Risk)",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/the-index-endurance-medium-risk",
        planetId: "planet:neptune",
        name: "The Index: Endurance (Medium Risk)",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/triton",
        planetId: "planet:neptune",
        name: "Triton",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune/yursa",
        planetId: "planet:neptune",
        name: "Yursa",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune-proxima/halimede",
        planetId: "region:neptune_proxima",
        name: "Halimede",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/neptune-proxima/thalassa",
        planetId: "region:neptune_proxima",
        name: "Thalassa",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/corb",
        planetId: "planet:pluto",
        name: "Corb",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/fentons-field",
        planetId: "region:pluto_proxima",
        name: "Fenton's Field",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/hades",
        planetId: "planet:pluto",
        name: "Hades",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/hieracon",
        planetId: "planet:pluto",
        name: "Hieracon",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/hydra",
        planetId: "planet:pluto",
        name: "Hydra",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/khufu-envoy",
        planetId: "region:pluto_proxima",
        name: "Khufu Envoy",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/obol-crossing",
        planetId: "region:pluto_proxima",
        name: "Obol Crossing",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/oceanum",
        planetId: "planet:pluto",
        name: "Oceanum",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/outer-terminus",
        planetId: "planet:pluto",
        name: "Outer Terminus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/palus",
        planetId: "planet:pluto",
        name: "Palus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/peregrine-axis",
        planetId: "region:pluto_proxima",
        name: "Peregrine Axis",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/profit-margin",
        planetId: "region:pluto_proxima",
        name: "Profit Margin",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/regna",
        planetId: "planet:pluto",
        name: "Regna",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/sechura",
        planetId: "planet:pluto",
        name: "Sechura",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto/seven-sirens",
        planetId: "region:pluto_proxima",
        name: "Seven Sirens",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto-proxima/charon",
        planetId: "region:pluto_proxima",
        name: "Charon",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/pluto-proxima/cypress",
        planetId: "region:pluto_proxima",
        name: "Cypress",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/berehynia",
        planetId: "planet:sedna",
        name: "Berehynia",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/camenae",
        planetId: "planet:sedna",
        name: "Camenae",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/hydron",
        planetId: "planet:sedna",
        name: "Hydron",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/jengu",
        planetId: "planet:sedna",
        name: "Jengu",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/kappa",
        planetId: "planet:sedna",
        name: "Kappa",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/kelpie",
        planetId: "planet:sedna",
        name: "Kelpie",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/merrow",
        planetId: "planet:sedna",
        name: "Merrow",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/naga",
        planetId: "planet:sedna",
        name: "Naga",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/nakki",
        planetId: "planet:sedna",
        name: "Nakki",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/sangeru",
        planetId: "planet:sedna",
        name: "Sangeru",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/scylla",
        planetId: "planet:sedna",
        name: "Scylla",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/selkie",
        planetId: "planet:sedna",
        name: "Selkie",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/tikoloshe",
        planetId: "planet:sedna",
        name: "Tikoloshe",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/undine",
        planetId: "planet:sedna",
        name: "Undine",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/veles",
        planetId: "planet:sedna",
        name: "Veles",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/vodyanoi",
        planetId: "planet:sedna",
        name: "Vodyanoi",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/yam",
        planetId: "planet:sedna",
        name: "Yam",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/yemaja",
        planetId: "planet:sedna",
        name: "Yemaja",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/phithale",
        planetId: "planet:sedna",
        name: "Phithale",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sedna/rusalka",
        planetId: "planet:sedna",
        name: "Rusalka",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/brugia",
        planetId: "planet:eris",
        name: "Brugia",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/cosis",
        planetId: "planet:eris",
        name: "Cosis",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/cyath",
        planetId: "planet:eris",
        name: "Cyath",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/gnathos",
        planetId: "planet:eris",
        name: "Gnathos",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/hymeno",
        planetId: "planet:eris",
        name: "Hymeno",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/isos",
        planetId: "planet:eris",
        name: "Isos",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/ixodes",
        planetId: "planet:eris",
        name: "Ixodes",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/kala-azar",
        planetId: "planet:eris",
        name: "Kala-Azar",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/nimus",
        planetId: "planet:eris",
        name: "Nimus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/oestrus",
        planetId: "planet:eris",
        name: "Oestrus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/phalan",
        planetId: "planet:eris",
        name: "Phalan",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/ranova",
        planetId: "planet:eris",
        name: "Ranova",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/sparga",
        planetId: "planet:eris",
        name: "Sparga",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/sporid",
        planetId: "planet:eris",
        name: "Sporid",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/xini",
        planetId: "planet:eris",
        name: "Xini",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/zabala",
        planetId: "planet:eris",
        name: "Zabala",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/candiru",
        planetId: "planet:eris",
        name: "Candiru",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/lepis",
        planetId: "planet:eris",
        name: "Lepis",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/naeglar",
        planetId: "planet:eris",
        name: "Naeglar",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/psoro",
        planetId: "planet:eris",
        name: "Psoro",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/eris/viver",
        planetId: "planet:eris",
        name: "Viver",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/lua/circulus",
        planetId: "region:lua",
        name: "Circulus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/lua/copernicus",
        planetId: "region:lua",
        name: "Copernicus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/lua/pavlov",
        planetId: "region:lua",
        name: "Pavlov",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/lua/stofler",
        planetId: "region:lua",
        name: "StöFler",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/lua/tycho",
        planetId: "region:lua",
        name: "Tycho",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/lua/yuvarium",
        planetId: "region:lua",
        name: "Yuvarium",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/lua/zeipel",
        planetId: "region:lua",
        name: "Zeipel",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/lua/plato",
        planetId: "region:lua",
        name: "Plato",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    // =============================
    // Kuva Fortress (drop-data missionRewards) add=6
    // =============================,
    {
        id: "node:mr/kuva-fortress/garus",
        planetId: "region:kuva_fortress",
        name: "Garus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/nabuk",
        planetId: "region:kuva_fortress",
        name: "Nabuk",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/pago",
        planetId: "region:kuva_fortress",
        name: "Pago",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/tamu",
        planetId: "region:kuva_fortress",
        name: "Tamu",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/taveuni",
        planetId: "region:kuva_fortress",
        name: "Taveuni",
        nodeType: "boss",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/kuva-fortress/dakata",
        planetId: "region:kuva_fortress",
        name: "Dakata",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/aten",
        planetId: "region:void",
        name: "Aten",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/belenus",
        planetId: "region:void",
        name: "Belenus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/hepit",
        planetId: "region:void",
        name: "Hepit",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/marduk",
        planetId: "region:void",
        name: "Marduk",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/mithra",
        planetId: "region:void",
        name: "Mithra",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/mot",
        planetId: "region:void",
        name: "Mot",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/oxomoco",
        planetId: "region:void",
        name: "Oxomoco",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/stribog",
        planetId: "region:void",
        name: "Stribog",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/taranis",
        planetId: "region:void",
        name: "Taranis",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/teshub",
        planetId: "region:void",
        name: "Teshub",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/tiwaz",
        planetId: "region:void",
        name: "Tiwaz",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/void/ukko",
        planetId: "region:void",
        name: "Ukko",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/zariman/halako-perimeter",
        planetId: "region:zariman",
        name: "Halako Perimeter",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/zariman/oro-works",
        planetId: "region:zariman",
        name: "Oro Works",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/zariman/the-greenway",
        planetId: "region:zariman",
        name: "The Greenway",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/zariman/tuvul-commons",
        planetId: "region:zariman",
        name: "Tuvul Commons",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    // =============================
    // Duviri — real selectable game modes from the star chart
    // =============================
    {
        id: "node:mr/duviri/the-duviri-experience",
        planetId: "region:duviri",
        name: "The Duviri Experience",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/duviri/the-lone-story",
        planetId: "region:duviri",
        name: "The Lone Story",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/duviri/the-circuit",
        planetId: "region:duviri",
        name: "The Circuit",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/duviri/the-circuit-hard",
        planetId: "region:duviri",
        name: "The Circuit (Hard)",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/hollvania/assassinate-h-09-tank",
        planetId: "region:hollvania",
        name: "Assassinate: H-09 Tank",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/hollvania/exterminate-scaldra",
        planetId: "region:hollvania",
        name: "Exterminate: Scaldra",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/hollvania/exterminate-techrot",
        planetId: "region:hollvania",
        name: "Exterminate: Techrot",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/hollvania/hell-scrub-scaldra",
        planetId: "region:hollvania",
        name: "Hell-Scrub: Scaldra",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/hollvania/hell-scrub-techrot",
        planetId: "region:hollvania",
        name: "Hell-Scrub: Techrot",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/hollvania/legacyte-harvest",
        planetId: "region:hollvania",
        name: "Legacyte Harvest",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/hollvania/solstice-square",
        planetId: "region:hollvania",
        name: "Solstice Square",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/dark-refractory-deimos/recall-hunhullus",
        planetId: "region:dark_refractory_deimos",
        name: "Recall: Hunhullus",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/dark-refractory-deimos/recall-vanguard",
        planetId: "region:dark_refractory_deimos",
        name: "Recall: Vanguard",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    // =============================
    // Sanctuary (drop-data missionRewards) add=2
    // =============================
    {
        id: "node:mr/sanctuary/elite-sanctuary-onslaught",
        planetId: "region:sanctuary",
        name: "Elite Sanctuary Onslaught",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/sanctuary/sanctuary-onslaught",
        planetId: "region:sanctuary",
        name: "Sanctuary Onslaught",
        nodeType: "mission",
        pos: undefined,
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
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/veil/calabash",
        planetId: "region:veil_proxima",
        name: "Calabash",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/veil/erato",
        planetId: "region:veil_proxima",
        name: "Erato",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/veil/flexa",
        planetId: "region:veil_proxima",
        name: "Flexa",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/veil/h-2-cloud",
        planetId: "region:veil_proxima",
        name: "H-2 Cloud",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/veil/lu-yan",
        planetId: "region:veil_proxima",
        name: "Lu-Yan",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/veil/nsu-grid",
        planetId: "region:veil_proxima",
        name: "Nsu Grid",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/veil/numina",
        planetId: "region:veil_proxima",
        name: "Numina",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/veil/r-9-cloud",
        planetId: "region:veil_proxima",
        name: "R-9 Cloud",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/veil/sabmir-cloud",
        planetId: "region:veil_proxima",
        name: "Sabmir Cloud",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },

    // =============================
    // Hub / Open World nodes
    // These are nodes that appear as selectable locations in the Star Chart
    // but lead to social hubs or open-world zones rather than standard missions.
    // =============================

    // --- Earth hubs & missing mission nodes ---
    {
        id: "node:mr/earth/e-prime",
        planetId: "planet:earth",
        name: "E Prime",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:mr/earth/mariana",
        planetId: "planet:earth",
        name: "Mariana",
        nodeType: "mission",
        pos: undefined,
        edges: []
    },
    {
        id: "node:hub/earth/strata-relay",
        planetId: "planet:earth",
        name: "Strata Relay",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },
    {
        id: "node:hub/earth/cetus",
        planetId: "planet:earth",
        name: "Cetus",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Venus hubs ---
    {
        id: "node:hub/venus/fortuna",
        planetId: "planet:venus",
        name: "Fortuna",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },
    {
        id: "node:hub/venus/vesper-relay",
        planetId: "planet:venus",
        name: "Vesper Relay",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Mercury hubs ---
    {
        id: "node:hub/mercury/larunda-relay",
        planetId: "planet:mercury",
        name: "Larunda Relay",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Deimos hubs ---
    {
        id: "node:hub/deimos/necralisk",
        planetId: "planet:deimos",
        name: "Necralisk",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Mars hubs ---
    {
        id: "node:hub/mars/maroos-bazaar",
        planetId: "planet:mars",
        name: "Maroo's Bazaar",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Europa hubs ---
    // Leonov Relay is on Europa (destroyed; still appears as a node).
    {
        id: "node:hub/europa/leonov-relay",
        planetId: "planet:europa",
        name: "Leonov Relay",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Saturn hubs ---
    {
        id: "node:hub/saturn/kronia-relay",
        planetId: "planet:saturn",
        name: "Kronia Relay",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Pluto hubs ---
    {
        id: "node:hub/pluto/orcus-relay",
        planetId: "planet:pluto",
        name: "Orcus Relay",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Eris hubs ---
    // Kuiper Relay is on Eris (destroyed; still appears as a node).
    {
        id: "node:hub/eris/kuiper-relay",
        planetId: "planet:eris",
        name: "Kuiper Relay",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Zariman hubs ---
    {
        id: "node:hub/zariman/chrysalith",
        planetId: "region:zariman",
        name: "Chrysalith",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },

    // --- Höllvania hubs ---
    {
        id: "node:hub/hollvania/sanctum-anatomica",
        planetId: "region:hollvania",
        name: "Sanctum Anatomica",
        nodeType: "hub",
        pos: undefined,
        edges: []
    },
];
