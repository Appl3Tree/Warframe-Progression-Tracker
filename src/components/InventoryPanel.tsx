import { useMemo } from "react";
import { useTrackerStore } from "../store/store";

/**
 * Legacy panel kept for convenience; the primary inventory experience is the
 * Inventory page. This panel is intentionally minimal and uses canonical
 * catalog keys only.
 */
export default function InventoryPanel() {
    const inventory = useTrackerStore((s) => s.state.inventory);

    const touchedRows = useMemo(() => {
        const entries = Object.entries(inventory.counts ?? {});
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        return entries.slice(0, 12);
    }, [inventory.counts]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Inventory (Quick View)</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Credits and Platinum are tracked separately. All other counts are keyed by catalog id/path.
                    </div>
                </div>

                <div className="text-right text-sm text-slate-300">
                    <div>Credits: {Number(inventory.credits ?? 0).toLocaleString()}</div>
                    <div>Platinum: {Number(inventory.platinum ?? 0).toLocaleString()}</div>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm font-semibold">Recently Touched Items</div>
                {touchedRows.length === 0 ? (
                    <div className="mt-2 text-sm text-slate-400">No item counts set yet.</div>
                ) : (
                    <div className="mt-2 space-y-1 text-sm">
                        {touchedRows.map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between gap-3">
                                <span className="truncate text-slate-300">{key}</span>
                                <span className="font-mono text-slate-100">{Number(value).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

