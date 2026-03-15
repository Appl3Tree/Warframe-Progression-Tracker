// ===== FILE: src/utils/profileImport.ts =====
// src/utils/profileImport.ts
import type { SyndicateState } from "../domain/types";

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
 * Returns true if the given Lotus path is a real mastery-granting item.
 * Some paths appear in LoadOutInventory XP data but are not mastery items
 * (e.g. Railjack engine components under /Lotus/Types/Game/CrewShip/).
 */
function isMasteryItem(itemType: string): boolean {
    const t = itemType.toLowerCase();
    // Railjack / CrewShip engine components are not mastery items
    if (t.includes("/lotus/types/game/crewship/")) return false;
    if (t.includes("/lotus/types/game/")) return false;
    return true;
}

function computeMastered(xpByItem: Record<string, number>): Record<string, boolean> {
    const mastered: Record<string, boolean> = {};
    for (const [k, xp] of Object.entries(xpByItem)) {
        if (!isMasteryItem(k)) continue;
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
    // Relay faction syndicates can be negative rank/standing, so allow signed ranges here.
    const syndicates: SyndicateState[] = [];
    if (Array.isArray(root?.Affiliations)) {
        for (const a of root.Affiliations) {
            if (!isObject(a)) continue;
            const id = typeof a.Tag === "string" ? a.Tag : "";
            if (!id) continue;

            syndicates.push({
                id,
                name: id,
                rank: clampIntSigned(a.Title, 0, -2, 5),
                standing: clampIntSigned(a.Standing, 0, -44_000, 132_000)
            });
        }
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
