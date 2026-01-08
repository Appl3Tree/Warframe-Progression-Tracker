import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { toYMD } from "../domain/ymd";
import type { DailyTask } from "../domain/types";
import { SEED_INVENTORY, SEED_RESERVES, SEED_SYNDICATES } from "../domain/seed";
import type { PageKey, UserStateV2 } from "../domain/models/userState";

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
    inventory: z.any(),
    syndicates: z.any(),
    reserves: z.any(),
    dailyTasks: z.any()
});

function uid(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export interface TrackerStore {
    state: UserStateV2;

    setActivePage: (page: PageKey) => void;

    setPrereqCompleted: (prereqId: string, completed: boolean) => void;
    bulkOverwritePrereqs: (patch: Record<string, boolean>) => void;

    /**
     * Canonical inventory mutation.
     * key must be a catalog key (path from items.json).
     */
    setCount: (key: string, count: number) => void;

    upsertDailyTask: (dateYmd: string, label: string, syndicate?: string, details?: string) => void;
    toggleDailyTask: (taskId: string) => void;
    deleteDailyTask: (taskId: string) => void;

    setSyndicateNotes: (id: string, notes: string) => void;
    setReserveEnabled: (reserveId: string, enabled: boolean) => void;

    exportProgressPackJson: () => string;
    importProgressPackJson: (json: string) => { ok: boolean; error?: string };

    resetToDefaults: () => void;

    getTodayTasks: () => DailyTask[];

    isBelowReserve: (key: string, spendAmount: number) => { blocked: boolean; reasons: string[] };
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
                    const r = s.state.reserves.find((x: any) => x.id === reserveId);
                    if (r) {
                        r.isEnabled = enabled;
                        s.state.meta.updatedAtIso = nowIso();
                    }
                });
            },

            exportProgressPackJson: () => {
                return JSON.stringify(get().state, null, 2);
            },

            importProgressPackJson: (json) => {
                try {
                    const parsed = JSON.parse(json);
                    const ok = ProgressPackSchemaV2.safeParse(parsed);
                    if (!ok.success) {
                        return { ok: false, error: "Invalid Progress Pack (schema v2 required)." };
                    }
                    set(() => ({
                        state: {
                            ...(parsed as UserStateV2),
                            meta: {
                                ...(parsed as UserStateV2).meta,
                                updatedAtIso: nowIso()
                            }
                        }
                    }));
                    return { ok: true };
                } catch {
                    return { ok: false, error: "Invalid JSON." };
                }
            },

            resetToDefaults: () => {
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
            name: "wf_tracker_state_v2",
            version: 2
        }
    )
);

