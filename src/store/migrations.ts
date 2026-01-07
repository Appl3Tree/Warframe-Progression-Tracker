import { z } from "zod";
import type { UserStateV1 } from "../domain/models/userState";

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

function nowIso(): string {
    return new Date().toISOString();
}

export function migrateToUserStateV1(raw: unknown): UserStateV1 | null {
    const v1 = UserStateV1Schema.safeParse(raw);
    if (v1.success) {
        return v1.data as UserStateV1;
    }

    const legacy = LegacyPayloadSchema.safeParse(raw);
    if (!legacy.success) {
        return null;
    }

    const migrated: UserStateV1 = {
        meta: {
            schemaVersion: 1,
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
        },
        inventory: legacy.data.inventory,
        syndicates: legacy.data.syndicates,
        reserves: legacy.data.reserves,
        dailyTasks: legacy.data.dailyTasks
    };

    const ok = UserStateV1Schema.safeParse(migrated);
    if (!ok.success) {
        return null;
    }
    return migrated;
}

