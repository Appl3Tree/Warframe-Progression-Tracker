// Syndicate grid helper utilities and small UI components.
// Extracted from SyndicatesGrid.tsx as part of Phase 5 file decomposition.

import { SY } from "../../domain/ids/syndicateIds";
import type { SyndicateVendorEntry } from "../../domain/catalog/syndicates/syndicateVendorCatalog";
import { CANONICAL_SYNDICATES, type CanonicalSyndicate, type Relationship } from "./syndicateData";

export function pillClass(active: boolean): string {
    return [
        "rounded-full border px-3 py-1 text-xs font-semibold",
        active
            ? "bg-slate-100 text-slate-900 border-slate-100"
            : "bg-slate-950/30 text-slate-200 border-slate-700 hover:bg-slate-900"
    ].join(" ");
}

export function parseIntSafeSigned(v: string): number {
    const s = String(v ?? "").trim();
    if (s === "" || s === "-") return 0;
    const n = Number(s);
    if (!Number.isFinite(n)) return 0;
    return Math.floor(n);
}

export function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

export function formatRange(min: number, max: number): string {
    return `${min.toLocaleString()} to ${max.toLocaleString()}`;
}

export function rankStandingRange(rank: number): { min: number; max: number } {
    if (rank >= 5) return { min: 0, max: 132_000 };
    if (rank === 4) return { min: 0, max: 99_000 };
    if (rank === 3) return { min: 0, max: 70_000 };
    if (rank === 2) return { min: 0, max: 44_000 };
    if (rank === 1) return { min: 0, max: 22_000 };
    if (rank === 0) return { min: -5_000, max: 5_000 };
    if (rank === -1) return { min: -22_000, max: 0 };
    return { min: -44_000, max: 0 };
}

export function hasRanksForSyndicate(canon: CanonicalSyndicate): boolean {
    if (canon.id === SY.CEPHALON_SIMARIS) return false;
    return true;
}

export function standingRangeForSyndicate(
    canon: CanonicalSyndicate,
    rank: number
): { min: number; max: number } | null {
    if (canon.id === SY.CEPHALON_SIMARIS) return { min: 0, max: 125_000 };
    if (canon.id === SY.NIGHTCAP) return { min: 0, max: 16 };
    return canon.model === "standing" || canon.model === "event-standing"
        ? rankStandingRange(rank)
        : null;
}

export function computeDailyStandingCap(mr: number | null): { cap: number; isEstimated: boolean } {
    const m = mr === null ? 0 : Math.max(0, Math.floor(mr));
    return { cap: (m * 500) + 16000, isEstimated: mr === null };
}

export function findCanonNameById(id: string): string {
    const c = CANONICAL_SYNDICATES.find((x) => x.id === id);
    return c ? c.name : id;
}

export function RelationshipPill(props: { label: string; ids: string[]; tone: "ally" | "oppose" | "enemy" }) {
    const toneCls =
        props.tone === "ally"
            ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200"
            : props.tone === "oppose"
                ? "border-amber-800/60 bg-amber-950/25 text-amber-200"
                : "border-rose-800/60 bg-rose-950/25 text-rose-200";

    if (!props.ids.length) return null;

    return (
        <div className="flex flex-col gap-1">
            <div className="text-[11px] text-slate-400">{props.label}</div>
            <div className="flex flex-wrap gap-2">
                {props.ids.map((id) => (
                    <span
                        key={id}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${toneCls}`}
                        title={id}
                    >
                        {findCanonNameById(id)}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function PlaceholderIcon(props: { className?: string }) {
    return (
        <svg
            className={props.className ?? "h-10 w-10"}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2.5c5.25 0 9.5 4.25 9.5 9.5S17.25 21.5 12 21.5 2.5 17.25 2.5 12 6.75 2.5 12 2.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
            />
            <path
                d="M7 13.5l2.2-2.2 2.1 2.1 3.5-3.5L17 11"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function pledgeIconButtonClass(active: boolean, disabled: boolean): string {
    const base = "rounded-xl border p-2 transition";
    if (disabled) {
        return `${base} border-slate-700 bg-slate-950/20 text-slate-400 opacity-50 cursor-not-allowed`;
    }
    if (active) {
        return [
            base,
            "border-emerald-300/50",
            "bg-emerald-400/10",
            "text-emerald-100",
            "ring-1 ring-emerald-300/30",
            "shadow-[0_0_0_1px_rgba(16,185,129,0.12)]"
        ].join(" ");
    }
    return `${base} border-slate-700 bg-slate-950/30 text-slate-200 hover:bg-slate-900`;
}

export function cardActionButtonClass(): string {
    return [
        "rounded-lg border border-white/15 bg-black/15 px-3 py-1.5 text-xs font-semibold text-inherit",
        "hover:bg-black/25",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/15"
    ].join(" ");
}

export function selectClass(): string {
    return "w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-sm text-white font-mono";
}

export function inputClass(): string {
    return "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-inherit font-mono";
}

// ===== Syndicate Pledge Simulation helpers (Additive model) =====

export type NetRow = { id: string; name: string; net: number };
export type NetTone = "pos" | "zero" | "neg";

export function computeNetRatesForPrimary(primaryCanon: CanonicalSyndicate[], pledgeSet: string[]): NetRow[] {
    const ids = primaryCanon.map((c) => c.id);
    const nameById = new Map(primaryCanon.map((c) => [c.id, c.name] as const));

    const netById: Record<string, number> = {};
    for (const id of ids) netById[id] = 0;

    if (pledgeSet.length === 0) {
        return ids
            .map((id) => ({ id, name: nameById.get(id) ?? id, net: 0 }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    const relById = new Map<string, Relationship>();
    for (const c of primaryCanon) relById.set(c.id, c.relationship ?? {});

    for (const p of pledgeSet) {
        if (p in netById) netById[p] += 1.0;

        const rel = relById.get(p) ?? {};
        for (const a of rel.allied ?? []) if (a in netById) netById[a] += 0.5;
        for (const o of rel.opposed ?? []) if (o in netById) netById[o] -= 0.5;
        for (const e of rel.enemy ?? []) if (e in netById) netById[e] -= 1.0;
    }

    const rows = ids.map((id) => ({
        id,
        name: nameById.get(id) ?? id,
        net: netById[id]
    }));

    rows.sort((a, b) => {
        if (b.net !== a.net) return b.net - a.net;
        return a.name.localeCompare(b.name);
    });

    return rows;
}

export function netTone(net: number): NetTone {
    if (net > 0) return "pos";
    if (net < 0) return "neg";
    return "zero";
}

export function netChipClass(t: NetTone): string {
    if (t === "pos") return "border-emerald-700/70 bg-emerald-950/30 text-emerald-200";
    if (t === "zero") return "border-amber-700/70 bg-amber-950/25 text-amber-200";
    return "border-rose-700/70 bg-rose-950/25 text-rose-200";
}

export function formatNet(net: number): string {
    const pct = Math.round(net * 100);
    if (pct > 0) return `+${pct}%`;
    return `${pct}%`;
}

// ===== Estimate standing to reach max rank =====

export function estimateStandingToMaxRank(rank: number, standing: number, maxRank = 5): number {
    if (rank >= maxRank) return 0;

    let total = 0;

    // Standing remaining within the current rank (to reach its max)
    const currentRange = rankStandingRange(rank);
    total += currentRange.max - standing;

    // Full bands for each subsequent rank up to (but not including) maxRank
    for (let r = rank + 1; r < maxRank; r++) {
        const rng = rankStandingRange(r);
        total += rng.max - rng.min;
    }

    return Math.max(0, total);
}

// ===== Nightcap: rank derived from cumulative mushrooms analyzed =====

export function nightcapRankFromMushrooms(mushrooms: number): number {
    if (mushrooms >= 16) return 5;
    if (mushrooms >= 12) return 4;
    if (mushrooms >= 6) return 3;
    if (mushrooms >= 2) return 2;
    if (mushrooms >= 1) return 1;
    return 0;
}

// ===== Conflict simulation: ranked combinations =====

export type RankedCombo = {
    ids: string[];
    nets: Record<string, number>;
    posCount: number;
    negCount: number;
    netSum: number;
};

export function computeRankedCombos(primaryCanon: CanonicalSyndicate[]): RankedCombo[] {
    const ids = primaryCanon.map((c) => c.id);
    const relById = new Map<string, Relationship>();
    for (const c of primaryCanon) relById.set(c.id, c.relationship ?? {});

    const results: RankedCombo[] = [];

    // Enumerate all subsets of size 0..3
    const n = ids.length;
    for (let mask = 0; mask < (1 << n); mask++) {
        const pledgeSet: string[] = [];
        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) pledgeSet.push(ids[i]);
        }
        if (pledgeSet.length > 3) continue;

        const netById: Record<string, number> = {};
        for (const id of ids) netById[id] = 0;

        for (const p of pledgeSet) {
            netById[p] += 1.0;
            const rel = relById.get(p) ?? {};
            for (const a of rel.allied ?? []) if (a in netById) netById[a] += 0.5;
            for (const o of rel.opposed ?? []) if (o in netById) netById[o] -= 0.5;
            for (const e of rel.enemy ?? []) if (e in netById) netById[e] -= 1.0;
        }

        let posCount = 0;
        let negCount = 0;
        let netSum = 0;
        for (const id of ids) {
            if (netById[id] > 0) posCount++;
            if (netById[id] < 0) negCount++;
            netSum += netById[id];
        }

        results.push({ ids: pledgeSet, nets: netById, posCount, negCount, netSum });
    }

    // Sort: most positives first, then fewest negatives, then highest net sum, then fewest pledges
    results.sort((a, b) => {
        if (b.posCount !== a.posCount) return b.posCount - a.posCount;
        if (a.negCount !== b.negCount) return a.negCount - b.negCount;
        if (b.netSum !== a.netSum) return b.netSum - a.netSum;
        return a.ids.length - b.ids.length;
    });

    return results;
}

// ===== Flat offering list from a vendor entry =====

export function flattenOfferings(entry: SyndicateVendorEntry | null): Array<{ vendorId: string; name: string }> {
    if (!entry) return [];
    const vendors = (entry as any).vendors as Array<{ id: string; offerings: Array<{ name: string }> }> | undefined;
    if (Array.isArray(vendors) && vendors.length > 0) {
        return vendors.flatMap((v) =>
            (v.offerings ?? []).map((o) => ({ vendorId: v.id, name: o.name }))
        );
    }
    return (entry.offerings ?? []).map((o) => ({ vendorId: "main", name: o.name }));
}

// ===== Collect unique currencies used by a vendor entry's offerings =====

export function collectCurrencyNames(entry: SyndicateVendorEntry | null): string[] {
    if (!entry) return [];
    const names = new Set<string>();

    function checkCosts(costs: Array<{ kind?: string; name?: string }> | undefined) {
        if (!costs) return;
        for (const c of costs) {
            if (c?.kind === "currency" && c.name) names.add(c.name);
        }
    }

    const vendors = (entry as any).vendors as Array<{ offerings: Array<{ costs: any[] }> }> | undefined;
    if (Array.isArray(vendors) && vendors.length > 0) {
        for (const v of vendors) {
            for (const o of v.offerings ?? []) checkCosts(o.costs);
        }
    } else {
        for (const o of entry.offerings ?? []) checkCosts((o as any).costs);
    }

    return [...names].sort();
}
