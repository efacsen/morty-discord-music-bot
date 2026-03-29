# Roadmap: Morty Open-Source Refactor

## Overview

Morty is a working Discord music bot being refactored for open-source release. The work starts with establishing a TypeScript foundation that everything else builds on, migrates the existing 14-command JavaScript codebase to TypeScript, updates the setup wizard for the new build step, verifies all commands work post-migration, updates Docker for the TypeScript build, and finishes with documentation that accurately reflects the finished project. The goal throughout is a single observable outcome: a non-technical user can go from `git clone` to a working bot in one command on any OS.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: TypeScript Foundation** - Establish compiler config, shared types, and build pipeline that all subsequent phases depend on
- [ ] **Phase 2: Source Migration** - Convert all JavaScript source files to TypeScript in dependency order
- [ ] **Phase 3: Setup Wizard** - Update cross-platform setup wizard to handle the TypeScript build step
- [ ] **Phase 4: Command Audit** - Verify all 14 commands work in a live server post-migration
- [ ] **Phase 5: Docker** - Update Dockerfile and docker-compose for TypeScript build after all testing is complete
- [ ] **Phase 6: Documentation** - Rewrite README and contributing guide to accurately reflect the finished project

## Phase Details

### Phase 1: TypeScript Foundation
**Goal**: The TypeScript compiler is configured and the shared type layer exists so every subsequent source file can be written against a stable contract
**Depends on**: Nothing (first phase)
**Requirements**: TSF-01, TSF-02, TSF-03, TSF-04, TSF-05, TSF-06, TSF-07
**Success Criteria** (what must be TRUE):
  1. `npm run build` compiles with zero errors and zero implicit `any` warnings using TypeScript strict mode
  2. `npm run dev` starts the bot in watch mode via `tsx` without requiring a manual compile step
  3. Shared interfaces (`CommandModule`, `EventModule`, `QueueMetadata`) exist in `src/types/` and are importable from any source file
  4. ESLint runs cleanly on the project with no rule violations
  5. Starting the bot without `@snazzah/davey` installed throws a descriptive error immediately rather than silently failing
**Plans:** 2 plans
Plans:
- [ ] 01-01-PLAN.md — Install TS toolchain, create tsconfig + shared types, update package.json scripts and version pins
- [ ] 01-02-PLAN.md — Configure ESLint 9 + Prettier, add @snazzah/davey startup guard

### Phase 2: Source Migration
**Goal**: The entire `src/` codebase is TypeScript with no JavaScript files remaining and all type boundaries are explicit
**Depends on**: Phase 1
**Requirements**: MIG-01, MIG-02, MIG-03, MIG-04, MIG-05, MIG-06, MIG-07, MIG-08, MIG-09
**Success Criteria** (what must be TRUE):
  1. `npm run build` emits a clean `dist/` with zero TypeScript errors across all migrated files
  2. The bot starts and connects to a voice channel after running the migrated build
  3. `willPlayTrack` handler is typed with all 4 parameters and calling the resolver does not require a runtime workaround
  4. No `PlayDLExtractor.js` file exists in the repository
  5. All 14 slash commands are registered and respond without crashing after migration
**Plans**: TBD

### Phase 3: Setup Wizard
**Goal**: A non-technical user on macOS, Linux, or Windows can run one command and end up with a working bot — including system dependency installation, `.env` generation, build step, and slash command registration
**Depends on**: Phase 2
**Requirements**: WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-05, WIZ-06, WIZ-07, WIZ-08, WIZ-09, WIZ-10
**Success Criteria** (what must be TRUE):
  1. Running the setup script on a fresh macOS machine with only `git` installed results in a bot that joins a voice channel and plays audio
  2. Running the setup script on a fresh Linux (Ubuntu/Debian) machine produces the same result
  3. Running `setup.bat` on Windows bypasses PowerShell execution policy and completes without errors
  4. Re-running setup detects an existing `.env` and asks before overwriting rather than silently clobbering it
  5. The generated Discord bot invite URL contains both `bot` and `applications.commands` OAuth scopes
**Plans**: TBD

### Phase 4: Command Audit
**Goal**: Every slash command that ships in the open-source release has been manually tested in a live Discord server and non-functional ones have been removed or fixed
**Depends on**: Phase 3
**Requirements**: CMD-01, CMD-02, CMD-03
**Success Criteria** (what must be TRUE):
  1. Each of the 14 slash commands has been exercised in a live Discord server and the result (pass/fail/removed) is documented
  2. No command in the final build throws an unhandled exception visible to developers — all errors show ephemeral messages to users
  3. The command list contains no stubs, placeholders, or commands that consistently fail
**Plans**: TBD

### Phase 5: Docker
**Goal**: The project builds and runs correctly inside Docker using a multi-stage Debian-based image after all source and command testing is complete
**Depends on**: Phase 4
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04
**Success Criteria** (what must be TRUE):
  1. `docker compose up` starts the bot from a fresh clone with only a `.env` file present — no manual steps required
  2. The bot inside the container plays YouTube audio in a voice channel (yt-dlp JS runtime is functional)
  3. The `.env` file is never baked into the image — `env_file` is used in `docker-compose.yml`
  4. The Docker build completes without native module compilation errors (Debian base, not Alpine)
**Plans**: TBD

### Phase 6: Documentation
**Goal**: The README and contributing guide accurately describe the finished TypeScript project so that a new user or contributor can orient themselves without asking questions
**Depends on**: Phase 5
**Requirements**: DOX-01, DOX-02, DOX-03, DOX-04
**Success Criteria** (what must be TRUE):
  1. A non-technical user following only the README can set up and run the bot without external help
  2. The README shows screenshots or GIFs of the Now Playing embed and queue display
  3. CONTRIBUTING.md describes the TypeScript dev workflow (`npm run dev`, `npm run build`, `npm run typecheck`) and the `QueueMetadata` pattern
  4. GitHub issue templates exist for bug reports and feature requests
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. TypeScript Foundation | 0/2 | Planning complete | - |
| 2. Source Migration | 0/TBD | Not started | - |
| 3. Setup Wizard | 0/TBD | Not started | - |
| 4. Command Audit | 0/TBD | Not started | - |
| 5. Docker | 0/TBD | Not started | - |
| 6. Documentation | 0/TBD | Not started | - |
