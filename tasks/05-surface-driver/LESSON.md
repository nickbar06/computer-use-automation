# Lesson 05 — The driver is not the artifact

**Read:** LEARN items 5, 6, 7 in [LEARN.md](../../docs/LEARN.md). [ADR 09](../../docs/tasks/adr/09-surface-independent-core.md).

**Do:** A short script that constructs `PlaywrightDriver` (not a raw `Page` handed to later layers): open the mock, fill Member ID `12345` in the `workspace` region, click Find Member, print the savings cell.

**Check you understand:**

- Core says *what* (`CanonicalAction`, `NamedLocator`). This adapter says *how* (`getByRole` inside a frame).
- `page.frames()` includes the frameset root, which has no `body` — do not hang on it. That detail lives in the adapter, not in `Observation`.
- Table cells: row whose first cell is `Savings`, column headed `Balance`. The first table row is a title, not the header.

Next: [../05a-llm-provider/README.md](../05a-llm-provider/README.md)
