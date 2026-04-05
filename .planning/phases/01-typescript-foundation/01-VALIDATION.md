---
phase: 1
slug: typescript-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — this phase is pure configuration; validation is compiler/linter driven |
| **Config file** | `tsconfig.json` (TypeScript), `eslint.config.js` (ESLint) |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run build && npm run lint && npx prettier --check "src/**/*.ts"` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | TSF-01 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | TSF-03 | smoke | `npm run build && echo OK` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | TSF-06 | smoke | `node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); if(p.dependencies['discord-player']!=='7.2.0') process.exit(1)"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | TSF-02 | smoke | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | TSF-04 | smoke | `npm run lint` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | TSF-05 | smoke | `npx prettier --check "src/**/*.ts"` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 1 | TSF-07 | manual | See manual verifications below | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tsconfig.json` — required before any TypeScript compilation (TSF-01)
- [ ] `src/types/index.ts` — shared type layer (TSF-02)
- [ ] `eslint.config.js` — lint configuration (TSF-04)
- [ ] `.prettierrc` — formatting rules (TSF-05)
- [ ] `package.json` script updates — dev/build/typecheck/lint/format (TSF-03)
- [ ] `package.json` version pin — discord-player exact version (TSF-06)
- [ ] Davey guard in `src/index.js` — startup check (TSF-07)
- [ ] Framework install: `npm install --save-dev typescript eslint @eslint/js typescript-eslint prettier eslint-config-prettier`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Startup throws if davey missing | TSF-07 | Requires uninstalling a package to test; destructive to node_modules | 1. `mv node_modules/@snazzah/davey node_modules/@snazzah/davey.bak` 2. Run `node src/index.js` 3. Verify exit code 1 + descriptive error message 4. `mv node_modules/@snazzah/davey.bak node_modules/@snazzah/davey` |
| `npm run dev` starts bot in watch mode | TSF-03 | Requires running bot process; interactive | Run `npm run dev`, verify tsx watch starts and bot connects |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
