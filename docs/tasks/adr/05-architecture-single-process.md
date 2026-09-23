# ADR 05: Single-process CLI

**Date**: 2026-09-21  
**Status**: Accepted  
**Deciders**: scoping (brief says not to reward queues)  
**Slice**: [tasks/10-cli](../../../tasks/10-cli/README.md)

## Context

Need serve / discover / replay / operator. Weekend time-box. Reviewers punish premature platform.

## Options considered

### A: One Node process; mock may auto-listen on 8765; sessions as files under `sessions/`

**Advantages**: clone-and-run; HITL is a file poll on the live browser.  
**Disadvantages**: no multi-tenant control plane (out of scope).

### B: Queue + worker + API + operator web app

**Advantages**: looks like production.  
**Disadvantages**: exactly what the brief says not to build.

## Decision

Option A. Commands in [DECISIONS.md](../../DECISIONS.md).

## Consequences

`operator resume` writes `RESUME` in the session directory of the still-running replay process.

## Validation plan

`replay` of lookup works with the mock auto-started and no extra services in `docker-compose`.
