export type QuestRewardRegistryEntry = {
    displayName: string;
    questName: string;
    rewardKind: string;
    sellableRelevant?: boolean;
    notes?: string;
};

function normalizeValue(value: string | null | undefined): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[’`]/g, "'");
}

export const QUEST_REWARD_REGISTRY: QuestRewardRegistryEntry[] = [
    { displayName: "Gara", questName: "Saya's Vigil", rewardKind: "warframe" },
    { displayName: "Gara Blueprint", questName: "Saya's Vigil", rewardKind: "warframeBlueprint" },
    { displayName: "Garuda", questName: "Vox Solaris", rewardKind: "warframe" },
    { displayName: "Garuda Blueprint", questName: "Vox Solaris", rewardKind: "warframeBlueprint" },
    { displayName: "K-Drive Launcher", questName: "Vox Solaris", rewardKind: "gear" },
    { displayName: "Yareli", questName: "The Waverider", rewardKind: "warframe" },
    { displayName: "Yareli Blueprint", questName: "The Waverider", rewardKind: "warframeBlueprint" },
    { displayName: "Xoris", questName: "The Deadlock Protocol", rewardKind: "weapon" },
    { displayName: "Protea", questName: "The Deadlock Protocol", rewardKind: "warframe" },
    { displayName: "Protea Blueprint", questName: "The Deadlock Protocol", rewardKind: "warframeBlueprint" },
    { displayName: "Odonata", questName: "The Archwing", rewardKind: "vehicle" },
    { displayName: "Imperator", questName: "The Archwing", rewardKind: "weapon" },
    { displayName: "Veritux", questName: "The Archwing", rewardKind: "weapon" },
    { displayName: "Clem Clone Blueprint", questName: "A Man of Few Words", rewardKind: "blueprint" },
    { displayName: "Exilus Adapter", questName: "A Man of Few Words", rewardKind: "upgrade" },
    { displayName: "Ether Dagger Blueprint", questName: "Stolen Dreams", rewardKind: "weaponBlueprint" },
    { displayName: "Orokin Catalyst Blueprint", questName: "Stolen Dreams", rewardKind: "upgradeBlueprint" },
    { displayName: "Limbo", questName: "The Limbo Theorem", rewardKind: "warframe" },
    { displayName: "Limbo Neuroptics Blueprint", questName: "The Limbo Theorem", rewardKind: "componentBlueprint" },
    { displayName: "Limbo Systems Blueprint", questName: "The Limbo Theorem", rewardKind: "componentBlueprint" },
    { displayName: "Limbo Chassis Blueprint", questName: "The Limbo Theorem", rewardKind: "componentBlueprint" },
    { displayName: "Chroma", questName: "The New Strange", rewardKind: "warframe" },
    { displayName: "Chroma Blueprint", questName: "The New Strange", rewardKind: "warframeBlueprint" },
    { displayName: "Mirage", questName: "Hidden Messages", rewardKind: "warframe" },
    { displayName: "Mirage Neuroptics Blueprint", questName: "Hidden Messages", rewardKind: "componentBlueprint" },
    { displayName: "Mirage Systems Blueprint", questName: "Hidden Messages", rewardKind: "componentBlueprint" },
    { displayName: "Mirage Chassis Blueprint", questName: "Hidden Messages", rewardKind: "componentBlueprint" },
    { displayName: "Inaros", questName: "Sands of Inaros", rewardKind: "warframe" },
    { displayName: "Inaros Blueprint", questName: "Sands of Inaros", rewardKind: "warframeBlueprint" },
    { displayName: "Inaros Neuroptics Blueprint", questName: "Sands of Inaros", rewardKind: "componentBlueprint" },
    { displayName: "Inaros Systems Blueprint", questName: "Sands of Inaros", rewardKind: "componentBlueprint" },
    { displayName: "Inaros Chassis Blueprint", questName: "Sands of Inaros", rewardKind: "componentBlueprint" },
    { displayName: "Atlas", questName: "The Jordas Precept", rewardKind: "warframe" },
    { displayName: "Atlas Blueprint", questName: "The Jordas Precept", rewardKind: "warframeBlueprint" },
    { displayName: "Broken War", questName: "The Second Dream", rewardKind: "weapon" },
    { displayName: "Broken Scepter", questName: "The War Within", rewardKind: "weapon" },
    { displayName: "Orvius", questName: "The War Within", rewardKind: "weapon" },
    { displayName: "Orvius Blueprint", questName: "The War Within", rewardKind: "weaponBlueprint" },
    { displayName: "Personal Quarters Segment Blueprint", questName: "The War Within", rewardKind: "shipSegmentBlueprint" },
    { displayName: "Revenant", questName: "Mask of the Revenant", rewardKind: "warframe" },
    { displayName: "Revenant Blueprint", questName: "Mask of the Revenant", rewardKind: "warframeBlueprint" },
    { displayName: "Harrow", questName: "Chains of Harrow", rewardKind: "warframe" },
    { displayName: "Harrow Blueprint", questName: "Chains of Harrow", rewardKind: "warframeBlueprint" },
    { displayName: "Nightfall Apothic Blueprint", questName: "The Silver Grove", rewardKind: "blueprint" },
    { displayName: "Twilight Apothic Blueprint", questName: "The Silver Grove", rewardKind: "blueprint" },
    { displayName: "Sunrise Apothic Blueprint", questName: "The Silver Grove", rewardKind: "blueprint" },
    { displayName: "Titania", questName: "The Silver Grove", rewardKind: "warframe" },
    { displayName: "Titania Blueprint", questName: "The Silver Grove", rewardKind: "warframeBlueprint" },
    { displayName: "Titania Neuroptics Blueprint", questName: "The Silver Grove", rewardKind: "componentBlueprint" },
    { displayName: "Titania Systems Blueprint", questName: "The Silver Grove", rewardKind: "componentBlueprint" },
    { displayName: "Titania Chassis Blueprint", questName: "The Silver Grove", rewardKind: "componentBlueprint" },
    { displayName: "Nidus", questName: "The Glast Gambit", rewardKind: "warframe" },
    { displayName: "Nidus Blueprint", questName: "The Glast Gambit", rewardKind: "warframeBlueprint" },
    { displayName: "Octavia", questName: "Octavia's Anthem", rewardKind: "warframe" },
    { displayName: "Octavia Blueprint", questName: "Octavia's Anthem", rewardKind: "warframeBlueprint" },
    { displayName: "Mandachord", questName: "Octavia's Anthem", rewardKind: "gear" },
    { displayName: "Sevagoth", questName: "Call of the Tempestarii", rewardKind: "warframe" },
    { displayName: "Sevagoth Blueprint", questName: "Call of the Tempestarii", rewardKind: "warframeBlueprint" },
    { displayName: "Paracesis", questName: "Chimera Prologue", rewardKind: "weapon" },
    { displayName: "Paracesis Blueprint", questName: "Chimera Prologue", rewardKind: "weaponBlueprint" },
    { displayName: "Sirocco", questName: "The New War", rewardKind: "weapon" },
    { displayName: "Nataruk", questName: "The New War", rewardKind: "weapon" },
    { displayName: "Rumblejack", questName: "The New War", rewardKind: "weapon" },
    { displayName: "Helminth Archon Shard Segment Blueprint", questName: "Veilbreaker", rewardKind: "shipSegmentBlueprint" },
    { displayName: "Qorvex", questName: "Whispers in the Walls", rewardKind: "warframe" },
    { displayName: "Qorvex Blueprint", questName: "Whispers in the Walls", rewardKind: "warframeBlueprint" },
    { displayName: "Grimoire", questName: "Whispers in the Walls", rewardKind: "weapon" },
    { displayName: "Melee Upgrade Segment", questName: "Whispers in the Walls", rewardKind: "shipSegment" },
    { displayName: "Melee Arcane Adapter", questName: "Whispers in the Walls", rewardKind: "upgrade" },
    { displayName: "Jade", questName: "Jade Shadows", rewardKind: "warframe" },
    { displayName: "Jade Blueprint", questName: "Jade Shadows", rewardKind: "warframeBlueprint" },
    { displayName: "Arthur's Kinepage", questName: "The Lotus Eaters", rewardKind: "gear" },
    { displayName: "Cyte-09", questName: "The Hex", rewardKind: "warframe" },
    { displayName: "Cyte-09 Blueprint", questName: "The Hex", rewardKind: "warframeBlueprint" },
    { displayName: "Magnetic Might", questName: "The Hex", rewardKind: "mod" },
    { displayName: "Atomicycle", questName: "The Hex", rewardKind: "gear" },
    { displayName: "Atomicycle Summon", questName: "The Hex", rewardKind: "gear" },
    { displayName: "Rust Belt Livery Atomicycle Skin", questName: "The Hex", rewardKind: "cosmetic" },
    { displayName: "Standard Livery Atomicycle Skin", questName: "The Hex", rewardKind: "cosmetic" },
    { displayName: "Protokol Longsword Skin", questName: "The Hex", rewardKind: "cosmetic" },
];

const QUEST_REWARD_NAME_INDEX = new Map(
    QUEST_REWARD_REGISTRY
        .filter((entry) => entry.sellableRelevant !== false)
        .map((entry) => [normalizeValue(entry.displayName), entry]),
);

export function getQuestRewardRegistryEntry(args: {
    displayName?: string;
}): QuestRewardRegistryEntry | null {
    const displayName = normalizeValue(args.displayName);
    if (!displayName) return null;
    return QUEST_REWARD_NAME_INDEX.get(displayName) ?? null;
}

export function isQuestRewardRegistryItem(args: {
    displayName?: string;
}): boolean {
    return getQuestRewardRegistryEntry(args) !== null;
}
