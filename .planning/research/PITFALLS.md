# Domain Pitfalls

**Domain:** Discord music bot — JS-to-TS migration + cross-platform setup wizard + Docker
**Researched:** 2026-03-29

---

## Critical Pitfalls

Mistakes that cause rewrites, silent failures, or total loss of functionality.

---

### Pitfall 1: ESM + TypeScript Import Extensions — Silent Runtime Crashes

**What goes wrong:** The existing codebase uses ES Modules (`"type": "module"` in `package.json`). When migrating to TypeScript with `module: "NodeNext"` or `node16`, TypeScript requires that all relative imports use `.js` extensions in the source (TypeScript resolves `.ts` files but emits `.js`, so import paths must reference the output extension). Missing `.js` on imports compiles fine but crashes at runtime with `ERR_MODULE_NOT_FOUND`.

**Why it happens:** TypeScript does NOT rewrite bare import specifiers. If you write `import { foo } from './foo'`, the compiled `.js` output contains the same bare specifier, and Node.js (ESM mode) cannot resolve it.

**Consequences:**
- Code compiles with zero errors
- Runtime crash on first import of any file
- All 14 commands and all event handlers break simultaneously
- Non-obvious error message (`Cannot find module './foo'`) does not mention TypeScript

**Prevention:**
- Set `tsconfig.json` to `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` — TypeScript will enforce `.js` extension on relative imports as a compiler error, not a runtime surprise
- Add all relative imports as `import { x } from './x.js'` during migration (not `.ts`)
- Alternatively, use a build tool (esbuild, tsx) that handles extension rewriting — but then pin this toolchain choice early and do not mix strategies

**Warning signs:**
- `ERR_MODULE_NOT_FOUND` on a file that clearly exists
- Imports with no extension in `.ts` source files
- `tsconfig.json` using `"module": "ESNext"` with `"moduleResolution": "bundler"` — this allows missing extensions but produces code that only runs in bundlers, not Node.js directly

**Phase:** TS Migration (Phase 1 of roadmap)

---

### Pitfall 2: yt-dlp Now Requires an External JavaScript Runtime (EJS)

**What goes wrong:** Since yt-dlp 2025.11.12, an external JavaScript runtime (Deno, Node, Bun, or QuickJS) is required for full YouTube support. YouTube support without a JS runtime is deprecated and may stop working entirely. In Docker, if the image does not have a supported JS runtime installed alongside yt-dlp, YouTube playback will begin silently degrading or failing.

**Why it happens:** YouTube now serves JS challenges that yt-dlp must execute. The yt-dlp official binaries bundle `yt-dlp-ejs` (the EJS component), but if yt-dlp is installed via `pip`/`pip3` without the `[default]` extra (`pip install yt-dlp[default]`), EJS is not included. The Docker image currently uses Alpine's `apk` package for yt-dlp — this is the Alpine community package, which may or may not bundle EJS depending on the version.

**Consequences:**
- YouTube downloads degrade silently or fail with cryptic "Sign in" or bot-detection errors
- Failure mode is indistinguishable from a stale yt-dlp version
- Node.js is already present in the Docker image (it runs the bot), so using Node as the JS runtime is straightforward — but must be explicitly configured

**Prevention:**
- In Docker: install yt-dlp via `pip install "yt-dlp[default]"` or download the official standalone binary from GitHub releases (which bundles EJS). Do not rely on the Alpine `apk` package alone
- Configure `--js-runtimes node` in the yt-dlp invocation or set `YTDLP_RUNTIMES=node` so yt-dlp uses the already-present Node.js binary
- Add a startup health check that runs `yt-dlp --version` and a test extract; log a clear warning if the JS runtime cannot be found

**Warning signs:**
- "Sign in to confirm your age" or "This video is unavailable" errors from yt-dlp in Docker when the same video works on the host
- yt-dlp version older than `2025.11.12` without explicit JS runtime configuration
- `pip install yt-dlp` without `[default]` extra in Dockerfile

**Phase:** Docker Setup (Phase 3 or 4 of roadmap)

---

### Pitfall 3: @snazzah/davey Silent Removal — Voice Never Connects

**What goes wrong:** `@snazzah/davey` is required for Discord's DAVE encryption protocol. It is loaded implicitly by `discord-voip` via `node_modules` resolution — there is no `import` in project source. If the package is absent (not installed, removed from `package.json`, or omitted in a Docker build), the voice connection goes to networking code:6 (Closed) with no error message in bot logs.

**Why it happens:** The package is a peer/implicit dependency, not an explicit one. During the TS migration, if `package.json` is reconstructed or cleaned, `@snazzah/davey` may be dropped as "unused" because no source file imports it. TypeScript migration tools that scan `import` statements to infer necessary packages will miss it entirely.

**Consequences:**
- Bot starts, joins voice channels, appears connected, but plays no audio — no error logged
- Debugging time: hours to days tracking down a silent encryption failure
- Affects 100% of users in all guilds

**Prevention:**
- Add an explicit startup check that attempts `require.resolve('@snazzah/davey')` or `import` resolution at boot, and throws a descriptive error if it fails
- Add a comment in `package.json` next to the dependency: `// REQUIRED: Discord DAVE voice encryption — do not remove even if unused by imports`
- Include in setup wizard verification step: check that `@snazzah/davey` is installed

**Warning signs:**
- Voice connection reaches Identifying (code:1) but transitions to Closed (code:6) instead of UDP (code:2)
- No audio plays despite bot appearing in voice channel
- `@snazzah/davey` missing from `node_modules`

**Phase:** TS Migration and Docker Setup (both phases must preserve this dependency)

---

### Pitfall 4: Windows PowerShell Execution Policy Blocks Setup Script

**What goes wrong:** Windows 10/11 defaults to `Restricted` execution policy — no PowerShell scripts can run. A non-technical user running `.\setup.ps1` sees "cannot be loaded because running scripts is disabled on this system" and has no idea what it means or how to fix it.

**Why it happens:** Windows ships with scripts blocked by default as a security measure. Group Policy on managed machines (corporate, school) overrides user-level changes, making `Set-ExecutionPolicy` fail even with admin rights.

**Consequences:**
- Setup wizard is completely non-functional for the Windows target audience
- Error message provides no actionable guidance
- Non-technical users give up or incorrectly attempt to disable all security

**Prevention:**
- Use `powershell -ExecutionPolicy Bypass -File setup.ps1` as the documented run command for Windows — this runs the script without changing the system policy
- Alternatively, provide a `setup.bat` (cmd.exe, not PowerShell) as the primary Windows entry point — cmd.exe has no execution policy restriction
- Document Windows setup explicitly: "Double-click `setup.bat` or run: `powershell -ExecutionPolicy Bypass -File setup.ps1`"
- Detect corporate policy override and show a specific message: "Your organization blocks script execution. Please contact your IT department or use the Docker setup instead."

**Warning signs:**
- Any `.ps1` file used as primary Windows entry point without `Bypass` flag
- README shows `.\setup.ps1` without the execution policy flag
- No `.bat` fallback provided

**Phase:** Setup Wizard (cross-platform scripting phase)

---

### Pitfall 5: Docker Alpine + Node.js Native Modules Fail to Compile

**What goes wrong:** Several dependencies (mediaplex for Opus encoding, libsodium-wrappers, and potentially @snazzah/davey) include native C++ bindings that require build tools (`python3`, `make`, `g++`) to compile on Alpine. Alpine omits glibc and standard build tools by default. `npm install` appears to succeed but native modules fall back to JS implementations or fail silently.

**Why it happens:** Alpine uses musl libc instead of glibc. Some native modules that call into glibc symbols fail at runtime even when they compile at build time. The official `node:alpine` Docker image does not include build tools by default.

**Consequences:**
- Audio encoding (mediaplex/Opus) falls back to a JS implementation, causing high CPU usage and degraded audio quality
- sodium/encryption may silently use a slower JS fallback
- Errors only appear at runtime, not during `docker build`

**Prevention:**
- Use `node:20-slim` (Debian-based) instead of `node:20-alpine` as the Docker base image — avoids musl/glibc incompatibility entirely
- If Alpine is required for size: add `apk add --no-cache python3 make g++ libc6-compat` before `npm ci`, then optionally remove build tools in a multi-stage build
- Use multi-stage Docker build: `node:20` for build stage (with build tools), `node:20-slim` for runtime stage (copy compiled `node_modules`)
- Test the Docker image end-to-end with actual audio playback, not just container startup

**Warning signs:**
- `npm ci` output contains `gyp ERR! build error` or warnings about native module compilation
- Container runs but audio is silent or CPU spikes to 100% during playback
- `node_modules/mediaplex/build/` directory is empty or missing after `docker build`

**Phase:** Docker Setup

---

## Moderate Pitfalls

---

### Pitfall 6: Discord Client / Queue Metadata Types — TypeScript Breaks Implicit Casts

**What goes wrong:** The existing code stores `voiceChannel`, `textChannel`, and other Discord objects in `queue.metadata` as a plain object. TypeScript will infer this as `unknown` or `Record<string, any>` unless explicitly typed. Every command that reads from `queue.metadata` will have type errors, and naive fixes (`as any` casts everywhere) defeat the purpose of migrating to TypeScript.

**Why it happens:** discord-player's `GuildQueue<Metadata>` is generic. The metadata type must be declared once and propagated everywhere. If developers don't set this up upfront, they accumulate `as any` casts that silently hide real bugs (the exact kind TS was supposed to catch).

**Prevention:**
- Define a `QueueMetadata` interface in `src/types/queue.ts` before migrating any command
- Extend `Player` creation with the generic: `new Player<QueueMetadata>(client)`
- All commands then get typed `queue.metadata` with full autocomplete and null-safety
- Block `as any` in ESLint config (`@typescript-eslint/no-explicit-any: error`)

**Warning signs:**
- `queue.metadata` access without type assertions in commands
- `// @ts-ignore` or `as any` appearing during migration

**Phase:** TS Migration

---

### Pitfall 7: Discord Client Augmentation vs. Extension — Wrong Choice Causes Type Leaks

**What goes wrong:** When attaching a `Player` instance to the Discord `Client` (a common pattern for sharing it across commands), developers either extend the Client class or use TypeScript module augmentation. Extending the class causes issues: discord.js emits the base `Client` type from events (e.g., `ready`, `interactionCreate`), so the custom extended class's properties are unavailable without casting. Module augmentation is the correct approach but is non-obvious to developers new to TypeScript.

**Prevention:**
- Use module augmentation in `src/types/discord-augments.d.ts`:
  ```typescript
  declare module 'discord.js' {
    interface Client {
      player: Player<QueueMetadata>;
    }
  }
  ```
- Do not extend the Client class unless the codebase explicitly needs lifecycle method overrides
- Document this pattern in a `CONTRIBUTING.md` code style section

**Warning signs:**
- `class MortyClient extends Client` in the codebase
- Type casts like `(client as MortyClient).player` in event handlers

**Phase:** TS Migration

---

### Pitfall 8: Slash Command Registration — `applications.commands` Scope Missing

**What goes wrong:** The setup wizard registers slash commands automatically, but if the bot was invited to a server without the `applications.commands` OAuth2 scope, command registration via the REST API succeeds (HTTP 200) but commands never appear in Discord. The user sees no error and thinks setup succeeded.

**Why it happens:** The bot invite link requires both `bot` and `applications.commands` scopes. If the user generated their invite link from an online tutorial that only shows the `bot` scope, commands are invisible.

**Consequences:**
- Non-technical users see the bot online but cannot find any slash commands
- No error is thrown; the Discord API accepts the PUT request regardless of scope

**Prevention:**
- Setup wizard generates the bot invite URL automatically and includes both scopes: `https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot+applications.commands&permissions=...`
- After command registration, add a verification step: attempt to fetch the registered commands back via the API and confirm the list is non-empty
- Document: "If no commands appear, you must re-invite the bot using the link above — it will not remove the bot from your server"

**Warning signs:**
- README invite URL only includes `scope=bot`
- No invite URL generation in setup wizard
- User reports "bot is online but I don't see any commands"

**Phase:** Setup Wizard

---

### Pitfall 9: Global vs Guild Command Registration — 1-Hour Cache Delays Confuse Users

**What goes wrong:** Global slash command registration has a 1-hour propagation delay. If the setup wizard registers commands globally and a non-technical user immediately runs `/play`, they see "Unknown interaction" or no autocomplete. They assume the bot is broken and give up.

**Why it happens:** Discord caches global commands for up to 1 hour across all servers. Guild-scoped commands update instantly.

**Prevention:**
- During setup wizard, always register commands as guild-scoped for the user's target server (requires `GUILD_ID` in the `.env`)
- If the user wants commands in multiple servers, provide a separate script for global registration with a note: "Takes up to 1 hour to appear everywhere"
- Default setup flow = guild registration + instant verification

**Warning signs:**
- Setup wizard uses `Routes.applicationCommands()` (global) instead of `Routes.applicationGuildCommands()` (guild-specific)
- No note about propagation delay in README

**Phase:** Setup Wizard

---

### Pitfall 10: `willPlayTrack` Resolver Not Called — Playback Deadlocks Silently

**What goes wrong:** discord-player v7 passes `(queue, track, config, resolver)` to `willPlayTrack` event listeners. The `resolver` callback MUST be called or playback deadlocks forever. During TS migration, if the event listener signature is typed incorrectly (e.g., only `(queue, track)` with no resolver parameter), the resolver is never called. TypeScript will not warn because the function is still a valid `(queue, track) => void` — it just ignores extra arguments.

**Why it happens:** JavaScript/TypeScript allows functions with fewer parameters than their caller provides. A listener typed as `(queue: GuildQueue, track: Track) => void` compiles fine even if the caller passes 4 arguments, silently discarding the resolver.

**Prevention:**
- Type the listener explicitly with all 4 parameters: `(queue: GuildQueue, track: Track, config: TrackSkipReason, resolver: () => void) => void`
- Add an integration smoke test: play one track and verify it starts within 5 seconds
- Add a `setTimeout` warning: if playback doesn't start within 10 seconds of `willPlayTrack` firing, log `"willPlayTrack resolver may not have been called"`

**Warning signs:**
- `willPlayTrack` listener typed with only 2 parameters
- Bot appears to enqueue tracks but audio never starts
- Queue state shows `isPlaying: false` indefinitely after enqueue

**Phase:** TS Migration

---

### Pitfall 11: `discord-player` Caret Version — Minor Bump Breaks Resolver Signature

**What goes wrong:** `package.json` has `"discord-player": "^7.2.0"`. The caret allows automatic upgrades to any 7.x version on `npm install`. If the resolver signature changes in a future 7.x release, playback silently deadlocks (see Pitfall 10). This is especially dangerous for new users installing from a fresh clone.

**Prevention:**
- Pin to exact version: `"discord-player": "7.2.0"` (no caret)
- Document the pinned version in README: "Do not upgrade discord-player without testing — the resolver callback signature is version-specific"
- Add to setup wizard post-install: validate installed discord-player version matches expected, warn if different

**Warning signs:**
- `^` or `~` prefix on `discord-player` in `package.json`
- `npm install` output shows discord-player upgrading

**Phase:** TS Migration (address during package.json cleanup)

---

### Pitfall 12: Verbose Debug Logging Baked Into Production Build

**What goes wrong:** `YtDlpExtractor.js` emits `console.log` at every audio chunk (every 200 chunks), at yt-dlp process start/stop, and on every search query. In Docker with log aggregation, this generates hundreds of lines per track and logs all user search queries in plaintext. After TS migration, if these logs are carried over, any user who ships the Docker image to a VPS is unknowingly logging user activity.

**Prevention:**
- Gate all debug-level logs behind `process.env.DEBUG` or `LOG_LEVEL=debug`
- Keep only error-level and startup-level logs unconditional
- Add `LOG_LEVEL` to `.env.example` with a comment explaining values
- Run a lint rule: flag `console.log` in `src/extractors/` unless inside a `if (DEBUG)` guard

**Warning signs:**
- Raw `console.log` calls in `YtDlpExtractor.ts` without conditional guard
- Docker log output shows query strings like "user searched for: [song title]"

**Phase:** TS Migration (clean up during conversion)

---

## Minor Pitfalls

---

### Pitfall 13: `.env` File Not Copied Into Docker Image

**What goes wrong:** Developers add `.env` to `.dockerignore` (correctly, to avoid committing secrets), but the Docker container then has no environment variables and crashes at startup with "TOKEN is undefined." This is especially common for non-technical users who follow the Docker setup path.

**Prevention:**
- Use `--env-file .env` in `docker run` or `env_file: - .env` in `docker-compose.yml`
- Do NOT add `COPY .env .` to the Dockerfile
- Setup wizard generates `docker-compose.yml` with `env_file` pre-configured
- Startup check validates all required env vars (`TOKEN`, `CLIENT_ID`, `GUILD_ID`) and prints a clear error if any are missing

**Warning signs:**
- `COPY .env .` in Dockerfile
- No `env_file` in `docker-compose.yml`
- Container crashes with `TypeError: Cannot read properties of undefined (reading 'startsWith')` (typical TOKEN-is-undefined failure)

**Phase:** Docker Setup

---

### Pitfall 14: `nowPlayingMessages` Map Never Cleaned Up — State Leak After TS Refactor

**What goes wrong:** The `nowPlayingMessages` Map in `src/index.js` stores guild-to-message mappings and is never pruned. During TS migration, if this is refactored into a module-level singleton without lifecycle cleanup, it accumulates stale entries indefinitely. For a bot serving many guilds over a long uptime, this is a slow memory leak.

**Prevention:**
- Add a `delete nowPlayingMessages.get(guildId)` call inside `emptyQueue` and `disconnect` event handlers
- Move the Map into a dedicated `NowPlayingTracker` class during TS migration so its lifecycle is explicit
- This is a natural cleanup to do during TS conversion since the Map needs a type annotation anyway

**Warning signs:**
- `nowPlayingMessages` Map has no corresponding delete calls in event handlers
- Bot memory usage grows steadily over 24+ hours of uptime

**Phase:** TS Migration

---

### Pitfall 15: macOS `brew` Install Assumption — Fails on Non-Homebrew macOS

**What goes wrong:** Setup scripts that use `brew install ffmpeg yt-dlp` assume Homebrew is installed. Homebrew is common among developers but not universal for non-technical macOS users. On a fresh macOS install, `brew: command not found` is the first error the user sees.

**Prevention:**
- Detect if `brew` is installed before using it; if not, install Homebrew first (official one-liner from `brew.sh`) with explicit user confirmation
- Alternatively, download pre-built static binaries directly (yt-dlp GitHub releases, ffmpeg static builds from `evermeet.cx/ffmpeg`)
- Clearly communicate to the user what is being installed and why

**Warning signs:**
- `brew install` in setup script without prior `command -v brew` check
- No fallback for non-Homebrew macOS installations

**Phase:** Setup Wizard

---

### Pitfall 16: `youtube_cookies.txt` at Project Root — Accidental Commit Risk

**What goes wrong:** The cookies file currently sits in the project root. During a fresh setup, the setup wizard may ask users to place their cookies file "in the project folder." If a user then adds all files to git (`git add .`) before committing their setup customizations, the cookies file is caught by `.gitignore` — but only if `.gitignore` is correct and present.

**Prevention:**
- Setup wizard stores cookies at `~/.config/morty-bot/youtube_cookies.txt` (outside project directory)
- Set `YTDLP_COOKIES_FILE` in `.env` to the absolute path
- Add a pre-commit hook check that warns if any `*.txt` file in the project root appears to be a Netscape cookies file (contains `# Netscape HTTP Cookie File`)

**Warning signs:**
- Default cookies path is inside the project directory
- `.gitignore` does not include `*.txt` or explicit cookie file names

**Phase:** Setup Wizard

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| TS tsconfig setup | ESM import extension crashes (Pitfall 1) | Use `module: NodeNext` to enforce extensions at compile time |
| TS migration of event handlers | willPlayTrack resolver silently dropped (Pitfall 10) | Type all 4 parameters explicitly; add integration smoke test |
| TS package.json cleanup | @snazzah/davey silently removed (Pitfall 3) | Add startup require-check; add comment in package.json |
| TS package.json cleanup | discord-player version drift (Pitfall 11) | Pin to exact version, remove caret |
| TS migration of extractors | Debug logs carried over to production (Pitfall 12) | Gate all console.log behind DEBUG env var |
| TS migration of commands | queue.metadata untyped (Pitfall 6) | Define QueueMetadata interface first; block `as any` in ESLint |
| TS migration of client setup | Client augmentation vs extension (Pitfall 7) | Use module augmentation pattern, not class extension |
| Setup wizard - Windows | PowerShell execution policy (Pitfall 4) | Use `-ExecutionPolicy Bypass` flag or provide .bat entry point |
| Setup wizard - macOS | Homebrew not installed (Pitfall 15) | Detect brew; offer static binary fallback |
| Setup wizard - all platforms | Missing applications.commands scope (Pitfall 8) | Generate invite URL with correct scopes in wizard |
| Setup wizard - command registration | 1-hour global propagation delay (Pitfall 9) | Register guild-scoped commands by default in wizard |
| Setup wizard - secrets | Cookies file accidentally committed (Pitfall 16) | Store outside project directory; pre-commit guard |
| Docker build | Alpine native module failures (Pitfall 5) | Use node:slim base; multi-stage build with build tools |
| Docker build | yt-dlp EJS JS runtime missing (Pitfall 2) | Install via pip with [default] extra or official binary; set --js-runtimes node |
| Docker build | .env not passed to container (Pitfall 13) | Use env_file in docker-compose.yml; never COPY .env |
| Docker build | @snazzah/davey missing in container (Pitfall 3) | Startup check verifies package resolves |

---

## Sources

- [yt-dlp External JavaScript Runtime Announcement (GitHub Issue #15012)](https://github.com/yt-dlp/yt-dlp/issues/15012) — MEDIUM confidence (official GitHub announcement)
- [yt-dlp EJS Wiki](https://github.com/yt-dlp/yt-dlp/wiki/EJS) — MEDIUM confidence (official yt-dlp wiki)
- [TypeScript Module Resolution: Choosing Compiler Options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html) — HIGH confidence (official TS docs)
- [TypeScript TSConfig moduleResolution](https://www.typescriptlang.org/tsconfig/moduleResolution.html) — HIGH confidence (official TS docs)
- [discord-player Migrating to v7](https://discord-player.js.org/docs/migrating/migrating_to_v7) — HIGH confidence (official discord-player docs)
- [discord.js Registering Slash Commands Guide](https://discordjs.guide/creating-your-bot/command-deployment.html) — HIGH confidence (official discord.js docs)
- [PowerShell Set-ExecutionPolicy (Microsoft Docs)](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-executionpolicy?view=powershell-7.4) — HIGH confidence (official Microsoft docs)
- [discord.js Module Augmentation for TypeScript](https://gist.github.com/suneettipirneni/bd1bc76838bf15d2ced1c4840ee7ef90) — MEDIUM confidence (community gist, verified against discord.js TypeScript issue tracker)
- [Five Considerations When Building Cross-Platform Tools](https://semgrep.dev/blog/2025/five-considerations-when-building-cross-platform-tools-for-windows-and-macos/) — MEDIUM confidence (Semgrep engineering blog, 2025)
- [Node.js, TypeScript and ESM: it doesn't have to be painful](https://dev.to/a0viedo/nodejs-typescript-and-esm-it-doesnt-have-to-be-painful-438e) — MEDIUM confidence (community, verified against Node.js official docs)
- Project codebase analysis: `.planning/codebase/CONCERNS.md` — HIGH confidence (direct code audit)
- Project memory: `MEMORY.md` (DAVE protocol, willPlayTrack, YouTube stream approach) — HIGH confidence (first-hand debugging records)
