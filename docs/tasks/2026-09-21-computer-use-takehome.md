# Task: Computer-use take-home (program)

**Date**: 2026-09-21
**Status**: in_progress
**Spec**: [docs/ASSIGNMENT.md](../ASSIGNMENT.md)

---
> Parent tracking file for the whole assignment. Paste slice-level command output here.
> Do not mark this Complete while any Section 3 must-have is unimplemented or stubbed without a Cuts note.
> `TBD` below means the program is not closed.
---

## Original Request

See [ASSIGNMENT.md](../ASSIGNMENT.md) — Original Request.

## Restated Goal

A clone-and-run vertical slice: discover (LLM) → capability JSON → deterministic replay → HITL on the same session → evidence + REPORT.

## Selected skills / docs read

| Doc | Read? | Decision it drove |
| --- | ----- | ----------------- |
| Assignment PDF / ASSIGNMENT.md | [x] | Must-haves and REPORT headings |
| DECISIONS.md + [adr/](adr/README.md) | [x] | One ADR per locked choice |
| AGENTS.md | [x] | One slice at a time; pasted validation |

## Assumptions and open questions

Resolved in ASSIGNMENT.md. New questions go here.

| Question | Answer |
| -------- | ------ |
| | |

## Implementation plan

Execute [../tasks/README.md](../../tasks/README.md) in order (00→12, 13 optional).

## Phase checkpoints

| Phase | Status | What was completed | Evidence still missing |
| ----- | ------ | ------------------ | ---------------------- |
| Recon | Done | Harness, slices, ADR | — |
| Implementation | Not started | | `src/` |
| Runtime verification | Not started | | pasted replay output |
| Browser verification | Not started | | mock + HITL |
| Documentation and closure | Not started | | REPORT, evidence, public remote |

## Progress checklist

Copy from ASSIGNMENT.md program checklist. Tick only when the slice spec Acceptance items are checked and command output is pasted below.

- [ ] 00 orientation
- [x] 01 scaffold
- [x] 02 mock-core
- [x] 03 artifact-schema
- [x] 04 safety
- [x] 05 surface-driver
- [x] 05a llm-provider
- [x] 06 discovery-loop
- [x] 07 compile-artifact
- [x] 08 deterministic-replay
- [x] 09 hitl
- [x] 10 cli
- [ ] 11 tests
- [ ] 12 evidence-report
- [ ] 13 overlay (optional)
- [ ] Feature-completeness table in ASSIGNMENT.md all “working or stubbed”
- [ ] Handoff summary written

## Files changed (program)

Maintain as slices land. Do not leave this table blank at close.

| File | Change type | Notes |
| ---- | ----------- | ----- |
| `src/cli.ts` | updated | `--out`, `--overlay`, redacted RunResult, help ≡ README |
| `tests/cli.test.ts` | added | help verbatim in README; overlay; missing session |
| `src/escalate/control.ts` | added | file-based SessionControl; no Playwright |
| `src/replay/executor.ts` | updated | irreversible/checkpoint → pauseForHuman + waitForResume |
| `src/cli.ts` | updated | `operator resume\|status`, `--auto-resume`, `--operator-timeout` |
| `tests/control.test.ts` | added | owner flip + fake-driver HITL |
| `src/replay/executor.ts` | added | LLM-free replay + handler taxonomy |
| `src/artifact/compile.ts` | added | transcript → capability (`$inputs.member_id`) |
| `src/agent/loop.ts` | added | `DiscoveryRunner` (SurfaceDriver + LlmProvider) |
| `evidence/discovery/` | added | live lookup JSONL + screenshots |
| `src/domain/llm.ts` | added | `LlmProvider` port (no vendor SDK) |
| `src/llm/openai/provider.ts` | added | official `openai` adapter |
| `src/llm/anthropic/provider.ts` | added | official Anthropic adapter |
| `src/agent/nextAction.ts` | added | `LlmResponse` → `act` payload |
| `src/domain/surface.ts` | added | `SurfaceDriver` port (no Playwright) |
| `src/surface/playwright/driver.ts` | added | Playwright adapter |
| `src/agent/actionFromLlm.ts` | added | `act` payload → `CanonicalAction` |
| `scripts/driver-smoke.ts` | added | live extract `4250.00` |
| `policies/default.json` | added | localhost:8765 allowlist + irreversible names |
| `src/safety/policy.ts` | added | `checkNavigation` / `checkAction` / `isIrreversibleName` |
| `src/safety/redact.ts` | added | account / SSN / secret redaction |
| `tests/safety.test.ts` | added | allowlist, irreversible, redaction |
| `docs/tasks/adr/09-surface-independent-core.md` | added | Core is WHAT; Playwright is HOW |
| `docs/tasks/adr/10-capability-vendor-tenant-surface.md` | added | Capability / vendor / tenant / surface |
| `docs/ARCHITECTURE.md` | updated | Import graph + `SurfaceDriver` port |
| `.cursor/rules/surface-boundary.mdc` | added | Agents must not leak `Page` into core |

## Validation run

**Commands run**:

```text
npx tsc --noEmit
npm test
```

**Output** (Task 04):

```text
> computer-use-automation@0.1.0 test
> tsx --test tests/*.test.ts

✔ GET /health is ok (13.944625ms)
✔ POST lookup 12345 shows snapshot and savings (5.334167ms)
✔ POST lookup 99999 is no matching member (4.273208ms)
✔ POST lookup 67890 is access denied (4.209125ms)
✔ GET /?tenant=northlake includes Search Member (1.022625ms)
✔ GET /?tenant=lakecrest includes emoji search (2.061625ms)
✔ GET /?fault=dialog shows System Notice (0.876709ms)
✔ loadPolicy reads policies/default.json from ROOT (1.354291ms)
✔ navigation to https://evil.example/ throws (0.531417ms)
✔ click is allowed and download is not (0.16275ms)
✔ Open Sub-Account is irreversible, Find Member is not (0.118292ms)
✔ sample string with account + SSN + password is redacted (0.248875ms)
✔ redactJson replaces sensitive keys (0.083334ms)
✔ dumpsRedacted writes a redacted file (1.057541ms)
✔ src/safety does not import playwright (0.151958ms)
✔ parses shipped lookup and open_subaccount capabilities (1.653667ms)
✔ applyOverlay northlake and lakecrest do not mutate the base (0.427917ms)
✔ canonicalizeUrl parameterizes member path (0.125041ms)
✔ reviewSummary names vendor product and surface (0.296084ms)
✔ artifact sources do not import playwright (0.129333ms)
✔ ROOT exists (0.389625ms)
ℹ tests 21
ℹ pass 21
ℹ fail 0
ℹ duration_ms 123.27325
```

**Output** (Task 05 driver smoke):

```text
npx tsx scripts/driver-smoke.ts
observe_ms=40.8
location=http://127.0.0.1:55700/
workspace=http://127.0.0.1:55700/lookup
member_id_visible=true
after_find=http://127.0.0.1:55700/
savings=4250.00
evil=SafetyError origin not allowed: https://evil.example
after_evil=http://127.0.0.1:55700/
stayed_off_evil=true
```

**Output** (Task 05a, no live HTTP):

```text
✔ FakeLlmProvider nextAction parses thought and action
✔ resolveLlmProvider with empty env throws the missing-key message
✔ resolveLlmProvider picks openai or anthropic from env without calling a host
✔ src/agent and src/domain do not import vendor LLM SDKs
ℹ tests 28
ℹ pass 28
ℹ fail 0
```

**Output** (Task 06 live discover):

```text
npm run cua -- discover --goal "Look up the savings balance for the member in inputs" --input member_id=12345 --evidence evidence/discovery
stop=done
steps=5
outputs.savings_balance=4250.00
evidence=.../evidence/discovery
```

JSONL (redacted thoughts; no API keys): fill Member ID → click Find Member → extract Savings/Balance `4250.00` → done `Member Snapshot`.

**Output** (Task 07 compile):

```text
id: discovered
vendor_product: corelink.servicing
surface_kind: legacy_web
inputs: member_id
outputs: savings_balance
steps: 5
irreversible_steps: (none)
```

Fill step uses `$inputs.member_id` (no baked member id). Written to `evidence/discovery/artifact.json`.

**Output** (Task 08 live replay):

```text
replay lookup 12345 → status=success outputs.savings_balance=4250.00
replay lookup 99999 → status=business_outcome outcome_code=MEMBER_NOT_FOUND
replay open_subaccount (no --confirm) → status=needs_intervention step_id=s04_open
replay open_subaccount --confirm → status=success
```

Four Playwright replays finished in ~4.5s total.

**Output** (Task 09 HITL):

```text
npm test
ℹ tests 42
ℹ pass 42
ℹ fail 0

npm run cua -- replay capabilities/open_subaccount.json --input member_id=12345 --input amount=25.00 --evidence evidence/escalate
{
  "status": "needs_intervention",
  "step_id": "s04_open",
  "control": { "owner": "human", "session_id": "24d4deed" }
}
HITL: npm run cua -- operator resume --session 24d4deed

npm run cua -- operator status --session 24d4deed
{
  "session_id": "24d4deed",
  "owner": "human",
  "reason": "irreversible step s04_open requires --confirm or a human",
  "directory": ".../sessions/24d4deed"
}
```

`sessions/24d4deed/` has `control.json`, `intervention.json`, `OPERATOR.txt` (already-open window + resume command). `evidence/escalate/s04_open_stuck.png` exists. Replay did not POST `/open` (no `--confirm`). Resume path does not call `chromium.launch` / `newPage`. Default `--operator-timeout` is 0 so CLI does not hang; use `--operator-timeout 180` for a live headed handoff.

**Output** (Task 10 CLI):

```text
npm test
ℹ tests 45
ℹ pass 45
ℹ fail 0

npm run cua -- help
# matches README command block (serve / discover / replay / operator)

npm run cua -- operator resume --session does-not-exist
session not found: does-not-exist
# exit 1

curl http://127.0.0.1:8765/health
{"ok":true}

npm run cua -- serve --port 8766
CoreLink mock listening on http://127.0.0.1:8766
curl http://127.0.0.1:8766/health
{"ok":true}

npm run cua -- replay capabilities/lookup_savings.json --input member_id=12345
status=success outputs.savings_balance=4250.00

npm run cua -- replay capabilities/lookup_savings.json --input member_id=99999
status=business_outcome outcome_code=MEMBER_NOT_FOUND
```

Paste discover, replay success, replay not-found, and escalate (or point at `evidence/*` **and** quote `result.json` status fields).

## Documentation written

| Document | Path | What changed |
| -------- | ---- | ------------ |
| Assignment (harness form) | `docs/ASSIGNMENT.md` | This restatement |
| | | |

## Open issues / blockers

- Discovery evidence needs `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in local `.env` (placeholders only in `.env.example`).

## Handoff summary

**What was done**: TBD

**How to verify it works**: TBD

**Key decisions made**: TypeScript/Playwright/Zod, local CoreLink, a11y locators — see ADR.

**Known limitations or follow-up items**: TBD
