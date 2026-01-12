// ===== FILE: src/catalog/items/itemAcquisition.ts =====
// src/catalog/items/itemAcquisition.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { SourceId } from "../../domain/ids/sourceIds";
import { SRC } from "../../domain/ids/sourceIds";
import { deriveAcquisitionByCatalogIdFromSourcesJson } from "./acquisitionFromSources";

<<<<<<< HEAD
import wfcdAcqJson from "../../data/_generated/wfcd-acquisition.byCatalogId.auto.json";
import wikiAcqJson from "../../data/_generated/wiki-acquisition.byCatalogId.auto.json";
=======
// Generated overlay from official drop tables (scripts/genWikiDrops.ts)
import wikiAcqByCatalogId from "../../data/_generated/wiki-acquisition-by-catalog-id.auto.json";
>>>>>>> cb230193c88a1a29f90a17c00ae76ad10088aa40

export interface AcquisitionDef {
    sources: SourceId[];
}

/**
 * Display-name convenience only.
 * Never used for canonical resolution.
 */
export const ACQUISITION_BY_DISPLAY_NAME: Record<string, AcquisitionDef> = {
    "Mother Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Father Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Son Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Daughter Token": { sources: [SRC.VENDOR_ENTRATI] },

    "Training Debt-Bond": { sources: [SRC.VENDOR_SOLARIS_UNITED] },

    "Voidplume Down": { sources: [SRC.VENDOR_HOLDFASTS] },
    "Entrati Obols": { sources: [SRC.VENDOR_CAVIA] },
    "Shrill Voca": { sources: [SRC.VENDOR_CAVIA] }
};

/**
 * Explicit, verified, non-guess overrides.
 */
const EXPLICIT_ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    // -----------------------------
    // Core system unlocks
    // -----------------------------
    "items:/Lotus/Powersuits/Archwing/StandardArchwing": {
<<<<<<< HEAD
        sources: ["system:archwing"]
    },
    "items:/Lotus/Types/Vehicles/Railjack/Railjack": {
        sources: ["system:railjack"]
    },
    "items:/Lotus/Powersuits/EntratiMech/EntratiMech": {
        sources: ["system:necramech"]
    },

=======
        sources: ["system:archwing" as SourceId]
    },

    "items:/Lotus/Types/Vehicles/Railjack/Railjack": {
        sources: ["system:railjack" as SourceId]
    },

    "items:/Lotus/Powersuits/EntratiMech/EntratiMech": {
        sources: ["system:necramech" as SourceId]
    },

>>>>>>> cb230193c88a1a29f90a17c00ae76ad10088aa40
    // -----------------------------
    // Helminth system
    // -----------------------------
    "items:/Lotus/Types/Items/Helminth/HelminthResource": {
<<<<<<< HEAD
        sources: ["system:helminth"]
=======
        sources: ["system:helminth" as SourceId]
>>>>>>> cb230193c88a1a29f90a17c00ae76ad10088aa40
    },

    // -----------------------------
    // Veilbreaker (Kahl)
    // -----------------------------
    "items:/Lotus/Types/Items/Kahl/KahlResource": {
<<<<<<< HEAD
        sources: ["system:veilbreaker"]
=======
        sources: ["system:veilbreaker" as SourceId]
>>>>>>> cb230193c88a1a29f90a17c00ae76ad10088aa40
    },

    // -----------------------------
    // Duviri
    // -----------------------------
    "items:/Lotus/Types/Gameplay/Duviri/Resource/DuviriResourceItem": {
<<<<<<< HEAD
        sources: ["system:duviri"]
=======
        sources: ["system:duviri" as SourceId]
>>>>>>> cb230193c88a1a29f90a17c00ae76ad10088aa40
    },

    // -----------------------------
    // Archon Hunts
    // -----------------------------
    "items:/Lotus/Types/Items/Archon/ArchonShard": {
<<<<<<< HEAD
        sources: ["system:archon_hunts"]
=======
        sources: ["system:archon_hunts" as SourceId]
>>>>>>> cb230193c88a1a29f90a17c00ae76ad10088aa40
    },

    // -----------------------------
    // Explicit non-drop Warframes
    // -----------------------------
    "items:/Lotus/Powersuits/Ninja/Ninja": {
<<<<<<< HEAD
        sources: ["enemy:manics"]
    },
    "items:/Lotus/Powersuits/Brawler/Brawler": {
        sources: ["boss:jordas_golem"]
=======
        sources: ["enemy:manics" as SourceId]
    },

    "items:/Lotus/Powersuits/Brawler/Brawler": {
        sources: ["boss:jordas_golem" as SourceId]
>>>>>>> cb230193c88a1a29f90a17c00ae76ad10088aa40
    },

    // -----------------------------
    // Clan Tech (Dojo Research)
    // -----------------------------
    "items:/Lotus/Weapons/ClanTech/Bio/AcidDartPistol": {
<<<<<<< HEAD
        sources: ["system:clan_research"]
=======
        sources: ["system:clan_research" as SourceId]
>>>>>>> cb230193c88a1a29f90a17c00ae76ad10088aa40
    }
};

function normalizeIncomingAcqMap(raw: unknown): Record<string, AcquisitionDef> {
    const v = (raw ?? {}) as Record<string, any>;
    const out: Record<string, AcquisitionDef> = {};

    for (const [k, def] of Object.entries(v)) {
        const key = String(k ?? "").trim();
        if (!key.startsWith("items:")) continue;

        const sourcesRaw = Array.isArray(def?.sources) ? def.sources : [];
        const sources: SourceId[] = [];

        for (const s of sourcesRaw) {
            const sid = String(s ?? "").trim();
            if (!sid) continue;
            sources.push(sid as SourceId);
        }

        if (sources.length === 0) continue;

        // de-dupe + stable sort
        const uniq = Array.from(new Set(sources)).sort((a, b) => String(a).localeCompare(String(b)));
        out[key] = { sources: uniq };
    }

    return out;
}

function unionAcqMaps(...maps: Array<Record<string, AcquisitionDef>>): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};

    for (const m of maps) {
        for (const [k, def] of Object.entries(m ?? {})) {
            const key = String(k ?? "").trim();
            if (!key.startsWith("items:")) continue;

            const sources = Array.isArray(def?.sources) ? def.sources : [];
            if (sources.length === 0) continue;

            if (!out[key]) out[key] = { sources: [] };

            const merged = new Set<string>(out[key].sources.map((x) => String(x)));
            for (const s of sources) {
                const sid = String(s ?? "").trim();
                if (!sid) continue;
                merged.add(sid);
            }

            out[key].sources = Array.from(merged)
                .sort((a, b) => a.localeCompare(b))
                .map((x) => x as SourceId);
        }
    }

    return out;
}

/**
 * Dataset-derived acquisition (sources.json).
 */
const DERIVED_FROM_SOURCES_JSON: Record<string, AcquisitionDef> =
    deriveAcquisitionByCatalogIdFromSourcesJson();

/**
<<<<<<< HEAD
 * WFCD-derived acquisition (raw WFCD json drops).
 */
const DERIVED_FROM_WFCD: Record<string, AcquisitionDef> =
    normalizeIncomingAcqMap(wfcdAcqJson);

/**
 * Wiki table-derived acquisition (your parsed wiki drops).
 */
const DERIVED_FROM_WIKI: Record<string, AcquisitionDef> =
    normalizeIncomingAcqMap(wikiAcqJson);

/**
 * Canonical resolution:
 * - Union known datasets (sources.json + wfcd + wiki)
 * - Explicit overrides are still applied last (and can narrow/replace in the future if you want)
 *
 * For now, explicit is merged last so it cannot be “lost”.
 */
export const ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    ...unionAcqMaps(
        DERIVED_FROM_SOURCES_JSON,
        DERIVED_FROM_WFCD,
        DERIVED_FROM_WIKI
    ),
=======
 * Wiki-derived acquisition overlay (generated).
 * Fail-closed: only includes items that resolved uniquely to a CatalogId during generation.
 */
const WIKI_DERIVED_BY_CATALOG_ID: Record<string, AcquisitionDef> =
    (wikiAcqByCatalogId as Record<string, AcquisitionDef>) ?? {};

/**
 * Canonical resolution:
 * 1) Explicit overrides
 * 2) Dataset-derived (sources.json)
 * 3) Wiki-derived overlay (only for items missing in dataset)
 */
export const ACQUISITION_BY_CATALOG_ID: Record<string, AcquisitionDef> = {
    ...WIKI_DERIVED_BY_CATALOG_ID,
    ...DERIVED_FROM_SOURCES_JSON,
>>>>>>> cb230193c88a1a29f90a17c00ae76ad10088aa40
    ...EXPLICIT_ACQUISITION_BY_CATALOG_ID
};

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    const raw = String(catalogId ?? "").trim();
    if (!raw) return null;

    const key = raw.startsWith("items:")
        ? raw
        : raw.startsWith("/")
            ? `items:${raw}`
            : raw;

    return ACQUISITION_BY_CATALOG_ID[key] ?? null;
}

export function getAcquisitionByDisplayName(name: string): AcquisitionDef | null {
    const key = String(name ?? "").trim();
    if (!key) return null;
    return ACQUISITION_BY_DISPLAY_NAME[key] ?? null;
}

