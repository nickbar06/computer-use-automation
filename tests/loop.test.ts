import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { DiscoveryRunner } from "../src/agent/loop.ts";
import type { CanonicalAction, Observation, SurfaceDriver } from "../src/domain/surface.ts";
import { ScriptedLlmProvider } from "../src/llm/fake.ts";
import { ROOT } from "../src/paths.ts";
import { loadPolicy } from "../src/safety/policy.ts";

class FakeDriver implements SurfaceDriver {
  readonly acts: CanonicalAction[] = [];
  location = "about:blank";
  visible = "Member ID\nFind Member";

  async observe(screenshotPath?: string): Promise<Observation> {
    return {
      location: this.location,
      title: "CoreLink Servicing 7.4",
      a11y_snapshot: `- textbox "Member ID"\n- button "Find Member"`,
      visible_text: this.visible,
      screenshot_path: screenshotPath,
    };
  }

  async act(action: CanonicalAction): Promise<void> {
    this.acts.push(action);
    if (action.type === "navigate" && action.location) this.location = action.location;
    if (action.type === "click") {
      this.visible = "Member Snapshot\nSavings 4250.00";
    }
  }

  async extract(): Promise<string> {
    return "4250.00";
  }

  currentLocation(): string {
    return this.location;
  }

  async pauseForHuman(): Promise<void> {}
  async resume(): Promise<Observation> {
    return this.observe();
  }
  async close(): Promise<void> {}
}

test("discovery loop fills, clicks, extracts, and stops on done", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cua-discover-"));
  const driver = new FakeDriver();
  const llm = new ScriptedLlmProvider([
    {
      thought: "fill member id from inputs password=shouldredact",
      action: "fill",
      role: "textbox",
      name: "Member ID",
      text: "12345",
    },
    { thought: "submit lookup", action: "click", role: "button", name: "Find Member" },
    {
      thought: "read savings",
      action: "extract",
      row_header: "Savings",
      column_header: "Balance",
      extract_to: "savings_balance",
    },
    { thought: "checkpoint visible", action: "done", text: "Member Snapshot" },
  ]);
  try {
    const result = await new DiscoveryRunner({
      driver,
      llm,
      policy: loadPolicy(),
      goal: "Look up savings balance",
      inputs: { member_id: "12345" },
      target: "http://127.0.0.1:8765/",
      evidenceDir: dir,
    }).run();

    assert.equal(result.stop, "done");
    assert.equal(result.outputs.savings_balance, "4250.00");
    assert.equal(driver.acts[0]?.type, "navigate");
    assert.equal(driver.acts[1]?.type, "fill");
    assert.equal(driver.acts[1]?.text, "12345");
    assert.equal(driver.acts[2]?.type, "click");

    const jsonl = readFileSync(join(dir, "turns.jsonl"), "utf8");
    assert.match(jsonl, /password=\[REDACTED\]/);
    assert.doesNotMatch(jsonl, /shouldredact/);
    assert.match(jsonl, /"action":"fill"/);

    assert.ok(result.artifact);
    const fill = result.artifact.steps.find((step) => step.action === "fill");
    assert.equal(fill?.input_from, "$inputs.member_id");
    const written = readFileSync(join(dir, "artifact.json"), "utf8");
    assert.match(written, /\$inputs\.member_id/);
    assert.doesNotMatch(written, /from ["']playwright["']/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("src/agent has no playwright or openai import", () => {
  const files = walkTs(join(ROOT, "src/agent"));
  assert.ok(files.length > 0);
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    assert.doesNotMatch(src, /from ["']playwright["']/);
    assert.doesNotMatch(src, /from ["']openai["']/);
    assert.doesNotMatch(src, /\bPage\b|\bLocator\b|\bBrowser\b/);
  }
});

function walkTs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walkTs(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}
