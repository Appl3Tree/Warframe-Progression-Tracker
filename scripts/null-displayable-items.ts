import { FULL_CATALOG } from "../src/domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../src/catalog/items/itemAcquisition";

/**
 * Reports DISPLAYABLE items that:
 * - are items:
 * - are not excluded by prefix
 * - do NOT resolve an acquisition
 * - do NOT look internal (name-based heuristic; skipped if no name found)
 *
 * Output is bucketed by path prefix for triage.
 */

/* ---------- CONFIG ---------- */

const BUCKET_DEPTH = 4;
const SAMPLE_LIMIT = 12;

const EXCLUDE_PREFIXES = [
    "/Lotus/Types/Enemies",
    "/Lotus/Types/Challenges",
    "/Lotus/Types/Game",
    "/Lotus/Types/Friendly/Agents",
];

/* ---------- HELPERS ---------- */

function bucket(path: string, depth: number): string {
    const parts = path.split("/").filter(Boolean);
    return "/" + parts.slice(0, depth).join("/");
}

function looksInternal(name: string | null | undefined): boolean {
    if (!name) return true;
    return (
        name.startsWith("/") ||
        name === name.toUpperCase() ||
        name.includes("DEBUG") ||
        name.includes("TEST")
    );
}

/**
 * Try to pull a display name for a CatalogId from FULL_CATALOG without assuming structure.
 * If no name can be resolved, return null.
 */
function nameFromCatalog(catalogId: string): string | null {
    const rec: any = (FULL_CATALOG as any).recordsById?.[catalogId];
    const n = rec?.displayName;
    return typeof n === "string" && n.trim() ? n.trim() : null;
}


/* ---------- ANALYSIS ---------- */

const total = new Map<string, number>();
const nulls = new Map<string, number>();
const samples = new Map<string, Array<{ cid: string; name: string }>>();

for (const cid of FULL_CATALOG.displayableInventoryItemIds as unknown as string[]) {
    if (!cid.startsWith("items:")) continue;

    const path = cid.slice("items:".length);
    if (EXCLUDE_PREFIXES.some(p => path.startsWith(p))) continue;

    const acq = getAcquisitionByCatalogId(cid as any);
    if (acq) continue;

    const name = nameFromCatalog(cid);
    // If we can't resolve a name, we keep it, but don't apply the internal-name filter.
    if (name && looksInternal(name)) continue;

    const b = bucket(path, BUCKET_DEPTH);

    total.set(b, (total.get(b) ?? 0) + 1);
    nulls.set(b, (nulls.get(b) ?? 0) + 1);

    const arr = samples.get(b) ?? [];
    if (arr.length < SAMPLE_LIMIT) {
        arr.push({ cid, name: name ?? "(no name resolved)" });
    }
    samples.set(b, arr);
}

/* ---------- OUTPUT ---------- */

const rows = Array.from(nulls.keys())
    .map(k => ({
        bucket: k,
        nulls: nulls.get(k) ?? 0,
        total: total.get(k) ?? 0,
    }))
    .sort((a, b) => b.nulls - a.nulls);

console.log("== NULL DISPLAYABLE ITEMS (POST-EXCLUSIONS) ==");
console.log(`buckets=${rows.length}`);
console.log("bucket".padEnd(72), "null".padStart(7));
console.log("-".repeat(82));

for (const r of rows.slice(0, 20)) {
    console.log(r.bucket.padEnd(72), String(r.nulls).padStart(7));
    const s = samples.get(r.bucket) ?? [];
    for (const x of s) {
        console.log("  -", x.cid, "|", x.name);
    }
    console.log("----");
}

