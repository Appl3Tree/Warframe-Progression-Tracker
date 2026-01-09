import { z } from "zod";
import type { UserStateV2 } from "../domain/models/userState";

const LegacyPayloadSchema = z
    .object({
        inventory: z.any().optional(),
        syndicates: z.any().optional(),
        reserves: z.any().optional(), // legacy only: ignored
        dailyTasks: z.any().optional()
    })
    .passthrough();

const UserStateV1Schema = z
    .object({
        meta: z
            .object({
                schemaVersion: z.literal(1),
                createdAtIso: z.string(),
                updatedAtIso: z.string()
            })
            .passthrough(),
        player: z
            .object({
                platform: z.literal("PC"),
                displayName: z.string(),
                masteryRank: z.number().nullable()
            })
            .passthrough(),
        ui: z
            .object({
                activePage: z.string()
            })
            .passthrough(),
        prereqs: z
            .object({
                completed: z.record(z.string(), z.boolean())
            })
            .passthrough(),
        inventory: z.any().optional(),
        syndicates: z.any().optional(),
        reserves: z.any().optional(), // legacy only: ignored
        dailyTasks: z.any().optional()
    })
    .passthrough();

const UserStateV2Schema = z
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
                platform: z.literal("PC"),
                displayName: z.string(),
                masteryRank: z.number().nullable()
            })
            .passthrough(),
        ui: z
            .object({
                activePage: z.string()
            })
            .passthrough(),
        prereqs: z
            .object({
                completed: z.record(z.string(), z.boolean())
            })
            .passthrough(),
        inventory: z.any().optional(),
        syndicates: z.any().optional(),
        reserves: z.any().optional(), // legacy only: ignored
        dailyTasks: z.any().optional(),
        mastery: z.any().optional(),
        missions: z.any().optional()
    })
    .passthrough();

function nowIso(): string {
    return new Date().toISOString();
}

function normalizeInventory(raw: any): any {
    const inv = raw && typeof raw === "object" ? raw : {};
    const rawCounts =
        (inv as any).counts && typeof (inv as any).counts === "object"
            ? (inv as any).counts
            : (inv as any).items && typeof (inv as any).items === "object"
                ? (inv as any).items
                : {};

    const creditsCandidate = (inv as any).credits ?? (rawCounts as any)["credits"] ?? (rawCounts as any)["Credits"] ?? 0;
    const platinumCandidate = (inv as any).platinum ?? (rawCounts as any)["platinum"] ?? (rawCounts as any)["Platinum"] ?? 0;

    const credits = Number.isFinite(Number(creditsCandidate))
        ? Math.max(0, Math.floor(Number(creditsCandidate)))
        : 0;
    const platinum = Number.isFinite(Number(platinumCandidate))
        ? Math.max(0, Math.floor(Number(platinumCandidate)))
        : 0;

    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(rawCounts)) {
        if (k === "credits" || k === "Credits" || k === "platinum" || k === "Platinum") {
            continue;
        }
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) continue;
        counts[k] = Math.max(0, n);
    }

    return { credits, platinum, counts };
}

function normalizeMastery(raw: any): { xpByItem: Record<string, number>; mastered: Record<string, boolean> } {
    const m = raw && typeof raw === "object" ? raw : {};
    const xp = (m as any).xpByItem && typeof (m as any).xpByItem === "object" ? (m as any).xpByItem : {};
    const mastered =
        (m as any).mastered && typeof (m as any).mastered === "object" ? (m as any).mastered : {};

    const xpByItem: Record<string, number> = {};
    for (const [k, v] of Object.entries(xp)) {
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) continue;
        xpByItem[k] = Math.max(0, Math.floor(n));
    }

    const masteredMap: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(mastered)) {
        masteredMap[k] = v === true;
    }

    return { xpByItem, mastered: masteredMap };
}

function normalizeMissions(raw: any): { completesByTag: Record<string, number> } {
    const m = raw && typeof raw === "object" ? raw : {};
    const c =
        (m as any).completesByTag && typeof (m as any).completesByTag === "object"
            ? (m as any).completesByTag
            : {};

    const completesByTag: Record<string, number> = {};
    for (const [k, v] of Object.entries(c)) {
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) continue;
        completesByTag[k] = Math.max(0, Math.floor(n));
    }

    return { completesByTag };
}

function normalizePrereqsCompleted(raw: any): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    if (!raw || typeof raw !== "object") return out;

    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        out[String(k)] = v === true;
    }
    return out;
}

export function migrateToUserStateV2(raw: unknown): UserStateV2 | null {
    const v2 = UserStateV2Schema.safeParse(raw);
    if (v2.success) {
        const data: any = v2.data;
        data.inventory = normalizeInventory(data.inventory);
        data.mastery = normalizeMastery(data.mastery);
        data.missions = normalizeMissions(data.missions);

        // Normalize prereqs into boolean map
        data.prereqs = {
            completed: normalizePrereqsCompleted(data.prereqs?.completed)
        };

        // Ensure accountId exists (empty string by default).
        if (!data.player || typeof data.player !== "object") {
            data.player = { platform: "PC", displayName: "", masteryRank: null, accountId: "" };
        } else if (typeof data.player.accountId !== "string") {
            data.player.accountId = "";
        }

        // Ensure required arrays exist
        if (!Array.isArray(data.syndicates)) data.syndicates = [];
        if (!Array.isArray(data.dailyTasks)) data.dailyTasks = [];

        // NOTE: legacy `reserves` is intentionally ignored (derived system)
        return data as UserStateV2;
    }

    const v1 = UserStateV1Schema.safeParse(raw);
    if (v1.success) {
        const migrated: UserStateV2 = {
            meta: {
                schemaVersion: 2,
                createdAtIso: v1.data.meta.createdAtIso ?? nowIso(),
                updatedAtIso: nowIso()
            },
            player: {
                ...(v1.data.player as any),
                accountId: ""
            },
            ui: v1.data.ui as any,
            prereqs: {
                completed: normalizePrereqsCompleted(v1.data.prereqs?.completed)
            },
            inventory: normalizeInventory(v1.data.inventory),
            syndicates: (v1.data as any).syndicates ?? [],
            dailyTasks: (v1.data as any).dailyTasks ?? [],
            mastery: normalizeMastery((v1.data as any).mastery),
            missions: normalizeMissions((v1.data as any).missions)
        };

        const ok = z
            .object({
                meta: z.any(),
                player: z.any(),
                ui: z.any(),
                prereqs: z.object({ completed: z.record(z.string(), z.boolean()) }),
                inventory: z.any(),
                syndicates: z.any(),
                dailyTasks: z.any(),
                mastery: z.any(),
                missions: z.any()
            })
            .passthrough()
            .safeParse(migrated);

        return ok.success ? migrated : null;
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
                accountId: "",
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
            syndicates: legacy.data.syndicates ?? [],
            dailyTasks: legacy.data.dailyTasks ?? [],
            mastery: normalizeMastery((legacy.data as any).mastery),
            missions: normalizeMissions((legacy.data as any).missions)
        };

        const ok = z
            .object({
                meta: z.any(),
                player: z.any(),
                ui: z.any(),
                prereqs: z.object({ completed: z.record(z.string(), z.boolean()) }),
                inventory: z.any(),
                syndicates: z.any(),
                dailyTasks: z.any(),
                mastery: z.any(),
                missions: z.any()
            })
            .passthrough()
            .safeParse(migrated);

        return ok.success ? migrated : null;
    }

    return null;
}

