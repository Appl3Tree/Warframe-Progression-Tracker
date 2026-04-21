// src/catalog/sources/sourceCatalog.ts

import { normalizeSourceId, type SourceId } from "../../domain/ids/sourceIds";
import { PR } from "../../domain/ids/prereqIds";
import wfcdSourceLabels from "../../data/_generated/wfcd-source-label-map.auto.json";
import { canonicalizeWfItemsLocation } from "./wfItemsLocCanonical";
import { CURATED_SOURCES } from "./curatedSources";

// warframe-drop-data/raw inputs
import missionRewardsJson from "../../../external/warframe-drop-data/raw/missionRewards.json";
import relicsJson from "../../data/_generated/relics-lean.auto.json";
import blueprintLocationsJson from "../../../external/warframe-drop-data/raw/blueprintLocations.json";
import enemyBlueprintTablesJson from "../../../external/warframe-drop-data/raw/enemyBlueprintTables.json";
import modLocationsJson from "../../../external/warframe-drop-data/raw/modLocations.json";
import enemyModTablesJson from "../../../external/warframe-drop-data/raw/enemyModTables.json";
import transientRewardsJson from "../../../external/warframe-drop-data/raw/transientRewards.json";
import sortieRewardsJson from "../../../external/warframe-drop-data/raw/sortieRewards.json";
import cetusBountyRewardsJson from "../../../external/warframe-drop-data/raw/cetusBountyRewards.json";
import solarisBountyRewardsJson from "../../../external/warframe-drop-data/raw/solarisBountyRewards.json";
import deimosRewardsJson from "../../../external/warframe-drop-data/raw/deimosRewards.json";
import entratiLabRewardsJson from "../../../external/warframe-drop-data/raw/entratiLabRewards.json";
import hexRewardsJson from "../../../external/warframe-drop-data/raw/hexRewards.json";
import zarimanRewardsJson from "../../../external/warframe-drop-data/raw/zarimanRewards.json";
import syndicatesJson from "../../../external/warframe-drop-data/raw/syndicates.json";
import miscItemsJson from "../../../external/warframe-drop-data/raw/miscItems.json";
import keyRewardsJson from "../../../external/warframe-drop-data/raw/keyRewards.json";
import resourceByAvatarJson from "../../../external/warframe-drop-data/raw/resourceByAvatar.json";
import additionalItemByAvatarJson from "../../../external/warframe-drop-data/raw/additionalItemByAvatar.json";

// warframe-items/raw (for wfitems:loc sources)
import WARFRAME_ITEMS_ALL from "../../data/_generated/warframe-items-all-lean.auto.json";

export type Source = {
    id: SourceId;
    label: string;
    type: "drop" | "crafting" | "vendor" | "other";
    prereqIds?: string[];
};

export type RawSource = {
    id: string;
    label: string;
    type?: Source["type"];
    prereqIds?: string[];
};

const CURATED_SOURCE_BY_ID = new Map(
    CURATED_SOURCES.map((source) => [normalizeSourceId(source.id), source] as const)
);

const SYNDICATE_VENDOR_ALIASES: Array<{ prefix: string; canonicalName: string }> = [
    { prefix: "Cephalon Simaris", canonicalName: "Cephalon Simaris" },
    { prefix: "Kahl's Garrison", canonicalName: "Kahl's Garrison" },
    { prefix: "The Perrin Sequence", canonicalName: "The Perrin Sequence" },
    { prefix: "Perrin Sequence", canonicalName: "The Perrin Sequence" },
    { prefix: "Steel Meridian", canonicalName: "Steel Meridian" },
    { prefix: "Arbiters of Hexis", canonicalName: "Arbiters of Hexis" },
    { prefix: "Arbiter Of Hexis", canonicalName: "Arbiters of Hexis" },
    { prefix: "Arbiters", canonicalName: "Arbiters of Hexis" },
    { prefix: "Cephalon Suda", canonicalName: "Cephalon Suda" },
    { prefix: "New Loka", canonicalName: "New Loka" },
    { prefix: "Red Veil", canonicalName: "Red Veil" },
    { prefix: "Solaris United", canonicalName: "Solaris United" },
    { prefix: "The Holdfasts", canonicalName: "The Holdfasts" },
    { prefix: "The Quills", canonicalName: "The Quills" },
    { prefix: "Vox Solaris", canonicalName: "Vox Solaris" },
    { prefix: "NecraLoid", canonicalName: "NecraLoid" },
    { prefix: "Conclave", canonicalName: "Conclave" },
    { prefix: "Ventkids", canonicalName: "Ventkids" },
    { prefix: "Ostron", canonicalName: "Ostron" },
    { prefix: "Entrati", canonicalName: "Entrati" },
    { prefix: "Operational Supply", canonicalName: "Operational Supply" },
] as const;

function getSyndicateVendorOverride(syndicateName: string): Pick<RawSource, "label" | "prereqIds"> | null {
    const curatedEquivalentIdByName: Record<string, string> = {
        "Cephalon Simaris": "data:vendor/simaris",
        Entrati: "data:vendor/deimos/entrati",
        "Kahl's Garrison": "data:vendor/kahl-garrison/chipper",
        Ostron: "data:vendor/cetus/ostron",
        "Solaris United": "data:vendor/fortuna/solaris-united",
        "The Holdfasts": "data:vendor/zariman/holdfasts",
        "The Quills": "data:vendor/cetus/quills",
        Ventkids: "data:vendor/fortuna/ventkids",
        "Vox Solaris": "data:vendor/fortuna/vox-solaris",
        NecraLoid: "data:vendor/deimos/necraloid",
        "Operational Supply": "data:events/plague-star",
    };

    const curatedId = curatedEquivalentIdByName[syndicateName];
    if (curatedId) {
        const curated = CURATED_SOURCE_BY_ID.get(normalizeSourceId(curatedId));
        if (curated) {
            return {
                label: curated.label,
                prereqIds: curated.prereqIds,
            };
        }
    }

    const relaySyndicates = new Set([
        "Arbiters of Hexis",
        "Cephalon Suda",
        "Conclave",
        "New Loka",
        "Red Veil",
        "Steel Meridian",
        "The Perrin Sequence",
    ]);

    if (relaySyndicates.has(syndicateName)) {
        return {
            label: `Syndicate Vendor: ${syndicateName}`,
            prereqIds: ["hub_relay"],
        };
    }

    return null;
}

function inferExtraPrereqsFromSourceLabel(label: string, vendorName?: string): string[] {
    const raw = safeString(label);
    if (!raw) return [];

    const out = new Set<string>();
    const normalizedVendor = safeString(vendorName)?.toLowerCase();

    if (normalizedVendor === "cephalon simaris") {
        const labelToPrereqId: Array<[RegExp, string]> = [
            [/Complete The Archwing/i, PR.ARCHWING],
            [/Complete The Sacrifice/i, PR.SACRIFICE],
            [/Complete Sands of Inaros/i, PR.SANDS_INAROS],
            [/Complete The Silver Grove/i, PR.SILVER_GROVE],
            [/Complete The Waverider/i, PR.WAVERIDER],
            [/Complete The Limbo Theorem/i, PR.LIMBO_THEOREM],
            [/Complete Hidden Messages/i, PR.HIDDEN_MESSAGES],
            [/Complete The New War/i, PR.NEW_WAR],
            [/Complete The War Within/i, PR.WAR_WITHIN],
            [/Complete The Second Dream/i, PR.SECOND_DREAM],
            [/Complete Chains of Harrow/i, PR.CHAINS_HARROW],
            [/Complete Octavia's Anthem/i, PR.OCTAVIA_ANTHEM],
            [/Complete The Glast Gambit/i, PR.GLAST_GAMBIT],
            [/Complete The Jordas Precept/i, PR.JORDAS_PRECEPT],
            [/Complete Mask of the Revenant/i, PR.MASK_REVENANT],
            [/Complete The Deadlock Protocol/i, PR.DEADLOCK_PROTOCOL],
            [/Complete Call of the Tempestarii/i, PR.CALL_TEMPESTARII],
            [/Complete Heart of Deimos/i, PR.HEART_OF_DEIMOS],
            [/Complete The Duviri Paradox/i, PR.DUVIRI_PARADOX],
            [/Complete The New Strange/i, PR.NEW_STRANGE],
            [/Complete Saya's Vigil/i, PR.SAYA_VIGIL],
            [/Complete Chimera Prologue/i, PR.CHIMERA_PROLOGUE],
            [/Complete Erra/i, PR.ERRA],
            [/Complete Natah/i, PR.NATAH],
            [/Complete Vox Solaris/i, PR.VOX_SOLARIS],
            [/Unlock through The Deadlock Protocol/i, PR.DEADLOCK_PROTOCOL],
            [/Unlock through Stolen Dreams/i, PR.STOLEN_DREAMS],
            [/Unlock through Tenshin's Cave/i, PR.DUVIRI_PARADOX],
            [/Unlock through Daily Tribute/i, PR.SYSTEM_DAILY_TRIBUTE],
            [/Defeat the Glassmaker/i, PR.ACTIVITY_GLASSMAKER],
            [/Complete Neptune Junction/i, PR.JUNCTION_URANUS_NEPTUNE],
            [/Complete Pluto Junction/i, PR.JUNCTION_NEPTUNE_PLUTO],
            [/Complete Uranus Junction/i, PR.JUNCTION_SATURN_URANUS],
        ];

        for (const [pattern, prereqId] of labelToPrereqId) {
            if (pattern.test(raw)) out.add(prereqId);
        }
    }

    return [...out];
}

function inferSourceMetadataFromLabel(label: string): Pick<RawSource, "label" | "prereqIds" | "type"> | null {
    const raw = safeString(label);
    if (!raw) return null;
    const quantityNormalized = raw.replace(
        /^WFItems Location(?: \(Legacy\))?:\s*\d+[xX]\s+/i,
        "WFItems Location: "
    );

    if (/Shadow Stalker/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.SECOND_DREAM],
            type: "drop",
        };
    }

    if (/Protector Stalker/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.JADE_SHADOWS],
            type: "drop",
        };
    }

    if (/Aerodynamic/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.ACTIVITY_ARBITRATIONS],
            type: "vendor",
        };
    }

    if (/Aero Agility/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.JUNCTION_CERES_JUPITER],
            type: "drop",
        };
    }

    if (/Aero Periphery|Aero Vantage/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.JUNCTION_CERES_JUPITER],
            type: "drop",
        };
    }

    if (/Aerial Commander/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.HUB_CETUS],
            type: "drop",
        };
    }

    if (/Play Conclave|\(Conclave\)/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.HUB_RELAY],
            type: "drop",
        };
    }

    if (/Primary Bulwark/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.THE_OLD_PEACE],
            type: "drop",
        };
    }

    if (/Animal Instinct/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.ACTIVITY_NIGHTMARE],
            type: "drop",
        };
    }

    if (/Nightmare Mode Rewards|Nightmare Mode Rescue/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.ACTIVITY_NIGHTMARE],
            type: "drop",
        };
    }

    if (/Nightmare Tatters/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.CHAINS_HARROW],
            type: "drop",
        };
    }

    if (/(^| )Thrax Plasm/i.test(quantityNormalized) && !/Lua Thrax Plasm/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.ANGELS_ZARIMAN],
            type: "drop",
        };
    }

    if (/(Aerial|Momentous|Reinforced|Tenacious) Bond/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.HUB_FORTUNA],
            type: "vendor",
        };
    }

    if (/(Contagious|Duplex|Seismic|Vicious) Bond/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.HUB_NECRALISK],
            type: "vendor",
        };
    }

    if (/(Covert|Manifold|Mystic|Restorative|Tandem) Bond/i.test(quantityNormalized)) {
        return {
            label: raw,
            prereqIds: [PR.HUB_CETUS],
            type: "vendor",
        };
    }

    const wfItemsBody = quantityNormalized.replace(/^WFItems Location(?: \(Legacy\))?:\s*/i, "");
    const syndicateVendorAlias = SYNDICATE_VENDOR_ALIASES.find(({ prefix }) => wfItemsBody.startsWith(prefix));
    if (syndicateVendorAlias) {
        const override = getSyndicateVendorOverride(syndicateVendorAlias.canonicalName);
        if (override) {
            return {
                label: raw,
                prereqIds: override.prereqIds,
                type: "vendor",
            };
        }
    }

    const syndicateVendor = raw.match(/^Syndicate Vendor:\s*([^()]+?)(?:\s*\(|\s*$)/i);
    if (syndicateVendor) {
        const vendorName = syndicateVendor[1]?.trim();
        if (!vendorName) return null;

        const override = getSyndicateVendorOverride(vendorName);
        const extraPrereqs = inferExtraPrereqsFromSourceLabel(raw, vendorName);
        return {
            label: raw,
            prereqIds: Array.from(new Set([...(override?.prereqIds ?? []), ...extraPrereqs])),
            type: "vendor",
        };
    }

    if (/^WFItems Location(?: \(Legacy\))?:/i.test(quantityNormalized)) {
        if (/Elite Sanctuary Onslaught|Sanctuary Onslaught/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: ["hub_relay", PR.NEW_STRANGE],
                type: "drop",
            };
        }

        if (/Void Storm/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.RAILJACK_CONSTRUCTED, PR.CALL_TEMPESTARII],
                type: "drop",
            };
        }

        if (/Profit-Taker/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_PROFIT_TAKER],
                type: "drop",
            };
        }

        if (/Eidolon Teralyst/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_EIDOLON_TERALYST],
                type: "drop",
            };
        }

        if (/Eidolon Gantulyst|Eidolon Hydrolyst/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_EIDOLON_TRIDOLON],
                type: "drop",
            };
        }

        if (/Derelict Vault/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.CLAN_DOJO, PR.JUNCTION_MARS_DEIMOS],
                type: "drop",
            };
        }

        if (/Duviri Circuit/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.DUVIRI_PARADOX],
                type: "drop",
            };
        }

        if (/Duviri Full Experience|Duviri Experience|Duviri Lone Story|Kullervo's Hold/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.DUVIRI_PARADOX],
                type: "drop",
            };
        }

        if (/H[öo]llvania .*WF1999 Bounty|Hallowed Flame/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_HOLLVANIA],
                type: "drop",
            };
        }

        if (/Zariman Ten Zero .* Zariman Bounty/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_ZARIMAN_BOUNTIES],
                type: "drop",
            };
        }

        if (/Entrati Netracell Coffer/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_NETRACELLS],
                type: "drop",
            };
        }

        if (/Abyssal Beacon/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_ABYSSAL_ZONE],
                type: "drop",
            };
        }

        if (/Arbitration Shield Drone|Arbitrations|Vitus Essence/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_ARBITRATIONS],
                type: "drop",
            };
        }

        if (/Sorties/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_SORTIES],
                type: "drop",
            };
        }

        if (/Exploiter Orb|Atmo Systems|Gyromag Systems|Repeller Systems/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_EXPLOITER_ORB],
                type: "drop",
            };
        }

        if (/Duviri Murmur Invasion Rewards/i.test(quantityNormalized)) {
            const prereqIds: string[] = [PR.DUVIRI_PARADOX];
            if (/Steel Path|Hard/i.test(quantityNormalized)) prereqIds.push(PR.ACTIVITY_STEEL_PATH);
            return {
                label: raw,
                prereqIds,
                type: "drop",
            };
        }

        if (/Duviri\/Endless/i.test(quantityNormalized)) {
            const prereqIds = [/Hard/i.test(quantityNormalized) ? PR.ACTIVITY_CIRCUIT_STEEL_PATH : PR.ACTIVITY_CIRCUIT];
            return {
                label: raw,
                prereqIds,
                type: "drop",
            };
        }

        if (/Tusk Thumper/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_CETUS],
                type: "drop",
            };
        }

        if (/Narmer Thumper/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.NEW_WAR, PR.HUB_CETUS],
                type: "drop",
            };
        }

        if (/The Sergeant/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.JUNCTION_MARS_PHOBOS],
                type: "drop",
            };
        }

        if (/Wolf Of Saturn Six/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_NIGHTWAVE],
                type: "drop",
            };
        }

        if (/Zealoid Prelate/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HEART_OF_DEIMOS],
                type: "drop",
            };
        }

        if (/Arcane |Breath Of The Eidolon|Orokin Animus Matrix|Orokin Ballistics Matrix|Orokin Orientation Matrix/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_EIDOLON_TERALYST],
                type: "drop",
            };
        }

        if (/Calda Toroid|Sola Toroid|Vega Toroid/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_FORTUNA],
                type: "drop",
            };
        }

        if (/Corrupted Holokey/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_VOID_STORMS],
                type: "drop",
            };
        }

        if (/Void Traces/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_VOID_FISSURES],
                type: "drop",
            };
        }

        if (/Condroc|Kuaka|Mergoo|Grokdrul|Iradite|Cetus Wisp|Maprico|Nistlepod|Fish Scales|Goopolla Spleen|Khut-Khut Venom Sac|Mawfish Bones|Archimedean Itzam/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_CETUS],
                type: "drop",
            };
        }

        if (/Charc Electroplax|Thermal Sludge|Hexenon|Asterite|Atmo Systems|Gyromag Systems|Repeller Systems/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_FORTUNA],
                type: "drop",
            };
        }

        if (/Coprite Alloy|Pyrotic Alloy|Esher Devar|Fersteel Alloy|Marquise Veridos|Tear Azurite/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_CETUS],
                type: "drop",
            };
        }

        if (/Agnovidisc|Atramentum|Ganglion|Gorgaricus Spore|Lucent Teroglobe|Mytocardia Spore|Necracoil|Pustulite|Scintillant|Fass Residue|Vome Residue|Yogwun Stomach/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_NECRALISK],
                type: "drop",
            };
        }

        if (/H[öo]llvanian Pitchweave Fragment|Techrot Chitin|Techrot Motherboard|Temporal Dust|Saggen Pearl|Aggristone|Servoris|Efervon Sample|Ignia/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_HOLLVANIA],
                type: "drop",
            };
        }

        if (/Connla Sprout|Dracroot|Eevani|Kovnik|Ueymag|Yao Shrub|Laudavi|Fergolyte|Kullervo's Bane/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.DUVIRI_PARADOX],
                type: "drop",
            };
        }

        if (/Mortus Horn|Tralok Eyes/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_CETUS],
                type: "drop",
            };
        }

        if (/Steel Essence/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_STEEL_PATH],
                type: "drop",
            };
        }

        if (/Narmer Isoplast/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.NEW_WAR],
                type: "drop",
            };
        }

        if (/Experimental Arc-Relay|Scuttler Husk|002-Er|Enigma Gyrum/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_HOLLVANIA],
                type: "drop",
            };
        }

        if (/Maphica/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.THE_OLD_PEACE],
                type: "drop",
            };
        }

        if (/Stela/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_HOLLVANIA],
                type: "drop",
            };
        }

        if (/Vainthorn/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_ABYSSAL_ZONE],
                type: "drop",
            };
        }

        if (/Lua Thrax Plasm|Voidgel Orb/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ANGELS_ZARIMAN],
                type: "drop",
            };
        }

        if (/Advances Debt-Bond|Familial Debt-Bond|Medical Debt-Bond|Shelter Debt-Bond|Training Debt-Bond/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_FORTUNA],
                type: "drop",
            };
        }

        if (/Conclave Skin/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.HUB_RELAY],
                type: "vendor",
            };
        }

        if (/Adaptation/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.ACTIVITY_ARBITRATIONS],
                type: "drop",
            };
        }

        if (/Alad V/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.JUNCTION_CERES_JUPITER],
                type: "drop",
            };
        }

        if (/Ambulas/i.test(quantityNormalized)) {
            return {
                label: raw,
                prereqIds: [PR.JUNCTION_NEPTUNE_PLUTO],
                type: "drop",
            };
        }

        if (/The Descendia|Dark Refractory/i.test(raw)) {
            const prereqIds: string[] = [PR.THE_OLD_PEACE];
            if (/Steel Path/i.test(raw)) prereqIds.push(PR.ACTIVITY_STEEL_PATH);
            return {
                label: raw,
                prereqIds,
                type: "drop",
            };
        }

        if (/Another Betrayer|Family Reunion|Hot Mess|Recover the Orokin Archive|Sunkiller|Table for Two|The Aftermath|Times Up|Faceoff/i.test(raw)) {
            const prereqIds: string[] = [PR.THE_HEX];
            if (/Steel Path/i.test(raw)) prereqIds.push(PR.ACTIVITY_STEEL_PATH);
            return {
                label: raw,
                prereqIds,
                type: "drop",
            };
        }
    }

    const wfItemsSimaris = raw.match(/^WFItems Location(?: \(Legacy\))?:\s*Cephalon Simaris\s*,?\s*(.*)$/i);
    if (wfItemsSimaris) {
        const extraPrereqs = inferExtraPrereqsFromSourceLabel(raw, "Cephalon Simaris");
        return {
            label: raw,
            prereqIds: Array.from(new Set(["hub_relay", PR.NEW_STRANGE, ...extraPrereqs])),
            type: "vendor",
        };
    }

    return null;
}

function safeString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function normalizeName(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function foldDiacritics(s: string): string {
    // NFKD splits letters+diacritics, then we remove the diacritic marks
    return (s ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeNameNoPunct(s: string): string {
    const folded = foldDiacritics(s);
    return normalizeName(folded).replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function toToken(s: string): string {
    return normalizeNameNoPunct(s).replace(/\s+/g, "-");
}

/**
 * Build a valid data: SourceId payload segment.
 * Use "/" to keep it stable and consistent across layers.
 */
function dataId(parts: string[]): string {
    const cleaned = parts
        .map((p) => safeString(p) ?? "")
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "data:unknown";
    return `data:${cleaned.join("/")}`;
}

/**
 * Build a valid src: SourceId payload segment (no extra colons).
 * MUST match src/catalog/sources/sourceCatalog.ts behavior used elsewhere.
 *
 * This intentionally uses the same tokenization as acquisitionFromDropData.ts:
 * normalizeNameNoPunct -> hyphenated token segments.
 */
function srcId(parts: string[]): string {
    const cleaned = parts
        .map((p) => safeString(p) ?? "")
        .filter((p) => p.length > 0)
        .map((p) => toToken(p))
        .filter((p) => p.length > 0);

    if (cleaned.length === 0) return "src:unknown";
    return `src:${cleaned.join("/")}`;
}

function pushUnique(out: RawSource[], seen: Set<string>, id: string, label: string, type: RawSource["type"]): void {
    const sid = safeString(id);
    const lab = safeString(label);
    if (!sid || !lab) return;
    if (seen.has(sid)) return;
    seen.add(sid);
    out.push({ id: sid, label: lab, type });
}

/**
 * WFCD-derived drop sources (already labeled).
 * Preserve WFCD IDs verbatim (commonly data:drop:<hash>).
 */
function buildWfcdDropSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    for (const [sid, label] of Object.entries(wfcdSourceLabels as Record<string, string>)) {
        const inferred = inferSourceMetadataFromLabel(label);
        pushUnique(out, seen, sid, inferred?.label ?? label, inferred?.type ?? "drop");
        if (inferred?.prereqIds?.length) {
            out[out.length - 1] = {
                ...out[out.length - 1],
                prereqIds: inferred.prereqIds,
            };
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Mission node sources derived from missionRewards.json.
 * MUST match acquisitionFromDropData.ts:
 *   dataId(["node", planetName, nodeName])
 */
function buildMissionNodeSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    const mrRoot = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);
    if (!mrRoot || typeof mrRoot !== "object") return out;

    for (const [planetName, planetObj] of Object.entries(mrRoot as Record<string, any>)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        for (const [nodeName, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
            if (!nodeObj || typeof nodeObj !== "object") continue;

            const id = dataId(["node", planetName, nodeName]);
            const gameMode = safeString((nodeObj as any)?.gameMode);
            // (Extra) = Steel Path variant — replace in the display label only; ID stays stable.
            const nodeNameDisplay = String(nodeName).replace(/\s*\(Extra\)\s*$/i, " (Steel Path)");
            const label = gameMode ? `${planetName} - ${nodeNameDisplay} (${gameMode})` : `${planetName} - ${nodeNameDisplay}`;
            const inferred = inferSourceMetadataFromLabel(label);
            pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
            if (inferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inferred.prereqIds,
                };
            }
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Mission reward sources (typed) derived from missionRewards.json.
 *
 * Emits (canonical):
 *   data:missionreward/<planet>/<node>
 *   data:missionreward/<planet>/<node>/rotationa|rotationb|rotationc
 *
 * NOTE:
 * - Node names in missionRewards.json sometimes include suffixes like "(Caches)" or "(Extra)".
 * - acquisitionFromWarframeItems/acquisitionFromDropData canonicalize those to the base node name.
 * - Therefore we MUST strip those suffixes before tokenization here.
 */
function buildMissionRewardSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    const mrRoot = (missionRewardsJson as any)?.missionRewards ?? (missionRewardsJson as any);
    if (!mrRoot || typeof mrRoot !== "object" || Array.isArray(mrRoot)) return out;

    // Only strip (Caches) — (Extra) is the Steel Path variant and gets its own source ID + label.
    const stripNodeSuffix = (s: string): string => s.replace(/\s*\(Caches\)\s*$/i, "");

    for (const [planetName, planetObj] of Object.entries(mrRoot as Record<string, any>)) {
        if (!planetObj || typeof planetObj !== "object") continue;

        for (const [nodeNameRaw, nodeObj] of Object.entries(planetObj as Record<string, any>)) {
            if (!nodeObj || typeof nodeObj !== "object") continue;

            const nodeNameBase = stripNodeSuffix(String(nodeNameRaw));

            // (Extra) suffix = Steel Path variant. Use it as-is for the ID (tokenizer strips parens),
            // but replace "(Extra)" with "(Steel Path)" in the human-readable label.
            const isSteelPath = /\s*\(Extra\)\s*$/i.test(nodeNameBase);
            const nodeNameDisplay = isSteelPath
                ? nodeNameBase.replace(/\s*\(Extra\)\s*$/i, " (Steel Path)")
                : nodeNameBase;

            // Canonical ids (match what your jq script expects: data:missionreward/<planet>/<baseNode>)
            const baseId = dataId(["missionreward", String(planetName), nodeNameBase]);
            const baseLabel = `Mission Reward: ${planetName} / ${nodeNameDisplay}`;
            const baseInferred = inferSourceMetadataFromLabel(baseLabel);
            pushUnique(out, seen, baseId, baseInferred?.label ?? baseLabel, baseInferred?.type ?? "drop");
            if (baseInferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: baseInferred.prereqIds,
                };
            }

            const rewards = (nodeObj as any)?.rewards;
            if (!rewards || typeof rewards !== "object" || Array.isArray(rewards)) continue;

            const hasA = Object.prototype.hasOwnProperty.call(rewards, "A");
            const hasB = Object.prototype.hasOwnProperty.call(rewards, "B");
            const hasC = Object.prototype.hasOwnProperty.call(rewards, "C");

            if (hasA) {
                const label = `${baseLabel} (Rotation A)`;
                const inferred = inferSourceMetadataFromLabel(label);
                pushUnique(out, seen, dataId(["missionreward", planetName, nodeNameBase, "rotationa"]), inferred?.label ?? label, inferred?.type ?? "drop");
                if (inferred?.prereqIds?.length) {
                    out[out.length - 1] = {
                        ...out[out.length - 1],
                        prereqIds: inferred.prereqIds,
                    };
                }
            }
            if (hasB) {
                const label = `${baseLabel} (Rotation B)`;
                const inferred = inferSourceMetadataFromLabel(label);
                pushUnique(out, seen, dataId(["missionreward", planetName, nodeNameBase, "rotationb"]), inferred?.label ?? label, inferred?.type ?? "drop");
                if (inferred?.prereqIds?.length) {
                    out[out.length - 1] = {
                        ...out[out.length - 1],
                        prereqIds: inferred.prereqIds,
                    };
                }
            }
            if (hasC) {
                const label = `${baseLabel} (Rotation C)`;
                const inferred = inferSourceMetadataFromLabel(label);
                pushUnique(out, seen, dataId(["missionreward", planetName, nodeNameBase, "rotationc"]), inferred?.label ?? label, inferred?.type ?? "drop");
                if (inferred?.prereqIds?.length) {
                    out[out.length - 1] = {
                        ...out[out.length - 1],
                        prereqIds: inferred.prereqIds,
                    };
                }
            }

            // Optional: legacy aliases (only if older code ever emitted these)
            // - nodeNameRaw includes "(Caches)" -> tokenizes to "<node>-caches"
            // - some layers might have emitted mission-reward or rotation-a style
            //
            // If you want zero-risk compatibility, keep these aliases.
            const legacyBaseId1 = dataId(["mission-reward", String(planetName), String(nodeNameRaw)]);
            if (legacyBaseId1 !== baseId) {
                pushUnique(out, seen, legacyBaseId1, baseInferred?.label ?? baseLabel, baseInferred?.type ?? "drop");
                if (baseInferred?.prereqIds?.length) {
                    out[out.length - 1] = {
                        ...out[out.length - 1],
                        prereqIds: baseInferred.prereqIds,
                    };
                }
            }

            const legacyBaseId2 = dataId(["missionreward", String(planetName), String(nodeNameRaw)]);
            if (legacyBaseId2 !== baseId) {
                pushUnique(out, seen, legacyBaseId2, baseInferred?.label ?? baseLabel, baseInferred?.type ?? "drop");
                if (baseInferred?.prereqIds?.length) {
                    out[out.length - 1] = {
                        ...out[out.length - 1],
                        prereqIds: baseInferred.prereqIds,
                    };
                }
            }

            if (hasA) {
                const legacyRotA1 = dataId(["mission-reward", planetName, nodeNameRaw, "rotationa"]);
                if (legacyRotA1 !== dataId(["missionreward", planetName, nodeNameBase, "rotationa"])) {
                    const label = `${baseLabel} (Rotation A)`;
                    const inferred = inferSourceMetadataFromLabel(label);
                    pushUnique(out, seen, legacyRotA1, inferred?.label ?? label, inferred?.type ?? "drop");
                    if (inferred?.prereqIds?.length) {
                        out[out.length - 1] = {
                            ...out[out.length - 1],
                            prereqIds: inferred.prereqIds,
                        };
                    }
                }
            }
            if (hasB) {
                const legacyRotB1 = dataId(["mission-reward", planetName, nodeNameRaw, "rotationb"]);
                if (legacyRotB1 !== dataId(["missionreward", planetName, nodeNameBase, "rotationb"])) {
                    const label = `${baseLabel} (Rotation B)`;
                    const inferred = inferSourceMetadataFromLabel(label);
                    pushUnique(out, seen, legacyRotB1, inferred?.label ?? label, inferred?.type ?? "drop");
                    if (inferred?.prereqIds?.length) {
                        out[out.length - 1] = {
                            ...out[out.length - 1],
                            prereqIds: inferred.prereqIds,
                        };
                    }
                }
            }
            if (hasC) {
                const legacyRotC1 = dataId(["mission-reward", planetName, nodeNameRaw, "rotationc"]);
                if (legacyRotC1 !== dataId(["missionreward", planetName, nodeNameBase, "rotationc"])) {
                    const label = `${baseLabel} (Rotation C)`;
                    const inferred = inferSourceMetadataFromLabel(label);
                    pushUnique(out, seen, legacyRotC1, inferred?.label ?? label, inferred?.type ?? "drop");
                    if (inferred?.prereqIds?.length) {
                        out[out.length - 1] = {
                            ...out[out.length - 1],
                            prereqIds: inferred.prereqIds,
                        };
                    }
                }
            }
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Cache sources inferred from warframe-items/raw/All.json drop location strings.
 * Emits:
 *   data:caches/<planet>/<node>
 */
function buildWfItemsCacheSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    const locs = new Set<string>();

    const stack: unknown[] = [WARFRAME_ITEMS_ALL as unknown];
    while (stack.length > 0) {
        const cur = stack.pop();
        if (!cur) continue;

        if (Array.isArray(cur)) {
            for (const v of cur) stack.push(v);
            continue;
        }
        if (typeof cur !== "object") continue;

        const obj = cur as Record<string, unknown>;
        for (const v of Object.values(obj)) {
            if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
        }

        const drops = (obj as any).drops;
        if (!Array.isArray(drops)) continue;

        for (const d of drops) {
            const loc = safeString((d as any)?.location);
            if (!loc) continue;
            if (!/\(\s*Caches\s*\)/i.test(loc)) continue;
            locs.add(loc);
        }
    }

    for (const raw of Array.from(locs.values())) {
        const head = safeString(String(raw).split("(")[0] ?? "");
        if (!head) continue;

        const headNoComma = safeString(String(head).split(",")[0] ?? "");
        if (!headNoComma) continue;

        const parts = headNoComma
            .split("/")
            .map((x) => safeString(x))
            .filter(Boolean);

        if (parts.length < 2) continue;

        const planet = parts[0];
        const node = parts.slice(1).join("/");
        if (!planet || !node) continue;

        const id = dataId(["caches", planet, node]);
        const label = `Caches: ${planet} / ${node}`;
        pushUnique(out, seen, id, label, "drop");
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * warframe-items/raw All.json derived wfitems:loc sources.
 * These must exist because acquisitionFromWarframeItems.ts and acquisitionFromWfItemsDrops.ts emit:
 *   data:wfitems:loc:<toToken(location)>
 */
function buildWfItemsLocSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>(CURATED_SOURCES.map((src) => normalizeSourceId(src.id)));

    const locs = new Set<string>();

    const stack: unknown[] = [WARFRAME_ITEMS_ALL as unknown];
    while (stack.length > 0) {
        const cur = stack.pop();

        if (!cur) continue;

        if (Array.isArray(cur)) {
            for (const v of cur) stack.push(v);
            continue;
        }

        if (typeof cur !== "object") continue;

        const obj = cur as Record<string, unknown>;

        for (const v of Object.values(obj)) {
            if (v && (typeof v === "object" || Array.isArray(v))) stack.push(v);
        }

        const candidates: unknown[] = [];

        if (Array.isArray(obj.drops)) candidates.push(...(obj.drops as unknown[]));
        if (Array.isArray(obj.drop)) candidates.push(...(obj.drop as unknown[]));
        if (Array.isArray(obj.locations)) candidates.push(...(obj.locations as unknown[]));
        if (Array.isArray(obj.location)) candidates.push(...(obj.location as unknown[]));

        for (const c of candidates) {
            if (!c) continue;

            if (typeof c === "string") {
                const s = safeString(c);
                if (s) locs.add(s);
                continue;
            }

            if (typeof c === "object") {
                const co = c as Record<string, unknown>;
                const name = safeString(co.location) ?? safeString(co.name) ?? safeString(co.place) ?? safeString(co.source);
                if (name) locs.add(name);

                for (const v of Object.values(co)) {
                    if (typeof v === "string") {
                        const s = safeString(v);
                        if (s && s.length <= 120) locs.add(s);
                    }
                }
            }
        }
    }

    for (const loc of Array.from(locs.values())) {
        const { canonicalSourceId, canonicalLabel, legacySourceId } = canonicalizeWfItemsLocation(loc);
        const canonicalCurated = CURATED_SOURCE_BY_ID.get(normalizeSourceId(canonicalSourceId));
        const canonicalType = canonicalCurated?.type ?? "drop";

        const isRelicCanonical = canonicalSourceId.startsWith("data:relic/");
        const isRawSyndicateVendorCanonical = canonicalSourceId.startsWith("data:vendor/syndicate/");

        // For relics, canonical ids already come from relics.json (buildDropDataSupplementSources),
        // so we only keep the legacy wfitems alias to avoid duplicate SourceIds.
        if (!isRelicCanonical && !isRawSyndicateVendorCanonical) {
            const canonicalMeta = inferSourceMetadataFromLabel(canonicalLabel);
            pushUnique(
                out,
                seen,
                canonicalSourceId,
                canonicalMeta?.label ?? canonicalLabel,
                canonicalMeta?.type ?? canonicalType,
            );
            const canonicalPrereqs = canonicalMeta?.prereqIds ?? canonicalCurated?.prereqIds;
            if (canonicalPrereqs?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: canonicalPrereqs,
                };
            }
        }

        if (legacySourceId !== canonicalSourceId) {
            const legacyLabel = `WFItems Location (Legacy): ${loc}`;
            const legacyMeta = inferSourceMetadataFromLabel(legacyLabel);
            const canonicalMeta = inferSourceMetadataFromLabel(canonicalLabel);
            const inheritedPrereqs =
                legacyMeta?.prereqIds ??
                canonicalMeta?.prereqIds ??
                canonicalCurated?.prereqIds;
            const inheritedType =
                legacyMeta?.type ??
                canonicalMeta?.type ??
                canonicalType;
            pushUnique(out, seen, legacySourceId, legacyMeta?.label ?? legacyLabel, inheritedType);
            if (inheritedPrereqs?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inheritedPrereqs,
                };
            }
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Additional data:* sources used by drop-data acquisition layers.
 */
function buildDropDataSupplementSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    // ---- Relics ----
    if (Array.isArray(relicsJson)) {
        for (const r of relicsJson as Array<{ tier?: string; relicName?: string }>) {
            const tier = safeString((r as any)?.tier) ?? "relic";
            const relicName = safeString((r as any)?.relicName) ?? "unknown";
            const id = dataId(["relic", tier, relicName]);
            const label = `Relic: ${tier} ${relicName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Blueprint locations / enemy blueprint tables -> enemy-drop ----
    const blArr = (blueprintLocationsJson as any)?.blueprintLocations ?? (blueprintLocationsJson as any);
    if (Array.isArray(blArr)) {
        for (const row of blArr) {
            const enemies = Array.isArray((row as any)?.enemies) ? (row as any).enemies : [];
            for (const e of enemies) {
                const enemyName = safeString((e as any)?.enemyName);
                if (!enemyName) continue;
                const id = dataId(["enemy-drop", enemyName]);
                const label = `Enemy Drop: ${enemyName}`;
                const inferred = inferSourceMetadataFromLabel(label);
                pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
                if (inferred?.prereqIds?.length) {
                    out[out.length - 1] = {
                        ...out[out.length - 1],
                        prereqIds: inferred.prereqIds,
                    };
                }
            }
        }
    }

    const ebtArr = (enemyBlueprintTablesJson as any)?.enemyBlueprintTables ?? (enemyBlueprintTablesJson as any);
    if (Array.isArray(ebtArr)) {
        for (const row of ebtArr) {
            const enemyName = safeString((row as any)?.enemyName);
            if (!enemyName) continue;
            const id = dataId(["enemy-drop", enemyName]);
            const label = `Enemy Drop: ${enemyName}`;
            const inferred = inferSourceMetadataFromLabel(label);
            pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
            if (inferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inferred.prereqIds,
                };
            }
        }
    }

    // ---- Mod locations / enemy mod tables -> enemy-mod ----
    const mlArr = (modLocationsJson as any)?.modLocations ?? (modLocationsJson as any);
    if (Array.isArray(mlArr)) {
        for (const row of mlArr) {
            const enemies = Array.isArray((row as any)?.enemies) ? (row as any).enemies : [];
            for (const e of enemies) {
                const enemyName = safeString((e as any)?.enemyName);
                if (!enemyName) continue;
                const id = dataId(["enemy-mod", enemyName]);
                const label = `Enemy Mod Drop: ${enemyName}`;
                const inferred = inferSourceMetadataFromLabel(label);
                pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
                if (inferred?.prereqIds?.length) {
                    out[out.length - 1] = {
                        ...out[out.length - 1],
                        prereqIds: inferred.prereqIds,
                    };
                }
            }
        }
    }

    const emtArr =
        (enemyModTablesJson as any)?.enemyModTables ??
        (enemyModTablesJson as any)?.modLocations ??
        (enemyModTablesJson as any);

    if (Array.isArray(emtArr)) {
        for (const row of emtArr) {
            const enemyName = safeString((row as any)?.enemyName);
            if (!enemyName) continue;
            const id = dataId(["enemy-mod", enemyName]);
            const label = `Enemy Mod Drop: ${enemyName}`;
            const inferred = inferSourceMetadataFromLabel(label);
            pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
            if (inferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inferred.prereqIds,
                };
            }
        }
    }

    // ---- Transient rewards ----
    const trArr = (transientRewardsJson as any)?.transientRewards ?? (transientRewardsJson as any);
    if (Array.isArray(trArr)) {
        for (const row of trArr) {
            const objectiveName = safeString((row as any)?.objectiveName);
            if (!objectiveName) continue;
            const id = dataId(["transient", objectiveName]);
            const label = `Transient Reward: ${objectiveName}`;
            const inferred = inferSourceMetadataFromLabel(label);
            pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
            if (inferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inferred.prereqIds,
                };
            }
        }
    }

    // ---- Sortie ----
    const srArr = (sortieRewardsJson as any)?.sortieRewards ?? (sortieRewardsJson as any);
    if (Array.isArray(srArr) && srArr.length > 0) {
        pushUnique(out, seen, dataId(["sortie"]), "Sortie Rewards", "drop");
    }

    // ---- Key rewards ----
    const krArr = (keyRewardsJson as any)?.keyRewards ?? (keyRewardsJson as any);
    if (Array.isArray(krArr)) {
        for (const row of krArr) {
            const keyName = safeString((row as any)?.keyName);
            if (!keyName) continue;
            const id = dataId(["key", keyName]);
            const label = `Key Rewards: ${keyName}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Bounties (note: source ids use bountyLevel) ----
    const cbArr = (cetusBountyRewardsJson as any)?.cetusBountyRewards ?? (cetusBountyRewardsJson as any);
    if (Array.isArray(cbArr)) {
        for (const row of cbArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "cetus", bountyLevel]);
            const label = `Cetus Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const sbArr = (solarisBountyRewardsJson as any)?.solarisBountyRewards ?? (solarisBountyRewardsJson as any);
    if (Array.isArray(sbArr)) {
        for (const row of sbArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "solaris", bountyLevel]);
            const label = `Solaris Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const drArr = (deimosRewardsJson as any)?.deimosRewards ?? (deimosRewardsJson as any);
    if (Array.isArray(drArr)) {
        for (const row of drArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "deimos", bountyLevel]);
            const label = `Deimos Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const elArr = (entratiLabRewardsJson as any)?.entratiLabRewards ?? (entratiLabRewardsJson as any);
    if (Array.isArray(elArr)) {
        for (const row of elArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "entrati-lab", bountyLevel]);
            const label = `Entrati Lab Reward: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const hxArr = (hexRewardsJson as any)?.hexRewards ?? (hexRewardsJson as any);
    if (Array.isArray(hxArr)) {
        for (const row of hxArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "hex", bountyLevel]);
            const label = `Hex Reward: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    const zrArr = (zarimanRewardsJson as any)?.zarimanRewards ?? (zarimanRewardsJson as any);
    if (Array.isArray(zrArr)) {
        for (const row of zrArr) {
            const bountyLevel = safeString((row as any)?.bountyLevel);
            if (!bountyLevel) continue;
            const id = dataId(["bounty", "zariman", bountyLevel]);
            const label = `Zariman Bounty: ${bountyLevel}`;
            pushUnique(out, seen, id, label, "drop");
        }
    }

    // ---- Syndicate vendors ----
    const synRoot = (syndicatesJson as any)?.syndicates ?? (syndicatesJson as any);
    if (synRoot && typeof synRoot === "object" && !Array.isArray(synRoot)) {
        for (const synName of Object.keys(synRoot as Record<string, any>)) {
            const id = dataId(["vendor", "syndicate", synName]);
            const override = getSyndicateVendorOverride(synName);
            pushUnique(out, seen, id, override?.label ?? `Syndicate Vendor: ${synName}`, "vendor");
            if (override?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: override.prereqIds,
                };
            }
        }
    }

    // ---- Misc enemy item drops (data:*) ----
    const miArr = (miscItemsJson as any)?.miscItems ?? (miscItemsJson as any);
    if (Array.isArray(miArr)) {
        for (const row of miArr) {
            const enemyName = safeString((row as any)?.enemyName);
            if (!enemyName) continue;
            const id = dataId(["enemy-item", enemyName]);
            const label = `Enemy Item Drop: ${enemyName}`;
            const inferred = inferSourceMetadataFromLabel(label);
            pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
            if (inferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inferred.prereqIds,
                };
            }
        }
    }

    // ---- Resource by avatar (data:*) ----
    const rbaArr = (resourceByAvatarJson as any)?.resourceByAvatar ?? (resourceByAvatarJson as any);
    if (Array.isArray(rbaArr)) {
        for (const row of rbaArr) {
            const srcName = safeString((row as any)?.source);
            if (!srcName) continue;
            const id = dataId(["resource-by-avatar", srcName]);
            const label = `Resource Drop (Avatar): ${srcName}`;
            const inferred = inferSourceMetadataFromLabel(label);
            pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
            if (inferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inferred.prereqIds,
                };
            }
        }
    }

    // ---- Additional item by avatar (data:*) ----
    const aibaArr = (additionalItemByAvatarJson as any)?.additionalItemByAvatar ?? (additionalItemByAvatarJson as any);
    if (Array.isArray(aibaArr)) {
        for (const row of aibaArr) {
            const srcName = safeString((row as any)?.source);
            if (!srcName) continue;
            const id = dataId(["additional-item-by-avatar", srcName]);
            const label = `Additional Drop (Avatar): ${srcName}`;
            const inferred = inferSourceMetadataFromLabel(label);
            pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
            if (inferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inferred.prereqIds,
                };
            }
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

/**
 * Runtime src:* sources emitted by acquisitionFromDropData.ts (legacy / optional).
 * Keep only the patterns you actually emit somewhere in src/catalog/items.
 */
function buildDropDataRuntimeSrcSources(): RawSource[] {
    const out: RawSource[] = [];
    const seen = new Set<string>();

    // src:enemyitem/<enemyName>
    const miArr = (miscItemsJson as any)?.miscItems ?? (miscItemsJson as any);
    if (Array.isArray(miArr)) {
        for (const row of miArr) {
            const enemyName = safeString((row as any)?.enemyName);
            if (!enemyName) continue;

            const id = srcId(["enemyitem", enemyName]);
            const label = `Enemy: ${enemyName}`;
            const inferred = inferSourceMetadataFromLabel(label);
            pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
            if (inferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inferred.prereqIds,
                };
            }
        }
    }

    // src:resourcebyavatar/<source>
    const rbaArr = (resourceByAvatarJson as any)?.resourceByAvatar ?? (resourceByAvatarJson as any);
    if (Array.isArray(rbaArr)) {
        for (const row of rbaArr) {
            const srcName = safeString((row as any)?.source);
            if (!srcName) continue;

            const id = srcId(["resourcebyavatar", srcName]);
            const label = `Avatar Drop: ${srcName}`;
            const inferred = inferSourceMetadataFromLabel(label);
            pushUnique(out, seen, id, inferred?.label ?? label, inferred?.type ?? "drop");
            if (inferred?.prereqIds?.length) {
                out[out.length - 1] = {
                    ...out[out.length - 1],
                    prereqIds: inferred.prereqIds,
                };
            }
        }
    }

    out.sort((a, b) => a.label.localeCompare(b.label));
    return out;
}

// Exported catalog lists
export const SOURCE_CATALOG: RawSource[] = [
    ...(CURATED_SOURCES as unknown as RawSource[]),
    ...buildWfcdDropSources(),
    ...buildMissionNodeSources(),
    ...buildMissionRewardSources(),
    ...buildWfItemsCacheSources(),
    ...buildWfItemsLocSources(),
    ...buildDropDataSupplementSources(),
    ...buildDropDataRuntimeSrcSources(),
];

export const SOURCE_INDEX: Record<SourceId, Source> = (() => {
    const index = {} as Record<SourceId, Source>;

    for (const raw of SOURCE_CATALOG) {
        const id = normalizeSourceId(raw.id);

        if (index[id]) {
            throw new Error(`Duplicate SourceId detected: ${id}`);
        }

        index[id] = {
            id,
            label: raw.label,
            type: raw.type ?? "other",
            prereqIds: raw.prereqIds,
        };
    }

    return index;
})();

export const SOURCES: Source[] = Object.values(SOURCE_INDEX);
