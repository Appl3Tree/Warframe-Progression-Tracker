import { PREREQ_REGISTRY, describePrereqCondition } from "../../catalog/prereqs/prereqRegistry";
import { SOURCE_INDEX } from "../../catalog/sources/sourceCatalog";
import { buildPrereqIndex } from "../../domain/logic/prereqEngine";
import { getAcquisitionByCatalogId } from "../../catalog/items/itemAcquisition";
import { classifySourceFamilyFromCatalog, type GroupedSourceEntry } from "./GroupedSourceList";

const PREREQ_INDEX = buildPrereqIndex(PREREQ_REGISTRY);

function titleCaseToken(token: string): string {
    return token
        .split("-")
        .filter(Boolean)
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join(" ");
}

function cleanWfItemsLocationLabel(sourceLabel: string | undefined, fallbackToken: string): string {
    const normalized = String(sourceLabel ?? "")
        .replace(/^WFItems Location(?: \(Legacy\))?:\s*/i, "")
        .replace(/^\d+[xX]\s+/i, "")
        .trim();
    return normalized || titleCaseToken(fallbackToken);
}

function describeWfItemsLocationPresentation(
    sourceId: string,
    sourceLabel?: string,
): (Pick<GroupedSourceEntry, "title" | "family"> & { preserveRequirements?: boolean }) | null {
    if (!sourceId.startsWith("data:wfitems:loc:")) return null;
    const token = sourceId.slice("data:wfitems:loc:".length);
    const body = cleanWfItemsLocationLabel(sourceLabel, token);

    const vendorLikePrefixes = [
        "Cephalon Simaris",
        "Steel Meridian",
        "The Perrin Sequence",
        "Arbiters of Hexis",
        "Arbiters",
        "Cephalon Suda",
        "New Loka",
        "Red Veil",
        "Conclave",
        "Solaris United",
        "Vox Solaris",
        "NecraLoid",
        "The Holdfasts",
        "The Quills",
        "Entrati",
        "Ostron",
        "Ventkids",
    ];

    const vendorPrefix = vendorLikePrefixes.find((prefix) => body.startsWith(`${prefix},`));
    if (vendorPrefix) {
        const suffix = body.slice(vendorPrefix.length + 1).trim();
        return {
            title: suffix ? `Vendor: ${vendorPrefix} (${suffix})` : `Vendor: ${vendorPrefix}`,
            family: "vendor",
            preserveRequirements: true,
        };
    }

    if (/^eidolon-(teralyst|gantulyst|hydrolyst)$/.test(token)) {
        return {
            title: `Activity: ${titleCaseToken(token)} Hunt`,
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (/^sister-of-parvos-ascension-(hard-)?mode$/.test(token)) {
        return {
            title: token.includes("hard")
                ? "Activity: Ascension (Sister of Parvos, Hard Mode)"
                : "Activity: Ascension (Sister of Parvos)",
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (token === "operation-orphix-venom") {
        return {
            title: "Activity: Operation Orphix Venom",
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (token === "profittaker") {
        return {
            title: "Activity: Profit-Taker Orb",
            family: "activity",
            preserveRequirements: true,
        };
    }

    if ([
        "kela-de-thaym",
        "jackal",
        "councilor-vay-hek",
        "vay-hek-terra-frame",
        "corrupted-vor",
        "phorid",
        "ambulas",
        "terra-ambulas",
        "kavat",
        "kubrow",
        "hyekka",
        "kuva-hyekka",
        "drahk",
        "kuva-drahk",
    ].includes(token) || /^hyena-(ln2|ng|pb|th)$/.test(token)) {
        return {
            title: `Enemy: ${titleCaseToken(token)}`,
            family: "enemy",
            preserveRequirements: true,
        };
    }

    if (token.includes("rotation-")) {
        const rotationMatch = body.match(/^(.*?),\s*Rotation\s*([A-Z])$/i);
        return {
            title: rotationMatch
                ? `Mission: ${rotationMatch[1]} (Rotation ${rotationMatch[2].toUpperCase()})`
                : `Mission: ${titleCaseToken(token.replace(/-rotation-([abc])$/, ""))} (Rotation ${token.slice(-1).toUpperCase()})`,
            family: /Arbitrations|Nightmare Mode|Duviri|Sanctuary|Ascension/i.test(body) ? "activity" : "mission",
            preserveRequirements: true,
        };
    }

    if (token.includes("storage-container") || token.includes("carrypod")) {
        return {
            title: `Container: ${titleCaseToken(token)}`,
            family: "cache",
            preserveRequirements: false,
        };
    }

    if (token.endsWith("-enemies") || token.endsWith("-enemy")) {
        return {
            title: `Area: ${body}`,
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (/^(Arbitrations|Nightmare Mode Rewards|Nightmare Mode Rescue|Elite Sanctuary Onslaught|Sanctuary Onslaught|Duviri .*|Kullervo's Hold|The Circuit|Profit-Taker|Exploiter Orb)/i.test(body)) {
        return {
            title: `Activity: ${body}`,
            family: "activity",
            preserveRequirements: true,
        };
    }

    if (token.includes("specter")) {
        return {
            title: `Enemy: ${body}`,
            family: "enemy",
            preserveRequirements: true,
        };
    }

    return {
        title: `Enemy: ${body}`,
        family: "enemy",
        preserveRequirements: true,
    };
}

type RequirementDescriptor = {
    label: string;
    key: string;
};

function appendRequirement(
    out: RequirementDescriptor[],
    seen: Set<string>,
    label: string,
    key?: string,
) {
    const normalizedLabel = String(label ?? "").trim();
    if (!normalizedLabel) return;
    const dedupeKey = key ?? normalizedLabel;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    out.push({ label: normalizedLabel, key: dedupeKey });
}

function describePrereqRequirements(prereqId: string): RequirementDescriptor[] {
    if (!prereqId) return [];
    const def = PREREQ_INDEX[prereqId];
    if (!def) return [{ label: prereqId, key: prereqId }];

    const out: RequirementDescriptor[] = [];
    const seen = new Set<string>();

    appendRequirement(out, seen, def.label, def.id);

    if (Array.isArray(def.conditions) && def.conditions.length > 0) {
        for (const condition of def.conditions) {
            appendRequirement(
                out,
                seen,
                describePrereqCondition(condition, (id) => PREREQ_INDEX[id]?.label ?? id),
            );
        }
    }

    return out;
}

function describeManualRequirements(sourceId: string): string[] {
    if (sourceId === "data:companions/posture-vendors") {
        return [
            "Cetus (Plains of Eidolon) Access or Fortuna (Orb Vallis) Access or Necralisk (Deimos) Access",
        ];
    }
    return [];
}

function describeManualSubtitle(sourceId: string): string | undefined {
    if (sourceId === "data:crafting") {
        return "Build from its blueprint in the Foundry";
    }
    if (sourceId === "data:market/platinum") {
        return "Purchase directly from the Market for Platinum";
    }
    if (sourceId === "data:system/set-bonus-record") {
        return "Internal set-bonus record used to represent the set bonus itself";
    }
    if (sourceId === "data:companions/precept-sentinel") {
        return "Granted automatically with the matching Sentinel";
    }
    if (sourceId === "data:system/veiled-riven") {
        return "Receive the veiled version first, then unveil it into this Riven type";
    }
    if (sourceId === "data:unobtainable/dev-only") {
        return "Unavailable internal or developer-only item";
    }
    if (sourceId === "data:blueprint/unclassified") {
        return "Blueprint source exists but is not yet classified in the acquisition catalog";
    }

    const locationMap: Array<{ pattern: RegExp; subtitle: string }> = [
        {
            pattern: /relic\/requiem\/i/i,
            subtitle: "Locations: Open Requiem I Relics in Kuva Lich or Requiem fissures",
        },
        {
            pattern: /relic\/requiem\/iii/i,
            subtitle: "Locations: Open Requiem III Relics in Kuva Lich or Requiem fissures",
        },
        {
            pattern: /relic\/requiem\/ii/i,
            subtitle: "Locations: Open Requiem II Relics in Kuva Lich or Requiem fissures",
        },
        {
            pattern: /relic\/requiem\/iv/i,
            subtitle: "Locations: Open Requiem IV Relics in Kuva Lich or Requiem fissures",
        },
        {
            pattern: /(?:^|:)(boiler)$/i,
            subtitle: "Locations: Europa - Cholistan; Eris - Isos; Deimos - Horend",
        },
        {
            pattern: /(?:^|:)(eviscerator)$/i,
            subtitle: "Locations: Ceres - Lex; Ceres - Pallas; Ceres - Ker",
        },
        {
            pattern: /(?:^|:)(trooper)$/i,
            subtitle: "Locations: Saturn - Cassini; Saturn - Numa; Sedna - Adaro; Mercury - Pantheon",
        },
        {
            pattern: /(?:^|:)(trooper-survivor)$/i,
            subtitle: "Locations: Cambion Drift bounties with Garv",
        },
        {
            pattern: /(?:^|:)(detron-crewman)$/i,
            subtitle: "Locations: Venus - Tessera; Lua - Copernicus; Lua - Tycho",
        },
        {
            pattern: /(?:^|:)(napalm)$/i,
            subtitle: "Locations: Saturn - Cassini; Mercury - Pantheon; also frequent on Invasions",
        },
        {
            pattern: /(?:^|:)(seeker)$/i,
            subtitle: "Locations: Ceres - Lex; Ceres - Nuovo; Sedna - Selkie; Sedna - Adaro",
        },
        {
            pattern: /(?:^|:)(charger)$/i,
            subtitle: "Locations: Earth - Tikal; Mercury - Terminus; Mercury - M Prime; Eris - Isos; Deimos - Horend",
        },
        {
            pattern: /(?:^|:)(carrion-charger)$/i,
            subtitle: "Locations: Phobos - Memphis; Saturn - Caracol; Neptune - Yursa",
        },
        {
            pattern: /(?:^|:)(ancient-protector)$/i,
            subtitle: "Locations: Infested missions on Mercury, Venus, Earth, Mars, Phobos, Ceres, Jupiter, Europa, Saturn, Uranus, Neptune, Pluto, Sedna, Eris, and Deimos",
        },
        {
            pattern: /(?:^|:)(ancient-healer)$/i,
            subtitle: "Locations: Infested missions on Mercury, Venus, Earth, Mars, Phobos, Ceres, Jupiter, Europa, Saturn, Uranus, Neptune, Pluto, Sedna, Eris, and Deimos",
        },
        {
            pattern: /(?:^|:)(ancient-disruptor)$/i,
            subtitle: "Locations: Infested missions on Mercury, Venus, Earth, Mars, Phobos, Ceres, Jupiter, Europa, Saturn, Uranus, Neptune, Pluto, Sedna, Eris, and Deimos",
        },
        {
            pattern: /(?:^|:)(toxic-ancient)$/i,
            subtitle: "Locations: Infested missions on Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Ceres, Eris, Sedna, Europa, and Phobos",
        },
        {
            pattern: /(?:^|:)(brood-mother)$/i,
            subtitle: "Locations: Earth - Tikal; Ceres - Gabii; Uranus - Assur; Eris - Isos",
        },
        {
            pattern: /(?:^|:)(deimos-brood-mother)$/i,
            subtitle: "Locations: Deimos - Cambion Drift",
        },
        {
            pattern: /(?:^|:)(deimos-therid)$/i,
            subtitle: "Locations: Deimos - Cambion Drift",
        },
        {
            pattern: /(?:^|:)(tar-mutalist-moa)$/i,
            subtitle: "Locations: Regular Infested missions throughout the star chart",
        },
        {
            pattern: /(?:^|:)(corrupted-nullifier)$/i,
            subtitle: "Locations: Void missions",
        },
        {
            pattern: /(?:^|:)(corrupted-bombard)$/i,
            subtitle: "Locations: Void missions",
        },
        {
            pattern: /(?:^|:)(corrupted-heavy-gunner)$/i,
            subtitle: "Locations: Void missions",
        },
        {
            pattern: /(?:^|:)(corrupted-drahk)$/i,
            subtitle: "Locations: Void missions",
        },
        {
            pattern: /(?:^|:)(corrupted-drahk-master)$/i,
            subtitle: "Locations: Void missions",
        },
        {
            pattern: /(?:^|:)(corrupted-vor)$/i,
            subtitle: "Locations: Void - Aten; Void - Mithra; Void - Mot; also Undercroft Exterminate",
        },
        {
            pattern: /(?:^|:)(corpus-power-carrier)$/i,
            subtitle: "Locations: Excavation missions",
        },
        {
            pattern: /(?:^|:)(juggernaut)$/i,
            subtitle: "Locations: Eris - Saxis; Eris - Isos; Europa - Armaros; Deimos - Horend; Deimos - Magnacidium; Cambion Drift bounties",
        },
        {
            pattern: /(?:^|:)(juggernaut-behemoth)$/i,
            subtitle: "Locations: Eris - Jordas Golem Assassinate; also The Jordas Precept",
        },
        {
            pattern: /(?:^|:)(scorpion)$/i,
            subtitle: "Locations: Ceres - Lex; Ceres - Pallas; Saturn - Telesto; Sedna - Kappa",
        },
        {
            pattern: /(?:^|:)(jack-onaut)$/i,
            subtitle: "Locations: Hallowed Nightmares Halloween tactical alert",
        },
        {
            pattern: /(?:^|:)(sprag)$/i,
            subtitle: "Locations: Orokin Sabotage - Stribog/Formido; also Kahl's Junk Run",
        },
        {
            pattern: /(?:^|:)(venkra-tel)$/i,
            subtitle: "Locations: Orokin Sabotage - Stribog/Formido; also Kahl's Junk Run",
        },
        {
            pattern: /(?:^|:)(drahk)$/i,
            subtitle: "Locations: Spawned by Drahk Masters",
        },
        {
            pattern: /(?:^|:)(kubrow)$/i,
            subtitle: "Locations: Earth wild Kubrow dens",
        },
        {
            pattern: /(?:^|:)(tamm)$/i,
            subtitle: "Locations: Duviri side objectives",
        },
        {
            pattern: /(?:^|:)(ghoul-expired)$/i,
            subtitle: "Locations: Plains of Eidolon Ghoul Purge bounties",
        },
        {
            pattern: /(?:^|:)(carabus)$/i,
            subtitle: "Locations: Plains of Eidolon on Earth",
        },
        {
            pattern: /(?:^|:)(attack-drone)$/i,
            subtitle: "Locations: Spawned by damaged Fusion MOAs",
        },
        {
            pattern: /(?:^|:)(remech-osprey)$/i,
            subtitle: "Locations: Ambulas missions",
        },
        {
            pattern: /(?:^|:)(nemes)$/i,
            subtitle: "Locations: Europa - Naamah; also Archwing Rush missions",
        },
        {
            pattern: /(?:^|:)(sensor-regulator)$/i,
            subtitle: "Locations: Grineer Spy and Sealab Sabotage missions",
        },
        {
            pattern: /(?:^|:)(regulator)$/i,
            subtitle: "Locations: Summoned by Grineer units during missions",
        },
        {
            pattern: /(?:^|:)(observation-drone)$/i,
            subtitle: "Locations: Orb Vallis bounties",
        },
        {
            pattern: /(?:^|:)(oxium-osprey)$/i,
            subtitle: "Locations: Phobos - Gulliver; Jupiter - Io and Elara; Pluto - Outer Terminus; Europa - Paimon; Lua - Apollo",
        },
        {
            pattern: /(?:^|:)(juno-oxium-osprey)$/i,
            subtitle: "Locations: Corpus Ship missions; common Oxium farms include Jupiter - Io and Elara, Europa - Paimon, Pluto - Outer Terminus, and Lua - Apollo",
        },
        {
            pattern: /(?:^|:)(coolant-raknoid)$/i,
            subtitle: "Locations: Orb Vallis near the Exploiter Orb and Temple of Profit",
        },
        {
            pattern: /(?:^|:)(anu-brachiolyst)$/i,
            subtitle: "Locations: Scarlet Spear and The New War Sentient missions",
        },
        {
            pattern: /(?:^|:)(anu-mantalyst)$/i,
            subtitle: "Locations: Scarlet Spear and The New War Sentient missions",
        },
        {
            pattern: /(?:^|:)(anu-pyrolyst)$/i,
            subtitle: "Locations: Scarlet Spear Sentient missions",
        },
        {
            pattern: /(?:^|:)(anu-symbilyst)$/i,
            subtitle: "Locations: Scarlet Spear Sentient missions",
        },
        {
            pattern: /(?:^|:)(nox)$/i,
            subtitle: "Locations: Sedna and Kuva Fortress Disruption missions",
        },
        {
            pattern: /(?:^|:)(drekar-manic-bombard)$/i,
            subtitle: "Locations: Uranus - Titania and late-stage Uranus Sabotage",
        },
        {
            pattern: /(?:^|:)(manic-bombard)$/i,
            subtitle: "Locations: Uranus - Titania and late-stage Uranus Sabotage",
        },
        {
            pattern: /(?:^|:)(the-anatomizer)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(the-hollow-vein)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(the-severed-warden)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(deimos-jugulus-rex)$/i,
            subtitle: "Locations: Deimos - Cambion Drift",
        },
        {
            pattern: /(?:^|:)(thermic-raknoid)$/i,
            subtitle: "Locations: Thermia Fractures on Orb Vallis",
        },
        {
            pattern: /(?:^|:)(juno-shield-osprey)$/i,
            subtitle: "Locations: Corpus Ship missions",
        },
        {
            pattern: /(?:^|:)(syzygy-light-trencher)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(syzygy-prod-crewman)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(syzygy-sniper-ranger)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(rathuum-broadcaster)$/i,
            subtitle: "Locations: Sedna Rathuum arenas",
        },
        {
            pattern: /(?:^|:)(crawler)$/i,
            subtitle: "Locations: Early Infested missions across Mercury, Venus, Earth, Mars, Ceres, Deimos, Eris, and other Infested nodes",
        },
        {
            pattern: /(?:^|:)(flameblade)$/i,
            subtitle: "Locations: Grineer missions across Saturn, Uranus, Sedna, and other late Grineer nodes",
        },
        {
            pattern: /(?:^|:)(shield-lancer)$/i,
            subtitle: "Locations: Grineer missions across Earth, Mars, Ceres, Saturn, Uranus, and Sedna",
        },
        {
            pattern: /(?:^|:)(shield-drone)$/i,
            subtitle: "Locations: Corpus missions across Venus, Jupiter, Europa, Neptune, and Pluto",
        },
        {
            pattern: /(?:^|:)(shield-osprey)$/i,
            subtitle: "Locations: Corpus missions across Venus, Jupiter, Europa, Neptune, and Pluto",
        },
        {
            pattern: /(?:^|:)(vallis-surveillance-drone)$/i,
            subtitle: "Locations: Orb Vallis coolant lakes and surrounding encounters",
        },
        {
            pattern: /(?:^|:)(elite-crewman)$/i,
            subtitle: "Locations: Corpus Ship and Corpus Outpost missions",
        },
        {
            pattern: /(?:^|:)(machinist)$/i,
            subtitle: "Locations: Corpus Ship and Corpus Outpost missions",
        },
        {
            pattern: /(?:^|:)(techrot-galliflex)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(techrot-volatile-galliflex)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(techrot-matmas)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(techrot-skuzzi)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(techrot-babau)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(scaldra-barbican)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(scaldra-dedicant)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(scaldra-flayer)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(ballista)$/i,
            subtitle: "Locations: Grineer missions across Earth, Mars, Ceres, Saturn, Uranus, and Sedna",
        },
        {
            pattern: /(?:^|:)(drekar-ballista)$/i,
            subtitle: "Locations: Uranus missions",
        },
        {
            pattern: /(?:^|:)(kyta-raknoid)$/i,
            subtitle: "Locations: Orb Vallis",
        },
        {
            pattern: /(?:^|:)(mite-raknoid)$/i,
            subtitle: "Locations: Orb Vallis",
        },
        {
            pattern: /(?:^|:)(raptor)$/i,
            subtitle: "Locations: Europa - Naamah",
        },
        {
            pattern: /(?:^|:)(raptor-mt)$/i,
            subtitle: "Locations: Europa - Naamah",
        },
        {
            pattern: /(?:^|:)(raptor-ns)$/i,
            subtitle: "Locations: Europa - Naamah",
        },
        {
            pattern: /(?:^|:)(raptor-rv)$/i,
            subtitle: "Locations: Europa - Naamah",
        },
        {
            pattern: /(?:^|:)(lynx)$/i,
            subtitle: "Locations: Corpus Outpost and Corpus Ship boss encounters",
        },
        {
            pattern: /(?:^|:)(scyto-raknoid)$/i,
            subtitle: "Locations: Orb Vallis",
        },
        {
            pattern: /(?:^|:)(syzygy-attack-drone)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(syzygy-mite-raknoid)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(scaldra-eradicator)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(scaldra-jaeger)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(lephantis)$/i,
            subtitle: "Locations: Deimos - Magnacidium",
        },
        {
            pattern: /(?:^|:)(electric-crawler)$/i,
            subtitle: "Locations: Infested missions across the star chart",
        },
        {
            pattern: /(?:^|:)(derivator-crewman)$/i,
            subtitle: "Locations: Corpus Outpost and Corpus Ship missions",
        },
        {
            pattern: /(?:^|:)(bombard)$/i,
            subtitle: "Locations: Grineer missions across Saturn, Uranus, Sedna, and Kuva Fortress",
        },
        {
            pattern: /(?:^|:)(elementa-culverin)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(rogue-culverin)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(elementa-arcocanid)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(rogue-arcocanid)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(ghoul-devourer)$/i,
            subtitle: "Locations: Plains of Eidolon Ghoul Purge bounties",
        },
        {
            pattern: /(?:^|:)(corrupted-moa)$/i,
            subtitle: "Locations: Void missions",
        },
        {
            pattern: /(?:^|:)(powerfist)$/i,
            subtitle: "Locations: Corpus missions across Venus, Jupiter, Europa, Neptune, and Pluto",
        },
        {
            pattern: /(?:^|:)(deimos-undying-flyer)$/i,
            subtitle: "Locations: Deimos - Cambion Drift",
        },
        {
            pattern: /(?:^|:)(undying-flyer)$/i,
            subtitle: "Locations: Infested missions and Deimos Cambion Drift",
        },
        {
            pattern: /(?:^|:)(demolisher-bonewidow)$/i,
            subtitle: "Locations: Necramech Demolyst encounters in Deimos and Entrati labs",
        },
        {
            pattern: /(?:^|:)(demolisher-voidrig)$/i,
            subtitle: "Locations: Necramech Demolyst encounters in Deimos and Entrati labs",
        },
        {
            pattern: /(?:^|:)(rogue-bonewidow)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(rogue-voidrig)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(fusion-moa)$/i,
            subtitle: "Locations: Corpus missions across Venus, Jupiter, Europa, Neptune, and Pluto",
        },
        {
            pattern: /(?:^|:)(corrupted-crewman)$/i,
            subtitle: "Locations: Void missions",
        },
        {
            pattern: /(?:^|:)(orokin-drone)$/i,
            subtitle: "Locations: Orokin tileset missions in the Void and Lua",
        },
        {
            pattern: /(?:^|:)(orokin-spectator)$/i,
            subtitle: "Locations: Orokin tileset missions in the Void and Lua",
        },
        {
            pattern: /(?:^|:)(datalyst)$/i,
            subtitle: "Locations: Sentient encounters in Lua and The New War-era missions",
        },
        {
            pattern: /(?:^|:)(fog-scrambus)$/i,
            subtitle: "Locations: Corpus missions on Jupiter and Corpus Gas City",
        },
        {
            pattern: /(?:^|:)(nul-scrambus)$/i,
            subtitle: "Locations: Corpus missions on Jupiter and Corpus Gas City",
        },
        {
            pattern: /(?:^|:)(sap-scrambus)$/i,
            subtitle: "Locations: Corpus missions on Jupiter and Corpus Gas City",
        },
        {
            pattern: /(?:^|:)(slo-scrambus)$/i,
            subtitle: "Locations: Corpus missions on Jupiter and Corpus Gas City",
        },
        {
            pattern: /(?:^|:)(coildrive)$/i,
            subtitle: "Locations: Orb Vallis patrols and bounties",
        },
        {
            pattern: /(?:^|:)(drekar-elite-lancer)$/i,
            subtitle: "Locations: Uranus missions",
        },
        {
            pattern: /(?:^|:)(drekar-lancer)$/i,
            subtitle: "Locations: Uranus missions",
        },
        {
            pattern: /(?:^|:)(drekar-scorpion)$/i,
            subtitle: "Locations: Uranus missions",
        },
        {
            pattern: /(?:^|:)(juno-nullifier-crewman)$/i,
            subtitle: "Locations: Corpus Ship missions",
        },
        {
            pattern: /(?:^|:)(juno-sniper-crewman)$/i,
            subtitle: "Locations: Corpus Ship missions",
        },
        {
            pattern: /(?:^|:)(hellion)$/i,
            subtitle: "Locations: Grineer missions across Saturn, Uranus, Sedna, and Kuva Fortress",
        },
        {
            pattern: /(?:^|:)(lancer)$/i,
            subtitle: "Locations: Grineer missions across Earth, Mars, Ceres, Saturn, Uranus, and Sedna",
        },
        {
            pattern: /(?:^|:)(lancer-survivor)$/i,
            subtitle: "Locations: Cambion Drift bounties with Garv",
        },
        {
            pattern: /(?:^|:)(nightwatch-reaver)$/i,
            subtitle: "Locations: Grineer late-game missions and sorties",
        },
        {
            pattern: /(?:^|:)(special-duty-coildrive)$/i,
            subtitle: "Locations: Orb Vallis patrols and bounties",
        },
        {
            pattern: /rogg[-_]?417/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(scaldra[-_]?ti[-_]?92)$/i,
            subtitle: "Locations: Höllvania missions",
        },
        {
            pattern: /(?:^|:)(elite-lancer)$/i,
            subtitle: "Locations: Grineer missions across Earth, Mars, Ceres, Saturn, Uranus, and Sedna",
        },
        {
            pattern: /(?:^|:)(shock-draga)$/i,
            subtitle: "Locations: Plains of Eidolon",
        },
        {
            pattern: /(?:^|:)(basal-diploid)$/i,
            subtitle: "Locations: Cambion Drift",
        },
        {
            pattern: /(?:^|:)(basal-diploid-rex)$/i,
            subtitle: "Locations: Cambion Drift",
        },
        {
            pattern: /(?:^|:)(feral-diploid)$/i,
            subtitle: "Locations: Cambion Drift",
        },
        {
            pattern: /(?:^|:)(feral-diploid-rex)$/i,
            subtitle: "Locations: Cambion Drift",
        },
        {
            pattern: /(?:^|:)(feyarch-specter)$/i,
            subtitle: "Locations: The Silver Grove shrine encounters",
        },
        {
            pattern: /(?:^|:)(comet-shard)$/i,
            subtitle: "Locations: The Hollow Vein and Murmur encounters in Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(kosma-gokstad-officer)$/i,
            subtitle: "Locations: Grineer Railjack missions in Saturn Proxima",
        },
        {
            pattern: /(?:^|:)(kosma-gokstad-pilot)$/i,
            subtitle: "Locations: Grineer Railjack missions in Saturn Proxima",
        },
        {
            pattern: /(?:^|:)(lancer-dreg)$/i,
            subtitle: "Locations: Grineer missions and the Plains of Eidolon",
        },
        {
            pattern: /(?:^|:)(shield-?hellion-dargyn)$/i,
            subtitle: "Locations: Plains of Eidolon, Rathuum, and Empyrean",
        },
        {
            pattern: /(?:^|:)(cannon-battery)$/i,
            subtitle: "Locations: Railjack points of interest and Gokstad crewships",
        },
        {
            pattern: /(?:^|:)(kosma-raider)$/i,
            subtitle: "Locations: Grineer Railjack missions in Earth and Saturn Proxima",
        },
        {
            pattern: /(?:^|:)(kosma-raider-carver)$/i,
            subtitle: "Locations: Grineer Railjack missions in Earth and Saturn Proxima",
        },
        {
            pattern: /(?:^|:)(kosma-raider-eviscerator)$/i,
            subtitle: "Locations: Grineer Railjack missions in Earth and Saturn Proxima",
        },
        {
            pattern: /(?:^|:)(locust-drone)$/i,
            subtitle: "Locations: Cambion Drift and Deimos Infested encounters",
        },
        {
            pattern: /(?:^|:)(juno-malleus-machinist)$/i,
            subtitle: "Locations: Corpus Ship missions",
        },
        {
            pattern: /(?:^|:)(prod-crewman)$/i,
            subtitle: "Locations: Corpus missions",
        },
        {
            pattern: /oull/i,
            subtitle: "Locations: Earn Oull from Kuva Lich and Sister of Parvos requiem sources",
        },
        {
            pattern: /(?:^|:)(lt-lech-kril)$/i,
            subtitle: "Locations: Mars - War",
        },
        {
            pattern: /domestik-drone(s)?/i,
            subtitle: "Locations: Orb Vallis Domestik Drone encounters",
        },
        {
            pattern: /(?:^|:)(deimos-leaper)$/i,
            subtitle: "Locations: Cambion Drift",
        },
        {
            pattern: /(?:^|:)(leaper)$/i,
            subtitle: "Locations: Infested missions across the star chart",
        },
        {
            pattern: /(?:^|:)(drekar-butcher)$/i,
            subtitle: "Locations: Uranus Sealab missions",
        },
        {
            pattern: /(?:^|:)(executioner-dhurnam)$/i,
            subtitle: "Locations: Sedna Rathuum arenas at Yam and Vodyanoi",
        },
        {
            pattern: /(?:^|:)(ghoul-auger|ghoul-auger-alpha|ghoul-rictus|ghoul-rictus-alpha)$/i,
            subtitle: "Locations: Plains of Eidolon and Ghoul Purge bounties",
        },
        {
            pattern: /(?:^|:)(hellion-power-carrier)$/i,
            subtitle: "Locations: Mars Excavation missions",
        },
        {
            pattern: /(?:^|:)(anti-moa)$/i,
            subtitle: "Locations: Corpus missions",
        },
        {
            pattern: /(?:^|:)(latcher)$/i,
            subtitle: "Locations: Infested missions",
        },
        {
            pattern: /(?:^|:)(roller)$/i,
            subtitle: "Locations: Grineer missions",
        },
        {
            pattern: /(?:^|:)(roller-sentry)$/i,
            subtitle: "Locations: Grineer missions and fortifications",
        },
        {
            pattern: /(?:^|:)(leech-osprey)$/i,
            subtitle: "Locations: Corpus missions",
        },
        {
            pattern: /(?:^|:)(sapping-osprey)$/i,
            subtitle: "Locations: Corpus missions",
        },
        {
            pattern: /(?:^|:)(knave-specter)$/i,
            subtitle: "Locations: Specter encounters",
        },
        {
            pattern: /(?:^|:)(equisitus-hoard)$/i,
            subtitle: "Locations: The Silver Grove shrine encounters",
        },
        {
            pattern: /(?:^|:)(nauseous-crawler)$/i,
            subtitle: "Locations: Infested missions",
        },
        {
            pattern: /(?:^|:)(nauseous-void-shade)$/i,
            subtitle: "Locations: Void fissure and Void-related encounters",
        },
        {
            pattern: /(?:^|:)(void-shade)$/i,
            subtitle: "Locations: Void encounters",
        },
        {
            pattern: /(?:^|:)(guardsman)$/i,
            subtitle: "Locations: Grineer Shipyard missions on Ceres",
        },
        {
            pattern: /(?:^|:)(exo-outrider)$/i,
            subtitle: "Locations: Corpus Railjack missions in Veil Proxima",
        },
        {
            pattern: /(?:^|:)(gyre-outrider)$/i,
            subtitle: "Locations: Corpus Railjack missions in Neptune Proxima",
        },
        {
            pattern: /(?:^|:)(kosma-outrider)$/i,
            subtitle: "Locations: Grineer Railjack missions in Earth and Saturn Proxima",
        },
        {
            pattern: /(?:^|:)(elite-exo-outrider)$/i,
            subtitle: "Locations: Corpus Railjack missions in Veil Proxima",
        },
        {
            pattern: /(?:^|:)(elite-gyre-outrider)$/i,
            subtitle: "Locations: Corpus Railjack missions in Neptune Proxima",
        },
        {
            pattern: /(?:^|:)(elite-kosma-outrider)$/i,
            subtitle: "Locations: Grineer Railjack missions in Saturn Proxima",
        },
        {
            pattern: /(?:^|:)(captain-vor)$/i,
            subtitle: "Locations: Mercury - Tolstoj",
        },
        {
            pattern: /(?:^|:)(garv)$/i,
            subtitle: "Locations: Cambion Drift bounties",
        },
        {
            pattern: /(?:^|:)(heavy-gunner)$/i,
            subtitle: "Locations: Grineer missions across Saturn, Uranus, Sedna, and Kuva Fortress",
        },
        {
            pattern: /(?:^|:)(corrupted-warden)$/i,
            subtitle: "Locations: Orokin Rescue and Void missions",
        },
        {
            pattern: /(?:^|:)(grineer-warden)$/i,
            subtitle: "Locations: Grineer Rescue missions",
        },
        {
            pattern: /(?:^|:)(commander)$/i,
            subtitle: "Locations: Grineer missions and rescue tilesets",
        },
        {
            pattern: /(?:^|:)(gyre-raider)$/i,
            subtitle: "Locations: Corpus Railjack missions in Neptune Proxima",
        },
        {
            pattern: /(?:^|:)(gyre-raider-carver)$/i,
            subtitle: "Locations: Corpus Railjack missions in Neptune Proxima",
        },
        {
            pattern: /(?:^|:)(gyre-raider-eviscerator)$/i,
            subtitle: "Locations: Corpus Railjack missions in Neptune Proxima",
        },
        {
            pattern: /(?:^|:)(apex-membroid)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(juvenile-membroid)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(mature-membroid)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /(?:^|:)(nascent-membroid)$/i,
            subtitle: "Locations: Deimos - Albrecht's Laboratories",
        },
        {
            pattern: /unobtainable\/legacy/i,
            subtitle: "Unobtainable legacy item",
        },
        {
            pattern: /common-grineer-storage-container/i,
            subtitle: "Locations: Open Grineer lockers and containers in Grineer missions",
        },
        {
            pattern: /rare-grineer-storage-container/i,
            subtitle: "Locations: Open rare containers in Grineer missions",
        },
        {
            pattern: /reinforced-grineer-storage-container/i,
            subtitle: "Locations: Open reinforced containers in Grineer missions",
        },
        {
            pattern: /orokin-storage-container/i,
            subtitle: "Locations: Open containers in Orokin Void and Lua missions",
        },
        {
            pattern: /rare-corpus-storage-container/i,
            subtitle: "Locations: Open rare containers in Corpus missions",
        },
        {
            pattern: /uncommon-corpus-storage-container/i,
            subtitle: "Locations: Open uncommon containers in Corpus missions",
        },
        {
            pattern: /(?:^|:)(shield-dargyn)$/i,
            subtitle: "Locations: Plains of Eidolon",
        },
        {
            pattern: /(?:^|:)(gyre-eviscerator)$/i,
            subtitle: "Locations: Corpus Railjack missions in Neptune Proxima",
        },
        {
            pattern: /(?:^|:)(gyre-supressor)$/i,
            subtitle: "Locations: Corpus Railjack missions in Neptune Proxima",
        },
        {
            pattern: /(?:^|:)(phorid)$/i,
            subtitle: "Locations: Infested Invasions",
        },
        {
            pattern: /(?:^|:)(councilor-vay-hek)$/i,
            subtitle: "Locations: Earth - Oro",
        },
        {
            pattern: /(?:^|:)(darek-draga)$/i,
            subtitle: "Locations: Plains of Eidolon",
        },
        {
            pattern: /(?:^|:)(dargyn-pilot)$/i,
            subtitle: "Locations: Plains of Eidolon",
        },
        {
            pattern: /(?:^|:)(draga)$/i,
            subtitle: "Locations: Plains of Eidolon",
        },
    ];

    return locationMap.find(({ pattern }) => pattern.test(sourceId))?.subtitle;
}

export function buildCatalogSourceEntries(catalogId: string | undefined): GroupedSourceEntry[] {
    if (!catalogId) return [];

    const acquisition = getAcquisitionByCatalogId(catalogId as `items:${string}`);
    const sourceIdsRaw = Array.isArray(acquisition?.sources) ? acquisition.sources : [];
    const sourceIdSet = new Set(sourceIdsRaw);
    const hasNonWfItemsLocationSource = sourceIdsRaw.some((sourceId) => !sourceId.startsWith("data:wfitems:loc:"));
    const sourceIds = sourceIdsRaw.filter((sourceId) => {
        if (sourceId.startsWith("data:wfitems:loc:") && hasNonWfItemsLocationSource) return false;
        if (!sourceId.startsWith("data:drop:node:")) return true;
        const normalizedNodeId = `data:node/${sourceId.slice("data:drop:node:".length).replace(/:/g, "/")}`;
        return !sourceIdSet.has(normalizedNodeId);
    });

    const entries = sourceIds.map((sourceId) => {
        const source = SOURCE_INDEX[sourceId as keyof typeof SOURCE_INDEX];
        const presentationOverride = describeWfItemsLocationPresentation(sourceId, source?.label);
        const title = presentationOverride?.title ?? source?.label ?? sourceId;
        const automaticRequirements = presentationOverride?.preserveRequirements !== false && Array.isArray(source?.prereqIds)
            ? Array.from(
                new Map(
                    source.prereqIds
                        .flatMap((prereqId) => describePrereqRequirements(prereqId))
                        .map((descriptor) => [descriptor.key, descriptor.label] as const),
                ).values(),
            )
            : [];
        const requirements = Array.from(
            new Set([...automaticRequirements, ...describeManualRequirements(sourceId)]),
        );
        const manualSubtitle = describeManualSubtitle(sourceId);

        return {
            id: sourceId,
            family: presentationOverride?.family ?? classifySourceFamilyFromCatalog(sourceId, title),
            title,
            subtitle: requirements.length > 0
                ? `Requires: ${requirements.join(" · ")}`
                : manualSubtitle,
        };
    });

    return Array.from(
        new Map(entries.map((entry) => [`${entry.family}::${entry.title}::${entry.subtitle ?? ""}`, entry] as const)).values(),
    );
}
