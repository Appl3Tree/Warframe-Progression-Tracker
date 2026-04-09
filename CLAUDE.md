# Warframe Progression Tracker — Claude Working Notes

## Task List

Tasks are organized by priority. Update this list as work progresses.

### Current Baseline (Commit `7deeeb9` on 2026-03-26)

- [x] Profile import restores Mod Builder saved builds
- [x] Owned mods support per-mod maximum rank tracking
- [x] Progenitor weapons support valence bonus and optional valence-element optimization at rank 40
- [x] Optimizer goals include `Burst`, `Scaling`, `Crit`, and `Status` (legacy `damage` maps to `Burst`)
- [x] Prime Resurgence / Varzia availability is integrated into world state and prime availability flows
- [x] Mod Builder exports build JSON plus math/output snapshots for optimizer debugging

### Working Queue

- [ ] No queued follow-up tasks right now

### Intake Rule

- [ ] If multiple tasks are requested at once, ask which one to focus on first
- [ ] Add the remaining requested tasks to `Working Queue` before starting implementation

### 🔴 Critical (Wiki-Aligned Damage Model / Optimizer)

#### Damage Calculation Corrections

- [x] Update quantization from `1/16` to `1/32` (already implemented: `quantumScale = totalBase / 32`)
- [x] Change scale to `Scale = Modded Base Damage / 32` (matches above)
- [x] Quantize each physical damage type separately (`roundQuantized` applied per key)
- [x] Quantize each elemental contribution separately (`roundQuantized` applied per key)
- [x] Quantize combined elemental sums as the final combined element — `combineElementQueue` collapses primary elements first, then the single quantization pass covers combined elements as units
- [x] Ensure physical/elemental bonuses do not affect scale — `quantumScale = totalBase/32` uses `totalBase = base×(1+damageBonus)` only; `impactBonus`, `heatBonus`, etc. change distribution but not scale
- [x] Apply non-elemental multipliers after quantization — faction damage bonus applied post-quantization: `totalDamage = totalDamageOf(damageBreakdown) × (1+factionDamageBonus)`
- [x] Separate `Arsenal Total Damage` from actual inflicted damage — `arsenalDamage` in `ModdedWeaponStats` is pre-faction/pre-armor; optimizer scoring uses `adjustedDirectDps` for actual effectiveness. (UI display of both values is a separate task.)
- [x] Apply target damage-type modifiers per damage type after quantization — `directDamageTypeMultiplier` called per key in `targetAdjustedDirectMultiplier` computation
- [x] Add unarmored target damage math — Corpus/Infested factions have `armor=0` → `armorDamageMultiplier(0)=1` (no reduction)
- [x] Add armored target damage math from the wiki formula — `armorDamageMultiplier(armor) = 300/(armor+300)`
- [x] Model toxin shield bypass correctly — `directDamageTypeMultiplier` for Toxin uses `1/healthShare` instead of the health+shield split
- [x] Update gun effective fire rate by trigger type:
  - [x] Auto / Semi / Duplex / Held — WFCD `fireRate` field already reports shots/second for all these trigger types; no extra handling needed
  - [x] Charge (`chargeTime` → effective rate via `1 / (chargeTime + 1/fireRate)`)
  - [ ] Burst — **blocked**: WFCD `All.json` has no `burstCount` field; need to source burst-round-count data before this can be implemented
- [ ] Use `Shots Per Magazine = Modded Mag Size / Ammo Cost Per Shot` — **blocked**: WFCD does not expose `ammoCostPerShot`; currently `shotsPerMag = magazineSize` (correct for most weapons; only affects specialty launchers)
- [x] Update sustained DPS to the wiki shooting-vs-reloading proportion formula — `sustainedDPS = burstDPS × (shootTime / (shootTime + reloadTime))`
- [ ] Add melee DPS math using average combo multiplier and base combo length — **deprioritized**: combo multiplier is constant across all builds of the same weapon so it doesn't affect intra-weapon optimizer rankings; only affects cross-weapon DPS display

#### Damage Over Time / Status Math

- [x] Implement DoT math from the wiki:
  - [x] Modded base damage — `dotBaseDamagePerProc = totalBase × (1+faction)² × statusDamageMult × critAvgMult`
  - [x] Modded multishot — `averageProcsPerShot = moddedMultishot × statusChance × procChanceByType[key]`
  - [x] Faction double-dip — confirmed: `(1+factionDamageBonus)²` in `dotBaseDamagePerProc`
  - [x] Total ticks — `perProcTotal = dotBaseDamagePerProc × multiplier × duration × (1+elementalBonus)` at 1 tick/sec
  - [x] Slash / Electricity / Heat / Toxin / Gas multipliers — Slash=0.35, all others=0.5
  - [x] Damage distribution weighting — `procChanceByType[key] = quantizedDamageBreakdown[key] / totalQuantizedDamage`
  - [x] Crit expectation — `critAverageMultiplier = avgCritMultiplier(critChance, critMult)` (multiplicative tiers)
  - [x] Status chance expectation — `baseProcsPerShot = moddedMultishot × statusChance`
- [ ] Split UI/output into (display task — logic already computed separately):
  - [ ] Arsenal damage (`arsenalDamage` field exists)
  - [ ] Direct inflicted damage (`adjustedDirectDps` in optimizer)
  - [ ] Expected DoT (`dotDpsByType` fields exist)
  - [ ] Burst DPS (`burstDPS` field exists)
  - [ ] Sustained DPS (`sustainedDPS` field exists)

#### Status Effect Accuracy (Wiki-Aligned)

- [x] Implement enemy status stack caps so status value is bounded correctly:
  - [x] Impact max 5 — `expectedStacks("impact", 1s, cap=5)`
  - [x] Puncture max 5 — `expectedStacks("puncture", 10s, cap=5)`
  - [x] Cold max 10 — `expectedStacks("cold", 6s, cap=10)`
  - [x] Blast max 10 — `expectedStacks("blast", 1.5s, cap=10)`
  - [x] Corrosive max 10 — `expectedStacks("corrosive", 8s, cap=10)`
  - [x] Gas max 10 — `expectedStacks("gas", 6s, cap=10)`
  - [x] Magnetic max 10 — `expectedStacks("magnetic", 6s, cap=10)`
  - [x] Radiation max 10 — `expectedStacks("radiation", 12s, cap=10)`
  - [x] Viral max 10 — `expectedStacks("viral", 6s, cap=10)`
  - [x] Tau max 10 — `expectedStacks("tau", 8s, cap=10)`
- [x] Model status durations by type (all used in expectedStacks):
  - [x] Impact 6s, Puncture 10s, Slash 6s, Heat 6s, Cold 6s, Electricity 6s, Toxin 6s
  - [x] Blast 1.5s to detonation
  - [x] Corrosive 8s, Gas 6s, Magnetic 6s, Radiation 12s, Viral 6s, Tau 8s
  - [x] Cold freeze at 10 stacks — `coldSlow=1`, `coldCritDamageBonus=1.0` when stacks≥10
- [x] Model DoT tick timing correctly:
  - [x] Slash / Heat / Toxin start after 1 second delay — `dotRealizationFactor(ttk, duration, tickDelay=1)`
  - [x] Electricity / Gas tick immediately at 0s — `dotRealizationFactor(ttk, duration, tickDelay=0)`
  - [x] Blast detonation timing — modeled via `blastDetonationDamagePerShot` and `blastUtilityDps`
- [x] Model Heat-specific behavior:
  - [ ] Panic duration — not modeled (minor effect; difficult to quantify in optimizer)
  - [x] Gradual armor strip to 50% — `heatArmorStrip = 0.5 × min(1, heatStacks)` → feeds `combinedArmorStrip` → `effectiveArmorMultiplier`
  - [ ] Heat inherit / refresh behavior — not modeled (complex simulation; beyond optimizer scope)
- [x] Model Cold-specific behavior:
  - [x] Slow scaling by stacks — `coldSlow = scaleForStacks(min(stacks,9), 0.5, 0.05, 0.9)`
  - [x] Crit multiplier bonus by stacks — `coldCritDamageBonus = scaleForStacks(min(stacks,9), 0.1, 0.05, 0.45)`
  - [x] Freeze at 10 stacks — `coldSlow=1`, `coldCritDamageBonus=1.0`
  - [ ] 3 residual stacks after freeze ends — not modeled (very minor; sustain-combat approximation)
- [x] Model Puncture-specific behavior:
  - [x] Enemy damage reduction by stacks — `punctureEnemyDamageReduction = scaleForStacks(stacks, 0.4, 0.1, 0.8)`
  - [x] Additive crit chance taken by stacks — `punctureCritChanceBonus = scaleLinearCap(stacks, 0.05, 0.25)`
  - [ ] AoE/ability restriction — not modeled (niche; would require ability-type tagging)
- [x] Model Impact-specific behavior:
  - [x] Mercy threshold increase by stacks — `impactMercyThresholdBonus = scaleLinearCap(stacks, 0.08, 0.4)`
  - [ ] Stagger behavior — not modeled (non-DPS utility; out of scope for damage optimizer)
- [x] Model Corrosive-specific behavior:
  - [x] 26% first stack, +6% per additional stack, 80% cap — `scaleForStacks(stacks, 0.26, 0.06, 0.8)` → `corrosiveArmorStrip`
- [x] Model Viral-specific behavior:
  - [x] 100% first stack, +25% per additional, 325% cap — `scaleForStacks(stacks, 1.0, 0.25, 3.25)` → `viralHealthDamageBonus`
- [x] Model Magnetic-specific behavior:
  - [x] Shield amplification by stacks — `magneticShieldDamageBonus = scaleForStacks(stacks, 1.0, 0.25, 3.25)`
  - [x] Shield regen suppression — `magneticUtilityWeight = shieldShare × 0.06` when any magnetic stacks present
  - [ ] Electricity proc on shield/overguard break — not modeled (rare trigger; very situational)
- [x] Model Radiation-specific behavior:
  - [x] Friendly-fire confusion utility — `radiationUtilityWeight = radiationAllyDamageBonus × 0.04` when grouped
  - [x] Damage-to-allies scaling — `radiationAllyDamageBonus = scaleForStacks(stacks, 1.0, 0.5, 5.5)` (computed, feeds radiationUtilityWeight)
- [x] Model Gas-specific behavior:
  - [x] Radius growth by stacks — `gasCloudRadius = min(6, 3 + (stacks−1) × 0.3)`
  - [x] AoE DoT behavior — `(target.grouped ? 1.25 : 1)` multiplier on Gas DoT in `adjustedDotDps`
- [x] Model Blast-specific behavior:
  - [x] Single-target detonation damage — `blastDetonationDamagePerShot = procs × blastShare × totalBase × 0.3`
  - [x] Higher AoE damage to surrounding enemies — `blastGroupedMultiplier = (0.3 + 3.0×2)/0.3 = 21` in `blastUtilityDps`
  - [ ] 10-stack premature detonation — not modeled (timing edge case)
  - [ ] Death-triggered premature detonation — not modeled (situational)
- [x] Model Tau-specific behavior:
  - [x] Status vulnerability stacks — `tauStatusVulnerability = scaleLinearCap(stacks, 0.1, 1.0)` → scored in `statusWeight`
  - [ ] Increased received status chance — not modeled in proc rate calculation (would require iterative solve)
- [ ] Recalculate proc type weights when target is immune to a proc type
- [ ] Add handling for fully status-immune targets
- [ ] Add handling for partially status-immune targets
- [ ] Add support for forced procs independent of status chance
- [ ] Distinguish player-only / enemy-only status behavior where needed
- [ ] Audit which statuses should count as separate Condition Overload / Galvanized states

#### Optimizer Correctness

- [x] Finish element ordering correctness across all build paths — `combineElementQueue` uses mod slot index as insertion order; primary elements combine in slot order, matching in-game behavior
- [x] Fix Hunter Munitions / Slash DoT TTK catch-22 for scaling goal: optimizer was computing estimatedTimeToKill from the already-fast direct DPS, making Slash realization factor 0 (first tick at 1s, TTK < 1s). "Scaling" implies endgame/Steel Path enemies; added `dotTTK = max(5.0s, estimatedTTK)` for scaling goal only so Slash gets ~33% realization, restoring correct scoring for Hunter Munitions and armor-bypassing DoT.
- [x] Fix crit tier formula: `avgCritMultiplier` was using additive `1 + n*(critMult-1)` per tier instead of multiplicative `critMult^n`. For sub-100% crit weapons, no change. For snipers/high-crit builds reaching orange/red (>100% crit), the old formula undervalued crit chance by 2–6×. Rubico Prime at 195% crit with Vital Sense went from avg 4.75× to correct 9.75×.
- [x] Make multishot affect expected hit count, crit rolls, and status rolls correctly — `arsenalDamage = totalDamage × multishot`; `averageProcsPerShot = multishot × statusChance`; both yield correct expected values per shot
- [x] Ensure faction damage double-dips on DoT statuses where applicable — confirmed correct, no change needed (see note in Optimizer Correctness below)
- [x] Separate direct-hit damage from DoT/status value in the scoring pipeline — `adjustedDirectDps` vs `adjustedDotDps` are scored separately with goal-appropriate weights (DoT 0.8× for burst, 1.35× for scaling)
- [x] Fix `statusWeight` raw DPS ratio — replaced `modded.dotDps / sustainedDPS` (treats all DoT types equally regardless of armor) with `adjustedDotDps / (adjustedDirectDps + adjustedDotDps)` (armor-corrected; Slash correctly outweighs Electricity vs heavy armor)
- [x] Remove `viralHealthDamageBonus * 0.3` double-count from `statusWeight` — Viral's benefit is already captured in `adjustedDotDps` and `adjustedDirectDps` via `(1 + viralHealthDamageBonus)`; the extra term was inflating every Viral/Cold/Toxin mod by ~0.975 and masking better crit/damage choices
- [x] Fix activation-condition mods parsed as passive stats — `parseStatLine` now guards `to gain` (e.g. Proton Snap "Hold Wall Latch for 2s to gain +100%") and `and +N` continuation lines so they return `emptyEffect()` instead of mis-parsed values
- [x] Default faction target (no faction selected) uses balanced median stats: armor 600, healthShare 0.85, shieldShare 0.15, effectiveHealth 21000 — derived from median/average across all 13 main factions; avoids trivially easy paper-target (armor=0) that suppressed armor-strip mod value
- [x] Melee Influence arcane support: added `aoeElementalStatusSpreadChance` / `aoeElementalStatusSpreadRadius` fields to `ModEffect` + `ModdedWeaponStats`; `arcaneCatalog` parses "On Melee X Status: N% chance for elemental Melee Status Effects to apply to enemies within Xm" pattern; optimizer multiplies elemental DoT DPS by `(1 + chance × 4)` for grouped targets that have Electricity procs
- [x] Fix weapon-specific augment over-matching: `getModsForWeapon` was using `compatLower.includes(weaponNameLower)` which made "Soma" see "Soma Prime"-exclusive mods (Hata-Satya). Now only `weaponNameLower.includes(compatLower)` (forward direction only: variant weapons see base augments, not vice versa)
- [x] Faction damage double-dip on DoT confirmed correct — `dotBaseDamagePerProc` already applies `(1 + factionDamageBonus)^2`; `factionMod()` in `adjustedDotDps` is the separate per-type affinity modifier. No change needed.
- [x] Make status weighting/proc chance use final quantized damage-type contribution consistently — `procChanceByType[key] = damageBreakdown[key] / totalDamageOf(damageBreakdown)` uses quantized `damageBreakdown`
- [ ] Ensure displayed damage breakdown includes every final modded damage type — UI task; `damageBreakdown` in `ModdedWeaponStats` has all types, needs surface in the mod builder output panel
- [x] Audit the optimizer against the current wiki formulas — completed in session 2026-04-07 (live Chrome wiki verification):
  - Faction damage affinity modifiers verified against wiki.warframe.com/w/Damage/<Faction> pages: all 14 factions in `FACTION_DAMAGE_MODIFIERS` are 100% correct.
  - **BUG FIXED: Impact status duration** was `1s` in `expectedStacks("impact", 1, 5)`. Wiki states Impact lasts **6 seconds** per stack. Fixed to `expectedStacks("impact", 6, 5)`.
  - **BUG FIXED: Slash DoT shield bypass** — code comment and formula incorrectly had Slash bypassing both armor AND shields using `shieldBypassHealthFactor`. Wiki states only: "temporarily ignores the target's armor." Slash DoT does NOT bypass shields. Fixed to `target.healthShare × (1 + viral) + target.shieldShare` (armor bypassed, shields hit normally).
  - **BUG FIXED: Slash DoT faction type affinity** — `factionMod("slash")` was applied to the Slash Bleed DoT. Wiki states Slash/Bleed deals Cinematic damage which has "neutral modifiers" — faction TYPE AFFINITY (the ±50% table) does NOT apply to the DoT ticks. Fixed to `1×`. The faction DAMAGE mod (Bane of Grineer) is already correctly double-dipped in `dotBaseDamagePerProc` and is separate from type affinity.
  - All other subsystems verified correct: Corrosive (26/6/80), Viral (100/25/325), Heat (0.5×, 6s, 1s delay), Toxin (0.5×, 6s, 1s delay, shield bypass ✓), Electricity (0.5×, 6s, immediate), Gas (0.5×, 6s, immediate, radius `3+(stacks-1)×0.3`), Cold (slow 50/5/90%, crit 0.1/0.05/0.45, freeze at 10), Puncture (40/10/80%, crit 5%/25%), Blast (1.5s fuse, 0.3× single, 3.0× AoE), Magnetic (100/25/325%, regen suppressed), Radiation (100/50/550%, 12s), armor formula `300/(armor+300)`, crit tier `critMult^n`, quantization `totalBase/32`, element combos, DoT faction double-dip.
  - Remaining `approximation`: faction affinity aggregates per-unit-type; Gas/Electricity AoE scalar (fixed multiplier vs actual radius); blast detonation (probabilistic timing omitted).

### 🟠 High Impact (Status / Utility Modeling)

- [x] Add explicit scoring for Heat armor strip plus DoT — Heat strip feeds `combinedArmorStrip → effectiveArmorMultiplier`; Heat DoT in `adjustedDotDps` with 1s tick delay
- [x] Add explicit scoring for Viral health amplification — `(1 + viralHealthDamageBonus)` applied to both `adjustedDirectDps` and all health-targeting DoT paths
- [x] Add explicit scoring for Corrosive armor strip and stack assumptions — Corrosive strip feeds `combinedArmorStrip → effectiveArmorMultiplier`; stacks capped at 10 with correct 26/6/80 formula
- [x] Add explicit scoring for Cold and Puncture as crit-support statuses — `coldCritMultiplierGain` and `punctureCritGain` applied to `burstDamageScore`; both affect DoT crits too
- [x] Add explicit scoring for Toxin as shield-bypass value — `directDamageTypeMultiplier` for Toxin divides out `healthShare` penalty so it bypasses shield HP
- [x] Add scenario-aware handling for Magnetic — `magneticUtilityWeight` and `magneticShieldDamageBonus` in `adjustedDirectDps` via `directDamageTypeMultiplier`; regen suppression scored if target has shields
- [x] Add AoE-aware scoring for Electric and Gas — Electricity: `×1.2` grouped; Gas: `×1.25` grouped; both scale with `aoeSpreadMult` for Melee Influence builds
- [x] Add better Blast handling as conditional AoE/utility — `blastUtilityDps` = `blastDetonationDamagePerShot × fireRate × (grouped ? 21 : 0.75)`; scored in burst, scaling, and status goals
- [ ] Add per-target state simulation for:
  - [ ] Slash
  - [ ] Heat
  - [ ] Electric
  - [ ] Toxin
  - [ ] Gas
  - [ ] Viral
  - [ ] Corrosive
  - [ ] Cold
  - [ ] Blast
  - [ ] Magnetic
  - [ ] Radiation
  - [ ] Impact
- [ ] Add target/profile toggles:
  - [ ] Armored
  - [ ] Shielded
  - [ ] Overguard
  - [ ] Boss / attenuation
  - [ ] Crowd-clear
  - [ ] Endurance / DoT
- [ ] Improve utility scoring for punch-through, fire rate, reload, ammo efficiency, projectile velocity, and similar mods

### 🟡 High Impact (UX & Performance)

- [x] Add React error boundaries to every page (prevents full-page crashes when logic engines throw)
- [x] Add unit tests for the 16 logic engines — especially `requirementEngine`, `goalExpansion`, `processInvasions`
- [x] Fix WorldState 1-second timer (`useNow()`) to only re-render the active tab
- [x] Add confirmation step before profile import (currently merges immediately with no undo)
- [x] Add `useShallow` to heavy Zustand selectors in Goals and Requirements pages
- [x] Virtualize long lists: Inventory (already done), Mods (3000+ — mods + arcanes sections), Challenges (300 grid cards — acceptable without virtualization)
- [x] Complete light mode across all components (styles.css has comprehensive .theme-light remapping for all slate-* classes)
- [x] Extract duplicate profile import logic (`importProfileViewingDataJson` and `importProfileFromWarframeStatApi` are ~80% identical)
- [x] Add backup-before-migration to prevent data loss if schema migration fails

### 🟣 Explainability / UX

- [ ] Show optimizer assumptions clearly:
  - [ ] Target profile
  - [ ] Expected crit tier
  - [ ] Proc mix
  - [ ] Direct-hit contribution
  - [ ] DoT contribution
  - [ ] Armor / shield assumptions
- [ ] Add a “why this build won” panel
- [ ] Show proc-weight distribution more clearly

### 🟠 UX Polish

- [x] Fix invasion completion % to use runsCompleted / runsRequired instead of API-provided value
- [x] Add "almost complete" goal highlighting (e.g. highlight goals that are 90%+ done)
- [x] Link farming sources in Requirements page back to the Star Chart node
- [x] Add completion status overlay on Star Chart drop panels
- [x] Make Handbook more discoverable (consider surfacing on dashboard for new players)

### 🟢 Data / Infrastructure

- [x] Replace `src/data/All.json`, `wfdata.json`, `modsets.json`, `rivens.json`, `sources.json`, `moddescriptions.json` with imports from `external/warframe-items/raw/` and `external/warframe-drop-data/raw/`
- [x] Delete orphaned `src/data/` files with no TypeScript imports (patchlogs, variants, abilities, abilitystats, glyphs, modularparts)
- [x] Replace `_generated/wfcd-platinum.byPath.auto.json` with `marketCost` field from `All.json`
- [ ] Write generation scripts for remaining `_generated/` files (currently committed as stale artifacts):
  - [ ] `generateWfcdItems.ts` → `wfcd-items.byCatalogId.auto.json`
  - [ ] `generateWfcdAcquisition.ts` → `wfcd-acquisition.byCatalogId.auto.json`
  - [ ] `generateWfcdRequirements.ts` → `wfcd-requirements.byCatalogId.auto.json`
  - [ ] `generateSourceLabelMap.ts` → `wfcd-source-label-map.auto.json` / `source-label-map.auto.json`
  - [ ] `generateRelicMissionIndex.ts` → `relic-missionRewards-index.auto.json`
- [ ] Run generation scripts to regenerate all `_generated/` files from external sources
- [ ] Add npm script (e.g. `generate:data`) to run all generation scripts in order

### 🔵 New Features (Roadmap)

- [x] Relic farming assistant (void fissure tier optimizer, void trace calculator)
- [x] Mod ownership tracking (prerequisite for loadout planning)
- [x] Vaulted/unvaulted item status integration
- [ ] Nightwave challenge optimizer ("which weeklies give max creds fastest?")
- [ ] Steel Path rotation calendar (when does my target item return?)
- [ ] Full set-mod bonus implementation
- [ ] Full Galvanized conditional/proc-stack verification
- [ ] Full arcane optimization verification

---

## Working Conventions

- Run `tsc -b` before committing to catch type errors
- Logic engines in `src/domain/logic/` are pure functions — keep them that way
- Canonical IDs live in `src/domain/ids/` — use enums, never raw strings
- State mutations go through Zustand + Immer in `src/store/store.ts`
- New acquisition sources belong in `src/catalog/` as a new adapter file
