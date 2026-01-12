// scripts/build-wfcd-items-and-requirements.ts
//
// Build canonical item + crafting requirement data from WFCD JSON datasets.
// DATA-ONLY ingestion. Fail-closed, but tolerant of non-item JSON files.
//
// Outputs:
// - src/data/_generated/wfcd-items.byCatalogId.auto.json
// - src/data/_generated/wfcd-requirements.byCatalogId.auto.json

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type WFCDComponent = {
    uniqueName: string;
    name?: string;
    count?: number;
};

type WFCDItem = {
    uniqueName: string;
    name?: string;
    category?: string;
    components?: WFCDComponent[];
    buildPrice?: number;
    blueprintItem?: string;
};

const WFCD_JSON_DIR = path.resolve("external/warframe-items/data/json");
const OUTPUT_DIR = path.resolve("src/data/_generated");

function ensureDir(p: string): void {
    fs.mkdirSync(p, { recursive: true });
}

function readJson(filePath: string): unknown {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toCatalogId(uniqueName: string): string {
    return `items:${uniqueName}`;
}

function loadAllWFCDItems(): { items: WFCDItem[]; skippedFiles: string[] } {
    if (!fs.existsSync(WFCD_JSON_DIR)) {
        throw new Error(`WFCD JSON directory not found: ${WFCD_JSON_DIR}`);
    }

    const files = fs
        .readdirSync(WFCD_JSON_DIR)
        .filter((f) => f.endsWith(".json"));

    const items: WFCDItem[] = [];
    const skippedFiles: string[] = [];

    for (const file of files) {
        const full = path.join(WFCD_JSON_DIR, file);
        const parsed = readJson(full);

        if (!Array.isArray(parsed)) {
            skippedFiles.push(file);
            continue;
        }

        for (const rec of parsed) {
            if (rec && typeof rec === "object" && typeof rec.uniqueName === "string") {
                items.push(rec as WFCDItem);
            }
        }
    }

    return { items, skippedFiles };
}

function main(): void {
    ensureDir(OUTPUT_DIR);

    const { items: allItems, skippedFiles } = loadAllWFCDItems();

    const itemsOut: Record<string, unknown> = {};
    const requirementsOut: Record<string, unknown> = {};

    for (const it of allItems) {
        const catalogId = toCatalogId(it.uniqueName);

        // -----------------------------
        // Item catalog entry
        // -----------------------------
        if (!itemsOut[catalogId]) {
            itemsOut[catalogId] = {
                name: it.name ?? null,
                category: it.category ?? null,
                source: "wfcd"
            };
        }

        // -----------------------------
        // Crafting requirements
        // -----------------------------
        if (Array.isArray(it.components) && it.components.length > 0) {
            const components = it.components
    .filter(
        (c) =>
            typeof c?.uniqueName === "string" &&
            typeof c?.itemCount === "number" &&
            c.itemCount > 0
    )
    .map((c) => ({
        catalogId: toCatalogId(c.uniqueName),
        count: Math.floor(c.itemCount)
    }));


            if (components.length > 0) {
                requirementsOut[catalogId] = {
                    outputCatalogId: catalogId,
                    components,
                    credits:
                        typeof it.buildPrice === "number" && it.buildPrice > 0
                            ? Math.floor(it.buildPrice)
                            : 0,
                    source: "wfcd"
                };
            }
        }
    }

    const itemsOutPath = path.join(
        OUTPUT_DIR,
        "wfcd-items.byCatalogId.auto.json"
    );
    const reqOutPath = path.join(
        OUTPUT_DIR,
        "wfcd-requirements.byCatalogId.auto.json"
    );

    fs.writeFileSync(itemsOutPath, JSON.stringify(itemsOut, null, 2), "utf8");
    fs.writeFileSync(reqOutPath, JSON.stringify(requirementsOut, null, 2), "utf8");

    console.log(
        JSON.stringify(
            {
                ok: true,
                stats: {
                    totalWFCDItemRecords: allItems.length,
                    itemsWritten: Object.keys(itemsOut).length,
                    requirementsWritten: Object.keys(requirementsOut).length,
                    skippedNonItemFiles: skippedFiles
                }
            },
            null,
            2
        )
    );
}

try {
    main();
} catch (err) {
    console.error(err);
    process.exit(1);
}

