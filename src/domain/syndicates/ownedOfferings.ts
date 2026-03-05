// Centralized owned-offerings helpers for all syndicate cards and modals.
// Key format: `wfpt:syndicateOwned:{syndicateId}` → JSON Record<string, boolean>

export type OwnedMap = Record<string, boolean>;

export function ownedStorageKey(syndicateId: string): string {
    return `wfpt:syndicateOwned:${syndicateId}`;
}

/** Stable offering key: unique within a syndicate even if vendors share item names. */
export function offeringKey(vendorId: string, name: string): string {
    return `${vendorId}::${name}`;
}

function canUseLocalStorage(): boolean {
    try {
        if (typeof window === "undefined") return false;
        if (!window.localStorage) return false;
        const k = "__wfpt_ls_test__";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
        return true;
    } catch {
        return false;
    }
}

export function readOwnedMap(syndicateId: string): OwnedMap {
    if (!syndicateId || !canUseLocalStorage()) return {};
    try {
        const raw = localStorage.getItem(ownedStorageKey(syndicateId));
        if (!raw) return {};
        return JSON.parse(raw) as OwnedMap;
    } catch {
        return {};
    }
}

export function writeOwnedMap(syndicateId: string, map: OwnedMap): void {
    if (!syndicateId || !canUseLocalStorage()) return;
    try {
        localStorage.setItem(ownedStorageKey(syndicateId), JSON.stringify(map));
    } catch {
        // ignore write failures (private browsing, storage quota, etc.)
    }
}

/**
 * Count how many offerings in the list are marked owned.
 * `offerings` should be flat with vendorId + name for each entry.
 */
export function countOwned(
    offerings: Array<{ vendorId: string; name: string }>,
    ownedMap: OwnedMap
): { owned: number; total: number } {
    let owned = 0;
    for (const o of offerings) {
        if (ownedMap[offeringKey(o.vendorId, o.name)]) owned++;
    }
    return { owned, total: offerings.length };
}
