import fs from "node:fs/promises";
import path from "node:path";

import ALL_RAW from "../../src/data/_generated/warframe-items-all-lean.auto.json";
import { FULL_CATALOG, type CatalogId } from "../../src/domain/catalog/loadFullCatalog";
import { getManualReleaseDateFallback } from "../../src/catalog/items/manualReleaseDates";

type AllEntry = {
  uniqueName?: string;
  name?: string;
  category?: string;
  type?: string;
  compatName?: string;
  releaseDate?: string;
};

type CandidateKind = "warframesVehicles" | "weapons" | "mods" | "arcanes";

type Candidate = {
  kind: CandidateKind;
  name: string;
  path: string;
  id?: string;
  category?: string;
  type?: string;
  compatName?: string;
  categories?: string[];
};

type ResearchResult = Candidate & {
  wikiUrl: string;
  introducedText?: string;
  releaseDate?: string;
  pageFound: boolean;
  wikiTitle?: string;
};

const EXCLUDED_PATHS = new Set<string>([
  "/Lotus/Powersuits/PowersuitAbilities/Helminth",
  "/Lotus/Types/Game/KubrowPet/InfestedKubrowPetPowerSuit",
]);

function hasReleaseDate(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isMissingReleaseDate(entry: AllEntry): boolean {
  const releaseDate = hasReleaseDate(entry.releaseDate) ? entry.releaseDate!.trim() : undefined;
  const manualReleaseDate = getManualReleaseDateFallback({
    uniqueName: entry.uniqueName,
    category: entry.category,
    type: entry.type,
    releaseDate,
  });
  return !releaseDate && !manualReleaseDate;
}

function buildCandidates(): Candidate[] {
  const allByUnique = new Map<string, AllEntry>();
  for (const raw of ALL_RAW as AllEntry[]) {
    if (raw?.uniqueName) allByUnique.set(raw.uniqueName, raw);
  }

  const out: Candidate[] = [];
  const seen = new Set<string>();

  const inventoryIds = FULL_CATALOG.displayableInventoryItemIds as CatalogId[];
  for (const id of inventoryIds) {
    const rec: any = FULL_CATALOG.recordsById[id];
    if (!rec?.displayName) continue;

    const rawPath = String(rec.path ?? "").trim();
    if (!rawPath || EXCLUDED_PATHS.has(rawPath)) continue;

    const categories = Array.isArray(rec.categories) ? rec.categories.map(String) : [];
    const mains = categories
      .map((value) => value.split(/[/:>]/)[0].trim().toLowerCase())
      .filter(Boolean);
    const allEntry = allByUnique.get(rawPath) ?? {
      uniqueName: rawPath,
      name: String(rec.displayName),
      category: undefined,
      type: undefined,
    };

    if (!isMissingReleaseDate(allEntry)) continue;

    const isWarframesVehicles = mains.some((m) =>
      m === "warframe" ||
      m === "warframes" ||
      m === "archwing" ||
      m === "archwings" ||
      m === "necramech" ||
      m === "necramechs" ||
      m === "mech" ||
      m === "mechs",
    );
    const isWeapon =
      mains.some((m) => m === "weapon" || m === "weapons") ||
      ["Primary", "Secondary", "Melee", "Arch-Gun", "Arch-Melee", "Sentinel Weapons"].includes(String(allEntry.category ?? ""));

    const baseCandidate = {
      name: String(rec.displayName),
      path: rawPath,
      id: String(id),
      category: allEntry.category,
      type: allEntry.type,
      compatName: allEntry.compatName,
      categories,
    };

    if (isWarframesVehicles) {
      const key = `warframesVehicles:${String(id)}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ kind: "warframesVehicles", ...baseCandidate });
      }
    }
    if (isWeapon) {
      const key = `weapons:${String(id)}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ kind: "weapons", ...baseCandidate });
      }
    }
  }

  const plexusKey = "warframesVehicles:items:/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness";
  if (!seen.has(plexusKey)) {
    seen.add(plexusKey);
    out.push({
      kind: "warframesVehicles",
      name: "Plexus",
      id: "items:/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness",
      path: "/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness",
      category: "Warframes",
      type: "Plexus",
      categories: ["warframes"],
    });
  }

  for (const raw of ALL_RAW as AllEntry[]) {
    const uniqueName = String(raw.uniqueName ?? "").trim();
    const name = String(raw.name ?? "").trim();
    if (!uniqueName || !name) continue;
    if (!isMissingReleaseDate(raw)) continue;

    if (raw.category === "Mods") {
      const key = `mods:${uniqueName}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({
          kind: "mods",
          name,
          path: uniqueName,
          category: raw.category,
          type: raw.type,
          compatName: raw.compatName,
        });
      }
    } else if (raw.category === "Arcanes") {
      const key = `arcanes:${uniqueName}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({
          kind: "arcanes",
          name,
          path: uniqueName,
          category: raw.category,
          type: raw.type,
          compatName: raw.compatName,
        });
      }
    }
  }

  return out.sort((a, b) =>
    a.kind.localeCompare(b.kind) ||
    a.name.localeCompare(b.name) ||
    a.path.localeCompare(b.path),
  );
}

function extractReleaseDateFromHtml(html: string): { introducedText?: string; releaseDate?: string; pageFound: boolean } {
  const noArticle =
    /There is currently no text in this page/i.test(html) ||
    /This page does not exist/i.test(html) ||
    /Create the page/i.test(html);

  const introducedBlock =
    html.match(/Introduced[\s\S]{0,1200}?(Update|Hotfix|Patch)[\s\S]{0,200}?\((\d{4}-\d{2}-\d{2})\)/i) ||
    html.match(/(Update|Hotfix|Patch)[\s\S]{0,200}?\((\d{4}-\d{2}-\d{2})\)[\s\S]{0,400}?Introduced\.?/i) ||
    html.match(/Introduced[\s\S]{0,800}?(\d{4}-\d{2}-\d{2})/i);

  if (!introducedBlock) {
    return { pageFound: !noArticle };
  }

  const releaseDate = introducedBlock[introducedBlock.length - 1];
  const introducedText = introducedBlock[0]
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    pageFound: !noArticle,
    introducedText,
    releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(releaseDate) ? releaseDate : undefined,
  };
}

async function fetchWikiPage(title: string): Promise<{ wikiUrl: string; introducedText?: string; releaseDate?: string; pageFound: boolean; wikiTitle?: string }> {
  const slug = encodeURIComponent(title.replace(/ /g, "_"));
  const wikiUrl = `https://wiki.warframe.com/w/${slug}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  let parsed: { introducedText?: string; releaseDate?: string; pageFound: boolean };
  try {
    const response = await fetch(wikiUrl, { signal: controller.signal });
    const html = await response.text();
    parsed = extractReleaseDateFromHtml(html);
  } catch {
    parsed = { pageFound: false };
  } finally {
    clearTimeout(timeout);
  }

  return {
    wikiUrl,
    wikiTitle: title,
    ...parsed,
  };
}

async function searchWikiTitles(query: string): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const url = `https://wiki.warframe.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json() as { query?: { search?: Array<{ title?: string }> } };
    return (data.query?.search ?? [])
      .map((entry) => String(entry.title ?? "").trim())
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function buildSearchQueries(candidate: Candidate): string[] {
  const queries = [
    candidate.name,
    `"${candidate.name}"`,
  ];

  if (candidate.kind === "mods") {
    queries.push(`${candidate.name} mod`);
    if (candidate.compatName) queries.push(`${candidate.name} ${candidate.compatName} mod`);
  }

  if (candidate.kind === "arcanes") {
    queries.push(`${candidate.name} arcane`);
  }

  if (candidate.kind === "weapons") {
    queries.push(`${candidate.name} warframe`);
  }

  if (candidate.type) {
    queries.push(`${candidate.name} ${candidate.type}`);
  }

  return Array.from(new Set(queries.map((value) => value.trim()).filter(Boolean)));
}

function buildCandidateTitles(candidate: Candidate, searchTitles: string[]): string[] {
  const titles = [
    candidate.name,
    ...searchTitles,
  ];

  if (candidate.kind === "mods") {
    titles.push(`${candidate.name} (Mod)`);
  }

  return Array.from(new Set(titles.map((value) => value.trim()).filter(Boolean)));
}

async function fetchWikiResult(candidate: Candidate): Promise<{ wikiUrl: string; introducedText?: string; releaseDate?: string; pageFound: boolean; wikiTitle?: string }> {
  let best = await fetchWikiPage(candidate.name);
  if (hasReleaseDate(best.releaseDate)) return best;

  const searchTitles: string[] = [];
  for (const query of buildSearchQueries(candidate)) {
    const titles = await searchWikiTitles(query);
    for (const title of titles) searchTitles.push(title);
    if (searchTitles.length >= 10) break;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  for (const title of buildCandidateTitles(candidate, searchTitles).slice(0, 8)) {
    if (title === candidate.name) continue;
    const resolved = await fetchWikiPage(title);
    if (hasReleaseDate(resolved.releaseDate)) return resolved;
    if (!best.pageFound && resolved.pageFound) best = resolved;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  return best;
}

async function main() {
  const candidates = buildCandidates();
  const cache = new Map<string, Awaited<ReturnType<typeof fetchWikiResult>>>();
  const results: ResearchResult[] = [];

  for (const candidate of candidates) {
    const cacheKey = `${candidate.kind}:${candidate.name}:${candidate.type ?? ""}:${candidate.compatName ?? ""}`;
    let resolved = cache.get(cacheKey);
    if (!resolved) {
      resolved = await fetchWikiResult(candidate);
      cache.set(cacheKey, resolved);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    results.push({
      ...candidate,
      ...resolved,
    });

    if (results.length % 25 === 0) {
      console.log(`progress ${results.length}/${candidates.length}`);
    }
  }

  const resolved = results.filter((result) => hasReleaseDate(result.releaseDate));
  const unresolved = results.filter((result) => !hasReleaseDate(result.releaseDate));

  const outputPath = path.resolve("tmp/manual-release-date-research.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        counts: {
          totalCandidates: results.length,
          resolved: resolved.length,
          unresolved: unresolved.length,
        },
        resolved,
        unresolved,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(JSON.stringify({
    outputPath,
    totalCandidates: results.length,
    resolved: resolved.length,
    unresolved: unresolved.length,
  }, null, 2));
}

void main();
