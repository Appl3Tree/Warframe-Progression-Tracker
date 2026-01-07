import { useMemo } from "react";
import { useTrackerStore } from "../store/store";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";

type Row = {
    id: string;           // catalogId or special key
    label: string;        // display label
    value: number;        // current count
};

function NumberInput(props: {
    value: number;
    onChange: (next: number) => void;
}) {
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

export default function InventoryPanel() {
    const inventory =
        useTrackerStore((s) => s.state.inventory) ?? {
            credits: 0,
            voidTraces: 0,
            aya: 0,
            items: {}
        };

    const setCredits = useTrackerStore((s) => s.setCredits);
    const setVoidTraces = useTrackerStore((s) => s.setVoidTraces);
    const setAya = useTrackerStore((s) => s.setAya);
    const setItemCount = useTrackerStore((s) => s.setItemCount);

    const currencyRows = useMemo<Row[]>(() => {
        // Always include these three at the top as true currencies.
        const pinned: Row[] = [
            { id: "credits", label: "Credits", value: Number(inventory.credits ?? 0) },
            { id: "Void Traces", label: "Void Traces", value: Number(inventory.voidTraces ?? 0) },
            { id: "Aya", label: "Aya", value: Number(inventory.aya ?? 0) }
        ];

        // Then include all catalog-classified currencies (displayable only),
        // excluding anything already pinned by label to avoid duplicates.
        const pinnedLabels = new Set(pinned.map((p) => p.label));

        const derived = FULL_CATALOG.displayableCurrencyItemIds
            .map((cid) => {
                const rec = FULL_CATALOG.recordsById[cid as CatalogId];
                const label = rec.displayName;
                const value =
                    inventory.items[cid] ??
                    inventory.items[label] ??
                    0;

                return { id: cid, label, value };
            })
            .filter((r) => !pinnedLabels.has(r.label));

        // Sort derived currencies alphabetically, but keep pinned fixed on top.
        derived.sort((a, b) => a.label.localeCompare(b.label));

        return [...pinned, ...derived];
    }, [inventory.credits, inventory.voidTraces, inventory.aya, inventory.items]);

    const itemRows = useMemo<Row[]>(() => {
        const rows = FULL_CATALOG.displayableInventoryItemIds.map((cid) => {
            const rec = FULL_CATALOG.recordsById[cid as CatalogId];
            const label = rec.displayName;
            const value =
                inventory.items[cid] ??
                inventory.items[label] ??
                0;

            return { id: cid, label, value };
        });

        rows.sort((a, b) => a.label.localeCompare(b.label));
        return rows;
    }, [inventory.items]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">Inventory</div>
            <div className="text-sm text-slate-400 mt-1">
                Counts are used for “remaining” calculations and overlap farming.
                All catalog items are shown (0 by default).
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">Currencies</div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currencyRows.map((r) => (
                        <div
                            key={r.id}
                            className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold break-words">
                                    {r.label}
                                </div>

                                {/* Credits / Void Traces / Aya keep their dedicated setters */}
                                {r.id === "credits" ? (
                                    <NumberInput
                                        value={r.value}
                                        onChange={(n) => setCredits(n)}
                                    />
                                ) : r.id === "Void Traces" ? (
                                    <NumberInput
                                        value={r.value}
                                        onChange={(n) => setVoidTraces(n)}
                                    />
                                ) : r.id === "Aya" ? (
                                    <NumberInput
                                        value={r.value}
                                        onChange={(n) => setAya(n)}
                                    />
                                ) : (
                                    <NumberInput
                                        value={r.value}
                                        onChange={(n) => setItemCount(r.id, n)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">All Items</div>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {itemRows.map((r) => (
                        <div
                            key={r.id}
                            className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold break-words">
                                    {r.label}
                                </div>
                                <NumberInput
                                    value={r.value}
                                    onChange={(n) => setItemCount(r.id, n)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

