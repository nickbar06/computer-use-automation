# ADR 06: HITL is the same Playwright session

**Date**: 2026-09-21  
**Status**: Accepted  
**Deciders**: assignment §3.6 (same live session; console out of scope)  
**Slice**: [tasks/09-hitl](../../../tasks/09-hitl/README.md)

## Context

Stuck, failed checkpoint, or irreversible without confirm must bring a human in. A co-browsing product is explicitly out of scope. A new browser for the human is a fake handoff.

## Options considered

### A: `owner: agent | human` on a session dir; `SurfaceDriver.pauseForHuman` keeps the **same** live session (web adapter starts tracing on the existing Playwright context); poll `RESUME`

**Advantages**: real control transfer; `OPERATOR.txt` is the stub UI.  
**Disadvantages**: headed window required for a real human demo.

### B: Open a second page/browser and call that “handoff”

**Advantages**: simpler process.  
**Disadvantages**: fails the assignment’s “same live session” bar.

## Decision

Option A. Auto-resume is tests-only.

## Consequences

Irreversible steps in replay call escalate instead of click unless `--confirm`.

## Validation plan

Open-sub-account without confirm writes `intervention.json` and does not POST `/open`. Resume does not launch a second browser. Escalate stays file-based (`src/escalate/` must not import `playwright`).
