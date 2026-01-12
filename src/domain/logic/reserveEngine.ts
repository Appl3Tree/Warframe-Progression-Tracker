// src/domain/logic/reserveEngine.ts

import type { SyndicateState, Inventory } from "../types";
import type { CatalogId } from "../catalog/loadFullCatalog";

export type ReservedItem = {
    catalogId: CatalogId;
    name?: string;
    totalNeeded: number;
};

export type ReservedCurrency = {
    credits: number;
    platinum: number;
};

export type SyndicateReserve = {
    syndicateId: string;
    syndicateName: string;
    rankLabel?: string;

    credits: number;
    platinum: number;
    items: ReservedItem[];
};

export type ReserveSnapshot = {
    currency: ReservedCurrency;
    items: ReservedItem[];
    bySyndicate: SyndicateReserve[];
};

/**
 * Reserve Engine v1
 *
 * RULES:
 * - Only considers nextRankUp data already present on SyndicateState
 * - Does NOT check prereqs or accessibility
 * - Does NOT consider inventory availability (this is "pressure", not deficit)
 * - Fail-silent on malformed data
 *
 * PURPOSE:
 * - Answer "What should I not spend because upcoming ranks will need it?"
 */
export function buildReserveSnapshot(args: {
    syndicates: SyndicateState[];
    inventory: Inventory;
}): ReserveSnapshot {
    const { syndicates } = args;

    const currency: ReservedCurrency = {
        credits: 0,
        platinum: 0
    };

    const itemAgg: Record<string, ReservedItem> = {};
    const bySyndicate: SyndicateReserve[] = [];

    function addItem(catalogId: CatalogId, count: number, name?: string) {
        if (!itemAgg[catalogId]) {
            itemAgg[catalogId] = {
                catalogId,
                name,
                totalNeeded: 0
            };
        }
        itemAgg[catalogId].totalNeeded += count;
    }

    for (const syn of syndicates ?? []) {
        const nr = syn?.nextRankUp;
        if (!nr) continue;

        const synCredits = Math.max(0, Math.floor(nr.credits ?? 0));
        const synPlatinum = Math.max(0, Math.floor(nr.platinum ?? 0));

        const items: ReservedItem[] = [];

        if (synCredits > 0) currency.credits += synCredits;
        if (synPlatinum > 0) currency.platinum += synPlatinum;

        for (const it of nr.items ?? []) {
            if (!it || typeof it.key !== "string") continue;
            const need = Math.max(0, Math.floor(it.count ?? 0));
            if (need <= 0) continue;

            const cid = it.key as CatalogId;

            addItem(cid, need, it.label);
            items.push({
                catalogId: cid,
                name: it.label,
                totalNeeded: need
            });
        }

        if (synCredits > 0 || synPlatinum > 0 || items.length > 0) {
            bySyndicate.push({
                syndicateId: syn.id,
                syndicateName: syn.name,
                rankLabel: syn.rankLabel,
                credits: synCredits,
                platinum: synPlatinum,
                items
            });
        }
    }

    const items = Object.values(itemAgg).sort((a, b) => {
        if (a.totalNeeded !== b.totalNeeded) {
            return b.totalNeeded - a.totalNeeded;
        }
        return String(a.catalogId).localeCompare(String(b.catalogId));
    });

    bySyndicate.sort((a, b) =>
        a.syndicateName.localeCompare(b.syndicateName)
    );

    return {
        currency,
        items,
        bySyndicate
    };
}

