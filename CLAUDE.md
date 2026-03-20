# Warframe Progression Tracker — Claude Working Notes

## Task List

Tasks are organized by priority. Update this list as work progresses.

### 🔴 Critical (Stability)

- [x] Add React error boundaries to every page (prevents full-page crashes when logic engines throw)
- [x] Add unit tests for the 16 logic engines — especially `requirementEngine`, `goalExpansion`, `processInvasions`
- [x] Fix WorldState 1-second timer (`useNow()`) to only re-render the active tab
- [ ] Add Intrinsics page to the sidebar navigation (page exists but is unreachable)

### 🟡 High Impact (UX & Performance)

- [ ] Add confirmation step before profile import (currently merges immediately with no undo)
- [ ] Add `useShallow` to heavy Zustand selectors in Goals and Requirements pages
- [ ] Virtualize long lists: Inventory (1000+ items), Mods (3000+), Challenges (300+)
- [ ] Complete light mode across all components (many still have hardcoded dark colors)
- [ ] Extract duplicate profile import logic (`importProfileViewingDataJson` and `importProfileFromWarframeStatApi` are ~80% identical)
- [ ] Add backup-before-migration to prevent data loss if schema migration fails

### 🟠 UX Polish

- [ ] Add "almost complete" goal highlighting (e.g. highlight goals that are 90%+ done)
- [ ] Link farming sources in Requirements page back to the Star Chart node
- [ ] Add completion status overlay on Star Chart drop panels
- [ ] Make Handbook more discoverable (consider surfacing on dashboard for new players)

### 🔵 New Features (Roadmap)

- [ ] Relic farming assistant (void fissure tier optimizer, void trace calculator)
- [ ] Mod ownership tracking (prerequisite for loadout planning)
- [ ] Vaulted/unvaulted item status integration
- [ ] Nightwave challenge optimizer ("which weeklies give max creds fastest?")
- [ ] Steel Path rotation calendar (when does my target item return?)

---

## Working Conventions

- Run `tsc -b` before committing to catch type errors
- Logic engines in `src/domain/logic/` are pure functions — keep them that way
- Canonical IDs live in `src/domain/ids/` — use enums, never raw strings
- State mutations go through Zustand + Immer in `src/store/store.ts`
- New acquisition sources belong in `src/catalog/` as a new adapter file
