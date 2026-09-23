# Agent operating model

Portable rules for any coding agent in this repo. Adapted from a disciplined task-tracking harness: inspect, plan, track in markdown, validate with real output, hand off honestly.

## Task loop

1. **One task at a time.** Open [tasks/README.md](tasks/README.md). Implement the first folder whose spec frontmatter `status` is `todo`, or the folder the user named. The parent assignment (what “done” means for the whole take-home) is [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md); program-level pasted evidence goes in [docs/tasks/2026-09-21-computer-use-takehome.md](docs/tasks/2026-09-21-computer-use-takehome.md).
2. **Read the spec and the lesson** in that folder (`README.md`, `LESSON.md`) before coding.
3. **Track in `TRACKING.md`.** Copy structure from [docs/ai-harness/templates/task-tracking.md](docs/ai-harness/templates/task-tracking.md) if the file is still a stub. This file is working memory across compaction. Reopen it after each phase.
4. **Clarify before wide work.** If the change is ambiguous, ask. Do not invent product scope. Locked decisions: [docs/DECISIONS.md](docs/DECISIONS.md) and [docs/tasks/adr/README.md](docs/tasks/adr/README.md).
5. **Plan before coding** when more than two files change. Write the plan in `TRACKING.md`.
6. **Keep modules honest.** Frontend/app files compose; drivers, schema, replay, and the mock stay in their packages. If a file exceeds ~400 lines, split or justify in the tracking file. **Playwright stays in `src/surface/playwright/`.** Discovery, replay, artifact, policy, and result modules take `SurfaceDriver` / domain types — never `Page` or `Locator`. **Vendor LLM SDKs stay in `src/llm/<vendor>/`.** Discovery takes `LlmProvider`, never `OpenAI`. Replay takes no LLM. See [ADR 09](docs/tasks/adr/09-surface-independent-core.md), [ADR 11](docs/tasks/adr/11-llm-provider-port.md), and [ARCHITECTURE.md](docs/ARCHITECTURE.md).
7. **Validate with behavior.** `tsc --noEmit` is not enough. Start the mock, hit `/health`, run a replay, or run tests. From Task 01 on, **`npm test` must stay green** — add that slice’s tests in the same change (see [tasks/README.md](tasks/README.md)). Paste **actual terminal output** into Validation Run. `TBD` means the task is not done.
8. **Update docs in the same change** if setup, architecture, or CLI commands changed.
9. **Record blockers.** Missing API key for discovery → `blocked`, not fake JSONL.
10. **Handoff before closing.** Fill Handoff Summary. Then set spec `status: done` and tick [tasks/README.md](tasks/README.md). Stop unless the user asked for the next task.

Do not start Task 13 before Task 12 is `done`.

## After compaction

Re-read the current folder’s `TRACKING.md`. Blank tables, `TBD`, `Not started`, and unchecked spec Acceptance items are unfinished work. Compaction does not complete them.

## Validation floor

| Work | Minimum evidence |
| ---- | ---------------- |
| Mock core | `curl` `/health` plus one lookup POST/GET in the tracking file |
| Schema | `tests/schema.test.ts` pasted `npm test` output |
| Driver / replay | real Playwright run, result contract printed; Task 08 also has fake-driver handler tests |
| Each slice 01+ | `npm test` still green after that slice’s new tests |
| CLI | exact commands from the spec, pasted output |
| Discovery | live model JSONL in `evidence/discovery/` — no invented turns |

Never claim tests passed that were not run. Never commit `.env`, keys, or raw PII.

## Secrets

`.env.example` uses placeholders only. Redact logs. Task files go in git — no API keys in Validation Run output.

## New architecture choices

If you need a decision that is not in DECISIONS.md, add an ADR under `docs/tasks/adr/` from [docs/ai-harness/templates/architecture-decision.md](docs/ai-harness/templates/architecture-decision.md).
