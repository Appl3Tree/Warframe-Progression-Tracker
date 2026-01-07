import type { UserStateV2 } from "../domain/models/userState";
import { migrateToUserStateV2 } from "./migrations";

export const STORAGE_KEY_V2 = "wf_tracker_state_v2";
export const STORAGE_KEY_V1 = "wf_tracker_state_v1";
export const STORAGE_KEY_LEGACY = "wf_roadmap_tracker_v1";

export function loadState(): UserStateV2 | null {
    const v2Raw = localStorage.getItem(STORAGE_KEY_V2);
    if (v2Raw) {
        try {
            const parsed = JSON.parse(v2Raw);
            return migrateToUserStateV2(parsed);
        } catch {
            return null;
        }
    }

    const v1Raw = localStorage.getItem(STORAGE_KEY_V1);
    if (v1Raw) {
        try {
            const parsed = JSON.parse(v1Raw);
            return migrateToUserStateV2(parsed);
        } catch {
            return null;
        }
    }

    const legacyRaw = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacyRaw) {
        try {
            const parsed = JSON.parse(legacyRaw);
            return migrateToUserStateV2(parsed);
        } catch {
            return null;
        }
    }

    return null;
}

export function saveState(state: UserStateV2): void {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
}

