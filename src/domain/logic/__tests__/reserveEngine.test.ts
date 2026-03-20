import { describe, it, expect } from "vitest";
import { buildReserveSnapshot } from "../reserveEngine";
import type { SyndicateState, Inventory } from "../../types";

// Minimal Inventory stub — buildReserveSnapshot receives it but currently ignores it
const EMPTY_INVENTORY: Inventory = { credits: 0, platinum: 0, counts: {} };

function makeSyndicate(
    overrides: Partial<SyndicateState> & { id: string; name: string }
): SyndicateState {
    return {
        rank: 0,
        standing: 0,
        ...overrides,
    };
}

// ─── buildReserveSnapshot ────────────────────────────────────────────────────

describe("buildReserveSnapshot", () => {
    it("returns zero currency and empty lists when syndicates array is empty", () => {
        const snap = buildReserveSnapshot({ syndicates: [], inventory: EMPTY_INVENTORY });
        expect(snap.currency.credits).toBe(0);
        expect(snap.currency.platinum).toBe(0);
        expect(snap.items).toHaveLength(0);
        expect(snap.bySyndicate).toHaveLength(0);
    });

    it("skips syndicates with no nextRankUp", () => {
        const syn = makeSyndicate({ id: "syn:steel-meridian", name: "Steel Meridian" });
        const snap = buildReserveSnapshot({ syndicates: [syn], inventory: EMPTY_INVENTORY });
        expect(snap.currency.credits).toBe(0);
        expect(snap.bySyndicate).toHaveLength(0);
    });

    it("accumulates credits from nextRankUp", () => {
        const syn = makeSyndicate({
            id: "syn:sm",
            name: "Steel Meridian",
            nextRankUp: { credits: 50_000 },
        });
        const snap = buildReserveSnapshot({ syndicates: [syn], inventory: EMPTY_INVENTORY });
        expect(snap.currency.credits).toBe(50_000);
        expect(snap.bySyndicate).toHaveLength(1);
        expect(snap.bySyndicate[0].credits).toBe(50_000);
    });

    it("accumulates platinum from nextRankUp", () => {
        const syn = makeSyndicate({
            id: "syn:sm",
            name: "Steel Meridian",
            nextRankUp: { platinum: 100 },
        });
        const snap = buildReserveSnapshot({ syndicates: [syn], inventory: EMPTY_INVENTORY });
        expect(snap.currency.platinum).toBe(100);
    });

    it("aggregates credits across multiple syndicates", () => {
        const synA = makeSyndicate({ id: "a", name: "A", nextRankUp: { credits: 10_000 } });
        const synB = makeSyndicate({ id: "b", name: "B", nextRankUp: { credits: 20_000 } });
        const snap = buildReserveSnapshot({
            syndicates: [synA, synB],
            inventory: EMPTY_INVENTORY,
        });
        expect(snap.currency.credits).toBe(30_000);
    });

    it("aggregates items from nextRankUp", () => {
        const syn = makeSyndicate({
            id: "syn:sm",
            name: "Steel Meridian",
            nextRankUp: {
                items: [
                    { key: "items:weapon-a", count: 3, label: "Weapon A" },
                    { key: "items:weapon-b", count: 1, label: "Weapon B" },
                ],
            },
        });
        const snap = buildReserveSnapshot({ syndicates: [syn], inventory: EMPTY_INVENTORY });
        expect(snap.items).toHaveLength(2);
        const weaponA = snap.items.find((i) => String(i.catalogId) === "items:weapon-a");
        expect(weaponA?.totalNeeded).toBe(3);
    });

    it("sums shared items across syndicates", () => {
        const synA = makeSyndicate({
            id: "a",
            name: "A",
            nextRankUp: { items: [{ key: "items:resource", count: 5, label: "Resource" }] },
        });
        const synB = makeSyndicate({
            id: "b",
            name: "B",
            nextRankUp: { items: [{ key: "items:resource", count: 3, label: "Resource" }] },
        });
        const snap = buildReserveSnapshot({
            syndicates: [synA, synB],
            inventory: EMPTY_INVENTORY,
        });
        const resource = snap.items.find((i) => String(i.catalogId) === "items:resource");
        expect(resource?.totalNeeded).toBe(8);
    });

    it("excludes items with count 0", () => {
        const syn = makeSyndicate({
            id: "syn:sm",
            name: "Steel Meridian",
            nextRankUp: {
                items: [{ key: "items:zero-item", count: 0, label: "Zero" }],
            },
        });
        const snap = buildReserveSnapshot({ syndicates: [syn], inventory: EMPTY_INVENTORY });
        expect(snap.items).toHaveLength(0);
    });

    it("skips items missing a key", () => {
        const syn = makeSyndicate({
            id: "syn:sm",
            name: "Steel Meridian",
            nextRankUp: {
                // @ts-expect-error — intentionally malformed
                items: [{ count: 5, label: "No Key" }],
            },
        });
        const snap = buildReserveSnapshot({ syndicates: [syn], inventory: EMPTY_INVENTORY });
        expect(snap.items).toHaveLength(0);
    });

    it("sorts bySyndicate alphabetically by syndicateName", () => {
        const synZ = makeSyndicate({ id: "z", name: "Zzz", nextRankUp: { credits: 1 } });
        const synA = makeSyndicate({ id: "a", name: "Aaa", nextRankUp: { credits: 1 } });
        const snap = buildReserveSnapshot({
            syndicates: [synZ, synA],
            inventory: EMPTY_INVENTORY,
        });
        expect(snap.bySyndicate[0].syndicateName).toBe("Aaa");
        expect(snap.bySyndicate[1].syndicateName).toBe("Zzz");
    });

    it("sorts items by totalNeeded descending", () => {
        const syn = makeSyndicate({
            id: "syn:sm",
            name: "Steel Meridian",
            nextRankUp: {
                items: [
                    { key: "items:cheap", count: 1, label: "Cheap" },
                    { key: "items:expensive", count: 99, label: "Expensive" },
                ],
            },
        });
        const snap = buildReserveSnapshot({ syndicates: [syn], inventory: EMPTY_INVENTORY });
        expect(snap.items[0].totalNeeded).toBe(99);
        expect(snap.items[1].totalNeeded).toBe(1);
    });

    it("floors fractional credit values", () => {
        const syn = makeSyndicate({
            id: "syn:sm",
            name: "Steel Meridian",
            nextRankUp: { credits: 1234.9 },
        });
        const snap = buildReserveSnapshot({ syndicates: [syn], inventory: EMPTY_INVENTORY });
        expect(snap.currency.credits).toBe(1234);
    });

    it("clamps negative credit values to 0", () => {
        const syn = makeSyndicate({
            id: "syn:sm",
            name: "Steel Meridian",
            nextRankUp: { credits: -500 },
        });
        const snap = buildReserveSnapshot({ syndicates: [syn], inventory: EMPTY_INVENTORY });
        expect(snap.currency.credits).toBe(0);
    });
});
