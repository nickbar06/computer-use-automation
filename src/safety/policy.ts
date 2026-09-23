import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { ROOT } from "../paths.ts";

export class SafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafetyError";
  }
}

export const policySchema = z.object({
  policy_id: z.string(),
  allowed_origins: z.array(z.string()).min(1),
  allowed_actions: z.array(z.string()).min(1),
  irreversible_name_substrings: z.array(z.string()),
  redaction_profile: z.string(),
});

export type Policy = z.infer<typeof policySchema>;

export function loadPolicy(relPath = "policies/default.json"): Policy {
  return policySchema.parse(JSON.parse(readFileSync(join(ROOT, relPath), "utf8")));
}

export function originOf(location: string): string {
  let url: URL;
  try {
    url = new URL(location);
  } catch {
    throw new SafetyError(`invalid location: ${location}`);
  }
  return `${url.protocol}//${url.host}`;
}

function policyOrDefault(policy?: Policy): Policy {
  return policy ?? loadPolicy();
}

export function checkNavigation(location: string, policy?: Policy): void {
  const origin = originOf(location);
  if (!policyOrDefault(policy).allowed_origins.includes(origin)) {
    throw new SafetyError(`origin not allowed: ${origin}`);
  }
}

export function checkAction(action: string, policy?: Policy): void {
  if (!policyOrDefault(policy).allowed_actions.includes(action)) {
    throw new SafetyError(`action not allowed: ${action}`);
  }
}

export function isIrreversibleName(name: string, policy?: Policy): boolean {
  const haystack = name.toLowerCase();
  return policyOrDefault(policy).irreversible_name_substrings.some((part) =>
    haystack.includes(part.toLowerCase()),
  );
}
