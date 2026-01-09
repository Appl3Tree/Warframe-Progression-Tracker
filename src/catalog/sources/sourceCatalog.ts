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
    },

    // -----------------------------
    // Curated data-derived sources
    // -----------------------------
    // These IDs are produced by sourceIdFromLabel(label) from sources.json.
    // Curating them here provides real gating; curated entries win on collision.

    {
        id: "data:tusk_thumper",
        label: "Tusk Thumper",
        type: "Mission",
        prereqIds: [PR.HUB_CETUS],
        notes: "Open-world bounty/encounter on Plains of Eidolon."
    },
    {
        id: "data:tusk_thumper_bull",
        label: "Tusk Thumper Bull",
        type: "Mission",
        prereqIds: [PR.HUB_CETUS],
        notes: "Open-world bounty/encounter on Plains of Eidolon."
    },
    {
        id: "data:tusk_thumper_doma",
        label: "Tusk Thumper Doma",
        type: "Mission",
        prereqIds: [PR.HUB_CETUS],
        notes: "Open-world bounty/encounter on Plains of Eidolon."
    },
    {
        id: "data:exploiter_orb",
        label: "Exploiter Orb",
        type: "Mission",
        prereqIds: [PR.HUB_FORTUNA],
        notes: "Boss encounter associated with Orb Vallis / Fortuna."
    }
];

function buildDataSourceCatalog(): SourceDef[] {
    // Each distinct sources.json "source" label becomes a known SourceDef.
    // We do not guess prereqs broadly, except for a few safe system-gates where
    // the game itself hard-requires the feature (e.g., Void Relics require the Relic segment).

    const labels = getAllSourceLabels();

    function prereqsForLabel(label: string): PrereqId[] {
        const s = String(label ?? "").trim();
    
        // Be tolerant: sources.json labels vary a lot (parentheses, extra suffixes, spacing, etc.)
        // We only need to detect “this is a relic label” reliably.
        const isRelic =
            /^(Lith|Meso|Neo|Axi)\b/i.test(s) &&
            /\bRelic\b/i.test(s);
    
        if (isRelic) {
            return [PR.SYSTEM_ORBITER_VOID_RELICS];
        }
    
        return [];
    }

    function typeForLabel(label: string): SourceType {
        const s = String(label ?? "").trim();
        if (/Relic/.test(s)) return "Mission";
        return "Mission";
    }

    return labels.map((label) => ({
        id: sourceIdFromLabel(label) as SourceId,
        label,
        type: typeForLabel(label),
        prereqIds: prereqsForLabel(label)
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
