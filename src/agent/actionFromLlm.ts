import type { LocatorStrategy, NamedLocator } from "../artifact/schema.ts";
import type { CanonicalAction } from "../domain/surface.ts";

export type ActPayload = {
  thought?: string;
  action: string;
  role?: string;
  name?: string;
  text?: string;
  key?: string;
  extract_to?: string;
  row_header?: string;
  column_header?: string;
  risk?: "safe" | "irreversible";
  reason?: string;
  location?: string;
};

const SURFACE_ACTIONS = new Set<CanonicalAction["type"]>([
  "navigate",
  "click",
  "fill",
  "press",
  "extract",
  "select",
  "dismiss",
  "wait",
]);

export function actionFromLlm(payload: ActPayload): CanonicalAction {
  if (!SURFACE_ACTIONS.has(payload.action as CanonicalAction["type"])) {
    throw new Error(`action ${payload.action} is not a surface action`);
  }
  return {
    type: payload.action as CanonicalAction["type"],
    locator: locatorFromPayload(payload),
    text: payload.text,
    key: payload.key,
    location: payload.location,
  };
}

function locatorFromPayload(payload: ActPayload): NamedLocator | undefined {
  const strategies: LocatorStrategy[] = [];
  if (payload.role && payload.name) {
    strategies.push({ kind: "role_name", role: payload.role, name: payload.name });
  } else if (payload.name) {
    strategies.push({ kind: "accessible_name", name: payload.name });
  }
  if (payload.row_header && payload.column_header) {
    strategies.push({
      kind: "table_cell",
      row_header: payload.row_header,
      column_header: payload.column_header,
    });
  }
  if (payload.text && payload.action !== "fill" && payload.action !== "select") {
    strategies.push({ kind: "text", text: payload.text });
  }
  if (strategies.length === 0) return undefined;
  return {
    name: payload.name ?? payload.text ?? payload.action,
    description: payload.thought ?? payload.reason ?? "",
    strategies,
  };
}
