// ===== FILE: scripts/check-acq-layer-health.ts =====

import { deriveDropDataAcquisitionByCatalogId } from "../src/catalog/items/acquisitionFromDropData";
import { deriveRelicMissionRewardsAcquisitionByCatalogId } from "../src/catalog/items/acquisitionFromMissionRewardsRelics";
import { deriveAcquisitionByCatalogIdFromSourcesJson } from "../src/catalog/items/acquisitionFromSources";

import { SOURCE_CATALOG, SOURCE_INDEX } from "../src/catalog/sources/sourceCatalog";

function countKeys(o: Record<string, unknown>): number {
    return Object.keys(o).length;
}

console.log("== Source catalog ==");
console.log("SOURCE_CATALOG:", SOURCE_CATALOG.length);
console.log("SOURCE_INDEX:", Object.keys(SOURCE_INDEX).length);

console.log("");
console.log("== Acquisition layers ==");
const wfcd = deriveAcquisitionByCatalogIdFromSourcesJson();
const dd = deriveDropDataAcquisitionByCatalogId();
const mr = deriveRelicMissionRewardsAcquisitionByCatalogId();

console.log("WFCD_ACQ keys:", countKeys(wfcd));
console.log("DROP_DATA_ACQ keys:", countKeys(dd));
console.log("MISSION_RELIC_ACQ keys:", countKeys(mr));

