---
id: "08"
title: Deterministic replay
status: todo
optional: false
---

# Task 08 — LLM-free replay

This is the production path (assignment §3.3). No `fetch` to a model. Interesting failures are **runtime business states**, not layout drift. UI drift (renamed/emoji button) is overlay + checkpoint — secondary; do not add an LLM fallback here.

## Files

- `src/replay/executor.ts` — `ReplayExecutor`, `bindInputs`, `resolveValue`

`ReplayExecutor` takes `SurfaceDriver` (and the artifact, policy, confirm flag). It must **not** take `Page` or import `playwright`.

```ts
// Bad
function replay(page: Page, artifact: CapabilityArtifact): Promise<RunResult>

// Good
function replay(driver: SurfaceDriver, artifact: CapabilityArtifact): Promise<RunResult>
```

## Algorithm

1. `bindInputs` — throw if a required contract input is missing
2. `checkNavigation(artifact.app.entry_url)` — string location, not a Playwright URL
3. `driver.observe` (start screenshot)
4. For each step:
   a. Run **handlers** against current `visible_text` (see below)
   b. If `step.risk === irreversible` and `confirmIrreversible` is false → escalate (Task 09; until then return `needs_intervention`)
   c. Execute step (`navigate` binds URL templates with `bindUrlTemplate`)
   d. On throw: re-observe, run handlers (so not-found after a failed extract still counts), else `failed` with step id, expected, observed, and a **failure screenshot** (assignment §3.5)
   e. If `step.expected` condition fails → `failed` + screenshot
5. After steps, handlers again, then **all checkpoints** must match or escalate/fail
6. Write `evidence/result.json` redacted + a jsonl of steps (what ran, not model thoughts)

## Handlers (order)

For each handler whose `when` matches:

- `recoverable` — execute `recover_step` if any, push `code` onto `recovered`, **re-observe**, continue handler scan
- `business_outcome` — return `{ status: "business_outcome", outcome_code }` immediately
- `hard_failure` — return `{ status: "failed", error: message }`

Conditions: `text_present` / `text_absent` substring on `visible_text`; `url_matches` substring on `observation.location` (the web adapter fills this with the page URL string).

## `resolveValue`

- `input_from` must start with `$inputs.`
- else use `step.value`

## Tests (this slice)

`tests/handlers.test.ts` — in-memory fake `SurfaceDriver` (no Playwright, no `src/replay` import of `playwright`):

- visible text `No matching member` → `status: business_outcome`, `MEMBER_NOT_FOUND`
- visible text `System Notice` + recover click → code in `recovered[]`, run continues
- missing required input → throw before `act`

Live Playwright replay against the mock can wait for Task 11; **do** still run the happy/not-found paths once for this task’s Validation Run (script or headed).

`npm test` stays green including this file.

## Acceptance (with mock + driver)

- [ ] `tests/handlers.test.ts` exists; `npm test` green
- [ ] `src/replay/` has no `playwright` import; executor is `SurfaceDriver`, not `Page`
- [ ] Replay lookup `member_id=12345` → `status: success`, `outputs.savings_balance === "4250.00"`
- [ ] Replay lookup `member_id=99999` → `status: business_outcome`, `outcome_code === "MEMBER_NOT_FOUND"` (not `failed`)
- [ ] Replay open_subaccount without confirm → does **not** click Open Sub-Account; result is `needs_intervention` (or HITL if 09 is done)
- [ ] Replay with confirm completes to `Sub-account opened`
- [ ] Each run writes jsonl + screenshots under the evidence dir; a `failed` / `hard_failure` run includes a failure screenshot
- [ ] A single replay of the happy path finishes in seconds, not minutes (frameset observe bug is fixed)

