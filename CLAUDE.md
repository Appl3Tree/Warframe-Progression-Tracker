# Warframe Progression Tracker — Claude Working Notes

## Task List

Tasks are organized by priority. Update this list as work progresses.

### 🔴 Critical (Stability)

- [x] Add React error boundaries to every page (prevents full-page crashes when logic engines throw)
- [x] Add unit tests for the 16 logic engines — especially `requirementEngine`, `goalExpansion`, `processInvasions`
- [x] Fix WorldState 1-second timer (`useNow()`) to only re-render the active tab

### 🟡 High Impact (UX & Performance)

- [x] Add confirmation step before profile import (currently merges immediately with no undo)
- [x] Add `useShallow` to heavy Zustand selectors in Goals and Requirements pages
- [x] Virtualize long lists: Inventory (already done), Mods (3000+ — mods + arcanes sections), Challenges (300 grid cards — acceptable without virtualization)
- [x] Complete light mode across all components (styles.css has comprehensive .theme-light remapping for all slate-* classes)
- [x] Extract duplicate profile import logic (`importProfileViewingDataJson` and `importProfileFromWarframeStatApi` are ~80% identical)
- [x] Add backup-before-migration to prevent data loss if schema migration fails

### 🟠 UX Polish

- [x] Fix invasion completion % to use runsCompleted / runsRequired instead of API-provided value
- [x] Add "almost complete" goal highlighting (e.g. highlight goals that are 90%+ done)
- [x] Link farming sources in Requirements page back to the Star Chart node
- [x] Add completion status overlay on Star Chart drop panels
- [x] Make Handbook more discoverable (consider surfacing on dashboard for new players)

### 🔵 New Features (Roadmap)

- [x] Relic farming assistant (void fissure tier optimizer, void trace calculator)
- [ ] Mod ownership tracking (prerequisite for loadout planning)
- [x] Vaulted/unvaulted item status integration
- [ ] Nightwave challenge optimizer ("which weeklies give max creds fastest?")
- [ ] Steel Path rotation calendar (when does my target item return?)

---

## Working Conventions

- Run `tsc -b` before committing to catch type errors
- Logic engines in `src/domain/logic/` are pure functions — keep them that way
- Canonical IDs live in `src/domain/ids/` — use enums, never raw strings
- State mutations go through Zustand + Immer in `src/store/store.ts`
- New acquisition sources belong in `src/catalog/` as a new adapter file
