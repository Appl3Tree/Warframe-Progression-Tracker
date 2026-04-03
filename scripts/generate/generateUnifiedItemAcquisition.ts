import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { buildAcquisitionIndex } from "../../src/catalog/items/buildAcquisitionIndex";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUTPUT = path.join(ROOT, "src/data/_generated/item-acquisition.byCatalogId.auto.json");

async function main(): Promise<void> {
    console.log("Building unified acquisition index...");
    const acquisition = buildAcquisitionIndex();

    await writeFile(OUTPUT, JSON.stringify(acquisition, null, 2), "utf-8");
    console.log(`Done: ${Object.keys(acquisition).length} acquisition entries written to ${OUTPUT}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
