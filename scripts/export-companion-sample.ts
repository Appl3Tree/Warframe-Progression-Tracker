import { FULL_CATALOG } from "../src/domain/catalog/loadFullCatalog";

function normalize(s: string): string {
    return String(s ?? "").trim().toLowerCase();
}

function getRawStringsForHeuristics(id: string, rec: any): string {
    const parts: string[] = [];
    parts.push(String(id));

    const raw: any = rec?.raw ?? {};
    const wfcd: any = raw?.rawWfcd ?? null;
    const lotus: any = raw?.rawLotus ?? null;

    const uniq =
        typeof wfcd?.uniqueName === "string"
            ? wfcd.uniqueName
            : typeof lotus?.uniqueName === "string"
                ? lotus.uniqueName
                : typeof raw?.uniqueName === "string"
                    ? raw.uniqueName
                    : "";

    const type =
        typeof wfcd?.type === "string"
            ? wfcd.type
            : typeof lotus?.type === "string"
                ? lotus.type
                : typeof raw?.type === "string"
                    ? raw.type
                    : "";

    const productCategory =
        typeof wfcd?.productCategory === "string"
            ? wfcd.productCategory
            : typeof lotus?.productCategory === "string"
                ? lotus.productCategory
                : "";

    const category =
        typeof wfcd?.category === "string"
            ? wfcd.category
            : typeof lotus?.category === "string"
                ? lotus.category
                : "";

    parts.push(uniq, type, productCategory, category);

    return normalize(parts.filter(Boolean).join(" | "));
}

function main() {
    // Cap results so this can’t balloon and “look hung”.
    const MAX = 200;

    const out: any[] = [];
    const ids = FULL_CATALOG.displayableItemIds as any[];

    for (const id of ids) {
        const rec: any = (FULL_CATALOG as any).recordsById?.[id];
        if (!rec?.displayName) continue;

        const name = String(rec.displayName);
        if (!/vulpaphyla/i.test(name)) continue;

        const raw: any = rec?.raw ?? {};
        const wfcd: any = raw?.rawWfcd ?? null;
        const lotus: any = raw?.rawLotus ?? null;

        out.push({
            id: String(id),
            name,
            categories: Array.isArray(rec.categories) ? rec.categories : [],
            rawType: raw?.type ?? null,
            wfcdUniqueName: wfcd?.uniqueName ?? null,
            lotusUniqueName: lotus?.uniqueName ?? null,
            wfcdType: wfcd?.type ?? null,
            lotusType: lotus?.type ?? null,
            wfcdProductCategory: wfcd?.productCategory ?? null,
            lotusProductCategory: lotus?.productCategory ?? null,
            wfcdCategory: wfcd?.category ?? null,
            lotusCategory: lotus?.category ?? null,
            heuristic: getRawStringsForHeuristics(String(id), rec)
        });

        if (out.length >= MAX) break;
    }

    process.stdout.write(JSON.stringify(out, null, 2));
}

main();
