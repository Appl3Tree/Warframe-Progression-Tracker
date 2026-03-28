# Tenno Hub

A **progression planning and reference tool for Warframe** — helping players decide what to work on next, understand what is blocking them, track their inventory and syndicates, and farm efficiently across multiple goals at once.

Warframe's progression is spread across quests, the Star Chart, junctions, Mastery Rank, syndicates, mods, challenges, Railjack, and item unlocks. Tenno Hub brings those systems into a single view so players can plan without spreadsheets or constant wiki-hopping.

**[→ Open the app](https://appl3tree.github.io/Tenno-Hub/)**

---

## Features

### Dashboard
Today's actionable checklist with reset awareness. Shows daily/weekly/Nightwave timers, configurable task lists, and reset countdowns in your local timezone.

### Inventory
Full item catalog with ownership tracking across Warframes, weapons, companions, vehicles, and resources. Each item shows its acquisition sources, crafting requirements, prerequisite quests/junctions, and drop locations. Import your live Warframe account data to sync your owned items automatically.

### Goals
Add items as progression goals and Tenno Hub expands them into their full dependency trees — components, blueprints, and sub-requirements — merging shared dependencies across multiple goals so you know exactly what to farm and in what order.

### Farming (Requirements)
Two-mode farming view driven by your active goals and upcoming syndicate rank-ups:
- **Targeted** — item-centric: each item you need with its acquisition sources
- **Overlap** — source-centric: each farming location with every item obtainable there, so you can batch-farm multiple goals in one run

### Syndicates
Complete standing tracker for all 22+ syndicates (primary, open-world, Nightwave, and misc). Shows days-to-max estimates, rank-up costs, offerings browsing, pledge conflict simulation, and faction relationship display. Supports negative-rank escape math for faction syndicates.

### Star Chart
Interactive SVG map of the full star chart with pan/zoom, node-level completion tracking, junction prerequisites, and drop panels per node showing mission rewards and cache drops. Includes a Steel Path mode toggle.

### Mods & Arcanes
Browse all mods and arcanes with drop locations, polarity icons, rarity colours, wiki links, and owned/unowned tracking.

### Challenges
Track all in-game achievement challenges with progress counters and completion status.

### Mod Builder
Weapon build tool with mod slot editing, polarity/Forma planning, stat calculations, and build exports (SVG image + JSON snapshot) for sharing or optimizer debugging.

### Tenno's Handbook
In-app guide covering game mechanics that aren't obvious from the UI — quest order, nemesis systems (Lich/Sisters/Coda), Eidolons, Focus schools, companion breeding, syndicates, trading, and more.

### Relic Farming
Void fissure tier optimizer and void trace calculator to help plan relic runs efficiently.

### Import / Export
Full Progress Pack backup and restore (JSON download or paste). Profile import from the official Warframe API syncs your inventory, mastery rank, syndicate standing, and completed missions.

---

## Profile Import

The profile pop-out (top-right corner) lets you import your live Warframe account data directly from the official Warframe API — no login required.

1. Open the profile pop-out and enter your **Account ID** (24-character hex string found in your Warframe profile URL on warframe.com)
2. Click **Open Profile Link** — your profile JSON opens in a new tab
3. Select all (Ctrl+A), copy (Ctrl+C), return to Tenno Hub, click **Paste JSON**, and import

Alternatively save the page as an HTML file and use **Import File**. The API is public and read-only — no credentials are ever sent to this app.

**What gets imported:** display name, Mastery Rank, credits, platinum, syndicate ranks and standing, inventory item counts, completed missions.

---

## Running Locally

```bash
npm install
npm run dev
```

Starts the Vite dev server at `http://localhost:80`.

```bash
npm run build     # production build → dist/
npm run deploy    # build + publish to GitHub Pages
npm run test      # run unit tests
npm run generate:data  # regenerate data files from external sources
```

---

## Architecture

| Layer | Location | Purpose |
|---|---|---|
| Raw data | `external/`, `src/data/` | Upstream datasets (warframe-items, drop data) |
| Catalog / normalization | `src/catalog/`, `src/domain/catalog/` | Translate raw data into canonical acquisition and requirement models |
| Logic engines | `src/domain/logic/` | Pure-function reasoning about progression, prerequisites, goals, and farming |
| Player state | `src/store/` | Persisted Zustand + Immer store |
| UI | `src/pages/`, `src/components/`, `src/ui/` | React pages and components |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full data pipeline documentation.

---

## Data Sources

- [warframe-items](https://github.com/WFCD/warframe-items) — item catalog, stats, and components
- [warframe-drop-data](https://github.com/WFCD/warframe-drop-data) — mission and enemy drop tables
- Warframe public profile API — live player account data (read-only, no auth)

---

*Warframe and all related assets are property of Digital Extremes. Tenno Hub is a fan-made tool and is not affiliated with Digital Extremes.*
