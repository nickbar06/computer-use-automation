# Lesson 08 — Production is a workflow

**Read:** Error taxonomy in [ASSIGNMENT.md](../../docs/ASSIGNMENT.md). LEARN item 2 on workflows vs agents.

**Do:** Replay `12345` (success) and `99999` (business outcome). Time the happy path — it must be seconds, not minutes.

**Check you understand:**

- Handlers run against **visible text**, not HTTP status codes.
- `MEMBER_NOT_FOUND` is `business_outcome`, not `failed`.
- Recoverable interstitials are not a terminal status.
- Renamed/emoji buttons are overlay drift, not a reason to put the LLM back in replay.
- Replay takes `SurfaceDriver`. A fake in-memory driver is enough to unit-test handlers; Playwright is only required to prove locators against the mock.

Next: [../09-hitl/README.md](../09-hitl/README.md)
