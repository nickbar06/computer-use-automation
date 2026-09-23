import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import type { CapabilityArtifact } from "../src/artifact/schema.ts";
import { loadReplayArtifact } from "../src/cli.ts";
import { ROOT } from "../src/paths.ts";
import { listenMock } from "../src/proxy/server.ts";
import { ReplayExecutor } from "../src/replay/executor.ts";
import { loadPolicy, type Policy } from "../src/safety/policy.ts";
import { PlaywrightDriver } from "../src/surface/playwright/driver.ts";

const mock = await listenMock(0);
after(() => mock.close());

const BUDGET_MS = 30_000;
const LOOKUP = join(ROOT, "capabilities", "lookup_savings.json");

function policyForMock(): Policy {
  const policy = loadPolicy();
  return { ...policy, allowed_origins: [...policy.allowed_origins, mock.origin] };
}

function bindTenant(artifact: CapabilityArtifact, tenant: "northlake" | "lakecrest"): CapabilityArtifact {
  const entry = `${mock.origin}/?tenant=${tenant}`;
  return {
    ...artifact,
    app: { ...artifact.app, entry_url: entry, entry_url_template: entry },
    steps: artifact.steps.map((step) =>
      step.action === "navigate" ? { ...step, value: entry } : step,
    ),
    safety: {
      ...artifact.safety,
      allowed_origins: [...new Set([...artifact.safety.allowed_origins, mock.origin])],
    },
  };
}

async function runReplay(artifact: CapabilityArtifact) {
  const evidenceDir = mkdtempSync(join(tmpdir(), "cua-overlay-"));
  const sessionRoot = mkdtempSync(join(tmpdir(), "cua-overlay-sess-"));
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
      operatorTimeoutMs: 0,
    }).run({ member_id: "12345" });
  } finally {
    await driver.close();
    rmSync(evidenceDir, { recursive: true, force: true });
    rmSync(sessionRoot, { recursive: true, force: true });
  }
}

test(
  "Northlake without overlay fails the Find Member locator (not a wrong-page success)",
  { timeout: BUDGET_MS },
  async () => {
    const result = await runReplay(bindTenant(loadReplayArtifact(LOOKUP), "northlake"));
    assert.notEqual(result.status, "success");
    assert.ok(result.status === "failed" || result.status === "needs_intervention");
    assert.ok(!result.outputs.savings_balance);
    assert.doesNotMatch(result.observed ?? "", /4250\.00/);
  },
);

test("Northlake + northlake.json lookup 12345 succeeds", { timeout: BUDGET_MS }, async () => {
  const artifact = bindTenant(
    loadReplayArtifact(LOOKUP, join(ROOT, "capabilities", "overlays", "northlake.json")),
    "northlake",
  );
  const find = artifact.locators.find_member?.strategies.find((s) => s.kind === "role_name");
  assert.equal(find && "name" in find ? find.name : undefined, "Search Member");
  const result = await runReplay(artifact);
  assert.equal(result.status, "success");
  assert.equal(result.outputs.savings_balance, "4250.00");
});

test("Lakecrest + lakecrest.json lookup 12345 succeeds (emoji name)", { timeout: BUDGET_MS }, async () => {
  const artifact = bindTenant(
    loadReplayArtifact(LOOKUP, join(ROOT, "capabilities", "overlays", "lakecrest.json")),
    "lakecrest",
  );
  const find = artifact.locators.find_member?.strategies.find((s) => s.kind === "role_name");
  assert.equal(find && "name" in find ? find.name : undefined, "🔍 Search");
  const result = await runReplay(artifact);
  assert.equal(result.status, "success");
  assert.equal(result.outputs.savings_balance, "4250.00");
});
