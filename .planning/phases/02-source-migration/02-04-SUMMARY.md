---
phase: 02-source-migration
plan: 04
subsystem: infra
tags: [typescript, discord.js, discord-player, nodenext, eslint]
requires:
  - phase: 01-typescript-foundation
    provides: TypeScript compiler settings, shared bot interfaces, and the Phase 1 index.ts shim
provides:
  - Full typed bootstrap in src/index.ts with discord-player event wiring and dynamic command/event loaders
  - TS-only compiler configuration with allowJs disabled and the bootstrap included in compilation
  - Final migration gate verification with zero JavaScript files left in src/ and clean build plus lint output
affects: [setup-wizard, command-audit, docker, documentation, source-migration]
tech-stack:
  added: []
  patterns:
    - Preserve runtime bootstrap logic exactly while moving the real entrypoint into TypeScript
    - Use .js import specifiers plus dual .ts/.js file filters so tsx development and compiled dist resolve through one loader path
    - Contain discord-player and queue metadata type mismatches at the bootstrap boundary with narrow assertions
key-files:
  created: []
  modified:
    - src/index.ts
    - src/index.js
    - tsconfig.json
key-decisions:
  - "Preserved the full bootstrap behavior in src/index.ts, including the @snazzah/davey guard, player event wiring, and process-level error handlers."
  - "Kept discord-player constructor and queue metadata fixes local to the bootstrap boundary instead of widening shared project types."
patterns-established:
  - "Bootstrap loaders should filter both .ts and .js filenames but import through .js specifiers so tsx and dist behave the same."
  - "Player event handlers should assert QueueMetadata at the boundary before channel sends or embed generation."
requirements-completed: [MIG-07, MIG-08, MIG-03]
duration: 8m
completed: 2026-03-30
---

# Phase 2 Plan 4: Source Migration Summary

**Typed bootstrap entrypoint with final TS-only compiler settings, dual-mode dynamic loaders, and the `willPlayTrack` resolver wired correctly**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T04:28:30+02:00
- **Completed:** 2026-03-30T04:36:40+02:00
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced the Phase 1 shim in `src/index.ts` with the full typed Discord bootstrap, including the client setup, `discord-player` wiring, extractor registration, dynamic loaders, and process error handlers.
- Deleted `src/index.js` and finalized `tsconfig.json` by disabling `allowJs` and re-including the bootstrap in compilation.
- Verified the completed migration gate: zero `.js` files remain in `src/`, `23` `.ts` files are present, `npm run build` passes, `npx eslint src/` passes, and `dist/` mirrors the `src/` runtime structure.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate bootstrap and finalize tsconfig** - `800bd5e` (feat)
2. **Task 2: Final verification — no JS in src, full build clean** - `e4ab686` (chore)

**Plan metadata:** Created in the final docs commit for summary and planning state updates

## Files Created/Modified

- `src/index.ts` - Replaced the shim with the full typed bootstrap and preserved all runtime wiring.
- `src/index.js` - Removed after migrating the real entrypoint into TypeScript.
- `tsconfig.json` - Disabled `allowJs` and removed the bootstrap exclusion so the compiler now builds the full `src/` tree.

## Decisions Made

- Preserved the original bootstrap logic exactly instead of refactoring during the migration capstone, so the change stays type-focused and easy to compare against the legacy entrypoint.
- Used narrow assertions only at the `discord-player` client/options boundary and queue metadata channel boundary where the published typings were stricter than the proven runtime behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed strict TypeScript failures at the discord-player and queue metadata boundaries**
- **Found during:** Task 1 (Migrate bootstrap and finalize tsconfig)
- **Issue:** The migrated bootstrap failed to compile because `discord-player`'s `Client` type identity differed from the ESM import mode used by the app, and `QueueMetadata['channel']` was too broad for direct `.send()` calls in player event handlers.
- **Fix:** Added contained bootstrap-level assertions for the `Player` constructor input and for queue metadata channel access, without changing shared runtime behavior.
- **Files modified:** `src/index.ts`
- **Verification:** `npm run build` passed after the boundary assertions were added.
- **Committed in:** `800bd5e`

**2. [Rule 3 - Blocking] Preserved the legacy player constructor options despite discord-player's narrower published init type**
- **Found during:** Task 1 (Migrate bootstrap and finalize tsconfig)
- **Issue:** The existing bootstrap passes a `ytdlOptions` object to `new Player(...)`, but the published `PlayerInitOptions` type in `discord-player@7.2.0` does not include that property even though the runtime code previously relied on it.
- **Fix:** Kept the existing options object unchanged and isolated the mismatch behind a constructor-boundary assertion so the migration could preserve behavior and complete the TS-only build.
- **Files modified:** `src/index.ts`
- **Verification:** `npm run build` passed and `dist/index.js` was emitted with the legacy options preserved in the compiled output.
- **Committed in:** `800bd5e`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were required to preserve the existing bootstrap behavior under strict TypeScript. No scope creep beyond the migration boundary.

## Issues Encountered

- Parallel `git add` calls collided on `.git/index.lock` during Task 1 staging. The stale lock was removed and the deleted bootstrap file was staged serially before committing.
- Recording the empty verification commit required elevated permissions because the sandbox blocked creating `.git/index.lock`; the commit succeeded unchanged once rerun with approval.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 source migration is code-complete: the runtime entrypoint, commands, events, handlers, extractor, utilities, and shared types all compile from TypeScript with no JavaScript left in `src/`.
- Phase 3 can now build on `dist/index.js` as the single production entrypoint, while Phase 4 remains responsible for live Discord command audit and manual end-to-end behavior checks.

## Self-Check

PASSED

---
*Phase: 02-source-migration*
*Completed: 2026-03-30*
