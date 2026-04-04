import { useEffect, useState } from "react";
import { fetchVaultTrader, getCachedVaultTrader } from "./vaultTraderCache";
import type { VaultTrader } from "./worldStateCache";

export function useVaultTraderData(): VaultTrader | null {
    const [data, setData] = useState<VaultTrader | null>(() => getCachedVaultTrader());

    useEffect(() => {
        let cancelled = false;
        fetchVaultTrader(true)
            .then((next) => {
                if (!cancelled) setData(next);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    return data;
}
