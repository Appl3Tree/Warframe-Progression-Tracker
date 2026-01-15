import { FULL_CATALOG } from "../src/domain/catalog/loadFullCatalog";

function norm(s: string): string {
    return (s ?? "").replace(/\s+/g, " ").trim();
}

// Accepts both "Axi A1 Relic" and "Axi A1 Exceptional/Flawless/Intact/Radiant"
function relicKey(name: string): string | null {
    const m = norm(name).match(/^\s*(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\b(?:\s+Relic\b)?(?:\s+(Intact|Exceptional|Flawless|Radiant)\b)?/i);
    if (!m) return null;
    return `${m[1].toLowerCase()} ${m[2].toLowerCase()}`;
}

let shownGood = 0;
let shownBad = 0;

for (const id of FULL_CATALOG.displayableItemIds) {
    const rec: any = (FULL_CATALOG as any).recordsById[id];
    const name = rec?.displayName;
    if (typeof name !== "string") continue;

    // Focus on the projection-style relics that are currently "unknown-acquisition"
    if (!/\/Types\/Game\/Projections\//i.test(String(id))) continue;

    const key = relicKey(name);
    if (!key) {
        console.log("NO KEY:", name, String(id));
        if (++shownBad >= 30) break;
        continue;
    }

    if (shownGood < 20) {
        console.log("OK:", key, "←", name);
        shownGood++;
    }
}

console.log("shown_ok:", shownGood, "shown_no_key:", shownBad);
