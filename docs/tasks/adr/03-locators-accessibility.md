# ADR 03: Locator strategy is the accessibility tree

**Date**: 2026-09-21  
**Status**: Accepted  
**Deciders**: scoping (legacy cores have no test IDs)  
**Slice**: [tasks/05-surface-driver](../../../tasks/05-surface-driver/README.md), [08-deterministic-replay](../../../tasks/08-deterministic-replay/README.md)

## Context

Replay must survive ugly markup. The assignment biases toward surfaces with no clean DOM. Screenshot+coordinates are a poor production contract for stable UIs whose real failures are business states.

## Options considered

### A: Role + accessible name, then table cell (row header × column header)

CSS last-resort only, not stored as the primary strategy.

**Advantages**: what a teller/screen reader uses; extends toward desktop a11y later.  
**Disadvantages**: must skip frameset roots (no `body`) or observe hangs.

### B: CSS / xpath as the artifact

**Advantages**: easy on modern SPAs.  
**Disadvantages**: this mock (and real cores) have no test IDs.

### C: Screenshot + click coordinates in the artifact

**Advantages**: “computer use” in the pixel sense.  
**Disadvantages**: brittle replay; hard to review; hides the capability contract.

## Decision

Option A. Screenshots go to `evidence/`, not into locator JSON.

## Consequences

The Playwright adapter must resolve the `workspace` frame first. Table-cell finder must not treat the title row as the header row. Those details stay in the adapter; artifacts store `table_cell` + headers, not `Page` or CSS.

## Validation plan

Extract savings for member 12345 equals `4250.00`. Observe on `/` returns in under two seconds.
