import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SENSITIVE_JSON_KEYS = new Set([
  "password",
  "token",
  "secret",
  "ssn",
  "name",
  "member_name",
]);

export function redactText(text: string): string {
  return text
    .replace(/(api[_-]?key|token|password|secret)(\s*[:=]\s*)\S+/gi, "$1$2[REDACTED]")
    .replace(/\d{3}-\d{2}-\d{4}/g, "[SSN]")
    .replace(/^(Member name|Name):\s*.+$/gim, "$1: [NAME]")
    .replace(/\d{8,17}/g, "[ACCOUNT]");
}

export function redactJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactJson);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = SENSITIVE_JSON_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redactJson(child);
    }
    return out;
  }
  if (typeof value === "string") {
    return redactText(value);
  }
  return value;
}

export function dumpsRedacted(filePath: string, data: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const body =
    typeof data === "string"
      ? redactText(data)
      : redactText(`${JSON.stringify(redactJson(data), null, 2)}\n`);
  writeFileSync(filePath, body);
}
