# Requirements: Morty Open-Source Refactor

**Defined:** 2026-03-29
**Core Value:** A non-technical user can go from `git clone` to a working Discord music bot in one command, on any OS.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### TypeScript Foundation

- [ ] **TSF-01**: Project compiles with TypeScript strict mode (`strict: true`) and `module: "NodeNext"`
- [ ] **TSF-02**: Shared type interfaces defined (`CommandModule`, `EventModule`, `QueueMetadata`)
- [ ] **TSF-03**: Build pipeline configured — `npm run build` (tsc), `npm run dev` (tsx watch), `npm start` (node dist/)
- [ ] **TSF-04**: ESLint 9 flat config with `typescript-eslint` unified package configured
- [ ] **TSF-05**: Prettier configured with consistent formatting rules
- [ ] **TSF-06**: `discord-player` pinned exactly at `7.2.0` (no caret) to prevent version drift
- [ ] **TSF-07**: `@snazzah/davey` startup check — throws descriptive error if package missing

### Source Migration

- [ ] **MIG-01**: All 14 slash commands converted to TypeScript with proper types
- [ ] **MIG-02**: `YtDlpExtractor` migrated to TypeScript with typed `BaseExtractor` extension
- [ ] **MIG-03**: `willPlayTrack` listener typed with all 4 parameters (queue, track, config, resolver)
- [ ] **MIG-04**: Event handlers (`ready.js`, `interactionCreate.js`) converted to TypeScript
- [ ] **MIG-05**: Button handler converted to TypeScript with typed interaction routing
- [ ] **MIG-06**: Utility functions (`createPlayerEmbed`, `createSongSelectionEmbed`, `formatTime`) converted to TypeScript
- [ ] **MIG-07**: `src/index.ts` bootstrap file migrated with typed Player and Client setup
- [ ] **MIG-08**: All 14 slash commands verified working after migration (no regressions)
- [ ] **MIG-09**: Legacy `PlayDLExtractor.js` removed (inactive, not registered)

### Setup Wizard

- [ ] **WIZ-01**: `@clack/prompts`-based interactive setup wizard in `scripts/setup.ts`
- [ ] **WIZ-02**: Auto-detect and install Node.js, ffmpeg, yt-dlp on macOS (Homebrew + static fallback)
- [ ] **WIZ-03**: Auto-detect and install Node.js, ffmpeg, yt-dlp on Linux (apt)
- [ ] **WIZ-04**: Auto-detect and install Node.js, ffmpeg, yt-dlp on Windows (winget/portable)
- [ ] **WIZ-05**: Guided `.env` file generation with Discord Developer Portal instructions
- [ ] **WIZ-06**: `npm run build` step integrated into setup flow
- [ ] **WIZ-07**: Guild-scoped slash command registration (instant, no 1-hour wait)
- [ ] **WIZ-08**: Auto-generated Discord bot invite URL with `bot` + `applications.commands` scopes
- [ ] **WIZ-09**: Windows `.bat` entry point (bypasses PowerShell execution policy)
- [ ] **WIZ-10**: Setup is idempotent — re-running detects existing config, asks before overwriting

### Command Audit

- [ ] **CMD-01**: All 14 commands tested in a live Discord server post-migration
- [ ] **CMD-02**: Non-functional commands identified and removed or fixed
- [ ] **CMD-03**: Command error handling verified — ephemeral error messages shown to users

### Docker

- [ ] **DOC-01**: Multi-stage Dockerfile — build stage (tsc) + runtime stage (node:20-slim)
- [ ] **DOC-02**: yt-dlp installed with JS runtime configured (`--js-runtimes node`)
- [ ] **DOC-03**: `docker-compose.yml` uses `env_file` (not `COPY .env`)
- [ ] **DOC-04**: Docker build and run verified after all other testing complete

### Documentation

- [ ] **DOX-01**: README rewritten for TypeScript structure — updated paths, commands, project structure diagram
- [ ] **DOX-02**: CONTRIBUTING.md updated — fix "Pak Lurah" name, add TypeScript dev workflow
- [ ] **DOX-03**: Screenshots/GIFs of bot in action added to README (Now Playing embed, queue view)
- [ ] **DOX-04**: GitHub issue templates (`.github/ISSUE_TEMPLATE/`) — bug report + feature request

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Audio Features

- **AUD-01**: SponsorBlock integration — skip non-music segments in YouTube videos
- **AUD-02**: Volume normalization across tracks
- **AUD-03**: Additional audio filters beyond bass boost

### Platform

- **PLT-01**: Spotify URL → YouTube search auto-resolve
- **PLT-02**: SoundCloud direct play support
- **PLT-03**: Cloud deployment guides (Railway, VPS)
- **PLT-04**: GitHub Actions CI/CD pipeline

### Community

- **COM-01**: i18n/localization support
- **COM-02**: DJ role permission system

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Web dashboard | Adds server infrastructure, auth, database — overkill for self-hosted bot |
| Lavalink integration | Requires separate Java server — kills non-technical user target |
| Prefix commands (!play) | Discord deprecated; slash commands are the only discoverable interface |
| Database / persistent queue | Adds required system dependency; in-memory queue is correct default |
| Democracy vote-skip | State complexity, annoying in small servers |
| Lyrics display | Requires paid API (Genius) or fragile scraping |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TSF-01 | Phase 1 | Pending |
| TSF-02 | Phase 1 | Pending |
| TSF-03 | Phase 1 | Pending |
| TSF-04 | Phase 1 | Pending |
| TSF-05 | Phase 1 | Pending |
| TSF-06 | Phase 1 | Pending |
| TSF-07 | Phase 1 | Pending |
| MIG-01 | Phase 2 | Pending |
| MIG-02 | Phase 2 | Pending |
| MIG-03 | Phase 2 | Pending |
| MIG-04 | Phase 2 | Pending |
| MIG-05 | Phase 2 | Pending |
| MIG-06 | Phase 2 | Pending |
| MIG-07 | Phase 2 | Pending |
| MIG-08 | Phase 2 | Pending |
| MIG-09 | Phase 2 | Pending |
| WIZ-01 | Phase 3 | Pending |
| WIZ-02 | Phase 3 | Pending |
| WIZ-03 | Phase 3 | Pending |
| WIZ-04 | Phase 3 | Pending |
| WIZ-05 | Phase 3 | Pending |
| WIZ-06 | Phase 3 | Pending |
| WIZ-07 | Phase 3 | Pending |
| WIZ-08 | Phase 3 | Pending |
| WIZ-09 | Phase 3 | Pending |
| WIZ-10 | Phase 3 | Pending |
| CMD-01 | Phase 4 | Pending |
| CMD-02 | Phase 4 | Pending |
| CMD-03 | Phase 4 | Pending |
| DOC-01 | Phase 5 | Pending |
| DOC-02 | Phase 5 | Pending |
| DOC-03 | Phase 5 | Pending |
| DOC-04 | Phase 5 | Pending |
| DOX-01 | Phase 6 | Pending |
| DOX-02 | Phase 6 | Pending |
| DOX-03 | Phase 6 | Pending |
| DOX-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after initial definition*
