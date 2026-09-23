import type { LlmProvider, LlmRequest, LlmResponse } from "../domain/llm.ts";

export class FakeLlmProvider implements LlmProvider {
  readonly id = "fake";

  constructor(private readonly response: LlmResponse) {}

  async complete(_request: LlmRequest): Promise<LlmResponse> {
    return this.response;
  }
}
