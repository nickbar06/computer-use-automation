import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { capabilityArtifactSchema, type CapabilityArtifact } from "../src/artifact/schema.ts";
import { ROOT } from "../src/paths.ts";
import { listenMock } from "../src/proxy/server.ts";
import { ReplayExecutor } from "../src/replay/executor.ts";
import { loadPolicy, type Policy } from "../src/safety/policy.ts";
import { PlaywrightDriver } from "../src/surface/playwright/driver.ts";

const mock = await listenMock(0);
after(() => mock.close());

const BUDGET_MS = 30_000;

function policyForMock(): Policy {
  const policy = loadPolicy();
  return { ...policy, allowed_origins: [...policy.allowed_origins, mock.origin] };
}

function bindOrigin(artifact: CapabilityArtifact, origin: string): CapabilityArtifact {
  const entry = `${origin}/`;
  return {
    ...artifact,
    app: { ...artifact.app, entry_url: entry, entry_url_template: entry },
    steps: artifact.steps.map((step) =>
      step.action === "navigate" ? { ...step, value: entry } : step,
    ),
    safety: {
      ...artifact.safety,
      allowed_origins: [...new Set([...artifact.safety.allowed_origins, origin])],
    },
  };
}

function loadBound(rel: string): CapabilityArtifact {
  return bindOrigin(
    capabilityArtifactSchema.parse(JSON.parse(readFileSync(join(ROOT, rel), "utf8"))),
    mock.origin,
  );
}

async function runReplay(
  artifact: CapabilityArtifact,
  inputs: Record<string, string>,
  extras: { confirmIrreversible?: boolean; operatorTimeoutMs?: number } = {},
) {
  const evidenceDir = mkdtempSync(join(tmpdir(), "cua-replay-live-"));
  const sessionRoot = mkdtempSync(join(tmpdir(), "cua-replay-sess-"));
  const policy = policyForMock();
  const driver = new PlaywrightDriver({ headless: true, policy });
  await driver.start();
  try {
    return await new ReplayExecutor({
      driver,
      artifact,
      policy,
      evidenceDir,
      sessionRoot,
      confirmIrreversible: extras.confirmIrreversible,
      operatorTimeoutMs: extras.operatorTimeoutMs ?? 0,
    }).run(inputs);
  } finally {
    await driver.close();
    rmSync(evidenceDir, { recursive: true, force: true });
    rmSync(sessionRoot, { recursive: true, force: true });
  }
}

test("lookup 12345 succeeds with savings 4250.00", { timeout: BUDGET_MS }, async () => {
  const started = Date.now();
  const result = await runReplay(loadBound("capabilities/lookup_savings.json"), {
    member_id: "12345",
  });
  const elapsed = Date.now() - started;
  assert.ok(elapsed < BUDGET_MS, `happy-path replay took ${elapsed}ms (frameset observe hang?)`);
  assert.equal(result.status, "success");
  assert.equal(result.outputs.savings_balance, "4250.00");
});

test("lookup 99999 is business_outcome MEMBER_NOT_FOUND", { timeout: BUDGET_MS }, async () => {
  const result = await runReplay(loadBound("capabilities/lookup_savings.json"), {
    member_id: "99999",
  });
  assert.equal(result.status, "business_outcome");
  assert.equal(result.outcome_code, "MEMBER_NOT_FOUND");
  assert.ok(!result.outputs.savings_balance);
});

test(
  "open_subaccount without confirm needs_intervention on irreversible step",
  { timeout: BUDGET_MS },
  async () => {
    const result = await runReplay(
      loadBound("capabilities/open_subaccount.json"),
      { member_id: "12345", amount: "25.00" },
      { operatorTimeoutMs: 400 },
    );
    assert.equal(result.status, "needs_intervention");
    assert.equal(result.step_id, "s04_open");
    assert.equal(result.control?.owner, "human");
    assert.ok(result.control?.session_id);
  },
);
