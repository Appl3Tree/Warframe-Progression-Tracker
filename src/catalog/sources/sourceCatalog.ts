// ===== FILE: src/catalog/sources/sourceCatalog.ts =====
// Full file replacement with SYSTEM_CRAFTING integrated into the curated catalog.

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
    | "System"
    | "Unknown";

export interface SourceDef {
    id: SourceId;
    label: string;
    type: SourceType;

    prereqIds: PrereqId[];

    mrRequired?: number;

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
    // Curated SYSTEM sources (first-class)
    // -----------------------------
    {
        id: SRC.SYSTEM_ARCHWING,
        label: "System: Archwing Unlocked",
        type: "System",
        prereqIds: [PR.ARCHWING]
    },
    {
        id: SRC.SYSTEM_RAILJACK,
        label: "System: Railjack Owned",
        type: "System",
        prereqIds: [PR.SYSTEM_RAILJACK]
    },
    {
        id: SRC.SYSTEM_NECRAMECH,
        label: "System: Necramech Owned",
        type: "System",
        prereqIds: [PR.SYSTEM_NECRAMECH]
    },
    {
        id: SRC.SYSTEM_HELMINTH,
        label: "System: Helminth Unlocked",
        type: "System",
        prereqIds: [PR.SYSTEM_HELMINTH]
    },
    {
        id: SRC.SYSTEM_VEILBREAKER,
        label: "System: Veilbreaker / Kahl Content",
        type: "System",
        prereqIds: [PR.VEILBREAKER]
    },
    {
        id: SRC.SYSTEM_DUVIRI,
        label: "System: Duviri Access",
        type: "System",
        prereqIds: [PR.DUVIRI_PARADOX]
    },
    {
        id: SRC.SYSTEM_ARCHON_HUNTS,
        label: "System: Archon Hunts",
        type: "System",
        prereqIds: [PR.SYSTEM_ARCHON_HUNTS]
    },
    {
        id: SRC.SYSTEM_CLAN_RESEARCH,
        label: "System: Dojo Research (Clan Tech)",
        type: "System",
        prereqIds: [],
        notes: "Dojo access/lab modeling will be handled as explicit prereqs later (PHASE 1.4)."
    },

    // NEW: Crafting (Foundry) source
    // NOTE: Using PR.VORS_PRIZE as the minimal “you have the ship/foundry available” gate.
    // If you later add a dedicated Foundry prereq id, swap it here.
    {
        id: SRC.SYSTEM_CRAFTING,
        label: "Crafting (Foundry)",
        type: "System",
        prereqIds: [PR.VORS_PRIZE],
        notes: "Represents crafting the output item in Foundry once all components are obtainable."
    },

    // -----------------------------
    // Curated non-data sources (hand-authored)
    // -----------------------------
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
    const labels = getAllSourceLabels();

    function uniqPrereqs(list: PrereqId[]): PrereqId[] {
        const out: PrereqId[] = [];
        const seen = new Set<string>();
        for (const p of list) {
            const k = String(p);
            if (!k || seen.has(k)) continue;
            seen.add(k);
            out.push(p);
        }
        return out;
    }

    function prereqsForLabel(label: string): { prereqIds: PrereqId[]; mrRequired?: number } {
        const s = String(label ?? "").trim();
        if (!s) return { prereqIds: [] };

        const prereqs: PrereqId[] = [];
        let mrRequired: number | undefined;

        const isRelic =
            /^(Lith|Meso|Neo|Axi)\s+[A-Za-z0-9]+\s+Relic(\s+\((Exceptional|Flawless|Radiant)\))?$/.test(
                s
            );
        if (isRelic) {
            prereqs.push(PR.SYSTEM_ORBITER_VOID_RELICS);
            return { prereqIds: uniqPrereqs(prereqs) };
        }

        if (/\b(Railjack|Empyrean|Skirmish|Orphix)\b/i.test(s)) {
            prereqs.push(PR.SYSTEM_RAILJACK);
        }

        if (/\b(Archwing|Jordas|Fomorian)\b/i.test(s)) {
            prereqs.push(PR.ARCHWING);
        }

        if (/\b(Kahl|Garrison)\b/i.test(s)) {
            prereqs.push(PR.SYSTEM_KAHL_GARRISON);
        }

        if (/\bArchon\b/i.test(s)) {
            prereqs.push(PR.SYSTEM_ARCHON_HUNTS);
        }

        if (/\bHelminth\b/i.test(s)) {
            prereqs.push(PR.SYSTEM_HELMINTH);
        }

        if (/\bNecramech\b/i.test(s)) {
            prereqs.push(PR.SYSTEM_NECRAMECH);
        }

        if (/\b(Duviri|Circuit|Undercroft|Drifter)\b/i.test(s)) {
            prereqs.push(PR.DUVIRI_PARADOX);
        }

        if (/\bConclave\b/i.test(s)) {
            prereqs.push(PR.JUNCTION_EARTH_MARS);
        }

        if (/\bArbitration\b/i.test(s)) {
            prereqs.push(PR.WAR_WITHIN);
            prereqs.push(PR.JUNCTION_SATURN_URANUS);
        }

        if (/\b(Cetus|Plains of Eidolon)\b/i.test(s) || /\b(Eidolon)\b/i.test(s)) {
            prereqs.push(PR.HUB_CETUS);
            if (/\bEidolon\b/i.test(s)) {
                prereqs.push(PR.SYSTEM_OPERATOR);
            }
        }

        if (/\b(Fortuna|Orb Vallis)\b/i.test(s)) {
            prereqs.push(PR.HUB_FORTUNA);
        }

        if (/\b(Necralisk|Deimos)\b/i.test(s)) {
            prereqs.push(PR.HUB_NECRALISK);
        }

        if (/\bZariman\b/i.test(s)) {
            prereqs.push(PR.HUB_ZARIMAN);
        }

        if (/\b(Sanctum|Anatomica|Cavia)\b/i.test(s)) {
            prereqs.push(PR.HUB_SANCTUM);
        }

        const planetPrefixMatch = /^([A-Za-z]+)\s*\//.exec(s);
        if (planetPrefixMatch) {
            const planet = planetPrefixMatch[1];

            const early = new Set(["Earth", "Mercury", "Venus"]);
            const mid = new Set(["Mars", "Phobos", "Deimos"]);

            if (early.has(planet)) {
                prereqs.push(PR.VORS_PRIZE);
            } else if (mid.has(planet)) {
                prereqs.push(PR.JUNCTION_EARTH_MARS);
            } else {
                prereqs.push(PR.JUNCTION_SATURN_URANUS);
            }
        }

        return { prereqIds: uniqPrereqs(prereqs), mrRequired };
    }

    function typeForLabel(label: string): SourceType {
        const s = String(label ?? "").trim();
        if (!s) return "Unknown";
        return "Mission";
    }

    return labels.map((label) => {
        const { prereqIds, mrRequired } = prereqsForLabel(label);
        return {
            id: sourceIdFromLabel(label) as SourceId,
            label,
            type: typeForLabel(label),
            prereqIds,
            ...(typeof mrRequired === "number" ? { mrRequired } : {})
        };
    });
}

export const SOURCE_CATALOG: SourceDef[] = (() => {
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

