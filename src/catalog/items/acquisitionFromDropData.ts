// ===== FILE: src/catalog/items/acquisitionFromDropData.ts =====
import type { CatalogId } from "../../domain/catalog/loadFullCatalog";
import type { SourceId } from "../../domain/ids/sourceIds";
import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

/**
 * IMPORTANT:
 * These imports assume the files exist under src/data/warframe-drop-data/raw/.
 * If your repo currently has them outside src/, move/copy them there (recommended),
 * or adjust the import paths accordingly.
 */
import missionRewardsJson from "../../../external/warframe-drop-data/raw/missionRewards.json";
import relicsJson from "../../../external/warframe-drop-data/raw/relics.json";
import transientRewardsJson from "../../../external/warframe-drop-data/raw/transientRewards.json";
import sortieRewardsJson from "../../../external/warframe-drop-data/raw/sortieRewards.json";
import modLocationsJson from "../../../external/warframe-drop-data/raw/modLocations.json";
import enemyModTablesJson from "../../../external/warframe-drop-data/raw/enemyModTables.json";
import enemyBlueprintTablesJson from "../../../external/warframe-drop-data/raw/enemyBlueprintTables.json";
import blueprintLocationsJson from "../../../external/warframe-drop-data/raw/blueprintLocations.json";
import cetusBountyRewardsJson from "../../../external/warframe-drop-data/raw/cetusBountyRewards.json";
import zarimanRewardsJson from "../../../external/warframe-drop-data/raw/zarimanRewards.json";
import syndicatesJson from "../../../external/warframe-drop-data/raw/syndicates.json";
import miscItemsJson from "../../../external/warframe-drop-data/raw/miscItems.json";

export type AcquisitionDef = {
    sources: SourceId[];
};

export type DerivedSourceDef = {
    id: SourceId;
    label: string;
    kind: string;
};

function normalizeName(s: string): string {
    return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function toInt(v: unknown): number | null {
    if (typeof v === "number" && Number.isFinite(v)) return Math.floor(v);
    if (typeof v === "string" && v.trim()) {
        const n = Number(v);
        if (Number.isFinite(n)) return Math.floor(n);
    }
    return null;
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

function buildCatalogNameToIds(): Record<string, CatalogId[]> {
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

function addItemSource(
    itemName: string,
    sourceId: string,
    itemToSources: Map<string, Set<string>>
): void {
    const raw = safeString(itemName);
    if (!raw) return;

    const key = normalizeName(raw);
    if (!key) return;

    if (!itemToSources.has(key)) itemToSources.set(key, new Set<string>());
    itemToSources.get(key)!.add(sourceId);

    // relaxed variant: remove punctuation
    const relaxed = normalizeName(raw.replace(/[^\w\s]/g, " "));
    if (relaxed && relaxed !== key) {
        if (!itemToSources.has(relaxed)) itemToSources.set(relaxed, new Set<string>());
        itemToSources.get(relaxed)!.add(sourceId);
    }
}

function sourcesSetToArray(set: Set<string>): SourceId[] {
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b)) as SourceId[];
}

/**
 * Parse + derive a best-effort acquisition layer from warframe-drop-data.
 * Goal: eliminate unknown-acquisition where the dataset provides *any* actionable provenance.
 *
 * The output is intentionally simple (sources only). Chances/rotations can be modeled later.
 */
export function deriveDropDataAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const itemToSources = new Map<string, Set<string>>();

    // ---------------------------
    // missionRewards.json
    // ---------------------------
    // Structure:
    // { "missionRewards": { "Sedna": { "Hydron": { rewards: { A: [ { itemName } ] }}}}}
    try {
        const root: any = missionRewardsJson as any;
        const mr = root?.missionRewards;
        if (mr && typeof mr === "object") {
            for (const [planetRaw, planetObj] of Object.entries(mr)) {
                if (!planetObj || typeof planetObj !== "object") continue;

                const planetName = String(planetRaw ?? "").trim();
                const planetToken = slugifyToken(planetName);
                if (!planetToken) continue;

                for (const [placeRaw, node] of Object.entries(planetObj as Record<string, any>)) {
                    const placeName = String(placeRaw ?? "").trim();
                    if (!placeName) continue;

                    const placeToken = slugifyToken(placeName);
                    if (!placeToken) continue;

                    const gameMode = safeString((node as any)?.gameMode);
                    const sourceId = `node:${planetToken}:${placeToken}`;
                    // Rewards
                    const rewards = (node as any)?.rewards;
                    if (!rewards || typeof rewards !== "object") continue;

                    for (const entries of Object.values(rewards)) {
                        if (!Array.isArray(entries)) continue;
                        for (const e of entries as any[]) {
                            addItemSource(e?.itemName, sourceId, itemToSources);
                        }
                    }

                    void gameMode;
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // relics.json
    // ---------------------------
    // Structure:
    // { "relics": [ { tier, relicName, state, rewards: [ { itemName } ] } ] }
    try {
        const root: any = relicsJson as any;
        const relics = root?.relics;
        if (Array.isArray(relics)) {
            for (const r of relics as any[]) {
                const tier = safeString(r?.tier);
                const relicName = safeString(r?.relicName);
                const state = safeString(r?.state) ?? "Intact";
                if (!tier || !relicName) continue;

                const id = `relic:${slugifyToken(tier)}:${slugifyToken(relicName)}:${slugifyToken(state)}`;
                const rewards = r?.rewards;
                if (!Array.isArray(rewards)) continue;

                for (const e of rewards as any[]) {
                    addItemSource(e?.itemName, id, itemToSources);
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // transientRewards.json
    // ---------------------------
    // { "transientRewards": [ { objectiveName, rewards: [ { itemName } ] } ] }
    try {
        const root: any = transientRewardsJson as any;
        const trs = root?.transientRewards;
        if (Array.isArray(trs)) {
            for (const t of trs as any[]) {
                const obj = safeString(t?.objectiveName);
                if (!obj) continue;

                const id = `transient:${slugifyToken(obj)}`;
                const rewards = t?.rewards;
                if (!Array.isArray(rewards)) continue;

                for (const e of rewards as any[]) {
                    addItemSource(e?.itemName, id, itemToSources);
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // sortieRewards.json
    // ---------------------------
    // { "sortieRewards": [ { itemName } ] }
    try {
        const root: any = sortieRewardsJson as any;
        const sr = root?.sortieRewards;
        if (Array.isArray(sr)) {
            const id = "activity:sortie";
            for (const e of sr as any[]) {
                addItemSource(e?.itemName, id, itemToSources);
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // cetusBountyRewards.json
    // ---------------------------
    // { "cetusBountyRewards": [ { bountyLevel, rewards: { A:[{itemName,stage}], ... } } ] }
    try {
        const root: any = cetusBountyRewardsJson as any;
        const br = root?.cetusBountyRewards;
        if (Array.isArray(br)) {
            for (const b of br as any[]) {
                const level = safeString(b?.bountyLevel);
                if (!level) continue;

                const id = `bounty:cetus:${slugifyToken(level)}`;
                const rewards = b?.rewards;
                if (!rewards || typeof rewards !== "object") continue;

                for (const entries of Object.values(rewards)) {
                    if (!Array.isArray(entries)) continue;
                    for (const e of entries as any[]) {
                        addItemSource(e?.itemName, id, itemToSources);
                    }
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // zarimanRewards.json
    // ---------------------------
    // { "zarimanRewards": [ { bountyLevel, rewards: { C:[{itemName}], ... } } ] }
    try {
        const root: any = zarimanRewardsJson as any;
        const zr = root?.zarimanRewards;
        if (Array.isArray(zr)) {
            for (const b of zr as any[]) {
                const level = safeString(b?.bountyLevel);
                if (!level) continue;

                const id = `bounty:zariman:${slugifyToken(level)}`;
                const rewards = b?.rewards;
                if (!rewards || typeof rewards !== "object") continue;

                for (const entries of Object.values(rewards)) {
                    if (!Array.isArray(entries)) continue;
                    for (const e of entries as any[]) {
                        addItemSource(e?.itemName, id, itemToSources);
                    }
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // blueprintLocations.json
    // ---------------------------
    // { "blueprintLocations": [ { itemName, enemies:[{ enemyName }] } ] }
    try {
        const root: any = blueprintLocationsJson as any;
        const bl = root?.blueprintLocations;
        if (Array.isArray(bl)) {
            for (const rec of bl as any[]) {
                const item = safeString(rec?.itemName);
                if (!item) continue;

                const enemies = rec?.enemies;
                if (!Array.isArray(enemies)) continue;

                for (const e of enemies as any[]) {
                    const enemyName = safeString(e?.enemyName);
                    if (!enemyName) continue;

                    const id = `enemy:${slugifyToken(enemyName)}:blueprint`;
                    addItemSource(item, id, itemToSources);
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // enemyBlueprintTables.json
    // ---------------------------
    // { "enemyBlueprintTables": [ { enemyName, items:[{ itemName }] } ] }
    try {
        const root: any = enemyBlueprintTablesJson as any;
        const eb = root?.enemyBlueprintTables;
        if (Array.isArray(eb)) {
            for (const rec of eb as any[]) {
                const enemyName = safeString(rec?.enemyName);
                if (!enemyName) continue;

                const id = `enemy:${slugifyToken(enemyName)}:blueprint`;
                const items = rec?.items;
                if (!Array.isArray(items)) continue;

                for (const it of items as any[]) {
                    addItemSource(it?.itemName, id, itemToSources);
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // modLocations.json (mods sorted by mod, with enemies list)
    // { "modLocations": [ { modName, enemies:[{ enemyName }] } ] }
    try {
        const root: any = modLocationsJson as any;
        const ml = root?.modLocations;
        if (Array.isArray(ml)) {
            for (const rec of ml as any[]) {
                const modName = safeString(rec?.modName);
                if (!modName) continue;

                const enemies = rec?.enemies;
                if (!Array.isArray(enemies)) continue;

                for (const e of enemies as any[]) {
                    const enemyName = safeString(e?.enemyName);
                    if (!enemyName) continue;

                    const id = `enemy:${slugifyToken(enemyName)}:mod`;
                    addItemSource(modName, id, itemToSources);
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // enemyModTables.json (mods sorted by enemy)
    // { "enemyModTables": [ { enemyName, mods:[{ modName }] } ] }
    try {
        const root: any = enemyModTablesJson as any;
        const em = root?.enemyModTables ?? root?.modLocations; // docs show "modLocations" typo
        if (Array.isArray(em)) {
            for (const rec of em as any[]) {
                const enemyName = safeString(rec?.enemyName);
                if (!enemyName) continue;

                const id = `enemy:${slugifyToken(enemyName)}:mod`;
                const mods = rec?.mods;
                if (!Array.isArray(mods)) continue;

                for (const m of mods as any[]) {
                    addItemSource(m?.modName, id, itemToSources);
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // syndicates.json
    // { "syndicates": { "Steel Meridian":[{ item, place, standing }], ... } }
    try {
        const root: any = syndicatesJson as any;
        const syn = root?.syndicates;
        if (syn && typeof syn === "object") {
            for (const [synNameRaw, entries] of Object.entries(syn)) {
                if (!Array.isArray(entries)) continue;

                const synName = String(synNameRaw ?? "").trim();
                const synToken = slugifyToken(synName);
                if (!synToken) continue;

                for (const e of entries as any[]) {
                    const item = safeString(e?.item);
                    if (!item) continue;

                    const place = safeString(e?.place);
                    const standing = toInt(e?.standing);

                    // Place is important in labels, but keep IDs stable.
                    const placeToken = place ? slugifyToken(place) : "vendor";
                    const standingToken = standing !== null ? `s${standing}` : "s";

                    const id = `vendor:syndicate:${synToken}:${placeToken}:${standingToken}`;
                    addItemSource(item, id, itemToSources);
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // miscItems.json (enemy miscellaneous item drops, includes resources like Circuits)
    // { "miscItems": [ { enemyName, items:[{ itemName }] } ] }
    try {
        const root: any = miscItemsJson as any;
        const mi = root?.miscItems;
        if (Array.isArray(mi)) {
            for (const rec of mi as any[]) {
                const enemyName = safeString(rec?.enemyName);
                if (!enemyName) continue;

                const id = `enemy:${slugifyToken(enemyName)}:misc`;
                const items = rec?.items;
                if (!Array.isArray(items)) continue;

                for (const it of items as any[]) {
                    addItemSource(it?.itemName, id, itemToSources);
                }
            }
        }
    } catch {
        // ignore
    }

    // ---------------------------
    // Convert itemName -> sourceIds into catalogId -> sources
    // ---------------------------
    const out: Record<string, AcquisitionDef> = {};

    for (const [itemKey, sources] of itemToSources.entries()) {
        const ids = NAME_TO_IDS[itemKey];
        if (!ids || ids.length === 0) continue;

        const list = sourcesSetToArray(sources);
        if (list.length === 0) continue;

        for (const cid of ids) {
            // Merge if already present (multiple datasets)
            if (!out[String(cid)]) {
                out[String(cid)] = { sources: list };
            } else {
                const merged = new Set<string>(out[String(cid)].sources as any);
                for (const s of list) merged.add(String(s));
                out[String(cid)].sources = sourcesSetToArray(merged);
            }
        }
    }

    return out;
}

export function deriveDropDataSources(): DerivedSourceDef[] {
    const sources = new Map<string, DerivedSourceDef>();

    function upsert(id: string, label: string, kind: string): void {
        const key = String(id).trim();
        const lab = String(label).trim();
        if (!key || !lab) return;
        if (!sources.has(key)) {
            sources.set(key, { id: key as SourceId, label: lab, kind });
        }
    }

    // Mission sources
    try {
        const root: any = missionRewardsJson as any;
        const mr = root?.missionRewards;
        if (mr && typeof mr === "object") {
            for (const [planetRaw, planetObj] of Object.entries(mr)) {
                if (!planetObj || typeof planetObj !== "object") continue;

                const planetName = String(planetRaw ?? "").trim();
                const planetToken = slugifyToken(planetName);
                if (!planetToken) continue;

                for (const [placeRaw, node] of Object.entries(planetObj as Record<string, any>)) {
                    const placeName = String(placeRaw ?? "").trim();
                    if (!placeName) continue;

                    const placeToken = slugifyToken(placeName);
                    if (!placeToken) continue;

                    const gameMode = safeString((node as any)?.gameMode);
                    const id = `node:${planetToken}:${placeToken}`;
                    const label = gameMode
                        ? `Mission: ${planetName} - ${placeName} (${gameMode})`
                        : `Mission: ${planetName} - ${placeName}`;

                    upsert(id, label, "mission");
                }
            }
        }
    } catch {
        // ignore
    }

    // Relic sources
    try {
        const root: any = relicsJson as any;
        const relics = root?.relics;
        if (Array.isArray(relics)) {
            for (const r of relics as any[]) {
                const tier = safeString(r?.tier);
                const relicName = safeString(r?.relicName);
                const state = safeString(r?.state) ?? "Intact";
                if (!tier || !relicName) continue;

                const id = `relic:${slugifyToken(tier)}:${slugifyToken(relicName)}:${slugifyToken(state)}`;
                upsert(id, `Relic: ${tier} ${relicName} (${state})`, "relic");
            }
        }
    } catch {
        // ignore
    }

    // Transient
    try {
        const root: any = transientRewardsJson as any;
        const trs = root?.transientRewards;
        if (Array.isArray(trs)) {
            for (const t of trs as any[]) {
                const obj = safeString(t?.objectiveName);
                if (!obj) continue;
                const id = `transient:${slugifyToken(obj)}`;
                upsert(id, `Activity: ${obj}`, "transient");
            }
        }
    } catch {
        // ignore
    }

    // Sortie (single)
    upsert("activity:sortie", "Activity: Sortie Rewards", "activity");

    // Bounties (Cetus/Zariman)
    try {
        const root: any = cetusBountyRewardsJson as any;
        const br = root?.cetusBountyRewards;
        if (Array.isArray(br)) {
            for (const b of br as any[]) {
                const level = safeString(b?.bountyLevel);
                if (!level) continue;
                const id = `bounty:cetus:${slugifyToken(level)}`;
                upsert(id, `Bounty: Cetus (${level})`, "bounty");
            }
        }
    } catch {
        // ignore
    }

    try {
        const root: any = zarimanRewardsJson as any;
        const zr = root?.zarimanRewards;
        if (Array.isArray(zr)) {
            for (const b of zr as any[]) {
                const level = safeString(b?.bountyLevel);
                if (!level) continue;
                const id = `bounty:zariman:${slugifyToken(level)}`;
                upsert(id, `Bounty: Zariman (${level})`, "bounty");
            }
        }
    } catch {
        // ignore
    }

    // Enemies: we can’t enumerate all reliably without scanning all datasets again,
    // so we add them opportunistically through syndicates + misc + enemy tables.
    // That is acceptable as long as the sources referenced by acquisitions exist.
    const acq = deriveDropDataAcquisitionByCatalogId();
    for (const rec of Object.values(acq)) {
        for (const sid of rec.sources) {
            const id = String(sid);
            if (sources.has(id)) continue;

            if (id.startsWith("enemy:")) {
                // enemy:<name>:<kind>
                const parts = id.split(":");
                const enemyToken = parts[1] ?? "enemy";
                const kind = parts[2] ?? "drop";
                upsert(id, `Enemy Drop: ${enemyToken} (${kind})`, "enemy");
            } else if (id.startsWith("vendor:syndicate:")) {
                upsert(id, `Syndicate Vendor: ${id.slice("vendor:syndicate:".length)}`, "vendor");
            }
        }
    }

    return Array.from(sources.values()).sort((a, b) => a.label.localeCompare(b.label));
}

