---
phase: 01-typescript-foundation
plan: 03
subsystem: infra
tags: [tsx, watch-mode, typescript, gap-closure]
requires:
  - phase: 01-02
    provides: "Phase 1 scripts, lint config, and the JS bootstrap that the shim forwards to"
provides:
  - Explicit `tsx` project dependency for the locked dev script contract
  - A Phase 1-safe `src/index.ts` shim that forwards to the existing JavaScript bootstrap
  - Compiler and lint exclusions that prevent duplicate `dist/index.js` output during the mixed JS/TS phase
affects: [source-migration, developer-workflow]
tech-stack:
  added: [tsx]
  patterns:
    - "TypeScript watch entrypoint shim that imports the legacy JavaScript bootstrap during phased migration"
    - "Entry-point-specific compiler and lint exclusions to avoid duplicate mixed-mode emit collisions"
key-files:
  created:
    - .planning/phases/01-typescript-foundation/01-03-SUMMARY.md
    - src/index.ts
  modified:
    - package.json
    - package-lock.json
    - tsconfig.json
    - eslint.config.js
key-decisions:
  - "Keep the Phase 1 dev script contract locked to `tsx watch src/index.ts` and restore it by installing `tsx` explicitly instead of changing scripts."
  - "Use a one-line TypeScript shim that imports `./index.js` so watch mode works now without forcing the source migration into Phase 1."
patterns-established:
  - "Development can target a TypeScript entry shim while production continues to boot from the compiled JavaScript entrypoint."
  - "Mixed JS/TS phases can exclude a shim entrypoint from emit and lint scope when it exists only to satisfy a temporary workflow contract."
requirements-completed: [TSF-03]
duration: 154 min
completed: 2026-03-29
---

# Phase 1 Plan 03: TypeScript Foundation Summary

**Restore the promised `tsx` watch workflow with an explicit dependency and a minimal TypeScript entry shim**

## Performance

- **Duration:** 154 min
- **Started:** 2026-03-29T17:04:18Z
- **Completed:** 2026-03-29T19:38:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `tsx` as an explicit devDependency while preserving the locked `build`, `dev`, and `start` script contract.
- Created `src/index.ts` as a thin `import './index.js'` shim so `npm run dev` has a real watch target without migrating the runtime bootstrap into TypeScript.
- Excluded `src/index.ts` from TypeScript emit and active lint scope so `npm run build` continues to produce `dist/index.js` from the existing JavaScript entrypoint.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install tsx explicitly and preserve the locked dev script contract** - `73165c3` (chore)
2. **Task 2: Add a Phase 1-safe TypeScript watch entrypoint without breaking build output** - `4b50b61` (feat)

## Files Created/Modified

- `package.json` - adds the explicit `tsx` devDependency while preserving `dev`, `build`, and `start` exactly as planned.
- `package-lock.json` - records the resolved `tsx` installation in the locked dependency graph.
- `src/index.ts` - provides the temporary TypeScript watch shim by forwarding directly to `./index.js`.
- `tsconfig.json` - excludes `src/index.ts` from emit so the mixed-codebase Phase 1 build keeps a single `dist/index.js` output.
- `eslint.config.js` - ignores `src/index.ts` to keep the existing Phase 1 TS lint boundary intact.

## Decisions Made

- Restored the broken developer workflow by fixing the missing executable and entrypoint rather than weakening the promised `tsx watch src/index.ts` contract.
- Kept the shim intentionally minimal so Phase 2 still owns the real source migration work.

## Deviations from Plan

None in code. The only execution deviation was operational: the watch-mode smoke test had to be rerun outside the sandbox because `tsx watch` could not create its IPC pipe inside the sandboxed `/var` path.

## Issues Encountered

- Sandbox execution of `npm run dev` failed with `EPERM` when `tsx watch` attempted to bind its IPC pipe under `/var/...`; rerunning the smoke test with escalated permissions verified the intended behavior successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 now has the promised no-manual-build watch loop available through `npm run dev`.
- Production startup remains pinned to `node dist/index.js`, so later migration work can proceed without destabilizing the current release path.

## Self-Check: PASSED

- Found `.planning/phases/01-typescript-foundation/01-03-SUMMARY.md`
- Found commit `73165c3`
- Found commit `4b50b61`
