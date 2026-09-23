# ADR 10: Capability, vendor, tenant, surface

**Date**: 2026-09-23  
**Status**: Accepted  
**Deciders**: implementer (assignment §1 environment + §3.7)  

## Context

The brief’s real environment is hundreds of institutions, ~20 apps each, many on the same vendor product, on modern web / legacy web / desktop. Reviewers do **not** want a tenant platform. They want core abstractions that do not paint you into a corner, and a REPORT that answers both 3.7 questions.

CoreLink is one **vendor product**, not a surface type. “Search Member” vs “🔍 Search” is **tenant drift**, not a new capability.

## Options considered

### A: Four layers, one implemented slice

| Layer | Meaning | This weekend |
| ----- | ------- | ------------ |
| Capability | The job (`lookup_savings`) | Implement |
| Vendor product | `corelink.servicing` | One mock |
| Tenant overlay | Label / emoji / copy | Schema + mock skins + `--overlay` runtime |
| Surface + adapter | `web` / `legacy_web` / `desktop` | Playwright for `legacy_web`; desktop is a port only |

**Advantages**: matches §1 and §3.7; overlay is the stretch they already listed.  
**Disadvantages**: REPORT must carry the desktop story.

### B: One artifact per tenant, Playwright in the schema

**Advantages**: less thinking.  
**Disadvantages**: fails “reuse across institutions running the same app.”

## Decision

Option A.

- Artifacts key on `app.vendor_product` + `surface_kind`, not tenant name.
- Locator **ids** (`find_member`) are stable. Overlay replaces strategy `name` (plain text or emoji).
- `SurfaceDriver` is the perceive/act seam. The recorded flow does not mention Playwright.
- Re-discover only when the **flow** changes. Label/emoji drift is overlay. Unknown drift → locator/checkpoint fail → HITL, never a silent wrong click.

## Consequences

The mock ships tenant skins. Overlay JSON includes an emoji name. Replay applies `--overlay`. REPORT heading 4 answers both PDF questions.

## Validation plan

`applyOverlay` changes `find_member` name without mutating the base artifact. Northlake without overlay does not silently succeed. `src/replay` imports `SurfaceDriver`, not `Page`.
