---
id: "07"
title: Compile transcript into a capability
status: todo
optional: false
---

# Task 07 — Compiler

Turn a successful discovery transcript into the Task 03 schema. Production must not store the chat. Emit a **capability** for `corelink.servicing`, not a tenant-specific recording. Canonicalize member URLs so two tenants can share the same steps.

## Files

- `src/artifact/compile.ts` — `compileArtifact({ artifactId, name, description, goal, entryUrl, inputs, turns, policy })`

Compiler is domain: transcript + policy → JSON. No `Page`, no `playwright` import. `entryUrl` is a string location.

## Compilation rules

- Always emit step `s00_open` navigate to `canonicalizeUrl(entryUrl, inputs)`
- Skip `done` / `stuck` as executable steps
- `fill` whose `text` equals an input example → `input_from: "$inputs.<name>"`, no literal value
- Build locators from `role`/`name`/`row_header`/`column_header` with fallbacks (role_name, accessible_name, text). Table cell first when both headers present
- Copy `risk: irreversible` onto the step; collect those ids into `safety.irreversible_steps`
- `extract_to` becomes an output param (`type: money` if the name contains `balance`)
- Always attach the **same default handlers** as the hand-authored lookup artifact (not-found, permission, validation, interstitial recover click `notice_ok`, session expired)
- Always include locator `notice_ok` (button OK)
- Checkpoint text: last `done.text`, else `Balance`, else `Member`
- `app.vendor_product` default `corelink.servicing`, `surface_kind: legacy_web`
- Copy policy origins/actions onto `artifact.safety`

## Tests (this slice)

Extend `tests/schema.test.ts` (or add `tests/compile.test.ts`):

- Fake transcript: fill text `"12345"` with `inputs.member_id=12345` → compiled step uses `$inputs.member_id`, no literal `12345` on the fill
- Compiled JSON parses with `capabilityArtifactSchema`

`npm test` stays green (prior files unchanged).

## Acceptance

- [ ] Compile assertions above pass under `npm test`
- [ ] Given a fill of `"12345"` with `inputs.member_id=12345`, the compiled step uses `$inputs.member_id`
- [ ] Compiled JSON parses with `capabilityArtifactSchema`
- [ ] `reviewSummary(artifact)` prints inputs/outputs/step counts
- [ ] Discovery runner writes `evidence/artifact.json` via `dumpsRedacted`
- [ ] `src/artifact/compile.ts` has no `playwright` import

## Lesson

This task’s lesson: [LESSON.md](LESSON.md).
