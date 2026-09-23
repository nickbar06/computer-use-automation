import type { NamedLocator } from "../artifact/schema.ts";

export type Observation = {
  location: string;
  title: string;
  a11y_snapshot: string;
  visible_text: string;
  screenshot_path?: string;
  regions?: { name: string; location?: string }[];
};

export type CanonicalAction = {
  type: "navigate" | "click" | "fill" | "press" | "extract" | "select" | "dismiss" | "wait";
  locator?: NamedLocator;
  text?: string;
  key?: string;
  location?: string;
  timeout_ms?: number;
};

export interface SurfaceDriver {
  observe(screenshotPath?: string): Promise<Observation>;
  act(action: CanonicalAction): Promise<void>;
  extract(locator: NamedLocator): Promise<string>;
  currentLocation(): string;
  pauseForHuman(): Promise<void>;
  resume(): Promise<Observation>;
  close(): Promise<void>;
}
