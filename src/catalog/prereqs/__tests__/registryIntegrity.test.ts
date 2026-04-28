import { describe, expect, it } from "vitest";
import { PREREQ_REGISTRY } from "../prereqRegistry";
import { SOURCE_INDEX } from "../../sources/sourceCatalog";
import { PR } from "../../../domain/ids/prereqIds";

describe("prerequisite registry integrity", () => {
    it("defines every prerequisite referenced by other registry rows", () => {
        const ids = new Set(PREREQ_REGISTRY.map((def) => def.id));
        const missing = PREREQ_REGISTRY.flatMap((def) =>
            def.prerequisites
                .filter((prereqId) => !ids.has(prereqId))
                .map((prereqId) => `${def.id} -> ${prereqId}`),
        );

        expect(missing).toEqual([]);
    });

    it("defines every prerequisite id referenced by the source catalog", () => {
        const ids = new Set(PREREQ_REGISTRY.map((def) => def.id));
        const missing = Object.entries(SOURCE_INDEX).flatMap(([sourceId, source]) =>
            (source.prereqIds ?? [])
                .filter((prereqId) => !ids.has(prereqId))
                .map((prereqId) => `${sourceId} -> ${prereqId}`),
        );

        expect(missing).toEqual([]);
    });

    it("only leaves intentional root milestones without parents", () => {
        const roots = PREREQ_REGISTRY
            .filter((def) => def.prerequisites.length === 0)
            .map((def) => def.id)
            .sort();

        expect(roots).toEqual([PR.VORS_PRIZE]);
    });

    it("makes every other prerequisite reachable from Vor's Prize", () => {
        const index = new Map(PREREQ_REGISTRY.map((def) => [def.id, def]));

        function reachesVors(id: string, seen = new Set<string>()): boolean {
            if (id === PR.VORS_PRIZE) return true;
            if (seen.has(id)) return false;
            seen.add(id);
            const def = index.get(id);
            if (!def || def.prerequisites.length === 0) return false;
            return def.prerequisites.some((prereqId) => reachesVors(prereqId, seen));
        }

        const disconnected = PREREQ_REGISTRY
            .filter((def) => def.id !== PR.VORS_PRIZE)
            .map((def) => def.id)
            .filter((id) => !reachesVors(id));

        expect(disconnected).toEqual([]);
    });
});
