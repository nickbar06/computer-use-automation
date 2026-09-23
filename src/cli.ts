import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { DEFAULT_PORT, ROOT } from "./paths.ts";
import { mainServe } from "./proxy/server.ts";

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
  console.log(`cua — computer-use automation

Commands:
  serve                 start the local CoreLink mock (Task 02)
  discover              LLM observe → decide → act (Task 06)
  replay                run a capability with no model (Task 08)
  operator              resume | status a HITL session (Task 09)

Examples:
  npm run cua -- help
  npm run cua -- serve
  npm run cua -- discover --goal "..." --input member_id=12345
  npm run cua -- replay capabilities/lookup_savings.json --input member_id=12345
  npm run cua -- operator resume --session <id>
`);
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

  if (command === "discover" || command === "replay" || command === "operator") {
    console.error(`${command}: not implemented yet.`);
    return 1;
  }

  console.error(`unknown command: ${command}`);
  printHelp();
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
