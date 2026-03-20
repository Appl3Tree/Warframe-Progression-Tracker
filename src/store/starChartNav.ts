/**
 * One-shot navigation intent: navigate to a specific Star Chart node.
 *
 * Requirements page sets this before calling setActivePage("starChart").
 * StarChart.tsx consumes and clears it on mount via getPendingStarChartNodeId().
 *
 * Using a module-level variable avoids polluting the persisted Zustand state
 * schema with transient UI intent.
 */
let _pendingNodeId: string | null = null;

export function setPendingStarChartNodeId(nodeId: string): void {
    _pendingNodeId = nodeId;
}

/** Returns the pending node ID and clears it (one-shot). */
export function getPendingStarChartNodeId(): string | null {
    const v = _pendingNodeId;
    _pendingNodeId = null;
    return v;
}

/**
 * Parses a FarmingItemSource sourceId into a Star Chart node ID, if possible.
 * Returns null for sources that don't map to a specific star chart node
 * (e.g. Sorties, Void Fissures, Bounties, market sources).
 *
 * sourceId formats that map to nodes:
 *   data:node/<planet>/<node>
 *   data:missionreward/<planet>/<node>
 *   data:missionreward/<planet>/<node>/rotation[a|b|c]
 */
export function sourceIdToStarChartNodeId(sourceId: string): string | null {
    const m = String(sourceId).match(/^data:(?:node|missionreward)\/([^/]+)\/([^/]+)/);
    if (!m) return null;
    return `node:mr/${m[1]}/${m[2]}`;
}
