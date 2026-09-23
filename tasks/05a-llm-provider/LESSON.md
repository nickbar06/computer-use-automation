# Lesson 05a — The SDK is not the loop

**Read:** [ADR 11](../../docs/tasks/adr/11-llm-provider-port.md). LEARN item 10 (function calling) in [LEARN.md](../../docs/LEARN.md).

**Do:** Add `LlmProvider` and an OpenAI adapter that uses the official `openai` package. Discovery (Task 06) will call the port, not `OpenAI`.

**Check you understand:**

- Why `DiscoveryRunner` must not `import OpenAI from "openai"` (same reason it must not take `Page`).
- Why replay still has no `LlmProvider` at all.
- Why a fake provider is enough to close this task (live discover is Task 06).

Next: [../06-discovery-loop/README.md](../06-discovery-loop/README.md)
