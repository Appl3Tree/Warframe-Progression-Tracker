/* ===== FILE: scripts/diagnose-acquisitions.cjs ===== */
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

function safeString(v) {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function normalizeName(s) {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeNameNoPunct(s) {
    return normalizeName(s).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

// "750X Alloy Plate" -> "Alloy Plate"
function stripLeadingQuantityPrefix(s) {
    const raw = s.trim();
    const m = raw.match(/^\s*\d[\d,]*\s*[xX]\s+(.+)\s*$/);
    if (m && m[1]) return m[1].trim();
    return raw;
}

// "Lavos Blueprint" -> "Lavos"
function stripTrailingBlueprintSuffix(s) {
    const raw = s.trim();
    const m = raw.match(/^(.*)\s+blueprint\s*$/i);
    if (m && m[1]) return m[1].trim();
    return raw;
}

function expandNameKeys(rawName) {
    const out = new Set();

    const a = safeString(rawName);
    if (!a) return [];

    const b = stripLeadingQuantityPrefix(a);

    out.add(normalizeName(a));
    out.add(normalizeNameNoPunct(a));

    out.add(normalizeName(b));
    out.add(normalizeNameNoPunct(b));

    return Array.from(out.values());
}

function addDropName(dropKeys, rawName) {
    const n = safeString(rawName);
    if (!n) return;

    // Index the raw form (with quantity normalization)
    for (const k of expandNameKeys(n)) dropKeys.add(k);

    // If it is a blueprint reward, also index the blueprint-stripped parent name
    // so catalog items like "Lavos" match "Lavos Blueprint".
    const stripped = stripTrailingBlueprintSuffix(stripLeadingQuantityPrefix(n));
    if (stripped !== n) {
        for (const k of expandNameKeys(stripped)) dropKeys.add(k);
    }
}

function parseArgs(argv) {
    const out = { limit: 200 };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--limit") {
            const n = Number(argv[i + 1]);
            if (Number.isFinite(n) && n > 0) out.limit = n;
            i++;
        }
    }
    return out;
}

function loadJson(p) {
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

function* iterDropNamesFromMissionRewards(mrRoot) {
    const root = mrRoot?.missionRewards ?? mrRoot;
    if (!root || typeof root !== "object") return;

    for (const planet of Object.values(root)) {
        if (!planet || typeof planet !== "object") continue;

        for (const node of Object.values(planet)) {
            if (!node || typeof node !== "object") continue;

            const rewards = node.rewards;
            if (!rewards || typeof rewards !== "object") continue;

            for (const arr of Object.values(rewards)) {
                if (!Array.isArray(arr)) continue;
                for (const r of arr) {
                    const n = safeString(r?.itemName) ?? safeString(r?.modName) ?? safeString(r?.item);
                    if (n) yield n;
                }
            }
        }
    }
}

function* iterDropNamesFromRewardArrayFile(root, key) {
    const arr = root?.[key] ?? root;
    if (!Array.isArray(arr)) return;

    for (const row of arr) {
        if (row?.itemName) yield row.itemName;
        if (row?.modName) yield row.modName;
        if (row?.item) yield row.item;

        if (row?.rewards) {
            const rewards = row.rewards;
            if (Array.isArray(rewards)) {
                for (const r of rewards) {
                    const n = safeString(r?.itemName) ?? safeString(r?.modName) ?? safeString(r?.item);
                    if (n) yield n;
                }
            } else if (rewards && typeof rewards === "object") {
                for (const v of Object.values(rewards)) {
                    if (!Array.isArray(v)) continue;
                    for (const r of v) {
                        const n = safeString(r?.itemName) ?? safeString(r?.modName) ?? safeString(r?.item);
                        if (n) yield n;
                    }
                }
            }
        }

        if (Array.isArray(row?.items)) {
            for (const it of row.items) {
                const n = safeString(it?.itemName) ?? safeString(it?.modName) ?? safeString(it?.item);
                if (n) yield n;
            }
        }
        if (Array.isArray(row?.mods)) {
            for (const it of row.mods) {
                const n = safeString(it?.modName) ?? safeString(it?.itemName);
                if (n) yield n;
            }
        }
    }
}

function* iterDropNamesFromRelics(root) {
    const arr = root?.relics ?? root;
    if (!Array.isArray(arr)) return;

    for (const row of arr) {
        const rewards = row?.rewards;
        if (!rewards) continue;

        if (Array.isArray(rewards)) {
            for (const r of rewards) {
                const n = safeString(r?.itemName);
                if (n) yield n;
            }
        } else if (rewards && typeof rewards === "object") {
            for (const v of Object.values(rewards)) {
                if (!Array.isArray(v)) continue;
                for (const r of v) {
                    const n = safeString(r?.itemName);
                    if (n) yield n;
                }
            }
        }
    }
}

function main() {
    const args = parseArgs(process.argv);

    const catalogPath = path.resolve("src/data/items.json");
    const catalog = loadJson(catalogPath);

    // Collect pretty names AND a unique normalized set
    const prettyCatalogNames = [];
    const catalogUnique = new Set();

    function ingestCatalogRow(row) {
        const name = safeString(row?.name) ?? safeString(row?.displayName);
        if (!name) return;
        prettyCatalogNames.push(name);
        for (const k of expandNameKeys(name)) catalogUnique.add(k);
    }

    if (Array.isArray(catalog)) {
        for (const row of catalog) ingestCatalogRow(row);
    } else if (catalog && typeof catalog === "object") {
        for (const row of Object.values(catalog)) ingestCatalogRow(row);
    }

    // Drop-data names
    const dropKeys = new Set();

    const ddRoot = path.resolve("external/warframe-drop-data/raw");

    const missionRewardsPath = path.join(ddRoot, "missionRewards.json");
    if (fs.existsSync(missionRewardsPath)) {
        const missionRewards = loadJson(missionRewardsPath);
        for (const n of iterDropNamesFromMissionRewards(missionRewards)) addDropName(dropKeys, n);
    }

    const files = [
        ["blueprintLocations.json", "blueprintLocations"],
        ["enemyBlueprintTables.json", "enemyBlueprintTables"],
        ["modLocations.json", "modLocations"],
        ["enemyModTables.json", "enemyModTables"],
        ["transientRewards.json", "transientRewards"],
        ["sortieRewards.json", "sortieRewards"],
        ["cetusBountyRewards.json", "cetusBountyRewards"],
        ["solarisBountyRewards.json", "solarisBountyRewards"],
        ["zarimanRewards.json", "zarimanRewards"],
        ["keyRewards.json", "keyRewards"],
        ["miscItems.json", "miscItems"]
    ];

    for (const [fn, key] of files) {
        const p = path.join(ddRoot, fn);
        if (!fs.existsSync(p)) continue;
        const j = loadJson(p);
        for (const n of iterDropNamesFromRewardArrayFile(j, key)) addDropName(dropKeys, n);
    }

    const relicsPath = path.join(ddRoot, "relics.json");
    if (fs.existsSync(relicsPath)) {
        const relics = loadJson(relicsPath);
        for (const n of iterDropNamesFromRelics(relics)) addDropName(dropKeys, n);
    }

    // Compute missing: catalog name keys must appear in dropKeys
    const missing = [];
    for (const name of prettyCatalogNames) {
        const keys = expandNameKeys(name);
        const found = keys.some((k) => dropKeys.has(k));
        if (!found) missing.push(name);
    }

    console.log("=== Acquisition Audit (Name Match Only) ===");
    console.log(`Catalog unique names: ${catalogUnique.size}`);
    console.log(`Drop-data unique normalized names: ${dropKeys.size}`);
    console.log(`Catalog names missing from drop-data: ${missing.length}`);
    console.log("");

    // lightweight token-overlap suggestions
    const dropSample = Array.from(dropKeys.values()).slice(0, 2000);

    function score(a, b) {
        const as = new Set(a.split(" ").filter(Boolean));
        const bs = new Set(b.split(" ").filter(Boolean));
        let common = 0;
        for (const t of as) if (bs.has(t)) common++;
        return common;
    }

    const limit = Math.min(args.limit, missing.length);
    for (let i = 0; i < limit; i++) {
        const miss = missing[i];
        console.log(`- ${miss}`);

        const missKey = normalizeNameNoPunct(stripLeadingQuantityPrefix(miss));
        const candidates = dropSample
            .map((k) => ({ k, s: score(missKey, k) }))
            .sort((x, y) => y.s - x.s)
            .slice(0, 5);

        for (const c of candidates) {
            console.log(`    ~ (${c.s}) ${c.k}`);
        }
    }

    if (missing.length > limit) {
        console.log("");
        console.log(`(truncated) Showing ${limit} of ${missing.length}. Re-run with --limit=...`);
    }
}

main();
