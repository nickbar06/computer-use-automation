import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { compileArtifact } from "../src/artifact/compile.ts";
import { capabilityArtifactSchema, reviewSummary } from "../src/artifact/schema.ts";
import { ROOT } from "../src/paths.ts";
import { loadPolicy } from "../src/safety/policy.ts";

test("compile parameterizes fill 12345 as $inputs.member_id", () => {
  const artifact = compileArtifact({
    artifactId: "lookup_savings",
    name: "Look up savings balance",
    description: "compiled from a fake transcript",
    goal: "Look up savings balance",
    entryUrl: "http://127.0.0.1:8765/",
    inputs: { member_id: "12345" },
    turns: [
      {
        action: "fill",
        thought: "type the member id",
        role: "textbox",
        name: "Member ID",
        text: "12345",
      },
      { action: "click", role: "button", name: "Find Member", thought: "submit" },
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

  const parsed = capabilityArtifactSchema.parse(artifact);
  const fill = parsed.steps.find((step) => step.action === "fill");
  assert.ok(fill);
  assert.equal(fill.input_from, "$inputs.member_id");
  assert.equal(fill.value, undefined);
  assert.ok(!JSON.stringify(fill).includes("12345"));

  assert.equal(parsed.steps[0]?.id, "s00_open");
  assert.equal(parsed.steps[0]?.action, "navigate");
  assert.equal(parsed.app.vendor_product, "corelink.servicing");
  assert.equal(parsed.app.surface_kind, "legacy_web");
  assert.ok(parsed.locators.notice_ok);
  assert.ok(parsed.locators.member_id);
  assert.equal(parsed.locators.savings_balance?.strategies[0]?.kind, "table_cell");
  assert.equal(parsed.checkpoints[0]?.kind, "text_present");
  if (parsed.checkpoints[0]?.kind === "text_present") {
    assert.equal(parsed.checkpoints[0].text, "Member Snapshot");
  }
  assert.equal(parsed.contract.outputs[0]?.name, "savings_balance");
  assert.equal(parsed.contract.outputs[0]?.type, "money");
  assert.match(reviewSummary(parsed), /inputs: member_id/);
  assert.match(reviewSummary(parsed), /outputs: savings_balance/);
  assert.match(reviewSummary(parsed), /steps: 4/);
});

test("compile.ts does not import playwright", () => {
  const src = readFileSync(join(ROOT, "src/artifact/compile.ts"), "utf8");
  assert.doesNotMatch(src, /from ["']playwright["']/);
});
