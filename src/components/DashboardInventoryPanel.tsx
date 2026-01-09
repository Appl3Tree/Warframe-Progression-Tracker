import { useMemo } from "react";
import { useTrackerStore } from "../store/store";
import { canAccessCatalogItem } from "../domain/logic/plannerEngine";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";

type NeedLine = {
    catalogId: CatalogId;
    itemName: string;
    totalNeed: number;
    have: number;
    remaining: number;
    neededFor: Array<{ syndicateName: string; rankTitle: string; need: number }>;
};

function normalize(s: string): string {
    return s.trim().toLowerCase();
}

function resolveToCatalogId(keyOrName: string): CatalogId | null {
    const raw = String(keyOrName ?? "").trim();
    if (!raw) return null;

    // 1) If it's already a catalog id, accept it.
    if (FULL_CATALOG.recordsById[raw as CatalogId]) {
        return raw as CatalogId;
    }

    // 2) Otherwise treat it like a display name and resolve via name index.
    const nameKey = normalize(raw);
    const matches = FULL_CATALOG.nameIndex?.[nameKey] ?? [];
    const cid = matches[0] as CatalogId | undefined;

    return cid ?? null;
}

export default function DashboardInventoryPanel() {
    const setActivePage = useTrackerStore((s) => s.setActivePage);
    const syndicates = useTrackerStore((s) => s.state.syndicates ?? []);
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs?.completed ?? {});
    const counts = useTrackerStore((s) => s.state.inventory?.counts ?? {});

    const accessibleLines = useMemo<NeedLine[]>(() => {
        const needMap: Record<
            string,
            {
                catalogId: CatalogId;
                itemName: string;
                totalNeed: number;
                neededFor: Array<{ syndicateName: string; rankTitle: string; need: number }>;
            }
        > = {};

        for (const syn of syndicates) {
            const reqs = syn?.nextRankUp?.items ?? [];
            const rankTitle = syn?.rankLabel ?? "Next Rank";

            for (const r of reqs) {
                // Prefer label for display-name resolution; fall back to key.
                const labelOrKey = String(r.label ?? r.key ?? "").trim();
                const need = Number(r.count ?? 0);

                if (!labelOrKey || !Number.isFinite(need) || need <= 0) {
                    continue;
                }

                const cid = resolveToCatalogId(labelOrKey);
                if (!cid) {
                    continue;
                }

                // Only include items that are accessible now (fail-closed via acquisition/source catalogs).
                const access = canAccessCatalogItem(cid, completedPrereqs);
                if (!access.allowed) {
                    continue;
                }

                const rec = FULL_CATALOG.recordsById[cid];
                if (!rec?.displayName) {
                    continue;
                }

                const mapKey = String(cid);
                if (!needMap[mapKey]) {
                    needMap[mapKey] = {
                        catalogId: cid,
                        itemName: rec.displayName,
                        totalNeed: 0,
                        neededFor: []
                    };
                }

                needMap[mapKey].totalNeed += need;
                needMap[mapKey].neededFor.push({
                    syndicateName: syn.name,
                    rankTitle,
                    need
                });
            }
        }

        const out: NeedLine[] = Object.values(needMap).map((agg) => {
            const have = Number(counts[String(agg.catalogId)] ?? 0);
            return {
                catalogId: agg.catalogId,
                itemName: agg.itemName,
                totalNeed: agg.totalNeed,
                have,
                remaining: Math.max(0, agg.totalNeed - have),
                neededFor: agg.neededFor
            };
        });

        out.sort((a, b) => {
            if (a.remaining !== b.remaining) {
                return b.remaining - a.remaining;
            }
            return a.itemName.localeCompare(b.itemName);
        });

        return out.filter((l) => l.remaining > 0);
    }, [syndicates, completedPrereqs, counts]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Inventory (Work on Next)</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Only shows non-currency resources/components needed for accessible next-rank steps.
                        Items you cannot access yet are not shown.
                    </div>
                </div>

                <button
                    className="rounded-lg bg-slate-100 px-3 py-2 text-slate-900 text-sm font-semibold"
                    onClick={() => setActivePage("inventory")}
                >
                    Full Inventory
                </button>
            </div>

            {accessibleLines.length === 0 ? (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="text-sm font-semibold">Nothing actionable right now</div>
                    <div className="mt-1 text-sm text-slate-400">
                        This happens when either:
                        (1) you already have enough of every accessible progression item tracked, or
                        (2) the next required items are gated by prerequisites you have not marked complete.
                    </div>
                    <div className="mt-3">
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 text-sm hover:bg-slate-800"
                            onClick={() => setActivePage("prereqs")}
                        >
                            Review prerequisites to unlock more
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="text-sm font-semibold">Actionable items</div>

                    <div className="mt-2 grid grid-cols-1 gap-2">
                        {accessibleLines.map((l) => (
                            <div
                                key={String(l.catalogId)}
                                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold break-words">{l.itemName}</div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Need {l.totalNeed.toLocaleString()} total · Have {l.have.toLocaleString()} ·
                                            Remaining {l.remaining.toLocaleString()}
                                        </div>
                                    </div>

                                    <button
                                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                                        onClick={() => setActivePage("syndicates")}
                                    >
                                        View details
                                    </button>
                                </div>

                                <div className="mt-2 text-xs text-slate-400">
                                    Needed for:
                                    <ul className="mt-1 list-disc pl-5">
                                        {l.neededFor.map((n, idx) => (
                                            <li key={`${String(l.catalogId)}_${idx}`}>
                                                {n.syndicateName}: {n.rankTitle} ({n.need})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

