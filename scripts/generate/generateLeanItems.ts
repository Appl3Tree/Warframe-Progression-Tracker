/**
 * generateLeanItems.ts
 *
 * Source: external/overframe-gg/items.json (manually exported from overframe.gg)
 * Output: src/data/_generated/items-lean.auto.json
 *
 * Strips each entry's `data` object down to only the fields actually consumed
 * by the app, reducing the file from ~8 MB to ~1 MB.
 *
 * Fields kept from `data.*`:
 *   Icon, MarketMode, RegularPrice, PremiumPrice, ShowInMarket,
 *   ProductCategory, resultItemType, ResultItem, type
 *
 * All top-level fields (categories, name, parent, parents, path, storeData,
 * storeItemType, tag, texture, texture_new, ProductCategory, id) are kept as-is.
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const INPUT  = path.join(ROOT, "external/overframe-gg/items.json");
const OUTPUT = path.join(ROOT, "src/data/_generated/items-lean.auto.json");

const DATA_FIELDS: ReadonlySet<string> = new Set([
    "Icon",
    "MarketMode",
    "RegularPrice",
    "PremiumPrice",
    "ShowInMarket",
    "ProductCategory",
    "resultItemType",
    "ResultItem",
    "type",
]);

async function main(): Promise<void> {
    console.log("Reading", INPUT);
    const raw: Record<string, unknown> = JSON.parse(await readFile(INPUT, "utf-8"));

    const out: Record<string, unknown> = {};

    for (const [lotusPath, entry] of Object.entries(raw)) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
        const rec = entry as Record<string, unknown>;

        const lean: Record<string, unknown> = {};

        for (const [k, v] of Object.entries(rec)) {
            if (k !== "data") lean[k] = v;
        }

        const data = rec.data;
        if (data && typeof data === "object" && !Array.isArray(data)) {
            const d = data as Record<string, unknown>;
            const leanData: Record<string, unknown> = {};
            for (const field of DATA_FIELDS) {
                if (field in d) leanData[field] = d[field];
            }
            if (Object.keys(leanData).length > 0) lean.data = leanData;
        }

        out[lotusPath] = lean;
    }

    const json = JSON.stringify(out, null, 2);
    await writeFile(OUTPUT, json, "utf-8");

    const inKB  = Math.round((await readFile(INPUT)).length / 1024);
    const outKB = Math.round(Buffer.byteLength(json) / 1024);
    console.log(`Done: ${Object.keys(out).length} entries, ${inKB} KB → ${outKB} KB`);
    console.log("Written to", OUTPUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
