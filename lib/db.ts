import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import {
  DATABASE_PATH,
  DEFAULT_APPROVAL_THRESHOLD,
  DEFAULT_COMMAND_WHITELIST,
  DEFAULT_LOG_RETENTION_DAYS,
  DEFAULT_WORKSPACE_ROOT
} from "@/lib/config";
import { nowIso } from "@/lib/utils";

let database: DatabaseSync | null = null;

function ensureDirectory(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createTables(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      workspace_path TEXT NOT NULL,
      status TEXT NOT NULL,
      auto_run_tests INTEGER NOT NULL DEFAULT 0,
      approval_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_steps (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      step_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS command_runs (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      command TEXT NOT NULL,
      cwd TEXT NOT NULL,
      stdout TEXT NOT NULL DEFAULT '',
      stderr TEXT NOT NULL DEFAULT '',
      exit_code INTEGER,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS file_changes (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      change_type TEXT NOT NULL,
      before_content TEXT NOT NULL,
      after_content TEXT NOT NULL,
      diff_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_payload TEXT NOT NULL,
      status TEXT NOT NULL,
      reviewer TEXT,
      comment TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_runs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      command TEXT NOT NULL,
      output TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      workspace_root TEXT NOT NULL,
      allow_shell_execution INTEGER NOT NULL DEFAULT 1,
      approval_required INTEGER NOT NULL DEFAULT 1,
      default_test_command TEXT NOT NULL,
      command_whitelist TEXT NOT NULL,
      mode TEXT NOT NULL,
      approval_threshold INTEGER NOT NULL DEFAULT 3,
      log_retention_days INTEGER NOT NULL DEFAULT 14,
      updated_at TEXT NOT NULL
    );
  `);
}

function seedSettings(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM settings").get() as { count: number };

  if (count.count > 0) {
    return;
  }

  const statement = db.prepare(`
    INSERT INTO settings (
      id,
      workspace_root,
      allow_shell_execution,
      approval_required,
      default_test_command,
      command_whitelist,
      mode,
      approval_threshold,
      log_retention_days,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  statement.run(
    "default",
    DEFAULT_WORKSPACE_ROOT,
    1,
    1,
    "node tests/smoke.test.js",
    JSON.stringify(DEFAULT_COMMAND_WHITELIST),
    "mock",
    DEFAULT_APPROVAL_THRESHOLD,
    DEFAULT_LOG_RETENTION_DAYS,
    nowIso()
  );
}

export function getDb() {
  if (!database) {
    ensureDirectory(DATABASE_PATH);
    database = new DatabaseSync(DATABASE_PATH);
    createTables(database);
    seedSettings(database);
  }

  return database;
}
