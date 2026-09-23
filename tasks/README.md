# Tasks

Each task is a spec file in this folder. Open one file at a time.

**Full system (implement one slice):** capability → vendor product (`corelink.servicing`) → tenant overlay (labels / emoji) → surface adapter (Playwright today). See [ADR 10](../docs/tasks/adr/10-capability-vendor-tenant-surface.md). Do not add a CoreLink driver or a tenant platform.

Frontmatter `status` is the source of truth.

## How to mark done

1. Tick every **Acceptance** box in that spec.
2. Paste real validation output into [docs/tasks/2026-09-21-computer-use-takehome.md](../docs/tasks/2026-09-21-computer-use-takehome.md) when the slice produces a command the reviewer will run.
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
| 10 | `tests/cli.test.ts` | help matches README; overlay; missing session |
| 11 | `tests/replay.test.ts` | Playwright + mock; **all prior tests still pass** |
| 13 | `tests/overlay.test.ts` | Northlake / Lakecrest skins (optional) |

## Index

- [ ] [00-orientation](00-orientation.md)
- [x] [01-scaffold](01-scaffold.md)
- [x] [02-mock-core](02-mock-core.md)
- [x] [03-artifact-schema](03-artifact-schema.md)
- [x] [04-safety](04-safety.md)
- [x] [05-surface-driver](05-surface-driver.md)
- [x] [05a-llm-provider](05a-llm-provider.md)
- [x] [06-discovery-loop](06-discovery-loop.md)
- [x] [07-compile-artifact](07-compile-artifact.md)
- [x] [08-deterministic-replay](08-deterministic-replay.md)
- [x] [09-hitl](09-hitl.md)
- [x] [10-cli](10-cli.md)
- [x] [11-tests](11-tests.md)
- [x] [12-evidence-report](12-evidence-report.md)
- [ ] [13-overlay-stretch](13-overlay-stretch.md) (optional)

Ask the coding agent: “Implement `tasks/02-mock-core.md`.”
