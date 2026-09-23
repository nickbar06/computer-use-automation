---
id: "05a"
title: LLM provider port
status: todo
optional: false
---

# Task 05a — LLM port (OpenAI SDK is one adapter)

Discovery needs a model. The **loop** must not import the OpenAI SDK. Same move as Playwright: domain says WHAT to ask a model; adapters say HOW.

Do this **after Task 05**, **before Task 06**. Replay never uses this port (ADR 04 / 11).

## Files

- `src/domain/llm.ts` — `LlmMessage`, `LlmTool`, `LlmRequest`, `LlmResponse`, `LlmProvider`
- `src/llm/resolve.ts` — `resolveLlmProvider()` from env (no vendor types leaked)
- `src/llm/openai/provider.ts` — `OpenAiProvider` using the official **`openai`** package (Chat Completions + `tools`)
- `src/llm/anthropic/provider.ts` — `AnthropicProvider` (official SDK or Messages HTTP)
- `src/agent/nextAction.ts` — maps `LlmResponse` → the `act` tool payload (domain types only)
- `tests/llm.test.ts` — fake provider + resolve errors; **no live HTTP**

Do **not** add OpenAI Operator / `computer-use` tools. That is not this port (ADR 04).

## Domain port (WHAT)

```ts
type LlmMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string };

type LlmTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
};

type LlmRequest = {
  messages: LlmMessage[];
  tools: LlmTool[];
  tool_choice?: { name: string };
  temperature?: number;
};

type LlmResponse = {
  text?: string;
  tool_calls: { name: string; arguments: Record<string, unknown> }[];
};

interface LlmProvider {
  id: string; // "openai" | "anthropic" | "fake"
  complete(request: LlmRequest): Promise<LlmResponse>;
}
```

`src/domain/llm.ts` must not import `openai`.

## Adapters (HOW)

- **OpenAI** (`LLM_PROVIDER=openai` or default when `OPENAI_API_KEY` is set): `new OpenAI({ apiKey, baseURL })`, `chat.completions.create` with `tools`, `tool_choice` forced to `act`, `temperature: 0`. Map SDK tool calls → `LlmResponse.tool_calls`. `OPENAI_BASE_URL` still allows compatible proxies.
- **Anthropic** (`LLM_PROVIDER=anthropic` or fallback when only `ANTHROPIC_API_KEY` is set): Messages API + tool use → the same `LlmResponse`.
- **Resolve errors:** if no key matches, throw a clear `set OPENAI_API_KEY or ANTHROPIC_API_KEY` (or `LLM_PROVIDER` mismatch). Do not call a network host.

## Env (add to `.env.example`)

```text
LLM_PROVIDER=openai
OPENAI_API_KEY=YOUR_API_KEY
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
ANTHROPIC_API_KEY=YOUR_API_KEY
ANTHROPIC_MODEL=claude-sonnet-4-5
```

Placeholders only. Do not commit real keys.

## Tests (this slice)

`tests/llm.test.ts`:

- `FakeLlmProvider` returns a canned `act` tool call; `nextAction` parses `thought` + `action`
- `resolveLlmProvider()` with empty env throws the missing-key message
- `src/agent/` and `src/domain/` have no `from "openai"` import (assertion via reading the source or a grep in the test)

`npm test` stays green. No live billed call is required to close this task.

## Acceptance

- [ ] `openai` is a dependency; only `src/llm/openai/` imports it
- [ ] `src/domain/llm.ts` and `src/agent/nextAction.ts` have no vendor SDK imports
- [ ] `resolveLlmProvider()` throws clearly without keys
- [ ] `tests/llm.test.ts` passes with a fake provider
- [ ] `.env.example` lists `LLM_PROVIDER` + existing key placeholders
- [ ] `npm test` green

## Lesson

This task’s lesson: [LESSON.md](LESSON.md).
