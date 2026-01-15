// scripts/extract-relic-sources-from-missionRewards.ts
import fs from "node:fs";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

type Found = {
    relicKey: string;          // e.g. "lith d7"
    relicDisplay: string;      // e.g. "Lith D7 Relic"
    pathLabel: string;         // human label derived from json path
    rotation: string | null;   // "A" | "B" | "C" | null
    chance: number | null;     // best effort
};

function normalizeSpaces(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

function normalizeRelicKey(name: string): { key: string; display: string } | null {
    const raw = normalizeSpaces(name);

    // Match:
    // - "Lith D7 Relic"
    // - "Neo T10 Relic (Radiant)"
    // - allow extra suffixes in parentheses
    const m = raw.match(/\b(Lith|Meso|Neo|Axi)\b\s+([A-Za-z0-9]+)\s+Relic\b/i);
    if (!m) return null;

    const tier = m[1].toLowerCase();
    const code = m[2].toLowerCase();

    // Display without trailing variants: keep original tier/code but strip any "(...)" suffix.
    const display = raw.replace(/\s*\([^)]*\)\s*$/, "").trim();

    return { key: `${tier} ${code}`, display };
}

function pickChance(obj: any): number | null {
    // warframe-drop-data usually uses "chance" but we support common alternates
    const candidates = ["chance", "probability", "dropChance", "rarity"];
    for (const k of candidates) {
        const v = obj?.[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string") {
            const n = Number(v);
            if (Number.isFinite(n)) return n;
        }
    }
    return null;
}

function isRotationKey(s: string): boolean {
    const t = s.trim();
    return t === "A" || t === "B" || t === "C";
}

function labelFromPath(path: string[]): string {
    // Keep it readable: remove very noisy tokens
    const cleaned = path
        .map((p) => normalizeSpaces(String(p)))
        .filter(Boolean)
        .filter((p) => p !== "rewards" && p !== "reward" && p !== "items" && p !== "item" && p !== "drops");

    // Most useful label is usually the tail; keep last ~4 segments.
    const tail = cleaned.slice(Math.max(0, cleaned.length - 4));
    return tail.join(" / ");
}

function walk(node: Json, path: string[], out: Found[]): void {
    if (node === null) return;

    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            walk(node[i], path, out);
        }
        return;
    }

    if (typeof node === "object") {
        // If this object looks like a reward entry, try extracting a relic name.
        // Common keys: itemName, name, reward, item
        const asAny: any = node;

        const nameFields = ["itemName", "name", "reward", "item", "description"];
        for (const nf of nameFields) {
            const v = asAny[nf];
            if (typeof v === "string") {
                const rel = normalizeRelicKey(v);
                if (rel) {
                    // Determine rotation from path (nearest A/B/C above us)
                    const rotation = [...path].reverse().find(isRotationKey) ?? null;

                    out.push({
                        relicKey: rel.key,
                        relicDisplay: rel.display,
                        pathLabel: labelFromPath(path),
                        rotation,
                        chance: pickChance(asAny)
                    });
                    break;
                }
            }
        }

        // Continue traversal
        for (const [k, v] of Object.entries(node)) {
            walk(v as Json, [...path, k], out);
        }
    }
}

function main() {
    const input = process.argv[2];
    const outTsv = process.argv[3] ?? "relic-sources.missionRewards.tsv";

    if (!input) {
        console.error("Usage: npx tsx scripts/extract-relic-sources-from-missionRewards.ts <missionRewards.json> [out.tsv]");
        process.exit(2);
    }

    const raw = fs.readFileSync(input, "utf8");
    const json = JSON.parse(raw) as Json;

    const found: Found[] = [];
    walk(json, [], found);

    // Dedupe identical rows
    const seen = new Set<string>();
    const rows: Found[] = [];
    for (const f of found) {
        const key = [f.relicKey, f.pathLabel, f.rotation ?? "", f.chance ?? ""].join("\t");
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(f);
    }

    // Stable sort: relicKey, then label, then rotation
    rows.sort((a, b) => {
        if (a.relicKey !== b.relicKey) return a.relicKey.localeCompare(b.relicKey);
        if (a.pathLabel !== b.pathLabel) return a.pathLabel.localeCompare(b.pathLabel);
        return String(a.rotation ?? "").localeCompare(String(b.rotation ?? ""));
    });

    const header = ["relicKey", "relicDisplay", "pathLabel", "rotation", "chance"].join("\t");
    const body = rows
        .map((r) => [
            r.relicKey,
            r.relicDisplay,
            r.pathLabel,
            r.rotation ?? "",
            r.chance === null ? "" : String(r.chance)
        ].join("\t"))
        .join("\n");

    fs.writeFileSync(outTsv, `${header}\n${body}\n`, "utf8");
    console.log(`Wrote ${rows.length} relic-source rows -> ${outTsv}`);
}

main();

