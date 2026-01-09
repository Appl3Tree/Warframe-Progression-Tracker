## Warframe Progression Tracker

A **data-driven progression planning tool for Warframe** focused on helping players understand *what to work on next* and *why*.

This project is intentionally **not** a stat tracker, build optimizer, or account mirror. Its purpose is to model Warframe’s interconnected systems and progression dependencies so players can make informed decisions without spreadsheets, wiki hopping, or guesswork.

---

## Purpose

Warframe has a wide, non-linear progression structure. New and returning players are often overwhelmed by options without understanding which choices meaningfully unblock future content.

This app exists to:

- Surface **clear, actionable progression goals**
- Explain **why** a goal matters and **what it unlocks**
- Model dependencies between systems instead of presenting raw data
- Help players prioritize efficiently without external tools

---

## What This App Is

- A **progression planner**
- A **dependency-aware recommendation tool**
- A **system-level view** of Warframe progression
- A way to understand *bottlenecks*, not just content lists

## What This App Is Not

- A DPS calculator
- A build optimizer
- A trading or economy tool
- A full replacement for the official Warframe profile

---

## Core Concepts

### Progression Goals

The primary output of the app is a ranked set of **progression goals**.

A goal represents a meaningful milestone, such as:
- Unlocking a system (Arbitrations, Steel Path, Helminth)
- Completing prerequisite quests
- Crafting a key item or Warframe
- Reaching an important Mastery breakpoint

Each goal:
- Has explicit requirements
- Can depend on other goals
- Is evaluated deterministically based on the player’s state

The app answers:
- What is currently achievable
- What is blocked and why
- Which goals unlock the most future paths

---

### Systems

Progression is modeled through discrete **systems**, such as:
- Star Chart
- Quests
- Mods
- Foundry crafting
- Resources
- Mastery Rank

Each system defines:
- Unlock conditions
- What it enables downstream
- How it feeds into multiple goals

Systems are surfaced independently so players can understand *where* they are blocked.

---

### Requirements & Dependencies

At the core of the app is a deterministic logic layer:

- **Requirement evaluation** determines whether conditions are met
- **Overlap detection** identifies shared dependencies between goals

This allows the app to:
- Avoid redundant recommendations
- Prefer goals that unblock multiple paths
- Clearly explain missing prerequisites

There are no heuristics or randomness. Every recommendation is explainable.

---

## Architecture Overview

The project is structured with a strict separation between **data**, **logic**, and **UI**.

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- Zustand for state management

### Domain Logic
- Pure TypeScript
- No React dependencies
- Deterministic, testable functions

Key areas include:
- Requirement evaluation
- Dependency overlap analysis
- Acquisition and source modeling

This structure allows the app to scale by **adding data**, not rewriting logic.

---

## Data Philosophy

All behavior is driven by explicit data definitions:
- Items define how they are acquired
- Sources define where content comes from
- Goals define what matters and why

Nothing is hidden behind UI conditionals or hard-coded rules. This keeps the system transparent and maintainable as Warframe evolves.

---

## Account Data

The app is designed to be usable **without** any account or profile data.

Future enhancements may optionally include:
- Public profile imports
- Ownership and mastery awareness
- Dynamic re-scoring based on progress

These will remain optional and non-blocking.

---

## Running Locally

To run the app locally:

```bash
npm install
npm run dev
````

This starts the Vite development server with hot reload enabled.

---

## Project Status

This project is under active development.

Core architecture and logic are in place. Content coverage, refinement of systems, and UI polish are ongoing.

---

## End Goal

The long-term vision is a tool that:

* A brand-new player can use on day one
* Continues to provide value hundreds of hours later
* Explains Warframe’s complexity without overwhelming the user

Ultimately, this serves as:

* A single source of truth for progression planning
* A foundation for future planning and guide tools
* A reference implementation for modeling complex game systems cleanly

---

## License

Warframe and all related assets are property of Digital Extremes.
This project is provided for personal and educational use.
