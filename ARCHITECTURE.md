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
| HTML parsing | Cheerio |

---

## Directory Map

```
Warframe-Progression-Tracker/
├── src/
│   ├── app/              # Shell, routing, layout (Sidebar, Topbar)
│   │   └── layout/       # Topbar.tsx (profile pop-out), Sidebar.tsx, Shell.tsx
│   ├── pages/            # One file per page/route (14 pages)
│   │   ├── goals/        # GoalCard, GoalsTreeView, GoalsModal, goalsUtils
│   │   └── starChart/    # Star chart subcomponents (8 files)
│   ├── components/       # Page-specific composite components
│   │   ├── ExportImport.tsx        # Progress Pack UI
│   │   ├── WarframeResetTracker.tsx # Daily reset dashboard widget
│   │   └── syndicates/             # Syndicate modals, offerings grid
│   ├── ui/               # Reusable UI primitives (Badge, Card, DataTable, …)
│   │   ├── components/   # Badge, Card, Collapsible, DataTable, ProgressBar, Tabs
│   │   └── forms/        # FilePicker, SearchBox
│   ├── store/            # Zustand global store + persistence + migrations
│   ├── domain/           # Core game modeling (IDs, types, logic engines, catalog loaders)
│   │   ├── ids/          # Canonical ID enums (itemIds, nodeIds, syndicateIds, …)
│   │   ├── models/       # TypeScript interfaces (userState.ts)
│   │   ├── types/        # Shared type definitions
│   │   ├── logic/        # 16 pure logic engines
│   │   └── catalog/      # Assembled runtime catalogs
│   ├── catalog/          # Data normalization pipeline
│   │   ├── items/        # 14 acquisition adapters
│   │   ├── sources/      # Source catalog + validation
│   │   ├── prereqs/      # prereqRegistry.ts, milestoneRegistry.ts
│   │   ├── requirements/ # requirementRegistry.ts
│   │   └── syndicates/   # Syndicate rank-up and offerings data
│   ├── data/             # Raw and generated data files (~79MB)
│   │   └── _generated/   # Pre-processed outputs for faster startup
│   └── assets/           # Static assets (syndicate icons, polarity SVGs, status images, challenge badges)
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
| `store.ts` | Root store — all player state slices + 100+ action methods |
| `persistence.ts` | Serialize/deserialize store state to localStorage |
| `migrations.ts` | Upgrade stored state from older schema versions |
| `progressPack.ts` | Default state + Progress Pack import/export schemas |
| `syndicateSlice.ts` | Syndicate-specific state logic |

**State slices:**

- `player` — MR, display name, platform, account ID, clan info
- `inventory` — credits, platinum, owned item counts
- `goals` — active personal progression goals with metadata
- `syndicates` — rank, standing, pledged state per syndicate
- `missions` — node completion, Steel Path node completion
- `mastery` — XP by item, mastered items, overlevel mastered
- `challenges` — progress counts and completion flags
- `intrinsics` — Railjack and Duviri skill ranks
- `ui` — active page, expanded goal nodes

**Persistence:**
- Key: `wft_persist_v1` in `localStorage`
- Schema version: 2 (see `migrations.ts` for upgrade chain)
- Theme: `wft_theme_v1` in `localStorage` (separate from Progress Pack)
- Timezone: `wft_timezone_v1` in `localStorage`

### 7. Pages (`src/pages/`)

Each file is a full page rendered at a named route via `NAV_ROUTES` in `src/app/routes.ts`.

| Page | Route Key | Purpose |
|---|---|---|
| `Dashboard.tsx` | `dashboard` | Today's checklist, reset timers, daily task tracking |
| `Inventory.tsx` | `inventory` | Item browsing and ownership tracking across all categories |
| `Mods.tsx` | `mods` | Mods & Arcanes with drop locations, polarity icons, wiki links |
| `Challenges.tsx` | `challenges` | Achievement challenge tracking with badge images |
| `StarChart.tsx` | `starchart` | Interactive SVG star chart, node completion, drop panels |
| `Prerequisites.tsx` | `prereqs` | Quest/junction prerequisite chains and unlock gating |
| `Syndicates.tsx` | `syndicates` | Syndicate progression, rank-up modals, offerings, pledge sim |
| `Goals.tsx` | `goals` | Personal goal portfolio with dependency trees |
| `Requirements.tsx` | `requirements` | Targeted + Overlap farming view across all goals |
| `Handbook.tsx` | `handbook` | Tenno's Handbook — static educational guide for players |
| `Imports.tsx` | `imports` | Progress Pack backup/restore (Import / Export page) |
| `Settings.tsx` | `settings` | Theme, timezone, compact rows, data reset |
| `Diagnostics.tsx` | `diagnostics` | Catalog integrity tools, validation results, debug exports |
| `Intrinsics.tsx` | `intrinsics` | Railjack & Duviri intrinsic skill tracking *(not yet in nav)* |

### 8. Layout (`src/app/layout/`)

| File | Responsibility |
|---|---|
| `Shell.tsx` | Root layout wrapper; applies theme and compact-row settings on mount |
| `Sidebar.tsx` | Navigation sidebar with page links, theme toggle, support link |
| `Topbar.tsx` | Top bar with profile pop-out (MR, credits, platinum, profile import) |

**Profile Pop-out** (`Topbar.tsx`):
- Displays player MR, credits, platinum, and display name
- Inline-editable fields for MR, credits, platinum, and account ID
- Platform selector (PC, PlayStation, Xbox, Switch, Mobile)
- Warframe API profile import: paste JSON or upload HTML file
- Extracts: name, MR, credits, platinum, syndicates, inventory, missions, mastery XP

### 9. UI Library (`src/ui/`)

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
External upstream data (warframe-items, drop data, wiki HTML)
        │
        ▼
src/catalog/items/         (acquisition adapters — one per source format)
        │
        ▼
src/domain/catalog/        (assembled runtime catalog — FULL_CATALOG)
        │
        ▼
src/domain/logic/          (deterministic engines — goal expansion, planner, prereqs, overlap, …)
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
| Dev server | `npm run dev` | Vite (port 80, all interfaces) |
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

## Theme System

Theme is managed outside of the Zustand store to allow application before React renders.

| Key | Location | Values |
|---|---|---|
| `wft_theme_v1` | `localStorage` | `"dark"` (default) \| `"light"` |
| `wft_timezone_v1` | `localStorage` | IANA timezone string (default: `"UTC"`) |

**Application flow:**
1. `Shell.tsx` calls `applyTheme(getStoredTheme())` in a `useEffect` on mount
2. `applyTheme()` adds `theme-light` or `theme-dark` class to `<html>`
3. TailwindCSS class variants apply color overrides based on the root class
4. Sidebar footer also exposes a quick toggle button

> **Current status:** Light mode is partially implemented. Most UI surfaces are themed correctly but some components still use hard-coded dark colors.

---

## Icon Bundling

`syndicateIconUrl()` uses `import.meta.glob` over `src/assets/syndicates/*.png`. The bundler fingerprints each file and rewrites URLs at build time. To add an icon, drop the PNG into `src/assets/syndicates/` — no code changes needed.

---

## Deployment

The app is a fully static frontend deployed to GitHub Pages.
`npm run deploy` runs `npm run build` (via the `predeploy` hook) then publishes
the `dist/` directory to the `gh-pages` branch using the `gh-pages` package.

Cache-busting is configured in `vite.config.ts` to prevent mobile browsers from
serving stale assets after deployments.

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

The project follows a phased development plan. Key phases:

- **Phase 1** — Core scaffolding (store, routing, catalog pipeline) ✅ Done
- **Phase 2** — Canonical Data Enforcement (source IDs, legacy cleanup) ⏳ In progress
- **Phase 3** — Formal defect registry (release-blocking checks) ⏳ Planned
- **Phase 4+** — Feature expansion (Farming page refresh, Goals page refresh, full light mode, Handbook database, Diagnostics resolution, Intrinsics nav integration)
