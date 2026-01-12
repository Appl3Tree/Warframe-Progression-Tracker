import { SOURCE_CATALOG } from "../src/catalog/sources/sourceCatalog";

const rows = SOURCE_CATALOG.map(s => ({
    id: s.id,
    label: s.label,
    type: s.type,
    prereqCount: s.prereqIds.length,
    prereqs: s.prereqIds,
    isDataDerived: String(s.id).startsWith("data:")
}));

const summary = {
    totalSources: rows.length,
    gatedSources: rows.filter(r => r.prereqCount > 0).length,
    ungatedSources: rows.filter(r => r.prereqCount === 0).length,
    dataDerived: rows.filter(r => r.isDataDerived).length,
    curated: rows.filter(r => !r.isDataDerived).length
};

console.log(JSON.stringify({ summary, rows }, null, 2));
