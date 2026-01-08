import { useMemo, useState } from "react";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";
import { useTrackerStore } from "../store/store";

function normalize(s: string): string {
    return s.trim().toLowerCase();
}

function NumberInput(props: { value: number; onChange: (next: number) => void }) {
    return (
        <input
            type="number"
            className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100 text-sm"
            value={Number(props.value ?? 0)}
            onChange={(e) => props.onChange(parseInt(e.target.value || "0", 10))}
            min={0}
        />
    );
}

export default function DashboardInventoryPanel() {
    const inventory = useTrackerStore((s) => s.state.inventory);
    const setItemCount = useTrackerStore((s) => s.setItemCount);
    const setActivePage = useTrackerStore((s) => s.setActivePage);

    const [query, setQuery] = useState("");
    const [hideZero, setHideZero] = useState(false);

    const rows = useMemo(() => {
        const q = normalize(query);

        const ids = FULL_CATALOG.displayableInventoryItemIds;

        const filtered = ids
            .map((id) => {
                const rec = FULL_CATALOG.recordsById[id as CatalogId];
                const cats = rec.categories ?? [];
                const isResourceOrComponent =
                    cats.includes("resource") || cats.includes("component");

                if (!isResourceOrComponent) {
                    return null;
                }

                const label = rec.displayName;
                const value =
                    inventory.items[id] ??
                    inventory.items[label] ??
                    0;

                return {
                    id,
                    label,
                    value: Number(value ?? 0)
                };
            })
            .filter((x): x is { id: string; label: string; value: number } => Boolean(x));

        const filtered2 = filtered.filter((r) => {
            if (!q) return true;
            return normalize(r.label).includes(q);
        });

        const filtered3 = filtered2.filter((r) => {
            if (!hideZero) return true;
            return r.value !== 0;
        });

        filtered3.sort((a, b) => a.label.localeCompare(b.label));
        return filtered3;
    }, [inventory.items, query, hideZero]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Inventory (Resources & Components)</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Quick entry for common materials used by requirements and goals.
                    </div>
                </div>

                <button
                    className="rounded-lg bg-slate-100 px-3 py-2 text-slate-900 text-sm font-semibold"
                    onClick={() => setActivePage("inventory")}
                >
                    Open Full Inventory
                </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
                <div>
                    <div className="text-xs text-slate-400 mb-1">Search</div>
                    <input
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
                        placeholder="Search resources/components..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={hideZero}
                            onChange={(e) => setHideZero(e.target.checked)}
                        />
                        Hide zero counts
                    </label>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {rows.map((r) => (
                    <div
                        key={r.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold break-words">{r.label}</div>
                            <NumberInput
                                value={r.value}
                                onChange={(n) => setItemCount(r.id, n)}
                            />
                        </div>
                    </div>
                ))}

                {rows.length === 0 && (
                    <div className="text-sm text-slate-400">
                        No matching resources/components.
                    </div>
                )}
            </div>
        </div>
    );
}

