// ===== FILE: src/catalog/items/acquisitionFromWfItemsDrops.ts =====

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";
import { canonicalizeWfItemsLocation } from "../sources/wfItemsLocCanonical";

export type AcquisitionDef = {
    sources: string[];
};

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function normalizeName(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export type WfItemsJoinDiagnostics = {
    stats: {
        uniqueDropTypes: number;
        matchedUniqueDropTypes: number;
        unmatchedUniqueDropTypes: number;
        ambiguousUniqueDropTypes: number;
    };
    samples: {
        unmatchedDropTypes: string[];
        ambiguousDropTypes: Array<{ dropType: string; matchedCatalogIds: string[] }>;
    };
};

function pushUnique(out: string[], v: string): void {
    if (!v || typeof v !== "string") return;
    const s = v.trim();
    if (!s) return;
    if (out.includes(s)) return;
    out.push(s);
}

function findCatalogIdsByDisplayName(name: string): CatalogId[] {
    const key = normalizeName(name);
    const hits = FULL_CATALOG.nameIndex[key];
    return Array.isArray(hits) ? (hits as CatalogId[]) : [];
}

export function deriveWfItemsDropsAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};

    const modules = import.meta.glob("../../../external/warframe-items/raw/*.json", { eager: true }) as Record<
        string,
        any
    >;

    for (const mod of Object.values(modules)) {
        const root = (mod as any)?.default ?? mod;
        if (!Array.isArray(root)) continue;

        for (const item of root) {
            const comps = (item as any)?.components;
            if (!Array.isArray(comps)) continue;

            for (const c of comps) {
                const drops = (c as any)?.drops;
                if (!Array.isArray(drops) || drops.length === 0) continue;

                for (const d of drops) {
                    const dropType = safeString((d as any)?.type);
                    const location = safeString((d as any)?.location);
                    if (!dropType || !location) continue;

                    const matched = findCatalogIdsByDisplayName(dropType);
                    if (matched.length !== 1) continue;

                    const catalogId = String(matched[0]);
                    const canon = canonicalizeWfItemsLocation(location);
                    if (canon.legacySourceId === "data:wfitems:loc:requiem-undefined-relic") {
                        continue;
                    }

                    if (!out[catalogId]) out[catalogId] = { sources: [] };
                    pushUnique(out[catalogId].sources, canon.canonicalSourceId);
                }
            }
        }
    }

    for (const v of Object.values(out)) {
        v.sources.sort((a, b) => a.localeCompare(b));
    }

    return out;
}

export function deriveWfItemsDropJoinDiagnostics(): WfItemsJoinDiagnostics {
    const dropTypes = new Set<string>();

    const modules = import.meta.glob("../../../external/warframe-items/raw/*.json", { eager: true }) as Record<
        string,
        any
    >;

    for (const mod of Object.values(modules)) {
        const root = (mod as any)?.default ?? mod;
        if (!Array.isArray(root)) continue;

        for (const item of root) {
            const comps = (item as any)?.components;
            if (!Array.isArray(comps)) continue;

            for (const c of comps) {
                const drops = (c as any)?.drops;
                if (!Array.isArray(drops) || drops.length === 0) continue;

                for (const d of drops) {
                    const dropType = safeString((d as any)?.type);
                    if (!dropType) continue;
                    dropTypes.add(dropType);
                }
            }
        }
    }

    const unmatched: string[] = [];
    const ambiguous: Array<{ dropType: string; matchedCatalogIds: string[] }> = [];

    let matchedCount = 0;
    let unmatchedCount = 0;
    let ambiguousCount = 0;

    for (const t of Array.from(dropTypes.values()).sort((a, b) => a.localeCompare(b))) {
        const hits = findCatalogIdsByDisplayName(t);

        if (hits.length === 1) {
            matchedCount += 1;
            continue;
        }

        if (hits.length === 0) {
            unmatchedCount += 1;
            if (unmatched.length < 200) unmatched.push(t);
            continue;
        }

        ambiguousCount += 1;
        if (ambiguous.length < 100) {
            ambiguous.push({
                dropType: t,
                matchedCatalogIds: hits.slice(0, 25).map(String)
            });
        }
    }

    return {
        stats: {
            uniqueDropTypes: dropTypes.size,
            matchedUniqueDropTypes: matchedCount,
            unmatchedUniqueDropTypes: unmatchedCount,
            ambiguousUniqueDropTypes: ambiguousCount
        },
        samples: {
            unmatchedDropTypes: unmatched,
            ambiguousDropTypes: ambiguous
        }
    };
}
