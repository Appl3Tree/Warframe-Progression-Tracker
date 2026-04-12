const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const TMP_DIR = path.join(ROOT, "tmp");
const OUTPUT_PATH = path.join(ROOT, "src/data/_generated/incarnon-evolutions.auto.json");

function decodeHtml(value) {
    return String(value ?? "")
        .replace(/&#160;|&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

function stripTags(value) {
    return decodeHtml(
        String(value ?? "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/?(?:ul|ol|div|p|figure|figcaption|span|a|b|i|small|sup|sub)[^>]*>/gi, "")
            .replace(/<img[^>]*>/gi, "")
            .replace(/<[^>]+>/g, ""),
    )
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{2,}/g, "\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

function cleanLinesFromHtml(value) {
    const text = decodeHtml(
        String(value ?? "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<li[^>]*>/gi, "\n- ")
            .replace(/<\/li>/gi, "\n")
            .replace(/<\/?(?:ul|ol|div|p|figure|figcaption|span|a|b|i|small|sup|sub)[^>]*>/gi, "")
            .replace(/<img[^>]*>/gi, "")
            .replace(/<[^>]+>/g, ""),
    );

    return text
        .split("\n")
        .map((line) => line.replace(/^\s*-\s*/, "").replace(/\s+/g, " ").trim())
        .filter((line) => Boolean(line) && !/^\[\s*edit\b.*edit source\s*\]$/i.test(line) && !/^edit$/i.test(line) && !/^edit source$/i.test(line));
}

function titleFromCell(cellHtml) {
    const dataParamName = cellHtml.match(/data-param-name="([^"]+)"/i)?.[1];
    if (dataParamName) return decodeHtml(dataParamName).trim();
    return stripTags(cellHtml);
}

function parseValueMap(cellText) {
    const lines = cellText.split("\n").map((line) => line.trim()).filter(Boolean);
    const map = {};
    for (const line of lines) {
        const match = line.match(/^([A-Z])\s*=\s*(.+)$/);
        if (match) {
            map[match[1]] = match[2].trim();
        }
    }
    return map;
}

function applyValueMap(lines, map) {
    if (!Object.keys(map).length) return lines;
    return lines.map((line) => {
        let next = line;
        for (const [token, value] of Object.entries(map)) {
            next = next.replace(new RegExp(`\\b${token}\\b`, "g"), value);
        }
        return next;
    });
}

function normalizeIdPart(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function ensureRecord(map, weaponName, familyName, sourcePage, kind) {
    if (!map.has(weaponName)) {
        map.set(weaponName, {
            weaponName,
            familyName,
            sourcePage,
            kind,
            tiers: [],
        });
    }
    return map.get(weaponName);
}

function upsertTier(record, tier) {
    let found = record.tiers.find((entry) => entry.tier === tier);
    if (!found) {
        found = { tier, options: [] };
        record.tiers.push(found);
    }
    return found;
}

function extractSectionOptions(sectionHtml, tier) {
    const sectionLines = cleanLinesFromHtml(sectionHtml);
    const options = [];
    let currentOption = null;
    for (const line of sectionLines) {
        const perkMatch = line.match(/^Perk\s+\d+:\s+(.+?):$/i);
        if (perkMatch) {
            currentOption = {
                id: `tier-${tier}-${normalizeIdPart(perkMatch[1])}`,
                name: perkMatch[1].trim(),
                descriptionLines: [],
                notes: [],
            };
            options.push(currentOption);
            continue;
        }
        if (!currentOption) continue;
        currentOption.descriptionLines.push(line);
    }
    return options;
}

function extractEvolutionOneOption(sectionHtml) {
    const sectionLines = cleanLinesFromHtml(sectionHtml).filter((line) => !/^Unlock Challenge:/i.test(line));
    if (!sectionLines.length) return [];
    const descriptionLines = sectionLines.filter((line) => line.length <= 140).slice(0, 10);
    const notes = sectionLines.filter((line) => !descriptionLines.includes(line));
    return [{
        id: "tier-1-incarnon-form",
        name: "Incarnon Form",
        descriptionLines,
        notes,
    }];
}

function buildGenesisVariantMap(html) {
    const map = new Map();
    const blocks = [...html.matchAll(/<div class="gallerytext">([\s\S]*?)<\/div>\s*<\/li>/gi)].map((match) => match[1]);
    for (const block of blocks) {
        const titles = [...block.matchAll(/title="([^"]+)"/g)].map((match) => decodeHtml(match[1]).trim());
        const genesisTitle = titles.find((title) => title.endsWith("Incarnon Genesis"));
        if (!genesisTitle) continue;
        const familyName = genesisTitle.replace(/ Incarnon Genesis$/, "");
        const weaponNames = [...new Set(
            titles.filter((title) => title !== genesisTitle && title !== "Weapons" && title !== "Resources"),
        )];
        if (weaponNames.length) map.set(familyName, weaponNames);
    }
    return map;
}

function buildNativeIncarnonSet(html, availableFiles) {
    const titles = [...html.matchAll(/title="([^"]+)"/g)].map((match) => decodeHtml(match[1]).trim());
    const nativeSet = new Set();
    for (const title of titles) {
        if (!title || title.endsWith(" Incarnon Genesis")) continue;
        if (["Incarnon", "Zariman", "Sanctum Anatomica", "Isleweaver", "The Circuit"].includes(title)) continue;
        if (title.includes("Damage") || title.includes("Status Effect") || title.includes("Enemy Body Parts")) continue;
        if (availableFiles.has(`${title} - WARFRAME Wiki.html`)) {
            nativeSet.add(title);
        }
    }
    return nativeSet;
}

function extractGenesisRecords(fileName, html, recordMap, genesisVariantMap) {
    const familyName = fileName.replace(/ - WARFRAME Wiki\.html$/, "").replace(/ Incarnon Genesis$/, "");
    const variantNames = genesisVariantMap.get(familyName) ?? [familyName];
    const tableMatch = [...html.matchAll(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi)]
        .map((match) => match[1])
        .find((tableHtml) => /EVO2/i.test(tableHtml) && /Evolution/i.test(tableHtml));
    if (!tableMatch) {
        const sectionRegex = /<h4 id="Evolution_(I|II|III|IV|V)"[^>]*>[\s\S]*?<\/h4>([\s\S]*?)(?=<div class="mw-heading mw-heading4"><h4 id="Evolution_|<div class="mw-heading mw-heading2"><h2 id="Known_Bugs"|<div class="mw-heading mw-heading2"><h2 id="Patch_History"|<table class="navbox)/gi;
        for (const match of html.matchAll(sectionRegex)) {
            const roman = match[1];
            const tier = roman === "I" ? 1 : roman === "II" ? 2 : roman === "III" ? 3 : roman === "IV" ? 4 : 5;
            const options = tier === 1 ? extractEvolutionOneOption(match[2]) : extractSectionOptions(match[2], tier);
            for (const weaponName of variantNames) {
                const record = ensureRecord(recordMap, weaponName, familyName, fileName, "genesis");
                const tierEntry = upsertTier(record, tier);
                tierEntry.options.push(...options.map((option) => ({ ...option })));
            }
        }
        return;
    }

    const rowMatches = [...tableMatch.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].map((match) => match[1]);
    if (!rowMatches.length) return;

    const headerCells = [...rowMatches[0].matchAll(/<th\b([^>]*)>([\s\S]*?)<\/th>/gi)].map((match) => ({
        attrs: match[1],
        html: match[2],
    }));
    const tableVariantNames = headerCells
        .slice(1, -1)
        .map((cell) => titleFromCell(cell.html))
        .filter(Boolean);
    if (!tableVariantNames.length) return;

    let currentTier = null;
    for (const rowHtml of rowMatches.slice(1)) {
        const tierMatch = rowHtml.match(/>\s*EVO(\d)\s*</i);
        if (tierMatch) currentTier = Number(tierMatch[1]);
        if (!currentTier || currentTier < 2 || /Evolution Challenge/i.test(rowHtml)) continue;

        const tdCells = [...rowHtml.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)].map((match) => ({
            attrs: match[1],
            html: match[2],
        }));
        if (tdCells.length < 2) continue;

        const optionName = stripTags(tdCells[0].html);
        if (!optionName) continue;
        const descriptionLines = cleanLinesFromHtml(tdCells[1].html);
        if (!descriptionLines.length) continue;

        const tierOptionId = `tier-${currentTier}-${normalizeIdPart(optionName)}`;
        const valueCells = tdCells.slice(2, 2 + tableVariantNames.length);
        const notesCell = tdCells[2 + tableVariantNames.length] ?? tdCells[tdCells.length - 1];
        const notesLines = notesCell ? cleanLinesFromHtml(notesCell.html) : [];

        const resolvedByVariant = tableVariantNames.map((variantName, index) => {
            const valueCell = valueCells[index] ?? valueCells[0] ?? null;
            const cellText = valueCell ? stripTags(valueCell.html) : "";
            const valueMap = parseValueMap(cellText);
            return {
                weaponName: variantName,
                lines: applyValueMap(descriptionLines, valueMap),
            };
        });

        for (const { weaponName, lines } of resolvedByVariant) {
            const record = ensureRecord(recordMap, weaponName, familyName, fileName, "genesis");
            const tierEntry = upsertTier(record, currentTier);
            tierEntry.options.push({
                id: tierOptionId,
                name: optionName,
                descriptionLines: lines,
                notes: notesLines,
            });
        }
    }
}

function extractNativeRecords(fileName, html, recordMap) {
    const familyName = fileName.replace(/ - WARFRAME Wiki\.html$/, "");
    const weaponName = familyName;
    const record = ensureRecord(recordMap, weaponName, familyName, fileName, "native");

    const sectionRegex = /<h4 id="Evolution_(I|II|III|IV|V)"[^>]*>[\s\S]*?<\/h4>([\s\S]*?)(?=<div class="mw-heading mw-heading4"><h4 id="Evolution_|<div class="mw-heading mw-heading2"><h2 id="Tips"|<div class="mw-heading mw-heading2"><h2 id="Trivia"|<div class="mw-heading mw-heading2"><h2 id="Bugs"|<div class="mw-heading mw-heading2"><h2 id="Patch_History")/gi;
    for (const match of html.matchAll(sectionRegex)) {
        const roman = match[1];
        const tier = roman === "I" ? 1 : roman === "II" ? 2 : roman === "III" ? 3 : roman === "IV" ? 4 : 5;
        const sectionHtml = match[2];
        const sectionLines = cleanLinesFromHtml(sectionHtml);
        const tierEntry = upsertTier(record, tier);

        if (tier === 1) {
            tierEntry.options.push(...extractEvolutionOneOption(sectionHtml));
            continue;
        }

        let currentOption = null;
        for (const line of sectionLines) {
            const perkMatch = line.match(/^Perk\s+\d+:\s+(.+?):$/i);
            if (perkMatch) {
                currentOption = {
                    id: `tier-${tier}-${normalizeIdPart(perkMatch[1])}`,
                    name: perkMatch[1].trim(),
                    descriptionLines: [],
                    notes: [],
                };
                tierEntry.options.push(currentOption);
                continue;
            }
            if (!currentOption) continue;
            currentOption.descriptionLines.push(line);
        }
    }
}

function main() {
    const tmpFiles = fs.readdirSync(TMP_DIR);
    const incarnonIndexHtml = fs.readFileSync(path.join(TMP_DIR, "Incarnon - WARFRAME Wiki.html"), "utf8");
    const genesisVariantMap = buildGenesisVariantMap(incarnonIndexHtml);
    const nativeIncarnonSet = buildNativeIncarnonSet(incarnonIndexHtml, new Set(tmpFiles));
    const files = tmpFiles.filter((fileName) =>
        /Incarnon Genesis - WARFRAME Wiki\.html$/.test(fileName) ||
        nativeIncarnonSet.has(fileName.replace(/ - WARFRAME Wiki\.html$/, "")),
    );

    const recordMap = new Map();

    for (const fileName of files) {
        const html = fs.readFileSync(path.join(TMP_DIR, fileName), "utf8");
        if (/Incarnon Genesis - WARFRAME Wiki\.html$/.test(fileName)) {
            extractGenesisRecords(fileName, html, recordMap, genesisVariantMap);
        } else {
            extractNativeRecords(fileName, html, recordMap);
        }
    }

    const records = [...recordMap.values()]
        .map((record) => ({
            ...record,
            tiers: record.tiers
                .map((tier) => ({
                    ...tier,
                    options: tier.options.sort((a, b) => a.name.localeCompare(b.name)),
                }))
                .sort((a, b) => a.tier - b.tier),
        }))
        .sort((a, b) => a.weaponName.localeCompare(b.weaponName));

    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`);
    console.log(`Wrote ${records.length} Incarnon evolution records to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main();
