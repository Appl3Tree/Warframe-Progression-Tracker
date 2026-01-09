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
    // Curated non-data sources (hand-authored)
    // -----------------------------
    // These IDs are NOT data-derived ("data:*"), so they may be accessible with prereqIds=[]
    // unless you explicitly gate them. Keep gating conservative but real.

    {
        id: "enemy:manics",
        label: "Manics",
        type: "Mission",
        prereqIds: [],
        notes: "Enemy drop source (used for Warframe component acquisition)."
    },
    {
        id: "boss:jordas_golem",
        label: "Jordas Golem (Assassination)",
        type: "Mission",
        prereqIds: [PR.ARCHWING],
        notes: "Archwing boss encounter. Gated by Archwing availability."
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

        // Void Relic labels commonly look like:
        // "Lith A1 Relic", "Axi B3 Relic (Radiant)", etc.
        // If you don’t have the Void Relic segment, “farm this relic” is not actionable.
        const isRelic =
            /^(Lith|Meso|Neo|Axi)\s+[A-Za-z0-9]+\s+Relic(\s+\((Exceptional|Flawless|Radiant)\))?$/.test(s);

        if (isRelic) {
            // You already modeled this as a gate in prereqRegistry.ts.
            // If you want to be stricter, also require PR.JUNCTION_EARTH_MARS.
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
