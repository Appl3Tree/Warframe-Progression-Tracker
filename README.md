# Warframe Progression Tracker

A **progression planning tool for Warframe** that helps players decide what to work on next and understand why things are blocked.

Warframe's progression is spread across quests, the Star Chart, junctions, Mastery Rank, syndicates, and item unlocks. This app brings those systems into a single view so players can plan without spreadsheets or constant wiki-hopping.

---

## What It Does

- Identifies **high-impact progression goals**
- Explains **what is blocking you and why**
- Shows **what each step unlocks**
- Helps plan multiple goals without redundant work

## What It Is Not

- A DPS calculator or build optimizer
- A trading or economy tool
- A replacement for the official Warframe profile

---

## Running Locally

```bash
npm install
npm run dev
```

Starts the Vite dev server with hot reload at `http://localhost:80`.

---

## Feature Status

### Syndicates

| Feature | Status | Notes |
|---|---|---|
| Tabbed syndicate grid | ✅ Done | Primary, Cetus, Fortuna, Necralisk, Chrysalith, 1999, Misc, Other |
| Per-card rank input | ✅ Done | Select for small ranges; number input for large ranges (e.g. Nightwave 0–180) |
| Per-card standing input | ✅ Done | Faction syndicates support negative ranks (−2..5) |
| Daily standing cap | ✅ Done | Derived from player Mastery Rank |
| Standing to max rank | ✅ Done | Live estimate; accounts for negative-rank escape math |
| Estimated days to max | ✅ Done | `standingToMax ÷ dailyCap`, rounded up |
| Currency reminder | ✅ Done | Shows syndicate-specific currencies (e.g. Nightwave Creds) |
| "Ranks" button → rank-up modal | ✅ Done | Rank-up transition list with cost checklist |
| Completed transitions hidden | ✅ Done | Transitions below player rank are hidden; "Show completed (N)" toggle |
| "View Offerings" button | ✅ Done | Opens offerings tab in modal |
| "Missing: X/Y" button | ✅ Done | Opens offerings tab pre-filtered to unowned items |
| Faction relationship display | ✅ Done | Allied / Opposed / Enemy relationship pills per card |
| Pledge selector (primary syndicates) | ✅ Done | Up to 3 pledged at once with enforcement |
| Conflict simulation / pledge recommendations | ✅ Done | Matrix scoring over all valid pledge combos; triple-chain and cross-chain recommendations with Apply |
| Bundler-safe icon imports | ✅ Done | `import.meta.glob` map in `SyndicatesGrid.tsx`; drop PNGs into `src/assets/syndicates/` to activate |
| Kahl's Garrison weeks-to-max ETA | ✅ Done | Standalone block below Caps; `5 − rank` weeks at 1 mission per week |
| Rank titles | ✅ Done | `getRankTitle()` in `rankTitles.ts`; covers all 22 syndicates; displayed below rank selector |
| Nightwave max rank (180) | ✅ Done | 30 normal + 150 prestige ranks |
| Nightcap flavor text | ✅ Done | Corrected to Solaris/Fortuna Airlock vendor |

### Offerings Modal

| Feature | Status | Notes |
|---|---|---|
| Offerings list with search/filter/sort | ✅ Done | Filter by owned, rank, vendor; sort by rank/name/standing |
| Owned item tracking | ✅ Done | Per-syndicate localStorage; shared utility in `src/domain/syndicates/ownedOfferings.ts` |
| Open pre-filtered from grid | ✅ Done | `initialTab`, `initialOwnedFilter`, `initialSortKey`, `initialMaxRank`, `initialVendorId` props |
| Summary panel (total costs for filtered set) | ✅ Done | Credits, standing, currencies, items |
| Player rank passed into modal | ✅ Done | Used to dim/hide completed rank-up transitions |
| Remaining rank-up cost summary | ✅ Done | Summary panel sums only transitions still ahead of player rank; label reads "Remaining Cost (Rank N → Max)" |

### Star Chart

| Feature | Status | Notes |
|---|---|---|
| Interactive SVG map with pan/zoom | ✅ Done | Drag to pan, wheel to zoom, click planet to zoom in; full-screen modal via "Open Map" |
| Planet disk expansion on zoom | ✅ Done | Planet disks expand as you zoom in, revealing mission nodes; neighbor-distance capping prevents overlap |
| Node-level completion tracking | ✅ Done | Checkbox per node stored in `store.state.missions.nodeCompleted`; persisted in localStorage |
| Drop panel per node | ✅ Done | Tabbed (Drops / Mission Rewards / Caches); exclusive item assignment per tab; item dedup by display name |
| Junction nodes with prereq inspector | ✅ Done | 17 junctions defined (full chain Mercury→Eris + Lua + Kuva Fortress); prereqs shown in the panel |
| Junction prereq chain | ✅ Done | `prereqIds.ts` + `prereqRegistry.ts` model each junction's quest and prior-junction requirements |
| Node/junction impact preview | ⏳ Planned | "If I complete this junction, what unlocks?" not yet surfaced |

### Inventory

| Feature | Status | Notes |
|---|---|---|
| Item browsing across Warframes, weapons, companions, vehicles | ✅ Done | Powered by multi-source catalog |
| Ownership tracking | ✅ Done | Per-item ownership state persisted via Zustand |
| Acquisition breakdown per item | ✅ Done | `itemAcquisition.ts` normalizes multiple upstream sources |
| Prerequisite chain display | ✅ Done | Quest/junction gate modeling via `prereqEngine.ts` |
| Resource requirement breakdown | ✅ Done | `requirementEngine.ts` models crafting ingredients |

### Goal Planning

| Feature | Status | Notes |
|---|---|---|
| Add items as progression goals | ✅ Done | Goals page with recursive dependency expansion |
| Multi-goal planning with shared dependency merging | ✅ Done | `overlapEngine.ts` merges shared sub-goals |
| Goal expansion explanation | ✅ Done | `goalExpansion.ts` shows why each node is included |
| Planner prioritization | ✅ Done | `plannerEngine.ts` surfaces next steps |
| "Almost there" surfacing | ⏳ Planned | |
| Session planning modes (short vs. long sessions) | ⏳ Planned | |

### Prerequisites & Unlock Graph

| Feature | Status | Notes |
|---|---|---|
| Quest and junction gate modeling | ✅ Done | `prereqRegistry.ts` + `prereqEngine.ts` |
| Prerequisite chain display | ✅ Done | Prerequisites page with collapsible chain view |
| Unlock graph (what does completing X unlock?) | ✅ Done | `unlockGraph.ts` |
| Mastery Rank gating | ✅ Done | `masteryEngine.ts` |
| Milestone gating | ✅ Done | `milestoneEngine.ts` + `milestoneRegistry.ts` |

### Resources & Requirements

| Feature | Status | Notes |
|---|---|---|
| Crafting resource requirements per item | ✅ Done | Requirements page + `requirementEngine.ts` |
| Resource aggregation across goals | ✅ Done | `reserveEngine.ts` manages tracked reserves |
| Farming location lookup | ✅ Done | `nodeLootIndex.ts` + `starChartNodeDrops.ts` |
| Source-to-items index | ✅ Done | `sourceToItemsIndex.ts` |

### Import / Export

| Feature | Status | Notes |
|---|---|---|
| JSON export/import of player state | ✅ Done | `ExportImport.tsx` + Imports page |
| Schema migration on load | ✅ Done | `migrations.ts` handles version upgrades |
| Import preview + merge options | ⏳ Planned | |
| Platform profile import | ⏳ Planned | |

### Diagnostics

| Feature | Status | Notes |
|---|---|---|
| Startup validation of catalog integrity | ✅ Done | `startupValidation.ts` runs on app load |
| Source catalog validation | ✅ Done | `validate:sources` npm script + `validateSources.ts` |
| Diagnostics page with integrity tools | ✅ Done | |
| Defect registry (release-blocking checks) | ⏳ Planned | Phase 3 |

### Mastery Rank

| Feature | Status | Notes |
|---|---|---|
| Daily standing cap derived from MR | ✅ Done | Used in syndicate calculations |
| Mastery engine (MR gating logic) | ✅ Done | `masteryEngine.ts` |
| Track mastered vs unmastered items | ⏳ Planned | |
| Mastery forecasting ("if I master these, I reach MR X") | ⏳ Planned | |

### Usability

| Feature | Status | Notes |
|---|---|---|
| Persistent player state | ✅ Done | Zustand + localStorage via `persistence.ts` |
| Reset tracker (daily/weekly reset awareness) | ✅ Done | `WarframeResetTracker.tsx` |
| Export (JSON) | ✅ Done | |
| Global search | ⏳ Planned | |
| Keyboard navigation | ⏳ Planned | |
| Export (checklist / markdown / screenshot) | ⏳ Planned | |

---

## Architecture Notes

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture and data pipeline documentation.

### Data Layers

The application separates concerns into three broad layers:

| Layer | Location | Purpose |
|---|---|---|
| Raw data | `src/data/`, `external/` | Upstream datasets (warframe-items, drop data, wiki exports) |
| Catalog / normalization | `src/catalog/`, `src/domain/catalog/` | Translate raw data into canonical acquisition/requirement models |
| Logic engines | `src/domain/logic/` | Deterministic reasoning about progression |
| Player state | `src/store/` | Persisted Zustand store (inventory, goals, syndicate state, missions) |
| UI | `src/pages/`, `src/components/`, `src/ui/` | React pages and components |

### Syndicate Data Layers

| Layer | File | Purpose |
|---|---|---|
| Static UI catalog | `SyndicatesGrid.tsx` → `CANONICAL_SYNDICATES` | Names, tabs, colors, relationships, icon filenames |
| Player overlay | `store/store.ts` → `state.syndicates` | Rank, standing, pledged state (persisted via Zustand) |
| Vendor/rank-up catalog | `domain/catalog/syndicates/` | Rank-up sacrifice costs, offerings lists, vendor groupings |

### Key Files

```
src/
  domain/
    ids/                        # Canonical ID constants (itemIds, nodeIds, syndicateIds, …)
    logic/
      goalExpansion.ts          # Recursive goal dependency expansion
      unlockGraph.ts            # What does completing X unlock?
      prereqEngine.ts           # Quest/junction prerequisite chains
      requirementEngine.ts      # Crafting resource requirements
      plannerEngine.ts          # Goal-based progression planning
      masteryEngine.ts          # Mastery Rank gating
      syndicateEngine.ts        # Standing and rank progression math
      startupValidation.ts      # Catalog integrity checks on load
    catalog/
      loadFullCatalog.ts        # Assembles the full item catalog at runtime
      starChart/                # Node, planet, junction definitions
  catalog/
    items/                      # Acquisition normalization (14 source adapters)
    sources/                    # Source catalog + validateSources.ts
    prereqs/                    # prereqRegistry.ts, milestoneRegistry.ts
    requirements/               # requirementRegistry.ts
    syndicates/                 # Syndicate rank-up and offerings data
  store/
    store.ts                    # Global Zustand store
    persistence.ts              # localStorage persistence layer
    migrations.ts               # Schema version migrations
  scripts/
    validateSources.cli.ts      # CLI entry point for `npm run validate:sources`
```

### Icon Bundling

`syndicateIconUrl()` uses `import.meta.glob` over `src/assets/syndicates/*.png`. The bundler fingerprints each file and rewrites URLs at build time. To add an icon, drop the PNG into `src/assets/syndicates/` — no code changes needed.

### Deployment

The app is deployed as a static site to GitHub Pages via `npm run deploy` (runs build then `gh-pages -d dist`).

---

## Syndicate Standing Math

### Faction syndicates (ranks −2..5)

| Rank | Band cap |
|---|---|
| 5 | 132,000 |
| 4 | 99,000 |
| 3 | 70,000 |
| 2 | 44,000 |
| 1 | 22,000 |
| 0 | 5,000 |
| −1 | 0 |
| −2 | 0 |

**Standing to max** = standing needed to earn from current position to 132,000 at Rank 5.
For negative ranks: first escape to 0 standing (earn `|current standing|`), then climb the full 0→5 ladder.

### Nightwave (ranks 0–180)

- Ranks 1–30: normal ranks earned via Acts
- Ranks 31–180: prestige ranks (15 Nightwave Creds per prestige rank)
- No daily standing cap

---

*Warframe and all related assets are property of Digital Extremes. This project is for personal and educational use.*
