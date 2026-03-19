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
    factionKey: string;
    rewardPool: string;
    variants: SortieMission[];
    activation: string;
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
    nodeKey: string;
    missionType: string;
    missionTypeKey: string;
    enemyKey: string;
    tier: string;
    tierNum: number;
    activation: string;
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
    isPermanent: boolean;
    desc: string;
    title: string;
    reputation: number;
    expiry: string;
};

export type Nightwave = {
    season: number;
    tag: string;
    phase: number;
    activeChallenges: NightwaveAct[];
    possibleChallenges: NightwaveAct[];
    expiry: string;
};

export type TraderItem = {
    item: string;
    ducats: number;
    credits: number;
};

export type VoidTraderScheduleItem = {
    expiry: string;
    item: string;
};

export type VoidTrader = {
    active: boolean;
    character: string;
    location: string;
    inventory: TraderItem[];
    activation: string;
    expiry: string;
    completed: boolean;
    schedule: VoidTraderScheduleItem[];
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

export type WsEventReward = {
    asString: string;
    items: string[];
    countedItems: Array<{ type: string; count: number }>;
    credits: number;
};

export type WsEventInterimStep = {
    goal: number;
    reward: WsEventReward;
};

export type WsEvent = {
    id: string;
    description: string;
    tooltip: string;
    expiry: string;
    active: boolean;
    health?: number;
    node?: string;
    victimNode?: string;
    affiliatedWith?: string;
    currentScore?: number;
    maximumScore?: number;
    scoreLocTag?: string;
    tag?: string;
    rewards: WsEventReward[];
    interimSteps: WsEventInterimStep[];
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
    nodeKey: string;
    desc: string;
    attackingFaction: string;
    defendingFaction: string;
    completion: number;
    count: number;
    requiredRuns: number;
    completed: boolean;
    eta: string;
    vsInfestation: boolean;
    isAttackerWinning: boolean;
    rewardTypes: string[];
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
    unknownProgress: string;
};

export type DailyDeal = {
    item: string;
    uniqueName: string;
    discount: number;
    originalPrice: number;
    salePrice: number;
    total: number;
    sold: number;
    activation: string;
    expiry: string;
};

export type SentientOutpostMission = {
    node: string;
    faction: string;
    type: string;
};

export type SentientOutpost = {
    active: boolean;
    activation?: string;
    expiry?: string;
    missionType?: string;
    mission: SentientOutpostMission | null;
};

// ── Archimedea (Temporal Archimedea / The Hex) ────────────────────────────────

export type ArchimedeaMission = {
    node: string;
    type: string;
    faction?: string;
    modifier?: string;
    modifierDescription?: string;
    risks?: ArchimedeaModifier[];
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

export type CalendarEventVariant = {
    label: string;   // node name, hex name, choice name
    detail: string;  // mission type, modifier, description
};

export type CalendarEvent = {
    type: string;        // normalized: "To Do" | "Big Prize!" | "Override" | raw API value
    title: string;
    description: string;
    reward: string;      // human-readable reward (e.g. "Credits ×500", item name)
    standing: string;    // syndicate standing reward if present
    variants: CalendarEventVariant[];   // Override choices, challenge variants, etc.
    extras: Record<string, string>;     // any remaining useful named fields from the API
};

export type CalendarDay = {
    date: string;
    events: CalendarEvent[];
};

export type Calendar = {
    days: CalendarDay[];
    currentDay?: string;
    season?: string;
    yearIteration?: number;
};

// Maps raw API type strings → canonical display types
// Handles both processed strings from translateCalendarEvent() and raw CET_ values
const _EV_TYPE_MAP: Record<string, string> = {
    // Raw DE API types
    "CET_CHALLENGE": "To Do",
    "CET_UPGRADE":   "Override",
    "CET_REWARD":    "Big Prize!",
    "CET_PLOT":      "Birthday",
    // Possible translateCalendarEvent() output strings
    challenge: "To Do", todo: "To Do", weekly: "To Do", mission: "To Do",
    upgrade: "Override", hexoverride: "Override", override: "Override",
    prize: "Big Prize!", reward: "Big Prize!", jackpot: "Big Prize!",
    birthday: "Birthday", dialogue: "Birthday", plot: "Birthday",
};
function _normEvType(raw: string): string {
    return _EV_TYPE_MAP[raw] ?? _EV_TYPE_MAP[raw.toLowerCase()] ?? raw;
}

// Extract a character name from a dialogue path like "/Lotus/.../LettieDialogue_rom.dialogue"
function _birthdayName(dialogueName: string): string {
    const m = dialogueName.match(/\/(\w+?)(?:Dialogue|dialogue)/);
    return m ? m[1] : "";
}

// Hardcoded 1999 character birthdays (MM-DD → name) for dates the API returns with empty events
// Source: Steam guide "Love Guide For The Warframe 1999 Update" (id=3386831846)
const _BIRTHDAY_DATES: Record<string, string> = {
    "01-01": "Kaya",       // Kaya Velasco (Nova protoframe)
    "02-14": "Lettie",     // Lettie / Belladonna (Trinity protoframe)
    "03-15": "Minerva",    // Minerva Hendricks (Saryn protoframe)
    "05-23": "Amir",       // Amir / H16h V0l7463 (Volt protoframe)
    "06-15": "Flare",      // Flare Varleon (Temple protoframe)
    "07-10": "Aoi",        // Aoi / xX GLIMMER Xx (Mag protoframe)
    "11-02": "Eleanor",    // Eleanor / Salem (Nyx protoframe)
    "11-03": "Arthur",     // Arthur / Broadsword (Excalibur protoframe)
    "12-04": "Quincy",     // Quincy / Soldja1Shot1kil (Cyte-09 protoframe)
    "12-21": "Velimir",    // Velimir Volkov II (Frost protoframe)
};

function _normCalEvents(d: any): CalendarEvent[] {
    const toStr = (v: any): string => {
        if (!v && v !== 0) return "";
        if (typeof v === "string") return v;
        if (typeof v === "number") return String(v);
        if (typeof v === "object") {
            if (typeof v.en === "string") return v.en;
            if (typeof v.asString === "string") return v.asString;
            const pick = v.text ?? v.title ?? v.description ?? v.name ?? v.value;
            if (pick != null) return toStr(pick);
        }
        return String(v);
    };
    const toReward = (v: any): string => {
        if (!v) return "";
        if (typeof v === "string") return v;
        if (typeof v === "number") return String(v);
        if (Array.isArray(v)) return v.map(toReward).filter(Boolean).join(", ");
        if (typeof v === "object") {
            if (typeof v.asString === "string") return v.asString;
            const name = v.name ?? v.type ?? v.itemType?.split("/").pop() ?? "";
            const count = v.count && v.count !== 1 ? ` ×${v.count}` : "";
            return name + count || toStr(v);
        }
        return String(v);
    };

    // Fields we handle explicitly — everything else that's a useful string goes to extras
    const HANDLED = new Set(["type","category","kind","challenge","upgrade","reward","rewards",
        "dialogueName","dialogueConvo","title","name","description","text","standing","variants",
        "jobs","events","expired","expiry","activation","id"]);

    const toExtras = (raw: any): Record<string, string> => {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw)) {
            if (HANDLED.has(k) || v == null) continue;
            if (typeof v === "object" && !Array.isArray(v)) continue; // skip unhandled nested objects
            const s = toStr(v);
            if (s) out[k] = s;
        }
        return out;
    };

    const toEv = (raw: any): CalendarEvent => {
        const typeRaw = String(raw.type ?? raw.category ?? raw.kind ?? "");
        const eventType = _normEvType(typeRaw);

        // ── Birthday / plot dialogue — just show whose birthday it is, nothing else ──
        if (eventType === "Birthday") {
            const name = _birthdayName(raw.dialogueName ?? "");
            return {
                type: "Birthday",
                title: name ? `${name}'s Birthday` : "Birthday",
                description: "", reward: "", standing: "", variants: [], extras: {},
            };
        }

        // ── Challenge (CET_CHALLENGE): challenge is a nested { title, description } object ──
        // ── Override (CET_UPGRADE):   upgrade  is a nested { title, description } object ──
        const nested: { title: string; description: string } | null =
            (raw.challenge && typeof raw.challenge === "object" && raw.challenge.title) ? raw.challenge
            : (raw.upgrade && typeof raw.upgrade === "object" && raw.upgrade.title) ? raw.upgrade
            : null;

        // If nested is missing (older API shape or flat structure), fall back to generic probing
        const title = nested?.title
            ?? toStr(raw.title ?? raw.name ?? "");

        const description = nested?.description
            ?? toStr(raw.description ?? raw.text ?? raw.objective ?? raw.goal ?? "");

        // For CET_REWARD the reward is a string; for others probe standard locations
        const reward = toReward(raw.reward ?? raw.rewards ?? raw.prize ?? "");

        return {
            type: eventType,
            title,
            description,
            reward,
            standing: raw.standing != null ? String(raw.standing) : "",
            variants: [],   // Calendar events don't have variants in the current API
            extras: toExtras(raw),
        };
    };

    if (d.events && Array.isArray(d.events)) return (d.events as any[]).map(toEv);
    if (d.jobs   && Array.isArray(d.jobs))   return (d.jobs   as any[]).map(toEv);
    return [];
}

// ── Global Upgrades (active boosters) ─────────────────────────────────────────

export type GlobalUpgrade = {
    upgrade: string;
    operation: string;
    operationSymbol: string;
    upgradeOperationValue: number;
    desc: string;
    eta: string;
    expired: boolean;
    activation: string;
    expiry: string;
};

// ── News ──────────────────────────────────────────────────────────────────────

export type NewsItem = {
    id: string;
    message: string;
    link: string;
    imageLink: string;
    priority: boolean;
    date: string;
    update: boolean;
    primeAccess: boolean;
    stream: boolean;
    mobileOnly: boolean;
};

// ── Arbitration ───────────────────────────────────────────────────────────────

export type Arbitration = {
    node: string;
    type: string;
    enemy: string;
    expiry: string;
    isSteel: boolean;
    expired: boolean;
};

// ── Kuva missions (Siphons & Floods) ──────────────────────────────────────────

export type KuvaMission = {
    node: string;
    type: string;
    tier?: string;
    expiry: string;
    isFlood: boolean;
};

// ── Persistent enemies (Acolytes) ─────────────────────────────────────────────

export type PersistentEnemy = {
    agentType: string;
    locationTag: string;
    rank: number;
    healthPercent: number;
    fleeDamage: number;
    region: string;
    lastDiscoveredTime: string;
    lastDiscoveredAt: string;
    isDiscovered: boolean;
};

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
    globalUpgrades:       GlobalUpgrade[];
    news:                 NewsItem[];
    arbitration:          Arbitration | null;
    kuva:                 KuvaMission[];
    persistentEnemies:    PersistentEnemy[];
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

                sortie: j.sortie
                    ? {
                        boss:        j.sortie.boss        ?? "",
                        faction:     j.sortie.faction     ?? "",
                        factionKey:  j.sortie.factionKey  ?? "",
                        rewardPool:  j.sortie.rewardPool  ?? "",
                        variants:    Array.isArray(j.sortie.variants) ? j.sortie.variants : [],
                        activation:  j.sortie.activation  ?? "",
                        expiry:      j.sortie.expiry      ?? "",
                        expired:     !!j.sortie.expired,
                    }
                    : null,
                archonHunt: j.archonHunt ?? null,

                fissures: Array.isArray(j.fissures)
                    ? (j.fissures as any[]).map((f): Fissure => ({
                        id:             f.id             ?? "",
                        node:           f.node           ?? "",
                        nodeKey:        f.nodeKey        ?? "",
                        missionType:    f.missionType    ?? "",
                        missionTypeKey: f.missionTypeKey ?? "",
                        enemy:          f.enemy          ?? "",
                        enemyKey:       f.enemyKey       ?? "",
                        tier:           f.tier           ?? "",
                        tierNum:        f.tierNum        ?? 0,
                        activation:     f.activation     ?? "",
                        expiry:         f.expiry         ?? "",
                        eta:            f.eta            ?? "",
                        isStorm:        !!f.isStorm,
                        isHard:         !!f.isHard,
                        expired:        !!f.expired,
                    }))
                    : [],

                nightwave: j.nightwave
                    ? (() => {
                        const mapAct = (c: any): NightwaveAct => ({
                            id:          c.id          ?? "",
                            isDaily:     !!c.isDaily,
                            isElite:     !!c.isElite,
                            isPermanent: !!c.isPermanent,
                            desc:        c.desc        ?? "",
                            title:       c.title       ?? "",
                            reputation:  c.reputation  ?? 0,
                            expiry:      c.expiry      ?? "",
                        });
                        return {
                            season:            j.nightwave.season  ?? 0,
                            tag:               j.nightwave.tag     ?? "",
                            phase:             j.nightwave.phase   ?? 0,
                            activeChallenges:  Array.isArray(j.nightwave.activeChallenges)
                                ? j.nightwave.activeChallenges.map(mapAct)
                                : [],
                            possibleChallenges: Array.isArray(j.nightwave.possibleChallenges)
                                ? j.nightwave.possibleChallenges.map(mapAct)
                                : [],
                            expiry:            j.nightwave.expiry  ?? "",
                        };
                    })()
                    : null,
                voidTrader: j.voidTrader
                    ? {
                        active:     !!j.voidTrader.active,
                        character:  j.voidTrader.character  ?? "",
                        location:   j.voidTrader.location   ?? "",
                        inventory:  Array.isArray(j.voidTrader.inventory) ? j.voidTrader.inventory : [],
                        activation: j.voidTrader.activation ?? "",
                        expiry:     j.voidTrader.expiry     ?? "",
                        completed:  !!j.voidTrader.completed,
                        schedule:   Array.isArray(j.voidTrader.schedule)
                            ? (j.voidTrader.schedule as any[]).map((s): VoidTraderScheduleItem => ({
                                expiry: s.expiry ?? "",
                                item:   s.item   ?? "",
                            }))
                            : [],
                    }
                    : null,
                vaultTrader: j.vaultTrader ?? null,

                events: Array.isArray(j.events)
                    ? (j.events as any[]).filter((e) => e.active !== false).map((e): WsEvent => {
                        function buildEvReward(r: any): WsEventReward {
                            if (!r) return { asString: "", items: [], countedItems: [], credits: 0 };
                            const items: string[] = Array.isArray(r.items) ? r.items.filter(Boolean) : [];
                            const countedItems: Array<{ type: string; count: number }> = Array.isArray(r.countedItems)
                                ? r.countedItems.filter((ci: any) => ci?.type || ci?.key).map((ci: any) => ({ type: ci.type ?? ci.key ?? "", count: ci.count ?? 1 }))
                                : [];
                            const parts = [
                                ...countedItems.map((ci) => ci.count > 1 ? `${ci.count}x ${ci.type}` : ci.type),
                                ...items,
                            ];
                            const credits = r.credits ?? 0;
                            if (parts.length === 0 && credits > 0) parts.push(`${credits.toLocaleString()} Credits`);
                            return { asString: parts.join(", "), items, countedItems, credits };
                        }
                        const rewards: WsEventReward[] = Array.isArray(e.rewards)
                            ? e.rewards.map(buildEvReward).filter((r: WsEventReward) => r.asString)
                            : [];
                        const interimSteps: WsEventInterimStep[] = Array.isArray(e.interimSteps)
                            ? e.interimSteps.filter((s: any) => s?.goal != null).map((s: any) => ({
                                goal: s.goal,
                                reward: buildEvReward(s.reward),
                            }))
                            : [];
                        return {
                            id: e.id ?? "",
                            description: e.description ?? "",
                            tooltip: e.tooltip ?? "",
                            expiry: e.expiry ?? "",
                            active: e.active !== false,
                            health: typeof e.health === "number" ? e.health : undefined,
                            node: e.node ?? e.victimNode ?? undefined,
                            victimNode: e.victimNode ?? undefined,
                            affiliatedWith: e.affiliatedWith ?? undefined,
                            currentScore: typeof e.currentScore === "number" ? e.currentScore : undefined,
                            maximumScore: typeof e.maximumScore === "number" ? e.maximumScore : undefined,
                            scoreLocTag: e.scoreLocTag ?? undefined,
                            tag: e.tag ?? undefined,
                            rewards,
                            interimSteps,
                        };
                    })
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
                            nodeKey: inv.nodeKey ?? "",
                            desc: inv.desc ?? "",
                            attackingFaction: attackerData.faction ?? inv.attackingFaction ?? "",
                            defendingFaction: defenderData.faction ?? inv.defendingFaction ?? "",
                            completion: typeof inv.completion === "number" ? inv.completion : 0,
                            count: typeof inv.count === "number" ? inv.count : 0,
                            requiredRuns: typeof inv.requiredRuns === "number" ? inv.requiredRuns : 0,
                            completed: !!inv.completed,
                            eta: inv.eta ?? "",
                            vsInfestation: !!inv.vsInfestation,
                            isAttackerWinning: !!inv.isAttackerWinning,
                            rewardTypes: Array.isArray(inv.rewardTypes) ? inv.rewardTypes : [],
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

                constructionProgress: j.constructionProgress
                    ? {
                        fomorianProgress: j.constructionProgress.fomorianProgress ?? "0",
                        razorbackProgress: j.constructionProgress.razorbackProgress ?? "0",
                        unknownProgress:  j.constructionProgress.unknownProgress   ?? "0",
                    }
                    : null,

                dailyDeals: Array.isArray(j.dailyDeals)
                    ? (j.dailyDeals as any[]).map((d): DailyDeal => ({
                        item:          d.item          ?? "",
                        uniqueName:    d.uniqueName    ?? "",
                        discount:      d.discount      ?? 0,
                        originalPrice: d.originalPrice ?? 0,
                        salePrice:     d.salePrice     ?? 0,
                        total:         d.total         ?? 0,
                        sold:          d.sold          ?? 0,
                        activation:    d.activation    ?? "",
                        expiry:        d.expiry        ?? "",
                    }))
                    : [],

                sentientOutposts: j.sentientOutposts
                    ? {
                        active:      !!j.sentientOutposts.active,
                        activation:  j.sentientOutposts.activation ?? undefined,
                        expiry:      j.sentientOutposts.expiry     ?? undefined,
                        missionType: j.sentientOutposts.missionType ?? undefined,
                        mission: j.sentientOutposts.mission
                            ? {
                                node:    j.sentientOutposts.mission.node    ?? "",
                                faction: j.sentientOutposts.mission.faction ?? "",
                                type:    j.sentientOutposts.mission.type    ?? "",
                            }
                            : null,
                    }
                    : null,

                archimedeas: Array.isArray(j.archimedeas)
                    ? (j.archimedeas as any[]).map((a): Archimedea => {
                        const mapModifier = (m: any): ArchimedeaModifier =>
                            typeof m === "string"
                                ? { tag: m }
                                : { tag: m.tag ?? m.key ?? m.name ?? "", description: m.description, rarity: m.rarity };
                        // The parser uses `missions` (new) or `variants` (old) — handle both
                        const rawMissions: any[] = Array.isArray(a.missions) ? a.missions
                            : Array.isArray(a.variants) ? a.variants
                            : [];
                        const variants: ArchimedeaMission[] = rawMissions.map((v: any) => ({
                            node:                v.node                ?? "",
                            type:                v.type                ?? v.missionType   ?? "",
                            faction:             v.faction             ?? v.factionKey    ?? undefined,
                            // New parser shape: deviation is a nested {key,name,description} object
                            modifier:            v.modifier            ?? v.deviation?.name ?? undefined,
                            modifierDescription: v.modifierDescription ?? v.deviation?.description ?? undefined,
                            // Per-mission risks from new parser shape
                            risks: Array.isArray(v.risks) ? v.risks.map(mapModifier) : undefined,
                        }));
                        // Top-level personalModifiers (and old-shape deviations/risks)
                        const personalModifiers = Array.isArray(a.personalModifiers)
                            ? a.personalModifiers.map(mapModifier) : [];
                        const deviations = Array.isArray(a.deviations)
                            ? a.deviations.map(mapModifier) : [];
                        const risks = Array.isArray(a.risks)
                            ? a.risks.map(mapModifier) : [];
                        return {
                            id:    a.id    ?? "",
                            tag:   a.tag   ?? a.type ?? "",
                            variants,
                            personalModifiers,
                            deviations,
                            risks,
                            endDate: a.endDate ?? a.expiry ?? "",
                            expired: !!a.expired,
                        };
                    })
                    : [],

                calendar: j.calendar
                    ? {
                        days: Array.isArray(j.calendar.days)
                            ? j.calendar.days.map((d: any) => {
                                const date: string = d.date ?? d.day ?? String(d.dayNumber ?? "");
                                let events = _normCalEvents(d);
                                // If the API returned no events, check if this is a known birthday date
                                if (events.length === 0 && date) {
                                    const parsed = new Date(date);
                                    if (!isNaN(parsed.getTime())) {
                                        const mm = String(parsed.getUTCMonth() + 1).padStart(2, "0");
                                        const dd = String(parsed.getUTCDate()).padStart(2, "0");
                                        const charName = _BIRTHDAY_DATES[`${mm}-${dd}`];
                                        if (charName) {
                                            events = [{
                                                type: "Birthday",
                                                title: `${charName}'s Birthday`,
                                                description: "", reward: "", standing: "", variants: [], extras: {},
                                            }];
                                        }
                                    }
                                }
                                return { date, events };
                            })
                            : [],
                        currentDay:    j.calendar.currentDay ?? j.calendar.activeDayIndex,
                        season:        j.calendar.season,
                        yearIteration: typeof j.calendar.yearIteration === "number"
                            ? j.calendar.yearIteration
                            : undefined,
                    }
                    : null,

                simaris: j.simaris
                    ? {
                        target: j.simaris.target ?? "",
                        isTargetActive: !!j.simaris.isTargetActive,
                    }
                    : null,

                // ── New fields ─────────────────────────────────────────────
                globalUpgrades: Array.isArray(j.globalUpgrades)
                    ? (j.globalUpgrades as any[]).filter((g) => !g.expired).map((g): GlobalUpgrade => ({
                        upgrade:               g.upgrade               ?? "",
                        operation:             g.operation             ?? "",
                        operationSymbol:       g.operationSymbol       ?? "",
                        upgradeOperationValue: g.upgradeOperationValue ?? 0,
                        desc:                  g.desc                  ?? "",
                        eta:                   g.eta                   ?? "",
                        expired:               !!g.expired,
                        activation:            g.activation            ?? "",
                        expiry:                g.expiry                ?? "",
                    }))
                    : [],

                news: Array.isArray(j.news)
                    ? (j.news as any[]).filter((n) => !n.mobileOnly).map((n): NewsItem => ({
                        id:          n.id          ?? "",
                        message:     n.message     ?? "",
                        link:        n.link        ?? "",
                        imageLink:   n.imageLink   ?? "",
                        priority:    !!n.priority,
                        date:        n.date        ?? "",
                        update:      !!n.update,
                        primeAccess: !!n.primeAccess,
                        stream:      !!n.stream,
                        mobileOnly:  !!n.mobileOnly,
                    }))
                    : [],

                arbitration: j.arbitration && !j.arbitration.expired
                    ? {
                        node:    j.arbitration.node    ?? j.arbitration.location ?? "",
                        type:    j.arbitration.type    ?? j.arbitration.missionType ?? "",
                        enemy:   j.arbitration.enemy   ?? j.arbitration.faction ?? "",
                        expiry:  j.arbitration.expiry  ?? "",
                        isSteel: !!j.arbitration.isSteel,
                        expired: !!j.arbitration.expired,
                    }
                    : null,

                kuva: Array.isArray(j.kuva)
                    ? (j.kuva as any[]).map((k): KuvaMission => ({
                        node:    k.node    ?? k.location ?? "",
                        type:    k.type    ?? k.missionType ?? "",
                        tier:    k.tier    ?? undefined,
                        expiry:  k.expiry  ?? "",
                        isFlood: !!(k.isFlood ?? k.type?.toLowerCase().includes("flood")),
                    }))
                    : [],

                persistentEnemies: Array.isArray(j.persistentEnemies)
                    ? (j.persistentEnemies as any[]).map((e): PersistentEnemy => ({
                        agentType:         e.agentType         ?? e.type ?? "",
                        locationTag:       e.locationTag       ?? "",
                        rank:              e.rank              ?? 0,
                        healthPercent:     e.healthPercent     ?? 0,
                        fleeDamage:        e.fleeDamage        ?? 0,
                        region:            e.region            ?? "",
                        lastDiscoveredTime: e.lastDiscoveredTime ?? e.lastDiscoveredAt ?? "",
                        lastDiscoveredAt:  e.lastDiscoveredAt  ?? "",
                        isDiscovered:      !!e.isDiscovered,
                    }))
                    : [],
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

// ── Invasion helpers ───────────────────────────────────────────────────────────

export type ProcessedInvasion = Invasion & {
    /** Human-readable node name (before the parenthesis), e.g. "Cypress" */
    nodeName: string;
    /** Planet name parsed from the API node string, e.g. "Pluto" */
    planet: string;
    /** Display label formatted as "Planet (Node)", e.g. "Pluto (Cypress)" */
    displayLabel: string;
};

/**
 * Parse, deduplicate, and sort invasions for display.
 *
 * - Parses "Node (Planet)" API strings into separate planet/node fields
 * - Deduplicates: if two invasions share the same node+planet+rewards, keeps
 *   only the one with the highest completion % (the other is a stale duplicate)
 * - Sorts alphabetically: planet → nodeName (case-insensitive)
 *
 * Done-to-bottom ordering is left to the caller (requires store access).
 */
export function processInvasions(invasions: Invasion[]): ProcessedInvasion[] {
    // Parse planet/node from "Node (Planet)" format
    const parsed: ProcessedInvasion[] = invasions.map((inv) => {
        const match = inv.node.match(/^(.+?)\s*\((.+?)\)\s*$/);
        const nodeName = match ? match[1].trim() : inv.node;
        const planet   = match ? match[2].trim() : "";
        const displayLabel = planet ? `${planet} (${nodeName})` : inv.node;
        return { ...inv, nodeName, planet, displayLabel };
    });

    // Deduplicate: same node+planet+attacker reward+defender reward → keep highest completion
    const seen = new Map<string, ProcessedInvasion>();
    for (const inv of parsed) {
        const key = [
            inv.planet,
            inv.nodeName,
            inv.attackerReward?.asString ?? "",
            inv.defenderReward?.asString ?? "",
        ].join("\x00");
        const existing = seen.get(key);
        if (!existing || inv.completion > existing.completion) {
            seen.set(key, inv);
        }
    }

    // Sort alphabetically: planet first, then node name
    return Array.from(seen.values()).sort((a, b) => {
        const planet = a.planet.localeCompare(b.planet, undefined, { sensitivity: "base" });
        if (planet !== 0) return planet;
        return a.nodeName.localeCompare(b.nodeName, undefined, { sensitivity: "base" });
    });
}
