---
id: "03"
title: Artifact schema
status: done
completed: 2026-09-23
optional: false
---

# Task 03 — Typed capability artifact

This is the evaluation focal point. Design the schema on purpose, then freeze it at `schema_version: "1.0"`. A calling AI agent should be able to read the contract and invoke it — this is not a chat dump.

**Layers (ADR 10):** the JSON is a **capability** for vendor product `corelink.servicing` on `surface_kind: legacy_web`. Tenants do not get their own artifact. Overlay files patch locator *names* (including emoji).

## Files

- `src/artifact/schema.ts` — Zod schemas + inferred types + `applyOverlay()` + `reviewSummary()`
- `src/artifact/canonicalize.ts` — `parameterizeValue`, `canonicalizeUrl`, `bindUrlTemplate`
- `capabilities/lookup_savings.json` — **hand-authored** valid instance (compiler comes in Task 07)
- `capabilities/open_subaccount.json` — includes one `risk: "irreversible"` step
- `capabilities/overlays/northlake.json` — `find_member` name → `Search Member`
- `capabilities/overlays/lakecrest.json` — `find_member` name → `🔍 Search` (emoji is still `role_name`, not a new locator kind)

## Schema must include

- `schema_version` literal `"1.0"`
- `id`, `name`, `description`, `version`
- `app`: `vendor_product` (use `corelink.servicing`), `surface_kind`: `web | legacy_web | desktop`, `entry_url` (string **location** for this web slice — not a Playwright URL type), optional `entry_url_template`
- `contract.inputs[]` / `outputs[]` (`name`, `type`: `string | number | money`, `description`, `required`, `example`)
- `contract.business_outcomes[]` — at least `MEMBER_NOT_FOUND`, `PERMISSION_DENIED`, `VALIDATION_ERROR`
- `locators`: record of `{ name, description, strategies[] }`
- locator `kind`: `role_name | accessible_name | text | table_cell | placeholder | css`
- `role_name` uses `role` + `name`; `table_cell` uses `row_header` + `column_header`
- `steps[]`: `id`, `description`, `action` (`navigate|click|fill|press|extract|select|dismiss|wait`), `target`, `input_from` (e.g. `$inputs.member_id`), `value`, `extract_to`, `risk` (`safe|irreversible`), optional `wait`, optional `expected` condition
- `handlers[]`: `when` condition, `outcome` (`business_outcome|recoverable|hard_failure`), `code`, optional `recover_step`
- `checkpoints[]`: condition that must hold for success
- `safety`: allowed origins/actions, `irreversible_steps[]`
- overlay file: `tenant_id`, `vendor_product` (must match the artifact), `locators` partial record (same shape as artifact locators). `applyOverlay` deep-merges strategies onto the named locator ids only
- optional `tenant_overlay` on the artifact itself is allowed but CLI `--overlay` is the path reviewers will run

Condition `kind`: `text_present | text_absent | url_matches | locator_visible`.

`RunResult` / `RunStatus` live in `src/domain/result.ts` (or re-exported from schema). They must not mention Playwright. Locators in JSON are named strategies (`role_name`, `table_cell`, …). The adapter maps them; the artifact does not store `Page` or CSS-only required selectors.

## Hand-authored `lookup_savings.json` steps

1. `navigate` to `http://127.0.0.1:8765/`
2. `fill` locator `member_id` from `$inputs.member_id`
3. `click` locator `find_member` (role button, name Find Member)
4. `extract` locator `savings_balance` (`table_cell`, row `Savings`, column `Balance`) into `savings_balance`

Handlers must detect the exact mock strings from Task 02 (`No matching member`, `Access denied`, `Member ID is required.`, `System Notice` recoverable click OK, `Session expired` hard failure).

Checkpoint: text `Member Snapshot`.

`open_subaccount.json`: after lookup, fill `Opening amount` from `$inputs.amount`, click **Open Sub-Account** with `risk: irreversible`. Checkpoint: `Sub-account opened`.

## Tests (this slice)

`tests/schema.test.ts` — no Playwright:

- parse both shipped capability JSON files
- `applyOverlay(lookup, northlake)` → Find Member strategy name is `Search Member`; original object unchanged
- `applyOverlay(lookup, lakecrest)` → name is `🔍 Search`; locator id still `find_member`
- `canonicalizeUrl("http://127.0.0.1:8765/member/12345", { member_id: "12345" })` → path `/member/:member_id`
- `reviewSummary` includes `vendor_product` and `surface_kind`

`npm test` must still run smoke + mock tests.

## Acceptance

- [x] `tests/schema.test.ts` exists; `npm test` green
- [x] `capabilityArtifactSchema.parse` accepts both shipped JSON files
- [x] `applyOverlay(lookup, northlake)` changes the Find Member strategy name to `Search Member` without mutating the original object
- [x] `applyOverlay(lookup, lakecrest)` sets that name to `🔍 Search`; locator id remains `find_member`
- [x] `reviewSummary(artifact)` prints enough for a calling agent: id, vendor_product, surface_kind, inputs, outputs, step count, irreversible steps
- [x] `canonicalizeUrl("http://127.0.0.1:8765/member/12345", { member_id: "12345" })` → path `/member/:member_id`
- [x] No literal account numbers as artifact fields (the confirm page account number must not be an output you persist as PII)
- [x] `src/artifact/` has no `playwright` import

