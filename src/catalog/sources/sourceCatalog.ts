// src/catalog/sources/sourceCatalog.ts

import type { PrereqId } from "../../domain/ids/prereqIds";
import { PR } from "../../domain/ids/prereqIds";
import type { SourceId } from "../../domain/ids/sourceIds";
import { SRC } from "../../domain/ids/sourceIds";

import { getAllSourceLabels, sourceIdFromLabel } from "./sourceData";

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

const CURATED_SOURCE_CATALOG: SourceDef[] = [
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

function buildDataSourceCatalog(): SourceDef[] {
    // Each distinct sources.json "source" label becomes a known SourceDef.
    // We do not guess prereqs for these yet.
    const labels = getAllSourceLabels();

    return labels.map((label) => ({
        id: sourceIdFromLabel(label) as SourceId,
        label,
        type: "Mission",
        prereqIds: []
    }));
}

export const SOURCE_CATALOG: SourceDef[] = (() => {
    // Curated first, then data-derived.
    // If there is any collision, curated should win.
    const curated = CURATED_SOURCE_CATALOG;
    const derived = buildDataSourceCatalog();

    const seen = new Set<string>();
    const out: SourceDef[] = [];

    for (const s of curated) {
        const k = String(s.id);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(s);
    }

    for (const s of derived) {
        const k = String(s.id);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(s);
    }

    return out;
})();

export const SOURCE_INDEX: Record<SourceId, SourceDef> = Object.fromEntries(
    SOURCE_CATALOG.map((s) => [s.id, s])
) as Record<SourceId, SourceDef>;
