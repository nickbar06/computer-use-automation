# Task: Node TypeScript scaffold

**Date**: 2026-09-23
**Status**: done
**Spec**: `tasks/01-scaffold/README.md`

---
> Validation Run must contain actual command output before status can be `done`.
---

## Original Request

Implement [README.md](README.md) in this folder.

## Restated Goal

Runnable Node 20+ package with tsx CLI stub, strict tsconfig, .env loader, help text listing future commands, and a smoke test that stays as the first file in the growing suite.

### Success criteria

`npm install`; `tsc --noEmit` clean; `npm run cua -- help` prints serve/discover/replay/operator; `npm test` passes.

## Assumptions and Open Questions

| Question | Answer |
| -------- | ------ |
| Discover/replay if invoked now? | Exit 1 with “not implemented yet.” Help still lists them. |

## Implementation Plan

1. Read [README.md](README.md) and [LESSON.md](LESSON.md)
2. Implement the listed files
3. Record validation output below

## Phase Checkpoints

| Phase | Status | What was completed | Evidence still missing |
| ----- | ------ | ------------------ | ---------------------- |
| Recon | Done | Spec + lesson | — |
| Implementation | Done | package, tsconfig, paths, CLI stub, smoke test | — |
| Runtime verification | Done | install, tsc, help, npm test | — |
| Documentation and closure | Done | tracking + index | — |

## Progress Checklist

- [x] Spec README read
- [x] Lesson questions answered
- [x] Implementation complete
- [x] Spec Acceptance checkboxes ticked
- [x] Runtime verification recorded (real output)
- [x] Handoff summary written
- [x] Spec `status: done` + index checkbox in `tasks/README.md`

## Files Changed

| File | Change type | Notes |
| ---- | ----------- | ----- |
| `package.json` | added | cua / test / typecheck; playwright + zod |
| `package-lock.json` | added | lockfile from npm install |
| `tsconfig.json` | added | NodeNext, noEmit, allowImportingTsExtensions |
| `src/paths.ts` | added | ROOT, DEFAULT_ORIGIN, DEFAULT_PORT |
| `src/cli.ts` | added | help + serve stub; .env loader; no Page |
| `tests/smoke.test.ts` | added | ROOT exists |
| `README.md` | updated | current npm commands |

## Validation Run

**Commands run**:

```text
npm install
npx tsc --noEmit
npm run cua -- help
npm test
```

**Output**:

```text
added 9 packages, and audited 10 packages in 14s
found 0 vulnerabilities

tsc exit: 0

> computer-use-automation@0.1.0 cua
> tsx src/cli.ts help

cua — computer-use automation

Commands:
  serve                 start the local CoreLink mock (Task 02)
  discover              LLM observe → decide → act (Task 06)
  replay                run a capability with no model (Task 08)
  operator              resume | status a HITL session (Task 09)

Examples:
  npm run cua -- help
  npm run cua -- serve
  npm run cua -- discover --goal "..." --input member_id=12345
  npm run cua -- replay capabilities/lookup_savings.json --input member_id=12345
  npm run cua -- operator resume --session <id>

> computer-use-automation@0.1.0 test
> tsx --test tests/*.test.ts

✔ ROOT exists (0.332417ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

`.env` is in `.gitignore`. `.env.example` lists `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` as placeholders.

## Open Issues / Blockers

None

## Handoff Summary

**What was done**: Node 20+ TypeScript package with `npm run cua`, a 15-line `.env` loader that does not overwrite existing env, `help` listing serve/discover/replay/operator, and `tests/smoke.test.ts`.

**How to verify it works**: `npm run cua -- help` and `npm test` from the repo root.

**Key decisions made**: CLI does not import Playwright. `serve` logs and exits 0 until Task 02. `discover` / `replay` / `operator` exit 1 with a clear stub message.

**Known limitations or follow-up items**: No mock server yet. Next: [Task 02](../02-mock-core/README.md).
