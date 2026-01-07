import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { z } from "zod";
import { toYMD } from "../domain/ymd";
import type { DailyTask, Inventory, ReserveRule, SyndicateState } from "../domain/types";
import { SEED_INVENTORY, SEED_RESERVES, SEED_SYNDICATES } from "../domain/seed";
import type { PageKey, UserStateV1 } from "../domain/models/userState";
import { loadState, saveState } from "./persistence";

function nowIso(): string {
    return new Date().toISOString();
}

function makeDefaultState(): UserStateV1 {
    const iso = nowIso();
    return {
        meta: {
            schemaVersion: 1,
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
        inventory: SEED_INVENTORY,
        syndicates: SEED_SYNDICATES,
        reserves: SEED_RESERVES,
        dailyTasks: []
    };
}

const ProgressPackSchema = z.object({
    meta: z.object({
        schemaVersion: z.literal(1),
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
    inventory: z.any(),
    syndicates: z.any(),
    reserves: z.any(),
    dailyTasks: z.any()
});

function uid(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export interface TrackerStore {
    state: UserStateV1;

    // UI
    setActivePage: (page: PageKey) => void;

    // Inventory
    setCredits: (credits: number) => void;
    setVoidTraces: (traces: number) => void;
    setAya: (aya: number) => void;
    setItemCount: (key: string, count: number) => void;

    // Daily tasks
    upsertDailyTask: (dateYmd: string, label: string, syndicate?: string, details?: string) => void;
    toggleDailyTask: (taskId: string) => void;
    deleteDailyTask: (taskId: string) => void;

    // Notes / reserves
    setSyndicateNotes: (id: string, notes: string) => void;
    setReserveEnabled: (reserveId: string, enabled: boolean) => void;

    // Progress Pack
    exportProgressPackJson: () => string;
    importProgressPackJson: (json: string) => { ok: boolean; error?: string };

    // Maintenance
    resetToDefaults: () => void;

    // Calculations
    getTodayTasks: () => DailyTask[];
    isBelowReserve: (key: string, spendAmount: number) => { blocked: boolean; reasons: string[] };
}

const boot = loadState() ?? makeDefaultState();

export const useTrackerStore = create<TrackerStore>()(
    immer((set, get) => ({
        state: boot,

        setActivePage: (page) => {
            set((s) => {
                s.state.ui.activePage = page;
                s.state.meta.updatedAtIso = nowIso();
            });
            saveState(get().state);
        },

        setCredits: (credits) => {
            set((s) => {
                s.state.inventory.credits = credits;
                s.state.inventory.items["credits"] = credits;
                s.state.meta.updatedAtIso = nowIso();
            });
            saveState(get().state);
        },

        setVoidTraces: (traces) => {
            set((s) => {
                s.state.inventory.voidTraces = traces;
                s.state.inventory.items["Void Traces"] = traces;
                s.state.meta.updatedAtIso = nowIso();
            });
            saveState(get().state);
        },

        setAya: (aya) => {
            set((s) => {
                s.state.inventory.aya = aya;
                s.state.inventory.items["Aya"] = aya;
                s.state.inventory.items["aya"] = aya;
                s.state.meta.updatedAtIso = nowIso();
            });
            saveState(get().state);
        },

        setItemCount: (key, count) => {
            set((s) => {
                s.state.inventory.items[key] = count;

                if (key === "Void Traces") {
                    s.state.inventory.voidTraces = count;
                }
                if (key === "Aya" || key === "aya") {
                    s.state.inventory.aya = count;
                }
                if (key === "credits") {
                    s.state.inventory.credits = count;
                }

                s.state.meta.updatedAtIso = nowIso();
            });
            saveState(get().state);
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
            saveState(get().state);
        },

        toggleDailyTask: (taskId) => {
            set((s) => {
                const t = s.state.dailyTasks.find((x) => x.id === taskId);
                if (t) {
                    t.isDone = !t.isDone;
                    s.state.meta.updatedAtIso = nowIso();
                }
            });
            saveState(get().state);
        },

        deleteDailyTask: (taskId) => {
            set((s) => {
                s.state.dailyTasks = s.state.dailyTasks.filter((t) => t.id !== taskId);
                s.state.meta.updatedAtIso = nowIso();
            });
            saveState(get().state);
        },

        setSyndicateNotes: (id, notes) => {
            set((s) => {
                const syn = s.state.syndicates.find((x) => x.id === id);
                if (syn) {
                    syn.notes = notes;
                    s.state.meta.updatedAtIso = nowIso();
                }
            });
            saveState(get().state);
        },

        setReserveEnabled: (reserveId, enabled) => {
            set((s) => {
                const r = s.state.reserves.find((x) => x.id === reserveId);
                if (r) {
                    r.isEnabled = enabled;
                    s.state.meta.updatedAtIso = nowIso();
                }
            });
            saveState(get().state);
        },

        exportProgressPackJson: () => {
            return JSON.stringify(get().state, null, 2);
        },

        importProgressPackJson: (json) => {
            try {
                const parsed = JSON.parse(json);
                const ok = ProgressPackSchema.safeParse(parsed);
                if (!ok.success) {
                    return { ok: false, error: "Progress Pack JSON shape invalid." };
                }
                set((s) => {
                    s.state = {
                        ...(parsed as UserStateV1),
                        meta: {
                            ...(parsed as UserStateV1).meta,
                            updatedAtIso: nowIso()
                        }
                    };
                });
                saveState(get().state);
                return { ok: true };
            } catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : "Unknown import error." };
            }
        },

        resetToDefaults: () => {
            set(() => ({
                state: makeDefaultState()
            }));
            saveState(get().state);
        },

        getTodayTasks: () => {
            const today = toYMD(new Date());
            return get().state.dailyTasks.filter((t) => t.dateYmd === today);
        },

        isBelowReserve: (key, spendAmount) => {
            const { inventory, reserves } = get().state;
            const reasons: string[] = [];

            const current = inventory.items[key] ?? 0;
            const afterSpend = current - spendAmount;

            for (const rule of reserves) {
                if (!rule.isEnabled) {
                    continue;
                }
                for (const item of rule.items) {
                    if (item.key === key) {
                        if (afterSpend < item.minKeep) {
                            reasons.push(
                                `${rule.label}: keep at least ${item.minKeep} ${key} (would drop to ${afterSpend}).`
                            );
                        }
                    }
                    if (item.key === "Void Traces" && key === "Void Traces") {
                        if (afterSpend < item.minKeep) {
                            reasons.push(
                                `${rule.label}: keep at least ${item.minKeep} Void Traces (would drop to ${afterSpend}).`
                            );
                        }
                    }
                }
            }

            return { blocked: reasons.length > 0, reasons };
        }
    }))
);

