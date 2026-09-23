# Computer-use automation (take-home)

interface.ai interview project: an LLM discovers a flow on a live UI, the run is compiled into a **typed capability artifact**, and production replay is deterministic (no model in the loop).

```text
cua — computer-use automation

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

Node 20+. Replay of the hand-authored JSON in `capabilities/` does **not** need a model key. Discover does (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env`; placeholders only in `.env.example`).

```text
npm install
npx playwright install chromium
cp .env.example .env   # only if you will run discover
```

Discover and replay start the local CoreLink mock when the target is localhost and `/health` is down. `serve` is optional.

## Demo

**Shipped artifacts (no key)** — this is the clone-and-run path:

```text
npm run cua -- replay capabilities/lookup_savings.json --input member_id=12345
npm run cua -- replay capabilities/lookup_savings.json --input member_id=99999
npm run cua -- replay capabilities/open_subaccount.json --input member_id=12345 --input amount=25.00
```

Expected: `success` / `4250.00`, then `business_outcome` / `MEMBER_NOT_FOUND`, then `needs_intervention` on `s04_open` (no `--confirm`, does not submit).

**Discover, then replay** (needs a key). Writes `capabilities/discovered.json` by default:

```text
npm run cua -- discover --goal "Look up savings balance" --input member_id=12345
npm run cua -- replay capabilities/discovered.json --input member_id=12345
```

Checked-in evidence: [evidence/README.md](evidence/README.md). Design write-up: [REPORT.md](REPORT.md).

## Locked decisions

- **Language:** TypeScript on Node 20+ (not Python)
- **Target:** local mock “CoreLink” core-servicing console (not ParaBank, not a public cart)
- **Locators:** accessibility role + name and table cells. Screenshots are evidence. CSS is last-resort only.
- **Architecture:** one CLI process + in-process mock. Core is `SurfaceDriver` (WHAT). Playwright is the first adapter (HOW).
- **HITL:** pause/resume of the **same** live session; `OPERATOR.txt` is the operator UI.
- **Four layers:** capability → vendor product (`corelink.servicing`) → tenant overlay → surface adapter. CoreLink is not a driver type.

## Layout

```
docs/           why and how
tasks/          numbered implementation tickets
src/            implementation
capabilities/   saved artifacts + tenant overlays
evidence/       discovery + replay + escalate
policies/       allowlist JSON
REPORT.md       seven required headings
```
