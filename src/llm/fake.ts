import type { LlmProvider, LlmRequest, LlmResponse } from "../domain/llm.ts";

export class FakeLlmProvider implements LlmProvider {
  readonly id = "fake";

  constructor(private readonly response: LlmResponse) {}

  async complete(_request: LlmRequest): Promise<LlmResponse> {
    return this.response;
  }
}

export class ScriptedLlmProvider implements LlmProvider {
  readonly id = "fake";
  private index = 0;

  constructor(private readonly calls: Record<string, unknown>[]) {}

  async complete(_request: LlmRequest): Promise<LlmResponse> {
    const args = this.calls[Math.min(this.index, this.calls.length - 1)] ?? { action: "done" };
    this.index += 1;
    return { tool_calls: [{ name: "act", arguments: args }] };
  }
}
