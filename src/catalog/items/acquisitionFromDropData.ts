// ===== FILE: src/catalog/items/acquisitionFromDropData.ts =====
// src/catalog/items/acquisitionFromDropData.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

// Generated from warframe-drop-data/raw/missionRewards.json by your scripts
import relicMissionRewardsIndex from "../../data/_generated/relic-missionRewards-index.auto.json";

export type AcquisitionDef = {
    sources: string[];
};

type RelicMissionRow = {
    relicKey: string;          // e.g. "meso v14"
    relicDisplay: string;      // e.g. "Meso V14 Relic"
    pathLabel: string;         // e.g. "missionRewards / Ceres / Bode / C"
    rotation: string;          // e.g. "C"
    chance: number;            // e.g. 9.68
};

function normalizeName(s: string): string {
    return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeNameNoPunct(s: string): string {
    return normalizeName(s).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function toToken(s: string): string {
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

/**
 * Build a valid src: SourceId payload segment (no extra colons).
 * MUST match src/catalog/sources/sourceCatalog.ts behavior.
 */
function srcId(parts: string[]): string {
    const cleaned = parts
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "src:unknown";
    return `src:${cleaned.join("/")}`;
}

function uniqSorted(xs: string[]): string[] {
    const set = new Set<string>();
    for (const x of xs) {
        if (typeof x === "string" && x.trim()) set.add(x.trim());
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

function isRelicProjectionCatalogId(catalogId: string): boolean {
    // The projection-style relic items live here (Axi A1 Exceptional, etc.)
    return /\/Types\/Game\/Projections\//i.test(catalogId);
}

/**
 * Extract a normalized relicKey from a displayName for:
 * - Era relics: "Axi A1 Exceptional" or "Axi A1 Relic"
 * - Requiem: "Requiem I Intact" etc.
 * - Vanguard: "Vanguard C1 Radiant" etc.
 *
 * Output examples:
 * - "axi a1"
 * - "meso v14"
 * - "requiem i"
 * - "vanguard c1"
 */
function relicKeyFromDisplayName(displayName: string): string | null {
    const n = (displayName ?? "").replace(/\s+/g, " ").trim();

    // Era relic projections: tolerate missing literal "Relic" and refinement suffix
    {
        const m = n.match(
            /^\s*(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?\s*$/i
        );
        if (m) {
            return `${m[1].toLowerCase()} ${m[2].toLowerCase()}`;
        }
    }

    // Requiem I/II/III/IV projections
    {
        const m = n.match(
            /^\s*Requiem\s+(I|II|III|IV)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?\s*$/i
        );
        if (m) {
            return `requiem ${m[1].toLowerCase()}`;
        }
    }

    // Vanguard C1/E1/M1/P1 etc
    {
        const m = n.match(
            /^\s*Vanguard\s+([A-Za-z0-9]+)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?\s*$/i
        );
        if (m) {
            return `vanguard ${m[1].toLowerCase()}`;
        }
    }

    return null;
}

function parseMissionRewardsPathLabel(pathLabel: string): { planet: string; node: string; rotation: string | null } | null {
    // Expected format:
    // "missionRewards / Ceres / Bode / C"
    const parts = (pathLabel ?? "").split("/").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3) return null;

    const planet = parts[1] ?? "";
    const node = parts[2] ?? "";

    if (!planet || !node) return null;

    const rotation = parts.length >= 4 ? (parts[3] ?? null) : null;
    return { planet, node, rotation };
}

function buildRelicKeyToNodeSourcesIndex(): Record<string, string[]> {
    const rows = relicMissionRewardsIndex as unknown as RelicMissionRow[];

    const map = new Map<string, Set<string>>();

    for (const r of rows) {
        const key = normalizeName(r.relicKey);
        if (!key) continue;

        const parsed = parseMissionRewardsPathLabel(r.pathLabel);
        if (!parsed) continue;

        const sid = srcId(["node", parsed.planet, parsed.node]);

        if (!map.has(key)) map.set(key, new Set<string>());
        map.get(key)!.add(sid);
    }

    const out: Record<string, string[]> = {};
    for (const [k, set] of map.entries()) {
        out[k] = Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    }
    return out;
}

const RELIC_NODE_SOURCES_BY_KEY: Record<string, string[]> = buildRelicKeyToNodeSourcesIndex();

function sourcesForRelicProjection(rec: any): { key: string | null; sources: string[] } {
    const name = typeof rec?.displayName === "string" ? rec.displayName : "";
    const key = relicKeyFromDisplayName(name);

    if (!key) return { key: null, sources: [] };

    const sources = RELIC_NODE_SOURCES_BY_KEY[normalizeName(key)] ?? [];
    return { key, sources };
}

/**
 * Derive item -> acquisition sources from warframe-drop-data/raw ingestion.
 *
 * Notes:
 * - This layer is an augment. It should not guess.
 * - For relic projection items, we map them to mission nodes where the relic drops.
 */
export function deriveDropDataAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};

    for (const id of FULL_CATALOG.displayableItemIds as CatalogId[]) {
        const rec: any = (FULL_CATALOG as any).recordsById[id];
        if (!rec) continue;

        const catalogId = String(id);
        const sources: string[] = [];

        // --- Relic projection items (Axi A1 Exceptional, etc.) ---
        if (isRelicProjectionCatalogId(catalogId)) {
            const r = sourcesForRelicProjection(rec);
            sources.push(...r.sources);
        }

        if (sources.length > 0) {
            out[catalogId] = { sources: uniqSorted(sources) };
        }
    }

    return out;
}

/**
 * Diagnostics used by the UI (Diagnostics.tsx).
 * Keep this export name stable.
 */
export type DropDataJoinDiagnostics = {
    relicProjections: {
        total: number;
        keyParsed: number;
        keyMissing: number;
        keyInMissionIndex: number;
        keyNotInMissionIndex: number;
        withSources: number;
        withoutSources: number;
        sampleMissing: Array<{
            id: string;
            name: string;
            key: string | null;
            reason: "no-key" | "key-not-in-index" | "index-has-no-sources";
        }>;
    };
};

export function deriveDropDataJoinDiagnostics(): DropDataJoinDiagnostics {
    let total = 0;
    let keyParsed = 0;
    let keyMissing = 0;

    let keyInMissionIndex = 0;
    let keyNotInMissionIndex = 0;

    let withSources = 0;
    let withoutSources = 0;

    const sampleMissing: DropDataJoinDiagnostics["relicProjections"]["sampleMissing"] = [];

    for (const id of FULL_CATALOG.displayableItemIds as CatalogId[]) {
        const rec: any = (FULL_CATALOG as any).recordsById[id];
        if (!rec) continue;

        const catalogId = String(id);
        if (!isRelicProjectionCatalogId(catalogId)) continue;

        total += 1;

        const name = typeof rec?.displayName === "string" ? rec.displayName : "";
        const key = relicKeyFromDisplayName(name);

        if (!key) {
            keyMissing += 1;
            if (sampleMissing.length < 50) {
                sampleMissing.push({ id: catalogId, name, key: null, reason: "no-key" });
            }
            continue;
        }

        keyParsed += 1;

        const normKey = normalizeName(key);
        const inIndex = Object.prototype.hasOwnProperty.call(RELIC_NODE_SOURCES_BY_KEY, normKey);

        if (!inIndex) {
            keyNotInMissionIndex += 1;
            if (sampleMissing.length < 50) {
                sampleMissing.push({ id: catalogId, name, key, reason: "key-not-in-index" });
            }
            continue;
        }

        keyInMissionIndex += 1;

        const sources = RELIC_NODE_SOURCES_BY_KEY[normKey] ?? [];
        if (sources.length > 0) {
            withSources += 1;
        } else {
            withoutSources += 1;
            if (sampleMissing.length < 50) {
                sampleMissing.push({ id: catalogId, name, key, reason: "index-has-no-sources" });
            }
        }
    }

    return {
        relicProjections: {
            total,
            keyParsed,
            keyMissing,
            keyInMissionIndex,
            keyNotInMissionIndex,
            withSources,
            withoutSources,
            sampleMissing
        }
    };
}

