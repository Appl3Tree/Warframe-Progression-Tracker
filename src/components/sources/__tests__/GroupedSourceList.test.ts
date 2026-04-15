import { describe, expect, it } from "vitest";
import { dedupeGroupedSourceEntries } from "../GroupedSourceList";
import { getSyndicateVendorPrice, parseSyndicateVendorLabel } from "../../../catalog/sources/syndicateVendorPricing";

describe("grouped source dedupe", () => {
    it("collapses generic and ranked syndicate vendor entries into the richer vendor row", () => {
        const rankedLabel = "Syndicate Vendor: Arbiters of Hexis (Arbiters of Hexis, Authentic)";
        const parsed = parseSyndicateVendorLabel(rankedLabel);
        const standing = getSyndicateVendorPrice(["Barrel", "Phaedra Barrel", "Phaedra Barrel Blueprint"], rankedLabel);

        const entries = [
            {
                id: "catalog:data:drop:41f0de103b",
                family: "vendor" as const,
                dedupeKey: `vendor:${parsed?.vendorName}`,
                title: parsed?.vendorName ?? rankedLabel,
                subtitle: parsed?.rankName ? `Rank ${parsed?.rankNumber ?? "?"} · ${parsed.rankName}` : undefined,
                meta: standing != null ? `${standing.toLocaleString()} Standing` : undefined,
            },
            {
                id: "catalog:data:vendor/syndicate/arbiters-of-hexis",
                family: "vendor" as const,
                dedupeKey: `vendor:${parsed?.vendorName}`,
                title: "Arbiters of Hexis",
            },
        ];

        expect(dedupeGroupedSourceEntries(entries)).toEqual([
            {
                id: "catalog:data:drop:41f0de103b",
                family: "vendor",
                dedupeKey: "vendor:Arbiters of Hexis",
                title: "Arbiters of Hexis",
                subtitle: "Rank 2 · Authentic",
                meta: "20,000 Standing",
                _sortIndex: 0,
                badges: [],
            },
        ]);
    });

    it("prefers rated cache entries when catalog and drop rows describe the same cache source", () => {
        const entries = [
            {
                id: "catalog:data:caches/ceres/ker",
                family: "cache" as const,
                dedupeKey: "cache:ceres/ker",
                title: "Caches: Ceres - Ker",
            },
            {
                id: "drop:Mars/Gradivus (Caches), Rotation C",
                family: "cache" as const,
                dedupeKey: "cache:ceres/ker",
                title: "Mars/Gradivus (Caches), Rotation C",
                meta: "15.49%",
                sortValue: 15.49,
            },
        ];

        expect(dedupeGroupedSourceEntries(entries)).toEqual([
            {
                id: "drop:Mars/Gradivus (Caches), Rotation C",
                family: "cache",
                dedupeKey: "cache:ceres/ker",
                title: "Mars/Gradivus (Caches), Rotation C",
                meta: "15.49%",
                sortValue: 15.49,
                _sortIndex: 0,
                badges: [],
            },
        ]);
    });
});

describe("syndicate vendor rank parsing", () => {
    it("derives vendor-specific rank numbers from hardcoded syndicate entries", () => {
        const parsed = parseSyndicateVendorLabel("Syndicate Vendor: New Loka (New Loka, Bountiful)");
        const standing = getSyndicateVendorPrice("Phaedra Stock", "Syndicate Vendor: New Loka (New Loka, Bountiful)");

        expect(parsed).toEqual({
            vendorName: "New Loka",
            place: "New Loka, Bountiful",
            rankName: "Bountiful",
            rankNumber: 2,
        });
        expect(standing).toBe(20000);
    });
});
