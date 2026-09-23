import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { compileArtifact } from "../src/artifact/compile.ts";
import type { CapabilityArtifact } from "../src/artifact/schema.ts";
import type { CanonicalAction, Observation, SurfaceDriver } from "../src/domain/surface.ts";
import { ROOT } from "../src/paths.ts";
import { bindInputs, ReplayExecutor } from "../src/replay/executor.ts";
import { loadPolicy } from "../src/safety/policy.ts";

class FakeDriver implements SurfaceDriver {
  readonly acts: CanonicalAction[] = [];
  visible: string;
  location = "http://127.0.0.1:8765/";

  constructor(visible: string) {
    this.visible = visible;
  }

  async observe(screenshotPath?: string): Promise<Observation> {
    return {
      location: this.location,
      title: "CoreLink",
      a11y_snapshot: this.visible,
      visible_text: this.visible,
      screenshot_path: screenshotPath,
    };
  }

  async act(action: CanonicalAction): Promise<void> {
    this.acts.push(action);
    if (action.type === "navigate") {
      this.location = action.location ?? this.location;
    }
    if (action.type === "click" && action.locator?.name === "System notice OK") {
      this.visible = "Member Snapshot\nSavings 4250.00";
    }
    if (action.type === "click" && action.locator?.strategies.some((s) => s.kind === "role_name" && s.name === "Find Member")) {
      this.visible = this.visible.includes("99999") ? "No matching member" : "Member Snapshot\nSavings 4250.00";
    }
    if (action.type === "fill" && action.text) {
      this.visible = `${this.visible}\nfilled:${action.text}`;
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

function miniLookup(): CapabilityArtifact {
  return compileArtifact({
    artifactId: "lookup_savings",
    name: "lookup",
    description: "lookup",
    goal: "lookup",
    entryUrl: "http://127.0.0.1:8765/",
    inputs: { member_id: "12345" },
    turns: [
      { action: "fill", role: "textbox", name: "Member ID", text: "12345" },
      { action: "click", role: "button", name: "Find Member" },
      {
        action: "extract",
        row_header: "Savings",
        column_header: "Balance",
        extract_to: "savings_balance",
        extracted: "4250.00",
      },
      { action: "done", text: "Member Snapshot" },
    ],
    policy: loadPolicy(),
  });
}

test("No matching member is business_outcome MEMBER_NOT_FOUND", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cua-replay-"));
  const driver = new FakeDriver("No matching member");
  try {
    const result = await new ReplayExecutor({
      driver,
      artifact: miniLookup(),
      policy: loadPolicy(),
      evidenceDir: dir,
    }).run({ member_id: "99999" });
    assert.equal(result.status, "business_outcome");
    assert.equal(result.outcome_code, "MEMBER_NOT_FOUND");
    assert.ok(!result.outputs.savings_balance);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("System Notice recover click continues and records recovered[]", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cua-replay-"));
  const driver = new FakeDriver("System Notice");
  try {
    const result = await new ReplayExecutor({
      driver,
      artifact: miniLookup(),
      policy: loadPolicy(),
      evidenceDir: dir,
    }).run({ member_id: "12345" });
    assert.ok(result.recovered.includes("SYSTEM_NOTICE"));
    assert.ok(driver.acts.some((act) => act.locator?.name === "System notice OK"));
    assert.equal(result.status, "success");
    assert.equal(result.outputs.savings_balance, "4250.00");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("missing required input throws before act", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cua-replay-"));
  const driver = new FakeDriver("");
  try {
    assert.throws(() => bindInputs(miniLookup(), {}), /missing required input: member_id/);
    await assert.rejects(
      () =>
        new ReplayExecutor({
          driver,
          artifact: miniLookup(),
          policy: loadPolicy(),
          evidenceDir: dir,
        }).run({}),
      /missing required input: member_id/,
    );
    assert.equal(driver.acts.length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("src/replay does not import playwright", () => {
  const files = readdirSync(join(ROOT, "src/replay")).filter((name) => name.endsWith(".ts"));
  assert.ok(files.length > 0);
  for (const name of files) {
    const src = readFileSync(join(ROOT, "src/replay", name), "utf8");
    assert.doesNotMatch(src, /from ["']playwright["']/);
    assert.doesNotMatch(src, /\bPage\b|\bLocator\b|\bBrowser\b/);
  }
});
