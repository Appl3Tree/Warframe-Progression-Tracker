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
 * Converts a Warframe profile mission tag to a star chart node ID.
 *
 * Examples:
 *   /Lotus/Missions/SolarMap/Venus/Aphrodite   → node:mr/venus/aphrodite
 *   /Lotus/Missions/SolarMap/KuvaFortress/Garus → node:mr/kuva-fortress/garus
 *   /Lotus/Missions/Railjack/VenusProxima/Ose   → node:mr/venus/ose
 */
function missionTagToNodeId(tag: string): string | null {
    // Normal missions: /Lotus/Missions/SolarMap/<Planet>/<Node>
    const solarMatch = tag.match(/\/Lotus\/Missions\/SolarMap\/([^/]+)\/([^/]+)/);
    if (solarMatch) {
        const planet = normalizePlanetSegment(solarMatch[1]);
        const node   = normalizeNodeSegment(solarMatch[2]);
        return `node:mr/${planet}/${node}`;
    }

    // Railjack Proxima: /Lotus/Missions/Railjack/<Region>Proxima/<Node>
    const proxMatch = tag.match(/\/Lotus\/Missions\/Railjack\/([^/]+)\/([^/]+)/);
    if (proxMatch) {
        // e.g. "EarthProxima" → region is the planet part
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

    const displayName = typeof displayNameRaw === "string" ? displayNameRaw : "";
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

    // Challenges: root.Challenges: [{ Name, Progress, Completed }]
    let challengesResult: ProfileImportResult["challenges"];
    if (Array.isArray(root?.Challenges)) {
        const progress: Record<string, number> = {};
        const completed: Record<string, boolean> = {};
        for (const c of root.Challenges) {
            if (!isObject(c)) continue;
            const name = typeof c.Name === "string" ? c.Name : "";
            if (!name) continue;
            const prog = typeof c.Progress === "number" ? Math.max(0, Math.floor(c.Progress)) : 0;
            const done = Boolean(c.Completed);
            progress[name] = prog;
            if (done) completed[name] = true;
        }
        challengesResult = { progress, completed };
    }

    // Intrinsics: root.PlayerSkills: { STYPE_PILOTING: 5, ... }
    let intrinsicsResult: ProfileImportResult["intrinsics"];
    if (isObject(root?.PlayerSkills)) {
        const railjackKeys = new Set([
            "STYPE_PILOTING", "STYPE_GUNNERY", "STYPE_ENGINEERING", "STYPE_TACTICAL", "STYPE_COMMAND"
        ]);
        const duviriKeys = new Set([
            "STYPE_DUVIRI_AGILITY", "STYPE_DUVIRI_ENDURANCE", "STYPE_DUVIRI_OPPORTUNITY",
            "STYPE_DUVIRI_MIGHT", "STYPE_DUVIRI_WITS"
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
