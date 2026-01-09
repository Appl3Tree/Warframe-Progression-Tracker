// ===== FILE: src/domain/logic/overlapEngine.ts =====
export function overlapSourceKey(sourceType: string, sourceId: string, sourceLabel: string): string {
    return `${sourceType}:${sourceId}:${sourceLabel}`;
}

export function countUniqueSources(keys: string[]): number {
    return new Set(keys).size;
}

