import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { NamedLocator } from "../../artifact/schema.ts";
import type { CanonicalAction, Observation, SurfaceDriver } from "../../domain/surface.ts";
import { checkAction, checkNavigation, loadPolicy, type Policy } from "../../safety/policy.ts";
import { LocatorError, frameHasFrameset, resolveNamedLocator } from "./locators.ts";

export { LocatorError };

const SNAPSHOT_MS = 1500;

export type PlaywrightDriverOptions = {
  headless?: boolean;
  tracingDir?: string;
  policy?: Policy;
};

export class PlaywrightDriver implements SurfaceDriver {
  private readonly headless: boolean;
  private readonly tracingDir?: string;
  private readonly policy: Policy;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private tracing = false;

  constructor(options: PlaywrightDriverOptions = {}) {
    this.headless = options.headless ?? true;
    this.tracingDir = options.tracingDir;
    this.policy = options.policy ?? loadPolicy();
  }

  async start(): Promise<void> {
    this.browser = await chromium.launch({ headless: this.headless });
    this.context = await this.browser.newContext({ viewport: { width: 1280, height: 800 } });
    this.page = await this.context.newPage();
  }

  async close(): Promise<void> {
    if (this.tracing && this.context) {
      await this.context.tracing.stop().catch(() => undefined);
      this.tracing = false;
    }
    await this.page?.close().catch(() => undefined);
    await this.context?.close().catch(() => undefined);
    await this.browser?.close().catch(() => undefined);
    this.page = undefined;
    this.context = undefined;
    this.browser = undefined;
  }

  currentLocation(): string {
    return this.requirePage().url();
  }

  async observe(screenshotPath?: string): Promise<Observation> {
    const page = this.requirePage();
    const regions: { name: string; location?: string }[] = [];
    const chunks: { name: string; snap: string; text: string }[] = [];

    for (const frame of page.frames()) {
      const name = frame.name() || (frame === page.mainFrame() ? "main" : "unnamed");
      let location: string | undefined;
      try {
        location = frame.url();
      } catch {
        location = undefined;
      }
      regions.push({ name, location });
      if (await frameHasFrameset(frame)) continue;

      let snap = "";
      let text = "";
      try {
        snap = await frame.locator("body").ariaSnapshot({ timeout: SNAPSHOT_MS });
      } catch {
        snap = "";
      }
      try {
        text = await frame.locator("body").innerText({ timeout: SNAPSHOT_MS });
      } catch {
        text = "";
      }
      chunks.push({ name, snap, text });
    }

    const ordered = [
      ...chunks.filter((chunk) => chunk.name === "workspace"),
      ...chunks.filter((chunk) => chunk.name !== "workspace"),
    ];

    if (screenshotPath) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    return {
      location: page.url(),
      title: await page.title(),
      a11y_snapshot: ordered.map((chunk) => `[${chunk.name}]\n${chunk.snap}`).join("\n\n"),
      visible_text: ordered.map((chunk) => chunk.text).filter(Boolean).join("\n"),
      screenshot_path: screenshotPath,
      regions,
    };
  }

  async act(action: CanonicalAction): Promise<void> {
    const page = this.requirePage();
    checkAction(action.type, this.policy);

    if (action.type === "navigate") {
      if (!action.location) throw new Error("navigate requires location");
      checkNavigation(action.location, this.policy);
      await page.goto(action.location, { waitUntil: "domcontentloaded" });
      await this.settleWorkspace();
      return;
    }

    if (action.type === "wait") {
      await page.waitForTimeout(action.timeout_ms ?? 250);
      return;
    }

    if (!action.locator) {
      if (action.type === "press" && action.key) {
        await page.keyboard.press(action.key);
        return;
      }
      throw new LocatorError(`${action.type} requires a locator`);
    }

    const target = await resolveNamedLocator(page.frames(), action.locator);
    switch (action.type) {
      case "click":
      case "dismiss": {
        const previous = page.frame({ name: "workspace" })?.url();
        await target.click();
        await this.settleWorkspace(previous);
        break;
      }
      case "fill":
        await target.fill(action.text ?? "");
        break;
      case "select":
        await target.selectOption(action.text ?? "");
        break;
      case "press":
        await target.press(action.key ?? "Enter");
        break;
      case "extract":
        await target.innerText({ timeout: SNAPSHOT_MS });
        break;
    }
  }

  async extract(locator: NamedLocator): Promise<string> {
    const target = await resolveNamedLocator(this.requirePage().frames(), locator);
    return (await target.innerText({ timeout: SNAPSHOT_MS })).trim();
  }

  async pauseForHuman(): Promise<void> {
    const context = this.requireContext();
    await context.tracing.start({ screenshots: true, snapshots: true });
    this.tracing = true;
  }

  async resume(): Promise<Observation> {
    if (this.tracing && this.context) {
      if (this.tracingDir) {
        mkdirSync(this.tracingDir, { recursive: true });
        await this.context.tracing.stop({ path: join(this.tracingDir, "human_trace.zip") });
      } else {
        await this.context.tracing.stop();
      }
      this.tracing = false;
    }
    return this.observe();
  }

  private async settleWorkspace(previousUrl?: string): Promise<void> {
    const workspace = this.requirePage().frame({ name: "workspace" });
    if (!workspace) return;
    if (previousUrl) {
      await workspace
        .waitForURL((url) => url.href !== previousUrl, { timeout: 4000 })
        .catch(() => undefined);
    }
    await workspace.waitForLoadState("domcontentloaded").catch(() => undefined);
  }

  private requirePage(): Page {
    if (!this.page) throw new Error("PlaywrightDriver.start() has not been called");
    return this.page;
  }

  private requireContext(): BrowserContext {
    if (!this.context) throw new Error("PlaywrightDriver.start() has not been called");
    return this.context;
  }
}
