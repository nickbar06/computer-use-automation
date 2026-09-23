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
- [ ] 04 safety
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
| `docs/tasks/adr/09-surface-independent-core.md` | added | Core is WHAT; Playwright is HOW |
| `docs/tasks/adr/10-capability-vendor-tenant-surface.md` | added | Capability / vendor / tenant / surface |
| `docs/ARCHITECTURE.md` | updated | Import graph + `SurfaceDriver` port |
| `.cursor/rules/surface-boundary.mdc` | added | Agents must not leak `Page` into core |

## Validation run

**Commands run**:

```text
TBD
```

**Output**:

```text
TBD
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
