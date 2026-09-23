import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Observation } from "../domain/surface.ts";
import { ROOT } from "../paths.ts";
import { dumpsRedacted } from "../safety/redact.ts";

export type SessionOwner = "agent" | "human";

export type InterventionRequest = {
  capability?: string;
  step_id?: string;
  location?: string;
  observed?: string;
  screenshot_path?: string;
  why: string;
};

export type ControlState = {
  session_id: string;
  owner: SessionOwner;
  reason?: string;
  directory: string;
};

export class SessionControl {
  session_id: string;
  owner: SessionOwner;
  reason?: string;
  directory: string;

  private constructor(state: ControlState) {
    this.session_id = state.session_id;
    this.owner = state.owner;
    this.reason = state.reason;
    this.directory = state.directory;
  }

  static create(root = join(ROOT, "sessions")): SessionControl {
    const session_id = randomUUID().slice(0, 8);
    const directory = join(root, session_id);
    mkdirSync(directory, { recursive: true });
    const session = new SessionControl({ session_id, owner: "agent", directory });
    session.persist();
    return session;
  }

  static load(id: string, root = join(ROOT, "sessions")): SessionControl {
    const directory = join(root, id);
    const file = join(directory, "control.json");
    if (!existsSync(file)) {
      throw new Error(`session not found: ${id}`);
    }
    const raw = JSON.parse(readFileSync(file, "utf8")) as ControlState;
    return new SessionControl({ ...raw, directory });
  }

  requestIntervention(req: InterventionRequest): void {
    this.owner = "human";
    this.reason = req.why;
    dumpsRedacted(join(this.directory, "intervention.json"), `${JSON.stringify(req, null, 2)}\n`);
    writeFileSync(join(this.directory, "OPERATOR.txt"), operatorText(this.session_id, req.why), "utf8");
    this.persist();
  }

  async waitForResume(timeoutMs: number, pollMs = 200): Promise<boolean> {
    const resume = join(this.directory, "RESUME");
    const deadline = Date.now() + Math.max(0, timeoutMs);
    for (;;) {
      if (existsSync(resume)) {
        this.owner = "agent";
        this.persist();
        return true;
      }
      const left = deadline - Date.now();
      if (left <= 0) return false;
      await sleep(Math.min(pollMs, left));
    }
  }

  signalResume(note = ""): void {
    writeFileSync(join(this.directory, "RESUME"), note, "utf8");
  }

  persist(): void {
    mkdirSync(this.directory, { recursive: true });
    writeFileSync(
      join(this.directory, "control.json"),
      JSON.stringify(
        {
          session_id: this.session_id,
          owner: this.owner,
          reason: this.reason,
          directory: this.directory,
        } satisfies ControlState,
        null,
        2,
      ),
      "utf8",
    );
  }
}

export function attachSessionToDriver(driver: object, dir: string): void {
  const maybe = driver as { setTracingDir?: (next: string) => void };
  maybe.setTracingDir?.(dir);
}

export function writeHumanLog(session: SessionControl, observation: Observation): void {
  dumpsRedacted(
    join(session.directory, "human_actions.json"),
    `${JSON.stringify(
      {
        location: observation.location,
        title: observation.title,
        visible_text: observation.visible_text,
        screenshot_path: observation.screenshot_path,
      },
      null,
      2,
    )}\n`,
  );
}

function operatorText(sessionId: string, why: string): string {
  return `HITL session ${sessionId}

Reason: ${why}

Use the already-open window. Do not start a new one.

When finished:
  npm run cua -- operator resume --session ${sessionId}
`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
