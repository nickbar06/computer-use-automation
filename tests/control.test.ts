import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { compileArtifact } from "../src/artifact/compile.ts";
import type { CanonicalAction, Observation, SurfaceDriver } from "../src/domain/surface.ts";
import { SessionControl } from "../src/escalate/control.ts";
import { ROOT } from "../src/paths.ts";
import { ReplayExecutor } from "../src/replay/executor.ts";
import { loadPolicy } from "../src/safety/policy.ts";

class FakeDriver implements SurfaceDriver {
  paused = false;
  resumed = 0;
  visible = "Member Snapshot";
  location = "http://127.0.0.1:8765/";

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
    if (action.type === "navigate" && action.location) this.location = action.location;
  }

  async extract(): Promise<string> {
    return "";
  }

  currentLocation(): string {
    return this.location;
  }

  async pauseForHuman(): Promise<void> {
    this.paused = true;
  }

  async resume(): Promise<Observation> {
    this.resumed += 1;
    return this.observe();
  }

  async close(): Promise<void> {}
}

function miniIrreversible() {
  return compileArtifact({
    artifactId: "open_subaccount",
    name: "open",
    description: "open",
    goal: "open",
    entryUrl: "http://127.0.0.1:8765/",
    inputs: { member_id: "12345" },
    turns: [
      { action: "click", role: "button", name: "Open Sub-Account", irreversible: true },
      { action: "done", text: "Member Snapshot" },
    ],
    policy: loadPolicy(),
  });
}

test("requestIntervention sets owner human and writes files", () => {
  const root = mkdtempSync(join(tmpdir(), "cua-hitl-"));
  try {
    const session = SessionControl.create(root);
    session.requestIntervention({ why: "irreversible without confirm", step_id: "s04_open" });
    assert.equal(session.owner, "human");
    assert.ok(existsSync(join(session.directory, "intervention.json")));
    const operator = readFileSync(join(session.directory, "OPERATOR.txt"), "utf8");
    assert.match(operator, /already-open window/i);
    assert.match(operator, /operator resume --session/);
    assert.match(operator, new RegExp(session.session_id));
    const control = JSON.parse(readFileSync(join(session.directory, "control.json"), "utf8"));
    assert.equal(control.owner, "human");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("delayed signalResume makes waitForResume true and owner agent", async () => {
  const root = mkdtempSync(join(tmpdir(), "cua-hitl-"));
  try {
    const session = SessionControl.create(root);
    session.requestIntervention({ why: "stuck" });
    setTimeout(() => session.signalResume("done"), 40);
    const ok = await session.waitForResume(1000, 20);
    assert.equal(ok, true);
    assert.equal(session.owner, "agent");
    assert.ok(existsSync(join(session.directory, "RESUME")));
    const reloaded = SessionControl.load(session.session_id, root);
    assert.equal(reloaded.owner, "agent");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("src/escalate does not import playwright", () => {
  const files = readdirSync(join(ROOT, "src/escalate")).filter((name) => name.endsWith(".ts"));
  assert.ok(files.length > 0);
  for (const name of files) {
    const src = readFileSync(join(ROOT, "src/escalate", name), "utf8");
    assert.doesNotMatch(src, /from ["']playwright["']/);
    assert.doesNotMatch(src, /\bPage\b|\bLocator\b|\bBrowser\b/);
  }
});

test("irreversible without confirm writes intervention and owner stays human", async () => {
  const root = mkdtempSync(join(tmpdir(), "cua-hitl-"));
  const evidence = join(root, "evidence");
  const driver = new FakeDriver();
  try {
    const result = await new ReplayExecutor({
      driver,
      artifact: miniIrreversible(),
      policy: loadPolicy(),
      evidenceDir: evidence,
      sessionRoot: root,
      operatorTimeoutMs: 0,
    }).run({ member_id: "12345" });
    assert.equal(result.status, "needs_intervention");
    assert.equal(result.control?.owner, "human");
    assert.ok(result.control?.session_id);
    assert.equal(driver.paused, true);
    assert.equal(driver.resumed, 0);
    const sessionDir = join(root, result.control!.session_id);
    assert.ok(existsSync(join(sessionDir, "intervention.json")));
    const intervention = JSON.parse(readFileSync(join(sessionDir, "intervention.json"), "utf8"));
    assert.match(intervention.why, /irreversible/);
    assert.equal(intervention.capability, "open_subaccount");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("autoResume flips owner back to agent without a second browser", async () => {
  const root = mkdtempSync(join(tmpdir(), "cua-hitl-"));
  const evidence = join(root, "evidence");
  const driver = new FakeDriver();
  try {
    const result = await new ReplayExecutor({
      driver,
      artifact: miniIrreversible(),
      policy: loadPolicy(),
      evidenceDir: evidence,
      sessionRoot: root,
      autoResume: true,
      operatorTimeoutMs: 200,
    }).run({ member_id: "12345" });
    assert.equal(result.status, "success");
    assert.equal(driver.paused, true);
    assert.equal(driver.resumed, 1);
    assert.ok(existsSync(join(root, readdirSync(root).find((n) => n !== "evidence")!, "human_actions.json")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Playwright resume does not launch a second browser", () => {
  const src = readFileSync(join(ROOT, "src/surface/playwright/driver.ts"), "utf8");
  const resume = src.slice(src.indexOf("async resume("));
  assert.doesNotMatch(resume, /chromium\.launch|newPage\(/);
});
