import { getDb } from "@/lib/db";
import type {
  Approval,
  CommandRun,
  FileChange,
  Session,
  Settings,
  Task,
  TaskDetail,
  TaskStats,
  TaskStep,
  TestRun
} from "@/lib/types";
import { safeJsonParse, toBool } from "@/lib/utils";

type RowRecord = Record<string, unknown>;
type MaybeRecord = RowRecord | undefined;

function mapTask(row: MaybeRecord): Task | null {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    workspacePath: String(row.workspace_path),
    status: row.status as Task["status"],
    autoRunTests: toBool(row.auto_run_tests as number),
    approvalEnabled: toBool(row.approval_enabled as number),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    completedAt: row.completed_at ? String(row.completed_at) : null
  };
}

function mapSession(row: MaybeRecord): Session | null {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    taskId: String(row.task_id),
    summary: String(row.summary),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapTaskStep(row: RowRecord): TaskStep {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    stepType: row.step_type as TaskStep["stepType"],
    title: String(row.title),
    content: String(row.content),
    status: row.status as TaskStep["status"],
    createdAt: String(row.created_at)
  };
}

function mapCommandRun(row: RowRecord): CommandRun {
  return {
    id: String(row.id),
    taskId: row.task_id ? String(row.task_id) : null,
    command: String(row.command),
    cwd: String(row.cwd),
    stdout: String(row.stdout),
    stderr: String(row.stderr),
    exitCode: row.exit_code === null || row.exit_code === undefined ? null : Number(row.exit_code),
    status: row.status as CommandRun["status"],
    startedAt: String(row.started_at),
    endedAt: row.ended_at ? String(row.ended_at) : null
  };
}

function mapFileChange(row: RowRecord): FileChange {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    filePath: String(row.file_path),
    changeType: String(row.change_type),
    beforeContent: String(row.before_content),
    afterContent: String(row.after_content),
    diffText: String(row.diff_text),
    createdAt: String(row.created_at)
  };
}

function mapApproval(row: RowRecord): Approval {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    actionType: String(row.action_type),
    actionPayload: String(row.action_payload),
    status: row.status as Approval["status"],
    reviewer: row.reviewer ? String(row.reviewer) : null,
    comment: row.comment ? String(row.comment) : null,
    createdAt: String(row.created_at),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null
  };
}

function mapTestRun(row: RowRecord): TestRun {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    command: String(row.command),
    output: String(row.output),
    status: row.status as TestRun["status"],
    startedAt: String(row.started_at),
    endedAt: row.ended_at ? String(row.ended_at) : null
  };
}

function mapSettings(row: MaybeRecord): Settings {
  return {
    id: String(row?.id ?? "default"),
    workspaceRoot: String(row?.workspace_root ?? ""),
    allowShellExecution: toBool((row?.allow_shell_execution ?? 0) as number),
    approvalRequired: toBool((row?.approval_required ?? 0) as number),
    defaultTestCommand: String(row?.default_test_command ?? ""),
    commandWhitelist: safeJsonParse<string[]>(row?.command_whitelist as string, []),
    mode: (row?.mode ?? "mock") as Settings["mode"],
    approvalThreshold: Number(row?.approval_threshold ?? 3),
    logRetentionDays: Number(row?.log_retention_days ?? 14),
    updatedAt: String(row?.updated_at ?? "")
  };
}

export const codexRepository = {
  getSettings() {
    const row = getDb().prepare("SELECT * FROM settings WHERE id = 'default'").get() as MaybeRecord;
    return mapSettings(row);
  },

  updateSettings(input: Omit<Settings, "updatedAt"> & { updatedAt: string }) {
    getDb()
      .prepare(`
        UPDATE settings
        SET workspace_root = ?,
            allow_shell_execution = ?,
            approval_required = ?,
            default_test_command = ?,
            command_whitelist = ?,
            mode = ?,
            approval_threshold = ?,
            log_retention_days = ?,
            updated_at = ?
        WHERE id = ?
      `)
      .run(
        input.workspaceRoot,
        input.allowShellExecution ? 1 : 0,
        input.approvalRequired ? 1 : 0,
        input.defaultTestCommand,
        JSON.stringify(input.commandWhitelist),
        input.mode,
        input.approvalThreshold,
        input.logRetentionDays,
        input.updatedAt,
        input.id
      );

    return this.getSettings();
  },

  listTasks() {
    const rows = getDb()
      .prepare("SELECT * FROM tasks ORDER BY datetime(created_at) DESC")
      .all() as MaybeRecord[];
    return rows.map(mapTask).filter(Boolean) as Task[];
  },

  getTask(taskId: string) {
    const row = getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as MaybeRecord;
    return mapTask(row);
  },

  createTask(task: Task) {
    getDb()
      .prepare(`
        INSERT INTO tasks (
          id, title, description, workspace_path, status,
          auto_run_tests, approval_enabled, created_at, updated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        task.id,
        task.title,
        task.description,
        task.workspacePath,
        task.status,
        task.autoRunTests ? 1 : 0,
        task.approvalEnabled ? 1 : 0,
        task.createdAt,
        task.updatedAt,
        task.completedAt
      );

    return this.getTask(task.id);
  },

  updateTask(
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description" | "workspacePath" | "status" | "updatedAt" | "completedAt">>
  ) {
    const current = this.getTask(taskId);
    if (!current) {
      return null;
    }

    const nextTask: Task = {
      ...current,
      ...updates
    };

    getDb()
      .prepare(`
        UPDATE tasks
        SET title = ?, description = ?, workspace_path = ?, status = ?, updated_at = ?, completed_at = ?
        WHERE id = ?
      `)
      .run(
        nextTask.title,
        nextTask.description,
        nextTask.workspacePath,
        nextTask.status,
        nextTask.updatedAt,
        nextTask.completedAt,
        taskId
      );

    return this.getTask(taskId);
  },

  deleteTask(taskId: string) {
    getDb().prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
  },

  createSession(session: Session) {
    getDb()
      .prepare("INSERT INTO sessions (id, task_id, summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run(session.id, session.taskId, session.summary, session.createdAt, session.updatedAt);

    return session;
  },

  getSessionByTaskId(taskId: string) {
    const row = getDb()
      .prepare("SELECT * FROM sessions WHERE task_id = ? ORDER BY datetime(created_at) DESC LIMIT 1")
      .get(taskId) as MaybeRecord;
    return mapSession(row);
  },

  updateSessionSummary(taskId: string, summary: string, updatedAt: string) {
    getDb()
      .prepare("UPDATE sessions SET summary = ?, updated_at = ? WHERE task_id = ?")
      .run(summary, updatedAt, taskId);
  },

  listSteps(taskId: string) {
    const rows = getDb()
      .prepare("SELECT * FROM task_steps WHERE task_id = ? ORDER BY datetime(created_at) ASC")
      .all(taskId) as MaybeRecord[];
    return rows.map((row) => mapTaskStep(row as RowRecord));
  },

  addStep(step: TaskStep) {
    getDb()
      .prepare(`
        INSERT INTO task_steps (id, task_id, step_type, title, content, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(step.id, step.taskId, step.stepType, step.title, step.content, step.status, step.createdAt);
    return step;
  },

  listCommandRuns(taskId: string) {
    const rows = getDb()
      .prepare("SELECT * FROM command_runs WHERE task_id = ? ORDER BY datetime(started_at) DESC")
      .all(taskId) as MaybeRecord[];
    return rows.map((row) => mapCommandRun(row as RowRecord));
  },

  getCommandRun(commandRunId: string) {
    const row = getDb().prepare("SELECT * FROM command_runs WHERE id = ?").get(commandRunId) as MaybeRecord;
    return row ? mapCommandRun(row) : null;
  },

  addCommandRun(commandRun: CommandRun) {
    getDb()
      .prepare(`
        INSERT INTO command_runs (id, task_id, command, cwd, stdout, stderr, exit_code, status, started_at, ended_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        commandRun.id,
        commandRun.taskId,
        commandRun.command,
        commandRun.cwd,
        commandRun.stdout,
        commandRun.stderr,
        commandRun.exitCode,
        commandRun.status,
        commandRun.startedAt,
        commandRun.endedAt
      );
    return commandRun;
  },

  updateCommandRun(commandRunId: string, updates: Partial<CommandRun>) {
    const current = this.getCommandRun(commandRunId);
    if (!current) {
      return null;
    }

    const next = { ...current, ...updates };
    getDb()
      .prepare(`
        UPDATE command_runs
        SET stdout = ?, stderr = ?, exit_code = ?, status = ?, ended_at = ?
        WHERE id = ?
      `)
      .run(next.stdout, next.stderr, next.exitCode, next.status, next.endedAt, commandRunId);

    return this.getCommandRun(commandRunId);
  },

  listFileChanges(taskId: string) {
    const rows = getDb()
      .prepare("SELECT * FROM file_changes WHERE task_id = ? ORDER BY datetime(created_at) DESC")
      .all(taskId) as MaybeRecord[];
    return rows.map((row) => mapFileChange(row as RowRecord));
  },

  addFileChange(fileChange: FileChange) {
    getDb()
      .prepare(`
        INSERT INTO file_changes (
          id, task_id, file_path, change_type, before_content, after_content, diff_text, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        fileChange.id,
        fileChange.taskId,
        fileChange.filePath,
        fileChange.changeType,
        fileChange.beforeContent,
        fileChange.afterContent,
        fileChange.diffText,
        fileChange.createdAt
      );
    return fileChange;
  },

  listApprovals(taskId: string) {
    const rows = getDb()
      .prepare("SELECT * FROM approvals WHERE task_id = ? ORDER BY datetime(created_at) DESC")
      .all(taskId) as MaybeRecord[];
    return rows.map((row) => mapApproval(row as RowRecord));
  },

  listPendingApprovals() {
    const rows = getDb()
      .prepare("SELECT * FROM approvals WHERE status = 'pending' ORDER BY datetime(created_at) DESC")
      .all() as MaybeRecord[];
    return rows.map((row) => mapApproval(row as RowRecord));
  },

  getApproval(approvalId: string) {
    const row = getDb().prepare("SELECT * FROM approvals WHERE id = ?").get(approvalId) as MaybeRecord;
    return row ? mapApproval(row) : null;
  },

  addApproval(approval: Approval) {
    getDb()
      .prepare(`
        INSERT INTO approvals (
          id, task_id, action_type, action_payload, status, reviewer, comment, created_at, reviewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        approval.id,
        approval.taskId,
        approval.actionType,
        approval.actionPayload,
        approval.status,
        approval.reviewer,
        approval.comment,
        approval.createdAt,
        approval.reviewedAt
      );
    return approval;
  },

  updateApproval(approvalId: string, updates: Partial<Approval>) {
    const current = this.getApproval(approvalId);
    if (!current) {
      return null;
    }

    const next = { ...current, ...updates };
    getDb()
      .prepare(`
        UPDATE approvals
        SET status = ?, reviewer = ?, comment = ?, reviewed_at = ?
        WHERE id = ?
      `)
      .run(next.status, next.reviewer, next.comment, next.reviewedAt, approvalId);

    return this.getApproval(approvalId);
  },

  listTestRuns(taskId: string) {
    const rows = getDb()
      .prepare("SELECT * FROM test_runs WHERE task_id = ? ORDER BY datetime(started_at) DESC")
      .all(taskId) as MaybeRecord[];
    return rows.map((row) => mapTestRun(row as RowRecord));
  },

  listAllTestRuns() {
    const rows = getDb()
      .prepare("SELECT * FROM test_runs ORDER BY datetime(started_at) DESC")
      .all() as MaybeRecord[];
    return rows.map((row) => mapTestRun(row as RowRecord));
  },

  getTestRun(testRunId: string) {
    const row = getDb().prepare("SELECT * FROM test_runs WHERE id = ?").get(testRunId) as MaybeRecord;
    return row ? mapTestRun(row) : null;
  },

  addTestRun(testRun: TestRun) {
    getDb()
      .prepare(`
        INSERT INTO test_runs (id, task_id, command, output, status, started_at, ended_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(testRun.id, testRun.taskId, testRun.command, testRun.output, testRun.status, testRun.startedAt, testRun.endedAt);
    return testRun;
  },

  updateTestRun(testRunId: string, updates: Partial<TestRun>) {
    const current = this.getTestRun(testRunId);
    if (!current) {
      return null;
    }

    const next = { ...current, ...updates };
    getDb()
      .prepare("UPDATE test_runs SET output = ?, status = ?, ended_at = ? WHERE id = ?")
      .run(next.output, next.status, next.endedAt, testRunId);

    return this.getTestRun(testRunId);
  },

  getTaskDetail(taskId: string): TaskDetail | null {
    const task = this.getTask(taskId);
    if (!task) {
      return null;
    }

    return {
      task,
      session: this.getSessionByTaskId(taskId),
      steps: this.listSteps(taskId),
      commandRuns: this.listCommandRuns(taskId),
      fileChanges: this.listFileChanges(taskId),
      approvals: this.listApprovals(taskId),
      testRuns: this.listTestRuns(taskId)
    };
  },

  getTaskStats(): TaskStats {
    const rows = this.listTasks();
    return {
      total: rows.length,
      pending: rows.filter((task) => task.status === "pending" || task.status === "planning").length,
      running: rows.filter((task) => task.status === "running" || task.status === "testing").length,
      waitingApproval: rows.filter((task) => task.status === "waiting_approval").length,
      completed: rows.filter((task) => task.status === "completed").length,
      failed: rows.filter((task) => task.status === "failed").length
    };
  },

  clearTaskArtifacts(taskId: string) {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE task_id = ?").run(taskId);
    db.prepare("DELETE FROM task_steps WHERE task_id = ?").run(taskId);
    db.prepare("DELETE FROM command_runs WHERE task_id = ?").run(taskId);
    db.prepare("DELETE FROM file_changes WHERE task_id = ?").run(taskId);
    db.prepare("DELETE FROM approvals WHERE task_id = ?").run(taskId);
    db.prepare("DELETE FROM test_runs WHERE task_id = ?").run(taskId);
  }
};
