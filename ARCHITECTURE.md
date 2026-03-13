# Architecture & Data Pipeline

This document describes the overall structure of the Warframe Progression Tracker,
how data flows from raw upstream sources to the UI, and the responsibilities of each layer.

---

## Technology Stack

| Concern | Tool |
|---|---|
| UI | React 19 + TypeScript |
| Bundler | Vite |
| Styling | TailwindCSS 4 |
| State management | Zustand + Immer |
| Validation | Zod |
| Date utilities | date-fns |
| Deployment | GitHub Pages (`gh-pages`) |
| CLI scripts | `tsx` |

---

## Directory Map

```
Warframe-Progression-Tracker/
├── src/
│   ├── app/              # Shell, routing, layout (Sidebar, Topbar)
│   ├── pages/            # One file per page/route
│   ├── components/       # Page-specific composite components
│   ├── ui/               # Reusable UI primitives (Badge, Card, DataTable, …)
│   ├── store/            # Zustand global store + persistence + migrations
│   ├── domain/           # Core game modeling (IDs, types, logic engines, catalog loaders)
│   ├── catalog/          # Data normalization pipeline
│   ├── data/             # Raw and generated data files
│   └── assets/           # Static assets (syndicate icons, etc.)
├── external/             # Upstream datasets (warframe-items, drop data)
├── scripts/              # CLI entry points for npm run scripts
└── public/               # Public static assets (planet images)
```

---

## Layers in Detail

### 1. Raw Data (`src/data/`, `external/`)

Upstream datasets consumed by the normalization pipeline.

| Source | Location | Contents |
|---|---|---|
| warframe-items | `external/warframe-items/raw/` | Items, mods, abilities, recipes |
| Drop data | `external/warframe-drop-data/raw/` | Mission reward tables |
| Wiki HTML export | `src/data/Warframe PC Drops.html` | Drop table reference |
| Generated data | `src/data/_generated/` | Pre-processed outputs for faster startup |
| Local JSON | `src/data/items.json`, `All.json`, etc. | Curated supplemental data |

### 2. Canonical IDs (`src/domain/ids/`)

Every game entity has a stable string identifier defined here. IDs are used throughout
the entire codebase to avoid string literals and prevent mismatch bugs.

| File | Enum/Constants | Covers |
|---|---|---|
| `itemIds.ts` | `CI` | All catalog item IDs |
| `planetIds.ts` | `PL` | Planet identifiers |
| `nodeIds.ts` | `NO` | Mission node identifiers |
| `junctionIds.ts` | `JN` | Junction identifiers |
| `prereqIds.ts` | `PR` | Prerequisite gate identifiers |
| `requirementIds.ts` | `RE` | Requirement identifiers |
| `sourceIds.ts` | `SO` + `normalizeSourceId` | Acquisition source identifiers |
| `syndicateIds.ts` | `SY` | Syndicate identifiers |

### 3. Catalog Normalization (`src/catalog/`)

Translates raw upstream data into canonical acquisition and requirement models.
Each subdirectory owns a specific domain.

#### Items (`src/catalog/items/`)

Multiple source adapters, each normalizing one upstream format:

| File | Source |
|---|---|
| `acquisitionFromDropData.ts` | Drop table HTML/JSON |
| `acquisitionFromItemsJson.ts` | warframe-items JSON |
| `acquisitionFromMissionRewards.ts` | Mission reward tables |
| `acquisitionFromRelicsJson.ts` | Relic drop tables |
| `acquisitionFromClanTech.ts` | Clan research requirements |
| `acquisitionFromSources.ts` | Curated source catalog |
| `manualAcquisitionByCatalogId.ts` | Manual overrides |
| `itemAcquisition.ts` | Aggregator — merges all adapters per item |
| `itemRequirements.ts` | Crafting ingredient resolution |
| `itemsIndex.ts` | Full item index |

#### Sources (`src/catalog/sources/`)

Defines the canonical set of acquisition sources (mission types, vendors, systems).

| File | Purpose |
|---|---|
| `sourceData.ts` | Raw source definitions |
| `sourceCatalog.ts` | `SOURCE_CATALOG` array + `SOURCE_INDEX` lookup |
| `curatedSources.ts` | Hand-curated source entries |
| `validateSources.ts` | Source integrity validation logic |
| `wfItemsLocCanonical.ts` | Canonical mapping of warframe-items location strings |

#### Prerequisites (`src/catalog/prereqs/`)

| File | Purpose |
|---|---|
| `prereqRegistry.ts` | Maps each gate ID to its conditions (quests, junctions, MR) |
| `milestoneRegistry.ts` | Milestone-based unlock gates |

#### Requirements (`src/catalog/requirements/`)

| File | Purpose |
|---|---|
| `requirementRegistry.ts` | Maps requirement IDs to their definitions |

#### Syndicates (`src/catalog/syndicates/`)

| File | Purpose |
|---|---|
| `syndicateLadders_wiki.ts` | Rank-up sacrifice costs from wiki data |
| `syndicateLadders_patchOverlays.ts` | Patch-based corrections to wiki data |
| `syndicatesIndex.ts` | Aggregated syndicate catalog |

### 4. Domain Catalog Loaders (`src/domain/catalog/`)

Load and assemble the full runtime catalog from normalization outputs.

| File | Purpose |
|---|---|
| `loadFullCatalog.ts` | Assembles `FULL_CATALOG` (all item IDs, definitions) |
| `itemsCatalog.ts` | Item definition lookup |
| `starChart.ts` | Star chart assembly |
| `starChart/` | Node, planet, junction definition files |

### 5. Logic Engines (`src/domain/logic/`)

Deterministic, pure-logic modules. No React dependencies. Each models one aspect of game progression.

| File | Responsibility |
|---|---|
| `goalExpansion.ts` | Recursive expansion of a goal into all required sub-goals |
| `plannerEngine.ts` | Prioritizes and orders goal steps |
| `overlapEngine.ts` | Merges shared dependencies across multiple goals |
| `unlockGraph.ts` | Computes what completing a node/item unlocks |
| `prereqEngine.ts` | Evaluates prerequisite chains for a given player state |
| `requirementEngine.ts` | Resolves crafting resource requirements |
| `reserveEngine.ts` | Tracks player resource reserves vs. outstanding needs |
| `masteryEngine.ts` | Mastery Rank gating logic |
| `milestoneEngine.ts` | Milestone unlock gating |
| `syndicateEngine.ts` | Syndicate standing math (rank bands, days to max) |
| `syndicatePrereqs.ts` | Syndicate prerequisite resolution |
| `nodeLootIndex.ts` | Index of which nodes drop which items |
| `sourceToItemsIndex.ts` | Reverse index: source → items obtainable there |
| `starChartNodeDrops.ts` | Drop table lookup per star chart node |
| `startupValidation.ts` | Catalog integrity checks run on application startup |

### 6. Player State (`src/store/`)

Global Zustand store persisted to `localStorage`.

| File | Responsibility |
|---|---|
| `store.ts` | Root store — all player state slices (inventory, goals, syndicates, missions, reserves) |
| `persistence.ts` | Serialize/deserialize store state to localStorage |
| `migrations.ts` | Upgrade stored state from older schema versions |

**State slices:**

- `inventory` — owned items
- `goals` — active progression goals
- `syndicates` — rank, standing, pledged state per syndicate
- `missions.nodeCompleted` — completed star chart nodes
- `reserves` — tracked resource reserves
- `profile` — player profile data (MR, etc.)

### 7. Pages (`src/pages/`)

Each file is a full page rendered at a named route.

| Page | Purpose |
|---|---|
| `Dashboard.tsx` | Progress overview, quick status panels, next steps |
| `Inventory.tsx` | Item browsing and ownership tracking |
| `Goals.tsx` | Goal planning, recursive dependency expansion |
| `Prerequisites.tsx` | Prerequisite chains and unlock gating analysis |
| `Requirements.tsx` | Resource and crafting requirement breakdown |
| `StarChart.tsx` | Interactive SVG star chart, node completion tracking |
| `Syndicates.tsx` | Syndicate progression, rank-up, offerings |
| `Diagnostics.tsx` | Integrity tools, validation results |
| `Imports.tsx` | Profile import and state export/import |
| `Settings.tsx` | Application configuration |
| `Systems.tsx` | *(Planned for replacement by Handbook page)* |

### 8. UI Library (`src/ui/`)

Generic, reusable React primitives with no game-domain knowledge.

```
ui/
  components/
    Badge.tsx
    Card.tsx
    Collapsible.tsx
    DataTable.tsx
    ProgressBar.tsx
    Tabs.tsx
  forms/
    FilePicker.tsx
    SearchBox.tsx
```

---

## Data Flow Summary

```
External upstream data
        │
        ▼
src/catalog/items/         (acquisition adapters — one per source format)
        │
        ▼
src/domain/catalog/        (assembled runtime catalog — FULL_CATALOG)
        │
        ▼
src/domain/logic/          (deterministic engines — goal expansion, planner, prereqs, …)
        │
        ▼
src/store/                 (Zustand player state — persisted to localStorage)
        │
        ▼
src/pages/ + src/components/  (React UI — reads store, calls engines)
```

---

## Scripts

| Script | Command | Entry point |
|---|---|---|
| Dev server | `npm run dev` | Vite (port 80) |
| Production build | `npm run build` | `tsc -b && vite build` |
| Deploy to GitHub Pages | `npm run deploy` | `gh-pages -d dist` |
| Source validation | `npm run validate:sources` | `scripts/validateSources.cli.ts` |
| Lint | `npm run lint` | ESLint |

---

## Startup Validation

On application load, `startupValidation.ts` checks catalog integrity (duplicate IDs,
missing cross-references, etc.) and logs any issues to the console. The Diagnostics
page surfaces these results to the user.

`npm run validate:sources` runs a separate offline check of the source catalog
(curated sources present in index, leaf sources have actionable labels, no item
references a taxonomy-only parent bucket) and exits non-zero if errors are found.

---

## Deployment

The app is a fully static frontend deployed to GitHub Pages.
`npm run deploy` runs `npm run build` (via the `predeploy` hook) then publishes
the `dist/` directory to the `gh-pages` branch using the `gh-pages` package.

---

## Data Ownership

Each data domain has exactly one authoritative source. Other files must derive from or
reference the authority — never define their own copy.

| Domain | Authoritative file | What it owns |
|---|---|---|
| Item catalog IDs | `src/domain/ids/itemIds.ts` (`CI` enum) | Canonical string ID for every trackable item |
| Planet / region / hub definitions | `src/domain/catalog/starChart/planets.ts` | All `planet:`, `region:`, `hub:` IDs; name; kind; sort order |
| Mission node definitions | `src/domain/catalog/starChart/nodes.ts` | All `node:` IDs; planetId references; edges; nodeType |
| Junction prerequisites | `src/domain/catalog/starChart/nodes.ts` | `prereqIds` on each junction node |
| Prerequisite gate definitions | `src/catalog/prereqs/prereqRegistry.ts` | What each `PR.*` gate requires (quest, junction, MR) |
| Milestone gate definitions | `src/catalog/prereqs/milestoneRegistry.ts` | Milestone unlock conditions |
| Acquisition source definitions | `src/catalog/sources/curatedSources.ts` + `sourceCatalog.ts` | All `Source` entries in `SOURCE_CATALOG` |
| Source ID format | `src/domain/ids/sourceIds.ts` | `SourceId` branded type; `normalizeSourceId()` |
| Crafting requirements | `src/catalog/requirements/requirementRegistry.ts` | Ingredient lists per item |
| Syndicate rank/offering data | `src/catalog/syndicates/syndicatesIndex.ts` | Rank-up costs, offerings, vendor groupings |
| Player state schema | `src/store/store.ts` | Shape of persisted Zustand state |
| Store schema version | `src/store/migrations.ts` | Migration chain; current schema version |

### Source ID Canonical Namespaces

All source IDs must use one of these canonical prefixes:

| Prefix | Meaning | Example |
|---|---|---|
| `src:` | App-defined runtime source | `src:crafting` |
| `data:` | Data-derived source (auto-generated or curated) | `data:vendor/baro`, `data:relic/lith/a1` |

Legacy namespace prefixes (`node:`, `vendor:`, `quest:`, `market:`, etc.) pre-date
this convention. Any source ID with a legacy prefix is a defect to be migrated.
The startup validator emits a `SOURCE_ID_LEGACY_NAMESPACE` warning for each one found.

---

## Development Phases (Reference)

See the task description / project notes for the full 12-phase development plan.
Current work targets **Phase 2 — Canonical Data Enforcement**.
