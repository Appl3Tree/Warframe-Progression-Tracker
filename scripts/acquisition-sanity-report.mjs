import fs from "fs";

function loadJson(p) {
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

const sources = loadJson("src/data/sources.json");
const labelMap = loadJson("src/data/_generated/source-label-map.auto.json");

let totalItems = 0;
let totalEntries = 0;

const labelCounts = new Map();

for (const [itemKey, entries] of Object.entries(sources)) {
    totalItems++;
    if (!Array.isArray(entries)) continue;

    totalEntries += entries.length;

    for (const e of entries) {
        const label = String(e?.source ?? "").trim();
        if (!label) continue;

        labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    }
}

const distinctLabels = labelCounts.size;
const mapped = Object.keys(labelMap.byLabel ?? {}).length;

const top20 = Array.from(labelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

console.log("sources.json item keys:", totalItems);
console.log("sources.json total entries:", totalEntries);
console.log("distinct source labels:", distinctLabels);
console.log("labelMap.byLabel count:", mapped);
console.log("");
console.log("Top 20 most common source labels:");
for (const [label, n] of top20) {
    const id = labelMap.byLabel?.[label] ?? "MISSING";
    console.log(`- ${n.toString().padStart(6, " ")}  ${label}  ->  ${id}`);
}
