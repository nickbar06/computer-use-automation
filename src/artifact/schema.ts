import { z } from "zod";
import type { RunResult, RunStatus } from "../domain/result.ts";

export type { RunResult, RunStatus };

const locatorStrategySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("role_name"), role: z.string(), name: z.string() }),
  z.object({ kind: z.literal("accessible_name"), name: z.string() }),
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({
    kind: z.literal("table_cell"),
    row_header: z.string(),
    column_header: z.string(),
  }),
  z.object({ kind: z.literal("placeholder"), placeholder: z.string() }),
  z.object({ kind: z.literal("css"), css: z.string() }),
]);

export const namedLocatorSchema = z.object({
  name: z.string(),
  description: z.string(),
  strategies: z.array(locatorStrategySchema).min(1),
});

export const conditionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text_present"), text: z.string() }),
  z.object({ kind: z.literal("text_absent"), text: z.string() }),
  z.object({ kind: z.literal("url_matches"), url: z.string() }),
  z.object({ kind: z.literal("locator_visible"), locator: z.string() }),
]);

const stepActionSchema = z.enum([
  "navigate",
  "click",
  "fill",
  "press",
  "extract",
  "select",
  "dismiss",
  "wait",
]);

export const stepSchema = z.object({
  id: z.string(),
  description: z.string(),
  action: stepActionSchema,
  target: z.string().optional(),
  input_from: z.string().optional(),
  value: z.string().optional(),
  extract_to: z.string().optional(),
  risk: z.enum(["safe", "irreversible"]).default("safe"),
  wait: z.number().optional(),
  expected: conditionSchema.optional(),
});

export const handlerSchema = z.object({
  when: conditionSchema,
  outcome: z.enum(["business_outcome", "recoverable", "hard_failure"]),
  code: z.string(),
  recover_step: stepSchema.optional(),
});

const paramSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "money"]),
  description: z.string(),
  required: z.boolean(),
  example: z.string().optional(),
});

const locatorPatchSchema = namedLocatorSchema.partial();

export const tenantOverlaySchema = z.object({
  tenant_id: z.string(),
  vendor_product: z.string(),
  locators: z.record(z.string(), locatorPatchSchema),
});

export const capabilityArtifactSchema = z.object({
  schema_version: z.literal("1.0"),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  app: z.object({
    vendor_product: z.string(),
    surface_kind: z.enum(["web", "legacy_web", "desktop"]),
    entry_url: z.string(),
    entry_url_template: z.string().optional(),
  }),
  contract: z.object({
    inputs: z.array(paramSchema),
    outputs: z.array(paramSchema),
    business_outcomes: z.array(z.string()),
  }),
  locators: z.record(z.string(), namedLocatorSchema),
  steps: z.array(stepSchema).min(1),
  handlers: z.array(handlerSchema),
  checkpoints: z.array(conditionSchema).min(1),
  safety: z.object({
    allowed_origins: z.array(z.string()),
    allowed_actions: z.array(z.string()),
    irreversible_steps: z.array(z.string()),
  }),
  tenant_overlay: tenantOverlaySchema.optional(),
});

export type LocatorStrategy = z.infer<typeof locatorStrategySchema>;
export type NamedLocator = z.infer<typeof namedLocatorSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Handler = z.infer<typeof handlerSchema>;
export type TenantOverlay = z.infer<typeof tenantOverlaySchema>;
export type CapabilityArtifact = z.infer<typeof capabilityArtifactSchema>;

export function applyOverlay(
  artifact: CapabilityArtifact,
  overlay: TenantOverlay,
): CapabilityArtifact {
  if (overlay.vendor_product !== artifact.app.vendor_product) {
    throw new Error(
      `overlay vendor_product ${overlay.vendor_product} does not match ${artifact.app.vendor_product}`,
    );
  }
  const locators: CapabilityArtifact["locators"] = { ...artifact.locators };
  for (const [id, patch] of Object.entries(overlay.locators)) {
    const base = locators[id];
    if (!base) continue;
    locators[id] = {
      name: patch.name ?? base.name,
      description: patch.description ?? base.description,
      strategies: patch.strategies ?? base.strategies,
    };
  }
  return { ...artifact, locators, tenant_overlay: overlay };
}

export function reviewSummary(artifact: CapabilityArtifact): string {
  const inputs = artifact.contract.inputs.map((p) => p.name).join(", ") || "(none)";
  const outputs = artifact.contract.outputs.map((p) => p.name).join(", ") || "(none)";
  const irreversible = artifact.safety.irreversible_steps.join(", ") || "(none)";
  return [
    `id: ${artifact.id}`,
    `vendor_product: ${artifact.app.vendor_product}`,
    `surface_kind: ${artifact.app.surface_kind}`,
    `inputs: ${inputs}`,
    `outputs: ${outputs}`,
    `steps: ${artifact.steps.length}`,
    `irreversible_steps: ${irreversible}`,
  ].join("\n");
}
