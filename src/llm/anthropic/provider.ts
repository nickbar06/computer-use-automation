import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool } from "@anthropic-ai/sdk/resources/messages";
import type { LlmMessage, LlmProvider, LlmRequest, LlmResponse, LlmTool } from "../../domain/llm.ts";

export type AnthropicProviderOptions = {
  apiKey: string;
  model?: string;
};

export class AnthropicProvider implements LlmProvider {
  readonly id = "anthropic";
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(options: AnthropicProviderOptions) {
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.model = options.model?.trim() || "claude-sonnet-4-5";
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const toolName = request.tool_choice?.name ?? "act";
    const system = request.messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      temperature: request.temperature ?? 0,
      ...(system ? { system } : {}),
      messages: toAnthropicMessages(request.messages),
      tools: request.tools.map(toAnthropicTool),
      tool_choice: { type: "tool", name: toolName },
    });
    const tool_calls = response.content
      .filter((block) => block.type === "tool_use")
      .map((block) => ({
        name: block.name,
        arguments: asObject(block.input),
      }));
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    return { text: text || undefined, tool_calls };
  }
}

function toAnthropicTool(tool: LlmTool): Tool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters as Tool["input_schema"],
  };
}

function toAnthropicMessages(messages: LlmMessage[]): MessageParam[] {
  const out: MessageParam[] = [];
  for (const message of messages) {
    if (message.role === "system") continue;
    if (message.role === "tool") {
      out.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: message.tool_call_id ?? "unknown",
            content: message.content,
          },
        ],
      });
      continue;
    }
    out.push({ role: message.role, content: message.content });
  }
  return out;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
