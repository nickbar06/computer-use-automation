---
id: "04"
title: Safety allowlist and redaction
status: todo
optional: false
---

# Task 04 — Safety

Policy is data, not a comment in the driver. Assignment §3.4: allowlist, conservative irreversible, never persist secrets or raw PII in artifacts or logs.

## Files

- `policies/default.json`
- `src/safety/policy.ts` — `loadPolicy`, `checkNavigation`, `checkAction`, `isIrreversibleName`, `SafetyError`, `originOf`
- `src/safety/redact.ts` — `redactText`, `redactJson`, `dumpsRedacted`

## Policy JSON

```json
{
  "policy_id": "default",
  "allowed_origins": ["http://127.0.0.1:8765", "http://localhost:8765"],
  "allowed_actions": ["navigate", "click", "fill", "press", "extract", "select", "dismiss", "wait"],
  "irreversible_name_substrings": [
    "open sub-account",
    "open account",
    "submit opening",
    "confirm transfer",
    "post transaction"
  ],
  "redaction_profile": "financial_pii"
}
```

`checkNavigation(location: string)` compares `scheme://host` (no path). Throw `SafetyError` if missing. Policy never takes `Page`.

`isIrreversibleName` is case-insensitive substring match.

## Redaction

- Digit runs length 8–17 → `[ACCOUNT]`
- `\d{3}-\d{2}-\d{4}` → `[SSN]`
- `(api[_-]?key|token|password|secret)\s*[:=]\s*\S+` → value `[REDACTED]`
- Lines matching `Member name:` / `Name:` → `[NAME]`
- JSON keys `password`, `token`, `secret`, `ssn`, `name`, `member_name` → `[REDACTED]`

Apply `dumpsRedacted` to anything written under `evidence/` or `sessions/`.

## Tests (this slice)

`tests/safety.test.ts` — write it **now**, not in Task 11:

- navigation to `https://evil.example/` throws
- `click` allowed, `download` not
- `Open Sub-Account` is irreversible, `Find Member` is not
- sample string with account + SSN + password is redacted

`npm test` must still run smoke + mock + schema tests.

## Acceptance

- [ ] `tests/safety.test.ts` exists; `npm test` green
- [ ] `loadPolicy()` reads `policies/default.json` from `ROOT`
- [ ] Tests above pass
- [ ] `src/safety/` has no `playwright` import
- [ ] Driver/replay tasks call these functions **before** `act` / navigate on irreversible names

