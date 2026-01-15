// ===== FILE: scripts/debug-one-relic.ts =====

import { FULL_CATALOG, type CatalogId } from "../src/domain/catalog/loadFullCatalog";
import { SOURCE_INDEX } from "../src/catalog/sources/sourceCatalog";

// IMPORTANT: same import as acquisitionFromMissionRewardsRelics.ts
import relicMissionRewardsIndex from "../src/data/_generated/relic-missionRewards-index.auto.json";

type RelicIndexRow = {
    relicKey: string;
    relicDisplay: string;
    pathLabel: string;
    rotation?: string | null;
    chance?: number | null;
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

function missionNodeSourceIdFromPathLabel(pathLabel: string): string | null {
    const parts = normalizeSpaces(pathLabel)
        .split("/")
        .map((p) => normalizeSpaces(p))
        .filter(Boolean);

    if (parts.length < 3) return null;

    const head = parts[0].toLowerCase();
    if (head !== "missionrewards") return null;

    const planet = parts[1];
    const node = parts[2];
    if (!planet || !node) return null;

    return srcId(["node", planet, node]);
}

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

function buildIndexByRelicKey(): Map<string, RelicIndexRow[]> {
    const rows = relicMissionRewardsIndex as unknown as RelicIndexRow[];
    const map = new Map<string, RelicIndexRow[]>();

    for (const r of rows) {
        const key = normalizeSpaces(String(r?.relicKey ?? "")).toLowerCase();
        if (!key) continue;
        const arr = map.get(key) ?? [];
        arr.push(r);
        map.set(key, arr);
    }

    return map;
}

const TARGET = "Axi A1 Exceptional";

let targetId: CatalogId | null = null;
for (const id of FULL_CATALOG.displayableItemIds as CatalogId[]) {
    const rec: any = FULL_CATALOG.recordsById[id];
    if (rec?.displayName === TARGET) {
        targetId = id;
        break;
    }
}

if (!targetId) {
    console.log("Could not find catalog item by displayName:", TARGET);
    process.exit(0);
}

const rec: any = FULL_CATALOG.recordsById[targetId];
const name = String(rec?.displayName ?? "");
const rk = relicKeyFromDisplayName(name);

console.log("Target:", TARGET);
console.log("CatalogId:", String(targetId));
console.log("RelicKey:", rk);

if (!rk) process.exit(0);

const byKey = buildIndexByRelicKey();
const rows = byKey.get(rk) ?? [];

console.log("Index rows:", rows.length);
console.log("");

for (const row of rows.slice(0, 20)) {
    const sid = missionNodeSourceIdFromPathLabel(String(row.pathLabel ?? ""));
    const hasSource = sid ? Boolean((SOURCE_INDEX as any)[sid]) : false;

    console.log("pathLabel:", row.pathLabel);
    console.log(" -> sid:", sid);
    console.log(" -> in SOURCE_INDEX:", hasSource);
    console.log("");
}

