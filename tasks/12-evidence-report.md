---
id: "12"
title: Evidence and REPORT.md
status: done
completed: 2026-09-23
optional: false
---

# Task 12 — Ship the slice the way they asked

Reviewers read many repos side by side. Use their paths. You must be able to **defend every decision** in an interview (PDF §9).

## Files

- `README.md` — setup, keys, **exact demo commands** (serve is optional if discover/replay auto-start the mock)
- `REPORT.md` — **only** these seven headings, in this order, ~1–3 pages
- `evidence/README.md` — what each subfolder is
- `evidence/discovery/` — **real** LLM run: `discovery.jsonl`, screenshots, `artifact.json`
- `evidence/replay_success/` — replay 12345 logs + `result.json`
- `evidence/replay_not_found/` — replay 99999, `outcome_code` MEMBER_NOT_FOUND
- `evidence/escalate/` — irreversible without confirm, intervention payload

Optional: `scripts/record-evidence.ts` to regenerate replay folders without a key.

## REPORT — what each heading must argue

Write to the PDF questions, not a feature list.

1. **Architecture** — CLI composition root; `SurfaceDriver` port vs Playwright adapter; why one process. Trade-off: desktop unimplemented, seam is real.
2. **Artifact schema** — capability contract for a calling agent; `$inputs`; why locators are named strategies with fallbacks; why CoreLink is `vendor_product`, not a driver.
3. **Determinism & error handling** — no LLM on replay; taxonomy (`success` / `business_outcome` / recoverable `recovered[]` / `failed` / `needs_intervention`). Primary failures are runtime states (not-found, deny, dialog, session). UI drift is secondary (overlay / checkpoint / HITL).
4. **Heterogeneity & multi-tenant** — answer **both** §3.7 questions:
   - *Surface seam:* recorded flow (`CanonicalAction`, `NamedLocator`) vs perceive/act (`SurfaceDriver`). `legacy_web` (this mock) and `web` share Playwright. `desktop` would implement the same port (OS a11y), not a new artifact schema.
   - *Reuse / drift:* artifacts key on vendor product. Overlay patches locator **names** (`Find Member` → `Search Member` or `🔍 Search`). Unknown drift fails a locator/checkpoint and HITL — never a silent wrong click. No tenant database.
5. **Escalation & handoff** — stuck / irreversible / checkpoint fail → `pauseForHuman` on the **same** session; `OPERATOR.txt`; `RESUME`; human actions recorded.
6. **Safety** — origin/action allowlist; irreversible needs `--confirm` or HITL; redaction limits (what still leaks).
7. **Cuts** — desktop adapter, operator console, queues, capability catalog, codegen, approval state, LLM recovery on replay, multi-run stability. Next: Task 13 overlay runtime if skipped.

Do not paste the assignment PDF. Do not claim you built queues.

## Interview talking points (must be true of the repo)

- Why a11y role+name, not CSS or click coordinates
- Why replay has no model
- Why `MEMBER_NOT_FOUND` is not `failed`
- Why HITL is the same window
- Why we did not record one artifact per bank
- Why `replay(page: Page)` would fail heading 4

## Acceptance

- [x] A teammate can clone, `npm install`, `npx playwright install chromium`, run the three replay commands without a model key
- [x] README shows discover-then-replay **and** replay of shipped `capabilities/*.json`
- [x] `evidence/discovery` exists from a live model run (this task is `blocked` until a key is used — do not fake the jsonl)
- [x] REPORT headings are exactly the seven names above
- [x] Heading 4 answers both §3.7 questions in prose
- [x] Secrets are not in git (no live API key prefixes in tracked files)
- [x] `npm test` still green (Task 11 suite)

