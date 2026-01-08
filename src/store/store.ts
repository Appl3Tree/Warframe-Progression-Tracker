import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";
import { toYMD } from "../domain/ymd";
import type { DailyTask } from "../domain/types";
import { SEED_INVENTORY, SEED_RESERVES, SEED_SYNDICATES } from "../domain/seed";
import type { PageKey, UserStateV2 } from "../domain/models/userState";
import { migrateToUserStateV2 } from "./migrations";

function nowIso(): string {
    return new Date().toISOString();
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
            displayName: "",
            masteryRank: null
        },
        ui: {
            activePage: "dashboard"
        },
        prereqs: {
            completed: {}
        },
        inventory: SEED_INVENTORY,
        syndicates: SEED_SYNDICATES,
        reserves: SEED_RESERVES,
        dailyTasks: []
    };
}

const InventorySchema = z.object({
    credits: z.number().int().min(0),
    platinum: z.number().int().min(0),
    counts: z.record(z.number().nonnegative())
});

const ProgressPackSchemaV2 = z.object({
    meta: z.object({
        schemaVersion: z.literal(2),
        createdAtIso: z.string(),
        updatedAtIso: z.string()
    }),
    player: z.object({
        platform: z.literal("PC"),
        displayName: z.string(),
        masteryRank: z.number().nullable()
    }),
    ui: z.object({
        activePage: z.string()
    }),
    prereqs: z.object({
        completed: z.record(z.boolean())
    }),
    inventory: InventorySchema.optional(),
    syndicates: z.any().optional(),
    reserves: z.any().optional(),
    dailyTasks: z.any().optional()
});

function uid(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
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
            ...next.ui,
            activePage: (incoming.ui.activePage as any) ?? next.ui.activePage
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

    if (incoming.reserves !== undefined) {
        next.reserves = incoming.reserves;
    }

    if (incoming.dailyTasks !== undefined) {
        next.dailyTasks = incoming.dailyTasks;
    }

    return next;
}

export interface TrackerStore {
    state: UserStateV2;

    setActivePage: (page: PageKey) => void;

    setPrereqCompleted: (prereqId: string, completed: boolean) => void;
    bulkOverwritePrereqs: (patch: Record<string, boolean>) => void;

    /**
     * Canonical inventory mutation.
     * key must be a catalog key (id from items.json).
     */
    setCount: (key: string, count: number) => void;

    setCredits: (credits: number) => void;
    setPlatinum: (platinum: number) => void;
    setMasteryRank: (masteryRank: number | null) => void;

    upsertDailyTask: (dateYmd: string, label: string, syndicate?: string, details?: string) => void;
    toggleDailyTask: (taskId: string) => void;
    deleteDailyTask: (taskId: string) => void;

    setSyndicateNotes: (id: string, notes: string) => void;
    setReserveEnabled: (reserveId: string, enabled: boolean) => void;

    exportProgressPackJson: () => string;
    importProgressPackJson: (json: string) => { ok: boolean; error?: string };

    /**
     * Soft reset (overwrites state, but leaves the persisted key in place).
     */
    resetToDefaults: () => void;

    /**
     * Hard reset (clears localStorage for the persisted key, then restores defaults).
     * Use this for seed validation and “start over” behavior.
     */
    resetAllLocalData: () => void;

    getTodayTasks: () => DailyTask[];

    isBelowReserve: (key: string, spendAmount: number) => { blocked: boolean; reasons: string[] };
}

const PERSIST_KEY = "wf_tracker_state_v3";

// Use explicit storage so we can hard-clear it reliably.
const storage = createJSONStorage(() => localStorage);

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
                    s.state.inventory.credits = Math.max(
                        0,
                        Number.isFinite(credits) ? Math.floor(credits) : 0
                    );
                    s.state.meta.updatedAtIso = nowIso();
                });
            },

            setPlatinum: (platinum) => {
                set((s) => {
                    s.state.inventory.platinum = Math.max(
                        0,
                        Number.isFinite(platinum) ? Math.floor(platinum) : 0
                    );
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

            setSyndicateNotes: (id, notes) => {
                set((s) => {
                    const syn = s.state.syndicates.find((x: any) => x.id === id);
                    if (syn) {
                        syn.notes = notes;
                        s.state.meta.updatedAtIso = nowIso();
                    }
                });
            },

            setReserveEnabled: (reserveId, enabled) => {
                set((s) => {
                    const r = s.state.reserves.find((x) => x.id === reserveId);
                    if (r) {
                        r.isEnabled = enabled;
                        s.state.meta.updatedAtIso = nowIso();
                    }
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
                // Clear persisted payload, then restore defaults.
                storage.removeItem(PERSIST_KEY);
                set(() => ({ state: makeDefaultState() }));
            },

            getTodayTasks: () => {
                const today = toYMD(new Date());
                return get().state.dailyTasks.filter((t) => t.dateYmd === today);
            },

            isBelowReserve: (key, spendAmount) => {
                const { inventory, reserves } = get().state;
                const reasons: string[] = [];

                const current = inventory.counts?.[key] ?? 0;
                const afterSpend = current - spendAmount;

                for (const rule of reserves) {
                    if (!rule.isEnabled) continue;

                    for (const item of rule.items) {
                        if (item.key === key && afterSpend < item.minKeep) {
                            reasons.push(
                                `${rule.label}: keep at least ${item.minKeep} (would drop to ${afterSpend}).`
                            );
                        }
                    }
                }

                return { blocked: reasons.length > 0, reasons };
            }
        })),
        {
            name: PERSIST_KEY,
            version: 3,
            storage,
            migrate: (persistedState: any) => {
                // Zustand wraps state in { state: ... } for persisted payloads.
                const raw = persistedState?.state ?? persistedState;
                const migrated = migrateToUserStateV2(raw);
                if (!migrated) {
                    return { state: makeDefaultState() } as any;
                }
                return { state: migrated } as any;
            }
        }
    )
);

