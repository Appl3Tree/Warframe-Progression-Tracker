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
    prereqs: z.object({
        completed: z.record(z.boolean())
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

function clampNonnegInt(v: any): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
}

function normalizeInventory(raw: any): { credits: number; platinum: number; counts: Record<string, number> } {
    const inv = raw && typeof raw === "object" ? raw : {};
    const rawCounts =
        (inv as any).counts && typeof (inv as any).counts === "object"
            ? (inv as any).counts
            : (inv as any).items && typeof (inv as any).items === "object"
            ? (inv as any).items
            : {};

    const creditsCandidate =
        (inv as any).credits ??
        rawCounts["credits"] ??
        rawCounts["Credits"] ??
        0;

    const platinumCandidate =
        (inv as any).platinum ??
        rawCounts["platinum"] ??
        rawCounts["Platinum"] ??
        0;

    const credits = clampNonnegInt(creditsCandidate);
    const platinum = clampNonnegInt(platinumCandidate);

    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(rawCounts)) {
        const key = String(k);

        // Only special-case Credits and Platinum. Everything else stays in counts
        // ONLY if it isn't obviously a legacy special-cased currency key.
        if (
            key === "credits" ||
            key === "Credits" ||
            key === "platinum" ||
            key === "Platinum"
        ) {
            continue;
        }

        // Drop known legacy currency keys if they exist (fail-closed against reintroducing them).
        const nk = key.trim().toLowerCase();
        if (nk === "aya" || nk === "void traces" || nk === "voidtraces") {
            continue;
        }

        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) continue;
        counts[key] = Math.max(0, n);
    }

    return { credits, platinum, counts };
}

export function migrateToUserStateV2(raw: unknown): UserStateV2 | null {
    // Handle zustand envelope shape: { state: ..., version: ... }
    const candidate: any = (raw as any)?.state ?? raw;

    const v2 = UserStateV2Schema.safeParse(candidate);
    if (v2.success) {
        const data: any = v2.data;
        data.inventory = normalizeInventory(data.inventory);
        return data as UserStateV2;
    }

    const v1 = UserStateV1Schema.safeParse(candidate);
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
                completed: v1.data.prereqs?.completed ?? {}
            },
            inventory: normalizeInventory(v1.data.inventory),
            syndicates: v1.data.syndicates,
            reserves: v1.data.reserves,
            dailyTasks: v1.data.dailyTasks
        };

        const ok = UserStateV2Schema.safeParse(migrated);
        return ok.success ? (migrated as UserStateV2) : null;
    }

    const legacy = LegacyPayloadSchema.safeParse(candidate);
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
            },
            prereqs: {
                completed: {}
            },
            inventory: normalizeInventory(legacy.data.inventory),
            syndicates: legacy.data.syndicates,
            reserves: legacy.data.reserves,
            dailyTasks: legacy.data.dailyTasks
        };

        const ok = UserStateV2Schema.safeParse(migrated);
        return ok.success ? (migrated as UserStateV2) : null;
    }

    return null;
}

