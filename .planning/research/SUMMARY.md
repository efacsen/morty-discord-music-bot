# Project Research Summary

**Project:** Morty — Open-Source Discord Music Bot (TypeScript Refactor)
**Domain:** Self-hosted Discord music bot — JavaScript-to-TypeScript migration + cross-platform setup wizard + Docker
**Researched:** 2026-03-29
**Confidence:** HIGH

## Executive Summary

Morty is a working Discord music bot being prepared for open-source release. The core audio pipeline (YouTube via yt-dlp, DAVE encryption, discord-player v7) is already proven and must not be touched during this milestone. The work is a TypeScript refactor and open-source polish sprint — not a feature build. The existing 14-command JavaScript codebase is the starting point; every deliverable is measured against "does it still play audio and can a non-technical user set it up."

The recommended approach is a layered migration that follows the natural dependency order of the architecture: shared types first, then utilities, then extractors, then commands/events, and finally the bootstrap file. This order avoids circular import issues and ensures the TypeScript compiler validates each layer before the next is added. The setup wizard is a separate concern from the bot runtime and must stay isolated from `src/`. The build pipeline uses `tsx` for development and plain `tsc` for production — no bundler is needed for a bot application.

The principal risks fall into two categories. First, TypeScript-specific traps: ESM import extension requirements with `NodeNext` resolution, the silent `willPlayTrack` resolver deadlock if typed with fewer than 4 parameters, and `@snazzah/davey` being pruned as an "unused" dependency. Second, environment-specific traps: Alpine Docker native module failures, yt-dlp's new mandatory JavaScript runtime requirement (since 2025.11.12), and the Windows PowerShell execution policy blocking non-technical users. All of these have clear mitigations and must be addressed proactively rather than reactively.

---

## Key Findings

### Recommended Stack

The core Discord packages (discord.js v14.25.1, discord-player v7.2.0) are already working and must be kept stable — no upgrades during the refactor. TypeScript 6.0.2 is current; use full strict mode. The dev workflow uses `tsx watch` (no build step, instant restarts); production uses `tsc` to emit `dist/` followed by `node dist/index.js`. tsup is unnecessary for a bot application because there is no consumer library to bundle — plain `tsc` is simpler and more transparent. ESLint 9 flat config with the unified `typescript-eslint` package is the current standard. The setup wizard uses `@clack/prompts` for the interactive prompt flow.

Four dependencies are frozen and must survive the migration unchanged: `@snazzah/davey` (DAVE encryption — no imports reference it, so tools will try to remove it), `discord-player@7.2.0` (pinned exactly — no caret — because the `willPlayTrack` resolver signature is version-specific), `yt-dlp-wrap`, and `mediaplex`.

**Core technologies:**
- `discord.js v14.25.1`: Discord API client, slash commands, embeds — already working, ships own types
- `discord-player v7.2.0`: Audio queue engine — pinned exactly, custom extractor is tightly coupled to v7 API
- `TypeScript 6.0.2`: Type-safe source with full strict mode — all major dependencies ship their own `.d.ts`
- `tsx`: Development runner — ESM-native, zero config, replaces `node --watch`
- `tsc`: Production build — type-checks and emits `dist/`; no bundler needed for bot applications
- `@clack/prompts v1.1.0`: Setup wizard prompts — cross-platform, ergonomic wizard API
- `@snazzah/davey`: DAVE voice encryption — implicit dependency, must not be removed
- `node:20-slim` (Docker): Debian-based runtime — avoids Alpine musl/native-module failures

### Expected Features

This milestone is a refactor, not a feature build. The bot is already functionally complete. The "MVP" of this milestone is: TypeScript migration stable, setup wizard updated for the TS build step, all 14 commands verified working post-migration, and README updated.

**Must have (table stakes for this milestone):**
- TypeScript migration of all `src/` files — everything downstream depends on this being stable
- Setup wizard updated to run `npm run build` after `npm install` — otherwise the bot won't start post-migration
- All 14 slash commands working after migration — no regressions allowed
- README updated for TypeScript paths and workflow — first thing any new user reads

**Should have (competitive for open-source adoption):**
- `CONTRIBUTING.md` updated with TypeScript dev workflow (`npm run dev`, `npm run build`)
- Docker updated for TS build step — existing Dockerfile is JS-only
- GitHub issue templates for bug reports and feature requests
- Screenshots/GIFs in README (now playing embed, queue embed)
- `QueueMetadata` interface and module augmentation pattern documented for contributors

**Defer (v2+):**
- SponsorBlock integration — popular but complex, not expected for v1
- Volume normalization — technically interesting, not launch-blocking
- Spotify/SoundCloud support — explicitly out of scope
- Web dashboard — anti-feature for this self-hosted audience
- GitHub Actions CI/CD — useful but not launch-blocking

### Architecture Approach

The current layered event-driven structure (`commands/`, `events/`, `handlers/`, `extractors/`, `utils/`) is sound and does not need restructuring — the TypeScript migration overlays types onto the existing shape. The only structural additions are `src/types/` (shared interfaces to prevent circular imports) and `scripts/setup.ts` (isolated from `src/`, never imports bot code). The critical data flow invariant is that `YtDlpExtractor` communicates only upward through discord-player's event system and never directly imports from `commands/` or `events/`.

**Major components:**
1. `src/types/` — shared `CommandModule`, `EventModule`, `QueueMetadata` interfaces; no runtime code; must be defined before migrating any other layer
2. `src/extractors/YtDlpExtractor.ts` — yt-dlp audio pipeline; extends `BaseExtractor`; communicates via events only; contains the `willPlayTrack` resolver call that must be typed with all 4 parameters
3. `src/commands/` — 14 slash command modules; use `useQueue<QueueMetadata>()` for typed queue access; no direct audio/voice manipulation
4. `src/index.ts` — bootstrap and wiring only; no business logic; registers the `willPlayTrack` listener; holds the `nowPlayingMessages` Map
5. `scripts/setup.ts` — self-contained setup wizard; never imports from `src/`; uses `@clack/prompts` + `execa`

### Critical Pitfalls

1. **ESM import extensions (Pitfall 1)** — `module: "NodeNext"` requires `.js` extensions on all relative imports in `.ts` source files. Missing extensions compile cleanly but crash at runtime with `ERR_MODULE_NOT_FOUND`. Set `module: "NodeNext"` in tsconfig to enforce this as a compiler error, not a runtime surprise.

2. **`willPlayTrack` resolver silently dropped (Pitfall 10)** — TypeScript allows functions with fewer parameters than the caller provides. A listener typed as `(queue, track) => void` compiles fine but never calls the resolver, deadlocking playback forever. Type all 4 parameters explicitly and add a 10-second timeout warning during development.

3. **`@snazzah/davey` pruned as unused (Pitfall 3)** — No source file imports this package. Any tool that scans imports to identify dependencies will remove it. Add a startup `require.resolve()` check that throws a descriptive error if the package is missing. Add a comment in `package.json` explaining it must not be removed.

4. **Alpine Docker + native modules (Pitfall 5)** — `mediaplex` (Opus encoding) and `libsodium-wrappers` require native compilation. Alpine's musl libc causes silent fallback to slow JS implementations. Use `node:20-slim` (Debian) as the Docker base image.

5. **yt-dlp mandatory JavaScript runtime (Pitfall 2)** — Since yt-dlp 2025.11.12, a JS runtime is required for YouTube support. In Docker, install yt-dlp via `pip install "yt-dlp[default]"` or the official standalone binary, and configure `--js-runtimes node` to use the already-present Node.js binary.

---

## Implications for Roadmap

### Phase 1: TypeScript Foundation
**Rationale:** Everything else depends on the TypeScript build being stable. This is the riskiest phase — ESM + NodeNext has multiple footguns. Establishing the compiler config and shared types first gives all subsequent phases a validated foundation to build on.
**Delivers:** Working `tsconfig.json` with `module: "NodeNext"`, `src/types/` interfaces (`CommandModule`, `EventModule`, `QueueMetadata`, `discord-augments.d.ts`), updated `package.json` scripts (`build`, `dev`, `start`, `typecheck`), and `package.json` dependency pins (remove caret from `discord-player`).
**Addresses:** TypeScript migration (table stakes), contributor type safety (differentiator)
**Avoids:** ESM import extension crashes (Pitfall 1), `queue.metadata` untyped `any` casts (Pitfall 6), Client extension vs augmentation (Pitfall 7), discord-player version drift (Pitfall 11)

### Phase 2: Source Migration
**Rationale:** Migrate in build-order: `utils/` → `extractors/` → `handlers/` → `commands/` → `events/` → `index.ts`. Each layer compiles cleanly before the next is added. This order mirrors the import dependency graph and surfaces errors at the layer that introduced them.
**Delivers:** All 14 commands and all event handlers converted to TypeScript, `YtDlpExtractor.ts` with fully typed `willPlayTrack` listener (all 4 parameters), debug logs gated behind `DEBUG` env var, `nowPlayingMessages` Map with typed lifecycle cleanup.
**Avoids:** `willPlayTrack` resolver deadlock (Pitfall 10), verbose production logging (Pitfall 12), `nowPlayingMessages` state leak (Pitfall 14), `@snazzah/davey` silently removed (Pitfall 3 — startup check added here)

### Phase 3: Setup Wizard Update
**Rationale:** The setup wizard is the primary onboarding experience for non-technical users. It must be updated to handle the TypeScript build step and validated on all three platforms before announcing the open-source release.
**Delivers:** `scripts/setup.ts` with `npm run build` step added, guild-scoped slash command registration (instant, no 1-hour delay), generated invite URL with both `bot` and `applications.commands` OAuth scopes, Homebrew detection with static binary fallback on macOS, `.bat` entry point for Windows (no PowerShell execution policy issues), cookies file stored outside project directory.
**Avoids:** Missing `npm run build` in setup flow (FEATURES gap), PowerShell execution policy blocking Windows users (Pitfall 4), Homebrew assumption on macOS (Pitfall 15), missing `applications.commands` scope (Pitfall 8), 1-hour command propagation delay (Pitfall 9), cookies file accidentally committed (Pitfall 16)

### Phase 4: Docker Update
**Rationale:** Docker is the recommended deployment path for users who want isolation. The current Dockerfile is JS-only and uses Alpine, which causes native module failures. This phase fixes the deployment artifact.
**Delivers:** Multi-stage Dockerfile with `node:20-slim` base (Debian, not Alpine), yt-dlp installed via `pip install "yt-dlp[default]"` with `--js-runtimes node` configured, `env_file` in `docker-compose.yml` (never `COPY .env`), build stage compiles TypeScript; runtime stage copies only `dist/` and production `node_modules`.
**Avoids:** Alpine native module failures (Pitfall 5), yt-dlp missing JS runtime (Pitfall 2), `.env` not passed to container (Pitfall 13), `@snazzah/davey` missing in container (Pitfall 3)

### Phase 5: Open-Source Documentation
**Rationale:** Documentation is the final gate before announcing the project. A working bot with broken docs will fail adoption. This phase is last because all paths (TypeScript, setup wizard, Docker) need to be finalized before documentation can accurately reflect them.
**Delivers:** README updated for TypeScript structure and paths, `CONTRIBUTING.md` with TypeScript dev workflow and `QueueMetadata` pattern, GitHub issue templates for bug reports and feature requests, screenshots of Now Playing and queue embeds in README, project name updated from "Pak Lurah" to "Morty" throughout.
**Addresses:** README gaps (FEATURES.md identified: wrong JS paths, old project name, no TypeScript workflow), open-source contributor experience (differentiator)

### Phase Ordering Rationale

- Phase 1 must come first because `tsconfig.json` and shared types are prerequisites for every subsequent `.ts` file conversion
- Phase 2 follows Phase 1 because the TypeScript compiler must be configured before migrating source files
- Phase 3 (setup wizard) is deliberately after Phase 2 because the wizard needs to call `npm run build` — that script must exist and work before it can be tested
- Phase 4 (Docker) comes after Phase 2 because the Dockerfile must run `npm run build` against the TypeScript source — the TS build must be stable first
- Phase 5 (docs) is always last: it documents what was actually built, not what was planned

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Setup Wizard):** Cross-platform subprocess execution (`execa` vs `cross-spawn`), Homebrew install automation on macOS, and Windows portable runtime download patterns have edge cases not fully covered in research. Recommend a targeted research spike on Windows setup UX before implementation.
- **Phase 4 (Docker):** yt-dlp EJS and `--js-runtimes node` configuration is based on MEDIUM-confidence sources (official GitHub announcement, not yet in stable docs). Validate against the current yt-dlp release before finalizing the Dockerfile.

Phases with standard patterns (skip research-phase):
- **Phase 1 (TypeScript Foundation):** `module: "NodeNext"` tsconfig and ESLint 9 flat config are well-documented in official TypeScript and ESLint docs. No research spike needed.
- **Phase 2 (Source Migration):** discord-player v7 TypeScript patterns are verified against official docs. `QueueMetadata` generic and `willPlayTrack` 4-parameter signature are confirmed. Standard migration.
- **Phase 5 (Documentation):** No research needed — gaps are already enumerated in FEATURES.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core packages are already working in production. TypeScript 6, ESLint 9, tsx, tsc versions confirmed from npm registry. tsup intentionally excluded — plain tsc is correct for a bot application. |
| Features | HIGH | Existing codebase directly audited. Feature gaps (missing build step in setup wizard, README JS paths) confirmed by file inspection. Competitor analysis corroborates scope decisions. |
| Architecture | HIGH | TypeScript migration order derived from import dependency graph (verifiable). `QueueMetadata` generic confirmed against discord-player official docs. `NodeNext` module resolution confirmed against TypeScript official docs. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (ESM extensions, willPlayTrack, davey, Alpine) are HIGH confidence from official sources or first-hand debugging records. yt-dlp EJS pitfall is MEDIUM confidence — GitHub announcement exists but exact configuration syntax needs validation. |

**Overall confidence:** HIGH

### Gaps to Address

- **yt-dlp `--js-runtimes node` syntax:** The flag exists per the yt-dlp wiki but the exact invocation in a piped Node.js subprocess (via `yt-dlp-wrap`) needs validation during Phase 4 implementation. The alternative (official standalone binary that bundles EJS) is the safer fallback.
- **`@clack/prompts` vs `@inquirer/prompts` final choice:** STACK.md recommends `@clack/prompts`; ARCHITECTURE.md recommends `@inquirer/prompts`. Both are valid. This must be resolved before Phase 3 planning. Recommendation: use `@clack/prompts` (STACK.md rationale is stronger — better wizard API for a fixed step sequence).
- **Dynamic loader path between `dev` and `start`:** ARCHITECTURE.md notes that `src/index.ts` dynamic-imports from `./commands/` but the path must resolve differently when run by `tsx` (against `.ts` files) vs `node dist/index.js` (against `.js` files). The resolution strategy should be specified during Phase 2 planning.

---

## Sources

### Primary (HIGH confidence)
- TypeScript official docs — `module: "NodeNext"`, `moduleResolution`, tsconfig options
- discord-player official docs — v7 extractor API, `willPlayTrack` signature, TypeScript support
- discord.js v14 official docs — slash command registration, OAuth scopes, module augmentation
- ESLint 9 official docs — flat config, `defineConfig()`, `typescript-eslint` unified package
- PowerShell Microsoft docs — `Set-ExecutionPolicy`, `-ExecutionPolicy Bypass` flag
- Project codebase analysis (`CONCERNS.md`) — direct audit of existing JS source
- Project memory (`MEMORY.md`) — first-hand debugging records (DAVE protocol, willPlayTrack, YouTube stream)

### Secondary (MEDIUM confidence)
- npm registry — version verification for tsx (4.21.0), tsup (8.5.1), @clack/prompts (1.1.0), prettier (3.8.1)
- yt-dlp GitHub issue #15012 and EJS wiki — JavaScript runtime requirement since 2025.11.12
- tsx official docs + community comparisons — confirms tsx > ts-node for ESM Node.js
- Discord bot TypeScript community templates (KevinNovak, eritislami/evobot) — architecture validation
- Docker multi-stage TypeScript patterns — node:slim vs node:alpine native module behavior

### Tertiary (contextual)
- Competitor analysis (jagrosh/MusicBot, museofficial/muse, Just-Some-Bots/MusicBot) — feature scope validation
- tsdown pre-1.0 risk assessment — tsdown.dev official migration guide + community discussion

---

*Research completed: 2026-03-29*
*Ready for roadmap: yes*
