// src/lib/worldStateCache.ts
// Shared module-level cache for the warframestat.us /pc world state.
// Used by both the WorldState page and the Topbar notification bell
// so both components see the same data without double-fetching.

// ── Types ─────────────────────────────────────────────────────────────────────

export type WsCycle = {
    state: string;
    expiry: string;
    timeLeft: string;
};

export type DuviriChoiceGroup = {
    category: string;   // "normal" | "hard"
    categoryKey: string;
    choices: string[];  // warframe names (normal) or incarnon weapon names (hard)
};

export type DuviriCycle = {
    state: string;
    expiry: string;
    choices: DuviriChoiceGroup[];
};

export type SortieMission = {
    missionType: string;
    modifier: string;
    modifierDescription: string;
    node: string;
};

export type Sortie = {
    boss: string;
    faction: string;
    rewardPool: string;
    variants: SortieMission[];
    expiry: string;
    expired: boolean;
};

export type ArchonMission = { node: string; type: string };

export type ArchonHunt = {
    boss: string;
    faction: string;
    missions: ArchonMission[];
    expiry: string;
    active: boolean;
};

export type Fissure = {
    id: string;
    node: string;
    missionType: string;
    tier: string;
    tierNum: number;
    expiry: string;
    eta: string;
    isStorm: boolean;
    isHard: boolean;
    enemy: string;
    expired: boolean;
};

export type NightwaveAct = {
    id: string;
    isDaily: boolean;
    isElite: boolean;
    desc: string;
    title: string;
    reputation: number;
    expiry: string;
};

export type Nightwave = {
    season: number;
    activeChallenges: NightwaveAct[];
    expiry: string;
};

export type TraderItem = {
    item: string;
    ducats: number;
    credits: number;
};

export type VoidTrader = {
    active: boolean;
    character: string;
    location: string;
    inventory: TraderItem[];
    activation: string;
    expiry: string;
};

export type VaultTraderItem = {
    item: string;
    ducats?: number;
    credits?: number;
    discount?: number;
};

export type VaultTrader = {
    active: boolean;
    character: string;
    location: string;
    inventory: VaultTraderItem[];
    activation: string;
    expiry: string;
};

export type WsEvent = {
    id: string;
    description: string;
    tooltip: string;
    expiry: string;
    active: boolean;
    health?: number;
    rewards?: Array<{ asString: string }>;
};

export type InvasionReward = {
    asString: string;
    items?: string[];
    credits?: number;
    countedItems?: Array<{ type: string; count: number }>;
};

export type Invasion = {
    id: string;
    node: string;
    desc: string;
    attackingFaction: string;
    defendingFaction: string;
    completion: number;
    completed: boolean;
    eta: string;
    vsInfestation: boolean;
    attackerReward: InvasionReward | null;
    defenderReward: InvasionReward | null;
};

export type SteelPathRotationItem = {
    name: string;
    cost: number;
};

export type SteelPath = {
    currentReward: { name: string; cost: number } | null;
    expiry?: string;
    rotation: SteelPathRotationItem[];
    evergreens: SteelPathRotationItem[];
};

export type ConstructionProgress = {
    fomorianProgress: string;
    razorbackProgress: string;
};

export type DailyDeal = {
    item: string;
    discount: number;
    originalPrice: number;
    salePrice: number;
    total: number;
    sold: number;
    expiry: string;
};

export type SentientOutpost = {
    active: boolean;
    expiry?: string;
    missionType?: string;
};

// ── Archimedea (Temporal Archimedea / The Hex) ────────────────────────────────

export type ArchimedeaMission = {
    node: string;
    type: string;
    modifier?: string;
    modifierDescription?: string;
};

export type ArchimedeaModifier = {
    tag: string;
    description?: string;
    rarity?: string;
};

export type Archimedea = {
    id: string;
    tag: string;         // e.g. "C T_ L A B" (Lab) or "C T_ H E X" (Hex)
    variants: ArchimedeaMission[];
    personalModifiers: ArchimedeaModifier[];
    deviations?: ArchimedeaModifier[];
    risks?: ArchimedeaModifier[];
    endDate: string;
    expired: boolean;
};

// ── 1999 Calendar ─────────────────────────────────────────────────────────────

export type CalendarEvent = {
    type: string;        // normalized: "To Do" | "Big Prize!" | "Override" | raw API value
    title: string;
    description: string;
};

export type CalendarDay = {
    date: string;
    events: CalendarEvent[];
};

export type Calendar = {
    days: CalendarDay[];
    currentDay?: string;
    season?: string;
};

// Maps raw API type strings → canonical display types used by CAL_EVENT_META
const _EV_TYPE_MAP: Record<string, string> = {
    challenge: "To Do", todo: "To Do", weekly: "To Do", mission: "To Do",
    prize: "Big Prize!", reward: "Big Prize!", jackpot: "Big Prize!",
    HexOverride: "Override", hexoverride: "Override", override: "Override",
};
function _normEvType(raw: string): string {
    return _EV_TYPE_MAP[raw] ?? _EV_TYPE_MAP[raw.toLowerCase()] ?? raw;
}
function _normCalEvents(d: any): CalendarEvent[] {
    const toEv = (raw: any): CalendarEvent => {
        const typeRaw = String(raw.type ?? raw.category ?? raw.kind ?? "");
        return {
            type: _normEvType(typeRaw),
            title: raw.title ?? raw.name ?? typeRaw,
            description: raw.description ?? raw.challenge ?? raw.text ?? "",
        };
    };
    if (d.jobs && Array.isArray(d.jobs)) return (d.jobs as any[]).map(toEv);
    if (d.events && Array.isArray(d.events)) return (d.events as any[]).map(toEv);
    if (d.events && typeof d.events === "object") {
        return Object.entries(d.events).map(([k, v]: [string, any]) =>
            typeof v === "string"
                ? { type: _normEvType(k), title: k, description: v }
                : { type: _normEvType(v?.type ?? k), title: v?.title ?? v?.name ?? k, description: v?.description ?? v?.challenge ?? "" }
        );
    }
    return [];
}

// ── Simaris ───────────────────────────────────────────────────────────────────

export type Simaris = {
    target: string;
    isTargetActive: boolean;
};

// ── Combined WorldState ───────────────────────────────────────────────────────

export type WorldStateData = {
    cetusCycle:           WsCycle | null;
    vallisCycle:          WsCycle | null;
    cambionCycle:         WsCycle | null;
    zarimanCycle:         WsCycle | null;
    earthCycle:           WsCycle | null;
    duviriCycle:          DuviriCycle | null;
    sortie:               Sortie | null;
    archonHunt:           ArchonHunt | null;
    fissures:             Fissure[];
    nightwave:            Nightwave | null;
    voidTrader:           VoidTrader | null;
    vaultTrader:          VaultTrader | null;
    events:               WsEvent[];
    invasions:            Invasion[];
    steelPath:            SteelPath | null;
    constructionProgress: ConstructionProgress | null;
    dailyDeals:           DailyDeal[];
    sentientOutposts:     SentientOutpost | null;
    archimedeas:          Archimedea[];
    calendar:             Calendar | null;
    simaris:              Simaris | null;
};

// ── Cache ─────────────────────────────────────────────────────────────────────

const API = "https://api.warframestat.us/pc";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _cache: { data: WorldStateData; fetchedAt: number } | null = null;
let _inflight: Promise<WorldStateData> | null = null;

export async function fetchWorldState(force = false): Promise<WorldStateData> {
    const now = Date.now();
    if (!force && _cache && now - _cache.fetchedAt < CACHE_TTL) {
        return _cache.data;
    }
    if (_inflight) return _inflight;

    _inflight = (async () => {
        try {
            const res = await fetch(`${API}?language=en`);
            if (!res.ok) throw new Error(`World state API returned ${res.status}`);
            const j = await res.json();

            const data: WorldStateData = {
                cetusCycle:   j.cetusCycle   ?? null,
                vallisCycle:  j.vallisCycle  ?? j.valesCycle ?? null,
                cambionCycle: j.cambionCycle ?? null,
                zarimanCycle: j.zarimanCycle ?? null,
                earthCycle:   j.earthCycle   ?? null,

                duviriCycle: j.duviriCycle
                    ? {
                        state:  j.duviriCycle.state  ?? "",
                        expiry: j.duviriCycle.expiry ?? "",
                        choices: Array.isArray(j.duviriCycle.choices)
                            ? j.duviriCycle.choices.map((g: any) => ({
                                category:    g.category    ?? "",
                                categoryKey: g.categoryKey ?? "",
                                choices:     Array.isArray(g.choices) ? g.choices : [],
                            }))
                            : [],
                    }
                    : null,

                sortie:    j.sortie    ?? null,
                archonHunt: j.archonHunt ?? null,

                fissures: Array.isArray(j.fissures) ? j.fissures : [],

                nightwave: j.nightwave ?? null,
                voidTrader: j.voidTrader ?? null,
                vaultTrader: j.vaultTrader ?? null,

                events: Array.isArray(j.events)
                    ? (j.events as WsEvent[]).filter((e) => e.active !== false)
                    : [],

                invasions: Array.isArray(j.invasions)
                    ? (j.invasions as any[]).filter((inv) => !inv.completed).map((inv): Invasion => {
                        const attackerData = inv.attacker ?? {};
                        const defenderData = inv.defender ?? {};

                        function buildReward(r: any): InvasionReward | null {
                            if (!r) return null;
                            const countedItems: Array<{ type: string; count: number }> = Array.isArray(r.countedItems) ? r.countedItems : [];
                            const items: string[] = Array.isArray(r.items) ? r.items : [];
                            const parts: string[] = [
                                ...countedItems.map((ci: any) => ci.count > 1 ? `${ci.count}x ${ci.type}` : ci.type),
                                ...items,
                            ];
                            if (parts.length === 0 && (r.credits ?? 0) > 0) parts.push(`${r.credits} Credits`);
                            return {
                                asString: parts.join(", "),
                                items,
                                credits: r.credits,
                                countedItems,
                            };
                        }

                        return {
                            id: inv.id ?? "",
                            node: inv.node ?? "",
                            desc: inv.desc ?? "",
                            attackingFaction: attackerData.faction ?? inv.attackingFaction ?? "",
                            defendingFaction: defenderData.faction ?? inv.defendingFaction ?? "",
                            completion: typeof inv.completion === "number" ? inv.completion : 0,
                            completed: !!inv.completed,
                            eta: inv.eta ?? "",
                            vsInfestation: !!inv.vsInfestation,
                            attackerReward: buildReward(attackerData.reward ?? inv.attackerReward),
                            defenderReward: buildReward(defenderData.reward ?? inv.defenderReward),
                        };
                    })
                    : [],

                steelPath: j.steelPath
                    ? {
                        currentReward: j.steelPath.currentReward ?? null,
                        expiry: j.steelPath.expiry,
                        rotation: Array.isArray(j.steelPath.rotation)
                            ? j.steelPath.rotation.map((r: any) => ({ name: r.name ?? r.item ?? "", cost: r.cost ?? 0 }))
                            : [],
                        evergreens: Array.isArray(j.steelPath.evergreens)
                            ? j.steelPath.evergreens.map((r: any) => ({ name: r.name ?? r.item ?? "", cost: r.cost ?? 0 }))
                            : [],
                    }
                    : null,

                constructionProgress: j.constructionProgress ?? null,
                dailyDeals: Array.isArray(j.dailyDeals) ? j.dailyDeals : [],
                sentientOutposts: j.sentientOutposts ?? null,

                archimedeas: Array.isArray(j.archimedeas)
                    ? (j.archimedeas as any[]).map((a): Archimedea => ({
                        id: a.id ?? "",
                        tag: a.tag ?? "",
                        variants: Array.isArray(a.variants)
                            ? a.variants.map((v: any) => ({
                                node: v.node ?? "",
                                type: v.type ?? v.missionType ?? "",
                                modifier: v.modifier,
                                modifierDescription: v.modifierDescription,
                            }))
                            : [],
                        personalModifiers: Array.isArray(a.personalModifiers)
                            ? a.personalModifiers.map((m: any) =>
                                typeof m === "string"
                                    ? { tag: m }
                                    : { tag: m.tag ?? m.name ?? "", description: m.description, rarity: m.rarity }
                              )
                            : [],
                        deviations: Array.isArray(a.deviations)
                            ? a.deviations.map((m: any) =>
                                typeof m === "string"
                                    ? { tag: m }
                                    : { tag: m.tag ?? m.name ?? "", description: m.description, rarity: m.rarity }
                              )
                            : [],
                        risks: Array.isArray(a.risks)
                            ? a.risks.map((m: any) =>
                                typeof m === "string"
                                    ? { tag: m }
                                    : { tag: m.tag ?? m.name ?? "", description: m.description, rarity: m.rarity }
                              )
                            : [],
                        endDate: a.endDate ?? a.expiry ?? "",
                        expired: !!a.expired,
                    }))
                    : [],

                calendar: j.calendar
                    ? {
                        days: Array.isArray(j.calendar.days)
                            ? j.calendar.days.map((d: any) => ({
                                date: d.date ?? d.day ?? String(d.dayNumber ?? ""),
                                events: _normCalEvents(d),
                            }))
                            : [],
                        currentDay: j.calendar.currentDay ?? j.calendar.activeDayIndex,
                        season: j.calendar.season,
                    }
                    : null,

                simaris: j.simaris
                    ? {
                        target: j.simaris.target ?? "",
                        isTargetActive: !!j.simaris.isTargetActive,
                    }
                    : null,
            };

            _cache = { data, fetchedAt: Date.now() };
            return data;
        } finally {
            _inflight = null;
        }
    })();

    return _inflight;
}

export function getCachedWorldState(): WorldStateData | null {
    return _cache?.data ?? null;
}

export function getCacheAge(): number | null {
    if (!_cache) return null;
    return Date.now() - _cache.fetchedAt;
}
