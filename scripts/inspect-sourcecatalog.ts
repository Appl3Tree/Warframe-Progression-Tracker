// ===== FILE: scripts/inspect-sourcecatalog.ts =====

import * as SourceMod from "../src/catalog/sources/sourceCatalog";

function isArray(v: unknown): v is any[] {
    return Array.isArray(v);
}

function main(): void {
    const keys = Object.keys(SourceMod as any).sort((a, b) => a.localeCompare(b));
    console.log("sourceCatalog exports:");
    for (const k of keys) {
        const v = (SourceMod as any)[k];
        if (isArray(v)) {
            console.log(`- ${k}: array length=${v.length}`);
        } else if (v && typeof v === "object") {
            console.log(`- ${k}: object keys=${Object.keys(v).length}`);
        } else {
            console.log(`- ${k}: ${typeof v}`);
        }
    }

    const sources = (SourceMod as any).SOURCES;
    const sourceCatalog = (SourceMod as any).SOURCE_CATALOG;

    if (isArray(sources)) {
        const first = sources[0];
        console.log("SOURCES[0]:", first ? JSON.stringify(first) : "null");
    }

    if (isArray(sourceCatalog)) {
        const first = sourceCatalog[0];
        console.log("SOURCE_CATALOG[0]:", first ? JSON.stringify(first) : "null");
    }
}

main();

