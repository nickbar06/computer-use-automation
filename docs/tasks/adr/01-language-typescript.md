# ADR 01: Language and runtime

**Date**: 2026-09-21  
**Status**: Accepted  
**Deciders**: scoping (user asked for Node)  
**Slice**: [tasks/01-scaffold](../../../tasks/01-scaffold/README.md)

## Context

Need a typed artifact schema, a Playwright driver, and a weekend-sized CLI. Reviewers will read the schema closely.

## Options considered

### A: TypeScript on Node 20+, Zod, Playwright, `tsx`, `node:test`

**Advantages**: artifact types are first-class; Playwright a11y locators are native; user requested Node.  
**Disadvantages**: must enable `.ts` imports (`allowImportingTsExtensions` + `noEmit`).

### B: Python, Pydantic, Playwright

**Advantages**: common for agent demos.  
**Disadvantages**: user asked to work in Node; would fight the request.

## Decision

Option A. CLI: `npm run cua -- …`. No extra web framework.

## Consequences

Task 01 creates `package.json` / `tsconfig.json` / `src/cli.ts` stub. Python must not reappear.

## Validation plan

`npx tsc --noEmit` clean; `npm run cua -- help` prints the four commands.
