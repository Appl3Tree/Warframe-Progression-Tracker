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

Starts the Vite dev server with hot reload at `http://localhost:5173`.

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
| Bundler-safe icon imports | ⏳ Pending | Currently uses `import.meta.env.BASE_URL` string paths; needs bundler import map |
| Rank titles | ⏳ Pending | Field exists in types; data not yet populated |
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

### Star Chart

| Feature | Status | Notes |
|---|---|---|
| Interactive map with planet navigation | ⏳ Planned | |
| Node-level completion tracking | ⏳ Planned | |
| Junction requirements and unlock visualization | ⏳ Planned | |
| Node/junction impact preview | ⏳ Planned | |

### Item Progression

| Feature | Status | Notes |
|---|---|---|
| Full item catalog (Warframes, weapons, companions, vehicles) | ⏳ Planned | |
| Item availability based on player progress | ⏳ Planned | |
| Acquisition and requirement breakdown per item | ⏳ Planned | |
| Bulk progress updates | ⏳ Planned | |

### Mastery Rank

| Feature | Status | Notes |
|---|---|---|
| Track mastered vs unmastered items | ⏳ Planned | |
| Mastery backlog view (owned but not mastered) | ⏳ Planned | |
| Mastery forecasting ("if I master these, I reach MR X") | ⏳ Planned | |
| Mastery-efficient next step surfacing | ⏳ Planned | |

### Goal Planning

| Feature | Status | Notes |
|---|---|---|
| Add Warframes/weapons/items as goals | ⏳ Planned | |
| "Available now" filtering for goal selection | ⏳ Planned | |
| Multi-goal planning with shared dependency merging | ⏳ Planned | |
| "Almost there" surfacing for near-term unlocks | ⏳ Planned | |
| Ordering assistance for parallel paths | ⏳ Planned | |

### "What Should I Do Next?"

| Feature | Status | Notes |
|---|---|---|
| Suggested next actions (unlock impact, goal proximity, mastery) | ⏳ Planned | |
| "If I do this, what changes?" impact previews | ⏳ Planned | |
| Session planning modes (short vs. long sessions) | ⏳ Planned | |

### Profile Import

| Feature | Status | Notes |
|---|---|---|
| Platform selection + public profile import | ⏳ Planned | |
| Ownership and mastery awareness from import | ⏳ Planned | |
| Import preview + merge options | ⏳ Planned | |

### Safety & Recovery

| Feature | Status | Notes |
|---|---|---|
| Revision history with restore capability | ⏳ Planned | |
| Named restore points | ⏳ Planned | |
| What-if planning (simulate without committing) | ⏳ Planned | |

### Usability

| Feature | Status | Notes |
|---|---|---|
| Global search | ⏳ Planned | |
| Pins/bookmarks for active goals | ⏳ Planned | |
| Keyboard navigation | ⏳ Planned | |
| Density controls (compact / spacious) | ⏳ Planned | |
| Export (checklist / markdown / JSON / screenshot) | ⏳ Planned | |

---

## Architecture Notes

### Data Layers

The Syndicates feature has three distinct layers:

| Layer | File | Purpose |
|---|---|---|
| Static UI catalog | `SyndicatesGrid.tsx` → `CANONICAL_SYNDICATES` | Names, tabs, colors, relationships, icon filenames |
| Player overlay | `store/store.ts` → `state.syndicates` | Rank, standing, pledged state (persisted via Zustand) |
| Vendor/rank-up catalog | `domain/catalog/syndicates/` | Rank-up sacrifice costs, offerings lists, vendor groupings |

### Key Files

```
src/
  components/
    SyndicatesGrid.tsx          # Syndicate page — canonical list, card grid, pledge panel
    SyndicateDetailsModal.tsx   # Drilldown modal — rank-up transitions, offerings list
  domain/
    catalog/syndicates/
      syndicateVendorCatalog.ts # Types + aggregated catalog (getSyndicateVendorEntry)
      vendorEntries/            # Per-syndicate rank-up and offering data
    syndicates/
      ownedOfferings.ts         # Shared utility: owned-map read/write, countOwned
    ids/
      syndicateIds.ts           # SY enum — canonical ID constants
  store/
    store.ts                    # Zustand store — player state, pledge logic, reserve system
```

### Pending Architecture Work

- **Bundler-safe icons**: `syndicateIconUrl()` currently builds runtime strings from `import.meta.env.BASE_URL`. The correct Vite pattern is a `SYNDICATE_ICON_URLS: Record<SyndicateId, string>` map using static `import` statements so the bundler fingerprints and rewrites them. This eliminates deploy/base-path breakage.
- **Rank titles**: `rankLabel` exists in `SyndicateState` types but there is no data map yet. The plan is a typed skeleton const in its own file with UI hooks that render titles only when data is present.

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
