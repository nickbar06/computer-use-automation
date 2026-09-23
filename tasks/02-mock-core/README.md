---
id: "02"
title: CoreLink mock core
status: done
completed: 2026-09-23
optional: false
---

# Task 02 — Hostile mock core

Build the only UI we will automate. It must look like a 2004 servicing screen: frameset, tables, **no `id` or `data-testid`**.

## Files

- `src/proxy/server.ts`
- `src/proxy` helpers only if needed; keep it one file if it stays under ~400 lines

## Behavior

**Bind:** `127.0.0.1:8765` by default. `listenMock(0)` must support ephemeral ports for tests.

**Pages:**

| Method | Path | What |
|---|---|---|
| GET | `/` | HTML 4 frameset: `hdr` → `/chrome/header`, `workspace` → `/lookup` |
| GET | `/chrome/header` | Navy bar: `CoreLink Servicing 7.4`, tenant brand, operator `T. BROOKS` |
| GET | `/lookup` | Nested table, `<label>Member ID<br><input name="member_id"></label>`, submit button |
| POST | `/lookup` | Redirect 303 to member, not_found, or denied |
| GET | `/member/:id` | Snapshot table (title row + Product/Balance/Status) + Open Sub-Account form |
| POST | `/member/:id/open` | Requires `amount`; 303 to `/confirm/:id` |
| GET | `/confirm/:id` | Text `Sub-account opened`, table with a fake account number |
| GET | `/errors/not_found` | Heading/text **`No matching member`** |
| GET | `/errors/denied` | Text **`Access denied`** |
| GET | `/health` | `{"ok":true}` |

**Members (hard-coded, fake):**

- `12345` — name `JANE M`, savings `4250.00`, checking `890.12`, status ok
- `22222` — ok, smaller balances
- `67890` — denied
- anything else — not found

**Tenants** via `?tenant=` or cookie `tenant=` — same vendor product, different chrome (this is overlay fixture data, not a second app):

- `riverside` (default): submit **Find Member**, brand Riverside Community CU
- `northlake`: submit **Search Member**, brand Northlake Credit Union
- `lakecrest`: submit **🔍 Search**, brand Lakecrest FCU (emoji-in-name drift; same `find_member` locator id)

**Faults** via `?fault=` or cookie `fault=`:

- `dialog` — lookup GET shows **System Notice** + button **OK** (GET back to `/lookup`)
- `validation` or empty member id — stay on lookup with **Member ID is required.**
- `not_found` — force not-found even for 12345
- `permission` — force denied
- `slow` — sleep ~2.2s on POST lookup
- `timeout` — lookup GET shows **Session expired**

Forms that load inside the frameset must use `target="workspace"`.

**Accessibility:** wrap inputs in `<label>` so the accessible name is `Member ID` / `Opening amount` without `aria-label` cheats being the only path (aria-label extra is ok). Submit is `<input type="submit" value="Find Member">` so the button name is the value.

**Export:** `createMockServer()`, `listenMock(port?, host?) => { origin, close }`, `mainServe()`.

## Tests (this slice)

`tests/mock.test.ts` — `listenMock(0)`, then HTTP (no Playwright):

- `GET /health` → `{ ok: true }`
- POST lookup `12345` eventually shows `4250.00` / Member Snapshot
- POST lookup `99999` shows `No matching member`
- `GET /?tenant=northlake` body includes `Search Member`
- `GET /?tenant=lakecrest` body includes `🔍 Search`

Close the server in `after`. `npm test` must still run Task 01’s smoke test.

## Wire

`cua serve` should call `mainServe` and stay alive.

## Acceptance

- [x] Browser: open `/`, see frameset, Find Member in workspace
- [x] POST 12345 → Member Snapshot with savings 4250.00
- [x] POST 99999 → “No matching member”
- [x] POST 67890 → “Access denied”
- [x] `/?tenant=northlake` button reads Search Member
- [x] `/?tenant=lakecrest` button accessible name is `🔍 Search`
- [x] `/?fault=dialog` shows System Notice
- [x] View source: no `id=` or `data-testid` on controls
- [x] `curl -s http://127.0.0.1:8765/health` → ok
- [x] `npm test` includes `tests/mock.test.ts` and stays green

## Lesson

This task’s lesson: [LESSON.md](LESSON.md).
