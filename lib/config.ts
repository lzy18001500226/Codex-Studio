import path from "node:path";

export const APP_NAME = "Codex Local Agent Lab";

export const DEFAULT_WORKSPACE_ROOT = path.resolve(
  process.cwd(),
  process.env.CODEX_LAB_WORKSPACE_ROOT ?? "./workspace/demo-project"
);

export const DATABASE_PATH = path.resolve(
  process.cwd(),
  process.env.CODEX_LAB_DB_PATH ?? "./data/codex-lab.db"
);

export const DEFAULT_COMMAND_WHITELIST = [
  "node",
  "npm",
  "pnpm",
  "yarn",
  "python",
  "pytest",
  "git",
  "ls",
  "dir",
  "pwd"
];

export const COMMAND_TIMEOUT_MS = 60_000;
export const DEFAULT_APPROVAL_THRESHOLD = 3;
export const DEFAULT_LOG_RETENTION_DAYS = 14;
