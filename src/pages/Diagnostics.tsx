import { useMemo } from "react";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";

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

export default function Diagnostics() {
    const stats = FULL_CATALOG.stats;

    const sampleDisplayableItem = useMemo(() => {
        return FULL_CATALOG.displayableItemIds.length > 0
            ? FULL_CATALOG.displayableItemIds[0]
            : null;
    }, []);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-lg font-semibold">Diagnostics</div>
                <div className="text-sm text-slate-400 mt-1">
                    Catalog build sanity checks and counts.
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
                <StatRow label="Moddescriptions (displayable)" value={stats.displayableCountsBySource.moddescriptions} />
            </Box>

            <Box title="Missing Names">
                <StatRow label="Items missing name" value={stats.missingNameBySource.items} />
                <StatRow label="Mods missing name" value={stats.missingNameBySource.mods} />
                <StatRow label="Modsets missing name" value={stats.missingNameBySource.modsets} />
                <StatRow label="Rivens missing name" value={stats.missingNameBySource.rivens} />
                <StatRow label="Moddescriptions missing name" value={stats.missingNameBySource.moddescriptions} />
            </Box>

            <Box title="Sanity Samples">
                <div className="text-sm text-slate-400">
                    First displayable item id:
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 font-mono text-sm text-slate-100">
                    {sampleDisplayableItem ?? "None"}
                </div>
            </Box>
        </div>
    );
}

