// Reset checklist state helpers — daily/weekly reset tracking logic.

import type { ResetChecklistBucket, ResetChecklistState } from "../domain/types";
import type { UserStateV2 } from "../domain/models/userState";
import {
    normalizeStringArray,
    getCurrentPrimaryDailyResetKey,
    getCurrentSecondaryDailyResetKey,
    getCurrentWeeklyMondayResetKey,
    getCurrentWeeklyFridayResetKey,
} from "./storeUtils";

export function makeDefaultResetChecklistState(now = new Date()): ResetChecklistState {
    return {
        primaryDailyResetKey: getCurrentPrimaryDailyResetKey(now),
        secondaryDailyResetKey: getCurrentSecondaryDailyResetKey(now),
        weeklyMondayResetKey: getCurrentWeeklyMondayResetKey(now),
        weeklyFridayResetKey: getCurrentWeeklyFridayResetKey(now),
        completedPrimaryDailyTaskIds: [],
        completedSecondaryDailyTaskIds: [],
        completedWeeklyMondayTaskIds: [],
        completedWeeklyFridayTaskIds: [],
        timeMode: "utc"
    };
}

export function ensureResetChecklistState(state: any): void {
    const fallback = makeDefaultResetChecklistState();

    if (!state || typeof state !== "object") return;

    if (!state.resetChecklist || typeof state.resetChecklist !== "object") {
        state.resetChecklist = fallback;
        return;
    }

    const raw = state.resetChecklist;

    state.resetChecklist = {
        primaryDailyResetKey:
            typeof raw.primaryDailyResetKey === "string" && raw.primaryDailyResetKey.trim()
                ? raw.primaryDailyResetKey
                : typeof raw.dailyResetKey === "string" && raw.dailyResetKey.trim()
                    ? raw.dailyResetKey
                    : fallback.primaryDailyResetKey,
        secondaryDailyResetKey:
            typeof raw.secondaryDailyResetKey === "string" && raw.secondaryDailyResetKey.trim()
                ? raw.secondaryDailyResetKey
                : fallback.secondaryDailyResetKey,
        weeklyMondayResetKey:
            typeof raw.weeklyMondayResetKey === "string" && raw.weeklyMondayResetKey.trim()
                ? raw.weeklyMondayResetKey
                : typeof raw.weeklyResetKey === "string" && raw.weeklyResetKey.trim()
                    ? raw.weeklyResetKey
                    : fallback.weeklyMondayResetKey,
        weeklyFridayResetKey:
            typeof raw.weeklyFridayResetKey === "string" && raw.weeklyFridayResetKey.trim()
                ? raw.weeklyFridayResetKey
                : fallback.weeklyFridayResetKey,
        completedPrimaryDailyTaskIds: normalizeStringArray(raw.completedPrimaryDailyTaskIds ?? raw.completedDailyTaskIds),
        completedSecondaryDailyTaskIds: normalizeStringArray(raw.completedSecondaryDailyTaskIds),
        completedWeeklyMondayTaskIds: normalizeStringArray(raw.completedWeeklyMondayTaskIds ?? raw.completedWeeklyTaskIds),
        completedWeeklyFridayTaskIds: normalizeStringArray(raw.completedWeeklyFridayTaskIds),
        timeMode: raw.timeMode === "local" ? "local" : "utc"
    };
}

export function syncResetChecklistState(state: UserStateV2, now = new Date()): boolean {
    ensureResetChecklistState(state);

    const nextPrimaryDailyKey = getCurrentPrimaryDailyResetKey(now);
    const nextSecondaryDailyKey = getCurrentSecondaryDailyResetKey(now);
    const nextWeeklyMondayKey = getCurrentWeeklyMondayResetKey(now);
    const nextWeeklyFridayKey = getCurrentWeeklyFridayResetKey(now);

    let changed = false;

    if (state.resetChecklist.primaryDailyResetKey !== nextPrimaryDailyKey) {
        state.resetChecklist.primaryDailyResetKey = nextPrimaryDailyKey;
        state.resetChecklist.completedPrimaryDailyTaskIds = [];
        changed = true;
    }

    if (state.resetChecklist.secondaryDailyResetKey !== nextSecondaryDailyKey) {
        state.resetChecklist.secondaryDailyResetKey = nextSecondaryDailyKey;
        state.resetChecklist.completedSecondaryDailyTaskIds = [];
        changed = true;
    }

    if (state.resetChecklist.weeklyMondayResetKey !== nextWeeklyMondayKey) {
        state.resetChecklist.weeklyMondayResetKey = nextWeeklyMondayKey;
        state.resetChecklist.completedWeeklyMondayTaskIds = [];
        changed = true;
    }

    if (state.resetChecklist.weeklyFridayResetKey !== nextWeeklyFridayKey) {
        state.resetChecklist.weeklyFridayResetKey = nextWeeklyFridayKey;
        state.resetChecklist.completedWeeklyFridayTaskIds = [];
        changed = true;
    }

    return changed;
}

export function getResetTaskArray(state: UserStateV2, bucket: ResetChecklistBucket): string[] {
    ensureResetChecklistState(state);

    if (bucket === "primary_daily") return state.resetChecklist.completedPrimaryDailyTaskIds;
    if (bucket === "secondary_daily") return state.resetChecklist.completedSecondaryDailyTaskIds;
    if (bucket === "weekly_monday") return state.resetChecklist.completedWeeklyMondayTaskIds;
    return state.resetChecklist.completedWeeklyFridayTaskIds;
}
