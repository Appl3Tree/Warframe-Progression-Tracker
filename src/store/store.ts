// ===== FILE: src/store/store.ts =====
// src/store/store.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { toYMD } from "../domain/ymd";
import type { DailyTask, SyndicateState } from "../domain/types";
import { SEED_INVENTORY, SEED_MASTERY, SEED_MISSIONS, SEED_SYNDICATES } from "../domain/seed";
import type { PageKey, UserStateV2 } from "../domain/models/userState";
import type { UserGoalV1 } from "../domain/models/userState";
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
            // NOTE: This is intentionally not part of the strict UserStateV2 type yet.
            // We store it anyway and access via (ui as any) so it persists without a typing migration.
            expandedGoalNodes: {}
        } as any,
        prereqs: {
            completed: {}
        },
        inventory: SEED_INVENTORY,
        syndicates: SEED_SYNDICATES,
        dailyTasks: [],
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

/**
 * Merge-only import behavior:
 * - Only overwrite fields present in the incoming pack
 * - Do not reset untouched sections
 */
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
            ...(next.ui as any),
            ...(incoming.ui as any),
            activePage: (incoming.ui.activePage as any) ?? (next.ui as any).activePage
        } as any;
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

    if (incoming.goals !== undefined) {
        next.goals = incoming.goals;
    }

    if (incoming.mastery !== undefined) {
        next.mastery = incoming.mastery;
    }

    if (incoming.missions !== undefined) {
        next.missions = incoming.missions;
    }

    ensureGoalsArray(next as any);
    ensureUiExpansion(next as any);

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

    // Keep these pass-through fields for future phases.
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
        id === SY.PERRIN_SEQUENCE ||
        id === SY.RED_VEIL ||
        id === SY.NEW_LOKA
    );
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

    upsertSyndicate: (patch: Partial<SyndicateState>) => void;
    setPrimaryPledge: (syndicateId: string | null) => void;

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
    clearAllGoals: () => void;

    // Expansion UI (stable ids from goalExpansion.ts)
    toggleExpandedGoalNode: (nodeId: string) => void;
    setExpandedGoalNode: (nodeId: string, expanded: boolean) => void;
    isExpandedGoalNode: (nodeId: string) => boolean;
}

const PERSIST_KEY = "wf_tracker_state_v3";

export const useTrackerStore = create<TrackerStore>()(
    persist(
        immer((set, get) => ({
            state: makeDefaultState(),

            setActivePage: (page) => {
                set((s) => {
                    (s.state.ui as any).activePage = page;
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

                        // Merge syndicates by id, preserving pledge flags if already set locally.
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

                        // Keep any local-only syndicates that were not present in import.
                        for (const leftover of existingById.values()) {
                            merged.push(leftover);
                        }

                        s.state.syndicates = merged;
                        s.state.mastery = parsed.mastery;
                        s.state.missions = parsed.missions;

                        ensureGoalsArray(s.state as any);
                        ensureUiExpansion(s.state as any);

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

            upsertSyndicate: (patch) => {
                const p = normalizeSyndicatePatch(patch);
                if (!p.id) return;

                set((s) => {
                    if (!Array.isArray(s.state.syndicates)) {
                        s.state.syndicates = [];
                    }

                    upsertSyndicateIntoList(s.state.syndicates as any, p);

                    // If someone sets pledged directly, enforce "single pledge" only across Primary factions.
                    if (p.pledged === true && isPrimaryFactionId(String(p.id))) {
                        for (const syn of s.state.syndicates as any[]) {
                            if (!syn || typeof syn.id !== "string") continue;
                            if (!isPrimaryFactionId(syn.id)) continue;
                            syn.pledged = syn.id === p.id;
                        }
                    }

                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setPrimaryPledge: (syndicateId) => {
                const target = typeof syndicateId === "string" && syndicateId.trim() ? syndicateId.trim() : null;
                set((s) => {
                    if (!Array.isArray(s.state.syndicates)) s.state.syndicates = [];

                    // Ensure all 6 exist if user is interacting.
                    const primary: Array<{ id: string; name: string }> = [
                        { id: SY.STEEL_MERIDIAN, name: "Steel Meridian" },
                        { id: SY.ARBITERS_OF_HEXIS, name: "Arbiters of Hexis" },
                        { id: SY.CEPHALON_SUDA, name: "Cephalon Suda" },
                        { id: SY.PERRIN_SEQUENCE, name: "The Perrin Sequence" },
                        { id: SY.RED_VEIL, name: "Red Veil" },
                        { id: SY.NEW_LOKA, name: "New Loka" }
                    ];

                    for (const p of primary) {
                        upsertSyndicateIntoList(s.state.syndicates as any, { id: p.id, name: p.name });
                    }

                    for (const syn of s.state.syndicates as any[]) {
                        if (!syn || typeof syn.id !== "string") continue;
                        if (!isPrimaryFactionId(syn.id)) continue;
                        syn.pledged = target ? syn.id === target : false;
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
                        ensureGoalsArray(s.state as any);
                        ensureUiExpansion(s.state as any);
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
                } catch {
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

                for (const s of topSources.slice(0, 10)) {
                    reasons.push(`${s.syndicateName}: requires ${s.amount.toLocaleString()}${s.label ? ` (${s.label})` : ""}`);
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
                    ensureGoalsArray(s.state as any);
                    ensureUiExpansion(s.state as any);

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
                    ensureGoalsArray(s.state as any);
                    ensureUiExpansion(s.state as any);
                    s.state.goals = s.state.goals.filter((g: any) => g.id !== goalId);
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setGoalQty: (goalId, qty) => {
                const q = Number.isFinite(Number(qty)) ? Math.max(1, Math.floor(Number(qty))) : 1;
                set((s) => {
                    ensureGoalsArray(s.state as any);
                    ensureUiExpansion(s.state as any);
                    const g = s.state.goals.find((x: any) => x.id === goalId);
                    if (!g) return;
                    g.qty = q;
                    g.updatedAtIso = nowIso();
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setGoalNote: (goalId, note) => {
                set((s) => {
                    ensureGoalsArray(s.state as any);
                    ensureUiExpansion(s.state as any);
                    const g = s.state.goals.find((x: any) => x.id === goalId);
                    if (!g) return;
                    g.note = String(note ?? "");
                    g.updatedAtIso = nowIso();
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            toggleGoalActive: (goalId) => {
                set((s) => {
                    ensureGoalsArray(s.state as any);
                    ensureUiExpansion(s.state as any);
                    const g = s.state.goals.find((x: any) => x.id === goalId);
                    if (!g) return;
                    g.isActive = !g.isActive;
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
                    ensureUiExpansion(s.state as any);
                    const ui: any = s.state.ui as any;
                    const k = String(nodeId);
                    const cur = Boolean(ui.expandedGoalNodes?.[k]);
                    ui.expandedGoalNodes[k] = !cur;
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setExpandedGoalNode: (nodeId, expanded) => {
                set((s) => {
                    ensureUiExpansion(s.state as any);
                    const ui: any = s.state.ui as any;
                    ui.expandedGoalNodes[String(nodeId)] = Boolean(expanded);
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            isExpandedGoalNode: (nodeId) => {
                const ui: any = (get().state.ui as any) ?? {};
                const m: any = ui.expandedGoalNodes ?? {};
                return Boolean(m[String(nodeId)]);
            }
        })),
        {
            name: PERSIST_KEY,
            version: 4,
            migrate: (persistedState: any) => {
                const raw = persistedState?.state ?? persistedState;
                const migrated = migrateToUserStateV2(raw);
                if (!migrated) {
                    return { state: makeDefaultState() } as any;
                }
                ensureGoalsArray(migrated as any);
                ensureUiExpansion(migrated as any);
                return { state: migrated } as any;
            }
        }
    )
);
