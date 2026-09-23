---
id: "06"
title: Discovery agent loop
status: done
completed: 2026-09-23
optional: false
---

# Task 06 — Observe → decide → act

Your first agent. One tool, one loop, max steps. Assignment §3.1: accept a **goal + target** (entry location), run observe → decide → act on a live UI until `done`, `stuck`, max steps, or timeout.

## Files

- `src/agent/prompt.ts` — `SYSTEM_PROMPT`, `userTurn(...)`
- `src/agent/loop.ts` — `DiscoveryRunner`

`DiscoveryRunner` takes `SurfaceDriver` **and** `LlmProvider` (Task 05a), plus policy, goal, inputs. It must **not** take `Page`, import `playwright`, or import `openai`. The CLI constructs `PlaywrightDriver` and `resolveLlmProvider()` and passes both ports.

`nextAction` lives in `src/agent/nextAction.ts` (Task 05a). This task only **uses** it.

## Tool `act`

Required: `thought`, `action`.

`action` enum: `click | fill | press | extract | select | wait | dismiss | done | stuck`

Optional: `role`, `name`, `text`, `key`, `extract_to`, `row_header`, `column_header`, `risk` (`safe|irreversible`), `reason`.

`tool_choice` forced to this function. `temperature: 0`.

## Loop

1. `checkNavigation(target)` then `driver.act({ type: "navigate", location: target })`
2. For `step = 1..maxSteps` (default 20):
   - `observe` + screenshot `evidence/step-NN.png`
   - Redact snapshot/visible text before sending to the model
   - Append user turn: goal, inputs, step count, observation
   - `llm.nextAction`
   - Append JSONL log (redacted) — thought + action so evidence shows *why* (assignment §3.5)
   - `done` → break
   - `stuck` → write an intervention via Task 09 types if they exist, else throw with a clear message (HITL wiring completes in 09)
   - If `risk` or `isIrreversibleName(name)` → tag irreversible
   - `extract` uses `driver.extract`; other actions use `actionFromLlm` → `CanonicalAction` → `driver.act`
3. Return the list of turns for Task 07 (or call compile if 07 is already done)

## Prompt rules (must say)

- Prefer role + accessible name; never invent CSS ids
- Balances: table cell Savings / Balance
- Fill member ID from **inputs**, not from memory
- `done.text` is a visible checkpoint phrase
- Money-moving is irreversible
- Stay on allowlisted origin

## Acceptance

- [x] `src/agent/` has no `playwright` import; constructor is `SurfaceDriver`, not `Page`
- [x] `src/agent/` has no `openai` import; loop calls `LlmProvider.complete`, not `OpenAI`
- [x] Without API keys, `resolveLlmProvider()` / `nextAction` throws a clear “set OPENAI_API_KEY or ANTHROPIC_API_KEY”
- [x] With a key, one run of the lookup goal against the mock reaches `done` or you document the exact failure in the task file as `blocked`
- [x] JSONL thoughts do not contain raw `password=` values (redaction ran)
- [x] `npm test` still green

