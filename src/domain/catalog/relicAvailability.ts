import type { VaultTrader } from "../../lib/worldStateCache";

export type RelicAvailabilityStatus = "available" | "prime_resurgence" | "vaulted";

const RELIC_NAME_RE = /\b(Lith|Meso|Neo|Axi)\s+([A-Za-z0-9]+)\s+Relic\b/i;

function normalizeRelicKey(input: string): string | null {
    const match = String(input ?? "").match(RELIC_NAME_RE);
    if (!match) return null;
    return `${match[1].toLowerCase()} ${match[2].toLowerCase()}`;
}

export function getRelicAvailabilityStatus(
    relicKey: string,
    hasActiveMissions: boolean,
    vaultTrader?: VaultTrader | null,
): RelicAvailabilityStatus {
    if (hasActiveMissions) return "available";

    const normalizedKey = String(relicKey ?? "").toLowerCase();
    const hasPrimeResurgence = (vaultTrader?.inventory ?? []).some((item) => {
        const key = normalizeRelicKey(item.item ?? item.uniqueName ?? "");
        return key === normalizedKey;
    });

    return hasPrimeResurgence ? "prime_resurgence" : "vaulted";
}
