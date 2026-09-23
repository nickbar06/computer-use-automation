import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { canonicalizeUrl } from "../src/artifact/canonicalize.ts";
import {
  applyOverlay,
  capabilityArtifactSchema,
  reviewSummary,
  tenantOverlaySchema,
} from "../src/artifact/schema.ts";
import { ROOT } from "../src/paths.ts";

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

function roleName(artifact: ReturnType<typeof capabilityArtifactSchema.parse>, id: string): string {
  const locator = artifact.locators[id];
  assert.ok(locator);
  const strategy = locator.strategies.find((s) => s.kind === "role_name");
  assert.ok(strategy && strategy.kind === "role_name");
  return strategy.name;
}

test("parses shipped lookup and open_subaccount capabilities", () => {
  const lookup = capabilityArtifactSchema.parse(readJson("capabilities/lookup_savings.json"));
  const open = capabilityArtifactSchema.parse(readJson("capabilities/open_subaccount.json"));
  assert.equal(lookup.id, "lookup_savings");
  assert.equal(open.id, "open_subaccount");
  assert.equal(lookup.app.vendor_product, "corelink.servicing");
  assert.equal(lookup.app.surface_kind, "legacy_web");
  assert.ok(lookup.contract.business_outcomes.includes("MEMBER_NOT_FOUND"));
  assert.equal(open.steps.find((s) => s.id === "s04_open")?.risk, "irreversible");
  assert.ok(!JSON.stringify(open.contract.outputs).includes("4000"));
});

test("applyOverlay northlake and lakecrest do not mutate the base", () => {
  const lookup = capabilityArtifactSchema.parse(readJson("capabilities/lookup_savings.json"));
  const northlake = tenantOverlaySchema.parse(readJson("capabilities/overlays/northlake.json"));
  const lakecrest = tenantOverlaySchema.parse(readJson("capabilities/overlays/lakecrest.json"));
  const before = roleName(lookup, "find_member");
  assert.equal(before, "Find Member");

  const withNorth = applyOverlay(lookup, northlake);
  assert.equal(roleName(withNorth, "find_member"), "Search Member");
  assert.equal(roleName(lookup, "find_member"), "Find Member");

  const withLake = applyOverlay(lookup, lakecrest);
  assert.equal(roleName(withLake, "find_member"), "🔍 Search");
  assert.ok(withLake.locators.find_member);
  assert.equal(roleName(lookup, "find_member"), "Find Member");
});

test("canonicalizeUrl parameterizes member path", () => {
  assert.equal(
    canonicalizeUrl("http://127.0.0.1:8765/member/12345", { member_id: "12345" }),
    "/member/:member_id",
  );
});

test("reviewSummary names vendor product and surface", () => {
  const lookup = capabilityArtifactSchema.parse(readJson("capabilities/lookup_savings.json"));
  const text = reviewSummary(lookup);
  assert.match(text, /vendor_product: corelink\.servicing/);
  assert.match(text, /surface_kind: legacy_web/);
  assert.match(text, /id: lookup_savings/);
  assert.match(text, /inputs: member_id/);
  assert.match(text, /outputs: savings_balance/);
  assert.match(text, /steps: 4/);
});

test("artifact sources do not import playwright", () => {
  const schema = readFileSync(join(ROOT, "src/artifact/schema.ts"), "utf8");
  const canon = readFileSync(join(ROOT, "src/artifact/canonicalize.ts"), "utf8");
  assert.doesNotMatch(schema, /from ["']playwright["']/);
  assert.doesNotMatch(canon, /from ["']playwright["']/);
});
