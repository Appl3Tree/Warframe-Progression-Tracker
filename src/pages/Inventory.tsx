import { useMemo, useState } from "react";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";
import { useTrackerStore } from "../store/store";

type Toggle = "all" | "currencies" | "noncurrencies";

function normalize(s: string): string {
    return s.trim().toLowerCase();
}

function Section(props: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            <div className="mt-3">{props.children}</div>
        </div>
    );
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

export default function Inventory() {
    const inventory = useTrackerStore((s) => s.state.inventory);
    const setItemCount = useTrackerStore((s) => s.setItemCount);
    const setCredits = useTrackerStore((s) => s.setCredits);
    const setAya = useTrackerStore((s) => s.setAya);
    const setVoidTraces = useTrackerStore((s) => s.setVoidTraces);

    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string>("__ALL__");
    const [toggle, setToggle] = useState<Toggle>("all");
    const [hideZero, setHideZero] = useState<boolean>(false);

    const allCategories = useMemo(() => {
        const set = new Set<string>();
        for (const id of FULL_CATALOG.displayableItemIds) {
            const rec = FULL_CATALOG.recordsById[id as CatalogId];
            for (const c of rec.categories) {
                set.add(c);
            }
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, []);

    const pinnedCurrencies = useMemo(() => {
        return [
            { id: "credits", label: "Credits", value: Number(inventory.credits ?? 0) },
            { id: "Void Traces", label: "Void Traces", value: Number(inventory.voidTraces ?? 0) },
            { id: "Aya", label: "Aya", value: Number(inventory.aya ?? 0) }
        ];
    }, [inventory.credits, inventory.voidTraces, inventory.aya]);

    const catalogItemRows = useMemo(() => {
        const q = normalize(query);

        const rows = FULL_CATALOG.displayableItemIds.map((id) => {
            const rec = FULL_CATALOG.recordsById[id as CatalogId];
            const label = rec.displayName;
            const value =
                inventory.items[id] ??
                inventory.items[label] ??
                0;

            return {
                id,
                label,
                value: Number(value ?? 0),
                isCurrency: Boolean(rec.isCurrency),
                categories: rec.categories
            };
        });

        // Filter: currency toggle
        const filtered1 = rows.filter((r) => {
            if (toggle === "currencies") return r.isCurrency;
            if (toggle === "noncurrencies") return !r.isCurrency;
            return true;
        });

        // Filter: category
        const filtered2 = filtered1.filter((r) => {
            if (category === "__ALL__") return true;
            return r.categories.includes(category);
        });

        // Filter: search
        const filtered3 = filtered2.filter((r) => {
            if (!q) return true;
            return normalize(r.label).includes(q);
        });

        // Filter: hide zeros
        const filtered4 = filtered3.filter((r) => {
            if (!hideZero) return true;
            return Number(r.value ?? 0) !== 0;
        });

        // Sort by label, stable
        filtered4.sort((a, b) => a.label.localeCompare(b.label));
        return filtered4;
    }, [inventory.items, query, category, toggle, hideZero]);

    const grouped = useMemo(() => {
        // When category is "__ALL__", group by category sections.
        // An item can appear in multiple categories. We will show it under each category it belongs to.
        // This avoids arbitrary "primary category" decisions.
        const groups: Record<string, typeof catalogItemRows> = {};

        if (category !== "__ALL__") {
            groups[category] = catalogItemRows;
            return groups;
        }

        for (const row of catalogItemRows) {
            const cats = row.categories.length ? row.categories : ["uncategorized"];
            for (const c of cats) {
                if (!groups[c]) groups[c] = [];
                groups[c].push(row);
            }
        }

        // Sort each group
        for (const k of Object.keys(groups)) {
            groups[k].sort((a, b) => a.label.localeCompare(b.label));
        }

        return groups;
    }, [catalogItemRows, category]);

    const groupKeys = useMemo(() => {
        return Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    }, [grouped]);

    return (
        <div className="space-y-6">
            <Section title="Inventory">
                <div className="text-sm text-slate-400">
                    Full catalog view grouped by category. Unnamed records are excluded by design.
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                        <div className="text-xs text-slate-400 mb-1">Search</div>
                        <input
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
                            placeholder="Search items..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="text-xs text-slate-400 mb-1">Category</div>
                        <select
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="__ALL__">All categories</option>
                            {allCategories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="text-xs text-slate-400 mb-1">View</div>
                        <select
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                            value={toggle}
                            onChange={(e) => setToggle(e.target.value as Toggle)}
                        >
                            <option value="all">All</option>
                            <option value="currencies">Currencies</option>
                            <option value="noncurrencies">Non-currencies</option>
                        </select>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={hideZero}
                            onChange={(e) => setHideZero(e.target.checked)}
                        />
                        Hide zero counts
                    </label>
                </div>
            </Section>

            <Section title="Pinned Currencies">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {pinnedCurrencies.map((r) => (
                        <div
                            key={r.id}
                            className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold break-words">{r.label}</div>
                                {r.id === "credits" ? (
                                    <NumberInput value={r.value} onChange={(n) => setCredits(n)} />
                                ) : r.id === "Void Traces" ? (
                                    <NumberInput value={r.value} onChange={(n) => setVoidTraces(n)} />
                                ) : (
                                    <NumberInput value={r.value} onChange={(n) => setAya(n)} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {groupKeys.map((k) => (
                <Section key={k} title={k}>
                    {grouped[k].length === 0 ? (
                        <div className="text-sm text-slate-400">No matches.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {grouped[k].map((r) => (
                                <div
                                    key={`${k}:${r.id}`}
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
                    )}
                </Section>
            ))}
        </div>
    );
}

