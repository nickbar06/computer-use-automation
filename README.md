# Computer-use automation (take-home)

interface.ai interview project: an LLM discovers a flow on a live UI, the run is compiled into a **typed capability artifact**, and production replay is deterministic (no model in the loop).

Task 01 scaffold is in place (`npm run cua -- help`). Later slices add the mock, discover, and replay. Work happens by opening the next task file, building what it specifies, then marking that file `status: done`.

```text
npm install
npm run cua -- help
npm run cua -- serve
# http://127.0.0.1:8765/  (frameset; Find Member in the workspace frame)
npm run cua -- discover --goal "Look up savings balance" --input member_id=12345
npm test
```

## How to work

1. Read [docs/README.md](docs/README.md) once (30–40 minutes).
2. Open [tasks/README.md](tasks/README.md). Start [Task 00](tasks/00-orientation.md).
3. Each task is a spec file in `tasks/` (`00-orientation.md`, `01-scaffold.md`, …).
4. When Acceptance is ticked, set spec frontmatter `status: done` and check the index.

Do not skip ahead. Later tasks assume earlier ones exist.

## Locked decisions

These are already chosen. Do not re-litigate them in a task unless a later task explicitly revisits them.

- **Language:** TypeScript on Node 20+ (not Python)
- **Target:** local mock “CoreLink” core-servicing console we control (not ParaBank, not a public cart)
- **Perception / replay targeting:** accessibility tree (role + name, table cells). Screenshots are evidence. CSS is last-resort only.
- **Architecture:** one CLI process + local mock server. No queues, no Kubernetes.
- **HITL:** real pause/resume of the same live session via `SurfaceDriver.pauseForHuman`; mock the pretty operator UI.
- **Surface boundary:** core describes WHAT (observe/act/result). Playwright is one adapter. Discovery, replay, artifacts, and policy never take `Page` or `Locator`.
- **Four layers:** capability → vendor product (`corelink.servicing`) → tenant overlay (labels/emoji) → surface adapter. CoreLink is not a driver type.

## Layout (what will exist when tasks are done)

```
docs/           why and how (you are here)
tasks/          numbered implementation tickets
src/            implementation (created by tasks)
capabilities/   saved artifacts
evidence/       required demo logs
policies/       allowlist JSON
```

## Assignment deliverables (end state)

The grading contract is [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md) (harness form). Closing it requires pasted validation on [docs/tasks/2026-09-21-computer-use-takehome.md](docs/tasks/2026-09-21-computer-use-takehome.md), not a claim that code exists.

Reviewers still expect:

- public GitHub repo
- `/README.md` — setup + demo commands
- `/REPORT.md` — seven required headings
- `/evidence/` — discovery run + replay run + one exceptional replay
