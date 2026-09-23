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
- [ ] 05 surface-driver
- [ ] 05a llm-provider
- [ ] 06 discovery-loop
- [ ] 07 compile-artifact
- [ ] 08 deterministic-replay
- [ ] 09 hitl
- [ ] 10 cli
- [ ] 11 tests
- [ ] 12 evidence-report
- [ ] 13 overlay (optional)
- [ ] Feature-completeness table in ASSIGNMENT.md all “working or stubbed”
- [ ] Handoff summary written

## Files changed (program)

Maintain as slices land. Do not leave this table blank at close.

| File | Change type | Notes |
| ---- | ----------- | ----- |
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

Replay / discover output is still TBD until those slices.

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
