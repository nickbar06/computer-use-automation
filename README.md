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

Requires Node 20+. Replay of the hand-authored JSON in `capabilities/` does **not** need a model key. Discover does (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env`; placeholders only in `.env.example`).

```text
npm install
npx playwright install chromium
cp .env.example .env   # only if you will run discover
```

`serve` starts the local CoreLink mock at http://127.0.0.1:8765/ (frameset; Find Member lives in the workspace frame). Discover and replay start that mock themselves when the target is localhost and `/health` is down.

Demo path: discover a goal (writes `capabilities/discovered.json` by default), then replay that artifact. Reviewers can skip discover and replay `capabilities/lookup_savings.json` directly.

## Locked decisions

- **Language:** TypeScript on Node 20+ (not Python)
- **Target:** local mock “CoreLink” core-servicing console we control (not ParaBank, not a public cart)
- **Perception / replay targeting:** accessibility tree (role + name, table cells). Screenshots are evidence. CSS is last-resort only.
- **Architecture:** one CLI process + local mock server. No queues, no Kubernetes.
- **HITL:** real pause/resume of the same live session via `SurfaceDriver.pauseForHuman`; mock the pretty operator UI.
- **Surface boundary:** core describes WHAT (observe/act/result). Playwright is one adapter. Discovery, replay, artifacts, and policy never take `Page` or `Locator`.
- **Four layers:** capability → vendor product (`corelink.servicing`) → tenant overlay (labels/emoji) → surface adapter. CoreLink is not a driver type.

## Layout

```
docs/           why and how
tasks/          numbered implementation tickets
src/            implementation
capabilities/   saved artifacts + tenant overlays
evidence/       required demo logs
policies/       allowlist JSON
```

## Assignment deliverables

The grading contract is [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md). Closing it requires pasted validation on [docs/tasks/2026-09-21-computer-use-takehome.md](docs/tasks/2026-09-21-computer-use-takehome.md).

Reviewers still expect:

- public GitHub repo
- `/README.md` — setup + demo commands (this file)
- `/REPORT.md` — seven required headings
- `/evidence/` — discovery run + replay run + one exceptional replay
