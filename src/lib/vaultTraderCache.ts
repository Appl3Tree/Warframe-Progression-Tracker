import type { VaultTrader, VaultTraderItem } from "./worldStateCache";

const API = "https://api.warframestat.us/pc";
const CACHE_TTL = 5 * 60 * 1000;

let _cache: { data: VaultTrader | null; fetchedAt: number } | null = null;
let _inflight: Promise<VaultTrader | null> | null = null;

type PrimeResurgenceRelicDisplayResolver = (input: string) => string | null;

function normalizeVaultTraderItem(
    rawItem: unknown,
    rawUniqueName?: unknown,
    resolvePrimeResurgenceRelicDisplay?: PrimeResurgenceRelicDisplayResolver | null,
): { item: string; uniqueName?: string } {
    const sourceUniqueName = String(rawUniqueName ?? "").trim();
    const sourceItem = String(rawItem ?? "").trim();
    const lookup = sourceUniqueName || sourceItem;
    if (!lookup) return { item: "" };
    const resolvedRelic = resolvePrimeResurgenceRelicDisplay?.(lookup) ?? null;
    if (resolvedRelic) {
        return {
            item: resolvedRelic,
            uniqueName: lookup,
        };
    }
    return {
        item: sourceItem || lookup,
        uniqueName: sourceUniqueName || undefined,
    };
}

export async function fetchVaultTrader(force = false): Promise<VaultTrader | null> {
    const now = Date.now();
    if (!force && _cache && now - _cache.fetchedAt < CACHE_TTL) {
        return _cache.data;
    }
    if (force) _inflight = null;
    if (_inflight) return _inflight;

    _inflight = (async () => {
        try {
            const bust = force ? `&_=${Date.now()}` : "";
            const res = await fetch(`${API}?language=en${bust}`, {
                cache: force ? "no-store" : "default",
            });
            if (!res.ok) throw new Error(`World state API returned ${res.status}`);
            const j = await res.json();
            const rawVaultTrader = j?.vaultTrader;
            if (!rawVaultTrader) {
                _cache = { data: null, fetchedAt: Date.now() };
                return null;
            }

            const resolvePrimeResurgenceRelicDisplay =
                rawVaultTrader?.inventory?.length
                    ? (await import("../domain/catalog/primeResurgence")).resolvePrimeResurgenceRelicDisplay
                    : null;

            const data: VaultTrader = {
                active: !!rawVaultTrader.active || (
                    !!rawVaultTrader.activation &&
                    !!rawVaultTrader.expiry &&
                    Date.now() >= new Date(rawVaultTrader.activation).getTime() &&
                    Date.now() < new Date(rawVaultTrader.expiry).getTime()
                ),
                character: rawVaultTrader.character ?? "",
                location: rawVaultTrader.location ?? "",
                inventory: Array.isArray(rawVaultTrader.inventory)
                    ? rawVaultTrader.inventory.map((it: any): VaultTraderItem => {
                        const normalized = normalizeVaultTraderItem(
                            it?.item,
                            it?.uniqueName,
                            resolvePrimeResurgenceRelicDisplay,
                        );
                        return {
                            item: normalized.item,
                            uniqueName: normalized.uniqueName,
                            ducats: typeof it?.ducats === "number" ? it.ducats : undefined,
                            credits: typeof it?.credits === "number" ? it.credits : undefined,
                            discount: typeof it?.discount === "number" ? it.discount : undefined,
                        };
                    })
                    : [],
                activation: rawVaultTrader.activation ?? "",
                expiry: rawVaultTrader.expiry ?? "",
            };

            _cache = { data, fetchedAt: Date.now() };
            return data;
        } finally {
            _inflight = null;
        }
    })();

    return _inflight;
}

export function getCachedVaultTrader(): VaultTrader | null {
    return _cache?.data ?? null;
}
