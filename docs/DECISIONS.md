# Locked decisions

Pointers to one-file ADRs.

| Topic | ADR |
| ----- | --- |
| TypeScript / Node / Zod / Playwright | [01-language-typescript](adr/01-language-typescript.md) |
| Local CoreLink mock | [02-target-local-mock](adr/02-target-local-mock.md) |
| A11y locators, not CSS or coordinates | [03-locators-accessibility](adr/03-locators-accessibility.md) |
| Own artifact, not a vendor CUA SDK | [04-no-vendor-cua-sdk](adr/04-no-vendor-cua-sdk.md) |
| Single CLI process | [05-architecture-single-process](adr/05-architecture-single-process.md) |
| Same-session HITL | [06-hitl-same-session](adr/06-hitl-same-session.md) |
| Allowlist + redaction | [07-safety-allowlist](adr/07-safety-allowlist.md) |
| Cuts + overlay-only stretch | [08-cuts-and-stretch](adr/08-cuts-and-stretch.md) |
| Surface-independent core | [09-surface-independent-core](adr/09-surface-independent-core.md) |
| Capability / vendor / tenant / surface | [10-capability-vendor-tenant-surface](adr/10-capability-vendor-tenant-surface.md) |
| LLM provider port | [11-llm-provider-port](adr/11-llm-provider-port.md) |

Index: [adr/README.md](adr/README.md).

## Stack

TypeScript, Node 20+, Playwright, Zod. CLI via `tsx`. Tests via `node:test`. No Python.

## Target application

Local mock **CoreLink Servicing 7.4**: frameset, tables, no test IDs. Members `12345` / `99999` / `67890`. Faults and three tenant skins (Riverside / Northlake / Lakecrest emoji) as in ADR 02.

## Computer-use approach

Accessibility tree for observe + replay. Screenshots for evidence. CSS last-resort only. Semantic locators in the artifact; the web adapter maps them to Playwright.

## Process shape

One Node process: `serve`, `discover`, `replay`, `operator resume`. Mock on `127.0.0.1:8765`.

## Surface boundary

Core (`domain`, `artifact`, `safety`, `replay`, `agent`, `escalate`) describes **what** to observe or do. It never takes `Page`, `Locator`, or other Playwright types. `src/surface/playwright/` is the first **how**. CLI wires the adapter. See ADR 09.

Discovery takes `LlmProvider`, not `OpenAI`. The official `openai` package lives in `src/llm/openai/` only. Replay has no LLM. See ADR 11.

## Safety defaults

See ADR 07. Origins localhost:8765 only. Irreversible open-sub-account needs `--confirm` or HITL.

## Explicit cuts

See ADR 08. Desktop driver, operator console, queues, public sites. Overlay runtime is implemented; no tenant platform.
