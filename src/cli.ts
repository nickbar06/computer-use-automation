import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { DiscoveryRunner } from "./agent/loop.ts";
import {
  applyOverlay,
  capabilityArtifactSchema,
  reviewSummary,
  tenantOverlaySchema,
  type CapabilityArtifact,
} from "./artifact/schema.ts";
import { resolveLlmProvider } from "./llm/resolve.ts";
import { DEFAULT_ORIGIN, DEFAULT_PORT, ROOT } from "./paths.ts";
import { listenMock, mainServe } from "./proxy/server.ts";
import { SessionControl } from "./escalate/control.ts";
import { ReplayExecutor } from "./replay/executor.ts";
import { loadPolicy, originOf } from "./safety/policy.ts";
import { dumpsRedacted, redactText } from "./safety/redact.ts";
import { PlaywrightDriver } from "./surface/playwright/driver.ts";

export const CLI_HELP = `cua: computer-use automation

Commands:
  serve [--port 8765] [--host 127.0.0.1]
  discover --goal "..." --input member_id=12345 [--target URL] [--out path] [--evidence dir] [--headed] [--start-mock]
  replay <artifact.json> --input k=v [--evidence dir] [--headed] [--confirm] [--overlay file] [--operator-timeout 180]
  operator resume --session <id>
  operator status --session <id>

--input is repeatable key=value.
--start-mock is on by default (use --no-start-mock to skip).
--auto-resume is tests/demos only.

Examples:
  npm run cua -- help
  npm run cua -- serve
  npm run cua -- discover --goal "Look up savings balance" --input member_id=12345
  npm run cua -- replay capabilities/lookup_savings.json --input member_id=12345
  npm run cua -- replay capabilities/lookup_savings.json --input member_id=99999
  npm run cua -- replay capabilities/open_subaccount.json --input member_id=12345 --input amount=25.00
  npm run cua -- operator resume --session <id>
  npm test
`;

export function loadReplayArtifact(artifactPath: string, overlayPath?: string): CapabilityArtifact {
  const artifact = capabilityArtifactSchema.parse(
    JSON.parse(readFileSync(resolve(artifactPath), "utf8")),
  );
  if (!overlayPath) return artifact;
  const overlay = tenantOverlaySchema.parse(JSON.parse(readFileSync(resolve(overlayPath), "utf8")));
  return applyOverlay(artifact, overlay);
}

function loadEnv(filePath: string): void {
  if (!existsSync(filePath)) return;
  for (const raw of readFileSync(filePath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function printHelp(): void {
  console.log(CLI_HELP);
}

function parseInputs(items: string[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of items ?? []) {
    const eq = item.indexOf("=");
    if (eq === -1) throw new Error(`invalid --input ${item} (expected key=value)`);
    out[item.slice(0, eq)] = item.slice(eq + 1);
  }
  return out;
}

async function ensureMock(target: string, startMock: boolean): Promise<() => Promise<void>> {
  if (!startMock) return async () => {};
  const origin = originOf(target);
  if (!/127\.0\.0\.1|localhost/.test(origin)) return async () => {};
  try {
    const res = await fetch(`${origin}/health`);
    if (res.ok) return async () => {};
  } catch {
    // start a mock
  }
  const url = new URL(origin);
  const port = url.port ? Number(url.port) : DEFAULT_PORT;
  const { close } = await listenMock(port, url.hostname);
  return close;
}

async function mainDiscover(values: {
  goal?: string;
  input?: string[];
  target?: string;
  out?: string;
  evidence?: string;
  headed?: boolean;
  "no-start-mock"?: boolean;
}): Promise<number> {
  if (!values.goal) {
    console.error("discover requires --goal");
    return 1;
  }
  const target = values.target ?? `${DEFAULT_ORIGIN}/`;
  const evidenceDir = resolve(values.evidence ?? join(ROOT, "evidence", "discovery"));
  const outPath = resolve(values.out ?? join(ROOT, "capabilities", "discovered.json"));
  const policy = loadPolicy();
  const closeMock = await ensureMock(target, !values["no-start-mock"]);
  const driver = new PlaywrightDriver({ headless: !values.headed, policy });
  await driver.start();
  try {
    const result = await new DiscoveryRunner({
      driver,
      llm: resolveLlmProvider(),
      policy,
      goal: values.goal,
      inputs: parseInputs(values.input),
      target,
      evidenceDir,
    }).run();
    console.log(`stop=${result.stop}`);
    console.log(`steps=${result.turns.length}`);
    for (const [key, value] of Object.entries(result.outputs)) {
      console.log(`outputs.${key}=${value}`);
    }
    console.log(`evidence=${evidenceDir}`);
    if (result.artifact) {
      dumpsRedacted(outPath, `${JSON.stringify(result.artifact, null, 2)}\n`);
      console.log(reviewSummary(result.artifact));
      console.log(`artifact=${outPath}`);
    }
    return result.stop === "done" ? 0 : 1;
  } finally {
    await driver.close();
    await closeMock();
  }
}

async function mainReplay(
  artifactPath: string | undefined,
  values: {
    input?: string[];
    evidence?: string;
    headed?: boolean;
    confirm?: boolean;
    overlay?: string;
    "auto-resume"?: boolean;
    "operator-timeout"?: string;
    "no-start-mock"?: boolean;
  },
): Promise<number> {
  if (!artifactPath) {
    console.error("replay requires an artifact path");
    return 1;
  }
  const artifact = loadReplayArtifact(artifactPath, values.overlay);
  const evidenceDir = resolve(values.evidence ?? join(ROOT, "evidence", "replay"));
  const policy = loadPolicy();
  const timeoutSec = values["operator-timeout"] ? Number(values["operator-timeout"]) : 0;
  const closeMock = await ensureMock(artifact.app.entry_url, !values["no-start-mock"]);
  const driver = new PlaywrightDriver({
    headless: !values.headed,
    policy,
  });
  await driver.start();
  try {
    const result = await new ReplayExecutor({
      driver,
      artifact,
      policy,
      confirmIrreversible: Boolean(values.confirm),
      evidenceDir,
      autoResume: Boolean(values["auto-resume"]),
      operatorTimeoutMs: Number.isFinite(timeoutSec) ? timeoutSec * 1000 : 0,
    }).run(parseInputs(values.input));
    console.log(redactText(JSON.stringify(result, null, 2)));
    if (result.status === "needs_intervention" && result.control?.session_id) {
      console.error(
        `HITL: npm run cua -- operator resume --session ${result.control.session_id}`,
      );
    }
    return result.status === "failed" ? 2 : 0;
  } finally {
    await driver.close();
    await closeMock();
  }
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  loadEnv(join(ROOT, ".env"));

  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      port: { type: "string" },
      host: { type: "string" },
      goal: { type: "string" },
      input: { type: "string", multiple: true },
      target: { type: "string" },
      evidence: { type: "string" },
      out: { type: "string" },
      overlay: { type: "string" },
      headed: { type: "boolean" },
      confirm: { type: "boolean" },
      session: { type: "string" },
      "start-mock": { type: "boolean" },
      "auto-resume": { type: "boolean" },
      "operator-timeout": { type: "string" },
      "no-start-mock": { type: "boolean" },
    },
  });

  const command = positionals[0] ?? "help";
  if (values.help || command === "help") {
    printHelp();
    return 0;
  }

  if (command === "serve") {
    const port = values.port ? Number(values.port) : DEFAULT_PORT;
    const host = values.host ?? "127.0.0.1";
    if (!Number.isFinite(port)) {
      console.error("invalid --port");
      return 1;
    }
    await mainServe(port, host);
    return 0;
  }

  try {
    if (command === "discover") {
      return await mainDiscover(values);
    }

    if (command === "replay") {
      return await mainReplay(positionals[1], values);
    }

    if (command === "operator") {
      return mainOperator(positionals[1], values.session);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  console.error(`unknown command: ${command}`);
  printHelp();
  return 1;
}

function mainOperator(sub: string | undefined, sessionId: string | undefined): number {
  if (!sessionId) {
    console.error("operator requires --session <id>");
    return 1;
  }
  const session = SessionControl.load(sessionId);
  if (sub === "status") {
    console.log(
      JSON.stringify(
        {
          session_id: session.session_id,
          owner: session.owner,
          reason: session.reason,
          directory: session.directory,
        },
        null,
        2,
      ),
    );
    return 0;
  }
  if (sub === "resume") {
    session.signalResume();
    console.log(`wrote RESUME for session ${session.session_id}`);
    return 0;
  }
  console.error("operator subcommand must be resume or status");
  return 1;
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return resolve(fileURLToPath(import.meta.url)) === resolve(entry);
}

if (isDirectRun()) {
  main().then((code) => {
    process.exitCode = code;
  });
}
