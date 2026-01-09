// ===== FILE: src/store/store.ts =====
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { toYMD } from "../domain/ymd";
import type { DailyTask } from "../domain/types";
import { SEED_INVENTORY, SEED_MASTERY, SEED_MISSIONS, SEED_SYNDICATES } from "../domain/seed";
import type { PageKey, UserStateV2 } from "../domain/models/userState";
import { migrateToUserStateV2 } from "./migrations";
import { parseProfileViewingData } from "../utils/profileImport";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";
import { canAccessItemByName } from "../domain/logic/plannerEngine";

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
            accountId: "",
            displayName: "",
            masteryRank: null,
            clanName: undefined,
            clanTier: undefined,
            clanClass: undefined,
            clanXp: undefined
        },
        ui: {
            activePage: "dashboard"
        },
        prereqs: {
            completed: {}
        },
        inventory: SEED_INVENTORY,
        syndicates: SEED_SYNDICATES,
        dailyTasks: [],
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
        mastery: z.any().optional(),
        missions: z.any().optional()
    })
    .passthrough();

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

    if (incoming.dailyTasks !== undefined) {
        next.dailyTasks = incoming.dailyTasks;
    }

    if (incoming.mastery !== undefined) {
        next.mastery = incoming.mastery;
    }

    if (incoming.missions !== undefined) {
        next.missions = incoming.missions;
    }

    return next;
}

type ReserveSource = {
    syndicateId: string;
    syndicateName: string;
    amount: number;
    label?: string;
};

type DerivedReserveLine = {
    key: string; // "credits" | "platinum" | catalogId
    minKeep: number;
    sources: ReserveSource[];
};

function isAccessibleReserveKey(key: string, completedPrereqs: Record<string, boolean>): boolean {
    if (key === "credits" || key === "platinum") {
        return true;
    }

    const rec = FULL_CATALOG.recordsById[key as any];
    const name = typeof rec?.displayName === "string" ? rec.displayName : "";
    if (!name) {
        // Fail-closed: if we can't resolve the catalog record name, we do not claim it's accessible.
        return false;
    }

    const access = canAccessItemByName(name, completedPrereqs);
    return access.allowed;
}

function computeDerivedReservesFromSyndicates(
    syndicates: any[],
    completedPrereqs: Record<string, boolean>
): DerivedReserveLine[] {
    const byKey: Record<string, { minKeep: number; sources: ReserveSource[] }> = {};

    for (const syn of syndicates ?? []) {
        const syndicateId = typeof syn?.id === "string" ? syn.id : "";
        const syndicateName = typeof syn?.name === "string" ? syn.name : syndicateId || "Unknown Syndicate";
        const nr = syn?.nextRankUp;
        if (!nr || typeof nr !== "object") continue;

        // Credits / Platinum
        const credits = Number(nr.credits ?? 0);
        if (Number.isFinite(credits) && credits > 0) {
            const key = "credits";
            if (isAccessibleReserveKey(key, completedPrereqs)) {
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
            if (isAccessibleReserveKey(key, completedPrereqs)) {
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

        // Items (expected: catalogId keys)
        const items = Array.isArray(nr.items) ? nr.items : [];
        for (const it of items) {
            const key = typeof it?.key === "string" ? it.key : "";
            if (!key) continue;

            const count = Number(it?.count ?? 0);
            if (!Number.isFinite(count) || count <= 0) continue;

            if (!isAccessibleReserveKey(key, completedPrereqs)) {
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

    /**
     * Imports a profileViewingData payload saved as JSON or as an HTML file from the browser.
     * Updates:
     * - player name + mastery rank + clan fields
     * - syndicates
     * - missions completion snapshot
     * - mastery XP + mastered map
     *
     * NOTE: We do not fetch automatically (CORS/rate-limit constraints).
     */
    importProfileViewingDataJson: (text: string) => { ok: boolean; error?: string };

    upsertDailyTask: (dateYmd: string, label: string, syndicate?: string, details?: string) => void;
    toggleDailyTask: (taskId: string) => void;
    deleteDailyTask: (taskId: string) => void;

    setSyndicateNotes: (id: string, notes: string) => void;

    exportProgressPackJson: () => string;
    importProgressPackJson: (json: string) => { ok: boolean; error?: string };

    resetToDefaults: () => void;
    resetAllLocalData: () => void;

    getTodayTasks: () => DailyTask[];

    /**
     * Derived reserves (read-only).
     */
    getDerivedReserves: () => DerivedReserveLine[];

    /**
     * Checks whether spending an amount would drop below a derived reserve floor.
     */
    isBelowReserve: (key: string, spendAmount: number) => { blocked: boolean; reasons: string[] };
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

                        s.state.syndicates = parsed.syndicates;
                        s.state.mastery = parsed.mastery;
                        s.state.missions = parsed.missions;

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

            setSyndicateNotes: (id, notes) => {
                set((s) => {
                    const syn = s.state.syndicates.find((x: any) => x.id === id);
                    if (syn) {
                        syn.notes = notes;
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
                try {
                    localStorage.removeItem(PERSIST_KEY);
                } catch {
                    // ignore
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
                return computeDerivedReservesFromSyndicates(syndicates as any[], completed);
            },

            isBelowReserve: (key, spendAmount) => {
                const { inventory } = get().state;

                const completed = get().state.prereqs?.completed ?? {};
                const derived = computeDerivedReservesFromSyndicates((get().state.syndicates ?? []) as any[], completed);

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

                reasons.push(
                    `Keep at least ${rule.minKeep.toLocaleString()} (would drop to ${afterSpend.toLocaleString()}).`
                );

                for (const s of topSources.slice(0, 10)) {
                    reasons.push(
                        `${s.syndicateName}: requires ${s.amount.toLocaleString()}${s.label ? ` (${s.label})` : ""}`
                    );
                }

                if (topSources.length > 10) {
                    reasons.push(`…and ${topSources.length - 10} more sources.`);
                }

                return { blocked: true, reasons };
            }
        })),
        {
            name: PERSIST_KEY,
            version: 3,
            migrate: (persistedState: any) => {
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

