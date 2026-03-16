// ===== FILE: src/utils/profileImport.ts =====
// src/utils/profileImport.ts
import type { SyndicateState } from "../domain/types";
import { isOverLevelWeapon } from "../domain/catalog/overLevelWeapons";

// ---------------------------------------------------------------------------
// Affiliation tag → canonical syndicate ID mapping.
// Warframe API uses raw tag strings (e.g. "ArbitersSyndicate") while this app
// uses internal canonical IDs (e.g. "syndicate_arbiters_of_hexis"). Unknown
// tags are skipped during import.
// ---------------------------------------------------------------------------
const AFFILIATION_TAG_TO_SYNDICATE_ID: Record<string, string> = {
    // Relay faction syndicates
    "SteelMeridianSyndicate":   "syndicate_steel_meridian",
    "ArbitersSyndicate":        "syndicate_arbiters_of_hexis",
    "CephalonSudaSyndicate":    "syndicate_cephalon_suda",
    "PerrinSyndicate":          "syndicate_perrin_sequence",
    "RedVeilSyndicate":         "syndicate_red_veil",
    "NewLokaSyndicate":         "syndicate_new_loka",
    // Cetus
    "CetusSyndicate":           "syndicate_ostron",
    "QuillsSyndicate":          "syndicate_quills",
    // Fortuna
    "SolarisSyndicate":         "syndicate_solaris_united",
    "VoxSyndicate":             "syndicate_vox_solaris",
    "VentKidsSyndicate":        "syndicate_ventkids",
    // Necralisk / Deimos
    "EntratiSyndicate":         "syndicate_entrati",
    "NecraloidSyndicate":       "syndicate_necraloid",
    "EntratiLabSyndicate":      "syndicate_cavia",
    // Chrysalith / Zariman
    "ZarimanSyndicate":         "syndicate_holdfasts",
    // 1999
    "HexSyndicate":             "syndicate_hex_1999",
    // Miscellaneous
    "LibrarySyndicate":         "syndicate_cephalon_simaris",
    "ConclaveSyndicate":        "syndicate_conclave",
    "KahlSyndicate":            "syndicate_kahls_garrison",
    "NightcapJournalSyndicate": "syndicate_nightcap",
    // Nightwave — all seasons map to the same canonical ID; the import takes
    // the highest Title value found across multiple entries.
    "RadioLegion2Syndicate":             "syndicate_nightwave",
    "RadioLegionIntermission1Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission2Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission3Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission4Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission5Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission6Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission7Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission8Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission9Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission10Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission11Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission12Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission13Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission14Syndicate": "syndicate_nightwave",
    "RadioLegionIntermission15Syndicate": "syndicate_nightwave",
};

/** Maximum achievable rank per canonical syndicate ID. */
const SYNDICATE_MAX_RANK: Record<string, number> = {
    "syndicate_nightwave":          180,
    "syndicate_necraloid":          3,
    "syndicate_kahls_garrison":     5,
    // All others default to 5 (handled below)
};

/** Minimum rank per canonical syndicate ID (relay factions can go negative). */
const SYNDICATE_MIN_RANK: Record<string, number> = {
    "syndicate_steel_meridian":     -2,
    "syndicate_arbiters_of_hexis":  -2,
    "syndicate_cephalon_suda":      -2,
    "syndicate_perrin_sequence":    -2,
    "syndicate_red_veil":           -2,
    "syndicate_new_loka":           -2,
};

export type ProfileImportResult = {
    displayName: string;
    masteryRank: number | null;

    clan?: {
        name?: string;
        tier?: number;
        clanClass?: number;
        xp?: number;
    };

    syndicates: SyndicateState[];

    mastery: {
        xpByItem: Record<string, number>;
        mastered: Record<string, boolean>;
    };

    missions: {
        completesByTag: Record<string, number>;
    };

    /** Star chart node IDs derived from completed mission tags (normal mode only). */
    completedNodeIds: string[];

    challenges?: {
        progress: Record<string, number>;
        completed: Record<string, boolean>;
    };

    intrinsics?: {
        railjack: Record<string, number>;
        duviri: Record<string, number>;
    };
};

function isObject(v: unknown): v is Record<string, any> {
    return !!v && typeof v === "object" && !Array.isArray(v);
}

function clampInt(n: unknown, fallback: number): number {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return fallback;
    return Math.max(0, Math.floor(v));
}

function clampIntSigned(n: unknown, fallback: number, min: number, max: number): number {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return fallback;
    const x = Math.floor(v);
    return Math.max(min, Math.min(max, x));
}

function getResultRoot(payload: any): any {
    // Most responses are { Results: [ { ... } ] }
    if (isObject(payload) && Array.isArray(payload.Results) && payload.Results.length > 0) {
        return payload.Results[0];
    }
    return payload;
}

function addXp(
    xpByItem: Record<string, number>,
    itemType: unknown,
    xp: unknown
): void {
    if (typeof itemType !== "string" || !itemType.trim()) return;

    const v = typeof xp === "number" ? xp : Number(xp);
    if (!Number.isFinite(v)) return;

    const key = itemType;
    const next = Math.max(0, Math.floor(v));
    const prev = xpByItem[key];

    xpByItem[key] = typeof prev === "number" ? Math.max(prev, next) : next;
}

/**
 * Returns the mastery XP threshold for an item based on its internal path.
 *
 * Thresholds (rank 30 cumulative XP):
 *   - Weapons (primary, secondary, melee, archwing weapons, sentinel weapons,
 *     companion weapons, exalted/ability weapons): 450,000
 *   - Everything else (warframes, archwings, companions/sentinels, necramechs): 900,000
 */
function getMasteryThreshold(itemType: string): number {
    const t = itemType.toLowerCase();

    // Plexus: the Railjack loadout item counts toward mastery like a Warframe (900k XP).
    if (t === "/lotus/types/game/crewship/railjack/defaultharness") return 900_000;

    // Standard weapons: /Lotus/Weapons/...
    if (t.includes("/lotus/weapons/")) return 450_000;

    // Sentinel weapons and companion beast/kavat/kubrow weapons (explicit path fragments)
    if (t.includes("/sentinelweapons/") || t.includes("/beastweapons/")) return 450_000;

    // Exalted / ability weapons embedded under powersuit or type paths.
    // These are identified by a weapon-type word in the last path segment
    // (e.g. DoomSword, ExaltedBow, BerserkerMelee, NinjaStormWeapon, ZanukaPetMeleeWeaponIP).
    const seg = t.split("/").filter(Boolean).pop() ?? "";
    if (
        seg.includes("weapon") ||
        seg.endsWith("melee") ||
        seg.endsWith("sword") ||
        seg.endsWith("blade") ||
        seg.endsWith("bow") ||
        seg.endsWith("pistol") ||
        seg.endsWith("pistols") ||
        seg.endsWith("rifle") ||
        seg.endsWith("staff") ||
        seg.endsWith("fist") ||
        seg.endsWith("claws") ||
        seg.endsWith("guitar") ||
        seg.endsWith("book") ||
        seg.endsWith("sniper")
    ) {
        return 450_000;
    }

    // Warframes, archwings, companions, sentinels, necramechs → 900,000
    return 900_000;
}

/**
 * Paths that appear in LoadOutInventory XP data but do NOT grant mastery rank.
 *
 * - Venari / Venari Prime: Khora's exalted ability companion. The game XP-tracks her
 *   separately but she is not listed in the Codex and does not grant mastery.
 */
const NON_MASTERY_PATHS = new Set<string>([
    "/Lotus/Powersuits/Khora/Kavat/KhoraKavatPowerSuit",     // Venari
    "/Lotus/Powersuits/Khora/Kavat/KhoraPrimeKavatPowerSuit" // Venari Prime
]);

function computeMastered(xpByItem: Record<string, number>): Record<string, boolean> {
    const mastered: Record<string, boolean> = {};
    for (const [k, xp] of Object.entries(xpByItem)) {
        // Skip items that carry XP in the profile but don't grant mastery.
        if (NON_MASTERY_PATHS.has(k)) continue;

        // Overlevel weapons (Kuva/Tenet/Coda/Paracesis) require rank 40, which
        // involves multiple Forma cycles — their XP is not a reliable mastery signal.
        // Leave them false here; the player confirms them manually in the UI.
        if (isOverLevelWeapon(k)) continue;

        mastered[k] = xp >= getMasteryThreshold(k);
    }
    return mastered;
}

function tryExtractJsonFromHtml(raw: string): string | null {
    // When saved from the browser, the JSON is typically embedded in an HTML document.
    // In your sample, the JSON begins at {"Results"... and ends right before the next "<".
    const start = raw.indexOf('{"Results"');
    if (start < 0) {
        return null;
    }

    const end = raw.indexOf("<", start);
    if (end < 0) {
        // If we can't find a "<", fall back to the remainder (may still be valid JSON).
        return raw.slice(start).trim();
    }

    const candidate = raw.slice(start, end).trim();
    if (!candidate.startsWith("{")) {
        return null;
    }
    return candidate;
}

/**
 * Maps Warframe profile mission tags (e.g. "SolNode21", "SettlementNode1",
 * "EarthToMarsJunction") to our internal star chart node IDs.
 *
 * The profile API does NOT return full Lotus paths — it returns the short tag
 * strings used in the game's solNodes data.
 */
const SOL_NODE_TO_NODE_ID: Record<string, string> = {
    // Junctions — profile uses e.g. "EarthToMarsJunction"
    "VenusToMercuryJunction": "node:junction_mercury_venus",
    "EarthToVenusJunction": "node:junction_venus_earth",
    "EarthToMarsJunction": "node:junction_earth_mars",
    "MarsToPhobosJunction": "node:junction_mars_phobos",
    "MarsToCeresJunction": "node:junction_mars_ceres",
    "MarsToDeimosJunction": "node:junction_mars_deimos",
    "PhobosToCeresJunction": "node:junction_phobos_ceres",
    "CeresToJupiterJunction": "node:junction_ceres_jupiter",
    "JupiterToEuropaJunction": "node:junction_jupiter_europa",
    "JupiterToSaturnJunction": "node:junction_europa_saturn",
    "SaturnToUranusJunction": "node:junction_saturn_uranus",
    "UranusToNeptuneJunction": "node:junction_uranus_neptune",
    "NeptuneToPlutoJunction": "node:junction_neptune_pluto",
    "PlutoToErisJunction": "node:junction_pluto_sedna",
    "ErisToSednaJunction": "node:junction_sedna_eris",
    "EarthToLuaJunction": "node:junction_earth_lua",
    // SolNode tags (generated from solNodes.json "value" field)
    "SolNode1": "node:mr/neptune/galatea",
    "SolNode2": "node:mr/venus/aphrodite",
    "SolNode3": "node:mr/uranus/cordelia",
    "SolNode4": "node:mr/pluto/acheron",
    "SolNode5": "node:mr/uranus/perdita",
    "SolNode6": "node:mr/neptune/despina",
    "SolNode7": "node:mr/saturn/epimetheus",
    "SolNode8": "node:mr/pluto/nix",
    "SolNode9": "node:mr/uranus/rosalind",
    "SolNode10": "node:mr/jupiter/thebe",
    "SolNode11": "node:mr/saturn/dione",
    "SolNode12": "node:mr/ceres/gabii",
    "SolNode13": "node:mr/neptune/proteus",
    "SolNode14": "node:mr/mars/war",
    "SolNode15": "node:mr/earth/everest",
    "SolNode16": "node:mr/earth/lith",
    "SolNode17": "node:mr/ceres/seimeni",
    "SolNode18": "node:mr/jupiter/amalthea",
    "SolNode19": "node:mr/ceres/bode",
    "SolNode20": "node:mr/mars/wahiba",
    "SolNode21": "node:mr/pluto/narcissus",
    "SolNode22": "node:mr/ceres/egeria",
    "SolNode23": "node:mr/pluto/outer-terminus",
    "SolNode24": "node:mr/mars/spear",
    "SolNode25": "node:mr/ceres/draco",
    "SolNode26": "node:mr/ceres/exta",
    "SolNode27": "node:mr/ceres/varro",
    "SolNode28": "node:mr/saturn/cassini",
    "SolNode29": "node:mr/void/mithra",
    "SolNode30": "node:mr/mars/olympus",
    "SolNode31": "node:mr/uranus/ariel",
    "SolNode32": "node:mr/saturn/helene",
    "SolNode33": "node:mr/earth/cervantes",
    "SolNode34": "node:mr/saturn/rhea",
    "SolNode35": "node:mr/phobos/zeugma",
    "SolNode36": "node:mr/mars/ara",
    "SolNode38": "node:mr/earth/earth-junction",
    "SolNode39": "node:mr/mars/shklovsky",
    "SolNode40": "node:mr/void/ani",
    "SolNode41": "node:mr/europa/valefor",
    "SolNode42": "node:mr/mars/tharsis",
    "SolNode43": "node:mr/mercury/apollodorus",
    "SolNode44": "node:mr/mars/kadesh",
    "SolNode45": "node:mr/mars/augustus",
    "SolNode46": "node:mr/mars/vallis",
    "SolNode47": "node:mr/mercury/cinxia",
    "SolNode48": "node:mr/mercury/elion",
    "SolNode49": "node:mr/mercury/lares",
    "SolNode50": "node:mr/mercury/tolstoj",
    "SolNode51": "node:mr/mercury/caduceus",
    "SolNode53": "node:mr/mercury/caloris",
    "SolNode54": "node:mr/mercury/pantheon",
    "SolNode56": "node:mr/venus/tessera",
    "SolNode57": "node:mr/venus/romula",
    "SolNode58": "node:mr/venus/malva",
    "SolNode59": "node:mr/venus/cytherean",
    "SolNode60": "node:mr/venus/linea",
    "SolNode61": "node:mr/venus/vesper",
    "SolNode62": "node:mr/venus/kiliken",
    "SolNode63": "node:mr/venus/fossa",
    "SolNode64": "node:mr/venus/ishtar",
    "SolNode65": "node:mr/venus/v-prime",
    "SolNode66": "node:mr/venus/venera",
    "SolNode67": "node:mr/earth/e-prime",
    "SolNode68": "node:mr/earth/pacific",
    "SolNode69": "node:mr/earth/mariana",
    "SolNode70": "node:mr/earth/gaia",
    "SolNode71": "node:mr/earth/mantle",
    "SolNode72": "node:mr/earth/cambria",
    "SolNode73": "node:mr/earth/eurasia",
    "SolNode74": "node:mr/earth/tikal",
    "SolNode75": "node:mr/earth/oro",
    "SolNode76": "node:mr/phobos/shklovsky",
    "SolNode78": "node:mr/phobos/skyresh",
    "SolNode79": "node:mr/phobos/roche",
    "SolNode80": "node:mr/phobos/grildrig",
    "SolNode81": "node:mr/phobos/stickney",
    "SolNode82": "node:mr/phobos/drunlo",
    "SolNode83": "node:mr/phobos/limtoc",
    "SolNode84": "node:mr/phobos/iliad",
    "SolNode85": "node:mr/phobos/gulliver",
    "SolNode87": "node:mr/phobos/monolith",
    "SolNode88": "node:mr/phobos/opik",
    "SolNode89": "node:mr/phobos/wendell",
    "SolNode91": "node:mr/ceres/hapke",
    "SolNode93": "node:mr/ceres/cinxia",
    "SolNode94": "node:mr/ceres/nuovo",
    "SolNode96": "node:mr/ceres/ludi",
    "SolNode97": "node:mr/ceres/ker",
    "SolNode98": "node:mr/ceres/thon",
    "SolNode99": "node:mr/ceres/Akkad",
    "SolNode100": "node:mr/jupiter/galilea",
    "SolNode101": "node:mr/jupiter/io",
    "SolNode102": "node:mr/jupiter/cameria",
    "SolNode103": "node:mr/jupiter/sinai",
    "SolNode104": "node:mr/jupiter/callisto",
    "SolNode105": "node:mr/jupiter/elara",
    "SolNode106": "node:mr/jupiter/ananke",
    "SolNode107": "node:mr/jupiter/corpus-gas-city",
    "SolNode108": "node:mr/jupiter/adrastea",
    "SolNode109": "node:mr/jupiter/paimon",
    "SolNode113": "node:mr/europa/valac",
    "SolNode114": "node:mr/europa/ose",
    "SolNode115": "node:mr/europa/valefor",
    "SolNode118": "node:mr/europa/abaddon",
    "SolNode119": "node:mr/europa/umbriel",
    "SolNode121": "node:mr/saturn/titan",
    "SolNode122": "node:mr/saturn/piscinas",
    "SolNode123": "node:mr/saturn/numa",
    "SolNode125": "node:mr/saturn/pandora",
    "SolNode126": "node:mr/saturn/larissa",
    "SolNode127": "node:mr/saturn/triton",
    "SolNode128": "node:mr/saturn/caracol",
    "SolNode129": "node:mr/saturn/coba",
    "SolNode130": "node:mr/saturn/tethys",
    "SolNode131": "node:mr/saturn/puck",
    "SolNode132": "node:mr/uranus/umbriel",
    "SolNode135": "node:mr/uranus/desdemona",
    "SolNode137": "node:mr/uranus/stephano",
    "SolNode138": "node:mr/uranus/sycorax",
    "SolNode139": "node:mr/uranus/tessera",
    "SolNode140": "node:mr/uranus/caliban",
    "SolNode141": "node:mr/uranus/puck",
    "SolNode144": "node:mr/neptune/kelashin",
    "SolNode146": "node:mr/neptune/ceth",
    "SolNode147": "node:mr/neptune/salacia",
    "SolNode149": "node:mr/neptune/laomedeia",
    "SolNode151": "node:mr/neptune/neso",
    "SolNode153": "node:mr/pluto/cerberus",
    "SolNode155": "node:mr/pluto/triton",
    "SolNode156": "node:mr/pluto/hydra",
    "SolNode162": "node:mr/sedna/hydron",
    "SolNode164": "node:mr/sedna/kappa",
    "SolNode165": "node:mr/sedna/adaro",
    "SolNode166": "node:mr/sedna/sangeru",
    "SolNode167": "node:mr/sedna/selkie",
    "SolNode168": "node:mr/sedna/merrow",
    "SolNode171": "node:mr/eris/akkad",
    "SolNode172": "node:mr/eris/xini",
    "SolNode173": "node:mr/eris/nimus",
    "SolNode175": "node:mr/eris/ixodes",
    "SolNode177": "node:mr/eris/zabala",
    "SolNode181": "node:mr/eris/naeglar",
    "SolNode183": "node:mr/eris/sporid",
    "SolNode184": "node:mr/eris/isos",
    "SolNode185": "node:mr/eris/cytherean",
    "SolNode187": "node:mr/eris/viver",
    "SolNode188": "node:mr/eris/oestrus",
    "SolNode189": "node:mr/eris/cyath",
    "SolNode190": "node:mr/eris/phalan",
    "SolNode191": "node:mr/eris/ilta",
    "SolNode193": "node:mr/eris/casta",
    "SolNode195": "node:mr/void/belenus",
    "SolNode196": "node:mr/void/taranis",
    "SolNode199": "node:mr/void/aten",
    "SolNode203": "node:mr/void/hepit",
    "SolNode204": "node:mr/void/oxomoco",
    "SolNode205": "node:mr/void/axi",
    "SolNode206": "node:mr/void/mot",
    "SolNode207": "node:mr/void/marduk",
    "SolNode208": "node:mr/void/stribog",
    "SolNode209": "node:mr/void/teshub",
    "SolNode210": "node:mr/void/ukko",
    "SolNode211": "node:mr/void/tycho",
    "SolNode212": "node:mr/void/apollo",
    "SolNode213": "node:mr/lua/tycho",
    "SolNode214": "node:mr/lua/copernicus",
    "SolNode215": "node:mr/lua/pavlov",
    "SolNode216": "node:mr/lua/plato",
    "SolNode217": "node:mr/lua/stöfler",
    "SolNode218": "node:mr/lua/zeugma",
    "SolNode219": "node:mr/lua/yuvarium",
    "SolNode220": "node:mr/kuva-fortress/taveuni",
    "SolNode221": "node:mr/kuva-fortress/nabuk",
    "SolNode222": "node:mr/kuva-fortress/garus",
    "SolNode223": "node:mr/kuva-fortress/pago",
    "SolNode224": "node:mr/kuva-fortress/client",
    "SolNode225": "node:mr/kuva-fortress/koro",
    "SolNode226": "node:mr/kuva-fortress/lares",
    "SolNode227": "node:mr/kuva-fortress/rotuma",
    "SolNode228": "node:mr/deimos/hyf",
    "SolNode229": "node:mr/deimos/cambion-drift",
    "SolNode230": "node:mr/deimos/formido",
    "SolNode231": "node:mr/deimos/horend",
    "SolNode232": "node:mr/deimos/wighner",
    "SolNode233": "node:mr/deimos/phlegyas",
    "SolNode235": "node:mr/deimos/magnacidium",
    "SolNode236": "node:mr/deimos/arcana",
    "SolNode238": "node:mr/zariman/tuvul-commons",
    "SolNode250": "node:mr/zariman/tuvul-commons",
    "SolNode251": "node:mr/zariman/everview-arc",
    "SolNode252": "node:mr/zariman/heron-of-gold",
    "SolNode253": "node:mr/zariman/oro-works",
    "SolNode255": "node:mr/zariman/albrecht-labs",
    "SolNode256": "node:mr/zariman/calyx-fragment",
    "SolNode300": "node:mr/earth-proxima/ose-junction",
    "SolNode301": "node:mr/earth-proxima/abandoned-research-platform",
    "SolNode302": "node:mr/earth-proxima/vesper-weave",
    "SolNode304": "node:mr/venus-proxima/orion-crossing",
    "SolNode305": "node:mr/venus-proxima/the-trench-run",
    "SolNode306": "node:mr/venus-proxima/falling-glory",
    "SolNode307": "node:mr/venus-proxima/stuck-between",
    "SolNode308": "node:mr/venus-proxima/dead-drift",
    "SolNode309": "node:mr/venus-proxima/free-flight",
    "SolNode310": "node:mr/saturn-proxima/golden-instinct",
    "SolNode400": "node:mr/saturn-proxima/lost-passage",
    "SolNode401": "node:mr/saturn-proxima/the-veil",
    "SolNode402": "node:mr/saturn-proxima/last-stand",
    "SolNode403": "node:mr/saturn-proxima/rings-edge",
    "SolNode404": "node:mr/neptune-proxima/veil-proxima",
    "SolNode405": "node:mr/neptune-proxima/salacia-node",
    "SolNode406": "node:mr/neptune-proxima/cold-front",
    "SolNode407": "node:mr/neptune-proxima/the-veil",
    "SolNode408": "node:mr/neptune-proxima/falls-of-cortege",
    "SolNode409": "node:mr/neptune-proxima/flexa",
    "SolNode410": "node:mr/pluto-proxima/last-laugh",
    "SolNode411": "node:mr/pluto-proxima/fear-not",
    "SolNode412": "node:mr/pluto-proxima/the-veil",
    "SolNode450": "node:mr/veil-proxima/outer-terminus",
    "SolNode451": "node:mr/veil-proxima/sover-weave",
    "SolNode700": "node:mr/zariman/tuvul-commons",
    "SolNode701": "node:mr/zariman/tuvul-commons",
    "SolNode705": "node:mr/zariman/everview-arc",
    "SolNode706": "node:mr/zariman/heron-of-gold",
    "SolNode707": "node:mr/zariman/oro-works",
    "SolNode708": "node:mr/zariman/albrecht-labs",
    "SolNode709": "node:mr/zariman/calyx-fragment",
    "SolNode710": "node:mr/zariman/calyx-fragment",
    "SolNode711": "node:mr/zariman/tuvul-commons",
    "SolNode712": "node:mr/zariman/everview-arc",
    "SolNode713": "node:mr/zariman/heron-of-gold",
    "SolNode715": "node:mr/zariman/oro-works",
    "SolNode716": "node:mr/zariman/albrecht-labs",
    "SolNode717": "node:mr/zariman/calyx-fragment",
    "SolNode718": "node:mr/zariman/tuvul-commons",
    "SolNode719": "node:mr/zariman/everview-arc",
    "SolNode720": "node:mr/zariman/heron-of-gold",
    "SolNode721": "node:mr/zariman/oro-works",
    "SolNode723": "node:mr/zariman/albrecht-labs",
    "SolNode740": "node:mr/deimos/hyf",
    "SolNode741": "node:mr/deimos/cambion-drift",
    "SolNode742": "node:mr/deimos/formido",
    "SolNode743": "node:mr/deimos/horend",
    "SolNode744": "node:mr/deimos/wighner",
    "SolNode745": "node:mr/deimos/phlegyas",
    "SolNode746": "node:mr/deimos/magnacidium",
    "SolNode747": "node:mr/deimos/arcana",
    "SolNode748": "node:mr/deimos/arcana",
    "SolNode764": "node:mr/zariman/tuvul-commons",
    "SolNode801": "node:mr/lua/apollo",
    "SolNode802": "node:mr/lua/stöfler",
    "SolNode850": "node:mr/zariman/tuvul-commons",
    "SolNode851": "node:mr/zariman/everview-arc",
    "SolNode852": "node:mr/zariman/heron-of-gold",
    "SolNode853": "node:mr/zariman/oro-works",
    "SolNode854": "node:mr/zariman/albrecht-labs",
    "SolNode855": "node:mr/zariman/calyx-fragment",
    "SolNode856": "node:mr/zariman/tuvul-commons",
    "SolNode857": "node:mr/zariman/everview-arc",
    "SolNode858": "node:mr/zariman/heron-of-gold",
    "SolNode901": "node:mr/deimos/hyf",
    "SolNode902": "node:mr/deimos/cambion-drift",
    "SolNode903": "node:mr/deimos/formido",
    "SolNode904": "node:mr/deimos/horend",
    "SolNode905": "node:mr/eris/akkad",
    "SolNode906": "node:mr/eris/ixodes",
    "SolNode907": "node:mr/void/ani",
    "SolNode908": "node:mr/void/belenus",
    // SettlementNode tags (Phobos expansion nodes)
    "SettlementNode1": "node:mr/phobos/roche",
    "SettlementNode2": "node:mr/phobos/skyresh",
    "SettlementNode3": "node:mr/phobos/stickney",
    "SettlementNode4": "node:mr/phobos/drunlo",
    "SettlementNode5": "node:mr/phobos/grildrig",
    "SettlementNode6": "node:mr/phobos/limtoc",
    "SettlementNode7": "node:mr/phobos/hall",
    "SettlementNode8": "node:mr/phobos/reldresal",
    "SettlementNode9": "node:mr/phobos/clustril",
    "SettlementNode10": "node:mr/phobos/kepler",
    "SettlementNode11": "node:mr/phobos/gulliver",
    "SettlementNode12": "node:mr/phobos/monolith",
    "SettlementNode14": "node:mr/phobos/shklovsky",
    "SettlementNode15": "node:mr/phobos/sharpless",
    "SettlementNode19": "node:mr/phobos/zeugma",
    "SettlementNode20": "node:mr/phobos/opik",
};

function missionTagToNodeId(tag: string): string | null {
    // Direct lookup in our tag mapping table
    const direct = SOL_NODE_TO_NODE_ID[tag];
    if (direct) return direct;

    // Legacy fallback: full Lotus path format (older API responses)
    const solarMatch = tag.match(/\/Lotus\/Missions\/SolarMap\/([^/]+)\/([^/]+)/);
    if (solarMatch) {
        const planet = normalizePlanetSegment(solarMatch[1]);
        const node   = normalizeNodeSegment(solarMatch[2]);
        return `node:mr/${planet}/${node}`;
    }
    const proxMatch = tag.match(/\/Lotus\/Missions\/Railjack\/([^/]+)\/([^/]+)/);
    if (proxMatch) {
        const regionRaw = proxMatch[1].replace(/Proxima$/, "");
        const planet = normalizePlanetSegment(regionRaw);
        const node   = normalizeNodeSegment(proxMatch[2]);
        return `node:mr/${planet}/${node}`;
    }

    return null;
}

/** Map special planet name segments to their canonical node-path form. */
const PLANET_SEGMENT_MAP: Record<string, string> = {
    kuvafortress: "kuva-fortress",
    deimossector: "deimos",
    cambionrift: "deimos",
    holdfastnavy: "zariman",
    // Zariman: /Lotus/Missions/SolarMap/HoldfastNavy/<node>
};

function normalizePlanetSegment(raw: string): string {
    const lower = raw.toLowerCase();
    return PLANET_SEGMENT_MAP[lower] ?? lower.replace(/\s+/g, "-");
}

function normalizeNodeSegment(raw: string): string {
    // CamelCase → kebab-case, lowercase, strip apostrophes
    return raw
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase()
        .replace(/['\u2019]/g, "")
        .replace(/\s+/g, "-");
}

export function parseProfileViewingData(inputText: string): ProfileImportResult {
    const trimmed = String(inputText ?? "").trim();

    let jsonText = trimmed;

    // If this looks like HTML, attempt extraction.
    if (trimmed.startsWith("<") || trimmed.toLowerCase().includes("<!doctype")) {
        const extracted = tryExtractJsonFromHtml(trimmed);
        if (!extracted) {
            throw new Error("HTML profile file detected but JSON could not be extracted.");
        }
        jsonText = extracted;
    }

    let payload: any;
    try {
        payload = JSON.parse(jsonText);
    } catch {
        // Second attempt: if user pasted a mixed blob, try extraction anyway.
        const extracted = tryExtractJsonFromHtml(trimmed);
        if (!extracted) {
            throw new Error("Invalid JSON (and no extractable JSON block found).");
        }
        payload = JSON.parse(extracted);
    }

    const root = getResultRoot(payload);

    const displayNameRaw = root?.DisplayName;
    const playerLevelRaw = root?.PlayerLevel;

    // Strip all non-printable / invisible characters from the display name.
    // The Warframe API sometimes appends trailing garbage bytes that survive JSON
    // parsing as Unicode escapes. We strip C0/C1 controls, zero-width chars,
    // BOM, replacement chars, and private-use area characters, then keep only
    // characters with a visible rendering (letters, numbers, marks, punctuation,
    // symbols, and separators per Unicode categories).
    const displayName = typeof displayNameRaw === "string"
        ? displayNameRaw
            // First pass: explicit known problem chars
            .replace(/[\x00-\x1F\x7F\x80-\x9F\u200B-\u200F\u2028-\u202F\uFEFF\uFFFD\uFFFE]/g, "")
            // Second pass: private-use area (E000-F8FF, F0000-FFFFF, 100000-10FFFF)
            .replace(/[\uE000-\uF8FF]/g, "")
            // Third pass: keep only printable Unicode (letters, numbers, marks, punctuation, symbols, spaces)
            .replace(/[^\p{L}\p{N}\p{M}\p{P}\p{S}\p{Zs}]/gu, "")
            .trim()
        : "";
    const masteryRank = Number.isFinite(Number(playerLevelRaw)) ? clampInt(playerLevelRaw, 0) : null;

    const clan = {
        name: typeof root?.GuildName === "string" ? root.GuildName : undefined,
        tier: Number.isFinite(Number(root?.GuildTier)) ? clampInt(root.GuildTier, 0) : undefined,
        clanClass: Number.isFinite(Number(root?.GuildClass)) ? clampInt(root.GuildClass, 0) : undefined,
        xp: Number.isFinite(Number(root?.GuildXp)) ? clampInt(root.GuildXp, 0) : undefined
    };

    // Syndicates: root.Affiliations: [{ Tag, Standing, Title, ... }]
    // We use Title for rank and map the raw API tag to a canonical syndicate ID.
    // Standing is intentionally not imported — the API reports cumulative/total standing
    // rather than current standing within the rank, so it cannot be used reliably.
    const syndicates: SyndicateState[] = [];
    let nightwaveMaxRank = -1; // track max Nightwave rank across all season entries
    const NIGHTWAVE_ID = "syndicate_nightwave";

    if (Array.isArray(root?.Affiliations)) {
        for (const a of root.Affiliations) {
            if (!isObject(a)) continue;
            const tag = typeof a.Tag === "string" ? a.Tag : "";
            if (!tag) continue;

            const canonId = AFFILIATION_TAG_TO_SYNDICATE_ID[tag];
            if (!canonId) continue; // skip unrecognised syndicates

            const maxRank = SYNDICATE_MAX_RANK[canonId] ?? 5;
            const minRank = SYNDICATE_MIN_RANK[canonId] ?? 0;
            const rank = clampIntSigned(a.Title, 0, minRank, maxRank);

            // Nightwave may appear multiple times (one entry per season).
            // We record the highest rank encountered and emit a single entry below.
            if (canonId === NIGHTWAVE_ID) {
                if (rank > nightwaveMaxRank) nightwaveMaxRank = rank;
                continue;
            }

            syndicates.push({
                id: canonId,
                name: canonId,
                rank,
                standing: 0  // standing not imported (see comment above)
            });
        }
    }

    // Emit a single Nightwave entry using the highest rank found
    if (nightwaveMaxRank >= 0) {
        syndicates.push({
            id: NIGHTWAVE_ID,
            name: NIGHTWAVE_ID,
            rank: nightwaveMaxRank,
            standing: 0
        });
    }

    // Missions: root.Missions: [{ Tag, Completes }]
    const completesByTag: Record<string, number> = {};
    const completedNodeIds: string[] = [];
    if (Array.isArray(root?.Missions)) {
        for (const m of root.Missions) {
            if (!isObject(m)) continue;
            const tag = typeof m.Tag === "string" ? m.Tag : "";
            if (!tag) continue;
            const completes = clampInt(m.Completes, 0);
            completesByTag[tag] = completes;

            // Convert mission tag to star chart node ID.
            // Profile tags are of the form:
            //   /Lotus/Missions/SolarMap/<Planet>/<Node>    → normal mission
            //   /Lotus/Missions/Railjack/<Region>/<Node>   → Railjack Proxima
            // Target node ID format: node:mr/<planet-or-region>/<node>
            if (completes > 0) {
                const nodeId = missionTagToNodeId(tag);
                if (nodeId) completedNodeIds.push(nodeId);
            }
        }
    }

    // Mastery XP: LoadOutInventory.* arrays contain { ItemType, XP }.
    // In the Warframe API the inventory is nested inside Results[0] (= root),
    // but some older/alternate response shapes put it at the top-level payload.
    // Try root first, then fall back to the payload root.
    const xpByItem: Record<string, number> = {};
    const inv = isObject(root?.LoadOutInventory) ? root.LoadOutInventory
        : isObject(payload?.LoadOutInventory) ? payload.LoadOutInventory
        : null;

    if (inv) {
        for (const v of Object.values(inv)) {
            if (!Array.isArray(v)) continue;
            for (const e of v) {
                if (!isObject(e)) continue;
                addXp(xpByItem, e.ItemType, e.XP);
            }
        }
    }

    const mastery = {
        xpByItem,
        mastered: computeMastered(xpByItem)
    };

    // Challenges: root.ChallengeProgress: [{ Name: "Apply4Mods", Progress: 1 }, ...]
    // NOTE: The API returns SHORT names (e.g. "Apply4Mods"), NOT full Lotus paths.
    // The uniqueName in challenges.json is always "/Lotus/Types/Challenges/<ShortName>".
    // There is no "Completed" field — completion is inferred from progress >= requiredCount,
    // or progress > 0 for challenges without a required count.
    // We import CHALLENGE_REQUIRED_COUNTS from challenges.json to determine completion.
    let challengesResult: ProfileImportResult["challenges"];
    const challengeArr = Array.isArray(root?.ChallengeProgress) ? root.ChallengeProgress
        : Array.isArray(root?.Challenges) ? root.Challenges  // fallback for alternate API shapes
        : null;
    if (challengeArr) {
        const progress: Record<string, number> = {};
        const completed: Record<string, boolean> = {};
        for (const c of challengeArr) {
            if (!isObject(c)) continue;
            const shortName = typeof c.Name === "string" ? c.Name : "";
            if (!shortName) continue;
            // Build the full uniqueName that matches challenges.json
            const uniqueName = shortName.startsWith("/")
                ? shortName
                : `/Lotus/Types/Challenges/${shortName}`;
            const prog = typeof c.Progress === "number" ? Math.max(0, Math.floor(c.Progress)) : 0;
            progress[uniqueName] = prog;
            // Mark complete: if API provides explicit Completed flag use it,
            // otherwise infer from progress
            if (c.Completed) {
                completed[uniqueName] = true;
            }
        }
        challengesResult = { progress, completed };
    }

    // Intrinsics: root.PlayerSkills: { LPS_PILOTING: 5, LPS_COMMAND: 7, ... }
    // NOTE: The API uses "LPS_" prefix (Level Per Skill), NOT "STYPE_".
    // "LPP_SPACE" and "LPP_DRIFTER" are the total point pools (not individual skill levels).
    let intrinsicsResult: ProfileImportResult["intrinsics"];
    if (isObject(root?.PlayerSkills)) {
        const railjackKeys = new Set([
            "LPS_PILOTING", "LPS_GUNNERY", "LPS_ENGINEERING", "LPS_TACTICAL", "LPS_COMMAND"
        ]);
        const duviriKeys = new Set([
            "LPS_DRIFT_RIDING", "LPS_DRIFT_OPPORTUNITY", "LPS_DRIFT_COMBAT",
            "LPS_DRIFT_ENDURANCE", "LPS_DRIFT_AGILITY"
        ]);
        const railjack: Record<string, number> = {};
        const duviri: Record<string, number> = {};
        for (const [key, val] of Object.entries(root.PlayerSkills)) {
            const rank = clampInt(val, 0);
            if (railjackKeys.has(key)) railjack[key] = rank;
            else if (duviriKeys.has(key)) duviri[key] = rank;
        }
        if (Object.keys(railjack).length > 0 || Object.keys(duviri).length > 0) {
            intrinsicsResult = { railjack, duviri };
        }
    }

    return {
        displayName,
        masteryRank,
        clan,
        syndicates,
        mastery,
        missions: {
            completesByTag
        },
        completedNodeIds,
        challenges: challengesResult,
        intrinsics: intrinsicsResult
    };
}