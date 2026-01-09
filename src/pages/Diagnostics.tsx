// src/pages/Diagnostics.tsx

import { useMemo } from "react";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../catalog/items/itemAcquisition";
import { RAW_SOURCES_MAP, getAllSourceLabels } from "../catalog/sources/sourceData";

function StatRow(props: { label: string; value: number | string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2">
            <div className="text-sm text-slate-300">{props.label}</div>
            <div className="font-mono text-sm text-slate-100">{props.value}</div>
        </div>
    );
}

function Box(props: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            <div className="mt-3 space-y-2">{props.children}</div>
        </div>
    );
}

function CodeList(props: { lines: string[]; emptyLabel?: string }) {
    const emptyLabel = props.emptyLabel ?? "None";
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 font-mono text-xs text-slate-100 whitespace-pre-wrap break-words">
            {props.lines.length === 0 ? emptyLabel : props.lines.join("\n")}
        </div>
    );
}

export default function Diagnostics() {
    const stats = FULL_CATALOG.stats;

    const sampleDisplayableItem = useMemo(() => {
        return FULL_CATALOG.displayableItemIds.length > 0
            ? FULL_CATALOG.displayableItemIds[0]
            : null;
    }, []);

    const acquisitionStats = useMemo(() => {
        const displayableItemIds = FULL_CATALOG.displayableItemIds as CatalogId[];

        let known = 0;
        let unknown = 0;

        const unknownSamples: string[] = [];
        const knownSamples: string[] = [];

        for (const cid of displayableItemIds) {
            const acq = getAcquisitionByCatalogId(cid);
            if (acq && Array.isArray(acq.sources) && acq.sources.length > 0) {
                known += 1;
                if (knownSamples.length < 20) {
                    const rec = FULL_CATALOG.recordsById[cid];
                    knownSamples.push(`${rec?.displayName ?? String(cid)} :: ${String(cid)}`);
                }
            } else {
                unknown += 1;
                if (unknownSamples.length < 20) {
                    const rec = FULL_CATALOG.recordsById[cid];
                    unknownSamples.push(`${rec?.displayName ?? String(cid)} :: ${String(cid)}`);
                }
            }
        }

        return {
            displayableItemCount: displayableItemIds.length,
            known,
            unknown,
            knownSamples,
            unknownSamples
        };
    }, []);

    const sourcesJsonIntegrity = useMemo(() => {
        const rawKeys = Object.keys(RAW_SOURCES_MAP);

        let keysTotal = rawKeys.length;
        let keysWithEntries = 0;

        const missingInItems: string[] = [];
        const presentInItems: string[] = [];

        for (const k of rawKeys) {
            const entries = RAW_SOURCES_MAP[k];
            if (Array.isArray(entries) && entries.length > 0) {
                keysWithEntries += 1;
            }

            const cid = `items:${k}` as CatalogId;
            const exists = Boolean(FULL_CATALOG.recordsById[cid]);

            if (!exists) {
                if (missingInItems.length < 30) missingInItems.push(k);
            } else {
                if (presentInItems.length < 10) presentInItems.push(k);
            }
        }

        missingInItems.sort((a, b) => a.localeCompare(b));

        const labels = getAllSourceLabels();

        return {
            keysTotal,
            keysWithEntries,
            missingKeyCount: missingInItems.length,
            missingInItems,
            presentInItems,
            sourceLabelCount: labels.length
        };
    }, []);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-lg font-semibold">Diagnostics</div>
                <div className="text-sm text-slate-400 mt-1">
                    Catalog build sanity checks and acquisition/source integrity checks.
                </div>
            </div>

            <Box title="Catalog Totals">
                <StatRow label="Total records (all sources)" value={stats.totalCount} />
                <StatRow label="Total displayable records (all sources)" value={stats.totalDisplayableCount} />

                <StatRow label="Items (all)" value={stats.countsBySource.items} />
                <StatRow label="Items (displayable)" value={stats.displayableCountsBySource.items} />

                <StatRow label="Mods (all)" value={stats.countsBySource.mods} />
                <StatRow label="Mods (displayable)" value={stats.displayableCountsBySource.mods} />

                <StatRow label="Modsets (all)" value={stats.countsBySource.modsets} />
                <StatRow label="Modsets (displayable)" value={stats.displayableCountsBySource.modsets} />

                <StatRow label="Rivens (all)" value={stats.countsBySource.rivens} />
                <StatRow label="Rivens (displayable)" value={stats.displayableCountsBySource.rivens} />

                <StatRow label="Moddescriptions (all)" value={stats.countsBySource.moddescriptions} />
                <StatRow
                    label="Moddescriptions (displayable)"
                    value={stats.displayableCountsBySource.moddescriptions}
                />
            </Box>

            <Box title="Missing Names">
                <StatRow label="Items missing name" value={stats.missingNameBySource.items} />
                <StatRow label="Mods missing name" value={stats.missingNameBySource.mods} />
                <StatRow label="Modsets missing name" value={stats.missingNameBySource.modsets} />
                <StatRow label="Rivens missing name" value={stats.missingNameBySource.rivens} />
                <StatRow label="Moddescriptions missing name" value={stats.missingNameBySource.moddescriptions} />
            </Box>

            <Box title="Acquisition Coverage (Items)">
                <StatRow label="Displayable items" value={acquisitionStats.displayableItemCount} />
                <StatRow label="Known acquisition (hand-authored + sources.json)" value={acquisitionStats.known} />
                <StatRow label="Unknown acquisition (fail-closed)" value={acquisitionStats.unknown} />

                <div className="text-sm text-slate-400 mt-2">Unknown acquisition samples (first 20)</div>
                <CodeList lines={acquisitionStats.unknownSamples} emptyLabel="None (ideal)" />

                <div className="text-sm text-slate-400 mt-2">Known acquisition samples (first 20)</div>
                <CodeList lines={acquisitionStats.knownSamples} emptyLabel="None" />
            </Box>

            <Box title="sources.json Integrity">
                <StatRow label="sources.json keys (total)" value={sourcesJsonIntegrity.keysTotal} />
                <StatRow label="sources.json keys with >=1 entry" value={sourcesJsonIntegrity.keysWithEntries} />
                <StatRow label="Distinct source labels" value={sourcesJsonIntegrity.sourceLabelCount} />

                <StatRow
                    label="sources.json keys missing in items.json (sampled)"
                    value={sourcesJsonIntegrity.missingInItems.length}
                />

                <div className="text-sm text-slate-400 mt-2">
                    Missing keys (first 30): these exist in sources.json but not as items:/Lotus/... CatalogIds.
                </div>
                <CodeList lines={sourcesJsonIntegrity.missingInItems} emptyLabel="None (ideal)" />

                <div className="text-sm text-slate-400 mt-2">Present keys samples (first 10)</div>
                <CodeList lines={sourcesJsonIntegrity.presentInItems} emptyLabel="None" />
            </Box>

            <Box title="Sanity Samples">
                <div className="text-sm text-slate-400">First displayable item id:</div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 font-mono text-sm text-slate-100">
                    {sampleDisplayableItem ?? "None"}
                </div>
            </Box>
        </div>
    );
}
