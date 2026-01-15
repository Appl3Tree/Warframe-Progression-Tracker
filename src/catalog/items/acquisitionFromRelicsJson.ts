// ===== FILE: src/catalog/items/acquisitionFromRelicsJson.ts =====
// src/catalog/items/acquisitionFromRelicsJson.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

import type { AcquisitionDef } from "./acquisitionFromSources";

import relicsJson from "../../../external/warframe-drop-data/raw/relics.json";

function normalizeSpaces(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

function normalizeNameNoPunct(s: string): string {
    return normalizeSpaces(s)
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function toToken(s: string): string {
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

/**
 * MUST match src/catalog/sources/sourceCatalog.ts srcId() behavior:
 *   src:relic/<tier>/<relicName>
 */
function srcId(parts: string[]): string {
    const cleaned = parts
        .map((p) => normalizeSpaces(String(p)))
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "src:unknown";
    return `src:${cleaned.join("/")}`;
}

function isProjectionRelic(catalogId: CatalogId, rec: any): boolean {
    const cid = String(catalogId);

    if (/\/Types\/Game\/Projections\//i.test(cid)) return true;

    const raw = rec?.raw as any;
    const wfcdName = raw?.rawWfcd?.uniqueName ?? raw?.rawWfcd?.unique_name ?? null;
    const lotusName = raw?.rawLotus?.uniqueName ?? raw?.rawLotus?.unique_name ?? null;

    const u = String(wfcdName ?? lotusName ?? "");
    return /\/Types\/Game\/Projections\//i.test(u);
}

/**
 * Extract relic key from display name.
 * Supports:
 *  - "Axi A1 Exceptional"
 *  - "Meso V14 Relic"
 */
function relicKeyFromDisplayName(displayName: string): string | null {
    const raw = normalizeSpaces(displayName);

    // "Meso V14 Relic"
    {
        const m = raw.match(/\b(Lith|Meso|Neo|Axi)\b\s+([A-Za-z0-9]+)\s+Relic\b/i);
        if (m) return `${m[1].toLowerCase()} ${m[2].toLowerCase()}`;
    }

    // "Axi A1 Exceptional"
    {
        const m = raw.match(/^\s*(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\b/i);
        if (!m) return null;

        const tier = m[1].toLowerCase();
        const code = m[2].toLowerCase();
        if (code === "relic") return null;

        return `${tier} ${code}`;
    }
}

type RelicsRow = {
    tier?: string;
    relicName?: string;
};

function buildRelicsJsonKeyToSourceId(): Map<string, string> {
    const arr = (relicsJson as any)?.relics ?? (relicsJson as any);
    const map = new Map<string, string>();

    if (!Array.isArray(arr)) return map;

    for (const r of arr as RelicsRow[]) {
        const tierRaw = typeof r?.tier === "string" ? r.tier : "";
        const nameRaw = typeof r?.relicName === "string" ? r.relicName : "";
        const tier = normalizeSpaces(tierRaw);
        const relicName = normalizeSpaces(nameRaw);

        if (!tier || !relicName) continue;

        // key format must match relicKeyFromDisplayName(): "<tier> <code>" lowercased
        const key = `${tier.toLowerCase()} ${relicName.toLowerCase()}`;

        // sourceCatalog.ts creates these as:
        //   srcId(["relic", tier, relicName])
        const sid = srcId(["relic", tier, relicName]);

        map.set(key, sid);
    }

    return map;
}

/**
 * Acquisition layer:
 * If a relic projection exists in FULL_CATALOG AND that relic exists in relics.json,
 * emit acquisition source: src:relic/<tier>/<relicName>.
 *
 * This is fail-closed: if relics.json doesn't contain it, we emit nothing.
 */
export function deriveRelicsJsonAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const keyToSid = buildRelicsJsonKeyToSourceId();
    const out: Record<string, AcquisitionDef> = {};

    for (const id of FULL_CATALOG.displayableItemIds as CatalogId[]) {
        const rec: any = FULL_CATALOG.recordsById[id];
        const name = typeof rec?.displayName === "string" ? rec.displayName : "";
        if (!name) continue;

        if (!isProjectionRelic(id, rec)) continue;

        const relicKey = relicKeyFromDisplayName(name);
        if (!relicKey) continue;

        const sid = keyToSid.get(relicKey);
        if (!sid) continue;

        out[String(id)] = { sources: [sid] };
    }

    return out;
}

