import { isQuestRewardRegistryItem } from "../catalog/questRewardRegistry";

export type SafeToSellProtectionKey =
    | "eventItems"
    | "invasionRewards"
    | "questRewards"
    | "incarnonItems"
    | "stalkerAssassinDrops"
    | "progenitorWeapons"
    | "factionPurchases"
    | "dojoResearch"
    | "nightwaveOfferings"
    | "weaponIngredients";

export type SafeToSellProtectionMeta = {
    label: string;
    description: string;
};

export const SAFE_TO_SELL_PROTECTION_META: Record<SafeToSellProtectionKey, SafeToSellProtectionMeta> = {
    eventItems: {
        label: "Event Items",
        description: "Protect items tied to limited-time or seasonal event sources.",
    },
    invasionRewards: {
        label: "Invasion Rewards",
        description: "Protect items that come from invasion reward pools.",
    },
    questRewards: {
        label: "Quest Rewards",
        description: "Protect items that come from quest reward sources.",
    },
    incarnonItems: {
        label: "Incarnon",
        description: "Protect Incarnon weapons and Incarnon Genesis adapters.",
    },
    stalkerAssassinDrops: {
        label: "Stalker / Assassin Drops",
        description: "Protect rare drops from Stalker, Shadow Stalker, Zanuka Hunter, Wolf, and similar assassin-style sources.",
    },
    progenitorWeapons: {
        label: "Progenitor Weapons",
        description: "Protect Kuva, Tenet, and Coda progenitor weapon families.",
    },
    factionPurchases: {
        label: "Faction Purchases",
        description: "Protect syndicate and standing vendor purchases.",
    },
    dojoResearch: {
        label: "Dojo Research",
        description: "Protect dojo and clan-research equipment.",
    },
    nightwaveOfferings: {
        label: "Nightwave",
        description: "Protect Nightwave offering items.",
    },
    weaponIngredients: {
        label: "Weapon Ingredients",
        description: "Protect weapons that are used to craft other weapons.",
    },
};

export type SafeToSellProtectionArgs = {
    acquisitionSources?: string[];
    isIncarnonItem?: boolean;
    isProgenitorWeapon?: boolean;
    hasWeaponRecipeConsumers?: boolean;
    rawPath?: string;
    displayName?: string;
};

function uniqueSorted<T extends string>(values: Iterable<T>): T[] {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

const STRICT_ASSASSIN_SOURCE_FRAGMENTS = [
    "data:enemy/stalker",
    "data:enemy/shadow-stalker",
    "data:enemy/protector-stalker",
    "data:enemy/zanuka-hunter",
    "data:enemy/grustrag-three",
    "data:enemy/grustrag",
    "data:resourcebyavatar/stalker",
    "data:resourcebyavatar/shadow-stalker",
    "data:resourcebyavatar/protector-stalker",
    "data:resourcebyavatar/zanuka-hunter",
    "data:resourcebyavatar/grustrag",
    "data:resourcebyavatar/wolf-of-saturn-six",
    "data:wfitems:loc:stalker",
    "data:wfitems:loc:hunhow",
    "data:wfitems:loc:zanuka-hunter",
    "data:wfitems:loc:wolf-of-saturn-six",
].map((value) => value.toLowerCase());

const ASSASSIN_DROP_NAME_FALLBACKS = new Set(
    [
        "broken war",
        "brakk",
        "despair",
        "detron",
        "dread",
        "hate",
        "smoking body ephemera",
        "war",
        "wolf sledge",
    ].map((value) => value.toLowerCase()),
);

const ASSASSIN_DROP_PATH_FALLBACKS = [
    "/weapons/tenno/bows/stalkerbow",
    "/weapons/tenno/throwingweapons/stalkerkunai",
    "/weapons/tenno/melee/scythe/stalkerscytheweapon",
    "/weapons/tenno/melee/swords/stalkertwo/stalkertwogreatsword",
    "/weapons/tenno/melee/swords/stalkertwo/stalkertwosmallsword",
    "/weapons/corpus/pistols/corpushandshotgun/corphandcannon",
    "/weapons/grineer/pistols/grineerhandshotgun/grineerhandcannon",
    "/weapons/tenno/melee/hammer/throwinghammer",
    "/upgrades/skins/effects/avatarsmokea",
].map((value) => value.toLowerCase());

function isStrictAssassinDropSource(source: string): boolean {
    return STRICT_ASSASSIN_SOURCE_FRAGMENTS.some((fragment) => source.includes(fragment));
}

function classifySourceProtection(sourceId: string): SafeToSellProtectionKey[] {
    const source = String(sourceId ?? "").trim().toLowerCase();
    if (!source) return [];

    const matches = new Set<SafeToSellProtectionKey>();

    if (
        source.startsWith("data:events/") ||
        source.includes("/plague-star") ||
        source.includes("/naberus") ||
        source.includes("/anniversary")
    ) {
        matches.add("eventItems");
    }

    if (
        source.startsWith("data:invasion/") ||
        source.includes("/murmur-invasion/")
    ) {
        matches.add("invasionRewards");
    }

    if (source.startsWith("data:quest/")) {
        matches.add("questRewards");
    }

    if (isStrictAssassinDropSource(source)) {
        matches.add("stalkerAssassinDrops");
    }

    if (
        source.startsWith("data:vendor/") ||
        source === "data:conclave"
    ) {
        matches.add("factionPurchases");
    }

    if (
        source.startsWith("data:dojo/") ||
        source.startsWith("data:clan/")
    ) {
        matches.add("dojoResearch");
    }

    if (source.startsWith("data:nightwave/")) {
        matches.add("nightwaveOfferings");
    }

    return [...matches];
}

function classifyQuestRewardFallback(args: Pick<SafeToSellProtectionArgs, "rawPath" | "displayName">): SafeToSellProtectionKey[] {
    const path = String(args.rawPath ?? "").trim().toLowerCase();
    const name = String(args.displayName ?? "").trim().toLowerCase();

    if (!path && !name) return [];

    if (isQuestRewardRegistryItem({ displayName: args.displayName })) {
        return ["questRewards"];
    }

    const knownQuestRewardPathFragments = [
        "/weapons/tenno/grimoire/tndoppelgangergrimoire",
        "/weapons/tenno/bows/omicrus/omicrusplayerwep",
        "/weapons/tenno/melee/glaives/teshinglaive/tnteshinglaivewep",
    ];

    const knownQuestRewardNames = [
        "grimoire",
        "nataruk",
        "orvius",
    ];

    if (
        knownQuestRewardPathFragments.some((fragment) => path.includes(fragment)) ||
        knownQuestRewardNames.includes(name)
    ) {
        return ["questRewards"];
    }

    return [];
}

function classifyAssassinDropFallback(args: Pick<SafeToSellProtectionArgs, "rawPath" | "displayName">): SafeToSellProtectionKey[] {
    const path = String(args.rawPath ?? "").trim().toLowerCase();
    const name = String(args.displayName ?? "").trim().toLowerCase();

    if (!path && !name) return [];

    if (
        ASSASSIN_DROP_NAME_FALLBACKS.has(name) ||
        ASSASSIN_DROP_PATH_FALLBACKS.some((fragment) => path.includes(fragment))
    ) {
        return ["stalkerAssassinDrops"];
    }

    return [];
}

const INCARNON_COMPATIBLE_WEAPON_NAME_FALLBACKS = new Set(
    [
        "ack & brunt",
        "angstrum",
        "anku",
        "atomos",
        "bo",
        "bo prime",
        "boar",
        "boar prime",
        "boltor",
        "boltor prime",
        "braton",
        "braton prime",
        "braton vandal",
        "bronco",
        "bronco prime",
        "burston",
        "burston prime",
        "ceramic dagger",
        "cestra",
        "dera",
        "dera vandal",
        "despair",
        "dex sybaris",
        "dread",
        "dual ichor",
        "dual toxocyst",
        "furax",
        "furax wraith",
        "furis",
        "gammacor",
        "gorgon",
        "gorgon wraith",
        "hate",
        "kunai",
        "lato",
        "lato prime",
        "lato vandal",
        "latron",
        "latron prime",
        "latron wraith",
        "lex",
        "lex prime",
        "magistar",
        "miter",
        "mk1-bo",
        "mk1-braton",
        "mk1-furax",
        "mk1-furis",
        "mk1-kunai",
        "mk1-paris",
        "mk1-strun",
        "nami solo",
        "okina",
        "okina prime",
        "paris",
        "paris prime",
        "prisma angstrum",
        "prisma gorgon",
        "prisma skana",
        "sancti magistar",
        "sibear",
        "sicarus",
        "sicarus prime",
        "skana",
        "skana prime",
        "soma",
        "soma prime",
        "strun",
        "strun prime",
        "strun wraith",
        "sybaris",
        "sybaris prime",
        "synoid gammacor",
        "telos boltor",
        "torid",
        "vasto",
        "vasto prime",
        "zylok",
        "zylok prime",
    ].map((value) => value.toLowerCase()),
);

function classifyIncarnonFallback(args: Pick<SafeToSellProtectionArgs, "displayName">): SafeToSellProtectionKey[] {
    const name = String(args.displayName ?? "").trim().toLowerCase();
    if (!name) return [];

    if (INCARNON_COMPATIBLE_WEAPON_NAME_FALLBACKS.has(name)) {
        return ["incarnonItems"];
    }

    return [];
}

export function getSafeToSellProtectionKeys(args: SafeToSellProtectionArgs): SafeToSellProtectionKey[] {
    const matches = new Set<SafeToSellProtectionKey>();

    for (const sourceId of args.acquisitionSources ?? []) {
        for (const key of classifySourceProtection(sourceId)) {
            matches.add(key);
        }
    }

    if (args.isProgenitorWeapon) {
        matches.add("progenitorWeapons");
    }

    if (args.isIncarnonItem) {
        matches.add("incarnonItems");
    }

    if (args.hasWeaponRecipeConsumers) {
        matches.add("weaponIngredients");
    }

    for (const key of classifyQuestRewardFallback(args)) {
        matches.add(key);
    }

    for (const key of classifyAssassinDropFallback(args)) {
        matches.add(key);
    }

    for (const key of classifyIncarnonFallback(args)) {
        matches.add(key);
    }

    return uniqueSorted(matches);
}

export type WeaponIngredientUse = {
    outputCatalogId: string;
    outputName: string;
    count: number;
};

export type BuildWeaponIngredientIndexArgs = {
    outputCatalogIds: string[];
    getRequirements: (outputCatalogId: string) => Array<{ catalogId: string; count: number }>;
    isWeaponCatalogId: (catalogId: string) => boolean;
    getDisplayName: (catalogId: string) => string | null | undefined;
};

export function buildWeaponIngredientIndex(args: BuildWeaponIngredientIndexArgs): Map<string, WeaponIngredientUse[]> {
    const byIngredient = new Map<string, Map<string, WeaponIngredientUse>>();

    for (const outputCatalogId of args.outputCatalogIds) {
        if (!args.isWeaponCatalogId(outputCatalogId)) continue;

        const outputName = args.getDisplayName(outputCatalogId) ?? outputCatalogId;
        const requirements = args.getRequirements(outputCatalogId);

        for (const requirement of requirements) {
            const ingredientCatalogId = String(requirement.catalogId);
            if (!args.isWeaponCatalogId(ingredientCatalogId)) continue;
            if (ingredientCatalogId === outputCatalogId) continue;

            let ingredientUses = byIngredient.get(ingredientCatalogId);
            if (!ingredientUses) {
                ingredientUses = new Map<string, WeaponIngredientUse>();
                byIngredient.set(ingredientCatalogId, ingredientUses);
            }

            const existing = ingredientUses.get(outputCatalogId);
            if (existing) {
                existing.count += Math.max(1, Math.floor(requirement.count ?? 1));
                continue;
            }

            ingredientUses.set(outputCatalogId, {
                outputCatalogId,
                outputName,
                count: Math.max(1, Math.floor(requirement.count ?? 1)),
            });
        }
    }

    const out = new Map<string, WeaponIngredientUse[]>();
    for (const [ingredientCatalogId, usesByOutputId] of byIngredient.entries()) {
        const uses = [...usesByOutputId.values()].sort((a, b) => {
            if (a.outputName !== b.outputName) return a.outputName.localeCompare(b.outputName);
            return a.outputCatalogId.localeCompare(b.outputCatalogId);
        });
        out.set(ingredientCatalogId, uses);
    }

    return out;
}
