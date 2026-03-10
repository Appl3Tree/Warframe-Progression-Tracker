// ===== FILE: src/store/store.ts =====
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { toYMD } from "../domain/ymd";
import type {
    DailyTask,
    ResetChecklistBucket,
    ResetChecklistState,
    ResetDisplayMode,
    SyndicateState
} from "../domain/types";
import { SEED_INVENTORY, SEED_MASTERY, SEED_MISSIONS, SEED_SYNDICATES } from "../domain/seed";
import type { PageKey, UserGoalV1, UserStateV2 } from "../domain/models/userState";
import { migrateToUserStateV2 } from "./migrations";
import { parseProfileViewingData } from "../utils/profileImport";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";
import { canAccessItemByName } from "../domain/logic/plannerEngine";
import { validateDataOrThrow } from "../domain/logic/startupValidation";
import { SY } from "../domain/ids/syndicateIds";

validateDataOrThrow();

function nowIso(): string {
    return new Date().toISOString();
}

function uid(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function utcDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function getCurrentPrimaryDailyResetKey(now: Date): string {
    return utcDateKey(now);
}

function getCurrentSecondaryDailyResetKey(now: Date): string {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 17, 0, 0, 0));
    if (now.getTime() >= start.getTime()) {
        return utcDateKey(start);
    }

    start.setUTCDate(start.getUTCDate() - 1);
    return utcDateKey(start);
}

function getCurrentWeeklyMondayResetKey(now: Date): string {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = start.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    start.setUTCDate(start.getUTCDate() - diffToMonday);
    return utcDateKey(start);
}

function getCurrentWeeklyFridayResetKey(now: Date): string {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = start.getUTCDay();
    const diffToFriday = (day + 2) % 7;
    start.setUTCDate(start.getUTCDate() - diffToFriday);
    return utcDateKey(start);
}

function normalizeStringArray(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];

    const out: string[] = [];
    const seen = new Set<string>();

    for (const v of raw) {
        const s = String(v ?? "").trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }

    return out;
}

function makeDefaultResetChecklistState(now = new Date()): ResetChecklistState {
    return {
        primaryDailyResetKey: getCurrentPrimaryDailyResetKey(now),
        secondaryDailyResetKey: getCurrentSecondaryDailyResetKey(now),
        weeklyMondayResetKey: getCurrentWeeklyMondayResetKey(now),
        weeklyFridayResetKey: getCurrentWeeklyFridayResetKey(now),
        completedPrimaryDailyTaskIds: [],
        completedSecondaryDailyTaskIds: [],
        completedWeeklyMondayTaskIds: [],
        completedWeeklyFridayTaskIds: [],
        timeMode: "utc"
    };
}

function ensureResetChecklistState(state: any): void {
    const fallback = makeDefaultResetChecklistState();

    if (!state || typeof state !== "object") return;

    if (!state.resetChecklist || typeof state.resetChecklist !== "object") {
        state.resetChecklist = fallback;
        return;
    }

    const raw = state.resetChecklist;

    state.resetChecklist = {
        primaryDailyResetKey:
            typeof raw.primaryDailyResetKey === "string" && raw.primaryDailyResetKey.trim()
                ? raw.primaryDailyResetKey
                : typeof raw.dailyResetKey === "string" && raw.dailyResetKey.trim()
                    ? raw.dailyResetKey
                    : fallback.primaryDailyResetKey,
        secondaryDailyResetKey:
            typeof raw.secondaryDailyResetKey === "string" && raw.secondaryDailyResetKey.trim()
                ? raw.secondaryDailyResetKey
                : fallback.secondaryDailyResetKey,
        weeklyMondayResetKey:
            typeof raw.weeklyMondayResetKey === "string" && raw.weeklyMondayResetKey.trim()
                ? raw.weeklyMondayResetKey
                : typeof raw.weeklyResetKey === "string" && raw.weeklyResetKey.trim()
                    ? raw.weeklyResetKey
                    : fallback.weeklyMondayResetKey,
        weeklyFridayResetKey:
            typeof raw.weeklyFridayResetKey === "string" && raw.weeklyFridayResetKey.trim()
                ? raw.weeklyFridayResetKey
                : fallback.weeklyFridayResetKey,
        completedPrimaryDailyTaskIds: normalizeStringArray(raw.completedPrimaryDailyTaskIds ?? raw.completedDailyTaskIds),
        completedSecondaryDailyTaskIds: normalizeStringArray(raw.completedSecondaryDailyTaskIds),
        completedWeeklyMondayTaskIds: normalizeStringArray(raw.completedWeeklyMondayTaskIds ?? raw.completedWeeklyTaskIds),
        completedWeeklyFridayTaskIds: normalizeStringArray(raw.completedWeeklyFridayTaskIds),
        timeMode: raw.timeMode === "local" ? "local" : "utc"
    };
}

function syncResetChecklistState(state: UserStateV2, now = new Date()): boolean {
    ensureResetChecklistState(state);

    const nextPrimaryDailyKey = getCurrentPrimaryDailyResetKey(now);
    const nextSecondaryDailyKey = getCurrentSecondaryDailyResetKey(now);
    const nextWeeklyMondayKey = getCurrentWeeklyMondayResetKey(now);
    const nextWeeklyFridayKey = getCurrentWeeklyFridayResetKey(now);

    let changed = false;

    if (state.resetChecklist.primaryDailyResetKey !== nextPrimaryDailyKey) {
        state.resetChecklist.primaryDailyResetKey = nextPrimaryDailyKey;
        state.resetChecklist.completedPrimaryDailyTaskIds = [];
        changed = true;
    }

    if (state.resetChecklist.secondaryDailyResetKey !== nextSecondaryDailyKey) {
        state.resetChecklist.secondaryDailyResetKey = nextSecondaryDailyKey;
        state.resetChecklist.completedSecondaryDailyTaskIds = [];
        changed = true;
    }

    if (state.resetChecklist.weeklyMondayResetKey !== nextWeeklyMondayKey) {
        state.resetChecklist.weeklyMondayResetKey = nextWeeklyMondayKey;
        state.resetChecklist.completedWeeklyMondayTaskIds = [];
        changed = true;
    }

    if (state.resetChecklist.weeklyFridayResetKey !== nextWeeklyFridayKey) {
        state.resetChecklist.weeklyFridayResetKey = nextWeeklyFridayKey;
        state.resetChecklist.completedWeeklyFridayTaskIds = [];
        changed = true;
    }

    return changed;
}

function makeDefaultState(): UserStateV2 {
    const iso = nowIso();
    return {
        meta: {
            schemaVersion: 2,
            createdAtIso: iso,
            updatedAtIso: iso
        },
        player: {
            platform: "PC",
            accountId: "",
            displayName: "",
            masteryRank: null,
            clanName: undefined,
            clanTier: undefined,
            clanClass: undefined,
            clanXp: undefined
        },
        ui: {
            activePage: "dashboard",
            expandedGoalNodes: {}
        },
        prereqs: {
            completed: {}
        },
        inventory: SEED_INVENTORY,
        syndicates: SEED_SYNDICATES,
        dailyTasks: [],
        resetChecklist: makeDefaultResetChecklistState(),
        goals: [],
        mastery: SEED_MASTERY,
        missions: SEED_MISSIONS
    };
}

const PlatformSchema = z.enum(["PC", "PlayStation", "Xbox", "Switch", "Mobile"]);

const InventorySchema = z.object({
    credits: z.number().int().min(0),
    platinum: z.number().int().min(0),
    counts: z.record(z.string(), z.number().nonnegative())
});

const ProgressPackSchemaV2 = z
    .object({
        meta: z
            .object({
                schemaVersion: z.literal(2),
                createdAtIso: z.string(),
                updatedAtIso: z.string()
            })
            .passthrough(),
        player: z
            .object({
                platform: PlatformSchema.optional(),
                accountId: z.string().optional(),
                displayName: z.string().optional(),
                masteryRank: z.number().nullable().optional(),
                clanName: z.string().optional(),
                clanTier: z.number().optional(),
                clanClass: z.number().optional(),
                clanXp: z.number().optional()
            })
            .passthrough()
            .optional(),
        ui: z
            .object({
                activePage: z.string()
            })
            .passthrough()
            .optional(),
        prereqs: z
            .object({
                completed: z.record(z.string(), z.boolean())
            })
            .passthrough()
            .optional(),
        inventory: InventorySchema.optional(),
        syndicates: z.any().optional(),
        dailyTasks: z.any().optional(),
        resetChecklist: z.any().optional(),
        goals: z.any().optional(),
        mastery: z.any().optional(),
        missions: z.any().optional()
    })
    .passthrough();

function ensureGoalsArray(state: any): void {
    if (!state || typeof state !== "object") return;
    if (!Array.isArray(state.goals)) state.goals = [];
}

function ensureUiExpansion(state: any): void {
    if (!state || typeof state !== "object") return;
    if (!state.ui || typeof state.ui !== "object") state.ui = { activePage: "dashboard" };
    if (!state.ui.expandedGoalNodes || typeof state.ui.expandedGoalNodes !== "object") {
        state.ui.expandedGoalNodes = {};
    }
}

function mergeProgressPackIntoState(current: UserStateV2, incoming: any): UserStateV2 {
    const next: UserStateV2 = {
        ...current,
        meta: {
            ...current.meta,
            updatedAtIso: nowIso()
        }
    };

    if (incoming.player) {
        next.player = {
            ...next.player,
            ...incoming.player
        };
    }

    if (incoming.ui) {
        next.ui = {
            activePage: (incoming.ui.activePage as PageKey) ?? next.ui.activePage,
            expandedGoalNodes: {
                ...next.ui.expandedGoalNodes,
                ...((incoming.ui as any).expandedGoalNodes as Record<string, boolean> | undefined)
            }
        };
    }

    if (incoming.prereqs?.completed && typeof incoming.prereqs.completed === "object") {
        next.prereqs = {
            ...next.prereqs,
            completed: {
                ...next.prereqs.completed,
                ...incoming.prereqs.completed
            }
        };
    }

    if (incoming.inventory) {
        next.inventory = {
            credits:
                typeof incoming.inventory.credits === "number"
                    ? Math.max(0, Math.floor(incoming.inventory.credits))
                    : next.inventory.credits,
            platinum:
                typeof incoming.inventory.platinum === "number"
                    ? Math.max(0, Math.floor(incoming.inventory.platinum))
                    : next.inventory.platinum,
            counts: {
                ...next.inventory.counts,
                ...(incoming.inventory.counts ?? {})
            }
        };
    }

    if (incoming.syndicates !== undefined) {
        next.syndicates = incoming.syndicates;
    }

    if (incoming.dailyTasks !== undefined) {
        next.dailyTasks = incoming.dailyTasks;
    }

    if (incoming.resetChecklist !== undefined) {
        (next as any).resetChecklist = incoming.resetChecklist;
    }

    if (incoming.goals !== undefined) {
        next.goals = incoming.goals;
    }

    if (incoming.mastery !== undefined) {
        next.mastery = incoming.mastery;
    }

    if (incoming.missions !== undefined) {
        next.missions = incoming.missions;
    }

    ensureGoalsArray(next);
    ensureUiExpansion(next);
    ensureResetChecklistState(next);

    return next;
}

type ReserveSource = {
    syndicateId: string;
    syndicateName: string;
    amount: number;
    label?: string;
};

type DerivedReserveLine = {
    key: string;
    minKeep: number;
    sources: ReserveSource[];
};

function isAccessibleReserveKey(
    key: string,
    completedPrereqs: Record<string, boolean>,
    masteryRank: number | null
): boolean {
    if (key === "credits" || key === "platinum") {
        return true;
    }

    const rec = FULL_CATALOG.recordsById[key as any];
    const name = typeof rec?.displayName === "string" ? rec.displayName : "";
    if (!name) {
        return false;
    }

    const access = canAccessItemByName(name, completedPrereqs, masteryRank);
    return access.allowed;
}

function computeDerivedReservesFromSyndicates(
    syndicates: any[],
    completedPrereqs: Record<string, boolean>,
    masteryRank: number | null
): DerivedReserveLine[] {
    const byKey: Record<string, { minKeep: number; sources: ReserveSource[] }> = {};

    for (const syn of syndicates ?? []) {
        const syndicateId = typeof syn?.id === "string" ? syn.id : "";
        const syndicateName = typeof syn?.name === "string" ? syn.name : syndicateId || "Unknown Syndicate";
        const nr = syn?.nextRankUp;
        if (!nr || typeof nr !== "object") continue;

        const credits = Number(nr.credits ?? 0);
        if (Number.isFinite(credits) && credits > 0) {
            const key = "credits";
            if (isAccessibleReserveKey(key, completedPrereqs, masteryRank)) {
                if (!byKey[key]) byKey[key] = { minKeep: 0, sources: [] };
                byKey[key].minKeep += Math.floor(credits);
                byKey[key].sources.push({
                    syndicateId,
                    syndicateName,
                    amount: Math.floor(credits),
                    label: "Credits"
                });
            }
        }

        const platinum = Number(nr.platinum ?? 0);
        if (Number.isFinite(platinum) && platinum > 0) {
            const key = "platinum";
            if (isAccessibleReserveKey(key, completedPrereqs, masteryRank)) {
                if (!byKey[key]) byKey[key] = { minKeep: 0, sources: [] };
                byKey[key].minKeep += Math.floor(platinum);
                byKey[key].sources.push({
                    syndicateId,
                    syndicateName,
                    amount: Math.floor(platinum),
                    label: "Platinum"
                });
            }
        }

        const items = Array.isArray(nr.items) ? nr.items : [];
        for (const it of items) {
            const key = typeof it?.key === "string" ? it.key : "";
            if (!key) continue;

            const count = Number(it?.count ?? 0);
            if (!Number.isFinite(count) || count <= 0) continue;

            if (!isAccessibleReserveKey(key, completedPrereqs, masteryRank)) {
                continue;
            }

            if (!byKey[key]) byKey[key] = { minKeep: 0, sources: [] };
            byKey[key].minKeep += Math.floor(count);
            byKey[key].sources.push({
                syndicateId,
                syndicateName,
                amount: Math.floor(count),
                label: typeof it?.label === "string" ? it.label : undefined
            });
        }
    }

    const out: DerivedReserveLine[] = Object.entries(byKey)
        .map(([key, v]) => ({
            key,
            minKeep: Math.max(0, Math.floor(v.minKeep)),
            sources: v.sources
        }))
        .filter((x) => x.minKeep > 0);

    out.sort((a, b) => {
        if (a.key === "credits" && b.key !== "credits") return -1;
        if (a.key !== "credits" && b.key === "credits") return 1;
        if (a.key === "platinum" && b.key !== "platinum") return -1;
        if (a.key !== "platinum" && b.key === "platinum") return 1;
        return a.key.localeCompare(b.key);
    });

    return out;
}

function normalizeSyndicatePatch(input: any): Partial<SyndicateState> {
    const out: Partial<SyndicateState> = {};

    if (!input || typeof input !== "object") return out;

    if (typeof input.id === "string") out.id = input.id;
    if (typeof input.name === "string") out.name = input.name;

    if (typeof input.rank === "number" && Number.isFinite(input.rank)) out.rank = Math.floor(input.rank);
    if (typeof input.standing === "number" && Number.isFinite(input.standing)) out.standing = Math.floor(input.standing);

    if (typeof input.pledged === "boolean") out.pledged = input.pledged;

    if (typeof input.standingCap === "number" && Number.isFinite(input.standingCap)) out.standingCap = Math.floor(input.standingCap);
    if (typeof input.dailyCap === "number" && Number.isFinite(input.dailyCap)) out.dailyCap = Math.floor(input.dailyCap);

    if (input.nextRankUp && typeof input.nextRankUp === "object") {
        out.nextRankUp = input.nextRankUp;
    }

    return out;
}

function upsertSyndicateIntoList(list: SyndicateState[], patch: Partial<SyndicateState>): SyndicateState[] {
    const id = String(patch.id ?? "").trim();
    if (!id) return list;

    const idx = list.findIndex((s) => s.id === id);
    if (idx >= 0) {
        const prev = list[idx];
        list[idx] = {
            ...prev,
            ...patch,
            id: prev.id,
            name: typeof patch.name === "string" && patch.name.trim() ? patch.name : prev.name
        };
        return list;
    }

    const name = typeof patch.name === "string" && patch.name.trim() ? patch.name : id;
    list.push({
        id,
        name,
        rank: typeof patch.rank === "number" ? patch.rank : 0,
        standing: typeof patch.standing === "number" ? patch.standing : 0,
        pledged: typeof patch.pledged === "boolean" ? patch.pledged : false
    });

    return list;
}

function isPrimaryFactionId(id: string): boolean {
    return (
        id === SY.STEEL_MERIDIAN ||
        id === SY.ARBITERS_OF_HEXIS ||
        id === SY.CEPHALON_SUDA ||
        id === SY.THE_PERRIN_SEQUENCE ||
        id === SY.RED_VEIL ||
        id === SY.NEW_LOKA
    );
}

function countPrimaryPledges(list: SyndicateState[]): number {
    let n = 0;
    for (const s of list) {
        if (s && typeof s.id === "string" && isPrimaryFactionId(s.id) && s.pledged) n++;
    }
    return n;
}

function getResetTaskArray(state: UserStateV2, bucket: ResetChecklistBucket): string[] {
    ensureResetChecklistState(state);

    if (bucket === "primary_daily") return state.resetChecklist.completedPrimaryDailyTaskIds;
    if (bucket === "secondary_daily") return state.resetChecklist.completedSecondaryDailyTaskIds;
    if (bucket === "weekly_monday") return state.resetChecklist.completedWeeklyMondayTaskIds;
    return state.resetChecklist.completedWeeklyFridayTaskIds;
}

export interface TrackerStore {
    state: UserStateV2;

    setActivePage: (page: PageKey) => void;

    setPrereqCompleted: (prereqId: string, completed: boolean) => void;
    bulkOverwritePrereqs: (patch: Record<string, boolean>) => void;

    setCount: (key: string, count: number) => void;

    setCredits: (credits: number) => void;
    setPlatinum: (platinum: number) => void;
    setMasteryRank: (masteryRank: number | null) => void;

    setAccountId: (accountId: string) => void;
    setPlatform: (platform: "PC" | "PlayStation" | "Xbox" | "Switch" | "Mobile") => void;

    importProfileViewingDataJson: (text: string) => { ok: boolean; error?: string };

    upsertDailyTask: (dateYmd: string, label: string, syndicate?: string, details?: string) => void;
    toggleDailyTask: (taskId: string) => void;
    deleteDailyTask: (taskId: string) => void;

    syncResetChecklistResets: () => void;
    toggleResetChecklistTask: (taskId: string, bucket: ResetChecklistBucket) => void;
    clearResetChecklistTasks: (bucket: ResetChecklistBucket) => void;
    isResetChecklistTaskCompleted: (taskId: string, bucket: ResetChecklistBucket) => boolean;
    setResetChecklistTimeMode: (mode: ResetDisplayMode) => void;

    upsertSyndicate: (patch: Partial<SyndicateState>) => void;

    togglePrimaryPledge: (syndicateId: string) => void;
    clearPrimaryPledges: () => void;

    exportProgressPackJson: () => string;
    importProgressPackJson: (json: string) => { ok: boolean; error?: string };

    resetToDefaults: () => void;
    resetAllLocalData: () => void;

    getTodayTasks: () => DailyTask[];

    getDerivedReserves: () => DerivedReserveLine[];
    isBelowReserve: (key: string, spendAmount: number) => { blocked: boolean; reasons: string[] };

    addGoalItem: (catalogId: string, qty?: number) => void;
    removeGoal: (goalId: string) => void;
    setGoalQty: (goalId: string, qty: number) => void;
    setGoalNote: (goalId: string, note: string) => void;
    toggleGoalActive: (goalId: string) => void;
    setGoalComponentCompleted: (goalId: string, componentKey: string, done: boolean) => void;
    clearAllGoals: () => void;

    toggleExpandedGoalNode: (nodeId: string) => void;
    setExpandedGoalNode: (nodeId: string, expanded: boolean) => void;
    isExpandedGoalNode: (nodeId: string) => boolean;

    setNodeCompleted: (starChartNodeId: string, completed: boolean) => void;
    setBulkNodesCompleted: (starChartNodeIds: string[], completed: boolean) => void;
    isNodeCompleted: (starChartNodeId: string) => boolean;
    setSteelPathNodeCompleted: (starChartNodeId: string, completed: boolean) => void;
    setBulkSteelPathNodesCompleted: (starChartNodeIds: string[], completed: boolean) => void;
}

const PERSIST_KEY = "wf_tracker_state_v3";

export const useTrackerStore = create<TrackerStore>()(
    persist(
        immer((set, get) => ({
            state: makeDefaultState(),

            setActivePage: (page) => {
                set((s) => {
                    s.state.ui.activePage = page;
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setPrereqCompleted: (prereqId, completed) => {
                set((s) => {
                    s.state.prereqs.completed[prereqId] = completed;
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            bulkOverwritePrereqs: (patch) => {
                set((s) => {
                    Object.assign(s.state.prereqs.completed, patch);
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setCount: (key, count) => {
                set((s) => {
                    if (!s.state.inventory.counts) {
                        s.state.inventory.counts = {};
                    }
                    s.state.inventory.counts[key] = Math.max(0, Number.isFinite(count) ? count : 0);
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setCredits: (credits) => {
                set((s) => {
                    s.state.inventory.credits = Math.max(0, Number.isFinite(credits) ? Math.floor(credits) : 0);
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setPlatinum: (platinum) => {
                set((s) => {
                    s.state.inventory.platinum = Math.max(0, Number.isFinite(platinum) ? Math.floor(platinum) : 0);
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setMasteryRank: (masteryRank) => {
                set((s) => {
                    if (masteryRank === null) {
                        s.state.player.masteryRank = null;
                    } else {
                        const v = Number(masteryRank);
                        s.state.player.masteryRank = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null;
                    }
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setAccountId: (accountId) => {
                set((s) => {
                    s.state.player.accountId = String(accountId ?? "").trim();
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setPlatform: (platform) => {
                set((s) => {
                    s.state.player.platform = platform;
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            importProfileViewingDataJson: (text) => {
                try {
                    const parsed = parseProfileViewingData(text);

                    set((s) => {
                        s.state.player.displayName = parsed.displayName || s.state.player.displayName;
                        s.state.player.masteryRank = parsed.masteryRank;

                        s.state.player.clanName = parsed.clan?.name;
                        s.state.player.clanTier = parsed.clan?.tier;
                        s.state.player.clanClass = parsed.clan?.clanClass;
                        s.state.player.clanXp = parsed.clan?.xp;

                        const existingById = new Map<string, SyndicateState>();
                        for (const syn of s.state.syndicates ?? []) {
                            if (syn && typeof syn.id === "string") existingById.set(syn.id, syn);
                        }

                        const merged: SyndicateState[] = [];
                        for (const incoming of parsed.syndicates ?? []) {
                            const prev = existingById.get(incoming.id);
                            const pledged = typeof prev?.pledged === "boolean" ? prev.pledged : false;
                            merged.push({
                                ...incoming,
                                pledged
                            });
                            existingById.delete(incoming.id);
                        }

                        for (const leftover of existingById.values()) {
                            merged.push(leftover);
                        }

                        s.state.syndicates = merged;
                        s.state.mastery = parsed.mastery;
                        s.state.missions = parsed.missions;

                        ensureGoalsArray(s.state);
                        ensureUiExpansion(s.state);
                        ensureResetChecklistState(s.state);

                        s.state.meta.updatedAtIso = nowIso();
                    });

                    return { ok: true };
                } catch (e: any) {
                    const msg = typeof e?.message === "string" ? e.message : "Invalid profileViewingData file.";
                    return { ok: false, error: msg };
                }
            },

            upsertDailyTask: (dateYmd, label, syndicate, details) => {
                set((s) => {
                    const normalized = label.trim().toLowerCase();
                    const existing = s.state.dailyTasks.find(
                        (t) => t.dateYmd === dateYmd && t.label.trim().toLowerCase() === normalized
                    );

                    if (existing) {
                        existing.syndicate = syndicate;
                        existing.details = details;
                    } else {
                        s.state.dailyTasks.push({
                            id: uid("task"),
                            dateYmd,
                            label,
                            syndicate,
                            details,
                            isDone: false
                        });
                    }

                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            toggleDailyTask: (taskId) => {
                set((s) => {
                    const t = s.state.dailyTasks.find((x) => x.id === taskId);
                    if (t) {
                        t.isDone = !t.isDone;
                        s.state.meta.updatedAtIso = nowIso();
                    }
                });
            },

            deleteDailyTask: (taskId) => {
                set((s) => {
                    s.state.dailyTasks = s.state.dailyTasks.filter((t) => t.id !== taskId);
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            syncResetChecklistResets: () => {
                set((s) => {
                    const changed = syncResetChecklistState(s.state, new Date());
                    if (changed) {
                        s.state.meta.updatedAtIso = nowIso();
                    }
                });
            },

            toggleResetChecklistTask: (taskId, bucket) => {
                const id = String(taskId ?? "").trim();
                if (!id) return;

                set((s) => {
                    syncResetChecklistState(s.state, new Date());

                    const arr = getResetTaskArray(s.state, bucket);
                    const idx = arr.indexOf(id);

                    if (idx >= 0) {
                        arr.splice(idx, 1);
                    } else {
                        arr.push(id);
                    }

                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            clearResetChecklistTasks: (bucket) => {
                set((s) => {
                    syncResetChecklistState(s.state, new Date());

                    if (bucket === "primary_daily") {
                        s.state.resetChecklist.completedPrimaryDailyTaskIds = [];
                    } else if (bucket === "secondary_daily") {
                        s.state.resetChecklist.completedSecondaryDailyTaskIds = [];
                    } else if (bucket === "weekly_monday") {
                        s.state.resetChecklist.completedWeeklyMondayTaskIds = [];
                    } else {
                        s.state.resetChecklist.completedWeeklyFridayTaskIds = [];
                    }

                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            isResetChecklistTaskCompleted: (taskId, bucket) => {
                const state = get().state;
                ensureResetChecklistState(state);

                const now = new Date();

                const activeKey =
                    bucket === "primary_daily"
                        ? getCurrentPrimaryDailyResetKey(now)
                        : bucket === "secondary_daily"
                            ? getCurrentSecondaryDailyResetKey(now)
                            : bucket === "weekly_monday"
                                ? getCurrentWeeklyMondayResetKey(now)
                                : getCurrentWeeklyFridayResetKey(now);

                const matchesWindow =
                    bucket === "primary_daily"
                        ? state.resetChecklist.primaryDailyResetKey === activeKey
                        : bucket === "secondary_daily"
                            ? state.resetChecklist.secondaryDailyResetKey === activeKey
                            : bucket === "weekly_monday"
                                ? state.resetChecklist.weeklyMondayResetKey === activeKey
                                : state.resetChecklist.weeklyFridayResetKey === activeKey;

                if (!matchesWindow) return false;

                return getResetTaskArray(state, bucket).includes(String(taskId));
            },

            setResetChecklistTimeMode: (mode) => {
                set((s) => {
                    ensureResetChecklistState(s.state);
                    s.state.resetChecklist.timeMode = mode === "local" ? "local" : "utc";
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            upsertSyndicate: (patch) => {
                const p = normalizeSyndicatePatch(patch);
                if (!p.id) return;

                set((s) => {
                    if (!Array.isArray(s.state.syndicates)) {
                        s.state.syndicates = [];
                    }

                    upsertSyndicateIntoList(s.state.syndicates as any, p);

                    if (typeof p.pledged === "boolean" && isPrimaryFactionId(String(p.id))) {
                        const list = s.state.syndicates as any as SyndicateState[];

                        if (p.pledged === true) {
                            const currentCount = countPrimaryPledges(list);
                            const already = list.find((x) => x.id === p.id)?.pledged === true;
                            if (!already && currentCount >= 3) {
                                return;
                            }
                        }
                    }

                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            togglePrimaryPledge: (syndicateId) => {
                const id = String(syndicateId ?? "").trim();
                if (!id || !isPrimaryFactionId(id)) return;

                set((s) => {
                    if (!Array.isArray(s.state.syndicates)) s.state.syndicates = [];

                    const primary: Array<{ id: string; name: string }> = [
                        { id: SY.STEEL_MERIDIAN, name: "Steel Meridian" },
                        { id: SY.ARBITERS_OF_HEXIS, name: "Arbiters of Hexis" },
                        { id: SY.CEPHALON_SUDA, name: "Cephalon Suda" },
                        { id: SY.THE_PERRIN_SEQUENCE, name: "The Perrin Sequence" },
                        { id: SY.RED_VEIL, name: "Red Veil" },
                        { id: SY.NEW_LOKA, name: "New Loka" }
                    ];

                    for (const p of primary) {
                        upsertSyndicateIntoList(s.state.syndicates as any, { id: p.id, name: p.name });
                    }

                    const list = s.state.syndicates as any as SyndicateState[];
                    const target = list.find((x) => x.id === id);
                    if (!target) return;

                    const next = !target.pledged;

                    if (next === true) {
                        const current = countPrimaryPledges(list);
                        if (current >= 3) {
                            return;
                        }
                    }

                    target.pledged = next;
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            clearPrimaryPledges: () => {
                set((s) => {
                    if (!Array.isArray(s.state.syndicates)) return;
                    for (const syn of s.state.syndicates as any[]) {
                        if (!syn || typeof syn.id !== "string") continue;
                        if (!isPrimaryFactionId(syn.id)) continue;
                        syn.pledged = false;
                    }
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            exportProgressPackJson: () => {
                const payload = get().state;
                return JSON.stringify(payload, null, 2);
            },

            importProgressPackJson: (json) => {
                try {
                    const parsed = JSON.parse(json);
                    const ok = ProgressPackSchemaV2.safeParse(parsed);
                    if (!ok.success) {
                        return { ok: false, error: "Invalid Progress Pack (schema v2 required)." };
                    }

                    set((s) => {
                        s.state = mergeProgressPackIntoState(s.state, ok.data);
                        ensureGoalsArray(s.state);
                        ensureUiExpansion(s.state);
                        ensureResetChecklistState(s.state);
                    });

                    return { ok: true };
                } catch {
                    return { ok: false, error: "Invalid JSON." };
                }
            },

            resetToDefaults: () => {
                set(() => ({ state: makeDefaultState() }));
            },

            resetAllLocalData: () => {
                try {
                    localStorage.removeItem(PERSIST_KEY);
                } catch (_e) {
                    // ignore storage errors
                }
                set(() => ({ state: makeDefaultState() }));
            },

            getTodayTasks: () => {
                const today = toYMD(new Date());
                return get().state.dailyTasks.filter((t) => t.dateYmd === today);
            },

            getDerivedReserves: () => {
                const syndicates = get().state.syndicates ?? [];
                const completed = get().state.prereqs?.completed ?? {};
                const mr = get().state.player?.masteryRank ?? null;
                return computeDerivedReservesFromSyndicates(syndicates as any[], completed, mr);
            },

            isBelowReserve: (key, spendAmount) => {
                const { inventory } = get().state;

                const completed = get().state.prereqs?.completed ?? {};
                const mr = get().state.player?.masteryRank ?? null;
                const derived = computeDerivedReservesFromSyndicates((get().state.syndicates ?? []) as any[], completed, mr);

                const rule = derived.find((r) => r.key === key);
                if (!rule) {
                    return { blocked: false, reasons: [] };
                }

                const current =
                    key === "credits"
                        ? (inventory.credits ?? 0)
                        : key === "platinum"
                            ? (inventory.platinum ?? 0)
                            : (inventory.counts?.[key] ?? 0);

                const spend = Number.isFinite(spendAmount) ? spendAmount : 0;
                const afterSpend = current - spend;

                if (afterSpend >= rule.minKeep) {
                    return { blocked: false, reasons: [] };
                }

                const reasons: string[] = [];
                const topSources = [...(rule.sources ?? [])];
                topSources.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

                reasons.push(`Keep at least ${rule.minKeep.toLocaleString()} (would drop to ${afterSpend.toLocaleString()}).`);

                for (const s0 of topSources.slice(0, 10)) {
                    reasons.push(`${s0.syndicateName}: requires ${s0.amount.toLocaleString()}${s0.label ? ` (${s0.label})` : ""}`);
                }

                if (topSources.length > 10) {
                    reasons.push(`…and ${topSources.length - 10} more sources.`);
                }

                return { blocked: true, reasons };
            },

            addGoalItem: (catalogId, qty) => {
                const cid = String(catalogId ?? "").trim();
                if (!cid) return;

                const q = Number.isFinite(Number(qty)) ? Math.max(1, Math.floor(Number(qty))) : 1;

                set((s) => {
                    ensureGoalsArray(s.state);
                    ensureUiExpansion(s.state);
                    ensureResetChecklistState(s.state);

                    const existing = s.state.goals.find((g: any) => g.type === "item" && g.catalogId === cid);
                    if (existing) {
                        existing.qty = Math.max(1, existing.qty + q);
                        existing.isActive = true;
                        existing.updatedAtIso = nowIso();
                    } else {
                        const iso = nowIso();
                        const goal: UserGoalV1 = {
                            id: uid("goal"),
                            type: "item",
                            catalogId: cid,
                            qty: q,
                            isActive: true,
                            createdAtIso: iso,
                            updatedAtIso: iso
                        };
                        s.state.goals.push(goal);
                    }
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            removeGoal: (goalId) => {
                set((s) => {
                    ensureGoalsArray(s.state);
                    ensureUiExpansion(s.state);
                    ensureResetChecklistState(s.state);
                    s.state.goals = s.state.goals.filter((g: any) => g.id !== goalId);
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setGoalQty: (goalId, qty) => {
                const q = Number.isFinite(Number(qty)) ? Math.max(1, Math.floor(Number(qty))) : 1;
                set((s) => {
                    ensureGoalsArray(s.state);
                    ensureUiExpansion(s.state);
                    ensureResetChecklistState(s.state);
                    const g = s.state.goals.find((x: any) => x.id === goalId);
                    if (!g) return;
                    g.qty = q;
                    g.updatedAtIso = nowIso();
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setGoalNote: (goalId, note) => {
                set((s) => {
                    ensureGoalsArray(s.state);
                    ensureUiExpansion(s.state);
                    ensureResetChecklistState(s.state);
                    const g = s.state.goals.find((x: any) => x.id === goalId);
                    if (!g) return;
                    g.note = String(note ?? "");
                    g.updatedAtIso = nowIso();
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            toggleGoalActive: (goalId) => {
                set((s) => {
                    ensureGoalsArray(s.state);
                    ensureUiExpansion(s.state);
                    ensureResetChecklistState(s.state);
                    const g = s.state.goals.find((x: any) => x.id === goalId);
                    if (!g) return;
                    g.isActive = !g.isActive;
                    g.updatedAtIso = nowIso();
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setGoalComponentCompleted: (goalId, componentKey, done) => {
                set((s) => {
                    ensureGoalsArray(s.state);
                    const g = s.state.goals.find((x: any) => x.id === goalId);
                    if (!g) return;
                    if (!g.completedComponents || typeof g.completedComponents !== "object") {
                        g.completedComponents = {};
                    }
                    g.completedComponents[componentKey] = done;
                    g.updatedAtIso = nowIso();
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            clearAllGoals: () => {
                set((s) => {
                    s.state.goals = [];
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            toggleExpandedGoalNode: (nodeId) => {
                set((s) => {
                    ensureUiExpansion(s.state);
                    const k = String(nodeId);
                    const cur = Boolean(s.state.ui.expandedGoalNodes?.[k]);
                    s.state.ui.expandedGoalNodes[k] = !cur;
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setExpandedGoalNode: (nodeId, expanded) => {
                set((s) => {
                    ensureUiExpansion(s.state);
                    s.state.ui.expandedGoalNodes[String(nodeId)] = Boolean(expanded);
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            isExpandedGoalNode: (nodeId) => {
                const m = get().state.ui.expandedGoalNodes ?? {};
                return Boolean(m[String(nodeId)]);
            },

            setNodeCompleted: (starChartNodeId, completed) => {
                set((s) => {
                    if (!s.state.missions) {
                        s.state.missions = { completesByTag: {} };
                    }
                    if (!s.state.missions.nodeCompleted) {
                        s.state.missions.nodeCompleted = {};
                    }
                    if (completed) {
                        s.state.missions.nodeCompleted[starChartNodeId] = true;
                    } else {
                        delete s.state.missions.nodeCompleted[starChartNodeId];
                    }
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setBulkNodesCompleted: (starChartNodeIds, completed) => {
                set((s) => {
                    if (!s.state.missions) {
                        s.state.missions = { completesByTag: {} };
                    }
                    if (!s.state.missions.nodeCompleted) {
                        s.state.missions.nodeCompleted = {};
                    }
                    for (const id of starChartNodeIds) {
                        if (completed) {
                            s.state.missions.nodeCompleted[id] = true;
                        } else {
                            delete s.state.missions.nodeCompleted[id];
                        }
                    }
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            isNodeCompleted: (starChartNodeId) => {
                const nc = get().state.missions?.nodeCompleted;
                return Boolean(nc?.[starChartNodeId]);
            },

            setSteelPathNodeCompleted: (starChartNodeId, completed) => {
                set((s) => {
                    if (!s.state.missions) {
                        s.state.missions = { completesByTag: {} };
                    }
                    if (!s.state.missions.steelPathNodeCompleted) {
                        s.state.missions.steelPathNodeCompleted = {};
                    }
                    if (completed) {
                        s.state.missions.steelPathNodeCompleted[starChartNodeId] = true;
                    } else {
                        delete s.state.missions.steelPathNodeCompleted[starChartNodeId];
                    }
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setBulkSteelPathNodesCompleted: (starChartNodeIds, completed) => {
                set((s) => {
                    if (!s.state.missions) {
                        s.state.missions = { completesByTag: {} };
                    }
                    if (!s.state.missions.steelPathNodeCompleted) {
                        s.state.missions.steelPathNodeCompleted = {};
                    }
                    for (const id of starChartNodeIds) {
                        if (completed) {
                            s.state.missions.steelPathNodeCompleted[id] = true;
                        } else {
                            delete s.state.missions.steelPathNodeCompleted[id];
                        }
                    }
                    s.state.meta.updatedAtIso = nowIso();
                });
            }
        })),
        {
            name: PERSIST_KEY,
            version: 6,
            migrate: (persistedState: any) => {
                const raw = persistedState?.state ?? persistedState;
                const migrated = migrateToUserStateV2(raw);
                if (!migrated) {
                    return { state: makeDefaultState() } as any;
                }
                ensureGoalsArray(migrated as any);
                ensureUiExpansion(migrated as any);
                ensureResetChecklistState(migrated as any);
                return { state: migrated } as any;
            }
        }
    )
);
