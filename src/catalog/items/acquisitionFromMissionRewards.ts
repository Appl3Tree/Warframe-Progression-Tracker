// ===== FILE: src/catalog/items/acquisitionFromMissionRewards.ts =====
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { SourceId } from "../../domain/ids/sourceIds";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

// IMPORTANT:
// This import path assumes missionRewards.json is available to the bundler.
// If Vite blocks importing from outside /src, move the file to:
//   src/data/warframe-drop-data/raw/missionRewards.json
// and update the import accordingly.
import missionRewardsJson from "../../../external/warframe-drop-data/raw/missionRewards.json";

type MissionRewardEntry = {
    _id?: string;
    itemName?: string;
    chance?: number;
    rarity?: string;
};

type MissionNode = {
    gameMode?: string;
    isEvent?: boolean;
    rewards?: Record<string, MissionRewardEntry[]>;
};

type MissionRewardsRoot = {
    missionRewards?: Record<string, Record<string, MissionNode>>;
};

function normalizeName(s: string): string {
    return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function slugifyToken(s: string): string {
    return s
        .trim()
        .toLowerCase()
        .replace(/['"]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80);
}

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function parseMissionRewards(raw: unknown): MissionRewardsRoot {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return raw as MissionRewardsRoot;
}

function buildCatalogNameToIds(): Record<string, CatalogId[]> {
    // Use FULL_CATALOG records and map displayName -> ids
    const out: Record<string, CatalogId[]> = {};
    for (const rec of Object.values(FULL_CATALOG.recordsById)) {
        const key = normalizeName(rec.displayName);
        if (!key) continue;
        if (!out[key]) out[key] = [];
        out[key].push(rec.id);
    }
    return out;
}

const NAME_TO_IDS = buildCatalogNameToIds();

/**
 * Creates SourceIds for mission nodes, and a best-effort acquisition map:
 * item displayName -> sources[] where the item appears in mission reward rotations.
 *
 * This intentionally does NOT encode rotations/chances yet; the goal is eliminating "unknown-acquisition".
 */
export function deriveMissionRewardAcquisitionByCatalogId(): Record<string, { sources: SourceId[] }> {
    const parsed = parseMissionRewards(missionRewardsJson);
    const mr = parsed.missionRewards;

    if (!mr || typeof mr !== "object") return {};

    // Collect itemName -> set(sourceId)
    const itemToSources = new Map<string, Set<string>>();

    for (const [planetNameRaw, planetObj] of Object.entries(mr)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        const planetToken = slugifyToken(String(planetNameRaw ?? ""));
        if (!planetToken) continue;

        for (const [nodeNameRaw, node] of Object.entries(planetObj as Record<string, any>)) {
            const nodeName = String(nodeNameRaw ?? "").trim();
            if (!nodeName) continue;

            const nodeToken = slugifyToken(nodeName);
            if (!nodeToken) continue;

            const gameMode = safeString((node as MissionNode)?.gameMode);
            const sourceId = `node:${planetToken}:${nodeToken}`; // curated-like namespace

            // Determine rewards
            const rewards = (node as MissionNode)?.rewards;
            if (!rewards || typeof rewards !== "object") continue;

            for (const entries of Object.values(rewards)) {
                if (!Array.isArray(entries)) continue;

                for (const e of entries) {
                    const itemName = safeString((e as MissionRewardEntry)?.itemName);
                    if (!itemName) continue;

                    const key = normalizeName(itemName);
                    if (!key) continue;

                    if (!itemToSources.has(key)) itemToSources.set(key, new Set<string>());
                    itemToSources.get(key)!.add(sourceId);

                    // Also add a slightly normalized variant for common mismatches (e.g., extra punctuation)
                    const relaxed = normalizeName(itemName.replace(/[^\w\s]/g, " "));
                    if (relaxed && relaxed !== key) {
                        if (!itemToSources.has(relaxed)) itemToSources.set(relaxed, new Set<string>());
                        itemToSources.get(relaxed)!.add(sourceId);
                    }

                    // gameMode is not used for ID stability, but could be used for labels in sourceCatalog
                    void gameMode;
                }
            }
        }
    }

    // Convert itemName matches into catalogId -> sources
    const out: Record<string, { sources: SourceId[] }> = {};

    for (const [itemKey, sourcesSet] of itemToSources.entries()) {
        const ids = NAME_TO_IDS[itemKey];
        if (!ids || ids.length === 0) continue;

        const sources = Array.from(sourcesSet.values()).sort() as SourceId[];

        for (const cid of ids) {
            out[String(cid)] = { sources };
        }
    }

    return out;
}

/**
 * Expose mission node sources for sourceCatalog.ts (labels and presence).
 * This is used to populate SOURCE_INDEX with node:* sources referenced by acquisitions.
 */
export function deriveMissionNodeSources(): Array<{ id: SourceId; label: string; kind: string }> {
    const parsed = parseMissionRewards(missionRewardsJson);
    const mr = parsed.missionRewards;

    if (!mr || typeof mr !== "object") return [];

    const seen = new Set<string>();
    const out: Array<{ id: SourceId; label: string; kind: string }> = [];

    for (const [planetNameRaw, planetObj] of Object.entries(mr)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        const planetName = String(planetNameRaw ?? "").trim();
        const planetToken = slugifyToken(planetName);
        if (!planetToken) continue;

        for (const [nodeNameRaw, node] of Object.entries(planetObj as Record<string, any>)) {
            const nodeName = String(nodeNameRaw ?? "").trim();
            if (!nodeName) continue;

            const nodeToken = slugifyToken(nodeName);
            if (!nodeToken) continue;

            const id = `node:${planetToken}:${nodeToken}`;
            if (seen.has(id)) continue;
            seen.add(id);

            const gameMode = safeString((node as MissionNode)?.gameMode);
            const label = gameMode
                ? `Mission: ${planetName} - ${nodeName} (${gameMode})`
                : `Mission: ${planetName} - ${nodeName}`;

            out.push({
                id: id as SourceId,
                label,
                kind: "mission"
            });
        }
    }

    // Stable ordering
    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

