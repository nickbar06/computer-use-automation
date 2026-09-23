import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { LlmMessage, LlmProvider } from "../domain/llm.ts";
import type { Observation, SurfaceDriver } from "../domain/surface.ts";
import { appendRedactedJsonl, redactText } from "../safety/redact.ts";
import { checkNavigation, isIrreversibleName, type Policy } from "../safety/policy.ts";
import { actionFromLlm, type ActPayload } from "./actionFromLlm.ts";
import { nextAction } from "./nextAction.ts";
import { SYSTEM_PROMPT, userTurn } from "./prompt.ts";

export type DiscoveryTurn = {
  step: number;
  payload: ActPayload;
  irreversible: boolean;
  extracted?: string;
  observation: Observation;
};

export type DiscoveryResult = {
  turns: DiscoveryTurn[];
  stop: "done" | "max_steps" | "timeout";
  outputs: Record<string, string>;
};

export type DiscoveryRunnerOptions = {
  driver: SurfaceDriver;
  llm: LlmProvider;
  policy: Policy;
  goal: string;
  inputs: Record<string, string>;
  target: string;
  evidenceDir: string;
  maxSteps?: number;
  timeoutMs?: number;
};

export class DiscoveryRunner {
  constructor(private readonly options: DiscoveryRunnerOptions) {}

  async run(): Promise<DiscoveryResult> {
    const { driver, llm, policy, goal, inputs, target, evidenceDir } = this.options;
    const maxSteps = this.options.maxSteps ?? 20;
    const deadline = Date.now() + (this.options.timeoutMs ?? 180_000);
    const logPath = join(evidenceDir, "turns.jsonl");
    mkdirSync(evidenceDir, { recursive: true });

    checkNavigation(target, policy);
    await driver.act({ type: "navigate", location: target });

    const messages: LlmMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];
    const turns: DiscoveryTurn[] = [];
    const outputs: Record<string, string> = {};
    let lastExtract: string | undefined;

    for (let step = 1; step <= maxSteps; step += 1) {
      if (Date.now() > deadline) {
        return { turns, stop: "timeout", outputs };
      }

      const shot = join(evidenceDir, `step-${String(step).padStart(2, "0")}.png`);
      const raw = await driver.observe(shot);
      const observation = redactObservation(raw);
      messages.push({
        role: "user",
        content: userTurn({ goal, inputs, step, maxSteps, observation, lastExtract }),
      });

      const payload = bindFill(await nextAction(llm, messages), inputs);
      const irreversible =
        payload.risk === "irreversible" || isIrreversibleName(payload.name ?? "", policy);

      let extracted: string | undefined;
      if (payload.action === "done") {
        const turn = { step, payload, irreversible, observation };
        turns.push(turn);
        appendRedactedJsonl(logPath, jsonlRecord(turn));
        return { turns, stop: "done", outputs };
      }
      if (payload.action === "stuck") {
        appendRedactedJsonl(logPath, {
          step,
          thought: payload.thought,
          action: "stuck",
          reason: payload.reason,
        });
        throw new Error(`discovery stuck: ${payload.reason ?? payload.thought ?? "model declared stuck"}`);
      }

      if (payload.action === "extract") {
        const action = actionFromLlm(payload);
        if (!action.locator) throw new Error("extract requires a locator");
        extracted = await driver.extract(action.locator);
        lastExtract = extracted;
        const key = payload.extract_to ?? "value";
        outputs[key] = extracted;
      } else {
        await driver.act(actionFromLlm(payload));
      }

      const turn = { step, payload, irreversible, extracted, observation };
      turns.push(turn);
      appendRedactedJsonl(logPath, jsonlRecord(turn));
    }

    return { turns, stop: "max_steps", outputs };
  }
}

function bindFill(payload: ActPayload, inputs: Record<string, string>): ActPayload {
  if (payload.action !== "fill") return payload;
  const raw = payload.text ?? "";
  const ref = raw.match(/^\$inputs\.([A-Za-z_][\w]*)$/);
  if (ref && inputs[ref[1]] !== undefined) {
    return { ...payload, text: inputs[ref[1]] };
  }
  if (!raw && inputs.member_id && /member/i.test(payload.name ?? "")) {
    return { ...payload, text: inputs.member_id };
  }
  return payload;
}

function redactObservation(observation: Observation): Observation {
  return {
    ...observation,
    title: redactText(observation.title),
    visible_text: redactText(observation.visible_text),
    a11y_snapshot: redactText(observation.a11y_snapshot),
  };
}

function jsonlRecord(turn: DiscoveryTurn): Record<string, unknown> {
  return {
    step: turn.step,
    thought: turn.payload.thought,
    action: turn.payload.action,
    locator_name: turn.payload.name,
    text: turn.payload.text,
    extract_to: turn.payload.extract_to,
    extracted: turn.extracted,
    irreversible: turn.irreversible,
    location: turn.observation.location,
  };
}
