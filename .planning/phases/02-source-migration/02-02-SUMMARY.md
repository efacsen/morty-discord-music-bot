---
phase: 02-source-migration
plan: 02
subsystem: infra
tags: [typescript, discord.js, discord-player, yt-dlp-wrap, nodenext]
requires:
  - phase: 01-typescript-foundation
    provides: TypeScript compiler config, shared bot interfaces, and NodeNext build conventions
provides:
  - Typed YtDlp extractor extending discord-player BaseExtractor<object>
  - Typed ready and interactionCreate event modules
  - Typed player button handler using QueueMetadata queue access
affects: [02-03, 02-04, source-migration]
tech-stack:
  added: []
  patterns:
    - Preserve runtime logic during JS to TS ports and add explicit boundary types only
    - Keep EventModule execute signatures aligned via unknown[] arguments and local casts
    - Use contained assertions at discord-player and yt-dlp-wrap boundaries when upstream types are incomplete
key-files:
  created:
    - src/extractors/YtDlpExtractor.ts
    - src/events/ready.ts
    - src/events/interactionCreate.ts
    - src/handlers/buttonHandler.ts
  modified:
    - src/extractors/YtDlpExtractor.js
    - src/events/ready.js
    - src/events/interactionCreate.js
    - src/handlers/buttonHandler.js
key-decisions:
  - "Used targeted assertions at yt-dlp-wrap and discord-player playlist boundaries to preserve the existing extractor logic under strict TypeScript."
  - "Kept EventModule exports on the shared unknown[] signature and cast concrete Discord types inside each event handler body."
patterns-established:
  - "Mid-tier runtime modules should keep .js local import specifiers after conversion so NodeNext and tsx resolve the same source graph."
  - "Button interaction handlers use useQueue<QueueMetadata>(interaction.guild!.id) for typed queue access."
requirements-completed: [MIG-02, MIG-04, MIG-05]
duration: 2m
completed: 2026-03-30
---

# Phase 2 Plan 2: Source Migration Summary

**Typed yt-dlp extraction, event registration plumbing, and player button handling across the bot runtime core**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-30T02:15:55Z
- **Completed:** 2026-03-30T02:17:35Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Ported `YtDlpExtractor` to TypeScript as a typed `BaseExtractor<object>` implementation while preserving the existing yt-dlp lookup, search, playlist, and streaming logic.
- Converted both runtime event modules to the shared `EventModule` contract so command registration and interaction dispatch are typed but behavior stays unchanged.
- Migrated the player button handler to TypeScript with typed `ButtonInteraction` and `useQueue<QueueMetadata>` access, keeping queue controls and now-playing updates intact.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate YtDlpExtractor to TypeScript** - `680af4b` (feat)
2. **Task 2: Migrate event handlers and button handler** - `0015ec3` (feat)

**Plan metadata:** Created in the final docs commit for summary and planning state updates

## Files Created/Modified

- `src/extractors/YtDlpExtractor.ts` - Typed the custom YouTube extractor around `BaseExtractor<object>` and `yt-dlp-wrap`.
- `src/events/ready.ts` - Typed bot ready handling and slash command registration against `EventModule`.
- `src/events/interactionCreate.ts` - Typed interaction routing between button handling and slash command execution.
- `src/handlers/buttonHandler.ts` - Typed queue-control button handling with `ButtonInteraction` and `QueueMetadata`.
- `src/extractors/YtDlpExtractor.js` - Removed the legacy JavaScript extractor source.
- `src/events/ready.js` - Removed after TypeScript migration.
- `src/events/interactionCreate.js` - Removed after TypeScript migration.
- `src/handlers/buttonHandler.js` - Removed after TypeScript migration.

## Decisions Made

- Used narrow assertions only at external-library boundaries where the existing runtime shape was broader than the published TypeScript surface.
- Kept the shared `EventModule` signature unchanged and cast concrete Discord event payload types inside each handler body instead of widening the project-wide interface.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected planning metadata after roadmap/state tooling left stale plan progress**
- **Found during:** Post-task documentation and state updates
- **Issue:** `roadmap update-plan-progress 02` reported success, but `ROADMAP.md` still showed Phase 2 at `1/4` and left `02-02-PLAN.md` unchecked; `STATE.md` also retained stale human-readable status and metrics.
- **Fix:** Manually updated `ROADMAP.md`, the human-readable sections of `STATE.md`, and the requirements footer so the planning artifacts match the completed plan state.
- **Files modified:** `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/REQUIREMENTS.md`
- **Verification:** Re-read all three files and confirmed Phase 2 now shows `2/4`, current plan `3`, and the completed requirement statuses for `MIG-02`, `MIG-04`, and `MIG-05`.
- **Committed in:** Final docs commit

**2. [Rule 3 - Blocking] Preserved requirement accuracy despite a plan frontmatter mismatch**
- **Found during:** Summary creation and requirements update
- **Issue:** `02-02-PLAN.md` lists `MIG-03`, but the typed `willPlayTrack` listener is still in `src/index.js`, outside this plan's file scope.
- **Fix:** Left `MIG-03` pending, documented the mismatch in the summary, and marked only the requirements actually completed by this plan.
- **Files modified:** `.planning/phases/02-source-migration/02-02-SUMMARY.md`, `.planning/REQUIREMENTS.md`
- **Verification:** Confirmed `MIG-03` remains unchecked in `.planning/REQUIREMENTS.md` and noted its expected closure in `02-04-PLAN.md`.
- **Committed in:** Final docs commit

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were limited to planning metadata and requirement accounting so the recorded plan state stays accurate without overstating completed migration work.

## Issues Encountered

- Parallel `git add` calls briefly collided on `.git/index.lock` during task staging; the affected path was restaged serially and both task commits completed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The extractor, handler, and event layer are now typed and ready for the command-file migration in `02-03-PLAN.md`.
- `npm run build` passes with the new TypeScript runtime modules in place and the targeted `.js` directories now contain only `.ts` files.
- `MIG-03` should be closed during bootstrap migration when `willPlayTrack` moves into typed `src/index.ts`.

## Self-Check

PASSED

---
*Phase: 02-source-migration*
*Completed: 2026-03-30*
