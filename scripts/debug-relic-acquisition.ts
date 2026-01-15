// ===== FILE: scripts/debug-relic-acquisition.ts =====

import { FULL_CATALOG } from "../src/domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../src/catalog/items/itemAcquisition";
import * as SourceMod from "../src/catalog/sources/sourceCatalog";

type SourceLike = { id: string; label: string };
type RawSourceLike = { id: string; label: string };

function normalizeSpaces(s: string): string {
    return (s ?? "").replace(/\s+/g, " ").trim();
}

function isArray(v: unknown): v is any[] {
    return Array.isArray(v);
}

function relicKeyFromDisplayName(displayName: string): string | null {
    const raw = normalizeSpaces(displayName);

    // Accept both styles:
    // - "Axi A1 Exceptional"
    // - "Axi A1 Relic"
    // - "Neo T10 Relic (Radiant)"
    const m = raw.match(/\b(Lith|Meso|Neo|Axi)\b\s+([A-Za-z0-9]+)\b/i);
    if (!m) return null;

    const tier = m[1].toLowerCase();
    const code = m[2].toLowerCase();

    // Guard against junk like "Axi Relic"
    if (!code || code === "relic") return null;

    return `${tier} ${code}`;
}

function buildSourceLabelIndex(): Map<string, string> {
    const idx = new Map<string, string>();

    // Try SOURCES first
    const sourcesMaybe = (SourceMod as any).SOURCES;
    if (isArray(sourcesMaybe)) {
        for (const s of sourcesMaybe as SourceLike[]) {
            const id = typeof s?.id === "string" ? s.id : "";
            const label = typeof s?.label === "string" ? s.label : "";
            if (!id || !label) continue;
            if (!idx.has(id)) idx.set(id, label);
        }
        return idx;
    }

    // Fall back to SOURCE_CATALOG if present (RawSource list)
    const rawMaybe = (SourceMod as any).SOURCE_CATALOG;
    if (isArray(rawMaybe)) {
        for (const s of rawMaybe as RawSourceLike[]) {
            const id = typeof s?.id === "string" ? s.id : "";
            const label = typeof s?.label === "string" ? s.label : "";
            if (!id || !label) continue;
            if (!idx.has(id)) idx.set(id, label);
        }
        return idx;
    }

    return idx;
}

function pickRelicNamesToCheck(limit: number): { id: string; name: string; relicKey: string }[] {
    const out: { id: string; name: string; relicKey: string }[] = [];

    for (const cid of FULL_CATALOG.displayableItemIds as any[]) {
        const rec: any = (FULL_CATALOG as any).recordsById[cid];
        const name = typeof rec?.displayName === "string" ? rec.displayName : "";
        if (!name) continue;

        const key = relicKeyFromDisplayName(name);
        if (!key) continue;

        // Focus on Axi first (matches what you pasted), but you can remove this later.
        if (!/^axi\s+/i.test(key)) continue;

        out.push({ id: String(cid), name, relicKey: key });
        if (out.length >= limit) break;
    }

    return out;
}

function printAcqDebug(row: { id: string; name: string; relicKey: string }, sourceLabels: Map<string, string>): void {
    const acq = getAcquisitionByCatalogId(row.id as any);

    if (!acq || !Array.isArray(acq.sources) || acq.sources.length === 0) {
        console.log(`NO ACQ: ${row.name}  [key=${row.relicKey}]`);
        return;
    }

    const preview = acq.sources.slice(0, 12);
    console.log(`OK: ${row.name}  [key=${row.relicKey}] sources=${acq.sources.length}`);

    for (const sid of preview) {
        const label = sourceLabels.get(sid) ?? "(unknown source id)";
        console.log(`    - ${sid} :: ${label}`);
    }

    if (acq.sources.length > preview.length) {
        console.log(`    … +${acq.sources.length - preview.length} more`);
    }

    const unknown = preview.filter((sid) => !sourceLabels.has(sid));
    if (unknown.length > 0) {
        console.log(`    WARNING: ${unknown.length} preview sources not found in source catalog (example: ${unknown[0]})`);
    }
}

function main(): void {
    const sourceLabels = buildSourceLabelIndex();
    console.log(`source labels loaded: ${sourceLabels.size}`);

    const samples = pickRelicNamesToCheck(40);
    console.log(`relic samples: ${samples.length}`);

    for (const r of samples) {
        printAcqDebug(r, sourceLabels);
    }
}

main();

