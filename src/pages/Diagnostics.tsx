// ===== FILE: src/pages/Diagnostics.tsx =====
// src/pages/Diagnostics.tsx

import { useMemo } from "react";
import { useTrackerStore } from "../store/store";
import { buildRequirementsSnapshot, buildFarmingSnapshot } from "../domain/logic/requirementEngine";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";
import { getAcquisitionByCatalogId } from "../catalog/items/itemAcquisition";
import { SOURCE_INDEX } from "../catalog/sources/sourceCatalog";
import { deriveWarframeItemsAcquisitionByCatalogId, deriveWarframeItemsPresenceByCatalogId } from "../catalog/items/acquisitionFromWarframeItems";

import { deriveDropDataAcquisitionByCatalogId } from "../catalog/items/acquisitionFromDropData";

function Section(props: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            {props.subtitle && <div className="text-sm text-slate-400 mt-1">{props.subtitle}</div>}
            <div className="mt-4">{props.children}</div>
        </div>
    );
}

function StatCard(props: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{props.label}</div>
            <div className="mt-1 font-mono text-xl text-slate-100">{props.value}</div>
        </div>
    );
}

type BlockingRow = {
    prereqId: string;
    blockedItemCount: number;
    blockedRemainingTotal: number;
    sampleItems: Array<{ name: string; remaining: number }>;
};

type CompletenessIssueRow = {
    catalogId: string;
    name: string;
    issue: "missing-acquisition" | "unknown-source";
    sources?: string[];
};

function isFiniteNumber(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v);
}

function fmtN(v: unknown): string {
    if (isFiniteNumber(v)) return v.toLocaleString();
    const n = Number(v);
    if (Number.isFinite(n)) return n.toLocaleString();
    return "0";
}

function fmtI(v: unknown): string {
    if (isFiniteNumber(v)) return Math.floor(v).toLocaleString();
    const n = Number(v);
    if (Number.isFinite(n)) return Math.floor(n).toLocaleString();
    return "0";
}

function downloadJson(filename: string, obj: unknown) {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

function snapshotStamp(): string {
    // YYYYMMDD-HHMMSS (local)
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
        [
            d.getFullYear(),
            pad(d.getMonth() + 1),
            pad(d.getDate())
        ].join("") +
        "-" +
        [
            pad(d.getHours()),
            pad(d.getMinutes()),
            pad(d.getSeconds())
        ].join("")
    );
}

/**
 * Fail-closed guard: these legacy ids should never appear in the completeness export.
 * If they do, throw hard so you catch regression immediately.
 */
function assertNoLegacyMissionRewardIds(obj: unknown): void {
    const legacy = [
        "data:missionreward/deimos/albrechts-laboratories",
        "data:missionreward/deimos/albrechts-laboratories/rotationc",
        "data:missionreward/saturn/lunaro",
        "data:missionreward/saturn/lunaro/rotationb"
    ];

    const haystack = JSON.stringify(obj);
    const hit = legacy.find((s) => haystack.includes(s));
    if (hit) {
        throw new Error(`Legacy missionreward id detected in completeness export: ${hit}`);
    }
}

const DEBUG_CATALOG_IDS = {
    orokinCell: "items:/Lotus/Types/Items/MiscItems/OrokinCell",
    neurode: "items:/Lotus/Types/Items/MiscItems/Neurode"
};

function isRecipeKey(catalogId: string): boolean {
    return catalogId.includes("/Lotus/Types/Recipes/");
}

export default function Diagnostics() {
    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const goals = useTrackerStore((s) => s.state.goals ?? []);
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const inventory = useTrackerStore((s) => s.state.inventory);

    const requirements = useMemo(() => {
        return buildRequirementsSnapshot({
            syndicates,
            goals,
            completedPrereqs,
            inventory,
            expandMode: "direct"
        });
    }, [syndicates, goals, completedPrereqs, inventory]);

    const farming = useMemo(() => {
        return buildFarmingSnapshot({
            requirements,
            completedPrereqs
        });
    }, [requirements, completedPrereqs]);

    const unknownAcquisition = useMemo(() => {
        const hidden = Array.isArray(farming?.hidden) ? farming.hidden : [];
        return hidden.filter((h) => h?.reason === "unknown-acquisition");
    }, [farming]);

    const unknownRecipeAcquisition = useMemo(() => {
        const hidden = Array.isArray(farming?.hidden) ? farming.hidden : [];
        return hidden.filter((h) => h?.reason === "unknown-recipe-acquisition");
    }, [farming]);

    // Cross-check: items flagged unknown-acquisition vs derived drop-data acquisition map (by catalogId)
    // IMPORTANT: This explicitly excludes /Lotus/Types/Recipes/ so it matches the UI subtitle.
    const unknownAcqCrossCheck = useMemo(() => {
        const hidden = Array.isArray(farming?.hidden) ? farming.hidden : [];
        const unknown = hidden
            .filter((h) => h?.reason === "unknown-acquisition")
            .filter((h) => !isRecipeKey(String(h?.key ?? "")));

        let dropMap: Record<string, any> = {};
        try {
            dropMap = deriveDropDataAcquisitionByCatalogId();
        } catch {
            dropMap = {};
        }

        const withDropData: Array<{ catalogId: string; name: string; dropSources: any[] }> = [];
        const withoutDropData: Array<{ catalogId: string; name: string }> = [];

        for (const h of unknown) {
            const cid = String(h?.key ?? "");
            const name = String(h?.name ?? "Unknown");

            const drop = dropMap[cid];
            const srcs = Array.isArray(drop?.sources) ? drop.sources : Array.isArray(drop) ? drop : [];

            if (srcs.length > 0) {
                withDropData.push({ catalogId: cid, name, dropSources: srcs });
            } else {
                withoutDropData.push({ catalogId: cid, name });
            }
        }

        withDropData.sort((a, b) => a.name.localeCompare(b.name));
        withoutDropData.sort((a, b) => a.name.localeCompare(b.name));

        return {
            unknownCount: unknown.length,
            withDropDataCount: withDropData.length,
            withoutDropDataCount: withoutDropData.length,
            withDropData,
            withoutDropData
        };
    }, [farming]);

    // Cross-check: items flagged unknown-recipe-acquisition vs derived drop-data acquisition map (by catalogId)
    // This is intentionally recipe-only (so you can see whether drop-data has anything for these blueprint/part recipes).
    const unknownRecipeAcqCrossCheck = useMemo(() => {
        const hidden = Array.isArray(farming?.hidden) ? farming.hidden : [];
        const unknown = hidden.filter((h) => h?.reason === "unknown-recipe-acquisition");

        let dropMap: Record<string, any> = {};
        try {
            dropMap = deriveDropDataAcquisitionByCatalogId();
        } catch {
            dropMap = {};
        }

        const withDropData: Array<{ catalogId: string; name: string; dropSources: any[] }> = [];
        const withoutDropData: Array<{ catalogId: string; name: string }> = [];

        for (const h of unknown) {
            const cid = String(h?.key ?? "");
            const name = String(h?.name ?? "Unknown");

            const drop = dropMap[cid];
            const srcs = Array.isArray(drop?.sources) ? drop.sources : Array.isArray(drop) ? drop : [];

            if (srcs.length > 0) {
                withDropData.push({ catalogId: cid, name, dropSources: srcs });
            } else {
                withoutDropData.push({ catalogId: cid, name });
            }
        }

        withDropData.sort((a, b) => a.name.localeCompare(b.name));
        withoutDropData.sort((a, b) => a.name.localeCompare(b.name));

        return {
            unknownCount: unknown.length,
            withDropDataCount: withDropData.length,
            withoutDropDataCount: withoutDropData.length,
            withDropData,
            withoutDropData
        };
    }, [farming]);

    const blocking = useMemo(() => {
        const rows = new Map<
            string,
            { blockedItemCount: number; blockedRemainingTotal: number; items: Array<{ name: string; remaining: number }> }
        >();

        const hidden = Array.isArray(farming?.hidden) ? farming.hidden : [];
        const blockedItems = hidden.filter((h) => h?.reason === "missing-prereqs");

        for (const it of blockedItems) {
            const missing = Array.isArray(it?.missingPrereqs) ? it.missingPrereqs : [];
            for (const pr of missing) {
                const key = String(pr);
                if (!rows.has(key)) {
                    rows.set(key, { blockedItemCount: 0, blockedRemainingTotal: 0, items: [] });
                }
                const agg = rows.get(key)!;
                agg.blockedItemCount += 1;
                agg.blockedRemainingTotal += Math.max(0, Math.floor(Number(it?.remaining ?? 0) || 0));
                agg.items.push({
                    name: String(it?.name ?? "Unknown"),
                    remaining: Math.max(0, Math.floor(Number(it?.remaining ?? 0) || 0))
                });
            }
        }

        const out: BlockingRow[] = Array.from(rows.entries()).map(([prereqId, v]) => {
            const items = [...v.items];
            items.sort((a, b) => {
                if (a.remaining !== b.remaining) return b.remaining - a.remaining;
                return a.name.localeCompare(b.name);
            });

            return {
                prereqId,
                blockedItemCount: v.blockedItemCount,
                blockedRemainingTotal: v.blockedRemainingTotal,
                sampleItems: items.slice(0, 5)
            };
        });

        out.sort((a, b) => {
            if (a.blockedItemCount !== b.blockedItemCount) return b.blockedItemCount - a.blockedItemCount;
            if (a.blockedRemainingTotal !== b.blockedRemainingTotal) return b.blockedRemainingTotal - a.blockedRemainingTotal;
            return a.prereqId.localeCompare(b.prereqId);
        });

        return out.slice(0, 15);
    }, [farming]);

    const completeness = useMemo(() => {
        const displayableInventoryIds = FULL_CATALOG.displayableInventoryItemIds;

        const missingAcq: CompletenessIssueRow[] = [];
        const unknownSourceRefs: CompletenessIssueRow[] = [];

        for (const id of displayableInventoryIds) {
            const rec = FULL_CATALOG.recordsById[id];
            const name = typeof rec?.displayName === "string" ? rec.displayName : String(id);

            const acq = getAcquisitionByCatalogId(id);

            if (!acq) {
                missingAcq.push({ catalogId: String(id), name, issue: "missing-acquisition" });
                continue;
            }

            const srcs = Array.isArray(acq.sources) ? acq.sources : [];
            if (srcs.length === 0) {
                missingAcq.push({ catalogId: String(id), name, issue: "missing-acquisition" });
                continue;
            }

            const unknown = srcs
                .map((s) => String(s))
                .filter((s) => !SOURCE_INDEX[s as any]);

            if (unknown.length > 0) {
                unknownSourceRefs.push({
                    catalogId: String(id),
                    name,
                    issue: "unknown-source",
                    sources: Array.from(new Set(unknown)).sort((a, b) => a.localeCompare(b))
                });
            }
        }

        missingAcq.sort((a, b) => a.name.localeCompare(b.name));
        unknownSourceRefs.sort((a, b) => a.name.localeCompare(b.name));

        return {
            displayableInventoryCount: displayableInventoryIds.length,
            missingAcquisitionCount: missingAcq.length,
            unknownSourceRefCount: unknownSourceRefs.length,
            missingAcq,
            unknownSourceRefs
        };
    }, []);
    
    const dropAcqMapStats = useMemo(() => {
        try {
            const m = deriveDropDataAcquisitionByCatalogId();
            return {
                catalogIdsWithSources: Object.keys(m).length
            };
        } catch {
            return { catalogIdsWithSources: 0 };
        }
    }, []);

    const dropMapSanity = useMemo(() => {
        let dropMap: Record<string, any> = {};
        try {
            dropMap = deriveDropDataAcquisitionByCatalogId();
        } catch {
            dropMap = {};
        }

        const rows = Object.entries(DEBUG_CATALOG_IDS).map(([k, catalogId]) => {
            const drop = dropMap[catalogId] ?? null;
            const dropSources: string[] = Array.isArray(drop?.sources) ? drop.sources.map(String) : [];

            const dropSourcesKnown: string[] = dropSources.filter((s) => Boolean(SOURCE_INDEX[s as any]));
            const dropSourcesUnknown: string[] = dropSources.filter((s) => !SOURCE_INDEX[s as any]);

            const catalogRec: any = (FULL_CATALOG as any)?.recordsById?.[catalogId] ?? null;
            const catalogName =
                typeof catalogRec?.displayName === "string"
                    ? catalogRec.displayName
                    : typeof catalogRec?.name === "string"
                        ? catalogRec.name
                        : String(catalogId);

            const acq = getAcquisitionByCatalogId(catalogId as any);
            const acqSources: string[] = Array.isArray((acq as any)?.sources) ? (acq as any).sources.map(String) : [];

            return {
                key: k,
                catalogId,
                catalogName,
                dropMapHasEntry: Boolean(drop),
                dropSourcesCount: dropSources.length,
                dropSourcesKnownCount: dropSourcesKnown.length,
                dropSourcesUnknownCount: dropSourcesUnknown.length,
                dropSourcesPreview: dropSources.slice(0, 25),
                dropSourcesUnknownPreview: dropSourcesUnknown.slice(0, 25),
                getAcqSourcesCount: acqSources.length,
                getAcqSourcesPreview: acqSources.slice(0, 25)
            };
        });

        return {
            debugCatalogIds: DEBUG_CATALOG_IDS,
            derivedDropMapKeys: Object.keys(dropMap).length,
            rows
        };
    }, []);

    const priceCoverage = useMemo(() => {
        const ids = FULL_CATALOG.displayableInventoryItemIds;

        let withBuildPrice = 0;
        let withMarketCost = 0;

        for (const id of ids) {
            const rec: any = FULL_CATALOG.recordsById[id];
            const raw: any = rec?.raw;

            const wfcd = raw?.rawWfcd ?? null;
            const lotus = raw?.rawLotus ?? null;

            const buildPrice = wfcd?.buildPrice ?? lotus?.buildPrice ?? null;
            const marketCost = wfcd?.marketCost ?? lotus?.marketCost ?? null;

            if (typeof buildPrice === "number" && Number.isFinite(buildPrice) && buildPrice > 0) {
                withBuildPrice += 1;
            }
            if (typeof marketCost === "number" && Number.isFinite(marketCost) && marketCost > 0) {
                withMarketCost += 1;
            }
        }

        return {
            displayableInventory: ids.length,
            withBuildPrice,
            withMarketCost
        };
    }, []);

    const farmingStats = farming?.stats ?? {
        actionableItemsWithKnownAcquisition: 0,
        hiddenForUnknownAcquisition: 0,
        hiddenForUnknownRecipeAcquisition: 0,
        hiddenForMissingPrereqs: 0,
        hiddenForNoAccessibleSources: 0,
        overlapSourceCount: 0
    };

    // Base export object (without meta). We’ll attach meta + stamp at download time.
    const completenessExportObject = useMemo(() => {
        return {
            stats: {
                displayableInventoryCount: completeness.displayableInventoryCount,
                missingAcquisitionCount: completeness.missingAcquisitionCount,
                unknownSourceRefCount: completeness.unknownSourceRefCount,
                dropDataCatalogIdsWithSources: dropAcqMapStats.catalogIdsWithSources
            },
            missingAcquisition: completeness.missingAcq.map((x) => ({ catalogId: x.catalogId, name: x.name })),
            unknownSourceRefs: completeness.unknownSourceRefs.map((x) => ({
                catalogId: x.catalogId,
                name: x.name,
                sources: x.sources ?? []
            })),
            dropMapSanity
        };
    }, [completeness, dropAcqMapStats, dropMapSanity]);

    return (
        <div className="space-y-6">
            <Section
                title="Snapshot Export"
                subtitle="Downloads the exact JSON used by the planner so you can run jq tests locally (no placeholders)."
            >
                <div className="flex flex-wrap gap-2">
                    <button
                        className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                        onClick={() => {
                            const stamp = snapshotStamp();
                            downloadJson(`requirements-snapshot-${stamp}.json`, requirements);
                        }}
                    >
                        Download requirements snapshot
                    </button>

                    <button
                        className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                        onClick={() => {
                            const stamp = snapshotStamp();
                            downloadJson(`farming-snapshot-${stamp}.json`, farming);
                        }}
                    >
                        Download farming snapshot
                    </button>

                    <button
                        className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                        onClick={() => {
                            const stamp = snapshotStamp();
                            downloadJson(`planner-snapshots-${stamp}.json`, {
                                requirements,
                                farming
                            });
                        }}
                    >
                        Download combined (requirements + farming)
                    </button>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                    Tip: after downloading, rename the newest files to{" "}
                    <span className="font-mono">requirements.json</span> and{" "}
                    <span className="font-mono">farming.json</span> so your jq commands stay stable.
                </div>
            </Section>

            <Section
                title="Drop-map sanity checks (Orokin Cell + Neurodes)"
                subtitle="Shows (1) what the drop-data layer returns, (2) which of those sources are missing from SOURCE_INDEX, and (3) what getAcquisitionByCatalogId ultimately returns."
            >
                <div className="flex flex-wrap gap-2">
                    <button
                        className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                        onClick={() => downloadJson("drop-map-sanity.json", dropMapSanity)}
                    >
                        Download sanity JSON
                    </button>

                    <button
                        className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                        onClick={() => {
                            const m = deriveDropDataAcquisitionByCatalogId();
                            downloadJson("drop-data-acquisition-map.json", m);
                        }}
                    >
                        Download drop-data acquisition map (JSON)
                    </button>
                </div>

                <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-slate-300">Show sanity JSON</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-200 font-mono">
                        {JSON.stringify(dropMapSanity, null, 2)}
                    </pre>
                </details>

                <div className="mt-3 text-xs text-slate-400">
                    CatalogIds with any sources from drop-data:{" "}
                    <span className="font-mono">{fmtI(dropAcqMapStats.catalogIdsWithSources)}</span>
                </div>
            </Section>

            <Section
                title="Catalog Completeness"
                subtitle="Strict checks for Phase 1.2 data coverage. This does not guess."
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <StatCard label="Displayable inventory items" value={fmtI(completeness.displayableInventoryCount)} />
                    <StatCard label="Missing acquisition" value={fmtI(completeness.missingAcquisitionCount)} />
                    <StatCard label="Unknown source references" value={fmtI(completeness.unknownSourceRefCount)} />
                    <StatCard
                        label="Total completeness issues"
                        value={fmtI(completeness.missingAcquisitionCount + completeness.unknownSourceRefCount)}
                    />
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                            Missing acquisition (first 50)
                        </div>
                        {completeness.missingAcq.length === 0 ? (
                            <div className="text-sm text-slate-400">None.</div>
                        ) : (
                            <ul className="list-disc pl-5 space-y-0.5 text-sm text-slate-200">
                                {completeness.missingAcq.slice(0, 50).map((x) => (
                                    <li key={`missing:${x.catalogId}`} className="break-words">
                                        <span className="font-semibold">{x.name}</span>{" "}
                                        <span className="text-slate-500 font-mono">({x.catalogId})</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {completeness.missingAcq.length > 50 && (
                            <div className="mt-2 text-xs text-slate-500">
                                Showing 50 of {fmtI(completeness.missingAcq.length)}.
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                            Unknown source refs (first 50)
                        </div>
                        {completeness.unknownSourceRefs.length === 0 ? (
                            <div className="text-sm text-slate-400">None.</div>
                        ) : (
                            <div className="space-y-2">
                                {completeness.unknownSourceRefs.slice(0, 50).map((x) => (
                                    <div
                                        key={`unknownsrc:${x.catalogId}`}
                                        className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                                    >
                                        <div className="text-sm font-semibold break-words">{x.name}</div>
                                        <div className="text-[11px] text-slate-500 mt-1 break-words">
                                            CatalogId: <span className="font-mono">{x.catalogId}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-2 break-words">
                                            Unknown sources:{" "}
                                            <span className="font-mono">{(x.sources ?? []).join(", ")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {completeness.unknownSourceRefs.length > 50 && (
                            <div className="mt-2 text-xs text-slate-500">
                                Showing 50 of {fmtI(completeness.unknownSourceRefs.length)}.
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                            Completeness export (JSON)
                        </div>
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                            onClick={() => {
                                const stamp = snapshotStamp();

                                // Attach meta at export time so each download is provably unique.
                                const obj = {
                                    meta: {
                                        stamp,
                                        mode: (import.meta as any)?.env?.MODE ?? null,
                                        gitSha: (import.meta as any)?.env?.VITE_GIT_SHA ?? null
                                    },
                                    ...completenessExportObject
                                };

                                // Fail closed if legacy ids ever regress back into the export.
                                assertNoLegacyMissionRewardIds(obj);

                                downloadJson(`catalog-completeness-${stamp}.json`, obj);
                            }}
                        >
                            Download catalog completeness JSON
                        </button>
                    </div>

                    <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-slate-300">Show JSON</summary>
                        <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-200 font-mono">
                            {JSON.stringify(completenessExportObject, null, 2)}
                        </pre>
                    </details>
                </div>
            </Section>

            <Section
                title="Catalog Price Coverage (Debug)"
                subtitle="Counts how many displayable inventory items actually have buildPrice and/or marketCost available in the merged catalog record."
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <StatCard label="Displayable inventory" value={fmtI(priceCoverage.displayableInventory)} />
                    <StatCard label="With buildPrice" value={fmtI(priceCoverage.withBuildPrice)} />
                    <StatCard label="With marketCost" value={fmtI(priceCoverage.withMarketCost)} />
                </div>
            </Section>

            <Section
                title="Unknown-acquisition cross-check (Drop-data)"
                subtitle="Compares the planner's unknown-acquisition list against the derived drop-data acquisition map, by catalogId. (Excludes /Lotus/Types/Recipes/*.)"
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <StatCard label="Unknown-acquisition items" value={fmtI(unknownAcqCrossCheck.unknownCount)} />
                    <StatCard label="Unknown but HAS drop-data" value={fmtI(unknownAcqCrossCheck.withDropDataCount)} />
                    <StatCard label="Unknown and NO drop-data" value={fmtI(unknownAcqCrossCheck.withoutDropDataCount)} />
                    <StatCard
                        label="Likely failure mode"
                        value={unknownAcqCrossCheck.withDropDataCount > 0 ? "merge bug" : "join bug"}
                    />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                        onClick={() => downloadJson("unknown-acq-crosscheck.json", unknownAcqCrossCheck)}
                    >
                        Download cross-check (JSON)
                    </button>
                </div>
            </Section>

            <Section
                title="Unknown-recipe-acquisition cross-check (Drop-data)"
                subtitle="Same cross-check, but for blueprint/recipe items (reason=unknown-recipe-acquisition). This tells you whether drop-data has any sources for these recipe ids at all."
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <StatCard label="Unknown recipe items" value={fmtI(unknownRecipeAcqCrossCheck.unknownCount)} />
                    <StatCard label="Recipe but HAS drop-data" value={fmtI(unknownRecipeAcqCrossCheck.withDropDataCount)} />
                    <StatCard label="Recipe and NO drop-data" value={fmtI(unknownRecipeAcqCrossCheck.withoutDropDataCount)} />
                    <StatCard
                        label="Likely failure mode"
                        value={unknownRecipeAcqCrossCheck.withDropDataCount > 0 ? "merge bug" : "missing sources"}
                    />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                        onClick={() => downloadJson("unknown-recipe-acq-crosscheck.json", unknownRecipeAcqCrossCheck)}
                    >
                        Download cross-check (JSON)
                    </button>
                </div>
            </Section>

            <Section
                title="Diagnostics"
                subtitle="Fail-closed analysis of what is blocking progress. This page does not guess."
            >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <StatCard label="Hidden (unknown acquisition)" value={fmtI(farmingStats.hiddenForUnknownAcquisition)} />
                    <StatCard
                        label="Hidden (recipe acquisition missing)"
                        value={fmtI(farmingStats.hiddenForUnknownRecipeAcquisition)}
                    />
                    <StatCard label="Hidden (missing prereqs)" value={fmtI(farmingStats.hiddenForMissingPrereqs)} />
                    <StatCard label="Hidden (no accessible sources)" value={fmtI(farmingStats.hiddenForNoAccessibleSources)} />
                    <StatCard label="Actionable items" value={fmtI(farmingStats.actionableItemsWithKnownAcquisition)} />
                    <StatCard label="Overlap sources" value={fmtI(farmingStats.overlapSourceCount)} />
                </div>
            </Section>

            <Section
                title="Top Blocking Prereqs"
                subtitle="Prereqs whose completion would unlock the largest number of currently blocked required items."
            >
                {blocking.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                        No prereq blockers detected (or all blockers are uncurated source gates).
                    </div>
                ) : (
                    <div className="space-y-2">
                        {blocking.map((b) => (
                            <div key={b.prereqId} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
                                    <div className="text-sm font-semibold break-words">{b.prereqId}</div>
                                    <div className="text-xs text-slate-400">
                                        Blocks {fmtI(b.blockedItemCount)} items, {fmtI(b.blockedRemainingTotal)} remaining total
                                    </div>
                                </div>

                                {b.sampleItems.length > 0 && (
                                    <div className="mt-2 text-xs text-slate-400">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                                            Examples
                                        </div>
                                        <ul className="list-disc pl-5 space-y-0.5">
                                            {b.sampleItems.map((x) => (
                                                <li key={`${b.prereqId}:${x.name}`} className="break-words">
                                                    {x.name} (remaining {fmtI(x.remaining)})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            <Section
                title="Unknown Acquisition (Debug)"
                subtitle="Non-blueprint items required by goals or syndicates that have no acquisition mapping at all."
            >
                {unknownAcquisition.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                        No unknown-acquisition items detected.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {unknownAcquisition.slice(0, 500).map((h) => (
                            <div key={String(h.key)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                <div className="text-sm font-semibold break-words">{String(h.name ?? "Unknown")}</div>
                                <div className="text-xs text-slate-400 mt-1">Remaining {fmtN(h.remaining)}</div>
                                <div className="text-[11px] text-slate-500 mt-1 break-words">
                                    CatalogId: <span className="font-mono">{String(h.key)}</span>
                                </div>
                            </div>
                        ))}

                        {unknownAcquisition.length > 500 && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-400">
                                Rendering capped at 500 items to keep the page responsive. Use the download buttons above for full
                                exports.
                            </div>
                        )}
                    </div>
                )}
            </Section>

            <Section
                title="Recipe/Blueprint Acquisition Missing (Debug)"
                subtitle="Blueprint/recipe items that should be purchasable/researchable/droppable, but are not yet mapped to acquisition sources."
            >
                {unknownRecipeAcquisition.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-sm text-slate-400">
                        No recipe/blueprint acquisition gaps detected.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {unknownRecipeAcquisition.slice(0, 500).map((h) => (
                            <div key={String(h.key)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                                <div className="text-sm font-semibold break-words">{String(h.name ?? "Unknown")}</div>
                                <div className="text-xs text-slate-400 mt-1">Remaining {fmtN(h.remaining)}</div>
                                <div className="text-[11px] text-slate-500 mt-1 break-words">
                                    CatalogId: <span className="font-mono">{String(h.key)}</span>
                                </div>
                            </div>
                        ))}

                        {unknownRecipeAcquisition.length > 500 && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-400">
                                Rendering capped at 500 items to keep the page responsive. Use the download buttons above for full
                                exports.
                            </div>
                        )}
                    </div>
                )}
            </Section>
        </div>
    );
}

