// ===== FILE: src/store/store.ts =====
// Main Zustand store — TrackerStore interface + create() call.
// All helpers live in sibling files:
//   storeUtils.ts       — nowIso, uid, date key functions
//   resetChecklist.ts   — reset checklist state helpers
//   progressPack.ts     — default state, schemas, mergeProgressPackIntoState
//   syndicateSlice.ts   — reserve computation, syndicate helpers

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { toYMD } from "../domain/ymd";
import type {
    DailyTask,
    ResetChecklistBucket,
    ResetDisplayMode,
    SyndicateState
} from "../domain/types";
import type { PageKey, UserGoalV1, UserStateV2 } from "../domain/models/userState";
import { migrateToUserStateV2 } from "./migrations";
import { parseProfileViewingData, parseWarframeStatApiProfile } from "../utils/profileImport";
import { SY } from "../domain/ids/syndicateIds";
import { validateDataOrThrow } from "../domain/logic/startupValidation";
import { PERSIST_KEY, PERSIST_VERSION } from "./persistence";
import {
    nowIso, uid,
    getCurrentPrimaryDailyResetKey,
    getCurrentSecondaryDailyResetKey,
    getCurrentWeeklyMondayResetKey,
    getCurrentWeeklyFridayResetKey,
} from "./storeUtils";
import {
    ensureResetChecklistState,
    syncResetChecklistState,
    getResetTaskArray,
} from "./resetChecklist";
import {
    makeDefaultState,
    ProgressPackSchemaV2,
    ensureGoalsArray,
    ensureUiExpansion,
    mergeProgressPackIntoState,
} from "./progressPack";
import {
    type DerivedReserveLine,
    computeDerivedReservesFromSyndicates,
    normalizeSyndicatePatch,
    upsertSyndicateIntoList,
    isPrimaryFactionId,
    countPrimaryPledges,
} from "./syndicateSlice";

validateDataOrThrow();

export interface TrackerStore {
    state: UserStateV2;

    setActivePage: (page: PageKey) => void;

    setPrereqCompleted: (prereqId: string, completed: boolean) => void;
    bulkOverwritePrereqs: (patch: Record<string, boolean>) => void;

    setCount: (key: string, count: number) => void;
    setMastered: (key: string, val: boolean) => void;
    setOverLevelMastered: (key: string, val: boolean) => void;

    setCredits: (credits: number) => void;
    setPlatinum: (platinum: number) => void;
    setMasteryRank: (masteryRank: number | null) => void;

    setAccountId: (accountId: string) => void;
    setPlatform: (platform: "PC" | "PlayStation" | "Xbox" | "Switch" | "Mobile") => void;

    importProfileViewingDataJson: (text: string) => { ok: boolean; error?: string };
    importProfileFromWarframeStatApi: (json: unknown) => { ok: boolean; error?: string };

    upsertDailyTask: (dateYmd: string, label: string, syndicate?: string, details?: string, isDone?: boolean) => void;
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

    toggleInvasionDone: (id: string) => void;
    isInvasionDone: (id: string) => boolean;
}

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

            setMastered: (key, val) => {
                set((s) => {
                    if (!s.state.mastery) s.state.mastery = { xpByItem: {}, mastered: {}, overLevelMastered: {} };
                    if (!s.state.mastery.mastered) s.state.mastery.mastered = {};
                    if (val) {
                        s.state.mastery.mastered[key] = true;
                    } else {
                        delete s.state.mastery.mastered[key];
                    }
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setOverLevelMastered: (key, val) => {
                set((s) => {
                    if (!s.state.mastery) s.state.mastery = { xpByItem: {}, mastered: {}, overLevelMastered: {} };
                    if (!s.state.mastery.overLevelMastered) s.state.mastery.overLevelMastered = {};
                    if (val) {
                        s.state.mastery.overLevelMastered[key] = true;
                    } else {
                        delete s.state.mastery.overLevelMastered[key];
                    }
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
                            // Preserve manually-entered standing — the profile import does not
                            // include reliable current-standing data (only cumulative totals).
                            const standing = typeof prev?.standing === "number" ? prev.standing : (incoming.standing ?? 0);
                            merged.push({
                                ...incoming,
                                pledged,
                                standing
                            });
                            existingById.delete(incoming.id);
                        }

                        for (const leftover of existingById.values()) {
                            merged.push(leftover);
                        }

                        s.state.syndicates = merged;

                        // Normalize mastery keys from raw Lotus paths ("/Lotus/...") to
                        // catalog IDs ("items:/Lotus/...") so they match the format used
                        // by setMastered() and inventory lookups.
                        const rawMastery = parsed.mastery;
                        const normalizedMastered: Record<string, boolean> = {};
                        const normalizedXp: Record<string, number> = {};
                        for (const [path, val] of Object.entries(rawMastery.mastered)) {
                            const key = path.startsWith("items:") ? path : `items:${path}`;
                            normalizedMastered[key] = val as boolean;
                        }
                        for (const [path, xp] of Object.entries(rawMastery.xpByItem)) {
                            const key = path.startsWith("items:") ? path : `items:${path}`;
                            normalizedXp[key] = xp as number;
                        }
                        // Preserve manually set overLevelMastered across imports.
                        const prevOverLevel = s.state.mastery?.overLevelMastered ?? {};
                        s.state.mastery = { xpByItem: normalizedXp, mastered: normalizedMastered, overLevelMastered: prevOverLevel };
                        s.state.missions = parsed.missions;

                        // Auto-mark normal-mode star chart nodes as completed.
                        if (parsed.completedNodeIds.length > 0) {
                            if (!s.state.missions.nodeCompleted) {
                                s.state.missions.nodeCompleted = {};
                            }
                            for (const id of parsed.completedNodeIds) {
                                s.state.missions.nodeCompleted[id] = true;
                            }
                        }

                        // Challenges progress.
                        if (parsed.challenges) {
                            s.state.challenges = parsed.challenges;
                        }

                        // Intrinsics.
                        if (parsed.intrinsics) {
                            s.state.intrinsics = parsed.intrinsics;
                        }

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

            importProfileFromWarframeStatApi: (json) => {
                try {
                    const parsed = parseWarframeStatApiProfile(json);

                    set((s) => {
                        s.state.player.displayName = parsed.displayName || s.state.player.displayName;
                        s.state.player.masteryRank = parsed.masteryRank;

                        if (parsed.clan?.name) s.state.player.clanName = parsed.clan.name;

                        const existingById = new Map<string, SyndicateState>();
                        for (const syn of s.state.syndicates ?? []) {
                            if (syn && typeof syn.id === "string") existingById.set(syn.id, syn);
                        }

                        const merged: SyndicateState[] = [];
                        for (const incoming of parsed.syndicates ?? []) {
                            const prev = existingById.get(incoming.id);
                            const pledged = typeof prev?.pledged === "boolean" ? prev.pledged : false;
                            const standing = typeof prev?.standing === "number" ? prev.standing : (incoming.standing ?? 0);
                            merged.push({ ...incoming, pledged, standing });
                            existingById.delete(incoming.id);
                        }
                        for (const leftover of existingById.values()) merged.push(leftover);
                        s.state.syndicates = merged;

                        const rawMastery = parsed.mastery;
                        const normalizedMastered: Record<string, boolean> = {};
                        const normalizedXp: Record<string, number> = {};
                        for (const [path, val] of Object.entries(rawMastery.mastered)) {
                            const key = path.startsWith("items:") ? path : `items:${path}`;
                            normalizedMastered[key] = val as boolean;
                        }
                        for (const [path, xp] of Object.entries(rawMastery.xpByItem)) {
                            const key = path.startsWith("items:") ? path : `items:${path}`;
                            normalizedXp[key] = xp as number;
                        }
                        const prevOverLevel = s.state.mastery?.overLevelMastered ?? {};
                        s.state.mastery = { xpByItem: normalizedXp, mastered: normalizedMastered, overLevelMastered: prevOverLevel };
                        s.state.missions = parsed.missions;

                        if (parsed.completedNodeIds.length > 0) {
                            if (!s.state.missions.nodeCompleted) s.state.missions.nodeCompleted = {};
                            for (const id of parsed.completedNodeIds) {
                                s.state.missions.nodeCompleted[id] = true;
                            }
                        }

                        if (parsed.challenges) s.state.challenges = parsed.challenges;
                        if (parsed.intrinsics) s.state.intrinsics = parsed.intrinsics;

                        // ── Daily standing automation ──────────────────────
                        // For each DailyAffiliation* / DailyFocus field returned by
                        // the API: create a task for today if it doesn't exist yet,
                        // and mark it done when remaining === 0 (daily cap spent).
                        if (parsed.dailyAffiliation.length > 0) {
                            const todayYmd = toYMD(new Date());
                            for (const { label, syndicateId, remaining } of parsed.dailyAffiliation) {
                                const normalized = label.trim().toLowerCase();
                                const existing = s.state.dailyTasks.find(
                                    (t) => t.dateYmd === todayYmd && t.label.trim().toLowerCase() === normalized
                                );
                                const isDone = remaining === 0;
                                if (existing) {
                                    if (isDone) existing.isDone = true;
                                } else {
                                    s.state.dailyTasks.push({
                                        id: uid("task"),
                                        dateYmd: todayYmd,
                                        label,
                                        syndicate: syndicateId,
                                        isDone,
                                    });
                                }
                            }
                        }

                        ensureGoalsArray(s.state);
                        ensureUiExpansion(s.state);
                        ensureResetChecklistState(s.state);
                        s.state.meta.updatedAtIso = nowIso();
                    });

                    return { ok: true };
                } catch (e: any) {
                    const msg = typeof e?.message === "string" ? e.message : "warframestat.us API profile import failed.";
                    return { ok: false, error: msg };
                }
            },

            upsertDailyTask: (dateYmd, label, syndicate, details, isDone) => {
                set((s) => {
                    const normalized = label.trim().toLowerCase();
                    const existing = s.state.dailyTasks.find(
                        (t) => t.dateYmd === dateYmd && t.label.trim().toLowerCase() === normalized
                    );

                    if (existing) {
                        existing.syndicate = syndicate;
                        existing.details = details;
                        if (isDone === true) existing.isDone = true;
                    } else {
                        s.state.dailyTasks.push({
                            id: uid("task"),
                            dateYmd,
                            label,
                            syndicate,
                            details,
                            isDone: isDone === true,
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
            },

            toggleInvasionDone: (id) => {
                set((s) => {
                    if (!s.state.worldState) {
                        s.state.worldState = { doneInvasions: [] };
                    }
                    const list = s.state.worldState.doneInvasions;
                    const idx = list.indexOf(id);
                    if (idx >= 0) {
                        list.splice(idx, 1);
                    } else {
                        list.push(id);
                    }
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            isInvasionDone: (id) => {
                return get().state.worldState?.doneInvasions.includes(id) ?? false;
            },
        })),
        {
            name: PERSIST_KEY,
            version: PERSIST_VERSION,
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
