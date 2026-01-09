import fs from "fs";

const labelsPath = "src/data/_generated/all-source-labels.json";
const sourcesPath = "src/data/sources.json";

function normalize(s) {
    return String(s ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[^a-z0-9 ]+/g, "")     // strip punctuation
        .replace(/\s+/g, "");           // remove spaces for fuzzy key
}

function loadJson(p) {
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

const labels = loadJson(labelsPath);
const sourcesRaw = loadJson(sourcesPath);

// Collect all canonical source ids from sources.json (handles your object-of-arrays format).
const ids = new Set();
for (const entries of Object.values(sourcesRaw)) {
    if (!Array.isArray(entries)) continue;
    for (const e of entries) {
        if (typeof e?.id === "string" && e.id.trim()) ids.add(e.id.trim());
    }
}

const idList = Array.from(ids).sort();
const idByNorm = new Map();
for (const id of idList) {
    idByNorm.set(normalize(id), id);
}

// Auto-map
const byLabel = {};
const unresolved = [];

for (const label of labels) {
    if (typeof label !== "string" || !label.trim()) continue;

    // 1) Exact id match
    if (ids.has(label)) {
        byLabel[label] = label;
        continue;
    }

    // 2) Normalized id match (e.g., punctuation/spaces differences)
    const n = normalize(label);
    const hit = idByNorm.get(n);
    if (hit) {
        byLabel[label] = hit;
        continue;
    }

    unresolved.push(label);
}

// Write outputs
const mapOut = {
    byLabel,
    defaults: { fallbackSourceId: "unknown" }
};

fs.writeFileSync(
    "src/data/_generated/source-label-map.auto.json",
    JSON.stringify(mapOut, null, 2) + "\n"
);

fs.writeFileSync(
    "src/data/_generated/unresolved-source-labels.json",
    JSON.stringify(unresolved, null, 2) + "\n"
);

console.log("Labels total:", labels.length);
console.log("Source IDs total:", idList.length);
console.log("Auto-mapped:", Object.keys(byLabel).length);
console.log("Unresolved:", unresolved.length);
