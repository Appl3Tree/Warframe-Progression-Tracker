// ===== FILE: src/domain/catalog/syndicates/syndicateVendorCatalog.ts =====
import type { SyndicateVendorEntry } from "./syndicateVendorCatalog";
import {
    ARBITERS_OF_HEXIS_VENDOR_ENTRY,
    CAVIA_VENDOR_ENTRY,
    CEPHALON_SIMARIS_VENDOR_ENTRY,
    CEPHALON_SUDA_VENDOR_ENTRY,
    CONCLAVE_VENDOR_ENTRY,
    ENTRATI_VENDOR_ENTRY,
    KAHLS_GARRISON_VENDOR_ENTRY,
    NECRALOID_VENDOR_ENTRY,
    NEW_LOKA_VENDOR_ENTRY,
    NIGHTCAP_VENDOR_ENTRY,
    NIGHTWAVE_VENDOR_ENTRY,
    OPERATIONAL_SUPPLY_VENDOR_ENTRY,
    OSTRON_VENDOR_ENTRY,
    RED_VEIL_VENDOR_ENTRY,
    SOLARIS_UNITED_VENDOR_ENTRY,
    STEEL_MERIDIAN_VENDOR_ENTRY,
    THE_HEX_VENDOR_ENTRY,
    THE_HOLDFASTS_VENDOR_ENTRY,
    THE_PERRIN_SEQUENCE_VENDOR_ENTRY,
    THE_QUILLS_VENDOR_ENTRY,
    VENTKIDS_VENDOR_ENTRY,
    VOX_SOLARIS_VENDOR_ENTRY
} from "./vendorEntries";

export type SyndicateCostLine =
    | { kind: "credits"; amount: number }
    | { kind: "standing"; amount: number }
    | { kind: "item"; name: string; qty: number }
    | { kind: "currency"; name: string; amount: number }
    | { kind: "other"; label: string; amount?: number };

export type SyndicateRankUpRequirement = {
    // The rank you are ranking UP TO (supports negative ranks too for faction syndicates).
    rank: number;
    // Optional: the minimum standing bound shown for that rank band.
    minimumStanding?: number;
    costs: SyndicateCostLine[];
};

export type SyndicateOffering = {
    name: string;
    // Minimum rank required to purchase.
    rankRequired: number;
    costs: SyndicateCostLine[];
    // Optional: notes like “Blueprint”, “One-time”, etc.
    notes?: string;
};

export type SyndicateVendorEntry = {
    id: string;
    name: string;

    // Rank-up requirements (if applicable).
    rankUps: SyndicateRankUpRequirement[];

    // Optional info to show int eh Ranks tab when rankUps is empty or not meaningful.
    rankInfo?: string;

    // Vendor offerings (if applicable).
    offerings: SyndicateOffering[];

    vendors?: {
        id: string;
        name: string;
        offerings: SyndicateOffering[];
    }[];
};

export const SYNDICATE_VENDOR_CATALOG: SyndicateVendorEntry[] = [
    // Primary
    STEEL_MERIDIAN_VENDOR_ENTRY,
    ARBITERS_OF_HEXIS_VENDOR_ENTRY,
    CEPHALON_SUDA_VENDOR_ENTRY,
    THE_PERRIN_SEQUENCE_VENDOR_ENTRY,
    RED_VEIL_VENDOR_ENTRY,
    NEW_LOKA_VENDOR_ENTRY,

    // Cetus
    OSTRON_VENDOR_ENTRY,
    THE_QUILLS_VENDOR_ENTRY,

    // Fortuna
    SOLARIS_UNITED_VENDOR_ENTRY,
    VENTKIDS_VENDOR_ENTRY,
    VOX_SOLARIS_VENDOR_ENTRY,

    // Necralisk
    ENTRATI_VENDOR_ENTRY,
    CAVIA_VENDOR_ENTRY,
    NECRALOID_VENDOR_ENTRY,

    // Zariman / Chrysalith
    THE_HOLDFASTS_VENDOR_ENTRY,

    // 1999
    THE_HEX_VENDOR_ENTRY,

    // Misc
    CONCLAVE_VENDOR_ENTRY,
    CEPHALON_SIMARIS_VENDOR_ENTRY,

    // Other
    KAHLS_GARRISON_VENDOR_ENTRY,
    OPERATIONAL_SUPPLY_VENDOR_ENTRY,
    NIGHTWAVE_VENDOR_ENTRY,
    NIGHTCAP_VENDOR_ENTRY
];

export function getSyndicateVendorEntry(id: string): SyndicateVendorEntry | null {
    return SYNDICATE_VENDOR_CATALOG.find((e) => e.id === id) ?? null;
}
