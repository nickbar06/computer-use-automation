import type { NamedLocator } from "../artifact/schema.ts";

/**
 * WHAT the core sees after observe. Shared by every capability, every surface.
 * `location` is a string: URL on web / legacy_web; window or app id on desktop.
 * Do not put Playwright page or URL objects here.
 */
export type Observation = {
  location: string;
  title: string;
  a11y_snapshot: string;
  visible_text: string;
  screenshot_path?: string;
  regions?: { name: string; location?: string }[];
};

/**
 * WHAT a capability step asks for. Same enum on artifacts, policy, and `driver.act`.
 * A desktop adapter implements these — it does not invent a second action set.
 */
export type CanonicalAction = {
  type: "navigate" | "click" | "fill" | "press" | "extract" | "select" | "dismiss" | "wait";
  locator?: NamedLocator;
  text?: string;
  key?: string;
  location?: string;
  timeout_ms?: number;
};

/**
 * HOW one frontend perceives and acts. Discover and replay take this port, never a Playwright page object.
 *
 * Future surface uses of the same capability JSON:
 * - `legacy_web` (this mock) and `web` → PlaywrightDriver
 * - `desktop` → a sibling adapter (OS accessibility), same `observe` / `act` / `extract` / pause
 *
 * Swap the driver at the CLI. Do not fork the capability schema.
 */
export interface SurfaceDriver {
  observe(screenshotPath?: string): Promise<Observation>;
  act(action: CanonicalAction): Promise<void>;
  extract(locator: NamedLocator): Promise<string>;
  currentLocation(): string;
  pauseForHuman(): Promise<void>;
  resume(): Promise<Observation>;
  close(): Promise<void>;
}

/*
 * Same capability JSON. Different HOW. Construct one at the CLI.

 * class PlaywrightDriver implements SurfaceDriver    // surface_kind: legacy_web | web
 *   observe()        frames + aria snapshot + inner text
 *   act(click|fill)  role+name / table cell → DOM
 *   extract()        cell or control inner text
 *   currentLocation  URL string
 *   pause / resume   same browser context (do not launch a second one)
 *
 * class ModernWebDriver extends PlaywrightDriver     // surface_kind: web (optional later)
 *   same contract; no frameset; SPA waits instead of frame settle
 *
 * class DesktopDriver implements SurfaceDriver       // surface_kind: desktop  (not built)
 *   observe()        OS accessibility tree + window title
 *   act(click|fill)  same NamedLocator strategies → AXPress / set value
 *   extract()        AX value / name
 *   currentLocation  window or app id string
 *   pause / resume   same OS session / focused window
 *
 * ReplayExecutor({ driver, artifact }) — pick the class that matches artifact.app.surface_kind.
 */
