# Task: Computer-Use Automation Take-Home

**Source**: interface.ai Engineering — “Computer-Use Automation System” (PDF)  
**Date**: 2026-09-21  
**Status**: slices 01–12 done; Task 00 skipped; Task 13 overlay runtime optional / not started  
**Master tracking**: [tasks/2026-09-21-computer-use-takehome.md](tasks/2026-09-21-computer-use-takehome.md)  
**Slice specs**: [../tasks/README.md](../tasks/README.md)  
**Locked ADRs**: [tasks/adr/README.md](tasks/adr/README.md)

---
> Closing this assignment means the **demo thread is proven with artifacts on disk**, not that code exists.
> Discovery JSONL must come from a live model. Replay must run without a model key.
> `tsc --noEmit` is not validation. Pasted command output in the program tracking file is.
---

## Original Request

Build a small but real **computer-use** system for the long tail of bank/credit-union back-office apps that have **no API**. An LLM drives the UI the first time. The successful run becomes a typed, versioned, reviewable **capability**. Production invocation is **deterministic replay** (no model in the loop), with explicit handling of runtime business errors and a way to hand the **same live session** to a human when stuck.

Reviewers grade **judgment and integration**, not feature count. Time-box is a focused weekend, not a product.

## Restated Goal

Ship a public repo that a reviewer can clone and run:

1. Start a local hostile core (CoreLink mock).
2. Run `discover` on a natural-language goal against that live UI (real LLM).
3. Persist a capability JSON a calling agent could invoke.
4. `replay` that capability with params, **no LLM**, and get structured results.
5. On irreversible/stuck paths, pause the **same** live session (`SurfaceDriver.pauseForHuman`) for a human, then resume.
6. Check in evidence for discovery, happy replay, and one exceptional replay.
7. Write `REPORT.md` with the seven required headings.

### Success criteria (checkable)

| # | Criterion | How you prove it | Slice |
| - | --------- | ---------------- | ----- |
| 1 | Goal-driven loop actually clicks/types/reads a live UI | `evidence/discovery/` JSONL + screenshots from a live key | 06–07, 12 |
| 2 | Artifact is typed, versioned, parameterized (`$inputs.*`), not a chat dump | `capabilities/*.json` parses; no baked member id on fill steps | 03, 07 |
| 3 | Replay of member `12345` returns savings `4250.00` without calling a model | pasted CLI output in the program tracking file | 08, 10 |
| 4 | Replay of member `99999` is `business_outcome` / `MEMBER_NOT_FOUND`, not `failed` | pasted result JSON | 08 |
| 5 | Irreversible open-sub-account without `--confirm` does not click submit; session owner becomes `human` | intervention.json + result `needs_intervention` | 08–09 |
| 6 | Allowlist blocks off-origin navigation; logs redact account-like numbers | unit tests + sample redacted log | 04, 11 |
| 7 | `REPORT.md` has **exactly** the seven headings below, and heading 4 answers **both** §3.7 questions (surface seam + cross-tenant reuse/drift) | file on disk | 12 |
| 8 | Reviewer README has exact demo commands; secrets not in git | clone path | 12 |

A criterion is unmet if the program tracking file still says `TBD`.

## Feature completeness (assignment Section 3)

Every must-have must be **implemented and working**, or explicitly stubbed at a named seam and listed under Cuts.

| Requirement | Working means | Allowed stub |
| ----------- | ------------- | ------------ |
| 3.1 Agent loop | One live discover run completes the lookup goal | — |
| 3.2 Artifact | Schema 1.0 JSON with steps, locators, inputs, outputs, checkpoint | — |
| 3.3 Replay | LLM-free executor + taxonomy below | — |
| 3.4 Safety | Policy file + irreversible confirm/escalate + redaction | — |
| 3.5 Evidence | JSONL + screenshot on failure | — |
| 3.6 HITL | Same live session via `SurfaceDriver.pauseForHuman` / `resume`; `OPERATOR.txt` is the UI | Pretty operator console |
| 3.7 Heterogeneity / tenants | Schema has `vendor_product` + `surface_kind` + overlay; REPORT heading 4 answers both PDF questions | Desktop adapter; overlay *runtime* (Task 13) |

### Error taxonomy (do not conflate)

| Class | Terminal? | Example |
| ----- | --------- | ------- |
| `success` | yes | checkpoint passed, outputs filled |
| `business_outcome` | yes | `MEMBER_NOT_FOUND` |
| recoverable | **no** | dismiss `System Notice`, then continue (`recovered[]`) |
| `failed` | yes | hard error with step, expected, observed |
| `needs_intervention` | yes | irreversible without `--confirm`, or stuck |

## Assumptions (resolved)

| Question | Answer |
| -------- | ------ |
| Language? | TypeScript, Node 20+, Playwright, Zod |
| Target app? | Local CoreLink mock (not ParaBank, not public cart) |
| Locator strategy? | Accessibility role+name and table cells; screenshots are evidence |
| Architecture? | One CLI process + in-process mock. No queues. Core is surface-independent (`SurfaceDriver`); Playwright is the first adapter (ADR 09) |
| Hitl UI? | File + CLI resume on the live headed window |
| Stretch? | Overlay + canonicalization only (PDF §8). Catalog, codegen, approval, LLM-on-replay, multi-run stability → Cuts |
| Time-box? | Weekend; thin-but-real every must-have |

Do not re-open these unless you write a new ADR.

## Blast radius

**Wide** (greenfield). Touching: mock HTTP UI, schema, driver, LLM loop, replay, safety, HITL, CLI, tests, evidence, REPORT.

Implication: execute via numbered slices in `tasks/`. Do not implement the whole system in one untracked pass.

## Implementation plan (slices)

| Phase | Tasks | Outcome |
| ----- | ----- | ------- |
| Recon | 00 | Vocabulary; you can restate this file |
| Scaffold | 01 | `npm run cua -- help` |
| Surface | 02, 05 | Mock + driver extract `4250.00` |
| Contract | 03, 04 | Schema + allowlist |
| Discover | 05a, 06, 07 | LLM port + live loop + compiler |
| Produce | 08, 09, 10 | Replay, HITL, CLI |
| Prove | 11, 12 | Tests, evidence, REPORT, README demo |
| Stretch | 13 | Overlay (optional) |

## Phase checkpoints (program-level)

| Phase | Status | Evidence |
| ----- | ------ | -------- |
| Recon | Done | This file + ADR + task specs |
| Implementation | Done | `src/` + slices 01–11 `done` |
| Runtime verification | Done | pasted replay + `/health` in the program tracking file |
| Browser verification | Done | mock frameset + same-session HITL (`evidence/escalate`) |
| Documentation and closure | Done | README + REPORT + evidence; public remote exists |

Update [the master tracking file](tasks/2026-09-21-computer-use-takehome.md) when a slice closes. Stale `Not started` here while `src/` exists is a closure blocker.

## Progress checklist (program)

- [ ] Task 00–12 spec `status: done` (13 optional) — 00 still skipped; 01–12 done
- [x] Master tracking Validation Run has **pasted** discover + replay output
- [x] `evidence/discovery` is a live model run
- [x] `evidence/replay_success` and `evidence/replay_not_found` exist
- [x] `evidence/escalate` shows same-session intervention
- [x] `REPORT.md` seven headings verbatim
- [x] Root README demo commands work without a model key (except discover)
- [x] Tracked files have no live API key prefixes
- [x] Handoff summary on the master tracking file is written
- [x] Public GitHub URL ready to email to assignments@interface.ai

## Validation floor (what “done” looks like in a terminal)

Required commands (exact names may match CLI task; output must be pasted into the program tracking file, not summarized as “it worked”):

```text
npm install
npx playwright install chromium
npm run cua -- serve          # or auto-start
npm run cua -- replay capabilities/lookup_savings.json --input member_id=12345
npm run cua -- replay capabilities/lookup_savings.json --input member_id=99999
npm run cua -- replay capabilities/open_subaccount.json --input member_id=12345 --input amount=25.00
npm test
```

Discover (requires `YOUR_API_KEY` in `.env`, never committed):

```text
npm run cua -- discover --goal "look up member 12345 and read their current savings balance" --input member_id=12345
```

**Not validation:** `tsc --noEmit` alone, empty `evidence/`, hand-written discovery thoughts, a new browser for the “human.”

## Documentation written (deliverables)

| Document | Path | Required content |
| -------- | ---- | ---------------- |
| Setup + demo | `/README.md` | install, env, exact commands |
| Design write-up | `/REPORT.md` | seven headings, in order, ~1–3 pages |
| Evidence index | `/evidence/README.md` | what each folder is |
| This assignment | `/docs/ASSIGNMENT.md` | this file |

### REPORT.md headings (verbatim — do not rename)

1. Architecture
2. Artifact schema
3. Determinism & error handling
4. Heterogeneity & multi-tenant

Heading 4 body (not the title) must answer both §3.7 questions: surface seam, and tenant reuse/drift including label/emoji overlay.
5. Escalation & handoff
6. Safety
7. Cuts

## How they grade (PDF §7, this order)

1. System design (schema + replay contract + seams)
2. Correctness of the core loop (one real discover + deterministic replay)
3. Robustness & error handling (taxonomy, locators, waits, checkpoints)
4. HITL (same live session, not a TODO)
5. Generalization (heterogeneous surfaces + tenant reuse — design must be real)
6. Safety & data handling
7. Code quality
8. Communication (REPORT)

They do not reward queues, clusters, or a polished subset of Section 3.

## What they will not reward

Queues, clusters, multi-tenant plumbing, framework name-dropping, a polished subset of Section 3. A thin working thread through every must-have beats a beautiful discovery-only demo.

## Open issues / blockers

- Task 00 orientation was skipped. Task 13 overlay runtime is optional and not started. Live discover still needs a local `.env` key (placeholders only in `.env.example`).

## Submission

Public GitHub repo: https://github.com/nickbar06/computer-use-automation  
Email the URL on its own line to assignments@interface.ai from the address used to apply. No zip.

## Handoff summary (fill at program close)

**What was done**: Weekend slice — local CoreLink mock, `SurfaceDriver` + `LlmProvider` ports, live discover, typed capabilities, LLM-free replay, same-session HITL, tests, evidence, REPORT.

**How to verify**: `npm install && npx playwright install chromium && npm test`, then the three README replay commands (no key). Discover needs `.env`.

**Key decisions**: see ADR + [DECISIONS.md](DECISIONS.md)

**Known limitations**: no desktop adapter; operator UI is `OPERATOR.txt`; Task 13 (Northlake/Lakecrest live overlay proof) not done; screenshots are not redacted.
