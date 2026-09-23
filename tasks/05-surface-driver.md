---
id: "05"
title: Playwright surface driver
status: todo
optional: false
---

# Task 05 — Surface driver

The driver is an adapter. Artifacts, replay, discovery, policy, and results never import Playwright.

This slice is `surface_kind: legacy_web` (frameset, tables). A modern `web` app would use the same adapter. A `desktop` app would be a second adapter on the same `SurfaceDriver` port — do not build it. CoreLink is the **target app**, not a driver type.

## Files

- `src/domain/surface.ts` — `Observation`, `CanonicalAction`, `SurfaceDriver` (the **port**; no `playwright` import)
- `src/surface/playwright/driver.ts` — `PlaywrightDriver` implements `SurfaceDriver`; `LocatorError`
- `src/agent/actionFromLlm.ts` — maps the `act` tool payload to `CanonicalAction` (domain types only; not Playwright)

Do **not** put the port in `src/surface/base.ts`. The port is WHAT; the Playwright files are HOW.

## Observation (domain)

```ts
{
  location: string,           // URL on this web adapter; not page.url()'s type
  title: string,
  a11y_snapshot: string,      // compact, per region
  visible_text: string,
  screenshot_path?: string,
  regions?: { name: string; location?: string }[]  // frames/windows — not Frame objects
}
```

Do not require `frame_urls` or any Playwright type on this object.

## `SurfaceDriver` (domain)

```ts
observe(screenshotPath?: string): Promise<Observation>
act(action: CanonicalAction): Promise<void>
extract(locator: NamedLocator): Promise<string>
currentLocation(): string
pauseForHuman(): Promise<void>
resume(): Promise<Observation>
close(): Promise<void>
```

`PlaywrightDriver` may add `start()` (launch Chromium) as adapter lifecycle. Discover/replay only see the port.

## Playwright adapter (HOW)

- `start()` / `close()` — Chromium, viewport 1280×800, `headless` option
- `observe(screenshotPath?)` — walk frames internally
  - **Skip frames that contain a `<frameset>`** (no body; will hang if you `innerText` them)
  - Timeouts on `ariaSnapshot` / `innerText` ≤ 1500ms
  - Prefer workspace frame content
  - Fill `location` from the page URL string; put frame names/URLs in `regions`
- `act(action)` — `checkAction` / `checkNavigation` first (those take **strings**, not `Page`)
  - `navigate` → `goto` waitUntil `domcontentloaded` using `action.location`
  - `click` / `fill` / `select` / `press` / `dismiss` / `wait` / `extract`
- Resolve named locators internally — try strategies in order, frames in order: **`workspace` first**, then others
- `extract` — `innerText` of the resolved control
- `pauseForHuman()` — `context.tracing.start({ screenshots: true, snapshots: true })` on the **existing** context
- `resume()` — `tracing.stop` to `tracingDir/human_trace.zip` if set, then `observe()`

`Page`, `Locator`, and `Frame` stay inside this folder. Do not export them from the port.

## Locator strategies (adapter maps these)

- `role_name` → `frame.getByRole(role, { name })`
- `accessible_name` → `getByLabel`
- `text` → `getByText`
- `placeholder` → `getByPlaceholder`
- `css` last
- `table_cell` — **do not** assume the first table row is the header. Scan rows: when a row’s cells include an exact `column_header` and the first cell is not the `row_header`, remember that column index; then return the cell in the row whose first cell contains `row_header`. On the mock, the Balance header is on the **Product / Balance / Status** row, not “Member Snapshot”.

## Scripts

A throwaway is fine (delete later) or `npx tsx` snippet in comments: fill 12345, click Find Member, extract savings, print `4250.00`. The script may construct `PlaywrightDriver`; it must not pass `Page` into replay/discover (those do not exist yet).

## Acceptance

- [ ] `src/domain/surface.ts` has no `playwright` import
- [ ] Against the mock, resolve Member ID in the workspace frame (not the header frame)
- [ ] Extract savings for 12345 → `4250.00`
- [ ] Off-origin `navigate` throws `SafetyError` before `goto`
- [ ] Observe on `/` returns in well under 2s (frameset skip works)
- [ ] `npm test` still green (no new file required; Playwright replay tests wait for Task 11)

