---
phase: 01-typescript-foundation
plan: 02
subsystem: infra
tags: [eslint, prettier, typescript-eslint, davey, discord]
requires:
  - phase: 01-01
    provides: "tsconfig.json and shared type contracts required for typed linting"
provides:
  - ESLint 9 flat config scoped to TypeScript source files
  - Prettier rules and ignore list for the mixed JS/TS Phase 1 boundary
  - Startup-time validation that @snazzah/davey is available before Discord client initialization
affects: [source-migration, setup-wizard, documentation]
tech-stack:
  added: []
  patterns:
    - TypeScript-only flat linting inside a mixed JavaScript and TypeScript repository
    - Fail-fast startup validation for native voice encryption dependencies
key-files:
  created:
    - .planning/phases/01-typescript-foundation/01-02-SUMMARY.md
    - eslint.config.js
    - .prettierrc
    - .prettierignore
  modified:
    - src/index.js
key-decisions:
  - "Restrict ESLint and Prettier to .ts files during Phase 1 so the unmigrated JavaScript surface stays out of scope."
  - "Use a dynamic import() guard before client construction to fail fast when @snazzah/davey is unavailable."
patterns-established:
  - "tseslint.config flat config entries scope linting to migrated TypeScript files while global ignores shield the legacy JavaScript tree."
  - "Runtime-only native dependencies are validated at process startup instead of surfacing later during voice connection attempts."
requirements-completed: [TSF-04, TSF-05, TSF-07]
duration: 4 min
completed: 2026-03-29
---

# Phase 1 Plan 02: TypeScript Foundation Summary

**ESLint 9 TypeScript-only flat config, Prettier Phase 1 formatting rules, and a fail-fast Davey startup guard**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T16:31:50Z
- **Completed:** 2026-03-29T16:35:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `eslint.config.js` with `tseslint.config(...)`, TypeScript-aware recommended presets, and `eslint-config-prettier` as the final config layer.
- Added `.prettierrc` and `.prettierignore` so formatting checks apply only to the Phase 1 TypeScript surface.
- Added `checkDavey()` to `src/index.js` so missing `@snazzah/davey` fails immediately instead of during later voice connection attempts.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ESLint 9 flat config and Prettier config** - `441fe61` (feat)
2. **Task 2: Add @snazzah/davey startup guard to src/index.js** - `837df66` (feat)

## Files Created/Modified

- `eslint.config.js` - scopes linting to `src/**/*.ts`, enables typed linting via `projectService`, and disables Prettier-conflicting rules.
- `.prettierrc` - defines the Phase 1 formatting baseline: single quotes, no semicolons, 100-character print width.
- `.prettierignore` - excludes generated output, dependencies, and JavaScript files from formatting during the mixed-codebase phase.
- `src/index.js` - adds a startup guard that dynamically imports `@snazzah/davey` before client initialization and exits with a descriptive error when absent.

## Decisions Made

- Restrict ESLint and Prettier to TypeScript files only in Phase 1 so existing JavaScript files remain untouched until Phase 2 migration.
- Keep the Davey dependency check in `src/index.js` instead of moving entrypoint work into TypeScript early, preserving the Phase 1 no-migration boundary.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The runtime probe reached a sandbox DNS failure for `discord.com` after loading commands and events. That confirmed the Davey guard had already passed and startup continued into the existing login path.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 can migrate source files onto an enforced lint/format baseline without widening ESLint to the legacy JavaScript tree prematurely.
- The runtime entrypoint now protects the required DAVE voice encryption dependency from accidental removal during later refactors.

## Self-Check: PASSED

- Found `.planning/phases/01-typescript-foundation/01-02-SUMMARY.md`
- Found commit `441fe61`
- Found commit `837df66`

---
*Phase: 01-typescript-foundation*
*Completed: 2026-03-29*
