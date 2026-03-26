// src/domain/catalog/primeAvailability.ts
// Shared prime availability helpers that combine static vaulted flags with
// live Varzia / Prime Resurgence world state.

import ALL_RAW from "../../../external/warframe-items/raw/All.json";
import RELICS_RAW from "../../../external/warframe-drop-data/raw/relics.json";
import missionIndexRaw from "../../data/_generated/relic-missionRewards-index.auto.json";
import { resolvePrimeResurgenceRelicKey } from "./primeResurgence";
import type { WorldStateData } from "../../lib/worldStateCache";

export type PrimeAvailabilityStatus = "available" | "prime_resurgence" | "vaulted";

interface AllComponent {
    uniqueName?: string;
    name?: string;
}

interface AllEntry {
    uniqueName?: string;
    name?: string;
    vaulted?: boolean;
    isPrime?: boolean;
    components?: AllComponent[];
}

interface SourceEntry {
    source?: string;
}

interface MissionEntry {
    relicKey?: string;
}

const RELIC_NAME_RE = /\b(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\s+Relic\b/i;

const _allByPath = new Map<string, AllEntry>();
const _vaultedByPath = new Map<string, boolean>();
const _isPrimeByPath = new Map<string, boolean>();
const _nameToPath = new Map<string, string>();

for (const item of ALL_RAW as AllEntry[]) {
    const path = item.uniqueName;
    if (!path) continue;
    _allByPath.set(path, item);
    if (item.vaulted) _vaultedByPath.set(path, true);
    if (item.isPrime) _isPrimeByPath.set(path, true);
    if (item.name) _nameToPath.set(item.name, path);
}

// Build _sourcesByPath from external relics drop data
const _sourcesByPath = new Map<string, SourceEntry[]>();
interface RelicReward { itemName?: string; rarity?: string; chance?: number; }
interface RelicEntry { tier?: string; relicName?: string; state?: string; rewards?: RelicReward[]; }
const _seenRelicItemPairs = new Set<string>();
for (const relic of (RELICS_RAW as { relics: RelicEntry[] }).relics ?? []) {
    const { tier, relicName, state, rewards } = relic;
    if (!tier || !relicName || state !== "Intact") continue;
    const sourceLabel = `${tier} ${relicName} Relic`;
    for (const reward of rewards ?? []) {
        const itemName = reward.itemName;
        if (!itemName) continue;
        const path = _nameToPath.get(itemName);
        if (!path) continue;
        const pairKey = `${path}|${sourceLabel}`;
        if (_seenRelicItemPairs.has(pairKey)) continue;
        _seenRelicItemPairs.add(pairKey);
        const existing = _sourcesByPath.get(path);
        if (existing) {
            existing.push({ source: sourceLabel });
        } else {
            _sourcesByPath.set(path, [{ source: sourceLabel }]);
        }
    }
}

const _activeMissionRelicKeys = new Set<string>();
for (const row of missionIndexRaw as MissionEntry[]) {
    if (row.relicKey) _activeMissionRelicKeys.add(row.relicKey.toLowerCase());
}

function normalizeRelicKey(input: string): string | null {
    const match = input.match(RELIC_NAME_RE);
    if (match) return `${match[1].toLowerCase()} ${match[2].toLowerCase()}`;
    return resolvePrimeResurgenceRelicKey(input);
}

function normalizeVarziaInventoryPath(input: string): string {
    const raw = String(input ?? "").trim();
    if (!raw) return "";
    if (raw.startsWith("/Lotus/StoreItems/")) {
        return raw.replace("/Lotus/StoreItems/", "/Lotus/");
    }
    return raw;
}

function getPrimeResurgenceRelicKeys(worldState?: WorldStateData | null): Set<string> {
    const keys = new Set<string>();
    if (!worldState?.vaultTrader) return keys;

    for (const item of worldState.vaultTrader.inventory ?? []) {
        const key = normalizeRelicKey(item.uniqueName ?? item.item ?? "");
        if (key) keys.add(key);
    }
    return keys;
}

function getPrimeResurgenceDirectItemPaths(worldState?: WorldStateData | null): Set<string> {
    const paths = new Set<string>();
    if (!worldState?.vaultTrader) return paths;

    for (const item of worldState.vaultTrader.inventory ?? []) {
        const path = normalizeVarziaInventoryPath(item.uniqueName ?? "");
        if (!path) continue;
        if (!_allByPath.has(path)) continue;
        paths.add(path);
    }
    return paths;
}

function getDirectSourceStatus(
    path: string,
    primeResurgenceRelicKeys: Set<string>
): PrimeAvailabilityStatus | undefined {
    const sources = _sourcesByPath.get(path) ?? [];
    if (sources.length === 0) return undefined;

    let hasNonRelicSource = false;
    let hasRelicSource = false;
    let hasActiveRelic = false;
    let hasPrimeResurgenceRelic = false;

    for (const src of sources) {
        const source = src.source ?? "";
        const relicKey = normalizeRelicKey(source);
        if (relicKey) {
            hasRelicSource = true;
            if (_activeMissionRelicKeys.has(relicKey)) hasActiveRelic = true;
            if (primeResurgenceRelicKeys.has(relicKey)) hasPrimeResurgenceRelic = true;
            continue;
        }
        hasNonRelicSource = true;
    }

    if (hasNonRelicSource || hasActiveRelic) return "available";
    if (hasPrimeResurgenceRelic) return "prime_resurgence";
    if (hasRelicSource) return "vaulted";
    return undefined;
}

function resolvePathStatus(
    path: string,
    primeResurgenceRelicKeys: Set<string>,
    primeResurgenceDirectItemPaths: Set<string>,
    memo: Map<string, PrimeAvailabilityStatus>
): PrimeAvailabilityStatus {
    const cached = memo.get(path);
    if (cached) return cached;

    if (primeResurgenceDirectItemPaths.has(path)) {
        memo.set(path, "prime_resurgence");
        return "prime_resurgence";
    }

    const directStatus = getDirectSourceStatus(path, primeResurgenceRelicKeys);
    if (directStatus === "available" || directStatus === "prime_resurgence") {
        memo.set(path, directStatus);
        return directStatus;
    }

    const item = _allByPath.get(path);
    const components = item?.components ?? [];
    if (components.length > 0) {
        let sawPrimeResurgence = false;

        for (const comp of components) {
            if (!comp.uniqueName) continue;

            const compStatus = resolvePathStatus(comp.uniqueName, primeResurgenceRelicKeys, primeResurgenceDirectItemPaths, memo);
            if (compStatus === "vaulted") {
                memo.set(path, "vaulted");
                return "vaulted";
            }
            if (compStatus === "prime_resurgence") sawPrimeResurgence = true;
        }

        if (sawPrimeResurgence) {
            memo.set(path, "prime_resurgence");
            return "prime_resurgence";
        }
    }

    const fallback: PrimeAvailabilityStatus =
        directStatus ??
        ((_vaultedByPath.get(path) ?? false) ? "vaulted" : "available");

    memo.set(path, fallback);
    return fallback;
}

export function getPrimeAvailabilityStatus(
    catalogId: string,
    worldState?: WorldStateData | null
): PrimeAvailabilityStatus {
    const path = catalogId.startsWith("items:") ? catalogId.slice(6) : catalogId;
    return resolvePathStatus(
        path,
        getPrimeResurgenceRelicKeys(worldState),
        getPrimeResurgenceDirectItemPaths(worldState),
        new Map()
    );
}

export function getRelicAvailabilityStatus(
    relicKey: string,
    hasActiveMissions: boolean,
    worldState?: WorldStateData | null
): PrimeAvailabilityStatus {
    if (hasActiveMissions) return "available";
    return getPrimeResurgenceRelicKeys(worldState).has(relicKey.toLowerCase())
        ? "prime_resurgence"
        : "vaulted";
}

export function isItemVaulted(catalogId: string, worldState?: WorldStateData | null): boolean {
    return getPrimeAvailabilityStatus(catalogId, worldState) === "vaulted";
}

export function isItemPrime(catalogId: string): boolean {
    const path = catalogId.startsWith("items:") ? catalogId.slice(6) : catalogId;
    return _isPrimeByPath.get(path) ?? false;
}
