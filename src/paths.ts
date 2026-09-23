import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_ORIGIN = "http://127.0.0.1:8765";
export const DEFAULT_PORT = 8765;
