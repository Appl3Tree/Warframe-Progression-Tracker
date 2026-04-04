import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const INPUT = path.join(ROOT, "external/warframe-drop-data/raw/relics.json");
const MISSION_INPUT = path.join(ROOT, "external/warframe-drop-data/raw/missionRewards.json");
const OUTPUT = path.join(ROOT, "src/data/_generated/relics-lean.auto.json");

type RawRelicReward = {
    itemName?: string;
    rarity?: string;
    chance?: number;
};

type RawRelicEntry = {
    tier?: string;
    relicName?: string;
    state?: string;
    rewards?: RawRelicReward[];
    drops?: Array<{
        location?: string;
        place?: string;
        node?: string;
        mission?: string;
    }>;
    locations?: string[];
    dropLocations?: string[];
};

type LeanRelicReward = {
    itemName: string;
    chance: number;
};

type LeanRelicEntry = {
    tier: string;
    relicName: string;
    rewards: LeanRelicReward[];
    locations: string[];
    missions: Array<{
        pathLabel: string;
        rotation: string;
        chance: number;
    }>;
};

interface RewardEntry {
    itemName?: string;
    chance?: number;
}

interface NodeInfo {
    rewards?: Record<string, RewardEntry[]>;
}

interface MissionRewardsFile {
    missionRewards: Record<string, Record<string, NodeInfo>>;
}

function normalizeSpaces(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

function collectLocations(row: RawRelicEntry): string[] {
    const out: string[] = [];

    const push = (value: unknown): void => {
        if (typeof value !== "string") return;
        const normalized = normalizeSpaces(value);
        if (normalized) out.push(normalized);
    };

    for (const drop of row.drops ?? []) {
        push(drop?.location);
        push(drop?.place);
        push(drop?.node);
        push(drop?.mission);
    }

    for (const value of row.locations ?? []) push(value);
    for (const value of row.dropLocations ?? []) push(value);

    const seen = new Set<string>();
    const unique: string[] = [];
    for (const value of out) {
        const key = value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(value);
    }

    return unique.sort((a, b) => a.localeCompare(b));
}

function toRelicKey(tier: string, relicName: string): string {
    return `${tier.toLowerCase()} ${relicName.toLowerCase()}`;
}

function toMissionRelicKey(itemName: string): string {
    return itemName.replace(/\s+relic$/i, "").trim().toLowerCase();
}

async function main(): Promise<void> {
    console.log("Reading", INPUT);
    const parsed = JSON.parse(await readFile(INPUT, "utf-8")) as { relics?: RawRelicEntry[] } | RawRelicEntry[];
    const rows = Array.isArray(parsed) ? parsed : parsed.relics ?? [];
    console.log("Reading", MISSION_INPUT);
    const missionFile = JSON.parse(await readFile(MISSION_INPUT, "utf-8")) as MissionRewardsFile;
    const missionRewards = missionFile.missionRewards ?? {};

    const missionsByRelicKey = new Map<string, Array<{ pathLabel: string; rotation: string; chance: number }>>();

    for (const [planet, nodes] of Object.entries(missionRewards)) {
        for (const [node, info] of Object.entries(nodes ?? {})) {
            const rewards = info?.rewards;
            if (!rewards) continue;
            for (const [rotation, rewardList] of Object.entries(rewards)) {
                if (!Array.isArray(rewardList)) continue;
                for (const reward of rewardList) {
                    const name = String(reward?.itemName ?? "").trim();
                    if (!/\bRelic\b/i.test(name)) continue;
                    const relicKey = toMissionRelicKey(name);
                    const existing = missionsByRelicKey.get(relicKey) ?? [];
                    existing.push({
                        pathLabel: `missionRewards / ${planet} / ${node} / ${rotation}`,
                        rotation,
                        chance: Number(reward?.chance ?? 0),
                    });
                    missionsByRelicKey.set(relicKey, existing);
                }
            }
        }
    }

    const lean: LeanRelicEntry[] = rows
        .filter((row) => row?.tier && row?.relicName && row?.state === "Intact")
        .map((row) => ({
            tier: String(row.tier),
            relicName: String(row.relicName),
            rewards: (row.rewards ?? [])
                .filter((reward) => typeof reward?.itemName === "string" && reward.itemName.trim().length > 0)
                .map((reward) => ({
                    itemName: String(reward.itemName).trim(),
                    chance: Number(reward.chance ?? 0),
                })),
            locations: collectLocations(row),
            missions: [...(missionsByRelicKey.get(toRelicKey(String(row.tier), String(row.relicName))) ?? [])]
                .sort((a, b) => a.pathLabel.localeCompare(b.pathLabel)),
        }))
        .sort((a, b) => `${a.tier} ${a.relicName}`.localeCompare(`${b.tier} ${b.relicName}`));

    const json = JSON.stringify(lean, null, 2);
    await writeFile(OUTPUT, json, "utf-8");

    const inKB = Math.round((await readFile(INPUT)).length / 1024);
    const outKB = Math.round(Buffer.byteLength(json) / 1024);
    console.log(`Done: ${lean.length} entries, ${inKB} KB → ${outKB} KB`);
    console.log("Written to", OUTPUT);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
