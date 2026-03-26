import ALL_RAW from "../../../external/warframe-items/raw/All.json";

interface AllEntry {
    uniqueName?: string;
    name?: string;
    category?: string;
    type?: string;
}

const RELIC_DISPLAY_RE = /^(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\s+(?:Relic|Intact|Exceptional|Flawless|Radiant)$/i;

const _projectionDisplayByPath = new Map<string, string>();
const _projectionRelicKeyByPath = new Map<string, string>();
const _projectionDisplayByShortId = new Map<string, string>();
const _projectionRelicKeyByShortId = new Map<string, string>();

function normalizeProjectionPath(input: string): string {
    const trimmed = String(input ?? "").trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("/")) return trimmed;
    if (/^T\dVoidProjection/i.test(trimmed)) {
        return `/Lotus/Types/Game/Projections/${trimmed}`;
    }
    return trimmed;
}

function toRelicDisplayName(name: string): string | null {
    const match = String(name ?? "").match(RELIC_DISPLAY_RE);
    if (!match) return null;
    return `${match[1]} ${match[2]} Relic`;
}

function toRelicKey(name: string): string | null {
    const match = String(name ?? "").match(RELIC_DISPLAY_RE);
    if (!match) return null;
    return `${match[1].toLowerCase()} ${match[2].toLowerCase()}`;
}

for (const item of ALL_RAW as AllEntry[]) {
    const path = item.uniqueName;
    if (!path) continue;
    if (!/\/Lotus\/Types\/Game\/Projections\//i.test(path)) continue;

    const relicDisplay = toRelicDisplayName(item.name ?? "");
    const relicKey = toRelicKey(item.name ?? "");
    if (!relicDisplay || !relicKey) continue;

    const shortId = path.split("/").pop() ?? path;
    _projectionDisplayByPath.set(path, relicDisplay);
    _projectionRelicKeyByPath.set(path, relicKey);
    _projectionDisplayByShortId.set(shortId, relicDisplay);
    _projectionRelicKeyByShortId.set(shortId, relicKey);
}

export function resolvePrimeResurgenceRelicDisplay(input: string): string | null {
    const normalized = normalizeProjectionPath(input);
    if (!normalized) return null;
    return _projectionDisplayByPath.get(normalized)
        ?? _projectionDisplayByShortId.get(normalized)
        ?? _projectionDisplayByShortId.get(normalized.split("/").pop() ?? normalized)
        ?? null;
}

export function resolvePrimeResurgenceRelicKey(input: string): string | null {
    const normalized = normalizeProjectionPath(input);
    if (!normalized) return null;
    return _projectionRelicKeyByPath.get(normalized)
        ?? _projectionRelicKeyByShortId.get(normalized)
        ?? _projectionRelicKeyByShortId.get(normalized.split("/").pop() ?? normalized)
        ?? null;
}
