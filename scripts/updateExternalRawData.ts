import { mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

type DatasetKey = "warframe-items" | "warframe-drop-data";

type DatasetConfig = {
    dir: string;
    baseUrl: string;
    envVar: string;
};

const DATASETS: Record<DatasetKey, DatasetConfig> = {
    "warframe-items": {
        dir: path.join(ROOT, "external/warframe-items/raw"),
        baseUrl: process.env.WARFRAME_ITEMS_RAW_BASE
            ?? "https://raw.githubusercontent.com/WFCD/warframe-items/refs/heads/master/data/json",
        envVar: "WARFRAME_ITEMS_RAW_BASE",
    },
    "warframe-drop-data": {
        dir: path.join(ROOT, "external/warframe-drop-data/raw"),
        baseUrl: process.env.WARFRAME_DROP_DATA_RAW_BASE
            ?? "https://raw.githubusercontent.com/WFCD/warframe-drop-data/refs/heads/main/data",
        envVar: "WARFRAME_DROP_DATA_RAW_BASE",
    },
};

type ParsedArgs = {
    dataset: DatasetKey | "all";
    dryRun: boolean;
    allowEmpty: boolean;
};

function parseArgs(argv: string[]): ParsedArgs {
    const datasetArg = argv.find((arg) => !arg.startsWith("--")) ?? "all";
    if (datasetArg !== "all" && datasetArg !== "warframe-items" && datasetArg !== "warframe-drop-data") {
        throw new Error(`Unknown dataset "${datasetArg}". Use one of: all, warframe-items, warframe-drop-data`);
    }

    return {
        dataset: datasetArg,
        dryRun: argv.includes("--dry-run"),
        allowEmpty: argv.includes("--allow-empty"),
    };
}

function rootKind(value: unknown): "array" | "object" | "other" {
    if (Array.isArray(value)) return "array";
    if (value && typeof value === "object") return "object";
    return "other";
}

async function readJsonInfo(filePath: string): Promise<{ bytes: number; kind: "array" | "object" | "other"; empty: boolean; raw: string }> {
    const raw = await readFile(filePath, "utf8");
    const bytes = Buffer.byteLength(raw);
    if (bytes === 0) {
        return { bytes, kind: "other", empty: true, raw };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        throw new Error(`${path.basename(filePath)} is not valid JSON: ${(error as Error).message}`);
    }

    const kind = rootKind(parsed);
    const empty =
        kind === "array"
            ? (parsed as unknown[]).length === 0
            : kind === "object"
                ? Object.keys(parsed as Record<string, unknown>).length === 0
                : false;

    return { bytes, kind, empty, raw };
}

async function runCurl(url: string, outPath: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const child = spawn(
            "curl",
            ["--fail", "--silent", "--show-error", "--location", url, "--output", outPath],
            { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
        );

        let stderr = "";
        child.stderr.on("data", (chunk) => {
            stderr += String(chunk);
        });

        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(stderr.trim() || `curl exited with code ${code}`));
        });
    });
}

async function updateDataset(key: DatasetKey, options: { dryRun: boolean; allowEmpty: boolean }): Promise<void> {
    const config = DATASETS[key];
    const files = (await readdir(config.dir))
        .filter((file) => file.endsWith(".json") && !file.startsWith("."))
        .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
        throw new Error(`No .json files found in ${config.dir}`);
    }

    const tempDir = await mkdtemp(path.join(tmpdir(), `tenno-hub-${key}-`));

    try {
        const prepared: Array<{ file: string; tempPath: string; changed: boolean }> = [];
        let changedCount = 0;

        console.log(`Updating ${key} from ${config.baseUrl}`);
        console.log(`Target directory: ${config.dir}`);
        console.log(`Override with ${config.envVar}=<raw-base-url> if needed.`);

        for (const file of files) {
            const currentPath = path.join(config.dir, file);
            const tempPath = path.join(tempDir, file);
            const url = `${config.baseUrl.replace(/\/$/, "")}/${file}`;

            await runCurl(url, tempPath);

            const [currentInfo, nextInfo] = await Promise.all([
                readJsonInfo(currentPath),
                readJsonInfo(tempPath),
            ]);

            if (nextInfo.bytes === 0) {
                throw new Error(`${file} downloaded as empty content from ${url}`);
            }
            if (!options.allowEmpty && nextInfo.empty && !currentInfo.empty) {
                throw new Error(`${file} downloaded as an empty JSON ${nextInfo.kind} from ${url}`);
            }
            if (nextInfo.kind !== currentInfo.kind) {
                throw new Error(`${file} changed root kind from ${currentInfo.kind} to ${nextInfo.kind}`);
            }
            if (currentInfo.bytes > 1024 && nextInfo.bytes < Math.floor(currentInfo.bytes * 0.1)) {
                throw new Error(
                    `${file} shrank suspiciously from ${currentInfo.bytes} bytes to ${nextInfo.bytes} bytes; refusing to overwrite`,
                );
            }

            const changed = currentInfo.raw !== nextInfo.raw;
            prepared.push({ file, tempPath, changed });
            if (changed) changedCount++;

            const status = changed ? "update" : "ok";
            console.log(`  [${status}] ${file}`);
        }

        if (options.dryRun) {
            console.log(`Dry run complete for ${key}: ${changedCount}/${files.length} files would change.`);
            return;
        }

        for (const entry of prepared) {
            if (!entry.changed) continue;
            const targetPath = path.join(config.dir, entry.file);
            await rename(entry.tempPath, targetPath);
        }

        const stampPath = path.join(config.dir, ".last-sync.json");
        await writeFile(
            stampPath,
            JSON.stringify(
                {
                    dataset: key,
                    syncedAt: new Date().toISOString(),
                    changedFiles: prepared.filter((entry) => entry.changed).map((entry) => entry.file),
                    sourceBaseUrl: config.baseUrl,
                },
                null,
                2,
            ),
            "utf8",
        );

        console.log(`Finished ${key}: ${changedCount}/${files.length} files updated.`);
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));
    const datasets = args.dataset === "all"
        ? (Object.keys(DATASETS) as DatasetKey[])
        : [args.dataset];

    for (const dataset of datasets) {
        await updateDataset(dataset, { dryRun: args.dryRun, allowEmpty: args.allowEmpty });
    }
}

main().catch((error) => {
    console.error((error as Error).message);
    process.exit(1);
});
