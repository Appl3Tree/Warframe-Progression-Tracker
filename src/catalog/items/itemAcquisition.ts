// ===== FILE: src/catalog/items/itemAcquisition.ts =====
// src/catalog/items/itemAcquisition.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";

import {
    deriveAcquisitionByCatalogIdFromSourcesJson,
    type AcquisitionDef
} from "./acquisitionFromSources";

import { deriveDropDataAcquisitionByCatalogId } from "./acquisitionFromDropData";
import { deriveRelicMissionRewardsAcquisitionByCatalogId } from "./acquisitionFromMissionRewardsRelics";
import { deriveRelicsJsonAcquisitionByCatalogId } from "./acquisitionFromRelicsJson";
import { deriveWarframeItemsAcquisitionByCatalogId } from "./acquisitionFromWarframeItems";
import { deriveItemsJsonMarketAcquisitionByCatalogId } from "./acquisitionFromItemsJsonMarket";

/**
 * Central acquisition accessor.
 *
 * Rules:
 * - WFCD acquisition is used when present.
 * - warframe-drop-data/raw ingestion is an augment layer.
 * - missionRewards relic indexing is an augment layer.
 * - relics.json is an augment layer.
 * - warframe-items ingestion (Resources/Misc/Fish) is an augment layer.
 * - items.json market acquisition (recipes/blueprints) is an augment layer.
 * - Manual curation is included inside acquisitionFromDropData.ts (MANUAL_ACQUISITION_BY_CATALOG_ID)
 *
 * IMPORTANT POLICY:
 * - NO inferred fallback sources (no crafting/market inference).
 * - If none of the ingestion layers provide sources, return null so the item
 *   is explicitly unmapped and can be manually curated.
 * - Output is always a UNION of all known sources from the ingestion layers.
 */

const WFCD_ACQ: Record<string, AcquisitionDef> = deriveAcquisitionByCatalogIdFromSourcesJson();
const DROP_DATA_ACQ: Record<string, AcquisitionDef> = deriveDropDataAcquisitionByCatalogId();
const MISSION_RELIC_ACQ: Record<string, AcquisitionDef> = deriveRelicMissionRewardsAcquisitionByCatalogId();
const RELICS_JSON_ACQ: Record<string, AcquisitionDef> = deriveRelicsJsonAcquisitionByCatalogId();
const WARFRAME_ITEMS_ACQ: Record<string, AcquisitionDef> = deriveWarframeItemsAcquisitionByCatalogId();
const ITEMS_JSON_MARKET_ACQ: Record<string, AcquisitionDef> = deriveItemsJsonMarketAcquisitionByCatalogId();

function unionSources(...lists: Array<string[] | undefined>): string[] {
    const set = new Set<string>();

    for (const list of lists) {
        for (const x of list ?? []) {
            if (typeof x !== "string") continue;
            const s = x.trim();
            if (!s) continue;
            set.add(s);
        }
    }

    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

export function getAcquisitionByCatalogId(catalogId: CatalogId): AcquisitionDef | null {
    const key = String(catalogId);

    const wfcd = WFCD_ACQ[key];
    const dd = DROP_DATA_ACQ[key];
    const mr = MISSION_RELIC_ACQ[key];
    const rj = RELICS_JSON_ACQ[key];
    const wi = WARFRAME_ITEMS_ACQ[key];
    const im = ITEMS_JSON_MARKET_ACQ[key];

    const sources = unionSources(wfcd?.sources, dd?.sources, mr?.sources, rj?.sources, wi?.sources, im?.sources);

    if (sources.length === 0) return null;
    return { sources };
}
