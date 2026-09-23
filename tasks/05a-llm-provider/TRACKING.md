# Task: LLM provider port

**Date**: 2026-09-23
**Status**: todo
**Spec**: `tasks/05a-llm-provider/README.md`

---
> Validation Run must contain actual command output before status can be `done`.
---

## Original Request

Implement [README.md](README.md) in this folder.

## Restated Goal

Domain `LlmProvider` plus an OpenAI SDK adapter and an Anthropic adapter. Discovery takes the port. Replay never does.

### Success criteria

`tests/llm.test.ts` passes with a fake; `resolveLlmProvider()` throws without keys; `src/agent` does not import `openai`.

## Assumptions and Open Questions

| Question | Answer |
| -------- | ------ |
| ChatGPT SDK? | Official `openai` npm package, not Operator/CUA |

## Implementation Plan

1. Read [README.md](README.md) and [LESSON.md](LESSON.md)
2. Implement the listed files
3. Record validation output below

## Phase Checkpoints

| Phase | Status | What was completed | Evidence still missing |
| ----- | ------ | ------------------ | ---------------------- |
| Recon | Not started | | |
| Implementation | Not started | | |
| Runtime verification | Not started | | |
| Documentation and closure | Not started | | |

## Progress Checklist

- [ ] Spec README read
- [ ] Lesson questions answered
- [ ] Implementation complete
- [ ] Spec Acceptance checkboxes ticked
- [ ] Runtime verification recorded (real output)
- [ ] Handoff summary written
- [ ] Spec `status: done` + index checkbox in `tasks/README.md`

## Files Changed

| File | Change type | Notes |
| ---- | ----------- | ----- |
| | | |

## Validation Run

**Commands run**:

```text
TBD
```

**Output**:

```text
TBD
```

## Open Issues / Blockers

None

## Handoff Summary

**What was done**: TBD

**How to verify it works**: TBD

**Key decisions made**: TBD

**Known limitations or follow-up items**: TBD
