import { cpSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { main } from "../src/cli.ts";
import { ROOT } from "../src/paths.ts";

async function replay(args: string[]): Promise<number> {
  const code = await main(args);
  console.log(`exit=${code} ${args.join(" ")}`);
  return code;
}

function copyIntervention(evidenceDir: string): void {
  const resultPath = join(evidenceDir, "result.json");
  if (!existsSync(resultPath)) return;
  const result = JSON.parse(readFileSync(resultPath, "utf8")) as {
    control?: { session_id?: string };
  };
  const sessionId = result.control?.session_id;
  if (!sessionId) return;
  const sessionDir = join(ROOT, "sessions", sessionId);
  for (const name of ["intervention.json", "OPERATOR.txt", "control.json"]) {
    const src = join(sessionDir, name);
    if (existsSync(src)) cpSync(src, join(evidenceDir, name));
  }
}

const lookup = join(ROOT, "capabilities", "lookup_savings.json");
const open = join(ROOT, "capabilities", "open_subaccount.json");

const success = await replay([
  "replay",
  lookup,
  "--input",
  "member_id=12345",
  "--evidence",
  join(ROOT, "evidence", "replay_success"),
]);
const notFound = await replay([
  "replay",
  lookup,
  "--input",
  "member_id=99999",
  "--evidence",
  join(ROOT, "evidence", "replay_not_found"),
]);
const escalate = await replay([
  "replay",
  open,
  "--input",
  "member_id=12345",
  "--input",
  "amount=25.00",
  "--evidence",
  join(ROOT, "evidence", "escalate"),
]);
copyIntervention(join(ROOT, "evidence", "escalate"));

if (success !== 0 || notFound !== 0 || escalate !== 0) {
  process.exitCode = 1;
}
