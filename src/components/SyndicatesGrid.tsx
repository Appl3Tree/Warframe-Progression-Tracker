// ===== FILE: src/components/SyndicatesGrid.tsx =====
import React, { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import { SY } from "../domain/ids/syndicateIds";
import type { SyndicateState } from "../domain/types";
import SyndicateDetailsModal from "./SyndicateDetailsModal";
import { getSyndicateVendorEntry } from "../domain/catalog/syndicates/syndicateVendorCatalog";
import type { SyndicateVendorEntry } from "../domain/catalog/syndicates/syndicateVendorCatalog";
import { readOwnedMap, countOwned } from "../domain/syndicates/ownedOfferings";

type TabKey =
    | "all"
    | "primary"
    | "cetus"
    | "fortuna"
    | "necralisk"
    | "chrysalith"
    | "1999"
    | "misc"
    | "other";

type ProgressionModel = "standing" | "nightwave" | "no-standing" | "event-standing";

type Relationship = {
    allied?: string[];
    opposed?: string[];
    enemy?: string[];
};

type CanonicalSyndicate = {
    id: string;
    name: string;
    tab: Exclude<TabKey, "all">;
    model: ProgressionModel;
    detail: string;

    iconFile?: string;

    bg: string;
    fg: string;

    relationship?: Relationship;
    isFaction?: boolean;
    /** Maximum achievable rank. Defaults to 5 if not set. */
    maxRank?: number;
};

const TABS: Array<{ key: TabKey; label: string }> = [
    { key: "all", label: "All" },
    { key: "primary", label: "Primary" },
    { key: "cetus", label: "Cetus" },
    { key: "fortuna", label: "Fortuna" },
    { key: "necralisk", label: "Necralisk" },
    { key: "chrysalith", label: "Chrysalith" },
    { key: "1999", label: "1999" },
    { key: "misc", label: "Miscellaneous" },
    { key: "other", label: "Other" }
];

const CANONICAL_SYNDICATES: CanonicalSyndicate[] = [
    // Primary (Relay faction syndicates)
    {
        id: SY.STEEL_MERIDIAN,
        name: "Steel Meridian",
        tab: "primary",
        model: "standing",
        detail: "Fighters and refugees protecting the colonists of the Origin System. Allied with Red Veil.",
        iconFile: "120px-SteelIconPink.png",
        bg: "#2C3F46",
        fg: "#f9bc93",
        isFaction: true,
        relationship: {
            allied: [SY.RED_VEIL],
            opposed: [SY.NEW_LOKA],
            enemy: [SY.THE_PERRIN_SEQUENCE]
        }
    },
    {
        id: SY.ARBITERS_OF_HEXIS,
        name: "Arbiters of Hexis",
        tab: "primary",
        model: "standing",
        detail: "Scholars dedicated to pushing the Tenno beyond their limits and unlocking their true potential.",
        iconFile: "120px-ArbitarIconGrey.png",
        bg: "#374045",
        fg: "#cfe1e4",
        isFaction: true,
        relationship: {
            allied: [SY.CEPHALON_SUDA],
            opposed: [SY.THE_PERRIN_SEQUENCE],
            enemy: [SY.RED_VEIL]
        }
    },
    {
        id: SY.CEPHALON_SUDA,
        name: "Cephalon Suda",
        tab: "primary",
        model: "standing",
        detail: "A Cephalon obsessed with gathering and preserving all knowledge across the Origin System.",
        iconFile: "120px-CephalonIconLightGold.png",
        bg: "#3D375D",
        fg: "#fbfed0",
        isFaction: true,
        relationship: {
            allied: [SY.ARBITERS_OF_HEXIS],
            opposed: [SY.RED_VEIL],
            enemy: [SY.NEW_LOKA]
        }
    },
    {
        id: SY.THE_PERRIN_SEQUENCE,
        name: "The Perrin Sequence",
        tab: "primary",
        model: "standing",
        detail: "Corpus-affiliated merchants who believe trade and commerce will shape the future of humanity.",
        iconFile: "120px-PerrinSequenceIconBlue.png",
        bg: "#3D4963",
        fg: "#92dbff",
        isFaction: true,
        relationship: {
            allied: [SY.NEW_LOKA],
            opposed: [SY.ARBITERS_OF_HEXIS],
            enemy: [SY.STEEL_MERIDIAN]
        }
    },
    {
        id: SY.RED_VEIL,
        name: "Red Veil",
        tab: "primary",
        model: "standing",
        detail: "Radical purifiers who seek to cleanse the Origin System of Orokin corruption by any means necessary.",
        iconFile: "120px-RedVeilIconLightRed.png",
        bg: "#3D1839",
        fg: "#fe8a88",
        isFaction: true,
        relationship: {
            allied: [SY.STEEL_MERIDIAN],
            opposed: [SY.CEPHALON_SUDA],
            enemy: [SY.ARBITERS_OF_HEXIS]
        }
    },
    {
        id: SY.NEW_LOKA,
        name: "New Loka",
        tab: "primary",
        model: "standing",
        detail: "Naturalists devoted to restoring humanity to its pure, pre-Orokin state, free of all augmentation.",
        iconFile: "120px-LokaIconGreen.png",
        bg: "#2A3C2E",
        fg: "#c2ffbf",
        isFaction: true,
        relationship: {
            allied: [SY.THE_PERRIN_SEQUENCE],
            opposed: [SY.STEEL_MERIDIAN],
            enemy: [SY.CEPHALON_SUDA]
        }
    },

    // Cetus
    {
        id: SY.OSTRON,
        name: "Ostron",
        tab: "cetus",
        model: "standing",
        detail: "The people of Cetus, a trading post on the Plains of Eidolon. Fish, hunt, and complete bounties to earn standing.",
        iconFile: "120px-OstronSigil.png",
        bg: "#B74624",
        fg: "#e8ddaf"
    },
    {
        id: SY.THE_QUILLS,
        name: "The Quills",
        tab: "cetus",
        model: "standing",
        detail: "Mysterious servants of the Unum who deal in Eidolon Shards and Amp crafting components.",
        iconFile: "120px-TheQuillsSigil.png",
        bg: "#F7FACB",
        fg: "#b43419"
    },

    // Fortuna
    {
        id: SY.SOLARIS_UNITED,
        name: "Solaris United",
        tab: "fortuna",
        model: "standing",
        detail: "Debt-enslaved workers of Fortuna on Venus, fighting for freedom. Earn standing through bounties and conservation.",
        iconFile: "120px-SolarisUnited1.png",
        bg: "#5F3C0D",
        fg: "#e8ddaf"
    },
    {
        id: SY.VENTKIDS,
        name: "Ventkids",
        tab: "fortuna",
        model: "standing",
        detail: "Grind-obsessed youth who rule the Orb Vallis vents. Earn standing through K-Drive tricks and races.",
        iconFile: "120px-VentkidsIcon.png",
        bg: "#B97EF9",
        fg: "#FFF58F"
    },
    {
        id: SY.VOX_SOLARIS,
        name: "Vox Solaris",
        tab: "fortuna",
        model: "standing",
        detail: "The secret inner circle of Solaris United. Unlocks access to Operator Amps and Arcanes from Little Duck.",
        iconFile: "120px-VoxSolarisIcon.png",
        bg: "#F2E5A7",
        fg: "#4A2B18"
    },

    // Necralisk
    {
        id: SY.ENTRATI,
        name: "Entrati",
        tab: "necralisk",
        model: "standing",
        detail: "The Orokin family who built the Necralisk on Deimos. Earn standing through conservation, mining, and bounties.",
        iconFile: "120px-EntratiIcon.png",
        bg: "#4E5360",
        fg: "#FFC12F"
    },
    {
        id: SY.CAVIA,
        name: "Cavia",
        tab: "necralisk",
        model: "standing",
        detail: "Former Entrati test subjects exploring the Undercroft beneath Deimos. Associated with Duviri content.",
        iconFile: "120px-Cavia_Syndicate_Logo_1.png",
        bg: "#282624",
        fg: "#A5A394"
    },
    {
        id: SY.NECRALOID,
        name: "Necraloid",
        tab: "necralisk",
        model: "standing",
        detail: "Loid and Otak, the Necralisk’s keepers. Earn standing with Orokin Matrices to unlock Necramech parts and mods.",
        iconFile: "120px-NecraloidIcon.png",
        bg: "#333334",
        fg: "#BA9E5E",
        maxRank: 3
    },

    // Chrysalith
    {
        id: SY.THE_HOLDFASTS,
        name: "The Holdfasts",
        tab: "chrysalith",
        model: "standing",
        detail: "Void-touched survivors sheltering aboard the Zariman Ten Zero. Earn standing through Zariman bounties and activities.",
        iconFile: "120px-TheHoldfastsIcon.png",
        bg: "#21242e",
        fg: "#a9b5cc"
    },

    // 1999
    {
        id: SY.THE_HEX,
        name: "The Hex",
        tab: "1999",
        model: "standing",
        detail: "A crew of six navigating war-torn Höllvania in 1999. Earn standing through missions and activities in that era.",
        iconFile: "120px-HexIcon.png",
        bg: "#556033",
        fg: "#171b0e"
    },

    // Miscellaneous
    {
        id: SY.CONCLAVE,
        name: "Conclave",
        tab: "misc",
        model: "standing",
        detail: "PvP arena syndicate run by the Teshin. Earn standing through player-versus-player combat in the Conclave.",
        iconFile: "120px-ConclaveSigil.png",
        bg: "#000000",
        fg: "#ffffff"
    },
    {
        id: SY.CEPHALON_SIMARIS,
        name: "Cephalon Simaris",
        tab: "misc",
        model: "standing",
        detail: "The Synthesis Cephalon located in every Relay. Earn standing by scanning targets in the wild using a Synthesis Scanner.",
        iconFile: "120px-Simaris_Sigil_gold.png",
        bg: "#5F3C0D",
        fg: "#ebd18f"
    },

    // Other
    {
        id: SY.KAHLS_GARRISON,
        name: "Kahl’s Garrison",
        tab: "other",
        model: "no-standing",
        detail: "Kahl-175’s hideout. Complete weekly Break Narmer missions to earn Stock and unlock cosmetics and upgrades.",
        iconFile: "120px-GarrisonIcon.png",
        bg: "#0a2a1b",
        fg: "#a16042"
    },
    {
        id: SY.OPERATIONAL_SUPPLY,
        name: "Operational Supply",
        tab: "other",
        model: "event-standing",
        detail: "Limited-time event syndicate run by Operational Supply. Standing is earned during active operations only.",
        iconFile: "120px-OperationSyndicateSigil.png",
        bg: "#6A5574",
        fg: "#ffffff"
    },
    {
        id: SY.NIGHTWAVE,
        name: "Nightwave",
        tab: "other",
        model: "nightwave",
        detail: "Nora Night’s radio syndicate. Complete Acts to earn Standing and rank up for Nora’s Creds and exclusive rewards.",
        iconFile: "120px-NightwaveSyndicate.png",
        bg: "#6C1822",
        fg: "#F4ABAB",
        // 30 normal ranks + 150 prestige ranks
        maxRank: 180
    },
    {
        id: SY.NIGHTCAP,
        name: "Nightcap",
        tab: "other",
        model: "no-standing",
        detail: "A Solaris hidden in Fortuna's secret Airlock. Rank up by analyzing mushrooms found in the Deepmines — no daily Standing cap.",
        bg: "#1f2430",
        fg: "#cbd5e1"
    }
];

// Bundler-managed icon map. Vite resolves and fingerprints each file at build
// time, so URLs survive any deploy base-path configuration automatically.
// To add an icon: drop the PNG into src/assets/syndicates/ and set iconFile
// on the matching CANONICAL_SYNDICATES entry to the exact filename.
const _iconModules = import.meta.glob<string>(
    "../assets/syndicates/*.png",
    { eager: true, import: "default" }
);
const ICON_BY_FILENAME: Record<string, string> = {};
for (const [path, url] of Object.entries(_iconModules)) {
    const filename = path.split("/").pop()!;
    ICON_BY_FILENAME[filename] = url;
}

function syndicateIconUrl(iconFile?: string): string | null {
    if (!iconFile) return null;
    return ICON_BY_FILENAME[iconFile] ?? null;
}

function pillClass(active: boolean): string {
    return [
        "rounded-full border px-3 py-1 text-xs font-semibold",
        active
            ? "bg-slate-100 text-slate-900 border-slate-100"
            : "bg-slate-950/30 text-slate-200 border-slate-700 hover:bg-slate-900"
    ].join(" ");
}

function parseIntSafeSigned(v: string): number {
    const s = String(v ?? "").trim();
    if (s === "" || s === "-") return 0;
    const n = Number(s);
    if (!Number.isFinite(n)) return 0;
    return Math.floor(n);
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

function formatRange(min: number, max: number): string {
    return `${min.toLocaleString()} to ${max.toLocaleString()}`;
}

function rankStandingRange(rank: number): { min: number; max: number } {
    if (rank >= 5) return { min: 0, max: 132_000 };
    if (rank === 4) return { min: 0, max: 99_000 };
    if (rank === 3) return { min: 0, max: 70_000 };
    if (rank === 2) return { min: 0, max: 44_000 };
    if (rank === 1) return { min: 0, max: 22_000 };
    if (rank === 0) return { min: -5_000, max: 5_000 };
    if (rank === -1) return { min: -22_000, max: 0 };
    return { min: -44_000, max: 0 };
}

function hasRanksForSyndicate(canon: CanonicalSyndicate): boolean {
    if (canon.id === SY.CEPHALON_SIMARIS) return false;
    return true;
}

function standingRangeForSyndicate(
    canon: CanonicalSyndicate,
    rank: number
): { min: number; max: number } | null {
    if (canon.id === SY.CEPHALON_SIMARIS) return { min: 0, max: 125_000 };
    if (canon.id === SY.NIGHTCAP) return { min: 0, max: 16 };
    return canon.model === "standing" || canon.model === "event-standing"
        ? rankStandingRange(rank)
        : null;
}

function computeDailyStandingCap(mr: number | null): { cap: number; isEstimated: boolean } {
    const m = mr === null ? 0 : Math.max(0, Math.floor(mr));
    return { cap: (m * 500) + 16000, isEstimated: mr === null };
}

function findCanonNameById(id: string): string {
    const c = CANONICAL_SYNDICATES.find((x) => x.id === id);
    return c ? c.name : id;
}

function RelationshipPill(props: { label: string; ids: string[]; tone: "ally" | "oppose" | "enemy" }) {
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

function PlaceholderIcon(props: { className?: string }) {
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

function pledgeIconButtonClass(active: boolean, disabled: boolean): string {
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

function cardActionButtonClass(): string {
    return [
        "rounded-lg border border-white/15 bg-black/15 px-3 py-1.5 text-xs font-semibold text-inherit",
        "hover:bg-black/25",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/15"
    ].join(" ");
}

function selectClass(): string {
    return "w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-sm text-white font-mono";
}

function inputClass(): string {
    return "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-inherit font-mono";
}

// ===== Syndicate Pledge Simulation helpers (Additive model) =====

type NetRow = { id: string; name: string; net: number };
type NetTone = "pos" | "zero" | "neg";

function computeNetRatesForPrimary(primaryCanon: CanonicalSyndicate[], pledgeSet: string[]): NetRow[] {
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

function netTone(net: number): NetTone {
    if (net > 0) return "pos";
    if (net < 0) return "neg";
    return "zero";
}

function netChipClass(t: NetTone): string {
    if (t === "pos") return "border-emerald-700/70 bg-emerald-950/30 text-emerald-200";
    if (t === "zero") return "border-amber-700/70 bg-amber-950/25 text-amber-200";
    return "border-rose-700/70 bg-rose-950/25 text-rose-200";
}

function formatNet(net: number): string {
    const pct = Math.round(net * 100);
    if (pct > 0) return `+${pct}%`;
    return `${pct}%`;
}

// ===== Estimate standing to reach max rank =====

function estimateStandingToMaxRank(rank: number, standing: number, maxRank = 5): number {
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

function nightcapRankFromMushrooms(mushrooms: number): number {
    if (mushrooms >= 16) return 5;
    if (mushrooms >= 12) return 4;
    if (mushrooms >= 6) return 3;
    if (mushrooms >= 2) return 2;
    if (mushrooms >= 1) return 1;
    return 0;
}

// ===== Conflict simulation: ranked combinations =====

type RankedCombo = {
    ids: string[];
    nets: Record<string, number>;
    posCount: number;
    negCount: number;
    netSum: number;
};

function computeRankedCombos(primaryCanon: CanonicalSyndicate[]): RankedCombo[] {
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

function flattenOfferings(entry: SyndicateVendorEntry | null): Array<{ vendorId: string; name: string }> {
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

function collectCurrencyNames(entry: SyndicateVendorEntry | null): string[] {
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

export default function SyndicatesGrid() {
    const masteryRank = useTrackerStore((s) => s.state.player.masteryRank);

    const playerSyndicates = useTrackerStore((s) => s.state.syndicates) ?? [];
    const upsertSyndicate = useTrackerStore((s) => s.upsertSyndicate);

    const [activeTab, setActiveTab] = useState<TabKey>("primary");

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsSyndicateId, setDetailsSyndicateId] = useState<string>("");
    const [detailsTitle, setDetailsTitle] = useState<string>("");
    const [detailsInitialTab, setDetailsInitialTab] = useState<"ranks" | "offerings">("ranks");
    const [detailsInitialOwnedFilter, setDetailsInitialOwnedFilter] = useState<"all" | "owned" | "unowned">("all");
    const [detailsPlayerRank, setDetailsPlayerRank] = useState<number>(0);

    // Bump this when the modal closes to force re-read of localStorage for missing counts
    const [ownedRefreshKey, setOwnedRefreshKey] = useState(0);

    const [standingDraftById, setStandingDraftById] = useState<Record<string, string>>({});

    function openDetails(
        syndicateId: string,
        title: string,
        tab: "ranks" | "offerings",
        ownedFilter: "all" | "owned" | "unowned" = "all",
        playerRank = 0
    ) {
        setDetailsSyndicateId(syndicateId);
        setDetailsTitle(title);
        setDetailsInitialTab(tab);
        setDetailsInitialOwnedFilter(ownedFilter);
        setDetailsPlayerRank(playerRank);
        setDetailsOpen(true);
    }

    function closeDetails() {
        setDetailsOpen(false);
        setOwnedRefreshKey((k) => k + 1);
    }

    const overlayById = useMemo(() => {
        const m = new Map<string, SyndicateState>();
        for (const s of playerSyndicates ?? []) {
            if (s && typeof (s as any).id === "string") {
                m.set((s as any).id, s as any);
            }
        }
        return m;
    }, [playerSyndicates]);

    const primaryCanon = useMemo(() => CANONICAL_SYNDICATES.filter((c) => c.tab === "primary"), []);

    // Source-of-truth: pledged is stored in the SyndicateState row via upsertSyndicate.
    function setPledged(id: string, pledged: boolean) {
        const canon = primaryCanon.find((c) => c.id === id) ?? CANONICAL_SYNDICATES.find((c) => c.id === id);
        upsertSyndicate({
            id,
            name: canon?.name ?? id,
            pledged
        });
    }

    const pledgedCount = useMemo(() => {
        let n = 0;
        for (const c of primaryCanon) {
            const overlay = overlayById.get(c.id);
            if (overlay?.pledged) n++;
        }
        return n;
    }, [primaryCanon, overlayById]);

    const currentPledgedIds = useMemo(() => {
        const out: string[] = [];
        for (const c of primaryCanon) {
            const ov = overlayById.get(c.id);
            if (ov?.pledged) out.push(c.id);
        }
        return out;
    }, [primaryCanon, overlayById]);

    const pledgeNetNow = useMemo(() => {
        return computeNetRatesForPrimary(primaryCanon, currentPledgedIds);
    }, [primaryCanon, currentPledgedIds]);

    const netBuckets = useMemo(() => {
        const pos: NetRow[] = [];
        const zero: NetRow[] = [];
        const neg: NetRow[] = [];

        for (const r of pledgeNetNow) {
            const t = netTone(r.net);
            if (t === "pos") pos.push(r);
            else if (t === "zero") zero.push(r);
            else neg.push(r);
        }

        pos.sort((a, b) => b.net - a.net || a.name.localeCompare(b.name));
        zero.sort((a, b) => a.name.localeCompare(b.name));
        neg.sort((a, b) => a.net - b.net || a.name.localeCompare(b.name));

        return { pos, zero, neg };
    }, [pledgeNetNow]);

    // Conflict simulation: top recommendations from all 42 pledge combinations
    const rankedCombos = useMemo(() => computeRankedCombos(primaryCanon), [primaryCanon]);
    // Top 4 two-syndicate pairs from the algorithm (cross-chain pairs ranked by coverage)
    const topPairs = useMemo(
        () => rankedCombos.filter((c) => c.ids.length === 2).slice(0, 4),
        [rankedCombos]
    );

    function applyCombo(ids: string[]) {
        for (const c of primaryCanon) setPledged(c.id, false);
        for (const id of ids) setPledged(id, true);
    }

    const [simOpen, setSimOpen] = useState(false);

    const showPledgePanel = activeTab === "all" || activeTab === "primary";

    const rowsForTab = useMemo(() => {
        let list: CanonicalSyndicate[];

        if (activeTab === "all") list = [...CANONICAL_SYNDICATES];
        else list = CANONICAL_SYNDICATES.filter((c) => c.tab === activeTab);

        if (activeTab === "primary") return list;

        const copy = [...list];
        copy.sort((a, b) => a.name.localeCompare(b.name));
        return copy;
    }, [activeTab]);

    const { cap: dailyCapComputed, isEstimated: mrMissing } = computeDailyStandingCap(masteryRank);

    const detailsEntry = useMemo(() => {
        if (!detailsSyndicateId) return null;
        return getSyndicateVendorEntry(detailsSyndicateId);
    }, [detailsSyndicateId]);

    function commitStanding(canon: CanonicalSyndicate, range: { min: number; max: number } | null, raw: string) {
        const parsed = parseIntSafeSigned(raw);
        const clamped = range ? clamp(parsed, range.min, range.max) : Math.max(0, parsed);
        const patch: Parameters<typeof upsertSyndicate>[0] = {
            id: canon.id,
            name: canon.name,
            standing: clamped
        };
        // Nightcap rank is auto-derived from mushrooms analyzed
        if (canon.id === SY.NIGHTCAP) {
            patch.rank = nightcapRankFromMushrooms(clamped);
        }
        upsertSyndicate(patch);

        setStandingDraftById((prev) => {
            const next = { ...prev };
            delete next[canon.id];
            return next;
        });
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            className={pillClass(t.key === activeTab)}
                            onClick={() => setActiveTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="mt-3 flex flex-col gap-3">
                    <div className="text-xs text-slate-400">
                        {mrMissing ? (
                            <span>Daily Standing caps shown at minimum (MR 0). Add MR in the Profile panel to update caps.</span>
                        ) : (
                            <span>Daily Standing caps computed using your MR ({masteryRank}).</span>
                        )}
                    </div>

                    {showPledgePanel ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-slate-100">Primary Pledges</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Pledge to a syndicate to view the simulator. Toggle up to 3. ({pledgedCount}/3)</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <button
                                            className="rounded-full border border-slate-700 bg-slate-950/30 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900"
                                            type="button"
                                            onClick={() => setSimOpen((v) => !v)}
                                            aria-expanded={simOpen}
                                            title="Show recommended pledge combinations"
                                        >
                                            Hint
                                        </button>

                                        {simOpen ? (
                                            <div className="absolute right-0 mt-2 w-[440px] z-30 rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-xl">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="text-xs font-semibold text-slate-100">Pledge recommendations</div>
                                                    <button
                                                        className="shrink-0 rounded-lg border border-slate-700 bg-slate-950/30 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-slate-900"
                                                        type="button"
                                                        onClick={() => setSimOpen(false)}
                                                    >
                                                        Close
                                                    </button>
                                                </div>

                                                {/* Section 1: Triple allied chains */}
                                                <div className="mt-3">
                                                    <div className="text-[11px] font-semibold text-slate-300 mb-1">Triple-chain picks — max 3 syndicates, no swapping needed</div>
                                                    <div className="mb-2 text-[11px] text-slate-400">
                                                        Earning standing in any one chain member never hurts the other two. Pledge all three and rank each up to max at your own pace — the only syndicates that go negative are those in the opposite chain, which you never need.
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        {[
                                                            [SY.STEEL_MERIDIAN, SY.ARBITERS_OF_HEXIS, SY.CEPHALON_SUDA],
                                                            [SY.THE_PERRIN_SEQUENCE, SY.NEW_LOKA, SY.RED_VEIL]
                                                        ].map((chainIds, idx) => {
                                                            const currentSet = new Set(currentPledgedIds);
                                                            const isActive =
                                                                chainIds.length === currentPledgedIds.length &&
                                                                chainIds.every((id) => currentSet.has(id));
                                                            return (
                                                                <div
                                                                    key={`chain-${idx}`}
                                                                    className={[
                                                                        "flex items-center justify-between gap-2 rounded-lg border p-2",
                                                                        isActive
                                                                            ? "border-emerald-700/50 bg-emerald-950/20"
                                                                            : "border-slate-800 bg-slate-950/40"
                                                                    ].join(" ")}
                                                                >
                                                                    <div className="min-w-0 flex flex-wrap gap-1.5">
                                                                        {chainIds.map((id) => (
                                                                            <span
                                                                                key={id}
                                                                                className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/30 px-2 py-0.5 text-[11px] text-slate-200"
                                                                            >
                                                                                {findCanonNameById(id)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    {isActive ? (
                                                                        <span className="shrink-0 rounded-lg border border-emerald-700/50 bg-emerald-950/30 px-2.5 py-1 text-[11px] text-emerald-200">
                                                                            Active
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            className="shrink-0 rounded-lg border border-slate-700 bg-slate-950/30 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-slate-900"
                                                                            type="button"
                                                                            onClick={() => { applyCombo(chainIds); setSimOpen(false); }}
                                                                        >
                                                                            Apply
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Section 2: Top cross-chain pairs */}
                                                <div className="mt-3">
                                                    <div className="text-[11px] font-semibold text-slate-300 mb-1">Cross-chain pairs — broader rewards, requires swapping</div>
                                                    <div className="mb-2 text-[11px] text-slate-400">
                                                        These pairs cover more unique offerings than a single chain, but the two syndicates belong to opposing networks and slightly drain each other's standing. Swap between them regularly — rank one up, then switch focus to the other before it falls below 0. Recovering from negative ranks costs rare resources.
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        {topPairs.map((combo, idx) => {
                                                            const currentSet = new Set(currentPledgedIds);
                                                            const isActive =
                                                                combo.ids.length === currentPledgedIds.length &&
                                                                combo.ids.every((id) => currentSet.has(id));
                                                            return (
                                                                <div
                                                                    key={`pair-${idx}`}
                                                                    className={[
                                                                        "flex items-center justify-between gap-2 rounded-lg border p-2",
                                                                        isActive
                                                                            ? "border-emerald-700/50 bg-emerald-950/20"
                                                                            : "border-slate-800 bg-slate-950/40"
                                                                    ].join(" ")}
                                                                >
                                                                    <div className="min-w-0 flex flex-wrap gap-1.5">
                                                                        {combo.ids.map((id) => (
                                                                            <span
                                                                                key={id}
                                                                                className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/30 px-2 py-0.5 text-[11px] text-slate-200"
                                                                            >
                                                                                {findCanonNameById(id)}
                                                                            </span>
                                                                        ))}
                                                                        <span className="text-[10px] text-slate-500 self-center">
                                                                            {combo.posCount}✓{combo.negCount > 0 ? ` ${combo.negCount}✗` : ""}
                                                                        </span>
                                                                    </div>
                                                                    {isActive ? (
                                                                        <span className="shrink-0 rounded-lg border border-emerald-700/50 bg-emerald-950/30 px-2.5 py-1 text-[11px] text-emerald-200">
                                                                            Active
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            className="shrink-0 rounded-lg border border-slate-700 bg-slate-950/30 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-slate-900"
                                                                            type="button"
                                                                            onClick={() => { applyCombo(combo.ids); setSimOpen(false); }}
                                                                        >
                                                                            Apply
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <button
                                        className="rounded-full border border-slate-700 bg-slate-950/30 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900"
                                        onClick={() => {
                                            for (const c of primaryCanon) setPledged(c.id, false);
                                        }}
                                        title="Clear pledged selections"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                {primaryCanon.map((c) => {
                                    const overlay = overlayById.get(c.id);
                                    const isOn = Boolean(overlay?.pledged);
                                    const disabled = !isOn && pledgedCount >= 3;

                                    const iconUrl = syndicateIconUrl(c.iconFile);

                                    return (
                                        <button
                                            key={c.id}
                                            className={pledgeIconButtonClass(isOn, disabled)}
                                            onClick={() => {
                                                if (disabled) return;
                                                if (isOn) { setPledged(c.id, false); return; }
                                                if (pledgedCount >= 3) return;
                                                setPledged(c.id, true);
                                            }}
                                            title={c.name}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg border border-white/10 bg-black/15 p-1">
                                                    {iconUrl ? (
                                                        <img
                                                            src={iconUrl}
                                                            alt={`${c.name} icon`}
                                                            className="h-7 w-7 object-contain"
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    ) : (
                                                        <PlaceholderIcon className="h-7 w-7" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 text-left">
                                                    <div className="text-xs font-semibold leading-tight truncate">{c.name}</div>
                                                    <div className="text-[11px] text-slate-400 leading-tight">
                                                        {isOn ? "Pledged" : "Not pledged"}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Simulation appears only after the player selects at least one pledge */}
                            {currentPledgedIds.length > 0 ? (
                                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-3">
                                        <div className="text-xs font-semibold text-emerald-200">Positives</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {netBuckets.pos.length ? (
                                                netBuckets.pos.map((r) => (
                                                    <span
                                                        key={`pos-${r.id}`}
                                                        className={[
                                                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                                                            netChipClass("pos")
                                                        ].join(" ")}
                                                        title={r.id}
                                                    >
                                                        {r.name}: <span className="ml-1 font-mono">{formatNet(r.net)}</span>
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-slate-500">None</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-3">
                                        <div className="text-xs font-semibold text-amber-200">Neutrals</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {netBuckets.zero.length ? (
                                                netBuckets.zero.map((r) => (
                                                    <span
                                                        key={`zero-${r.id}`}
                                                        className={[
                                                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                                                            netChipClass("zero")
                                                        ].join(" ")}
                                                        title={r.id}
                                                    >
                                                        {r.name}: <span className="ml-1 font-mono">{formatNet(r.net)}</span>
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-slate-500">None</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-3">
                                        <div className="text-xs font-semibold text-rose-200">Negatives</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {netBuckets.neg.length ? (
                                                netBuckets.neg.map((r) => (
                                                    <span
                                                        key={`neg-${r.id}`}
                                                        className={[
                                                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                                                            netChipClass("neg")
                                                        ].join(" ")}
                                                        title={r.id}
                                                    >
                                                        {r.name}: <span className="ml-1 font-mono">{formatNet(r.net)}</span>
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-slate-500">None</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rowsForTab.map((canon) => {
                    const overlay = overlayById.get(canon.id);

                    const rawRank = overlay && typeof overlay.rank === "number" ? overlay.rank : 0;
                    const maxRank = canon.maxRank ?? 5;
                    const rank = canon.isFaction
                        ? clamp(rawRank, -2, 5)
                        : canon.id === SY.NIGHTCAP
                            ? nightcapRankFromMushrooms(
                                overlay && typeof overlay.standing === "number" ? clamp(overlay.standing, 0, 16) : 0
                              )
                            : clamp(rawRank, 0, maxRank);

                    const range = standingRangeForSyndicate(canon, rank);

                    const rawStanding = overlay && typeof overlay.standing === "number" ? overlay.standing : 0;
                    const standing = range ? clamp(rawStanding, range.min, range.max) : Math.max(0, rawStanding);

                    const pledged = canon.isFaction ? Boolean(overlay?.pledged) : false;

                    const isNightcapProgress = canon.id === SY.NIGHTCAP;

                    const showStanding = canon.model === "standing" || canon.model === "event-standing" || isNightcapProgress;
                    const showCaps = canon.model === "standing" && canon.id !== SY.CEPHALON_SIMARIS;

                    const iconUrl = syndicateIconUrl(canon.iconFile);

                    const cardStyle: React.CSSProperties = {
                        backgroundColor: canon.bg,
                        color: canon.fg
                    };

                    const standingDraft = standingDraftById[canon.id];
                    const standingInputValue = typeof standingDraft === "string" ? standingDraft : String(standing);

                    const canShowRanksButton = hasRanksForSyndicate(canon);

                    // Missing offerings count (read from localStorage, refreshes after modal closes)
                    const vendorEntry = getSyndicateVendorEntry(canon.id);
                    const flatOfferings = flattenOfferings(vendorEntry);
                    const ownedMapForCard = flatOfferings.length > 0
                        // eslint-disable-next-line react-hooks/exhaustive-deps
                        ? (() => { void ownedRefreshKey; return readOwnedMap(canon.id); })()
                        : {};
                    const { owned: ownedCount, total: totalOfferings } = countOwned(flatOfferings, ownedMapForCard);
                    const missingCount = totalOfferings - ownedCount;

                    // Currency reminder
                    const currencyNames = collectCurrencyNames(vendorEntry);

                    // Estimate to max rank (all standard standing-based syndicates)
                    const showEstimate = showCaps && rank < maxRank;
                    const standingToMax = showEstimate ? estimateStandingToMaxRank(rank, standing, maxRank) : 0;
                    const daysToMax = showEstimate && dailyCapComputed > 0
                        ? Math.ceil(standingToMax / dailyCapComputed)
                        : null;

                    // Kahl's Garrison: weekly mission progression, max rank 5
                    const kahlWeeksToMax = canon.id === SY.KAHLS_GARRISON && rank < 5
                        ? 5 - rank
                        : null;

                    return (
                        <div
                            key={canon.id}
                            className="rounded-2xl border border-slate-800 overflow-hidden"
                            style={cardStyle}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex items-start gap-3">
                                        <div className="shrink-0 rounded-xl border border-white/10 bg-black/15 p-2">
                                            {iconUrl ? (
                                                <img
                                                    src={iconUrl}
                                                    alt={`${canon.name} icon`}
                                                    className="h-12 w-12 object-contain"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <PlaceholderIcon className="h-12 w-12" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="text-lg font-semibold break-words">{canon.name}</div>
                                            <div className="mt-1 text-xs opacity-90">{canon.detail}</div>

                                            {canon.isFaction && (
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={[
                                                            "rounded-full border px-3 py-1 text-xs font-semibold",
                                                            pledged
                                                                ? "bg-white/15 text-inherit border-white/20"
                                                                : "bg-black/20 text-inherit border-white/20"
                                                        ].join(" ")}
                                                        title="Managed via the pledge toggles above (max 3)."
                                                    >
                                                        {pledged ? "Pledged" : "Not Pledged"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-[11px] opacity-90 font-mono">
                                        {canon.model === "standing"
                                            ? "Standing"
                                            : canon.model === "event-standing"
                                                ? "Event"
                                                : canon.model === "nightwave"
                                                    ? "System"
                                                    : isNightcapProgress
                                                        ? "Progress"
                                                        : "No Standing"}
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {canShowRanksButton ? (
                                        <button
                                            className={cardActionButtonClass()}
                                            onClick={() => openDetails(canon.id, `${canon.name} - Ranks`, "ranks", "all", rank)}
                                            title="View rank-up requirements"
                                        >
                                            Ranks
                                        </button>
                                    ) : null}

                                    <button
                                        className={cardActionButtonClass()}
                                        onClick={() => openDetails(canon.id, `${canon.name} - Offerings`, "offerings")}
                                        title="View all vendor offerings"
                                    >
                                        Offerings
                                    </button>

                                    {totalOfferings > 0 ? (
                                        <button
                                            className={[
                                                cardActionButtonClass(),
                                                missingCount === 0 ? "opacity-60" : ""
                                            ].join(" ")}
                                            onClick={() => openDetails(canon.id, `${canon.name} - Missing`, "offerings", "unowned")}
                                            title={`${missingCount} unowned of ${totalOfferings} offerings`}
                                        >
                                            Missing: {missingCount}/{totalOfferings}
                                        </button>
                                    ) : null}
                                </div>

                                {/* Currency reminder */}
                                {currencyNames.length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {currencyNames.map((name) => (
                                            <span
                                                key={name}
                                                className="inline-flex items-center rounded-full border border-white/15 bg-black/15 px-2 py-0.5 text-[11px] opacity-90"
                                                title={`This syndicate uses ${name}`}
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}

                                {canon.isFaction && canon.relationship && (
                                    <div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3">
                                        <div className="text-sm font-semibold">Relationships</div>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <RelationshipPill
                                                label="Allied (+50%)"
                                                ids={canon.relationship.allied ?? []}
                                                tone="ally"
                                            />
                                            <RelationshipPill
                                                label="Opposed (-50%)"
                                                ids={canon.relationship.opposed ?? []}
                                                tone="oppose"
                                            />
                                            <RelationshipPill
                                                label="Enemy (-100%)"
                                                ids={canon.relationship.enemy ?? []}
                                                tone="enemy"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {hasRanksForSyndicate(canon) ? (
                                        <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                                            <div className="text-xs opacity-90 mb-1">Rank</div>

                                            {canon.isFaction ? (
                                                <select
                                                    className={selectClass()}
                                                    value={String(rank)}
                                                    onChange={(e) => {
                                                        const next = parseIntSafeSigned(e.target.value);
                                                        upsertSyndicate({
                                                            id: canon.id,
                                                            name: canon.name,
                                                            rank: clamp(next, -2, 5)
                                                        });
                                                    }}
                                                >
                                                    <option value="-2">-2</option>
                                                    <option value="-1">-1</option>
                                                    <option value="0">0</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                </select>
                                            ) : canon.id === SY.NIGHTCAP ? (
                                                <div className="text-sm font-mono">{rank}</div>
                                            ) : maxRank > 10 ? (
                                                <input
                                                    className={inputClass()}
                                                    value={String(rank)}
                                                    inputMode="numeric"
                                                    onChange={(e) =>
                                                        upsertSyndicate({
                                                            id: canon.id,
                                                            name: canon.name,
                                                            rank: clamp(Math.max(0, parseIntSafeSigned(e.target.value)), 0, maxRank)
                                                        })
                                                    }
                                                />
                                            ) : (
                                                <select
                                                    className={selectClass()}
                                                    value={String(rank)}
                                                    onChange={(e) => {
                                                        const next = parseIntSafeSigned(e.target.value);
                                                        upsertSyndicate({
                                                            id: canon.id,
                                                            name: canon.name,
                                                            rank: clamp(next, 0, maxRank)
                                                        });
                                                    }}
                                                >
                                                    {Array.from({ length: maxRank + 1 }, (_, i) => (
                                                        <option key={i} value={String(i)}>{i}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {canon.isFaction ? (
                                                <div className="mt-1 text-[11px] opacity-90">Relay factions support ranks -2..5.</div>
                                            ) : canon.id === SY.NIGHTCAP ? (
                                                <div className="mt-1 text-[11px] opacity-90">Auto-derived from mushrooms analyzed.</div>
                                            ) : canon.id === SY.NIGHTWAVE ? (
                                                <div className="mt-1 text-[11px] opacity-90">Ranks 1–30 (normal) + 31–180 (prestige).</div>
                                            ) : (
                                                <div className="mt-1 text-[11px] opacity-90">Ranks 0–{maxRank}.</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                                            <div className="text-xs opacity-90 mb-1">Rank</div>
                                            <div className="text-sm opacity-90">No ranks. Standing only.</div>
                                            <div className="mt-1 text-[11px] opacity-90">Cephalon Simaris has no rank ladder.</div>
                                        </div>
                                    )}

                                    {showStanding ? (
                                        <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                                            <div className="text-xs opacity-90 mb-1">
                                                {isNightcapProgress ? "Mushrooms analyzed (x/16)" : "Standing"}
                                            </div>

                                            <input
                                                className={inputClass()}
                                                value={standingInputValue}
                                                inputMode="numeric"
                                                onChange={(e) => {
                                                    setStandingDraftById((prev) => ({
                                                        ...prev,
                                                        [canon.id]: e.target.value
                                                    }));
                                                }}
                                                onBlur={() => {
                                                    const draft = standingDraftById[canon.id];
                                                    if (typeof draft !== "string") return;
                                                    commitStanding(canon, range, draft);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key !== "Enter") return;
                                                    const draft = standingDraftById[canon.id];
                                                    const raw = typeof draft === "string" ? draft : standingInputValue;
                                                    commitStanding(canon, range, raw);
                                                    (e.target as HTMLInputElement).blur();
                                                }}
                                            />

                                            {range ? (
                                                <div className="mt-1 text-[11px] opacity-90">
                                                    Valid range: {formatRange(range.min, range.max)}
                                                </div>
                                            ) : (
                                                <div className="mt-1 text-[11px] opacity-90">
                                                    {isNightcapProgress ? "Progress counter." : "Current standing into rank."}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                                            <div className="text-xs opacity-90 mb-1">Standing</div>
                                            <div className="text-sm opacity-90">Not applicable for this progression model.</div>
                                        </div>
                                    )}
                                </div>

                                {showCaps ? (
                                    <div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3">
                                        <div className="text-sm font-semibold">Caps</div>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                                <div className="text-xs opacity-90 mb-1">Daily Standing Cap</div>
                                                <div className="text-sm font-mono">{dailyCapComputed.toLocaleString()}</div>
                                                <div className="mt-1 text-[11px] opacity-90">
                                                    {mrMissing ? "Minimum (Set MR in Profile)." : `Based on MR ${masteryRank}.`}
                                                </div>
                                            </div>

                                            {showEstimate ? (
                                                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                                    <div className="text-xs opacity-90 mb-1">Est. to Max Rank</div>
                                                    {rank >= maxRank ? (
                                                        <div className="text-sm font-mono">Max rank</div>
                                                    ) : (
                                                        <>
                                                            <div className="text-sm font-mono">{standingToMax.toLocaleString()} standing</div>
                                                            {daysToMax !== null ? (
                                                                <div className="mt-1 text-[11px] opacity-90">
                                                                    ~{daysToMax.toLocaleString()} day{daysToMax !== 1 ? "s" : ""} at daily cap
                                                                </div>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </div>
                                            ) : kahlWeeksToMax !== null ? (
                                                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                                    <div className="text-xs opacity-90 mb-1">Est. to Max Rank</div>
                                                    <div className="text-sm font-mono">
                                                        {kahlWeeksToMax} week{kahlWeeksToMax !== 1 ? "s" : ""} of weekly missions
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            <SyndicateDetailsModal
                open={detailsOpen}
                onClose={closeDetails}
                title={detailsTitle || "Syndicate Details"}
                entry={detailsEntry}
                initialTab={detailsInitialTab}
                initialOwnedFilter={detailsInitialOwnedFilter}
                initialSortKey={detailsInitialOwnedFilter === "unowned" ? "rankAsc" : undefined}
                playerRank={detailsPlayerRank}
            />
        </div>
    );
}
