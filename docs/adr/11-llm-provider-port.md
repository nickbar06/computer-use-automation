# ADR 11: LLM provider port

**Date**: 2026-09-23  
**Status**: Accepted  
**Deciders**: implementer (user: OpenAI SDK + other providers)  

## Context

Discovery needs a model. Hard-coding `fetch` to one HTTP shape, or importing the OpenAI SDK in the agent loop, makes Anthropic (or a local proxy) a rewrite. The assignment allows any provider. Replay must still call **zero** models (ADR 04).

“ChatGPT SDK” here means the official `openai` npm package (Chat Completions + tools), not OpenAI Operator / computer-use as the artifact.

## Options considered

### A: Domain `LlmProvider` + vendor adapters

`complete(request)` lives in `src/domain/llm.ts`. `src/llm/openai/` uses the OpenAI SDK. `src/llm/anthropic/` is a second adapter. CLI resolves the adapter from `LLM_PROVIDER`. Discovery takes `LlmProvider`. Tests use a fake.

**Advantages**: swap providers without touching the loop; fake provider for unit tests; matches SurfaceDriver.  
**Disadvantages**: one extra type file.

### B: Call `openai` from `DiscoveryRunner`

**Advantages**: fewer files.  
**Disadvantages**: Anthropic is a special case; tests hit the network or skip.

## Decision

Option A. Same WHAT/HOW as surfaces:

| Layer | May import `openai` / `@anthropic-ai/sdk`? |
| ----- | ------------------------------------------ |
| `src/domain`, `src/agent`, `src/replay`, `src/artifact` | No |
| `src/llm/openai` | Yes (`openai` only) |
| `src/llm/anthropic` | Yes (Anthropic SDK or Messages HTTP) |
| `src/cli.ts` | Yes (wires `resolveLlmProvider()`) |

Replay never receives an `LlmProvider`.

## Consequences

Task 06’s `nextAction` calls the port. Missing keys throw on `resolveLlmProvider()`, not inside Playwright. A new vendor is a new folder under `src/llm/`.

## Validation plan

`tests/llm.test.ts` uses a fake provider (no network). `rg "from ['\\\"]openai" src/agent src/domain src/replay` is empty.
