import { useMemo, useState } from "react";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";
import { useTrackerStore } from "../store/store";

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

function Pill(props: { label: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            className={[
                "rounded-full px-3 py-1 text-xs border transition",
                props.selected
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "bg-transparent text-slate-200 border-slate-700 hover:border-slate-500"
            ].join(" ")}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
}

type Row = {
    id: CatalogId;
    label: string;
    value: number;
    isCurrency: boolean;
    categories: string[];
};

export default function Inventory() {
    const counts = useTrackerStore((s) => s.state.inventory?.counts ?? {});
    const setCount = useTrackerStore((s) => s.setCount);

    const [query, setQuery] = useState("");
    const [hideZero, setHideZero] = useState<boolean>(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const allCategories = useMemo(() => {
        const set = new Set<string>();
        for (const id of FULL_CATALOG.displayableItemIds as CatalogId[]) {
            const rec = FULL_CATALOG.recordsById[id];
            if (!rec?.displayName) continue;
            for (const c of rec.categories ?? []) {
                set.add(c);
            }
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, []);

    const currencyRows = useMemo<Row[]>(() => {
        const rows: Row[] = [];

        for (const id of FULL_CATALOG.displayableCurrencyItemIds as CatalogId[]) {
            const rec = FULL_CATALOG.recordsById[id];
            if (!rec?.displayName) continue;

            rows.push({
                id,
                label: rec.displayName,
                value: Number(counts[String(id)] ?? 0),
                isCurrency: true,
                categories: rec.categories ?? []
            });
        }

        rows.sort((a, b) => a.label.localeCompare(b.label));
        return rows;
    }, [counts]);

    const itemRows = useMemo<Row[]>(() => {
        const q = normalize(query);
        const selected = new Set(selectedCategories);

        const base: Row[] = (FULL_CATALOG.displayableItemIds as CatalogId[])
            .map((id) => {
                const rec = FULL_CATALOG.recordsById[id];
                if (!rec?.displayName) {
                    return null;
                }

                return {
                    id,
                    label: rec.displayName,
                    value: Number(counts[String(id)] ?? 0),
                    isCurrency: Boolean(rec.isCurrency),
                    categories: rec.categories ?? []
                } as Row;
            })
            .filter(Boolean) as Row[];

        const filtered1 = base.filter((r) => {
            // Inventory page shows everything; currencies get their own section below.
            return !r.isCurrency;
        });

        const filtered2 = filtered1.filter((r) => {
            if (selected.size === 0) return true;
            return r.categories.some((c) => selected.has(c));
        });

        const filtered3 = filtered2.filter((r) => {
            if (!q) return true;
            return normalize(r.label).includes(q);
        });

        const filtered4 = filtered3.filter((r) => {
            if (!hideZero) return true;
            return r.value !== 0;
        });

        filtered4.sort((a, b) => a.label.localeCompare(b.label));
        return filtered4;
    }, [counts, query, hideZero, selectedCategories]);

    const groupedByCategory = useMemo(() => {
        const selected = new Set(selectedCategories);
        const groups: Record<string, Row[]> = {};

        const categoriesToUse = selected.size > 0 ? Array.from(selected) : allCategories;

        for (const c of categoriesToUse) {
            groups[c] = [];
        }

        for (const r of itemRows) {
            for (const c of r.categories) {
                if (selected.size === 0) {
                    if (!groups[c]) groups[c] = [];
                    groups[c].push(r);
                } else if (selected.has(c)) {
                    groups[c].push(r);
                }
            }
        }

        for (const k of Object.keys(groups)) {
            groups[k].sort((a, b) => a.label.localeCompare(b.label));
        }

        return groups;
    }, [itemRows, selectedCategories, allCategories]);

    const groupKeys = useMemo(() => {
        return Object.keys(groupedByCategory).sort((a, b) => a.localeCompare(b));
    }, [groupedByCategory]);

    return (
        <div className="space-y-6">
            <Section title="Inventory">
                <div className="text-sm text-slate-400">
                    Full catalog grouped by category. Categories are toggle pills. Hide zero is supported.
                    Unnamed records are excluded.
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                        <div className="text-xs text-slate-400 mb-1">Search</div>
                        <input
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
                            placeholder="Search items..."
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

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="text-xs text-slate-400 mr-2">Categories</div>

                    <Pill
                        label={selectedCategories.length === 0 ? "All" : "Clear"}
                        selected={selectedCategories.length === 0}
                        onClick={() => setSelectedCategories([])}
                    />

                    {allCategories.map((c) => {
                        const selected = selectedCategories.includes(c);
                        return (
                            <Pill
                                key={c}
                                label={c}
                                selected={selected}
                                onClick={() => {
                                    setSelectedCategories((prev) => {
                                        if (prev.includes(c)) {
                                            return prev.filter((x) => x !== c);
                                        }
                                        return [...prev, c];
                                    });
                                }}
                            />
                        );
                    })}
                </div>
            </Section>

            <Section title="Currencies">
                <div className="text-sm text-slate-400">
                    Currencies are defined strictly by catalog (<span className="font-mono">/StoreIcons/Currency/</span>).
                    Nothing is hardcoded as “special”.
                </div>

                {currencyRows.length === 0 ? (
                    <div className="mt-3 text-sm text-slate-400">No catalog currencies detected.</div>
                ) : (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {currencyRows.map((r) => (
                            <div
                                key={String(r.id)}
                                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-semibold break-words">{r.label}</div>
                                    <NumberInput
                                        value={r.value}
                                        onChange={(n) => setCount(String(r.id), n)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {groupKeys.map((k) => (
                <Section key={k} title={k}>
                    {groupedByCategory[k].length === 0 ? (
                        <div className="text-sm text-slate-400">No matches.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {groupedByCategory[k].map((r) => (
                                <div
                                    key={`${k}:${String(r.id)}`}
                                    className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-semibold break-words">{r.label}</div>
                                        <NumberInput
                                            value={r.value}
                                            onChange={(n) => setCount(String(r.id), n)}
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

