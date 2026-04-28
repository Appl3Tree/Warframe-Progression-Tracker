import { describe, expect, it } from "vitest";
import { PR } from "../../ids/prereqIds";
import { computeUnlockGraphSnapshot } from "../unlockGraph";
import { deriveCompletedMap, isAutoTrackedPrereq } from "../syndicatePrereqs";
import { STAR_CHART_NODES } from "../../catalog/starChart/nodes";

describe("unlockGraph condition handling", () => {
    it("keeps mastery-gated prereqs blocked until the mastery condition is met", () => {
        const completedMap = {
            [PR.SECOND_DREAM]: true,
            [PR.JUNCTION_NEPTUNE_PLUTO]: true,
        };

        const blocked = computeUnlockGraphSnapshot(completedMap, undefined, { masteryRank: 4 }).byId[PR.WAR_WITHIN];
        expect(blocked.unlocked).toBe(false);
        expect(blocked.missing).toEqual([]);
        expect(blocked.missingConditions).toHaveLength(1);
        expect(blocked.missingConditions[0]).toMatchObject({ type: "mastery_rank", value: 5 });

        const unlocked = computeUnlockGraphSnapshot(completedMap, undefined, { masteryRank: 5 }).byId[PR.WAR_WITHIN];
        expect(unlocked.unlocked).toBe(true);
        expect(unlocked.missingConditions).toEqual([]);
    });
});

describe("auto-tracked prerequisite derivation", () => {
    it("auto-completes mastery milestones from the profile mastery rank", () => {
        const merged = deriveCompletedMap({}, [], 8);
        expect(merged[PR.MR_5]).toBe(true);
        expect(merged[PR.MR_8]).toBe(true);
        expect(merged[PR.MR_10]).not.toBe(true);
    });

    it("flags mastery milestones as auto-tracked", () => {
        expect(isAutoTrackedPrereq(PR.MR_5)).toBe(true);
        expect(isAutoTrackedPrereq(PR.WAR_WITHIN)).toBe(false);
    });

    it("auto-completes Steel Path and Nightmare when the imported star chart shows the required nodes complete", () => {
        const allNodesComplete = Object.fromEntries(STAR_CHART_NODES.map((node) => [node.id, true]));
        const merged = deriveCompletedMap({}, [], 0, allNodesComplete);
        expect(merged[PR.ACTIVITY_STEEL_PATH]).toBe(true);
        expect(merged[PR.ACTIVITY_NIGHTMARE]).toBe(true);
    });
});
