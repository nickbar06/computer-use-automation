# Glossary

Learn these before Task 00. The assignment grades the ideas, not the vocabulary.

**Agent** — a loop: model sees state, chooses a tool/action, environment changes, repeat until a stop condition.

**Computer use** — the agent operates a UI the way a person would (click, type, read the screen), not via an API.

**Observe → decide → act** — one iteration of that loop. Observe = accessibility snapshot (+ optional screenshot). Decide = LLM tool call. Act = driver click/fill/extract.

**Capability artifact** — the saved, typed description of a successful flow. An AI agent should be able to invoke it later with inputs and get outputs. This is not the chat log.

**Locator / selector** — how replay finds a control. Prefer accessible name (`role=textbox, name=Member ID`) over CSS `#foo`.

**Accessibility tree** — the structure browsers expose to screen readers. Often more stable than legacy HTML.

**Checkpoint** — an assertion that you actually reached the expected screen (“Member Snapshot” is visible), rather than assuming the last click worked.

**Business outcome vs failure** — “no such member” is a valid answer. A crash is not. Mixing these up is the most common design mistake in this assignment.

**Deterministic replay** — re-run the artifact with no model choosing anything. Same inputs → same steps → same class of result.

**Human-in-the-loop (HITL)** — automation pauses, a person uses the **same** live session, then signals resume.

**Irreversible action** — posting/opening/transferring money. Do not auto-replay unattended without confirmation.

**Capability** — the job (`lookup_savings`): typed inputs, outputs, steps. Keyed independently of which bank or which frontend.

**Vendor product** — e.g. `corelink.servicing`. The app family. Artifacts are keyed here, not per tenant. CoreLink is this layer, not a surface.

**Tenant** — one bank or credit union. Hundreds of them; many run the same vendor product with different labels, branding, or emoji.

**Surface** — frontend class: `web`, `legacy_web` (framesets, tables, no test IDs), or `desktop`. How you talk to the UI. Not the same as the vendor product.

**Overlay** — per-tenant patches on locator **strategies** (name `Find Member` → `Search Member` or `🔍 Search`) applied at replay time instead of re-recording. Locator **ids** stay stable.

**Allowlist** — the only origins and action types the agent may use.

**Redaction** — strip secrets and raw PII from logs and artifacts. Parameter references (`$inputs.member_id`) stay; account numbers do not.

**SurfaceDriver** — the domain port: observe, act, extract, pause/resume. Core says *what*; an adapter says *how*. Playwright implements this; it is not the type replay or discovery take.

**Observation** — what the core sees after an observe: `location`, title, accessibility snapshot, visible text, optional regions. Not a Playwright `Page`.

**Adapter** — the HOW layer (`src/surface/playwright/` for this slice). Maps semantic locators to a concrete frontend. A later desktop adapter would implement the same port.

**LlmProvider** — domain port for discovery only: `complete(LlmRequest) → LlmResponse`. The official OpenAI SDK is one adapter (`src/llm/openai/`). Replay does not get a provider.
