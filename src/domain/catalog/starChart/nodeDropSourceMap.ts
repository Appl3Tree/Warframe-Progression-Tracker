// ===== FILE: src/domain/catalog/starChart/nodeDropSourceMap.ts =====

/**
 * Maps Star Chart nodes (node:...) to drop-table SourceIds (data:...).
 *
 * Canonical SourceId formats in this project (matches src/catalog/sources/sourceCatalog.ts):
 * - Node drops:        data:node/<planetToken>/<nodeToken>
 * - Mission rewards:   data:missionreward/<planetToken>/<nodeToken>
 * - Rotations:         data:missionreward/<planetToken>/<nodeToken>/rotationa|rotationb|rotationc
 *
 * IMPORTANT:
 * - Star chart node ids in nodes.ts are already tokenized (e.g. "vesper-strait-(caches)").
 * - We must NOT re-tokenize those strings, or punctuation stripping will collapse segments.
 * - For missionRewards-derived tokens, "(Caches)/(Extra)" suffixes are represented as "-caches"/"-extra"
 *   (because missionRewards keys look like "Vesper Strait (Caches)").
 */

import missionRewardsJson from "../../../../external/warframe-drop-data/raw/missionRewards.json";

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function normalizeName(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function foldDiacritics(s: string): string {
    return (s ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeNameNoPunct(s: string): string {
    const folded = foldDiacritics(s);
    return normalizeName(folded).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function toTokenFromDisplay(s: string): string {
    // Only for display-ish strings coming from missionRewards.json keys.
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

function canonicalizeMrVariantSuffix(nodeToken: string): string {
    // node ids use "-(caches)" / "-(extra)" but drop-data tokenization produces "-caches" / "-extra"
    return String(nodeToken ?? "")
        .trim()
        .toLowerCase()
        .replace(/-\(caches\)$/i, "-caches")
        .replace(/-\(extra\)$/i, "-extra");
}

function baseNodeTokenFromVariant(nodeTokenCanonical: string): string {
    return String(nodeTokenCanonical ?? "")
        .trim()
        .toLowerCase()
        .replace(/-caches$/i, "")
        .replace(/-extra$/i, "");
}

type RotInfo = { hasA: boolean; hasB: boolean; hasC: boolean };
type MissionRewardsIndex = Record<string, Record<string, RotInfo>>;

/**
 * Tokenized lookup built from missionRewards.json keys (display-ish).
 *
 * index[planetToken][nodeToken] = {hasA,hasB,hasC} for exact node key (tokenized)
 * index[planetToken][baseNodeToken] = {hasA,hasB,hasC} for suffix-stripped base node (tokenized)
 */
const MR_INDEX: MissionRewardsIndex = (() => {
    const out: MissionRewardsIndex = Object.create(null);

    const root: any = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);
    if (!root || typeof root !== "object" || Array.isArray(root)) return out;

    const stripNodeSuffix = (s: string): string => String(s ?? "").replace(/\s*\((Caches|Extra)\)\s*$/i, "");

    for (const [planetName, planetObj] of Object.entries(root as Record<string, any>)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        const pTok = toTokenFromDisplay(String(planetName));
        if (!out[pTok]) out[pTok] = Object.create(null);

        for (const [nodeNameRaw, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
            if (!nodeObj || typeof nodeObj !== "object") continue;

            const rewards = (nodeObj as any)?.rewards;
            const hasA = Boolean(rewards && typeof rewards === "object" && Object.prototype.hasOwnProperty.call(rewards, "A"));
            const hasB = Boolean(rewards && typeof rewards === "object" && Object.prototype.hasOwnProperty.call(rewards, "B"));
            const hasC = Boolean(rewards && typeof rewards === "object" && Object.prototype.hasOwnProperty.call(rewards, "C"));

            const nodeTok = toTokenFromDisplay(String(nodeNameRaw));
            const baseTok = toTokenFromDisplay(stripNodeSuffix(String(nodeNameRaw)));

            const info: RotInfo = { hasA, hasB, hasC };

            out[pTok][nodeTok] = info;
            out[pTok][baseTok] = out[pTok][baseTok] ?? info;
        }
    }

    return out;
})();

/**
 * Optional explicit overrides/patches.
 * These are merged in (appended).
 */
export const STAR_CHART_NODE_TO_DROP_SOURCES: Record<string, string[]> = {
    "node:junction_earth_mars": [],
    "node:junction_saturn_uranus": []
};

function uniqStrings(xs: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const x of xs) {
        const s = String(x ?? "").trim();
        if (!s) continue;
        if (seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

function dataNodeId(planetToken: string, nodeToken: string): string {
    const p = safeString(planetToken)?.toLowerCase() ?? "";
    const n = safeString(nodeToken)?.toLowerCase() ?? "";
    if (!p || !n) return "data:unknown";
    return `data:node/${p}/${n}`;
}

function dataMissionRewardId(
    planetToken: string,
    nodeToken: string,
    rotation?: "rotationa" | "rotationb" | "rotationc"
): string {
    const p = safeString(planetToken)?.toLowerCase() ?? "";
    const n = safeString(nodeToken)?.toLowerCase() ?? "";
    if (!p || !n) return "data:unknown";
    const base = `data:missionreward/${p}/${n}`;
    return rotation ? `${base}/${rotation}` : base;
}

function parseMrNodeId(nodeId: string): { planetToken: string; nodeTokenCanonical: string } | null {
    // Expected: node:mr/<planetToken>/<nodeToken...>
    // NOTE: nodes.ts uses tokenized ids already; treat them as tokens, not display strings.
    const s = String(nodeId ?? "").trim();
    if (!s.startsWith("node:mr/")) return null;

    const rest = s.slice("node:mr/".length);
    const parts = rest.split("/").filter((x) => x.length > 0);
    if (parts.length < 2) return null;

    const planetToken = String(parts[0]).trim().toLowerCase();
    const nodeTokenRaw = String(parts.slice(1).join("/")).trim().toLowerCase();

    if (!planetToken || !nodeTokenRaw) return null;

    // Convert "-(caches)" / "-(extra)" variants to drop-data token form.
    const nodeTokenCanonical = canonicalizeMrVariantSuffix(nodeTokenRaw);

    return { planetToken, nodeTokenCanonical };
}

export function getDropSourcesForStarChartNode(nodeId: string): string[] {
    const explicit = STAR_CHART_NODE_TO_DROP_SOURCES[String(nodeId)] ?? [];
    const mr = parseMrNodeId(nodeId);

    if (!mr) {
        return uniqStrings(explicit);
    }

    const { planetToken, nodeTokenCanonical } = mr;

    const out: string[] = [];

    // 1) Node source is the exact node token (including -caches/-extra)
    out.push(dataNodeId(planetToken, nodeTokenCanonical));

    // 2) Missionreward sources are canonicalized to BASE node (strip -caches/-extra)
    const baseNodeToken = baseNodeTokenFromVariant(nodeTokenCanonical);
    out.push(dataMissionRewardId(planetToken, baseNodeToken));

    // 3) Rotations depend on missionRewards reward structure for the exact node key if present,
    //    else fall back to base node key.
    const info =
        MR_INDEX?.[toTokenFromDisplay(planetToken)]?.[nodeTokenCanonical] ??
        MR_INDEX?.[toTokenFromDisplay(planetToken)]?.[baseNodeToken] ??
        null;

    if (info?.hasA) out.push(dataMissionRewardId(planetToken, baseNodeToken, "rotationa"));
    if (info?.hasB) out.push(dataMissionRewardId(planetToken, baseNodeToken, "rotationb"));
    if (info?.hasC) out.push(dataMissionRewardId(planetToken, baseNodeToken, "rotationc"));

    out.push(...explicit);

    return uniqStrings(out);
}

