# ADR 07: Safety is a policy file, not comments

**Date**: 2026-09-21  
**Status**: Accepted  
**Deciders**: assignment §3.4  
**Slice**: [tasks/04-safety](../../../tasks/04-safety.md)

## Context

Regulated financial data even on a mock: do not persist secrets or raw PII. Agents must not wander off localhost.

## Options considered

### A: `policies/default.json` + `checkNavigation` / `checkAction` / irreversible name list + regex redaction on logs

**Advantages**: reviewable; driver can fail closed before `goto`.  
**Disadvantages**: regex redaction will miss novel fields; screenshots still show balances.

### B: Trust the prompt to stay on the mock

**Advantages**: none that survive a tool call.

## Decision

Option A. Origins: `http://127.0.0.1:8765`, `http://localhost:8765`. Irreversible substrings include `open sub-account`. Replay of irreversible requires `--confirm` or HITL (ADR 06).

## Consequences

Tests must cover `https://evil.example` and redaction of account-like digit runs.

## Validation plan

Unit tests in Task 04/11. No API keys in git or tracking files.
