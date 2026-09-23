# Task: CoreLink mock core

**Date**: 2026-09-23
**Status**: done
**Spec**: `tasks/02-mock-core/README.md`

---
> Validation Run must contain actual command output before status can be `done`.
---

## Original Request

Implement [README.md](README.md) in this folder.

## Restated Goal

Hostile frameset CoreLink mock on :8765: lookup, not-found, denied, open-sub-account, three tenant skins, injectable faults, no test IDs. `listenMock(0)` for tests. `cua serve` stays up.

### Success criteria

`/health` ok; POST 12345 → 4250.00 snapshot; 99999 → No matching member; northlake Search Member; lakecrest 🔍 Search; npm test green.

## Assumptions and Open Questions

| Question | Answer |
| -------- | ------ |
| GET `/` is a frameset — how can its body include Search Member? | HTML 4 `<noframes>` repeats the lookup form (tenant-aware). |

## Implementation Plan

1. Read spec + lesson
2. `src/proxy/server.ts` + wire `serve` + `tests/mock.test.ts`
3. Validate with curl + npm test

## Phase Checkpoints

| Phase | Status | What was completed | Evidence still missing |
| ----- | ------ | ------------------ | ---------------------- |
| Recon | Done | Spec + lesson | — |
| Implementation | Done | mock + serve + tests | — |
| Runtime verification | Done | curl + npm test | headed browser (no browser tools; HTML verified via curl) |
| Documentation and closure | Done | tracking + index | — |

## Progress Checklist

- [x] Spec README read
- [x] Lesson questions answered
- [x] Implementation complete
- [x] Spec Acceptance checkboxes ticked
- [x] Runtime verification recorded (real output)
- [x] Handoff summary written
- [x] Spec `status: done` + index checkbox in `tasks/README.md`

## Files Changed

| File | Change type | Notes |
| ---- | ----------- | ----- |
| `src/proxy/server.ts` | added | 278 lines; no Playwright |
| `src/cli.ts` | updated | `serve` calls `mainServe`, stays alive |
| `tests/mock.test.ts` | added | health, 12345, 99999, tenants, dialog |
| `README.md` | updated | serve URL |

## Validation Run

**Commands run**:

```text
npx tsc --noEmit
npm test
npm run cua -- serve
curl -sS http://127.0.0.1:8765/health
curl -sS -X POST -d 'member_id=12345' http://127.0.0.1:8765/lookup
curl -sS http://127.0.0.1:8765/member/12345
curl -sS -L -X POST -d 'member_id=99999' http://127.0.0.1:8765/lookup
```

**Output**:

```text
tsc: 0

✔ GET /health is ok
✔ POST lookup 12345 shows snapshot and savings
✔ POST lookup 99999 is no matching member
✔ POST lookup 67890 is access denied
✔ GET /?tenant=northlake includes Search Member
✔ GET /?tenant=lakecrest includes emoji search
✔ GET /?fault=dialog shows System Notice
✔ ROOT exists
ℹ tests 8
ℹ pass 8
ℹ fail 0

{"ok":true}

HTTP/1.1 303 See Other
location: /member/12345

... Member Snapshot ...
<td>Savings</td><td>4250.00</td> ...

<h1>No matching member</h1>
<p>Access denied</p>
Search Member
🔍 Search
System Notice
```

No `id=` or `data-testid` on `/`, `/lookup`, `/member/12345`, `/confirm/12345`.

## Open Issues / Blockers

None. Headed browser not available in this session; frameset + workspace form confirmed from HTML.

## Handoff Summary

**What was done**: Local CoreLink mock with frameset (`hdr` + `workspace`), members 12345 / 22222 / 67890, tenants riverside / northlake / lakecrest, faults dialog/validation/not_found/permission/slow/timeout. `cua serve` listens on 127.0.0.1:8765.

**How to verify it works**: `npm run cua -- serve` then open http://127.0.0.1:8765/ — Find Member is in the workspace frame. `npm test`.

**Key decisions made**: Tenant/fault via query or cookie so child frames inherit chrome. Dialog OK posts `fault=` to clear the cookie. Snapshot first row is the title “Member Snapshot”, not the Product/Balance/Status header.

**Known limitations or follow-up items**: Next is [Task 03](../03-artifact-schema/README.md).
