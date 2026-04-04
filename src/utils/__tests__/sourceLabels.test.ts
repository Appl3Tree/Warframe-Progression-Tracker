import { describe, expect, it } from "vitest";
import { formatSourceDisplayLabel, formatTechnicalId } from "../sourceLabels";

describe("formatTechnicalId", () => {
    it("removes technical prefixes and humanizes mission source ids", () => {
        expect(formatTechnicalId("data:drop:node:venus:vesper-relay")).toBe("Venus - Vesper Relay");
        expect(formatTechnicalId("data:missionreward/venus/vesper-relay/rotationb")).toBe("Venus - Vesper Relay - Rotation B");
        expect(formatTechnicalId("node:mr/earth/e-prime")).toBe("Earth - E Prime");
    });
});

describe("formatSourceDisplayLabel", () => {
    it("cleans label prefixes without exposing implementation wording", () => {
        expect(formatSourceDisplayLabel("Mission Reward: Venus / Vesper Relay (Rotation B)")).toBe("Venus - Vesper Relay (Rotation B)");
        expect(formatSourceDisplayLabel("WFItems Location: The Hex / Höllvania")).toBe("The Hex - Höllvania");
        expect(formatSourceDisplayLabel("Legacy: Lunaro mission reward")).toBe("Lunaro mission reward");
    });
});
