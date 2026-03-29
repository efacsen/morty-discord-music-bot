# Codebase Concerns

**Analysis Date:** 2026-03-29

---

## Tech Debt

**Duplicate `error` event handler registered twice in `src/index.js`:**
- Issue: `player.events.on('error', ...)` is registered at line 76 and again at line 163 — two separate handlers for the same event. Both send a message to the channel, so every queue error triggers two Discord messages.
- Files: `src/index.js`
- Impact: Doubled error messages shown to users; potential confusion and noise.
- Fix approach: Remove the duplicate handler at line 163, keeping only the one at line 76 which already has full error logging.

**`PlayDLExtractor.js` is dead code:**
- Issue: `src/extractors/PlayDLExtractor.js` is a fully-implemented extractor that is never imported or registered anywhere. The project switched to `YtDlpExtractor` for YouTube. `play-dl` remains a listed dependency.
- Files: `src/extractors/PlayDLExtractor.js`, `package.json`
- Impact: `play-dl` (^1.9.7) ships as a production dependency despite providing no value. It also won't work — per dev notes, all JS-based YouTube extractors broke in October 2025 when YouTube changed its API.
- Fix approach: Delete `src/extractors/PlayDLExtractor.js` and remove `play-dl` and `discord-player-youtube` from `package.json` dependencies.

**`discord-player-youtube` listed as dependency but never imported:**
- Issue: `package.json` lists `"discord-player-youtube": "^0.5.6"` but no source file imports it.
- Files: `package.json`
- Impact: Dead weight in `node_modules`; could confuse new contributors into thinking it's the active YouTube backend.
- Fix approach: Remove from `package.json` dependencies.

**`nowPlayingMessages` Map in `src/index.js` is module-level state with no cleanup:**
- Issue: The `nowPlayingMessages` Map stores `{ messageId, channelId }` per guild and is never pruned. If the bot serves many guilds over time, entries accumulate indefinitely. There is no cleanup on `emptyQueue`, `disconnect`, or `stop`.
- Files: `src/index.js` (line 32)
- Impact: Negligible memory leak for small deployments; stale entries for guilds that stop using the bot.
- Fix approach: Delete the guild's entry from `nowPlayingMessages` inside `emptyQueue` and `disconnect` event handlers.

**Boilerplate voice-channel guard duplicated across all 11 command files:**
- Issue: Every command file repeats the same 3-part guard: (1) check user is in a voice channel, (2) get queue, (3) check user is in the same voice channel as the bot. This is copy-pasted in `back.js`, `bassboost.js`, `jump.js`, `loop.js`, `pause.js`, `resume.js`, `seek.js`, `shuffle.js`, `skip.js`, `stop.js`, and `volume.js`.
- Files: `src/commands/*.js`
- Impact: Any change to the guard logic (e.g., different error message, adding DM support) must be applied to 11 files. High risk of divergence.
- Fix approach: Extract a `requireVoiceChannel(interaction, queue)` helper in `src/utils/` that returns an error reply and a truthy value if the check fails, and call it from each command.

**`queue.metadata.voiceChannel` is a stale reference:**
- Issue: When the queue is created in `play.js` (line 70-81), `voiceChannel` is set to `interaction.member.voice.channel` at creation time. All 11 command files compare `interaction.member.voice.channelId` against `queue.metadata.voiceChannel.id`. If the bot is moved between voice channels after the queue starts, the stored reference becomes stale and the check will incorrectly block or allow commands.
- Files: `src/commands/back.js`, `src/commands/bassboost.js`, `src/commands/jump.js`, `src/commands/loop.js`, `src/commands/pause.js`, `src/commands/resume.js`, `src/commands/seek.js`, `src/commands/shuffle.js`, `src/commands/skip.js`, `src/commands/stop.js`, `src/commands/volume.js`
- Impact: Users in the bot's actual channel may be incorrectly denied, or users in the old channel may incorrectly be allowed after a bot move.
- Fix approach: Compare against `queue.channel?.id` (the actual current voice connection channel) instead of the stale metadata reference.

**`@snazzah/davey` (DAVE encryption) is never explicitly imported in source:**
- Issue: The DAVE protocol package is listed in `package.json` and is critical for Discord voice (without it the bot silently fails to connect), but it is loaded implicitly by `discord-voip` via `node_modules` resolution — not through any explicit `import` in project source. If the package is accidentally removed from `package.json` or omitted in a fresh install, the failure is completely silent (voice connection goes to code:6 Closed with no obvious error).
- Files: `package.json`, `src/index.js`
- Impact: Silent audio breakage with no clear error in logs.
- Fix approach: Add an explicit startup check — e.g., verify `@snazzah/davey` can be resolved at boot, and throw a clear error if it cannot.

---

## Known Bugs

**`track.views` crash in song selection embed:**
- Symptoms: `track.views.toLocaleString()` throws `TypeError: Cannot read properties of null` when a YouTube search result returns a video with a null or undefined `view_count`.
- Files: `src/utils/createSongSelectionEmbed.js` (line 21)
- Trigger: Run `/play` with a search query that returns a recently uploaded or unlisted video with no public view count.
- Workaround: Wrapping in `(track.views ?? 0).toLocaleString()` is the minimal fix.

**`song_select_*` button interactions are unrouted:**
- Symptoms: If a user clicks a song selection button more than 30 seconds after the embed is posted, or if the `interactionCreate` event fires for any reason before the collector activates, the button interaction hits `interactionCreate.js` and is silently dropped — no `song_select_` prefix is handled in the router at line 8.
- Files: `src/events/interactionCreate.js` (line 8), `src/commands/play.js` (lines 126-178)
- Trigger: Interaction received for `song_select_*` customId when no collector is active.
- Workaround: The collector's 30-second `max: 1` limit means this is a small window, but any interaction after collector end produces a "This interaction failed" message to the user with no Discord acknowledgment from the bot.

**`skip` button in player controls does not check for empty queue:**
- Symptoms: In `buttonHandler.js` the `player_skip` handler calls `queue.node.skip()` only after checking `queue.tracks.data.length === 0`. However, the `Skip` button in `createPlayerEmbed.js` is disabled (`setDisabled`) when the queue is empty, but this state is not refreshed when a track ends naturally — the buttons on the old embed remain as-is with stale enabled/disabled state.
- Files: `src/utils/createPlayerEmbed.js` (line 37), `src/handlers/buttonHandler.js` (lines 46-53)
- Trigger: User clicks the `Skip` button on an embed that was rendered when queue had tracks, but all remaining tracks have since played out.
- Workaround: The `player_skip` handler in `buttonHandler.js` does validate before skipping, so it sends an error reply rather than crashing.

---

## Security Considerations

**`youtube_cookies.txt` present in working directory:**
- Risk: The file exists at the project root (`/youtube_cookies.txt`) and contains YouTube session cookies (Netscape format). These are browser session credentials. It is correctly listed in `.gitignore` and should not be committed, but its presence as a flat file in the project root means any process with read access to the directory can exfiltrate active YouTube credentials.
- Files: `youtube_cookies.txt` (root)
- Current mitigation: `.gitignore` excludes it; `YTDLP_COOKIES_FILE` env var points to it at runtime.
- Recommendations: Store the cookies file outside the project directory (e.g., `~/.config/morty-bot/cookies.txt`) and update `YTDLP_COOKIES_FILE` accordingly. Document this in `docs/YOUTUBE-AUTH.md`.

**`yt-dlp` binary committed/present in project root with world-writable permissions:**
- Risk: A `yt-dlp` binary exists at `/yt-dlp` (3MB, permissions `rwxrwxrwx`). It is listed in `.gitignore` so it should not be tracked, but its world-writable flag (`777`) means any local process could replace it with a malicious binary.
- Files: `yt-dlp` (root)
- Current mitigation: `.gitignore` excludes it from commits.
- Recommendations: Remove the bundled binary; require yt-dlp to be installed system-wide (already documented in setup guides). If bundling is intentional, set permissions to `755`.

**Debug logging of full query and track URLs in production:**
- Risk: `src/extractors/YtDlpExtractor.js` and `src/commands/play.js` emit `console.log` statements with full query strings, YouTube URLs, and chunk counts at every track play. If logs are collected (e.g., Docker log aggregation, centralized logging), all user search queries and private video URLs are retained in plaintext.
- Files: `src/extractors/YtDlpExtractor.js`, `src/commands/play.js`, `src/index.js`
- Current mitigation: None — verbose logging is always on.
- Recommendations: Add a `DEBUG` env var gate around verbose stream-level logs; keep error-level logs unconditional.

---

## Performance Bottlenecks

**32MB PassThrough buffer per stream:**
- Problem: Every track stream creates a `PassThrough` with `highWaterMark: 1 << 25` (32MB). For a bot playing 10 concurrent tracks across guilds, this is up to 320MB of in-memory buffer.
- Files: `src/extractors/YtDlpExtractor.js` (line 280)
- Cause: The buffer was sized to prevent "operation aborted" stream errors. This is a valid workaround for yt-dlp piping, but 32MB is larger than needed for most audio streams.
- Improvement path: Reduce to 4–8MB (`1 << 22` or `1 << 23`) and test if stream underruns return. If they do, expose `YTDLP_BUFFER_SIZE` as a configurable env var.

**Playlist metadata uses `--flat-playlist` but still blocks on full JSON parse:**
- Problem: `handlePlaylist` fetches all playlist metadata in a single `execPromise` call. For large playlists (500+ tracks), this blocks the event loop while parsing the full JSON output as one string split into lines.
- Files: `src/extractors/YtDlpExtractor.js` (line 212)
- Cause: `yt-dlp-wrap` `execPromise` buffers all stdout before resolving; there is no streaming JSON parse.
- Improvement path: Use `execStream` with a line-by-line parser (e.g., `readline`) to process tracks incrementally and add them to the queue without waiting for the full playlist.

**Verbose chunk logging every 200 chunks during audio streaming:**
- Problem: The stream data handler in `YtDlpExtractor.stream()` logs `console.log` every 200 chunks plus the first 3 chunks. For a 4-minute track this generates ~20-50 log lines per track.
- Files: `src/extractors/YtDlpExtractor.js` (lines 297-303)
- Cause: Debug instrumentation left in production code.
- Improvement path: Gate behind a `DEBUG=ytdlp` env var or remove entirely.

---

## Fragile Areas

**`YtDlpExtractor` depends on system `yt-dlp` binary being up to date:**
- Files: `src/extractors/YtDlpExtractor.js`
- Why fragile: YouTube's anti-bot measures change frequently. If the system `yt-dlp` binary is outdated, all YouTube playback silently fails. The extractor logs the version at startup (`activate()`) but there is no version check or warning if it is below a known-good version.
- Safe modification: Add a minimum version check in `activate()` comparing `version` against a hardcoded minimum (e.g., `2025.09.26`); log a warning if below.
- Test coverage: None.

**`discord-player` version pinned at `^7.1.0` but installed at 7.2.0:**
- Files: `package.json`
- Why fragile: The `willPlayTrack` event signature `(queue, track, config, resolver)` is specific to v7. A minor version bump could change this, causing the resolver to never be called and playback to deadlock silently. The caret (`^`) range allows 7.x updates automatically on `npm install`.
- Safe modification: Pin `discord-player` to an exact version (`"7.2.0"`) in `package.json` until the upgrade path is validated.
- Test coverage: None.

**`nowPlayingMessages` keyed by guild ID, but channel can change mid-session:**
- Files: `src/index.js` (lines 100-127)
- Why fragile: If the bot is moved to a different text channel during a session, the stored `channelId` will mismatch and a new embed is created, but the old embed in the original channel remains active with stale buttons. Both embeds accept button interactions.
- Safe modification: On `playerStart`, always delete the old message if the channel changes rather than leaving it orphaned.
- Test coverage: None.

**`Dockerfile` does not install `yt-dlp`:**
- Files: `Dockerfile`
- Why fragile: The Dockerfile installs `ffmpeg` via `apk` but not `yt-dlp`. Any container built from this image will fail immediately at `findYtDlpPath()` with an error about yt-dlp not being found. The bot cannot play any YouTube audio in Docker.
- Safe modification: Add `RUN apk add --no-cache ffmpeg python3 py3-pip && pip3 install yt-dlp` (or download the static binary from GitHub releases) to the Dockerfile.
- Test coverage: None.

---

## Dependencies at Risk

**`play-dl` (^1.9.7) — broken for YouTube:**
- Risk: All JS-based YouTube extractors (including play-dl) stopped working when YouTube changed their API in October 2025. The `PlayDLExtractor` that uses it is dead code and not registered.
- Impact: No runtime impact (it's not used). Misleads contributors into thinking play-dl is an active fallback.
- Migration plan: Remove from `package.json`.

**`@discord-player/extractor` — loaded via `DefaultExtractors` but YouTube path is broken:**
- Risk: `DefaultExtractors` is loaded in `src/index.js` and likely includes an internal YouTube extractor that will fail. Because `YtDlpExtractor` runs first (registered before `DefaultExtractors`), it intercepts YouTube queries before they reach the broken extractor, masking the issue. If extractor ordering changes, the broken default extractor may intercept YouTube queries and return nothing.
- Files: `src/index.js` (line 47)
- Impact: Latent risk of YouTube playback regression if extractor priority order changes.
- Migration plan: Audit what `DefaultExtractors` provides (SoundCloud, Spotify, etc.) and only load those that are functional. Consider registering them individually rather than via `loadMulti(DefaultExtractors)`.

**`yt-dlp-wrap` (^2.3.12) — thin wrapper with limited error surface:**
- Risk: `yt-dlp-wrap` does not expose stderr in `execPromise` errors. When yt-dlp fails (rate limited, bot detection, geo-block), the error object contains only the exit code — not the yt-dlp error message.
- Files: `src/extractors/YtDlpExtractor.js` (line 160)
- Impact: Difficult to diagnose why a specific video failed to play.
- Migration plan: Patch the error handler to capture stderr via `execStream` or switch to directly spawning `child_process.spawn` with stderr capture.

---

## Missing Critical Features

**No rate limiting on `/play` command:**
- Problem: A user can spam `/play` to enqueue hundreds of tracks in seconds. There is no per-user or per-guild rate limit beyond Discord's built-in slash command cooldown.
- Blocks: Prevents abuse on public bots; large playlist enqueues (1000+ tracks) can consume significant memory.

**No maximum queue size enforcement:**
- Problem: Queues have no cap. A user can enqueue a 10,000-track playlist and `handlePlaylist` will attempt to create 10,000 `Track` objects and hold them in memory.
- Files: `src/extractors/YtDlpExtractor.js` (handlePlaylist), `src/commands/play.js`
- Blocks: Memory safety for public deployment.

**No multi-guild isolation for `nowPlayingMessages`:**
- Problem: The `nowPlayingMessages` Map lives in module scope in `src/index.js` and is not exported or accessible to commands. If a future refactor moves command handling to workers or separate processes, this state becomes inaccessible.
- Files: `src/index.js`

---

## Test Coverage Gaps

**No tests exist:**
- What's not tested: Everything — extractors, commands, button handlers, embed builders, event handlers.
- Files: Entire `src/` directory
- Risk: Regressions in YouTube stream handling, button routing, and queue state management go undetected until runtime.
- Priority: High for `src/extractors/YtDlpExtractor.js` (stream logic, error paths) and `src/handlers/buttonHandler.js` (button routing, state mutations).

**`findYtDlpPath()` not tested across platforms:**
- What's not tested: The binary discovery logic that uses `execSync` to probe candidate paths. On Windows the path list includes no `.exe` candidates and relies entirely on `PATH` fallback.
- Files: `src/extractors/YtDlpExtractor.js` (lines 10-42)
- Risk: Windows users with non-standard yt-dlp installs get a generic error with no actionable path suggestion.
- Priority: Medium.

---

## Leftover Debugging Artifacts

**Six `*-player-script.js` files in project root:**
- Files: `1759840660634-player-script.js`, `1759840660639-player-script.js`, `1759842480201-player-script.js`, `1759842480209-player-script.js`, `1759842694724-player-script.js`, `1759842694731-player-script.js`
- Size: ~2.6MB each (15.7MB total)
- Issue: Appears to be Discord Player debug/cache script dumps from debugging sessions (referenced in `.gitignore` as `*-player-script.js`). They are gitignored and not committed, but they litter the project root and consume 15MB of disk space.
- Fix: Delete them. They are already excluded by `.gitignore`.

**`scan-deps.js` and `check-system.js` in project root:**
- Files: `scan-deps.js`, `check-system.js`
- Issue: Utility scripts for debugging dependency state. `check-system.js` is exposed as `npm run check` so it has legitimate use. `scan-deps.js` is not in `scripts` and appears to be a one-off debug tool with no clear ongoing purpose.
- Fix: Either add `scan-deps.js` to npm scripts with documentation, or delete it.

---

*Concerns audit: 2026-03-29*
