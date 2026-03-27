/**
 * generateRelicMissionIndex.ts
 *
 * Source: external/warframe-drop-data/raw/missionRewards.json
 * Output: src/data/_generated/relic-missionRewards-index.auto.json
 *
 * Extracts every relic drop from the mission rewards table and builds a flat
 * array of { relicKey, relicDisplay, pathLabel, rotation, chance } entries
 * for fast lookup in relicCatalog.ts.
 *
 * relicKey is the lowercased relic name without the "Relic" suffix,
 * e.g. "Lith D7 Relic" → "lith d7"
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const INPUT  = path.join(ROOT, "external/warframe-drop-data/raw/missionRewards.json");
const OUTPUT = path.join(ROOT, "src/data/_generated/relic-missionRewards-index.auto.json");

interface RewardEntry {
    _id?: string;
    itemName?: string;
    rarity?: string;
    chance?: number;
}

interface NodeInfo {
    gameMode?: string;
    isEvent?: boolean;
    rewards?: Record<string, RewardEntry[]>;
}

interface MissionRewardsFile {
    missionRewards: Record<string, Record<string, NodeInfo>>;
}

function toRelicKey(itemName: string): string {
    return itemName.replace(/\s+relic$/i, "").trim().toLowerCase();
}

async function main(): Promise<void> {
    console.log("Reading", INPUT);
    const file: MissionRewardsFile = JSON.parse(await readFile(INPUT, "utf-8"));
    const missionRewards = file.missionRewards;

    const rows: Array<{
        relicKey: string;
        relicDisplay: string;
        pathLabel: string;
        rotation: string;
        chance: number;
    }> = [];

    for (const [planet, nodes] of Object.entries(missionRewards)) {
        for (const [node, info] of Object.entries(nodes)) {
            const rewards = info.rewards;
            if (!rewards) continue;

            for (const [rotation, rewardList] of Object.entries(rewards)) {
                if (!Array.isArray(rewardList)) continue;

                for (const reward of rewardList) {
                    const name = reward.itemName?.trim() ?? "";
                    if (!name.match(/\bRelic\b/i)) continue;

                    rows.push({
                        relicKey:    toRelicKey(name),
                        relicDisplay: name,
                        pathLabel:   `missionRewards / ${planet} / ${node} / ${rotation}`,
                        rotation,
                        chance:      reward.chance ?? 0,
                    });
                }
            }
        }
    }

    const json = JSON.stringify(rows, null, 2);
    await writeFile(OUTPUT, json, "utf-8");
    console.log(`Done: ${rows.length} relic drop entries written to ${OUTPUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
