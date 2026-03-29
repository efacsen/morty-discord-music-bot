# Morty Discord Music Bot — Open-Source Refactor

## What This Is

Morty is a self-hosted Discord music bot that plays YouTube audio in voice channels via slash commands. This project is a major refactor to make Morty a clean, well-documented open-source project that anyone — even non-technical users — can set up and run in under 5 minutes with a single command.

## Core Value

A non-technical user can go from `git clone` to a working Discord music bot in one command, on any OS (macOS, Linux, Windows).

## Requirements

### Validated

<!-- Existing capabilities confirmed from codebase analysis -->

- ✓ Play YouTube audio in Discord voice channels — existing (`/play`)
- ✓ Queue management (skip, back, jump, shuffle, loop) — existing
- ✓ Playback controls (pause, resume, stop, seek, volume) — existing
- ✓ Now Playing embed with interactive buttons — existing
- ✓ Song selection UI for search results — existing
- ✓ YouTube playlist support — existing
- ✓ YouTube cookie authentication for restricted content — existing
- ✓ Cross-platform yt-dlp binary detection — existing
- ✓ Docker deployment support — existing
- ✓ Bass boost audio filter — existing

### Active

<!-- New scope for this refactor milestone -->

- [ ] TypeScript migration — full codebase converted from JS to TS with proper types
- [ ] Project restructuring — clean, self-explanatory folder structure
- [ ] One-command setup wizard — cross-platform bash script (macOS, Linux, Windows)
- [ ] Auto-install system dependencies (Node.js, ffmpeg, yt-dlp)
- [ ] Guided .env generation (Discord token, client ID)
- [ ] Auto-register slash commands to Discord
- [ ] Connection test (verify bot can join voice channel)
- [ ] Audit and fix all 14 slash commands — remove broken ones, keep working ones
- [ ] Clean, professional README with badges, screenshots, feature list
- [ ] Contributing guide for open-source contributors
- [ ] Docker support (Dockerfile + docker-compose) — updated for TS build
- [ ] Code quality — consistent naming, error handling, self-documenting code

### Out of Scope

- Cloud deployment guides (Railway, VPS, etc.) — local/self-host only for v1
- Web dashboard — overkill for a music bot
- Multi-source support (Spotify, SoundCloud direct play) — YouTube focus for now
- Database/persistent storage — in-memory queue is fine
- Paid/premium features — fully open-source
- i18n/localization — English only for v1

## Context

**Current state:** Working Discord music bot in JavaScript (ES Modules), using discord-player v7.2.0 with a custom YtDlpExtractor. 14 slash commands, no tests, no TypeScript, minimal docs. Docker support exists but needs updating after TS migration.

**Key technical decisions already made:**
- discord-player v7.2.0 (uses discord-voip internally, NOT @discordjs/voice)
- @snazzah/davey required for DAVE protocol (Discord voice encryption)
- yt-dlp piped through PassThrough buffer (direct URLs don't work — YouTube requires auth headers)
- Player client string: `android_music,ios,mweb,web`

**Target users:** Non-technical Discord users who want their own music bot. They can follow instructions but don't have programming experience.

## Constraints

- **Runtime:** Node.js >= 18.0.0
- **System deps:** yt-dlp + ffmpeg must be installed on host
- **Discord API:** Slash commands require bot token + client ID from Discord Developer Portal
- **YouTube:** Aggressive bot detection — must use yt-dlp with player client spoofing
- **DAVE protocol:** @snazzah/davey must be installed or voice connections silently fail
- **Backward compat:** None — this is a clean break (new worktree, merge when ready)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Migrate to TypeScript | Type safety, better DX for contributors, auto-complete | — Pending |
| Keep discord-player v7 | Already working, handles queue/voice complexity | ✓ Good |
| One-command setup (not guided step-by-step) | Target user wants speed, not education | — Pending |
| All 3 OS support (macOS/Linux/Windows) | Maximize reach for open-source | — Pending |
| Add Docker support | Easy deployment, consistent environment | — Pending |
| Local-only hosting | Simplify scope, cloud guides can come later | ✓ Good |

---
*Last updated: 2026-03-29 after initialization*
