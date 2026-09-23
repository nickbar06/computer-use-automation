# ADR 09: Surface-independent core

**Date**: 2026-09-23  
**Status**: Accepted  
**Deciders**: implementer (preserve assignment §3.7 seam)  
**Slice**: [05](../../../tasks/05-surface-driver/README.md), [06](../../../tasks/06-discovery-loop/README.md), [08](../../../tasks/08-deterministic-replay/README.md), [09](../../../tasks/09-hitl/README.md)

## Context

The concrete slice is Playwright against a local web core. The assignment still asks how the design extends to legacy web and desktop. If `Page` / `Locator` appear on discover, replay, artifact, policy, or result types, that story is already false.

Core should say **what** to observe or do. A surface adapter says **how** on one frontend.

## Options considered

### A: Domain protocol + Playwright adapter

`SurfaceDriver`, `Observation`, `CanonicalAction`, locators, and `RunResult` live in domain modules. Only `src/surface/playwright/` imports `playwright`. CLI is the composition root.

**Advantages**: replay/discover stay testable with a fake driver; REPORT heading 4 is honest; matches “no Playwright in artifacts.”  
**Disadvantages**: one extra type file before the first click.

### B: Pass `Page` through replay/discover

**Advantages**: fewer types.  
**Disadvantages**: core is a browser script; desktop/legacy story is a comment.

## Decision

Option A.

| Layer | May import `playwright`? |
| ----- | ------------------------ |
| `src/artifact`, `src/safety`, `src/replay`, `src/agent`, `src/escalate` | No |
| `src/domain` (observation, action, driver port) | No |
| `src/surface/playwright` | Yes |
| `src/proxy` (the mock HTML app) | No (it is a target, not a driver) |
| `src/cli.ts` | Yes (wires the adapter) |

Forbidden on domain signatures: `Page`, `Locator`, `Browser`, `Frame`, `BrowserContext`, CSS-only required locators, Playwright selector strings as the artifact contract.

Navigate uses a string `location` (URL on web). Observation uses `location` + optional `regions` (frames/windows), not `page.url()`.

## Consequences

- Task 05 implements `PlaywrightDriver` against the port; it does not define the port in Playwright terms.
- Task 06/08 take `SurfaceDriver`, never `Page`.
- A desktop adapter later implements the same port; artifacts do not change.
- `frame_urls` must not be required on `Observation`. Web adapter may put frame names in `regions`.

## Validation plan

`rg "from ['\\\"]playwright" src/artifact src/safety src/replay src/agent src/escalate src/domain` is empty. Replay unit tests can use an in-memory fake driver.
