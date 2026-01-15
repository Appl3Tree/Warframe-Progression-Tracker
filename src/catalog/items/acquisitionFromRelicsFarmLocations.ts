// ===== FILE: src/catalog/items/acquisitionFromRelicsFarmLocations.ts =====
// src/catalog/items/acquisitionFromRelicsFarmLocations.ts

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

function srcId(parts: string[]): string {
    const cleaned = parts
        .map((p) => normalizeSpaces(String(p)))
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "src:unknown";
    return `src:${cleaned.join("/")}`;
}

function relicKeyFromName(name: string): { tier: string; code: string } | null {
    const raw = normalizeSpaces(name);

    // "Axi A1 Exceptional" OR "Axi A1 Relic"
    const m = raw.match(/^\s*(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\b/i);
    if (!m) return null;

    const tier = m[1].toLowerCase();
    const code = m[2].toLowerCase();
    if (!tier || !code || code === "relic") return null;

    return { tier, code };
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

function getRelicsArray(): any[] {
    const arr = (relicsJson as any)?.relics ?? (relicsJson as any);
    return Array.isArray(arr) ? arr : [];
}

function getLocationStrings(relic: any): string[] {
    const out: string[] = [];

    const drops = Array.isArray(relic?.drops) ? relic.drops : [];
    for (const d of drops) {
        const s =
            (typeof d?.location === "string" && d.location.trim()) ? d.location.trim() :
            (typeof d?.place === "string" && d.place.trim()) ? d.place.trim() :
            (typeof d?.node === "string" && d.node.trim()) ? d.node.trim() :
            (typeof d?.mission === "string" && d.mission.trim()) ? d.mission.trim() :
            null;
        if (s) out.push(s);
    }

    const a1 = Array.isArray(relic?.locations) ? relic.locations : [];
    for (const x of a1) {
        if (typeof x === "string" && x.trim()) out.push(x.trim());
    }

    const a2 = Array.isArray(relic?.dropLocations) ? relic.dropLocations : [];
    for (const x of a2) {
        if (typeof x === "string" && x.trim()) out.push(x.trim());
    }

    // de-dupe (case-insensitive)
    const uniq = new Map<string, string>();
    for (const s of out) {
        const k = normalizeSpaces(s).toLowerCase();
        if (!k) continue;
        if (!uniq.has(k)) uniq.set(k, s);
    }

    return Array.from(uniq.values());
}

export function deriveRelicFarmLocationsAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const relicsArr = getRelicsArray();

    // Build index: "<tier> <code>" -> { tierOriginal, relicName, locations[] }
    const byKey = new Map<string, { tier: string; relicName: string; locations: string[] }>();

    for (const r of relicsArr) {
        const tier = typeof r?.tier === "string" ? r.tier.trim() : "";
        const relicName = typeof r?.relicName === "string" ? r.relicName.trim() : "";
        if (!tier || !relicName) continue;

        const key = `${tier}`.toLowerCase() + " " + `${relicName}`.toLowerCase();
        const locations = getLocationStrings(r);
        if (locations.length === 0) continue;

        byKey.set(key, { tier, relicName, locations });
    }

    const out: Record<string, AcquisitionDef> = {};

    for (const id of FULL_CATALOG.displayableItemIds as CatalogId[]) {
        const rec: any = FULL_CATALOG.recordsById[id];
        if (!isProjectionRelic(id, rec)) continue;

        const displayName = typeof rec?.displayName === "string" ? rec.displayName : "";
        if (!displayName) continue;

        const rk = relicKeyFromName(displayName);
        if (!rk) continue;

        // In relics.json, relicName is usually just the code ("A1"), tier is "Axi"
        const key = `${rk.tier} ${rk.code}`;
        const hit = byKey.get(key);
        if (!hit) continue;

        const sources = new Set<string>();

        for (const loc of hit.locations) {
            sources.add(srcId(["relic-farm", hit.tier, loc]));
        }

        if (sources.size === 0) continue;

        out[String(id)] = {
            sources: Array.from(sources.values()).sort((a, b) => a.localeCompare(b))
        };
    }

    return out;
}

