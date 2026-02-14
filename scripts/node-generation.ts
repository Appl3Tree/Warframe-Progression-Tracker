import missionRewardsJson from "../external/warframe-drop-data/raw/missionRewards.json";
import { STAR_CHART_DATA } from "../src/domain/catalog/starChart";

const log = (...args: any[]) => console.error("[MR]", ...args);

log("BOOT");

// Optional heartbeat so you know it's alive.
let heartbeatCount = 0;
const heartbeat = setInterval(() => {
    heartbeatCount++;
    log(`Heartbeat ${heartbeatCount} — still running...`);
}, 2000);

try {
    const fold = (s: any) =>
        String(s ?? "")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "");

    const norm = (s: any) =>
        fold(s)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    const normNP = (s: any) =>
        norm(s)
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const tok = (s: any) => normNP(s).replace(/\s+/g, "-");

    const stripSuffix = (s: any) =>
        String(s ?? "").replace(/\s*\((Caches|Extra)\)\s*$/i, "");

    const suffix = (s: any) => {
        const m = String(s ?? "").match(/\(\s*(Caches|Extra)\)\s*$/i);
        return m ? m[1].toLowerCase() : null;
    };

    const mrRoot = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);

    const existing = new Set(STAR_CHART_DATA.nodes.map((n) => String(n.id)));
    const planetTokToId = new Map(STAR_CHART_DATA.planets.map((p) => [tok(p.name), p.id]));
    const planetSort = new Map(STAR_CHART_DATA.planets.map((p) => [p.id, p.sortOrder]));

    const buckets = new Map<string, any[]>();
    const unmapped: string[] = [];

    let totalPlanetsSeen = 0;
    let totalNodesSeen = 0;
    let totalNewNodes = 0;

    const allPlanets = Object.entries(mrRoot || {});
    log(`Loaded missionRewards planets: ${allPlanets.length}`);

    for (const [planetName, planetObj] of allPlanets) {
        totalPlanetsSeen++;
        log(`Planet ${totalPlanetsSeen}/${allPlanets.length}: ${planetName}`);

        if (!planetObj || typeof planetObj !== "object") {
            log(`  Skip (non-object): ${planetName}`);
            continue;
        }

        const pTok = tok(planetName);
        const planetId = planetTokToId.get(pTok);
        if (!planetId) {
            unmapped.push(String(planetName));
            log(`  Unmapped planet token: ${pTok}`);
            continue;
        }

        const nodeKeys = Object.keys(planetObj as any);
        log(`  Node keys: ${nodeKeys.length}`);

        let planetAdded = 0;

        for (const nodeNameRaw of nodeKeys) {
            totalNodesSeen++;

            if (totalNodesSeen % 250 === 0) {
                log(`Processed ${totalNodesSeen} nodes total...`);
            }

            const raw = String(nodeNameRaw);
            const suf = suffix(raw);
            const base = stripSuffix(raw);

            const nodeTok = suf ? `${tok(base)}-(${suf})` : tok(raw);
            const id = `node:mr/${pTok}/${nodeTok}`;

            if (existing.has(id)) continue;

            const entry = {
                id,
                planetId,
                name: raw,
                nodeType: "mission",
                edges: [] as any[],
            };

            if (!buckets.has(planetId)) buckets.set(planetId, []);
            buckets.get(planetId)!.push(entry);

            planetAdded++;
            totalNewNodes++;
        }

        log(`  Finished ${planetName} — added ${planetAdded}`);
    }

    const planetIds = [...buckets.keys()].sort(
        (a, b) =>
            (planetSort.get(a) ?? 999999) - (planetSort.get(b) ?? 999999) ||
            String(a).localeCompare(String(b)),
    );

    log(`Emit planets with additions: ${planetIds.length}`);

    // ====== STDOUT OUTPUT (the nodes.ts fragments) ======
    let emitted = 0;

    for (const pid of planetIds) {
        const arr = buckets.get(pid)!.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        emitted += arr.length;

        const p = STAR_CHART_DATA.planets.find((x) => x.id === pid);

        console.log("");
        console.log("// =============================");
        console.log(`// ${p?.name ?? pid} (drop-data missionRewards) add=${arr.length}`);
        console.log("// =============================");

        for (const e of arr) {
            console.log("{");
            console.log(`    id: ${JSON.stringify(e.id)},`);
            console.log(`    planetId: ${JSON.stringify(e.planetId)},`);
            console.log(`    name: ${JSON.stringify(e.name)},`);
            console.log('    nodeType: "mission",');
            console.log("    edges: []");
            console.log("},");
        }
    }

    // ====== SUMMARY (stdout + stderr) ======
    const unmappedUnique = [...new Set(unmapped)].sort((a, b) => a.localeCompare(b));

    console.log("");
    console.log("// ===== SUMMARY =====");
    console.log(`// newNodes=${emitted}`);
    if (unmappedUnique.length) {
        console.log(`// unmappedPlanets=${unmappedUnique.length}`);
        for (const x of unmappedUnique) console.log(`//  - ${x}`);
    }

    log("DONE");
    log("Total planets seen:", totalPlanetsSeen);
    log("Total mission nodes seen:", totalNodesSeen);
    log("Total new nodes generated:", totalNewNodes);
    log("Total emitted:", emitted);
    if (unmappedUnique.length) {
        log("Unmapped planets:", unmappedUnique.length);
    }
} finally {
    clearInterval(heartbeat);
    log("EXIT");
}

