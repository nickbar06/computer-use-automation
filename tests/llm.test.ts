import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { nextAction } from "../src/agent/nextAction.ts";
import { FakeLlmProvider } from "../src/llm/fake.ts";
import { resolveLlmProvider } from "../src/llm/resolve.ts";
import { ROOT } from "../src/paths.ts";

test("FakeLlmProvider nextAction parses thought and action", async () => {
  const llm = new FakeLlmProvider({
    tool_calls: [
      {
        name: "act",
        arguments: {
          thought: "type the member id from inputs",
          action: "fill",
          role: "textbox",
          name: "Member ID",
          text: "12345",
        },
      },
    ],
  });
  const payload = await nextAction(llm, [{ role: "user", content: "lookup savings" }]);
  assert.equal(payload.thought, "type the member id from inputs");
  assert.equal(payload.action, "fill");
  assert.equal(payload.name, "Member ID");
  assert.equal(payload.text, "12345");
});

test("resolveLlmProvider with empty env throws the missing-key message", () => {
  assert.throws(() => resolveLlmProvider({}), /set OPENAI_API_KEY or ANTHROPIC_API_KEY/);
});

test("resolveLlmProvider picks openai or anthropic from env without calling a host", () => {
  assert.equal(resolveLlmProvider({ OPENAI_API_KEY: "sk-test" }).id, "openai");
  assert.equal(resolveLlmProvider({ ANTHROPIC_API_KEY: "sk-ant-test" }).id, "anthropic");
  assert.equal(
    resolveLlmProvider({
      LLM_PROVIDER: "anthropic",
      OPENAI_API_KEY: "sk-test",
      ANTHROPIC_API_KEY: "sk-ant-test",
    }).id,
    "anthropic",
  );
});

test("src/agent and src/domain do not import vendor LLM SDKs", () => {
  const files = [...walkTs(join(ROOT, "src/agent")), ...walkTs(join(ROOT, "src/domain"))];
  assert.ok(files.length > 0);
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    assert.doesNotMatch(src, /from ["']openai["']/);
    assert.doesNotMatch(src, /from ["']@anthropic-ai\/sdk["']/);
  }
});

function walkTs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walkTs(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}
