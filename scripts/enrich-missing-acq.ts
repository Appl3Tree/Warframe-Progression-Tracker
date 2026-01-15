// ===== FILE: scripts/enrich-missing-acq.ts =====
import fs from "node:fs";
import path from "node:path";

import { FULL_CATALOG, type CatalogId } from "../src/domain/catalog/loadFullCatalog";

type Completeness = {
    missingAcquisition?: Array<{ catalogId: string; name?: string }>;
};

function normalize(s: string): string {
    return String(s ?? "").trim();
}

function safeArray<T>(v: unknown): T[] {
    return Array.isArray(v) ? (v as T[]) : [];
}

function pickRawStrings(rec: any): {
    wfcdCategory: string | null;
    wfcdProductCategory: string | null;
    wfcdType: string | null;
    lotusUniqueName: string | null;
    wfcdUniqueName: string | null;
} {
    const raw: any = rec?.raw ?? {};
    const wfcd: any = raw?.rawWfcd ?? null;
    const lotus: any = raw?.rawLotus ?? null;

    return {
        wfcdCategory: typeof wfcd?.category === "string" ? wfcd.category : null,
        wfcdProductCategory: typeof wfcd?.productCategory === "string" ? wfcd.productCategory : null,
        wfcdType: typeof wfcd?.type === "string" ? wfcd.type : null,
        wfcdUniqueName: typeof wfcd?.uniqueName === "string" ? wfcd.uniqueName : null,
        lotusUniqueName: typeof lotus?.uniqueName === "string" ? lotus.uniqueName : null
    };
}

function main() {
    const inPath = process.argv[2] ?? "catalog-completeness.json";
    const outPath = process.argv[3] ?? "missing-acq-enriched.tsv";

    const absIn = path.resolve(process.cwd(), inPath);
    const absOut = path.resolve(process.cwd(), outPath);

    const txt = fs.readFileSync(absIn, "utf8");
    const parsed: Completeness = JSON.parse(txt);

    const missing = safeArray<{ catalogId: string; name?: string }>(parsed.missingAcquisition);

    const header = [
        "displayName",
        "catalogId",
        "wfcdCategory",
        "wfcdProductCategory",
        "wfcdType",
        "categories",
        "wfcdUniqueName",
        "lotusUniqueName"
    ].join("\t");

    const lines: string[] = [header];

    for (const m of missing) {
        const cid = normalize(m?.catalogId) as CatalogId;
        const rec: any = (FULL_CATALOG as any)?.recordsById?.[cid];

        const displayName =
            typeof rec?.displayName === "string" ? rec.displayName : normalize(m?.name) || "(no displayName)";

        const categories = safeArray<string>(rec?.categories).join(",");

        const raw = pickRawStrings(rec);

        lines.push(
            [
                displayName,
                cid,
                raw.wfcdCategory ?? "",
                raw.wfcdProductCategory ?? "",
                raw.wfcdType ?? "",
                categories,
                raw.wfcdUniqueName ?? "",
                raw.lotusUniqueName ?? ""
            ].join("\t")
        );
    }

    fs.writeFileSync(absOut, lines.join("\n"), "utf8");
    // eslint-disable-next-line no-console
    console.log(`Wrote ${missing.length} rows -> ${outPath}`);
}

main();

