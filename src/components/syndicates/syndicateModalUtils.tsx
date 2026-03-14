// Pure utility functions for SyndicateDetailsModal — cost calculations,
// checklist key helpers, and cost summary rendering.
// Extracted from SyndicateDetailsModal.tsx as part of Phase 5 file decomposition.

import type { SyndicateCostLine } from "../../domain/catalog/syndicates/syndicateVendorCatalog";

export function chipClass(): string {
    return "inline-flex items-center rounded-full border border-slate-700 bg-slate-950/30 px-2 py-0.5 text-xs text-slate-200";
}

export function formatCostLine(c: SyndicateCostLine): string {
    if (c.kind === "credits") return `${c.amount.toLocaleString()} Credits`;
    if (c.kind === "standing") return `${c.amount.toLocaleString()} Standing`;
    if (c.kind === "item") return `${c.qty.toLocaleString()}x ${c.name}`;
    if (c.kind === "currency") return `${c.amount.toLocaleString()} ${c.name}`;
    if (c.kind === "other") return c.amount === undefined ? c.label : `${c.amount.toLocaleString()} ${c.label}`;
    return "Unknown cost";
}

export function sumCosts(costs: SyndicateCostLine[]): {
    standing: number;
    credits: number;
    currencies: Record<string, number>;
    items: Record<string, number>;
    other: Record<string, number>;
} {
    let standing = 0;
    let credits = 0;
    const currencies: Record<string, number> = {};
    const items: Record<string, number> = {};
    const other: Record<string, number> = {};

    for (const c of costs) {
        if (!c) continue;
        if (c.kind === "standing") {
            standing += c.amount ?? 0;
        } else if (c.kind === "credits") {
            credits += c.amount ?? 0;
        } else if (c.kind === "currency") {
            const k = c.name ?? "Currency";
            currencies[k] = (currencies[k] ?? 0) + (c.amount ?? 0);
        } else if (c.kind === "item") {
            const k = c.name ?? "Item";
            items[k] = (items[k] ?? 0) + (c.qty ?? 0);
        } else if (c.kind === "other") {
            const k = c.label ?? "Other";
            other[k] = (other[k] ?? 0) + (c.amount ?? 0);
        }
    }

    return { standing, credits, currencies, items, other };
}

export function mergeCostSums(
    a: ReturnType<typeof sumCosts>,
    b: ReturnType<typeof sumCosts>
): ReturnType<typeof sumCosts> {
    const currencies: Record<string, number> = { ...a.currencies };
    const items: Record<string, number> = { ...a.items };
    const other: Record<string, number> = { ...a.other };

    for (const [k, v] of Object.entries(b.currencies)) currencies[k] = (currencies[k] ?? 0) + v;
    for (const [k, v] of Object.entries(b.items)) items[k] = (items[k] ?? 0) + v;
    for (const [k, v] of Object.entries(b.other)) other[k] = (other[k] ?? 0) + v;

    return {
        standing: a.standing + b.standing,
        credits: a.credits + b.credits,
        currencies,
        items,
        other
    };
}

export function countCostLineStanding(costs: SyndicateCostLine[]): number {
    let s = 0;
    for (const c of costs) {
        if (c?.kind === "standing") s += c.amount ?? 0;
    }
    return s;
}

export function renderCostSummaryBlocks(sum: ReturnType<typeof sumCosts>) {
    const currencyEntries = Object.entries(sum.currencies).sort((a, b) => a[0].localeCompare(b[0]));
    const itemEntries = Object.entries(sum.items).sort((a, b) => a[0].localeCompare(b[0]));
    const otherEntries = Object.entries(sum.other).sort((a, b) => a[0].localeCompare(b[0]));

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
                <span className={chipClass()}>
                    Standing: <span className="ml-1 font-mono">{sum.standing.toLocaleString()}</span>
                </span>
                <span className={chipClass()}>
                    Credits: <span className="ml-1 font-mono">{sum.credits.toLocaleString()}</span>
                </span>
            </div>

            {currencyEntries.length ? (
                <div className="flex flex-wrap gap-2">
                    {currencyEntries.map(([k, v]) => (
                        <span key={`cur-${k}`} className={chipClass()}>
                            {k}: <span className="ml-1 font-mono">{v.toLocaleString()}</span>
                        </span>
                    ))}
                </div>
            ) : null}

            {itemEntries.length ? (
                <div className="flex flex-wrap gap-2">
                    {itemEntries.map(([k, v]) => (
                        <span key={`item-${k}`} className={chipClass()}>
                            {k}: <span className="ml-1 font-mono">{v.toLocaleString()}</span>
                        </span>
                    ))}
                </div>
            ) : null}

            {otherEntries.length ? (
                <div className="flex flex-wrap gap-2">
                    {otherEntries.map(([k, v]) => (
                        <span key={`other-${k}`} className={chipClass()}>
                            {k}: <span className="ml-1 font-mono">{v.toLocaleString()}</span>
                        </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export function rankChecklistStorageKey(syndicateId: string): string {
    return `wfpt:syndicateRankChecklist:${syndicateId}`;
}

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function canUseLocalStorage(): boolean {
    try {
        if (typeof window === "undefined") return false;
        if (!window.localStorage) return false;
        const k = "__wfpt_ls_test__";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
        return true;
    } catch {
        return false;
    }
}

export function normalizeChecklistKey(s: string): string {
    return String(s ?? "").trim().replace(/\s+/g, " ");
}

export function checklistKeyForCost(toRank: number, c: SyndicateCostLine): string {
    // Stable enough for your use: rank gate + cost signature.
    // If you later rename items in catalog, this will intentionally create a new checkbox.
    const kind = (c as any)?.kind ?? "unknown";
    if (kind === "standing") return normalizeChecklistKey(`to:${toRank}::standing::${(c as any)?.amount ?? 0}`);
    if (kind === "credits") return normalizeChecklistKey(`to:${toRank}::credits::${(c as any)?.amount ?? 0}`);
    if (kind === "currency") return normalizeChecklistKey(`to:${toRank}::currency::${(c as any)?.name ?? "Currency"}::${(c as any)?.amount ?? 0}`);
    if (kind === "item") return normalizeChecklistKey(`to:${toRank}::item::${(c as any)?.name ?? "Item"}::${(c as any)?.qty ?? 0}`);
    if (kind === "other") return normalizeChecklistKey(`to:${toRank}::other::${(c as any)?.label ?? "Other"}::${(c as any)?.amount ?? ""}`);
    return normalizeChecklistKey(`to:${toRank}::unknown::${formatCostLine(c)}`);
}

export function checklistRowClass(checked: boolean): string {
    return checked
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
        : "border-slate-700 bg-slate-950/30 text-slate-200 hover:bg-slate-900/30";
}
