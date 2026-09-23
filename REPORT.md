# Architecture

One Node CLI process is the composition root (`src/cli.ts`). It is the only non-adapter module allowed to construct `PlaywrightDriver` and `resolveLlmProvider()`. Discover receives a `SurfaceDriver` plus an `LlmProvider`. Replay receives only a `SurfaceDriver`. Vendor SDKs stay in `src/llm/<vendor>/`; Playwright stays in `src/surface/playwright/`.

The core describes **what** to observe or do (`Observation`, `CanonicalAction`, `NamedLocator`, `RunResult`). An adapter describes **how** on one frontend. That is why `replay(page: Page, artifact)` would fail this design: `Page` is a Playwright type. The recorded flow would be a browser script, and heading 4 would be a comment. `replay(driver: SurfaceDriver, artifact)` keeps the seam honest.

One process is the weekend-sized choice. HITL is a file poll (`RESUME`) against the still-open headed window. The trade-off is real: there is no desktop adapter in this repo, and no operator console. The seam is still typed, so a later OS-accessibility adapter would implement the same port rather than a new artifact schema.

# Artifact schema

A capability is a contract a calling agent can invoke: typed `inputs` / `outputs`, ordered `steps`, named locators, handlers, a checkpoint, and a safety allowlist. Fill steps bind `$inputs.member_id` (and `$inputs.amount`) instead of baking a member id into the JSON. Compile refuses to treat a successful transcript as a chat dump.

Locators are **named strategies with fallbacks** (`role_name`, `accessible_name`, `text`, `table_cell`, then `css` last). Replay never stores click coordinates or required CSS. Role + name matches how a person — and a screen reader — finds “Find Member.” Coordinates break on any layout shift; CSS on a hostile frameset with no `id` / `data-testid` is a trap.

CoreLink is `app.vendor_product: corelink.servicing`, not a driver type and not a tenant. The mock is one vendor product. Riverside / Northlake / Lakecrest are tenants that skin the same product.

# Determinism & error handling

Replay has no model. A model that “helps” on a money movement is a second, unreviewed policy. The artifact is the policy: same steps, same locators, same handlers.

Statuses are not interchangeable:

| Status | Terminal? | Meaning |
| --- | --- | --- |
| `success` | yes | checkpoint passed, outputs filled |
| `business_outcome` | yes | the app answered (e.g. `MEMBER_NOT_FOUND`) |
| recoverable | **no** | dismiss `System Notice`, append `recovered[]`, continue |
| `failed` | yes | hard error with step, expected, observed |
| `needs_intervention` | yes | irreversible without `--confirm`, stuck, or checkpoint fail |

`MEMBER_NOT_FOUND` is not `failed`. “No matching member” is a valid servicing answer. Treating it as a crash would hide the only signal a calling agent needs. Primary failures we designed for are **runtime states** on a live core: not-found, access denied, validation, a blocking dialog, a dead session. UI drift is secondary: overlay, checkpoint, then HITL — never a silent wrong click.

# Heterogeneity & multi-tenant

**Surface seam.** The recorded flow is `CanonicalAction` plus `NamedLocator` (what to do, which control). Perceive/act is `SurfaceDriver` (how, on one frontend). This mock is `legacy_web` (frameset, tables, no test ids). A modern `web` surface would reuse `PlaywrightDriver`. A `desktop` core would implement the same port over OS accessibility — same artifact contract, different adapter. `location` is a string, not a Playwright URL object. If discover or replay imported `Page`, this paragraph would be false.

**Reuse / drift.** Artifacts key on vendor product + surface kind, not bank name. We did not record one artifact per institution. Label and emoji drift (`Find Member` → `Search Member` or `🔍 Search`) is a tenant overlay on locator **ids** (`find_member`), applied at replay (`--overlay`). Locator ids stay stable; strategies change. Unknown drift fails the locator or checkpoint and escalates. There is no tenant database and no silent fallback to the first button on the page. Flow change (a new confirm page, a new irreversible step) is a new artifact version, not an overlay.

# Escalation & handoff

Stuck discovery, an irreversible step without `--confirm`, or a failed checkpoint calls `driver.pauseForHuman()` on the **current** session. The web adapter starts Playwright tracing on the existing context. It does not call `chromium.launch` or `newPage` on resume. A second window would be a fake handoff: the human would not see the form the agent filled.

`sessions/<id>/OPERATOR.txt` is the operator UI: use the already-open window, then `npm run cua -- operator resume --session <id>`. That writes `RESUME`. The waiter flips `owner` human → agent, `resume()` observes, and `human_actions.json` records what the screen looks like after the human. Timeout leaves `needs_intervention` with `control.owner = human`.

# Safety

`policies/default.json` allowlists origins (`127.0.0.1:8765`, `localhost:8765`) and actions. Off-origin navigation throws before `goto`. `download` is rejected. Irreversible names (`open sub-account`) require `--confirm` or HITL; replay of `open_subaccount` without confirm does not POST `/open`.

Logs go through redaction: long digit runs, SSNs, `password`/`token`/`secret` values, `Name:` / `Member name:` lines, and sensitive JSON keys. Limits: five-digit member ids are kept (they are inputs, not account numbers); balances like `4250.00` stay; screenshots are raw pixels and can still show a name; chrome copy such as an operator label can survive. Redaction is a log control, not a guarantee the headed window is clean.

# Cuts

Not built, on purpose: desktop adapter, pretty operator console, queues/workers, capability catalog, codegen, approval state machines, LLM recovery on replay, multi-run stability, public-site demos.

`--overlay` parses and applies a tenant overlay today. The optional stretch (Task 13) is the **runtime proof** that Northlake / Lakecrest fail without the overlay and succeed with it. That slice is not done in this close-out. Next work, if any, is that proof — not a platform.
