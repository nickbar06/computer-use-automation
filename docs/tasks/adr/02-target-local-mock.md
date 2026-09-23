# ADR 02: Target application is a local mock

**Date**: 2026-09-21  
**Status**: Accepted  
**Deciders**: scoping (weekend + domain fit)  
**Slice**: [tasks/02-mock-core](../../../tasks/02-mock-core.md)

## Context

The brief requires a live UI. They will not give a real core. Public sites have ToS, rate limits, and uncontrolled errors.

## Options considered

### A: Local “CoreLink Servicing 7.4” mock

Frameset, tables, no test IDs, fake members, injectable faults, two tenant button labels.

**Advantages**: error taxonomy is scriptable; maps to bank back-office; no ToS.  
**Disadvantages**: we build the app we automate.

### B: ParaBank or a public cart demo

**Advantages**: less HTML to write.  
**Disadvantages**: flaky, weaker “no such member” story, ToS risk.

## Decision

Option A. Members: `12345` ok, `99999` not found, `67890` denied. Tenants: Riverside **Find Member**, Northlake **Search Member**, Lakecrest **🔍 Search**.

## Consequences

Task 02 is on the critical path before the driver. Do not automate a public bank.

## Validation plan

`GET /health` ok; POST lookup 12345 shows Member Snapshot; 99999 shows “No matching member”.
