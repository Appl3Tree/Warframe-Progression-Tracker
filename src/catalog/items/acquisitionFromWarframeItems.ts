// ===== FILE: src/catalog/items/acquisitionFromWarframeItems.ts =====
// src/catalog/items/acquisitionFromWarframeItems.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { AcquisitionDef } from "./acquisitionFromSources";

// warframe-items raw datasets (targeted)
import RESOURCES from "../../../external/warframe-items/raw/Resources.json";
import MISC from "../../../external/warframe-items/raw/Misc.json";

// Drive Lotus-path rules across the full catalog
import WFCD_BY_CATALOG_ID from "../../data/_generated/wfcd-items.byCatalogId.auto.json";

type WarframeItemsRow = {
    name?: string | null;
    uniqueName?: string | null;
    type?: string | null;
    category?: string | null;
    description?: string | null;
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

function addSource(
    out: Record<string, AcquisitionDef>,
    catalogId: CatalogId,
    sourceId: string
): void {
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

/* ---------- Lotus-path rules ---------- */

function lotusPath(catalogId: CatalogId): string {
    const s = String(catalogId); // "items:/Lotus/..."
    const idx = s.indexOf(":/Lotus/");
    if (idx === -1) return s;
    return s.slice(idx + 1); // "/Lotus/..."
}

function applyLotusPathRules(out: Record<string, AcquisitionDef>): void {
    for (const key of Object.keys(WFCD_BY_CATALOG_ID) as CatalogId[]) {
        const p = lotusPath(key);

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

        // --- Kuva ecosystem (weapons + blueprints) ---
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
        if (
            p.includes("/DexTheSecond/") ||
            p.includes("/DexTheThird/") ||
            p.includes("/DexFuris/") ||
            p.includes("/Dex2023Nikana/")
        ) {
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

        /* ===== Missing buckets identified via jq ===== */

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

        // --- Fieldron Sample (Corpus resource drop) ---
        // Lotus path for Fieldron Sample is /Lotus/Types/Items/Research/EnergyFragment.
        // Coarse mapping: Resource bucket (Corpus drop). :contentReference[oaicite:1]{index=1}
        if (p === "/Lotus/Types/Items/Research/EnergyFragment") {
            addSource(out, key, "data:resource/fieldron-sample");
            continue;
        }
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

    // 3) Lotus-path rules
    applyLotusPathRules(out);

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

