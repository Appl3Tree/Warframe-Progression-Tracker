import { z } from "zod";
import type { UserStateV2 } from "../domain/models/userState";

const LegacyPayloadSchema = z.object({
    inventory: z.any(),
    syndicates: z.any(),
    reserves: z.any(),
    dailyTasks: z.any()
});

const UserStateV1Schema = z.object({
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

const UserStateV2Schema = z.object({
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

function nowIso(): string {
    return new Date().toISOString();
}

export function migrateToUserStateV2(raw: unknown): UserStateV2 | null {
    const v2 = UserStateV2Schema.safeParse(raw);
    if (v2.success) {
        return v2.data as UserStateV2;
    }

    const v1 = UserStateV1Schema.safeParse(raw);
    if (v1.success) {
        const migrated: UserStateV2 = {
            meta: {
                schemaVersion: 2,
                createdAtIso: v1.data.meta.createdAtIso ?? nowIso(),
                updatedAtIso: nowIso()
            },
            player: v1.data.player,
            ui: v1.data.ui as any,
            prereqs: {
                completed: {}
            },
            inventory: v1.data.inventory,
            syndicates: v1.data.syndicates,
            reserves: v1.data.reserves,
            dailyTasks: v1.data.dailyTasks
        };

        const ok = UserStateV2Schema.safeParse(migrated);
        return ok.success ? (migrated as UserStateV2) : null;
    }

    const legacy = LegacyPayloadSchema.safeParse(raw);
    if (legacy.success) {
        const migrated: UserStateV2 = {
            meta: {
                schemaVersion: 2,
                createdAtIso: nowIso(),
                updatedAtIso: nowIso()
            },
            player: {
                platform: "PC",
                displayName: "",
                masteryRank: null
            },
            ui: {
                activePage: "dashboard"
            } as any,
            prereqs: {
                completed: {}
            },
            inventory: legacy.data.inventory,
            syndicates: legacy.data.syndicates,
            reserves: legacy.data.reserves,
            dailyTasks: legacy.data.dailyTasks
        };

        const ok = UserStateV2Schema.safeParse(migrated);
        return ok.success ? (migrated as UserStateV2) : null;
    }

    return null;
}

