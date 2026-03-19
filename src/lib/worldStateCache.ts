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
