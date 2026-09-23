import type { Observation } from "../domain/surface.ts";

export const SYSTEM_PROMPT = `You operate a legacy core-servicing console (HTML frameset). You have one tool: act. One action per turn.

Rules:
- Prefer role + accessible name (e.g. role=textbox name=Member ID, role=button name=Find Member). Never invent CSS ids, classes, or data-testid.
- Read balances from a table cell: row_header=Savings, column_header=Balance. Do not assume the first table row is the header.
- Fill member ID and other fields from the provided inputs, not from memory.
- When the goal is met, call act with action=done and text set to a visible checkpoint phrase (for example "Member Snapshot").
- Money-moving actions (open account, transfer, post transaction) are irreversible; set risk=irreversible.
- Stay on the allowlisted origin. Do not navigate away.
- Use extract to read a value before done. If you cannot proceed, action=stuck with a reason.
`;

export function userTurn(args: {
  goal: string;
  inputs: Record<string, string>;
  step: number;
  maxSteps: number;
  observation: Observation;
  lastExtract?: string;
}): string {
  const inputs = Object.entries(args.inputs)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const visible = clip(args.observation.visible_text, 4000);
  const snap = clip(args.observation.a11y_snapshot, 6000);
  const extracted = args.lastExtract ? `\nLast extract: ${args.lastExtract}\n` : "";
  return `Goal: ${args.goal}
Inputs:
${inputs || "(none)"}
Step: ${args.step}/${args.maxSteps}
Location: ${args.observation.location}
Title: ${args.observation.title}
Visible text:
${visible}

Accessibility snapshot:
${snap}
${extracted}`;
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…[truncated]`;
}
