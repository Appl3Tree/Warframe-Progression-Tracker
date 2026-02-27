// ===== FILE: src/components/SyndicatesGrid.tsx =====
import { useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import { SY } from "../domain/ids/syndicateIds";
import type { SyndicateState } from "../domain/types";

type TabKey =
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
    tab: TabKey;
    model: ProgressionModel;
    detail: string;

    iconFile?: string;

    // Styling pulled from the wiki tables you pasted.
    // Use solid backgrounds so icons remain visible.
    bg: string;
    fg: string;

    // Relay faction relationships.
    relationship?: Relationship;

    // Relay faction?
    isFaction?: boolean;
};

const TABS: Array<{ key: TabKey; label: string }> = [
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
        detail: "Relay faction syndicate.",
        iconFile: "120px-SteelIconPink.png",
        bg: "#2C3F46",
        fg: "#f9bc93",
        isFaction: true,
        relationship: {
            allied: [SY.RED_VEIL],
            opposed: [SY.NEW_LOKA],
            enemy: [SY.PERRIN_SEQUENCE]
        }
    },
    {
        id: SY.ARBITERS_OF_HEXIS,
        name: "Arbiters of Hexis",
        tab: "primary",
        model: "standing",
        detail: "Relay faction syndicate.",
        iconFile: "120px-ArbitarIconGrey.png",
        bg: "#374045",
        fg: "#cfe1e4",
        isFaction: true,
        relationship: {
            allied: [SY.CEPHALON_SUDA],
            opposed: [SY.PERRIN_SEQUENCE],
            enemy: [SY.RED_VEIL]
        }
    },
    {
        id: SY.CEPHALON_SUDA,
        name: "Cephalon Suda",
        tab: "primary",
        model: "standing",
        detail: "Relay faction syndicate.",
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
        id: SY.PERRIN_SEQUENCE,
        name: "The Perrin Sequence",
        tab: "primary",
        model: "standing",
        detail: "Relay faction syndicate.",
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
        detail: "Relay faction syndicate.",
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
        detail: "Relay faction syndicate.",
        iconFile: "120px-LokaIconGreen.png",
        bg: "#2A3C2E",
        fg: "#c2ffbf",
        isFaction: true,
        relationship: {
            allied: [SY.PERRIN_SEQUENCE],
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
        detail: "Cetus hub syndicate.",
        iconFile: "120px-OstronSigil.png",
        bg: "#B74624",
        fg: "#e8ddaf"
    },
    {
        id: SY.QUILLS,
        name: "The Quills",
        tab: "cetus",
        model: "standing",
        detail: "Cetus hub syndicate.",
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
        detail: "Fortuna hub syndicate.",
        iconFile: "120px-SolarisUnited1.png",
        bg: "#5F3C0D",
        fg: "#e8ddaf"
    },
    {
        id: SY.VENTKIDS,
        name: "Ventkids",
        tab: "fortuna",
        model: "standing",
        detail: "Fortuna hub syndicate.",
        iconFile: "120px-VentkidsIcon.png",
        bg: "#B97EF9",
        fg: "#FFF58F"
    },
    {
        id: SY.VOX_SOLARIS,
        name: "Vox Solaris",
        tab: "fortuna",
        model: "standing",
        detail: "Fortuna hub syndicate.",
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
        detail: "Deimos hub syndicate.",
        iconFile: "120px-EntratiIcon.png",
        bg: "#4E5360",
        fg: "#FFC12F"
    },
    {
        id: SY.CAVIA,
        name: "Cavia",
        tab: "necralisk",
        model: "standing",
        detail: "Deimos hub syndicate.",
        iconFile: "120px-Cavia_Syndicate_Logo_1.png",
        bg: "#282624",
        fg: "#A5A394"
    },
    {
        id: SY.NECRALOID,
        name: "Necraloid",
        tab: "necralisk",
        model: "standing",
        detail: "Deimos hub syndicate.",
        iconFile: "120px-NecraloidIcon.png",
        bg: "#333334",
        fg: "#BA9E5E"
    },

    // Chrysalith
    {
        id: (SY as any).HOLDFASTS ?? (SY as any).HOLDFATS ?? "syndicate_holdfasts",
        name: "The Holdfasts",
        tab: "chrysalith",
        model: "standing",
        detail: "Zariman hub syndicate.",
        iconFile: "120px-TheHoldfastsIcon.png",
        bg: "#21242e",
        fg: "#a9b5cc"
    },

    // 1999
    {
        id: SY.HEX_1999,
        name: "The Hex",
        tab: "1999",
        model: "standing",
        detail: "1999 syndicate.",
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
        detail: "Neutral syndicate.",
        iconFile: "120px-ConclaveSigil.png",
        bg: "#000000",
        fg: "#ffffff"
    },
    {
        id: SY.CEPHALON_SIMARIS,
        name: "Cephalon Simaris",
        tab: "misc",
        model: "standing",
        detail: "Neutral syndicate.",
        iconFile: "120px-Simaris_Sigil_gold.png",
        bg: "#5F3C0D",
        fg: "#ebd18f"
    },

    // Other (everything else)
    {
        id: (SY as any).KAHLS_GARRISON ?? "syndicate_kahls_garrison",
        name: "Kahl’s Garrison",
        tab: "other",
        model: "no-standing",
        detail: "No standing meter. Weekly progression.",
        iconFile: "120px-GarrisonIcon.png",
        bg: "#0a2a1b",
        fg: "#a16042"
    },
    {
        id: (SY as any).OPERATIONAL_SUPPLY ?? "syndicate_operational_supply",
        name: "Operational Supply",
        tab: "other",
        model: "event-standing",
        detail: "Event-scoped standing progression.",
        iconFile: "120px-OperationSyndicateSigil.png",
        bg: "#6A5574",
        fg: "#ffffff"
    },
    {
        id: (SY as any).NIGHTWAVE ?? "syndicate_nightwave",
        name: "Nightwave",
        tab: "other",
        model: "nightwave",
        detail: "System progression via Acts/points; separate currency.",
        iconFile: "120px-NightwaveSyndicate.png",
        bg: "#6C1822",
        fg: "#F4ABAB"
    },
    {
        id: (SY as any).NIGHTCAP ?? "syndicate_nightcap",
        name: "Nightcap",
        tab: "other",
        model: "no-standing",
        detail: "No standing meter. Rank via Nightcap-specific progression.",
        // no icon file in your list; will fall back to inline placeholder icon
        bg: "#1f2430",
        fg: "#cbd5e1"
    }
];

function syndicateIconUrl(iconFile?: string): string | null {
    if (!iconFile) return null;
    const base = String((import.meta as any).env?.BASE_URL ?? "/");
    // Ensures dev + GH Pages (base=/Warframe-Progression-Tracker/) both work:
    //   /Warframe-Progression-Tracker/assets/syndicates/<file>
    return `${base}assets/syndicates/${iconFile}`;
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
    const n = Number(v);
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
    // Per your table:
    //  5: 0..132,000
    //  4: 0..99,000
    //  3: 0..70,000
    //  2: 0..44,000
    //  1: 0..22,000
    //  0: -5,000..5,000
    // -1: -22,000..0
    // -2: -44,000..0
    if (rank >= 5) return { min: 0, max: 132_000 };
    if (rank === 4) return { min: 0, max: 99_000 };
    if (rank === 3) return { min: 0, max: 70_000 };
    if (rank === 2) return { min: 0, max: 44_000 };
    if (rank === 1) return { min: 0, max: 22_000 };
    if (rank === 0) return { min: -5_000, max: 5_000 };
    if (rank === -1) return { min: -22_000, max: 0 };
    return { min: -44_000, max: 0 };
}

function computeDailyStandingCap(mr: number | null): { cap: number; isEstimated: boolean } {
    // Generic standing cap formula used across many standing syndicates.
    // If MR unknown, show minimum (MR 0).
    const m = mr === null ? 0 : Math.max(0, Math.floor(mr));
    return { cap: (m * 1000) + 1000, isEstimated: mr === null };
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

export default function SyndicatesGrid() {
    const masteryRank = useTrackerStore((s) => s.state.player.masteryRank);

    const playerSyndicates = useTrackerStore((s) => s.state.syndicates) ?? [];
    const upsertSyndicate = useTrackerStore((s) => s.upsertSyndicate);
    const setPrimaryPledge = useTrackerStore((s) => s.setPrimaryPledge);

    const [activeTab, setActiveTab] = useState<TabKey>("primary");

    const overlayById = useMemo(() => {
        const m = new Map<string, SyndicateState>();
        for (const s of playerSyndicates ?? []) {
            if (s && typeof (s as any).id === "string") {
                m.set((s as any).id, s as any);
            }
        }
        return m;
    }, [playerSyndicates]);

    const rowsForTab = useMemo(() => {
        const list = CANONICAL_SYNDICATES.filter((c) => c.tab === activeTab);

        // Stable in-game-ish grouping without extra scrolling:
        // keep defined order, but within tab sort by name for readability (except Primary)
        if (activeTab === "primary") return list;

        const copy = [...list];
        copy.sort((a, b) => a.name.localeCompare(b.name));
        return copy;
    }, [activeTab]);

    const { cap: dailyCapComputed, isEstimated: mrMissing } = computeDailyStandingCap(masteryRank);

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

                <div className="mt-3 text-xs text-slate-400">
                    {mrMissing ? (
                        <span>
                            Daily Standing caps shown at minimum (MR 0). Add MR in the Profile panel to update caps.
                        </span>
                    ) : (
                        <span>
                            Daily Standing caps computed using your MR ({masteryRank}). If a specific syndicate uses a different cap
                            system, you can still track Rank/Standing manually.
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rowsForTab.map((canon) => {
                    const overlay = overlayById.get(canon.id);

                    const rawRank = overlay && typeof overlay.rank === "number" ? overlay.rank : 0;
                    const rank = canon.isFaction ? clamp(rawRank, -2, 5) : Math.max(0, rawRank);

                    const range = canon.model === "standing" || canon.model === "event-standing"
                        ? rankStandingRange(rank)
                        : null;

                    const rawStanding = overlay && typeof overlay.standing === "number" ? overlay.standing : 0;
                    const standing = range ? clamp(rawStanding, range.min, range.max) : Math.max(0, rawStanding);

                    const pledged = canon.isFaction ? Boolean(overlay?.pledged) : false;

                    const showStanding = canon.model === "standing" || canon.model === "event-standing";
                    const showCaps = canon.model === "standing";

                    const iconUrl = syndicateIconUrl(canon.iconFile);

                    const cardStyle: React.CSSProperties = {
                        backgroundColor: canon.bg,
                        color: canon.fg
                    };

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
                                                    <button
                                                        className={[
                                                            "rounded-full border px-3 py-1 text-xs font-semibold",
                                                            pledged
                                                                ? "bg-white text-black border-white"
                                                                : "bg-black/20 text-inherit border-white/20 hover:bg-black/30"
                                                        ].join(" ")}
                                                        onClick={() => setPrimaryPledge(pledged ? null : canon.id)}
                                                        title="Primary pledge (one at a time)"
                                                    >
                                                        {pledged ? "Pledged" : "Set Pledge"}
                                                    </button>

                                                    <span className="text-[11px] opacity-90">
                                                        Pledge affects allied/opposed syndicates when earning standing.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-[11px] opacity-90 font-mono">
                                        {canon.model === "standing" ? "Standing" : canon.model === "event-standing" ? "Event" : canon.model === "nightwave" ? "System" : "No Standing"}
                                    </div>
                                </div>

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
                                    <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                                        <div className="text-xs opacity-90 mb-1">Rank</div>
                                        <input
                                            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-inherit font-mono"
                                            value={String(rank)}
                                            inputMode="numeric"
                                            onChange={(e) =>
                                                upsertSyndicate({
                                                    id: canon.id,
                                                    name: canon.name,
                                                    rank: canon.isFaction
                                                        ? clamp(parseIntSafeSigned(e.target.value), -2, 5)
                                                        : Math.max(0, parseIntSafeSigned(e.target.value))
                                                })
                                            }
                                        />
                                        {canon.isFaction ? (
                                            <div className="mt-1 text-[11px] opacity-90">
                                                Relay factions support ranks -2..5.
                                            </div>
                                        ) : (
                                            <div className="mt-1 text-[11px] opacity-90">
                                                Non-faction ranks are tracked as 0+.
                                            </div>
                                        )}
                                    </div>

                                    {showStanding ? (
                                        <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                                            <div className="text-xs opacity-90 mb-1">Standing</div>
                                            <input
                                                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-inherit font-mono"
                                                value={String(standing)}
                                                inputMode="numeric"
                                                onChange={(e) => {
                                                    const next = parseIntSafeSigned(e.target.value);
                                                    const clamped = range ? clamp(next, range.min, range.max) : Math.max(0, next);
                                                    upsertSyndicate({
                                                        id: canon.id,
                                                        name: canon.name,
                                                        standing: clamped
                                                    });
                                                }}
                                            />
                                            {range ? (
                                                <div className="mt-1 text-[11px] opacity-90">
                                                    Valid range: {formatRange(range.min, range.max)}
                                                </div>
                                            ) : (
                                                <div className="mt-1 text-[11px] opacity-90">
                                                    Current standing into rank.
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

                                {showCaps && range ? (
                                    <div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3">
                                        <div className="text-sm font-semibold">Caps</div>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                                <div className="text-xs opacity-90 mb-1">Rank Standing Cap</div>
                                                <div className="text-sm font-mono">
                                                    {range.max.toLocaleString()}
                                                </div>
                                                <div className="mt-1 text-[11px] opacity-90">
                                                    From your rank ({rank}).
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                                <div className="text-xs opacity-90 mb-1">Daily Standing Cap</div>
                                                <div className="text-sm font-mono">
                                                    {dailyCapComputed.toLocaleString()}
                                                </div>
                                                <div className="mt-1 text-[11px] opacity-90">
                                                    {mrMissing ? "Minimum (MR unknown)." : "Based on MR."}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
