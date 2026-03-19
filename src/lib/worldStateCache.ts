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

export type DuviriChoice = { category: string; name: string };

export type DuviriCycle = {
    state: string;
    expiry: string;
    choices: DuviriChoice[];
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

export type SteelPath = {
    currentReward: { name: string; cost: number } | null;
    expiry?: string;
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
                duviriCycle:  j.duviriCycle  ?? null,
                sortie:       j.sortie       ?? null,
                archonHunt:   j.archonHunt   ?? null,
                fissures:     Array.isArray(j.fissures) ? j.fissures : [],
                nightwave:    j.nightwave  ?? null,
                voidTrader:   j.voidTrader ?? null,
                vaultTrader:  j.vaultTrader ?? null,
                events: Array.isArray(j.events)
                    ? (j.events as WsEvent[]).filter((e) => e.active !== false)
                    : [],
                invasions: Array.isArray(j.invasions)
                    ? (j.invasions as any[]).filter((inv) => !inv.completed).map((inv): Invasion => {
                        // API uses nested attacker/defender objects
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
                    ? { currentReward: j.steelPath.currentReward ?? null, expiry: j.steelPath.expiry }
                    : null,
                constructionProgress: j.constructionProgress ?? null,
                dailyDeals: Array.isArray(j.dailyDeals) ? j.dailyDeals : [],
                sentientOutposts: j.sentientOutposts ?? null,
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
