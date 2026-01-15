// ===== FILE: src/catalog/items/itemAcquisition.ts =====
// src/catalog/items/itemAcquisition.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

import {
    deriveAcquisitionByCatalogIdFromSourcesJson,
    type AcquisitionDef
} from "./acquisitionFromSources";

import { deriveDropDataAcquisitionByCatalogId } from "./acquisitionFromDropData";
import { deriveRelicMissionRewardsAcquisitionByCatalogId } from "./acquisitionFromMissionRewardsRelics";
import { deriveRelicsJsonAcquisitionByCatalogId } from "./acquisitionFromRelicsJson";

/**
 * Central acquisition accessor.
 *
 * Rules:
 * - WFCD acquisition is used when present.
 * - warframe-drop-data/raw ingestion is an augment layer.
 * - missionRewards relic indexing is an augment layer.
 * - relics.json is an augment layer (covers vaulted / non-missionRewards relics).
 * - When multiple exist: union the sources.
 * - Strict fallback (non-guess):
 *      - buildPrice:number => Crafting (Foundry)
 *      - marketCost:number => Market purchase
 */

const WFCD_ACQ: Record<string, AcquisitionDef> = deriveAcquisitionByCatalogIdFromSourcesJson();
const DROP_DATA_ACQ: Record<string, AcquisitionDef> = deriveDropDataAcquisitionByCatalogId();
const MISSION_RELIC_ACQ: Record<string, AcquisitionDef> = deriveRelicMissionRewardsAcquisitionByCatalogId();
const RELICS_JSON_ACQ: Record<string, AcquisitionDef> = deriveRelicsJsonAcquisitionByCatalogId();

function unionSources(...lists: Array<string[] | undefined>): string[] {
    const set = new Set<string>();

    for (const list of lists) {
        for (const x of list ?? []) {
            if (typeof x === "string" && x.trim()) set.add(x.trim());
        }
    }

    return Array.from(set.values()).sort((x, y) => x.localeCompare(y));
}

function isFiniteNumber(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v);
}

function deriveStrictFallbackSources(catalogId: CatalogId): string[] {
    const rec = FULL_CATALOG.recordsById[catalogId];
    const raw = rec?.raw as any;

    // Our merged items record keeps rawWfcd/rawLotus.
    const wfcd = raw?.rawWfcd ?? null;
    const lotus = raw?.rawLotus ?? null;

    const buildPrice =
        wfcd?.buildPrice ??
        lotus?.buildPrice ??
        null;

    const marketCost =
        wfcd?.marketCost ??
        lotus?.marketCost ??
        null;

    const out: string[] = [];

    if (isFiniteNumber(buildPrice) && buildPrice > 0) {
        out.push("data:crafting");
    }

    if (isFiniteNumber(marketCost) && marketCost > 0) {
        out.push("data:market");
    }

    return out;
}

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    const key = String(catalogId);

    const wfcd = WFCD_ACQ[key];
    const dd = DROP_DATA_ACQ[key];
    const mr = MISSION_RELIC_ACQ[key];
    const rj = RELICS_JSON_ACQ[key];

    const sources = unionSources(wfcd?.sources, dd?.sources, mr?.sources, rj?.sources);

    // Strict fallback only if no sources exist so far.
    if (sources.length === 0) {
        const fallback = deriveStrictFallbackSources(catalogId);
        if (fallback.length === 0) return null;
        return { sources: fallback };
    }

    return { sources };
}

