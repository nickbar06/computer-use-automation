# ADR 04: Do not use a vendor computer-use SDK as the artifact

**Date**: 2026-09-21  
**Status**: Accepted  
**Deciders**: scoping (schema is the evaluation center)  

## Context

OpenAI/Anthropic computer-use toolsets can drive a browser. Wrapping them would hide the thing reviewers grade: a typed, replayable capability.

## Options considered

### A: One structured tool `act`; compile the transcript into our JSON schema; replay never calls a model

**Advantages**: contract is ours; production path is a workflow.  
**Disadvantages**: we write the loop and compiler.

### B: Persist vendor CUA traces / coordinates as the capability

**Advantages**: less compiler work.  
**Disadvantages**: not reviewable as an agent-invocable contract; replay stays model-shaped.

## Decision

Option A. Discovery may use an `LlmProvider` (OpenAI SDK or Anthropic adapter). The stored artifact is schema 1.0 in `capabilities/`. Do not use Operator / computer-use as the capability format (ADR 11).

## Consequences

No dependency on `computer-use` tool names in replay. Fake discovery JSONL is a closure blocker.

## Validation plan

Compiled fill of `12345` becomes `$inputs.member_id`. Replay of the artifact uses zero model HTTP calls.
