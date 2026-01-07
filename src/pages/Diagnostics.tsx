// src/pages/Diagnostics.tsx

import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";

function StatRow(props: { label: string; value: string | number }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
            <div className="text-sm text-slate-300">{props.label}</div>
            <div className="text-sm font-semibold text-slate-100">
                {props.value}
            </div>
        </div>
    );
}

function Section(props: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 text-lg font-semibold text-slate-100">
                {props.title}
            </div>
            {props.children}
        </div>
    );
}

export default function Diagnostics() {
    const stats = FULL_CATALOG.stats;

    const counts = stats.countsBySource;
    const displayableCounts = stats.displayableCountsBySource;
    const missing = stats.missingNameBySource;

    const firstDisplayableCurrency =
        FULL_CATALOG.displayableCurrencyItemIds.length > 0
            ? FULL_CATALOG.recordsById[
                  FULL_CATALOG.displayableCurrencyItemIds[0]
              ].displayName
            : "None";

    const firstDisplayableInventoryItem =
        FULL_CATALOG.displayableInventoryItemIds.length > 0
            ? FULL_CATALOG.recordsById[
                  FULL_CATALOG.displayableInventoryItemIds[0]
              ].displayName
            : "None";

    const firstDisplayableMod =
        FULL_CATALOG.displayableIdsBySource.mods.length > 0
            ? FULL_CATALOG.recordsById[
                  FULL_CATALOG.displayableIdsBySource.mods[0]
              ].displayName
            : "None";

    const firstDisplayableModSet =
        FULL_CATALOG.displayableIdsBySource.modsets.length > 0
            ? FULL_CATALOG.recordsById[
                  FULL_CATALOG.displayableIdsBySource.modsets[0]
              ].displayName
            : "None";

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-xl font-semibold text-slate-100">
                    Diagnostics
                </div>
                <div className="mt-1 text-sm text-slate-400">
                    This page reports reference-catalog loading and internal
                    sanity checks. It must not reflect user progress.
                </div>
            </div>

            <Section title="Catalog Sanity">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <StatRow
                        label="Total records (all sources)"
                        value={stats.totalCount}
                    />
                    <StatRow
                        label="Total displayable records"
                        value={stats.totalDisplayableCount}
                    />

                    <StatRow label="Items (items.json)" value={counts.items} />
                    <StatRow
                        label="Items displayable"
                        value={displayableCounts.items}
                    />

                    <StatRow label="Mods (mods.json)" value={counts.mods} />
                    <StatRow
                        label="Mods displayable"
                        value={displayableCounts.mods}
                    />

                    <StatRow
                        label="Mod Sets (modsets.json)"
                        value={counts.modsets}
                    />
                    <StatRow
                        label="Mod Sets displayable"
                        value={displayableCounts.modsets}
                    />

                    <StatRow label="Rivens (rivens.json)" value={counts.rivens} />
                    <StatRow
                        label="Rivens displayable"
                        value={displayableCounts.rivens}
                    />

                    <StatRow
                        label="Mod Descriptions (moddescriptions.json)"
                        value={counts.moddescriptions}
                    />
                    <StatRow
                        label="Mod Descriptions displayable"
                        value={displayableCounts.moddescriptions}
                    />

                    <StatRow
                        label="Currency-classified item records"
                        value={stats.currencyItemCount}
                    />
                    <StatRow
                        label="Currency-classified displayable items"
                        value={stats.displayableCurrencyItemCount}
                    />
                </div>

                <div className="mt-5">
                    <div className="mb-2 text-sm font-semibold text-slate-200">
                        Missing display names (record.name absent)
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <StatRow label="Items missing name" value={missing.items} />
                        <StatRow label="Mods missing name" value={missing.mods} />
                        <StatRow label="Mod Sets missing name" value={missing.modsets} />
                        <StatRow label="Rivens missing name" value={missing.rivens} />
                        <StatRow
                            label="Mod Descriptions missing name"
                            value={missing.moddescriptions}
                        />
                    </div>

                    <div className="mt-4 text-sm text-slate-400">
                        Notes:
                        <ul className="ml-5 mt-1 list-disc space-y-1">
                            <li>
                                Icons are not rendered. Icon-paths are only read
                                to classify currencies via{" "}
                                <span className="font-mono">
                                    /StoreIcons/Currency/
                                </span>
                                .
                            </li>
                            <li>
                                Catalog IDs are namespaced (
                                <span className="font-mono">source:path</span>)
                                to avoid collisions across datasets.
                            </li>
                            <li>
                                Records without names are intentionally excluded
                                from user-facing lists (
                                <span className="font-mono">isDisplayable=false</span>
                                ).
                            </li>
                        </ul>
                    </div>
                </div>
            </Section>

            <Section title="Catalog Quick Spot-Checks (displayable only)">
                <div className="text-sm text-slate-300">
                    These are intentionally limited samples, useful for confirming
                    the catalog is usable without dumping huge lists into the UI.
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <StatRow
                        label="First currency item (alphabetical)"
                        value={firstDisplayableCurrency}
                    />
                    <StatRow
                        label="First inventory item (alphabetical)"
                        value={firstDisplayableInventoryItem}
                    />
                    <StatRow label="First mod (alphabetical)" value={firstDisplayableMod} />
                    <StatRow
                        label="First mod set (alphabetical)"
                        value={firstDisplayableModSet}
                    />
                </div>
            </Section>
        </div>
    );
}

