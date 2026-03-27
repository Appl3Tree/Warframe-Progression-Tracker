/**
 * generateWfcdItems.ts
 *
 * Source: external/warframe-items/raw/*.json (individual category files)
 * Output: src/data/_generated/wfcd-items.byCatalogId.auto.json
 *
 * Indexes every item from the warframe-items npm package by CatalogId
 * ("items:${uniqueName}"), keeping only the metadata fields the app uses.
 *
 * Fields kept per entry:
 *   name, category, productCategory, type, tags, masteryReq,
 *   masterable, tradable, wfcdFile, source
 */

import { readFile, writeFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const RAW_DIR = path.join(ROOT, "external/warframe-items/raw");
const OUTPUT  = path.join(ROOT, "src/data/_generated/wfcd-items.byCatalogId.auto.json");

// All.json is a union of the individual files — skip it to avoid duplicates.
const SKIP_FILES = new Set(["All.json"]);

function safeStr(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function safeNum(v: unknown): number | null {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    return null;
}

function safeBool(v: unknown): boolean {
    return v === true;
}

function safeTags(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
}

async function main(): Promise<void> {
    const files = (await readdir(RAW_DIR))
        .filter((f) => f.endsWith(".json") && !SKIP_FILES.has(f))
        .sort();

    console.log(`Processing ${files.length} category files from ${RAW_DIR}`);

    const out: Record<string, unknown> = {};
    let total = 0;

    for (const file of files) {
        const filePath = path.join(RAW_DIR, file);
        const items: unknown[] = JSON.parse(await readFile(filePath, "utf-8"));

        if (!Array.isArray(items)) {
            console.warn(`  Skipping ${file} — not an array`);
            continue;
        }

        let count = 0;
        for (const item of items) {
            if (!item || typeof item !== "object" || Array.isArray(item)) continue;
            const rec = item as Record<string, unknown>;

            const uniqueName = safeStr(rec.uniqueName);
            if (!uniqueName) continue;

            const catalogId = `items:${uniqueName}`;

            out[catalogId] = {
                name:            safeStr(rec.name),
                category:        safeStr(rec.category),
                productCategory: safeStr(rec.productCategory) ?? null,
                type:            safeStr(rec.type),
                tags:            safeTags(rec.tags),
                masteryReq:      safeNum(rec.masteryReq),
                masterable:      safeBool(rec.masterable),
                tradable:        safeBool(rec.tradable),
                wfcdFile:        file,
                source:          "wfcd",
            };
            count++;
        }

        console.log(`  ${file}: ${count} items`);
        total += count;
    }

    const json = JSON.stringify(out, null, 2);
    await writeFile(OUTPUT, json, "utf-8");
    console.log(`\nDone: ${total} total entries written to ${OUTPUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
