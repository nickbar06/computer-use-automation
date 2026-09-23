---
id: "00"
title: Orientation
status: todo
optional: false
---

# Task 00 — Orientation

No code. Goal: you can explain the take-home in one paragraph without looking at the PDF.

## Why this exists

The reviewers grade judgment. If you cannot say why discovery and replay are different, later tasks will produce a scraper with an LLM bolted on.

## Read (in order)

1. [docs/ASSIGNMENT.md](../docs/ASSIGNMENT.md) (harness-form parent task: restated goal, success table, validation floor)
2. [docs/tasks/2026-09-21-computer-use-takehome.md](../docs/tasks/2026-09-21-computer-use-takehome.md) (program tracking)
3. [docs/DECISIONS.md](../docs/DECISIONS.md)
4. [docs/GLOSSARY.md](../docs/GLOSSARY.md)
5. [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
6. [docs/LEARN.md](../docs/LEARN.md) items 1 and 2

## Acceptance

- [ ] You can list the seven REPORT headings from memory (see ASSIGNMENT.md)
- [ ] You can state the four result classes: success, business_outcome, recoverable (non-terminal), hard failure / needs_intervention
- [ ] You know the stack is TypeScript + Playwright + Zod, target is a local mock, locators are a11y-first
- [ ] You can say why `replay(page: Page, …)` is wrong: core describes WHAT (`SurfaceDriver`); Playwright is HOW (ADR 09)
- [ ] You can name the four layers: capability, vendor product (CoreLink), tenant overlay (labels/emoji), surface (`web` / `legacy_web` / `desktop`)
- [ ] You know they grade design → loop → errors → HITL → generalization → safety (PDF §7), not feature count
- [ ] You know Task 13 is optional and must not start before Task 12

## Mark done

Set `status: done` above and check this task in [tasks/README.md](README.md).
