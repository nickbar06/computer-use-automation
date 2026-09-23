import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { LlmMessage, LlmProvider, LlmRequest, LlmResponse, LlmTool } from "../../domain/llm.ts";

export type OpenAiProviderOptions = {
  apiKey: string;
  baseURL?: string;
  model?: string;
};

export class OpenAiProvider implements LlmProvider {
  readonly id = "openai";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: OpenAiProviderOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      ...(options.baseURL ? { baseURL: options.baseURL } : {}),
    });
    this.model = options.model?.trim() || "gpt-4.1-mini";
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const toolName = request.tool_choice?.name ?? "act";
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: request.temperature ?? 0,
      messages: request.messages.map(toOpenAiMessage),
      tools: request.tools.map(toOpenAiTool),
      tool_choice: { type: "function", function: { name: toolName } },
    });
    const message = completion.choices[0]?.message;
    const tool_calls = (message?.tool_calls ?? [])
      .filter((call) => call.type === "function")
      .map((call) => ({
        name: call.function.name,
        arguments: parseArguments(call.function.arguments),
      }));
    return {
      text: message?.content ?? undefined,
      tool_calls,
    };
  }
}

function toOpenAiMessage(message: LlmMessage): ChatCompletionMessageParam {
  if (message.role === "tool") {
    return {
      role: "tool",
      content: message.content,
      tool_call_id: message.tool_call_id ?? "unknown",
    };
  }
  return { role: message.role, content: message.content };
}

function toOpenAiTool(tool: LlmTool): ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

function parseArguments(raw: string): Record<string, unknown> {
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("OpenAI tool arguments must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}
