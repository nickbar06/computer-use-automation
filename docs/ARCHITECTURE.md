# Architecture

This is the picture the repo implements. Playwright is the first adapter, not the domain.

**WHAT vs HOW** (ADR 09): core domain describes *what* to observe or do. Surface adapters describe *how* on one frontend. Playwright is the first adapter, not the domain.

## Full system (ADR 10)

The assignment’s environment is many institutions, many apps, mixed surfaces. We implement one vertical slice. The types keep the rest thinkable.

```text
Capability          lookup_savings          WHAT work (inputs → outputs)
     │
Vendor product      corelink.servicing      which app family (not which bank)
     │
Tenant overlay      riverside / northlake / lakecrest
                    labels, emoji, copy — same steps
     │
Surface + adapter   legacy_web | web | desktop
                    PlaywrightDriver today  HOW you observe/act
```

| Drift | Response |
| ----- | -------- |
| Button `Find Member` → `Search Member` or `🔍 Search` | Overlay on locator id `find_member` |
| Extra confirm page / new irreversible step | Re-discover; new artifact version |
| Same flow on a desktop core | New adapter, same `SurfaceDriver` + same capability contract |
| Unknown label, no overlay | Locator/checkpoint fail → HITL — never a silent wrong click |

CoreLink is the **vendor product** (the mock). It is not a surface type and not a second driver.

```text
  goal + inputs
        │
        ▼
  ┌─────────────┐     uses      ┌──────────────────┐
  │  discover   │──────────────►│  SurfaceDriver   │  port (domain)
  │  (LLM loop) │               │  observe / act   │
  └──────┬──────┘               │  pause / resume  │
         │ compile              └────────┬─────────┘
         ▼                               │ implemented by
  Capability artifact                    │
  (JSON, semantic locators)     ┌────────▼─────────┐
         │                      │ PlaywrightDriver │  web adapter
         ▼                      │ (only here)      │
  ┌─────────────┐               └──────────────────┘
  │   replay    │── same port, no LLM
  └──────┬──────┘
         │
    RunResult
    success | business_outcome | recovered[] | failed | needs_intervention
         │
    HITL: SurfaceDriver.pauseForHuman / resume
    owner: agent → human → agent
    files: sessions/<id>/{control.json,intervention.json,OPERATOR.txt,RESUME}
```

## Import rule

```text
src/domain          ──►  (nothing Playwright)
src/artifact        ──►  domain types only
src/safety          ──►  no Playwright
src/replay          ──►  SurfaceDriver + artifact + safety
src/agent           ──►  SurfaceDriver + LlmProvider (no openai import)
src/escalate        ──►  files / session owner only
src/surface/playwright ──► playwright + domain port
src/llm/openai      ──►  official `openai` SDK + domain LlmProvider
src/llm/anthropic   ──►  Anthropic adapter + domain LlmProvider
src/cli.ts          ──►  composition root (PlaywrightDriver + resolveLlmProvider)
src/proxy           ──►  mock HTML app; not a driver
```

**Bad**

```ts
function replay(page: Page, artifact: CapabilityArtifact): Promise<RunResult>
```

**Good**

```ts
function replay(driver: SurfaceDriver, artifact: CapabilityArtifact): Promise<RunResult>
```

## Domain port (WHAT)

These types must not mention Playwright.

```ts
type Observation = {
  location: string;           // URL on web; window/app id on desktop
  title: string;
  a11y_snapshot: string;
  visible_text: string;
  screenshot_path?: string;
  regions?: { name: string; location?: string }[];  // frames, windows — not Frame objects
};

type CanonicalAction = {
  type: string;               // navigate | click | fill | ...
  locator?: NamedLocator;     // semantic strategies, not Playwright Locator
  text?: string;
  key?: string;
  location?: string;          // navigate target — not page.goto's API
  timeout_ms?: number;
};

interface SurfaceDriver {
  observe(screenshotPath?: string): Promise<Observation>;
  act(action: CanonicalAction): Promise<void>;
  extract(locator: NamedLocator): Promise<string>;
  currentLocation(): string;
  pauseForHuman(): Promise<void>;
  resume(): Promise<Observation>;
  close(): Promise<void>;
};
```

Locators in the artifact are named strategies (`role_name`, `table_cell`, …). The web adapter maps them to `getByRole` / table geometry. A desktop adapter would map the same strategies to OS accessibility.

### Why these `CanonicalAction` types

They are the shared **WHAT** vocabulary — not a Playwright API list. The same eight strings appear on artifact steps, the policy allowlist, and `driver.act`. Discovery’s `act` tool is the same set minus `navigate` (the loop does that once up front) plus `done` / `stuck`.

They cover CoreLink with a small, reviewable enum:

| Action | Why it exists |
| --- | --- |
| `navigate` | Open the console. Policy can allowlist origin before any `goto`. |
| `fill` | Type `$inputs.member_id` / amount. Parameterized, not baked into the artifact. |
| `click` | Find Member, Open Sub-Account. |
| `extract` | Read Savings × Balance. The assignment grades **outputs**, not just clicks. |
| `dismiss` | Recoverable `System Notice` (click OK, continue). Separate from `click` so handlers are explicit. |
| `wait` | Slow/timeout faults without a fake sleep in every adapter. |
| `press` / `select` | Hostile forms (Enter, dropdowns) without adding a new action later. |

Left out on purpose: `hover`, `drag`, `scroll`, `download`, pixel clicks, raw CSS as the contract. Those are HOW, or they wander off the allowlist (`download` is already rejected). A desktop adapter implements this same enum, not a new one.

`done` / `stuck` never become `CanonicalAction` — they are loop control, not something a surface performs.

## Packages

| Path | Layer | Job |
|---|---|---|
| `src/domain/` | WHAT | `Observation`, `CanonicalAction`, `SurfaceDriver`, `RunResult` |
| `src/artifact/` | WHAT | Zod capability schema, compile, canonicalize |
| `src/safety/` | WHAT | allowlist, redaction |
| `src/agent/` | WHAT | discovery loop (`SurfaceDriver` + `LlmProvider`) |
| `src/llm/openai/` | HOW | official OpenAI SDK adapter |
| `src/llm/anthropic/` | HOW | Anthropic adapter |
| `src/replay/` | WHAT | LLM-free executor (calls the port) |
| `src/escalate/` | WHAT | `SessionControl` owner flip + `OPERATOR.txt` (no Playwright) |
| `src/surface/playwright/` | HOW | only module that imports `playwright`; tracing zip on pause/resume |
| `src/proxy/` | target app | hostile CoreLink mock |
| `src/cli.ts` | compose | wires mock + PlaywrightDriver + discover/replay/operator; `--overlay` / `--out` |

## Result contract

```ts
type RunStatus =
  | "success"
  | "business_outcome"
  | "needs_intervention"
  | "failed";

type RunResult = {
  status: RunStatus;
  outcome_code?: string;
  outputs: Record<string, string>;
  recovered: string[];
  step_id?: string;
  expected?: string;
  observed?: string;
  evidence_dir?: string;
  control?: { owner: "agent" | "human"; session_id: string };
};
```

Recoverable handlers are **not** a terminal status. They fire, the run continues, and the code is appended to `recovered`.
