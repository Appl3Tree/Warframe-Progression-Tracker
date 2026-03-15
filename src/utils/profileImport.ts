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

    // Plexus: the Railjack loadout item counts toward mastery like a weapon.
    if (t === "/lotus/types/items/crewship/plexus") return 450_000;

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
    if (Array.isArray(root?.Missions)) {
        for (const m of root.Missions) {
            if (!isObject(m)) continue;
            const tag = typeof m.Tag === "string" ? m.Tag : "";
            if (!tag) continue;
            const completes = clampInt(m.Completes, 0);
            completesByTag[tag] = completes;
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

    return {
        displayName,
        masteryRank,
        clan,
        syndicates,
        mastery,
        missions: {
            completesByTag
        }
    };
}
