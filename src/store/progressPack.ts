// Progress pack schemas, default state factory, and import/merge logic.

import { z } from "zod";
import type { PageKey, UserStateV2 } from "../domain/models/userState";
import { SEED_INVENTORY, SEED_MASTERY, SEED_MISSIONS, SEED_SYNDICATES } from "../domain/seed";
import { nowIso } from "./storeUtils";
import { makeDefaultResetChecklistState, ensureResetChecklistState } from "./resetChecklist";

export function makeDefaultState(): UserStateV2 {
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

export const ProgressPackSchemaV2 = z
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

export function ensureGoalsArray(state: any): void {
    if (!state || typeof state !== "object") return;
    if (!Array.isArray(state.goals)) state.goals = [];
}

export function ensureUiExpansion(state: any): void {
    if (!state || typeof state !== "object") return;
    if (!state.ui || typeof state.ui !== "object") state.ui = { activePage: "dashboard" };
    if (!state.ui.expandedGoalNodes || typeof state.ui.expandedGoalNodes !== "object") {
        state.ui.expandedGoalNodes = {};
    }
}

export function mergeProgressPackIntoState(current: UserStateV2, incoming: any): UserStateV2 {
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
        // "systems" was renamed to "handbook" in Phase 4.
        const rawPage = incoming.ui.activePage === "systems" ? "handbook" : incoming.ui.activePage;
        next.ui = {
            activePage: (rawPage as PageKey) ?? next.ui.activePage,
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
