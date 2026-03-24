import { useEffect, useState } from "react";
import { fetchWorldState, getCachedWorldState, type WorldStateData } from "./worldStateCache";

export function useWorldStateData(): WorldStateData | null {
    const [data, setData] = useState<WorldStateData | null>(() => getCachedWorldState());

    useEffect(() => {
        let cancelled = false;
        fetchWorldState().then((next) => {
            if (!cancelled) setData(next);
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

    return data;
}
