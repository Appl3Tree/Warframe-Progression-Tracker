// src/catalog/items/acquisitionFromWikiDrops.ts
//
// Loads src/data/_generated/wiki-acquisition.byCatalogId.auto.json
// and exposes it as AcquisitionDef map.
//
// Contract: generated file keys are CatalogIds (e.g., "items:/Lotus/...").
// Fail-closed: returns empty map if file is missing/invalid.

import type { AcquisitionDef } from "./itemAcquisition";

// Vite can import JSON modules directly.
import wikiAcqJson from "../../data/_generated/wiki-acquisition.byCatalogId.auto.json";

export function deriveAcquisitionByCatalogIdFromWikiDrops(): Record<string, AcquisitionDef> {
    const raw = (wikiAcqJson ?? {}) as Record<string, any>;
    const out: Record<string, AcquisitionDef> = {};

    for (const [k, v] of Object.entries(raw)) {
        const key = String(k ?? "").trim();
        if (!key) continue;

        const sourcesRaw = Array.isArray(v?.sources) ? v.sources : Array.isArray(v) ? v : [];
        const sources = sourcesRaw
            .map((x: any) => String(x ?? "").trim())
            .filter((s: string) => s.length > 0);

        const uniq = Array.from(new Set(sources));
        if (uniq.length === 0) continue;

        out[key] = { sources: uniq };
    }

    return out;
}

