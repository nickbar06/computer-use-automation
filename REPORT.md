# Architecture

One Node CLI process is the composition root: [`src/cli.ts`](src/cli.ts). It is the only non-adapter module allowed to construct `PlaywrightDriver` and `resolveLlmProvider()`. Discover gets a `SurfaceDriver` plus an `LlmProvider`. Replay gets only a `SurfaceDriver`. Vendor SDKs stay in `src/llm/<vendor>/`. Playwright stays in [`src/surface/playwright/`](src/surface/playwright/).

The core describes **what** to observe or do. An adapter describes **how** on one frontend. Replay therefore takes a `SurfaceDriver`, not a Playwright `Page`. If it took `Page`, the recorded flow would only run in a browser. We could not reuse the same capability on another frontend (legacy web today, desktop later) without rewriting replay.

### Where the seam is typed

| Layer | File | Types |
| --- | --- | --- |
| Port (WHAT) | [`src/domain/surface.ts`](src/domain/surface.ts) | `Observation`, `CanonicalAction`, `SurfaceDriver` |
| Locators | [`src/artifact/schema.ts`](src/artifact/schema.ts) | `NamedLocator` (role + name, table cell, …) |
| Result | [`src/domain/result.ts`](src/domain/result.ts) | `RunResult` / `RunStatus` |
| Discover | [`src/agent/loop.ts`](src/agent/loop.ts) | `DiscoveryRunnerOptions.driver: SurfaceDriver` |
| Replay | [`src/replay/executor.ts`](src/replay/executor.ts) | `ReplayExecutorOptions.driver: SurfaceDriver` |
| Adapter (HOW) | [`src/surface/playwright/driver.ts`](src/surface/playwright/driver.ts) | `PlaywrightDriver implements SurfaceDriver` |

```ts
// src/domain/surface.ts
export interface SurfaceDriver {
  observe(screenshotPath?: string): Promise<Observation>;
  act(action: CanonicalAction): Promise<void>;
  extract(locator: NamedLocator): Promise<string>;
  currentLocation(): string;
  pauseForHuman(): Promise<void>;
  resume(): Promise<Observation>;
  close(): Promise<void>;
}
```

```ts
// src/replay/executor.ts — no Page, no LLM
export type ReplayExecutorOptions = {
  driver: SurfaceDriver;
  artifact: CapabilityArtifact;
  policy: Policy;
  // ...
};
```

```ts
// src/surface/playwright/driver.ts — only this file imports playwright
export class PlaywrightDriver implements SurfaceDriver {
```

### Driver classes (same capability, different HOW)

The port is one interface. The **classes** are the surfaces. They are sketched next to the type in [`src/domain/surface.ts`](src/domain/surface.ts) so a later adapter is a new file, not a new artifact. Only `PlaywrightDriver` exists today.

```
// src/domain/surface.ts — same CapabilityArtifact; construct one driver at the CLI

class PlaywrightDriver implements SurfaceDriver    // surface_kind: legacy_web | web  (built)
  observe()        frames + aria snapshot + inner text
  act(click|fill)  role+name / table cell → DOM
  extract()        cell or control inner text
  currentLocation  URL string
  pause / resume   same browser context

class ModernWebDriver extends PlaywrightDriver     // surface_kind: web (optional later)
  same contract; no frameset; SPA waits

class DesktopDriver implements SurfaceDriver       // surface_kind: desktop (not built)
  observe()        OS accessibility tree + window title
  act(click|fill)  same NamedLocator strategies → AXPress / set value
  extract()        AX value / name
  currentLocation  window or app id string
  pause / resume   same OS session / focused window

ReplayExecutor({ driver, artifact })
  // driver matches artifact.app.surface_kind
```

HITL is a file poll (`RESUME`) against the still-open headed window. There is no `DesktopDriver` in this repo, and no operator console.

# Artifact schema

A capability is a contract a calling agent can invoke: typed `inputs` / `outputs`, ordered `steps`, named locators, handlers, a checkpoint, and a safety allowlist. The Zod schema lives in [`src/artifact/schema.ts`](src/artifact/schema.ts). Fill steps bind `$inputs.member_id` (and `$inputs.amount`) instead of baking a member id into the JSON. Compile refuses to treat a successful transcript as a chat dump.

Locators are **named strategies with fallbacks**. Replay never stores click coordinates or required CSS. Role + name matches how a person — and a screen reader — finds “Find Member.” Coordinates break on any layout shift; CSS on a hostile frameset with no `id` / `data-testid` is a trap.

```ts
// src/artifact/schema.ts
const locatorStrategySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("role_name"), role: z.string(), name: z.string() }),
  z.object({ kind: z.literal("accessible_name"), name: z.string() }),
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({ kind: z.literal("table_cell"), row_header: z.string(), column_header: z.string() }),
  z.object({ kind: z.literal("placeholder"), placeholder: z.string() }),
  z.object({ kind: z.literal("css"), css: z.string() }), // last resort
]);
```

CoreLink is `app.vendor_product: corelink.servicing`, not a driver type and not a tenant. The mock is one vendor product. Riverside / Northlake / Lakecrest are tenants that skin the same product.

# Determinism & error handling

Replay has no model ([`src/replay/executor.ts`](src/replay/executor.ts)). A model that “helps” on a money movement is a second, unreviewed policy. The artifact is the policy: same steps, same locators, same handlers.

Statuses in [`src/domain/result.ts`](src/domain/result.ts) are not interchangeable:

```ts
type RunStatus = "success" | "business_outcome" | "needs_intervention" | "failed";
```

| Status | Terminal? | Meaning |
| --- | --- | --- |
| `success` | yes | checkpoint passed, outputs filled |
| `business_outcome` | yes | the app answered (e.g. `MEMBER_NOT_FOUND`) |
| recoverable | **no** | dismiss `System Notice`, append `recovered[]`, continue |
| `failed` | yes | hard error with step, expected, observed |
| `needs_intervention` | yes | irreversible without `--confirm`, stuck, or checkpoint fail |

`MEMBER_NOT_FOUND` is not `failed`. “No matching member” is a valid servicing answer. Treating it as a crash would hide the only signal a calling agent needs. Primary failures we designed for are **runtime states** on a live core: not-found, access denied, validation, a blocking dialog, a dead session. UI drift is secondary: overlay, checkpoint, then HITL — never a silent wrong click.

# Heterogeneity & multi-tenant

**Surface seam.** Types and the driver class split (`PlaywrightDriver` / `ModernWebDriver` / `DesktopDriver`) are in [Architecture](#driver-classes-same-capability-different-how) and [`src/domain/surface.ts`](src/domain/surface.ts). This mock is `legacy_web`. A desktop core would ship `DesktopDriver`: same capability JSON, different class. `Observation.location` is a string (a URL here; a window id on desktop), not a Playwright URL object.

```ts
// src/domain/surface.ts
export type Observation = {
  location: string; // not page.url()
  title: string;
  a11y_snapshot: string;
  visible_text: string;
};
```

**Reuse / drift.** Artifacts key on vendor product + surface kind, not bank name. Label and emoji drift is a tenant overlay on locator **ids** (`find_member`), applied at replay (`--overlay` in [`src/cli.ts`](src/cli.ts) via `applyOverlay`). Locator ids stay stable; strategies change. The same `lookup_savings` steps run; only the name strategies are patched.

```json
// capabilities/overlays/northlake.json
"find_member": {
  "strategies": [{ "kind": "role_name", "role": "button", "name": "Search Member" }]
}
```

```json
// capabilities/overlays/lakecrest.json
"find_member": {
  "strategies": [{ "kind": "role_name", "role": "button", "name": "🔍 Search" }]
}
```

Runtime proof ([`tests/overlay.test.ts`](tests/overlay.test.ts)): the Riverside artifact against the Northlake skin (`?tenant=northlake`) cannot resolve `Find Member`. Replay returns `failed` / HITL. It does not click `Search Member` by accident or report a wrong-page success. The same artifact plus `northlake.json` extracts `4250.00`. Lakecrest plus `lakecrest.json` does the same for `🔍 Search`. Unknown drift (no overlay) fails the locator or checkpoint and escalates. Flow change (a new confirm page, a new irreversible step) is a new artifact version, not an overlay.

URL examples in a path are canonicalized at compile (`/member/12345` → `/member/:member_id` in [`src/artifact/canonicalize.ts`](src/artifact/canonicalize.ts)). Replay binds `:member_id` from `$inputs`.

# Escalation & handoff

Stuck discovery, an irreversible step without `--confirm`, or a failed checkpoint calls `driver.pauseForHuman()` on the **current** session ([`src/escalate/control.ts`](src/escalate/control.ts) + `SurfaceDriver.pauseForHuman` / `resume`). The web adapter starts Playwright tracing on the existing context. It does not call `chromium.launch` or `newPage` on resume. A second window would be a fake handoff: the human would not see the form the agent filled.

`sessions/<id>/OPERATOR.txt` is the operator UI: use the already-open window, then `npm run cua -- operator resume --session <id>`. That writes `RESUME`. The waiter flips `owner` human → agent, `resume()` observes, and `human_actions.json` records what the screen looks like after the human. Timeout leaves `needs_intervention` with `control.owner = human`.

# Safety

[`policies/default.json`](policies/default.json) allowlists origins (`127.0.0.1:8765`, `localhost:8765`) and actions. Checks live in [`src/safety/policy.ts`](src/safety/policy.ts). Off-origin navigation throws before `goto`. `download` is rejected. Irreversible names (`open sub-account`) require `--confirm` or HITL; replay of `open_subaccount` without confirm does not POST `/open`.

Logs go through [`src/safety/redact.ts`](src/safety/redact.ts): long digit runs, SSNs, `password`/`token`/`secret` values, `Name:` / `Member name:` lines, and sensitive JSON keys. Limits: five-digit member ids are kept (they are inputs, not account numbers); balances like `4250.00` stay; screenshots are raw pixels and can still show a name; chrome copy such as an operator label can survive. Redaction is a log control, not a guarantee the headed window is clean.

# Cuts

Not built, on purpose: desktop adapter, pretty operator console, queues/workers, capability catalog, codegen, approval state machines, LLM recovery on replay, multi-run stability, a tenant database.

`--overlay` is done: Northlake without overlay fails the locator; Northlake / Lakecrest with overlay succeed. Next work, if any, is another `SurfaceDriver` implementation, not a platform.
