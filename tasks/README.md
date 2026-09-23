# Tasks

Each task is its **own folder**. Open one folder at a time.

**Full system (implement one slice):** capability → vendor product (`corelink.servicing`) → tenant overlay (labels / emoji) → surface adapter (Playwright today). See [ADR 10](../docs/tasks/adr/10-capability-vendor-tenant-surface.md). Do not add a CoreLink driver or a tenant platform.

| File | Role |
| --- | --- |
| `README.md` | Spec (what to build). Frontmatter `status` is the source of truth. |
| `LESSON.md` | Reading and “check you understand” |
| `TRACKING.md` | Execution record (plan, files changed, **real** validation output, handoff). Template: [docs/ai-harness/templates/task-tracking.md](../docs/ai-harness/templates/task-tracking.md) |

## How to mark done

1. Tick every **Acceptance** box in that folder’s spec `README.md`.
2. Fill `TRACKING.md`: Validation Run has pasted output (not `TBD`); Handoff Summary is real sentences.
3. Set spec frontmatter `status: done` and `completed: YYYY-MM-DD`.
4. Check the box in the index below.

`status` values: `todo` · `in_progress` · `blocked` · `done`

Work in order. Do not start Task 13 before Task 12 is `done`.

## Tests grow with slices

Each implementation slice **adds** its tests and must leave `npm test` green. Do not wait for Task 11. Do not delete earlier files.

| Slice | Adds | Kind |
| ----- | ---- | ---- |
| 01 | `tests/smoke.test.ts` | `ROOT` exists |
| 02 | `tests/mock.test.ts` | `listenMock(0)` health + lookup 12345 / 99999 |
| 03 | `tests/schema.test.ts` | parse, overlay, canonicalize |
| 04 | `tests/safety.test.ts` | allowlist, irreversible, redaction |
| 05a | `tests/llm.test.ts` | fake `LlmProvider`; resolve throws without keys |
| 07 | extend `schema.test.ts` | compile fake transcript → `$inputs.member_id` |
| 08 | `tests/handlers.test.ts` | fake `SurfaceDriver`; taxonomy |
| 09 | `tests/control.test.ts` | owner flip, no browser |
| 11 | `tests/replay.test.ts` | Playwright + mock; **all prior tests still pass** |
| 13 | `tests/overlay.test.ts` | Northlake / Lakecrest skins (optional) |

## Index

- [ ] [00-orientation](00-orientation/README.md) · [lesson](00-orientation/LESSON.md) · [tracking](00-orientation/TRACKING.md)
- [x] [01-scaffold](01-scaffold/README.md) · [lesson](01-scaffold/LESSON.md) · [tracking](01-scaffold/TRACKING.md)
- [x] [02-mock-core](02-mock-core/README.md) · [lesson](02-mock-core/LESSON.md) · [tracking](02-mock-core/TRACKING.md)
- [ ] [03-artifact-schema](03-artifact-schema/README.md) · [lesson](03-artifact-schema/LESSON.md) · [tracking](03-artifact-schema/TRACKING.md)
- [ ] [04-safety](04-safety/README.md) · [lesson](04-safety/LESSON.md) · [tracking](04-safety/TRACKING.md)
- [ ] [05-surface-driver](05-surface-driver/README.md) · [lesson](05-surface-driver/LESSON.md) · [tracking](05-surface-driver/TRACKING.md)
- [ ] [05a-llm-provider](05a-llm-provider/README.md) · [lesson](05a-llm-provider/LESSON.md) · [tracking](05a-llm-provider/TRACKING.md)
- [ ] [06-discovery-loop](06-discovery-loop/README.md) · [lesson](06-discovery-loop/LESSON.md) · [tracking](06-discovery-loop/TRACKING.md)
- [ ] [07-compile-artifact](07-compile-artifact/README.md) · [lesson](07-compile-artifact/LESSON.md) · [tracking](07-compile-artifact/TRACKING.md)
- [ ] [08-deterministic-replay](08-deterministic-replay/README.md) · [lesson](08-deterministic-replay/LESSON.md) · [tracking](08-deterministic-replay/TRACKING.md)
- [ ] [09-hitl](09-hitl/README.md) · [lesson](09-hitl/LESSON.md) · [tracking](09-hitl/TRACKING.md)
- [ ] [10-cli](10-cli/README.md) · [lesson](10-cli/LESSON.md) · [tracking](10-cli/TRACKING.md)
- [ ] [11-tests](11-tests/README.md) · [lesson](11-tests/LESSON.md) · [tracking](11-tests/TRACKING.md)
- [ ] [12-evidence-report](12-evidence-report/README.md) · [lesson](12-evidence-report/LESSON.md) · [tracking](12-evidence-report/TRACKING.md)
- [ ] [13-overlay-stretch](13-overlay-stretch/README.md) · [lesson](13-overlay-stretch/LESSON.md) · [tracking](13-overlay-stretch/TRACKING.md) (optional)

Ask the coding agent: “Implement `tasks/02-mock-core/README.md`.”
