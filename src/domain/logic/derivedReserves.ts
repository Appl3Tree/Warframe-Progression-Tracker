import { FULL_CATALOG } from "../catalog/loadFullCatalog";
import { getSyndicateDisplayName } from "../ids/syndicateIds";
import { canAccessItemByName } from "./plannerEngine";

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
        const syndicateName =
            typeof syn?.name === "string" && syn.name
                ? syn.name
                : syndicateId
                    ? getSyndicateDisplayName(syndicateId)
                    : "Unknown Syndicate";
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
                    label: "Credits",
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
                    label: "Platinum",
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
                label: typeof it?.label === "string" ? it.label : undefined,
            });
        }
    }

    const out: DerivedReserveLine[] = Object.entries(byKey)
        .map(([key, value]) => ({
            key,
            minKeep: Math.max(0, Math.floor(value.minKeep)),
            sources: value.sources,
        }))
        .filter((line) => line.minKeep > 0);

    out.sort((a, b) => {
        if (a.key === "credits" && b.key !== "credits") return -1;
        if (a.key !== "credits" && b.key === "credits") return 1;
        if (a.key === "platinum" && b.key !== "platinum") return -1;
        if (a.key !== "platinum" && b.key === "platinum") return 1;
        return a.key.localeCompare(b.key);
    });

    return out;
}

export function checkSpendAgainstDerivedReserves(args: {
    key: string;
    spendAmount: number;
    currentCredits: number;
    currentPlatinum: number;
    currentCounts: Record<string, number>;
    derived: DerivedReserveLine[];
}): { blocked: boolean; reasons: string[] } {
    const { key, spendAmount, currentCredits, currentPlatinum, currentCounts, derived } = args;
    const rule = derived.find((line) => line.key === key);
    if (!rule) {
        return { blocked: false, reasons: [] };
    }

    const current =
        key === "credits"
            ? currentCredits
            : key === "platinum"
                ? currentPlatinum
                : currentCounts[key] ?? 0;

    const spend = Number.isFinite(spendAmount) ? spendAmount : 0;
    const afterSpend = current - spend;

    if (afterSpend >= rule.minKeep) {
        return { blocked: false, reasons: [] };
    }

    const reasons: string[] = [];
    const topSources = [...(rule.sources ?? [])].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

    reasons.push(`Keep at least ${rule.minKeep.toLocaleString()} (would drop to ${afterSpend.toLocaleString()}).`);

    for (const source of topSources.slice(0, 10)) {
        reasons.push(`${source.syndicateName}: requires ${source.amount.toLocaleString()}${source.label ? ` (${source.label})` : ""}`);
    }

    if (topSources.length > 10) {
        reasons.push(`…and ${topSources.length - 10} more sources.`);
    }

    return { blocked: true, reasons };
}
