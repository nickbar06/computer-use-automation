# Computer-use automation (take-home)

I read the brief as two products sharing one contract, not an LLM that keeps clicking in production.

1. **Discover:** a model records a flow once on a live UI.
2. **Replay:** that recording is a typed capability. Invoke is deterministic: no model, structured results, same live session to a human when stuck.

Every Section 3 must-have is real or named under Cuts. Write-up: [REPORT.md](REPORT.md).

```text
cua: computer-use automation

Commands:
  serve [--port 8765] [--host 127.0.0.1]
  discover --goal "..." --input member_id=12345 [--target URL] [--out path] [--evidence dir] [--headed] [--start-mock]
  replay <artifact.json> --input k=v [--evidence dir] [--headed] [--confirm] [--overlay file] [--operator-timeout 180]
  operator resume --session <id>
  operator status --session <id>

--input is repeatable key=value.
--start-mock is on by default (use --no-start-mock to skip).
--auto-resume is tests/demos only.

Examples:
  npm run cua -- help
  npm run cua -- serve
  npm run cua -- discover --goal "Look up savings balance" --input member_id=12345
  npm run cua -- replay capabilities/lookup_savings.json --input member_id=12345
  npm run cua -- replay capabilities/lookup_savings.json --input member_id=99999
  npm run cua -- replay capabilities/open_subaccount.json --input member_id=12345 --input amount=25.00
  npm run cua -- operator resume --session <id>
  npm test
```

## Setup

Node 20+. Replay of the JSON in `capabilities/` does **not** need a model key. Discover does (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env`; placeholders only in `.env.example`).

```text
npm install
npx playwright install chromium
cp .env.example .env   # only if you will run discover
```

Discover and replay start the local CoreLink mock when the target is localhost and `/health` is down. `serve` is optional.

## Demo

**Shipped artifacts (no key).** Clone-and-run path:

```text
npm run cua -- replay capabilities/lookup_savings.json --input member_id=12345
npm run cua -- replay capabilities/lookup_savings.json --input member_id=99999
npm run cua -- replay capabilities/open_subaccount.json --input member_id=12345 --input amount=25.00
```

Expected: `success` / `4250.00`, then `business_outcome` / `MEMBER_NOT_FOUND`, then `needs_intervention` on `s04_open` (no `--confirm`, does not POST `/open`). The third command prints `operator resume --session <id>`. Default `--operator-timeout` is 0, so the CLI returns instead of waiting.

Mock members: `12345` ok, `99999` not found, `67890` denied. `--headed` watches the browser. `--confirm` on open-sub-account is the irreversible path.

**Discover, then replay** (needs a key). Writes `capabilities/discovered.json` by default:

```text
npm run cua -- discover --goal "Look up savings balance" --input member_id=12345
npm run cua -- replay capabilities/discovered.json --input member_id=12345
```

Checked-in runs: [evidence/README.md](evidence/README.md). `npm test` is the full proof, including overlay: Northlake without `capabilities/overlays/northlake.json` fails `Find Member`; Northlake / Lakecrest with the overlay extract `4250.00`.

## How I read the assignment

I built one working path (lookup and open-sub-account on a CoreLink-like console), not the full multi-institution, multi-surface platform. Types stay honest so a second surface or tenant is a new adapter or overlay, not a rewrite.

**CoreLink is a vendor product**, not the driver and not the bank. A `CoreLinkDriver` would lock discover and replay to that app. Keying artifacts on Riverside vs Northlake would re-record `lookup_savings` on every label change.

The capability is `lookup_savings`. Riverside / Northlake / Lakecrest share it (`Find Member` / `Search Member` / `🔍 Search`); an overlay patches locator **ids**. Unknown drift fails the locator or checkpoint and escalates. Clicking the first button would be a guess: a wrong-page success, or a money post.

If replay took a Playwright `Page`, a second surface would be a comment. The core is `SurfaceDriver`, `CanonicalAction`, `NamedLocator` in [`src/domain/surface.ts`](src/domain/surface.ts). Playwright is the first adapter ([`src/surface/playwright/`](src/surface/playwright/)). Discover and replay never import `playwright`. Discover talks to an `LlmProvider` ([`src/llm/openai/`](src/llm/openai/)); replay never gets one.

## Design decisions

**Local CoreLink mock.** Frameset, tables, three tenant skins. Controls have no CSS ids. `?fault=` can force a dialog, not-found, or timeout. Discover and replay drive it in a real browser.

**Accessibility locators, not coordinates.** Replay stores role + name and table cells. Discovery may use a screenshot; screenshots are evidence, not the locator.

**Replay has no model.** A model that “helps” on open-sub-account is a second, unreviewed policy. The artifact is the policy. `$inputs.member_id` is bound at invoke time.

**`MEMBER_NOT_FOUND` is `business_outcome`.** Recoverable dialogs append `recovered[]` and continue. `failed` is a hard miss. `needs_intervention` is stuck, checkpoint fail, or irreversible without `--confirm`.

**HITL is the same window.** A second browser would be a fake handoff. `pauseForHuman` keeps the live session; `OPERATOR.txt` is the operator UI; `operator resume` writes `RESUME`.

**Safety is an allowlist plus a confirm.** Origins are localhost:8765 only. Irreversible names need `--confirm` or a human. Logs are redacted; screenshots are not.

**One CLI process.** `serve` / `discover` / `replay` / `operator`. Composition root: [`src/cli.ts`](src/cli.ts). It is the only non-adapter file that constructs `PlaywrightDriver` or `resolveLlmProvider()`.

**What I cut.** Desktop adapter, pretty operator console, capability catalog, codegen, LLM recovery on replay, multi-run stability. Stretch: overlay runtime (Northlake fails without it; Northlake / Lakecrest succeed with it). Not a tenant database.

**Stack.** TypeScript, Node 20+, Playwright, Zod. ADRs: [docs/DECISIONS.md](docs/DECISIONS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Layout

```
src/            implementation (domain ports; Playwright and LLM SDKs isolated)
capabilities/   artifacts + tenant overlays
evidence/       live discover + replay + escalate
policies/       origin/action allowlist
docs/           architecture, decisions, glossary
REPORT.md       seven required headings
```

