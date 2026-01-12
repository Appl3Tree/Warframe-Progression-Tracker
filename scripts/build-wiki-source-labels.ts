// scripts/build-wiki-source-labels.ts
//
// Reads tmp/wiki-drops.ndjson (your parsed wiki drop table)
// and writes:
//   src/data/_generated/wiki-source-labels.auto.json
//
// Output is a sorted unique array of location labels.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

type DropLine = {
    location?: string;
    sourceLabel?: string;
    source?: string;
    // allow extra fields
    [k: string]: unknown;
};

function asNonEmptyString(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const s = v.trim();
    return s.length ? s : null;
}

function ensureDir(p: string): void {
    fs.mkdirSync(p, { recursive: true });
}

async function main(): Promise<void> {
    const inPath = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve("tmp/wiki-drops.ndjson");

    const outPath = path.resolve("src/data/_generated/wiki-source-labels.auto.json");
    ensureDir(path.dirname(outPath));

    if (!fs.existsSync(inPath)) {
        throw new Error(`Input not found: ${inPath}`);
    }

    const labels = new Set<string>();

    const rl = readline.createInterface({
        input: fs.createReadStream(inPath, { encoding: "utf8" }),
        crlfDelay: Infinity
    });

    let lines = 0;
    let parsed = 0;

    for await (const rawLine of rl) {
        lines += 1;
        const line = rawLine.trim();
        if (!line) continue;

        let obj: DropLine | null = null;
        try {
            obj = JSON.parse(line) as DropLine;
            parsed += 1;
        } catch {
            // Ignore bad lines, but keep going.
            continue;
        }

        // Prefer "location", but tolerate other field names.
        const loc =
            asNonEmptyString(obj.location) ??
            asNonEmptyString(obj.sourceLabel) ??
            asNonEmptyString(obj.source);

        if (!loc) continue;

        // Normalize (strip excessive whitespace)
        labels.add(loc.replace(/\s+/g, " ").trim());
    }

    const out = Array.from(labels.values()).sort((a, b) => a.localeCompare(b));

    fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");

    // Machine-readable stats
    process.stdout.write(
        JSON.stringify(
            {
                ok: true,
                wrote: outPath,
                stats: {
                    totalLinesRead: lines,
                    totalJsonParsed: parsed,
                    uniqueLabels: out.length
                }
            },
            null,
            2
        ) + "\n"
    );
}

main().catch((e) => {
    const msg = e instanceof Error ? e.message : String(e);
    process.stderr.write(msg + "\n");
    process.exit(1);
});

