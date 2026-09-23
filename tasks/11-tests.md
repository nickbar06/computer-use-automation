---
id: "11"
title: Tests
status: todo
optional: false
---

# Task 11 — Playwright regression + the suite still passes

Earlier slices already added `smoke`, `mock`, `schema`, `safety`, `handlers`, and `control` tests. **Do not rewrite or delete them.** This task adds the live adapter pass and proves the whole suite is still green.

## Files

- keep `tests/smoke.test.ts`, `mock.test.ts`, `schema.test.ts`, `safety.test.ts`, `llm.test.ts`, `handlers.test.ts`, `control.test.ts`
- add `tests/replay.test.ts` — Playwright + `listenMock(0)` only

## `tests/replay.test.ts` (Playwright adapter, headless)

- Construct `PlaywrightDriver`; executor still takes `SurfaceDriver`
- `listenMock(0)`, push that origin onto `policy.allowed_origins`, rewrite artifact `entry_url` and navigate step to the ephemeral origin
- member 12345 → success + `4250.00`
- member 99999 → `business_outcome` / `MEMBER_NOT_FOUND`
- open_subaccount without confirm, `operatorTimeoutMs` ~400 → `needs_intervention` matching irreversible

Happy-path replay must finish in **seconds**. If a test exceeds ~30s, the frameset observe bug is back — fail the task, do not raise the timeout.

## Acceptance

- [ ] `npm test` all pass (prior slice tests + `replay.test.ts`)
- [ ] `npx tsc --noEmit` clean


## Mark done

Set `status: done` in frontmatter and check this task in [tasks/README.md](README.md).
