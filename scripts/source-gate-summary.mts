import { SOURCE_CATALOG } from "../src/catalog/sources/sourceCatalog";

type SourceRow = {
    id: string;
    label: string;
    type: string;
    prereqIds: unknown[];
};

const rows = SOURCE_CATALOG as unknown as SourceRow[];

const byType: Record<string, { total: number; gated: number; ungated: number }> = {};

for (const s of rows) {
    const t = String(s.type);
    if (!byType[t]) byType[t] = { total: 0, gated: 0, ungated: 0 };
    byType[t].total += 1;
    if ((s.prereqIds ?? []).length > 0) byType[t].gated += 1;
    else byType[t].ungated += 1;
}

const out = {
    totals: {
        sources: rows.length,
        dataDerived: rows.filter((s) => String(s.id).startsWith("data:")).length,
        curated: rows.filter((s) => !String(s.id).startsWith("data:")).length
    },
    gating: {
        gated: rows.filter((s) => (s.prereqIds ?? []).length > 0).length,
        ungated: rows.filter((s) => (s.prereqIds ?? []).length === 0).length
    },
    byType: Object.fromEntries(Object.entries(byType).sort((a, b) => a[0].localeCompare(b[0]))),
    topUngatedDataSources: rows
        .filter((s) => (s.prereqIds ?? []).length === 0 && String(s.id).startsWith("data:"))
        .slice(0, 50)
        .map((s) => ({ id: String(s.id), label: String(s.label), type: String(s.type) }))
};

process.stdout.write(JSON.stringify(out, null, 2) + "\n");
