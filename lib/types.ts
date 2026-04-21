export type TaskStatus =
  | "pending"
  | "planning"
  | "waiting_approval"
  | "running"
  | "testing"
  | "completed"
  | "failed"
  | "rejected";

export type StepType =
  | "plan"
  | "command"
  | "file_change"
  | "approval"
  | "test"
  | "result";

export type StepStatus = "pending" | "running" | "completed" | "failed" | "waiting";

export type CommandRunStatus = "pending" | "running" | "completed" | "failed" | "stopped";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type TestRunStatus = "pending" | "running" | "passed" | "failed";

export interface Task {
  id: string;
  title: string;
  description: string;
  workspacePath: string;
  status: TaskStatus;
  autoRunTests: boolean;
  approvalEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Session {
  id: string;
  taskId: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStep {
  id: string;
  taskId: string;
  stepType: StepType;
  title: string;
  content: string;
  status: StepStatus;
  createdAt: string;
}

export interface CommandRun {
  id: string;
  taskId: string | null;
  command: string;
  cwd: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  status: CommandRunStatus;
  startedAt: string;
  endedAt: string | null;
}

export interface FileChange {
  id: string;
  taskId: string;
  filePath: string;
  changeType: string;
  beforeContent: string;
  afterContent: string;
  diffText: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  taskId: string;
  actionType: string;
  actionPayload: string;
  status: ApprovalStatus;
  reviewer: string | null;
  comment: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface TestRun {
  id: string;
  taskId: string;
  command: string;
  output: string;
  status: TestRunStatus;
  startedAt: string;
  endedAt: string | null;
}

export interface Settings {
  id: string;
  workspaceRoot: string;
  allowShellExecution: boolean;
  approvalRequired: boolean;
  defaultTestCommand: string;
  commandWhitelist: string[];
  mode: "mock" | "live";
  approvalThreshold: number;
  logRetentionDays: number;
  updatedAt: string;
}

export interface TaskDetail {
  task: Task;
  session: Session | null;
  steps: TaskStep[];
  commandRuns: CommandRun[];
  fileChanges: FileChange[];
  approvals: Approval[];
  testRuns: TestRun[];
}

export interface TaskStats {
  total: number;
  pending: number;
  running: number;
  waitingApproval: number;
  completed: number;
  failed: number;
}

export interface WorkspaceNode {
  name: string;
  path: string;
  type: "file" | "directory";
  hasChildren?: boolean;
  modified?: boolean;
}

export interface WorkspaceFile {
  path: string;
  content: string;
  modified: boolean;
}

export interface GitChangedFile {
  path: string;
  status: string;
}

export interface GitStatusSummary {
  available: boolean;
  branch: string | null;
  changedFiles: GitChangedFile[];
  lastCommit: string | null;
  raw: string;
}

export interface DashboardData {
  settings: Settings;
  recentTasks: Task[];
  pendingApprovals: Approval[];
  stats: TaskStats;
}
