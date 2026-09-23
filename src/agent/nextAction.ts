import type { LlmMessage, LlmProvider, LlmTool } from "../domain/llm.ts";
import type { ActPayload } from "./actionFromLlm.ts";

export type { ActPayload };

export const ACT_TOOL: LlmTool = {
  name: "act",
  description:
    "Take one UI action, or stop. Prefer role + accessible name. Never invent CSS ids.",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["thought", "action"],
    properties: {
      thought: { type: "string", description: "Why this action" },
      action: {
        type: "string",
        enum: ["click", "fill", "press", "extract", "select", "wait", "dismiss", "done", "stuck"],
      },
      role: { type: "string" },
      name: { type: "string" },
      text: { type: "string" },
      key: { type: "string" },
      extract_to: { type: "string" },
      row_header: { type: "string" },
      column_header: { type: "string" },
      risk: { type: "string", enum: ["safe", "irreversible"] },
      reason: { type: "string" },
    },
  },
};

export async function nextAction(llm: LlmProvider, messages: LlmMessage[]): Promise<ActPayload> {
  const response = await llm.complete({
    messages,
    tools: [ACT_TOOL],
    tool_choice: { name: "act" },
    temperature: 0,
  });
  const call = response.tool_calls.find((item) => item.name === "act") ?? response.tool_calls[0];
  if (!call) throw new Error("model did not call act");
  return parseActPayload(call.arguments);
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseActPayload(args: Record<string, unknown>): ActPayload {
  if (typeof args.action !== "string" || args.action.length === 0) {
    throw new Error("act.action must be a string");
  }
  const risk = args.risk;
  return {
    thought: asOptionalString(args.thought),
    action: args.action,
    role: asOptionalString(args.role),
    name: asOptionalString(args.name),
    text: asOptionalString(args.text),
    key: asOptionalString(args.key),
    extract_to: asOptionalString(args.extract_to),
    row_header: asOptionalString(args.row_header),
    column_header: asOptionalString(args.column_header),
    risk: risk === "safe" || risk === "irreversible" ? risk : undefined,
    reason: asOptionalString(args.reason),
  };
}
