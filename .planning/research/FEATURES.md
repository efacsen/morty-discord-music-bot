# Feature Landscape

**Domain:** Open-source self-hosted Discord music bot
**Researched:** 2026-03-29
**Confidence:** HIGH (existing codebase + ecosystem analysis + competitor review)

---

## Context: What Already Exists

This is not greenfield. The bot already has a working feature set. This document maps:
- What is already built and confirmed working (labeled **EXISTING**)
- What is planned for this milestone (labeled **PLANNED**)
- What the ecosystem considers table stakes vs. differentiating
- What to deliberately avoid building

Existing commands: `/play`, `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/nowplaying`,
`/volume`, `/loop`, `/shuffle`, `/seek`, `/jump`, `/back`, `/bassboost` — 14 total.

---

## Table Stakes

Features that users expect from any Discord music bot. Missing = users don't adopt or immediately abandon.

| Feature | Why Expected | Complexity | Status | Notes |
|---------|--------------|------------|--------|-------|
| `/play` with YouTube search | Core reason to use a music bot | Low | EXISTING | Search + direct URL both work |
| `/play` with YouTube URL | Every guide shows direct URL usage | Low | EXISTING | |
| Queue with paginated display | Users want to see what's coming | Medium | EXISTING | `/queue` with pages |
| Skip / Stop | Fundamental controls | Low | EXISTING | Both present |
| Pause / Resume | Expected by anyone who's used Rythm/Groovy | Low | EXISTING | Both present |
| Now Playing embed | Users need feedback on what's playing | Medium | EXISTING | Rich embed with progress bar |
| Interactive button controls | Standard since Groovy/Rythm popularized it | Medium | EXISTING | Pause, skip, stop, shuffle, loop, queue |
| Loop mode (track + queue) | Heavily requested in every music bot | Low | EXISTING | Off / Track / Queue cycling |
| Volume control | Basic expectation | Low | EXISTING | `/volume 0-100` |
| YouTube playlist support | Paste a playlist and queue loads | Medium | EXISTING | Full playlist loading with embed |
| Song selection UI | Search results as selectable buttons | Medium | EXISTING | Top 3 results shown |
| Slash commands (not prefix) | Discord deprecated message intents for bots in 2022 | Medium | EXISTING | All 14 commands are slash commands |
| Cross-platform support | Self-hosters run Windows/macOS/Linux | High | EXISTING | All three supported |
| One-command setup | Non-technical users can't do multi-step installs | High | EXISTING (partial) | `./setup.sh` and `setup.bat` exist but need TypeScript build step |
| .env configuration | Standard approach; avoids hardcoding secrets | Low | EXISTING | DISCORD_CLIENT_TOKEN, CLIENT_ID, GUILD_ID |
| Auto-register slash commands | Commands must be registered with Discord API | Low | EXISTING | Done in `ready.js` on startup |
| Error messages visible to user | Silent failures = user confusion | Low | EXISTING | Ephemeral error replies in all commands |
| README with setup instructions | Required for open-source adoption | Medium | EXISTING (needs update for TS) | Current README is JavaScript-based |
| TypeScript source | Expected by contributors in 2025+ bot ecosystem | High | PLANNED | Full TS migration is this milestone's core |
| Docker support | Consistent deployment environment | Medium | EXISTING (needs TS rebuild) | Dockerfile + docker-compose present |

---

## Differentiators

Features that set this bot apart. Not expected, but add real value.

| Feature | Value Proposition | Complexity | Status | Notes |
|---------|-------------------|------------|--------|-------|
| Morty/Rick-and-Morty personality | Unique character; memorable; makes setup feel fun not tedious | Low | EXISTING | ASCII art, Morty quotes in setup scripts |
| Portable Windows package (no admin rights) | Non-technical Windows users often can't install system tools | High | EXISTING | `scripts/install.ps1` downloads everything to `runtime/` folder |
| Bass boost filter | Audio filter loved by gaming communities | Low | EXISTING | `/bassboost` toggle |
| YouTube cookie auth | Lets bot bypass age-restricted / region-locked content | Medium | EXISTING | `YTDLP_COOKIES_FILE` / `YTDLP_COOKIES_BROWSER` env vars |
| Seek to timestamp | Useful for podcasts/long tracks; not all bots support it | Low | EXISTING | `/seek MM:SS` |
| Back / previous track | Surprisingly missing from many self-hosted bots | Low | EXISTING | `/back` command |
| Jump to position | Skip to specific track without skipping through them | Low | EXISTING | `/jump <position>` |
| Per-track remove from queue | Users want surgical queue control, not just clear-all | Medium | EXISTING | Button on queue embed |
| Playlist rich embed (name, count, duration) | Professional feel vs. just "added N songs" | Low | EXISTING | Playlist embed in `createPlayerEmbed.js` |
| SponsorBlock integration | Skip non-music segments in YouTube videos | High | NOT PLANNED (v1) | Popular in Muse bot; deferred to roadmap |
| Volume normalization across tracks | Prevents jarring loudness jumps in mixed queues | High | NOT PLANNED (v1) | Muse does this; requires DSP work |
| `TROUBLESHOOTING.md` | Dedicated troubleshooting doc reduces GitHub issues | Low | EXISTING | Already present, covers common failures |
| System check script | `npm run check` verifies yt-dlp, ffmpeg, Node version | Low | EXISTING | `check-system.js` |
| `.env.example` | Shows contributors what env vars are needed | Low | EXISTING | Standard open-source practice |
| TypeScript types for command module | Contributors get autocomplete and type safety | Medium | PLANNED | Part of TS migration |
| Consistent `[Tag]` log prefixes | Easy to grep logs and identify sources | Low | EXISTING | `[YtDlp]`, `[Play Command]`, etc. |

---

## Anti-Features

Things to deliberately NOT build in this milestone (and why).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Web dashboard | Adds server infrastructure, auth, database — overkill for a self-hosted bot targeting non-technical users | Slash commands + Discord embeds cover all control needs |
| Spotify direct playback | Spotify API requires OAuth + premium account; Spotify TOS prohibits audio extraction; massive maintenance surface | Document in README that Spotify is roadmap; YouTube covers 99% of use cases |
| SoundCloud direct play | SoundCloud API is unstable, rate-limits aggressively, has changed authentication twice in 2 years | Keep YouTube-only for v1; add as opt-in later |
| Lavalink / server-side audio | Requires running a separate Java server; huge barrier for non-technical users | yt-dlp piped through Node is simpler and already working |
| Database / persistent queue | Adds a required system dependency (Redis, Postgres) for saving data users mostly don't need | In-memory queue per guild is correct default; add opt-in persistence later |
| DJ role permission system | Adds UI complexity, per-guild config storage, role management logic | Document that server admins can use Discord's built-in channel permissions |
| Lyrics display | Requires paid API (Genius) or fragile scraping; lyrics APIs change and break | Deferred to roadmap; not expected for a music player |
| Prefix commands (e.g., `!play`) | Discord discouraged prefix commands; slash commands are the only discoverable interface | Slash commands only |
| Voting/democracy skip | Adds state tracking, timeout logic, and UX complexity; annoying in small servers | No-democracy approach (like Muse bot) — anyone in the voice channel can control |
| Multi-source auto-resolve (Spotify URL → YouTube search) | Fragile mapping, wrong tracks, maintenance burden | Accept YouTube URLs and search terms only; be explicit about source |
| i18n / localization | Adds translation workflow, string externalization, contributor burden | English only; open for community PRs after launch |
| Cloud deploy guides (Railway, Heroku, VPS) | Scope creep; each platform has different setup quirks | Local/Docker only for v1; community can document cloud later |
| GitHub Actions CI/CD pipeline | Useful for contributors but not launch-blocking | Add in a future maintenance milestone |

---

## Feature Dependencies

```
TypeScript migration → Everything (all features depend on TS build being stable)

./setup.sh (macOS/Linux) → Node.js check → FFmpeg check → yt-dlp check → npm install → .env generation → slash command registration
setup.bat (Windows) → scripts/install.ps1 → portable runtime download → same flow

Slash commands auto-register → DISCORD_CLIENT_ID in .env → DISCORD_GUILD_ID in .env (for instant/guild-scoped)

/play → YouTube search/URL → YtDlpExtractor → yt-dlp binary on PATH → @snazzah/davey (DAVE protocol) → voice channel

Now Playing embed buttons → /play (queue must exist) → buttonHandler.js → GuildQueue state

/queue paginated view → /play (queue must have tracks) → per-track remove buttons → buttonHandler.js

YouTube cookie auth → YTDLP_COOKIES_FILE or YTDLP_COOKIES_BROWSER env var → optional (bot works without it)

Docker → TypeScript build step (Dockerfile must run `npm run build` before `npm start`)

README → TypeScript migration (instructions must match TS structure, not JS)
CONTRIBUTING.md → TypeScript migration (contributor dev workflow must reference TS build)
```

---

## MVP Recommendation

The "MVP" for this milestone is the open-source refactor, not the bot itself (the bot already works). The MVP of the refactor is:

**Must ship:**
1. TypeScript migration — every other deliverable depends on this being stable
2. One-command setup wizard working on all three platforms — this is the core value proposition
3. Updated README matching the TS structure — first thing anyone sees
4. All 14 commands audited and working post-TS migration — users can't have regressions

**Ship if time allows:**
5. Contributing guide updated for TypeScript workflow — needed for open-source contributors
6. Docker updated for TS build — existing Dockerfile is JS-only

**Defer without regret:**
- SponsorBlock integration: Popular but complex; not expected
- Volume normalization: Technically interesting but not launch-blocking
- Spotify or SoundCloud: Wrong scope for v1; explicitly out-of-scope in PROJECT.md
- Web dashboard: Anti-feature for this audience

---

## Setup Wizard: What Good Looks Like

Based on ecosystem analysis of MusicBot (Just-Some-Bots), EvoBot, umutxyp/MusicBot, Muse, and jagrosh/MusicBot:

### What users expect from a one-command setup

| Expectation | Implementation | Status |
|-------------|---------------|--------|
| Single entry point | `./setup.sh` macOS/Linux, `setup.bat` Windows | EXISTING |
| Dependency auto-install (not manual) | Homebrew/apt/winget for Node.js, FFmpeg, yt-dlp | EXISTING |
| Guided .env creation with context | Explains where to get each value from Discord Developer Portal | EXISTING |
| No admin rights on Windows | `scripts/install.ps1` uses portable runtime folder | EXISTING |
| Clear success/failure feedback | Color-coded output with step numbers (6 steps) | EXISTING |
| Tells user exactly how to start the bot after setup | `./start.sh` message at completion | EXISTING |
| Slash command auto-registration | Commands register on first bot start via `ready.js` | EXISTING (automatic, no extra step) |

### The one gap in current setup wizard

The setup script does `npm install` but does NOT run `npm run build` (TypeScript compile). After TS migration, the setup script must add a build step, otherwise the bot won't start. This is a **PLANNED** change that must be part of the TS migration work.

### UX patterns to maintain

- Numbered steps with total count ("Step 3/6") — users know how much is left
- Version display when dependency already installed ("Node.js is already installed (v20.x)") — confirms without redundancy
- Idempotent — re-running setup detects existing config and asks before overwriting
- Character voice ("Oh geez, l-let me set this up for you!") — differentiates from generic bots

---

## Open-Source Documentation: What Good Looks Like

Based on analysis of top starred Discord music bots and open-source README standards:

### README must-haves (currently present)

| Element | Status | Notes |
|---------|--------|-------|
| Badges (license, Node version, PRs welcome) | EXISTING | shields.io badges present |
| Feature list | EXISTING | Bullet list in README |
| Commands table | EXISTING | All 14 commands listed with usage |
| Quick Start (platform-specific) | EXISTING | Windows/macOS/Linux sections |
| Manual installation details | EXISTING | Collapsed details block |
| Project structure diagram | EXISTING | Shows folder layout |
| Docker instructions | EXISTING | Short and clear |
| FAQ section | EXISTING | 4 common questions answered |
| Troubleshooting link | EXISTING | Links to TROUBLESHOOTING.md |
| Contributing link | EXISTING | Links to CONTRIBUTING.md |
| License | EXISTING | MIT |
| Credits/built-with | EXISTING | Discord.js, discord-player, yt-dlp, etc. |

### README gaps to address in this milestone

| Gap | Why It Matters | Fix |
|-----|---------------|-----|
| Screenshots / GIF of the bot in action | Top README best practice; shows what users are getting | Add screenshot of Now Playing embed and queue embed |
| README references `src/index.js` (JS) | Will be wrong after TS migration | Update structure diagram and commands for TS paths |
| CONTRIBUTING.md still says "Pak Lurah Discord Music Bot" | Wrong project name (old name before Morty rebrand) | Update title and project references |
| CONTRIBUTING.md has no TypeScript development workflow | Contributors don't know how to run/build | Add `npm run dev` / `npm run build` section |
| No GitHub issue templates | Contributors submit incomplete bug reports | Add `.github/ISSUE_TEMPLATE/` with bug report + feature request templates |

---

## Sources

- Ecosystem: [GitHub discord-music-bot topic](https://github.com/topics/discord-music-bot) — top starred repos
- Competitor: [jagrosh/MusicBot](https://github.com/jagrosh/MusicBot) — 5.7k stars, gold standard for "easy to run yourself"
- Competitor: [museofficial/muse](https://github.com/museofficial/muse) — opinionated, TypeScript, no-democracy philosophy
- Competitor: [Just-Some-Bots/MusicBot install.sh](https://github.com/Just-Some-Bots/MusicBot/blob/master/install.sh) — reference for setup wizard patterns
- Competitor: [eritislami/evobot](https://github.com/eritislami/evobot) — TypeScript + Docker, 1.9k stars
- Discord.js guide: [Slash Commands](https://discordjs.guide/slash-commands/) and [Autocomplete](https://discordjs.guide/slash-commands/autocomplete) — ephemeral responses, 3s timeout for autocomplete
- README standards: [matiassingers/awesome-readme](https://github.com/matiassingers/awesome-readme), [readmecodegen beginner guide](https://www.readmecodegen.com/blog/beginner-friendly-readme-guide-open-source-projects)
- Audio features: [LakhindarPal/discord-player-bot](https://github.com/LakhindarPal/discord-player-bot) — 25 FFmpeg filters reference
- Existing codebase: Confirmed command list, architecture, and existing docs from direct file analysis
