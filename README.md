# Warframe Progression Tracker

A **progression planning tool for Warframe** that helps players decide what to work on next, understand what is blocking them, and farm efficiently across multiple goals at once.

Warframe's progression is spread across quests, the Star Chart, junctions, Mastery Rank, syndicates, mods, challenges, Railjack, and item unlocks. This app brings those systems into a single view so players can plan without spreadsheets or constant wiki-hopping.

---

## What It Does

- Identifies **high-impact progression goals**
- Explains **what is blocking you and why**
- Shows **what each step unlocks**
- Helps plan multiple goals without redundant work
- Tracks **syndicates, mods, arcanes, challenges, intrinsics, and daily resets**
- Imports from your **official Warframe profile** for automatic inventory sync
- Exports and imports a **Progress Pack** (full state backup) for cross-device use

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

## Pages & Features

### Dashboard

The landing page showing today's actionable items and reset awareness.

| Feature | Status | Notes |
|---|---|---|
| Daily reset checklist | ✅ Done | Configurable task list tied to reset timers |
| Reset timer display (UTC / Local) | ✅ Done | Supports 20+ timezone configurations |
| Daily / weekly / Nightwave reset awareness | ✅ Done | Color-coded timer rings |
| Compact row toggle | ✅ Done | Applies globally via `data-compact` attribute |

---

### Inventory

Full item catalog with ownership tracking across Warframes, weapons, companions, vehicles, and resources.

| Feature | Status | Notes |
|---|---|---|
| Browsing across all item categories | ✅ Done | Tabs: Warframes, Primary, Secondary, Melee, Companions, Vehicles/Mech, Resources, Other |
| Ownership tracking per item | ✅ Done | Counts persisted via Zustand |
| Acquisition breakdown per item | ✅ Done | Multi-source normalization via 14 catalog adapters |
| Prerequisite chain display | ✅ Done | Quest/junction gating shown per item |
| Crafting requirements per item | ✅ Done | Ingredient breakdown via `requirementEngine.ts` |
| Profile import sync | ✅ Done | Bulk-populates inventory from Warframe API response |
| Compact row mode | ✅ Done | Toggled globally from sidebar or Settings |

---

### Mods & Arcanes

Browse all mods and arcanes with drop locations, polarity icons, rarity colors, and wiki links.

| Feature | Status | Notes |
|---|---|---|
| Mod browsing with category filters | ✅ Done | By polarity, rarity, category (Exilus, Aura, Stance, etc.) |
| Arcane browsing with tier/rarity | ✅ Done | Separate tab from mods |
| Drop locations per mod/arcane | ✅ Done | Including enemy wiki links when available |
| Status & polarity SVG icons | ✅ Done | Per-mod visual indicators |
| Mod categorization (Exilus, Aura, Stance, etc.) | ✅ Done | Filterable |
| Synthesis target display | ✅ Done | Cephalon Simaris synthesis targets linked |
| Wiki links | ✅ Done | Per-item external link to Warframe Wiki |
| Owned tracking | ✅ Done | Toggle owned/unowned per mod |

---

### Challenges

Track in-game achievement challenges with progress counters and completion status.

| Feature | Status | Notes |
|---|---|---|
| Full challenge list | ✅ Done | All known challenges with badge images |
| Progress counter per challenge | ✅ Done | Persisted per-challenge counts |
| Completion tracking | ✅ Done | Mark as complete, filter by status |
| Challenge badge images | ✅ Done | Visual badges for all achievement challenges |
| Lotus path → human-readable name mapping | ✅ Done | Full dictionary covering all challenge IDs |

---

### Star Chart

Interactive SVG map of the Warframe star chart with node-level completion tracking and drop data.

| Feature | Status | Notes |
|---|---|---|
| Interactive SVG map with pan/zoom | ✅ Done | Drag to pan, wheel to zoom, click planet to zoom in; full-screen modal |
| Planet disk expansion on zoom | ✅ Done | Nodes reveal as you zoom in; distance-capping prevents overlap |
| Node-level completion tracking | ✅ Done | Per-node checkbox persisted in store |
| Drop panel per node | ✅ Done | Tabbed: Drops / Mission Rewards / Caches; deduped by display name |
| Junction nodes with prereq inspector | ✅ Done | 17 junctions defined (Mercury→Eris + Lua + Kuva Fortress) |
| Junction prereq chain | ✅ Done | Quest and prior-junction requirements modeled |
| Node data from WFCD | ✅ Done | Star chart nodes sourced from Warframe Community Developers API |
| Node/junction impact preview | ⏳ Planned | "If I complete this junction, what unlocks?" |

---

### Prerequisites

Quest chain viewer and junction prerequisite tracker.

| Feature | Status | Notes |
|---|---|---|
| Quest and junction gate modeling | ✅ Done | `prereqRegistry.ts` + `prereqEngine.ts` |
| Prerequisite chain display | ✅ Done | Collapsible chain view per item |
| Unlock graph | ✅ Done | `unlockGraph.ts` — what completing X unlocks |
| Mastery Rank gating | ✅ Done | `masteryEngine.ts` |
| Milestone gating | ✅ Done | `milestoneEngine.ts` + `milestoneRegistry.ts` |

---

### Syndicates

Full syndicate progression tracking with standing math, rank-up modals, offerings, and pledge simulation.

| Feature | Status | Notes |
|---|---|---|
| Tabbed syndicate grid | ✅ Done | Primary (8), Cetus, Fortuna, Necralisk, Chrysalith, 1999, Misc, Other |
| Per-card rank input | ✅ Done | Select for small ranges; number input for large (e.g. Nightwave 0–180) |
| Per-card standing input | ✅ Done | Faction syndicates support negative ranks (−2..5) |
| Daily standing cap | ✅ Done | Derived from player Mastery Rank |
| Standing to max rank | ✅ Done | Live estimate; accounts for negative-rank escape math |
| Estimated days to max | ✅ Done | `standingToMax ÷ dailyCap`, rounded up |
| Currency reminder | ✅ Done | Syndicate-specific currencies (e.g. Nightwave Creds) |
| Ranks button → rank-up modal | ✅ Done | Rank-up transitions with cost checklist |
| Completed transitions hidden | ✅ Done | Show/hide toggle for completed ranks |
| View Offerings button | ✅ Done | Opens searchable offerings modal |
| Missing: X/Y button | ✅ Done | Opens offerings pre-filtered to unowned items |
| Faction relationship display | ✅ Done | Allied / Opposed / Enemy relationship pills |
| Pledge selector | ✅ Done | Up to 3 pledged syndicates with conflict enforcement |
| Conflict simulation & recommendations | ✅ Done | Matrix scoring over all valid combos with Apply |
| Rank titles | ✅ Done | All 22 syndicates covered via `getRankTitle()` |
| Nightwave max rank (180) | ✅ Done | 30 normal + 150 prestige ranks |
| Kahl's Garrison weeks-to-max ETA | ✅ Done | 5 − rank weeks at 1 mission per week |
| Profile import sync | ✅ Done | Syndicate ranks/standing imported from Warframe API |

---

### Goals

Personal progression goal portfolio with dependency trees and farming integration.

| Feature | Status | Notes |
|---|---|---|
| Add items as progression goals | ✅ Done | Search and add from full catalog |
| Recursive dependency expansion | ✅ Done | Full crafting tree per goal via `goalExpansion.ts` |
| Multi-goal shared dependency merging | ✅ Done | `overlapEngine.ts` merges shared sub-goals |
| Goal tree view (zoomable) | ✅ Done | Full-screen zoomable tree modal per goal |
| Progress bars & inline count editors | ✅ Done | Edit owned quantities directly on Goals page |
| Active / inactive goal toggle | ✅ Done | Filter goals by status |
| Search and sort | ✅ Done | Name, remaining, progress; A→Z, Z→A |
| Requirements Goals tab | ✅ Done | Auto-derived items needed for upcoming syndicate rank-ups |
| Total Goals tab | ✅ Done | Combined personal + requirements with merged quantities |
| Requirements Goals: quantity editing | ⏳ Planned | Update owned counts directly on Requirements Goals tab |
| Requirements Goals: full prerequisite items | ⏳ Planned | Show ALL items needed for prerequisites, not just rank-up costs |
| Planner prioritization | ✅ Done | `plannerEngine.ts` surfaces next steps |
| "Almost there" surfacing | ⏳ Planned | Highlight goals near completion |

---

### Farming (Requirements)

Two-mode farming view (Targeted and Overlap) showing what you need and where to get it, aggregated across all active goals and syndicate rank-ups.

| Feature | Status | Notes |
|---|---|---|
| Targeted farming mode | ✅ Done | Item-centric: each item → its acquisition sources |
| Overlap farming mode | ✅ Done | Source-centric: each source → items obtainable there |
| Top-level vs. recursive expansion | ✅ Done | Toggle between direct components and full ingredient tree |
| Progress bars & inline count editors | ✅ Done | Edit owned counts directly in the farming view |
| Currency cost summary | ✅ Done | Credits, platinum, syndicate currencies with remaining calc |
| Hidden items section | ✅ Done | Items excluded from farming with reason tags |
| Statistics dashboard | ✅ Done | Items needed, targeted sources, overlap sources, hidden count |
| Platinum toggle | ✅ Done | Exclude/include platinum costs from view |
| Search & filter | ✅ Done | Real-time filtering by item or source name |
| Overlap: exclude Foundry/Crafting sources | ⏳ Planned | Filter out "Crafting (Foundry)" — crafting is obvious; focus on actual farm locations |
| Overlap: rank sources by item variety | ⏳ Planned | Sort overlap sources by how many different goals they serve |
| Overlap: node-level farming spots | ⏳ Planned | Surface specific Star Chart nodes and mission types |

---

### Tenno's Handbook

Educational guide for new and returning players covering quests, systems, and mechanics.

| Feature | Status | Notes |
|---|---|---|
| Quest order guide | ✅ Done | Main, side, and Warframe-specific quests with type badges and unlock notes |
| Mastery Rank system guide | ✅ Done | Thresholds, item types, daily cap |
| Syndicates explained | ✅ Done | Standing, pledges, rank math |
| Focus schools overview | ✅ Done | Lens system, operator focus, 5 schools |
| Kuva Liches & Sisters guide | ✅ Done | Generation, murmurs, weapons, ephemeras |
| Eidolons guide | ✅ Done | Night cycle, lures, arcanes, rewards |
| Farming strategies | ✅ Done | Resource, relic, and endless mission tips |
| Game systems (Zariman, Void Cascade, Steel Path) | ✅ Done | Overview of endgame systems |
| Searchable content | ⏳ Planned | Currently static; search/filter planned |
| Full lore & tips database | ⏳ Planned | Comprehensive lore, tips, and guide database |

---

### Import / Export

Progress Pack backup and restore for cross-device use. Profile import is handled via the **Topbar profile pop-out**.

| Feature | Status | Notes |
|---|---|---|
| JSON export (download) | ✅ Done | Full state backup with timestamp in filename |
| JSON export (copy to textarea) | ✅ Done | Manual copy for notes/cloud storage |
| JSON import (file upload) | ✅ Done | Restore from saved backup file |
| JSON import (paste) | ✅ Done | Paste JSON directly into textarea |
| Schema validation on import | ✅ Done | Zod schema validation with clear error messages |
| Schema migration on load | ✅ Done | `migrations.ts` upgrades stored state automatically |
| Warframe profile import (via Topbar) | ✅ Done | Paste or upload HTML/JSON from official Warframe API |
| Import preview & merge options | ⏳ Planned | Preview changes before applying |

---

### Settings

App configuration including theme, time display, and data reset.

| Feature | Status | Notes |
|---|---|---|
| Dark / Light mode toggle | ⚠️ Partial | Theme applies to most UI; some components need updating for full light mode support |
| Compact list rows toggle | ✅ Done | Live preview; applies globally |
| Timezone selector | ✅ Done | 20+ options; used for reset time display |
| Reset to Defaults | ✅ Done | Clears progress, keeps data in localStorage |
| Reset All Local Data | ✅ Done | Permanently wipes all browser data |
| Ko-fi support link | ✅ Done | |
| GitHub repository link | ✅ Done | |

---

### Diagnostics

Catalog integrity tools, validation results, and debug exports.

| Feature | Status | Notes |
|---|---|---|
| Startup validation results | ✅ Done | Runs on app load; checks duplicate IDs, missing refs |
| Catalog statistics | ✅ Done | Item count, source count, requirement count |
| Completeness analysis | ✅ Done | Items with missing or unknown acquisition sources |
| JSON debug exports | ✅ Done | Completeness, farming, and reserves snapshots |
| Coverage statistics | ✅ Done | Percentage of items with known sources |
| Legacy source ID warnings | ✅ Done | Flags deprecated `node:`, `vendor:`, `quest:` prefixes |
| Release-blocking defect registry | ⏳ Planned | Formal fail-closed defect system (Phase 3) |
| Unknown source refs | ⚠️ Known issues | Some items reference unknown/unresolved sources |
| WFCD unresolved items | ⚠️ Known issues | Some warframe-items entries not fully resolved |

---

### Intrinsics

Railjack and Duviri Paradox intrinsic skill tracking. *(Currently implemented but not yet surfaced in the navigation sidebar.)*

| Feature | Status | Notes |
|---|---|---|
| Railjack intrinsics (Piloting, Gunnery, Engineering, Tactical, Command) | ✅ Done | Rank tracking per skill |
| Duviri intrinsics (Agility, Endurance, Opportunity, etc.) | ✅ Done | Rank tracking per skill |
| Navigation integration | ⏳ Planned | Not yet added to sidebar nav |

---

## Player Profile Import

The **profile pop-out** (top-right corner of the app) supports importing your live Warframe account data directly from the official Warframe API.

### Finding Your Account ID

Your Account ID is a 24-character hexadecimal string (e.g. `51c925bd1a4d80502e000046`). You can find it by:

1. Logging into [warframe.com](https://www.warframe.com) and visiting your profile page — the ID appears in the URL
2. Checking the URL of your Warframe community stats/profile page on third-party sites
3. Some Warframe companion apps or tools that display account metadata

### How to Import Your Profile

1. Open the profile pop-out (click your MR / name area in the top-right)
2. Enter your **Account ID** in the editable Account ID field
3. Click **Open Profile Link** — your official Warframe profile JSON opens in a new browser tab
4. On that page, select all text (Ctrl+A / Cmd+A) and copy it (Ctrl+C / Cmd+C)
5. Return to the tracker and click **Paste JSON** in the profile pop-out
6. Paste the content into the text area and click **Import Pasted JSON**

Alternatively, you can save that profile page as an HTML file and use **Import File** to load it directly.

### What Gets Imported

- Display name and Mastery Rank
- Credits and Platinum amounts
- Syndicate ranks and standing
- Inventory item counts (owned items)
- Completed missions and mastery XP data

> **Note:** The Warframe profile API is read-only and public for each account ID — no login credentials are ever sent to this app.

---

## Architecture Notes

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture and data pipeline documentation.

### Data Layers

| Layer | Location | Purpose |
|---|---|---|
| Raw data | `src/data/`, `external/` | Upstream datasets (warframe-items, drop data, wiki exports) |
| Catalog / normalization | `src/catalog/`, `src/domain/catalog/` | Translate raw data into canonical acquisition/requirement models |
| Logic engines | `src/domain/logic/` | Deterministic reasoning about progression |
| Player state | `src/store/` | Persisted Zustand store (inventory, goals, syndicate state, missions) |
| UI | `src/pages/`, `src/components/`, `src/ui/` | React pages and components |

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

**Standing to max** = total standing needed from current position to 132,000 at Rank 5.
For negative ranks: first escape to 0 standing (earn `|current standing|`), then climb the full 0→5 ladder.

### Nightwave (ranks 0–180)

- Ranks 1–30: normal ranks earned via Acts
- Ranks 31–180: prestige ranks (15 Nightwave Creds per prestige rank)
- No daily standing cap

---

## Deployment

```bash
npm run deploy
```

Builds the app then publishes the `dist/` directory to GitHub Pages via the `gh-pages` package.

---

*Warframe and all related assets are property of Digital Extremes. This project is a fan-made tool for personal and educational use.*
