// ===== FILE: src/domain/logic/overlapEngine.ts =====

export function overlapSourceKey(sourceType: string, sourceId: string, sourceLabel: string): string {
    return `${sourceType}:${sourceId}:${sourceLabel}`;
}

export function countUniqueSources(keys: string[]): number {
    return new Set(keys).size;
}

export type OverlapGroup<TItem> = {
    sourceId: string;
    sourceLabel: string;
    items: TItem[];
};

export function groupBySource<TItem>(args: {
    items: Array<{
        sourceId: string;
        sourceLabel: string;
        item: TItem;
    }>;
}): OverlapGroup<TItem>[] {
    const byKey: Record<string, OverlapGroup<TItem>> = {};

    for (const row of args.items) {
        const key = `${row.sourceId}::${row.sourceLabel}`;
        if (!byKey[key]) {
            byKey[key] = {
                sourceId: row.sourceId,
                sourceLabel: row.sourceLabel,
                items: []
            };
        }
        byKey[key].items.push(row.item);
    }

    return Object.values(byKey);
}

