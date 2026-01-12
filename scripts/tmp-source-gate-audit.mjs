// scripts/tmp-source-gate-audit.mjs
//
// Audits source gating coverage.
// Outputs totals, gating stats, and top ungated data-derived sources.

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

const sourceCatalogPath = path.join(
    projectRoot,
    "src/catalog/sources/sourceCatalog.ts"
);

// Import TS module via file URL
const mod = await import(pathToFileURL(sourceCatalogPath).href);

const { SOURCE_CATALOG } = mod;

function isGated(src) {
    return Array.isArray(src.prereqIds) && src.prereqIds.length > 0;
}

const totals = {
    sources: SOURCE_CATALOG.length,
    dataDerived: SOURCE_CATALOG.filter((s) => s.id.startsWith("data:")).length,
    curated: SOURCE_CATALOG.filter((s) => !s.id.startsWith("data:")).length
};

const gated = SOURCE_CATALOG.filter(isGated);
const ungated = SOURCE_CATALOG.filter((s) => !isGated(s));

const byType = {};
for (const s of SOURCE_CATALOG) {
    if (!byType[s.type]) {
        byType[s.type] = { total: 0, gated: 0, ungated: 0 };
    }
    byType[s.type].total++;
    if (isGated(s)) byType[s.type].gated++;
    else byType[s.type].ungated++;
}

const topUngatedDataSources = ungated
    .filter((s) => s.id.startsWith("data:"))
    .slice(0, 50)
    .map((s) => ({
        id: s.id,
        label: s.label,
        type: s.type
    }));

const report = {
    totals,
    gating: {
        gated: gated.length,
        ungated: ungated.length
    },
    byType,
    topUngatedDataSources
};

const outPath = "/tmp/source-gate-audit.json";
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

console.log(JSON.stringify(report, null, 2));
console.log(`\nWrote ${outPath}`);

