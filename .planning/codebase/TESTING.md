# Testing Patterns

**Analysis Date:** 2026-03-29

## Test Framework

**Runner:** None configured

No test framework is installed or configured. There are no `jest.config.*`, `vitest.config.*`, or any equivalent files. No test-related packages appear in `package.json` dependencies or devDependencies. No `test` script exists in `package.json` scripts.

**Assertion Library:** None

**Run Commands:**
```bash
# No test commands available
# package.json scripts: start, dev, check, clear-commands only
```

## Test File Organization

**Location:** No test files exist anywhere in the project.

**Naming:** No convention established.

**Structure:** N/A

## Test Structure

**Suite Organization:** Not established.

**Patterns:** None exist. The project relies entirely on manual testing against a live Discord server.

## Mocking

**Framework:** None

**Patterns:** None established.

## Fixtures and Factories

**Test Data:** None defined.

**Location:** N/A

## Coverage

**Requirements:** None enforced.

**View Coverage:**
```bash
# No coverage tooling configured
```

## Test Types

**Unit Tests:** Not present.

**Integration Tests:** Not present.

**E2E Tests:** Not present. Manual Discord testing is the only verification method.

## Manual Testing Infrastructure

While no automated tests exist, there are diagnostic/utility scripts at the project root:

**`check-system.js`** (`/Users/kevinzakaria/developers/discord-music-bot/check-system.js`):
- Validates system dependencies (Node version, yt-dlp binary, required packages)
- Run with: `npm run check`

**`scan-deps.js`** (`/Users/kevinzakaria/developers/discord-music-bot/scan-deps.js`):
- Scans and reports installed dependency versions

**`clear-commands.js`** (`/Users/kevinzakaria/developers/discord-music-bot/clear-commands.js`):
- Utility to deregister Discord slash commands (useful during development)
- Run with: `npm run clear-commands`

## Testability Assessment

The codebase has low inherent testability due to:

1. **Tight coupling to Discord.js objects** — Commands take a raw `interaction` object as their only parameter. Unit testing requires mocking the full Discord `Interaction` shape.

2. **Global player state** — Commands call `useMainPlayer()` (a global singleton from `discord-player`). This makes isolation without mocking the module difficult.

3. **Side effects in index.js** — `src/index.js` performs initialization (client creation, player setup, file loading) at module load time using top-level `await`, making it hard to import in a test environment.

4. **Utility functions are testable** — Pure functions in `src/utils/formatTime.js` (`formatDuration`, `parseTimeString`, `createProgressBar`) have no dependencies and would be straightforward to unit test.

5. **Extractor logic is partially testable** — `YtDlpExtractor` methods like `isPlaylistUrl`, `buildVideoUrl`, `buildThumbnailUrl`, and `parseDuration` are pure and could be unit tested without yt-dlp being present.

## Recommended Test Setup (if adding tests)

Given the ES Module setup (`"type": "module"` in `package.json`), the preferred framework would be **Vitest** (native ESM support) rather than Jest (requires transform configuration for ESM).

Suggested starting point:
```bash
npm install --save-dev vitest
```

```json
// package.json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Priority targets for initial test coverage:
1. `src/utils/formatTime.js` — pure functions, zero setup needed
2. `src/extractors/YtDlpExtractor.js` — `isPlaylistUrl`, `buildThumbnailUrl`, `parseDuration` methods
3. `src/utils/createSongSelectionEmbed.js` — embed builder output shape validation

---

*Testing analysis: 2026-03-29*
