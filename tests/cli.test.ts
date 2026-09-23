import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { CLI_HELP, loadReplayArtifact, main } from "../src/cli.ts";
import { ROOT } from "../src/paths.ts";

test("help text is printed verbatim and appears in README", async () => {
  const lines: string[] = [];
  const orig = console.log;
  console.log = (message?: unknown) => {
    lines.push(String(message ?? ""));
  };
  try {
    const code = await main(["help"]);
    assert.equal(code, 0);
  } finally {
    console.log = orig;
  }
  const help = lines.join("\n").trim();
  assert.equal(help, CLI_HELP.trim());
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  assert.ok(readme.includes(CLI_HELP.trim()), "README must contain CLI_HELP verbatim");
});

test("operator resume with a missing session fails clearly", async () => {
  const errors: string[] = [];
  const orig = console.error;
  console.error = (message?: unknown) => {
    errors.push(String(message ?? ""));
  };
  try {
    const code = await main(["operator", "resume", "--session", "does-not-exist"]);
    assert.equal(code, 1);
  } finally {
    console.error = orig;
  }
  assert.match(errors.join("\n"), /session not found: does-not-exist/);
});

test("loadReplayArtifact applies a tenant overlay without mutating the file", () => {
  const basePath = join(ROOT, "capabilities", "lookup_savings.json");
  const overlayPath = join(ROOT, "capabilities", "overlays", "northlake.json");
  const base = loadReplayArtifact(basePath);
  const overlaid = loadReplayArtifact(basePath, overlayPath);
  const find = base.locators.find_member?.strategies.find((s) => s.kind === "role_name");
  const patched = overlaid.locators.find_member?.strategies.find((s) => s.kind === "role_name");
  assert.equal(find && "name" in find ? find.name : undefined, "Find Member");
  assert.equal(patched && "name" in patched ? patched.name : undefined, "Search Member");
  assert.equal(overlaid.tenant_overlay?.tenant_id, "northlake");
});
