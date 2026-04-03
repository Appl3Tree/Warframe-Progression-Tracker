# Phase 1 Ecosystem Map

## Inventory Blueprint

Inventory is the reference ledger surface.

### Layout blueprint

1. Utility band
   - Left card: search plus high-value state toggles
   - Right card: sort plus fast utility actions
2. Workspace shell
   - Top mode rail
   - Conditional refinement rail
   - Compact results/header band
   - Dense ledger region as the dominant surface
3. Ledger behavior
   - The list owns the remaining vertical space
   - Filter changes should not resize the whole page
   - Horizontal overflow is handled inside the table region, not by breaking layout

### Data blueprint

- Source of truth: `FULL_CATALOG`
- Supplemental visibility:
  - Star Chart-derived collection items
  - wiki blueprint-referenced items
- Ownership source:
  - `state.inventory.counts`
- Mastery source:
  - `state.mastery.mastered`
  - `state.mastery.overLevelMastered`
- Planning linkage:
  - `state.goals`

### Filtering blueprint

- Global search runs against:
  - display name
  - id
  - aliases
  - categories
- Top-level category selection is single-select
- Category-specific refinement is contextual
- Table-scoped filters stay near the ledger

### Mobile blueprint

- Search/sort cards stack
- Mode and refinement rails scroll horizontally when needed
- The ledger remains the main vertical surface
- High-density columns overflow within the ledger region rather than collapsing features

## Phase 0 Structural Refactor

### Route split

Collection mode now has four first-class destinations:

- `Inventory`
- `Mods`
- `Arcanes`
- `Star Chart`

### Mods page

- Uses the Inventory shell pattern:
  - search/sort utility band
  - group rail
  - contextual refinement band
  - compact results band
  - fixed ledger region
- State is isolated to mod-specific concerns:
  - group
  - subtype filters
  - special-slot filters
  - polarity filters
  - parazon filters
  - query
  - sort
  - ownership
  - selected mod
  - custom riven editing
- Persistent data dependencies:
  - `state.inventory.counts`
  - `state.inventory.modRanks`
  - `state.inventory.customRivens`

### Arcanes page

- Uses the same Inventory shell pattern
- State is isolated to arcane-specific concerns:
  - category filters
  - query
  - sort
  - ownership
  - selected arcane
- Persistent data dependencies:
  - `state.inventory.arcaneRanks`
  - `state.inventory.counts` as compatibility fallback

### Separation guarantees

- `Mods` and `Arcanes` no longer share a page-level mode toggle
- Each page mounts its own local state model
- Filter/search/sort state from one page does not mutate or bleed into the other
- Shared code remains at the helper/data layer, not at the page-state layer

## New Ecosystem Interactions

### Mods interactions

- Writes owned mod counts and max-rank state used by build planning
- Writes custom rivens used by optimizer/build workflows
- Reads acquisition/drop metadata for detail panels
- Acts as the canonical browse/edit surface for mod ownership and riven inventory

### Arcanes interactions

- Writes arcane rank-count distributions used by inventory tracking and future build validation
- Reads arcane catalog metadata and drop/acquisition data
- Acts as the canonical browse/edit surface for arcane ownership and rank state

### Shared collection interactions

- `Inventory` remains the broad ledger
- `Mods` becomes the upgrade catalog and owned-mod surface
- `Arcanes` becomes the arcane catalog and rank-tracking surface
- `Star Chart` remains the source/reward explorer

## App Logic Summary

The app is organized around one persisted player state tree in Zustand plus domain adapters around Warframe source data.

### Core state domains

- `player`
- `inventory`
- `goals`
- `prereqs`
- `missions`
- `mastery`
- `worldState`
- `modBuilder`

### Core page families

- Command
  - daily status and live intel
- Progression
  - long-horizon advancement and unlocks
- Collection
  - ownership, source research, and upgrade cataloging
- Planning
  - build, relic, and farming decisions
- System
  - import/export, preferences, diagnostics

## Page Intent And Critical Path

### Command

- `Dashboard`
  - Goal: show what matters now
  - Critical path: scan status -> jump into action page

- `World State`
  - Goal: operational live-data view
  - Critical path: filter live events -> inspect details -> pivot to relevant task

### Progression

- `Goals`
  - Goal: track target items and completion trees
  - Critical path: review goals -> inspect blockers -> jump to Inventory or Farming

- `Prerequisites`
  - Goal: show unlock dependencies
  - Critical path: inspect requirement -> mark/plan next unlock -> pivot to related system

- `Syndicates`
  - Goal: manage standing and offering progression
  - Critical path: inspect faction -> review standings/offers -> decide next spend or grind

- `Intrinsics`
  - Goal: track intrinsic rank progression
  - Critical path: inspect trees -> update owned ranks -> review remaining targets

- `Challenges`
  - Goal: browse and mark long-tail challenge progress
  - Critical path: filter challenge set -> inspect completion -> update progress

- `Handbook`
  - Goal: provide curated system guidance
  - Critical path: find topic -> read guidance -> pivot into the relevant operational page

### Collection

- `Inventory`
  - Goal: manage the full owned-item ledger
  - Critical path: search/filter -> update owned state -> inspect detail -> optionally set goal

- `Mods`
  - Goal: manage owned mods, ranks, and rivens
  - Critical path: search/filter -> inspect mod/riven -> update ownership/rank -> return to build planning or collection work

- `Arcanes`
  - Goal: manage owned arcane ranks and acquisition visibility
  - Critical path: search/filter -> inspect arcane -> update rank counts -> return to build planning or collection work

- `Star Chart`
  - Goal: reveal node rewards and source provenance
  - Critical path: select planet/node -> inspect rewards -> mark owned or pivot to target page

### Planning

- `Farming`
  - Goal: turn goals into actionable farming routes
  - Critical path: select target -> inspect sources -> jump to Star Chart or Relics

- `Relic Planner`
  - Goal: plan fissure runs for target prime rewards
  - Critical path: choose target -> inspect relics and drop math -> decide run target

- `Build Planner`
  - Goal: build and optimize weapon configurations
  - Critical path: configure weapon -> inspect outputs -> compare assumptions/results

### System

- `Import / Export`
  - Goal: move player data safely
  - Critical path: import/export -> verify merge state -> return to working page

- `Settings`
  - Goal: control app behavior and presentation
  - Critical path: change preference -> verify effect

- `Diagnostics`
  - Goal: inspect data and logic health
  - Critical path: run/scan diagnostics -> identify problem -> return to source page or data layer

## Phase 0 Verification

- Typecheck: `tsc -b`
- Unit tests: `npm test`
- Production build: `npm run build`
- Route sanity:
  - Collection routes now resolve to `Inventory`, `Mods`, `Arcanes`, `Star Chart`

## Current Understanding

The app is a single-state Warframe operations suite. Collection pages are not just reference pages; they are edit surfaces that feed planning and optimization. Inventory is the right visual reference because it is already closest to the correct operational model:

- one utility band
- one ledger shell
- contextual refinement
- dense list as the dominant surface

The new `Mods` and `Arcanes` pages now follow that same structural model, but each page owns its own local state and its own domain-specific filters. That is the foundation needed before a full responsive and zero-regression audit.
