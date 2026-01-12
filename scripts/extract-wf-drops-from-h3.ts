// scripts/extract-wf-drops-from-h3.ts
//
// Extracts Warframe drop table chunks split as: <h3 ...> ... <table> ... </table>
// Input: one or more HTML files (wf_h3_01.html, wf_h3_02.html, ...)
// Output: NDJSON to stdout (one JSON object per row)
//
// Usage examples:
//   npx tsx scripts/extract-wf-drops-from-h3.ts wf_h3_01.html > drops.ndjson
//   npx tsx scripts/extract-wf-drops-from-h3.ts wf_h3_*.html > drops.ndjson
//
// Contract:
// - No guessing. We only emit what exists in the table.
// - Headers are taken from <th> cells if present; otherwise "col1..colN".

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

type RowRecord = {
    section: {
        file: string;
        h3Text: string;
        h3Id: string | null;
    };
    columns: string[];
    values: string[];
    byColumn: Record<string, string>;
};

function normText(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

function safeFilename(p: string): string {
    return path.basename(p);
}

function getH3Meta($: cheerio.CheerioAPI): { h3Text: string; h3Id: string | null } {
    const h3 = $("h3").first();
    const h3Text = normText(h3.text() || "");
    const h3IdRaw = h3.attr("id");
    const h3Id = typeof h3IdRaw === "string" && h3IdRaw.trim().length > 0 ? h3IdRaw.trim() : null;
    return { h3Text, h3Id };
}

function extractTable($: cheerio.CheerioAPI): { headers: string[]; rows: string[][] } {
    const table = $("table").first();
    if (!table || table.length === 0) {
        return { headers: [], rows: [] };
    }

    // Prefer explicit table headers if present.
    let headers: string[] = [];
    const ths = table.find("thead tr th");
    if (ths.length > 0) {
        headers = ths
            .toArray()
            .map((el) => normText($(el).text()))
            .filter((x) => x.length > 0);
    } else {
        // Sometimes headers are in the first row.
        const firstRowTh = table.find("tr").first().find("th");
        if (firstRowTh.length > 0) {
            headers = firstRowTh
                .toArray()
                .map((el) => normText($(el).text()))
                .filter((x) => x.length > 0);
        }
    }

    const trs = table.find("tbody tr").toArray();
    const fallbackTrs = trs.length > 0 ? trs : table.find("tr").toArray();

    const rows: string[][] = [];
    for (const tr of fallbackTrs) {
        const tds = $(tr).find("td").toArray();
        if (tds.length === 0) continue;

        const vals = tds.map((td) => normText($(td).text()));
        // Skip blank rows
        if (vals.every((v) => v.length === 0)) continue;

        rows.push(vals);
    }

    // If we still have no headers, build deterministic placeholders based on widest row.
    if (headers.length === 0) {
        const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
        headers = Array.from({ length: maxCols }, (_, i) => `col${i + 1}`);
    }

    // Normalize row widths to header length
    const normalizedRows = rows.map((r) => {
        const out = r.slice(0, headers.length);
        while (out.length < headers.length) out.push("");
        return out;
    });

    return { headers, rows: normalizedRows };
}

function buildByColumn(headers: string[], values: string[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (let i = 0; i < headers.length; i += 1) {
        const k = headers[i] || `col${i + 1}`;
        out[k] = values[i] ?? "";
    }
    return out;
}

function processFile(filePath: string): void {
    const html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);

    const meta = getH3Meta($);
    const { headers, rows } = extractTable($);

    const file = safeFilename(filePath);

    for (const values of rows) {
        const rec: RowRecord = {
            section: {
                file,
                h3Text: meta.h3Text,
                h3Id: meta.h3Id
            },
            columns: headers,
            values,
            byColumn: buildByColumn(headers, values)
        };

        process.stdout.write(`${JSON.stringify(rec)}\n`);
    }
}

function main(): void {
    const args = process.argv.slice(2).filter((a) => a.trim().length > 0);
    if (args.length === 0) {
        console.error("Usage: npx tsx scripts/extract-wf-drops-from-h3.ts <file1.html> [file2.html ...]");
        process.exit(1);
    }

    for (const fp of args) {
        if (!fs.existsSync(fp)) {
            console.error(`Missing file: ${fp}`);
            process.exit(1);
        }
        processFile(fp);
    }
}

main();

