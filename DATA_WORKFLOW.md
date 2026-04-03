# Data Workflow

This repo now has a safer split between:

- raw external source data in `external/`
- generated app-ready data in `src/data/_generated/`

## Main flows

### 1. Refresh WFCD raw data

Use these when you want to pull the latest raw JSON files from the upstream WFCD repositories.

- `npm run update:data:check`
  - Dry run only.
  - Shows what would change without overwriting files.

- `npm run update:data`
  - Updates both raw datasets:
    - `external/warframe-items/raw/`
    - `external/warframe-drop-data/raw/`

- `npm run update:data:warframe-items`
  - Updates only `external/warframe-items/raw/`

- `npm run update:data:drop-data`
  - Updates only `external/warframe-drop-data/raw/`

Safety behavior:

- downloads into a temp directory first
- validates JSON before replacing anything
- rejects empty downloads
- rejects root-type changes like `array` to `object`
- rejects suspicious file shrinkage
- only overwrites after the full dataset passes validation

Optional base URL overrides:

- `WARFRAME_ITEMS_RAW_BASE=... npm run update:data:warframe-items`
- `WARFRAME_DROP_DATA_RAW_BASE=... npm run update:data:drop-data`

## 2. Regenerate derived app data

Use this after raw data changes.

- `npm run generate:data`

This rebuilds the main generated artifacts in `src/data/_generated/`, including:

- `items-lean.auto.json`
- `mods-lean.auto.json`
- `wfcd-items.byCatalogId.auto.json`
- `wfcd-requirements.byCatalogId.auto.json`
- `relic-missionRewards-index.auto.json`
- `item-acquisition.byCatalogId.auto.json`
- source label and acquisition outputs

## 3. One-step refresh

If you want the normal full pipeline:

- `npm run refresh:data`

This does:

1. update raw data
2. regenerate derived data

## 4. Convert wiki blueprint data

The wiki blueprint dump is stored as a Lua-style source artifact:

- `external/wiki/blueprintsDatabase.txt`

Convert it into generated JSON with:

- `npm run generate:wiki-blueprints`

Output:

- `src/data/_generated/wiki-blueprints.auto.json`

Notes:

- keep the raw wiki dump untouched
- treat the generated JSON as the app-facing format
- the converter handles Lua table syntax and inline `--` comments

## Recommended routine

For a normal data refresh:

1. `npm run update:data:check`
2. `npm run update:data`
3. `npm run generate:data`
4. optionally `npm run generate:wiki-blueprints`
5. `./node_modules/.bin/tsc -b`

## Current caveats

- `generateWfcdAcquisition.ts` currently logs zero acquisition entries from `syndicates.json`
- that is currently acceptable because syndicate offerings are handled elsewhere in the app
- wiki blueprint conversion is separate from the main `generate:data` pipeline for now
