# Lesson 09 — The same window

**Do:** Replay open-sub-account **without** `--confirm`. Confirm `intervention.json` is written. Signal `RESUME` and confirm control returns to the **same** live session (`SurfaceDriver.pauseForHuman` / `resume`), not a new browser.

**Check you understand:**

- Owner flips `agent → human → agent` on one session.
- Auto-resume is allowed in tests; launching a second browser is not.
- Escalate writes files; the adapter holds the window. Neither layer should pass `Page` through replay.
- The operator UI can be a text file. The session ownership cannot be fake.

Next: [../10-cli/README.md](../10-cli/README.md)
