import fs from "node:fs";
import path from "node:path";

function tryReadJson(p) {
    try {
        return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch {
        return null;
    }
}

function norm(s) {
    return String(s ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function toToken(s) {
    return norm(s).replace(/\s+/g, "-");
}

function dataId(parts) {
    const cleaned = (parts ?? [])
        .map((p) => String(p ?? "").trim())
        .filter(Boolean)
        .map((p) => toToken(p))
        .filter(Boolean);

    if (cleaned.length === 0) return "data:unknown";
    return `data:${cleaned.join("/")}`;
}

function stripQtyPrefix(s) {
    return String(s ?? "").replace(/^\s*\d+\s*[xX]\s*/g, "").trim();
}

function collectItemNameKeysFromAny(node, outSet) {
    if (!node) return;

    if (Array.isArray(node)) {
        for (const v of node) collectItemNameKeysFromAny(v, outSet);
        return;
    }

    if (typeof node !== "object") return;

    if (typeof node.itemName === "string") {
        const raw = stripQtyPrefix(node.itemName);
        const k = norm(raw);
        if (k) outSet.add(k);
    }

    for (const v of Object.values(node)) {
        if (v && (typeof v === "object" || Array.isArray(v))) collectItemNameKeysFromAny(v, outSet);
    }
}

function loadRecordsByCatalogId(repoRoot) {
    // Your repo DOES have this.
    const p = path.join(repoRoot, "src/data/_generated/wfcd-items.byCatalogId.auto.json");
    const j = tryReadJson(p);
    if (!j || typeof j !== "object" || Array.isArray(j)) {
        console.error(`Failed to load recordsById from: ${p}`);
        process.exit(1);
    }
    return { path: p, recordsById: j };
}

function main() {
    const repoRoot = process.cwd();

    const missionRewards = tryReadJson(path.join(repoRoot, "external/warframe-drop-data/raw/missionRewards.json"));
    const transientRewards = tryReadJson(path.join(repoRoot, "external/warframe-drop-data/raw/transientRewards.json"));
    const solarisBounty = tryReadJson(path.join(repoRoot, "external/warframe-drop-data/raw/solarisBountyRewards.json"));
    const resourceByAvatar = tryReadJson(path.join(repoRoot, "external/warframe-drop-data/raw/resourceByAvatar.json"));
    const additionalItemByAvatar = tryReadJson(path.join(repoRoot, "external/warframe-drop-data/raw/additionalItemByAvatar.json"));
    const miscItems = tryReadJson(path.join(repoRoot, "external/warframe-drop-data/raw/miscItems.json"));
    const blueprintLocations = tryReadJson(path.join(repoRoot, "external/warframe-drop-data/raw/blueprintLocations.json"));
    const enemyBlueprintTables = tryReadJson(path.join(repoRoot, "external/warframe-drop-data/raw/enemyBlueprintTables.json"));

    const keysMission = new Set();
    {
        const root = missionRewards?.missionRewards ?? missionRewards;
        if (root && typeof root === "object" && !Array.isArray(root)) {
            for (const [planetName, planetObj] of Object.entries(root)) {
                if (!planetObj || typeof planetObj !== "object") continue;

                for (const [nodeName, nodeObj] of Object.entries(planetObj)) {
                    if (!nodeObj || typeof nodeObj !== "object") continue;

                    // Keep this here because it’s what your TS layer emits, but we only need keys.
                    // const sid = dataId(["node", planetName, nodeName]);

                    const stack = [nodeObj];
                    while (stack.length > 0) {
                        const cur = stack.pop();
                        if (!cur) continue;

                        if (Array.isArray(cur)) {
                            for (const v of cur) stack.push(v);
                            continue;
                        }

                        if (typeof cur !== "object") continue;

                        if (typeof cur.itemName === "string") {
                            const raw = stripQtyPrefix(cur.itemName);
                            const k = norm(raw);
                            if (k) keysMission.add(k);
                        }

                        for (const v of Object.values(cur)) {
                            if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
                        }
                    }
                }
            }
        }
    }

    const keysTransient = new Set();
    {
        const rows = transientRewards?.transientRewards ?? transientRewards;
        if (Array.isArray(rows)) {
            for (const row of rows) collectItemNameKeysFromAny(row?.rewards ?? row, keysTransient);
        }
    }

    const keysSolaris = new Set();
    {
        const rows = solarisBounty?.solarisBountyRewards ?? solarisBounty;
        if (Array.isArray(rows)) {
            for (const row of rows) collectItemNameKeysFromAny(row, keysSolaris);
        }
    }

    const keysRba = new Set();
    {
        const rows = resourceByAvatar?.resourceByAvatar ?? resourceByAvatar;
        if (Array.isArray(rows)) {
            for (const row of rows) {
                const items = Array.isArray(row?.items) ? row.items : [];
                for (const it of items) {
                    const k = norm(it?.item);
                    if (k) keysRba.add(k);
                }
            }
        }
    }

    const keysAiba = new Set();
    {
        const rows = additionalItemByAvatar?.additionalItemByAvatar ?? additionalItemByAvatar;
        if (Array.isArray(rows)) {
            for (const row of rows) {
                const items = Array.isArray(row?.items) ? row.items : [];
                for (const it of items) {
                    const k = norm(it?.item);
                    if (k) keysAiba.add(k);
                }
            }
        }
    }

    const keysMisc = new Set();
    {
        const rows = miscItems?.miscItems ?? miscItems;
        if (Array.isArray(rows)) {
            for (const row of rows) {
                const items = Array.isArray(row?.items) ? row.items : [];
                for (const it of items) {
                    const k = norm(it?.itemName);
                    if (k) keysMisc.add(k);
                }
            }
        }
    }

    const keysBpLoc = new Set();
    {
        const rows = blueprintLocations?.blueprintLocations ?? blueprintLocations;
        if (Array.isArray(rows)) {
            for (const row of rows) {
                const nm =
                    typeof row?.blueprintName === "string"
                        ? row.blueprintName
                        : typeof row?.itemName === "string"
                          ? row.itemName
                          : "";
                const k = norm(stripQtyPrefix(nm));
                if (k) keysBpLoc.add(k);
            }
        }
    }

    const keysEnemyBp = new Set();
    {
        const rows = enemyBlueprintTables?.enemyBlueprintTables ?? enemyBlueprintTables;
        if (Array.isArray(rows)) {
            for (const row of rows) {
                const items = Array.isArray(row?.items) ? row.items : [];
                for (const it of items) {
                    const nm =
                        typeof it?.itemName === "string"
                            ? it.itemName
                            : typeof it?.blueprintName === "string"
                              ? it.blueprintName
                              : "";
                    const k = norm(stripQtyPrefix(nm));
                    if (k) keysEnemyBp.add(k);
                }
            }
        }
    }

    const cat = loadRecordsByCatalogId(repoRoot);
    const recordsById = cat.recordsById;
    const ids = Object.keys(recordsById);

    const missing = [];
    for (const id of ids) {
        const rec = recordsById[id];
        if (!rec) continue;

        // wfcd-items.byCatalogId entries usually have displayName/name; fall back safely.
        const displayName =
            typeof rec.displayName === "string"
                ? rec.displayName
                : typeof rec.name === "string"
                  ? rec.name
                  : typeof rec.itemName === "string"
                    ? rec.itemName
                    : "";

        const k = norm(displayName);
        const kNoBp = norm(displayName.replace(/\bBlueprint\b/i, ""));

        const hit =
            (k &&
                (keysMission.has(k) ||
                    keysTransient.has(k) ||
                    keysSolaris.has(k) ||
                    keysRba.has(k) ||
                    keysAiba.has(k) ||
                    keysMisc.has(k) ||
                    keysBpLoc.has(k) ||
                    keysEnemyBp.has(k))) ||
            (kNoBp &&
                (keysMission.has(kNoBp) ||
                    keysTransient.has(kNoBp) ||
                    keysSolaris.has(kNoBp) ||
                    keysRba.has(kNoBp) ||
                    keysAiba.has(kNoBp) ||
                    keysMisc.has(kNoBp) ||
                    keysBpLoc.has(kNoBp) ||
                    keysEnemyBp.has(kNoBp)));

        if (!hit) {
            missing.push({
                id,
                name: displayName || "(no-name)",
                type:
                    rec?.type ??
                    rec?.category ??
                    rec?.productCategory ??
                    rec?.itemType ??
                    "(unknown)"
            });
        }
    }

    const report = {
        inputs: {
            wfcdItems: cat.path
        },
        counts: {
            catalogRecords: ids.length,
            missionRewardsKeys: keysMission.size,
            transientRewardsKeys: keysTransient.size,
            solarisBountyKeys: keysSolaris.size,
            resourceByAvatarKeys: keysRba.size,
            additionalItemByAvatarKeys: keysAiba.size,
            miscItemsKeys: keysMisc.size,
            blueprintLocationsKeys: keysBpLoc.size,
            enemyBlueprintTablesKeys: keysEnemyBp.size,
            manualCandidates: missing.length
        },
        sampleManualCandidates: missing.slice(0, 500)
    };

    const outPath = path.join(repoRoot, "tmp", "dropdata-manual-candidates.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 4), "utf8");

    console.log(`Wrote: ${outPath}`);
    console.log(JSON.stringify(report.counts, null, 4));
    console.log("Top 50 candidates:");
    for (const row of missing.slice(0, 50)) {
        console.log(`- ${row.id} :: ${row.name} :: ${row.type}`);
    }
}

main();
