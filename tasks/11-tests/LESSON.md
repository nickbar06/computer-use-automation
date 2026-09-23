# Lesson 11 — Tests that match the rubric

**Do:** `npm test`. If `replay.test.ts` takes more than ~30s, fix observe() on the frameset; do not raise the timeout.

**Check you understand:**

- Schema, overlay, safety, handlers, and control tests already landed in earlier slices. This task is the Playwright regression, not the first time you write tests.
- Control-transfer tests do not need a browser.
- Replay tests must use an ephemeral mock port and add that origin to the allowlist.

Next: [../12-evidence-report/README.md](../12-evidence-report/README.md)
