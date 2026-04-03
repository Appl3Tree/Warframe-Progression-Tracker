import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const INPUT = path.join(ROOT, "external/warframe-drop-data/raw/relics.json");
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
};

type LeanRelicReward = {
    itemName: string;
    chance: number;
};

type LeanRelicEntry = {
    tier: string;
    relicName: string;
    rewards: LeanRelicReward[];
};

async function main(): Promise<void> {
    console.log("Reading", INPUT);
    const parsed = JSON.parse(await readFile(INPUT, "utf-8")) as { relics?: RawRelicEntry[] } | RawRelicEntry[];
    const rows = Array.isArray(parsed) ? parsed : parsed.relics ?? [];

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
