// src/catalog/sources/sourceCatalog.ts

import type { PrereqId } from "../../domain/ids/prereqIds";
import { PR } from "../../domain/ids/prereqIds";
import type { SourceId } from "../../domain/ids/sourceIds";
import { SRC } from "../../domain/ids/sourceIds";

export type SourceType =
    | "Hub"
    | "Vendor"
    | "Mission"
    | "Syndicate"
    | "Unknown";

export interface SourceDef {
    id: SourceId;
    label: string;
    type: SourceType;
    prereqIds: PrereqId[];
    notes?: string;
}

export const SOURCE_CATALOG: SourceDef[] = [
    {
        id: SRC.HUB_CETUS,
        label: "Cetus / Plains of Eidolon",
        type: "Hub",
        prereqIds: [PR.HUB_CETUS]
    },
    {
        id: SRC.HUB_FORTUNA,
        label: "Fortuna / Orb Vallis",
        type: "Hub",
        prereqIds: [PR.HUB_FORTUNA]
    },
    {
        id: SRC.HUB_NECRALISK,
        label: "Necralisk / Deimos",
        type: "Hub",
        prereqIds: [PR.HUB_NECRALISK]
    },
    {
        id: SRC.HUB_ZARIMAN,
        label: "Zariman",
        type: "Hub",
        prereqIds: [PR.HUB_ZARIMAN]
    },
    {
        id: SRC.HUB_SANCTUM,
        label: "Sanctum Anatomica",
        type: "Hub",
        prereqIds: [PR.HUB_SANCTUM]
    },

    {
        id: SRC.VENDOR_QUILLS,
        label: "The Quills (Cetus)",
        type: "Vendor",
        prereqIds: [PR.HUB_CETUS]
    },
    {
        id: SRC.VENDOR_SOLARIS_UNITED,
        label: "Solaris United (Fortuna)",
        type: "Vendor",
        prereqIds: [PR.HUB_FORTUNA]
    },
    {
        id: SRC.VENDOR_ENTRATI,
        label: "Entrati (Necralisk)",
        type: "Vendor",
        prereqIds: [PR.HUB_NECRALISK]
    },
    {
        id: SRC.VENDOR_NECRALOID,
        label: "Necraloid (Necralisk)",
        type: "Vendor",
        prereqIds: [PR.HUB_NECRALISK]
    },
    {
        id: SRC.VENDOR_HOLDFASTS,
        label: "Holdfasts (Zariman)",
        type: "Vendor",
        prereqIds: [PR.HUB_ZARIMAN]
    },
    {
        id: SRC.VENDOR_CAVIA,
        label: "Cavia (Sanctum Anatomica)",
        type: "Vendor",
        prereqIds: [PR.HUB_SANCTUM]
    }
];

export const SOURCE_INDEX: Record<SourceId, SourceDef> = Object.fromEntries(
    SOURCE_CATALOG.map((s) => [s.id, s])
) as Record<SourceId, SourceDef>;

