/**
 * generateWfcdRequirements.ts
 *
 * Source: external/warframe-items/raw/*.json (individual category files)
 * Output: src/data/_generated/wfcd-requirements.byCatalogId.auto.json
 *
 * For every item that has a `components` array, emits a requirements entry
 * keyed by "items:${item.uniqueName}" describing what components are needed
 * to craft it.
 *
 * Output shape per entry:
 *   {
 *     outputCatalogId: "items:/Lotus/...",
 *     components: [{ catalogId: "items:/Lotus/...", count: number }],
 *     note: string   // e.g. "WFCD recipe (Primary.json)"
 *   }
 */

import { readFile, writeFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const RAW_DIR = path.join(ROOT, "external/warframe-items/raw");
const OUTPUT  = path.join(ROOT, "src/data/_generated/wfcd-requirements.byCatalogId.auto.json");

const SKIP_FILES = new Set(["All.json"]);

function safeStr(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function safeCount(v: unknown): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
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

        if (!Array.isArray(items)) continue;

        let count = 0;
        for (const item of items) {
            if (!item || typeof item !== "object" || Array.isArray(item)) continue;
            const rec = item as Record<string, unknown>;

            const uniqueName = safeStr(rec.uniqueName);
            if (!uniqueName) continue;

            const components = rec.components;
            if (!Array.isArray(components) || components.length === 0) continue;

            const mappedComponents: Array<{ catalogId: string; count: number }> = [];

            for (const comp of components) {
                if (!comp || typeof comp !== "object" || Array.isArray(comp)) continue;
                const c = comp as Record<string, unknown>;
                const compPath = safeStr(c.uniqueName);
                if (!compPath) continue;
                mappedComponents.push({
                    catalogId: `items:${compPath}`,
                    count: safeCount(c.itemCount),
                });
            }

            if (mappedComponents.length === 0) continue;

            const catalogId = `items:${uniqueName}`;
            out[catalogId] = {
                outputCatalogId: catalogId,
                components: mappedComponents,
                note: `WFCD recipe (${file})`,
            };
            count++;
        }

        if (count > 0) console.log(`  ${file}: ${count} recipes`);
        total += count;
    }

    const json = JSON.stringify(out, null, 2);
    await writeFile(OUTPUT, json, "utf-8");
    console.log(`\nDone: ${total} total recipes written to ${OUTPUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
