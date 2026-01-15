// ===== FILE: src/catalog/items/acquisitionFromMissionRewardsRelics.ts =====
// src/catalog/items/acquisitionFromMissionRewardsRelics.ts

import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

import type { AcquisitionDef } from "./acquisitionFromSources";

// IMPORTANT: You must generate this JSON from your TSV.
// See the script + command at the bottom of this file.
import relicMissionRewardsIndex from "../../data/_generated/relic-missionRewards-index.auto.json";

type RelicIndexRow = {
    relicKey: string;         // "meso v14"
    relicDisplay: string;     // "Meso V14 Relic"
    pathLabel: string;        // "missionRewards / Ceres / Bode / C"
    rotation?: string | null; // "A" | "B" | "C" | ""
    chance?: number | null;   // best-effort
};

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

/**
 * Convert a TSV-derived pathLabel into the mission node SourceId used by sourceCatalog.ts:
 *   srcId(["node", planetName, nodeName])
 *
 * Expected input example:
 *   "missionRewards / Ceres / Bode / C"
 *   "missionRewards / Dark Refractory, Deimos / Recall: Dactolyst / A"
 *
 * We only need the first two meaningful segments after "missionRewards":
 *   planet = "Ceres"
 *   node   = "Bode"
 *
 * If we can't parse, return null (fail-closed).
 */
function missionNodeSourceIdFromPathLabel(pathLabel: string): string | null {
    const parts = normalizeSpaces(pathLabel)
        .split("/")
        .map((p) => normalizeSpaces(p))
        .filter(Boolean);

    if (parts.length < 3) return null;

    // Usually: ["missionRewards", "<Planet>", "<Node>", "<Rotation?>"]
    const head = parts[0].toLowerCase();
    if (head !== "missionrewards") return null;

    const planet = parts[1];
    const node = parts[2];

    if (!planet || !node) return null;

    return srcId(["node", planet, node]);
}

/**
 * Heuristic gating so we don't accidentally match unrelated items:
 * - Relic items in your catalog are projections under /Types/Game/Projections/
 * - This catches "Axi A1 Exceptional" style display names.
 */
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
 * Extract relicKey for missionRewards matching.
 *
 * Supports BOTH:
 * - "Meso V14 Relic"
 * - "Neo T10 Relic (Radiant)"
 * - "Axi A1 Exceptional" / "Axi A1 Flawless" / "Axi A1 Intact" / "Axi A1 Radiant"
 *
 * Returns: "<tier> <code>" normalized to lowercase, e.g. "axi a1"
 */
function relicKeyFromDisplayName(displayName: string): string | null {
    const raw = normalizeSpaces(displayName);

    // Primary: explicit "Relic" phrasing (missionRewards uses this a lot)
    // Examples:
    //   "Meso V14 Relic"
    //   "Neo T10 Relic (Radiant)"
    {
        const m = raw.match(/\b(Lith|Meso|Neo|Axi)\b\s+([A-Za-z0-9]+)\s+Relic\b/i);
        if (m) {
            const tier = m[1].toLowerCase();
            const code = m[2].toLowerCase();
            return `${tier} ${code}`;
        }
    }

    // Secondary: projection items named without "Relic"
    // Examples:
    //   "Axi A1 Exceptional"
    //   "Lith N18 Intact"
    // We intentionally take the first two tokens: <tier> <code>
    {
        const m = raw.match(/^\s*(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\b/i);
        if (!m) return null;

        const tier = m[1].toLowerCase();
        const code = m[2].toLowerCase();

        // Avoid accidental "Axi Relic" where code would be "Relic"
        if (code === "relic") return null;

        return `${tier} ${code}`;
    }
}

function buildIndexByRelicKey(): Map<string, RelicIndexRow[]> {
    const rows = relicMissionRewardsIndex as unknown as RelicIndexRow[];
    const map = new Map<string, RelicIndexRow[]>();

    for (const r of rows) {
        if (!r) continue;
        const key = normalizeSpaces(String(r.relicKey ?? "")).toLowerCase();
        if (!key) continue;

        const arr = map.get(key) ?? [];
        arr.push(r);
        map.set(key, arr);
    }

    return map;
}

export function deriveRelicMissionRewardsAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const byRelicKey = buildIndexByRelicKey();
    const out: Record<string, AcquisitionDef> = {};

    for (const id of FULL_CATALOG.displayableItemIds as CatalogId[]) {
        const rec: any = FULL_CATALOG.recordsById[id];
        const name = typeof rec?.displayName === "string" ? rec.displayName : "";
        if (!name) continue;

        // Only attempt this mapping for actual projection relic items.
        if (!isProjectionRelic(id, rec)) continue;

        const relicKey = relicKeyFromDisplayName(name);
        if (!relicKey) continue;

        const rows = byRelicKey.get(relicKey);
        if (!rows || rows.length === 0) continue;

        const sources = new Set<string>();

        for (const row of rows) {
            const sid = missionNodeSourceIdFromPathLabel(String(row.pathLabel ?? ""));
            if (!sid) continue;
            sources.add(sid);
        }

        if (sources.size === 0) continue;

        out[String(id)] = {
            sources: Array.from(sources.values()).sort((a, b) => a.localeCompare(b))
        };
    }

    return out;
}

/**
 * HOW TO GENERATE `relic-missionRewards-index.auto.json`
 *
 * From repo root:
 *
 * 1) Ensure you already generated:
 *      relic-sources.missionRewards.tsv
 *
 * 2) Convert TSV -> JSON:
 *
 *      awk -F'\t' 'NR==1{next} {printf("{\"relicKey\":\"%s\",\"relicDisplay\":\"%s\",\"pathLabel\":\"%s\",\"rotation\":\"%s\",\"chance\":%s}\n",$1,$2,$3,$4,($5==""?"null":$5))}' relic-sources.missionRewards.tsv \
 *      | jq -s '.' > src/data/_generated/relic-missionRewards-index.auto.json
 *
 * Notes:
 * - We keep rotation/chance for future use, but the current acquisition mapping only needs pathLabel → node source id.
 * - This is intentionally fail-closed: if parsing fails, we do not invent sources.
 */

