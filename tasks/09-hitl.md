---
id: "09"
title: Human-in-the-loop session handoff
status: todo
optional: false
---

# Task 09 — Same live session, human in control

A full co-browsing console is **out of scope** (assignment §3.6). The control-transfer model must be real: pause the same live session, give the human enough context, record what they did, resume. Mock the pretty UI.

## Files

- `src/escalate/control.ts` — `SessionControl`, `InterventionRequest`, `writeHumanLog`

## Session directory

`sessions/<id>/`

| File | Purpose |
|---|---|
| `control.json` | `{ session_id, owner: "agent"\|"human", reason, directory }` |
| `intervention.json` | redacted context: capability, step, location, observed text, screenshot path, why |
| `OPERATOR.txt` | human instructions, including the resume command |
| `RESUME` | created by `operator resume`; waiter polls for this file |
| `human_trace.zip` | adapter-specific trace of the human period (web driver starts Playwright tracing on pause) |
| `human_actions.json` | observation after resume |

## `SessionControl` API

- `create()` / `load(id)`
- `requestIntervention(req)` — set owner `human`, write intervention + OPERATOR.txt
- `waitForResume(timeoutMs, pollMs)` — poll `RESUME`; on success owner `agent`, return true
- `signalResume(note)` — write `RESUME`
- `persist()`

`OPERATOR.txt` must say: use the **already-open** window; do not start a new one; then `npm run cua -- operator resume --session <id>`.

`src/escalate/` is files + owner only. It must **not** import `playwright` or take `Page`.

## Integration with replay

When irreversible without `--confirm`, or checkpoint fail, or discovery `stuck`:

1. Screenshot `*_stuck.png`
2. `driver.pauseForHuman()` on the **current** `SurfaceDriver` (same live session)
3. `requestIntervention`
4. If `autoResume` (tests only), `signalResume` immediately
5. `waitForResume`
6. Timeout → `needs_intervention`, `control.owner = human`
7. Success → `driver.resume()`, `writeHumanLog`, owner `agent`

Do not construct a second browser for the human. The web adapter must not call `chromium.launch` / `browser.newPage()` on resume.

## Tests (this slice)

`tests/control.test.ts` — `os.tmpdir()`, no browser:

- `requestIntervention` → owner `human`, `intervention.json` + `OPERATOR.txt` exist
- delayed `signalResume` → `waitForResume` true → owner `agent`

`npm test` stays green.

## Acceptance

- [ ] `tests/control.test.ts` exists; `npm test` green
- [ ] Unit test: requestIntervention → owner human; delayed signalResume → waitForResume true → owner agent
- [ ] `src/escalate/` has no `playwright` import
- [ ] Adapter/integration test or demo: open_subaccount without confirm writes `intervention.json` and leaves the live session alive until timeout or resume
- [ ] Resume does not open a second browser/page for the operator

