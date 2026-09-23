import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT } from "../src/paths.ts";
import {
  SafetyError,
  checkAction,
  checkNavigation,
  isIrreversibleName,
  loadPolicy,
  originOf,
} from "../src/safety/policy.ts";
import { dumpsRedacted, redactJson, redactText } from "../src/safety/redact.ts";

test("loadPolicy reads policies/default.json from ROOT", () => {
  const policy = loadPolicy();
  assert.equal(policy.policy_id, "default");
  assert.deepEqual(policy.allowed_origins, ["http://127.0.0.1:8765", "http://localhost:8765"]);
  assert.ok(policy.allowed_actions.includes("click"));
  assert.equal(policy.redaction_profile, "financial_pii");
  assert.equal(JSON.parse(readFileSync(join(ROOT, "policies/default.json"), "utf8")).policy_id, "default");
});

test("navigation to https://evil.example/ throws", () => {
  assert.equal(originOf("http://127.0.0.1:8765/member/12345"), "http://127.0.0.1:8765");
  checkNavigation("http://127.0.0.1:8765/member/12345");
  checkNavigation("http://localhost:8765/");
  assert.throws(() => checkNavigation("https://evil.example/"), SafetyError);
});

test("click is allowed and download is not", () => {
  checkAction("click");
  assert.throws(() => checkAction("download"), SafetyError);
});

test("Open Sub-Account is irreversible, Find Member is not", () => {
  assert.equal(isIrreversibleName("Open Sub-Account"), true);
  assert.equal(isIrreversibleName("Find Member"), false);
});

test("sample string with account + SSN + password is redacted", () => {
  const sample = [
    "acct 400012345678",
    "ssn 123-45-6789",
    "password: hunter2",
    "Name: Jane Doe",
  ].join("\n");
  const out = redactText(sample);
  assert.match(out, /\[ACCOUNT\]/);
  assert.match(out, /\[SSN\]/);
  assert.match(out, /password: \[REDACTED\]/);
  assert.match(out, /Name: \[NAME\]/);
  assert.doesNotMatch(out, /400012345678/);
  assert.doesNotMatch(out, /123-45-6789/);
  assert.doesNotMatch(out, /hunter2/);
  assert.doesNotMatch(out, /Jane Doe/);
  assert.match(
    redactText(`"observed": "Member name: JANE M\\nMember Snapshot"`),
    /Member name: \[NAME\]/,
  );
});

test("redactJson replaces sensitive keys", () => {
  const out = redactJson({
    token: "abc",
    member_name: "Pat",
    note: "acct 400012345678",
  }) as Record<string, string>;
  assert.equal(out.token, "[REDACTED]");
  assert.equal(out.member_name, "[REDACTED]");
  assert.equal(out.note, "acct [ACCOUNT]");
});

test("dumpsRedacted writes a redacted file", () => {
  const dir = mkdtempSync(join(tmpdir(), "cua-safety-"));
  const path = join(dir, "sessions", "note.txt");
  try {
    dumpsRedacted(path, "password=supersecret 123-45-6789");
    const text = readFileSync(path, "utf8");
    assert.match(text, /password=\[REDACTED\]/);
    assert.match(text, /\[SSN\]/);
    assert.doesNotMatch(text, /supersecret/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("src/safety does not import playwright", () => {
  const policy = readFileSync(join(ROOT, "src/safety/policy.ts"), "utf8");
  const redact = readFileSync(join(ROOT, "src/safety/redact.ts"), "utf8");
  assert.doesNotMatch(policy, /from ["']playwright["']/);
  assert.doesNotMatch(redact, /from ["']playwright["']/);
});
