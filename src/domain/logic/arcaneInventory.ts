export type ArcaneRankMap = Record<string, number>;

function toSafeInt(value: unknown): number {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.floor(numeric));
}

export function getHighestOwnedArcaneRank(rankMap: ArcaneRankMap | null | undefined): number | null {
    if (!rankMap || typeof rankMap !== "object") return null;

    let highestRank: number | null = null;
    for (const [rawRank, rawCount] of Object.entries(rankMap)) {
        if (toSafeInt(rawCount) <= 0) continue;
        const rank = toSafeInt(rawRank);
        if (highestRank === null || rank > highestRank) {
            highestRank = rank;
        }
    }

    return highestRank;
}

export function normalizeArcaneRankMap(rankMap: ArcaneRankMap | null | undefined): ArcaneRankMap {
    const highestRank = getHighestOwnedArcaneRank(rankMap);
    if (highestRank === null) return {};
    return { [String(highestRank)]: 1 };
}

export function setHighestOwnedArcaneRank(rank: number | null): ArcaneRankMap {
    if (rank === null || !Number.isFinite(rank)) return {};
    const nextRank = Math.max(0, Math.floor(rank));
    return { [String(nextRank)]: 1 };
}

export function hasOwnedArcane(rankMap: ArcaneRankMap | null | undefined, fallbackCount = 0): boolean {
    if (getHighestOwnedArcaneRank(rankMap) !== null) return true;
    return toSafeInt(fallbackCount) > 0;
}

export function getHighestOwnedArcaneRankWithFallback(rankMap: ArcaneRankMap | null | undefined, fallbackCount = 0): number | null {
    const highestRank = getHighestOwnedArcaneRank(rankMap);
    if (highestRank !== null) return highestRank;
    return toSafeInt(fallbackCount) > 0 ? 0 : null;
}
