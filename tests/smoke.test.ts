import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { ROOT } from "../src/paths.ts";

test("ROOT exists", () => {
  assert.ok(existsSync(ROOT));
});
