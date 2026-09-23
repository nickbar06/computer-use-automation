# Lesson 06 — Your first agent loop

**Read:** LEARN items 1 and 10 in [LEARN.md](../../docs/LEARN.md). Item 13 (ReAct) if curious.

**Do:** Implement the observe → decide → act loop. You need a model key. If the key is missing, leave this task `blocked` rather than faking turns.

**Check you understand:**

- One tool (`act`), not twelve frameworks.
- `done` and `stuck` are actions.
- The model never runs during replay (that is Task 08).
- The loop talks to `SurfaceDriver` and `LlmProvider`. Playwright and the OpenAI SDK are injected at the CLI, not imported here.

Next: [../07-compile-artifact/README.md](../07-compile-artifact/README.md)
