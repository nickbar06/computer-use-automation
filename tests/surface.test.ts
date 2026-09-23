import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { actionFromLlm } from "../src/agent/actionFromLlm.ts";
import { ROOT } from "../src/paths.ts";

test("domain surface and actionFromLlm do not import playwright", () => {
  const surface = readFileSync(join(ROOT, "src/domain/surface.ts"), "utf8");
  const fromLlm = readFileSync(join(ROOT, "src/agent/actionFromLlm.ts"), "utf8");
  assert.doesNotMatch(surface, /from ["']playwright["']/);
  assert.doesNotMatch(fromLlm, /from ["']playwright["']/);
  assert.doesNotMatch(surface, /\bPage\b|\bLocator\b|\bBrowser\b|\bFrame\b|\bBrowserContext\b/);
});

test("actionFromLlm maps fill and table_cell payloads", () => {
  const fill = actionFromLlm({
    thought: "type the member id",
    action: "fill",
    role: "textbox",
    name: "Member ID",
    text: "12345",
  });
  assert.equal(fill.type, "fill");
  assert.equal(fill.text, "12345");
  assert.equal(fill.locator?.strategies[0]?.kind, "role_name");

  const extract = actionFromLlm({
    action: "extract",
    row_header: "Savings",
    column_header: "Balance",
  });
  assert.equal(extract.locator?.strategies[0]?.kind, "table_cell");
});

test("actionFromLlm rejects done and stuck", () => {
  assert.throws(() => actionFromLlm({ action: "done" }), /not a surface action/);
  assert.throws(() => actionFromLlm({ action: "stuck" }), /not a surface action/);
});
