# Lesson 02 — A UI with no test IDs

**Read:** LEARN items 8 and 9 in [LEARN.md](../../docs/LEARN.md) (frames + accessibility tree).

**Do:** `npm run cua -- serve`. Open `http://127.0.0.1:8765/` in a real browser. View source. Confirm there are no `id=` attributes. DevTools → Accessibility pane on Member ID: read **role** and **name**.

**Check you understand:**

- Which frame contains the form (`workspace`).
- What happens if you POST member `99999` vs `12345`.
- How `?fault=dialog` is a recoverable condition, not a locator failure.
- Why Riverside / Northlake / Lakecrest are **tenants** of `corelink.servicing`, not three surfaces.

Next: [../03-artifact-schema/README.md](../03-artifact-schema/README.md)
