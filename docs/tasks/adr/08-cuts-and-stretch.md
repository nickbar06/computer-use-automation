# ADR 08: Cuts and the only stretch

**Date**: 2026-09-21  
**Status**: Accepted  
**Deciders**: scoping (depth over breadth)  
**Slice**: [tasks/12-evidence-report](../../../tasks/12-evidence-report.md), [13-overlay-stretch](../../../tasks/13-overlay-stretch.md)

## Context

The brief rewards a thin thread through every must-have. Extra product surface after that should be the most on-brand stretch: cross-tenant reuse.

## Options considered

### A: Cut desktop adapter, operator console, queues, LLM recovery on replay, public sites, capability catalog, codegen, approval state, multi-run stability. Stretch = locator overlay (Northlake + Lakecrest emoji)

**Advantages**: matches evaluation order; overlay is the multi-tenant story.  
**Disadvantages**: desktop remains a REPORT story only.

### B: Build a capability catalog API or codegen from artifacts

**Advantages**: looks busy.  
**Disadvantages**: breadth the brief told us not to chase.

## Decision

Option A. REPORT heading 7 must list the cuts. Task 13 starts only after Task 12 is `done`.

## Consequences

Desktop `SurfaceDriver` is a type/protocol story, not a second implementation in v1.

## Validation plan

REPORT headings 4 and 7 exist. If Task 13 is skipped, Cuts says so. If done, Northlake/Lakecrest without overlay must not silently succeed.
