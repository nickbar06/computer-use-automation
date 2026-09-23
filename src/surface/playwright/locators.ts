import type { Frame, Locator } from "playwright";
import type { LocatorStrategy, NamedLocator } from "../../artifact/schema.ts";

const SNAPSHOT_MS = 1500;

export class LocatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocatorError";
  }
}

export async function frameHasFrameset(frame: Frame): Promise<boolean> {
  try {
    return await frame.evaluate(() => Boolean(document.querySelector("frameset")));
  } catch {
    return true;
  }
}

export function framesWorkspaceFirst(frames: Frame[]): Frame[] {
  const workspace = frames.filter((frame) => frame.name() === "workspace");
  const rest = frames.filter((frame) => frame.name() !== "workspace");
  return [...workspace, ...rest];
}

export async function resolveNamedLocator(frames: Frame[], locator: NamedLocator): Promise<Locator> {
  const ordered = framesWorkspaceFirst(frames);
  for (const strategy of locator.strategies) {
    for (const frame of ordered) {
      if (await frameHasFrameset(frame)) continue;
      const found = await tryStrategy(frame, strategy);
      if (found) return found;
    }
  }
  throw new LocatorError(`could not resolve locator ${locator.name}`);
}

async function tryStrategy(frame: Frame, strategy: LocatorStrategy): Promise<Locator | null> {
  if (strategy.kind === "table_cell") {
    return resolveTableCell(frame, strategy.row_header, strategy.column_header);
  }

  let candidate: Locator;
  switch (strategy.kind) {
    case "role_name":
      candidate = frame.getByRole(strategy.role as Parameters<Frame["getByRole"]>[0], {
        name: strategy.name,
        exact: true,
      });
      break;
    case "accessible_name":
      candidate = frame.getByLabel(strategy.name, { exact: true });
      break;
    case "text":
      candidate = frame.getByText(strategy.text, { exact: true });
      break;
    case "placeholder":
      candidate = frame.getByPlaceholder(strategy.placeholder, { exact: true });
      break;
    case "css":
      candidate = frame.locator(strategy.css);
      break;
  }

  try {
    if ((await candidate.count()) === 0) return null;
    return candidate.first();
  } catch {
    return null;
  }
}

async function resolveTableCell(
  frame: Frame,
  rowHeader: string,
  columnHeader: string,
): Promise<Locator | null> {
  const tables = frame.locator("table");
  const tableCount = await tables.count();
  for (let t = 0; t < tableCount; t += 1) {
    const rows = tables.nth(t).locator("tr");
    const rowCount = await rows.count();
    const texts: string[][] = [];
    for (let r = 0; r < rowCount; r += 1) {
      const cells = rows.nth(r).locator("td, th");
      const cellCount = await cells.count();
      const row: string[] = [];
      for (let c = 0; c < cellCount; c += 1) {
        row.push((await cells.nth(c).innerText({ timeout: SNAPSHOT_MS })).trim());
      }
      texts.push(row);
    }

    let colIndex: number | undefined;
    for (const row of texts) {
      const first = row[0] ?? "";
      if (first !== rowHeader && row.includes(columnHeader)) {
        colIndex = row.indexOf(columnHeader);
        break;
      }
    }
    if (colIndex === undefined) continue;

    for (let r = 0; r < rowCount; r += 1) {
      const first = texts[r]?.[0] ?? "";
      if (first.includes(rowHeader)) {
        return rows.nth(r).locator("td, th").nth(colIndex);
      }
    }
  }
  return null;
}
