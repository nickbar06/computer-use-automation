---
id: "01"
title: Node TypeScript scaffold
status: done
completed: 2026-09-23
optional: false
---

# Task 01 — Scaffold

Create a runnable Node 20+ TypeScript package with a CLI stub. No browser, no LLM.

## Files to create

- `package.json` — `"type": "module"`, Node `>=20`, scripts:
  - `"cua": "tsx src/cli.ts"`
  - `"test": "tsx --test tests/*.test.ts"`
  - `"typecheck": "tsc --noEmit"`
- dependencies: `playwright`, `zod`
- devDependencies: `typescript`, `tsx`, `@types/node`
- `tsconfig.json` — `strict`, `module`/`moduleResolution` `NodeNext`, `noEmit`, `allowImportingTsExtensions` (so `.ts` imports work under `tsx`)
- `src/paths.ts` — `ROOT` via `import.meta.url`, `DEFAULT_ORIGIN = "http://127.0.0.1:8765"`, `DEFAULT_PORT = 8765`
- `src/cli.ts` — `parseArgs` from `node:util`. Commands `help` and `serve` (serve can `console.log` and exit 0 for now, real server is Task 02). CLI will later be the composition root (construct `PlaywrightDriver`, pass `SurfaceDriver` into discover/replay). Do not put `Page` on a replay/discover stub.
- `tests/smoke.test.ts` — asserts `ROOT` exists (node:test). Later slices **add** files next to this one; do not replace the test script.

## Implementation notes

- Shebang not required; always run via `npm run cua -- ...`
- Load `.env` in `cli.ts` with a 15-line parser (no `dotenv` package). Do not overwrite existing `process.env`.
- Keep `src/cli.ts` from auto-running `main()` when imported: guard with `import.meta.url` vs `process.argv[1]`.

## Acceptance

- [x] `npm install` succeeds
- [x] `npx tsc --noEmit` is clean
- [x] `npm run cua -- help` prints the four future commands (`serve`, `discover`, `replay`, `operator`)
- [x] `.env` is gitignored; `.env.example` lists the keys from this repo’s example file
- [x] `npm test` passes (`tests/smoke.test.ts`)

## Mark done

`status: done` in frontmatter + [tasks/README.md](README.md).
