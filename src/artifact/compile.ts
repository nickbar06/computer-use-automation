import type { Policy } from "../safety/policy.ts";
import { canonicalizeUrl, parameterizeValue } from "./canonicalize.ts";
import {
  capabilityArtifactSchema,
  type CapabilityArtifact,
  type Handler,
  type LocatorStrategy,
  type NamedLocator,
  type Step,
} from "./schema.ts";

export type CompileTurn = {
  action: string;
  thought?: string;
  role?: string;
  name?: string;
  text?: string;
  key?: string;
  extract_to?: string;
  row_header?: string;
  column_header?: string;
  risk?: "safe" | "irreversible";
  irreversible?: boolean;
  extracted?: string;
};

export type CompileArtifactArgs = {
  artifactId: string;
  name: string;
  description: string;
  goal: string;
  entryUrl: string;
  inputs: Record<string, string>;
  turns: CompileTurn[];
  policy: Policy;
};

const NOTICE_OK: NamedLocator = {
  name: "System notice OK",
  description: "Dismiss the recoverable System Notice interstitial",
  strategies: [{ kind: "role_name", role: "button", name: "OK" }],
};

export const DEFAULT_HANDLERS: Handler[] = [
  {
    when: { kind: "text_present", text: "No matching member" },
    outcome: "business_outcome",
    code: "MEMBER_NOT_FOUND",
  },
  {
    when: { kind: "text_present", text: "Access denied" },
    outcome: "business_outcome",
    code: "PERMISSION_DENIED",
  },
  {
    when: { kind: "text_present", text: "Member ID is required." },
    outcome: "business_outcome",
    code: "VALIDATION_ERROR",
  },
  {
    when: { kind: "text_present", text: "System Notice" },
    outcome: "recoverable",
    code: "SYSTEM_NOTICE",
    recover_step: {
      id: "r_notice_ok",
      description: "Dismiss System Notice",
      action: "click",
      target: "notice_ok",
      risk: "safe",
    },
  },
  {
    when: { kind: "text_present", text: "Session expired" },
    outcome: "hard_failure",
    code: "SESSION_EXPIRED",
  },
];

export function compileArtifact(args: CompileArtifactArgs): CapabilityArtifact {
  const locators: Record<string, NamedLocator> = { notice_ok: NOTICE_OK };
  const steps: Step[] = [
    {
      id: "s00_open",
      description: "Open the application",
      action: "navigate",
      value: canonicalizeUrl(args.entryUrl, args.inputs),
      risk: "safe",
    },
  ];
  const irreversible_steps: string[] = [];
  const outputs: CapabilityArtifact["contract"]["outputs"] = [];
  let doneText: string | undefined;

  let n = 1;
  for (const turn of args.turns) {
    if (turn.action === "done") {
      doneText = turn.text ?? doneText;
      continue;
    }
    if (turn.action === "stuck") continue;
    if (!isStepAction(turn.action)) continue;

    const locatorId = ensureLocator(locators, turn);
    const id = `s${String(n).padStart(2, "0")}`;
    n += 1;
    const risk = turn.risk === "irreversible" || turn.irreversible ? "irreversible" : "safe";
    if (risk === "irreversible") irreversible_steps.push(id);

    const step: Step = {
      id,
      description: turn.thought || `${turn.action} ${turn.name ?? ""}`.trim(),
      action: turn.action,
      risk,
    };
    if (locatorId) step.target = locatorId;
    if (turn.action === "fill") {
      const bound = turn.text ? parameterizeValue(turn.text, args.inputs) : undefined;
      if (bound) step.input_from = bound;
      else if (turn.text) step.value = turn.text;
    } else if (turn.action === "extract") {
      const extractTo = turn.extract_to ?? locatorId ?? "value";
      step.extract_to = extractTo;
      if (!outputs.some((item) => item.name === extractTo)) {
        outputs.push({
          name: extractTo,
          type: /balance/i.test(extractTo) ? "money" : "string",
          description: turn.thought || extractTo,
          required: true,
          example: turn.extracted,
        });
      }
    } else if (turn.text && turn.action !== "click") {
      step.value = turn.text;
    }
    if (turn.action === "press" && turn.key) step.value = turn.key;
    steps.push(step);
  }

  const checkpoint = doneText || "Balance";
  const artifact = {
    schema_version: "1.0" as const,
    id: args.artifactId,
    name: args.name,
    description: args.description || args.goal,
    version: "1.0.0",
    app: {
      vendor_product: "corelink.servicing",
      surface_kind: "legacy_web" as const,
      entry_url: args.entryUrl,
      entry_url_template: canonicalizeUrl(args.entryUrl, args.inputs),
    },
    contract: {
      inputs: Object.entries(args.inputs).map(([name, example]) => ({
        name,
        type: "string" as const,
        description: name,
        required: true,
        example,
      })),
      outputs,
      business_outcomes: ["MEMBER_NOT_FOUND", "PERMISSION_DENIED", "VALIDATION_ERROR"],
    },
    locators,
    steps,
    handlers: DEFAULT_HANDLERS,
    checkpoints: [{ kind: "text_present" as const, text: checkpoint }],
    safety: {
      allowed_origins: args.policy.allowed_origins,
      allowed_actions: args.policy.allowed_actions,
      irreversible_steps,
    },
  };
  return capabilityArtifactSchema.parse(artifact);
}

function isStepAction(action: string): action is Step["action"] {
  return (
    action === "navigate" ||
    action === "click" ||
    action === "fill" ||
    action === "press" ||
    action === "extract" ||
    action === "select" ||
    action === "dismiss" ||
    action === "wait"
  );
}

function ensureLocator(locators: Record<string, NamedLocator>, turn: CompileTurn): string | undefined {
  const strategies = strategiesFromTurn(turn);
  if (strategies.length === 0) return undefined;
  const id =
    (turn.extract_to && slug(turn.extract_to)) ||
    (turn.row_header && turn.column_header && slug(`${turn.row_header}_${turn.column_header}`)) ||
    (turn.name && slug(turn.name)) ||
    slug(turn.action);
  if (id === "notice_ok") return id;
  if (!locators[id]) {
    locators[id] = {
      name: turn.name ?? turn.extract_to ?? id,
      description: turn.thought || id,
      strategies,
    };
  }
  return id;
}

function strategiesFromTurn(turn: CompileTurn): LocatorStrategy[] {
  const strategies: LocatorStrategy[] = [];
  if (turn.row_header && turn.column_header) {
    strategies.push({
      kind: "table_cell",
      row_header: turn.row_header,
      column_header: turn.column_header,
    });
  }
  if (turn.role && turn.name) {
    strategies.push({ kind: "role_name", role: turn.role, name: turn.name });
  }
  if (turn.name) {
    strategies.push({ kind: "accessible_name", name: turn.name });
    if (turn.action !== "fill" && turn.action !== "select") {
      strategies.push({ kind: "text", text: turn.name });
    }
  }
  return strategies;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "control";
}
