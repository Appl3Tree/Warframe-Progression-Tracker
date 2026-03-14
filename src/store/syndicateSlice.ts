// Syndicate state helpers — reserve computation, patch normalization, pledge logic.

import type { SyndicateState } from "../domain/types";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";
import { canAccessItemByName } from "../domain/logic/plannerEngine";
import { SY } from "../domain/ids/syndicateIds";

export type ReserveSource = {
    syndicateId: string;
    syndicateName: string;
    amount: number;
    label?: string;
};

export type DerivedReserveLine = {
    key: string;
    minKeep: number;
    sources: ReserveSource[];
};

export function isAccessibleReserveKey(
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

export function computeDerivedReservesFromSyndicates(
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

export function normalizeSyndicatePatch(input: any): Partial<SyndicateState> {
    const out: Partial<SyndicateState> = {};

    if (!input || typeof input !== "object") return out;

    if (typeof input.id === "string") out.id = input.id;
    if (typeof input.name === "string") out.name = input.name;

    if (typeof input.rank === "number" && Number.isFinite(input.rank)) out.rank = Math.floor(input.rank);
    if (typeof input.standing === "number" && Number.isFinite(input.standing)) out.standing = Math.floor(input.standing);

    if (typeof input.pledged === "boolean") out.pledged = input.pledged;

    if (typeof input.standingCap === "number" && Number.isFinite(input.standingCap)) out.standingCap = Math.floor(input.standingCap);
    if (typeof input.dailyCap === "number" && Number.isFinite(input.dailyCap)) out.dailyCap = Math.floor(input.dailyCap);

    if (input.nextRankUp && typeof input.nextRankUp === "object") {
        out.nextRankUp = input.nextRankUp;
    }

    return out;
}

export function upsertSyndicateIntoList(list: SyndicateState[], patch: Partial<SyndicateState>): SyndicateState[] {
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

export function isPrimaryFactionId(id: string): boolean {
    return (
        id === SY.STEEL_MERIDIAN ||
        id === SY.ARBITERS_OF_HEXIS ||
        id === SY.CEPHALON_SUDA ||
        id === SY.THE_PERRIN_SEQUENCE ||
        id === SY.RED_VEIL ||
        id === SY.NEW_LOKA
    );
}

export function countPrimaryPledges(list: SyndicateState[]): number {
    let n = 0;
    for (const s of list) {
        if (s && typeof s.id === "string" && isPrimaryFactionId(s.id) && s.pledged) n++;
    }
    return n;
}
