export type LlmMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
};

export type LlmTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type LlmRequest = {
  messages: LlmMessage[];
  tools: LlmTool[];
  tool_choice?: { name: string };
  temperature?: number;
};

export type LlmToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type LlmResponse = {
  text?: string;
  tool_calls: LlmToolCall[];
};

export interface LlmProvider {
  id: string;
  complete(request: LlmRequest): Promise<LlmResponse>;
}
