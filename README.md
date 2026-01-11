## Warframe Progression Tracker

A **progression planning tool for Warframe** designed to help players decide *what to work on next* and understand *why it matters*.

Warframe’s progression is spread across quests, the Star Chart, junctions, Mastery Rank, and item unlocks. This app brings those systems together into a single view so players can plan confidently without spreadsheets or constant wiki hopping.

---

## Purpose

Players usually get stuck for one of two reasons:
1) they don’t know what will meaningfully unlock more content, or  
2) they don’t know why something is blocked.

This project exists to help players:
- Identify **high-impact progression goals**
- Understand **what is blocking them and why**
- See **what each step unlocks**
- Plan multiple goals without redundant work

---

## What This App Is

- A **progression planner**
- A **dependency-aware guide**
- A structured view of Warframe’s progression systems and unlock paths

## What This App Is Not

- A DPS calculator
- A build or mod optimizer
- A trading or economy tool
- A replacement for the official Warframe profile

---

## How It Works

### Goals and Planning
You can add goals such as Warframes, weapons, quests, or system unlocks. The app then shows:
- What is achievable right now
- What is blocked and what unblocks it
- The requirements chain for each goal
- Shared requirements across multiple goals to avoid duplicate effort

### Systems and Dependencies
The app models progression across connected systems, including:
- Star Chart progression and junctions
- Quests and quest chains
- Item acquisition requirements
- Mastery Rank gating and progression

The emphasis is on **unlock paths**: what leads to what, and why.

---

## Planned Features

### Star Chart Progression
- Interactive Star Chart map with planet navigation and zoom
- Node-level completion tracking
- Junction requirements and unlock visualization
- Node and junction impact: what completing something unlocks

### Inventory and Item Progression
- Full item catalog coverage (Warframes, weapons, variants, companions, vehicles)
- Item availability state based on your progress
- Clear acquisition and requirement breakdown per item
- Bulk updates for faster progress marking

### Mastery-Aware Planning
- Track mastered vs unmastered items
- Mastery backlog view (owned but not mastered)
- Mastery forecasting (“If I master these, I reach MR X”)
- Planning views that surface Mastery-efficient next steps

### Goal-Driven Recommendations
- Add Warframes/weapons/items as goals
- “Available now” filtering for goal selection and planning
- Multi-goal planning with shared dependency merging
- “Almost there” surfacing for near-term unlocks
- Ordering assistance for parallel progress where paths overlap

### “What Should I Do Next?”
- Suggested next actions based on:
  - unlock impact
  - goal proximity
  - Mastery progression
- “If I do this, what changes?” impact previews
- Session planning modes (short play sessions vs longer sessions)
- Passive callouts when new items/goals become reachable

### Profile Import (Optional)
- Platform selection and public profile import
- Ownership and mastery awareness from imported data
- Import preview before applying changes
- Merge options and full reversibility through restore points

### Safety and Recovery
- Revision history with restore capability
- Named restore points for safe experimentation
- Read-only planning mode
- What-if planning (simulate progress without committing changes)

### Usability Features
- Global search across items, quests, planets, and nodes
- Pins/bookmarks for quick access to active goals and frequently referenced content
- Keyboard navigation support
- Density controls for compact vs spacious layouts
- Export options for plans (checklists / markdown / JSON) and screenshot-friendly views

---

## Running Locally

```bash
npm install
npm run dev

This starts the Vite development server with hot reload enabled.

⸻

Project Status

The project is under active development.

Core systems and planning logic are in place. Current work focuses on:
	•	Completing progression data coverage
	•	Building the interactive Star Chart and goal planning UX
	•	Refining navigation, search, and presentation

⸻

License

Warframe and all related assets are property of Digital Extremes.
This project is provided for personal and educational use.

---