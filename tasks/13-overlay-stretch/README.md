---
id: "13"
title: Tenant overlay stretch
status: todo
optional: true
---

# Task 13 — Overlay (optional)

Only after Task 12 is `done`. Pick **this** stretch (PDF §8 canonicalization / cross-tenant reuse), not a catalog API or codegen.

## Why

Hundreds of tenants, ~20 apps, many on the same vendor product. Re-recording per tenant is the failure mode the assignment is fishing for. Label and emoji changes are the same class of drift.

## Do

1. Mock already has `?tenant=northlake` (Search Member) and `?tenant=lakecrest` (`🔍 Search`). Keep that.
2. Overlay JSON already specified in Task 03 (`northlake.json`, `lakecrest.json`).
3. CLI `--overlay` already specified in Task 10.
4. Add `tests/overlay.test.ts` (Playwright + `listenMock(0)` + `?tenant=`):
   - Base artifact against Northlake **fails** to click Find Member (or HITL) — not a wrong-page success
   - Northlake + `northlake.json` → lookup 12345 succeeds
   - Lakecrest + `lakecrest.json` → lookup 12345 succeeds (emoji name)
   `npm test` must still run the Task 11 suite.
5. In REPORT heading 4, describe overlay vs re-record, and what happens when names diverge (checkpoint/locator fail → HITL, not silent wrong click).
6. Canonicalization is already in `canonicalize.ts`; mention `/member/:member_id` in the report if you emit it on compile.

Do **not** add a tenant database, queue, or per-bank capability catalog.

## Acceptance

- [ ] `tests/overlay.test.ts` exists; `npm test` green
- [ ] Test: Northlake skin + overlay → success
- [ ] Test: Northlake skin + no overlay → locator failure or HITL, not a wrong-page success
- [ ] Test: Lakecrest skin + emoji overlay → success
- [ ] REPORT heading 4 updated
- [ ] No extra services, queues, or tenant database

If you skip this task, leave `status: todo` and mention it under Cuts instead. Schema + REPORT still tell the story.

## Lesson

This task’s lesson: [LESSON.md](LESSON.md).

## Mark done

Set `status: done` in frontmatter and check this task in [tasks/README.md](../README.md).
