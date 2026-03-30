# Tenno-Modernism Redesign Spec

## Purpose

This document turns the app-wide redesign direction into a concrete implementation brief for the current Tenno Hub codebase.

It covers:

- product architecture
- route-by-route wireframe specs
- design token proposal
- shared component inventory
- navigation rewrite
- implementation phases mapped to current files

The goal is not to "reskin the Mod Builder." The goal is to make Tenno Hub feel like one premium, high-density progression operating system.

---

## 1. Product Vision

### Product Statement

Tenno Hub should feel like a high-end analytical workspace for Warframe progression. It should help players decide what matters now, what to farm next, what they are blocked by, and how systems connect.

### Visual Thesis

Tenno-Modernism:

- dark-mode-first
- Orokin-lite, not literal Orokin mimicry
- premium analytical software, not "game UI"
- restrained glass surfaces
- deliberate typography
- dense but calm information hierarchy

### Hard Rules

- No faux-metal textures
- No spaceship borders
- No equal-weight card mosaic as the default layout
- No more than one dominant accent in a single screen region
- No hiding core actions behind excessive clicks
- No route structure that forces users to mentally translate between modules

---

## 2. Current Codebase Reality

These files define the main application surface today:

- shell: [`src/app/layout/Shell.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Shell.tsx)
- primary nav: [`src/app/layout/Sidebar.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Sidebar.tsx)
- top bar: [`src/app/layout/Topbar.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Topbar.tsx)
- route list: [`src/app/routes.ts`](/Users/forrest/Repos/Tenno-Hub/src/app/routes.ts)
- dashboard: [`src/pages/Dashboard.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Dashboard.tsx)
- world state: [`src/pages/WorldState.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/WorldState.tsx)
- inventory: [`src/pages/Inventory.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Inventory.tsx)
- mods and arcanes: [`src/pages/Mods.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Mods.tsx)
- goals: [`src/pages/Goals.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Goals.tsx)
- prerequisites: [`src/pages/Prerequisites.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Prerequisites.tsx)
- farming/requirements: [`src/pages/Requirements.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Requirements.tsx)
- star chart: [`src/pages/StarChart.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/StarChart.tsx)
- syndicates: [`src/pages/Syndicates.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Syndicates.tsx)
- intrinsics: [`src/pages/Intrinsics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Intrinsics.tsx)
- challenges: [`src/pages/Challenges.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Challenges.tsx)
- handbook: [`src/pages/Handbook.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Handbook.tsx)
- import/export: [`src/pages/Imports.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Imports.tsx)
- settings: [`src/pages/Settings.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Settings.tsx)
- diagnostics: [`src/pages/Diagnostics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Diagnostics.tsx)
- current tools page mixing relics + mod builder: [`src/pages/Relics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Relics.tsx)
- current mod builder: [`src/pages/tools/ModBuilder.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/tools/ModBuilder.tsx)

Important architectural constraints already in place:

- React + Tailwind v4
- Zustand store
- a newer app shell already exists
- pages are route-key driven instead of URL router driven
- many pages are large monolith components

The redesign should leverage those strengths before introducing new systems.

---

## 3. New Information Architecture

### Problem

The current nav in [`src/app/routes.ts`](/Users/forrest/Repos/Tenno-Hub/src/app/routes.ts) lists nearly every page as a peer. That makes the app feel like a toolkit drawer rather than one cohesive product.

### Proposed Top-Level Work Modes

#### Command

- Dashboard
- World State
- Today / Alerts

#### Progression

- Goals
- Prerequisites
- Syndicates
- Intrinsics
- Challenges
- Handbook

#### Collection

- Inventory
- Mods & Arcanes
- Star Chart

#### Planning

- Farming
- Build Planner
- Relic Planner
- future planners: Nightwave, Steel Path rotation, etc.

#### System

- Import / Export
- Settings
- Diagnostics

### Route Mapping Proposal

Current route keys can remain initially, but navigation should present them in grouped work modes.

Suggested first-pass grouping:

| Work Mode | Current Route Keys |
| --- | --- |
| Command | `dashboard`, `world_state` |
| Progression | `goals`, `prereqs`, `syndicates`, `intrinsics`, `challenges`, `handbook` |
| Collection | `inventory`, `mods`, `starchart` |
| Planning | `requirements`, `relics` |
| System | `imports`, `settings`, `diagnostics` |

### Future Route Split

The current `relics` page should be split into two explicit planner routes:

- `build_planner`
- `relic_planner`

That split should happen before any serious visual polish to avoid redesigning the wrong IA.

---

## 4. Shell Redesign

### Current Files

- [`src/app/layout/Shell.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Shell.tsx)
- [`src/app/layout/Sidebar.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Sidebar.tsx)
- [`src/app/layout/Topbar.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Topbar.tsx)

### Proposed Shell Structure

#### Left Rail

Purpose:

- display top-level work modes
- expose global nav in a calmer, more compact way

Behavior:

- icons always visible
- labels visible on desktop expanded state
- active work mode highlighted with a violet or gold edge glow, not a bright block fill

#### Secondary Nav

Purpose:

- page-level navigation within the active work mode

Behavior:

- appears as a vertical sub-rail on desktop
- becomes segmented tabs on tablet/mobile
- should support page descriptions and counts when useful

#### Global Context Bar

Purpose:

- keep profile and active planning context visible everywhere

Contents:

- account/platform
- current target item or tracked goal
- current enemy profile
- owned-only toggle
- search / command palette entry
- quick jump actions

#### Main Workspace

Purpose:

- hold the page’s true working surface, not just a padded column of cards

#### Inspector Pane

Purpose:

- hold selection details, provenance, assumptions, formulas, and quick actions

Behavior:

- persistent on desktop
- slide-over sheet on smaller screens

### Layout Width Guidance

- standard pages: max `1600px`
- dense analytical pages: max `1760px`
- handbook/editorial pages: narrower reading width inside the workspace, not a global app width reduction

### Immediate Refactor Targets

- move from a single route list to grouped work-mode navigation in [`src/app/layout/Sidebar.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Sidebar.tsx)
- add secondary nav support in [`src/app/layout/Shell.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Shell.tsx)
- reduce visual clutter in [`src/app/layout/Topbar.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Topbar.tsx) by separating profile editing from live workspace state

---

## 5. Design Token Proposal

These tokens should be defined as CSS custom properties in a new theme layer.

### Proposed Files

- `src/theme/tokens.css`
- `src/theme/themes.css`
- optional utility bridge in `src/styles.css`

### Color Tokens

```css
:root {
  --wf-bg-app: #05080d;
  --wf-bg-canvas: #0a1017;
  --wf-surface-1: rgba(17, 26, 36, 0.9);
  --wf-surface-2: rgba(24, 36, 51, 0.82);
  --wf-surface-glass: rgba(17, 26, 36, 0.68);
  --wf-border-subtle: rgba(255, 255, 255, 0.08);
  --wf-border-strong: rgba(255, 255, 255, 0.16);
  --wf-text-strong: #f3f7fb;
  --wf-text: #c5d1de;
  --wf-text-muted: #8da0b5;
  --wf-accent-primary: #8c7bff;
  --wf-accent-gold: #c9a86a;
  --wf-accent-teal: #49c6c1;
  --wf-accent-heat: #ff8b5e;
  --wf-accent-danger: #f05c72;
}
```

### Typography Tokens

```css
:root {
  --wf-font-display: "Sora", sans-serif;
  --wf-font-body: "Inter", sans-serif;
  --wf-font-mono: "IBM Plex Mono", monospace;

  --wf-text-xs: 12px;
  --wf-text-sm: 14px;
  --wf-text-md: 16px;
  --wf-text-lg: 20px;
  --wf-text-xl: 28px;
  --wf-text-2xl: 40px;
}
```

### Spacing and Radius Tokens

```css
:root {
  --wf-space-1: 4px;
  --wf-space-2: 8px;
  --wf-space-3: 12px;
  --wf-space-4: 16px;
  --wf-space-5: 20px;
  --wf-space-6: 24px;
  --wf-space-8: 32px;
  --wf-space-10: 40px;
  --wf-space-12: 48px;
  --wf-space-16: 64px;

  --wf-radius-sm: 10px;
  --wf-radius-md: 16px;
  --wf-radius-lg: 24px;
}
```

### Elevation and Blur Tokens

```css
:root {
  --wf-shadow-soft: 0 8px 24px rgba(0, 0, 0, 0.24);
  --wf-shadow-panel: 0 12px 40px rgba(0, 0, 0, 0.35);
  --wf-blur-panel: 18px;
}
```

### Tailwind Usage Rule

Do not encode the redesign purely as long chains of raw `bg-slate-*` and `text-slate-*` classes.

Preferred pattern:

- use Tailwind for layout and sizing
- use semantic class names or CSS variables for color, surface, and typography

---

## 6. Shared Component System

### Problem

Many pages define their own `Section`, `PillButton`, chips, and panel shells. That duplication makes the app feel inconsistent even before visual polish.

Examples:

- [`src/pages/Requirements.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Requirements.tsx)
- [`src/pages/Goals.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Goals.tsx)
- [`src/pages/Diagnostics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Diagnostics.tsx)
- [`src/pages/Settings.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Settings.tsx)
- [`src/pages/StarChart.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/StarChart.tsx)

### Proposed Component Layers

#### 6.1 Structural Primitives

Suggested new files:

- `src/ui/layout/AppShellFrame.tsx`
- `src/ui/layout/WorkspaceHeader.tsx`
- `src/ui/layout/InspectorPane.tsx`
- `src/ui/layout/SurfacePanel.tsx`
- `src/ui/layout/SplitPane.tsx`
- `src/ui/layout/SectionStack.tsx`

Responsibilities:

- manage panel chrome
- standardize padding and headers
- reduce bespoke wrappers inside page files

#### 6.2 Input and Navigation Primitives

Suggested new files:

- `src/ui/controls/SegmentedControl.tsx`
- `src/ui/controls/FilterChip.tsx`
- `src/ui/controls/ScopeSwitch.tsx`
- `src/ui/controls/InlineToggle.tsx`
- `src/ui/controls/CommandSearch.tsx`
- `src/ui/controls/QuickActionButton.tsx`

Use to replace:

- duplicated pill and tab controls across pages

#### 6.3 Data Display Primitives

Suggested new files:

- `src/ui/data/MetricTile.tsx`
- `src/ui/data/MetricStrip.tsx`
- `src/ui/data/DeltaPill.tsx`
- `src/ui/data/StatusDot.tsx`
- `src/ui/data/ProgressRing.tsx`
- `src/ui/data/EmptyState.tsx`
- `src/ui/data/SectionNotice.tsx`

#### 6.4 Domain Components

Suggested new files:

- `src/features/items/ItemIdentityRow.tsx`
- `src/features/items/SourceBadgeList.tsx`
- `src/features/goals/GoalSummaryRow.tsx`
- `src/features/world-state/CycleTicker.tsx`
- `src/features/world-state/EventPriorityBadge.tsx`
- `src/features/planner/AssumptionPill.tsx`
- `src/features/planner/DamageBar.tsx`
- `src/features/planner/ProcWeightBar.tsx`

### Component Rule

The design should look bespoke because the composition is bespoke, not because every page invents its own pill/button/panel implementation.

---

## 7. Route-by-Route Wireframe Specs

This section describes the intended page structures, not pixel-perfect mockups.

### 7.1 Command Center

Current file:

- [`src/pages/Dashboard.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Dashboard.tsx)

Current issues:

- top-level layout still reads as a stack of panels
- recommendations are not yet the dominant experience
- world-state relevance is separated from the main action surface

Proposed structure:

1. Workspace header
   - page title
   - profile summary
   - "Today" filter context
2. Priority rail
   - urgent tasks
   - expiring events
   - near-complete goals
3. Main action canvas
   - next-best actions
   - recommended reasons
   - quick-complete actions
4. Side inspector
   - account health
   - import freshness
   - pinned goals

Wireframe notes:

- reduce "box per thing" layout
- make action recommendations dominant
- keep reset and world-state information integrated, not exiled to separate pages

### 7.2 World State

Current file:

- [`src/pages/WorldState.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/WorldState.tsx)

Current issues:

- tabs are useful, but the page is still visually card-heavy
- event importance and personal relevance are not strong enough
- screen reads as content sections rather than an intel console

Proposed structure:

1. Sticky filter strip
   - category
   - relevant to my goals
   - ending soon
   - platform
2. Main feed
   - grouped by urgency and relevance
   - each row shows reason-to-care
3. Timeline strip
   - near-term expirations
4. Inspector
   - selected event details
   - related goals
   - source links

Priority states:

- urgent
- relevant
- lucrative
- informational
- hidden/suppressed

### 7.3 Goals

Current file:

- [`src/pages/Goals.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Goals.tsx)

Current issues:

- utility is high, but structure is still document-like
- goal portfolio behavior is not visually distinct from requirements output

Proposed structure:

1. Summary header
   - active goals
   - blocked goals
   - nearly done goals
2. Main body split
   - left: goal collections and filters
   - center: list or tree
   - right: selected goal detail
3. Goal inspector
   - blockers
   - best next sources
   - overlap with other goals

### 7.4 Prerequisites

Current file:

- [`src/pages/Prerequisites.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Prerequisites.tsx)

Current issues:

- mostly linear list interaction
- downstream unlock value is not surfaced enough

Proposed structure:

1. Completion overview
2. unlock graph or grouped dependency map
3. selected prerequisite inspector
   - unlocks enabled
   - downstream systems
   - related goals

### 7.5 Syndicates

Current files:

- [`src/pages/Syndicates.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Syndicates.tsx)
- [`src/components/syndicates/SyndicatesGrid.tsx`](/Users/forrest/Repos/Tenno-Hub/src/components/syndicates/SyndicatesGrid.tsx)
- [`src/components/syndicates/SyndicateDetailsModal.tsx`](/Users/forrest/Repos/Tenno-Hub/src/components/syndicates/SyndicateDetailsModal.tsx)

Current issues:

- modals and grid layout fragment the experience
- rank planning, offerings, and relationships should feel like one system

Proposed structure:

1. Syndicate relationship band
2. primary roster list
3. active syndicate workspace
   - standing
   - rank ladder
   - offering planner
4. inspector
   - costs
   - dependencies
   - goal relevance

### 7.6 Inventory

Current file:

- [`src/pages/Inventory.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Inventory.tsx)

Current issues:

- page is dense but visually fragmented
- it needs stronger "collection ledger" behavior

Proposed structure:

1. Sticky filter row
2. virtualized ledger
3. summary strip
   - owned
   - missing
   - needed for active goals
4. inspector
   - acquisition
   - use cases
   - requirements
   - quick count edit

### 7.7 Mods & Arcanes

Current file:

- [`src/pages/Mods.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Mods.tsx)

Current issues:

- massive page with many custom controls
- the page does too much at once without enough hierarchy

Proposed structure:

1. toolbar
   - search
   - category
   - ownership
   - compatibility
2. center list
   - virtualized results
   - dense list by default
3. inspector
   - ranks
   - effects
   - drops
   - planner relevance

Key interaction:

- "Open in Build Planner"
- "Show farming sources"
- "Mark owned / max rank"

### 7.8 Star Chart

Current files:

- [`src/pages/StarChart.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/StarChart.tsx)
- [`src/pages/starChart/StarChartMap.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/starChart/StarChartMap.tsx)
- [`src/pages/starChart/StarChartListView.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/starChart/StarChartListView.tsx)

Current issues:

- multiple good subviews exist, but the surface is not yet unified as a research tool

Proposed structure:

1. mode switch
   - map
   - list
   - target overlay
2. main canvas
3. side inspector
   - node rewards
   - active target items
   - prerequisite/access state

Key design note:

This should feel like a polished atlas, not a game mission terminal.

### 7.9 Farming

Current file:

- [`src/pages/Requirements.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Requirements.tsx)

Current issues:

- current page is strong analytically but reads like a report, not a planner

Proposed structure:

1. target summary header
   - active goals
   - overlap mode
   - path strategy
2. source clusters
   - actionable locations first
3. item/source split view
4. inspector
   - route efficiency
   - world-state relevance
   - node links

Primary distinction:

- "Need analysis" is not enough
- page should answer "where should I go next"

### 7.10 Build Planner

Current files:

- [`src/pages/Relics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Relics.tsx)
- [`src/pages/tools/ModBuilder.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/tools/ModBuilder.tsx)

Current issues:

- mixed with relic tools under one route
- visual hierarchy is functional but not yet scalable for future damage-model explainability

Proposed structure:

1. sticky planner header
   - weapon
   - comparison state
   - target profile
2. left config rail
   - slots
   - arcanes
   - capacity
   - owned-only and exclusions
3. central analytics surface
   - arsenal damage
   - inflicted damage
   - expected DoT
   - burst DPS
   - sustained DPS
4. right inspector
   - assumptions
   - proc weights
   - explanation
   - build comparison

### 7.11 Relic Planner

Current file:

- [`src/pages/Relics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Relics.tsx)

Current issues:

- currently subordinate to the tools page rather than its own dedicated planning workflow

Proposed structure:

1. header
   - target parts
   - trace budget
   - availability status
2. main ranked relic list
3. source detail panel
4. inspector
   - refinement payoff
   - mission sources
   - overlap with other goals

### 7.12 Handbook

Current file:

- [`src/pages/Handbook.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Handbook.tsx)

Current issues:

- should be visually distinct from operational screens

Proposed structure:

1. article nav
2. reading column
3. reference rail
   - linked systems
   - related tools

Design note:

- less glass
- more whitespace
- stronger editorial typography

### 7.13 Imports, Settings, Diagnostics

Current files:

- [`src/pages/Imports.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Imports.tsx)
- [`src/pages/Settings.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Settings.tsx)
- [`src/pages/Diagnostics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Diagnostics.tsx)

Proposed treatment:

- keep visually consistent with the shell
- reduce flourish
- emphasize trust, safety, and precision

Diagnostics note:

This page can intentionally feel more like a developer console.

---

## 8. Global Interaction Model

### 8.1 Cross-Page Context

Introduce a global context object in store for temporary working state:

- selected target item
- selected source/node
- selected enemy profile
- selected faction/profile assumptions
- owned-only filter
- compare tray items

Suggested store area:

- new slice under `state.ui` or `state.workspace`

Benefits:

- Star Chart, Farming, Inventory, Mods, and planners can feel connected
- reduces repeated search/filter effort

### 8.2 Quick Actions

Every major row or entity should expose at least some of:

- inspect
- track
- add to goals
- show sources
- open related planner
- update owned state

### 8.3 Command Palette

Add a command palette for:

- page jumps
- item and mod lookup
- world-state category jump
- active goal targeting

Suggested libraries:

- `cmdk`

---

## 9. Recommended Technical Stack Additions

### Keep

- React
- Zustand
- Tailwind v4

### Add

- `class-variance-authority`
- `framer-motion`
- `@radix-ui/react-dialog`
- `@radix-ui/react-tabs`
- `@radix-ui/react-popover`
- `@radix-ui/react-scroll-area`
- `@tanstack/react-virtual`
- `cmdk`

### Add Later If Needed

- `react-resizable-panels`
- `visx`

### Why

- Radix gives polished behavior without forcing a generic visual language
- Framer Motion gives presence and shared-layout transitions
- CVA helps formalize the emerging design system

---

## 10. File-Level Implementation Plan

This is the recommended execution order for the current repo.

### Phase 1: Theme Foundation

Create:

- `src/theme/tokens.css`
- `src/theme/themes.css`
- `src/ui/layout/SurfacePanel.tsx`
- `src/ui/layout/WorkspaceHeader.tsx`
- `src/ui/controls/SegmentedControl.tsx`
- `src/ui/data/MetricTile.tsx`

Update:

- [`src/styles.css`](/Users/forrest/Repos/Tenno-Hub/src/styles.css)
- [`src/index.css`](/Users/forrest/Repos/Tenno-Hub/src/index.css)

Goals:

- semantic token layer
- one shared panel treatment
- one shared segmented/tab treatment

### Phase 2: Shell and Navigation

Update:

- [`src/app/routes.ts`](/Users/forrest/Repos/Tenno-Hub/src/app/routes.ts)
- [`src/app/layout/Sidebar.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Sidebar.tsx)
- [`src/app/layout/Shell.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Shell.tsx)
- [`src/app/layout/Topbar.tsx`](/Users/forrest/Repos/Tenno-Hub/src/app/layout/Topbar.tsx)

Goals:

- grouped work modes
- secondary navigation
- persistent context bar
- shell ready for inspector-pane layouts

### Phase 3: Split the Planning Surface

Update:

- [`src/pages/Relics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Relics.tsx)

Create:

- `src/pages/BuildPlanner.tsx`
- `src/pages/RelicPlanner.tsx`

Move or adapt:

- logic currently embedded in [`src/pages/tools/ModBuilder.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/tools/ModBuilder.tsx)
- relic planning UI currently embedded in [`src/pages/Relics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Relics.tsx)

Goals:

- correct IA
- cleaner planning workflows

### Phase 4: High-Impact Shared Operational Pages

Update first:

- [`src/pages/Dashboard.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Dashboard.tsx)
- [`src/pages/WorldState.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/WorldState.tsx)
- [`src/pages/Requirements.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Requirements.tsx)
- [`src/pages/Inventory.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Inventory.tsx)

Why first:

- these pages set the daily rhythm of the app
- improvements here create immediate user-visible cohesion

### Phase 5: Collection and Research Surfaces

Update:

- [`src/pages/Mods.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Mods.tsx)
- [`src/pages/StarChart.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/StarChart.tsx)
- star chart subviews under [`src/pages/starChart/`](/Users/forrest/Repos/Tenno-Hub/src/pages/starChart)

Goals:

- build codex-like research consistency
- align item/source selection behavior

### Phase 6: Progression Suite

Update:

- [`src/pages/Goals.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Goals.tsx)
- [`src/pages/Prerequisites.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Prerequisites.tsx)
- [`src/pages/Syndicates.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Syndicates.tsx)
- [`src/pages/Intrinsics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Intrinsics.tsx)
- [`src/pages/Challenges.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Challenges.tsx)

### Phase 7: Utility and Editorial Finish

Update:

- [`src/pages/Handbook.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Handbook.tsx)
- [`src/pages/Imports.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Imports.tsx)
- [`src/pages/Settings.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Settings.tsx)
- [`src/pages/Diagnostics.tsx`](/Users/forrest/Repos/Tenno-Hub/src/pages/Diagnostics.tsx)

---

## 11. Recommended First Sprint

If we want the highest return on effort, the first redesign sprint should include only:

1. token layer
2. shell regrouping
3. global context bar
4. planner route split
5. dashboard refresh
6. farming refresh

That sprint will make the whole product feel more intentional without requiring a total rewrite of every page.

---

## 12. Success Metrics

The redesign is successful when:

- users can tell what the app is for in one screen
- related workflows feel connected
- daily-use pages feel faster without losing depth
- dense views read as premium analytical software, not fan-site utilities
- the app supports both ultrawide power use and phone triage cleanly

---

## 13. Non-Goals

This redesign does not require:

- game-accurate ornamental textures
- a lore-heavy visual treatment
- converting the app to a completely different state architecture
- routing migration before the UI system is stabilized

---

## 14. Deliverables After This Spec

The next implementation docs to produce should be:

1. a `TOKENS_AND_COMPONENTS.md` file with exact component APIs
2. a `ROUTE_REWRITE_PLAN.md` file for navigation and page ownership
3. a first coded shell/theme pass

This file is the product and UX north star for that work.
