/**
 * Builds a per-source drop metadata index from missionRewards.json.
 *
 * Shape: sourceId → normalizedItemName → DropMeta
 *
 * Source IDs follow the same tokenization as sourceCatalog.ts:
 *   data:missionreward/<planet>/<baseNode>/rotationa|rotationb|rotationc
 *
 * The lookup is used at render time to annotate items with rotation letter,
 * drop chance (%), and rarity without changing the ItemRow data model.
 */

import missionRewardsJson from "../../../external/warframe-drop-data/raw/missionRewards.json";

export type DropMeta = {
    chance: number;              // percentage, e.g. 10.79
    rarity: string;              // "Common" | "Uncommon" | "Rare" | "Legendary"
    rotation: "A" | "B" | "C";
    displayName: string;         // original item name from missionRewards.json, e.g. "400 Endo"
};

/** sourceId → normalized item name → best DropMeta for that (source, item) pair */
export type DropMetaLookup = Record<string, Record<string, DropMeta>>;

// ── Tokenization (mirrors sourceCatalog.ts / nodeDropSourceMap.ts) ──────────

function foldDiacritics(s: string): string {
    return String(s ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeNameNoPunct(s: string): string {
    return foldDiacritics(s)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[^a-z0-9 ]+/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function toToken(s: string): string {
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

function dataId(parts: string[]): string {
    const cleaned = parts
        .map((p) => toToken(String(p ?? "")))
        .filter((p) => p.length > 0);
    return cleaned.length === 0 ? "data:unknown" : `data:${cleaned.join("/")}`;
}

function normItemName(s: string): string {
    return String(s ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

// ── Builder ──────────────────────────────────────────────────────────────────

export function buildDropMetaLookup(): DropMetaLookup {
    const out: DropMetaLookup = Object.create(null);

    function register(sourceId: string, itemName: string, meta: DropMeta) {
        if (!out[sourceId]) out[sourceId] = Object.create(null);

        const fullKey = normItemName(itemName);
        if (fullKey) {
            // Keep the highest-chance entry for duplicate (source, name) pairs
            const prev = out[sourceId][fullKey];
            if (!prev || meta.chance > prev.chance) {
                out[sourceId][fullKey] = meta;
            }
        }

        // Also index under no-Blueprint version so catalog items named without
        // "Blueprint" (e.g. "Xiphos Fuselage") still match the drop entry
        // "Xiphos Fuselage Blueprint".
        const noBpName = itemName.replace(/\s*Blueprint\s*$/i, "").trim();
        const noBpKey = normItemName(noBpName);
        if (noBpKey && noBpKey !== fullKey) {
            if (!out[sourceId]) out[sourceId] = Object.create(null);
            const prevNoBp = out[sourceId][noBpKey];
            if (!prevNoBp || meta.chance > prevNoBp.chance) {
                out[sourceId][noBpKey] = { ...meta, displayName: meta.displayName };
            }
        }
    }

    const root = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);
    if (!root || typeof root !== "object" || Array.isArray(root)) return out;

    const stripNodeSuffix = (s: string) =>
        String(s ?? "").replace(/\s*\((Caches|Extra)\)\s*$/i, "").trim();

    for (const [planetName, planetObj] of Object.entries(root as Record<string, any>)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        for (const [nodeNameRaw, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
            if (!nodeObj || typeof nodeObj !== "object") continue;

            const rewards = (nodeObj as any)?.rewards;
            if (!rewards || typeof rewards !== "object" || Array.isArray(rewards)) continue;

            const nodeNameBase = stripNodeSuffix(String(nodeNameRaw));

            for (const [rotLetter, entries] of Object.entries(rewards as Record<string, any>)) {
                if (!Array.isArray(entries)) continue;

                const rot = rotLetter.toUpperCase() as "A" | "B" | "C";
                if (rot !== "A" && rot !== "B" && rot !== "C") continue;

                const rotSuffix = `rotation${rotLetter.toLowerCase()}`;
                const sourceId = dataId(["missionreward", planetName, nodeNameBase, rotSuffix]);

                // Sum per-item chances across duplicate entries in the same rotation
                // (the raw data can list the same itemName multiple times with additive chances)
                const itemChanceAccum = new Map<string, { chance: number; rarity: string }>();

                for (const entry of entries) {
                    const itemName =
                        typeof (entry as any).itemName === "string"
                            ? String((entry as any).itemName).trim()
                            : null;
                    if (!itemName) continue;

                    const chance =
                        typeof (entry as any).chance === "number" ? (entry as any).chance : 0;
                    const rarity =
                        typeof (entry as any).rarity === "string"
                            ? String((entry as any).rarity)
                            : "Unknown";

                    const prev = itemChanceAccum.get(itemName);
                    if (!prev) {
                        itemChanceAccum.set(itemName, { chance, rarity });
                    } else {
                        // Accumulate chance; keep the rarity of the first (or most common) entry
                        itemChanceAccum.set(itemName, {
                            chance: prev.chance + chance,
                            rarity: prev.rarity
                        });
                    }
                }

                for (const [itemName, { chance, rarity }] of itemChanceAccum.entries()) {
                    register(sourceId, itemName, { chance, rarity, rotation: rot, displayName: itemName });
                }
            }
        }
    }

    return out;
}
