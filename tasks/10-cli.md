---
id: "10"
title: CLI
status: todo
optional: false
---

# Task 10 — CLI

Reviewers will run whatever you print in README. Make the commands exact. PDF deliverable: demo path is **discover a goal, then replay the artifact** (replay must also work with the hand-authored JSON, no key).

## File

`src/cli.ts` (replace the stub) — **composition root**. This is the only non-adapter module allowed to construct `PlaywrightDriver` and `resolveLlmProvider()`. Discover gets `SurfaceDriver` + `LlmProvider`. Replay gets only `SurfaceDriver`.

## Commands

```text
cua serve [--port 8765] [--host 127.0.0.1]
cua discover --goal "..." --input member_id=12345 [--target URL] [--out path] [--evidence dir] [--headed] [--start-mock]
cua replay <artifact.json> --input k=v [--evidence dir] [--headed] [--confirm] [--overlay file] [--auto-resume] [--operator-timeout 180]
cua operator resume --session <id>
cua operator status --session <id>
```

`--input` is repeatable `key=value`.

`--start-mock` default true: if target host is localhost and `/health` fails, `listenMock` on that port.

Discover writes the compiled artifact to `--out` (default `capabilities/discovered.json`) and prints `reviewSummary`.

Replay prints redacted `RunResult` JSON. Exit 2 only on `status === failed`. `business_outcome` is exit 0.

`--overlay` parses `tenantOverlaySchema` and `applyOverlay` before run.

`--confirm` sets `confirmIrreversible`.

`--headed` for HITL demos.

`--auto-resume` is for tests/demos only; do not advertise it as production.

## Acceptance

- [ ] `npm run cua -- help` matches README
- [ ] `serve` stays up; `/health` works
- [ ] `replay capabilities/lookup_savings.json --input member_id=12345` succeeds without a model key
- [ ] `replay ... --input member_id=99999` prints `MEMBER_NOT_FOUND`
- [ ] `operator resume` with a missing session fails clearly
- [ ] `npm test` still green


## Mark done

Set `status: done` in frontmatter and check this task in [tasks/README.md](README.md).

