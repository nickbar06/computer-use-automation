import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT } from "../src/paths.ts";

test("ROOT exists", () => {
  assert.ok(existsSync(ROOT));
});

test("REPORT.md has the seven required headings in order", () => {
  const report = readFileSync(join(ROOT, "REPORT.md"), "utf8");
  const headings = [...report.matchAll(/^# (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, [
    "Architecture",
    "Artifact schema",
    "Determinism & error handling",
    "Heterogeneity & multi-tenant",
    "Escalation & handoff",
    "Safety",
    "Cuts",
  ]);
});
