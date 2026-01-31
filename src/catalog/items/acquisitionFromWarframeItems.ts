// ===== FILE: src/catalog/items/acquisitionFromWarframeItems.ts =====
// src/catalog/items/acquisitionFromWarframeItems.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

// warframe-items raw datasets (targeted)
import RESOURCES from "../../../external/warframe-items/raw/Resources.json";
import MISC from "../../../external/warframe-items/raw/Misc.json";
import ALL from "../../../external/warframe-items/raw/All.json";

type WarframeItemsRow = {
    name?: string | null;
    uniqueName?: string | null;
    type?: string | null;
    category?: string | null;
    description?: string | null;
    drops?: Array<{
        location?: string | null;
        chance?: number | null;
        rarity?: string | null;
        type?: string | null;
    }> | null;
};

function normalizeItemsArray(input: unknown): WarframeItemsRow[] {
    if (Array.isArray(input)) return input as WarframeItemsRow[];
    if (input && typeof input === "object") {
        const obj = input as Record<string, unknown>;
        const candidates = [obj.Resources, obj.resources, obj.items, obj.data, obj.Fish, obj.fish];
        for (const c of candidates) {
            if (Array.isArray(c)) return c as WarframeItemsRow[];
        }
    }
    return [];
}

function addSource(out: Record<string, AcquisitionDef>, catalogId: CatalogId, sourceId: string): void {
    const key = String(catalogId);
    const prev = out[key];

    if (!prev) {
        out[key] = { sources: [sourceId] };
        return;
    }

    const existing = new Set((prev.sources ?? []).map((s) => String(s)));
    if (!existing.has(sourceId)) {
        out[key] = { ...prev, sources: [...(prev.sources ?? []), sourceId] };
    }
}

/* ---------- Description-based parsing (do NOT remove; gems depend on this) ---------- */

function parseFishProcessingSourceFromDescription(descRaw: string): string | null {
    const desc = String(descRaw ?? "");

    if (/Source:\s*Cut from all Plains of Eidolon Fish/i.test(desc)) return "data:fishing/cetus/processing";
    if (/Source:\s*Cut from all Orb Vallis Fish/i.test(desc)) return "data:fishing/fortuna/processing";
    if (/Source:\s*Cut from all Cambion Drift Fish/i.test(desc)) return "data:fishing/deimos/processing";

    return null;
}

function parseOpenWorldMiningSourceFromDescription(descRaw: string): string | null {
    const desc = String(descRaw ?? "");

    if (/Location:\s*Cambion Drift\s*\(Deimos\)/i.test(desc)) return "data:openworld/deimos/mining";
    if (/Location:\s*Orb Vallis\s*\(Venus\)/i.test(desc)) return "data:openworld/fortuna/mining";
    if (/Location:\s*Plains of Eidolon\s*\(Earth\)/i.test(desc)) return "data:openworld/cetus/mining";

    if (/Location:\s*Cambion Drift/i.test(desc)) return "data:openworld/deimos/mining";
    if (/Location:\s*Orb Vallis/i.test(desc)) return "data:openworld/fortuna/mining";
    if (/Location:\s*Plains of Eidolon/i.test(desc)) return "data:openworld/cetus/mining";

    return null;
}

/* ---------- shared tokenization (MUST match sourceCatalog.ts dataId/srcId token rules) ---------- */

function normalizeBountyLevelLabel(levelRaw: string): string {
    // IMPORTANT:
    // dataId() strips punctuation (including '-').
    // If the range has no spaces ("5-15"), it becomes "515" -> token "515".
    // Force spaces so it becomes "5 15" -> token "5-15".
    const s = normalizeSpaces(levelRaw ?? "");
    return s.replace(/(\d)\s*-\s*(\d)/g, "$1 - $2");
}

function normalizeSpaces(s: string): string {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}

function foldDiacritics(s: string): string {
    // e.g., "Höllvania" -> "Hollvania"
    return String(s ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(s: string): string {
    // canonical: folded, lowercase, normalized whitespace
    return normalizeSpaces(foldDiacritics(s)).toLowerCase();
}

function normalizeNameNoPunct(s: string): string {
    return normalizeName(s).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function toToken(s: string): string {
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

function dataId(parts: string[]): string {
    const cleaned = parts
        .map((p) => normalizeSpaces(p))
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "data:unknown";
    return `data:${cleaned.join("/")}`;
}

/* ---------- warframe-items All.json drops → source IDs ---------- */

function baseRelicLocation(locRaw: string): string | null {
    const loc = normalizeSpaces(locRaw ?? "");
    if (!loc) return null;

    // Normalize variants like:
    // "Axi M6 Relic (Radiant)" → "Axi M6 Relic"
    // "Neo Z11 Relic (Exceptional)" → "Neo Z11 Relic"
    const m = loc.match(/^(.+?\bRelic)\s*(?:\([^)]*\))?\s*$/i);
    if (!m) return null;

    const base = normalizeSpaces(m[1] ?? "");
    if (!base) return null;

    // Only accept locations that are actually relics
    if (!/\bRelic$/i.test(base)) return null;

    return base;
}

function sourceIdForRelicLocation(baseLoc: string): string {
    // Preserve existing behavior (already in-use across snapshots)
    // Example: "Axi M6 Relic" → "data:wfitems:loc:axi-m6-relic"
    return `data:wfitems:loc:${toToken(baseLoc)}`;
}

/**
 * Map All.json locations like:
 *   "Mars/Tyana Pass (Defense), Rotation C"
 *   "Ceres/Exta (Assassination)"
 * to your existing mission-node SourceId namespace:
 *   data:node/<planet>/<node>
 *
 * IMPORTANT: This is "best effort" and does not invent rotations.
 */
function parseRotationLetter(locRaw: string): "A" | "B" | "C" | null {
    const m = String(locRaw ?? "").match(/\bRotation\s+([ABC])\b/i);
    if (!m) return null;
    const r = String(m[1]).toUpperCase();
    return r === "A" || r === "B" || r === "C" ? (r as "A" | "B" | "C") : null;
}

/**
 * Parse All.json location labels like:
 *   "Mars/Tyana Pass (Defense), Rotation C"
 *   "Höllvania/Solstice Square (Defense), Rotation A"
 *
 * IMPORTANT:
 * - These strings are NOT proof of "mission rotation rewards" tables.
 * - They *are* useful as UI hints, but must be typed:
 *     - caches => data:caches/<planet>/<node>
 *     - rotation mentioned => data:mission-reward/<planet>/<node>/rotation<a|b|c> (and base)
 */
function sourcesForMissionLikeLocation(locRaw: string): string[] {
    const loc = normalizeSpaces(locRaw ?? "");
    if (!loc.includes("/")) return [];

    // Take only the left-hand part before " (" or ","
    const head = normalizeSpaces(loc.split("(")[0] ?? "");
    const headNoComma = normalizeSpaces(head.split(",")[0] ?? "");
    const parts = headNoComma
        .split("/")
        .map((x) => normalizeSpaces(x))
        .filter(Boolean);

    if (parts.length < 2) return [];

    const planet = parts[0];
    const node = parts.slice(1).join("/");
    if (!planet || !node) return [];

    const out: string[] = [];

    const isCaches = /\(\s*Caches\s*\)/i.test(locRaw);
    if (isCaches) {
        out.push(dataId(["caches", planet, node]));
    }

    const rot = parseRotationLetter(locRaw);
    if (rot) {
        // Emit both the base and the rotation-specific source.
        out.push(dataId(["missionreward", planet, node]));
        out.push(dataId(["missionreward", planet, node, `rotation${rot.toLowerCase()}`]));
    }

    return out;
}

/**
 * Map All.json bounty-style locations to your existing bounty SourceIds:
 *   data:bounty/<region>/<bountyLevel>
 */
function sourceIdForBountyLocation(locRaw: string): string | null {
    const loc = normalizeSpaces(locRaw ?? "");
    if (!loc) return null;

    // NOTE:
    // SOURCE_INDEX proves canonical ids include the suffix tokens:
    // - cetus: "...-cetus-bounty"
    // - solaris: "...-orb-vallis-bounty"
    // - deimos: "...-cambion-drift-bounty" / "...-isolation-vault" / "...-arcana-isolation-vault"

    // Cetus bounties (standard)
    {
        const m = loc.match(/\/Cetus\s*\(\s*(Level[^)]*?)\s+Cetus Bounty\s*\)\s*(?:,|$)/i);
        if (m) {
            const level = normalizeBountyLevelLabel(m[1] ?? "");
            if (level) return dataId(["bounty", "cetus", `${level} Cetus Bounty`]);
        }
    }

    // Cetus special events that exist in SOURCE_INDEX
    // Example in SOURCE_INDEX: "Level 15 - 25 Ghoul Bounty", "Level 15 - 25 Plague Star"
    {
        const m = loc.match(/\/Cetus\s*\(\s*(Level[^)]*?)\s+(Ghoul Bounty|Plague Star)\s*\)\s*(?:,|$)/i);
        if (m) {
            const level = normalizeBountyLevelLabel(m[1] ?? "");
            const kind = normalizeSpaces(m[2] ?? "");
            if (level && kind) return dataId(["bounty", "cetus", `${level} ${kind}`]);
        }
    }

    // Orb Vallis bounties (Solaris)
    {
        const m = loc.match(/\/Orb Vallis\s*\(\s*(Level[^)]*?)\s+Orb Vallis Bounty\s*\)\s*(?:,|$)/i);
        if (m) {
            const level = normalizeBountyLevelLabel(m[1] ?? "");
            if (level) return dataId(["bounty", "solaris", `${level} Orb Vallis Bounty`]);
        }
    }

    // Profit-Taker phases (Solaris) exist in SOURCE_INDEX too
    // Example in SOURCE_INDEX: "Level 40 - 60 PROFIT-TAKER - PHASE 1"
    {
        const m = loc.match(/\/Orb Vallis\s*\(\s*(Level[^)]*?)\s+PROFIT-TAKER\s*-\s*PHASE\s*(\d)\s*\)\s*(?:,|$)/i);
        if (m) {
            const level = normalizeBountyLevelLabel(m[1] ?? "");
            const phase = normalizeSpaces(m[2] ?? "");
            if (level && phase) return dataId(["bounty", "solaris", `${level} PROFIT-TAKER - PHASE ${phase}`]);
        }
    }

    // Deimos / Cambion Drift bounty tiers (base)
    {
        const m = loc.match(/\/Cambion Drift\s*\(\s*(Level[^)]*?)\s+Cambion Drift Bounty\s*\)\s*(?:,|$)/i);
        if (m) {
            const level = normalizeBountyLevelLabel(m[1] ?? "");
            if (level) return dataId(["bounty", "deimos", `${level} Cambion Drift Bounty`]);
        }
    }

    // Deimos Isolation Vault + Arcana Isolation Vault (these exist in SOURCE_INDEX)
    {
        const m = loc.match(/\/Cambion Drift\s*\(\s*(Level[^)]*?)\s+(Arcana\s+Isolation\s+Vault|Isolation\s+Vault)\s*\)\s*(?:,|$)/i);
        if (m) {
            const level = normalizeBountyLevelLabel(m[1] ?? "");
            const kind = normalizeSpaces(m[2] ?? "");
            if (level && kind) return dataId(["bounty", "deimos", `${level} ${kind}`]);
        }
    }

    // Höllvania / Hex reward-track labels are NOT bounties
    {
        const m = loc.match(/^\s*H[öo]llvania\/[^()]*\(\s*([^)]+?)\s*\)\s*(?:,|$)/i);
        if (m) return null;
    }

    return null;
}

function collectDropSourcesFromAllJson(): Record<string, string[]> {
    // Map uniqueName (/Lotus/...) → [sourceId...]
    const byUniqueName: Record<string, string[]> = Object.create(null);

    const stack: unknown[] = [ALL as unknown];
    while (stack.length > 0) {
        const node = stack.pop();

        if (Array.isArray(node)) {
            for (const v of node) stack.push(v);
            continue;
        }

        if (!node || typeof node !== "object") continue;

        const obj = node as Record<string, unknown>;

        // Traverse children
        for (const v of Object.values(obj)) stack.push(v);

        // Capture drop info when present
        const uniqueName = typeof obj.uniqueName === "string" ? obj.uniqueName : null;
        if (!uniqueName) continue;

        const dropsRaw = obj.drops;
        if (!Array.isArray(dropsRaw)) continue;

        const set = new Set<string>();

        for (const d of dropsRaw as Array<Record<string, unknown>>) {
            const loc = typeof d.location === "string" ? d.location : "";
            if (!loc) continue;

            // 1) Relic locations
            const baseRelic = baseRelicLocation(loc);
            if (baseRelic) {
                set.add(sourceIdForRelicLocation(baseRelic));
                continue;
            }

            // 2) Bounties
            const bountySid = sourceIdForBountyLocation(loc);
            if (bountySid) {
                set.add(bountySid);
                continue;
            }

            // 3) Mission-like labels (rotation / caches) → typed sources
            const missionLike = sourcesForMissionLikeLocation(loc);
            if (missionLike.length > 0) {
                for (const s of missionLike) set.add(s);
                continue;
            }

            // 4) Fallback: stable wfitems location source.
            set.add(`data:wfitems:loc:${toToken(loc)}`);
        }

        if (set.size === 0) continue;

        const prev = byUniqueName[uniqueName] ?? [];
        const merged = new Set<string>(prev);
        for (const s of set) merged.add(s);
        byUniqueName[uniqueName] = Array.from(merged.values());
    }

    return byUniqueName;
}

/* ---------- Lotus-path rules ---------- */

function lotusPath(catalogId: CatalogId): string {
    const s = String(catalogId); // "items:/Lotus/..."
    const idx = s.indexOf(":/Lotus/");
    if (idx === -1) return s;
    return s.slice(idx + 1); // "/Lotus/..."
}

function applyLotusPathRules(out: Record<string, AcquisitionDef>): void {
    for (const key of FULL_CATALOG.itemIds as CatalogId[]) {
        const p = lotusPath(key);

        // --- Duviri family: weapon parts under /Lotus/Types/Recipes/Weapons/WeaponParts/ ---
        if (p.startsWith("/Lotus/Types/Recipes/Weapons/WeaponParts/")) {
            if (p.includes("DaxDuviri") || p.includes("LasGoo") || p.includes("PaxDuviricus") || p.includes("/Duviri")) {
                addSource(out, key, "data:openworld/duviri");
                continue;
            }
        }

        // --- Fish parts (processing) ---
        if (p.includes("/Types/Items/Fish/") && p.includes("/FishParts/")) {
            if (p.includes("/Fish/Eidolon/")) addSource(out, key, "data:fishing/cetus/processing");
            else if (p.includes("/Fish/Solaris/")) addSource(out, key, "data:fishing/fortuna/processing");
            else if (p.includes("/Fish/Deimos/")) addSource(out, key, "data:fishing/deimos/processing");
            continue;
        }

        // --- K-Drive parts ---
        if (p.includes("/Types/Vehicles/Hoverboard/") || p.includes("/Vehicles/Hoverboard/")) {
            addSource(out, key, "data:vendor/fortuna/ventkids");
            continue;
        }

        // --- Zaw components (Hok) ---
        if (p.includes("/Weapons/Ostron/Melee/ModularMelee")) {
            addSource(out, key, "data:vendor/cetus/hok");
            continue;
        }

        // --- Amp parts ---
        if (p.includes("/OperatorAmplifiers/")) {
            if (p.includes("/Weapons/Corpus/OperatorAmplifiers/")) {
                addSource(out, key, "data:vendor/fortuna/vox-solaris");
            } else if (p.includes("/Weapons/Sentients/OperatorAmplifiers/")) {
                addSource(out, key, "data:vendor/cetus/quills");
            }
            continue;
        }

        // --- Kuva ecosystem ---
        if (p.includes("/KuvaLich/") || p.includes("/Types/Recipes/Weapons/KuvaWeapons/")) {
            addSource(out, key, "data:lich/kuva");
            continue;
        }

        // --- Tenet ecosystem ---
        if (
            p.includes("/BoardExec/") ||
            p.includes("/ZanukaPets/") ||
            p.includes("/Types/Recipes/Weapons/TenetWeapons/") ||
            p.includes("/Types/Recipes/Weapons/Sisters/") ||
            p.includes("/Types/Recipes/Weapons/CorpusLich/") ||
            p.includes("/Types/Recipes/Weapons/CrpLich/")
        ) {
            addSource(out, key, "data:lich/tenet");
            continue;
        }

        // --- Eidolon shard resources ---
        if (p.includes("/Gameplay/Eidolon/Resources/SentientShards/")) {
            addSource(out, key, "data:eidolon/hunts");
            continue;
        }

        // --- Ducats ---
        if (p === "/Lotus/Types/Items/MiscItems/PrimeBucks") {
            addSource(out, key, "data:relics/ducats");
            continue;
        }

        // --- Narmer Isoplast ---
        if (p === "/Lotus/Types/Items/MiscItems/NarmerBountyResource") {
            addSource(out, key, "data:bounties/narmer");
            continue;
        }

        // --- Helminth system ---
        if (p === "/Lotus/Powersuits/PowersuitAbilities/Helminth") {
            addSource(out, key, "data:system/helminth");
            continue;
        }

        // --- Fate Pearl / Shrine Fragment ---
        if (p === "/Lotus/Types/Items/MiscItems/ShrineFragment") {
            addSource(out, key, "data:openworld/duviri/shrines");
            continue;
        }

        // --- Dex anniversary items ---
        if (p.includes("/DexTheSecond/") || p.includes("/DexTheThird/") || p.includes("/DexFuris/") || p.includes("/Dex2023Nikana/")) {
            addSource(out, key, "data:events/anniversary");
            continue;
        }

        // --- Sheev ---
        if (p === "/Lotus/Weapons/Grineer/Melee/GrineerCombatKnife/GrineerCombatKnife") {
            addSource(out, key, "data:events/naberus");
            continue;
        }

        // --- Detron ---
        if (p === "/Lotus/Weapons/Corpus/Pistols/CorpusHandShotgun/CorpusHandCannon") {
            addSource(out, key, "data:enemy/zanuka-hunter");
            continue;
        }

        // --- Snipetron ---
        if (p === "/Lotus/Weapons/Tenno/Rifle/SniperRifle") {
            addSource(out, key, "data:pvp/conclave");
            continue;
        }

        // --- Sentinel weapons ---
        if (p.includes("/Types/Sentinels/SentinelWeapons/")) {
            addSource(out, key, "data:market/sentinel-weapons");
            continue;
        }

        // --- MOA pet parts ---
        if (p.includes("/MoaPets/MoaPetParts/")) {
            addSource(out, key, "data:vendor/fortuna/legs");
            continue;
        }

        // --- Vasca Kavat ---
        if (p.includes("/CatbrowPet/VampireCatbrowPetPowerSuit")) {
            addSource(out, key, "data:openworld/cetus/vasca");
            continue;
        }

        // --- Zariman resources ---
        if (p.includes("/Lotus/Types/Gameplay/Zariman/Resources/")) {
            addSource(out, key, "data:openworld/zariman");
            continue;
        }

        // --- Duviri resources ---
        if (p.includes("/Lotus/Types/Gameplay/Duviri/Resource/")) {
            addSource(out, key, "data:openworld/duviri");
            continue;
        }

        // --- Entrati Lab resources ---
        if (p.includes("/Lotus/Types/Gameplay/EntratiLab/")) {
            addSource(out, key, "data:openworld/deimos/entrati-lab");
            continue;
        }

        // --- 1999 resources ---
        if (p.includes("/Lotus/Types/Gameplay/1999Wf/")) {
            addSource(out, key, "data:1999/resources");
            continue;
        }

        // --- Zylok (Conclave) ---
        if (p.includes("/ConclaveLeverPistol/")) {
            addSource(out, key, "data:pvp/conclave");
            continue;
        }

        /* ===== High-value recipe buckets ===== */

        // --- Dojo research (ClanTech) ---
        if (p.includes("/Lotus/Weapons/ClanTech/")) {
            if (p.includes("/ClanTech/Chemical/")) addSource(out, key, "data:dojo/chem-lab");
            else if (p.includes("/ClanTech/Energy/")) addSource(out, key, "data:dojo/energy-lab");
            else if (p.includes("/ClanTech/Bio/")) addSource(out, key, "data:dojo/bio-lab");
            else addSource(out, key, "data:dojo/research");
            continue;
        }

        // --- Kitguns (Fortuna) ---
        if (p.includes("/Lotus/Weapons/SolarisUnited/") && p.includes("ModularSecondary")) {
            addSource(out, key, "data:vendor/fortuna/rude-zuud");
            continue;
        }

        // --- Kitguns (Deimos / Infested) ---
        if (p.includes("/Lotus/Weapons/Infested/") && p.includes("/InfKitGun/")) {
            addSource(out, key, "data:vendor/deimos/father");
            continue;
        }

        // --- Fieldron Sample ---
        if (p === "/Lotus/Types/Items/Research/EnergyFragment") {
            addSource(out, key, "data:resource/fieldron-sample");
            continue;
        }
    }
}

/* ---------- Recipe backreference propagation (FULL_CATALOG-driven) ---------- */

const RECIPE_CATALOG_ID_PREFIX = "items:/Lotus/Types/Recipes/";

function isRecipeCatalogId(id: string): boolean {
    return typeof id === "string" && id.startsWith(RECIPE_CATALOG_ID_PREFIX);
}

function isCatalogIdStringLike(v: unknown): v is string {
    return typeof v === "string" && v.startsWith("items:/Lotus/");
}

function collectReferencedRecipeIds(value: unknown, maxNodes: number): Set<string> {
    const out = new Set<string>();
    const stack: unknown[] = [value];
    let seen = 0;

    while (stack.length > 0) {
        const cur = stack.pop();
        seen += 1;
        if (seen > maxNodes) break;

        if (isCatalogIdStringLike(cur)) {
            const s = String(cur);
            if (isRecipeCatalogId(s)) out.add(s);
            continue;
        }

        if (Array.isArray(cur)) {
            for (const v of cur) stack.push(v);
            continue;
        }

        if (cur && typeof cur === "object") {
            const obj = cur as Record<string, unknown>;
            for (const v of Object.values(obj)) stack.push(v);
        }
    }

    return out;
}

function propagateSourcesToRecipes(out: Record<string, AcquisitionDef>): void {
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};
    const allIds = Object.keys(recordsById);

    // Build recipeId -> parentIds[] where parent references recipeId somewhere in its record object.
    const recipeToParents = new Map<string, Set<string>>();

    for (const parentId of allIds) {
        const rec = recordsById[parentId];
        if (!rec) continue;

        // IMPORTANT: bounded traversal per record to avoid pathological blowups.
        const recipeRefs = collectReferencedRecipeIds(rec, 2500);
        if (recipeRefs.size === 0) continue;

        for (const recipeId of recipeRefs) {
            if (!recipeToParents.has(recipeId)) recipeToParents.set(recipeId, new Set<string>());
            recipeToParents.get(recipeId)!.add(parentId);
        }
    }

    // For each recipe that currently has no sources, inherit from parents that do have sources.
    // This directly fixes cases like:
    //   items:/Lotus/Types/Recipes/WarframeRecipes/BansheeChassisComponent
    // where All.json recipe objects have no drops and no result fields.
    const recipeIds = (FULL_CATALOG.itemIds as CatalogId[]).map(String).filter(isRecipeCatalogId);

    for (const recipeId of recipeIds) {
        const existing = out[recipeId]?.sources ?? [];
        if (existing.length > 0) continue;

        const parents = recipeToParents.get(recipeId);
        if (!parents || parents.size === 0) continue;

        const inherited = new Set<string>();

        for (const p of parents) {
            const ps = out[p]?.sources ?? [];
            for (const s of ps) inherited.add(String(s));
        }

        if (inherited.size === 0) continue;

        out[recipeId] = { sources: Array.from(inherited.values()).sort((a, b) => a.localeCompare(b)) };
    }
}

/* ---------- Build once, reuse everywhere ---------- */

function buildInternal(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = Object.create(null);

    // 1) Resources.json: mining / gems
    const resourcesArr = normalizeItemsArray(RESOURCES);
    for (const r of resourcesArr) {
        const un = r.uniqueName;
        if (!un || typeof un !== "string") continue;

        const desc = String(r.description ?? "");
        const sourceId = parseOpenWorldMiningSourceFromDescription(desc);
        if (!sourceId) continue;

        const cid = `items:${un}` as CatalogId;
        addSource(out, cid, sourceId);
    }

    // 2) Misc.json: fish processing
    const miscArr = normalizeItemsArray(MISC);
    for (const r of miscArr) {
        const un = r.uniqueName;
        if (!un || typeof un !== "string") continue;

        const desc = String(r.description ?? "");
        const sourceId = parseFishProcessingSourceFromDescription(desc);
        if (!sourceId) continue;

        const cid = `items:${un}` as CatalogId;
        addSource(out, cid, sourceId);
    }

    // 3) All.json: drop locations → sources (relics + nodes + bounties + fallback wfitems:loc)
    const sourcesByUniqueName = collectDropSourcesFromAllJson();
    for (const [uniqueName, sources] of Object.entries(sourcesByUniqueName)) {
        const cid = `items:${uniqueName}` as CatalogId;
        for (const s of sources) addSource(out, cid, s);
    }

    // 4) Lotus-path rules (FULL_CATALOG-driven)
    applyLotusPathRules(out);

    // 5) FINAL: propagate known sources from parent items to recipes referenced by those items.
    // This is REQUIRED because recipe objects in warframe-items All.json often have:
    //  - drops: []
    //  - no "result/product/output" fields
    // Therefore, the only reliable linkage is via FULL_CATALOG record relationships.
    propagateSourcesToRecipes(out);

    return out;
}

const WARFRAME_ITEMS_ACQ_BY_CATALOG_ID = buildInternal();

export function buildAcquisitionFromWarframeItems(): Record<CatalogId, AcquisitionDef> {
    return WARFRAME_ITEMS_ACQ_BY_CATALOG_ID as unknown as Record<CatalogId, AcquisitionDef>;
}

// Symbol imported by itemAcquisition.ts
export function deriveWarframeItemsAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    return WARFRAME_ITEMS_ACQ_BY_CATALOG_ID;
}

