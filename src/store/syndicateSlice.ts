// Syndicate state helpers — patch normalization, pledge logic.

import type { SyndicateState } from "../domain/types";
import { SY } from "../domain/ids/syndicateIds";

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
