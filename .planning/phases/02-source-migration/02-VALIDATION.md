---
phase: 2
slug: source-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — TypeScript compiler is the validation gate |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run build && test ! -f src/extractors/PlayDLExtractor.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke test (bot starts, joins voice)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-xx-01 | TBD | TBD | MIG-01 | typecheck | `npm run typecheck` | ✅ (tsconfig) | ⬜ pending |
| 02-xx-02 | TBD | TBD | MIG-02 | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 02-xx-03 | TBD | TBD | MIG-03 | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 02-xx-04 | TBD | TBD | MIG-04 | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 02-xx-05 | TBD | TBD | MIG-05 | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 02-xx-06 | TBD | TBD | MIG-06 | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 02-xx-07 | TBD | TBD | MIG-07 | build | `npm run build` | ✅ | ⬜ pending |
| 02-xx-08 | TBD | TBD | MIG-08 | smoke/manual | `npm start` (observe startup log) | manual-only | ⬜ pending |
| 02-xx-09 | TBD | TBD | MIG-09 | file check | `test ! -f src/extractors/PlayDLExtractor.js` | ❌ (to be deleted) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
- `npm run typecheck` — already configured from Phase 1
- `npm run build` — already configured from Phase 1
- No test files or frameworks to install

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bot starts and connects to voice channel | MIG-08 | Requires live Discord bot token, guild, and voice channel | Run `npm start`, verify bot comes online, join voice channel, run `/play` |
| All 14 commands respond without crashing | MIG-08 | Requires live Discord interaction | Exercise each command in a test guild |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
