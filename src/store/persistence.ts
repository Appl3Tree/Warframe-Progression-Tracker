import type { UserStateV1 } from "../domain/models/userState";
import { migrateToUserStateV1 } from "./migrations";

export const STORAGE_KEY_V1 = "wf_tracker_state_v1";
export const STORAGE_KEY_LEGACY = "wf_roadmap_tracker_v1";

export function loadState(): UserStateV1 | null {
    const v1Raw = localStorage.getItem(STORAGE_KEY_V1);
    if (v1Raw) {
        try {
            const parsed = JSON.parse(v1Raw);
            return migrateToUserStateV1(parsed);
        } catch {
            return null;
        }
    }

    const legacyRaw = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacyRaw) {
        try {
            const parsed = JSON.parse(legacyRaw);
            const migrated = migrateToUserStateV1(parsed);
            return migrated;
        } catch {
            return null;
        }
    }

    return null;
}

export function saveState(state: UserStateV1): void {
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(state));
}

