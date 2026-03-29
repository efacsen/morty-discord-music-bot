---
phase: 01-typescript-foundation
plan: 01
subsystem: infra
tags: [typescript, tsconfig, discord.js, discord-player, build]
requires: []
provides:
  - TypeScript compiler configuration for the mixed JS/TS codebase
  - Shared command, event, and queue metadata interfaces
  - Build, dev, start, and typecheck npm scripts targeting dist output
  - Exact discord-player 7.2.0 version pins to stabilize later migration work
affects: [source-migration, setup-wizard, documentation]
tech-stack:
  added: [typescript, eslint, @eslint/js, typescript-eslint, prettier, eslint-config-prettier]
  patterns: [NodeNext mixed JS/TS compilation, shared discord.js module augmentation]
key-files:
  created: [.planning/phases/01-typescript-foundation/01-01-SUMMARY.md, tsconfig.json, src/types/index.ts]
  modified: [package.json, package-lock.json, .gitignore]
key-decisions:
  - "Use NodeNext with allowJs enabled so Phase 1 compiles the existing JS codebase without forcing early migration."
  - "Augment discord.js Client with commands instead of introducing a custom client wrapper before source migration."
patterns-established:
  - "Shared bot contracts live in src/types/index.ts and are imported as the single type entrypoint."
  - "Runtime entrypoints now target dist output while development uses tsx watch against src/index.ts."
requirements-completed: [TSF-01, TSF-02, TSF-03, TSF-06]
duration: 2 min
completed: 2026-03-29
---

# Phase 1 Plan 01: TypeScript Foundation Summary

**NodeNext TypeScript scaffolding with pinned discord-player 7.2.0 dependencies and shared bot type contracts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T16:25:56Z
- **Completed:** 2026-03-29T16:28:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added the TypeScript, ESLint, and Prettier toolchain to project devDependencies and updated npm scripts for `build`, `dev`, `start`, `typecheck`, `lint`, and `format`.
- Pinned `discord-player` and `@discord-player/extractor` to exactly `7.2.0` and added `dist/` to `.gitignore`.
- Created `tsconfig.json` and `src/types/index.ts` so future migration work can rely on shared contracts and a stable compiler setup.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install devDependencies and pin production versions** - `86a50ce` (feat)
2. **Task 2: Create tsconfig.json and src/types/index.ts** - `360d45f` (feat)

## Files Created/Modified

- `package.json` - switches entrypoints to `dist/`, adds build/typecheck/dev scripts, pins package versions, and records the TypeScript toolchain.
- `package-lock.json` - captures the installed toolchain and exact resolved dependency graph.
- `.gitignore` - ignores `dist/` compiler output.
- `tsconfig.json` - configures strict NodeNext TypeScript compilation with `allowJs` for the mixed-codebase phase.
- `src/types/index.ts` - defines `CommandModule`, `EventModule`, `QueueMetadata`, and augments `discord.js` `Client`.

## Decisions Made

- Used `module: "NodeNext"` with `allowJs: true` and `checkJs: false` so TypeScript can compile the current JavaScript codebase without blocking Phase 2 migration sequencing.
- Used module augmentation on `discord.js` `Client` for `commands` because the current runtime already writes to `client.commands`, so this preserves existing call sites.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npm install` required registry access outside the sandbox to refresh `package-lock.json`; once allowed, installation and verification completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 can now migrate source files onto a working compiler and shared type layer.
- ESLint, Prettier, and the `@snazzah/davey` startup guard remain for plan `01-02`.

## Self-Check: PASSED

- Found `.planning/phases/01-typescript-foundation/01-01-SUMMARY.md`
- Found commit `86a50ce`
- Found commit `360d45f`
