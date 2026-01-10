import fs from "fs";

const labelsPath = "src/data/_generated/all-source-labels.json";

/**
 * This project treats data-derived sources as stable, generated IDs.
 * IMPORTANT: sources.json entries do NOT contain an "id" field; they contain a human label in `source`.
 * So our "canonical SourceId" must be derived from the label deterministically.
 *
 * Contract used elsewhere in the app:
 * - data-derived ids look like: "data:<slug>"
 */
function sourceIdFromLabel(label) {
    const s = String(label ?? "").trim().toLowerCase();

    // slugify:
    // - keep alnum
    // - convert other runs to underscores
    // - collapse underscores
    // - trim underscores
    const slug = s
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    // If the label becomes empty after slugify, still return something deterministic.
    return `data:${slug || "unknown"}`;
}

function loadJson(p) {
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

const labels = loadJson(labelsPath);

// Build mapping: every label becomes a SourceId
const byLabel = {};
const unresolved = [];

for (const label of labels) {
    if (typeof label !== "string" || !label.trim()) continue;

    const id = sourceIdFromLabel(label);

    if (!id || id === "data:unknown") {
        unresolved.push(label);
        continue;
    }

    byLabel[label] = id;
}

// Write outputs
const mapOut = {
    byLabel,
    defaults: { fallbackSourceId: "data:unknown" }
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
console.log("Auto-mapped:", Object.keys(byLabel).length);
console.log("Unresolved:", unresolved.length);
console.log("Sample 20 mappings:");
for (const k of Object.keys(byLabel).slice(0, 20)) {
    console.log(" ", JSON.stringify(k), "=>", byLabel[k]);
}
