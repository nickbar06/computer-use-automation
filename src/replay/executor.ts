import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { bindUrlTemplate } from "../artifact/canonicalize.ts";
import type { CapabilityArtifact, Condition, NamedLocator, Step } from "../artifact/schema.ts";
import type { RunResult } from "../domain/result.ts";
import type { CanonicalAction, Observation, SurfaceDriver } from "../domain/surface.ts";
import { attachSessionToDriver, SessionControl, writeHumanLog } from "../escalate/control.ts";
import { checkAction, checkNavigation, type Policy } from "../safety/policy.ts";
import { appendRedactedJsonl, dumpsRedacted } from "../safety/redact.ts";

/** Same CapabilityArtifact for every surface; pass the adapter that matches `artifact.app.surface_kind`. */
export type ReplayExecutorOptions = {
  driver: SurfaceDriver;
  artifact: CapabilityArtifact;
  policy: Policy;
  confirmIrreversible?: boolean;
  evidenceDir: string;
  session?: SessionControl;
  sessionRoot?: string;
  autoResume?: boolean;
  operatorTimeoutMs?: number;
};

export function bindInputs(
  artifact: CapabilityArtifact,
  provided: Record<string, string>,
): Record<string, string> {
  const bound = { ...provided };
  for (const param of artifact.contract.inputs) {
    if (param.required && (bound[param.name] === undefined || bound[param.name] === "")) {
      throw new Error(`missing required input: ${param.name}`);
    }
  }
  return bound;
}

export function resolveValue(step: Step, inputs: Record<string, string>): string {
  if (step.input_from) {
    if (!step.input_from.startsWith("$inputs.")) {
      throw new Error(`input_from must start with $inputs.: ${step.input_from}`);
    }
    const name = step.input_from.slice("$inputs.".length);
    const value = inputs[name];
    if (value === undefined) throw new Error(`missing input ${name}`);
    return value;
  }
  return step.value ?? "";
}

export class ReplayExecutor {
  private sessionHandle?: SessionControl;

  constructor(private readonly options: ReplayExecutorOptions) {}

  private session(): SessionControl {
    this.sessionHandle ??=
      this.options.session ?? SessionControl.create(this.options.sessionRoot);
    return this.sessionHandle;
  }

  async run(rawInputs: Record<string, string>): Promise<RunResult> {
    const { driver, artifact, policy, evidenceDir } = this.options;
    mkdirSync(evidenceDir, { recursive: true });
    const inputs = bindInputs(artifact, rawInputs);
    const recovered: string[] = [];
    const outputs: Record<string, string> = {};
    const logPath = join(evidenceDir, "steps.jsonl");

    checkNavigation(artifact.app.entry_url, policy);
    let observation = await driver.observe(join(evidenceDir, "start.png"));

    const finish = (result: Pick<RunResult, "status"> & Partial<RunResult>): RunResult => {
      const full: RunResult = { outputs, recovered, evidence_dir: evidenceDir, ...result };
      dumpsRedacted(join(evidenceDir, "result.json"), `${JSON.stringify(full, null, 2)}\n`);
      return full;
    };

    let handled = await this.applyHandlers(observation, recovered, logPath);
    observation = handled.observation;
    if (handled.terminal) return finish(handled.terminal);

    for (const step of artifact.steps) {
      const early = await this.applyHandlers(observation, recovered, logPath);
      observation = early.observation;
      if (early.terminal) return finish(early.terminal);

      if (step.risk === "irreversible" && !this.options.confirmIrreversible) {
        appendRedactedJsonl(logPath, { step_id: step.id, action: step.action, skipped: "needs_intervention" });
        const handoff = await this.handoff(
          `irreversible step ${step.id} requires --confirm or a human`,
          step.id,
        );
        if (handoff.status === "needs_intervention") return finish(handoff);
        observation = handoff.observation ?? observation;
        continue;
      }

      try {
        await this.executeStep(step, inputs, outputs);
        appendRedactedJsonl(logPath, { step_id: step.id, action: step.action });
        observation = await driver.observe(join(evidenceDir, `${step.id}.png`));
      } catch (err) {
        observation = await driver.observe(join(evidenceDir, `${step.id}_failure.png`));
        const afterError = await this.applyHandlers(observation, recovered, logPath);
        observation = afterError.observation;
        if (afterError.terminal) return finish(afterError.terminal);
        return finish({
          status: "failed",
          step_id: step.id,
          expected: step.expected ? conditionLabel(step.expected) : step.description,
          observed: observation.visible_text || String(err),
          outputs,
          recovered,
        });
      }

      if (step.expected && !matchCondition(step.expected, observation)) {
        await driver.observe(join(evidenceDir, `${step.id}_expected.png`));
        return finish({
          status: "failed",
          step_id: step.id,
          expected: conditionLabel(step.expected),
          observed: observation.visible_text,
          outputs,
          recovered,
        });
      }
    }

    const after = await this.applyHandlers(observation, recovered, logPath);
    observation = after.observation;
    if (after.terminal) return finish(after.terminal);

    for (const checkpoint of artifact.checkpoints) {
      if (!matchCondition(checkpoint, observation)) {
        observation = await driver.observe(join(evidenceDir, "checkpoint_stuck.png"));
        const handoff = await this.handoff(`checkpoint failed: ${conditionLabel(checkpoint)}`);
        if (handoff.status === "needs_intervention") return finish(handoff);
        observation = handoff.observation ?? observation;
        if (!matchCondition(checkpoint, observation)) {
          return finish({
            status: "failed",
            expected: conditionLabel(checkpoint),
            observed: observation.visible_text,
            outputs,
            recovered,
            control: handoff.control,
          });
        }
      }
    }

    return finish({ status: "success", outputs, recovered });
  }

  private async handoff(
    why: string,
    step_id?: string,
  ): Promise<Pick<RunResult, "status"> & Partial<RunResult> & { observation?: Observation }> {
    const { driver, artifact, evidenceDir } = this.options;
    const shot = join(evidenceDir, `${step_id ?? "checkpoint"}_stuck.png`);
    const stuck = await driver.observe(shot);
    const session = this.session();
    attachSessionToDriver(driver, session.directory);
    await driver.pauseForHuman();
    session.requestIntervention({
      capability: artifact.id,
      step_id,
      location: stuck.location,
      observed: stuck.visible_text,
      screenshot_path: shot,
      why,
    });
    if (this.options.autoResume) session.signalResume("auto");
    const resumed = await session.waitForResume(this.options.operatorTimeoutMs ?? 0);
    if (!resumed) {
      return {
        status: "needs_intervention",
        step_id,
        observed: stuck.visible_text,
        control: { owner: "human", session_id: session.session_id },
      };
    }
    const after = await driver.resume();
    writeHumanLog(session, after);
    return {
      status: "success",
      observation: after,
      control: { owner: "agent", session_id: session.session_id },
    };
  }

  private async applyHandlers(
    observation: Observation,
    recovered: string[],
    logPath: string,
  ): Promise<{ terminal?: Omit<RunResult, "outputs" | "recovered">; observation: Observation }> {
    const { artifact, driver } = this.options;
    let current = observation;
    for (const handler of artifact.handlers) {
      if (!matchCondition(handler.when, current)) continue;
      if (handler.outcome === "recoverable") {
        if (recovered.includes(handler.code)) continue;
        if (handler.recover_step) {
          await this.executeStep(handler.recover_step, {}, {});
        }
        recovered.push(handler.code);
        appendRedactedJsonl(logPath, { handler: handler.code, outcome: "recoverable" });
        current = await driver.observe();
        continue;
      }
      if (handler.outcome === "business_outcome") {
        return {
          observation: current,
          terminal: { status: "business_outcome", outcome_code: handler.code, observed: current.visible_text },
        };
      }
      return {
        observation: current,
        terminal: { status: "failed", outcome_code: handler.code, observed: current.visible_text || handler.code },
      };
    }
    return { observation: current };
  }

  private async executeStep(
    step: Step,
    inputs: Record<string, string>,
    outputs: Record<string, string>,
  ): Promise<void> {
    const { driver, artifact, policy } = this.options;
    checkAction(step.action, policy);
    const locator = step.target ? requireLocator(artifact, step.target) : undefined;

    if (step.action === "navigate") {
      const location = resolveNavigateUrl(resolveValue(step, inputs), artifact.app.entry_url, inputs);
      checkNavigation(location, policy);
      await driver.act({ type: "navigate", location });
      return;
    }
    if (step.action === "wait") {
      await driver.act({ type: "wait", timeout_ms: step.wait });
      return;
    }
    if (step.action === "extract") {
      if (!locator) throw new Error(`${step.id}: extract requires a target`);
      const value = await driver.extract(locator);
      if (step.extract_to) outputs[step.extract_to] = value;
      return;
    }

    const action: CanonicalAction = { type: step.action, locator };
    if (step.action === "fill" || step.action === "select") action.text = resolveValue(step, inputs);
    if (step.action === "press") action.key = resolveValue(step, inputs) || "Enter";
    await driver.act(action);
  }
}

function requireLocator(artifact: CapabilityArtifact, id: string): NamedLocator {
  const locator = artifact.locators[id];
  if (!locator) throw new Error(`unknown locator: ${id}`);
  return locator;
}

function resolveNavigateUrl(value: string, entryUrl: string, inputs: Record<string, string>): string {
  const bound = bindUrlTemplate(value, inputs);
  if (/^https?:\/\//i.test(bound)) return bound;
  return new URL(bound || "/", entryUrl).href;
}

export function matchCondition(condition: Condition, observation: Observation): boolean {
  if (condition.kind === "text_present") return observation.visible_text.includes(condition.text);
  if (condition.kind === "text_absent") return !observation.visible_text.includes(condition.text);
  if (condition.kind === "url_matches") return observation.location.includes(condition.url);
  return false;
}

function conditionLabel(condition: Condition): string {
  if (condition.kind === "text_present") return `text_present:${condition.text}`;
  if (condition.kind === "text_absent") return `text_absent:${condition.text}`;
  if (condition.kind === "url_matches") return `url_matches:${condition.url}`;
  return `locator_visible:${condition.locator}`;
}
