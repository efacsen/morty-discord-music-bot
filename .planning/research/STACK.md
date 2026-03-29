# Technology Stack

**Project:** Morty — Open-Source Discord Music Bot (TypeScript Refactor)
**Researched:** 2026-03-29
**Overall confidence:** MEDIUM-HIGH

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| discord.js | ^14.25.1 | Discord API client, slash commands, embeds, button interactions | Already in use at this version. Types are bundled — no separate `@types` package needed. v14 is the current stable line; v15 not yet released. |
| discord-player | ^7.2.0 | Audio queue and playback engine | Already working and tested. v7 uses `discord-voip` internally (not `@discordjs/voice`). Has full TypeScript types. Do NOT upgrade to an untested version mid-refactor. |
| @discord-player/extractor | ^7.2.0 | Default extractor pack (SoundCloud, Vimeo etc.) | Pin to same minor as discord-player to avoid API drift. |

**Confidence:** HIGH — verified against existing working codebase and npm registry

### Language & Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | ^6.0.0 | Type-safe source language | Latest stable (6.0.2 as of research date). Full strict mode for contributor safety. discord.js and discord-player both ship their own `.d.ts` so no DefinitelyTyped needed for core. |
| Node.js | >=20.0.0 (recommend 20 LTS) | Runtime | Current project requires >=18. Recommend bumping floor to 20 LTS (iron release) for native ESM stability and `--experimental-strip-types` availability. Node 22 is fine too — use `node:20-alpine` in Docker for determinism. |
| @types/node | ^20.0.0 | Node.js type definitions | Required for `process`, `Buffer`, `child_process`, `fs`, `path`, `stream` — all used in `YtDlpExtractor`. Pin to the same major as Node.js floor. |

**Confidence:** HIGH

### Build Toolchain

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| tsx | ^4.21.0 | TypeScript execution for development | No build step in dev — `tsx watch src/index.ts` gives instant hot reload with proper ESM support. Faster DX than `ts-node`. Used as `dev` script only. |
| tsup | ^8.5.1 | Production bundler | Despite tsup not being actively developed toward new features, it is the most battle-tested option for this use case. tsdown (the successor, v0.20.3) is still pre-1.0 and not recommended for a production open-source release that non-technical users will build from source. tsup produces a clean `dist/` output with `--format esm`. Revisit tsdown post-1.0. |

**Why not tsdown?** At v0.20.3 it has not reached 1.0. The tsdown team explicitly says to validate output carefully. For an open-source project where contributors build from source, a pre-1.0 bundler introduces unnecessary risk.

**Why not plain tsc?** tsc does not bundle — it emits one `.js` per `.ts` file, preserving relative imports that may break in ESM. tsup handles the entry point correctly and is the de-facto standard in the Discord bot community.

**Confidence:** MEDIUM — tsup version verified (8.5.1); tsdown risk assessment from official docs and community discussion.

### Setup Wizard

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @clack/prompts | ^1.1.0 | Interactive CLI prompts for setup wizard | 4KB gzipped, ships beautiful ANSI output with zero config. Has a group/wizard API that Inquirer never solved cleanly. Modern ESM package. Actively developed (v1.1.0 released March 2026). Better than `@inquirer/prompts` for a linear wizard flow. |
| chalk | ^5.x | Terminal color for non-prompt output (status messages, errors) | ESM-native in v5+. Zero config. @clack/prompts handles prompts but not general status lines — chalk fills the gap. |

**Why not Inquirer?** The legacy `inquirer` package is not actively developed. The modern `@inquirer/prompts` is fine but heavier and has a less ergonomic wizard API than @clack/prompts. For a setup wizard with a fixed sequence of steps, @clack/prompts is the better fit.

**Why not a shell script?** A shell script (`.sh`) cannot reliably run on Windows without WSL. Node.js with @clack/prompts gives cross-platform support (macOS/Linux/Windows) in one file with the same user experience.

**Confidence:** MEDIUM — @clack/prompts version verified (1.1.0); community consensus from WebSearch, no Context7 verification.

### Code Quality

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ESLint | ^9.x | Linting | v9 with flat config (`eslint.config.mjs`) is now the default. The old `.eslintrc` format is deprecated. `defineConfig()` provides type safety on the config itself. |
| typescript-eslint | ^8.x | TypeScript-aware lint rules | Provides `tseslint.configs.recommended` for flat config. The one-package approach (`typescript-eslint`) replaces the old `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` split. |
| prettier | ^3.8.1 | Code formatting | Opinionated formatting eliminates style debates for contributors. v3.8.1 is current stable. Use `eslint-config-prettier` to disable conflicting ESLint style rules. |

**Confidence:** HIGH — ESLint 9 flat config is officially stable; versions confirmed from npm registry search.

### Docker

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| node:20-alpine | (Docker base) | Production container runtime | Alpine keeps image small. node:20 LTS is stable. The current Dockerfile already uses this base — keep it. |
| Multi-stage Dockerfile | — | Separate build and runtime environments | Builder stage: install all deps + run tsup build. Runtime stage: copy `dist/` + install production deps only. Eliminates TypeScript compiler, source `.ts` files, and devDependencies from final image. Typical size reduction: 50-70%. |
| docker-compose | v3.8+ | Container orchestration for self-hosted users | Already exists in the repo. Update for TS build (add `build` step, update `command`). No Kubernetes — overkill for a self-hosted music bot. |

**Confidence:** MEDIUM-HIGH — multi-stage Docker pattern well-documented; specific size claims from community benchmarks.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | tsup | tsdown | tsdown is v0.20.3, pre-1.0. Not safe for an open-source project where users build from source. Revisit after tsdown 1.0. |
| Build tool | tsup | plain tsc | tsc emits file-per-file, no bundling. Import paths break in ESM unless you add `.js` extensions to every import. tsup handles this cleanly. |
| Dev runner | tsx | ts-node | ts-node has ESM support issues and slow startup. tsx is faster and ESM-first. |
| CLI prompts | @clack/prompts | @inquirer/prompts | Inquirer heavier, wizard API less ergonomic. Both are valid; @clack/prompts is simpler for a fixed wizard flow. |
| CLI prompts | @clack/prompts | enquirer | enquirer is unmaintained since 2021. |
| Setup wizard runtime | Node.js script | bash/shell script | Shell scripts don't run natively on Windows. The target audience includes Windows users. |
| Linting | ESLint 9 flat config | ESLint 8 + .eslintrc | v8 config format is deprecated. New projects should use flat config from the start. |
| Linting | typescript-eslint (unified pkg) | @typescript-eslint/parser + @typescript-eslint/eslint-plugin (split) | The split packages are the old API. The unified `typescript-eslint` package is the current standard for ESLint 9. |
| TypeScript | ^6.0.0 | 5.x | TypeScript 6 is current. No reason to target a previous major for a new project. |

---

## Critical Dependencies Not to Change

These are already working and must stay locked to their current behavior:

| Package | Version | Why Frozen |
|---------|---------|------------|
| @snazzah/davey | ^0.1.10 | DAVE protocol support — without this, voice connections silently fail at code:6. Not negotiable. |
| discord-player | ^7.2.0 | Custom YtDlpExtractor is tightly coupled to v7 extractor API (`BaseExtractor`, `willPlayTrack` event signature). |
| yt-dlp-wrap | ^2.3.12 | Wraps system yt-dlp binary. Stable interface. |
| mediaplex | ^1.0.0 | Opus encoding required by discord-player. Swapping audio encoding mid-refactor risks playback regression. |

---

## TypeScript Migration Notes

**discord.js v14:** Ships its own TypeScript types. No `@types/discord.js` needed.

**discord-player v7:** Ships its own types. Custom extractor (`YtDlpExtractor`) needs to extend `BaseExtractor` from `'discord-player'` with proper type annotations. The `willPlayTrack` event signature is `(queue, track, config, resolver)` — the `resolver` parameter MUST be called or playback deadlocks. Type the resolver as `(stream: Readable | null) => void`.

**ESM + TypeScript:** The current codebase uses `"type": "module"`. TypeScript source should continue using ESM. tsup handles `--format esm` correctly without needing to add `.js` extensions to every import statement in source (tsup rewrites them at build time).

**tsconfig.json recommended settings:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Use `"module": "NodeNext"` + `"moduleResolution": "NodeNext"` for proper ESM Node.js resolution — this is the current recommendation for Node.js ESM projects over the older `"module": "ES2022"` pattern.

---

## Installation

```bash
# Core dependencies (no change from current)
npm install discord.js discord-player @discord-player/extractor
npm install @snazzah/davey yt-dlp-wrap mediaplex dotenv chalk
npm install @clack/prompts

# Dev dependencies (new for TS migration)
npm install -D typescript tsx tsup
npm install -D @types/node
npm install -D eslint typescript-eslint prettier eslint-config-prettier
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core Discord packages | HIGH | Already working; types verified bundled |
| TypeScript version | HIGH | 6.0.2 confirmed from npm registry search |
| Build toolchain (tsx + tsup) | MEDIUM | tsup 8.5.1 confirmed; tsdown risk assessed from official docs |
| Setup wizard (@clack/prompts) | MEDIUM | v1.1.0 confirmed; community consensus but no Context7 verification |
| ESLint/Prettier | HIGH | ESLint 9 flat config officially stable; versions confirmed |
| Docker pattern | MEDIUM-HIGH | Multi-stage pattern well-established; size claims from benchmarks |
| tsconfig settings | MEDIUM | NodeNext + NodeNext is current best practice for ESM; not Context7-verified |

---

## Sources

- discord.js v14.25.1: [npmjs.com/package/discord.js](https://www.npmjs.com/package/discord.js)
- discord-player v7 TypeScript: [discord-player.js.org](https://discord-player.js.org/) / [Migrating to v7](https://discord-player.js.org/docs/migrating/migrating_to_v7)
- TypeScript 6.0.2: [npmjs.com/package/typescript](https://www.npmjs.com/package/typescript)
- tsx 4.21.0: [npmjs.com/package/tsx](https://www.npmjs.com/package/tsx)
- tsup 8.5.1: [npmjs.com/package/tsup](https://www.npmjs.com/package/tsup)
- tsdown pre-1.0 status: [tsdown.dev/guide/migrate-from-tsup](https://tsdown.dev/guide/migrate-from-tsup) / [alan.norbauer.com](https://alan.norbauer.com/articles/tsdown-bundler/)
- @clack/prompts 1.1.0: [npmjs.com/package/@clack/prompts](https://www.npmjs.com/package/@clack/prompts) / [clack.cc](https://www.clack.cc/)
- ESLint 9 flat config + typescript-eslint: [typescript-eslint.io/getting-started](https://typescript-eslint.io/getting-started/) / [eslint.org](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/)
- prettier 3.8.1: [npmjs.com/package/prettier](https://www.npmjs.com/package/prettier)
- Docker multi-stage TypeScript: [docs.docker.com/guides/nodejs/containerize](https://docs.docker.com/guides/nodejs/containerize/) / [markaicode.com](https://markaicode.com/nodejs-docker-optimization-2025/)
- tsx dev workflow for Discord bots: [dev.to/fellipeutaka](https://dev.to/fellipeutaka/creating-your-first-discord-bot-using-typescript-1eh6)
- tsup + Discord bot community usage: [github.com/MarcusOtter/discord-needle/issues/50](https://github.com/MarcusOtter/discord-needle/issues/50)
